import json
import logging
import uuid as uuid_pkg
from datetime import UTC, datetime
from typing import Any, cast

from pydantic import ValidationError
from sqlalchemy import and_, func, select
from sqlalchemy.exc import IntegrityError, NoResultFound
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.authorization import (
    CanonicalResourceScopeDecisionPoint,
    CanonicalRoleCode,
    Capability,
    ResourceScopeDecision,
    ResourceScopeDecisionReason,
    ResourceScopeRequest,
)
from ..core.exceptions.http_exceptions import (
    BadRequestException,
    CustomException,
    DuplicateValueException,
    ForbiddenException,
    NotFoundException,
    RegistrationDraftConflictException,
)
from ..core.logging_privacy import hash_log_value
from ..core.rp_configuration_copy_policy import (
    RP_CONFIGURATION_COPY_POLICY_VERSION,
    copy_reusable_rp_configuration_answers,
)
from ..core.utils.slugify import slugify
from ..models.application_information import ApplicationInformation
from ..models.application_information_contact import ApplicationInformationContact
from ..models.audit_log import AuditLog
from ..models.rp_application import RPApplication
from ..models.user import User
from ..repositories.crud_application_information import crud_application_information
from ..repositories.crud_application_information_contacts import crud_application_information_contacts
from ..repositories.crud_departments import crud_departments
from ..repositories.crud_rp_application_promotion_requests import crud_rp_application_promotion_requests
from ..repositories.crud_rp_applications import crud_rp_applications
from ..repositories.crud_users import crud_users
from ..repositories.crud_workspaces import crud_workspaces
from ..schemas.application_information import (
    ApplicationInformationChecklistItemRead,
    ApplicationInformationChecklistRead,
    ApplicationInformationContactCreate,
    ApplicationInformationContactCreateInternal,
    ApplicationInformationContactRead,
    ApplicationInformationContactRecordRead,
    ApplicationInformationContactUpdate,
    ApplicationInformationContactUpdateInternal,
    ApplicationInformationCreate,
    ApplicationInformationCreateInternal,
    ApplicationInformationRead,
    ApplicationInformationUpdate,
)
from ..schemas.rp_application import (
    ApplicationRPConfigurationCopyCreate,
    ApplicationRPConfigurationCopyRead,
    ApplicationRPConfigurationPartnerEnvironmentRead,
    ApplicationRPConfigurationPartnerEnvironmentUpdate,
    ApplicationRPConfigurationProgressionCreate,
    ApplicationRPConfigurationProgressionRead,
    ApplicationRPConfigurationRead,
    ApplicationRPConfigurationRegistrationDraftCreate,
    CanadaLoginEnvironment,
    RegistrationDataStep,
    RPApplicationCreateInternal,
    RPApplicationRead,
    WorkspaceRPApplicationConfigurationRead,
    WorkspaceRPApplicationRegistrationAnswers,
    WorkspaceRPApplicationRegistrationBase,
    WorkspaceRPApplicationRegistrationCompletionRead,
    WorkspaceRPApplicationRegistrationCompletionRequest,
    WorkspaceRPApplicationRegistrationCreate,
    WorkspaceRPApplicationRegistrationDraftCreate,
    WorkspaceRPApplicationRegistrationDraftPatch,
    WorkspaceRPApplicationRegistrationDraftRead,
)
from ..schemas.rp_application_promotion_request import (
    ApplicationRPConfigurationPromotionRequestRead,
    PromotionRequestStatus,
    PromotionRequestTargetEnvironment,
    PromotionRequestUpsert,
    PromotionReviewUpdate,
    RPApplicationPromotionRequestCreateInternal,
    RPApplicationPromotionRequestRead,
)
from ..schemas.workspace import (
    WorkspaceCreate,
    WorkspaceCreateInternal,
    WorkspaceRead,
    WorkspaceUpdate,
)
from .authorization_service import get_resolved_authorization_state
from .ibm_sv_admin_service import IBMVerifyAdminService
from .rp_application_summary import (
    build_application_rp_configuration_summary,
    build_rp_application_summary,
)

LINKED_RP_APPLICATIONS_DELETE_BLOCK_MESSAGE = "Retained RP configurations must be resolved before deleting the Application"
RP_APPLICATION_USAGE_UNAVAILABLE_MESSAGE = "RP application is not linked to an IBM Security Verify application"
PROMOTION_REQUEST_TARGET_ENVIRONMENT: PromotionRequestTargetEnvironment = "production"
PROMOTION_REQUEST_PENDING_STATUS: PromotionRequestStatus = "pending"
REGISTRATION_DATA_STEPS = (
    "basics",
    "endpoints",
    "client-and-access",
    "signing",
    "encryption",
)
REGISTRATION_UPDATE_RETURN_COLUMNS = [
    "uuid",
    "dnr_app_name",
    "configuration_name",
    "partner_environment",
    "oidc_registration_payload",
    "registration_draft_version",
    "registration_last_completed_step",
    "registration_completed_at",
]
REGISTRATION_STEP_REQUIRED_FIELDS: dict[str, tuple[str, ...]] = {
    "basics": (
        "canada_login_environment",
        "service_name_en",
        "service_name_fr",
    ),
    "endpoints": (
        "application_environment_url_en",
        "application_environment_url_fr",
        "redirect_uris",
        "logout_mode",
        "logout_uri",
    ),
    "client-and-access": (
        "client_type",
        "supports_authorization_code_flow",
        "client_auth_method",
        "requested_scopes",
        "sector_identifier",
        "shares_pairwise_identifiers",
        "pkce_supported",
    ),
    "signing": (
        "request_signing_supported",
        "signature_validation_supported",
    ),
    "encryption": (
        "request_encryption_supported",
        "message_decryption_supported",
    ),
}
logger = logging.getLogger(__name__)


