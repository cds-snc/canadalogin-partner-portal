import uuid as uuid_pkg
from typing import Annotated, Any

from fastapi import APIRouter, Depends, Request
from fastcrud import PaginatedListResponse
from sqlalchemy.ext.asyncio import AsyncSession

from ...api.dependencies import get_current_user, get_user_service
from ...core.access_control import casbin_guard
from ...core.db.database import async_get_db
from ...core.exceptions.http_exceptions import BadRequestException
from ...core.security import oauth2_scheme
from ...schemas.role import RoleRead
from ...schemas.user import (
    UserAddRole,
    UserCreate,
    UserDepartmentRead,
    UserDepartmentUpdate,
    UserRateLimitsRead,
    UserRead,
    UserRemoveRole,
    UserTierRead,
    UserTierUpdate,
    UserUpdate,
)
from ...services.user_service import UserService
from ...services.user_service import UserService as UserServiceClass

router = APIRouter(tags=["users"])


@router.get("/users/search")
@casbin_guard.require_permission("users_admin", "read")
async def search_users(
    request: Request,
    q: str,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[UserService, Depends(get_user_service)],
    current_user: Annotated[dict, Depends(get_current_user)],
    workspace_uuid: uuid_pkg.UUID | None = None,
) -> list[dict[str, Any]]:
    """Search users by name, email, or username."""
    return await service.search_users(
        db=db,
        query=q,
        workspace_uuid=workspace_uuid,
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


@router.get("/users", response_model=PaginatedListResponse[UserRead])
@casbin_guard.require_permission("users_admin", "read")
async def read_users(
    request: Request,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[UserService, Depends(get_user_service)],
    page: int = 1,
    items_per_page: int = 10,
) -> dict:
    return await service.list_users(db=db, page=page, items_per_page=items_per_page)


from ...core.exceptions.openapi import error_responses


@router.get("/user/me/", response_model=UserRead, responses=error_responses(401, 422))
async def read_users_me(
    request: Request,
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[UserService, Depends(get_user_service)],
) -> dict[str, Any]:
    return await service._build_public_user(db=db, user=current_user)


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
    token: str = Depends(oauth2_scheme),
) -> dict[str, str]:
    return await service.delete_user(db=db, user_uuid=user_uuid, current_user=current_user, token=token)


@router.delete("/db_user/{user_uuid}")
@casbin_guard.require_permission("users_admin", "write")
async def erase_db_user(
    request: Request,
    user_uuid: uuid_pkg.UUID,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[UserService, Depends(get_user_service)],
    token: str = Depends(oauth2_scheme),
) -> dict[str, str]:
    return await service.delete_user_from_db(db=db, user_uuid=user_uuid, token=token)


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


@router.get("/user/{user_uuid}/role", response_model=RoleRead | None)
@casbin_guard.require_permission("users_admin", "read")
async def read_user_role(
    request: Request,
    user_uuid: uuid_pkg.UUID,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[UserService, Depends(get_user_service)],
) -> dict | None:
    return await service.get_user_role(db=db, user_uuid=user_uuid)


@router.get("/user/{user_uuid}/department", response_model=UserDepartmentRead | None)
@casbin_guard.require_permission("users_admin", "read")
async def read_user_department(
    request: Request,
    user_uuid: uuid_pkg.UUID,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[UserService, Depends(get_user_service)],
) -> dict | None:
    return await service.get_user_department(db=db, user_uuid=user_uuid)


@router.post("/user/{user_uuid}/roles/{role_uuid}")
@casbin_guard.require_permission("users_admin", "write")
async def add_role_to_user(
    request: Request,
    user_uuid: uuid_pkg.UUID,
    role_uuid: uuid_pkg.UUID,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[UserService, Depends(get_user_service)],
) -> dict[str, str]:
    return await service.add_role_to_user(db=db, user_uuid=user_uuid, values=UserAddRole(role_uuid=role_uuid))


@router.delete("/user/{user_uuid}/roles/{role_uuid}")
@casbin_guard.require_permission("users_admin", "write")
async def remove_role_from_user(
    request: Request,
    user_uuid: uuid_pkg.UUID,
    role_uuid: uuid_pkg.UUID,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[UserService, Depends(get_user_service)],
) -> dict[str, str]:
    return await service.remove_role_from_user(db=db, user_uuid=user_uuid, values=UserRemoveRole(role_uuid=role_uuid))


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
