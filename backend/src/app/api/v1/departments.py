import uuid as uuid_pkg
from typing import Annotated, Any

from fastapi import APIRouter, Depends, Request
from fastcrud import PaginatedListResponse
from sqlalchemy.ext.asyncio import AsyncSession

from ...api.dependencies import get_current_user, get_department_service
from ...core.db.database import async_get_db
from ...schemas.department import DepartmentRead
from ...services.department_service import DepartmentService

router = APIRouter(tags=["departments"])


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
async def read_department_by_id(
    request: Request,
    department_id: int,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[DepartmentService, Depends(get_department_service)],
    current_user: Annotated[dict | None, Depends(get_current_user)] = None,
) -> dict[str, Any]:
    return await service.get_department_by_id(db=db, department_id=department_id)
