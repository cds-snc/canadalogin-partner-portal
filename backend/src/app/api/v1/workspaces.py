import uuid as uuid_pkg
from typing import Annotated, Any

from fastapi import APIRouter, Depends, Header, Request
from sqlalchemy.ext.asyncio import AsyncSession

from ...api.dependencies import (
    get_current_cl_admin,
    get_current_user,
    get_ibm_sv_admin_service,
    get_rp_application_developer_invitation_service,
    get_workspace_service,
)
from ...core.access_control import casbin_guard
from ...core.db.database import async_get_db
from ...core.exceptions.openapi import error_responses
from ...schemas.application_information import (
    ApplicationInformationContactCreate,
    ApplicationInformationContactRead,
    ApplicationInformationContactUpdate,
    ApplicationInformationCreate,
    ApplicationInformationRead,
    ApplicationInformationReviewChecklistSummaryRead,
    ApplicationInformationReviewChecklistSummaryWrite,
    ApplicationInformationReviewContextRead,
    ApplicationInformationReviewNoteCreate,
    ApplicationInformationReviewNoteRead,
    ApplicationInformationUpdate,
)
from ...schemas.onboarding import (
    OnboardingLifecycleTransitionRequest,
    WorkspaceRPApplicationOnboardingLifecycleTransitionRequest,
)
from ...schemas.rp_application import (
    RPApplicationRead,
    RPApplicationSummaryRead,
    RPApplicationUsageAuditTrailRead,
    RPApplicationUsageSummaryRead,
    WorkspaceRPApplicationConfigurationRead,
    WorkspaceRPApplicationRegistrationDraftCreate,
    WorkspaceRPApplicationRegistrationDraftPatch,
    WorkspaceRPApplicationRegistrationDraftRead,
    WorkspaceRPApplicationRegistrationSubmissionRead,
    WorkspaceRPApplicationRegistrationUpdate,
)
from ...schemas.rp_application_developer_invitation import (
    RPApplicationDeveloperInvitationCreate,
    RPApplicationDeveloperInvitationRead,
    RPApplicationDeveloperInvitationReissue,
    RPApplicationDeveloperInvitationWriteResponse,
)
from ...schemas.rp_application_promotion_request import (
    PromotionRequestUpsert,
    PromotionReviewUpdate,
    RPApplicationPromotionRequestRead,
)
from ...schemas.workspace import WorkspaceCreate, WorkspaceRead, WorkspaceUpdate
from ...services.rp_application_developer_invitation_service import RPApplicationDeveloperInvitationService
from ...services.workspace_service import WorkspaceService

router = APIRouter(tags=["workspaces"])


