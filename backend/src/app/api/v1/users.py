import uuid as uuid_pkg
from typing import Annotated, Any

from fastapi import APIRouter, Depends, Query, Request
from fastcrud import PaginatedListResponse
from sqlalchemy.ext.asyncio import AsyncSession

from ...api.dependencies import get_current_user, get_user_service
from ...core.access_control import casbin_guard
from ...core.db.database import async_get_db
from ...core.exceptions.http_exceptions import BadRequestException, ForbiddenException
from ...core.exceptions.openapi import error_responses
from ...schemas.user import (
    AuthenticatedUserRead,
    UserAccessAdministrationRead,
    UserAccessDirectoryRead,
    UserCreate,
    UserDepartmentRead,
    UserDepartmentUpdate,
    UserInvitationTargetResolutionRead,
    UserInvitationTargetResolutionRequest,
    UserPendingInvitationDirectoryRead,
    UserRateLimitsRead,
    UserRead,
    UserTierRead,
    UserTierUpdate,
    UserUpdate,
)
from ...services.authorization_service import is_current_user_cl_admin
from ...services.user_service import UserService
from ...services.user_service import UserService as UserServiceClass

router = APIRouter(tags=["users"])


@router.get("/users/search", response_model=list[UserAccessDirectoryRead])
async def search_users(
    request: Request,
    q: Annotated[str, Query(min_length=2, max_length=100)],
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[UserService, Depends(get_user_service)],
    current_user: Annotated[dict, Depends(get_current_user)],
) -> list[dict[str, Any]]:
    """Search users by name, email, or username."""
    if not is_current_user_cl_admin(current_user):
        raise ForbiddenException("You do not have enough privileges.")

    return await service.search_users(
        db=db,
        query=q,
    )


@router.post("/user", response_model=UserRead, status_code=201)
@casbin_guard.require_permission("users_admin", "write")
async def write_user(
    request: Request,
    user: UserCreate,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[UserService, Depends(get_user_service)],
) -> dict[str, Any]:
    return await service.create_user(db=db, user=user)


@router.get("/users", response_model=PaginatedListResponse[UserAccessDirectoryRead])
@casbin_guard.require_permission("users_admin", "read")
async def read_users(
    request: Request,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[UserService, Depends(get_user_service)],
    page: int = 1,
    items_per_page: int = 10,
) -> dict:
    return await service.list_users(db=db, page=page, items_per_page=items_per_page)


