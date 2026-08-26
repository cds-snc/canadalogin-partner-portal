from functools import lru_cache
from inspect import isawaitable
from pathlib import Path
from typing import Annotated, Any

import casbin
from casbin_fastapi_decorator import PermissionGuard
from fastapi import Depends

from ..api.dependencies import get_current_user
from ..services.authorization_service import canonical_subjects_for_user
from .authorization import CanonicalRoleCode
from .exceptions.http_exceptions import ForbiddenException

CASBIN_MODEL_PATH = Path(__file__).with_name("casbin_model.conf")


async def get_casbin_subject(
    current_user: Annotated[dict, Depends(get_current_user)],
) -> list[str]:
    return list(canonical_subjects_for_user(current_user))


class MultiSubjectEnforcer:
    def __init__(self, enforcer: Any) -> None:
        self._enforcer = enforcer

    async def enforce(self, user: str | list[str], *rvals: Any) -> bool:
        subjects = [user] if isinstance(user, str) else [subject for subject in user if subject]
        canonical_subjects = {role.value for role in CanonicalRoleCode}

        for subject in subjects:
            if subject not in canonical_subjects:
                continue
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


CANONICAL_CASBIN_POLICIES = (
    (CanonicalRoleCode.CL_ADMIN.value, "roles", "read"),
    (CanonicalRoleCode.CL_ADMIN.value, "rp_applications", "read"),
    (CanonicalRoleCode.CL_ADMIN.value, "tasks", "read|write"),
    (CanonicalRoleCode.CL_ADMIN.value, "users_admin", "read|write"),
    (CanonicalRoleCode.CL_ADMIN.value, "workspace", "read|write"),
)


@lru_cache(maxsize=1)
def _build_canonical_enforcer() -> casbin.Enforcer:
    enforcer = casbin.Enforcer(str(CASBIN_MODEL_PATH))
    enforcer.add_policies(list(CANONICAL_CASBIN_POLICIES))
    return enforcer


def canonical_enforcer_provider() -> MultiSubjectEnforcer:
    """Build the code-owned policy boundary; no database policy is loaded."""

    return MultiSubjectEnforcer(_build_canonical_enforcer())


# Compatibility name for dependency overrides during the additive cutover.
# The provider is intentionally no longer database-backed.
database_enforcer_provider = canonical_enforcer_provider


async def get_casbin_enforcer(
    enforcer: Annotated[MultiSubjectEnforcer, Depends(canonical_enforcer_provider)],
) -> MultiSubjectEnforcer:
    return enforcer


casbin_guard = PermissionGuard(
    user_provider=get_casbin_subject,
    enforcer_provider=get_casbin_enforcer,
    error_factory=casbin_error_factory,
)
