import uuid as uuid_pkg
from typing import Annotated, Any

from fastapi import APIRouter, Depends, Request
from fastcrud import PaginatedListResponse
from sqlalchemy.ext.asyncio import AsyncSession

from ...api.dependencies import get_current_user, get_role_service
from ...core.access_control import casbin_guard
from ...core.db.database import async_get_db
from ...schemas.role import RoleCreate, RoleRead, RoleUpdate
from ...services.role_service import RoleService

router = APIRouter(tags=["roles"])


@router.post("/role", response_model=RoleRead, status_code=201)
@casbin_guard.require_permission("roles", "write")
async def write_role(
    request: Request,
    role: RoleCreate,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[RoleService, Depends(get_role_service)],
) -> dict[str, Any]:
    return await service.create_role(db=db, role=role)


@router.get("/roles", response_model=PaginatedListResponse[RoleRead])
async def read_roles(
    request: Request,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[RoleService, Depends(get_role_service)],
    current_user: Annotated[dict | None, Depends(get_current_user)] = None,
    page: int = 1,
    items_per_page: int = 10,
) -> dict:
    return await service.list_roles(db=db, page=page, items_per_page=items_per_page)


@router.get("/role/{role_uuid}", response_model=RoleRead)
async def read_role(
    request: Request,
    role_uuid: uuid_pkg.UUID,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[RoleService, Depends(get_role_service)],
    current_user: Annotated[dict | None, Depends(get_current_user)] = None,
) -> dict[str, Any]:
    return await service.get_role_by_uuid(db=db, role_uuid=role_uuid)


@router.patch("/role/{role_uuid}")
@casbin_guard.require_permission("roles", "write")
async def patch_role(
    request: Request,
    role_uuid: uuid_pkg.UUID,
    values: RoleUpdate,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[RoleService, Depends(get_role_service)],
) -> dict[str, str]:
    return await service.update_role(db=db, role_uuid=role_uuid, values=values)


@router.delete("/role/{role_uuid}")
@casbin_guard.require_permission("roles", "write")
async def erase_role(
    request: Request,
    role_uuid: uuid_pkg.UUID,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[RoleService, Depends(get_role_service)],
) -> dict[str, str]:
    return await service.delete_role(db=db, role_uuid=role_uuid)