@router.get(
    "/users/invitations",
    response_model=PaginatedListResponse[UserPendingInvitationDirectoryRead],
    responses=error_responses(401, 403, 422, 500),
)
async def read_pending_user_invitations(
    request: Request,
    current_user: Annotated[dict[str, Any], Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[UserService, Depends(get_user_service)],
    page: Annotated[int, Query(ge=1)] = 1,
    items_per_page: Annotated[int, Query(ge=1, le=100)] = 10,
) -> dict[str, Any]:
    return await service.list_pending_invitations(
        db=db,
        page=page,
        items_per_page=items_per_page,
        current_user=current_user,
    )


@router.get(
    "/users/{user_uuid}/access",
    response_model=UserAccessAdministrationRead,
    responses=error_responses(401, 403, 404, 422, 500),
)
async def read_user_access_administration(
    request: Request,
    user_uuid: uuid_pkg.UUID,
    current_user: Annotated[dict[str, Any], Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[UserService, Depends(get_user_service)],
) -> UserAccessAdministrationRead:
    return await service.get_user_access_administration(
        db=db,
        user_uuid=user_uuid,
        current_user=current_user,
    )


@router.post(
    "/users/invitation-target-resolution",
    response_model=UserInvitationTargetResolutionRead,
    responses=error_responses(401, 403, 422, 500),
)
async def resolve_user_invitation_target(
    request: Request,
    payload: UserInvitationTargetResolutionRequest,
    current_user: Annotated[dict[str, Any], Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[UserService, Depends(get_user_service)],
) -> UserInvitationTargetResolutionRead:
    return await service.resolve_invitation_target(
        db=db,
        invited_email=payload.invited_email,
        current_user=current_user,
    )


@router.get(
    "/user/me/",
    response_model=AuthenticatedUserRead,
    responses=error_responses(401, 403, 422),
)
async def read_users_me(
    request: Request,
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[UserService, Depends(get_user_service)],
) -> dict[str, Any]:
    return await service.build_authenticated_user(db=db, current_user=current_user)


@router.get("/user/{user_uuid}", response_model=UserRead)
@casbin_guard.require_permission("users_admin", "read")
async def read_user(
    request: Request,
    user_uuid: uuid_pkg.UUID,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[UserService, Depends(get_user_service)],
) -> dict[str, Any]:
    return await service.get_user_by_uuid(db=db, user_uuid=user_uuid)


@router.patch("/user/{user_uuid}")
@casbin_guard.require_permission("users_admin", "write")
async def patch_user(
    request: Request,
    values: UserUpdate,
    user_uuid: uuid_pkg.UUID,
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[UserService, Depends(get_user_service)],
) -> dict[str, str]:
    return await service.update_user(db=db, user_uuid=user_uuid, current_user=current_user, values=values)


@router.patch("/user/me/accept-terms")
async def accept_terms_me(
    request: Request,
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[UserServiceClass, Depends(get_user_service)],
):
    return await service.accept_terms(db=db, current_user=current_user)


@router.patch("/user/me/department")
async def patch_my_department(
    request: Request,
    # department_uuid optional for backward compatibility with client libraries
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[UserServiceClass, Depends(get_user_service)],
    department_uuid: uuid_pkg.UUID | None = None,
):
    # allow user to set their department only if not set
    # Prefer query param department_uuid if provided, otherwise attempt to read JSON body
    if department_uuid is None:
        try:
            body = await request.json()
            department_uuid = body.get("department_uuid")
        except Exception:
            department_uuid = None

    if department_uuid is None:
        raise BadRequestException("department_uuid is required")

    return await service.set_department_for_user(db=db, user_uuid=current_user["uuid"], department_uuid=department_uuid)


@router.delete("/user/{user_uuid}")
@casbin_guard.require_permission("users_admin", "write")
async def erase_user(
    request: Request,
    user_uuid: uuid_pkg.UUID,
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[UserService, Depends(get_user_service)],
) -> dict[str, str]:
    result = await service.delete_user(
        db=db,
        user_uuid=user_uuid,
        current_user=current_user,
        token=None,
    )
    if str(current_user.get("uuid") or "") == str(user_uuid):
        request.session.clear()
    return result


@router.get("/user/{user_uuid}/rate_limits", response_model=UserRateLimitsRead)
@casbin_guard.require_permission("users_admin", "read")
async def read_user_rate_limits(
    request: Request,
    user_uuid: uuid_pkg.UUID,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[UserService, Depends(get_user_service)],
) -> dict[str, Any]:
    return await service.get_user_rate_limits(db=db, user_uuid=user_uuid)


@router.get("/user/{user_uuid}/tier", response_model=UserTierRead | None)
@casbin_guard.require_permission("users_admin", "read")
async def read_user_tier(
    request: Request,
    user_uuid: uuid_pkg.UUID,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[UserService, Depends(get_user_service)],
) -> dict | None:
    return await service.get_user_tier(db=db, user_uuid=user_uuid)


@router.get("/user/{user_uuid}/department", response_model=UserDepartmentRead | None)
@casbin_guard.require_permission("users_admin", "read")
async def read_user_department(
    request: Request,
    user_uuid: uuid_pkg.UUID,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[UserService, Depends(get_user_service)],
) -> dict | None:
    return await service.get_user_department(db=db, user_uuid=user_uuid)


@router.patch("/user/{user_uuid}/tier")
@casbin_guard.require_permission("users_admin", "write")
async def patch_user_tier(
    request: Request,
    user_uuid: uuid_pkg.UUID,
    values: UserTierUpdate,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[UserService, Depends(get_user_service)],
) -> dict[str, str]:
    return await service.update_user_tier(db=db, user_uuid=user_uuid, values=values)


@router.patch("/user/{user_uuid}/department")
@casbin_guard.require_permission("users_admin", "write")
async def patch_user_department(
    request: Request,
    user_uuid: uuid_pkg.UUID,
    values: UserDepartmentUpdate,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[UserService, Depends(get_user_service)],
) -> dict[str, str]:
    return await service.update_user_department(db=db, user_uuid=user_uuid, values=values)