class WorkspaceService:
    def __init__(self) -> None:
        self._decision_point = CanonicalResourceScopeDecisionPoint()

    async def list_workspaces(
        self,
        db: AsyncSession,
        current_user: dict[str, Any],
    ) -> list[dict[str, Any]]:
        self._require_platform_capability(
            current_user=current_user,
            capability=Capability.CROSS_WORKSPACE_METADATA_READ,
        )
        workspaces_data = await crud_workspaces.get_multi(
            db=db,
            is_deleted=False,
            schema_to_select=WorkspaceRead,
        )
        return workspaces_data.get("data", [])

    async def list_current_user_workspaces(
        self,
        db: AsyncSession,
        current_user: dict[str, Any],
    ) -> list[dict[str, Any]]:
        state = get_resolved_authorization_state(current_user)
        if state is None:
            return []
        if state.is_cl_admin:
            return await self.list_workspaces(db=db, current_user=current_user)

        workspaces: list[dict[str, Any]] = []
        seen_workspace_ids: set[int] = set()
        for access in state.partner_access:
            if access.workspace_id in seen_workspace_ids:
                continue

            workspace = await crud_workspaces.get(
                db=db,
                id=access.workspace_id,
                uuid=access.workspace_uuid,
                is_deleted=False,
                schema_to_select=WorkspaceRead,
            )
            if workspace is None:
                continue

            seen_workspace_ids.add(access.workspace_id)
            workspaces.append(workspace)

        return workspaces

    async def get_workspace_by_uuid(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        current_user: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        if current_user is None:
            raise NotFoundException("Workspace not found")
        state = get_resolved_authorization_state(current_user)
        capability = Capability.CROSS_WORKSPACE_METADATA_READ if state is not None and state.is_cl_admin else Capability.WORKSPACE_METADATA_READ
        workspace, _ = await self._require_workspace_capability(
            db=db,
            workspace_uuid=workspace_uuid,
            current_user=current_user,
            capability=capability,
        )
        return workspace

    async def create_workspace(
        self,
        db: AsyncSession,
        workspace: WorkspaceCreate,
        current_user: dict[str, Any],
    ) -> dict[str, Any]:
        self._require_platform_capability(
            current_user=current_user,
            capability=Capability.PARTNER_BOOTSTRAP,
        )
        department_id = await self._resolve_department_id(
            db=db,
            department_uuid=workspace.department_uuid,
        )
        slug = self._normalize_slug(workspace.slug, workspace.name)
        await self._ensure_slug_available(db=db, slug=slug)

        created_workspace = await crud_workspaces.create(
            db=db,
            object=WorkspaceCreateInternal(
                name=workspace.name,
                slug=slug,
                description=workspace.description,
                department_id=department_id,
                created_by=current_user.get("id"),
            ),
            schema_to_select=WorkspaceRead,
        )
        if created_workspace is None:
            raise NotFoundException("Failed to create workspace")

        return created_workspace

    async def update_workspace(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        values: WorkspaceUpdate,
        current_user: dict[str, Any],
    ) -> dict[str, Any]:
        existing_workspace, _ = await self._require_workspace_capability(
            db=db,
            workspace_uuid=workspace_uuid,
            current_user=current_user,
            capability=Capability.WORKSPACE_METADATA_WRITE,
        )

        update_data = values.model_dump(exclude_unset=True)
        if not update_data:
            return existing_workspace

        department_uuid = update_data.pop("department_uuid", None)
        if department_uuid is not None:
            update_data["department_id"] = await self._resolve_department_id(
                db=db,
                department_uuid=department_uuid,
            )

        if "slug" in update_data:
            slug_source = update_data.get("slug") or update_data.get("name") or existing_workspace["name"]
            update_data["slug"] = self._normalize_slug(update_data.get("slug"), slug_source)
            await self._ensure_slug_available(
                db=db,
                slug=update_data["slug"],
                current_workspace_uuid=workspace_uuid,
            )

        await crud_workspaces.update(db=db, object=update_data, uuid=workspace_uuid)
        return await self._get_workspace_record(db=db, workspace_uuid=workspace_uuid)

    async def delete_workspace(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        current_user: dict[str, Any],
    ) -> dict[str, str]:
        await self._require_workspace_capability(
            db=db,
            workspace_uuid=workspace_uuid,
            current_user=current_user,
            capability=Capability.WORKSPACE_METADATA_WRITE,
        )
        await crud_workspaces.delete(db=db, uuid=workspace_uuid)
        return {"message": "Workspace deleted"}

    async def list_workspace_application_information(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        current_user: dict[str, Any],
    ) -> list[dict[str, Any]]:
        workspace, _ = await self._require_workspace_capability(
            db=db,
            workspace_uuid=workspace_uuid,
            current_user=current_user,
            capability=self._metadata_read_capability(
                current_user=current_user,
                partner_capability=Capability.APPLICATION_INFORMATION_READ,
            ),
        )
        records = await crud_application_information.get_multi(
            db=db,
            workspace_id=workspace["id"],
            is_deleted=False,
            schema_to_select=ApplicationInformationRead,
        )
        return records.get("data", [])

    async def create_workspace_application_information(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        payload: ApplicationInformationCreate,
        current_user: dict[str, Any],
    ) -> dict[str, Any]:
        workspace, _ = await self._require_workspace_capability(
            db=db,
            workspace_uuid=workspace_uuid,
            current_user=current_user,
            capability=Capability.APPLICATION_INFORMATION_WRITE,
        )
        created = await crud_application_information.create(
            db=db,
            object=ApplicationInformationCreateInternal(
                workspace_id=workspace["id"],
                created_by=current_user.get("id"),
                **payload.model_dump(),
            ),
            schema_to_select=ApplicationInformationRead,
        )
        if created is None:
            raise NotFoundException("Failed to create application information")
        return created

    async def get_workspace_application_information(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        application_information_uuid: uuid_pkg.UUID | str,
        current_user: dict[str, Any],
    ) -> dict[str, Any]:
        workspace, _ = await self._require_workspace_capability(
            db=db,
            workspace_uuid=workspace_uuid,
            current_user=current_user,
            capability=self._metadata_read_capability(
                current_user=current_user,
                partner_capability=Capability.APPLICATION_INFORMATION_READ,
            ),
        )
        return await self._get_workspace_application_information(
            db=db,
            workspace_id=workspace["id"],
            application_information_uuid=application_information_uuid,
        )

    async def update_workspace_application_information(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        application_information_uuid: uuid_pkg.UUID | str,
        payload: ApplicationInformationUpdate,
        current_user: dict[str, Any],
    ) -> dict[str, Any]:
        workspace, _ = await self._require_workspace_capability(
            db=db,
            workspace_uuid=workspace_uuid,
            current_user=current_user,
            capability=Capability.APPLICATION_INFORMATION_WRITE,
        )
        existing = await self._get_workspace_application_information(
            db=db,
            workspace_id=workspace["id"],
            application_information_uuid=application_information_uuid,
        )
        update_data = payload.model_dump(exclude_unset=True)
        if not update_data:
            return existing

        await crud_application_information.update(
            db=db,
            object=update_data,
            uuid=application_information_uuid,
        )
        return await self._get_workspace_application_information(
            db=db,
            workspace_id=workspace["id"],
            application_information_uuid=application_information_uuid,
        )

    async def delete_workspace_application_information(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        application_information_uuid: uuid_pkg.UUID | str,
        current_user: dict[str, Any],
    ) -> dict[str, str]:
        workspace, _ = await self._require_workspace_capability(
            db=db,
            workspace_uuid=workspace_uuid,
            current_user=current_user,
            capability=Capability.APPLICATION_INFORMATION_WRITE,
        )
        application_information = await self._get_workspace_application_information(
            db=db,
            workspace_id=workspace["id"],
            application_information_uuid=application_information_uuid,
        )
        if await crud_rp_applications.exists(
            db=db,
            application_information_id=application_information["id"],
        ):
            raise CustomException(
                status_code=409,
                detail=LINKED_RP_APPLICATIONS_DELETE_BLOCK_MESSAGE,
            )
        await crud_application_information.delete(db=db, uuid=application_information_uuid)
        return {"message": "Application information deleted"}

    async def list_application_information_contacts(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        application_information_uuid: uuid_pkg.UUID | str,
        current_user: dict[str, Any],
    ) -> list[dict[str, Any]]:
        workspace, _ = await self._require_workspace_capability(
            db=db,
            workspace_uuid=workspace_uuid,
            current_user=current_user,
            capability=Capability.APPLICATION_INFORMATION_READ,
        )
        application_information = await self._get_workspace_application_information(
            db=db,
            workspace_id=workspace["id"],
            application_information_uuid=application_information_uuid,
        )
        contacts = await crud_application_information_contacts.get_multi(
            db=db,
            application_information_id=application_information["id"],
            is_deleted=False,
            schema_to_select=ApplicationInformationContactRecordRead,
        )
        return [await self._build_application_information_contact_read(db=db, contact=contact) for contact in contacts.get("data", [])]

    async def get_application_information_checklist(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        application_information_uuid: uuid_pkg.UUID | str,
        current_user: dict[str, Any],
    ) -> dict[str, Any]:
        """Return prerequisite statuses without serializing contact records."""

        workspace, _ = await self._require_workspace_capability(
            db=db,
            workspace_uuid=workspace_uuid,
            current_user=current_user,
            capability=self._metadata_read_capability(
                current_user=current_user,
                partner_capability=Capability.APPLICATION_INFORMATION_READ,
            ),
        )
        application_information = await self._get_workspace_application_information(
            db=db,
            workspace_id=workspace["id"],
            application_information_uuid=application_information_uuid,
        )
        contact_complete = and_(
            ApplicationInformationContact.first_name.is_not(None),
            func.length(func.trim(ApplicationInformationContact.first_name)) > 0,
            ApplicationInformationContact.last_name.is_not(None),
            func.length(func.trim(ApplicationInformationContact.last_name)) > 0,
            func.length(func.trim(ApplicationInformationContact.email)) > 0,
            func.length(func.trim(ApplicationInformationContact.responsibility_en)) > 0,
            func.length(func.trim(ApplicationInformationContact.responsibility_fr)) > 0,
            ApplicationInformationContact.identity_confirmed_at.is_not(None),
        )
        contact_result = await db.execute(
            select(
                ApplicationInformationContact.id,
                contact_complete.label("is_complete"),
            ).where(
                ApplicationInformationContact.application_information_id == application_information["id"],
                ApplicationInformationContact.is_deleted.is_(False),
                ApplicationInformationContact.deleted_at.is_(None),
            )
        )
        contact_rows = contact_result.all()
        contact_status = "missing" if not contact_rows else ("provided" if all(bool(row[1]) for row in contact_rows) else "attention_required")

        def field_status(*values: object) -> str:
            return "provided" if all(isinstance(value, str) and bool(value.strip()) for value in values) else "missing"

        checklist = ApplicationInformationChecklistRead(
            application_information_uuid=application_information["uuid"],
            application_name_en=application_information["service_name_en"],
            application_name_fr=application_information["service_name_fr"],
            items=[
                ApplicationInformationChecklistItemRead(
                    key="service_identity",
                    status=field_status(
                        application_information.get("service_name_en"),
                        application_information.get("service_name_fr"),
                    ),
                ),
                ApplicationInformationChecklistItemRead(
                    key="business_context",
                    status=field_status(
                        application_information.get("overview"),
                        application_information.get("usage"),
                    ),
                ),
                ApplicationInformationChecklistItemRead(
                    key="technical_integration",
                    status=field_status(application_information.get("technology_and_protocol")),
                ),
                ApplicationInformationChecklistItemRead(
                    key="security_posture",
                    status=field_status(application_information.get("security_and_privacy")),
                ),
                ApplicationInformationChecklistItemRead(
                    key="migration_planning",
                    status=field_status(application_information.get("migration_or_transition_plan")),
                ),
                ApplicationInformationChecklistItemRead(
                    key="contacts",
                    status=contact_status,
                ),
            ],
        )
        return checklist.model_dump(by_alias=True)

    async def add_application_information_contact(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        application_information_uuid: uuid_pkg.UUID | str,
        payload: ApplicationInformationContactCreate,
        current_user: dict[str, Any],
    ) -> dict[str, Any]:
        workspace, _ = await self._require_workspace_capability(
            db=db,
            workspace_uuid=workspace_uuid,
            current_user=current_user,
            capability=Capability.APPLICATION_INFORMATION_WRITE,
        )
        application_information = await self._get_workspace_application_information(
            db=db,
            workspace_id=workspace["id"],
            application_information_uuid=application_information_uuid,
        )
        created = await crud_application_information_contacts.create(
            db=db,
            object=ApplicationInformationContactCreateInternal(
                application_information_id=application_information["id"],
                created_by=self._normalize_current_user_id(current_user),
                identity_confirmed_at=datetime.now(UTC),
                identity_confirmed_by=self._normalize_current_user_id(current_user),
                **payload.model_dump(),
            ),
            schema_to_select=ApplicationInformationContactRecordRead,
        )
        if created is None:
            raise NotFoundException("Failed to create application information contact")
        return await self._build_application_information_contact_read(db=db, contact=created)

    async def update_application_information_contact(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        application_information_uuid: uuid_pkg.UUID | str,
        contact_uuid: uuid_pkg.UUID | str,
        payload: ApplicationInformationContactUpdate,
        current_user: dict[str, Any],
    ) -> dict[str, Any]:
        workspace, _ = await self._require_workspace_capability(
            db=db,
            workspace_uuid=workspace_uuid,
            current_user=current_user,
            capability=Capability.APPLICATION_INFORMATION_WRITE,
        )
        application_information = await self._get_workspace_application_information(
            db=db,
            workspace_id=workspace["id"],
            application_information_uuid=application_information_uuid,
        )
        existing_contact = await self._get_application_information_contact(
            db=db,
            application_information_id=application_information["id"],
            contact_uuid=contact_uuid,
        )
        update_data = payload.model_dump(exclude_unset=True)
        if not update_data:
            return await self._build_application_information_contact_read(db=db, contact=existing_contact)

        if "first_name" in update_data or "last_name" in update_data:
            first_name = update_data.get("first_name", existing_contact.get("first_name"))
            last_name = update_data.get("last_name", existing_contact.get("last_name"))
            if not isinstance(first_name, str) or not first_name.strip():
                raise BadRequestException("First name is required to confirm contact identity")
            if not isinstance(last_name, str) or not last_name.strip():
                raise BadRequestException("Last name is required to confirm contact identity")
            update_data.update(
                {
                    "first_name": first_name.strip(),
                    "last_name": last_name.strip(),
                    "identity_confirmed_at": datetime.now(UTC),
                    "identity_confirmed_by": self._normalize_current_user_id(current_user),
                }
            )
        update_data["updated_at"] = datetime.now(UTC)

        await crud_application_information_contacts.update(
            db=db,
            object=cast(
                ApplicationInformationContactUpdate,
                ApplicationInformationContactUpdateInternal(**update_data),
            ),
            uuid=contact_uuid,
        )
        updated_contact = await self._get_application_information_contact(
            db=db,
            application_information_id=application_information["id"],
            contact_uuid=contact_uuid,
        )
        return await self._build_application_information_contact_read(db=db, contact=updated_contact)

    async def delete_application_information_contact(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        application_information_uuid: uuid_pkg.UUID | str,
        contact_uuid: uuid_pkg.UUID | str,
        current_user: dict[str, Any],
    ) -> dict[str, str]:
        workspace, _ = await self._require_workspace_capability(
            db=db,
            workspace_uuid=workspace_uuid,
            current_user=current_user,
            capability=Capability.APPLICATION_INFORMATION_WRITE,
        )
        application_information = await self._get_workspace_application_information(
            db=db,
            workspace_id=workspace["id"],
            application_information_uuid=application_information_uuid,
        )
        await self._get_application_information_contact(
            db=db,
            application_information_id=application_information["id"],
            contact_uuid=contact_uuid,
        )
        await crud_application_information_contacts.delete(db=db, uuid=contact_uuid)
        return {"message": "Application information contact deleted"}

    async def list_workspace_rp_applications(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        current_user: dict[str, Any],
    ) -> list[dict[str, Any]]:
        workspace, decision = await self._require_workspace_capability(
            db=db,
            workspace_uuid=workspace_uuid,
            current_user=current_user,
            capability=Capability.RP_CONFIGURATION_READ,
        )
        records = await crud_rp_applications.get_multi(
            db=db,
            workspace_id=workspace["id"],
            sort_columns="id",
            sort_orders="asc",
            is_deleted=False,
            schema_to_select=RPApplicationRead,
        )
        applications = [
            await self._attach_rp_application_promotion_request_summary(
                db=db,
                rp_application=self._without_legacy_application_owner(record),
            )
            for record in records.get("data", [])
        ]
        assert decision.role is not None
        can_resume_registration = decision.role in {
            CanonicalRoleCode.RP_ADMIN,
            CanonicalRoleCode.RP_USER_EDIT,
        }
        return [
            build_rp_application_summary(
                application=application,
                workspace_uuid=workspace["uuid"],
                workspace_name=str(workspace["name"]),
                role=decision.role,
                can_resume_registration=can_resume_registration,
            )
            for application in applications
        ]

    async def list_application_rp_configurations(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        application_information_uuid: uuid_pkg.UUID | str,
        current_user: dict[str, Any],
    ) -> list[dict[str, Any]]:
        workspace, decision = await self._require_workspace_capability(
            db=db,
            workspace_uuid=workspace_uuid,
            current_user=current_user,
            capability=Capability.RP_CONFIGURATION_READ,
        )
        application_information = await self._get_workspace_application_information(
            db=db,
            workspace_id=workspace["id"],
            application_information_uuid=application_information_uuid,
        )
        records = await crud_rp_applications.get_multi(
            db=db,
            workspace_id=workspace["id"],
            application_information_id=application_information["id"],
            sort_columns="id",
            sort_orders="asc",
            is_deleted=False,
            schema_to_select=RPApplicationRead,
        )
        configurations = [
            await self._attach_rp_application_promotion_request_summary(
                db=db,
                rp_application=self._without_legacy_application_owner(record),
            )
            for record in records.get("data", [])
        ]
        assert decision.role is not None
        can_resume_registration = decision.role in {
            CanonicalRoleCode.RP_ADMIN,
            CanonicalRoleCode.RP_USER_EDIT,
        }
        return [
            build_application_rp_configuration_summary(
                application=configuration,
                application_information=application_information,
                workspace_uuid=workspace["uuid"],
                workspace_name=str(workspace["name"]),
                role=decision.role,
                can_resume_registration=can_resume_registration,
            )
            for configuration in configurations
        ]

    @staticmethod
    def _registration_step_index(step: str | None) -> int:
        if step not in REGISTRATION_DATA_STEPS:
            return -1
        return REGISTRATION_DATA_STEPS.index(step)

    @staticmethod
    def _log_registration_operational_event(
        *,
        event: str,
        current_user: dict[str, Any],
        workspace_uuid: uuid_pkg.UUID | str,
        application_information_uuid: uuid_pkg.UUID | str | None = None,
        rp_application_uuid: uuid_pkg.UUID | str | None = None,
        step_id: str | None = None,
        save_mode: str | None = None,
        changed_field_names: list[str] | None = None,
        result: str,
        correlation_id: str | None = None,
    ) -> None:
        actor_reference = hash_log_value(current_user.get("uuid") or current_user.get("id") or "unknown")
        workspace_reference = hash_log_value(workspace_uuid)
        application_information_reference = hash_log_value(application_information_uuid) if application_information_uuid is not None else "unknown"
        rp_application_reference = hash_log_value(rp_application_uuid) if rp_application_uuid is not None else "pending"
        logger.info(
            "RP registration event=%s actor_reference=%s workspace_reference=%s "
            "application_information_reference=%s rp_application_reference=%s "
            "step_id=%s save_mode=%s "
            "changed_field_names=%s result=%s correlation_id=%s",
            event,
            actor_reference,
            workspace_reference,
            application_information_reference,
            rp_application_reference,
            step_id or "none",
            save_mode or "none",
            ",".join(sorted(changed_field_names or [])),
            result,
            correlation_id or "none",
        )

    @staticmethod
    def _validate_registration_step(
        answers: dict[str, Any],
        step: str,
    ) -> None:
        try:
            validated_answers = WorkspaceRPApplicationRegistrationBase.model_validate(answers).model_dump(mode="json")
        except ValidationError as exc:
            raise BadRequestException("Registration step answers are incomplete or invalid") from exc

        missing_fields = [
            field
            for field in REGISTRATION_STEP_REQUIRED_FIELDS[step]
            if validated_answers.get(field) is None or validated_answers.get(field) == "" or validated_answers.get(field) == []
        ]
        if missing_fields:
            raise BadRequestException("Registration step answers are incomplete or invalid")

    def _derive_registration_last_completed_step(
        self,
        answers: dict[str, Any],
    ) -> str | None:
        last_completed_step: str | None = None
        for step in REGISTRATION_DATA_STEPS:
            try:
                self._validate_registration_step(answers, step)
            except BadRequestException:
                break
            last_completed_step = step
        return last_completed_step

    @staticmethod
    def _build_registration_draft_read(
        *,
        workspace_uuid: uuid_pkg.UUID | str,
        application_information_uuid: uuid_pkg.UUID | str,
        rp_application: dict[str, Any],
        last_completed_step: str | None = None,
    ) -> dict[str, Any]:
        answers = WorkspaceRPApplicationRegistrationAnswers.model_validate(rp_application.get("oidc_registration_payload") or {})
        read = WorkspaceRPApplicationRegistrationDraftRead(
            workspace_uuid=uuid_pkg.UUID(str(workspace_uuid)),
            rp_application_uuid=rp_application["uuid"],
            application_information_uuid=uuid_pkg.UUID(str(application_information_uuid)),
            configuration_name=rp_application["configuration_name"],
            partner_environment=rp_application.get("partner_environment"),
            registration_draft_version=rp_application.get("registration_draft_version", 0),
            registration_last_completed_step=(
                cast(
                    RegistrationDataStep | None,
                    last_completed_step if last_completed_step is not None else rp_application.get("registration_last_completed_step"),
                )
            ),
            registration_answers=answers,
        )
        return read.model_dump(mode="json", by_alias=False)

    @staticmethod
    def _build_registration_completion_read(
        *,
        workspace_uuid: uuid_pkg.UUID | str,
        application_information_uuid: uuid_pkg.UUID | str,
        rp_application: dict[str, Any],
    ) -> dict[str, Any]:
        answers = rp_application.get("oidc_registration_payload") or {}
        read = WorkspaceRPApplicationRegistrationCompletionRead(
            workspace_uuid=uuid_pkg.UUID(str(workspace_uuid)),
            application_information_uuid=uuid_pkg.UUID(str(application_information_uuid)),
            rp_application_uuid=rp_application["uuid"],
            registration_completed_at=rp_application["registration_completed_at"],
            registration_draft_version=int(rp_application.get("registration_draft_version") or 0),
            service_name_en=str(answers.get("service_name_en") or rp_application.get("dnr_app_name") or ""),
            service_name_fr=str(answers.get("service_name_fr") or ""),
        )
        return read.model_dump(mode="json", by_alias=False)

    @staticmethod
    def _registration_creation_matches(
        *,
        application_information_id: int | None,
        current_user: dict[str, Any],
        existing: dict[str, Any],
        payload: WorkspaceRPApplicationRegistrationDraftCreate,
        workspace_id: int,
    ) -> bool:
        existing_answers = existing.get("oidc_registration_payload") or {}
        return (
            existing.get("workspace_id") == workspace_id
            and existing.get("created_by") == current_user.get("id")
            and existing.get("application_information_id") == application_information_id
            and existing.get("configuration_name") == payload.configuration_name
            and existing.get("partner_environment") == payload.partner_environment
            and existing_answers.get("canada_login_environment") == payload.canada_login_environment
            and existing_answers.get("service_name_en") == payload.service_name_en
            and existing_answers.get("service_name_fr") == payload.service_name_fr
        )

    async def create_workspace_rp_application_registration_draft(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        payload: WorkspaceRPApplicationRegistrationDraftCreate,
        current_user: dict[str, Any],
        registration_creation_key: uuid_pkg.UUID,
        correlation_id: str | None = None,
    ) -> dict[str, Any]:
        try:
            workspace, _ = await self._require_workspace_capability(
                db=db,
                workspace_uuid=workspace_uuid,
                current_user=current_user,
                capability=Capability.RP_CONFIGURATION_WRITE,
            )
        except ForbiddenException:
            self._log_registration_operational_event(
                event="draft_create",
                current_user=current_user,
                workspace_uuid=workspace_uuid,
                application_information_uuid=payload.application_information_uuid,
                result="denied",
                correlation_id=correlation_id,
            )
            raise
        application_information_id = await self._resolve_workspace_application_information_id(
            db=db,
            workspace_id=workspace["id"],
            application_information_uuid=payload.application_information_uuid,
        )
        existing = await crud_rp_applications.get(
            db=db,
            registration_creation_key=registration_creation_key,
            is_deleted=False,
            schema_to_select=RPApplicationRead,
        )
        if existing is not None:
            if not self._registration_creation_matches(
                application_information_id=application_information_id,
                current_user=current_user,
                existing=existing,
                payload=payload,
                workspace_id=workspace["id"],
            ):
                self._log_registration_operational_event(
                    event="draft_create",
                    current_user=current_user,
                    workspace_uuid=workspace_uuid,
                    application_information_uuid=payload.application_information_uuid,
                    rp_application_uuid=existing.get("uuid"),
                    step_id="basics",
                    save_mode="completeStep",
                    result="conflict",
                    correlation_id=correlation_id,
                )
                raise RegistrationDraftConflictException(
                    code="registration_draft_creation_conflict",
                    message="The registration creation key is already in use.",
                )
            return self._build_registration_draft_read(
                workspace_uuid=workspace["uuid"],
                application_information_uuid=payload.application_information_uuid,
                rp_application=existing,
                last_completed_step="basics",
            )

        registration_payload = payload.model_dump(
            mode="json",
            exclude={"application_information_uuid", "configuration_name", "partner_environment"},
            exclude_none=True,
        )
        created_new = True
        try:
            created = await crud_rp_applications.create(
                db=db,
                object=RPApplicationCreateInternal(
                    workspace_id=workspace["id"],
                    department_id=workspace["department_id"],
                    application_information_id=application_information_id,
                    dnr_app_name=payload.service_name_en,
                    configuration_name=payload.configuration_name,
                    partner_environment=payload.partner_environment,
                    canada_login_environment=payload.canada_login_environment,
                    status=None,
                    ibm_sv_application_id=None,
                    oidc_registration_payload=registration_payload,
                    registration_creation_key=registration_creation_key,
                    registration_draft_version=1,
                    registration_last_completed_step="basics",
                    created_by=current_user.get("id"),
                ),
                schema_to_select=RPApplicationRead,
            )
        except IntegrityError:
            created_new = False
            await db.rollback()
            replayed_created = await crud_rp_applications.get(
                db=db,
                registration_creation_key=registration_creation_key,
                is_deleted=False,
                schema_to_select=RPApplicationRead,
            )
            if replayed_created is None or not self._registration_creation_matches(
                application_information_id=application_information_id,
                current_user=current_user,
                existing=replayed_created,
                payload=payload,
                workspace_id=workspace["id"],
            ):
                self._log_registration_operational_event(
                    event="draft_create",
                    current_user=current_user,
                    workspace_uuid=workspace_uuid,
                    application_information_uuid=payload.application_information_uuid,
                    rp_application_uuid=(replayed_created or {}).get("uuid"),
                    step_id="basics",
                    save_mode="completeStep",
                    result="conflict",
                    correlation_id=correlation_id,
                )
                raise RegistrationDraftConflictException(
                    code="registration_draft_creation_conflict",
                    message="The registration creation key is already in use.",
                ) from None
            created = replayed_created
        if created is None:
            raise NotFoundException("Failed to create RP application draft")
        if created_new:
            self._log_registration_operational_event(
                event="draft_create",
                current_user=current_user,
                workspace_uuid=workspace["uuid"],
                application_information_uuid=payload.application_information_uuid,
                rp_application_uuid=created["uuid"],
                step_id="basics",
                save_mode="completeStep",
                changed_field_names=sorted(registration_payload),
                result="success",
                correlation_id=correlation_id,
            )
        return self._build_registration_draft_read(
            workspace_uuid=workspace["uuid"],
            application_information_uuid=payload.application_information_uuid,
            rp_application=created,
            last_completed_step="basics",
        )

    async def create_application_rp_configuration_registration_draft(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        application_information_uuid: uuid_pkg.UUID | str,
        payload: ApplicationRPConfigurationRegistrationDraftCreate,
        current_user: dict[str, Any],
        registration_creation_key: uuid_pkg.UUID,
        correlation_id: str | None = None,
    ) -> dict[str, Any]:
        """Create a draft whose public Application identity comes from its parent."""

        workspace, _ = await self._require_workspace_capability(
            db=db,
            workspace_uuid=workspace_uuid,
            current_user=current_user,
            capability=Capability.RP_CONFIGURATION_WRITE,
        )
        application_information = await self._get_workspace_application_information(
            db=db,
            workspace_id=workspace["id"],
            application_information_uuid=application_information_uuid,
        )
        compatibility_payload = WorkspaceRPApplicationRegistrationDraftCreate.model_validate(
            {
                "application_information_uuid": application_information["uuid"],
                "configuration_name": payload.configuration_name,
                "partner_environment": payload.partner_environment,
                "canada_login_environment": payload.canada_login_environment,
                "service_name_en": application_information["service_name_en"],
                "service_name_fr": application_information["service_name_fr"],
            }
        )
        return await self.create_workspace_rp_application_registration_draft(
            db=db,
            workspace_uuid=workspace["uuid"],
            payload=compatibility_payload,
            current_user=current_user,
            registration_creation_key=registration_creation_key,
            correlation_id=correlation_id,
        )

    async def create_application_rp_configuration_copy(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        application_information_uuid: uuid_pkg.UUID | str,
        source_rp_configuration_uuid: uuid_pkg.UUID | str,
        payload: ApplicationRPConfigurationCopyCreate,
        current_user: dict[str, Any],
        copy_creation_key: uuid_pkg.UUID,
        correlation_id: str | None = None,
    ) -> dict[str, Any]:
        """Copy one selected RP configuration to an independent draft."""

        return await self._create_application_rp_configuration_copy(
            db=db,
            workspace_uuid=workspace_uuid,
            application_information_uuid=application_information_uuid,
            source_rp_configuration_uuid=source_rp_configuration_uuid,
            payload=payload,
            current_user=current_user,
            copy_creation_key=copy_creation_key,
            correlation_id=correlation_id,
            require_legacy_progression_transition=False,
            conflict_code="rp_configuration_copy_creation_conflict",
            conflict_message="The copy creation key is already in use.",
        )

    async def create_application_rp_configuration_progression(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        application_information_uuid: uuid_pkg.UUID | str,
        source_rp_configuration_uuid: uuid_pkg.UUID | str,
        payload: ApplicationRPConfigurationProgressionCreate,
        current_user: dict[str, Any],
        progression_creation_key: uuid_pkg.UUID,
        correlation_id: str | None = None,
    ) -> dict[str, Any]:
        """Compatibility adapter for the retired next-environment contract."""

        copied = await self._create_application_rp_configuration_copy(
            db=db,
            workspace_uuid=workspace_uuid,
            application_information_uuid=application_information_uuid,
            source_rp_configuration_uuid=source_rp_configuration_uuid,
            payload=ApplicationRPConfigurationCopyCreate(
                target_configuration_name=payload.target_configuration_name,
                target_partner_environment=payload.target_partner_environment,
                target_environment=payload.target_environment,
            ),
            current_user=current_user,
            copy_creation_key=progression_creation_key,
            correlation_id=correlation_id,
            require_legacy_progression_transition=True,
            conflict_code="rp_configuration_progression_creation_conflict",
            conflict_message="The progression creation key is already in use.",
        )
        return ApplicationRPConfigurationProgressionRead(
            workspace_uuid=copied["workspace_uuid"],
            application_information_uuid=copied["application_information_uuid"],
            source_rp_configuration_uuid=copied["source_rp_configuration_uuid"],
            source_configuration_name=copied["source_configuration_name"],
            source_partner_environment=copied["source_partner_environment"],
            source_environment=copied["source_environment"],
            target_rp_configuration_uuid=copied["target_rp_configuration_uuid"],
            target_configuration_name=copied["target_configuration_name"],
            target_partner_environment=copied["target_partner_environment"],
            target_environment=copied["target_environment"],
            target_registration_draft_version=copied["target_registration_draft_version"],
            target_registration_last_completed_step=copied["target_registration_last_completed_step"],
            self_serve=True,
        ).model_dump(mode="json", by_alias=False)

    async def _create_application_rp_configuration_copy(
        self,
        *,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        application_information_uuid: uuid_pkg.UUID | str,
        source_rp_configuration_uuid: uuid_pkg.UUID | str,
        payload: ApplicationRPConfigurationCopyCreate,
        current_user: dict[str, Any],
        copy_creation_key: uuid_pkg.UUID,
        correlation_id: str | None,
        require_legacy_progression_transition: bool,
        conflict_code: str,
        conflict_message: str,
    ) -> dict[str, Any]:
        """Canonical source-scoped implementation shared by new and legacy APIs."""

        workspace, _, source = await self._resolve_application_rp_configuration_access(
            db=db,
            workspace_uuid=workspace_uuid,
            application_information_uuid=application_information_uuid,
            rp_configuration_uuid=source_rp_configuration_uuid,
            current_user=current_user,
            capability=Capability.RP_CONFIGURATION_WRITE,
        )
        application_information = await self._get_workspace_application_information(
            db=db,
            workspace_id=workspace["id"],
            application_information_uuid=application_information_uuid,
        )

        source_environment = str(source.get("canada_login_environment") or "").strip().lower()
        if require_legacy_progression_transition:
            expected_target_environment = {
                "test": "staging",
                "staging": "production",
            }.get(source_environment)
            if expected_target_environment is None:
                raise BadRequestException("Only Test or Staging RP configurations can progress")
            if payload.target_environment != expected_target_environment:
                raise BadRequestException(f"A {source_environment} RP configuration can progress only to {expected_target_environment}")

        existing = await crud_rp_applications.get(
            db=db,
            registration_creation_key=copy_creation_key,
            is_deleted=False,
            schema_to_select=RPApplicationRead,
        )
        if existing is not None:
            source_id_result = await db.execute(
                select(RPApplication.source_rp_configuration_id).where(
                    RPApplication.id == existing["id"],
                    RPApplication.is_deleted.is_(False),
                )
            )
            existing_source_id = source_id_result.scalar_one_or_none()
            if not self._copy_creation_matches(
                existing=existing,
                source_rp_configuration_id=source["id"],
                existing_source_rp_configuration_id=existing_source_id,
                workspace_id=workspace["id"],
                application_information_id=application_information["id"],
                payload=payload,
            ):
                raise RegistrationDraftConflictException(
                    code=conflict_code,
                    message=conflict_message,
                )
            return self._build_rp_configuration_copy_read(
                workspace_uuid=workspace["uuid"],
                application_information_uuid=application_information["uuid"],
                source=source,
                target=existing,
            )

        source_answers = dict(source.get("oidc_registration_payload") or {})
        target_answers = copy_reusable_rp_configuration_answers(source_answers)
        target_answers.update(
            {
                "canada_login_environment": payload.target_environment,
                "service_name_en": application_information["service_name_en"],
                "service_name_fr": application_information["service_name_fr"],
            }
        )

        try:
            target = await crud_rp_applications.create(
                db=db,
                object=RPApplicationCreateInternal(
                    workspace_id=workspace["id"],
                    department_id=workspace["department_id"],
                    application_information_id=application_information["id"],
                    dnr_app_name=application_information["service_name_en"],
                    configuration_name=payload.target_configuration_name,
                    partner_environment=payload.target_partner_environment,
                    source_rp_configuration_id=source["id"],
                    canada_login_environment=payload.target_environment,
                    status=None,
                    ibm_sv_application_id=None,
                    oidc_registration_payload=target_answers,
                    registration_creation_key=copy_creation_key,
                    registration_draft_version=1,
                    registration_last_completed_step="basics",
                    created_by=current_user.get("id"),
                ),
                commit=False,
                schema_to_select=RPApplicationRead,
            )
            if target is None:
                raise NotFoundException("Failed to create RP configuration copy target")

            copied_at = datetime.now(UTC)
            actor_uuid_value = current_user.get("uuid")
            try:
                actor_uuid = uuid_pkg.UUID(str(actor_uuid_value)) if actor_uuid_value is not None else None
            except ValueError:
                actor_uuid = None
            audit_event = {
                "applicationInformationUuid": str(application_information["uuid"]),
                "copyPolicyVersion": RP_CONFIGURATION_COPY_POLICY_VERSION,
                "correlationId": correlation_id,
                "eventName": "rp_configuration_copy",
                "eventVersion": 1,
                "outcome": "succeeded",
                "sourceRpConfigurationUuid": str(source["uuid"]),
                "targetEnvironment": payload.target_environment,
                "targetRpConfigurationUuid": str(target["uuid"]),
                "timestamp": copied_at.isoformat(),
                "workspaceUuid": str(workspace["uuid"]),
            }
            db.add(
                AuditLog(
                    user="authorization_actor",
                    user_uuid=actor_uuid,
                    target="rp_configuration",
                    target_uuid=target["uuid"],
                    operation="copy",
                    description=json.dumps(audit_event, separators=(",", ":")),
                    created_at=copied_at,
                )
            )
            await db.commit()
        except IntegrityError:
            await db.rollback()
            existing = await crud_rp_applications.get(
                db=db,
                registration_creation_key=copy_creation_key,
                is_deleted=False,
                schema_to_select=RPApplicationRead,
            )
            if existing is None:
                raise RegistrationDraftConflictException(
                    code=conflict_code,
                    message="The RP configuration copy could not be created.",
                ) from None
            source_id_result = await db.execute(
                select(RPApplication.source_rp_configuration_id).where(
                    RPApplication.id == existing["id"],
                    RPApplication.is_deleted.is_(False),
                )
            )
            if not self._copy_creation_matches(
                existing=existing,
                source_rp_configuration_id=source["id"],
                existing_source_rp_configuration_id=source_id_result.scalar_one_or_none(),
                workspace_id=workspace["id"],
                application_information_id=application_information["id"],
                payload=payload,
            ):
                raise RegistrationDraftConflictException(
                    code=conflict_code,
                    message=conflict_message,
                ) from None
            target = existing

        self._log_registration_operational_event(
            event="rp_configuration_copy",
            current_user=current_user,
            workspace_uuid=workspace["uuid"],
            application_information_uuid=application_information["uuid"],
            rp_application_uuid=target["uuid"],
            step_id="basics",
            save_mode="completeStep",
            changed_field_names=[],
            result="success",
            correlation_id=correlation_id,
        )
        return self._build_rp_configuration_copy_read(
            workspace_uuid=workspace["uuid"],
            application_information_uuid=application_information["uuid"],
            source=source,
            target=target,
        )

    @staticmethod
    def _copy_creation_matches(
        *,
        existing: dict[str, Any],
        source_rp_configuration_id: int,
        existing_source_rp_configuration_id: int | None,
        workspace_id: int,
        application_information_id: int,
        payload: ApplicationRPConfigurationCopyCreate,
    ) -> bool:
        return (
            existing.get("workspace_id") == workspace_id
            and existing.get("application_information_id") == application_information_id
            and existing_source_rp_configuration_id == source_rp_configuration_id
            and existing.get("configuration_name") == payload.target_configuration_name
            and existing.get("partner_environment") == payload.target_partner_environment
            and existing.get("canada_login_environment") == payload.target_environment
        )

    @staticmethod
    def _build_rp_configuration_copy_read(
        *,
        workspace_uuid: uuid_pkg.UUID | str,
        application_information_uuid: uuid_pkg.UUID | str,
        source: dict[str, Any],
        target: dict[str, Any],
    ) -> dict[str, Any]:
        source_environment = str(source["canada_login_environment"])
        target_environment = str(target["canada_login_environment"])
        read = ApplicationRPConfigurationCopyRead(
            workspace_uuid=uuid_pkg.UUID(str(workspace_uuid)),
            application_information_uuid=uuid_pkg.UUID(str(application_information_uuid)),
            source_rp_configuration_uuid=source["uuid"],
            source_configuration_name=source["configuration_name"],
            source_partner_environment=source.get("partner_environment"),
            source_environment=cast(CanadaLoginEnvironment, source_environment),
            target_rp_configuration_uuid=target["uuid"],
            target_configuration_name=target["configuration_name"],
            target_partner_environment=target.get("partner_environment"),
            target_environment=cast(CanadaLoginEnvironment, target_environment),
            target_registration_draft_version=int(target.get("registration_draft_version") or 0),
            target_registration_last_completed_step=cast(
                RegistrationDataStep | None,
                target.get("registration_last_completed_step"),
            ),
            copy_policy_version=RP_CONFIGURATION_COPY_POLICY_VERSION,
        )
        return read.model_dump(mode="json", by_alias=False)

    async def get_workspace_rp_application_registration_draft(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        rp_application_uuid: uuid_pkg.UUID | str,
        current_user: dict[str, Any],
    ) -> dict[str, Any]:
        workspace, _ = await self._require_workspace_capability(
            db=db,
            workspace_uuid=workspace_uuid,
            current_user=current_user,
            capability=Capability.RP_CONFIGURATION_WRITE,
        )
        rp_application = await self._get_workspace_rp_application(
            db=db,
            workspace_id=workspace["id"],
            rp_application_uuid=rp_application_uuid,
        )
        if rp_application.get("registration_completed_at") is not None:
            raise NotFoundException("Registration draft not found")
        application_information_uuid = await self._resolve_workspace_application_information_uuid(
            db=db,
            workspace_id=workspace["id"],
            application_information_id=rp_application.get("application_information_id"),
        )
        completed_step = rp_application.get("registration_last_completed_step")
        if completed_step is None:
            completed_step = self._derive_registration_last_completed_step(dict(rp_application.get("oidc_registration_payload") or {}))
        return self._build_registration_draft_read(
            workspace_uuid=workspace["uuid"],
            application_information_uuid=application_information_uuid,
            rp_application=rp_application,
            last_completed_step=completed_step,
        )

    async def update_workspace_rp_application_registration_draft(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        rp_application_uuid: uuid_pkg.UUID | str,
        payload: WorkspaceRPApplicationRegistrationDraftPatch,
        current_user: dict[str, Any],
        correlation_id: str | None = None,
    ) -> dict[str, Any]:
        try:
            workspace, _ = await self._require_workspace_capability(
                db=db,
                workspace_uuid=workspace_uuid,
                current_user=current_user,
                capability=Capability.RP_CONFIGURATION_WRITE,
            )
        except ForbiddenException:
            self._log_registration_operational_event(
                event="draft_save",
                current_user=current_user,
                workspace_uuid=workspace_uuid,
                rp_application_uuid=rp_application_uuid,
                step_id=payload.step_id,
                save_mode=payload.save_mode,
                result="denied",
                correlation_id=correlation_id,
            )
            raise
        existing = await self._get_workspace_rp_application(
            db=db,
            workspace_id=workspace["id"],
            rp_application_uuid=rp_application_uuid,
        )
        if existing.get("registration_completed_at") is not None:
            raise NotFoundException("Registration draft not found")
        application_information_uuid = await self._resolve_workspace_application_information_uuid(
            db=db,
            workspace_id=workspace["id"],
            application_information_id=existing.get("application_information_id"),
            for_update=True,
        )

        current_version = int(existing.get("registration_draft_version") or 0)
        if current_version != payload.expected_draft_version:
            self._log_registration_operational_event(
                event="draft_save",
                current_user=current_user,
                workspace_uuid=workspace["uuid"],
                application_information_uuid=application_information_uuid,
                rp_application_uuid=rp_application_uuid,
                step_id=payload.step_id,
                save_mode=payload.save_mode,
                result="conflict",
                correlation_id=correlation_id,
            )
            raise RegistrationDraftConflictException(
                code="registration_draft_version_conflict",
                message="The registration draft was updated by another request.",
            )
        current_answers = dict(existing.get("oidc_registration_payload") or {})
        changed_answers = payload.registration_answers.model_dump(
            mode="json",
            exclude_unset=True,
            exclude_none=False,
            exclude={"application_information_uuid"},
        )
        merged_answers = {**current_answers, **changed_answers}
        current_completed_step = existing.get("registration_last_completed_step")
        if current_completed_step is None:
            current_completed_step = self._derive_registration_last_completed_step(current_answers)
        step_index = self._registration_step_index(payload.step_id)
        completed_index = self._registration_step_index(current_completed_step)
        if step_index > completed_index + 1:
            raise BadRequestException("Complete earlier registration steps before this step")
        if payload.save_mode == "completeStep":
            self._validate_registration_step(merged_answers, payload.step_id)
            next_completed_step: str | None = payload.step_id
        else:
            next_completed_step = (
                REGISTRATION_DATA_STEPS[step_index - 1]
                if completed_index >= step_index and step_index > 0
                else None
                if completed_index >= step_index
                else current_completed_step
            )

        update_object: dict[str, Any] = {
            "oidc_registration_payload": merged_answers,
            "registration_draft_version": current_version + 1,
            "registration_last_completed_step": next_completed_step,
            "updated_at": datetime.now(UTC),
        }
        if payload.configuration_name is not None:
            update_object["configuration_name"] = payload.configuration_name
        if payload.partner_environment is not None:
            update_object["partner_environment"] = payload.partner_environment
        if "service_name_en" in changed_answers:
            update_object["dnr_app_name"] = changed_answers["service_name_en"]
        if "canada_login_environment" in changed_answers:
            update_object["canada_login_environment"] = changed_answers["canada_login_environment"]

        try:
            updated = await crud_rp_applications.update(
                db=db,
                object=update_object,
                workspace_id=workspace["id"],
                uuid=rp_application_uuid,
                registration_completed_at=None,
                registration_draft_version=current_version,
                is_deleted=False,
                return_columns=REGISTRATION_UPDATE_RETURN_COLUMNS,
                one_or_none=True,
            )
        except NoResultFound:
            updated = None
        if updated is None:
            self._log_registration_operational_event(
                event="draft_save",
                current_user=current_user,
                workspace_uuid=workspace["uuid"],
                application_information_uuid=application_information_uuid,
                rp_application_uuid=rp_application_uuid,
                step_id=payload.step_id,
                save_mode=payload.save_mode,
                result="conflict",
                correlation_id=correlation_id,
            )
            raise RegistrationDraftConflictException(
                code="registration_draft_version_conflict",
                message="The registration draft was updated by another request.",
            )
        self._log_registration_operational_event(
            event="draft_save",
            current_user=current_user,
            workspace_uuid=workspace["uuid"],
            application_information_uuid=application_information_uuid,
            rp_application_uuid=rp_application_uuid,
            step_id=payload.step_id,
            save_mode=payload.save_mode,
            changed_field_names=sorted(
                [
                    *changed_answers,
                    *(["configuration_name"] if payload.configuration_name is not None else []),
                    *(["partner_environment"] if payload.partner_environment is not None else []),
                ]
            ),
            result="success",
            correlation_id=correlation_id,
        )
        return self._build_registration_draft_read(
            workspace_uuid=workspace["uuid"],
            application_information_uuid=application_information_uuid,
            rp_application=updated,
            last_completed_step=next_completed_step,
        )

    async def create_workspace_rp_application(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        payload: WorkspaceRPApplicationRegistrationCreate,
        current_user: dict[str, Any],
    ) -> dict[str, Any]:
        workspace, _ = await self._require_workspace_capability(
            db=db,
            workspace_uuid=workspace_uuid,
            current_user=current_user,
            capability=Capability.RP_CONFIGURATION_WRITE,
        )
        application_information_id = await self._resolve_workspace_application_information_id(
            db=db,
            workspace_id=workspace["id"],
            application_information_uuid=payload.application_information_uuid,
        )
        registration_payload = payload.model_dump(
            mode="json",
            exclude={"application_information_uuid", "configuration_name", "partner_environment"},
        )
        created = await crud_rp_applications.create(
            db=db,
            object=RPApplicationCreateInternal(
                workspace_id=workspace["id"],
                department_id=workspace["department_id"],
                application_information_id=application_information_id,
                dnr_app_name=payload.service_name_en,
                configuration_name=payload.configuration_name,
                partner_environment=payload.partner_environment,
                canada_login_environment=payload.canada_login_environment,
                status=None,
                ibm_sv_application_id=None,
                oidc_registration_payload=registration_payload,
                created_by=current_user.get("id"),
            ),
            schema_to_select=RPApplicationRead,
        )
        if created is None:
            raise NotFoundException("Failed to create RP application")
        return created

    async def get_workspace_rp_application(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        rp_application_uuid: uuid_pkg.UUID | str,
        current_user: dict[str, Any],
    ) -> dict[str, Any]:
        workspace, _ = await self._require_workspace_capability(
            db=db,
            workspace_uuid=workspace_uuid,
            current_user=current_user,
            capability=Capability.RP_CONFIGURATION_READ,
        )
        application = await self._get_workspace_rp_application(
            db=db,
            workspace_id=workspace["id"],
            rp_application_uuid=rp_application_uuid,
        )
        return application

    async def get_workspace_rp_application_configuration(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        rp_application_uuid: uuid_pkg.UUID | str,
        current_user: dict[str, Any],
    ) -> dict[str, Any]:
        """Return portal-owned registration data without provider credentials."""

        workspace, _ = await self._require_workspace_capability(
            db=db,
            workspace_uuid=workspace_uuid,
            current_user=current_user,
            capability=Capability.RP_CONFIGURATION_READ,
        )
        application = await self._get_workspace_rp_application(
            db=db,
            workspace_id=workspace["id"],
            rp_application_uuid=rp_application_uuid,
        )
        return self._build_rp_configuration_read(
            workspace=workspace,
            application=application,
        )

    async def get_application_rp_configuration_summary(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        application_information_uuid: uuid_pkg.UUID | str,
        rp_configuration_uuid: uuid_pkg.UUID | str,
        current_user: dict[str, Any],
    ) -> dict[str, Any]:
        workspace, decision = await self._require_workspace_capability(
            db=db,
            workspace_uuid=workspace_uuid,
            current_user=current_user,
            capability=self._metadata_read_capability(
                current_user=current_user,
                partner_capability=Capability.RP_CONFIGURATION_READ,
            ),
        )
        application_information = await self._get_workspace_application_information(
            db=db,
            workspace_id=workspace["id"],
            application_information_uuid=application_information_uuid,
        )
        configuration = await self._get_application_rp_configuration(
            db=db,
            workspace_id=workspace["id"],
            application_information_id=application_information["id"],
            rp_configuration_uuid=rp_configuration_uuid,
        )
        assert decision.role is not None
        return build_application_rp_configuration_summary(
            application=configuration,
            application_information=application_information,
            workspace_uuid=workspace["uuid"],
            workspace_name=str(workspace["name"]),
            role=decision.role,
            can_resume_registration=decision.role in {CanonicalRoleCode.RP_ADMIN, CanonicalRoleCode.RP_USER_EDIT},
        )

    async def update_application_rp_configuration_partner_environment(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        application_information_uuid: uuid_pkg.UUID | str,
        rp_configuration_uuid: uuid_pkg.UUID | str,
        payload: ApplicationRPConfigurationPartnerEnvironmentUpdate,
        current_user: dict[str, Any],
    ) -> dict[str, Any]:
        """Update only the public Partner-environment label for one nested RP configuration."""

        workspace, _, configuration = await self._resolve_application_rp_configuration_access(
            db=db,
            workspace_uuid=workspace_uuid,
            application_information_uuid=application_information_uuid,
            rp_configuration_uuid=rp_configuration_uuid,
            current_user=current_user,
            capability=Capability.RP_CONFIGURATION_WRITE,
        )
        updated_at = datetime.now(UTC)
        try:
            updated = await crud_rp_applications.update(
                db=db,
                object={
                    "partner_environment": payload.partner_environment,
                    "updated_at": updated_at,
                },
                workspace_id=workspace["id"],
                application_information_id=configuration["application_information_id"],
                uuid=configuration["uuid"],
                is_deleted=False,
                return_columns=["uuid", "partner_environment", "updated_at"],
                one_or_none=True,
                commit=False,
            )
        except NoResultFound:
            updated = None
        if updated is None:
            await db.rollback()
            raise NotFoundException("RP configuration not found")

        actor_uuid = current_user.get("uuid")
        if not isinstance(actor_uuid, uuid_pkg.UUID):
            actor_uuid = None
        audit_event = {
            "eventName": "rp_configuration.metadata_updated",
            "eventVersion": 1,
            "timestamp": updated_at.isoformat(),
            "workspaceUuid": str(workspace["uuid"]),
            "applicationInformationUuid": str(application_information_uuid),
            "rpConfigurationUuid": str(configuration["uuid"]),
            "fieldName": "partner_environment",
            "result": "succeeded",
        }
        db.add(
            AuditLog(
                user="authorization_actor",
                user_uuid=actor_uuid,
                target="rp_configuration",
                target_uuid=configuration["uuid"],
                operation="metadata_update",
                description=json.dumps(audit_event, separators=(",", ":")),
                created_at=updated_at,
            )
        )
        await db.commit()
        return ApplicationRPConfigurationPartnerEnvironmentRead(
            workspace_uuid=workspace["uuid"],
            application_information_uuid=uuid_pkg.UUID(str(application_information_uuid)),
            rp_configuration_uuid=updated["uuid"],
            partner_environment=updated["partner_environment"],
            updated_at=updated["updated_at"],
        ).model_dump(mode="json", by_alias=True)

    async def get_application_rp_configuration_configuration(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        application_information_uuid: uuid_pkg.UUID | str,
        rp_configuration_uuid: uuid_pkg.UUID | str,
        current_user: dict[str, Any],
    ) -> dict[str, Any]:
        workspace, _ = await self._require_workspace_capability(
            db=db,
            workspace_uuid=workspace_uuid,
            current_user=current_user,
            capability=Capability.RP_CONFIGURATION_READ,
        )
        application_information = await self._get_workspace_application_information(
            db=db,
            workspace_id=workspace["id"],
            application_information_uuid=application_information_uuid,
        )
        configuration = await self._get_application_rp_configuration(
            db=db,
            workspace_id=workspace["id"],
            application_information_id=application_information["id"],
            rp_configuration_uuid=rp_configuration_uuid,
        )
        configuration_read = self._build_rp_configuration_read(
            workspace=workspace,
            application=configuration,
        )
        configuration_read.update(
            {
                "serviceNameEn": application_information["service_name_en"],
                "serviceNameFr": application_information["service_name_fr"],
            }
        )
        return ApplicationRPConfigurationRead(
            application_information_uuid=application_information["uuid"],
            **configuration_read,
        ).model_dump(by_alias=True)

    async def get_application_rp_configuration_registration_draft(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        application_information_uuid: uuid_pkg.UUID | str,
        rp_configuration_uuid: uuid_pkg.UUID | str,
        current_user: dict[str, Any],
    ) -> dict[str, Any]:
        await self._resolve_application_rp_configuration_access(
            db=db,
            workspace_uuid=workspace_uuid,
            application_information_uuid=application_information_uuid,
            rp_configuration_uuid=rp_configuration_uuid,
            current_user=current_user,
            capability=Capability.RP_CONFIGURATION_READ,
        )
        return await self.get_workspace_rp_application_registration_draft(
            db=db,
            workspace_uuid=workspace_uuid,
            rp_application_uuid=rp_configuration_uuid,
            current_user=current_user,
        )

    async def update_application_rp_configuration_registration_draft(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        application_information_uuid: uuid_pkg.UUID | str,
        rp_configuration_uuid: uuid_pkg.UUID | str,
        payload: WorkspaceRPApplicationRegistrationDraftPatch,
        current_user: dict[str, Any],
        correlation_id: str | None = None,
    ) -> dict[str, Any]:
        workspace, _, _ = await self._resolve_application_rp_configuration_access(
            db=db,
            workspace_uuid=workspace_uuid,
            application_information_uuid=application_information_uuid,
            rp_configuration_uuid=rp_configuration_uuid,
            current_user=current_user,
            capability=Capability.RP_CONFIGURATION_WRITE,
        )
        application_information = await self._get_workspace_application_information(
            db=db,
            workspace_id=workspace["id"],
            application_information_uuid=application_information_uuid,
        )
        safe_answers = payload.registration_answers.model_copy(
            update={
                "application_information_uuid": application_information["uuid"],
                "service_name_en": application_information["service_name_en"],
                "service_name_fr": application_information["service_name_fr"],
            }
        )
        scoped_payload = payload.model_copy(update={"registration_answers": safe_answers})
        return await self.update_workspace_rp_application_registration_draft(
            db=db,
            workspace_uuid=workspace_uuid,
            rp_application_uuid=rp_configuration_uuid,
            payload=scoped_payload,
            current_user=current_user,
            correlation_id=correlation_id,
        )

    async def complete_application_rp_configuration_registration(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        application_information_uuid: uuid_pkg.UUID | str,
        rp_configuration_uuid: uuid_pkg.UUID | str,
        payload: WorkspaceRPApplicationRegistrationCompletionRequest,
        current_user: dict[str, Any],
        correlation_id: str | None = None,
    ) -> dict[str, Any]:
        await self._resolve_application_rp_configuration_access(
            db=db,
            workspace_uuid=workspace_uuid,
            application_information_uuid=application_information_uuid,
            rp_configuration_uuid=rp_configuration_uuid,
            current_user=current_user,
            capability=Capability.RP_CONFIGURATION_WRITE,
        )
        return await self.complete_workspace_rp_application_registration(
            db=db,
            workspace_uuid=workspace_uuid,
            rp_application_uuid=rp_configuration_uuid,
            payload=payload,
            current_user=current_user,
            correlation_id=correlation_id,
        )

    def _build_rp_configuration_read(
        self,
        *,
        workspace: dict[str, Any],
        application: dict[str, Any],
    ) -> dict[str, Any]:
        payload = application.get("oidc_registration_payload")
        payload_data = payload if isinstance(payload, dict) else {}
        answers = self._registration_answers_for_read(payload_data)
        offline_public_key_provided = bool(str(answers.offline_jwk_or_certificate or "").strip())
        safe_answers = answers.model_copy(update={"offline_jwk_or_certificate": None})
        service_name_en = str(answers.service_name_en or application.get("dnr_app_name") or "").strip()
        service_name_fr = str(answers.service_name_fr or service_name_en).strip()

        return WorkspaceRPApplicationConfigurationRead(
            workspace_uuid=workspace["uuid"],
            rp_application_uuid=application["uuid"],
            service_name_en=service_name_en,
            service_name_fr=service_name_fr,
            configuration_name=application.get("configuration_name"),
            partner_environment=application.get("partner_environment"),
            canada_login_environment=(answers.canada_login_environment or application.get("canada_login_environment")),
            production_review_status=application.get("production_review_status"),
            production_review_reconciliation_required=bool(application.get("production_review_reconciliation_required")),
            registration_draft_version=int(application.get("registration_draft_version") or 0),
            registration_last_completed_step=application.get("registration_last_completed_step"),
            registration_completed_at=application.get("registration_completed_at"),
            registration_answers=safe_answers,
            offline_public_key_provided=offline_public_key_provided,
        ).model_dump(by_alias=True)

    @staticmethod
    def _registration_answers_for_read(payload: dict[str, Any]) -> WorkspaceRPApplicationRegistrationAnswers:
        """Normalize portal-era payload variants without making configuration unreadable."""

        normalized = dict(payload)
        legacy_aliases = {
            "application_url": "application_environment_url_en",
            "logout_redirect_uris": "post_logout_redirect_uris",
            "pkce_enabled": "pkce_supported",
        }
        for legacy_name, canonical_name in legacy_aliases.items():
            if canonical_name not in normalized and legacy_name in normalized:
                normalized[canonical_name] = normalized[legacy_name]
        if "application_environment_url_fr" not in normalized and "application_environment_url_en" in normalized:
            normalized["application_environment_url_fr"] = normalized["application_environment_url_en"]

        known_answers = {key: value for key, value in normalized.items() if key in WorkspaceRPApplicationRegistrationAnswers.model_fields}
        try:
            return WorkspaceRPApplicationRegistrationAnswers.model_validate(known_answers)
        except ValidationError:
            # Existing MVP records can contain a malformed optional value. Keep every
            # independently valid portal-owned answer available instead of failing the
            # entire read-only configuration page.
            valid_answers: dict[str, Any] = {}
            for key, value in known_answers.items():
                try:
                    WorkspaceRPApplicationRegistrationAnswers.model_validate({key: value})
                except ValidationError:
                    continue
                valid_answers[key] = value
            return WorkspaceRPApplicationRegistrationAnswers.model_validate(valid_answers)

    async def get_workspace_rp_application_promotion_request(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        rp_application_uuid: uuid_pkg.UUID | str,
        current_user: dict[str, Any],
    ) -> dict[str, Any]:
        workspace, _ = await self._require_workspace_capability(
            db=db,
            workspace_uuid=workspace_uuid,
            current_user=current_user,
            capability=self._metadata_read_capability(
                current_user=current_user,
                partner_capability=Capability.RP_CONFIGURATION_READ,
            ),
        )
        rp_application = await self._get_workspace_rp_application(
            db=db,
            workspace_id=workspace["id"],
            rp_application_uuid=rp_application_uuid,
        )
        self._validate_rp_application_promotion_request_target(rp_application=rp_application)
        promotion_request = await self._get_rp_application_promotion_request_record(
            db=db,
            rp_application_id=rp_application["id"],
            required=True,
        )
        assert promotion_request is not None
        return await self._build_rp_application_promotion_request_read(
            db=db,
            promotion_request=promotion_request,
        )

    async def get_application_rp_configuration_promotion_request(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        application_information_uuid: uuid_pkg.UUID | str,
        rp_configuration_uuid: uuid_pkg.UUID | str,
        current_user: dict[str, Any],
    ) -> dict[str, Any]:
        workspace, _, target = await self._resolve_application_rp_configuration_access(
            db=db,
            workspace_uuid=workspace_uuid,
            application_information_uuid=application_information_uuid,
            rp_configuration_uuid=rp_configuration_uuid,
            current_user=current_user,
            capability=self._metadata_read_capability(
                current_user=current_user,
                partner_capability=Capability.RP_CONFIGURATION_READ,
            ),
        )
        return await self._build_application_rp_configuration_promotion_request_read(
            db=db,
            workspace_id=workspace["id"],
            application_information_uuid=application_information_uuid,
            target=target,
        )

    async def upsert_application_rp_configuration_promotion_request(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        application_information_uuid: uuid_pkg.UUID | str,
        rp_configuration_uuid: uuid_pkg.UUID | str,
        payload: PromotionRequestUpsert,
        current_user: dict[str, Any],
    ) -> dict[str, Any]:
        workspace, _, _ = await self._resolve_application_rp_configuration_access(
            db=db,
            workspace_uuid=workspace_uuid,
            application_information_uuid=application_information_uuid,
            rp_configuration_uuid=rp_configuration_uuid,
            current_user=current_user,
            capability=Capability.PRODUCTION_REVIEW_REQUEST_WRITE,
        )
        await self.upsert_workspace_rp_application_promotion_request(
            db=db,
            workspace_uuid=workspace_uuid,
            rp_application_uuid=rp_configuration_uuid,
            payload=payload,
            current_user=current_user,
        )
        target = await self._get_application_rp_configuration(
            db=db,
            workspace_id=workspace["id"],
            application_information_id=await self._resolve_workspace_application_information_id(
                db=db,
                workspace_id=workspace["id"],
                application_information_uuid=application_information_uuid,
            ),
            rp_configuration_uuid=rp_configuration_uuid,
        )
        return await self._build_application_rp_configuration_promotion_request_read(
            db=db,
            workspace_id=workspace["id"],
            application_information_uuid=application_information_uuid,
            target=target,
        )

    async def review_application_rp_configuration_promotion_request(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        application_information_uuid: uuid_pkg.UUID | str,
        rp_configuration_uuid: uuid_pkg.UUID | str,
        payload: PromotionReviewUpdate,
        current_user: dict[str, Any],
    ) -> dict[str, Any]:
        workspace, _, target = await self._resolve_application_rp_configuration_access(
            db=db,
            workspace_uuid=workspace_uuid,
            application_information_uuid=application_information_uuid,
            rp_configuration_uuid=rp_configuration_uuid,
            current_user=current_user,
            capability=Capability.PRODUCTION_REVIEW,
        )
        await self.review_workspace_rp_application_promotion_request(
            db=db,
            workspace_uuid=workspace_uuid,
            rp_application_uuid=rp_configuration_uuid,
            payload=payload,
            current_user=current_user,
        )
        target = await self._get_application_rp_configuration(
            db=db,
            workspace_id=workspace["id"],
            application_information_id=target["application_information_id"],
            rp_configuration_uuid=rp_configuration_uuid,
        )
        return await self._build_application_rp_configuration_promotion_request_read(
            db=db,
            workspace_id=workspace["id"],
            application_information_uuid=application_information_uuid,
            target=target,
        )

    async def upsert_workspace_rp_application_promotion_request(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        rp_application_uuid: uuid_pkg.UUID | str,
        payload: PromotionRequestUpsert,
        current_user: dict[str, Any],
    ) -> dict[str, Any]:
        workspace, _ = await self._require_workspace_capability(
            db=db,
            workspace_uuid=workspace_uuid,
            current_user=current_user,
            capability=Capability.PRODUCTION_REVIEW_REQUEST_WRITE,
        )
        rp_application = await self._get_workspace_rp_application(
            db=db,
            workspace_id=workspace["id"],
            rp_application_uuid=rp_application_uuid,
        )
        self._validate_rp_application_promotion_request_target(rp_application=rp_application)

        promotion_request = await self._get_rp_application_promotion_request_record(
            db=db,
            rp_application_id=rp_application["id"],
            required=False,
        )
        request_time = datetime.now(UTC)

        if promotion_request is None:
            try:
                await crud_rp_application_promotion_requests.create(
                    db=db,
                    object=RPApplicationPromotionRequestCreateInternal(
                        rp_application_id=rp_application["id"],
                        target_environment=PROMOTION_REQUEST_TARGET_ENVIRONMENT,
                        review_status=PROMOTION_REQUEST_PENDING_STATUS,
                        external_reference=payload.external_reference,
                        requested_at=request_time,
                    ),
                    commit=False,
                )
            except IntegrityError:
                await db.rollback()
                raise BadRequestException("A Production-review request already exists") from None
            audit_operation = "review_request"
        else:
            review_status = promotion_request.get("review_status")
            if review_status is None:
                raise BadRequestException("Historical Production-review record requires reconciliation")
            if review_status != PROMOTION_REQUEST_PENDING_STATUS:
                raise BadRequestException("Only a pending Production-review request can be updated")
            try:
                updated_request = await crud_rp_application_promotion_requests.update(
                    db=db,
                    object={
                        "external_reference": payload.external_reference,
                        "updated_at": request_time,
                    },
                    id=promotion_request["id"],
                    review_status=PROMOTION_REQUEST_PENDING_STATUS,
                    return_columns=["id"],
                    one_or_none=True,
                    commit=False,
                )
            except NoResultFound:
                updated_request = None
            if updated_request is None:
                await db.rollback()
                raise BadRequestException("Only a pending Production-review request can be updated")
            audit_operation = "review_update"

        self._add_production_review_audit(
            db=db,
            operation=audit_operation,
            current_user=current_user,
            workspace_uuid=workspace["uuid"],
            rp_application_uuid=rp_application["uuid"],
            status=PROMOTION_REQUEST_PENDING_STATUS,
            event_time=request_time,
            has_external_reference=bool(str(payload.external_reference or "").strip()),
        )
        await db.commit()

        stored_request = await self._get_rp_application_promotion_request_record(
            db=db,
            rp_application_id=rp_application["id"],
            required=True,
        )
        assert stored_request is not None
        return await self._build_rp_application_promotion_request_read(
            db=db,
            promotion_request=stored_request,
        )

    async def review_workspace_rp_application_promotion_request(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        rp_application_uuid: uuid_pkg.UUID | str,
        payload: PromotionReviewUpdate,
        current_user: dict[str, Any],
    ) -> dict[str, Any]:
        workspace, _ = await self._require_workspace_capability(
            db=db,
            workspace_uuid=workspace_uuid,
            current_user=current_user,
            capability=Capability.PRODUCTION_REVIEW,
        )
        rp_application = await self._get_workspace_rp_application(
            db=db,
            workspace_id=workspace["id"],
            rp_application_uuid=rp_application_uuid,
        )
        self._validate_rp_application_promotion_request_target(rp_application=rp_application)

        promotion_request = await self._get_rp_application_promotion_request_record(
            db=db,
            rp_application_id=rp_application["id"],
            required=True,
        )
        assert promotion_request is not None
        review_status = promotion_request.get("review_status")
        if review_status is None:
            raise BadRequestException("Historical Production-review record requires reconciliation")
        if review_status != PROMOTION_REQUEST_PENDING_STATUS:
            raise BadRequestException("Only a pending Production-review request can receive an outcome")
        payload_data = payload.model_dump(exclude_unset=True)
        next_external_reference = payload.external_reference
        if "external_reference" not in payload_data:
            next_external_reference = promotion_request.get("external_reference")
        if payload.status == "approved" and not str(next_external_reference or "").strip():
            raise BadRequestException("Approved production review outcomes require an external reference")

        decision_time = datetime.now(UTC)
        update_data: dict[str, Any] = {
            "review_status": payload.status,
            "reviewed_by_user_id": self._normalize_current_user_id(current_user),
            "reviewed_at": decision_time,
            "decided_at": decision_time,
            "updated_at": decision_time,
        }
        if "external_reference" in payload_data:
            update_data["external_reference"] = payload.external_reference
        if "reviewed_by_team" in payload_data:
            update_data["reviewed_by_team"] = payload.reviewed_by_team

        try:
            updated_request = await crud_rp_application_promotion_requests.update(
                db=db,
                object=update_data,
                id=promotion_request["id"],
                review_status=PROMOTION_REQUEST_PENDING_STATUS,
                return_columns=["id"],
                one_or_none=True,
                commit=False,
            )
        except NoResultFound:
            updated_request = None
        if updated_request is None:
            await db.rollback()
            raise BadRequestException("Only a pending Production-review request can receive an outcome")
        self._add_production_review_audit(
            db=db,
            operation="review_decision",
            current_user=current_user,
            workspace_uuid=workspace["uuid"],
            rp_application_uuid=rp_application["uuid"],
            status=payload.status,
            event_time=decision_time,
            has_external_reference=bool(str(next_external_reference or "").strip()),
        )
        await db.commit()

        stored_request = await self._get_rp_application_promotion_request_record(
            db=db,
            rp_application_id=rp_application["id"],
            required=True,
        )
        assert stored_request is not None
        return await self._build_rp_application_promotion_request_read(
            db=db,
            promotion_request=stored_request,
        )

    async def complete_workspace_rp_application_registration(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        rp_application_uuid: uuid_pkg.UUID | str,
        payload: WorkspaceRPApplicationRegistrationCompletionRequest,
        current_user: dict[str, Any],
        correlation_id: str | None = None,
    ) -> dict[str, Any]:
        try:
            workspace, _ = await self._require_workspace_capability(
                db=db,
                workspace_uuid=workspace_uuid,
                current_user=current_user,
                capability=Capability.RP_CONFIGURATION_WRITE,
            )
        except ForbiddenException:
            self._log_registration_operational_event(
                event="registration_complete",
                current_user=current_user,
                workspace_uuid=workspace_uuid,
                rp_application_uuid=rp_application_uuid,
                result="denied",
                correlation_id=correlation_id,
            )
            raise
        rp_application = await self._get_workspace_rp_application(
            db=db,
            workspace_id=workspace["id"],
            rp_application_uuid=rp_application_uuid,
        )
        application_information_uuid = await self._resolve_workspace_application_information_uuid(
            db=db,
            workspace_id=workspace["id"],
            application_information_id=rp_application.get("application_information_id"),
        )
        if rp_application.get("registration_completed_at") is not None:
            return self._build_registration_completion_read(
                workspace_uuid=workspace["uuid"],
                application_information_uuid=application_information_uuid,
                rp_application=rp_application,
            )

        current_version = int(rp_application.get("registration_draft_version") or 0)
        if payload.expected_draft_version != current_version:
            self._log_registration_operational_event(
                event="registration_complete",
                current_user=current_user,
                workspace_uuid=workspace["uuid"],
                application_information_uuid=application_information_uuid,
                rp_application_uuid=rp_application_uuid,
                result="conflict",
                correlation_id=correlation_id,
            )
            raise RegistrationDraftConflictException(
                code="registration_draft_version_conflict",
                message="The registration draft was updated by another request.",
            )

        try:
            WorkspaceRPApplicationRegistrationCreate.model_validate(
                {
                    **(rp_application.get("oidc_registration_payload") or {}),
                    "application_information_uuid": application_information_uuid,
                    "configuration_name": rp_application.get("configuration_name"),
                    "partner_environment": rp_application.get("partner_environment"),
                    "canada_login_environment": rp_application.get("canada_login_environment"),
                }
            )
        except ValidationError as exc:
            self._log_registration_operational_event(
                event="registration_complete",
                current_user=current_user,
                workspace_uuid=workspace["uuid"],
                application_information_uuid=application_information_uuid,
                rp_application_uuid=rp_application_uuid,
                result="invalid",
                correlation_id=correlation_id,
            )
            raise BadRequestException("The registration questionnaire must be complete and valid before completion") from exc

        completed_at = datetime.now(UTC)
        try:
            updated = await crud_rp_applications.update(
                db=db,
                object={
                    "registration_completed_at": completed_at,
                    "registration_draft_version": current_version + 1,
                    "registration_last_completed_step": "encryption",
                    "updated_at": completed_at,
                },
                workspace_id=workspace["id"],
                uuid=rp_application_uuid,
                registration_completed_at=None,
                registration_draft_version=current_version,
                is_deleted=False,
                return_columns=REGISTRATION_UPDATE_RETURN_COLUMNS,
                one_or_none=True,
                commit=False,
            )
        except NoResultFound:
            updated = None
        if updated is None:
            await db.rollback()
            latest = await self._get_workspace_rp_application(
                db=db,
                workspace_id=workspace["id"],
                rp_application_uuid=rp_application_uuid,
            )
            if latest.get("registration_completed_at") is not None:
                return self._build_registration_completion_read(
                    workspace_uuid=workspace["uuid"],
                    application_information_uuid=application_information_uuid,
                    rp_application=latest,
                )
            self._log_registration_operational_event(
                event="registration_complete",
                current_user=current_user,
                workspace_uuid=workspace["uuid"],
                application_information_uuid=application_information_uuid,
                rp_application_uuid=rp_application_uuid,
                result="conflict",
                correlation_id=correlation_id,
            )
            raise RegistrationDraftConflictException(
                code="registration_draft_version_conflict",
                message="The registration draft was updated by another request.",
            )

        actor_uuid_value = current_user.get("uuid")
        try:
            actor_uuid = uuid_pkg.UUID(str(actor_uuid_value)) if actor_uuid_value is not None else None
        except ValueError:
            actor_uuid = None
        audit_event = {
            "applicationInformationUuid": str(application_information_uuid),
            "correlationId": correlation_id,
            "eventName": "rp_registration_completed",
            "eventVersion": 1,
            "outcome": "succeeded",
            "rpConfigurationUuid": str(rp_application_uuid),
            "timestamp": completed_at.isoformat(),
            "workspaceUuid": str(workspace["uuid"]),
        }
        db.add(
            AuditLog(
                user="authorization_actor",
                user_uuid=actor_uuid,
                target="rp_configuration",
                target_uuid=uuid_pkg.UUID(str(rp_application_uuid)),
                operation="reg_complete",
                description=json.dumps(audit_event, separators=(",", ":")),
                created_at=completed_at,
            )
        )
        await db.commit()
        self._log_registration_operational_event(
            event="registration_complete",
            current_user=current_user,
            workspace_uuid=workspace["uuid"],
            application_information_uuid=application_information_uuid,
            rp_application_uuid=rp_application_uuid,
            result="success",
            correlation_id=correlation_id,
        )
        return self._build_registration_completion_read(
            workspace_uuid=workspace["uuid"],
            application_information_uuid=application_information_uuid,
            rp_application=updated,
        )

    async def delete_workspace_rp_application(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        rp_application_uuid: uuid_pkg.UUID | str,
        current_user: dict[str, Any],
    ) -> dict[str, str]:
        workspace, _ = await self._require_workspace_capability(
            db=db,
            workspace_uuid=workspace_uuid,
            current_user=current_user,
            capability=Capability.RP_CONFIGURATION_WRITE,
        )
        await self._get_workspace_rp_application(
            db=db,
            workspace_id=workspace["id"],
            rp_application_uuid=rp_application_uuid,
        )
        await crud_rp_applications.delete(db=db, uuid=rp_application_uuid)
        return {"message": "RP application deleted"}

    async def delete_application_rp_configuration(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        application_information_uuid: uuid_pkg.UUID | str,
        rp_configuration_uuid: uuid_pkg.UUID | str,
        current_user: dict[str, Any],
    ) -> dict[str, str]:
        await self._resolve_application_rp_configuration_access(
            db=db,
            workspace_uuid=workspace_uuid,
            application_information_uuid=application_information_uuid,
            rp_configuration_uuid=rp_configuration_uuid,
            current_user=current_user,
            capability=Capability.RP_CONFIGURATION_WRITE,
        )
        await crud_rp_applications.delete(db=db, uuid=rp_configuration_uuid)
        return {"message": "RP configuration deleted"}

    async def get_workspace_rp_application_usage_summary(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        rp_application_uuid: uuid_pkg.UUID | str,
        current_user: dict[str, Any],
        ibm_sv_admin_service: IBMVerifyAdminService,
        selected_date: str | None = None,
    ) -> dict[str, int]:
        workspace, _ = await self._require_workspace_capability(
            db=db,
            workspace_uuid=workspace_uuid,
            current_user=current_user,
            capability=Capability.MAU_REPORT_READ,
        )
        rp_application = await self._get_workspace_rp_application(
            db=db,
            workspace_id=workspace["id"],
            rp_application_uuid=rp_application_uuid,
        )
        ibm_application_id = self._get_workspace_rp_application_ibm_application_id(rp_application)
        from_date, to_date = self._resolve_selected_date_range(selected_date)
        payload = await ibm_sv_admin_service.get_application_total_logins(
            application_id=ibm_application_id,
            from_date=from_date,
            to_date=to_date,
        )
        return self._normalize_workspace_rp_application_usage_summary(payload)

    async def get_application_rp_configuration_usage_summary(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        application_information_uuid: uuid_pkg.UUID | str,
        rp_configuration_uuid: uuid_pkg.UUID | str,
        current_user: dict[str, Any],
        ibm_sv_admin_service: IBMVerifyAdminService,
        selected_date: str | None = None,
    ) -> dict[str, int]:
        _, _, configuration = await self._resolve_application_rp_configuration_access(
            db=db,
            workspace_uuid=workspace_uuid,
            application_information_uuid=application_information_uuid,
            rp_configuration_uuid=rp_configuration_uuid,
            current_user=current_user,
            capability=Capability.MAU_REPORT_READ,
        )
        ibm_application_id = self._get_workspace_rp_application_ibm_application_id(configuration)
        from_date, to_date = self._resolve_selected_date_range(selected_date)
        payload = await ibm_sv_admin_service.get_application_total_logins(
            application_id=ibm_application_id,
            from_date=from_date,
            to_date=to_date,
        )
        return self._normalize_workspace_rp_application_usage_summary(payload)

    async def _resolve_department_id(
        self,
        db: AsyncSession,
        department_uuid: uuid_pkg.UUID | str,
    ) -> int:
        department = await crud_departments.get(
            db=db,
            uuid=department_uuid,
            is_deleted=False,
        )
        if department is None:
            raise NotFoundException("Department not found")
        return int(department["id"])

    def _require_platform_capability(
        self,
        *,
        current_user: dict[str, Any],
        capability: Capability,
    ) -> ResourceScopeDecision:
        state = get_resolved_authorization_state(current_user)
        role_scopes = state.role_scopes if state is not None else ()
        decision = self._decision_point.decide(
            ResourceScopeRequest(
                role_scopes=role_scopes,
                capability=capability,
            )
        )
        if not decision.allowed:
            raise ForbiddenException("You do not have enough privileges.")
        return decision

    def _metadata_read_capability(
        self,
        *,
        current_user: dict[str, Any],
        partner_capability: Capability,
    ) -> Capability:
        """Select the oversight or partner-scoped metadata read capability."""

        state = get_resolved_authorization_state(current_user)
        if state is not None and state.is_cl_admin:
            return Capability.CROSS_WORKSPACE_METADATA_READ
        return partner_capability

    async def _require_workspace_capability(
        self,
        *,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        current_user: dict[str, Any],
        capability: Capability,
    ) -> tuple[dict[str, Any], ResourceScopeDecision]:
        try:
            normalized_workspace_uuid = uuid_pkg.UUID(str(workspace_uuid))
        except (TypeError, ValueError, AttributeError) as exc:
            raise NotFoundException("Workspace not found") from exc

        state = get_resolved_authorization_state(current_user)
        role_scopes = state.role_scopes if state is not None else ()
        decision = self._decision_point.decide(
            ResourceScopeRequest(
                role_scopes=role_scopes,
                capability=capability,
                resource_workspace_uuid=normalized_workspace_uuid,
            )
        )
        if not decision.allowed:
            if decision.reason in {
                ResourceScopeDecisionReason.NO_ACTIVE_ASSIGNMENT,
                ResourceScopeDecisionReason.CONFLICTING_ASSIGNMENTS,
                ResourceScopeDecisionReason.WORKSPACE_SCOPE_REQUIRED,
                ResourceScopeDecisionReason.WORKSPACE_SCOPE_MISMATCH,
            }:
                raise NotFoundException("Workspace not found")
            raise ForbiddenException("You do not have enough privileges.")

        workspace = await self._get_workspace_record(
            db=db,
            workspace_uuid=normalized_workspace_uuid,
        )
        return workspace, decision

    async def _get_workspace_record(
        self,
        *,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
    ) -> dict[str, Any]:
        workspace = await crud_workspaces.get(
            db=db,
            uuid=workspace_uuid,
            is_deleted=False,
            schema_to_select=WorkspaceRead,
        )
        if workspace is None:
            raise NotFoundException("Workspace not found")
        return workspace

    async def _get_workspace_application_information(
        self,
        db: AsyncSession,
        workspace_id: int,
        application_information_uuid: uuid_pkg.UUID | str,
    ) -> dict[str, Any]:
        application_information = await crud_application_information.get(
            db=db,
            workspace_id=workspace_id,
            uuid=application_information_uuid,
            is_deleted=False,
            schema_to_select=ApplicationInformationRead,
        )
        if application_information is None:
            raise NotFoundException("Application information not found")
        return application_information

    async def _get_application_information_contact(
        self,
        db: AsyncSession,
        application_information_id: int,
        contact_uuid: uuid_pkg.UUID | str,
    ) -> dict[str, Any]:
        contact = await crud_application_information_contacts.get(
            db=db,
            application_information_id=application_information_id,
            uuid=contact_uuid,
            is_deleted=False,
            schema_to_select=ApplicationInformationContactRecordRead,
        )
        if contact is None:
            raise NotFoundException("Application information contact not found")
        return contact

    @staticmethod
    async def _build_application_information_contact_read(
        db: AsyncSession,
        contact: dict[str, Any],
    ) -> dict[str, Any]:
        confirmation_actor_uuid: uuid_pkg.UUID | None = None
        confirmation_actor_id = contact.get("identity_confirmed_by")
        if isinstance(confirmation_actor_id, int):
            result = await db.execute(select(User.uuid).where(User.id == confirmation_actor_id))
            actor_uuid = result.scalar_one_or_none()
            if actor_uuid is not None:
                confirmation_actor_uuid = uuid_pkg.UUID(str(actor_uuid))

        first_name = contact.get("first_name")
        last_name = contact.get("last_name")
        identity_confirmed_at = contact.get("identity_confirmed_at")
        public_contact = {key: value for key, value in contact.items() if key != "identity_confirmed_by"}
        public_contact.update(
            {
                "identity_confirmed_by_user_uuid": confirmation_actor_uuid,
                "identity_confirmation_required": not (
                    isinstance(first_name, str)
                    and bool(first_name.strip())
                    and isinstance(last_name, str)
                    and bool(last_name.strip())
                    and identity_confirmed_at is not None
                ),
            }
        )
        return ApplicationInformationContactRead.model_validate(public_contact).model_dump(mode="json")

    async def _resolve_workspace_application_information_id(
        self,
        db: AsyncSession,
        workspace_id: int,
        application_information_uuid: uuid_pkg.UUID | str | None,
    ) -> int:
        if application_information_uuid is None:
            raise BadRequestException("Application is required")
        result = await db.execute(
            select(ApplicationInformation.id)
            .where(
                ApplicationInformation.workspace_id == workspace_id,
                ApplicationInformation.uuid == application_information_uuid,
                ApplicationInformation.is_deleted.is_(False),
                ApplicationInformation.deleted_at.is_(None),
            )
            .with_for_update()
        )
        application_information_id = result.scalar_one_or_none()
        if application_information_id is None:
            raise NotFoundException("Application information not found")
        return int(application_information_id)

    async def _resolve_workspace_application_information_uuid(
        self,
        db: AsyncSession,
        workspace_id: int,
        application_information_id: int | None,
        *,
        for_update: bool = False,
    ) -> uuid_pkg.UUID:
        if application_information_id is None:
            raise BadRequestException("Application is required")
        statement = select(ApplicationInformation.uuid).where(
            ApplicationInformation.id == application_information_id,
            ApplicationInformation.workspace_id == workspace_id,
            ApplicationInformation.is_deleted.is_(False),
            ApplicationInformation.deleted_at.is_(None),
        )
        if for_update:
            statement = statement.with_for_update()
        result = await db.execute(statement)
        application_information_uuid = result.scalar_one_or_none()
        if application_information_uuid is None:
            raise NotFoundException("Application information not found")
        return uuid_pkg.UUID(str(application_information_uuid))

    async def _get_workspace_rp_application(
        self,
        db: AsyncSession,
        workspace_id: int,
        rp_application_uuid: uuid_pkg.UUID | str,
    ) -> dict[str, Any]:
        rp_application = await crud_rp_applications.get(
            db=db,
            workspace_id=workspace_id,
            uuid=rp_application_uuid,
            is_deleted=False,
            schema_to_select=RPApplicationRead,
        )
        if rp_application is None:
            raise NotFoundException("RP application not found")
        rp_application = self._without_legacy_application_owner(rp_application)
        return await self._attach_rp_application_promotion_request_summary(
            db=db,
            rp_application=rp_application,
        )

    async def _get_application_rp_configuration(
        self,
        db: AsyncSession,
        workspace_id: int,
        application_information_id: int,
        rp_configuration_uuid: uuid_pkg.UUID | str,
    ) -> dict[str, Any]:
        configuration = await crud_rp_applications.get(
            db=db,
            workspace_id=workspace_id,
            application_information_id=application_information_id,
            uuid=rp_configuration_uuid,
            is_deleted=False,
            schema_to_select=RPApplicationRead,
        )
        if configuration is None:
            raise NotFoundException("RP configuration not found")
        return await self._attach_rp_application_promotion_request_summary(
            db=db,
            rp_application=self._without_legacy_application_owner(configuration),
        )

    async def _resolve_application_rp_configuration_access(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        application_information_uuid: uuid_pkg.UUID | str,
        rp_configuration_uuid: uuid_pkg.UUID | str,
        current_user: dict[str, Any],
        capability: Capability,
    ) -> tuple[dict[str, Any], ResourceScopeDecision, dict[str, Any]]:
        workspace, decision = await self._require_workspace_capability(
            db=db,
            workspace_uuid=workspace_uuid,
            current_user=current_user,
            capability=capability,
        )
        application_information = await self._get_workspace_application_information(
            db=db,
            workspace_id=workspace["id"],
            application_information_uuid=application_information_uuid,
        )
        configuration = await self._get_application_rp_configuration(
            db=db,
            workspace_id=workspace["id"],
            application_information_id=application_information["id"],
            rp_configuration_uuid=rp_configuration_uuid,
        )
        return workspace, decision, configuration

    def _get_workspace_rp_application_ibm_application_id(
        self,
        rp_application: dict[str, Any],
    ) -> str:
        ibm_application_id = str(rp_application.get("ibm_sv_application_id") or "").strip()
        if not ibm_application_id:
            raise CustomException(
                status_code=409,
                detail=RP_APPLICATION_USAGE_UNAVAILABLE_MESSAGE,
            )
        return ibm_application_id

    def _resolve_selected_date_range(self, selected_date: str | None) -> tuple[str | None, str | None]:
        normalized_date = str(selected_date or "").strip()
        if not normalized_date.isdigit():
            return None, None

        start_timestamp = int(normalized_date)
        if start_timestamp < 0:
            return None, None

        end_timestamp = start_timestamp + 86_400_000 - 1
        return str(start_timestamp), str(end_timestamp)

    def _normalize_workspace_rp_application_usage_summary(
        self,
        payload: dict[str, Any],
    ) -> dict[str, int]:
        raw_response = payload.get("response") if isinstance(payload.get("response"), dict) else payload
        if not isinstance(raw_response, dict):
            raw_response = {}

        total = self._coerce_int(raw_response.get("total"))
        succeeded = self._coerce_int(raw_response.get("succeeded") if "succeeded" in raw_response else raw_response.get("successful"))
        failed = self._coerce_int(raw_response.get("failed") if "failed" in raw_response else raw_response.get("unsuccessful"))

        if total is None:
            total = max((succeeded or 0) + (failed or 0), 0)

        if succeeded is None and failed is None:
            succeeded = total
            failed = 0
        elif succeeded is None:
            succeeded = max(total - (failed or 0), 0)
        elif failed is None:
            failed = max(total - succeeded, 0)

        assert succeeded is not None
        assert failed is not None

        return {
            "total": total,
            "succeeded": succeeded,
            "failed": failed,
        }

    def _coerce_int(self, value: Any) -> int | None:
        if isinstance(value, bool):
            return int(value)
        if isinstance(value, int):
            return value
        if isinstance(value, str):
            normalized_value = value.strip()
            if normalized_value.isdigit():
                return int(normalized_value)
        return None

    def _normalize_current_user_id(self, current_user: dict[str, Any]) -> int | None:
        raw_user_id = current_user.get("id")
        if raw_user_id is None or isinstance(raw_user_id, bool):
            return None
        if isinstance(raw_user_id, int):
            return raw_user_id

        normalized_user_id = str(raw_user_id).strip()
        if not normalized_user_id:
            return None

        try:
            return int(normalized_user_id)
        except ValueError:
            return None

    def _as_dict(self, value: Any) -> dict[str, Any]:
        if isinstance(value, dict):
            return value
        if hasattr(value, "model_dump"):
            dumped_value = value.model_dump(by_alias=True, exclude_none=True)
            if isinstance(dumped_value, dict):
                return dumped_value
        return dict(value)

    def _without_legacy_application_owner(
        self,
        application: dict[str, Any],
    ) -> dict[str, Any]:
        """Drop the retired owner snapshot while its legacy column remains."""

        sanitized = dict(application)
        sanitized.pop("application_owner", None)
        return sanitized

    def _validate_rp_application_promotion_request_target(
        self,
        rp_application: dict[str, Any],
    ) -> None:
        environment = str(rp_application.get("canada_login_environment") or "").strip().lower()
        if environment != PROMOTION_REQUEST_TARGET_ENVIRONMENT:
            raise BadRequestException("Production review is only supported for Production RP configurations")

    @staticmethod
    def _add_production_review_audit(
        *,
        db: AsyncSession,
        operation: str,
        current_user: dict[str, Any],
        workspace_uuid: uuid_pkg.UUID | str,
        rp_application_uuid: uuid_pkg.UUID | str,
        status: PromotionRequestStatus,
        event_time: datetime,
        has_external_reference: bool,
    ) -> None:
        actor_uuid_value = current_user.get("uuid")
        try:
            actor_uuid = uuid_pkg.UUID(str(actor_uuid_value)) if actor_uuid_value is not None else None
        except ValueError:
            actor_uuid = None
        event = {
            "eventName": f"production_{operation}",
            "eventVersion": 1,
            "hasExternalReference": has_external_reference,
            "rpConfigurationUuid": str(rp_application_uuid),
            "status": status,
            "timestamp": event_time.isoformat(),
            "workspaceUuid": str(workspace_uuid),
        }
        db.add(
            AuditLog(
                user="authorization_actor",
                user_uuid=actor_uuid,
                target="production_review",
                target_uuid=uuid_pkg.UUID(str(rp_application_uuid)),
                operation=operation,
                description=json.dumps(event, separators=(",", ":")),
                created_at=event_time,
            )
        )

    async def _get_rp_application_promotion_request_record(
        self,
        db: AsyncSession,
        rp_application_id: int,
        *,
        required: bool,
    ) -> dict[str, Any] | None:
        promotion_request = await crud_rp_application_promotion_requests.get(
            db=db,
            rp_application_id=rp_application_id,
            target_environment=PROMOTION_REQUEST_TARGET_ENVIRONMENT,
            is_deleted=False,
        )
        if promotion_request is None and required:
            raise NotFoundException("Production-review request not found")
        return promotion_request

    async def _build_rp_application_promotion_request_read(
        self,
        db: AsyncSession,
        promotion_request: dict[str, Any],
    ) -> dict[str, Any]:
        reviewed_by_user_uuid = None
        reviewed_by_user_id = promotion_request.get("reviewed_by_user_id")
        if isinstance(reviewed_by_user_id, int):
            reviewed_by_user = await crud_users.get(
                db=db,
                id=reviewed_by_user_id,
                is_deleted=False,
            )
            if reviewed_by_user is not None:
                reviewed_by_user_uuid = reviewed_by_user.get("uuid")

        review_status = promotion_request.get("review_status")
        if review_status not in {"pending", "approved", "rejected"}:
            raise BadRequestException("Historical Production-review record requires reconciliation")

        return RPApplicationPromotionRequestRead(
            target_environment=promotion_request["target_environment"],
            status=review_status,
            external_reference=promotion_request.get("external_reference"),
            reviewed_by_user_uuid=reviewed_by_user_uuid,
            reviewed_by_team=promotion_request.get("reviewed_by_team"),
            requested_at=promotion_request["requested_at"],
            reviewed_at=promotion_request.get("reviewed_at"),
            decided_at=promotion_request.get("decided_at"),
            created_at=promotion_request["created_at"],
            updated_at=promotion_request.get("updated_at"),
        ).model_dump()

    async def _build_application_rp_configuration_promotion_request_read(
        self,
        db: AsyncSession,
        workspace_id: int,
        application_information_uuid: uuid_pkg.UUID | str,
        target: dict[str, Any],
    ) -> dict[str, Any]:
        self._validate_rp_application_promotion_request_target(rp_application=target)
        promotion_request = await self._get_rp_application_promotion_request_record(
            db=db,
            rp_application_id=target["id"],
            required=True,
        )
        assert promotion_request is not None
        promotion_read = await self._build_rp_application_promotion_request_read(
            db=db,
            promotion_request=promotion_request,
        )

        source_id_result = await db.execute(
            select(RPApplication.source_rp_configuration_id).where(
                RPApplication.id == target["id"],
                RPApplication.workspace_id == workspace_id,
                RPApplication.is_deleted.is_(False),
            )
        )
        source_id = source_id_result.scalar_one_or_none()
        source_uuid = None
        if isinstance(source_id, int):
            source_uuid_result = await db.execute(
                select(RPApplication.uuid).where(
                    RPApplication.id == source_id,
                    RPApplication.workspace_id == workspace_id,
                    RPApplication.application_information_id == target["application_information_id"],
                    RPApplication.is_deleted.is_(False),
                )
            )
            source_uuid = source_uuid_result.scalar_one_or_none()

        return ApplicationRPConfigurationPromotionRequestRead(
            **promotion_read,
            application_information_uuid=uuid_pkg.UUID(str(application_information_uuid)),
            source_rp_configuration_uuid=source_uuid,
            target_rp_configuration_uuid=target["uuid"],
            target_configuration_name=target["configuration_name"],
        ).model_dump()

    async def _attach_rp_application_promotion_request_summary(
        self,
        db: AsyncSession,
        rp_application: dict[str, Any],
    ) -> dict[str, Any]:
        rp_application_data = dict(rp_application)
        environment = str(rp_application_data.get("canada_login_environment") or "").strip().lower()
        if environment != PROMOTION_REQUEST_TARGET_ENVIRONMENT:
            return rp_application_data

        promotion_request = await self._get_rp_application_promotion_request_record(
            db=db,
            rp_application_id=rp_application_data["id"],
            required=False,
        )
        if promotion_request is None:
            return rp_application_data
        if promotion_request.get("review_status") not in {"pending", "approved", "rejected"}:
            rp_application_data["production_review_reconciliation_required"] = True
            return rp_application_data

        promotion_request_read = await self._build_rp_application_promotion_request_read(
            db=db,
            promotion_request=promotion_request,
        )
        rp_application_data["production_review_status"] = promotion_request_read["status"]
        rp_application_data["production_review_reconciliation_required"] = False
        return rp_application_data

    async def _ensure_slug_available(
        self,
        db: AsyncSession,
        slug: str,
        current_workspace_uuid: uuid_pkg.UUID | str | None = None,
    ) -> None:
        existing_workspace = await crud_workspaces.get(
            db=db,
            slug=slug,
            is_deleted=False,
        )
        if existing_workspace is None:
            return

        existing_uuid = existing_workspace.get("uuid")
        if current_workspace_uuid is not None and str(existing_uuid) == str(current_workspace_uuid):
            return

        raise DuplicateValueException("Workspace slug not available")

    def _normalize_slug(self, slug: str | None, fallback_name: str) -> str:
        normalized_slug = slugify(slug or fallback_name)
        if not normalized_slug:
            raise BadRequestException("Workspace slug could not be generated")
        return normalized_slug
