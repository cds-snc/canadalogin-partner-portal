import uuid as uuid_pkg
from datetime import UTC, datetime
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from ..core.exceptions.http_exceptions import (
    BadRequestException,
    CustomException,
    DuplicateValueException,
    ForbiddenException,
    NotFoundException,
)
from ..core.utils.slugify import slugify
from ..repositories.crud_application_information import crud_application_information
from ..repositories.crud_application_information_contacts import crud_application_information_contacts
from ..repositories.crud_application_information_review_checklists import (
    crud_application_information_review_checklists,
)
from ..repositories.crud_application_information_review_notes import (
    crud_application_information_review_notes,
)
from ..repositories.crud_departments import crud_departments
from ..repositories.crud_rp_application_access_grants import crud_rp_application_access_grants
from ..repositories.crud_rp_applications import crud_rp_applications
from ..repositories.crud_rp_application_promotion_requests import crud_rp_application_promotion_requests
from ..repositories.crud_users import crud_users
from ..repositories.crud_workspace_members import crud_workspace_members
from ..repositories.crud_workspaces import crud_workspaces
from ..schemas.application_information import (
    ApplicationInformationContactCreate,
    ApplicationInformationContactCreateInternal,
    ApplicationInformationContactRead,
    ApplicationInformationContactUpdate,
    ApplicationInformationCreate,
    ApplicationInformationCreateInternal,
    ApplicationInformationReviewChecklistSummaryCreateInternal,
    ApplicationInformationReviewChecklistSummaryRead,
    ApplicationInformationReviewChecklistSummaryRecordRead,
    ApplicationInformationReviewChecklistSummaryWrite,
    ApplicationInformationReviewContextRead,
    ApplicationInformationReviewNoteCreate,
    ApplicationInformationReviewNoteCreateInternal,
    ApplicationInformationReviewNoteRead,
    ApplicationInformationReviewNoteRecordRead,
    ApplicationInformationRead,
    ApplicationInformationUpdate,
)
from ..schemas.rp_application import (
    RPApplicationCreateInternal,
    RPApplicationRead,
    RPApplicationUpdateInternal,
    WorkspaceRPApplicationRegistrationCreate,
    WorkspaceRPApplicationRegistrationUpdate,
)
from ..schemas.rp_application_access_grant import (
    RPApplicationAccessGrantCreateInternal,
    RPApplicationAccessGrantRead,
)
from ..schemas.rp_application_promotion_request import (
    PromotionRequestUpsert,
    PromotionReviewUpdate,
    RPApplicationPromotionRequestCreateInternal,
    RPApplicationPromotionRequestRead,
)
from ..schemas.onboarding import OnboardingLifecycleTransitionRequest
from ..schemas.workspace import (
    WorkspaceCreate,
    WorkspaceCreateInternal,
    WorkspaceRead,
    WorkspaceUpdate,
)
from ..schemas.workspace_member import (
    WorkspaceMemberCreate,
    WorkspaceMemberCreateInternal,
    WorkspaceMemberRead,
    WorkspaceMemberUpdate,
)
from .ibm_sv_admin_service import IBMVerifyAdminService

WORKSPACE_ADMIN_ROLE = "workspace_admin"
WORKSPACE_MEMBER_ROLE = "workspace_member"
WORKSPACE_MEMBER_ROLES = {WORKSPACE_ADMIN_ROLE, WORKSPACE_MEMBER_ROLE}
LINKED_RP_APPLICATIONS_DELETE_BLOCK_MESSAGE = (
    "Linked RP applications must be unlinked or removed before deleting application information"
)
RP_APPLICATION_USAGE_UNAVAILABLE_MESSAGE = (
    "RP application is not linked to an IBM Security Verify application"
)
WORKSPACE_RP_APPLICATION_ACCESS_ROLE = "RP User (Edit)"
EDIT_ACCESS_GRANT_ROLES = {"rp admin", "rp user (edit)"}
ONBOARDING_STATE_TRANSITIONS: dict[str, set[str]] = {
    "draft": {"submitted"},
    "submitted": {"under_review"},
    "under_review": {"approved"},
    "approved": {"launched"},
    "launched": set(),
}
REVIEW_ONLY_ONBOARDING_STATES = {"under_review", "approved", "launched"}
PRODUCTION_REVIEW_TRACE_REQUIRED_ONBOARDING_STATES = {"approved", "launched"}
PROMOTION_REQUEST_TARGET_ENVIRONMENT = "production"
PROMOTION_REQUEST_REVIEW_TRACKED_STATUS = "review_tracked"
PROMOTION_REQUEST_APPROVED_STATUSES = {"approved", "launched"}
APPLICATION_INFORMATION_REVIEW_WRITE_STATES = {"submitted", "under_review"}


