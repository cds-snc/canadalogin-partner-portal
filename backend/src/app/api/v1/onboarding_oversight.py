from typing import Annotated

from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from ...api.dependencies import (
    get_current_cl_admin,
    get_current_user,
    get_onboarding_oversight_service,
)
from ...core.db.database import async_get_db
from ...core.exceptions.openapi import error_responses
from ...schemas.onboarding import OnboardingState
from ...schemas.onboarding_oversight import (
    OnboardingOversightQueueRowRead,
    OnboardingOversightRecordType,
    OnboardingOversightReportRead,
)
from ...schemas.rp_application import CanadaLoginEnvironment
from ...schemas.rp_application_promotion_request import PromotionRequestStatus
from ...services.onboarding_oversight_service import OnboardingOversightService

router = APIRouter(prefix="/onboarding-oversight", tags=["Onboarding Oversight"])


@router.get("/queue", response_model=list[OnboardingOversightQueueRowRead])
async def get_onboarding_oversight_queue(
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[
        OnboardingOversightService,
        Depends(get_onboarding_oversight_service),
    ],
    _: Annotated[dict, Depends(get_current_cl_admin)],
    onboarding_state: Annotated[OnboardingState | None, Query()] = None,
    record_type: Annotated[OnboardingOversightRecordType | None, Query()] = None,
    department: Annotated[str | None, Query()] = None,
    workspace: Annotated[str | None, Query()] = None,
    environment: Annotated[CanadaLoginEnvironment | None, Query()] = None,
    promotion_status: Annotated[PromotionRequestStatus | None, Query()] = None,
) -> list[dict]:
    return await service.list_queue(
        db=db,
        onboarding_state=onboarding_state,
        record_type=record_type,
        department=department,
        workspace=workspace,
        environment=environment,
        promotion_status=promotion_status,
    )


@router.get(
    "/reports",
    response_model=OnboardingOversightReportRead,
    responses=error_responses(400, 401, 403, 500),
)
async def get_onboarding_oversight_report(
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[
        OnboardingOversightService,
        Depends(get_onboarding_oversight_service),
    ],
    current_user: Annotated[dict, Depends(get_current_user)],
    metric: Annotated[str, Query(description="Report metric identifier")],
    start_date: Annotated[str, Query(description="Start date (YYYY-MM-DD)")],
    end_date: Annotated[str, Query(description="End date (YYYY-MM-DD)")],
    group_by: Annotated[str | None, Query(description="Optional grouping: day, week, month")] = None,
    workspace_uuid: Annotated[
        str | None,
        Query(description="Required active workspace scope for partner readers"),
    ] = None,
    department_id: Annotated[str | None, Query(description="First-release unsupported scope filter")] = None,
    environment: Annotated[str | None, Query(description="First-release unsupported scope filter")] = None,
) -> dict[str, object]:
    return await service.get_report(
        db=db,
        metric=metric,
        start_date=start_date,
        end_date=end_date,
        group_by=group_by,
        workspace_uuid=workspace_uuid,
        department_id=department_id,
        environment=environment,
        current_user=current_user,
    )


@router.get(
    "/reports/export",
    responses=error_responses(400, 401, 403, 500),
)
async def export_onboarding_oversight_report(
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[
        OnboardingOversightService,
        Depends(get_onboarding_oversight_service),
    ],
    current_user: Annotated[dict, Depends(get_current_user)],
    metric: Annotated[str, Query(description="Report metric identifier")],
    start_date: Annotated[str, Query(description="Start date (YYYY-MM-DD)")],
    end_date: Annotated[str, Query(description="End date (YYYY-MM-DD)")],
    group_by: Annotated[str | None, Query(description="Optional grouping: day, week, month")] = None,
    workspace_uuid: Annotated[
        str | None,
        Query(description="Required active workspace scope for partner readers"),
    ] = None,
    department_id: Annotated[str | None, Query(description="First-release unsupported scope filter")] = None,
    environment: Annotated[str | None, Query(description="First-release unsupported scope filter")] = None,
) -> Response:
    csv_content, filename = await service.export_report_csv(
        db=db,
        metric=metric,
        start_date=start_date,
        end_date=end_date,
        group_by=group_by,
        workspace_uuid=workspace_uuid,
        department_id=department_id,
        environment=environment,
        current_user=current_user,
    )
    return Response(
        content=csv_content,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        media_type="text/csv",
    )
