import uuid as uuid_pkg
from typing import Annotated

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from ...api.dependencies import get_application_environment_service
from ...core.access_control import casbin_guard
from ...core.db.database import async_get_db
from ...core.exceptions.openapi import error_responses
from ...schemas.application_environment import ApplicationEnvironmentListRead
from ...services.application_environment_service import ApplicationEnvironmentService

router = APIRouter(tags=["application-environments"])


@router.get(
    "/applications/{application_uuid}/environments",
    response_model=ApplicationEnvironmentListRead,
    responses=error_responses(403, 404, 500),
)
@casbin_guard.require_application_permission("applications", "read")
async def read_application_environments(
    request: Request,
    application_uuid: uuid_pkg.UUID,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[
        ApplicationEnvironmentService,
        Depends(get_application_environment_service),
    ],
    page: Annotated[int, Query(ge=1)] = 1,
    items_per_page: Annotated[int, Query(ge=1, le=100)] = 10,
) -> dict:
    _ = request
    return await service.list_application_environments(
        db=db,
        application_uuid=application_uuid,
        page=page,
        items_per_page=items_per_page,
    )
