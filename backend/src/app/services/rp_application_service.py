import logging
import re
import uuid as uuid_pkg
from collections.abc import Mapping
from datetime import UTC, datetime
from typing import Any

from fastcrud import compute_offset, paginated_response
from ibm_verify_community_sdk.applications.models import ListApplicationsResponse
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.config import settings
from ..core.exceptions.http_exceptions import ForbiddenException, NotFoundException
from ..repositories.crud_audit_log import crud_audit_log
from ..repositories.crud_rp_applications import crud_rp_applications
from ..repositories.ibm_sv_admin import IBMVerifyAdminClient
from ..schemas.audit_log import AuditLogCreateInternal
from ..schemas.rp_application import (
    RPApplicationCreate,
    RPApplicationCreateInternal,
    RPApplicationCurrentUserOAuthSetupRead,
    RPApplicationCurrentUserRead,
    RPApplicationOwnerRead,
    RPApplicationOwnerSnapshotRead,
    RPApplicationRead,
    RPApplicationUpdate,
)
from .ibm_sv_user_service import IBMVerifyUserService

logger = logging.getLogger(__name__)
APPLICATION_ID_PATTERN = re.compile(r"/applications/([^/?#]+)")


class RPApplicationService:
    def _as_dict(self, value: Any) -> dict[str, Any]:
        if isinstance(value, dict):
            return value
        if hasattr(value, "model_dump"):
            dumped_value = value.model_dump(by_alias=True, exclude_none=True)
            if isinstance(dumped_value, dict):
                return dumped_value
        if isinstance(value, Mapping):
            return dict(value)
        return {}

    def _first_string_value(self, value: Any, keys: tuple[str, ...]) -> str | None:
        value_dict = self._as_dict(value)

        for key in keys:
            candidate = value_dict.get(key)
            if candidate is None:
                continue

            normalized = str(candidate).strip()
            if normalized:
                return normalized

        for key in keys:
            candidate = getattr(value, key, None)
            if candidate is None:
                continue

            normalized = str(candidate).strip()
            if normalized:
                return normalized

        return None

    def _extract_redirect_uris(self, value: Any) -> list[str]:
        if isinstance(value, list):
            return [str(uri).strip() for uri in value if str(uri).strip()]

        if isinstance(value, str):
            return [uri.strip() for uri in value.splitlines() if uri.strip()]

        return []

    def _extract_bool(self, value: Any) -> bool | None:
        if value is None:
            return None

        if isinstance(value, bool):
            return value

        normalized = str(value).strip().lower()
        if normalized in {"true", "1", "yes", "on"}:
            return True
        if normalized in {"false", "0", "no", "off"}:
            return False

        return None

    def _extract_client_secret(self, value: Any) -> str | None:
        value_dict = self._as_dict(value)

        direct_secret = self._first_string_value(
            value_dict,
            (
                "clientSecret",
                "client_secret",
                "secret",
                "value",
            ),
        )
        if direct_secret is not None:
            return direct_secret

        for key in ("clientSecrets", "client_secrets", "secrets", "rotatedSecrets"):
            secrets = value_dict.get(key)
            if not isinstance(secrets, list):
                continue

            for secret_entry in secrets:
                extracted_secret = self._first_string_value(
                    secret_entry,
                    (
                        "clientSecret",
                        "client_secret",
                        "secret",
                        "value",
                    ),
                )
                if extracted_secret is not None:
                    return extracted_secret

        return None

    def _extract_application_id(self, application: Any) -> str | None:
        if isinstance(application, Mapping):
            for key in ("id", "application_id", "applicationId", "applicationid", "applicationRefId", "application_ref_id"):
                value = application.get(key)
                if value is None:
                    continue
                normalized = str(value).strip()
                if normalized:
                    return normalized

            links = application.get("_links")
            if isinstance(links, Mapping):
                self_link = links.get("self") or links.get("self_")
                if isinstance(self_link, Mapping):
                    href = self_link.get("href")
                    if isinstance(href, str):
                        match = APPLICATION_ID_PATTERN.search(href)
                        if match is not None:
                            return match.group(1)

            return None

        for attr in ("id", "application_id", "applicationId", "applicationid", "applicationRefId", "application_ref_id"):
            value = getattr(application, attr, None)
            if value is None:
                continue
            normalized = str(value).strip()
            if normalized:
                return normalized

        links = getattr(application, "links", None)
        self_link = getattr(links, "self_", None) if links is not None else None
        href = getattr(self_link, "href", None) if self_link is not None else None
        if isinstance(href, str):
            match = APPLICATION_ID_PATTERN.search(href)
            if match is not None:
                return match.group(1)

        return None

    def _extract_application_name(self, application: Any) -> str | None:
        if isinstance(application, Mapping):
            for key in ("name", "application_name", "applicationName", "displayName", "display_name"):
                value = application.get(key)
                if value is None:
                    continue
                normalized = str(value).strip()
                if normalized:
                    return normalized
            return None

        for attr in ("name", "application_name", "applicationName", "displayName", "display_name"):
            value = getattr(application, attr, None)
            if value is None:
                continue
            normalized = str(value).strip()
            if normalized:
                return normalized

        return None

    def _extract_owner_email(self, owner: Any) -> str | None:
        if isinstance(owner, dict):
            for key in ("email", "mail", "userName", "username", "displayName", "name", "value"):
                value = owner.get(key)
                if value is None:
                    continue
                normalized = str(value).strip()
                if normalized:
                    return normalized

            return None

        for attr in ("email", "mail", "userName", "username", "displayName", "name", "value"):
            value = getattr(owner, attr, None)
            if value is None:
                continue
            normalized = str(value).strip()
            if normalized:
                return normalized

        normalized = str(owner or "").strip()
        return normalized or None

    def _extract_current_user_email(self, current_user: dict[str, Any]) -> str | None:
        for key in ("email", "mail", "userName", "username"):
            value = current_user.get(key)
            if value is None:
                continue
            normalized = str(value).strip()
            if normalized:
                return normalized
        return None

    def _is_owner_email_match(self, application_owner: Any, current_user_email: str) -> bool:
        owner_snapshot = self._build_application_owner_snapshot(application_owner)
        if owner_snapshot is None:
            return False

        normalized_email = current_user_email.strip().lower()
        return any(owner.email.strip().lower() == normalized_email for owner in owner_snapshot.owners)

    def _build_application_owner_snapshot(self, owners: Any) -> RPApplicationOwnerSnapshotRead | None:
        if owners is None:
            return None

        raw_owners: list[Any]
        if isinstance(owners, dict):
            raw_owners = []
            for key in ("owners", "owner", "applicationOwners", "application_owners"):
                value = owners.get(key)
                if isinstance(value, list):
                    raw_owners.extend(value)
                elif value is not None:
                    raw_owners.append(value)
        elif isinstance(owners, list):
            raw_owners = owners
        else:
            raw_owners = [owners]

        normalized_owners = [RPApplicationOwnerRead(email=email) for email in (self._extract_owner_email(owner) for owner in raw_owners) if email]
        if len(normalized_owners) == 0:
            return None

        return RPApplicationOwnerSnapshotRead(owners=normalized_owners)

    async def create_rp_application(
        self,
        db: AsyncSession,
        rp_application: RPApplicationCreate,
        current_user: Mapping[str, Any],
        created_by: int | None,
    ) -> dict[str, Any]:
        created = await crud_rp_applications.create(
            db=db,
            object=RPApplicationCreateInternal(
                department_id=rp_application.department_id,
                dnr_app_name=rp_application.dnr_app_name,
                ibm_sv_application_id=rp_application.ibm_sv_application_id,
                created_by=created_by,
                application_owner=None,
            ),
            schema_to_select=RPApplicationRead,
        )
        if created is None:
            raise NotFoundException("Failed to create RP application")

        await crud_audit_log.create(
            db=db,
            object=AuditLogCreateInternal(
                user=current_user.get("name", ""),
                user_uuid=current_user["uuid"],
                target="rp_application",
                target_uuid=created["uuid"],
                operation="CREATE",
                description=f"Created RP application '{rp_application.dnr_app_name}'",
            ),
        )
        return created

    async def list_rp_applications(
        self,
        db: AsyncSession,
        page: int,
        items_per_page: int,
    ) -> dict[str, Any]:
        rp_applications = await crud_rp_applications.get_multi(
            db=db,
            offset=compute_offset(page, items_per_page),
            limit=items_per_page,
            is_deleted=False,
            schema_to_select=RPApplicationRead,
        )
        return paginated_response(
            crud_data=rp_applications,
            page=page,
            items_per_page=items_per_page,
        )

    async def list_current_user_rp_applications(
        self,
        db: AsyncSession,
        current_user: dict[str, Any],
        ibm_user_service: IBMVerifyUserService,
    ) -> list[dict[str, Any]]:
        _ = ibm_user_service
        current_user_email = self._extract_current_user_email(current_user)
        if current_user_email is None:
            return []

        local_applications_data = await crud_rp_applications.get_multi(
            db=db,
            is_deleted=False,
            schema_to_select=RPApplicationRead,
        )
        local_applications = (
            local_applications_data.get("data", [])
            if isinstance(local_applications_data, dict)
            else local_applications_data
        )

        matched_applications: list[dict[str, Any]] = []
        for application in local_applications:
            application_data = application if isinstance(application, dict) else dict(application)
            if self._is_owner_email_match(application_data.get("application_owner"), current_user_email):
                matched_applications.append(RPApplicationCurrentUserRead.model_validate(application_data).model_dump())

        return matched_applications

    async def get_current_user_rp_application_by_uuid(
        self,
        db: AsyncSession,
        current_user: dict[str, Any],
        rp_application_uuid: uuid_pkg.UUID | str,
        ibm_user_service: IBMVerifyUserService,
    ) -> dict[str, Any]:
        applications = await self.list_current_user_rp_applications(
            db=db,
            current_user=current_user,
            ibm_user_service=ibm_user_service,
        )

        expected_uuid = str(rp_application_uuid)
        for application in applications:
            if str(application.get("uuid")) == expected_uuid:
                return application

        raise NotFoundException("RP application not found")

    async def get_current_user_rp_application_oauth_setup(
        self,
        db: AsyncSession,
        rp_application_uuid: uuid_pkg.UUID | str,
        current_user: dict[str, Any],
        ibm_admin_client: IBMVerifyAdminClient,
    ) -> dict[str, Any]:
        current_user_email = self._extract_current_user_email(current_user)
        if current_user_email is None:
            raise ForbiddenException("Only RP application owners can view OAuth setup")

        rp_application = await crud_rp_applications.get(
            db=db,
            uuid=rp_application_uuid,
            is_deleted=False,
            schema_to_select=RPApplicationRead,
        )
        if rp_application is None:
            raise NotFoundException("RP application not found")

        rp_application_data = self._as_dict(rp_application)
        if not self._is_owner_email_match(
            rp_application_data.get("application_owner"),
            current_user_email,
        ):
            raise ForbiddenException("Only RP application owners can view OAuth setup")

        ibm_application_id = self._first_string_value(
            rp_application_data,
            ("ibm_sv_application_id", "ibmSvApplicationId"),
        )
        if ibm_application_id is None:
            raise NotFoundException("IBM Verify application not found for RP application")

        ibm_application_detail = await ibm_admin_client.get_application_detail(
            ibm_application_id
        )
        detail_data = self._as_dict(ibm_application_detail)

        providers = self._as_dict(detail_data.get("providers"))
        oidc_provider = self._as_dict(providers.get("oidc"))
        oidc_properties = self._as_dict(oidc_provider.get("properties"))
        additional_config = self._as_dict(oidc_properties.get("additionalConfig"))

        client_id = self._first_string_value(
            oidc_properties,
            ("clientId", "client_id"),
        )
        if client_id is None:
            client_id = self._first_string_value(
                detail_data,
                ("clientId", "client_id"),
            )
        if client_id is None:
            raise RuntimeError("IBM Verify application detail missing client ID")

        client_secret_response = await ibm_admin_client.get_client_secret(client_id)
        client_secret = self._extract_client_secret(client_secret_response)
        if client_secret is None:
            raise RuntimeError("IBM Verify application detail missing client secret")

        application_state = detail_data.get("applicationState")
        if isinstance(application_state, bool):
            status = "active" if application_state else "inactive"
        elif application_state is None:
            status = "unknown"
        else:
            status = str(application_state).strip() or "unknown"

        application_url = self._first_string_value(
            oidc_provider,
            ("applicationUrl", "application_url"),
        )
        if application_url is None:
            application_url = self._first_string_value(
                oidc_properties,
                ("applicationUrl", "application_url"),
            )

        redirect_uris = self._extract_redirect_uris(
            oidc_properties.get("redirectUris")
        )
        logout_redirect_uris: list[str] = []
        for key in ("logoutRedirectURIs", "logoutRedirectUris", "logout_redirect_uris"):
            logout_redirect_uris = self._extract_redirect_uris(
                additional_config.get(key)
            )
            if logout_redirect_uris:
                break

        logout_uri = self._first_string_value(
            additional_config,
            ("logoutURI", "logoutUri", "logout_uri"),
        )
        pkce_enabled = self._extract_bool(
            oidc_provider.get("requirePkceVerification")
        )

        response = RPApplicationCurrentUserOAuthSetupRead(
            rp_application_name=rp_application_data["dnr_app_name"],
            status=status,
            application_url=application_url,
            discovery_endpoint=settings.OIDC_SERVER_METADATA_URL,
            client_id=client_id,
            client_secret=client_secret,
            pkce_enabled=pkce_enabled,
            redirect_uris=redirect_uris,
            logout_uri=logout_uri,
            logout_redirect_uris=logout_redirect_uris,
        )
        return response.model_dump(by_alias=True)

    async def sync_rp_applications_from_ibm_verify(
        self,
        db: AsyncSession,
        ibm_admin_client: IBMVerifyAdminClient,
    ) -> dict[str, int]:
        remote_applications_response: ListApplicationsResponse = await ibm_admin_client.list_applications()
        embedded = remote_applications_response.embedded
        remote_applications = embedded.applications if embedded is not None and embedded.applications is not None else []

        created = 0
        updated = 0
        skipped = 0

        for application in remote_applications:
            application_id = self._extract_application_id(application)
            application_name = self._extract_application_name(application)
            if application_id is None or application_name is None:
                logger.info(
                    "Skipping RP application sync item because it is missing an id or name: %s",
                    application,
                )
                skipped += 1
                continue

            application_detail = await ibm_admin_client.get_application_detail(application_id)
            application_owner = self._build_application_owner_snapshot(getattr(application_detail, "owners", None))
            if application_owner is None:
                application_owner = self._build_application_owner_snapshot(getattr(application, "owners", None))
            existing_application = await crud_rp_applications.get(
                db=db,
                ibm_sv_application_id=application_id,
                is_deleted=False,
                schema_to_select=RPApplicationRead,
            )

            if existing_application is None:
                created_application = await crud_rp_applications.create(
                    db=db,
                    object=RPApplicationCreateInternal(
                        department_id=None,
                        dnr_app_name=application_name,
                        ibm_sv_application_id=application_id,
                        created_by=None,
                        application_owner=application_owner,
                    ),
                    schema_to_select=RPApplicationRead,
                )
                if created_application is None:
                    logger.info(
                        "Skipping RP application sync item because the missing record could not be created: %s",
                        application_name,
                    )
                    skipped += 1
                    continue

                logger.info(
                    "Created RP application from IBM Verify: %s",
                    application_name,
                )
                created += 1
                continue

            existing_application_data = (
                existing_application if isinstance(existing_application, dict) else dict(existing_application)
            )
            if (
                existing_application_data.get("dnr_app_name") == application_name
                and existing_application_data.get("application_owner") == (
                    application_owner.model_dump(by_alias=True) if application_owner is not None else None
                )
            ):
                logger.info(
                    "Skipping RP application sync item because it is already up to date: %s",
                    application_name,
                )
                skipped += 1
                continue

            await crud_rp_applications.update(
                db=db,
                object={
                    "dnr_app_name": application_name,
                    "application_owner": application_owner.model_dump(by_alias=True) if application_owner is not None else None,
                    "updated_at": datetime.now(UTC),
                },
                uuid=existing_application_data["uuid"],
            )
            logger.info(
                "Updated RP application from IBM Verify: %s",
                application_name,
            )
            updated += 1

        return {
            "created": created,
            "updated": updated,
            "skipped": skipped,
            "processed": created + updated + skipped,
        }

    async def get_rp_application_by_uuid(
        self,
        db: AsyncSession,
        rp_application_uuid: uuid_pkg.UUID | str,
    ) -> dict[str, Any]:
        rp_application = await crud_rp_applications.get(
            db=db,
            uuid=rp_application_uuid,
            is_deleted=False,
            schema_to_select=RPApplicationRead,
        )
        if rp_application is None:
            raise NotFoundException("RP application not found")
        return rp_application

    async def update_rp_application(
        self,
        db: AsyncSession,
        rp_application_uuid: uuid_pkg.UUID | str,
        values: RPApplicationUpdate,
        current_user: Mapping[str, Any],
    ) -> dict[str, str]:
        existing = await self.get_rp_application_by_uuid(db=db, rp_application_uuid=rp_application_uuid)

        updated_fields = values.model_dump(exclude_unset=True)
        if len(updated_fields) == 0:
            return {"message": "No changes submitted"}

        update_payload = {
            **updated_fields,
            "updated_at": datetime.now(UTC),
        }
        await crud_rp_applications.update(
            db=db,
            object=update_payload,
            uuid=rp_application_uuid,
        )

        changed_keys = ", ".join(updated_fields.keys())
        audit_target_uuid = uuid_pkg.UUID(str(rp_application_uuid)) if isinstance(rp_application_uuid, str) else rp_application_uuid
        await crud_audit_log.create(
            db=db,
            object=AuditLogCreateInternal(
                user=current_user.get("name", ""),
                user_uuid=current_user["uuid"],
                target="rp_application",
                target_uuid=audit_target_uuid,
                operation="UPDATE",
                description=f"Updated RP application '{existing.get('dnr_app_name', '')}': {changed_keys}",
            ),
        )
        return {"message": "RP application updated"}

    async def delete_rp_application(
        self,
        db: AsyncSession,
        rp_application_uuid: uuid_pkg.UUID | str,
        current_user: Mapping[str, Any],
    ) -> dict[str, str]:
        existing = await self.get_rp_application_by_uuid(db=db, rp_application_uuid=rp_application_uuid)
        await crud_rp_applications.delete(db=db, uuid=rp_application_uuid)

        audit_target_uuid = uuid_pkg.UUID(str(rp_application_uuid)) if isinstance(rp_application_uuid, str) else rp_application_uuid
        await crud_audit_log.create(
            db=db,
            object=AuditLogCreateInternal(
                user=current_user.get("name", ""),
                user_uuid=current_user["uuid"],
                target="rp_application",
                target_uuid=audit_target_uuid,
                operation="DELETE",
                description=f"Deleted RP application '{existing.get('dnr_app_name', '')}'",
            ),
        )
        return {"message": "RP application deleted"}
