from typing import Annotated, Any

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from ...api.dependencies import get_current_user, get_rp_application_developer_invitation_service
from ...core.db.database import async_get_db
from ...core.exceptions.openapi import error_responses
from ...schemas.rp_application_developer_invitation import (
    RPApplicationDeveloperInvitationAcceptRequest,
    RPApplicationDeveloperInvitationAcceptResponse,
)
from ...services.rp_application_developer_invitation_service import RPApplicationDeveloperInvitationService

router = APIRouter(tags=["rp-application-developer-invitations"])


@router.post(
    "/rp-application-developer-invitations/accept",
    response_model=RPApplicationDeveloperInvitationAcceptResponse,
    responses=error_responses(400, 401, 403, 404, 422, 500),
)
async def accept_rp_application_developer_invitation(
    request: Request,
    payload: RPApplicationDeveloperInvitationAcceptRequest,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[
        RPApplicationDeveloperInvitationService,
        Depends(get_rp_application_developer_invitation_service),
    ],
    current_user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> dict[str, Any]:
    return await service.accept_developer_invitation(
        db=db,
        token=payload.token,
        current_user=current_user,
    )
