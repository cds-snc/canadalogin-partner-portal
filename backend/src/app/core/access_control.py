from pathlib import Path
from typing import Annotated

from casbin_fastapi_decorator import PermissionGuard
from casbin_fastapi_decorator_db import DatabaseEnforcerProvider
from fastapi import Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..api.dependencies import get_current_user
from ..models.access_policy import AccessPolicy
from ..models.role import Role
from .db.database import async_get_db, local_session
from .exceptions.http_exceptions import ForbiddenException

CASBIN_MODEL_PATH = Path(__file__).with_name("casbin_model.conf")


async def get_casbin_subject(
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(async_get_db)],
) -> str:
    if current_user.get("is_superuser"):
        return "admin"

    role_ids = current_user.get("role_ids")
    if role_ids is not None and len(role_ids) > 0:
        result = await db.execute(select(Role.name).where(Role.id.in_(role_ids)))
        role_names = result.scalars().all()
        if len(role_names) > 0:
            return str(role_names[0])

    # fall back to 'username' key if present, otherwise use 'id' or a default
    username = current_user.get("username")
    if username:
        return str(username)
    if "id" in current_user:
        return str(current_user["id"])
    return "anonymous"


def casbin_error_factory(_user: str, *_args) -> Exception:
    return ForbiddenException("You do not have enough privileges.")


database_enforcer_provider = DatabaseEnforcerProvider(
    model_path=CASBIN_MODEL_PATH,
    session_factory=local_session,
    policy_model=AccessPolicy,
    policy_mapper=lambda policy: (policy.subject, policy.resource, policy.action),
    default_policies=[("admin", "*", ".*")],
)

casbin_guard = PermissionGuard(
    user_provider=get_casbin_subject,
    enforcer_provider=database_enforcer_provider,
    error_factory=casbin_error_factory,
)
