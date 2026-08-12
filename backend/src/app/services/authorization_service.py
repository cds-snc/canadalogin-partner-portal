"""Server-owned resolution for the canonical four-role authorization model."""

from __future__ import annotations

import json
from collections.abc import Mapping
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any, Final, cast
from uuid import UUID

from sqlalchemy import exists, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.authorization import (
    PARTNER_ROLE_CODES,
    AssignmentSource,
    CanonicalResourceScopeDecisionPoint,
    CanonicalRoleCode,
    Capability,
    EffectiveRoleScope,
    GlobalRoleCode,
    LifecycleStatus,
    PartnerRoleCode,
    ResourceScopeDecisionReason,
    ResourceScopeRequest,
)
from ..core.exceptions.http_exceptions import (
    BadRequestException,
    DuplicateValueException,
    ForbiddenException,
    NotFoundException,
)
from ..models.audit_log import AuditLog
from ..models.role import Role
from ..models.rp_application_access_grant import RPApplicationAccessGrant
from ..models.rp_application_developer_invitation import (
    RPApplicationDeveloperInvitation,
)
from ..models.user import User
from ..models.user_role import UserRole
from ..models.workspace import Workspace
from ..schemas.authorization import (
    AuthorizationContextRead,
    ClAdminAssignmentEligibilityRead,
    ClAdminAssignmentEligibilityReason,
    PartnerAuthorizationScopeRead,
    RoleAssignmentCandidateRead,
    RoleAssignmentRead,
)
from ..schemas.authorization_audit import (
    AuthorizationActorType,
    AuthorizationAuditActor,
    AuthorizationAuditResult,
    RoleAssignmentAuditEvent,
    RoleRevocationAuditEvent,
)
from .authorization_lock_service import (
    lock_authorization_target_user,
    lock_cl_admin_roster,
    lock_workspace_identity_then_target_user,
)

AUTHORIZATION_STATE_KEY: Final = "_authorization_state"
AUTHORIZATION_CONTEXT_KEY: Final = "authorization_context"
ROLE_ASSIGNMENT_CANDIDATE_MIN_QUERY_LENGTH: Final = 2
ROLE_ASSIGNMENT_CANDIDATE_MAX_QUERY_LENGTH: Final = 100
ROLE_ASSIGNMENT_CANDIDATE_LIMIT: Final = 20


class AuthorizationResolutionError(RuntimeError):
    """Raised when persisted authorization state cannot be resolved safely."""


@dataclass(frozen=True, slots=True)
class ResolvedPartnerAccess:
    """Internal partner grant with both persistence and public workspace keys."""

    workspace_id: int
    workspace_uuid: UUID
    role: PartnerRoleCode


@dataclass(frozen=True, slots=True)
class ResolvedAuthorizationState:
    """Canonical authorization state resolved from the database for one request."""

    global_role: GlobalRoleCode | None = None
    partner_access: tuple[ResolvedPartnerAccess, ...] = ()

    def __post_init__(self) -> None:
        if self.global_role not in {None, CanonicalRoleCode.CL_ADMIN}:
            raise AuthorizationResolutionError("unsupported global role assignment")
        if self.global_role is not None and self.partner_access:
            raise AuthorizationResolutionError("global and partner assignments cannot be combined")

        workspace_ids = [access.workspace_id for access in self.partner_access]
        workspace_uuids = [access.workspace_uuid for access in self.partner_access]
        if len(workspace_ids) != len(set(workspace_ids)) or len(workspace_uuids) != len(set(workspace_uuids)):
            raise AuthorizationResolutionError("multiple active partner roles for one workspace")

    @property
    def is_cl_admin(self) -> bool:
        return self.global_role is CanonicalRoleCode.CL_ADMIN

    @property
    def role_scopes(self) -> tuple[EffectiveRoleScope, ...]:
        if self.global_role is not None:
            return (EffectiveRoleScope(role=self.global_role),)
        return tuple(
            EffectiveRoleScope(
                role=access.role,
                workspace_uuid=access.workspace_uuid,
            )
            for access in self.partner_access
        )

    @property
    def canonical_subjects(self) -> tuple[str, ...]:
        """Return stable role codes only; never direct-user or display-name subjects."""

        roles = (self.global_role,) if self.global_role is not None else tuple(access.role for access in self.partner_access)
        return tuple(dict.fromkeys(role.value for role in roles))

    def to_api_context(self) -> AuthorizationContextRead:
        return AuthorizationContextRead(
            global_role=self.global_role,
            partner_access=tuple(
                PartnerAuthorizationScopeRead(
                    workspace_uuid=access.workspace_uuid,
                    role=access.role,
                )
                for access in self.partner_access
            ),
        )

    def partner_access_by_workspace_id(self) -> dict[int, ResolvedPartnerAccess]:
        return {access.workspace_id: access for access in self.partner_access}


