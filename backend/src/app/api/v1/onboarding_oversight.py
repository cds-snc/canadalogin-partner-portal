from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from ...api.dependencies import (
    get_current_cl_admin,
    get_onboarding_oversight_service,
)
from ...core.db.database import async_get_db
from ...schemas.onboarding_oversight import (
    ProductionReviewQueueRowRead,
)
from ...schemas.rp_application_promotion_request import ProductionReviewStatus
from ...services.onboarding_oversight_service import OnboardingOversightService

router = APIRouter(prefix="/onboarding-oversight", tags=["Onboarding Oversight"])


@router.get(
    "/production-reviews",
    response_model=list[ProductionReviewQueueRowRead],
)
async def get_production_review_queue(
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[
        OnboardingOversightService,
        Depends(get_onboarding_oversight_service),
    ],
    _: Annotated[dict, Depends(get_current_cl_admin)],
    department: Annotated[str | None, Query()] = None,
    workspace: Annotated[str | None, Query()] = None,
    review_status: Annotated[ProductionReviewStatus | None, Query()] = None,
) -> list[dict]:
    return await service.list_queue(
        db=db,
        department=department,
        workspace=workspace,
        review_status=review_status,
    )
