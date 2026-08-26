import uuid as uuid_pkg
from typing import Annotated, Any

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from ...api.dependencies import get_current_user, get_rp_application_developer_invitation_service
from ...core.db.database import async_get_db
from ...core.exceptions.http_exceptions import (
    BadRequestException,
    DuplicateValueException,
    ForbiddenException,
    NotFoundException,
)
from ...core.exceptions.openapi import error_responses
from ...core.identity import SESSION_PREPARED_INVITATION_UUID_KEY
from ...schemas.rp_application_developer_invitation import (
    RPApplicationDeveloperInvitationAcceptResponse,
    RPApplicationDeveloperInvitationPrepareRequest,
    RPApplicationDeveloperInvitationPrepareResponse,
)
from ...services.rp_application_developer_invitation_service import RPApplicationDeveloperInvitationService

router = APIRouter(tags=["rp-application-developer-invitations"])


@router.post(
    "/rp-application-developer-invitations/prepare",
    response_model=RPApplicationDeveloperInvitationPrepareResponse,
    responses=error_responses(404, 422, 500),
)
async def prepare_rp_application_developer_invitation(
    request: Request,
    payload: RPApplicationDeveloperInvitationPrepareRequest,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[
        RPApplicationDeveloperInvitationService,
        Depends(get_rp_application_developer_invitation_service),
    ],
) -> RPApplicationDeveloperInvitationPrepareResponse:
    # A stale preparation must never survive a failed replacement attempt.
    request.session.pop(SESSION_PREPARED_INVITATION_UUID_KEY, None)
    invitation_uuid = await service.prepare_developer_invitation(
        db=db,
        token=payload.token,
        correlation_id=str(getattr(request.state, "request_id", "")) or None,
    )
    request.session[SESSION_PREPARED_INVITATION_UUID_KEY] = str(invitation_uuid)
    return RPApplicationDeveloperInvitationPrepareResponse()


@router.post(
    "/rp-application-developer-invitations/accept-prepared",
    response_model=RPApplicationDeveloperInvitationAcceptResponse,
    responses=error_responses(400, 401, 403, 404, 422, 500),
)
async def accept_prepared_rp_application_developer_invitation(
    request: Request,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[
        RPApplicationDeveloperInvitationService,
        Depends(get_rp_application_developer_invitation_service),
    ],
    current_user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> dict[str, Any]:
    prepared_invitation_uuid = request.session.pop(
        SESSION_PREPARED_INVITATION_UUID_KEY,
        None,
    )
    try:
        invitation_uuid = uuid_pkg.UUID(str(prepared_invitation_uuid))
    except (AttributeError, TypeError, ValueError) as exc:
        raise NotFoundException("Developer invitation is unavailable") from exc

    try:
        return await service.accept_prepared_developer_invitation(
            db=db,
            invitation_uuid=invitation_uuid,
            current_user=current_user,
            correlation_id=str(getattr(request.state, "request_id", "")) or None,
        )
    except (
        BadRequestException,
        DuplicateValueException,
        ForbiddenException,
        NotFoundException,
    ) as exc:
        raise NotFoundException("Developer invitation is unavailable") from exc
