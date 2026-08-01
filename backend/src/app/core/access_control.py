from inspect import isawaitable
from pathlib import Path
from typing import Annotated, Any

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
) -> list[str]:
    if current_user.get("is_superuser"):
        return ["admin"]

    subjects: list[str] = []

    role_ids = current_user.get("role_ids") or []
    if len(role_ids) > 0:
        result = await db.execute(select(Role.id, Role.name).where(Role.id.in_(role_ids)))
        role_names_by_id = {role_id: role_name for role_id, role_name in result.all()}
        for role_id in role_ids:
            role_name = role_names_by_id.get(role_id)
            if role_name and role_name not in subjects:
                subjects.append(str(role_name))

    username = current_user.get("username")
    if username:
        subjects.append(str(username))
    elif "id" in current_user:
        subjects.append(str(current_user["id"]))

    if len(subjects) == 0:
        subjects.append("anonymous")

    return subjects


class MultiSubjectEnforcer:
    def __init__(self, enforcer: Any) -> None:
        self._enforcer = enforcer

    async def enforce(self, user: str | list[str], *rvals: Any) -> bool:
        subjects = [user] if isinstance(user, str) else [subject for subject in user if subject]

        for subject in subjects:
            result = self._enforcer.enforce(subject, *rvals)
            if isawaitable(result):
                result = await result
            if result:
                return True

        return False

    def __getattr__(self, name: str) -> Any:
        return getattr(self._enforcer, name)


def casbin_error_factory(_user: str, *_args) -> Exception:
    return ForbiddenException("You do not have enough privileges.")


database_enforcer_provider = DatabaseEnforcerProvider(
    model_path=CASBIN_MODEL_PATH,
    session_factory=local_session,
    policy_model=AccessPolicy,
    policy_mapper=lambda policy: (policy.subject, policy.resource, policy.action),
    default_policies=[("admin", "*", ".*")],
)


async def get_casbin_enforcer(
    enforcer: Annotated[Any, Depends(database_enforcer_provider)],
) -> MultiSubjectEnforcer:
    return MultiSubjectEnforcer(enforcer)

casbin_guard = PermissionGuard(
    user_provider=get_casbin_subject,
    enforcer_provider=get_casbin_enforcer,
    error_factory=casbin_error_factory,
)
