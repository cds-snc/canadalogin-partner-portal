from typing import Annotated

from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from ...api.dependencies import get_current_user, get_onboarding_oversight_service
from ...core.db.database import async_get_db
from ...core.exceptions.openapi import error_responses
from ...schemas.onboarding_oversight import OnboardingOversightReportRead
from ...services.onboarding_oversight_service import OnboardingOversightService

router = APIRouter(tags=["workspace reports"])


@router.get(
    "/workspaces/{workspace_uuid}/reports",
    response_model=OnboardingOversightReportRead,
    responses=error_responses(400, 401, 403, 404, 500),
)
async def get_workspace_report(
    workspace_uuid: str,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[
        OnboardingOversightService,
        Depends(get_onboarding_oversight_service),
    ],
    current_user: Annotated[dict, Depends(get_current_user)],
    metric: Annotated[str, Query(description="Report metric identifier")],
    start_date: Annotated[str, Query(description="Start date (YYYY-MM-DD)")],
    end_date: Annotated[str, Query(description="End date (YYYY-MM-DD)")],
    group_by: Annotated[
        str | None,
        Query(description="Optional grouping: day, week, month"),
    ] = None,
) -> dict[str, object]:
    """Return the shared aggregate report bound to the selected workspace."""
    return await service.get_report(
        db=db,
        metric=metric,
        start_date=start_date,
        end_date=end_date,
        group_by=group_by,
        workspace_uuid=workspace_uuid,
        department_id=None,
        environment=None,
        current_user=current_user,
    )


@router.get(
    "/workspaces/{workspace_uuid}/reports/export",
    responses=error_responses(400, 401, 403, 404, 500),
)
async def export_workspace_report(
    workspace_uuid: str,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[
        OnboardingOversightService,
        Depends(get_onboarding_oversight_service),
    ],
    current_user: Annotated[dict, Depends(get_current_user)],
    metric: Annotated[str, Query(description="Report metric identifier")],
    start_date: Annotated[str, Query(description="Start date (YYYY-MM-DD)")],
    end_date: Annotated[str, Query(description="End date (YYYY-MM-DD)")],
    group_by: Annotated[
        str | None,
        Query(description="Optional grouping: day, week, month"),
    ] = None,
) -> Response:
    """Export the shared aggregate report bound to the selected workspace."""
    csv_content, filename = await service.export_report_csv(
        db=db,
        metric=metric,
        start_date=start_date,
        end_date=end_date,
        group_by=group_by,
        workspace_uuid=workspace_uuid,
        department_id=None,
        environment=None,
        current_user=current_user,
    )
    return Response(
        content=csv_content,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        media_type="text/csv",
    )
