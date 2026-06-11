import logging
import uuid as uuid_pkg
from datetime import UTC, datetime
from typing import Any

from fastcrud import compute_offset, paginated_response
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.exceptions.http_exceptions import NotFoundException
from ..repositories.crud_rp_applications import crud_rp_applications
from ..repositories.ibm_sv_admin import IBMVerifyAdminClient
from ..schemas.rp_application import (
    RPApplicationCreate,
    RPApplicationCreateInternal,
    RPApplicationCurrentUserRead,
    RPApplicationOwnerRead,
    RPApplicationOwnerSnapshotRead,
    RPApplicationRead,
    RPApplicationUpdate,
)
from .ibm_sv_user_service import IBMVerifyUserService

logger = logging.getLogger(__name__)


class RPApplicationService:
    def _extract_application_id(self, application: dict[str, Any]) -> str | None:
        for key in ("id", "application_id", "applicationId", "applicationid"):
            value = application.get(key)
            if value is None:
                continue
            normalized = str(value).strip()
            if normalized:
                return normalized
        return None

    def _extract_application_name(self, application: dict[str, Any]) -> str | None:
        for key in ("name", "application_name", "applicationName", "displayName"):
            value = application.get(key)
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

    async def sync_rp_applications_from_ibm_verify(
        self,
        db: AsyncSession,
        ibm_admin_client: IBMVerifyAdminClient,
    ) -> dict[str, int]:
        remote_applications = await ibm_admin_client.list_applications()

        created = 0
        updated = 0
        skipped = 0

        for application in remote_applications:
            if not isinstance(application, dict):
                logger.info("Skipping RP application sync item because payload is not a mapping: %r", application)
                skipped += 1
                continue

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

            application_owner = self._build_application_owner_snapshot(application_detail)
            if application_owner is None:
                application_owner = self._build_application_owner_snapshot(application.get("owners"))
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
    ) -> dict[str, str]:
        await self.get_rp_application_by_uuid(db=db, rp_application_uuid=rp_application_uuid)

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
        return {"message": "RP application updated"}

    async def delete_rp_application(
        self,
        db: AsyncSession,
        rp_application_uuid: uuid_pkg.UUID | str,
    ) -> dict[str, str]:
        await self.get_rp_application_by_uuid(db=db, rp_application_uuid=rp_application_uuid)
        await crud_rp_applications.delete(db=db, uuid=rp_application_uuid)
        return {"message": "RP application deleted"}
