"""Shared transaction-lock boundaries for canonical authorization mutation."""

from typing import Final

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

AUTHORIZATION_TARGET_USER_LOCK_PREFIX: Final = "authorization:target-user"
AUTHORIZATION_CL_ADMIN_ROSTER_LOCK_KEY: Final = "authorization:cl-admin-roster"
AUTHORIZATION_WORKSPACE_IDENTITY_LOCK_PREFIX: Final = "rp-developer-invitation"


async def lock_cl_admin_roster(db: AsyncSession) -> None:
    """Serialize mutations that can change the active CL Admin roster."""

    await db.execute(
        text("SELECT pg_advisory_xact_lock(hashtextextended(:lock_key, 0))"),
        {"lock_key": AUTHORIZATION_CL_ADMIN_ROSTER_LOCK_KEY},
    )


async def lock_authorization_target_user(
    db: AsyncSession,
    user_id: int,
) -> None:
    """Serialize every canonical role mutation for one persisted target user.

    Workspace invitation and explicit partner-assignment flows acquire their
    shared lifecycle lock first, then this target-user lock. Global-role flows
    use this lock with the CL Admin roster lock instead.
    """

    await db.execute(
        text("SELECT pg_advisory_xact_lock(hashtextextended(:lock_key, 0))"),
        {"lock_key": f"{AUTHORIZATION_TARGET_USER_LOCK_PREFIX}:{user_id}"},
    )


async def lock_workspace_identity_lifecycle(
    db: AsyncSession,
    *,
    workspace_id: int,
    email: str,
) -> None:
    """Serialize one normalized workspace/email authorization lifecycle."""

    normalized_email = email.strip().lower()
    await db.execute(
        text("SELECT pg_advisory_xact_lock(hashtextextended(:lock_key, 0))"),
        {"lock_key": (f"{AUTHORIZATION_WORKSPACE_IDENTITY_LOCK_PREFIX}:{workspace_id}:{normalized_email}")},
    )


async def lock_workspace_identity_then_target_user(
    db: AsyncSession,
    *,
    workspace_id: int,
    email: str,
    target_user_id: int | None,
) -> None:
    """Acquire the shared lifecycle and persisted-user locks in one order.

    Invitation creation/reissue and explicit partner assignment use this same
    boundary. A target user may not exist yet when an external identity is
    invited, but every path that has one acquires its user lock only after the
    workspace/email lifecycle lock.
    """

    await lock_workspace_identity_lifecycle(
        db,
        workspace_id=workspace_id,
        email=email,
    )
    if target_user_id is not None:
        await lock_authorization_target_user(db, target_user_id)


__all__ = [
    "AUTHORIZATION_CL_ADMIN_ROSTER_LOCK_KEY",
    "AUTHORIZATION_TARGET_USER_LOCK_PREFIX",
    "AUTHORIZATION_WORKSPACE_IDENTITY_LOCK_PREFIX",
    "lock_cl_admin_roster",
    "lock_authorization_target_user",
    "lock_workspace_identity_lifecycle",
    "lock_workspace_identity_then_target_user",
]
