"""Idempotently bootstrap the first normalized CL Admin assignment."""

import asyncio
import json
import logging
from datetime import UTC, datetime

from sqlalchemy import select

from ..app.core.authorization import (
    CL_ADMIN_ROLE_UUID,
    AssignmentSource,
    CanonicalRoleCode,
    LifecycleStatus,
)
from ..app.core.config import settings
from ..app.core.db.database import AsyncSession, local_session
from ..app.core.logging_privacy import hash_log_value
from ..app.models.audit_log import AuditLog
from ..app.models.role import Role
from ..app.models.rp_application_access_grant import RPApplicationAccessGrant
from ..app.models.user import User
from ..app.models.user_role import UserRole
from ..app.schemas.authorization_audit import (
    AuthorizationActorType,
    AuthorizationAuditActor,
    AuthorizationAuditResult,
    RoleAssignmentAuditEvent,
)
from ..app.services.authorization_lock_service import (
    lock_authorization_target_user,
    lock_cl_admin_roster,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def _normalize_email(value: str) -> str:
    return value.strip().lower()


def _require_bootstrap_eligible_user(user: User) -> None:
    if user.is_deleted:
        raise RuntimeError("Cannot bootstrap a deleted user as CL Admin")
    if not user.enabled:
        raise RuntimeError("Cannot bootstrap a disabled user as CL Admin")


async def _ensure_cl_admin_role(session: AsyncSession) -> Role:
    result = await session.execute(select(Role).where(Role.code == CanonicalRoleCode.CL_ADMIN.value))
    role = result.scalar_one_or_none()
    if role is None:
        role = Role(
            name="CL Admin",
            code=CanonicalRoleCode.CL_ADMIN.value,
            description="Immutable CanadaLogin platform administrator role",
            uuid=CL_ADMIN_ROLE_UUID,
        )
        session.add(role)
        await session.flush()
        logger.info("Created the immutable CL Admin role definition.")
    elif role.uuid != CL_ADMIN_ROLE_UUID or role.is_deleted:
        raise RuntimeError("Canonical CL Admin role definition is invalid")

    if role.id is None:
        raise RuntimeError("Failed to resolve canonical CL Admin role id")
    return role


async def _ensure_bootstrap_user(session: AsyncSession, normalized_email: str) -> User:
    result = await session.execute(select(User).where(User.email == normalized_email))
    user = result.scalar_one_or_none()
    if user is None:
        user = User(
            name=normalized_email,
            email=normalized_email,
            username=normalized_email,
            enabled=True,
        )
        session.add(user)
        await session.flush()
        logger.info(
            "Created initial CL Admin identity target_uuid=%s.",
            hash_log_value(user.uuid),
        )
    else:
        _require_bootstrap_eligible_user(user)

    if user.id is None:
        raise RuntimeError("Failed to resolve initial CL Admin user id")
    return user


async def create_initial_cl_admin(session: AsyncSession) -> None:
    email = settings.INITIAL_CL_ADMIN_EMAIL
    if email is None or not email.strip():
        logger.info("No INITIAL_CL_ADMIN_EMAIL configured; skipping initial CL Admin bootstrap.")
        return

    normalized_email = _normalize_email(email)
    await lock_cl_admin_roster(session)
    role = await _ensure_cl_admin_role(session)
    user = await _ensure_bootstrap_user(session, normalized_email)
    await lock_authorization_target_user(session, user.id)

    # Re-read mutable lifecycle state after the target-user lock. This closes
    # the window where an existing account could be disabled or deleted while
    # bootstrap was waiting behind another authorization mutation.
    await session.refresh(user)
    _require_bootstrap_eligible_user(user)

    partner_grant = (
        await session.execute(
            select(RPApplicationAccessGrant.id).where(
                RPApplicationAccessGrant.user_id == user.id,
                RPApplicationAccessGrant.status == LifecycleStatus.ACTIVE.value,
            )
        )
    ).first()
    if partner_grant is not None:
        raise RuntimeError("A CL Admin cannot have active partner access")

    active_assignments = (
        await session.execute(
            select(UserRole, Role.code)
            .join(Role, Role.id == UserRole.role_id)
            .where(
                UserRole.user_id == user.id,
                UserRole.status == LifecycleStatus.ACTIVE.value,
            )
        )
    ).all()
    if active_assignments:
        if len(active_assignments) == 1 and active_assignments[0][1] == CanonicalRoleCode.CL_ADMIN.value:
            logger.info(
                "Initial CL Admin assignment already exists target_uuid=%s.",
                hash_log_value(user.uuid),
            )
            await session.commit()
            return
        raise RuntimeError("Bootstrap user has conflicting active role assignments")

    assigned_at = datetime.now(UTC)
    assignment = UserRole(
        user_id=user.id,
        role_id=role.id,
        status=LifecycleStatus.ACTIVE.value,
        assignment_source=AssignmentSource.BOOTSTRAP.value,
        assigned_at=assigned_at,
    )
    event = RoleAssignmentAuditEvent(
        timestamp=assigned_at,
        actor=AuthorizationAuditActor(type=AuthorizationActorType.SYSTEM),
        result=AuthorizationAuditResult.SUCCEEDED,
        assignment_uuid=assignment.uuid,
        target_user_uuid=user.uuid,
        role=CanonicalRoleCode.CL_ADMIN,
        assignment_source=AssignmentSource.BOOTSTRAP,
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
                event.model_dump(mode="json", exclude_none=True),
                separators=(",", ":"),
            ),
            created_at=assigned_at,
        )
    )
    await session.commit()
    logger.info(
        "Assigned the initial CL Admin role target_uuid=%s.",
        hash_log_value(user.uuid),
    )


# Backward-compatible Python call name during the additive runtime cutover.
create_first_user = create_initial_cl_admin


async def main() -> None:
    async with local_session() as session:
        await create_initial_cl_admin(session)


if __name__ == "__main__":
    asyncio.run(main())
