from typing import Annotated, Any

from fastapi import Depends, Request, Security
from fastapi.security import APIKeyCookie
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.config import settings
from ..core.db.database import async_get_db
from ..core.exceptions.http_exceptions import ForbiddenException, RateLimitException, UnauthorizedException
from ..core.logger import logging
from ..core.logging_privacy import hash_log_value
from ..core.utils.rate_limit import rate_limiter
from ..repositories.crud_rate_limit import crud_rate_limits
from ..repositories.crud_tier import crud_tiers
from ..repositories.crud_users import crud_users
from ..repositories.dependencies import get_ibm_sv_admin_client, get_ibm_sv_user_client
from ..repositories.ibm_sv_admin import IBMVerifyAdminClient
from ..schemas.rate_limit import sanitize_path
from ..services import (
    AuditService,
    AuthorizationService,
    AuthService,
    DepartmentService,
    HealthService,
    IBMVerifyUserService,
    MAUService,
    OidcLogoutService,
    OidcService,
    OnboardingOversightService,
    RateLimitService,
    RPApplicationDeveloperInvitationService,
    RPApplicationService,
    TaskService,
    TierService,
    UserService,
    WorkspaceService,
)
from ..services.authorization_service import (
    AUTHORIZATION_CONTEXT_KEY,
    AUTHORIZATION_STATE_KEY,
    AuthorizationResolutionError,
    ResolvedAuthorizationState,
    get_resolved_authorization_state,
)
from ..services.rp_application_adoption_metadata_provider import (
    RPApplicationAdoptionMetadataProvider,
    UnavailableRPApplicationAdoptionMetadataProvider,
)

logger = logging.getLogger(__name__)

DEFAULT_LIMIT = settings.DEFAULT_RATE_LIMIT_LIMIT
DEFAULT_PERIOD = settings.DEFAULT_RATE_LIMIT_PERIOD

session_cookie_scheme = APIKeyCookie(
    name=settings.SESSION_COOKIE_NAME,
    scheme_name="SessionCookie",
    description="Opaque server-side session cookie established by the OIDC flow.",
    auto_error=False,
)


def get_audit_service() -> AuditService:
    return AuditService()


def get_authorization_service() -> AuthorizationService:
    return AuthorizationService()


def get_user_service() -> UserService:
    return UserService()


def get_department_service() -> DepartmentService:
    return DepartmentService()


def get_workspace_service() -> WorkspaceService:
    return WorkspaceService()


async def get_ibm_sv_admin_service(
    client: Annotated[IBMVerifyAdminClient, Depends(get_ibm_sv_admin_client)],
):
    from ..services.ibm_sv_admin_service import IBMVerifyAdminService

    return IBMVerifyAdminService(client=client)


def get_tier_service() -> TierService:
    return TierService()


def get_rate_limit_service() -> RateLimitService:
    return RateLimitService()


def get_ibm_sv_user_service(request: Request) -> IBMVerifyUserService:
    return IBMVerifyUserService(client=get_ibm_sv_user_client(request))


def get_rp_application_service() -> RPApplicationService:
    return RPApplicationService()


def get_rp_application_adoption_metadata_provider() -> RPApplicationAdoptionMetadataProvider:
    return UnavailableRPApplicationAdoptionMetadataProvider()


def get_rp_application_developer_invitation_service() -> RPApplicationDeveloperInvitationService:
    return RPApplicationDeveloperInvitationService()


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


def get_mau_service() -> MAUService:
    return MAUService()


def get_onboarding_oversight_service() -> OnboardingOversightService:
    return OnboardingOversightService()


async def get_user_from_session(request: Request, db: AsyncSession) -> dict[str, Any] | None:
    try:
        user_uuid = request.session.get("user_uuid")
    except AssertionError:
        return None

    if user_uuid is None:
        return None

    return await crud_users.get(
        db=db,
        uuid=user_uuid,
        is_deleted=False,
        enabled=True,
    )


async def get_current_user(
    request: Request,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    _session_cookie: Annotated[str | None, Security(session_cookie_scheme)] = None,
) -> dict[str, Any]:
    user = await get_user_from_session(request, db)

    if user:
        user_id = user.get("id")
        if not isinstance(user_id, int) or isinstance(user_id, bool):
            raise ForbiddenException("Authorization state could not be resolved.")

        try:
            authorization_state = await get_authorization_service().resolve_for_user(
                db,
                user_id=user_id,
            )
        except AuthorizationResolutionError:
            logger.warning(
                "Rejected request with invalid authorization state for user %s",
                hash_log_value(user.get("uuid", "unknown")),
            )
            raise ForbiddenException("Authorization state could not be resolved.") from None

        resolved_user = dict(user)
        resolved_user[AUTHORIZATION_STATE_KEY] = authorization_state
        resolved_user[AUTHORIZATION_CONTEXT_KEY] = authorization_state.to_api_context()
        return resolved_user

    raise UnauthorizedException("User not authenticated.")


async def get_optional_user(request: Request, db: AsyncSession = Depends(async_get_db)) -> dict | None:
    return await get_user_from_session(request, db)


async def get_current_authorization_state(
    current_user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> ResolvedAuthorizationState:
    state = get_resolved_authorization_state(current_user)
    if state is None:
        raise ForbiddenException("Authorization state could not be resolved.")
    return state


async def get_current_cl_admin(
    current_user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> dict[str, Any]:
    state = get_resolved_authorization_state(current_user)
    if state is None or not state.is_cl_admin:
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
        logged_user_id = hash_log_value(user_id)
        tier = await crud_tiers.get(db, id=user["tier_id"])
        if tier:
            rate_limit = await crud_rate_limits.get(db=db, tier_id=tier["id"], path=path)
            if rate_limit:
                limit, period = rate_limit["limit"], rate_limit["period"]
            else:
                logger.warning(
                    f"User {logged_user_id} with tier '{tier['name']}' has no specific rate limit for path '{path}'. \
                        Applying default rate limit."
                )
                limit, period = DEFAULT_LIMIT, DEFAULT_PERIOD
        else:
            logger.warning(f"User {logged_user_id} has no assigned tier. Applying default rate limit.")
            limit, period = DEFAULT_LIMIT, DEFAULT_PERIOD
    else:
        user_id = request.client.host if request.client else "unknown"
        limit, period = DEFAULT_LIMIT, DEFAULT_PERIOD

    is_limited = await rate_limiter.is_rate_limited(db=db, user_id=user_id, path=path, limit=limit, period=period)
    if is_limited:
        raise RateLimitException("Rate limit exceeded.")
