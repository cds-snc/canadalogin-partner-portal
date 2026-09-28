from typing import Annotated, Any

from fastapi import APIRouter, Depends, Query, Request
from fastcrud import PaginatedListResponse
from sqlalchemy.ext.asyncio import AsyncSession

from ...api.dependencies import get_application_service, get_current_user
from ...core.db.database import async_get_db
from ...core.exceptions.openapi import error_responses
from ...schemas.application import ApplicationRead
from ...services.application_service import ApplicationService

router = APIRouter(tags=["applications"])


@router.get(
    "/applications/mine",
    response_model=PaginatedListResponse[ApplicationRead],
    responses=error_responses(401, 500),
)
async def read_current_user_applications(
    request: Request,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    current_user: Annotated[dict[str, Any], Depends(get_current_user)],
    service: Annotated[ApplicationService, Depends(get_application_service)],
    page: Annotated[int, Query(ge=1)] = 1,
    items_per_page: Annotated[int, Query(ge=1, le=100)] = 10,
) -> dict[str, Any]:
    _ = request
    return await service.list_current_user_applications(
        db=db,
        user_uuid=current_user["uuid"],
        page=page,
        items_per_page=items_per_page,
    )
