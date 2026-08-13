import json
import logging
import uuid as uuid_pkg
from datetime import UTC, datetime
from typing import Any, cast

from pydantic import ValidationError
from sqlalchemy import select
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
from ..core.utils.slugify import slugify
from ..models.application_information import ApplicationInformation
from ..models.audit_log import AuditLog
from ..models.rp_application import RPApplication
from ..models.user import User
from ..repositories.crud_application_information import crud_application_information
from ..repositories.crud_application_information_contacts import crud_application_information_contacts
from ..repositories.crud_application_information_review_checklists import (
    crud_application_information_review_checklists,
)
from ..repositories.crud_application_information_review_notes import (
    crud_application_information_review_notes,
)
from ..repositories.crud_departments import crud_departments
from ..repositories.crud_rp_application_promotion_requests import crud_rp_application_promotion_requests
from ..repositories.crud_rp_applications import crud_rp_applications
from ..repositories.crud_users import crud_users
from ..repositories.crud_workspaces import crud_workspaces
from ..schemas.application_information import (
    ApplicationInformationContactCreate,
    ApplicationInformationContactCreateInternal,
    ApplicationInformationContactRead,
    ApplicationInformationContactRecordRead,
    ApplicationInformationContactUpdate,
    ApplicationInformationContactUpdateInternal,
    ApplicationInformationCreate,
    ApplicationInformationCreateInternal,
    ApplicationInformationRead,
    ApplicationInformationReviewChecklistSummaryCreateInternal,
    ApplicationInformationReviewChecklistSummaryRead,
    ApplicationInformationReviewChecklistSummaryRecordRead,
    ApplicationInformationReviewChecklistSummaryWrite,
    ApplicationInformationReviewContextRead,
    ApplicationInformationReviewNoteCreate,
    ApplicationInformationReviewNoteCreateInternal,
    ApplicationInformationReviewNoteRead,
    ApplicationInformationReviewNoteRecordRead,
    ApplicationInformationUpdate,
)
from ..schemas.onboarding import (
    OnboardingLifecycleTransitionRequest,
    WorkspaceRPApplicationOnboardingLifecycleTransitionRequest,
)
from ..schemas.rp_application import (
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
    RPApplicationUpdateInternal,
    WorkspaceRPApplicationConfigurationRead,
    WorkspaceRPApplicationRegistrationAnswers,
    WorkspaceRPApplicationRegistrationBase,
    WorkspaceRPApplicationRegistrationCreate,
    WorkspaceRPApplicationRegistrationDraftCreate,
    WorkspaceRPApplicationRegistrationDraftPatch,
    WorkspaceRPApplicationRegistrationDraftRead,
    WorkspaceRPApplicationRegistrationSubmissionRead,
    WorkspaceRPApplicationRegistrationUpdate,
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
ONBOARDING_STATE_TRANSITIONS: dict[str, set[str]] = {
    "draft": {"submitted"},
    "submitted": {"under_review"},
    "under_review": {"approved"},
    "approved": {"launched"},
    "launched": set(),
}
REVIEW_ONLY_ONBOARDING_STATES = {"under_review", "approved", "launched"}
PRODUCTION_REVIEW_TRACE_REQUIRED_ONBOARDING_STATES = {"approved", "launched"}
PROMOTION_REQUEST_TARGET_ENVIRONMENT: PromotionRequestTargetEnvironment = "production"
PROMOTION_REQUEST_REVIEW_TRACKED_STATUS: PromotionRequestStatus = "review_tracked"
PROMOTION_REQUEST_APPROVED_STATUSES = {"approved", "launched"}
APPLICATION_INFORMATION_REVIEW_WRITE_STATES = {"submitted", "under_review"}
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
    "onboarding_state",
    "registration_draft_version",
    "registration_last_completed_step",
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
PROGRESSION_REUSABLE_ANSWER_FIELDS = (
    "client_type",
    "supports_authorization_code_flow",
    "client_auth_method",
    "requested_scopes",
    "sector_identifier",
    "shares_pairwise_identifiers",
    "pkce_supported",
    "pkce_algorithms",
    "pkce_other_algorithm",
    "request_signing_supported",
    "request_signing_targets",
    "request_signing_algorithms",
    "request_signing_other_algorithm",
    "request_signing_roadmap",
    "request_signing_revisit_on",
    "signature_validation_supported",
    "signature_validation_targets",
    "signature_validation_algorithms",
    "signature_validation_other_algorithm",
    "signature_validation_roadmap",
    "signature_validation_revisit_on",
    "request_encryption_supported",
    "request_encryption_targets",
    "request_encryption_key_management_algorithms",
    "request_encryption_other_key_management_algorithm",
    "request_encryption_content_algorithms",
    "request_encryption_other_content_algorithm",
    "request_encryption_roadmap",
    "request_encryption_revisit_on",
    "message_decryption_supported",
    "message_decryption_targets",
    "message_decryption_key_management_algorithms",
    "message_decryption_other_key_management_algorithm",
    "message_decryption_content_algorithms",
    "message_decryption_other_content_algorithm",
    "message_decryption_roadmap",
    "message_decryption_revisit_on",
)
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

    async def transition_workspace_onboarding_state(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        payload: OnboardingLifecycleTransitionRequest,
        current_user: dict[str, Any],
    ) -> dict[str, Any]:
        workspace, _ = await self._require_workspace_capability(
            db=db,
            workspace_uuid=workspace_uuid,
            current_user=current_user,
            capability=(
                Capability.PRODUCTION_REVIEW if payload.target_state in REVIEW_ONLY_ONBOARDING_STATES else Capability.WORKSPACE_METADATA_WRITE
            ),
        )
        current_state = self._normalize_onboarding_state(workspace.get("onboarding_state"))
        target_state = payload.target_state

        if current_state == target_state:
            return workspace

        self._validate_onboarding_state_transition(
            current_state=current_state,
            target_state=target_state,
        )

        await crud_workspaces.update(
            db=db,
            object=self._build_onboarding_transition_update(target_state=target_state),
            uuid=workspace_uuid,
        )
        return await self._get_workspace_record(db=db, workspace_uuid=workspace_uuid)

    async def transition_workspace_application_information_onboarding_state(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        application_information_uuid: uuid_pkg.UUID | str,
        payload: OnboardingLifecycleTransitionRequest,
        current_user: dict[str, Any],
    ) -> dict[str, Any]:
        workspace, _ = await self._require_workspace_capability(
            db=db,
            workspace_uuid=workspace_uuid,
            current_user=current_user,
            capability=(
                Capability.PRODUCTION_REVIEW if payload.target_state in REVIEW_ONLY_ONBOARDING_STATES else Capability.APPLICATION_INFORMATION_WRITE
            ),
        )
        application_information = await self._get_workspace_application_information(
            db=db,
            workspace_id=workspace["id"],
            application_information_uuid=application_information_uuid,
        )
        current_state = self._normalize_onboarding_state(application_information.get("onboarding_state"))
        target_state = payload.target_state

        if current_state == target_state:
            return application_information

        self._validate_onboarding_state_transition(
            current_state=current_state,
            target_state=target_state,
        )

        await crud_application_information.update(
            db=db,
            object=self._build_onboarding_transition_update(target_state=target_state),
            uuid=application_information_uuid,
        )
        return await self._get_workspace_application_information(
            db=db,
            workspace_id=workspace["id"],
            application_information_uuid=application_information_uuid,
        )

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

    async def get_workspace_application_information_review_context(
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
            capability=Capability.ONBOARDING_OVERSIGHT_READ,
        )
        application_information = await self._get_workspace_application_information(
            db=db,
            workspace_id=workspace["id"],
            application_information_uuid=application_information_uuid,
        )
        return await self._build_application_information_review_context(
            db=db,
            application_information_id=application_information["id"],
        )

    async def add_workspace_application_information_review_note(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        application_information_uuid: uuid_pkg.UUID | str,
        payload: ApplicationInformationReviewNoteCreate,
        current_user: dict[str, Any],
    ) -> dict[str, Any]:
        workspace, _ = await self._require_workspace_capability(
            db=db,
            workspace_uuid=workspace_uuid,
            current_user=current_user,
            capability=Capability.PRODUCTION_REVIEW,
        )
        application_information = await self._get_workspace_application_information(
            db=db,
            workspace_id=workspace["id"],
            application_information_uuid=application_information_uuid,
        )
        self._validate_application_information_review_write_state(
            application_information=application_information,
        )
        note = await self._create_application_information_review_note(
            db=db,
            application_information_id=application_information["id"],
            author_id=self._normalize_current_user_id(current_user),
            body=payload.body,
        )
        return note

    async def upsert_workspace_application_information_review_checklist(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        application_information_uuid: uuid_pkg.UUID | str,
        payload: ApplicationInformationReviewChecklistSummaryWrite,
        current_user: dict[str, Any],
    ) -> dict[str, Any]:
        workspace, _ = await self._require_workspace_capability(
            db=db,
            workspace_uuid=workspace_uuid,
            current_user=current_user,
            capability=Capability.PRODUCTION_REVIEW,
        )
        application_information = await self._get_workspace_application_information(
            db=db,
            workspace_id=workspace["id"],
            application_information_uuid=application_information_uuid,
        )
        self._validate_application_information_review_write_state(
            application_information=application_information,
        )

        existing_summary = await crud_application_information_review_checklists.get(
            db=db,
            application_information_id=application_information["id"],
            is_deleted=False,
            schema_to_select=ApplicationInformationReviewChecklistSummaryRecordRead,
        )
        reviewer_id = self._normalize_current_user_id(current_user)
        summary_data = payload.model_dump(exclude_none=False)
        if existing_summary is None:
            await crud_application_information_review_checklists.create(
                db=db,
                object=ApplicationInformationReviewChecklistSummaryCreateInternal(
                    application_information_id=application_information["id"],
                    reviewed_by_user_id=reviewer_id,
                    **summary_data,
                ),
                schema_to_select=ApplicationInformationReviewChecklistSummaryRecordRead,
            )
        else:
            await crud_application_information_review_checklists.update(
                db=db,
                object={
                    **summary_data,
                    "reviewed_by_user_id": reviewer_id,
                    "updated_at": datetime.now(UTC),
                },
                uuid=existing_summary["uuid"],
            )

        trimmed_rationale = str(payload.rationale or "").strip()
        if trimmed_rationale:
            await self._create_application_information_review_note(
                db=db,
                application_information_id=application_information["id"],
                author_id=reviewer_id,
                body=trimmed_rationale,
            )

        refreshed_summary = await crud_application_information_review_checklists.get(
            db=db,
            application_information_id=application_information["id"],
            is_deleted=False,
            schema_to_select=ApplicationInformationReviewChecklistSummaryRecordRead,
        )
        if refreshed_summary is None:
            raise NotFoundException("Application information review checklist summary not found")
        user_lookup = await self._load_users_by_id(
            db=db,
            user_ids={reviewer_id} if reviewer_id is not None else set(),
        )
        return self._build_application_information_review_checklist_read(
            checklist_summary=refreshed_summary,
            users_by_id=user_lookup,
        )

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
            capability=self._metadata_read_capability(
                current_user=current_user,
                partner_capability=Capability.RP_CONFIGURATION_READ,
            ),
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
            onboarding_state="draft",
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
    def _build_registration_submission_read(
        *,
        workspace_uuid: uuid_pkg.UUID | str,
        rp_application: dict[str, Any],
    ) -> dict[str, Any]:
        answers = rp_application.get("oidc_registration_payload") or {}
        read = WorkspaceRPApplicationRegistrationSubmissionRead(
            workspace_uuid=uuid_pkg.UUID(str(workspace_uuid)),
            rp_application_uuid=rp_application["uuid"],
            onboarding_state="submitted",
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
        """Create one new target draft from one explicitly selected source."""

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
            registration_creation_key=progression_creation_key,
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
            if not self._progression_creation_matches(
                existing=existing,
                source_rp_configuration_id=source["id"],
                existing_source_rp_configuration_id=existing_source_id,
                workspace_id=workspace["id"],
                application_information_id=application_information["id"],
                payload=payload,
            ):
                raise RegistrationDraftConflictException(
                    code="rp_configuration_progression_creation_conflict",
                    message="The progression creation key is already in use.",
                )
            return self._build_rp_configuration_progression_read(
                workspace_uuid=workspace["uuid"],
                application_information_uuid=application_information["uuid"],
                source=source,
                target=existing,
            )

        source_answers = dict(source.get("oidc_registration_payload") or {})
        target_answers = {
            key: source_answers[key] for key in PROGRESSION_REUSABLE_ANSWER_FIELDS if key in source_answers and source_answers[key] is not None
        }
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
                    registration_creation_key=progression_creation_key,
                    registration_draft_version=1,
                    registration_last_completed_step="basics",
                    created_by=current_user.get("id"),
                ),
                commit=False,
                schema_to_select=RPApplicationRead,
            )
            if target is None:
                raise NotFoundException("Failed to create RP configuration progression target")
            if payload.target_environment == "production":
                await crud_rp_application_promotion_requests.create(
                    db=db,
                    object=RPApplicationPromotionRequestCreateInternal(
                        rp_application_id=target["id"],
                        target_environment="production",
                        status=PROMOTION_REQUEST_REVIEW_TRACKED_STATUS,
                        requested_at=datetime.now(UTC),
                    ),
                    commit=False,
                )
            await db.commit()
        except IntegrityError:
            await db.rollback()
            existing = await crud_rp_applications.get(
                db=db,
                registration_creation_key=progression_creation_key,
                is_deleted=False,
                schema_to_select=RPApplicationRead,
            )
            if existing is None:
                raise RegistrationDraftConflictException(
                    code="rp_configuration_progression_creation_conflict",
                    message="The RP configuration progression could not be created.",
                ) from None
            source_id_result = await db.execute(
                select(RPApplication.source_rp_configuration_id).where(
                    RPApplication.id == existing["id"],
                    RPApplication.is_deleted.is_(False),
                )
            )
            if not self._progression_creation_matches(
                existing=existing,
                source_rp_configuration_id=source["id"],
                existing_source_rp_configuration_id=source_id_result.scalar_one_or_none(),
                workspace_id=workspace["id"],
                application_information_id=application_information["id"],
                payload=payload,
            ):
                raise RegistrationDraftConflictException(
                    code="rp_configuration_progression_creation_conflict",
                    message="The progression creation key is already in use.",
                ) from None
            target = existing

        self._log_registration_operational_event(
            event="progression_create",
            current_user=current_user,
            workspace_uuid=workspace["uuid"],
            application_information_uuid=application_information["uuid"],
            rp_application_uuid=target["uuid"],
            step_id="basics",
            save_mode="completeStep",
            changed_field_names=[
                "configuration_name",
                "source_rp_configuration_uuid",
                "target_environment",
                *sorted(target_answers),
            ],
            result="success",
            correlation_id=correlation_id,
        )
        return self._build_rp_configuration_progression_read(
            workspace_uuid=workspace["uuid"],
            application_information_uuid=application_information["uuid"],
            source=source,
            target=target,
        )

    @staticmethod
    def _progression_creation_matches(
        *,
        existing: dict[str, Any],
        source_rp_configuration_id: int,
        existing_source_rp_configuration_id: int | None,
        workspace_id: int,
        application_information_id: int,
        payload: ApplicationRPConfigurationProgressionCreate,
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
    def _build_rp_configuration_progression_read(
        *,
        workspace_uuid: uuid_pkg.UUID | str,
        application_information_uuid: uuid_pkg.UUID | str,
        source: dict[str, Any],
        target: dict[str, Any],
    ) -> dict[str, Any]:
        source_environment = str(source["canada_login_environment"])
        target_environment = str(target["canada_login_environment"])
        read = ApplicationRPConfigurationProgressionRead(
            workspace_uuid=uuid_pkg.UUID(str(workspace_uuid)),
            application_information_uuid=uuid_pkg.UUID(str(application_information_uuid)),
            source_rp_configuration_uuid=source["uuid"],
            source_configuration_name=source["configuration_name"],
            source_partner_environment=source.get("partner_environment"),
            source_environment=cast(CanadaLoginEnvironment, source_environment),
            target_rp_configuration_uuid=target["uuid"],
            target_configuration_name=target["configuration_name"],
            target_partner_environment=target.get("partner_environment"),
            target_environment=cast(PromotionRequestTargetEnvironment, target_environment),
            target_registration_draft_version=int(target.get("registration_draft_version") or 0),
            target_registration_last_completed_step=cast(
                RegistrationDataStep | None,
                target.get("registration_last_completed_step"),
            ),
            self_serve=target_environment == "staging",
            promotion_status=(PROMOTION_REQUEST_REVIEW_TRACKED_STATUS if target_environment == "production" else None),
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
        if self._normalize_onboarding_state(rp_application.get("onboarding_state")) != "draft":
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
        if self._normalize_onboarding_state(existing.get("onboarding_state")) != "draft":
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
                onboarding_state="draft",
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
        workspace, decision = await self._require_workspace_capability(
            db=db,
            workspace_uuid=workspace_uuid,
            current_user=current_user,
            capability=self._metadata_read_capability(
                current_user=current_user,
                partner_capability=Capability.RP_CONFIGURATION_READ,
            ),
        )
        application = await self._get_workspace_rp_application(
            db=db,
            workspace_id=workspace["id"],
            rp_application_uuid=rp_application_uuid,
        )
        if decision.role is CanonicalRoleCode.CL_ADMIN:
            return self._redact_cl_admin_rp_application_metadata(application)
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

    async def transition_application_rp_configuration_onboarding_state(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        application_information_uuid: uuid_pkg.UUID | str,
        rp_configuration_uuid: uuid_pkg.UUID | str,
        payload: WorkspaceRPApplicationOnboardingLifecycleTransitionRequest,
        current_user: dict[str, Any],
        correlation_id: str | None = None,
    ) -> dict[str, Any]:
        await self._resolve_application_rp_configuration_access(
            db=db,
            workspace_uuid=workspace_uuid,
            application_information_uuid=application_information_uuid,
            rp_configuration_uuid=rp_configuration_uuid,
            current_user=current_user,
            capability=(Capability.PRODUCTION_REVIEW if payload.target_state in REVIEW_ONLY_ONBOARDING_STATES else Capability.RP_CONFIGURATION_WRITE),
        )
        return await self.transition_workspace_rp_application_onboarding_state(
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
            onboarding_state=application.get("onboarding_state"),
            promotion_status=application.get("promotion_status"),
            registration_draft_version=int(application.get("registration_draft_version") or 0),
            registration_last_completed_step=application.get("registration_last_completed_step"),
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
            capability=Capability.PROMOTION_REQUEST_WRITE,
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
            capability=Capability.PROMOTION_REQUEST_WRITE,
        )
        rp_application = await self._get_workspace_rp_application(
            db=db,
            workspace_id=workspace["id"],
            rp_application_uuid=rp_application_uuid,
        )
        self._validate_rp_application_promotion_request_target(rp_application=rp_application)

        payload_data = payload.model_dump(exclude_unset=True)
        promotion_request = await self._get_rp_application_promotion_request_record(
            db=db,
            rp_application_id=rp_application["id"],
            required=False,
        )
        request_time = datetime.now(UTC)

        if promotion_request is None:
            await crud_rp_application_promotion_requests.create(
                db=db,
                object=RPApplicationPromotionRequestCreateInternal(
                    rp_application_id=rp_application["id"],
                    target_environment=PROMOTION_REQUEST_TARGET_ENVIRONMENT,
                    status=PROMOTION_REQUEST_REVIEW_TRACKED_STATUS,
                    external_reference=payload.external_reference,
                    requested_at=request_time,
                ),
            )
        else:
            update_data: dict[str, Any] = {
                "status": PROMOTION_REQUEST_REVIEW_TRACKED_STATUS,
                "requested_at": request_time,
                "reviewed_by_user_id": None,
                "reviewed_by_team": None,
                "reviewed_at": None,
                "decided_at": None,
                "updated_at": request_time,
            }
            if "external_reference" in payload_data:
                update_data["external_reference"] = payload.external_reference

            await crud_rp_application_promotion_requests.update(
                db=db,
                object=update_data,
                id=promotion_request["id"],
            )

        return await self._get_workspace_rp_application(
            db=db,
            workspace_id=workspace["id"],
            rp_application_uuid=rp_application_uuid,
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
        payload_data = payload.model_dump(exclude_unset=True)
        next_external_reference = payload.external_reference
        if "external_reference" not in payload_data:
            next_external_reference = promotion_request.get("external_reference")
        if payload.status in PROMOTION_REQUEST_APPROVED_STATUSES and not str(next_external_reference or "").strip():
            raise BadRequestException("Approved production review outcomes require an external reference")

        decision_time = datetime.now(UTC)
        update_data: dict[str, Any] = {
            "status": payload.status,
            "reviewed_by_user_id": self._normalize_current_user_id(current_user),
            "reviewed_at": decision_time,
            "decided_at": decision_time,
            "updated_at": decision_time,
        }
        if "external_reference" in payload_data:
            update_data["external_reference"] = payload.external_reference
        if "reviewed_by_team" in payload_data:
            update_data["reviewed_by_team"] = payload.reviewed_by_team

        await crud_rp_application_promotion_requests.update(
            db=db,
            object=update_data,
            id=promotion_request["id"],
        )

        return await self._get_workspace_rp_application(
            db=db,
            workspace_id=workspace["id"],
            rp_application_uuid=rp_application_uuid,
        )

    async def transition_workspace_rp_application_onboarding_state(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        rp_application_uuid: uuid_pkg.UUID | str,
        payload: WorkspaceRPApplicationOnboardingLifecycleTransitionRequest,
        current_user: dict[str, Any],
        correlation_id: str | None = None,
    ) -> dict[str, Any]:
        try:
            workspace, _ = await self._require_workspace_capability(
                db=db,
                workspace_uuid=workspace_uuid,
                current_user=current_user,
                capability=(
                    Capability.PRODUCTION_REVIEW if payload.target_state in REVIEW_ONLY_ONBOARDING_STATES else Capability.RP_CONFIGURATION_WRITE
                ),
            )
        except ForbiddenException:
            if payload.target_state == "submitted":
                self._log_registration_operational_event(
                    event="final_submit",
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
        current_state = self._normalize_onboarding_state(rp_application.get("onboarding_state"))
        target_state = payload.target_state

        if current_state == target_state:
            if target_state == "submitted":
                return self._build_registration_submission_read(
                    workspace_uuid=workspace["uuid"],
                    rp_application=rp_application,
                )
            return rp_application

        self._validate_onboarding_state_transition(
            current_state=current_state,
            target_state=target_state,
        )

        if target_state == "submitted":
            application_information_uuid = await self._resolve_workspace_application_information_uuid(
                db=db,
                workspace_id=workspace["id"],
                application_information_id=rp_application.get("application_information_id"),
            )
            current_version = int(rp_application.get("registration_draft_version") or 0)
            if payload.expected_draft_version != current_version:
                self._log_registration_operational_event(
                    event="final_submit",
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
                    event="final_submit",
                    current_user=current_user,
                    workspace_uuid=workspace["uuid"],
                    application_information_uuid=application_information_uuid,
                    rp_application_uuid=rp_application_uuid,
                    result="invalid",
                    correlation_id=correlation_id,
                )
                raise BadRequestException("The registration questionnaire must be complete and valid before submission") from exc

            update_object = self._build_onboarding_transition_update(target_state=target_state)
            update_object.update(
                {
                    "registration_draft_version": current_version + 1,
                    "registration_last_completed_step": "encryption",
                }
            )
            try:
                updated = await crud_rp_applications.update(
                    db=db,
                    object=update_object,
                    workspace_id=workspace["id"],
                    uuid=rp_application_uuid,
                    onboarding_state="draft",
                    registration_draft_version=current_version,
                    is_deleted=False,
                    return_columns=REGISTRATION_UPDATE_RETURN_COLUMNS,
                    one_or_none=True,
                )
            except NoResultFound:
                updated = None
            if updated is None:
                self._log_registration_operational_event(
                    event="final_submit",
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
            self._log_registration_operational_event(
                event="final_submit",
                current_user=current_user,
                workspace_uuid=workspace["uuid"],
                application_information_uuid=application_information_uuid,
                rp_application_uuid=rp_application_uuid,
                result="success",
                correlation_id=correlation_id,
            )
            return self._build_registration_submission_read(
                workspace_uuid=workspace["uuid"],
                rp_application=updated,
            )

        await self._validate_rp_application_review_traceability(
            db=db,
            rp_application=rp_application,
            target_state=target_state,
        )

        await crud_rp_applications.update(
            db=db,
            object=self._build_onboarding_transition_update(target_state=target_state),
            uuid=rp_application_uuid,
        )
        return await self._get_workspace_rp_application(
            db=db,
            workspace_id=workspace["id"],
            rp_application_uuid=rp_application_uuid,
        )

    async def update_workspace_rp_application(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        rp_application_uuid: uuid_pkg.UUID | str,
        payload: WorkspaceRPApplicationRegistrationUpdate,
        current_user: dict[str, Any],
    ) -> dict[str, Any]:
        workspace, _ = await self._require_workspace_capability(
            db=db,
            workspace_uuid=workspace_uuid,
            current_user=current_user,
            capability=Capability.RP_CONFIGURATION_WRITE,
        )
        existing = await self._get_workspace_rp_application(
            db=db,
            workspace_id=workspace["id"],
            rp_application_uuid=rp_application_uuid,
        )
        update_data = payload.model_dump(exclude_unset=True, mode="json")
        if not update_data:
            return existing

        application_information_uuid = update_data.pop("application_information_uuid", None)
        application_information_id: int | None = existing.get("application_information_id")
        if application_information_uuid is not None:
            application_information_id = await self._resolve_workspace_application_information_id(
                db=db,
                workspace_id=workspace["id"],
                application_information_uuid=application_information_uuid,
            )

        current_payload = dict(existing.get("oidc_registration_payload") or {})
        current_payload.update(update_data)
        update_object = RPApplicationUpdateInternal(
            workspace_id=workspace["id"],
            department_id=workspace["department_id"],
            application_information_id=application_information_id,
            dnr_app_name=current_payload.get("service_name_en") or existing.get("dnr_app_name"),
            canada_login_environment=current_payload.get("canada_login_environment") or existing.get("canada_login_environment"),
            status=existing.get("status"),
            oidc_registration_payload=current_payload,
            updated_at=datetime.now(UTC),
        )
        await crud_rp_applications.update(
            db=db,
            object=update_object.model_dump(exclude_none=True),
            uuid=rp_application_uuid,
        )
        return await self._get_workspace_rp_application(
            db=db,
            workspace_id=workspace["id"],
            rp_application_uuid=rp_application_uuid,
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

    async def get_workspace_rp_application_audit_events(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        rp_application_uuid: uuid_pkg.UUID | str,
        current_user: dict[str, Any],
        ibm_sv_admin_service: IBMVerifyAdminService,
        selected_date: str | None = None,
        size: int = 25,
    ) -> dict[str, Any]:
        workspace, decision = await self._require_workspace_capability(
            db=db,
            workspace_uuid=workspace_uuid,
            current_user=current_user,
            capability=Capability.PARTNER_AUDIT_READ,
        )
        rp_application = await self._get_workspace_rp_application(
            db=db,
            workspace_id=workspace["id"],
            rp_application_uuid=rp_application_uuid,
        )
        ibm_application_id = self._get_workspace_rp_application_ibm_application_id(rp_application)
        from_date, to_date = self._resolve_selected_date_range(selected_date)
        payload = await ibm_sv_admin_service.get_application_audit_trail(
            application_id=ibm_application_id,
            from_date=from_date,
            to_date=to_date,
            size=self._validate_audit_size(size),
        )
        return self._redact_read_only_audit_payload(payload) if decision.role is CanonicalRoleCode.READ_ONLY else payload

    async def get_application_rp_configuration_audit_events(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        application_information_uuid: uuid_pkg.UUID | str,
        rp_configuration_uuid: uuid_pkg.UUID | str,
        current_user: dict[str, Any],
        ibm_sv_admin_service: IBMVerifyAdminService,
        selected_date: str | None = None,
        size: int = 25,
    ) -> dict[str, Any]:
        _, decision, configuration = await self._resolve_application_rp_configuration_access(
            db=db,
            workspace_uuid=workspace_uuid,
            application_information_uuid=application_information_uuid,
            rp_configuration_uuid=rp_configuration_uuid,
            current_user=current_user,
            capability=Capability.PARTNER_AUDIT_READ,
        )
        ibm_application_id = self._get_workspace_rp_application_ibm_application_id(configuration)
        from_date, to_date = self._resolve_selected_date_range(selected_date)
        payload = await ibm_sv_admin_service.get_application_audit_trail(
            application_id=ibm_application_id,
            from_date=from_date,
            to_date=to_date,
            size=self._validate_audit_size(size),
        )
        return self._redact_read_only_audit_payload(payload) if decision.role is CanonicalRoleCode.READ_ONLY else payload

    async def get_workspace_rp_application_audit_events_search_after(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        rp_application_uuid: uuid_pkg.UUID | str,
        current_user: dict[str, Any],
        ibm_sv_admin_service: IBMVerifyAdminService,
        selected_date: str | None = None,
        size: int = 25,
        search_after: str | None = None,
    ) -> dict[str, Any]:
        workspace, decision = await self._require_workspace_capability(
            db=db,
            workspace_uuid=workspace_uuid,
            current_user=current_user,
            capability=Capability.PARTNER_AUDIT_READ,
        )
        rp_application = await self._get_workspace_rp_application(
            db=db,
            workspace_id=workspace["id"],
            rp_application_uuid=rp_application_uuid,
        )
        ibm_application_id = self._get_workspace_rp_application_ibm_application_id(rp_application)
        from_date, to_date = self._resolve_selected_date_range(selected_date)
        payload = await ibm_sv_admin_service.get_application_audit_trail_search_after(
            application_id=ibm_application_id,
            from_date=from_date,
            to_date=to_date,
            size=self._validate_audit_size(size),
            search_after=search_after,
        )
        return self._redact_read_only_audit_payload(payload) if decision.role is CanonicalRoleCode.READ_ONLY else payload

    async def get_application_rp_configuration_audit_events_search_after(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        application_information_uuid: uuid_pkg.UUID | str,
        rp_configuration_uuid: uuid_pkg.UUID | str,
        current_user: dict[str, Any],
        ibm_sv_admin_service: IBMVerifyAdminService,
        selected_date: str | None = None,
        size: int = 25,
        search_after: str | None = None,
    ) -> dict[str, Any]:
        _, decision, configuration = await self._resolve_application_rp_configuration_access(
            db=db,
            workspace_uuid=workspace_uuid,
            application_information_uuid=application_information_uuid,
            rp_configuration_uuid=rp_configuration_uuid,
            current_user=current_user,
            capability=Capability.PARTNER_AUDIT_READ,
        )
        ibm_application_id = self._get_workspace_rp_application_ibm_application_id(configuration)
        from_date, to_date = self._resolve_selected_date_range(selected_date)
        payload = await ibm_sv_admin_service.get_application_audit_trail_search_after(
            application_id=ibm_application_id,
            from_date=from_date,
            to_date=to_date,
            size=self._validate_audit_size(size),
            search_after=search_after,
        )
        return self._redact_read_only_audit_payload(payload) if decision.role is CanonicalRoleCode.READ_ONLY else payload

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

    async def _build_application_information_review_context(
        self,
        db: AsyncSession,
        application_information_id: int,
    ) -> dict[str, Any]:
        notes_data = await crud_application_information_review_notes.get_multi(
            db=db,
            application_information_id=application_information_id,
            is_deleted=False,
            schema_to_select=ApplicationInformationReviewNoteRecordRead,
        )
        notes = notes_data.get("data", [])
        checklist_summary = await crud_application_information_review_checklists.get(
            db=db,
            application_information_id=application_information_id,
            is_deleted=False,
            schema_to_select=ApplicationInformationReviewChecklistSummaryRecordRead,
        )

        user_ids: set[int] = set()
        for note in notes:
            author_id = note.get("author_id")
            if isinstance(author_id, int):
                user_ids.add(author_id)
        reviewed_by_user_id = checklist_summary.get("reviewed_by_user_id") if isinstance(checklist_summary, dict) else None
        if isinstance(reviewed_by_user_id, int):
            user_ids.add(reviewed_by_user_id)

        users_by_id = await self._load_users_by_id(db=db, user_ids=user_ids)
        note_reads = [
            self._build_application_information_review_note_read(
                note=note,
                users_by_id=users_by_id,
            )
            for note in sorted(
                notes,
                key=lambda item: str(item.get("created_at") or ""),
                reverse=True,
            )
        ]
        checklist_summary_read = (
            self._build_application_information_review_checklist_read(
                checklist_summary=checklist_summary,
                users_by_id=users_by_id,
            )
            if checklist_summary is not None
            else None
        )

        return ApplicationInformationReviewContextRead(
            notes=[ApplicationInformationReviewNoteRead(**note) for note in note_reads],
            checklist_summary=(
                ApplicationInformationReviewChecklistSummaryRead(**checklist_summary_read) if checklist_summary_read is not None else None
            ),
        ).model_dump()

    async def _create_application_information_review_note(
        self,
        db: AsyncSession,
        application_information_id: int,
        author_id: int | None,
        body: str,
    ) -> dict[str, Any]:
        created_note = await crud_application_information_review_notes.create(
            db=db,
            object=ApplicationInformationReviewNoteCreateInternal(
                application_information_id=application_information_id,
                author_id=author_id,
                body=body.strip(),
            ),
            schema_to_select=ApplicationInformationReviewNoteRecordRead,
        )
        if created_note is None:
            raise NotFoundException("Failed to create application information review note")
        users_by_id = await self._load_users_by_id(
            db=db,
            user_ids={author_id} if author_id is not None else set(),
        )
        return self._build_application_information_review_note_read(
            note=created_note,
            users_by_id=users_by_id,
        )

    async def _load_users_by_id(
        self,
        db: AsyncSession,
        user_ids: set[int],
    ) -> dict[int, dict[str, Any]]:
        users_by_id: dict[int, dict[str, Any]] = {}
        for user_id in user_ids:
            user = await crud_users.get(
                db=db,
                id=user_id,
                is_deleted=False,
            )
            if user is not None:
                users_by_id[user_id] = user
        return users_by_id

    def _build_application_information_review_note_read(
        self,
        note: dict[str, Any],
        users_by_id: dict[int, dict[str, Any]],
    ) -> dict[str, Any]:
        author = None
        author_id = note.get("author_id")
        if isinstance(author_id, int):
            author = users_by_id.get(author_id)

        return ApplicationInformationReviewNoteRead(
            id=note["id"],
            uuid=note["uuid"],
            application_information_id=note["application_information_id"],
            body=note["body"],
            author_name=author.get("name") if author is not None else None,
            author_email=author.get("email") if author is not None else None,
            author_user_uuid=author.get("uuid") if author is not None else None,
            created_at=note["created_at"],
            updated_at=note.get("updated_at"),
        ).model_dump()

    def _build_application_information_review_checklist_read(
        self,
        checklist_summary: dict[str, Any],
        users_by_id: dict[int, dict[str, Any]],
    ) -> dict[str, Any]:
        reviewed_by_user = None
        reviewed_by_user_id = checklist_summary.get("reviewed_by_user_id")
        if isinstance(reviewed_by_user_id, int):
            reviewed_by_user = users_by_id.get(reviewed_by_user_id)

        return ApplicationInformationReviewChecklistSummaryRead(
            id=checklist_summary["id"],
            uuid=checklist_summary["uuid"],
            application_information_id=checklist_summary["application_information_id"],
            review_disposition=checklist_summary["review_disposition"],
            application_information_status=checklist_summary["application_information_status"],
            contacts_status=checklist_summary["contacts_status"],
            environment_registration_status=checklist_summary["environment_registration_status"],
            promotion_metadata_status=checklist_summary["promotion_metadata_status"],
            evidence_reference_status=checklist_summary["evidence_reference_status"],
            process_links_status=checklist_summary["process_links_status"],
            rationale=checklist_summary.get("rationale"),
            reviewed_by_name=(reviewed_by_user.get("name") if reviewed_by_user is not None else None),
            reviewed_by_user_uuid=(reviewed_by_user.get("uuid") if reviewed_by_user is not None else None),
            created_at=checklist_summary["created_at"],
            updated_at=checklist_summary.get("updated_at"),
        ).model_dump()

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

    def _validate_application_information_review_write_state(
        self,
        application_information: dict[str, Any],
    ) -> None:
        onboarding_state = self._normalize_onboarding_state(application_information.get("onboarding_state"))
        if onboarding_state not in APPLICATION_INFORMATION_REVIEW_WRITE_STATES:
            raise BadRequestException(
                "Application information review notes and checklist updates are only allowed while the record is submitted or under review"
            )

    def _as_dict(self, value: Any) -> dict[str, Any]:
        if isinstance(value, dict):
            return value
        if hasattr(value, "model_dump"):
            dumped_value = value.model_dump(by_alias=True, exclude_none=True)
            if isinstance(dumped_value, dict):
                return dumped_value
        return dict(value)

    def _validate_audit_size(self, size: int) -> int:
        if isinstance(size, bool) or size < 1 or size > 100:
            raise BadRequestException("Audit event size must be between 1 and 100")
        return size

    def _redact_read_only_audit_payload(self, value: Any) -> Any:
        """Remove identity, secret, and explicitly internal fields recursively."""

        if isinstance(value, list):
            return [self._redact_read_only_audit_payload(item) for item in value if not self._is_internal_audit_event(item)]
        if not isinstance(value, dict):
            return value

        redacted: dict[str, Any] = {}
        for key, item in value.items():
            normalized_key = "".join(character for character in key.lower() if character.isalnum())
            if normalized_key == "username":
                redacted[key] = ""
            elif normalized_key == "usernamedisplay":
                redacted[key] = "Redacted"
            elif normalized_key == "usernameknown":
                redacted[key] = False
            elif any(
                sensitive_token in normalized_key
                for sensitive_token in (
                    "clientsecret",
                    "credential",
                    "accesstoken",
                    "refreshtoken",
                    "idtoken",
                    "rawpayload",
                    "internalevent",
                    "internaldetail",
                )
            ):
                continue
            else:
                redacted[key] = self._redact_read_only_audit_payload(item)
        return redacted

    def _redact_cl_admin_rp_application_metadata(
        self,
        application: dict[str, Any],
    ) -> dict[str, Any]:
        """Return oversight metadata without partner secrets."""

        redacted = self._without_legacy_application_owner(application)
        registration_payload = redacted.get("oidc_registration_payload")
        if registration_payload is not None:
            redacted["oidc_registration_payload"] = self._redact_secret_fields(registration_payload)
        return redacted

    def _without_legacy_application_owner(
        self,
        application: dict[str, Any],
    ) -> dict[str, Any]:
        """Drop the retired owner snapshot while its legacy column remains."""

        sanitized = dict(application)
        sanitized.pop("application_owner", None)
        return sanitized

    def _redact_secret_fields(self, value: Any) -> Any:
        if isinstance(value, list):
            return [self._redact_secret_fields(item) for item in value]
        if not isinstance(value, dict):
            return value

        redacted: dict[str, Any] = {}
        for key, item in value.items():
            normalized_key = "".join(character for character in str(key).lower() if character.isalnum())
            if any(
                sensitive_key in normalized_key
                for sensitive_key in (
                    "secret",
                    "credential",
                    "password",
                    "privatekey",
                    "accesstoken",
                    "refreshtoken",
                    "idtoken",
                    "bearertoken",
                    "authorization",
                )
            ):
                continue
            redacted[key] = self._redact_secret_fields(item)
        return redacted

    def _is_internal_audit_event(self, value: Any) -> bool:
        if not isinstance(value, dict):
            return False
        if value.get("internal") is True or value.get("isInternal") is True:
            return True
        return str(value.get("visibility") or "").strip().lower() == "internal"

    def _normalize_onboarding_state(self, state: Any) -> str:
        normalized_state = str(state or "draft").strip()
        return normalized_state or "draft"

    def _validate_onboarding_state_transition(
        self,
        current_state: str,
        target_state: str,
    ) -> None:
        allowed_target_states = ONBOARDING_STATE_TRANSITIONS.get(current_state, set())
        if target_state not in allowed_target_states:
            raise BadRequestException(f"Target onboarding state '{target_state}' is not allowed from '{current_state}'")

    async def _validate_rp_application_review_traceability(
        self,
        db: AsyncSession,
        rp_application: dict[str, Any],
        target_state: str,
    ) -> None:
        environment = str(rp_application.get("canada_login_environment") or "").strip().lower()
        if environment != "production":
            return
        if target_state not in PRODUCTION_REVIEW_TRACE_REQUIRED_ONBOARDING_STATES:
            return

        promotion_request = await self._get_rp_application_promotion_request_record(
            db=db,
            rp_application_id=rp_application["id"],
            required=False,
        )
        if promotion_request is None:
            raise BadRequestException("Production RP applications cannot move to 'approved' or 'launched' without a recorded promotion request")

        external_reference = str(promotion_request.get("external_reference") or "").strip()
        status = str(promotion_request.get("status") or "").strip().lower()
        reviewed_at = promotion_request.get("reviewed_at")
        decided_at = promotion_request.get("decided_at")
        if not external_reference or status not in PROMOTION_REQUEST_APPROVED_STATUSES:
            raise BadRequestException("Production RP applications cannot move to 'approved' or 'launched' without a recorded promotion request")
        if reviewed_at is None or decided_at is None:
            raise BadRequestException("Production RP applications cannot move to 'approved' or 'launched' without a recorded promotion request")

    def _validate_rp_application_promotion_request_target(
        self,
        rp_application: dict[str, Any],
    ) -> None:
        environment = str(rp_application.get("canada_login_environment") or "").strip().lower()
        if environment != PROMOTION_REQUEST_TARGET_ENVIRONMENT:
            raise BadRequestException("Promotion requests are only supported for production RP applications")

    def _build_onboarding_transition_update(self, target_state: str) -> dict[str, Any]:
        transition_time = datetime.now(UTC)
        update_data: dict[str, Any] = {
            "onboarding_state": target_state,
            "updated_at": transition_time,
        }
        if target_state == "submitted":
            update_data["submitted_at"] = transition_time
        elif target_state == "under_review":
            update_data["under_review_at"] = transition_time
        elif target_state == "approved":
            update_data["approved_at"] = transition_time
        elif target_state == "launched":
            update_data["launched_at"] = transition_time
        return update_data

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
            raise NotFoundException("Promotion request not found")
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

        return RPApplicationPromotionRequestRead(
            target_environment=promotion_request["target_environment"],
            status=promotion_request["status"],
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

        promotion_request_read = await self._build_rp_application_promotion_request_read(
            db=db,
            promotion_request=promotion_request,
        )
        rp_application_data.update(
            {
                "promotion_target_environment": promotion_request_read["target_environment"],
                "promotion_status": promotion_request_read["status"],
                "promotion_external_reference": promotion_request_read["external_reference"],
                "promotion_reviewed_by_user_uuid": promotion_request_read["reviewed_by_user_uuid"],
                "promotion_reviewed_by_team": promotion_request_read["reviewed_by_team"],
                "promotion_requested_at": promotion_request_read["requested_at"],
                "promotion_reviewed_at": promotion_request_read["reviewed_at"],
                "promotion_decided_at": promotion_request_read["decided_at"],
            }
        )
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
