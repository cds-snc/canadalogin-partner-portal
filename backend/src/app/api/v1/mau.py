from datetime import date, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Query

from ...core.access_control import casbin_guard
from ...schemas.mau import MAUReportItem, MAUReportResponse
from ...services.mau_service import MAUService

router = APIRouter(prefix="/mau", tags=["MAU"])


async def get_mau_service() -> MAUService:
    return MAUService()


@router.get("/report", response_model=MAUReportResponse)
@casbin_guard.require_permission("mau_report", "read")
async def get_mau_report(
    application_name: str = Query(..., description="Application name to query"),
    start_date: Optional[date] = Query(None, description="Start date (YYYY-MM-DD), defaults to 30 days ago"),
    end_date: Optional[date] = Query(None, description="End date (YYYY-MM-DD), defaults to today"),
    service: MAUService = Depends(get_mau_service),
) -> MAUReportResponse:
    resolved_end = end_date or date.today()
    resolved_start = start_date or (resolved_end - timedelta(days=30))

    records = await service.get_mau_by_application(application_name, resolved_start, resolved_end)

    return MAUReportResponse(
        application_name=application_name,
        start_date=resolved_start,
        end_date=resolved_end,
        records=[
            MAUReportItem(
                date=r.date,
                application_name=r.application_name,
                total_logins=r.total_logins,
                unique_users=r.unique_users,
                failed_logins=r.failed_logins,
                successful_logins=r.successful_logins,
                mtd_unique_users=r.mtd_unique_users,
            )
            for r in records
        ],
    )