class AuthorizationService:
    """Resolve and mutate normalized role state at the server boundary."""

    async def resolve_for_user(
        self,
        db: AsyncSession,
        *,
        user_id: int,
    ) -> ResolvedAuthorizationState:
        global_rows = (
            await db.execute(
                select(
                    UserRole.id,
                    UserRole.status,
                    UserRole.revoked_at,
                    UserRole.revoked_by_user_id,
                    Role.code,
                    Role.is_deleted,
                )
                .join(Role, Role.id == UserRole.role_id)
                .where(UserRole.user_id == user_id)
            )
        ).all()

        active_global_roles: list[GlobalRoleCode] = []
        for (
            _assignment_id,
            status,
            revoked_at,
            revoked_by_user_id,
            role_code,
            role_is_deleted,
        ) in global_rows:
            if status not in {LifecycleStatus.ACTIVE.value, LifecycleStatus.REVOKED.value}:
                raise AuthorizationResolutionError("unknown global assignment lifecycle state")
            if status == LifecycleStatus.REVOKED.value:
                if revoked_at is None:
                    raise AuthorizationResolutionError("contradictory revoked global assignment state")
                continue
            if revoked_at is not None or revoked_by_user_id is not None:
                raise AuthorizationResolutionError("contradictory active global assignment state")
            if role_is_deleted or role_code != CanonicalRoleCode.CL_ADMIN.value:
                raise AuthorizationResolutionError("unknown or inactive global role definition")
            active_global_roles.append(CanonicalRoleCode.CL_ADMIN)

        if len(active_global_roles) > 1:
            raise AuthorizationResolutionError("multiple active CL Admin assignments")

        partner_rows = (
            await db.execute(
                select(
                    RPApplicationAccessGrant.id,
                    RPApplicationAccessGrant.status,
                    RPApplicationAccessGrant.role,
                    RPApplicationAccessGrant.is_deleted,
                    RPApplicationAccessGrant.deleted_at,
                    RPApplicationAccessGrant.revoked_at,
                    RPApplicationAccessGrant.revoked_by_user_id,
                    RPApplicationAccessGrant.workspace_id,
                    Workspace.uuid,
                    Workspace.is_deleted,
                )
                .join(Workspace, Workspace.id == RPApplicationAccessGrant.workspace_id)
                .where(RPApplicationAccessGrant.user_id == user_id)
            )
        ).all()

        active_partner_access: list[ResolvedPartnerAccess] = []
        for (
            _grant_id,
            status,
            role_value,
            is_deleted,
            deleted_at,
            revoked_at,
            revoked_by_user_id,
            workspace_id,
            workspace_uuid,
            workspace_is_deleted,
        ) in partner_rows:
            if status not in {LifecycleStatus.ACTIVE.value, LifecycleStatus.REVOKED.value}:
                raise AuthorizationResolutionError("unknown partner grant lifecycle state")
            if status == LifecycleStatus.REVOKED.value:
                if is_deleted or deleted_at is not None or revoked_at is None:
                    raise AuthorizationResolutionError("contradictory revoked partner grant state")
                continue
            if is_deleted or deleted_at is not None or revoked_at is not None or revoked_by_user_id is not None or workspace_is_deleted:
                raise AuthorizationResolutionError("contradictory active partner grant state")

            try:
                role = CanonicalRoleCode(str(role_value))
            except ValueError as exc:
                raise AuthorizationResolutionError("unknown active partner role") from exc
            if role not in PARTNER_ROLE_CODES:
                raise AuthorizationResolutionError("global role cannot be stored as partner access")

            active_partner_access.append(
                ResolvedPartnerAccess(
                    workspace_id=int(workspace_id),
                    workspace_uuid=UUID(str(workspace_uuid)),
                    role=cast(PartnerRoleCode, role),
                )
            )

        return ResolvedAuthorizationState(
            global_role=(active_global_roles[0] if active_global_roles else None),
            partner_access=tuple(
                sorted(
                    active_partner_access,
                    key=lambda access: str(access.workspace_uuid),
                )
            ),
        )

    async def list_cl_admin_assignments(
        self,
        db: AsyncSession,
        *,
        actor_user_id: int,
    ) -> list[RoleAssignmentRead]:
        """List active CL Admin assignments through a public-safe projection."""

        await self._require_active_user(db, actor_user_id)
        await self._require_cl_admin_actor(db, actor_user_id)
        rows = (
            await db.execute(
                select(
                    UserRole.uuid,
                    User.uuid,
                    User.name,
                    User.email,
                    UserRole.assigned_at,
                )
                .join(Role, Role.id == UserRole.role_id)
                .join(User, User.id == UserRole.user_id)
                .where(
                    UserRole.status == LifecycleStatus.ACTIVE.value,
                    Role.code == CanonicalRoleCode.CL_ADMIN.value,
                    Role.is_deleted.is_(False),
                    User.enabled.is_(True),
                    User.is_deleted.is_(False),
                )
                .order_by(User.name, User.email, User.uuid)
            )
        ).all()
        return [
            RoleAssignmentRead(
                assignment_uuid=assignment_uuid,
                user_uuid=user_uuid,
                user_name=user_name,
                user_email=user_email,
                role=CanonicalRoleCode.CL_ADMIN,
                workspace_uuid=None,
                assigned_at=assigned_at,
            )
            for assignment_uuid, user_uuid, user_name, user_email, assigned_at in rows
        ]

    async def assign_cl_admin_by_uuid(
        self,
        db: AsyncSession,
        *,
        target_user_uuid: UUID,
        assigned_by_user_id: int,
    ) -> RoleAssignmentRead:
        """Resolve a public user UUID and use the canonical CL Admin mutation."""

        await self._require_active_user(db, assigned_by_user_id)
        await self._require_cl_admin_actor(db, assigned_by_user_id)
        target_user = await self._require_active_user_by_uuid(db, target_user_uuid)
        assignment = await self.assign_cl_admin(
            db,
            target_user_id=target_user.id,
            assigned_by_user_id=assigned_by_user_id,
        )
        return self._global_assignment_read(assignment=assignment, target_user=target_user)

    async def get_cl_admin_assignment_eligibility(
        self,
        db: AsyncSession,
        *,
        target_user_uuid: UUID,
        actor_user_id: int,
    ) -> ClAdminAssignmentEligibilityRead:
        """Return the canonical server-owned CL Admin assignment decision."""

        await self._require_active_user(db, actor_user_id)
        await self._require_cl_admin_actor(db, actor_user_id)
        target_user = (
            (
                await db.execute(
                    select(User).where(
                        User.uuid == target_user_uuid,
                        User.is_deleted.is_(False),
                    )
                )
            )
            .scalars()
            .one_or_none()
        )
        if target_user is None:
            raise NotFoundException("User not found")
        if not target_user.enabled:
            return ClAdminAssignmentEligibilityRead(
                user_uuid=target_user.uuid,
                eligible=False,
                reason=ClAdminAssignmentEligibilityReason.INACTIVE_USER,
            )

        target_state = await self.resolve_for_user(db, user_id=target_user.id)
        if target_state.global_role is not None:
            return ClAdminAssignmentEligibilityRead(
                user_uuid=target_user.uuid,
                eligible=False,
                reason=ClAdminAssignmentEligibilityReason.ALREADY_CL_ADMIN,
            )
        if target_state.partner_access:
            return ClAdminAssignmentEligibilityRead(
                user_uuid=target_user.uuid,
                eligible=False,
                reason=ClAdminAssignmentEligibilityReason.ACTIVE_PARTNER_ACCESS,
            )
        return ClAdminAssignmentEligibilityRead(
            user_uuid=target_user.uuid,
            eligible=True,
            reason=ClAdminAssignmentEligibilityReason.ELIGIBLE,
        )

    async def revoke_cl_admin_by_uuid(
        self,
        db: AsyncSession,
        *,
        target_user_uuid: UUID,
        revoked_by_user_id: int,
    ) -> None:
        """Resolve a public user UUID and use the canonical CL Admin revocation."""

        await self._require_active_user(db, revoked_by_user_id)
        await self._require_cl_admin_actor(db, revoked_by_user_id)
        target_user = await self._require_active_user_by_uuid(db, target_user_uuid)
        await self.revoke_cl_admin(
            db,
            target_user_id=target_user.id,
            revoked_by_user_id=revoked_by_user_id,
        )

    async def list_workspace_role_assignments(
        self,
        db: AsyncSession,
        *,
        workspace_uuid: UUID,
        actor_user_id: int,
    ) -> list[RoleAssignmentRead]:
        """List active canonical partner assignments for an authorized workspace."""

        await self._require_workspace_role_management_scope(
            db,
            actor_user_id=actor_user_id,
            workspace_uuid=workspace_uuid,
            managed_roles=frozenset(),
        )
        workspace = await self._require_active_workspace_by_uuid(db, workspace_uuid)
        partner_role_values = tuple(sorted(role.value for role in PARTNER_ROLE_CODES))
        rows = (
            await db.execute(
                select(
                    RPApplicationAccessGrant.uuid,
                    User.uuid,
                    User.name,
                    User.email,
                    RPApplicationAccessGrant.role,
                    Workspace.uuid,
                    RPApplicationAccessGrant.created_at,
                )
                .join(User, User.id == RPApplicationAccessGrant.user_id)
                .join(Workspace, Workspace.id == RPApplicationAccessGrant.workspace_id)
                .where(
                    RPApplicationAccessGrant.workspace_id == workspace.id,
                    RPApplicationAccessGrant.status == LifecycleStatus.ACTIVE.value,
                    RPApplicationAccessGrant.is_deleted.is_(False),
                    RPApplicationAccessGrant.role.in_(partner_role_values),
                    User.enabled.is_(True),
                    User.is_deleted.is_(False),
                    Workspace.is_deleted.is_(False),
                )
                .order_by(User.name, User.email, User.uuid)
            )
        ).all()
        return [
            RoleAssignmentRead(
                assignment_uuid=assignment_uuid,
                user_uuid=user_uuid,
                user_name=user_name,
                user_email=user_email,
                role=CanonicalRoleCode(role),
                workspace_uuid=row_workspace_uuid,
                assigned_at=assigned_at,
            )
            for (
                assignment_uuid,
                user_uuid,
                user_name,
                user_email,
                role,
                row_workspace_uuid,
                assigned_at,
            ) in rows
        ]

    async def search_workspace_role_assignment_candidates(
        self,
        db: AsyncSession,
        *,
        workspace_uuid: UUID,
        actor_user_id: int,
        query: str,
    ) -> list[RoleAssignmentCandidateRead]:
        """Search a bounded set of enabled users eligible for partner access."""

        normalized_query = self._normalize_candidate_query(query)
        actor_state = await self._require_workspace_role_management_scope(
            db,
            actor_user_id=actor_user_id,
            workspace_uuid=workspace_uuid,
            managed_roles=frozenset(),
        )
        workspace = await self._require_active_workspace_by_uuid(db, workspace_uuid)
        has_active_global_assignment = exists(
            select(UserRole.id).where(
                UserRole.user_id == User.id,
                UserRole.status == LifecycleStatus.ACTIVE.value,
            )
        )
        has_active_workspace_assignment = exists(
            select(RPApplicationAccessGrant.id).where(
                RPApplicationAccessGrant.user_id == User.id,
                RPApplicationAccessGrant.workspace_id == workspace.id,
                RPApplicationAccessGrant.status == LifecycleStatus.ACTIVE.value,
            )
        )
        if actor_state.is_cl_admin:
            escaped_query = self._escape_like_pattern(normalized_query)
            match_pattern = f"%{escaped_query}%"
            candidate_match = or_(
                User.name.ilike(match_pattern, escape="\\"),
                User.email.ilike(match_pattern, escape="\\"),
                User.username.ilike(match_pattern, escape="\\"),
            )
        else:
            # A scoped RP Admin may look up only a known identity. Requiring an
            # exact canonical email prevents this endpoint from becoming a
            # cross-workspace directory search while retaining the assignment
            # workflow for eligible users.
            candidate_match = User.email == normalized_query.lower()
        rows = (
            await db.execute(
                select(User.uuid, User.name, User.email)
                .where(
                    User.enabled.is_(True),
                    User.is_deleted.is_(False),
                    ~has_active_global_assignment,
                    ~has_active_workspace_assignment,
                    candidate_match,
                )
                .order_by(User.name, User.email, User.uuid)
                .limit(ROLE_ASSIGNMENT_CANDIDATE_LIMIT)
            )
        ).all()
        return [RoleAssignmentCandidateRead(uuid=user_uuid, name=name, email=email) for user_uuid, name, email in rows]

    async def assign_partner_role_by_uuid(
        self,
        db: AsyncSession,
        *,
        workspace_uuid: UUID,
        target_user_uuid: UUID,
        role: CanonicalRoleCode | str,
        assigned_by_user_id: int,
    ) -> RoleAssignmentRead:
        """Resolve public IDs and create one canonical workspace assignment."""

        canonical_role = self._parse_partner_role(role)
        await self._require_workspace_role_management_scope(
            db,
            actor_user_id=assigned_by_user_id,
            workspace_uuid=workspace_uuid,
            managed_roles=frozenset({canonical_role}),
        )
        workspace = await self._require_active_workspace_by_uuid(db, workspace_uuid)
        await self._require_partner_mutation_authority(
            db,
            actor_user_id=assigned_by_user_id,
            workspace=workspace,
            managed_roles=frozenset({canonical_role}),
        )
        target_user = await self._require_active_user_by_uuid(db, target_user_uuid)
        assignment = await self.assign_partner_role(
            db,
            target_user_id=target_user.id,
            workspace_id=workspace.id,
            role=canonical_role,
            assigned_by_user_id=assigned_by_user_id,
        )
        return self._partner_assignment_read(
            assignment=assignment,
            target_user=target_user,
            workspace=workspace,
        )

    async def replace_partner_role_by_uuid(
        self,
        db: AsyncSession,
        *,
        workspace_uuid: UUID,
        target_user_uuid: UUID,
        role: CanonicalRoleCode | str,
        replaced_by_user_id: int,
    ) -> RoleAssignmentRead:
        """Resolve public IDs and atomically replace one workspace assignment."""

        canonical_role = self._parse_partner_role(role)
        await self._require_workspace_role_management_scope(
            db,
            actor_user_id=replaced_by_user_id,
            workspace_uuid=workspace_uuid,
            managed_roles=frozenset({canonical_role}),
        )
        workspace = await self._require_active_workspace_by_uuid(db, workspace_uuid)
        await self._require_workspace_role_management_actor(
            db,
            actor_user_id=replaced_by_user_id,
            workspace=workspace,
        )
        if canonical_role is CanonicalRoleCode.RP_ADMIN:
            await self._require_partner_mutation_authority(
                db,
                actor_user_id=replaced_by_user_id,
                workspace=workspace,
                managed_roles=frozenset({canonical_role}),
            )
        target_user = await self._require_active_user_by_uuid(db, target_user_uuid)
        assignment = await self.replace_partner_role(
            db,
            target_user_id=target_user.id,
            workspace_id=workspace.id,
            role=canonical_role,
            replaced_by_user_id=replaced_by_user_id,
        )
        return self._partner_assignment_read(
            assignment=assignment,
            target_user=target_user,
            workspace=workspace,
        )

    async def revoke_partner_role_by_uuid(
        self,
        db: AsyncSession,
        *,
        workspace_uuid: UUID,
        target_user_uuid: UUID,
        revoked_by_user_id: int,
    ) -> None:
        """Resolve public IDs and revoke one canonical workspace assignment."""

        await self._require_workspace_role_management_scope(
            db,
            actor_user_id=revoked_by_user_id,
            workspace_uuid=workspace_uuid,
            managed_roles=frozenset(),
        )
        workspace = await self._require_active_workspace_by_uuid(db, workspace_uuid)
        await self._require_workspace_role_management_actor(
            db,
            actor_user_id=revoked_by_user_id,
            workspace=workspace,
        )
        target_user = await self._require_active_user_by_uuid(db, target_user_uuid)
        await self.revoke_partner_role(
            db,
            target_user_id=target_user.id,
            workspace_id=workspace.id,
            revoked_by_user_id=revoked_by_user_id,
        )

    async def assign_cl_admin(
        self,
        db: AsyncSession,
        *,
        target_user_id: int,
        assigned_by_user_id: int,
    ) -> UserRole:
        """Create a new active CL Admin assignment under roster/user locks."""

        await lock_cl_admin_roster(db)
        await lock_authorization_target_user(db, target_user_id)
        actor = await self._require_active_user(db, assigned_by_user_id)
        await self._require_cl_admin_actor(db, actor.id)
        target_user = await self._require_active_user(db, target_user_id)
        target_state = await self.resolve_for_user(db, user_id=target_user_id)
        if target_state.global_role is not None:
            raise DuplicateValueException("User already has an active CL Admin assignment")
        if target_state.partner_access:
            raise BadRequestException("CL Admin cannot be combined with an active partner assignment")

        role = (
            (
                await db.execute(
                    select(Role)
                    .where(
                        Role.code == CanonicalRoleCode.CL_ADMIN.value,
                        Role.is_deleted.is_(False),
                    )
                    .with_for_update()
                )
            )
            .scalars()
            .one_or_none()
        )
        if role is None:
            raise NotFoundException("Canonical CL Admin role definition not found")

        assigned_at = datetime.now(UTC)
        assignment = UserRole(
            user_id=target_user_id,
            role_id=role.id,
            status=LifecycleStatus.ACTIVE.value,
            assignment_source=AssignmentSource.ADMIN.value,
            assigned_at=assigned_at,
            assigned_by_user_id=assigned_by_user_id,
        )
        db.add(assignment)
        self._record_assignment_audit(
            db,
            actor=actor,
            target_user=target_user,
            assignment_uuid=assignment.uuid,
            role=CanonicalRoleCode.CL_ADMIN,
            workspace_uuid=None,
            previous_role=None,
            timestamp=assigned_at,
        )
        await db.flush()
        return assignment

    async def revoke_cl_admin(
        self,
        db: AsyncSession,
        *,
        target_user_id: int,
        revoked_by_user_id: int,
    ) -> UserRole:
        """Revoke a CL Admin while transactionally protecting the final admin."""

        await lock_cl_admin_roster(db)
        await lock_authorization_target_user(db, target_user_id)
        actor = await self._require_active_user(db, revoked_by_user_id)
        await self._require_cl_admin_actor(db, actor.id)
        target_user = await self._require_active_user(db, target_user_id)
        target_state = await self.resolve_for_user(db, user_id=target_user_id)
        if not target_state.is_cl_admin:
            raise NotFoundException("Active CL Admin assignment not found")

        assignments = (
            (
                await db.execute(
                    select(UserRole)
                    .join(Role, Role.id == UserRole.role_id)
                    .join(User, User.id == UserRole.user_id)
                    .where(
                        UserRole.status == LifecycleStatus.ACTIVE.value,
                        Role.code == CanonicalRoleCode.CL_ADMIN.value,
                        Role.is_deleted.is_(False),
                        User.enabled.is_(True),
                        User.is_deleted.is_(False),
                    )
                    .with_for_update()
                )
            )
            .scalars()
            .all()
        )
        target = next(
            (assignment for assignment in assignments if assignment.user_id == target_user_id),
            None,
        )
        if target is None:
            raise NotFoundException("Active CL Admin assignment not found")
        if len(assignments) <= 1:
            raise ForbiddenException("The last active CL Admin cannot be revoked.")

        revoked_at = datetime.now(UTC)
        target.status = LifecycleStatus.REVOKED.value
        target.revoked_at = revoked_at
        target.revoked_by_user_id = revoked_by_user_id
        target.updated_at = revoked_at
        self._record_revocation_audit(
            db,
            actor=actor,
            target_user=target_user,
            assignment_uuid=target.uuid,
            role=CanonicalRoleCode.CL_ADMIN,
            workspace_uuid=None,
            timestamp=revoked_at,
        )
        await db.flush()
        return target

    async def assign_partner_role(
        self,
        db: AsyncSession,
        *,
        target_user_id: int,
        workspace_id: int,
        role: CanonicalRoleCode | str,
        assigned_by_user_id: int,
        source_invitation_uuid: UUID | None = None,
    ) -> RPApplicationAccessGrant:
        """Assign one new canonical partner role without reusing history."""

        canonical_role = self._parse_partner_role(role)
        workspace = await self._require_active_workspace(db, workspace_id)
        actor = await self._require_partner_mutation_authority(
            db,
            actor_user_id=assigned_by_user_id,
            workspace=workspace,
            managed_roles=frozenset({canonical_role}),
        )
        target_user = await self._require_active_user(db, target_user_id)
        await lock_workspace_identity_then_target_user(
            db,
            workspace_id=workspace_id,
            email=target_user.email,
            target_user_id=target_user_id,
        )
        if source_invitation_uuid is None:
            await self._ensure_no_pending_invitation_for_target(
                db,
                workspace_id=workspace_id,
                target_email=target_user.email,
            )
        target_state = await self.resolve_for_user(db, user_id=target_user_id)
        if target_state.global_role is not None:
            raise BadRequestException("Partner access cannot be combined with an active CL Admin assignment")
        if workspace_id in target_state.partner_access_by_workspace_id():
            raise DuplicateValueException("User already has an active partner role in this workspace")

        assigned_at = datetime.now(UTC)
        grant = RPApplicationAccessGrant(
            workspace_id=workspace_id,
            user_id=target_user_id,
            role=canonical_role.value,
            status=LifecycleStatus.ACTIVE.value,
            source_invitation_uuid=source_invitation_uuid,
        )
        db.add(grant)
        self._record_assignment_audit(
            db,
            actor=actor,
            target_user=target_user,
            assignment_uuid=grant.uuid,
            role=canonical_role,
            workspace_uuid=workspace.uuid,
            previous_role=None,
            timestamp=assigned_at,
        )
        await db.flush()
        return grant

    async def _ensure_no_pending_invitation_for_target(
        self,
        db: AsyncSession,
        *,
        workspace_id: int,
        target_email: str,
    ) -> None:
        """Reject direct assignment while invitation authority is pending.

        Callers hold the shared workspace/email lifecycle lock, so this check
        and the subsequent grant insert are serialized with invitation
        creation and reissue for the same normalized identity.
        """

        normalized_email = target_email.strip().lower()
        pending_invitation_uuid = (
            (
                await db.execute(
                    select(RPApplicationDeveloperInvitation.uuid)
                    .where(
                        RPApplicationDeveloperInvitation.workspace_id == workspace_id,
                        func.lower(func.btrim(RPApplicationDeveloperInvitation.invited_email)) == normalized_email,
                        RPApplicationDeveloperInvitation.status == LifecycleStatus.PENDING.value,
                        RPApplicationDeveloperInvitation.is_deleted.is_(False),
                    )
                    .limit(1)
                )
            )
            .scalars()
            .one_or_none()
        )
        if pending_invitation_uuid is not None:
            raise DuplicateValueException(
                "A pending invitation already exists for this identity and partner context; revoke it before assigning a role directly"
            )

    async def replace_partner_role(
        self,
        db: AsyncSession,
        *,
        target_user_id: int,
        workspace_id: int,
        role: CanonicalRoleCode | str,
        replaced_by_user_id: int,
    ) -> RPApplicationAccessGrant:
        """Atomically revoke the current partner role and create its replacement."""

        canonical_role = self._parse_partner_role(role)
        await lock_authorization_target_user(db, target_user_id)
        workspace = await self._require_active_workspace(db, workspace_id)
        target_user = await self._require_active_user(db, target_user_id)
        target_state = await self.resolve_for_user(db, user_id=target_user_id)
        if target_state.global_role is not None:
            raise BadRequestException("Partner access cannot be combined with an active CL Admin assignment")
        resolved_access = target_state.partner_access_by_workspace_id().get(workspace_id)
        if resolved_access is None:
            raise NotFoundException("Active partner role assignment not found")
        if resolved_access.role is canonical_role:
            raise BadRequestException("Replacement role must differ from the active role")

        actor = await self._require_partner_mutation_authority(
            db,
            actor_user_id=replaced_by_user_id,
            workspace=workspace,
            managed_roles=frozenset({resolved_access.role, canonical_role}),
        )
        active_grant = await self._get_active_partner_grant_for_update(
            db,
            target_user_id=target_user_id,
            workspace_id=workspace_id,
        )
        if active_grant is None:
            raise NotFoundException("Active partner role assignment not found")

        replaced_at = datetime.now(UTC)
        active_grant.status = LifecycleStatus.REVOKED.value
        active_grant.revoked_at = replaced_at
        active_grant.revoked_by_user_id = replaced_by_user_id
        active_grant.updated_at = replaced_at

        replacement = RPApplicationAccessGrant(
            workspace_id=workspace_id,
            user_id=target_user_id,
            role=canonical_role.value,
            status=LifecycleStatus.ACTIVE.value,
            source_invitation_uuid=None,
        )
        db.add(replacement)
        self._record_revocation_audit(
            db,
            actor=actor,
            target_user=target_user,
            assignment_uuid=active_grant.uuid,
            role=resolved_access.role,
            workspace_uuid=workspace.uuid,
            timestamp=replaced_at,
        )
        self._record_assignment_audit(
            db,
            actor=actor,
            target_user=target_user,
            assignment_uuid=replacement.uuid,
            role=canonical_role,
            workspace_uuid=workspace.uuid,
            previous_role=resolved_access.role,
            timestamp=replaced_at,
        )
        await db.flush()
        return replacement

    async def revoke_partner_role(
        self,
        db: AsyncSession,
        *,
        target_user_id: int,
        workspace_id: int,
        revoked_by_user_id: int,
    ) -> RPApplicationAccessGrant:
        """Revoke the active canonical partner role while retaining history."""

        await lock_authorization_target_user(db, target_user_id)
        workspace = await self._require_active_workspace(db, workspace_id)
        target_user = await self._require_active_user(db, target_user_id)
        target_state = await self.resolve_for_user(db, user_id=target_user_id)
        if target_state.global_role is not None:
            raise BadRequestException("Partner access cannot be combined with an active CL Admin assignment")
        resolved_access = target_state.partner_access_by_workspace_id().get(workspace_id)
        if resolved_access is None:
            raise NotFoundException("Active partner role assignment not found")

        actor = await self._require_partner_mutation_authority(
            db,
            actor_user_id=revoked_by_user_id,
            workspace=workspace,
            managed_roles=frozenset({resolved_access.role}),
        )
        active_grant = await self._get_active_partner_grant_for_update(
            db,
            target_user_id=target_user_id,
            workspace_id=workspace_id,
        )
        if active_grant is None:
            raise NotFoundException("Active partner role assignment not found")

        revoked_at = datetime.now(UTC)
        active_grant.status = LifecycleStatus.REVOKED.value
        active_grant.revoked_at = revoked_at
        active_grant.revoked_by_user_id = revoked_by_user_id
        active_grant.updated_at = revoked_at
        self._record_revocation_audit(
            db,
            actor=actor,
            target_user=target_user,
            assignment_uuid=active_grant.uuid,
            role=resolved_access.role,
            workspace_uuid=workspace.uuid,
            timestamp=revoked_at,
        )
        await db.flush()
        return active_grant

    async def _require_active_user_by_uuid(
        self,
        db: AsyncSession,
        user_uuid: UUID,
    ) -> User:
        user = (
            (
                await db.execute(
                    select(User).where(
                        User.uuid == user_uuid,
                        User.enabled.is_(True),
                        User.is_deleted.is_(False),
                    )
                )
            )
            .scalars()
            .one_or_none()
        )
        if user is None:
            raise NotFoundException("User not found")
        return user

    async def _require_active_workspace_by_uuid(
        self,
        db: AsyncSession,
        workspace_uuid: UUID,
    ) -> Workspace:
        workspace = (
            (
                await db.execute(
                    select(Workspace).where(
                        Workspace.uuid == workspace_uuid,
                        Workspace.is_deleted.is_(False),
                    )
                )
            )
            .scalars()
            .one_or_none()
        )
        if workspace is None:
            raise NotFoundException("Workspace not found")
        return workspace

    async def _require_workspace_role_management_actor(
        self,
        db: AsyncSession,
        *,
        actor_user_id: int,
        workspace: Workspace,
    ) -> User:
        return await self._require_partner_mutation_authority(
            db,
            actor_user_id=actor_user_id,
            workspace=workspace,
            managed_roles=frozenset(),
        )

    async def _require_workspace_role_management_scope(
        self,
        db: AsyncSession,
        *,
        actor_user_id: int,
        workspace_uuid: UUID,
        managed_roles: frozenset[CanonicalRoleCode],
    ) -> ResolvedAuthorizationState:
        """Authorize a workspace UUID before loading the protected workspace.

        The pre-resource decision prevents an out-of-scope partner administrator
        from using role-management responses to distinguish an existing workspace
        from a nonexistent one. Mutation methods repeat authority checks after
        their transaction locks are acquired.
        """

        await self._require_active_user(db, actor_user_id)
        try:
            actor_state = await self.resolve_for_user(db, user_id=actor_user_id)
        except AuthorizationResolutionError as exc:
            raise ForbiddenException("Authorization state could not be resolved") from exc

        capability = Capability.RP_ADMIN_ASSIGNMENT if CanonicalRoleCode.RP_ADMIN in managed_roles else Capability.PARTNER_STAFF_ASSIGNMENT
        decision = CanonicalResourceScopeDecisionPoint().decide(
            ResourceScopeRequest(
                role_scopes=actor_state.role_scopes,
                capability=capability,
                resource_workspace_uuid=workspace_uuid,
            )
        )
        if decision.allowed:
            return actor_state
        if decision.reason in {
            ResourceScopeDecisionReason.NO_ACTIVE_ASSIGNMENT,
            ResourceScopeDecisionReason.CONFLICTING_ASSIGNMENTS,
            ResourceScopeDecisionReason.WORKSPACE_SCOPE_REQUIRED,
            ResourceScopeDecisionReason.WORKSPACE_SCOPE_MISMATCH,
        }:
            raise NotFoundException("Workspace not found")
        if CanonicalRoleCode.RP_ADMIN in managed_roles:
            raise ForbiddenException("Only CL Admin can manage RP Admin assignments")
        raise ForbiddenException("Only same-workspace RP Admin can manage partner staff assignments")

    @staticmethod
    def _global_assignment_read(
        *,
        assignment: UserRole,
        target_user: User,
    ) -> RoleAssignmentRead:
        return RoleAssignmentRead(
            assignment_uuid=assignment.uuid,
            user_uuid=target_user.uuid,
            user_name=target_user.name,
            user_email=target_user.email,
            role=CanonicalRoleCode.CL_ADMIN,
            workspace_uuid=None,
            assigned_at=assignment.assigned_at,
        )

    @staticmethod
    def _partner_assignment_read(
        *,
        assignment: RPApplicationAccessGrant,
        target_user: User,
        workspace: Workspace,
    ) -> RoleAssignmentRead:
        return RoleAssignmentRead(
            assignment_uuid=assignment.uuid,
            user_uuid=target_user.uuid,
            user_name=target_user.name,
            user_email=target_user.email,
            role=CanonicalRoleCode(assignment.role),
            workspace_uuid=workspace.uuid,
            assigned_at=assignment.created_at,
        )

    @staticmethod
    def _normalize_candidate_query(query: str) -> str:
        normalized_query = query.strip()
        if not (ROLE_ASSIGNMENT_CANDIDATE_MIN_QUERY_LENGTH <= len(normalized_query) <= ROLE_ASSIGNMENT_CANDIDATE_MAX_QUERY_LENGTH):
            raise BadRequestException("Search query must contain between 2 and 100 characters")
        return normalized_query

    @staticmethod
    def _escape_like_pattern(query: str) -> str:
        return query.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")

    async def _require_active_user(self, db: AsyncSession, user_id: int) -> User:
        user = (
            (
                await db.execute(
                    select(User).where(
                        User.id == user_id,
                        User.enabled.is_(True),
                        User.is_deleted.is_(False),
                    )
                )
            )
            .scalars()
            .one_or_none()
        )
        if user is None:
            raise NotFoundException("User not found")
        return user

    async def _require_active_workspace(
        self,
        db: AsyncSession,
        workspace_id: int,
    ) -> Workspace:
        workspace = (
            (
                await db.execute(
                    select(Workspace).where(
                        Workspace.id == workspace_id,
                        Workspace.is_deleted.is_(False),
                    )
                )
            )
            .scalars()
            .one_or_none()
        )
        if workspace is None:
            raise NotFoundException("Workspace not found")
        return workspace

    async def _require_cl_admin_actor(self, db: AsyncSession, user_id: int) -> None:
        try:
            state = await self.resolve_for_user(db, user_id=user_id)
        except AuthorizationResolutionError as exc:
            raise ForbiddenException("Authorization state could not be resolved") from exc
        if not state.is_cl_admin:
            raise ForbiddenException("Only CL Admin can perform this role mutation")

    async def _require_partner_mutation_authority(
        self,
        db: AsyncSession,
        *,
        actor_user_id: int,
        workspace: Workspace,
        managed_roles: frozenset[CanonicalRoleCode],
    ) -> User:
        actor = await self._require_active_user(db, actor_user_id)
        try:
            actor_state = await self.resolve_for_user(db, user_id=actor_user_id)
        except AuthorizationResolutionError as exc:
            raise ForbiddenException("Authorization state could not be resolved") from exc
        if actor_state.is_cl_admin:
            return actor
        if CanonicalRoleCode.RP_ADMIN in managed_roles:
            raise ForbiddenException("Only CL Admin can manage RP Admin assignments")

        actor_access = actor_state.partner_access_by_workspace_id().get(workspace.id)
        if actor_access is None or actor_access.workspace_uuid != workspace.uuid or actor_access.role is not CanonicalRoleCode.RP_ADMIN:
            raise ForbiddenException("Only same-workspace RP Admin can manage partner staff assignments")
        return actor

    async def _get_active_partner_grant_for_update(
        self,
        db: AsyncSession,
        *,
        target_user_id: int,
        workspace_id: int,
    ) -> RPApplicationAccessGrant | None:
        return (
            (
                await db.execute(
                    select(RPApplicationAccessGrant)
                    .where(
                        RPApplicationAccessGrant.user_id == target_user_id,
                        RPApplicationAccessGrant.workspace_id == workspace_id,
                        RPApplicationAccessGrant.status == LifecycleStatus.ACTIVE.value,
                        RPApplicationAccessGrant.is_deleted.is_(False),
                    )
                    .with_for_update()
                )
            )
            .scalars()
            .one_or_none()
        )

    def _parse_partner_role(
        self,
        role: CanonicalRoleCode | str,
    ) -> PartnerRoleCode:
        try:
            canonical_role = CanonicalRoleCode(role)
        except ValueError as exc:
            raise BadRequestException("Unsupported partner role") from exc
        if canonical_role not in PARTNER_ROLE_CODES:
            raise BadRequestException("Unsupported partner role")
        return cast(PartnerRoleCode, canonical_role)

    def _record_assignment_audit(
        self,
        db: AsyncSession,
        *,
        actor: User,
        target_user: User,
        assignment_uuid: UUID,
        role: CanonicalRoleCode,
        workspace_uuid: UUID | None,
        previous_role: PartnerRoleCode | None,
        timestamp: datetime,
    ) -> None:
        event = RoleAssignmentAuditEvent(
            timestamp=timestamp,
            actor=AuthorizationAuditActor(
                type=AuthorizationActorType.USER,
                user_uuid=actor.uuid,
            ),
            result=AuthorizationAuditResult.SUCCEEDED,
            assignment_uuid=assignment_uuid,
            target_user_uuid=target_user.uuid,
            role=role,
            workspace_uuid=workspace_uuid,
            assignment_source=AssignmentSource.ADMIN,
            previous_role=previous_role,
        )
        db.add(
            AuditLog(
                user="authorization_actor",
                user_uuid=actor.uuid,
                target="authorization_assignment",
                target_uuid=target_user.uuid,
                operation="role_assign",
                description=json.dumps(event.model_dump(mode="json"), separators=(",", ":")),
            )
        )

    def _record_revocation_audit(
        self,
        db: AsyncSession,
        *,
        actor: User,
        target_user: User,
        assignment_uuid: UUID,
        role: CanonicalRoleCode,
        workspace_uuid: UUID | None,
        timestamp: datetime,
    ) -> None:
        event = RoleRevocationAuditEvent(
            timestamp=timestamp,
            actor=AuthorizationAuditActor(
                type=AuthorizationActorType.USER,
                user_uuid=actor.uuid,
            ),
            result=AuthorizationAuditResult.SUCCEEDED,
            assignment_uuid=assignment_uuid,
            target_user_uuid=target_user.uuid,
            role=role,
            workspace_uuid=workspace_uuid,
        )
        db.add(
            AuditLog(
                user="authorization_actor",
                user_uuid=actor.uuid,
                target="authorization_assignment",
                target_uuid=target_user.uuid,
                operation="role_revoke",
                description=json.dumps(event.model_dump(mode="json"), separators=(",", ":")),
            )
        )


