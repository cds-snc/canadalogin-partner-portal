import uuid as uuid_pkg
from datetime import date, timedelta
from typing import Annotated, Any

from fastapi import APIRouter, Depends, Query, Request
from fastcrud import PaginatedListResponse
from sqlalchemy.ext.asyncio import AsyncSession

from ...api.dependencies import (
    get_current_user,
    get_ibm_sv_user_service,
    get_mau_service,
    get_rp_application_service,
)
from ...core.access_control import casbin_guard
from ...core.db.database import async_get_db
from ...core.exceptions.http_exceptions import BadRequestException
from ...core.exceptions.openapi import error_responses
from ...repositories.crud_departments import crud_departments
from ...repositories.dependencies import get_ibm_sv_admin_client
from ...repositories.ibm_sv_admin import IBMVerifyAdminClient
from ...schemas.mau import MAUReportItem, MAUReportResponse
from ...schemas.rp_application import (
    RPApplicationCreate,
    RPApplicationCurrentUserOAuthSetupRead,
    RPApplicationCurrentUserRead,
    RPApplicationRead,
    RPApplicationUpdate,
)
from ...services.ibm_sv_user_service import IBMVerifyUserService
from ...services.mau_service import MAUService
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
        current_user=current_user,
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


@router.get(
    "/rp-applications/mine/{rp_application_uuid}/oauth-setup",
    response_model=RPApplicationCurrentUserOAuthSetupRead,
    responses=error_responses(403, 404, 500),
)
async def read_current_user_rp_application_oauth_setup(
    request: Request,
    rp_application_uuid: uuid_pkg.UUID,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    current_user: Annotated[dict, Depends(get_current_user)],
    service: Annotated[RPApplicationService, Depends(get_rp_application_service)],
    ibm_admin_client: Annotated[
        IBMVerifyAdminClient, Depends(get_ibm_sv_admin_client)
    ],
) -> RPApplicationCurrentUserOAuthSetupRead:
    oauth_setup = await service.get_current_user_rp_application_oauth_setup(
        db=db,
        rp_application_uuid=rp_application_uuid,
        current_user=current_user,
        ibm_admin_client=ibm_admin_client,
    )
    return RPApplicationCurrentUserOAuthSetupRead.model_validate(oauth_setup)


@router.get(
    "/rp-applications/mine/{rp_application_uuid}/mau-report",
    response_model=MAUReportResponse,
)
@casbin_guard.require_permission("mau_report", "read")
async def read_current_user_rp_application_mau_report(
    request: Request,
    rp_application_uuid: uuid_pkg.UUID,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    current_user: Annotated[dict, Depends(get_current_user)],
    service: Annotated[RPApplicationService, Depends(get_rp_application_service)],
    ibm_user_service: Annotated[IBMVerifyUserService, Depends(get_ibm_sv_user_service)],
    mau_service: Annotated[MAUService, Depends(get_mau_service)],
    start_date: date | None = Query(
        None,
        description="Start date (YYYY-MM-DD), defaults to 30 days ago",
    ),
    end_date: date | None = Query(
        None,
        description="End date (YYYY-MM-DD), defaults to today",
    ),
) -> MAUReportResponse:
    application = await service.get_current_user_rp_application_by_uuid(
        db=db,
        current_user=current_user,
        rp_application_uuid=rp_application_uuid,
        ibm_user_service=ibm_user_service,
    )
    application_name = application.get("dnr_app_name")
    if not isinstance(application_name, str) or application_name.strip() == "":
        # Keep a clear user-facing failure when data is incomplete.
        raise BadRequestException(
            "RP application does not have a mapped MAU application name"
        )

    department_name: str | None = None
    department_id = application.get("department_id")
    if department_id is not None:
        department = await crud_departments.get(db=db, id=department_id)
        if department:
            department_name = department.get("name")

    resolved_end = end_date or date.today()
    resolved_start = start_date or (resolved_end - timedelta(days=30))
    records = await mau_service.get_mau_by_application(
        application_name=application_name,
        start_date=resolved_start,
        end_date=resolved_end,
    )

    return MAUReportResponse(
        application_name=application_name,
        start_date=resolved_start,
        end_date=resolved_end,
        department_name=department_name,
        records=[
            MAUReportItem(
                date=record.date,
                application_name=record.application_name,
                total_logins=record.total_logins,
                unique_users=record.unique_users,
                failed_logins=record.failed_logins,
                successful_logins=record.successful_logins,
                mtd_unique_users=record.mtd_unique_users,
            )
            for record in records
        ],
    )


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
    current_user: Annotated[dict, Depends(get_current_user)],
) -> dict[str, str]:
    return await service.update_rp_application(
        db=db,
        rp_application_uuid=rp_application_uuid,
        values=values,
        current_user=current_user,
    )


@router.delete("/rp-application/{rp_application_uuid}")
@casbin_guard.require_permission("rp_applications", "write")
async def erase_rp_application(
    request: Request,
    rp_application_uuid: uuid_pkg.UUID,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[RPApplicationService, Depends(get_rp_application_service)],
    current_user: Annotated[dict, Depends(get_current_user)],
) -> dict[str, str]:
    return await service.delete_rp_application(
        db=db,
        rp_application_uuid=rp_application_uuid,
        current_user=current_user,
    )
