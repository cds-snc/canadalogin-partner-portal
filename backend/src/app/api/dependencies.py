from typing import Annotated, Any

from fastapi import Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.config import settings
from ..core.db.database import async_get_db
from ..core.exceptions.http_exceptions import ForbiddenException, RateLimitException, UnauthorizedException
from ..core.logger import logging
from ..core.security import TokenType, optional_oauth2_scheme, verify_token
from ..core.utils.rate_limit import rate_limiter
from ..repositories.crud_rate_limit import crud_rate_limits
from ..repositories.crud_tier import crud_tiers
from ..repositories.crud_users import crud_users
from ..repositories.dependencies import get_ibm_sv_user_client
from ..schemas.rate_limit import sanitize_path
from ..services import (
    AuthService,
    DepartmentService,
    HealthService,
    IBMVerifyUserService,
    OidcLogoutService,
    OidcService,
    PolicyService,
    RateLimitService,
    RoleService,
    RPApplicationService,
    TaskService,
    TierService,
    UserService,
)

logger = logging.getLogger(__name__)

DEFAULT_LIMIT = settings.DEFAULT_RATE_LIMIT_LIMIT
DEFAULT_PERIOD = settings.DEFAULT_RATE_LIMIT_PERIOD


def get_user_service() -> UserService:
    return UserService()


def get_role_service() -> RoleService:
    return RoleService()


def get_department_service() -> DepartmentService:
    return DepartmentService()


def get_tier_service() -> TierService:
    return TierService()


def get_policy_service() -> PolicyService:
    return PolicyService()


def get_rate_limit_service() -> RateLimitService:
    return RateLimitService()


def get_ibm_sv_user_service(request: Request) -> IBMVerifyUserService:
    return IBMVerifyUserService(client=get_ibm_sv_user_client(request))


def get_rp_application_service() -> RPApplicationService:
    return RPApplicationService()


def get_auth_service() -> AuthService:
    return AuthService()


def get_oidc_logout_service() -> OidcLogoutService:
    return OidcLogoutService()


def get_oidc_service() -> OidcService:
    return OidcService(logout_service=get_oidc_logout_service())


def get_task_service() -> TaskService:
    return TaskService()


def get_health_service() -> HealthService:
    return HealthService()


async def get_user_from_session(request: Request, db: AsyncSession) -> dict[str, Any] | None:
    try:
        user_uuid = request.session.get("user_uuid")
    except AssertionError:
        return None

    if user_uuid is None:
        return None

    return await crud_users.get(db=db, uuid=user_uuid, is_deleted=False)


async def get_user_from_bearer_token(token: str | None, db: AsyncSession) -> dict[str, Any] | None:
    if not token:
        return None

    token_data = await verify_token(token, TokenType.ACCESS, db)
    if token_data is None:
        return None

    return await crud_users.get(db=db, uuid=token_data.subject, is_deleted=False)


async def get_current_user(
    request: Request,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    token: Annotated[str | None, Depends(optional_oauth2_scheme)] = None,
) -> dict[str, Any]:
    user = await get_user_from_session(request, db)
    if user is None:
        user = await get_user_from_bearer_token(token, db)

    if user:
        return user

    raise UnauthorizedException("User not authenticated.")


async def get_optional_user(request: Request, db: AsyncSession = Depends(async_get_db)) -> dict | None:
    user = await get_user_from_session(request, db)
    if user is not None:
        return user

    token = request.headers.get("Authorization")
    if not token:
        return None

    try:
        token_type, _, token_value = token.partition(" ")
        if token_type.lower() != "bearer" or not token_value:
            return None

        return await get_user_from_bearer_token(token_value, db)

    except HTTPException as http_exc:
        if http_exc.status_code != 401:
            logger.error(f"Unexpected HTTPException in get_optional_user: {http_exc.detail}")
        return None

    except Exception as exc:
        logger.error(f"Unexpected error in get_optional_user: {exc}")
        return None


async def get_current_superuser(current_user: Annotated[dict, Depends(get_current_user)]) -> dict:
    if not current_user["is_superuser"]:
        raise ForbiddenException("You do not have enough privileges.")

    return current_user


async def rate_limiter_dependency(
    request: Request, db: Annotated[AsyncSession, Depends(async_get_db)], user: dict | None = Depends(get_optional_user)
) -> None:
    if hasattr(request.app.state, "initialization_complete"):
        await request.app.state.initialization_complete.wait()

    path = sanitize_path(request.url.path)
    if user:
        user_id = user["id"]
        tier = await crud_tiers.get(db, id=user["tier_id"])
        if tier:
            rate_limit = await crud_rate_limits.get(
                db=db, tier_id=tier["id"], path=path
            )
            if rate_limit:
                limit, period = rate_limit["limit"], rate_limit["period"]
            else:
                logger.warning(
                    f"User {user_id} with tier '{tier['name']}' has no specific rate limit for path '{path}'. \
                        Applying default rate limit."
                )
                limit, period = DEFAULT_LIMIT, DEFAULT_PERIOD
        else:
            logger.warning(f"User {user_id} has no assigned tier. Applying default rate limit.")
            limit, period = DEFAULT_LIMIT, DEFAULT_PERIOD
    else:
        user_id = request.client.host if request.client else "unknown"
        limit, period = DEFAULT_LIMIT, DEFAULT_PERIOD

    is_limited = await rate_limiter.is_rate_limited(db=db, user_id=user_id, path=path, limit=limit, period=period)
    if is_limited:
        raise RateLimitException("Rate limit exceeded.")
