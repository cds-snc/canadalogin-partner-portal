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
from ..repositories.crud_departments import crud_departments
from ..repositories.crud_rp_applications import crud_rp_applications
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
        return records.get("data", [])

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
        return rp_application

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
