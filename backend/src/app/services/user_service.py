import uuid as uuid_pkg
from collections.abc import Mapping
from datetime import UTC, datetime
from typing import Any

from fastcrud import compute_offset, paginated_response
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.authorization import CanonicalRoleCode, LifecycleStatus
from ..core.config import settings
from ..core.exceptions.http_exceptions import (
    BadRequestException,
    DuplicateValueException,
    ForbiddenException,
    NotFoundException,
)
from ..core.security import blacklist_token
from ..models.role import Role
from ..models.rp_application_access_grant import RPApplicationAccessGrant
from ..models.rp_application_developer_invitation import (
    RPApplicationDeveloperInvitation,
)
from ..models.user import User
from ..models.user_role import UserRole
from ..models.workspace import Workspace
from ..repositories.crud_audit_log import crud_audit_log
from ..repositories.crud_departments import crud_departments
from ..repositories.crud_rate_limit import crud_rate_limits
from ..repositories.crud_tier import crud_tiers
from ..repositories.crud_users import crud_users
from ..schemas.audit_log import AuditLogCreateInternal
from ..schemas.department import DepartmentRead
from ..schemas.rate_limit import RateLimitRead
from ..schemas.tier import TierRead
from ..schemas.user import (
    AuthenticatedUserRead,
    UserAccessAdministrationRead,
    UserAccessDirectoryRead,
    UserAccessIdentityRead,
    UserCreate,
    UserCreateInternal,
    UserDepartmentUpdate,
    UserDirectoryWorkspaceAccessRead,
    UserGlobalAccessSummaryRead,
    UserInvitationTargetResolutionOutcome,
    UserInvitationTargetResolutionRead,
    UserPendingInvitationDirectoryRead,
    UserPendingInvitationSummaryRead,
    UserReadInternal,
    UserTierUpdate,
    UserUpdate,
    UserWorkspaceAccessSummaryRead,
)
from .authorization_lock_service import lock_authorization_target_user
from .authorization_service import (
    AuthorizationService,
    get_resolved_authorization_state,
)