def get_resolved_authorization_state(
    current_user: Mapping[str, Any],
) -> ResolvedAuthorizationState | None:
    state = current_user.get(AUTHORIZATION_STATE_KEY)
    return state if isinstance(state, ResolvedAuthorizationState) else None


def is_current_user_cl_admin(current_user: Mapping[str, Any]) -> bool:
    """Check the request-resolved state without consulting legacy user columns."""

    state = get_resolved_authorization_state(current_user)
    if state is not None:
        return state.is_cl_admin

    raw_context = current_user.get(AUTHORIZATION_CONTEXT_KEY)
    if raw_context is None:
        return False
    try:
        context = raw_context if isinstance(raw_context, AuthorizationContextRead) else AuthorizationContextRead.model_validate(raw_context)
    except (TypeError, ValueError):
        return False
    return context.global_role is CanonicalRoleCode.CL_ADMIN


def canonical_subjects_for_user(current_user: Mapping[str, Any]) -> tuple[str, ...]:
    """Derive policy subjects only from a validated canonical request context."""

    state = get_resolved_authorization_state(current_user)
    if state is not None:
        return state.canonical_subjects

    raw_context = current_user.get(AUTHORIZATION_CONTEXT_KEY)
    if raw_context is None:
        return ()
    try:
        context = raw_context if isinstance(raw_context, AuthorizationContextRead) else AuthorizationContextRead.model_validate(raw_context)
    except (TypeError, ValueError):
        return ()

    roles = (context.global_role,) if context.global_role is not None else tuple(access.role for access in context.partner_access)
    return tuple(dict.fromkeys(role.value for role in roles))


__all__ = [
    "AUTHORIZATION_CONTEXT_KEY",
    "AUTHORIZATION_STATE_KEY",
    "ROLE_ASSIGNMENT_CANDIDATE_LIMIT",
    "ROLE_ASSIGNMENT_CANDIDATE_MAX_QUERY_LENGTH",
    "ROLE_ASSIGNMENT_CANDIDATE_MIN_QUERY_LENGTH",
    "AuthorizationResolutionError",
    "AuthorizationService",
    "ResolvedAuthorizationState",
    "ResolvedPartnerAccess",
    "canonical_subjects_for_user",
    "get_resolved_authorization_state",
    "is_current_user_cl_admin",
]
