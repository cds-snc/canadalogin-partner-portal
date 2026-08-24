"""Transactional bootstrap for the configured canonical CL Admin roster."""

import json
from dataclasses import dataclass
from datetime import UTC, datetime

from email_validator import EmailNotValidError, validate_email
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.authorization import (
    CL_ADMIN_ROLE_UUID,
    AssignmentSource,
    CanonicalRoleCode,
    LifecycleStatus,
)
from ..models.audit_log import AuditLog
from ..models.role import Role
from ..models.rp_application_access_grant import RPApplicationAccessGrant
from ..models.user import User
from ..models.user_role import UserRole
from .authorization_lock_service import (
    lock_authorization_target_user,
    lock_cl_admin_roster,
)


class CLAdminRosterConfigurationError(RuntimeError):
    """Raised when roster configuration is absent in an invalid form."""


class CLAdminRosterConflictError(RuntimeError):
    """Raised when an existing identity cannot safely receive CL Admin."""


@dataclass(frozen=True, slots=True)
class CLAdminRosterBootstrapOutcome:
    """Aggregate, non-identifying result of an explicit bootstrap run."""

    created_users: int = 0
    created_assignments: int = 0
    unchanged_assignments: int = 0
    skipped: bool = False


def parse_initial_cl_admin_emails(value: str | None) -> tuple[str, ...] | None:
    """Return a normalized roster or fail without exposing its configured values."""

    if value is None:
        return None
    if not isinstance(value, str) or not value.strip():
        raise CLAdminRosterConfigurationError("INITIAL_CL_ADMIN_EMAILS must be a non-empty JSON array")

    try:
        values = json.loads(value)
    except (TypeError, json.JSONDecodeError) as exc:
        raise CLAdminRosterConfigurationError("INITIAL_CL_ADMIN_EMAILS must be valid JSON") from exc

    if not isinstance(values, list) or not values:
        raise CLAdminRosterConfigurationError("INITIAL_CL_ADMIN_EMAILS must be a non-empty JSON array")

    normalized_values: list[str] = []
    for item in values:
        if not isinstance(item, str):
            raise CLAdminRosterConfigurationError("INITIAL_CL_ADMIN_EMAILS entries must be email addresses")
        normalized = item.strip().lower()
        if not normalized:
            raise CLAdminRosterConfigurationError("INITIAL_CL_ADMIN_EMAILS entries must be email addresses")
        try:
            validated = validate_email(
                normalized,
                check_deliverability=False,
                test_environment=True,
            ).normalized
        except EmailNotValidError as exc:
            raise CLAdminRosterConfigurationError("INITIAL_CL_ADMIN_EMAILS entries must be email addresses") from exc
        if validated != normalized:
            raise CLAdminRosterConfigurationError("INITIAL_CL_ADMIN_EMAILS entries must be email addresses")
        normalized_values.append(normalized)

    if len(normalized_values) != len(set(normalized_values)):
        raise CLAdminRosterConfigurationError("INITIAL_CL_ADMIN_EMAILS must not contain duplicate identities")
    return tuple(sorted(normalized_values))