class WorkspaceService:
    async def list_workspaces(self, db: AsyncSession) -> list[dict[str, Any]]:
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
        if current_user.get("is_superuser"):
            return await self.list_workspaces(db=db)

        user_id = current_user.get("id")
        if user_id is None:
            raise ForbiddenException("You do not have enough privileges.")

        memberships_data = await crud_workspace_members.get_multi(
            db=db,
            user_id=user_id,
            is_deleted=False,
            schema_to_select=WorkspaceMemberRead,
        )
        memberships = memberships_data.get("data", [])

        workspaces: list[dict[str, Any]] = []
        seen_workspace_ids: set[int] = set()
        for membership in memberships:
            workspace_id = membership.get("workspace_id")
            if not isinstance(workspace_id, int) or workspace_id in seen_workspace_ids:
                continue

            workspace = await crud_workspaces.get(
                db=db,
                id=workspace_id,
                is_deleted=False,
                schema_to_select=WorkspaceRead,
            )
            if workspace is None:
                continue

            seen_workspace_ids.add(workspace_id)
            workspaces.append(workspace)

        return workspaces

    async def get_workspace_by_uuid(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        current_user: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        db_workspace = await crud_workspaces.get(
            db=db,
            uuid=workspace_uuid,
            is_deleted=False,
            schema_to_select=WorkspaceRead,
        )
        if db_workspace is None:
            raise NotFoundException("Workspace not found")

        if current_user is not None:
            await self._require_workspace_member_access(
                db=db,
                workspace_id=db_workspace["id"],
                current_user=current_user,
            )

        return db_workspace

    async def create_workspace(
        self,
        db: AsyncSession,
        workspace: WorkspaceCreate,
        current_user: dict[str, Any],
    ) -> dict[str, Any]:
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

        creator_id = current_user.get("id")
        if creator_id is not None:
            await crud_workspace_members.create(
                db=db,
                object=WorkspaceMemberCreateInternal(
                    workspace_id=created_workspace["id"],
                    user_id=creator_id,
                    invited_by=creator_id,
                    role=WORKSPACE_ADMIN_ROLE,
                ),
                schema_to_select=WorkspaceMemberRead,
            )

        return created_workspace

    async def update_workspace(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        values: WorkspaceUpdate,
    ) -> dict[str, Any]:
        existing_workspace = await self.get_workspace_by_uuid(
            db=db,
            workspace_uuid=workspace_uuid,
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
        return await self.get_workspace_by_uuid(db=db, workspace_uuid=workspace_uuid)

    async def transition_workspace_onboarding_state(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        payload: OnboardingLifecycleTransitionRequest,
        current_user: dict[str, Any],
    ) -> dict[str, Any]:
        workspace = await self.get_workspace_by_uuid(db=db, workspace_uuid=workspace_uuid)
        current_state = self._normalize_onboarding_state(workspace.get("onboarding_state"))
        target_state = payload.target_state

        if current_state == target_state:
            return workspace

        await self._require_onboarding_transition_access(
            db=db,
            workspace_id=workspace["id"],
            current_user=current_user,
            target_state=target_state,
        )

        self._validate_onboarding_state_transition(
            current_state=current_state,
            target_state=target_state,
        )

        await crud_workspaces.update(
            db=db,
            object=self._build_onboarding_transition_update(target_state=target_state),
            uuid=workspace_uuid,
        )
        return await self.get_workspace_by_uuid(db=db, workspace_uuid=workspace_uuid)

    async def transition_workspace_application_information_onboarding_state(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        application_information_uuid: uuid_pkg.UUID | str,
        payload: OnboardingLifecycleTransitionRequest,
        current_user: dict[str, Any],
    ) -> dict[str, Any]:
        workspace = await self.get_workspace_by_uuid(db=db, workspace_uuid=workspace_uuid)
        application_information = await self._get_workspace_application_information(
            db=db,
            workspace_id=workspace["id"],
            application_information_uuid=application_information_uuid,
        )
        current_state = self._normalize_onboarding_state(application_information.get("onboarding_state"))
        target_state = payload.target_state

        if current_state == target_state:
            return application_information

        await self._require_onboarding_transition_access(
            db=db,
            workspace_id=workspace["id"],
            current_user=current_user,
            target_state=target_state,
        )
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
    ) -> dict[str, str]:
        await self.get_workspace_by_uuid(db=db, workspace_uuid=workspace_uuid)
        await crud_workspaces.delete(db=db, uuid=workspace_uuid)
        return {"message": "Workspace deleted"}

    async def list_workspace_members(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        current_user: dict[str, Any],
    ) -> list[dict[str, Any]]:
        workspace = await self.get_workspace_by_uuid(db=db, workspace_uuid=workspace_uuid)
        await self._require_workspace_admin_access(
            db=db,
            workspace_id=workspace["id"],
            current_user=current_user,
        )
        memberships = await crud_workspace_members.get_multi(
            db=db,
            workspace_id=workspace["id"],
            is_deleted=False,
            schema_to_select=WorkspaceMemberRead,
        )
        return [
            await self._enrich_workspace_member(db=db, membership=membership)
            for membership in memberships.get("data", [])
        ]

    async def require_workspace_admin_access(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        current_user: dict[str, Any],
    ) -> dict[str, Any]:
        workspace = await self.get_workspace_by_uuid(db=db, workspace_uuid=workspace_uuid)
        await self._require_workspace_admin_access(
            db=db,
            workspace_id=workspace["id"],
            current_user=current_user,
        )
        return workspace

    async def add_workspace_member(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        payload: WorkspaceMemberCreate,
        current_user: dict[str, Any],
    ) -> dict[str, Any]:
        workspace = await self.get_workspace_by_uuid(db=db, workspace_uuid=workspace_uuid)
        await self._require_workspace_admin_access(
            db=db,
            workspace_id=workspace["id"],
            current_user=current_user,
        )
        self._validate_workspace_member_role(payload.role)

        db_user = await self._resolve_user(db=db, user_uuid=payload.user_uuid)
        existing_membership = await crud_workspace_members.get(
            db=db,
            workspace_id=workspace["id"],
            user_id=db_user["id"],
            is_deleted=False,
            schema_to_select=WorkspaceMemberRead,
        )
        if existing_membership is not None:
            raise DuplicateValueException("User is already a workspace member")

        membership = await crud_workspace_members.create(
            db=db,
            object=WorkspaceMemberCreateInternal(
                workspace_id=workspace["id"],
                user_id=db_user["id"],
                invited_by=current_user.get("id"),
                role=payload.role,
            ),
            schema_to_select=WorkspaceMemberRead,
        )
        if membership is None:
            raise NotFoundException("Failed to add workspace member")
        return await self._enrich_workspace_member(db=db, membership=membership)

    async def update_workspace_member_role(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        user_uuid: uuid_pkg.UUID | str,
        payload: WorkspaceMemberUpdate,
        current_user: dict[str, Any],
    ) -> dict[str, Any]:
        workspace = await self.get_workspace_by_uuid(db=db, workspace_uuid=workspace_uuid)
        await self._require_workspace_admin_access(
            db=db,
            workspace_id=workspace["id"],
            current_user=current_user,
        )
        self._validate_workspace_member_role(payload.role)

        db_user = await self._resolve_user(db=db, user_uuid=user_uuid)
        membership = await self._get_active_workspace_member(
            db=db,
            workspace_id=workspace["id"],
            user_id=db_user["id"],
        )
        if membership["role"] == payload.role:
            return await self._enrich_workspace_member(db=db, membership=membership)

        await crud_workspace_members.update(
            db=db,
            object={"role": payload.role},
            uuid=membership["uuid"],
        )
        refreshed_membership = await self._get_active_workspace_member(
            db=db,
            workspace_id=workspace["id"],
            user_id=db_user["id"],
        )
        return await self._enrich_workspace_member(db=db, membership=refreshed_membership)

    async def remove_workspace_member(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        user_uuid: uuid_pkg.UUID | str,
        current_user: dict[str, Any],
    ) -> dict[str, str]:
        workspace = await self.get_workspace_by_uuid(db=db, workspace_uuid=workspace_uuid)
        await self._require_workspace_admin_access(
            db=db,
            workspace_id=workspace["id"],
            current_user=current_user,
        )

        db_user = await self._resolve_user(db=db, user_uuid=user_uuid)
        membership = await self._get_active_workspace_member(
            db=db,
            workspace_id=workspace["id"],
            user_id=db_user["id"],
        )
        await crud_workspace_members.delete(db=db, uuid=membership["uuid"])
        return {"message": "Workspace member removed"}

    async def list_workspace_application_information(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        current_user: dict[str, Any],
    ) -> list[dict[str, Any]]:
        workspace = await self.require_workspace_admin_access(
            db=db,
            workspace_uuid=workspace_uuid,
            current_user=current_user,
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
        workspace = await self.require_workspace_admin_access(
            db=db,
            workspace_uuid=workspace_uuid,
            current_user=current_user,
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
        workspace = await self.require_workspace_admin_access(
            db=db,
            workspace_uuid=workspace_uuid,
            current_user=current_user,
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
        workspace = await self.require_workspace_admin_access(
            db=db,
            workspace_uuid=workspace_uuid,
            current_user=current_user,
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
        workspace = await self.require_workspace_admin_access(
            db=db,
            workspace_uuid=workspace_uuid,
            current_user=current_user,
        )
        application_information = await self._get_workspace_application_information(
            db=db,
            workspace_id=workspace["id"],
            application_information_uuid=application_information_uuid,
        )
        if await crud_rp_applications.exists(
            db=db,
            application_information_id=application_information["id"],
            is_deleted=False,
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
        workspace = await self.require_workspace_admin_access(
            db=db,
            workspace_uuid=workspace_uuid,
            current_user=current_user,
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
            schema_to_select=ApplicationInformationContactRead,
        )
        return contacts.get("data", [])

    async def add_application_information_contact(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        application_information_uuid: uuid_pkg.UUID | str,
        payload: ApplicationInformationContactCreate,
        current_user: dict[str, Any],
    ) -> dict[str, Any]:
        workspace = await self.require_workspace_admin_access(
            db=db,
            workspace_uuid=workspace_uuid,
            current_user=current_user,
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
                created_by=current_user.get("id"),
                **payload.model_dump(),
            ),
            schema_to_select=ApplicationInformationContactRead,
        )
        if created is None:
            raise NotFoundException("Failed to create application information contact")
        return created

    async def update_application_information_contact(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        application_information_uuid: uuid_pkg.UUID | str,
        contact_uuid: uuid_pkg.UUID | str,
        payload: ApplicationInformationContactUpdate,
        current_user: dict[str, Any],
    ) -> dict[str, Any]:
        workspace = await self.require_workspace_admin_access(
            db=db,
            workspace_uuid=workspace_uuid,
            current_user=current_user,
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
            return existing_contact

        await crud_application_information_contacts.update(
            db=db,
            object=update_data,
            uuid=contact_uuid,
        )
        return await self._get_application_information_contact(
            db=db,
            application_information_id=application_information["id"],
            contact_uuid=contact_uuid,
        )

    async def delete_application_information_contact(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        application_information_uuid: uuid_pkg.UUID | str,
        contact_uuid: uuid_pkg.UUID | str,
        current_user: dict[str, Any],
    ) -> dict[str, str]:
        workspace = await self.require_workspace_admin_access(
            db=db,
            workspace_uuid=workspace_uuid,
            current_user=current_user,
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
        workspace = await self.get_workspace_by_uuid(
            db=db,
            workspace_uuid=workspace_uuid,
            current_user=current_user,
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
        workspace = await self.get_workspace_by_uuid(
            db=db,
            workspace_uuid=workspace_uuid,
            current_user=current_user,
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
        workspace = await self.get_workspace_by_uuid(
            db=db,
            workspace_uuid=workspace_uuid,
            current_user=current_user,
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
            raise NotFoundException(
                "Application information review checklist summary not found"
            )
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
        workspace = await self.require_workspace_admin_access(
            db=db,
            workspace_uuid=workspace_uuid,
            current_user=current_user,
        )
        records = await crud_rp_applications.get_multi(
            db=db,
            workspace_id=workspace["id"],
            is_deleted=False,
            schema_to_select=RPApplicationRead,
        )
        return [
            await self._attach_rp_application_promotion_request_summary(
                db=db,
                rp_application=record,
            )
            for record in records.get("data", [])
        ]

    async def create_workspace_rp_application(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        payload: WorkspaceRPApplicationRegistrationCreate,
        current_user: dict[str, Any],
    ) -> dict[str, Any]:
        workspace = await self.require_workspace_admin_access(
            db=db,
            workspace_uuid=workspace_uuid,
            current_user=current_user,
        )
        application_information_id = await self._resolve_workspace_application_information_id(
            db=db,
            workspace_id=workspace["id"],
            application_information_uuid=payload.application_information_uuid,
        )
        registration_payload = payload.model_dump(
            mode="json",
            exclude={"application_information_uuid"},
        )
        created = await crud_rp_applications.create(
            db=db,
            object=RPApplicationCreateInternal(
                workspace_id=workspace["id"],
                department_id=workspace["department_id"],
                application_information_id=application_information_id,
                dnr_app_name=payload.service_name_en,
                canada_login_environment=payload.canada_login_environment,
                status=None,
                ibm_sv_application_id=None,
                oidc_registration_payload=registration_payload,
                created_by=current_user.get("id"),
                application_owner=None,
            ),
            schema_to_select=RPApplicationRead,
        )
        if created is None:
            raise NotFoundException("Failed to create RP application")
        await self._ensure_workspace_rp_application_access_grant(
            db=db,
            workspace_id=workspace["id"],
            current_user=current_user,
        )
        return created

    async def get_workspace_rp_application(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        rp_application_uuid: uuid_pkg.UUID | str,
        current_user: dict[str, Any],
    ) -> dict[str, Any]:
        workspace = await self.require_workspace_admin_access(
            db=db,
            workspace_uuid=workspace_uuid,
            current_user=current_user,
        )
        return await self._get_workspace_rp_application(
            db=db,
            workspace_id=workspace["id"],
            rp_application_uuid=rp_application_uuid,
        )

    async def get_workspace_rp_application_promotion_request(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        rp_application_uuid: uuid_pkg.UUID | str,
        current_user: dict[str, Any],
    ) -> dict[str, Any]:
        workspace = await self.require_workspace_admin_access(
            db=db,
            workspace_uuid=workspace_uuid,
            current_user=current_user,
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
        return await self._build_rp_application_promotion_request_read(
            db=db,
            promotion_request=promotion_request,
        )

    async def upsert_workspace_rp_application_promotion_request(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        rp_application_uuid: uuid_pkg.UUID | str,
        payload: PromotionRequestUpsert,
        current_user: dict[str, Any],
    ) -> dict[str, Any]:
        workspace = await self.require_workspace_admin_access(
            db=db,
            workspace_uuid=workspace_uuid,
            current_user=current_user,
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
        if not current_user.get("is_superuser"):
            raise ForbiddenException("You do not have enough privileges.")

        workspace = await self.get_workspace_by_uuid(db=db, workspace_uuid=workspace_uuid)
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
        payload_data = payload.model_dump(exclude_unset=True)
        next_external_reference = payload.external_reference
        if "external_reference" not in payload_data:
            next_external_reference = promotion_request.get("external_reference")
        if payload.status in PROMOTION_REQUEST_APPROVED_STATUSES and not str(
            next_external_reference or ""
        ).strip():
            raise BadRequestException(
                "Approved production review outcomes require an external reference"
            )

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
        payload: OnboardingLifecycleTransitionRequest,
        current_user: dict[str, Any],
    ) -> dict[str, Any]:
        workspace = await self.get_workspace_by_uuid(db=db, workspace_uuid=workspace_uuid)
        rp_application = await self._get_workspace_rp_application(
            db=db,
            workspace_id=workspace["id"],
            rp_application_uuid=rp_application_uuid,
        )
        current_state = self._normalize_onboarding_state(rp_application.get("onboarding_state"))
        target_state = payload.target_state

        if current_state == target_state:
            return rp_application

        await self._require_onboarding_transition_access(
            db=db,
            workspace_id=workspace["id"],
            current_user=current_user,
            target_state=target_state,
        )
        self._validate_onboarding_state_transition(
            current_state=current_state,
            target_state=target_state,
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
        workspace = await self.require_workspace_admin_access(
            db=db,
            workspace_uuid=workspace_uuid,
            current_user=current_user,
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
            canada_login_environment=current_payload.get("canada_login_environment")
            or existing.get("canada_login_environment"),
            status=existing.get("status"),
            oidc_registration_payload=current_payload,
            application_owner=existing.get("application_owner"),
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
        workspace = await self.require_workspace_admin_access(
            db=db,
            workspace_uuid=workspace_uuid,
            current_user=current_user,
        )
        await self._get_workspace_rp_application(
            db=db,
            workspace_id=workspace["id"],
            rp_application_uuid=rp_application_uuid,
        )
        await crud_rp_applications.delete(db=db, uuid=rp_application_uuid)
        return {"message": "RP application deleted"}

    async def get_workspace_rp_application_usage_summary(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        rp_application_uuid: uuid_pkg.UUID | str,
        current_user: dict[str, Any],
        ibm_sv_admin_service: IBMVerifyAdminService,
        selected_date: str | None = None,
    ) -> dict[str, int]:
        workspace = await self.require_workspace_admin_access(
            db=db,
            workspace_uuid=workspace_uuid,
            current_user=current_user,
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
        workspace = await self.require_workspace_admin_access(
            db=db,
            workspace_uuid=workspace_uuid,
            current_user=current_user,
        )
        rp_application = await self._get_workspace_rp_application(
            db=db,
            workspace_id=workspace["id"],
            rp_application_uuid=rp_application_uuid,
        )
        ibm_application_id = self._get_workspace_rp_application_ibm_application_id(rp_application)
        from_date, to_date = self._resolve_selected_date_range(selected_date)
        return await ibm_sv_admin_service.get_application_audit_trail(
            application_id=ibm_application_id,
            from_date=from_date,
            to_date=to_date,
            size=size,
        )

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
        workspace = await self.require_workspace_admin_access(
            db=db,
            workspace_uuid=workspace_uuid,
            current_user=current_user,
        )
        rp_application = await self._get_workspace_rp_application(
            db=db,
            workspace_id=workspace["id"],
            rp_application_uuid=rp_application_uuid,
        )
        ibm_application_id = self._get_workspace_rp_application_ibm_application_id(rp_application)
        from_date, to_date = self._resolve_selected_date_range(selected_date)
        return await ibm_sv_admin_service.get_application_audit_trail_search_after(
            application_id=ibm_application_id,
            from_date=from_date,
            to_date=to_date,
            size=size,
            search_after=search_after,
        )

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

    async def _resolve_user(
        self,
        db: AsyncSession,
        user_uuid: uuid_pkg.UUID | str,
    ) -> dict[str, Any]:
        db_user = await crud_users.get(
            db=db,
            uuid=user_uuid,
            is_deleted=False,
        )
        if db_user is None:
            raise NotFoundException("User not found")
        return db_user

    async def _get_active_workspace_member(
        self,
        db: AsyncSession,
        workspace_id: int,
        user_id: int,
    ) -> dict[str, Any]:
        membership = await crud_workspace_members.get(
            db=db,
            workspace_id=workspace_id,
            user_id=user_id,
            is_deleted=False,
            schema_to_select=WorkspaceMemberRead,
        )
        if membership is None:
            raise NotFoundException("Workspace member not found")
        return membership

    async def _enrich_workspace_member(
        self,
        db: AsyncSession,
        membership: dict[str, Any],
    ) -> dict[str, Any]:
        member_data = dict(membership)
        user = await crud_users.get(
            db=db,
            id=membership["user_id"],
            is_deleted=False,
        )
        if user is not None:
            member_data["user_email"] = user.get("email")
            member_data["user_name"] = user.get("name")
            member_data["user_uuid"] = user.get("uuid")
        return member_data

    async def _require_workspace_admin_access(
        self,
        db: AsyncSession,
        workspace_id: int,
        current_user: dict[str, Any],
    ) -> None:
        if current_user.get("is_superuser"):
            return

        user_id = current_user.get("id")
        if user_id is None:
            raise ForbiddenException("You do not have enough privileges.")

        membership = await crud_workspace_members.get(
            db=db,
            workspace_id=workspace_id,
            user_id=user_id,
            is_deleted=False,
        )
        if membership is None or membership.get("role") != WORKSPACE_ADMIN_ROLE:
            raise ForbiddenException("You do not have enough privileges.")

    async def _require_workspace_member_access(
        self,
        db: AsyncSession,
        workspace_id: int,
        current_user: dict[str, Any],
    ) -> None:
        if current_user.get("is_superuser"):
            return

        user_id = current_user.get("id")
        if user_id is None:
            raise NotFoundException("Workspace not found")

        membership = await crud_workspace_members.get(
            db=db,
            workspace_id=workspace_id,
            user_id=user_id,
            is_deleted=False,
        )
        if membership is None:
            raise NotFoundException("Workspace not found")

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
            schema_to_select=ApplicationInformationContactRead,
        )
        if contact is None:
            raise NotFoundException("Application information contact not found")
        return contact

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
        reviewed_by_user_id = (
            checklist_summary.get("reviewed_by_user_id")
            if isinstance(checklist_summary, dict)
            else None
        )
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
                ApplicationInformationReviewChecklistSummaryRead(
                    **checklist_summary_read
                )
                if checklist_summary_read is not None
                else None
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
            application_information_status=checklist_summary[
                "application_information_status"
            ],
            contacts_status=checklist_summary["contacts_status"],
            environment_registration_status=checklist_summary[
                "environment_registration_status"
            ],
            promotion_metadata_status=checklist_summary[
                "promotion_metadata_status"
            ],
            evidence_reference_status=checklist_summary[
                "evidence_reference_status"
            ],
            process_links_status=checklist_summary["process_links_status"],
            rationale=checklist_summary.get("rationale"),
            reviewed_by_name=(
                reviewed_by_user.get("name") if reviewed_by_user is not None else None
            ),
            reviewed_by_user_uuid=(
                reviewed_by_user.get("uuid")
                if reviewed_by_user is not None
                else None
            ),
            created_at=checklist_summary["created_at"],
            updated_at=checklist_summary.get("updated_at"),
        ).model_dump()

    async def _resolve_workspace_application_information_id(
        self,
        db: AsyncSession,
        workspace_id: int,
        application_information_uuid: uuid_pkg.UUID | str | None,
    ) -> int | None:
        if application_information_uuid is None:
            return None
        application_information = await self._get_workspace_application_information(
            db=db,
            workspace_id=workspace_id,
            application_information_uuid=application_information_uuid,
        )
        return int(application_information["id"])

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
        return await self._attach_rp_application_promotion_request_summary(
            db=db,
            rp_application=rp_application,
        )

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
        succeeded = self._coerce_int(
            raw_response.get("succeeded")
            if "succeeded" in raw_response
            else raw_response.get("successful")
        )
        failed = self._coerce_int(
            raw_response.get("failed")
            if "failed" in raw_response
            else raw_response.get("unsuccessful")
        )

        if total is None:
            total = max((succeeded or 0) + (failed or 0), 0)

        if succeeded is None and failed is None:
            succeeded = total
            failed = 0
        elif succeeded is None:
            succeeded = max(total - (failed or 0), 0)
        elif failed is None:
            failed = max(total - succeeded, 0)

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
        onboarding_state = self._normalize_onboarding_state(
            application_information.get("onboarding_state")
        )
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

    def _normalize_access_grant_role(self, role: Any) -> str | None:
        if role is None:
            return None

        normalized_role = str(role).strip().lower()
        return normalized_role or None

    def _normalize_onboarding_state(self, state: Any) -> str:
        normalized_state = str(state or "draft").strip()
        return normalized_state or "draft"

    async def _require_onboarding_transition_access(
        self,
        db: AsyncSession,
        workspace_id: int,
        current_user: dict[str, Any],
        target_state: str,
    ) -> None:
        if target_state in REVIEW_ONLY_ONBOARDING_STATES:
            if not current_user.get("is_superuser"):
                raise ForbiddenException("You do not have enough privileges.")
            return

        await self._require_workspace_admin_access(
            db=db,
            workspace_id=workspace_id,
            current_user=current_user,
        )

    def _validate_onboarding_state_transition(
        self,
        current_state: str,
        target_state: str,
    ) -> None:
        allowed_target_states = ONBOARDING_STATE_TRANSITIONS.get(current_state, set())
        if target_state not in allowed_target_states:
            raise BadRequestException(
                f"Target onboarding state '{target_state}' is not allowed from '{current_state}'"
            )

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
            raise BadRequestException(
                "Production RP applications cannot move to 'approved' or 'launched' without a recorded promotion request"
            )

        external_reference = str(promotion_request.get("external_reference") or "").strip()
        status = str(promotion_request.get("status") or "").strip().lower()
        reviewed_at = promotion_request.get("reviewed_at")
        decided_at = promotion_request.get("decided_at")
        if not external_reference or status not in PROMOTION_REQUEST_APPROVED_STATUSES:
            raise BadRequestException(
                "Production RP applications cannot move to 'approved' or 'launched' without a recorded promotion request"
            )
        if reviewed_at is None or decided_at is None:
            raise BadRequestException(
                "Production RP applications cannot move to 'approved' or 'launched' without a recorded promotion request"
            )

    def _validate_rp_application_promotion_request_target(
        self,
        rp_application: dict[str, Any],
    ) -> None:
        environment = str(rp_application.get("canada_login_environment") or "").strip().lower()
        if environment != PROMOTION_REQUEST_TARGET_ENVIRONMENT:
            raise BadRequestException(
                "Promotion requests are only supported for production RP applications"
            )

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

    async def _ensure_workspace_rp_application_access_grant(
        self,
        db: AsyncSession,
        workspace_id: int,
        current_user: dict[str, Any],
    ) -> None:
        user_id = self._normalize_current_user_id(current_user)
        if user_id is None:
            return

        existing_grant = await crud_rp_application_access_grants.get(
            db=db,
            workspace_id=workspace_id,
            user_id=user_id,
            status="active",
            is_deleted=False,
            schema_to_select=RPApplicationAccessGrantRead,
        )
        if existing_grant is None:
            created_grant = await crud_rp_application_access_grants.create(
                db=db,
                object=RPApplicationAccessGrantCreateInternal(
                    workspace_id=workspace_id,
                    user_id=user_id,
                    role=WORKSPACE_RP_APPLICATION_ACCESS_ROLE,
                    status="active",
                ),
                schema_to_select=RPApplicationAccessGrantRead,
            )
            if created_grant is None:
                raise NotFoundException("Failed to create RP application access grant")
            return

        existing_grant_data = self._as_dict(existing_grant)
        existing_role = self._normalize_access_grant_role(existing_grant_data.get("role"))
        if existing_role in EDIT_ACCESS_GRANT_ROLES or existing_role != "read only":
            return

        await crud_rp_application_access_grants.update(
            db=db,
            object={
                "role": WORKSPACE_RP_APPLICATION_ACCESS_ROLE,
                "updated_at": datetime.now(UTC),
            },
            uuid=existing_grant_data["uuid"],
            is_deleted=False,
        )

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

    def _validate_workspace_member_role(self, role: str) -> None:
        if role not in WORKSPACE_MEMBER_ROLES:
            raise BadRequestException("Invalid workspace member role")
