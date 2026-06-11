import uuid as uuid_pkg
from typing import Annotated, Any

from fastapi import APIRouter, Depends, Request
from fastcrud import PaginatedListResponse
from sqlalchemy.ext.asyncio import AsyncSession

from ...api.dependencies import (
    get_current_user,
    get_ibm_sv_user_service,
    get_rp_application_service,
)
from ...core.access_control import casbin_guard
from ...core.db.database import async_get_db
from ...schemas.rp_application import (
    RPApplicationCreate,
    RPApplicationCurrentUserRead,
    RPApplicationRead,
    RPApplicationUpdate,
)
from ...services.ibm_sv_user_service import IBMVerifyUserService
from ...services.rp_application_service import RPApplicationService

router = APIRouter(tags=["rp-applications"])


@router.post("/rp-application", response_model=RPApplicationRead, status_code=201)
@casbin_guard.require_permission("rp_applications", "write")
async def write_rp_application(
    request: Request,
    rp_application: RPApplicationCreate,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[RPApplicationService, Depends(get_rp_application_service)],
    current_user: Annotated[dict, Depends(get_current_user)],
) -> dict[str, Any]:
    return await service.create_rp_application(
        db=db,
        rp_application=rp_application,
        created_by=current_user.get("id"),
    )


@router.get("/rp-applications", response_model=PaginatedListResponse[RPApplicationRead])
@casbin_guard.require_permission("rp_applications", "read")
async def read_rp_applications(
    request: Request,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[RPApplicationService, Depends(get_rp_application_service)],
    page: int = 1,
    items_per_page: int = 10,
) -> dict[str, Any]:
    return await service.list_rp_applications(
        db=db,
        page=page,
        items_per_page=items_per_page,
    )


@router.get("/rp-applications/mine", response_model=list[RPApplicationCurrentUserRead])
async def read_current_user_rp_applications(
    request: Request,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    current_user: Annotated[dict, Depends(get_current_user)],
    service: Annotated[RPApplicationService, Depends(get_rp_application_service)],
    ibm_user_service: Annotated[IBMVerifyUserService, Depends(get_ibm_sv_user_service)],
) -> list[RPApplicationCurrentUserRead]:
    applications = await service.list_current_user_rp_applications(
        db=db,
        current_user=current_user,
        ibm_user_service=ibm_user_service,
    )
    return [RPApplicationCurrentUserRead.model_validate(application) for application in applications]


@router.get("/rp-application/{rp_application_uuid}", response_model=RPApplicationRead)
@casbin_guard.require_permission("rp_applications", "read")
async def read_rp_application(
    request: Request,
    rp_application_uuid: uuid_pkg.UUID,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[RPApplicationService, Depends(get_rp_application_service)],
) -> dict[str, Any]:
    return await service.get_rp_application_by_uuid(
        db=db,
        rp_application_uuid=rp_application_uuid,
    )


@router.patch("/rp-application/{rp_application_uuid}")
@casbin_guard.require_permission("rp_applications", "write")
async def patch_rp_application(
    request: Request,
    rp_application_uuid: uuid_pkg.UUID,
    values: RPApplicationUpdate,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[RPApplicationService, Depends(get_rp_application_service)],
) -> dict[str, str]:
    return await service.update_rp_application(
        db=db,
        rp_application_uuid=rp_application_uuid,
        values=values,
    )


@router.delete("/rp-application/{rp_application_uuid}")
@casbin_guard.require_permission("rp_applications", "write")
async def erase_rp_application(
    request: Request,
    rp_application_uuid: uuid_pkg.UUID,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[RPApplicationService, Depends(get_rp_application_service)],
) -> dict[str, str]:
    return await service.delete_rp_application(
        db=db,
        rp_application_uuid=rp_application_uuid,
    )
