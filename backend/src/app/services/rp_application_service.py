import json
import logging
import re
import uuid as uuid_pkg
from collections.abc import Mapping
from datetime import UTC, datetime
from typing import Any, Literal, Optional, cast

from fastcrud import compute_offset, paginated_response
from ibm_verify_community_sdk.applications.models import ListApplicationsResponse
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from uuid6 import uuid7

from ..core.authorization import (
    PARTNER_ROLE_CODES,
    CanonicalResourceScopeDecisionPoint,
    CanonicalRoleCode,
    Capability,
    ResourceScopeDecision,
    ResourceScopeRequest,
)
from ..core.config import settings
from ..core.exceptions.cache_exceptions import MissingClientError
from ..core.exceptions.http_exceptions import (
    BadRequestException,
    CustomException,
    ForbiddenException,
    NotFoundException,
    RPApplicationAdoptionConflictException,
    RPApplicationDepartmentRequiredException,
)
from ..core.logging_privacy import hash_log_value
from ..core.rp_configuration import build_default_configuration_name
from ..models.application_information import ApplicationInformation
from ..models.audit_log import AuditLog
from ..models.department import Department
from ..models.rp_application import RPApplication
from ..models.workspace import Workspace
from ..repositories.crud_departments import crud_departments
from ..repositories.crud_rp_applications import crud_rp_applications
from ..repositories.crud_workspaces import crud_workspaces
from ..repositories.dependencies import IBMVerifyAdminClientFactory
from ..repositories.ibm_sv_admin import IBMVerifyAdminClient
from ..schemas.authorization_audit import (
    AuthorizationActorType,
    AuthorizationAuditActor,
    AuthorizationAuditResult,
    PrivilegedAccessAuditEvent,
    PrivilegedResourceType,
)
from ..schemas.rp_application import (
    AccessibleRPApplicationDepartmentAssignRequest,
    AccessibleRPApplicationOAuthSetupRead,
    AccessibleRPApplicationRead,
    AccessibleRPApplicationSummaryRead,
    CanadaLoginEnvironment,
    RPApplicationClientCredentialsRead,
    RPApplicationClientRotatedSecretCreateRequest,
    RPApplicationClientRotatedSecretRead,
    RPApplicationClientSecretRotateRequest,
    RPApplicationCreate,
    RPApplicationCreateInternal,
    RPApplicationRead,
    RPApplicationUpdate,
)
from ..schemas.rp_application_adoption import (
    RPApplicationAdoptionAuditEvent,
    RPApplicationAdoptionCandidateListRead,
    RPApplicationAdoptionCandidatePreviewRead,
    RPApplicationAdoptionCandidateRead,
    RPApplicationAdoptionFieldComparisonRead,
    RPApplicationAdoptionFieldName,
    RPApplicationAdoptionFieldStatus,
    RPApplicationAdoptionProviderMetadata,
    RPApplicationWorkspaceAdoptionRead,
    RPApplicationWorkspaceLinkWrite,
)
from ..schemas.workspace import WorkspaceRead
from .audit_service import AuditService
from .authorization_service import (
    AuthorizationService,
    ResolvedPartnerAccess,
    get_resolved_authorization_state,
)
from .rp_application_adoption_metadata_provider import RPApplicationAdoptionMetadataProvider
from .rp_application_summary import (
    build_application_rp_configuration_summary,
    build_rp_application_summary,
)

logger = logging.getLogger(__name__)
APPLICATION_ID_PATTERN = re.compile(r"/applications/([^/?#]+)")
SUMMARY_ACCESS_GRANT_ROLES = PARTNER_ROLE_CODES
CONFIGURATION_EDIT_GRANT_ROLES = frozenset({CanonicalRoleCode.RP_ADMIN, CanonicalRoleCode.RP_USER_EDIT})
SECRET_ACCESS_GRANT_ROLES = CONFIGURATION_EDIT_GRANT_ROLES
ADOPTION_FIELD_NAMES: tuple[RPApplicationAdoptionFieldName, ...] = (
    "displayName",
    "providerApplicationState",
    "applicationUrl",
    "redirectUris",
    "logoutUri",
    "logoutRedirectUris",
    "pkceEnabled",
    "clientType",
    "clientAuthMethod",
)