@router.get(
    "/workspaces",
    response_model=list[WorkspaceRead],
    responses=error_responses(401, 403, 500),
)
@casbin_guard.require_permission("workspace", "read")
async def read_workspaces(
    request: Request,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[WorkspaceService, Depends(get_workspace_service)],
    current_user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> list[dict[str, Any]]:
    return await service.list_workspaces(db=db, current_user=current_user)


@router.get(
    "/workspaces/mine",
    response_model=list[WorkspaceRead],
    responses=error_responses(401, 403, 500),
)
async def read_current_user_workspaces(
    request: Request,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[WorkspaceService, Depends(get_workspace_service)],
    current_user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> list[dict[str, Any]]:
    return await service.list_current_user_workspaces(
        db=db,
        current_user=current_user,
    )


@router.post(
    "/workspaces",
    response_model=WorkspaceRead,
    status_code=201,
    responses=error_responses(400, 401, 403, 404, 409, 422, 500),
)
@casbin_guard.require_permission("workspace", "write")
async def write_workspace(
    request: Request,
    workspace: WorkspaceCreate,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[WorkspaceService, Depends(get_workspace_service)],
    current_user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> dict[str, Any]:
    return await service.create_workspace(
        db=db,
        workspace=workspace,
        current_user=current_user,
    )


@router.get(
    "/workspaces/{workspace_uuid}",
    response_model=WorkspaceRead,
    responses=error_responses(401, 403, 404, 422, 500),
)
async def read_workspace(
    request: Request,
    workspace_uuid: uuid_pkg.UUID,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[WorkspaceService, Depends(get_workspace_service)],
    current_user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> dict[str, Any]:
    return await service.get_workspace_by_uuid(
        db=db,
        workspace_uuid=workspace_uuid,
        current_user=current_user,
    )


@router.post(
    "/workspaces/{workspace_uuid}/onboarding-state",
    response_model=WorkspaceRead,
    responses=error_responses(400, 401, 403, 404, 422, 500),
)
async def write_workspace_onboarding_state(
    request: Request,
    workspace_uuid: uuid_pkg.UUID,
    payload: OnboardingLifecycleTransitionRequest,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[WorkspaceService, Depends(get_workspace_service)],
    current_user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> dict[str, Any]:
    return await service.transition_workspace_onboarding_state(
        db=db,
        workspace_uuid=workspace_uuid,
        payload=payload,
        current_user=current_user,
    )


@router.get(
    "/workspaces/{workspace_uuid}/application-information",
    response_model=list[ApplicationInformationRead],
    responses=error_responses(401, 403, 404, 422, 500),
)
async def read_workspace_application_information(
    request: Request,
    workspace_uuid: uuid_pkg.UUID,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[WorkspaceService, Depends(get_workspace_service)],
    current_user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> list[dict[str, Any]]:
    return await service.list_workspace_application_information(
        db=db,
        workspace_uuid=workspace_uuid,
        current_user=current_user,
    )


@router.post(
    "/workspaces/{workspace_uuid}/application-information",
    response_model=ApplicationInformationRead,
    status_code=201,
    responses=error_responses(400, 401, 403, 404, 422, 500),
)
async def write_workspace_application_information(
    request: Request,
    workspace_uuid: uuid_pkg.UUID,
    payload: ApplicationInformationCreate,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[WorkspaceService, Depends(get_workspace_service)],
    current_user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> dict[str, Any]:
    return await service.create_workspace_application_information(
        db=db,
        workspace_uuid=workspace_uuid,
        payload=payload,
        current_user=current_user,
    )


@router.get(
    "/workspaces/{workspace_uuid}/application-information/{application_information_uuid}",
    response_model=ApplicationInformationRead,
    responses=error_responses(401, 403, 404, 422, 500),
)
async def read_workspace_application_information_detail(
    request: Request,
    workspace_uuid: uuid_pkg.UUID,
    application_information_uuid: uuid_pkg.UUID,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[WorkspaceService, Depends(get_workspace_service)],
    current_user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> dict[str, Any]:
    return await service.get_workspace_application_information(
        db=db,
        workspace_uuid=workspace_uuid,
        application_information_uuid=application_information_uuid,
        current_user=current_user,
    )


@router.post(
    "/workspaces/{workspace_uuid}/application-information/{application_information_uuid}/onboarding-state",
    response_model=ApplicationInformationRead,
    responses=error_responses(400, 401, 403, 404, 422, 500),
)
async def write_workspace_application_information_onboarding_state(
    request: Request,
    workspace_uuid: uuid_pkg.UUID,
    application_information_uuid: uuid_pkg.UUID,
    payload: OnboardingLifecycleTransitionRequest,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[WorkspaceService, Depends(get_workspace_service)],
    current_user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> dict[str, Any]:
    return await service.transition_workspace_application_information_onboarding_state(
        db=db,
        workspace_uuid=workspace_uuid,
        application_information_uuid=application_information_uuid,
        payload=payload,
        current_user=current_user,
    )


@router.patch(
    "/workspaces/{workspace_uuid}/application-information/{application_information_uuid}",
    response_model=ApplicationInformationRead,
    responses=error_responses(400, 401, 403, 404, 422, 500),
)
async def patch_workspace_application_information(
    request: Request,
    workspace_uuid: uuid_pkg.UUID,
    application_information_uuid: uuid_pkg.UUID,
    payload: ApplicationInformationUpdate,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[WorkspaceService, Depends(get_workspace_service)],
    current_user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> dict[str, Any]:
    return await service.update_workspace_application_information(
        db=db,
        workspace_uuid=workspace_uuid,
        application_information_uuid=application_information_uuid,
        payload=payload,
        current_user=current_user,
    )


@router.delete(
    "/workspaces/{workspace_uuid}/application-information/{application_information_uuid}",
    responses=error_responses(401, 403, 404, 409, 422, 500),
)
async def erase_workspace_application_information(
    request: Request,
    workspace_uuid: uuid_pkg.UUID,
    application_information_uuid: uuid_pkg.UUID,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[WorkspaceService, Depends(get_workspace_service)],
    current_user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> dict[str, str]:
    return await service.delete_workspace_application_information(
        db=db,
        workspace_uuid=workspace_uuid,
        application_information_uuid=application_information_uuid,
        current_user=current_user,
    )


@router.get(
    "/workspaces/{workspace_uuid}/application-information/{application_information_uuid}/contacts",
    response_model=list[ApplicationInformationContactRead],
    responses=error_responses(401, 403, 404, 422, 500),
)
async def read_application_information_contacts(
    request: Request,
    workspace_uuid: uuid_pkg.UUID,
    application_information_uuid: uuid_pkg.UUID,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[WorkspaceService, Depends(get_workspace_service)],
    current_user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> list[dict[str, Any]]:
    return await service.list_application_information_contacts(
        db=db,
        workspace_uuid=workspace_uuid,
        application_information_uuid=application_information_uuid,
        current_user=current_user,
    )


@router.post(
    "/workspaces/{workspace_uuid}/application-information/{application_information_uuid}/contacts",
    response_model=ApplicationInformationContactRead,
    status_code=201,
    responses=error_responses(400, 401, 403, 404, 422, 500),
)
async def write_application_information_contact(
    request: Request,
    workspace_uuid: uuid_pkg.UUID,
    application_information_uuid: uuid_pkg.UUID,
    payload: ApplicationInformationContactCreate,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[WorkspaceService, Depends(get_workspace_service)],
    current_user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> dict[str, Any]:
    return await service.add_application_information_contact(
        db=db,
        workspace_uuid=workspace_uuid,
        application_information_uuid=application_information_uuid,
        payload=payload,
        current_user=current_user,
    )


@router.patch(
    "/workspaces/{workspace_uuid}/application-information/{application_information_uuid}/contacts/{contact_uuid}",
    response_model=ApplicationInformationContactRead,
    responses=error_responses(400, 401, 403, 404, 422, 500),
)
async def patch_application_information_contact(
    request: Request,
    workspace_uuid: uuid_pkg.UUID,
    application_information_uuid: uuid_pkg.UUID,
    contact_uuid: uuid_pkg.UUID,
    payload: ApplicationInformationContactUpdate,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[WorkspaceService, Depends(get_workspace_service)],
    current_user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> dict[str, Any]:
    return await service.update_application_information_contact(
        db=db,
        workspace_uuid=workspace_uuid,
        application_information_uuid=application_information_uuid,
        contact_uuid=contact_uuid,
        payload=payload,
        current_user=current_user,
    )


@router.delete(
    "/workspaces/{workspace_uuid}/application-information/{application_information_uuid}/contacts/{contact_uuid}",
    responses=error_responses(401, 403, 404, 422, 500),
)
async def erase_application_information_contact(
    request: Request,
    workspace_uuid: uuid_pkg.UUID,
    application_information_uuid: uuid_pkg.UUID,
    contact_uuid: uuid_pkg.UUID,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[WorkspaceService, Depends(get_workspace_service)],
    current_user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> dict[str, str]:
    return await service.delete_application_information_contact(
        db=db,
        workspace_uuid=workspace_uuid,
        application_information_uuid=application_information_uuid,
        contact_uuid=contact_uuid,
        current_user=current_user,
    )


@router.get(
    "/workspaces/{workspace_uuid}/application-information/{application_information_uuid}/review",
    response_model=ApplicationInformationReviewContextRead,
    responses=error_responses(401, 403, 404, 422, 500),
)
async def read_application_information_review_context(
    request: Request,
    workspace_uuid: uuid_pkg.UUID,
    application_information_uuid: uuid_pkg.UUID,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[WorkspaceService, Depends(get_workspace_service)],
    current_user: Annotated[dict[str, Any], Depends(get_current_cl_admin)],
) -> dict[str, Any]:
    return await service.get_workspace_application_information_review_context(
        db=db,
        workspace_uuid=workspace_uuid,
        application_information_uuid=application_information_uuid,
        current_user=current_user,
    )


@router.post(
    "/workspaces/{workspace_uuid}/application-information/{application_information_uuid}/review/notes",
    response_model=ApplicationInformationReviewNoteRead,
    status_code=201,
    responses=error_responses(400, 401, 403, 404, 422, 500),
)
async def write_application_information_review_note(
    request: Request,
    workspace_uuid: uuid_pkg.UUID,
    application_information_uuid: uuid_pkg.UUID,
    payload: ApplicationInformationReviewNoteCreate,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[WorkspaceService, Depends(get_workspace_service)],
    current_user: Annotated[dict[str, Any], Depends(get_current_cl_admin)],
) -> dict[str, Any]:
    return await service.add_workspace_application_information_review_note(
        db=db,
        workspace_uuid=workspace_uuid,
        application_information_uuid=application_information_uuid,
        payload=payload,
        current_user=current_user,
    )


@router.put(
    "/workspaces/{workspace_uuid}/application-information/{application_information_uuid}/review/checklist",
    response_model=ApplicationInformationReviewChecklistSummaryRead,
    responses=error_responses(400, 401, 403, 404, 422, 500),
)
async def put_application_information_review_checklist(
    request: Request,
    workspace_uuid: uuid_pkg.UUID,
    application_information_uuid: uuid_pkg.UUID,
    payload: ApplicationInformationReviewChecklistSummaryWrite,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[WorkspaceService, Depends(get_workspace_service)],
    current_user: Annotated[dict[str, Any], Depends(get_current_cl_admin)],
) -> dict[str, Any]:
    return await service.upsert_workspace_application_information_review_checklist(
        db=db,
        workspace_uuid=workspace_uuid,
        application_information_uuid=application_information_uuid,
        payload=payload,
        current_user=current_user,
    )


@router.get(
    "/workspaces/{workspace_uuid}/applications",
    response_model=list[RPApplicationSummaryRead],
    responses=error_responses(401, 403, 404, 422, 500),
)
async def read_workspace_rp_applications(
    request: Request,
    workspace_uuid: uuid_pkg.UUID,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[WorkspaceService, Depends(get_workspace_service)],
    current_user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> list[dict[str, Any]]:
    return await service.list_workspace_rp_applications(
        db=db,
        workspace_uuid=workspace_uuid,
        current_user=current_user,
    )


@router.get(
    "/workspaces/{workspace_uuid}/applications/{rp_application_uuid}/configuration",
    response_model=WorkspaceRPApplicationConfigurationRead,
    responses=error_responses(401, 403, 404, 422, 500),
)
async def read_workspace_rp_application_configuration(
    request: Request,
    workspace_uuid: uuid_pkg.UUID,
    rp_application_uuid: uuid_pkg.UUID,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[WorkspaceService, Depends(get_workspace_service)],
    current_user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> dict[str, Any]:
    return await service.get_workspace_rp_application_configuration(
        db=db,
        workspace_uuid=workspace_uuid,
        rp_application_uuid=rp_application_uuid,
        current_user=current_user,
    )


@router.post(
    "/workspaces/{workspace_uuid}/applications",
    response_model=WorkspaceRPApplicationRegistrationDraftRead,
    status_code=201,
    responses=error_responses(400, 401, 403, 404, 409, 422, 500),
)
async def write_workspace_rp_application(
    request: Request,
    workspace_uuid: uuid_pkg.UUID,
    payload: WorkspaceRPApplicationRegistrationDraftCreate,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[WorkspaceService, Depends(get_workspace_service)],
    current_user: Annotated[dict[str, Any], Depends(get_current_user)],
    registration_creation_key: Annotated[uuid_pkg.UUID, Header(alias="Idempotency-Key")],
) -> dict[str, Any]:
    return await service.create_workspace_rp_application_registration_draft(
        db=db,
        workspace_uuid=workspace_uuid,
        payload=payload,
        current_user=current_user,
        registration_creation_key=registration_creation_key,
        correlation_id=str(getattr(request.state, "request_id", "")) or None,
    )


@router.get(
    "/workspaces/{workspace_uuid}/applications/{rp_application_uuid}",
    response_model=RPApplicationRead,
    responses=error_responses(401, 403, 404, 422, 500),
)
async def read_workspace_rp_application_detail(
    request: Request,
    workspace_uuid: uuid_pkg.UUID,
    rp_application_uuid: uuid_pkg.UUID,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[WorkspaceService, Depends(get_workspace_service)],
    current_user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> dict[str, Any]:
    return await service.get_workspace_rp_application(
        db=db,
        workspace_uuid=workspace_uuid,
        rp_application_uuid=rp_application_uuid,
        current_user=current_user,
    )


@router.get(
    "/workspaces/{workspace_uuid}/applications/{rp_application_uuid}/registration-draft",
    response_model=WorkspaceRPApplicationRegistrationDraftRead,
    responses=error_responses(400, 401, 403, 404, 409, 422, 500),
)
async def read_workspace_rp_application_registration_draft(
    request: Request,
    workspace_uuid: uuid_pkg.UUID,
    rp_application_uuid: uuid_pkg.UUID,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[WorkspaceService, Depends(get_workspace_service)],
    current_user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> dict[str, Any]:
    return await service.get_workspace_rp_application_registration_draft(
        db=db,
        workspace_uuid=workspace_uuid,
        rp_application_uuid=rp_application_uuid,
        current_user=current_user,
    )


@router.patch(
    "/workspaces/{workspace_uuid}/applications/{rp_application_uuid}/registration-draft",
    response_model=WorkspaceRPApplicationRegistrationDraftRead,
    responses=error_responses(400, 401, 403, 404, 409, 422, 500),
)
async def patch_workspace_rp_application_registration_draft(
    request: Request,
    workspace_uuid: uuid_pkg.UUID,
    rp_application_uuid: uuid_pkg.UUID,
    payload: WorkspaceRPApplicationRegistrationDraftPatch,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[WorkspaceService, Depends(get_workspace_service)],
    current_user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> dict[str, Any]:
    return await service.update_workspace_rp_application_registration_draft(
        db=db,
        workspace_uuid=workspace_uuid,
        rp_application_uuid=rp_application_uuid,
        payload=payload,
        current_user=current_user,
        correlation_id=str(getattr(request.state, "request_id", "")) or None,
    )


@router.post(
    "/workspaces/{workspace_uuid}/applications/{rp_application_uuid}/onboarding-state",
    response_model=WorkspaceRPApplicationRegistrationSubmissionRead | RPApplicationRead,
    responses=error_responses(400, 401, 403, 404, 409, 422, 500),
)
async def write_workspace_rp_application_onboarding_state(
    request: Request,
    workspace_uuid: uuid_pkg.UUID,
    rp_application_uuid: uuid_pkg.UUID,
    payload: WorkspaceRPApplicationOnboardingLifecycleTransitionRequest,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[WorkspaceService, Depends(get_workspace_service)],
    current_user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> dict[str, Any]:
    return await service.transition_workspace_rp_application_onboarding_state(
        db=db,
        workspace_uuid=workspace_uuid,
        rp_application_uuid=rp_application_uuid,
        payload=payload,
        current_user=current_user,
        correlation_id=str(getattr(request.state, "request_id", "")) or None,
    )


@router.get(
    "/workspaces/{workspace_uuid}/applications/{rp_application_uuid}/promotion-request",
    response_model=RPApplicationPromotionRequestRead,
    responses=error_responses(400, 401, 403, 404, 409, 422, 500),
)
async def read_workspace_rp_application_promotion_request(
    request: Request,
    workspace_uuid: uuid_pkg.UUID,
    rp_application_uuid: uuid_pkg.UUID,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[WorkspaceService, Depends(get_workspace_service)],
    current_user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> dict[str, Any]:
    return await service.get_workspace_rp_application_promotion_request(
        db=db,
        workspace_uuid=workspace_uuid,
        rp_application_uuid=rp_application_uuid,
        current_user=current_user,
    )


@router.post(
    "/workspaces/{workspace_uuid}/applications/{rp_application_uuid}/promotion-request",
    response_model=RPApplicationRead,
    responses=error_responses(400, 401, 403, 404, 422, 500),
)
async def write_workspace_rp_application_promotion_request(
    request: Request,
    workspace_uuid: uuid_pkg.UUID,
    rp_application_uuid: uuid_pkg.UUID,
    payload: PromotionRequestUpsert,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[WorkspaceService, Depends(get_workspace_service)],
    current_user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> dict[str, Any]:
    return await service.upsert_workspace_rp_application_promotion_request(
        db=db,
        workspace_uuid=workspace_uuid,
        rp_application_uuid=rp_application_uuid,
        payload=payload,
        current_user=current_user,
    )


@router.patch(
    "/workspaces/{workspace_uuid}/applications/{rp_application_uuid}/promotion-request",
    response_model=RPApplicationRead,
    responses=error_responses(400, 401, 403, 404, 422, 500),
)
async def patch_workspace_rp_application_promotion_request(
    request: Request,
    workspace_uuid: uuid_pkg.UUID,
    rp_application_uuid: uuid_pkg.UUID,
    payload: PromotionReviewUpdate,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[WorkspaceService, Depends(get_workspace_service)],
    current_user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> dict[str, Any]:
    return await service.review_workspace_rp_application_promotion_request(
        db=db,
        workspace_uuid=workspace_uuid,
        rp_application_uuid=rp_application_uuid,
        payload=payload,
        current_user=current_user,
    )


@router.patch(
    "/workspaces/{workspace_uuid}/applications/{rp_application_uuid}",
    response_model=RPApplicationRead,
    responses=error_responses(400, 401, 403, 404, 422, 500),
)
async def patch_workspace_rp_application(
    request: Request,
    workspace_uuid: uuid_pkg.UUID,
    rp_application_uuid: uuid_pkg.UUID,
    payload: WorkspaceRPApplicationRegistrationUpdate,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[WorkspaceService, Depends(get_workspace_service)],
    current_user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> dict[str, Any]:
    return await service.update_workspace_rp_application(
        db=db,
        workspace_uuid=workspace_uuid,
        rp_application_uuid=rp_application_uuid,
        payload=payload,
        current_user=current_user,
    )


@router.delete(
    "/workspaces/{workspace_uuid}/applications/{rp_application_uuid}",
    responses=error_responses(401, 403, 404, 422, 500),
)
async def erase_workspace_rp_application(
    request: Request,
    workspace_uuid: uuid_pkg.UUID,
    rp_application_uuid: uuid_pkg.UUID,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[WorkspaceService, Depends(get_workspace_service)],
    current_user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> dict[str, str]:
    return await service.delete_workspace_rp_application(
        db=db,
        workspace_uuid=workspace_uuid,
        rp_application_uuid=rp_application_uuid,
        current_user=current_user,
    )


@router.get(
    "/workspaces/{workspace_uuid}/invitations",
    response_model=list[RPApplicationDeveloperInvitationRead],
    responses=error_responses(401, 403, 404, 422, 500),
)
async def read_workspace_developer_invitations(
    request: Request,
    workspace_uuid: uuid_pkg.UUID,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[
        RPApplicationDeveloperInvitationService,
        Depends(get_rp_application_developer_invitation_service),
    ],
    current_user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> list[dict[str, Any]]:
    return await service.list_developer_invitations(
        db=db,
        workspace_uuid=workspace_uuid,
        rp_application_uuid=None,
        current_user=current_user,
    )


@router.post(
    "/workspaces/{workspace_uuid}/invitations",
    response_model=RPApplicationDeveloperInvitationWriteResponse,
    status_code=201,
    responses=error_responses(400, 401, 403, 404, 409, 422, 500),
)
async def write_workspace_developer_invitation(
    request: Request,
    workspace_uuid: uuid_pkg.UUID,
    payload: RPApplicationDeveloperInvitationCreate,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[
        RPApplicationDeveloperInvitationService,
        Depends(get_rp_application_developer_invitation_service),
    ],
    current_user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> dict[str, Any]:
    return await service.create_developer_invitation(
        db=db,
        workspace_uuid=workspace_uuid,
        rp_application_uuid=None,
        current_user=current_user,
        invited_email=payload.invited_email,
        role=payload.role,
        invite_expires_at=payload.invite_expires_at,
    )


@router.post(
    "/workspaces/{workspace_uuid}/invitations/{invitation_uuid}/revoke",
    response_model=RPApplicationDeveloperInvitationRead,
    responses=error_responses(400, 401, 403, 404, 422, 500),
)
async def revoke_workspace_developer_invitation(
    request: Request,
    workspace_uuid: uuid_pkg.UUID,
    invitation_uuid: uuid_pkg.UUID,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[
        RPApplicationDeveloperInvitationService,
        Depends(get_rp_application_developer_invitation_service),
    ],
    current_user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> dict[str, Any]:
    return await service.revoke_developer_invitation(
        db=db,
        workspace_uuid=workspace_uuid,
        rp_application_uuid=None,
        invitation_uuid=invitation_uuid,
        current_user=current_user,
    )


@router.post(
    "/workspaces/{workspace_uuid}/invitations/{invitation_uuid}/reissue",
    response_model=RPApplicationDeveloperInvitationWriteResponse,
    responses=error_responses(400, 401, 403, 404, 422, 500),
)
async def reissue_workspace_developer_invitation(
    request: Request,
    workspace_uuid: uuid_pkg.UUID,
    invitation_uuid: uuid_pkg.UUID,
    payload: RPApplicationDeveloperInvitationReissue,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[
        RPApplicationDeveloperInvitationService,
        Depends(get_rp_application_developer_invitation_service),
    ],
    current_user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> dict[str, Any]:
    return await service.reissue_developer_invitation(
        db=db,
        workspace_uuid=workspace_uuid,
        rp_application_uuid=None,
        invitation_uuid=invitation_uuid,
        current_user=current_user,
        invite_expires_at=payload.invite_expires_at,
    )


@router.get(
    "/workspaces/{workspace_uuid}/applications/{rp_application_uuid}/developer-invitations",
    response_model=list[RPApplicationDeveloperInvitationRead],
    responses=error_responses(401, 403, 404, 422, 500),
)
async def read_workspace_rp_application_developer_invitations(
    request: Request,
    workspace_uuid: uuid_pkg.UUID,
    rp_application_uuid: uuid_pkg.UUID,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[
        RPApplicationDeveloperInvitationService,
        Depends(get_rp_application_developer_invitation_service),
    ],
    current_user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> list[dict[str, Any]]:
    return await service.list_developer_invitations(
        db=db,
        workspace_uuid=workspace_uuid,
        rp_application_uuid=rp_application_uuid,
        current_user=current_user,
    )


@router.post(
    "/workspaces/{workspace_uuid}/applications/{rp_application_uuid}/developer-invitations",
    response_model=RPApplicationDeveloperInvitationWriteResponse,
    status_code=201,
    responses=error_responses(400, 401, 403, 404, 409, 422, 500),
)
async def write_workspace_rp_application_developer_invitation(
    request: Request,
    workspace_uuid: uuid_pkg.UUID,
    rp_application_uuid: uuid_pkg.UUID,
    payload: RPApplicationDeveloperInvitationCreate,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[
        RPApplicationDeveloperInvitationService,
        Depends(get_rp_application_developer_invitation_service),
    ],
    current_user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> dict[str, Any]:
    return await service.create_developer_invitation(
        db=db,
        workspace_uuid=workspace_uuid,
        rp_application_uuid=rp_application_uuid,
        current_user=current_user,
        invited_email=payload.invited_email,
        role=payload.role,
        invite_expires_at=payload.invite_expires_at,
    )


@router.post(
    "/workspaces/{workspace_uuid}/applications/{rp_application_uuid}/developer-invitations/{invitation_uuid}/revoke",
    response_model=RPApplicationDeveloperInvitationRead,
    responses=error_responses(400, 401, 403, 404, 422, 500),
)
async def revoke_workspace_rp_application_developer_invitation(
    request: Request,
    workspace_uuid: uuid_pkg.UUID,
    rp_application_uuid: uuid_pkg.UUID,
    invitation_uuid: uuid_pkg.UUID,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[
        RPApplicationDeveloperInvitationService,
        Depends(get_rp_application_developer_invitation_service),
    ],
    current_user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> dict[str, Any]:
    return await service.revoke_developer_invitation(
        db=db,
        workspace_uuid=workspace_uuid,
        rp_application_uuid=rp_application_uuid,
        invitation_uuid=invitation_uuid,
        current_user=current_user,
    )


@router.post(
    "/workspaces/{workspace_uuid}/applications/{rp_application_uuid}/developer-invitations/{invitation_uuid}/reissue",
    response_model=RPApplicationDeveloperInvitationWriteResponse,
    responses=error_responses(400, 401, 403, 404, 422, 500),
)
async def reissue_workspace_rp_application_developer_invitation(
    request: Request,
    workspace_uuid: uuid_pkg.UUID,
    rp_application_uuid: uuid_pkg.UUID,
    invitation_uuid: uuid_pkg.UUID,
    payload: RPApplicationDeveloperInvitationReissue,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[
        RPApplicationDeveloperInvitationService,
        Depends(get_rp_application_developer_invitation_service),
    ],
    current_user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> dict[str, Any]:
    return await service.reissue_developer_invitation(
        db=db,
        workspace_uuid=workspace_uuid,
        rp_application_uuid=rp_application_uuid,
        invitation_uuid=invitation_uuid,
        current_user=current_user,
        invite_expires_at=payload.invite_expires_at,
    )


@router.get(
    "/workspaces/{workspace_uuid}/applications/{rp_application_uuid}/usage/summary",
    response_model=RPApplicationUsageSummaryRead,
    responses=error_responses(400, 401, 403, 404, 409, 422, 500),
)
async def read_workspace_rp_application_usage_summary(
    request: Request,
    workspace_uuid: uuid_pkg.UUID,
    rp_application_uuid: uuid_pkg.UUID,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[WorkspaceService, Depends(get_workspace_service)],
    current_user: Annotated[dict[str, Any], Depends(get_current_user)],
    ibm_sv_admin_service: Annotated[Any, Depends(get_ibm_sv_admin_service)],
    selected_date: str | None = None,
) -> dict[str, int]:
    return await service.get_workspace_rp_application_usage_summary(
        db=db,
        workspace_uuid=workspace_uuid,
        rp_application_uuid=rp_application_uuid,
        current_user=current_user,
        ibm_sv_admin_service=ibm_sv_admin_service,
        selected_date=selected_date,
    )


@router.get(
    "/workspaces/{workspace_uuid}/applications/{rp_application_uuid}/audit-events",
    response_model=RPApplicationUsageAuditTrailRead,
    responses=error_responses(400, 401, 403, 404, 409, 422, 500),
)
async def read_workspace_rp_application_audit_events(
    request: Request,
    workspace_uuid: uuid_pkg.UUID,
    rp_application_uuid: uuid_pkg.UUID,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[WorkspaceService, Depends(get_workspace_service)],
    current_user: Annotated[dict[str, Any], Depends(get_current_user)],
    ibm_sv_admin_service: Annotated[Any, Depends(get_ibm_sv_admin_service)],
    selected_date: str | None = None,
    size: int = 25,
) -> dict[str, Any]:
    return await service.get_workspace_rp_application_audit_events(
        db=db,
        workspace_uuid=workspace_uuid,
        rp_application_uuid=rp_application_uuid,
        current_user=current_user,
        ibm_sv_admin_service=ibm_sv_admin_service,
        selected_date=selected_date,
        size=size,
    )


@router.get(
    "/workspaces/{workspace_uuid}/applications/{rp_application_uuid}/audit-events/search-after",
    response_model=RPApplicationUsageAuditTrailRead,
    responses=error_responses(400, 401, 403, 404, 409, 422, 500),
)
async def read_workspace_rp_application_audit_events_search_after(
    request: Request,
    workspace_uuid: uuid_pkg.UUID,
    rp_application_uuid: uuid_pkg.UUID,
    search_after: str,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[WorkspaceService, Depends(get_workspace_service)],
    current_user: Annotated[dict[str, Any], Depends(get_current_user)],
    ibm_sv_admin_service: Annotated[Any, Depends(get_ibm_sv_admin_service)],
    selected_date: str | None = None,
    size: int = 25,
) -> dict[str, Any]:
    return await service.get_workspace_rp_application_audit_events_search_after(
        db=db,
        workspace_uuid=workspace_uuid,
        rp_application_uuid=rp_application_uuid,
        current_user=current_user,
        ibm_sv_admin_service=ibm_sv_admin_service,
        selected_date=selected_date,
        size=size,
        search_after=search_after,
    )


@router.patch(
    "/workspaces/{workspace_uuid}",
    response_model=WorkspaceRead,
    responses=error_responses(400, 401, 403, 404, 409, 422, 500),
)
async def patch_workspace(
    request: Request,
    workspace_uuid: uuid_pkg.UUID,
    values: WorkspaceUpdate,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[WorkspaceService, Depends(get_workspace_service)],
    current_user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> dict[str, Any]:
    return await service.update_workspace(
        db=db,
        workspace_uuid=workspace_uuid,
        values=values,
        current_user=current_user,
    )


@router.delete(
    "/workspaces/{workspace_uuid}",
    responses=error_responses(401, 403, 404, 422, 500),
)
async def erase_workspace(
    request: Request,
    workspace_uuid: uuid_pkg.UUID,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[WorkspaceService, Depends(get_workspace_service)],
    current_user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> dict[str, str]:
    return await service.delete_workspace(
        db=db,
        workspace_uuid=workspace_uuid,
        current_user=current_user,
    )