class UserService:
    async def list_pending_invitations(
        self,
        db: AsyncSession,
        page: int,
        items_per_page: int,
        current_user: Mapping[str, Any],
    ) -> dict[str, Any]:
        """Return active pending invitations across workspaces for CL Admin."""

        self._require_cl_admin_actor(current_user)
        now = datetime.now(UTC)
        filters = (
            RPApplicationDeveloperInvitation.status == LifecycleStatus.PENDING.value,
            RPApplicationDeveloperInvitation.is_deleted.is_(False),
            RPApplicationDeveloperInvitation.invite_expires_at > now,
            Workspace.is_deleted.is_(False),
        )
        total_count = int(
            await db.scalar(
                select(func.count(RPApplicationDeveloperInvitation.id))
                .join(
                    Workspace,
                    Workspace.id == RPApplicationDeveloperInvitation.workspace_id,
                )
                .where(*filters)
            )
            or 0
        )
        rows = (
            await db.execute(
                select(
                    RPApplicationDeveloperInvitation.uuid.label("invitation_uuid"),
                    RPApplicationDeveloperInvitation.invited_email.label("invited_email"),
                    Workspace.uuid.label("workspace_uuid"),
                    Workspace.name.label("workspace_name"),
                    RPApplicationDeveloperInvitation.role.label("role"),
                    RPApplicationDeveloperInvitation.status.label("status"),
                    RPApplicationDeveloperInvitation.invite_expires_at.label("invite_expires_at"),
                    RPApplicationDeveloperInvitation.created_at.label("created_at"),
                )
                .join(
                    Workspace,
                    Workspace.id == RPApplicationDeveloperInvitation.workspace_id,
                )
                .where(*filters)
                .order_by(
                    RPApplicationDeveloperInvitation.created_at.desc(),
                    RPApplicationDeveloperInvitation.uuid,
                )
                .offset(compute_offset(page, items_per_page))
                .limit(items_per_page)
            )
        ).all()
        invitations = [
            UserPendingInvitationDirectoryRead(
                invitation_uuid=row.invitation_uuid,
                invited_email=row.invited_email,
                workspace_uuid=row.workspace_uuid,
                workspace_name=row.workspace_name,
                role=row.role,
                status=row.status,
                invite_expires_at=row.invite_expires_at,
                created_at=row.created_at,
            )
            for row in rows
        ]
        return {
            "data": invitations,
            "has_more": page * items_per_page < total_count,
            "items_per_page": items_per_page,
            "page": page,
            "total_count": total_count,
        }

    async def resolve_invitation_target(
        self,
        db: AsyncSession,
        invited_email: str,
        current_user: Mapping[str, Any],
    ) -> UserInvitationTargetResolutionRead:
        """Resolve invite-form identity state without exposing provider data."""

        self._require_cl_admin_actor(current_user)
        normalized_email = str(invited_email).strip().lower()
        rows = (
            await db.execute(select(User.uuid, User.enabled, User.is_deleted).where(func.lower(func.btrim(User.email)) == normalized_email))
        ).all()
        if not rows:
            return UserInvitationTargetResolutionRead(
                outcome=UserInvitationTargetResolutionOutcome.NEW_IDENTITY,
            )
        if len(rows) != 1 or rows[0].is_deleted or not rows[0].enabled:
            return UserInvitationTargetResolutionRead(
                outcome=UserInvitationTargetResolutionOutcome.INELIGIBLE_IDENTITY,
            )
        return UserInvitationTargetResolutionRead(
            outcome=UserInvitationTargetResolutionOutcome.EXISTING_IDENTITY,
            user_uuid=rows[0].uuid,
        )

    async def get_user_access_administration(
        self,
        db: AsyncSession,
        user_uuid: uuid_pkg.UUID | str,
        current_user: Mapping[str, Any],
    ) -> UserAccessAdministrationRead:
        """Return one user's canonical access through a CL Admin-only view."""

        self._require_cl_admin_actor(current_user)
        db_user = await self._get_user(
            db=db,
            user_uuid=user_uuid,
            include_deleted=False,
        )
        target_user_id = db_user.get("id")
        if not isinstance(target_user_id, int) or isinstance(target_user_id, bool):
            raise NotFoundException("User not found")

        resolved_state = await AuthorizationService().resolve_for_user(
            db,
            user_id=target_user_id,
        )
        global_row = (
            await db.execute(
                select(
                    UserRole.uuid.label("assignment_uuid"),
                    UserRole.assigned_at.label("assigned_at"),
                )
                .join(Role, Role.id == UserRole.role_id)
                .where(
                    UserRole.user_id == target_user_id,
                    UserRole.status == LifecycleStatus.ACTIVE.value,
                    Role.code == CanonicalRoleCode.CL_ADMIN.value,
                    Role.is_deleted.is_(False),
                )
            )
        ).one_or_none()
        workspace_rows = (
            await db.execute(
                select(
                    RPApplicationAccessGrant.uuid.label("assignment_uuid"),
                    Workspace.uuid.label("workspace_uuid"),
                    Workspace.name.label("workspace_name"),
                    RPApplicationAccessGrant.role.label("role"),
                    RPApplicationAccessGrant.created_at.label("assigned_at"),
                )
                .join(
                    Workspace,
                    Workspace.id == RPApplicationAccessGrant.workspace_id,
                )
                .where(
                    RPApplicationAccessGrant.user_id == target_user_id,
                    RPApplicationAccessGrant.status == LifecycleStatus.ACTIVE.value,
                    RPApplicationAccessGrant.is_deleted.is_(False),
                    Workspace.is_deleted.is_(False),
                )
                .order_by(Workspace.name, Workspace.uuid)
            )
        ).all()

        global_assignment = None
        if global_row is not None:
            global_assignment = UserGlobalAccessSummaryRead(
                assignment_uuid=global_row.assignment_uuid,
                role=CanonicalRoleCode.CL_ADMIN,
                assigned_at=global_row.assigned_at,
            )
        workspace_assignments = tuple(
            UserWorkspaceAccessSummaryRead(
                assignment_uuid=row.assignment_uuid,
                workspace_uuid=row.workspace_uuid,
                workspace_name=row.workspace_name,
                role=row.role,
                assigned_at=row.assigned_at,
            )
            for row in workspace_rows
        )
        resolved_partner_access = {(access.workspace_uuid, access.role) for access in resolved_state.partner_access}
        projected_partner_access = {(assignment.workspace_uuid, assignment.role) for assignment in workspace_assignments}
        if resolved_state.is_cl_admin != (global_assignment is not None) or resolved_partner_access != projected_partner_access:
            raise BadRequestException("User authorization state is inconsistent")

        normalized_email = str(db_user["email"]).strip().lower()
        invitation_rows = (
            await db.execute(
                select(
                    RPApplicationDeveloperInvitation.uuid.label("invitation_uuid"),
                    Workspace.uuid.label("workspace_uuid"),
                    Workspace.name.label("workspace_name"),
                    RPApplicationDeveloperInvitation.role.label("role"),
                    RPApplicationDeveloperInvitation.status.label("status"),
                    RPApplicationDeveloperInvitation.invite_expires_at.label("invite_expires_at"),
                    RPApplicationDeveloperInvitation.created_at.label("created_at"),
                )
                .join(
                    Workspace,
                    Workspace.id == RPApplicationDeveloperInvitation.workspace_id,
                )
                .where(
                    func.lower(func.btrim(RPApplicationDeveloperInvitation.invited_email)) == normalized_email,
                    RPApplicationDeveloperInvitation.status == LifecycleStatus.PENDING.value,
                    RPApplicationDeveloperInvitation.is_deleted.is_(False),
                    RPApplicationDeveloperInvitation.invite_expires_at > datetime.now(UTC),
                    Workspace.is_deleted.is_(False),
                )
                .order_by(
                    Workspace.name,
                    RPApplicationDeveloperInvitation.created_at.desc(),
                )
            )
        ).all()
        pending_invitations = tuple(
            UserPendingInvitationSummaryRead(
                invitation_uuid=row.invitation_uuid,
                workspace_uuid=row.workspace_uuid,
                workspace_name=row.workspace_name,
                role=row.role,
                status=row.status,
                invite_expires_at=row.invite_expires_at,
                created_at=row.created_at,
            )
            for row in invitation_rows
        )

        return UserAccessAdministrationRead(
            user=UserAccessIdentityRead(
                uuid=db_user["uuid"],
                name=db_user["name"],
                email=db_user["email"],
                username=db_user["username"],
                enabled=bool(db_user.get("enabled", False)),
            ),
            global_assignment=global_assignment,
            workspace_assignments=workspace_assignments,
            pending_invitations=pending_invitations,
        )

    async def accept_terms(self, db: AsyncSession, current_user: Mapping[str, Any]) -> dict[str, str]:
        await self._get_user(db=db, user_uuid=current_user["uuid"], include_deleted=False)
        await crud_users.update(
            db=db,
            object={
                "accepted_terms_at": datetime.now(UTC),
                "terms_version": settings.TERMS_VERSION,
            },
            uuid=current_user["uuid"],
        )
        await crud_audit_log.create(
            db=db,
            object=AuditLogCreateInternal(
                user=current_user.get("name", ""),
                user_uuid=current_user["uuid"],
                target="terms",
                operation="ACCEPT",
                description=f"User accepted terms version {settings.TERMS_VERSION}",
            ),
        )
        return {"message": "Terms accepted"}

    async def create_user(self, db: AsyncSession, user: UserCreate) -> dict[str, Any]:
        normalized_email = str(user.email).strip().lower()
        await self._ensure_email_available(db=db, email=normalized_email)
        await self._ensure_username_available(db=db, username=normalized_email)

        user_internal = UserCreateInternal(
            name=user.name,
            email=normalized_email,
            username=normalized_email,
            # CL-admin creation is an explicit account activation workflow.
            enabled=True,
        )
        created_user = await crud_users.create(db=db, object=user_internal, schema_to_select=UserReadInternal)
        if created_user is None:
            raise NotFoundException("Failed to create user")
        return await self._build_public_user(db=db, user=dict(created_user))

    async def list_users(self, db: AsyncSession, page: int, items_per_page: int) -> dict[str, Any]:
        users_data = await crud_users.get_multi(
            db=db,
            offset=compute_offset(page, items_per_page),
            limit=items_per_page,
            is_deleted=False,
            schema_to_select=UserReadInternal,
        )
        response = paginated_response(crud_data=users_data, page=page, items_per_page=items_per_page)
        response["data"] = await self._build_user_access_directory_entries(
            db=db,
            users=[dict(user) for user in response["data"]],
        )
        return response

    async def search_users(
        self,
        db: AsyncSession,
        query: str,
    ) -> list[dict[str, Any]]:
        normalized_query = query.strip()
        if not 2 <= len(normalized_query) <= 100:
            raise BadRequestException("Search query must contain between 2 and 100 characters")

        escaped_query = normalized_query.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
        match_pattern = f"%{escaped_query}%"
        users = (
            (
                await db.execute(
                    select(User)
                    .where(
                        User.enabled.is_(True),
                        User.is_deleted.is_(False),
                        or_(
                            User.name.ilike(match_pattern, escape="\\"),
                            User.email.ilike(match_pattern, escape="\\"),
                            User.username.ilike(match_pattern, escape="\\"),
                        ),
                    )
                    .order_by(User.name, User.email, User.uuid)
                    .limit(20)
                )
            )
            .scalars()
            .all()
        )

        return await self._build_user_access_directory_entries(
            db=db,
            users=[{key: value for key, value in vars(user).items() if not key.startswith("_sa_")} for user in users],
        )

    async def get_user_by_uuid(self, db: AsyncSession, user_uuid: uuid_pkg.UUID | str) -> dict[str, Any]:
        return await self._build_public_user(
            db=db,
            user=dict(await self._get_user(db=db, user_uuid=user_uuid, include_deleted=False)),
        )

    async def update_user(
        self,
        db: AsyncSession,
        user_uuid: uuid_pkg.UUID | str,
        current_user: Mapping[str, Any],
        values: UserUpdate,
    ) -> dict[str, str]:
        actor_id = self._require_cl_admin_actor(current_user)
        db_user = await self._get_user(
            db=db,
            user_uuid=user_uuid,
            include_deleted=False,
        )
        update_values = values.model_dump(exclude_unset=True, exclude_none=True)
        if not update_values:
            return {"message": "User updated"}

        if update_values.get("enabled") is False and db_user.get("enabled") is not False:
            await self._revoke_authorization_for_deactivation(
                db=db,
                target_user_id=int(db_user["id"]),
                actor_user_id=actor_id,
            )

        current_email = db_user["email"]
        if values.email is not None and values.email != current_email:
            normalized_email = str(values.email).strip().lower()
            await self._ensure_email_available(db=db, email=normalized_email)
            await self._ensure_username_available(db=db, username=normalized_email)
            update_values["email"] = normalized_email
            update_values["username"] = normalized_email

        await crud_users.update(db=db, object=update_values, uuid=user_uuid)
        await self._record_user_governance_audit(
            db=db,
            current_user=current_user,
            target_user=db_user,
            operation=("USER_DISABLE" if update_values.get("enabled") is False else "USER_UPDATE"),
        )
        return {"message": "User updated"}

    async def set_department_for_user(self, db: AsyncSession, user_uuid: uuid_pkg.UUID | str, department_uuid: uuid_pkg.UUID | str) -> dict[str, str]:
        db_user = await self._get_user(db=db, user_uuid=user_uuid, include_deleted=True)
        # Only allow setting department if not set
        if db_user.get("department_id") is not None:
            raise ForbiddenException("Department already set and cannot be changed")

        db_department = await crud_departments.get(db=db, uuid=department_uuid, is_deleted=False)
        if db_department is None:
            raise NotFoundException("Department not found")

        await crud_users.update(db=db, object={"department_id": db_department["id"], "enabled": True}, uuid=user_uuid)
        return {"message": "User department set and enabled"}

    async def delete_user(
        self,
        db: AsyncSession,
        user_uuid: uuid_pkg.UUID | str,
        current_user: Mapping[str, Any],
        token: str | None,
    ) -> dict[str, str]:
        actor_id = self._require_cl_admin_actor(current_user)
        db_user = await self._get_user(
            db=db,
            user_uuid=user_uuid,
            include_deleted=False,
        )
        await self._revoke_authorization_for_deactivation(
            db=db,
            target_user_id=int(db_user["id"]),
            actor_user_id=actor_id,
        )

        await crud_users.delete(db=db, uuid=user_uuid)
        await self._record_user_governance_audit(
            db=db,
            current_user=current_user,
            target_user=db_user,
            operation="USER_DELETE",
        )
        if token is not None and str(current_user.get("uuid") or "") == str(db_user.get("uuid") or ""):
            await blacklist_token(token=token, db=db)
        return {"message": "User deleted"}

    async def delete_user_from_db(self, db: AsyncSession, user_uuid: uuid_pkg.UUID | str, token: str) -> dict[str, str]:
        exists = await crud_users.exists(db=db, uuid=user_uuid)
        if not exists:
            raise NotFoundException("User not found")

        await crud_users.db_delete(db=db, uuid=user_uuid)
        await blacklist_token(token=token, db=db)
        return {"message": "User deleted from the database"}

    async def get_user_rate_limits(self, db: AsyncSession, user_uuid: uuid_pkg.UUID | str) -> dict[str, Any]:
        db_user = await self._get_user(db=db, user_uuid=user_uuid, include_deleted=True)
        user_dict = await self._build_public_user(db=db, user=dict(db_user))
        if db_user.get("tier_id") is None:
            user_dict["tier_rate_limits"] = []
            return user_dict

        db_tier = await crud_tiers.get(db=db, id=db_user["tier_id"])
        if db_tier is None:
            raise NotFoundException("Tier not found")

        db_rate_limits = await crud_rate_limits.get_multi(db=db, tier_id=db_tier["id"], schema_to_select=RateLimitRead)
        user_dict["tier_rate_limits"] = db_rate_limits["data"]
        return user_dict

    async def get_user_tier(self, db: AsyncSession, user_uuid: uuid_pkg.UUID | str) -> dict[str, Any] | None:
        db_user = await self._get_user(db=db, user_uuid=user_uuid, include_deleted=True)
        if db_user.get("tier_id") is None:
            return None

        db_tier = await crud_tiers.get(db=db, id=db_user["tier_id"], schema_to_select=TierRead)
        if db_tier is None:
            raise NotFoundException("Tier not found")

        user_dict = await self._build_public_user(db=db, user=dict(db_user))
        user_dict["tier_uuid"] = db_tier["uuid"]
        user_dict["tier_name"] = db_tier["name"]
        user_dict["tier_created_at"] = db_tier["created_at"]
        return user_dict

    async def get_user_department(self, db: AsyncSession, user_uuid: uuid_pkg.UUID | str) -> dict[str, Any] | None:
        db_user = await self._get_user(db=db, user_uuid=user_uuid, include_deleted=False)
        if db_user.get("department_id") is None:
            return None

        db_department = await crud_departments.get(
            db=db,
            id=db_user["department_id"],
            is_deleted=False,
            schema_to_select=DepartmentRead,
        )
        if db_department is None:
            raise NotFoundException("Department not found")

        user_dict = await self._build_public_user(db=db, user=dict(db_user))
        user_dict["department_abbreviation"] = db_department["abbreviation"]
        user_dict["department_abbreviation_fr"] = db_department["abbreviation_fr"]
        user_dict["department_uuid"] = db_department["uuid"]
        user_dict["department_name"] = db_department["name"]
        user_dict["department_created_at"] = db_department["created_at"]
        return user_dict

    async def update_user_tier(self, db: AsyncSession, user_uuid: uuid_pkg.UUID | str, values: UserTierUpdate) -> dict[str, str]:
        db_user = await self._get_user(db=db, user_uuid=user_uuid, include_deleted=True)
        db_tier = await crud_tiers.get(db=db, uuid=values.tier_uuid, schema_to_select=TierRead)
        if db_tier is None:
            raise NotFoundException("Tier not found")

        await crud_users.update(db=db, object={"tier_id": db_tier["id"]}, uuid=user_uuid)
        return {"message": f"User {db_user['name']} Tier updated"}

    async def update_user_department(self, db: AsyncSession, user_uuid: uuid_pkg.UUID | str, values: UserDepartmentUpdate) -> dict[str, str]:
        db_user = await self._get_user(db=db, user_uuid=user_uuid, include_deleted=False)
        department_id: int | None = None
        if values.department_abbreviation is not None:
            db_department = await crud_departments.get(
                db=db,
                abbreviation=values.department_abbreviation,
                is_deleted=False,
                schema_to_select=DepartmentRead,
            )
            if db_department is None:
                raise NotFoundException("Department not found")
            department_id = db_department["id"]

        await crud_users.update(db=db, object={"department_id": department_id}, uuid=user_uuid)
        return {"message": f"User {db_user['name']} department updated"}

    async def _get_user(self, db: AsyncSession, user_uuid: uuid_pkg.UUID | str, include_deleted: bool) -> Mapping[str, Any]:
        query: dict[str, Any] = {"db": db, "uuid": user_uuid, "schema_to_select": UserReadInternal}
        if not include_deleted:
            query["is_deleted"] = False

        db_user: Mapping[str, Any] | None = await crud_users.get(**query)
        if db_user is None:
            raise NotFoundException("User not found")
        return db_user

    async def _build_public_user(self, db: AsyncSession, user: dict[str, Any]) -> dict[str, Any]:
        public_user = {
            "accepted_terms_at": user.get("accepted_terms_at"),
            "terms_version": user.get("terms_version"),
            "auth_provider": user.get("auth_provider"),
            "department_abbreviation": None,
            "department_uuid": None,
            "email": user["email"],
            "enabled": user.get("enabled", False),
            "name": user["name"],
            "profile_image_url": user["profile_image_url"],
            "tier_uuid": None,
            "uuid": user["uuid"],
            "username": user["username"],
        }
        department_id = user.get("department_id")
        tier_id = user.get("tier_id")

        if department_id is None:
            public_user["department_abbreviation"] = None
            public_user["department_uuid"] = None
        else:
            db_department = await crud_departments.get(
                db=db,
                id=department_id,
                is_deleted=False,
                schema_to_select=DepartmentRead,
            )
            public_user["department_abbreviation"] = None if db_department is None else db_department["abbreviation"]
            public_user["department_uuid"] = None if db_department is None else db_department["uuid"]

        if tier_id is None:
            public_user["tier_uuid"] = None
        else:
            db_tier = await crud_tiers.get(db=db, id=tier_id, schema_to_select=TierRead)
            public_user["tier_uuid"] = None if db_tier is None else db_tier["uuid"]

        return public_user

    async def _build_user_access_directory_entries(
        self,
        *,
        db: AsyncSession,
        users: list[dict[str, Any]],
    ) -> list[dict[str, Any]]:
        """Project one page/search result with two bounded access queries."""

        user_ids = [user["id"] for user in users if isinstance(user.get("id"), int) and not isinstance(user.get("id"), bool)]
        if not user_ids:
            return []

        global_rows = (
            await db.execute(
                select(UserRole.user_id)
                .join(Role, Role.id == UserRole.role_id)
                .where(
                    UserRole.user_id.in_(user_ids),
                    UserRole.status == LifecycleStatus.ACTIVE.value,
                    Role.code == CanonicalRoleCode.CL_ADMIN.value,
                    Role.is_deleted.is_(False),
                )
            )
        ).all()
        partner_rows = (
            await db.execute(
                select(
                    RPApplicationAccessGrant.user_id.label("user_id"),
                    Workspace.uuid.label("workspace_uuid"),
                    Workspace.name.label("workspace_name"),
                    RPApplicationAccessGrant.role.label("role"),
                )
                .join(
                    Workspace,
                    Workspace.id == RPApplicationAccessGrant.workspace_id,
                )
                .where(
                    RPApplicationAccessGrant.user_id.in_(user_ids),
                    RPApplicationAccessGrant.status == LifecycleStatus.ACTIVE.value,
                    RPApplicationAccessGrant.is_deleted.is_(False),
                    Workspace.is_deleted.is_(False),
                )
                .order_by(
                    RPApplicationAccessGrant.user_id,
                    Workspace.name,
                    Workspace.uuid,
                )
            )
        ).all()

        global_user_ids: set[int] = set()
        for global_row in global_rows:
            if global_row.user_id in global_user_ids:
                raise BadRequestException("User authorization state is inconsistent")
            global_user_ids.add(global_row.user_id)

        workspace_access_by_user: dict[
            int,
            list[UserDirectoryWorkspaceAccessRead],
        ] = {}
        workspace_keys_by_user: dict[int, set[uuid_pkg.UUID]] = {}
        for partner_row in partner_rows:
            if partner_row.user_id in global_user_ids:
                raise BadRequestException("User authorization state is inconsistent")
            workspace_keys = workspace_keys_by_user.setdefault(partner_row.user_id, set())
            if partner_row.workspace_uuid in workspace_keys:
                raise BadRequestException("User authorization state is inconsistent")
            workspace_keys.add(partner_row.workspace_uuid)
            workspace_access_by_user.setdefault(partner_row.user_id, []).append(
                UserDirectoryWorkspaceAccessRead(
                    workspace_uuid=partner_row.workspace_uuid,
                    workspace_name=partner_row.workspace_name,
                    role=partner_row.role,
                )
            )

        directory_entries: list[dict[str, Any]] = []
        for user in users:
            user_id = user.get("id")
            if not isinstance(user_id, int) or isinstance(user_id, bool):
                raise BadRequestException("User directory record is inconsistent")
            entry = UserAccessDirectoryRead(
                uuid=user["uuid"],
                name=user["name"],
                email=user["email"],
                enabled=bool(user.get("enabled", False)),
                global_role=(CanonicalRoleCode.CL_ADMIN if user_id in global_user_ids else None),
                workspace_assignments=tuple(workspace_access_by_user.get(user_id, [])),
            )
            directory_entries.append(entry.model_dump(mode="python", by_alias=True))
        return directory_entries

    async def build_authenticated_user(
        self,
        db: AsyncSession,
        current_user: Mapping[str, Any],
    ) -> dict[str, Any]:
        """Build the safe current-user contract from request-resolved authority."""

        authorization_state = get_resolved_authorization_state(current_user)
        if authorization_state is None:
            raise ForbiddenException("Authorization state could not be resolved.")

        department_abbreviation: str | None = None
        department_uuid: uuid_pkg.UUID | None = None
        department_id = current_user.get("department_id")
        if isinstance(department_id, int):
            department = await crud_departments.get(
                db=db,
                id=department_id,
                is_deleted=False,
                schema_to_select=DepartmentRead,
            )
            if department is not None:
                department_abbreviation = department["abbreviation"]
                department_uuid = department["uuid"]

        tier_uuid: uuid_pkg.UUID | None = None
        tier_id = current_user.get("tier_id")
        if isinstance(tier_id, int):
            tier = await crud_tiers.get(
                db=db,
                id=tier_id,
                schema_to_select=TierRead,
            )
            if tier is not None:
                tier_uuid = tier["uuid"]

        response = AuthenticatedUserRead(
            uuid=current_user["uuid"],
            name=current_user["name"],
            email=current_user["email"],
            username=current_user["username"],
            department_abbreviation=department_abbreviation,
            department_uuid=department_uuid,
            tier_uuid=tier_uuid,
            profile_image_url=current_user.get(
                "profile_image_url",
                "https://www.profileimageurl.com",
            ),
            accepted_terms_at=current_user.get("accepted_terms_at"),
            terms_version=current_user.get("terms_version"),
            authorization_context=authorization_state.to_api_context(),
        )
        return response.model_dump(mode="python", by_alias=True)

    def _require_cl_admin_actor(self, current_user: Mapping[str, Any]) -> int:
        state = get_resolved_authorization_state(current_user)
        actor_id = current_user.get("id")
        if state is None or not state.is_cl_admin or not isinstance(actor_id, int) or isinstance(actor_id, bool):
            raise ForbiddenException("You do not have enough privileges.")
        return actor_id

    async def _revoke_authorization_for_deactivation(
        self,
        *,
        db: AsyncSession,
        target_user_id: int,
        actor_user_id: int,
    ) -> None:
        """Serialize deactivation with assignments and preserve the last admin."""

        authorization_service = AuthorizationService()
        initial_state = await authorization_service.resolve_for_user(
            db,
            user_id=target_user_id,
        )
        if initial_state.is_cl_admin:
            await authorization_service.revoke_cl_admin(
                db,
                target_user_id=target_user_id,
                revoked_by_user_id=actor_user_id,
            )
            return

        await lock_authorization_target_user(db, target_user_id)
        locked_state = await authorization_service.resolve_for_user(
            db,
            user_id=target_user_id,
        )
        if locked_state.is_cl_admin:
            # CL Admin mutations lock the roster before the target user. Do not
            # invert that order after already taking the target-user lock.
            raise ForbiddenException("User authorization changed; retry the operation.")

        for access in locked_state.partner_access:
            await authorization_service.revoke_partner_role(
                db,
                target_user_id=target_user_id,
                workspace_id=access.workspace_id,
                revoked_by_user_id=actor_user_id,
            )

    async def _record_user_governance_audit(
        self,
        *,
        db: AsyncSession,
        current_user: Mapping[str, Any],
        target_user: Mapping[str, Any],
        operation: str,
    ) -> None:
        await crud_audit_log.create(
            db=db,
            object=AuditLogCreateInternal(
                user=str(current_user.get("name") or "CL Admin"),
                user_uuid=current_user.get("uuid"),
                target="user",
                target_uuid=target_user.get("uuid"),
                operation=operation,
                description=f"CL Admin performed {operation.lower()} on a portal user",
            ),
        )

    async def _ensure_email_available(self, db: AsyncSession, email: str) -> None:
        if await crud_users.exists(db=db, email=email):
            raise DuplicateValueException("Email is already registered")

    async def _ensure_username_available(self, db: AsyncSession, username: str) -> None:
        if await crud_users.exists(db=db, username=username):
            raise DuplicateValueException("Username not available")

    def _ensure_self_only(self, current_user: Mapping[str, Any], db_user: Mapping[str, Any]) -> None:
        if db_user["username"] != current_user["username"]:
            raise ForbiddenException()
