import uuid as uuid_pkg
from typing import Annotated, Any

from fastapi import APIRouter, Depends, Request
from fastcrud import PaginatedListResponse
from sqlalchemy.ext.asyncio import AsyncSession

from ...api.dependencies import get_current_user, get_department_service
from ...core.access_control import casbin_guard
from ...core.db.database import async_get_db
from ...schemas.department import DepartmentCreate, DepartmentRead, DepartmentUpdate
from ...services.department_service import DepartmentService

router = APIRouter(tags=["departments"])


@router.post("/department", response_model=DepartmentRead, status_code=201)
@casbin_guard.require_permission("departments", "write")
async def write_department(
    request: Request,
    department: DepartmentCreate,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[DepartmentService, Depends(get_department_service)],
) -> dict[str, Any]:
    return await service.create_department(db=db, department=department)


@router.get("/departments", response_model=PaginatedListResponse[DepartmentRead])
async def read_departments(
    request: Request,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[DepartmentService, Depends(get_department_service)],
    current_user: Annotated[dict | None, Depends(get_current_user)] = None,
    page: int = 1,
    items_per_page: int = 10,
) -> dict:
    return await service.list_departments(db=db, page=page, items_per_page=items_per_page)


@router.get("/department/{department_uuid}", response_model=DepartmentRead)
async def read_department(
    request: Request,
    department_uuid: uuid_pkg.UUID,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[DepartmentService, Depends(get_department_service)],
    current_user: Annotated[dict | None, Depends(get_current_user)] = None,
) -> dict[str, Any]:
    return await service.get_department_by_uuid(db=db, department_uuid=department_uuid)


@router.get("/departments/by-id/{department_id}", response_model=DepartmentRead)
@casbin_guard.require_permission("departments", "read")
async def read_department_by_id(
    request: Request,
    department_id: int,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[DepartmentService, Depends(get_department_service)],
    current_user: Annotated[dict | None, Depends(get_current_user)] = None,
) -> dict[str, Any]:
    return await service.get_department_by_id(db=db, department_id=department_id)


@router.patch("/department/{department_uuid}")
@casbin_guard.require_permission("departments", "write")
async def patch_department(
    request: Request,
    department_uuid: uuid_pkg.UUID,
    values: DepartmentUpdate,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[DepartmentService, Depends(get_department_service)],
) -> dict[str, str]:
    return await service.update_department(db=db, department_uuid=department_uuid, values=values)


@router.delete("/department/{department_uuid}")
@casbin_guard.require_permission("departments", "write")
async def erase_department(
    request: Request,
    department_uuid: uuid_pkg.UUID,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[DepartmentService, Depends(get_department_service)],
) -> dict[str, str]:
    return await service.delete_department(db=db, department_uuid=department_uuid)