class RPApplicationService:
    def __init__(self) -> None:
        self._decision_point = CanonicalResourceScopeDecisionPoint()

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

    def _configuration_name(self, value: Any) -> str:
        return (
            self._first_string_value(
                value,
                ("configuration_name", "configurationName", "dnr_app_name", "dnrAppName"),
            )
            or "Unnamed configuration"
        )

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

    def _require_platform_capability(
        self,
        *,
        current_user: dict[str, Any],
        capability: Capability,
    ) -> None:
        decision = self._platform_capability_decision(
            current_user=current_user,
            capability=capability,
        )
        if not decision.allowed:
            raise ForbiddenException("You do not have enough privileges.")

    def _platform_capability_decision(
        self,
        *,
        current_user: dict[str, Any],
        capability: Capability,
    ) -> ResourceScopeDecision:
        state = get_resolved_authorization_state(current_user)
        role_scopes = state.role_scopes if state is not None else ()
        return self._decision_point.decide(
            ResourceScopeRequest(
                role_scopes=role_scopes,
                capability=capability,
            )
        )

    def _safe_adoption_correlation_id(self, correlation_id: str) -> str:
        normalized = correlation_id.strip()
        if len(normalized) <= 128 and re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_.:-]*", normalized) is not None:
            return normalized
        return hash_log_value(correlation_id)

    async def _persist_adoption_authorization_decision(
        self,
        *,
        db: AsyncSession,
        current_user: dict[str, Any],
        decision: ResourceScopeDecision,
        rp_application_uuid: uuid_pkg.UUID,
        workspace_uuid: uuid_pkg.UUID,
        application_information_uuid: uuid_pkg.UUID | None = None,
        configuration_name: str | None = None,
        correlation_id: str,
    ) -> None:
        last_error: Exception | None = None
        for _attempt in range(2):
            try:
                event = PrivilegedAccessAuditEvent(
                    timestamp=datetime.now(UTC),
                    actor=AuthorizationAuditActor(
                        type=AuthorizationActorType.USER,
                        user_uuid=current_user.get("uuid"),
                    ),
                    correlation_id=correlation_id,
                    result=(AuthorizationAuditResult.ALLOWED if decision.allowed else AuthorizationAuditResult.DENIED),
                    role=decision.role,
                    capability=Capability.PARTNER_BOOTSTRAP,
                    resource_type=PrivilegedResourceType.RP_APPLICATION,
                    resource_uuid=rp_application_uuid,
                    workspace_uuid=workspace_uuid,
                    decision_reason=decision.reason,
                    reason_code="rp_adoption_link",
                )
                db.add(
                    AuditLog(
                        user="authorization_actor",
                        user_uuid=current_user.get("uuid"),
                        target="authorization_decision",
                        target_uuid=rp_application_uuid,
                        operation="authorize",
                        description=json.dumps(
                            event.model_dump(mode="json", by_alias=True),
                            separators=(",", ":"),
                        ),
                    )
                )
                await db.commit()
                return
            except Exception as exc:
                last_error = exc
                await db.rollback()

        logger.critical(
            "RP adoption authorization audit unavailable rp_uuid=%s correlation_id=%s",
            hash_log_value(str(rp_application_uuid)),
            correlation_id,
        )
        if decision.allowed:
            raise CustomException(
                status_code=503,
                detail="Authorization audit service is unavailable",
            ) from last_error

    def _add_adoption_outcome_audit(
        self,
        *,
        db: AsyncSession,
        current_user: dict[str, Any],
        rp_application_uuid: uuid_pkg.UUID,
        workspace_uuid: uuid_pkg.UUID,
        correlation_id: str,
        result: Literal["succeeded", "failed"],
        application_information_uuid: uuid_pkg.UUID | None = None,
        configuration_name: str | None = None,
        filled_field_names: list[RPApplicationAdoptionFieldName] | None = None,
        reason_code: str | None = None,
        timestamp: datetime | None = None,
    ) -> None:
        event_timestamp = timestamp or datetime.now(UTC)
        event = RPApplicationAdoptionAuditEvent(
            timestamp=event_timestamp,
            actor_uuid=current_user["uuid"],
            rp_application_uuid=rp_application_uuid,
            workspace_uuid=workspace_uuid,
            application_information_uuid=application_information_uuid,
            configuration_name=configuration_name,
            result=result,
            correlation_id=correlation_id,
            filled_field_names=filled_field_names or [],
            reason_code=reason_code,
        )
        db.add(
            AuditLog(
                user="authorization_actor",
                user_uuid=current_user["uuid"],
                target="rp_application",
                target_uuid=rp_application_uuid,
                operation="workspace_adopt",
                description=json.dumps(
                    event.model_dump(mode="json", by_alias=True),
                    separators=(",", ":"),
                ),
                created_at=event_timestamp,
            )
        )

    def _adoption_failure_reason_code(self, error: Exception) -> str:
        if isinstance(error, RPApplicationAdoptionConflictException):
            return "rp_already_linked"
        if isinstance(error, NotFoundException):
            return "resource_unavailable"
        if isinstance(error, BadRequestException):
            return "invalid_request"
        if isinstance(error, MissingClientError | CustomException):
            return "provider_unavailable"
        return "operation_failed"

    def _adoption_candidate_statement(
        self,
        rp_application_uuid: uuid_pkg.UUID | None = None,
    ):
        statement = select(
            RPApplication.id,
            RPApplication.uuid,
            RPApplication.dnr_app_name,
            RPApplication.configuration_name,
            RPApplication.partner_environment,
            RPApplication.ibm_sv_application_id,
            RPApplication.canada_login_environment,
            RPApplication.status,
            RPApplication.oidc_registration_payload,
            RPApplication.updated_at,
        ).where(
            RPApplication.workspace_id.is_(None),
            RPApplication.is_deleted.is_(False),
            RPApplication.deleted_at.is_(None),
            RPApplication.ibm_sv_application_id.is_not(None),
            func.length(func.trim(RPApplication.ibm_sv_application_id)) > 0,
        )
        if rp_application_uuid is not None:
            return statement.where(RPApplication.uuid == rp_application_uuid)
        return statement.order_by(
            RPApplication.updated_at.desc().nullslast(),
            RPApplication.id.asc(),
        )

    def _adoption_link_target_statement(self, rp_application_uuid: uuid_pkg.UUID):
        return (
            select(
                RPApplication.id,
                RPApplication.uuid,
                RPApplication.workspace_id,
                RPApplication.department_id,
                RPApplication.application_information_id,
                RPApplication.dnr_app_name,
                RPApplication.configuration_name,
                RPApplication.partner_environment,
                RPApplication.canada_login_environment,
                RPApplication.status,
                RPApplication.ibm_sv_application_id,
                RPApplication.oidc_registration_payload,
                RPApplication.updated_at,
            )
            .where(
                RPApplication.uuid == rp_application_uuid,
                RPApplication.is_deleted.is_(False),
                RPApplication.deleted_at.is_(None),
                RPApplication.ibm_sv_application_id.is_not(None),
                func.length(func.trim(RPApplication.ibm_sv_application_id)) > 0,
            )
            .with_for_update()
        )

    def _adoption_local_values(
        self,
        candidate: Mapping[str, Any],
    ) -> dict[RPApplicationAdoptionFieldName, Any]:
        payload = self._as_dict(candidate.get("oidc_registration_payload"))
        return {
            "displayName": self._first_string_value(candidate, ("dnr_app_name",)),
            "providerApplicationState": self._first_string_value(candidate, ("status",)),
            "applicationUrl": self._first_string_value(
                payload,
                (
                    "application_environment_url_en",
                    "applicationEnvironmentUrlEn",
                    "application_url",
                    "applicationUrl",
                ),
            ),
            "redirectUris": self._extract_redirect_uris(payload.get("redirect_uris", payload.get("redirectUris"))),
            "logoutUri": self._first_string_value(payload, ("logout_uri", "logoutUri")),
            "logoutRedirectUris": self._extract_redirect_uris(
                payload.get(
                    "post_logout_redirect_uris",
                    payload.get("postLogoutRedirectUris", payload.get("logoutRedirectUris")),
                )
            ),
            "pkceEnabled": self._extract_bool(payload.get("pkce_supported", payload.get("pkceSupported"))),
            "clientType": self._first_string_value(payload, ("client_type", "clientType")),
            "clientAuthMethod": self._first_string_value(
                payload,
                ("client_auth_method", "clientAuthMethod"),
            ),
        }

    def _adoption_provider_values(
        self,
        metadata: RPApplicationAdoptionProviderMetadata,
    ) -> dict[RPApplicationAdoptionFieldName, Any]:
        provider = metadata.model_dump(mode="json", by_alias=False)
        return {
            "displayName": provider["display_name"],
            "providerApplicationState": provider["application_state"],
            "applicationUrl": provider["application_url"],
            "redirectUris": provider["redirect_uris"],
            "logoutUri": provider["logout_uri"],
            "logoutRedirectUris": provider["logout_redirect_uris"],
            "pkceEnabled": provider["pkce_enabled"],
            "clientType": provider["client_type"],
            "clientAuthMethod": provider["client_auth_method"],
        }

    def _adoption_value_is_missing(self, value: Any) -> bool:
        if value is None:
            return True
        if isinstance(value, str):
            return value.strip() == ""
        if isinstance(value, list):
            return len(value) == 0
        return False

    async def _load_adoption_provider_metadata(
        self,
        *,
        application_id: str,
        metadata_provider: RPApplicationAdoptionMetadataProvider,
    ) -> RPApplicationAdoptionProviderMetadata:
        try:
            provider_result = await metadata_provider.get_registration_metadata(application_id)
            return RPApplicationAdoptionProviderMetadata.model_validate(provider_result)
        except MissingClientError:
            raise
        except Exception as exc:
            logger.warning(
                "RP adoption metadata preview unavailable application_id=%s",
                hash_log_value(application_id),
            )
            raise CustomException(
                status_code=503,
                detail="RP adoption metadata provider is unavailable",
            ) from exc

    def _build_adoption_comparisons(
        self,
        *,
        local_values: Mapping[RPApplicationAdoptionFieldName, Any],
        provider_values: Mapping[RPApplicationAdoptionFieldName, Any],
    ) -> list[RPApplicationAdoptionFieldComparisonRead]:
        comparisons: list[RPApplicationAdoptionFieldComparisonRead] = []
        for field_name in ADOPTION_FIELD_NAMES:
            local_value = local_values[field_name]
            provider_value = provider_values[field_name]
            local_missing = self._adoption_value_is_missing(local_value)
            provider_missing = self._adoption_value_is_missing(provider_value)
            if local_missing and provider_missing:
                status = "missing"
            elif local_missing:
                status = "fillable"
            elif provider_missing or local_value == provider_value:
                status = "preserved"
            else:
                status = "conflict"
            comparisons.append(
                RPApplicationAdoptionFieldComparisonRead(
                    field_name=field_name,
                    status=cast(RPApplicationAdoptionFieldStatus, status),
                    local_value=local_value,
                    provider_value=provider_value,
                )
            )
        return comparisons

    def _apply_adoption_fill_values(
        self,
        *,
        candidate: Mapping[str, Any],
        comparisons: list[RPApplicationAdoptionFieldComparisonRead],
    ) -> dict[str, Any]:
        update_values: dict[str, Any] = {}
        registration_payload = dict(self._as_dict(candidate.get("oidc_registration_payload")))
        payload_field_names = {
            "applicationUrl": "application_environment_url_en",
            "redirectUris": "redirect_uris",
            "logoutUri": "logout_uri",
            "logoutRedirectUris": "post_logout_redirect_uris",
            "pkceEnabled": "pkce_supported",
            "clientType": "client_type",
            "clientAuthMethod": "client_auth_method",
        }
        for comparison in comparisons:
            if comparison.status != "fillable":
                continue
            if comparison.field_name == "displayName":
                update_values["dnr_app_name"] = comparison.provider_value
            elif comparison.field_name == "providerApplicationState":
                update_values["status"] = comparison.provider_value
            else:
                payload_field_name = payload_field_names.get(comparison.field_name)
                if payload_field_name is not None:
                    registration_payload[payload_field_name] = comparison.provider_value
        update_values["oidc_registration_payload"] = registration_payload
        return update_values

    def _build_adoption_candidate_read(
        self,
        candidate: Mapping[str, Any],
    ) -> RPApplicationAdoptionCandidateRead:
        local_values = self._adoption_local_values(candidate)
        missing_field_names = [field_name for field_name in ADOPTION_FIELD_NAMES if self._adoption_value_is_missing(local_values[field_name])]
        return RPApplicationAdoptionCandidateRead(
            rp_application_uuid=candidate["uuid"],
            configuration_name=(
                str(candidate.get("configuration_name") or "").strip()
                or build_default_configuration_name(
                    str(candidate.get("dnr_app_name") or ""),
                    uuid_pkg.UUID(str(candidate["uuid"])),
                )
            ),
            partner_environment=candidate.get("partner_environment"),
            name=str(candidate["dnr_app_name"]),
            ibm_application_id=str(candidate["ibm_sv_application_id"]),
            metadata_completeness=("incomplete" if missing_field_names else "complete"),
            missing_field_names=missing_field_names,
            updated_at=candidate.get("updated_at"),
        )

    async def list_rp_application_adoption_candidates(
        self,
        *,
        db: AsyncSession,
        current_user: dict[str, Any],
    ) -> dict[str, Any]:
        self._require_platform_capability(
            current_user=current_user,
            capability=Capability.PARTNER_BOOTSTRAP,
        )
        result = await db.execute(self._adoption_candidate_statement())
        candidates = [self._build_adoption_candidate_read(self._as_dict(row)) for row in result.mappings().all()]
        return RPApplicationAdoptionCandidateListRead(items=candidates).model_dump(
            mode="json",
            by_alias=True,
        )

    async def preview_rp_application_adoption_candidate(
        self,
        *,
        db: AsyncSession,
        current_user: dict[str, Any],
        rp_application_uuid: uuid_pkg.UUID,
        metadata_provider: RPApplicationAdoptionMetadataProvider,
    ) -> dict[str, Any]:
        self._require_platform_capability(
            current_user=current_user,
            capability=Capability.PARTNER_BOOTSTRAP,
        )
        result = await db.execute(self._adoption_candidate_statement(rp_application_uuid))
        candidate_row = result.mappings().one_or_none()
        if candidate_row is None:
            raise NotFoundException("RP application adoption candidate not found")
        candidate = self._as_dict(candidate_row)
        ibm_application_id = str(candidate["ibm_sv_application_id"])

        provider_metadata = await self._load_adoption_provider_metadata(
            application_id=ibm_application_id,
            metadata_provider=metadata_provider,
        )
        local_values = self._adoption_local_values(candidate)
        provider_values = self._adoption_provider_values(provider_metadata)
        comparisons = self._build_adoption_comparisons(
            local_values=local_values,
            provider_values=provider_values,
        )

        preview = RPApplicationAdoptionCandidatePreviewRead(
            candidate=self._build_adoption_candidate_read(candidate),
            partner_environment=candidate.get("partner_environment"),
            canada_login_environment=candidate.get("canada_login_environment"),
            fields=comparisons,
            fillable_field_names=[field.field_name for field in comparisons if field.status == "fillable"],
            preserved_local_field_names=[field.field_name for field in comparisons if field.status == "preserved"],
            conflicting_field_names=[field.field_name for field in comparisons if field.status == "conflict"],
        )
        return preview.model_dump(mode="json", by_alias=True)

    async def link_rp_application_to_workspace(
        self,
        *,
        db: AsyncSession,
        current_user: dict[str, Any],
        rp_application_uuid: uuid_pkg.UUID,
        payload: RPApplicationWorkspaceLinkWrite,
        metadata_provider: RPApplicationAdoptionMetadataProvider,
        correlation_id: str,
    ) -> dict[str, Any]:
        safe_correlation_id = self._safe_adoption_correlation_id(correlation_id)
        decision = self._platform_capability_decision(
            current_user=current_user,
            capability=Capability.PARTNER_BOOTSTRAP,
        )
        await self._persist_adoption_authorization_decision(
            db=db,
            current_user=current_user,
            decision=decision,
            rp_application_uuid=rp_application_uuid,
            workspace_uuid=payload.workspace_uuid,
            correlation_id=safe_correlation_id,
        )
        if not decision.allowed:
            raise ForbiddenException("You do not have enough privileges.")

        hashed_rp_uuid = hash_log_value(str(rp_application_uuid))
        try:
            rp_result = await db.execute(self._adoption_link_target_statement(rp_application_uuid))
            rp_row = rp_result.mappings().one_or_none()
            if rp_row is None:
                raise NotFoundException("RP application adoption candidate not found")
            candidate = self._as_dict(rp_row)

            workspace_result = await db.execute(
                select(
                    Workspace.id,
                    Workspace.uuid,
                    Workspace.department_id,
                )
                .where(
                    Workspace.uuid == payload.workspace_uuid,
                    Workspace.is_deleted.is_(False),
                    Workspace.deleted_at.is_(None),
                )
                .with_for_update()
            )
            workspace_row = workspace_result.mappings().one_or_none()
            if workspace_row is None:
                raise NotFoundException("Workspace not found")
            workspace = self._as_dict(workspace_row)

            existing_workspace_id = candidate.get("workspace_id")
            if existing_workspace_id is not None and existing_workspace_id != workspace["id"]:
                raise RPApplicationAdoptionConflictException()

            department_result = await db.execute(
                select(Department.uuid).where(
                    Department.id == workspace["department_id"],
                    Department.is_deleted.is_(False),
                    Department.deleted_at.is_(None),
                )
            )
            department_uuid = department_result.scalar_one_or_none()
            if department_uuid is None:
                raise BadRequestException("Selected workspace department is unavailable")

            application_information_id = candidate.get("application_information_id")
            application_information_uuid: uuid_pkg.UUID
            if application_information_id is not None:
                application_information_result = await db.execute(
                    select(ApplicationInformation.id, ApplicationInformation.uuid)
                    .where(
                        ApplicationInformation.id == application_information_id,
                        ApplicationInformation.workspace_id == workspace["id"],
                        ApplicationInformation.is_deleted.is_(False),
                        ApplicationInformation.deleted_at.is_(None),
                    )
                    .with_for_update()
                )
                application_information_row = application_information_result.mappings().one_or_none()
                if application_information_row is None:
                    raise BadRequestException("Existing application information is unavailable for the selected workspace")
                application_information = self._as_dict(application_information_row)
                application_information_uuid = application_information["uuid"]
                if payload.application_information_uuid != application_information_uuid:
                    raise BadRequestException("Existing application information cannot be replaced during adoption")
            else:
                application_information_result = await db.execute(
                    select(ApplicationInformation.id, ApplicationInformation.uuid)
                    .where(
                        ApplicationInformation.uuid == payload.application_information_uuid,
                        ApplicationInformation.workspace_id == workspace["id"],
                        ApplicationInformation.is_deleted.is_(False),
                        ApplicationInformation.deleted_at.is_(None),
                    )
                    .with_for_update()
                )
                application_information_row = application_information_result.mappings().one_or_none()
                if application_information_row is None:
                    raise BadRequestException("Application information is unavailable for the selected workspace")
                application_information = self._as_dict(application_information_row)
                application_information_id = application_information["id"]
                application_information_uuid = application_information["uuid"]

            existing_environment = self._first_string_value(
                candidate,
                ("canada_login_environment",),
            )
            if (
                existing_environment is not None
                and payload.canada_login_environment is not None
                and existing_environment != payload.canada_login_environment
            ):
                raise BadRequestException("Existing CanadaLogin environment cannot be replaced during adoption")
            canada_login_environment = existing_environment or payload.canada_login_environment
            if canada_login_environment is None:
                raise BadRequestException("CanadaLogin environment is required")
            if canada_login_environment not in {"test", "staging", "production"}:
                raise BadRequestException("CanadaLogin environment is invalid")

            if existing_workspace_id == workspace["id"]:
                await db.commit()
                replay = RPApplicationWorkspaceAdoptionRead(
                    rp_application_uuid=candidate["uuid"],
                    workspace_uuid=workspace["uuid"],
                    department_uuid=department_uuid,
                    application_information_uuid=application_information_uuid,
                    ibm_application_id=str(candidate["ibm_sv_application_id"]),
                    configuration_name=(
                        str(candidate.get("configuration_name") or "").strip()
                        or build_default_configuration_name(
                            str(candidate.get("dnr_app_name") or ""),
                            uuid_pkg.UUID(str(candidate["uuid"])),
                        )
                    ),
                    partner_environment=candidate.get("partner_environment"),
                    name=str(candidate["dnr_app_name"]),
                    canada_login_environment=cast(CanadaLoginEnvironment, canada_login_environment),
                    filled_field_names=[],
                    preserved_local_field_names=[],
                    conflicting_field_names=[],
                    idempotent_replay=True,
                )
                return replay.model_dump(mode="json", by_alias=True)

            ibm_application_id = str(candidate["ibm_sv_application_id"])
            provider_metadata = await self._load_adoption_provider_metadata(
                application_id=ibm_application_id,
                metadata_provider=metadata_provider,
            )
            comparisons = self._build_adoption_comparisons(
                local_values=self._adoption_local_values(candidate),
                provider_values=self._adoption_provider_values(provider_metadata),
            )
            update_values = self._apply_adoption_fill_values(
                candidate=candidate,
                comparisons=comparisons,
            )
            now = datetime.now(UTC)
            update_values.update(
                {
                    "workspace_id": workspace["id"],
                    "department_id": workspace["department_id"],
                    "application_information_id": application_information_id,
                    "canada_login_environment": canada_login_environment,
                    "configuration_name": (
                        candidate.get("configuration_name")
                        or build_default_configuration_name(
                            str(candidate.get("dnr_app_name") or ""),
                            uuid_pkg.UUID(str(candidate["uuid"])),
                        )
                    ),
                    "updated_at": now,
                }
            )
            update_result = await db.execute(
                update(RPApplication)
                .where(
                    RPApplication.id == candidate["id"],
                    RPApplication.workspace_id.is_(None),
                    RPApplication.is_deleted.is_(False),
                    RPApplication.deleted_at.is_(None),
                )
                .values(**update_values)
            )
            if getattr(update_result, "rowcount", None) != 1:
                raise RPApplicationAdoptionConflictException()

            filled_field_names = [field.field_name for field in comparisons if field.status == "fillable"]
            preserved_local_field_names = [field.field_name for field in comparisons if field.status == "preserved"]
            conflicting_field_names = [field.field_name for field in comparisons if field.status == "conflict"]
            self._add_adoption_outcome_audit(
                db=db,
                current_user=current_user,
                rp_application_uuid=candidate["uuid"],
                workspace_uuid=workspace["uuid"],
                application_information_uuid=application_information_uuid,
                configuration_name=str(update_values["configuration_name"]),
                correlation_id=safe_correlation_id,
                result="succeeded",
                filled_field_names=filled_field_names,
                timestamp=now,
            )
            await db.commit()

            adopted = RPApplicationWorkspaceAdoptionRead(
                rp_application_uuid=candidate["uuid"],
                workspace_uuid=workspace["uuid"],
                department_uuid=department_uuid,
                application_information_uuid=application_information_uuid,
                ibm_application_id=ibm_application_id,
                configuration_name=str(update_values["configuration_name"]),
                partner_environment=candidate.get("partner_environment"),
                name=str(update_values.get("dnr_app_name", candidate["dnr_app_name"])),
                canada_login_environment=cast(CanadaLoginEnvironment, canada_login_environment),
                filled_field_names=filled_field_names,
                preserved_local_field_names=preserved_local_field_names,
                conflicting_field_names=conflicting_field_names,
            )
            return adopted.model_dump(mode="json", by_alias=True)
        except Exception as error:
            await db.rollback()
            failure_audit_persisted = False
            for _attempt in range(2):
                try:
                    self._add_adoption_outcome_audit(
                        db=db,
                        current_user=current_user,
                        rp_application_uuid=rp_application_uuid,
                        workspace_uuid=payload.workspace_uuid,
                        application_information_uuid=payload.application_information_uuid,
                        correlation_id=safe_correlation_id,
                        result="failed",
                        reason_code=self._adoption_failure_reason_code(error),
                    )
                    await db.commit()
                    failure_audit_persisted = True
                    break
                except Exception:
                    await db.rollback()
            if not failure_audit_persisted:
                logger.critical(
                    "RP adoption failure audit unavailable rp_uuid=%s correlation_id=%s",
                    hashed_rp_uuid,
                    safe_correlation_id,
                )
            logger.warning(
                "RP adoption failed rp_uuid=%s correlation_id=%s",
                hashed_rp_uuid,
                safe_correlation_id,
            )
            raise

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

    def _extract_client_secret_id(self, value: Any) -> str | None:
        value_dict = self._as_dict(value)

        direct_secret_id = self._first_string_value(
            value_dict,
            (
                "clientSecretId",
                "client_secret_id",
                "secretId",
                "secret_id",
                "id",
            ),
        )
        if direct_secret_id is not None:
            return direct_secret_id

        for key in ("clientSecrets", "client_secrets", "secrets", "rotatedSecrets"):
            secrets = value_dict.get(key)
            if not isinstance(secrets, list):
                continue

            for secret_entry in secrets:
                extracted_secret_id = self._first_string_value(
                    secret_entry,
                    (
                        "clientSecretId",
                        "client_secret_id",
                        "secretId",
                        "secret_id",
                        "id",
                    ),
                )
                if extracted_secret_id is not None:
                    return extracted_secret_id

        return None

    def _normalize_epoch_seconds(self, value: Any) -> int | None:
        if value is None:
            return None

        if isinstance(value, bool):
            return int(value)

        if isinstance(value, int):
            return value

        if isinstance(value, float):
            return int(value)

        normalized = str(value).strip()
        if not normalized:
            return None

        try:
            return int(float(normalized))
        except ValueError:
            return None

    def _extract_rotated_secret_entries(self, value: Any) -> list[dict[str, Any]]:
        value_dict = self._as_dict(value)
        rotated_secrets: list[Any] = []

        for key in ("rotatedSecrets", "rotated_secrets"):
            candidate = value_dict.get(key)
            if isinstance(candidate, list):
                rotated_secrets.extend(candidate)

        additional_config = self._as_dict(value_dict.get("additionalConfig"))
        for key in ("rotatedSecrets", "rotated_secrets"):
            candidate = additional_config.get(key)
            if isinstance(candidate, list):
                rotated_secrets.extend(candidate)

        normalized_entries: list[dict[str, Any]] = []
        for index, secret_entry in enumerate(rotated_secrets):
            entry_dict = self._as_dict(secret_entry)
            delete_path = (
                self._first_string_value(
                    entry_dict,
                    ("path", "secretId", "secret_id", "id"),
                )
                or f"/rotatedSecrets/{index}"
            )
            normalized_entries.append(
                RPApplicationClientRotatedSecretRead(
                    description=self._first_string_value(entry_dict, ("description",)),
                    expiredAt=self._normalize_epoch_seconds(entry_dict.get("expiredAt") or entry_dict.get("expired_at")),
                    rotatedAt=self._normalize_epoch_seconds(entry_dict.get("rotatedAt") or entry_dict.get("rotated_at")),
                    value=self._first_string_value(entry_dict, ("value", "secret", "clientSecret")),
                    secretId=self._first_string_value(
                        entry_dict,
                        ("secretId", "secret_id", "id"),
                    )
                    or delete_path,
                ).model_dump(by_alias=True)
            )

        return normalized_entries

    async def _create_audit_log_entry(
        self,
        db: AsyncSession,
        current_user: dict[str, Any],
        rp_application_data: dict[str, Any],
        operation: str,
        description: str,
    ) -> None:
        await AuditService().log_action(
            db=db,
            user=current_user.get("name") or current_user.get("email", ""),
            user_uuid=current_user.get("uuid"),
            target="rp_application",
            target_uuid=rp_application_data.get("uuid"),
            operation=operation,
            description=description,
        )

    async def _read_client_credentials(
        self,
        ibm_admin_client: IBMVerifyAdminClient,
        client_id: str,
    ) -> dict[str, Any]:
        client_secret_response = await ibm_admin_client.get_client_secret(client_id)
        client_secret = self._extract_client_secret(client_secret_response)
        if client_secret is None:
            raise RuntimeError("IBM Verify application detail missing client secret")

        response = RPApplicationClientCredentialsRead(
            client_id=client_id,
            client_secret=client_secret,
            client_secret_id=self._extract_client_secret_id(client_secret_response),
        )
        return response.model_dump(by_alias=True)

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

    def _extract_current_user_id(self, current_user: dict[str, Any]) -> int | None:
        raw_user_id = current_user.get("id")
        if raw_user_id is None or isinstance(raw_user_id, bool):
            return None

        if isinstance(raw_user_id, int):
            return raw_user_id

        normalized = str(raw_user_id).strip()
        if not normalized:
            return None

        try:
            return int(normalized)
        except ValueError:
            return None

    async def _list_granted_workspace_roles(
        self,
        db: AsyncSession,
        current_user: dict[str, Any],
    ) -> dict[int, ResolvedPartnerAccess]:
        state = get_resolved_authorization_state(current_user)
        if state is not None:
            return state.partner_access_by_workspace_id()

        user_id = self._extract_current_user_id(current_user)
        if user_id is None:
            return {}
        return (await AuthorizationService().resolve_for_user(db, user_id=user_id)).partner_access_by_workspace_id()

    async def _resolve_accessible_rp_application_access(
        self,
        db: AsyncSession,
        rp_application_uuid: uuid_pkg.UUID | str,
        current_user: dict[str, Any],
        *,
        allowed_grant_roles: frozenset[CanonicalRoleCode] | None,
        expected_workspace_uuid: uuid_pkg.UUID | str | None = None,
        expected_application_information_uuid: uuid_pkg.UUID | str | None = None,
    ) -> tuple[dict[str, Any], ResolvedPartnerAccess]:
        rp_application = await crud_rp_applications.get(
            db=db,
            uuid=rp_application_uuid,
            is_deleted=False,
            schema_to_select=RPApplicationRead,
        )
        if rp_application is None:
            raise NotFoundException("RP application not found")

        rp_application_data = self._as_dict(rp_application)
        if allowed_grant_roles is None:
            raise NotFoundException("RP application not found")

        workspace_id_raw = rp_application_data.get("workspace_id")
        workspace_id = workspace_id_raw if isinstance(workspace_id_raw, int) else self._extract_current_user_id({"id": workspace_id_raw})
        workspace_access = (
            (
                await self._list_granted_workspace_roles(
                    db=db,
                    current_user=current_user,
                )
            ).get(workspace_id)
            if workspace_id is not None
            else None
        )
        if workspace_access is None or workspace_access.role not in allowed_grant_roles:
            raise NotFoundException("RP application not found")
        if expected_workspace_uuid is not None and str(workspace_access.workspace_uuid) != str(expected_workspace_uuid):
            raise NotFoundException("RP application not found")
        if expected_application_information_uuid is not None:
            application_information_id = rp_application_data.get("application_information_id")
            if not isinstance(application_information_id, int) or workspace_id is None:
                raise NotFoundException("RP application not found")
            application_information_result = await db.execute(
                select(ApplicationInformation.id).where(
                    ApplicationInformation.id == application_information_id,
                    ApplicationInformation.workspace_id == workspace_id,
                    ApplicationInformation.uuid == expected_application_information_uuid,
                    ApplicationInformation.is_deleted.is_(False),
                )
            )
            if application_information_result.scalar_one_or_none() is None:
                raise NotFoundException("RP application not found")

        return rp_application_data, workspace_access

    def _accessible_rp_application_read(
        self,
        application_data: Mapping[str, Any],
        workspace_access: ResolvedPartnerAccess,
        application_information_uuid: uuid_pkg.UUID | None = None,
    ) -> dict[str, Any]:
        """Build the public grant-derived application projection."""

        return AccessibleRPApplicationRead(
            uuid=application_data["uuid"],
            application_information_uuid=application_information_uuid,
            dnr_app_name=application_data["dnr_app_name"],
            configuration_name=application_data.get("configuration_name"),
            partner_environment=application_data.get("partner_environment"),
            workspace_uuid=workspace_access.workspace_uuid,
            role=workspace_access.role,
            ibm_sv_application_id=application_data.get("ibm_sv_application_id"),
            canada_login_environment=application_data.get("canada_login_environment"),
            onboarding_state=application_data.get("onboarding_state"),
            promotion_status=application_data.get("promotion_status"),
        ).model_dump()

    @staticmethod
    async def _load_application_information_parents(
        db: AsyncSession,
        applications: list[dict[str, Any]],
        workspace_ids: tuple[int, ...],
    ) -> dict[int, dict[str, Any]]:
        parent_ids = tuple(
            sorted(
                {
                    parent_id
                    for application in applications
                    if isinstance(
                        (parent_id := application.get("application_information_id")),
                        int,
                    )
                }
            )
        )
        if not parent_ids:
            return {}

        result = await db.execute(
            select(
                ApplicationInformation.id,
                ApplicationInformation.uuid,
                ApplicationInformation.workspace_id,
                ApplicationInformation.service_name_en,
                ApplicationInformation.service_name_fr,
            ).where(
                ApplicationInformation.id.in_(parent_ids),
                ApplicationInformation.workspace_id.in_(workspace_ids),
                ApplicationInformation.is_deleted.is_(False),
            )
        )
        return {int(parent["id"]): dict(parent) for parent in result.mappings().all()}

    async def _resolve_ibm_admin_client(
        self,
        *,
        ibm_admin_client: IBMVerifyAdminClient | None,
        ibm_admin_client_factory: IBMVerifyAdminClientFactory | None,
    ) -> IBMVerifyAdminClient:
        if ibm_admin_client_factory is not None:
            return await ibm_admin_client_factory()
        if ibm_admin_client is not None:
            return ibm_admin_client
        raise RuntimeError("IBM Verify admin client dependency was not provided")

    async def _get_application_detail_context(
        self,
        rp_application_data: dict[str, Any],
        ibm_admin_client: IBMVerifyAdminClient,
    ) -> tuple[dict[str, Any], str]:
        ibm_application_id = self._first_string_value(
            rp_application_data,
            ("ibm_sv_application_id", "ibmSvApplicationId"),
        )
        if ibm_application_id is None:
            raise NotFoundException("IBM Verify application not found for RP application")

        ibm_application_detail = await ibm_admin_client.get_application_detail(ibm_application_id)
        detail_data = self._as_dict(ibm_application_detail)
        providers = self._as_dict(detail_data.get("providers"))
        oidc_provider = self._as_dict(providers.get("oidc"))
        oidc_properties = self._as_dict(oidc_provider.get("properties"))

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

        return detail_data, client_id

    async def create_rp_application(
        self,
        db: AsyncSession,
        rp_application: RPApplicationCreate,
        current_user: Mapping[str, Any],
        created_by: int | None,
    ) -> dict[str, Any]:
        rp_configuration_uuid = uuid7()
        created = await crud_rp_applications.create(
            db=db,
            object=RPApplicationCreateInternal(
                uuid=rp_configuration_uuid,
                department_id=rp_application.department_id,
                dnr_app_name=rp_application.dnr_app_name,
                configuration_name=build_default_configuration_name(
                    rp_application.dnr_app_name,
                    rp_configuration_uuid,
                ),
                ibm_sv_application_id=rp_application.ibm_sv_application_id,
                created_by=created_by,
            ),
            schema_to_select=RPApplicationRead,
        )
        if created is None:
            raise NotFoundException("Failed to create RP application")

        await self._create_audit_log_entry(
            db=db,
            current_user=dict(current_user),
            rp_application_data=created,
            operation="CREATE",
            description=f"Created RP configuration '{self._configuration_name(created)}'",
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

    async def list_accessible_rp_applications(
        self,
        db: AsyncSession,
        current_user: dict[str, Any],
    ) -> list[dict[str, Any]]:
        granted_workspace_roles = await self._list_granted_workspace_roles(
            db=db,
            current_user=current_user,
        )
        if len(granted_workspace_roles) == 0:
            return []

        workspace_ids = tuple(sorted(granted_workspace_roles))
        applications_result = await crud_rp_applications.get_multi(
            db=db,
            limit=None,
            return_total_count=False,
            sort_columns="id",
            sort_orders="asc",
            is_deleted=False,
            workspace_id__in=workspace_ids,
            schema_to_select=RPApplicationRead,
        )
        workspaces_result = await crud_workspaces.get_multi(
            db=db,
            limit=None,
            return_total_count=False,
            is_deleted=False,
            id__in=workspace_ids,
            schema_to_select=WorkspaceRead,
        )
        workspaces_by_id = {
            int(workspace["id"]): workspace for item in workspaces_result.get("data", []) if (workspace := self._as_dict(item)).get("id") is not None
        }

        applications = [self._as_dict(item) for item in applications_result.get("data", [])]
        application_information_by_id = await self._load_application_information_parents(
            db,
            applications,
            workspace_ids,
        )

        summaries: list[dict[str, Any]] = []
        for application in applications:
            raw_workspace_id = application.get("workspace_id", application.get("workspaceId"))
            workspace_id = raw_workspace_id if isinstance(raw_workspace_id, int) else None
            access = granted_workspace_roles.get(workspace_id) if workspace_id is not None else None
            workspace_record = workspaces_by_id.get(workspace_id) if workspace_id is not None else None
            if access is None or workspace_record is None:
                continue
            parent_id = application.get("application_information_id")
            parent_application = application_information_by_id.get(parent_id) if isinstance(parent_id, int) else None
            if isinstance(parent_id, int) and parent_application is None:
                continue
            summaries.append(
                build_application_rp_configuration_summary(
                    application=application,
                    application_information=parent_application,
                    workspace_uuid=access.workspace_uuid,
                    workspace_name=str(workspace_record.get("name") or "").strip(),
                    role=access.role,
                    can_resume_registration=access.role in CONFIGURATION_EDIT_GRANT_ROLES,
                )
                if parent_application is not None
                else build_rp_application_summary(
                    application=application,
                    workspace_uuid=access.workspace_uuid,
                    workspace_name=str(workspace_record.get("name") or "").strip(),
                    role=access.role,
                    can_resume_registration=access.role in CONFIGURATION_EDIT_GRANT_ROLES,
                )
            )
        return summaries

    async def get_accessible_rp_application_by_uuid(
        self,
        db: AsyncSession,
        current_user: dict[str, Any],
        rp_application_uuid: uuid_pkg.UUID | str,
    ) -> dict[str, Any]:
        application_data, workspace_access = await self._resolve_accessible_rp_application_access(
            db=db,
            rp_application_uuid=rp_application_uuid,
            current_user=current_user,
            allowed_grant_roles=SUMMARY_ACCESS_GRANT_ROLES,
        )
        parent_id = application_data.get("application_information_id")
        application_information_by_id = await self._load_application_information_parents(
            db,
            [application_data],
            (workspace_access.workspace_id,),
        )
        parent_application = application_information_by_id.get(parent_id) if isinstance(parent_id, int) else None
        if isinstance(parent_id, int) and parent_application is None:
            raise NotFoundException("RP application not found")
        return self._accessible_rp_application_read(
            application_data,
            workspace_access,
            (uuid_pkg.UUID(str(parent_application["uuid"])) if parent_application is not None else None),
        )

    async def get_accessible_rp_application_department_preflight(
        self,
        db: AsyncSession,
        rp_application_uuid: uuid_pkg.UUID | str,
        current_user: dict[str, Any],
        expected_workspace_uuid: uuid_pkg.UUID | str | None = None,
        expected_application_information_uuid: uuid_pkg.UUID | str | None = None,
    ) -> dict[str, Any]:
        """Project the effective Department inherited from the parent workspace."""
        rp_application_data, _ = await self._resolve_accessible_rp_application_access(
            db=db,
            rp_application_uuid=rp_application_uuid,
            current_user=current_user,
            allowed_grant_roles=SUMMARY_ACCESS_GRANT_ROLES,
            expected_workspace_uuid=expected_workspace_uuid,
            expected_application_information_uuid=expected_application_information_uuid,
        )
        department_id, _ = await self._get_effective_workspace_department(
            db=db,
            rp_application_data=rp_application_data,
        )

        response = AccessibleRPApplicationSummaryRead(
            id=rp_application_data["id"],
            uuid=rp_application_data["uuid"],
            dnr_app_name=rp_application_data["dnr_app_name"],
            department_id=department_id,
            partner_environment=rp_application_data.get("partner_environment"),
        )
        return response.model_dump(by_alias=True)

    async def _get_effective_workspace_department(
        self,
        *,
        db: AsyncSession,
        rp_application_data: Mapping[str, Any],
    ) -> tuple[int, uuid_pkg.UUID]:
        """Resolve active workspace Department context without trusting the RP copy."""
        workspace_id = rp_application_data.get("workspace_id")
        if not isinstance(workspace_id, int):
            raise NotFoundException("RP configuration workspace is unavailable")

        department_result = await db.execute(
            select(Workspace.department_id, Department.uuid)
            .join(Department, Department.id == Workspace.department_id)
            .where(
                Workspace.id == workspace_id,
                Workspace.is_deleted.is_(False),
                Workspace.deleted_at.is_(None),
                Department.is_deleted.is_(False),
                Department.deleted_at.is_(None),
            )
        )
        department = department_result.one_or_none()
        if department is None:
            raise NotFoundException("Workspace department is unavailable")
        return int(department.department_id), department.uuid

    async def assign_accessible_rp_application_department(
        self,
        db: AsyncSession,
        rp_application_uuid: uuid_pkg.UUID | str,
        current_user: dict[str, Any],
        payload: AccessibleRPApplicationDepartmentAssignRequest,
    ) -> dict[str, Any]:
        """Deprecated idempotent adapter for workspace-derived Department context."""
        rp_application_data, _ = await self._resolve_accessible_rp_application_access(
            db=db,
            rp_application_uuid=rp_application_uuid,
            current_user=current_user,
            allowed_grant_roles=CONFIGURATION_EDIT_GRANT_ROLES,
        )

        department_id, department_uuid = await self._get_effective_workspace_department(
            db=db,
            rp_application_data=rp_application_data,
        )
        if str(payload.department_uuid) != str(department_uuid):
            raise CustomException(
                status_code=409,
                detail="RP configuration Department is inherited from its workspace",
            )

        response = AccessibleRPApplicationSummaryRead(
            id=rp_application_data["id"],
            uuid=rp_application_data["uuid"],
            dnr_app_name=rp_application_data["dnr_app_name"],
            department_id=department_id,
        )
        return response.model_dump(by_alias=True)

    async def _require_rp_application_department(
        self,
        rp_application_data: dict[str, Any],
    ) -> None:
        """Raise RPApplicationDepartmentRequiredException if department_id is null."""
        if rp_application_data.get("department_id") is None:
            raise RPApplicationDepartmentRequiredException()

    async def get_accessible_rp_application_oauth_setup(
        self,
        db: AsyncSession,
        rp_application_uuid: uuid_pkg.UUID | str,
        current_user: dict[str, Any],
        ibm_admin_client: IBMVerifyAdminClient | None = None,
        ibm_admin_client_factory: IBMVerifyAdminClientFactory | None = None,
    ) -> dict[str, Any]:
        rp_application_data, _ = await self._resolve_accessible_rp_application_access(
            db=db,
            rp_application_uuid=rp_application_uuid,
            current_user=current_user,
            allowed_grant_roles=SUMMARY_ACCESS_GRANT_ROLES,
        )
        department_id, _ = await self._get_effective_workspace_department(
            db=db,
            rp_application_data=rp_application_data,
        )
        rp_application_data["department_id"] = department_id
        await self._require_rp_application_department(rp_application_data)

        resolved_ibm_admin_client = await self._resolve_ibm_admin_client(
            ibm_admin_client=ibm_admin_client,
            ibm_admin_client_factory=ibm_admin_client_factory,
        )
        detail_data, _ = await self._get_application_detail_context(
            rp_application_data=rp_application_data,
            ibm_admin_client=resolved_ibm_admin_client,
        )

        providers = self._as_dict(detail_data.get("providers"))
        oidc_provider = self._as_dict(providers.get("oidc"))
        oidc_properties = self._as_dict(oidc_provider.get("properties"))
        additional_config = self._as_dict(oidc_properties.get("additionalConfig"))

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

        redirect_uris = self._extract_redirect_uris(oidc_properties.get("redirectUris"))
        logout_redirect_uris: list[str] = []
        for key in ("logoutRedirectURIs", "logoutRedirectUris", "logout_redirect_uris"):
            logout_redirect_uris = self._extract_redirect_uris(additional_config.get(key))
            if logout_redirect_uris:
                break

        logout_uri = self._first_string_value(
            additional_config,
            ("logoutURI", "logoutUri", "logout_uri"),
        )
        pkce_enabled = self._extract_bool(oidc_provider.get("requirePkceVerification"))

        department_name: Optional[str] = None
        department_name_fr: Optional[str] = None
        raw_department_id = rp_application_data.get("department_id")
        if isinstance(raw_department_id, int):
            department = await crud_departments.get(db=db, id=raw_department_id)
            if department:
                dept_data = self._as_dict(department)
                department_name = dept_data.get("name") or None
                department_name_fr = dept_data.get("name_fr") or None

        response = AccessibleRPApplicationOAuthSetupRead(
            rp_application_name=rp_application_data["dnr_app_name"],
            status=status,
            canada_login_environment=rp_application_data.get("canada_login_environment"),
            onboarding_state=rp_application_data.get("onboarding_state"),
            promotion_status=rp_application_data.get("promotion_status"),
            application_url=application_url,
            discovery_endpoint=settings.OIDC_SERVER_METADATA_URL,
            department_name=department_name,
            department_name_fr=department_name_fr,
            pkce_enabled=pkce_enabled,
            redirect_uris=redirect_uris,
            logout_uri=logout_uri,
            logout_redirect_uris=logout_redirect_uris,
        )
        return response.model_dump(by_alias=True)

    async def _get_accessible_secret_context(
        self,
        db: AsyncSession,
        rp_application_uuid: uuid_pkg.UUID | str,
        current_user: dict[str, Any],
        ibm_admin_client: IBMVerifyAdminClient | None,
        ibm_admin_client_factory: IBMVerifyAdminClientFactory | None,
        expected_workspace_uuid: uuid_pkg.UUID | str | None = None,
        expected_application_information_uuid: uuid_pkg.UUID | str | None = None,
    ) -> tuple[dict[str, Any], dict[str, Any], str, IBMVerifyAdminClient]:
        rp_application_data, _ = await self._resolve_accessible_rp_application_access(
            db=db,
            rp_application_uuid=rp_application_uuid,
            current_user=current_user,
            allowed_grant_roles=SECRET_ACCESS_GRANT_ROLES,
            expected_workspace_uuid=expected_workspace_uuid,
            expected_application_information_uuid=expected_application_information_uuid,
        )
        resolved_ibm_admin_client = await self._resolve_ibm_admin_client(
            ibm_admin_client=ibm_admin_client,
            ibm_admin_client_factory=ibm_admin_client_factory,
        )
        detail_data, client_id = await self._get_application_detail_context(
            rp_application_data=rp_application_data,
            ibm_admin_client=resolved_ibm_admin_client,
        )
        return (
            rp_application_data,
            detail_data,
            client_id,
            resolved_ibm_admin_client,
        )

    async def get_accessible_rp_application_client_credentials(
        self,
        db: AsyncSession,
        rp_application_uuid: uuid_pkg.UUID | str,
        current_user: dict[str, Any],
        ibm_admin_client: IBMVerifyAdminClient | None = None,
        ibm_admin_client_factory: IBMVerifyAdminClientFactory | None = None,
        expected_workspace_uuid: uuid_pkg.UUID | str | None = None,
        expected_application_information_uuid: uuid_pkg.UUID | str | None = None,
    ) -> dict[str, Any]:
        rp_application_data, _, client_id, resolved_ibm_admin_client = await self._get_accessible_secret_context(
            db=db,
            rp_application_uuid=rp_application_uuid,
            current_user=current_user,
            ibm_admin_client=ibm_admin_client,
            ibm_admin_client_factory=ibm_admin_client_factory,
            expected_workspace_uuid=expected_workspace_uuid,
            expected_application_information_uuid=expected_application_information_uuid,
        )

        await self._create_audit_log_entry(
            db=db,
            current_user=current_user,
            rp_application_data=rp_application_data,
            operation="REVEAL_SECRET",
            description=(f"Revealed client credentials for RP configuration '{self._configuration_name(rp_application_data)}'"),
        )

        logger.warning(
            "Sensitive credential action=reveal actor_id=%s application_id=%s",
            hash_log_value(current_user.get("uuid", "")),
            hash_log_value(rp_application_data.get("uuid", rp_application_uuid)),
        )

        return await self._read_client_credentials(
            ibm_admin_client=resolved_ibm_admin_client,
            client_id=client_id,
        )

    async def list_accessible_rp_application_rotated_secrets(
        self,
        db: AsyncSession,
        rp_application_uuid: uuid_pkg.UUID | str,
        current_user: dict[str, Any],
        ibm_admin_client: IBMVerifyAdminClient | None = None,
        ibm_admin_client_factory: IBMVerifyAdminClientFactory | None = None,
        expected_workspace_uuid: uuid_pkg.UUID | str | None = None,
        expected_application_information_uuid: uuid_pkg.UUID | str | None = None,
    ) -> list[dict[str, Any]]:
        rp_application_data, _, client_id, resolved_ibm_admin_client = await self._get_accessible_secret_context(
            db=db,
            rp_application_uuid=rp_application_uuid,
            current_user=current_user,
            ibm_admin_client=ibm_admin_client,
            ibm_admin_client_factory=ibm_admin_client_factory,
            expected_workspace_uuid=expected_workspace_uuid,
            expected_application_information_uuid=expected_application_information_uuid,
        )

        client_secret_response = await resolved_ibm_admin_client.get_client_secret(client_id)
        await self._create_audit_log_entry(
            db=db,
            current_user=current_user,
            rp_application_data=rp_application_data,
            operation="VIEW_ROTATED",
            description=(f"Viewed rotated client secrets for RP configuration '{self._configuration_name(rp_application_data)}'"),
        )

        logger.warning(
            "Sensitive credential action=view_rotated actor_id=%s application_id=%s",
            hash_log_value(current_user.get("uuid", "")),
            hash_log_value(rp_application_data.get("uuid", rp_application_uuid)),
        )

        return self._extract_rotated_secret_entries(client_secret_response)

    async def rotate_accessible_rp_application_client_secret(
        self,
        db: AsyncSession,
        rp_application_uuid: uuid_pkg.UUID | str,
        current_user: dict[str, Any],
        payload: RPApplicationClientSecretRotateRequest,
        ibm_admin_client: IBMVerifyAdminClient | None = None,
        ibm_admin_client_factory: IBMVerifyAdminClientFactory | None = None,
        expected_workspace_uuid: uuid_pkg.UUID | str | None = None,
        expected_application_information_uuid: uuid_pkg.UUID | str | None = None,
    ) -> dict[str, Any]:
        rp_application_data, _, client_id, resolved_ibm_admin_client = await self._get_accessible_secret_context(
            db=db,
            rp_application_uuid=rp_application_uuid,
            current_user=current_user,
            ibm_admin_client=ibm_admin_client,
            ibm_admin_client_factory=ibm_admin_client_factory,
            expected_workspace_uuid=expected_workspace_uuid,
            expected_application_information_uuid=expected_application_information_uuid,
        )

        await resolved_ibm_admin_client.update_client_secret(
            client_id,
            payload.model_dump(by_alias=True),
        )
        operation = "ROTATE_SECRET"
        description = f"Rotated client secret for RP configuration '{self._configuration_name(rp_application_data)}'"
        if payload.description.strip() == "" and payload.rotated_secret_expired_at == 0:
            operation = "REGENERATE"
            description = f"Regenerated client secret for RP configuration '{self._configuration_name(rp_application_data)}'"

        await self._create_audit_log_entry(
            db=db,
            current_user=current_user,
            rp_application_data=rp_application_data,
            operation=operation,
            description=description,
        )

        logger.warning(
            "Sensitive credential action=rotate actor_id=%s application_id=%s",
            hash_log_value(current_user.get("uuid", "")),
            hash_log_value(rp_application_data.get("uuid", rp_application_uuid)),
        )

        return await self._read_client_credentials(
            ibm_admin_client=resolved_ibm_admin_client,
            client_id=client_id,
        )

    async def create_accessible_rp_application_rotated_secret(
        self,
        db: AsyncSession,
        rp_application_uuid: uuid_pkg.UUID | str,
        current_user: dict[str, Any],
        payload: RPApplicationClientRotatedSecretCreateRequest,
        ibm_admin_client: IBMVerifyAdminClient | None = None,
        ibm_admin_client_factory: IBMVerifyAdminClientFactory | None = None,
        expected_workspace_uuid: uuid_pkg.UUID | str | None = None,
        expected_application_information_uuid: uuid_pkg.UUID | str | None = None,
    ) -> list[dict[str, Any]]:
        rp_application_data, _, client_id, resolved_ibm_admin_client = await self._get_accessible_secret_context(
            db=db,
            rp_application_uuid=rp_application_uuid,
            current_user=current_user,
            ibm_admin_client=ibm_admin_client,
            ibm_admin_client_factory=ibm_admin_client_factory,
            expected_workspace_uuid=expected_workspace_uuid,
            expected_application_information_uuid=expected_application_information_uuid,
        )

        await resolved_ibm_admin_client.update_client_secret(
            client_id,
            {
                "deleteRotatedSecrets": False,
                "description": payload.description,
                "rotatedSecretExpiredAt": payload.rotated_secret_expired_at,
            },
        )
        await self._create_audit_log_entry(
            db=db,
            current_user=current_user,
            rp_application_data=rp_application_data,
            operation="ROTATE_SECRET",
            description=(f"Created rotated client secret for RP configuration '{self._configuration_name(rp_application_data)}'"),
        )

        logger.warning(
            "Sensitive credential action=create_rotated actor_id=%s application_id=%s",
            hash_log_value(current_user.get("uuid", "")),
            hash_log_value(rp_application_data.get("uuid", rp_application_uuid)),
        )

        client_secret_response = await resolved_ibm_admin_client.get_client_secret(client_id)
        return self._extract_rotated_secret_entries(client_secret_response)

    async def delete_accessible_rp_application_rotated_secret(
        self,
        db: AsyncSession,
        rp_application_uuid: uuid_pkg.UUID | str,
        current_user: dict[str, Any],
        secret_id: str,
        ibm_admin_client: IBMVerifyAdminClient | None = None,
        ibm_admin_client_factory: IBMVerifyAdminClientFactory | None = None,
        expected_workspace_uuid: uuid_pkg.UUID | str | None = None,
        expected_application_information_uuid: uuid_pkg.UUID | str | None = None,
    ) -> bool:
        rp_application_data, _, client_id, resolved_ibm_admin_client = await self._get_accessible_secret_context(
            db=db,
            rp_application_uuid=rp_application_uuid,
            current_user=current_user,
            ibm_admin_client=ibm_admin_client,
            ibm_admin_client_factory=ibm_admin_client_factory,
            expected_workspace_uuid=expected_workspace_uuid,
            expected_application_information_uuid=expected_application_information_uuid,
        )

        client_secret_response = await resolved_ibm_admin_client.get_client_secret(client_id)
        rotated_secrets = self._extract_rotated_secret_entries(client_secret_response)
        selected_secret = next(
            (secret for secret in rotated_secrets if secret.get("secretId") == secret_id),
            None,
        )
        if selected_secret is None:
            raise NotFoundException("Rotated client secret not found")

        deleted = await resolved_ibm_admin_client.delete_rotated_client_secrets(
            client_id,
            [secret_id],
        )
        await self._create_audit_log_entry(
            db=db,
            current_user=current_user,
            rp_application_data=rp_application_data,
            operation="DELETE_ROTATED",
            description=(f"Deleted rotated client secret for RP configuration '{self._configuration_name(rp_application_data)}'"),
        )
        logger.warning(
            "Sensitive credential action=delete_rotated actor_id=%s application_id=%s",
            hash_log_value(current_user.get("uuid", "")),
            hash_log_value(rp_application_data.get("uuid", rp_application_uuid)),
        )

        return deleted

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
                    "Skipping RP application sync item with missing metadata item_id=%s",
                    hash_log_value(application),
                )
                skipped += 1
                continue

            logged_application_id = hash_log_value(application_id)

            existing_application = await crud_rp_applications.get(
                db=db,
                ibm_sv_application_id=application_id,
                is_deleted=False,
                schema_to_select=RPApplicationRead,
            )

            if existing_application is None:
                rp_configuration_uuid = uuid7()
                created_application = await crud_rp_applications.create(
                    db=db,
                    object=RPApplicationCreateInternal(
                        uuid=rp_configuration_uuid,
                        department_id=None,
                        dnr_app_name=application_name,
                        configuration_name=build_default_configuration_name(
                            application_name,
                            rp_configuration_uuid,
                        ),
                        ibm_sv_application_id=application_id,
                        created_by=None,
                    ),
                    schema_to_select=RPApplicationRead,
                )
                if created_application is None:
                    logger.info(
                        "Skipping RP application sync item because its record could not be created application_id=%s",
                        logged_application_id,
                    )
                    skipped += 1
                    continue

                logger.info(
                    "Created RP application from IBM Verify application_id=%s",
                    logged_application_id,
                )
                created += 1
                continue

            logger.info(
                "Skipping existing RP application sync item application_id=%s",
                logged_application_id,
            )
            skipped += 1

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
        await self._create_audit_log_entry(
            db=db,
            current_user=dict(current_user),
            rp_application_data={**existing, "uuid": audit_target_uuid},
            operation="UPDATE",
            description=f"Updated RP configuration '{self._configuration_name(existing)}': {changed_keys}",
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
        await self._create_audit_log_entry(
            db=db,
            current_user=dict(current_user),
            rp_application_data={**existing, "uuid": audit_target_uuid},
            operation="DELETE",
            description=f"Deleted RP configuration '{self._configuration_name(existing)}'",
        )
        return {"message": "RP application deleted"}