class CLAdminRosterBootstrapService:
    """Create a configured CL Admin roster through one atomic transaction."""

    async def bootstrap(
        self,
        session: AsyncSession,
        *,
        configured_emails: str | None,
    ) -> CLAdminRosterBootstrapOutcome:
        roster = parse_initial_cl_admin_emails(configured_emails)
        if roster is None:
            return CLAdminRosterBootstrapOutcome(skipped=True)

        created_users = 0
        created_assignments = 0
        unchanged_assignments = 0
        try:
            await lock_cl_admin_roster(session)
            role = await self._ensure_cl_admin_role(session)
            for email in roster:
                user, created_user = await self._resolve_bootstrap_user(session, email)
                if created_user:
                    created_users += 1
                assignment_created = await self._ensure_cl_admin_assignment(session, user=user, role=role)
                if assignment_created:
                    created_assignments += 1
                else:
                    unchanged_assignments += 1
            await session.commit()
        except Exception:
            await session.rollback()
            raise

        return CLAdminRosterBootstrapOutcome(
            created_users=created_users,
            created_assignments=created_assignments,
            unchanged_assignments=unchanged_assignments,
        )

    async def _ensure_cl_admin_role(self, session: AsyncSession) -> Role:
        role = (
            await session.execute(select(Role).where(Role.code == CanonicalRoleCode.CL_ADMIN.value))
        ).scalar_one_or_none()
        if role is None:
            role = Role(
                name="CL Admin",
                code=CanonicalRoleCode.CL_ADMIN.value,
                description="Immutable CanadaLogin platform administrator role",
                uuid=CL_ADMIN_ROLE_UUID,
            )
            session.add(role)
            await session.flush()
        elif role.uuid != CL_ADMIN_ROLE_UUID or role.is_deleted:
            raise CLAdminRosterConflictError("canonical CL Admin role definition is invalid")

        if role.id is None:
            raise CLAdminRosterConflictError("canonical CL Admin role definition is unavailable")
        return role

    async def _resolve_bootstrap_user(
        self,
        session: AsyncSession,
        email: str,
    ) -> tuple[User, bool]:
        user = (await session.execute(select(User).where(User.email == email))).scalar_one_or_none()
        created_user = user is None
        if user is None:
            user = User(
                name=email,
                email=email,
                username=email,
                enabled=True,
            )
            session.add(user)
            await session.flush()

        if user.id is None:
            raise CLAdminRosterConflictError("CL Admin identity could not be resolved")
        await lock_authorization_target_user(session, user.id)
        await session.refresh(user)
        self._require_eligible_user(user)
        return user, created_user

    async def _ensure_cl_admin_assignment(
        self,
        session: AsyncSession,
        *,
        user: User,
        role: Role,
    ) -> bool:
        if user.id is None or role.id is None:
            raise CLAdminRosterConflictError("CL Admin assignment could not be resolved")

        has_partner_access = (
            await session.execute(
                select(RPApplicationAccessGrant.id).where(
                    RPApplicationAccessGrant.user_id == user.id,
                    RPApplicationAccessGrant.status == LifecycleStatus.ACTIVE.value,
                )
            )
        ).first()
        if has_partner_access is not None:
            raise CLAdminRosterConflictError("CL Admin cannot have active partner access")

        active_assignments = (
            await session.execute(
                select(UserRole, Role.code, Role.is_deleted)
                .join(Role, Role.id == UserRole.role_id)
                .where(
                    UserRole.user_id == user.id,
                    UserRole.status == LifecycleStatus.ACTIVE.value,
                )
            )
        ).all()
        if active_assignments:
            if (
                len(active_assignments) == 1
                and active_assignments[0][1] == CanonicalRoleCode.CL_ADMIN.value
                and active_assignments[0][2] is False
            ):
                return False
            raise CLAdminRosterConflictError("CL Admin identity has conflicting active role assignments")

        assigned_at = datetime.now(UTC)
        assignment = UserRole(
            user_id=user.id,
            role_id=role.id,
            status=LifecycleStatus.ACTIVE.value,
            assignment_source=AssignmentSource.BOOTSTRAP.value,
            assigned_at=assigned_at,
        )
        session.add(assignment)
        session.add(
            AuditLog(
                user="authorization_system",
                user_uuid=None,
                target="authorization_assignment",
                target_uuid=user.uuid,
                operation="role_assign",
                description=json.dumps(
                    {
                        "action": "assign",
                        "actor": {"type": "system"},
                        "assignmentSource": AssignmentSource.BOOTSTRAP.value,
                        "eventName": "authorization.role_assigned",
                        "eventVersion": 1,
                        "result": "succeeded",
                        "role": CanonicalRoleCode.CL_ADMIN.value,
                        "timestamp": assigned_at.isoformat(),
                    },
                    separators=(",", ":"),
                ),
                created_at=assigned_at,
            )
        )
        return True

    @staticmethod
    def _require_eligible_user(user: User) -> None:
        if user.is_deleted:
            raise CLAdminRosterConflictError("deleted user cannot receive CL Admin")
        if not user.enabled:
            raise CLAdminRosterConflictError("disabled user cannot receive CL Admin")
