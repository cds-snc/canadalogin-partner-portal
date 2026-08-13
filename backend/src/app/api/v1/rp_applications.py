import uuid as uuid_pkg
from datetime import date, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from ...api.dependencies import (
    get_current_user,
    get_mau_service,
    get_rp_application_adoption_metadata_provider,
    get_rp_application_service,
)
from ...core.db.database import async_get_db
from ...core.exceptions.http_exceptions import BadRequestException
from ...core.exceptions.openapi import error_responses
from ...repositories.crud_departments import crud_departments
from ...repositories.dependencies import (
    IBMVerifyAdminClientFactory,
    get_ibm_sv_admin_client_factory,
)
from ...schemas.mau import MAUReportItem, MAUReportResponse
from ...schemas.rp_application import (
    AccessibleRPApplicationDepartmentAssignRequest,
    AccessibleRPApplicationOAuthSetupRead,
    AccessibleRPApplicationRead,
    AccessibleRPApplicationSummaryRead,
    RPApplicationClientCredentialsRead,
    RPApplicationClientRotatedSecretCreateRequest,
    RPApplicationClientRotatedSecretDeleteRequest,
    RPApplicationClientRotatedSecretRead,
    RPApplicationClientSecretRotateRequest,
    RPApplicationSummaryRead,
)
from ...schemas.rp_application_adoption import (
    RPApplicationAdoptionCandidateListRead,
    RPApplicationAdoptionCandidatePreviewRead,
    RPApplicationWorkspaceAdoptionRead,
    RPApplicationWorkspaceLinkWrite,
)
from ...services.mau_service import MAUService
from ...services.rp_application_adoption_metadata_provider import (
    RPApplicationAdoptionMetadataProvider,
)
from ...services.rp_application_service import RPApplicationService

router = APIRouter(tags=["rp-applications"])


@router.get(
    "/rp-applications/workspace-adoption-candidates",
    response_model=RPApplicationAdoptionCandidateListRead,
    responses=error_responses(401, 403, 500),
)
async def read_rp_application_adoption_candidates(
    request: Request,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    current_user: Annotated[dict, Depends(get_current_user)],
    service: Annotated[RPApplicationService, Depends(get_rp_application_service)],
) -> RPApplicationAdoptionCandidateListRead:
    del request
    candidates = await service.list_rp_application_adoption_candidates(
        db=db,
        current_user=current_user,
    )
    return RPApplicationAdoptionCandidateListRead.model_validate(candidates)


@router.get(
    "/rp-applications/workspace-adoption-candidates/{rp_application_uuid}",
    response_model=RPApplicationAdoptionCandidatePreviewRead,
    responses=error_responses(401, 403, 404, 500, 503),
)
async def read_rp_application_adoption_candidate_preview(
    request: Request,
    rp_application_uuid: uuid_pkg.UUID,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    current_user: Annotated[dict, Depends(get_current_user)],
    service: Annotated[RPApplicationService, Depends(get_rp_application_service)],
    metadata_provider: Annotated[
        RPApplicationAdoptionMetadataProvider,
        Depends(get_rp_application_adoption_metadata_provider),
    ],
) -> RPApplicationAdoptionCandidatePreviewRead:
    del request
    preview = await service.preview_rp_application_adoption_candidate(
        db=db,
        current_user=current_user,
        rp_application_uuid=rp_application_uuid,
        metadata_provider=metadata_provider,
    )
    return RPApplicationAdoptionCandidatePreviewRead.model_validate(preview)


@router.put(
    "/rp-applications/{rp_application_uuid}/workspace-link",
    response_model=RPApplicationWorkspaceAdoptionRead,
    responses=error_responses(400, 401, 403, 404, 409, 500, 503),
)
async def link_rp_application_to_workspace(
    request: Request,
    rp_application_uuid: uuid_pkg.UUID,
    payload: RPApplicationWorkspaceLinkWrite,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    current_user: Annotated[dict, Depends(get_current_user)],
    service: Annotated[RPApplicationService, Depends(get_rp_application_service)],
    metadata_provider: Annotated[
        RPApplicationAdoptionMetadataProvider,
        Depends(get_rp_application_adoption_metadata_provider),
    ],
) -> RPApplicationWorkspaceAdoptionRead:
    correlation_id = str(getattr(request.state, "request_id", None) or request.headers.get("X-Request-ID") or "unavailable")
    adopted = await service.link_rp_application_to_workspace(
        db=db,
        current_user=current_user,
        rp_application_uuid=rp_application_uuid,
        payload=payload,
        metadata_provider=metadata_provider,
        correlation_id=correlation_id,
    )
    return RPApplicationWorkspaceAdoptionRead.model_validate(adopted)


@router.get(
    "/rp-applications/accessible",
    response_model=list[RPApplicationSummaryRead],
)
async def read_accessible_rp_applications(
    request: Request,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    current_user: Annotated[dict, Depends(get_current_user)],
    service: Annotated[RPApplicationService, Depends(get_rp_application_service)],
) -> list[RPApplicationSummaryRead]:
    applications = await service.list_accessible_rp_applications(
        db=db,
        current_user=current_user,
    )
    return [RPApplicationSummaryRead.model_validate(application) for application in applications]


@router.get(
    "/rp-applications/accessible/{rp_application_uuid}",
    response_model=AccessibleRPApplicationRead,
    responses=error_responses(401, 403, 404, 500),
)
async def read_accessible_rp_application(
    request: Request,
    rp_application_uuid: uuid_pkg.UUID,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    current_user: Annotated[dict, Depends(get_current_user)],
    service: Annotated[RPApplicationService, Depends(get_rp_application_service)],
) -> AccessibleRPApplicationRead:
    application = await service.get_accessible_rp_application_by_uuid(
        db=db,
        current_user=current_user,
        rp_application_uuid=rp_application_uuid,
    )
    return AccessibleRPApplicationRead.model_validate(application)


@router.get(
    "/rp-applications/accessible/{rp_application_uuid}/department",
    response_model=AccessibleRPApplicationSummaryRead,
    responses=error_responses(403, 404, 500),
    deprecated=True,
)
async def read_accessible_rp_application_department(
    request: Request,
    rp_application_uuid: uuid_pkg.UUID,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    current_user: Annotated[dict, Depends(get_current_user)],
    service: Annotated[RPApplicationService, Depends(get_rp_application_service)],
) -> AccessibleRPApplicationSummaryRead:
    preflight = await service.get_accessible_rp_application_department_preflight(
        db=db,
        rp_application_uuid=rp_application_uuid,
        current_user=current_user,
    )
    return AccessibleRPApplicationSummaryRead.model_validate(preflight)


@router.patch(
    "/rp-applications/accessible/{rp_application_uuid}/department",
    response_model=AccessibleRPApplicationSummaryRead,
    responses=error_responses(403, 404, 409, 500),
    deprecated=True,
)
async def assign_accessible_rp_application_department(
    request: Request,
    rp_application_uuid: uuid_pkg.UUID,
    payload: AccessibleRPApplicationDepartmentAssignRequest,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    current_user: Annotated[dict, Depends(get_current_user)],
    service: Annotated[RPApplicationService, Depends(get_rp_application_service)],
) -> AccessibleRPApplicationSummaryRead:
    result = await service.assign_accessible_rp_application_department(
        db=db,
        rp_application_uuid=rp_application_uuid,
        current_user=current_user,
        payload=payload,
    )
    return AccessibleRPApplicationSummaryRead.model_validate(result)


@router.get(
    "/rp-applications/accessible/{rp_application_uuid}/oauth-setup",
    response_model=AccessibleRPApplicationOAuthSetupRead,
    responses=error_responses(403, 404, 409, 500, 503),
    deprecated=True,
)
async def read_accessible_rp_application_oauth_setup(
    request: Request,
    rp_application_uuid: uuid_pkg.UUID,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    current_user: Annotated[dict, Depends(get_current_user)],
    service: Annotated[RPApplicationService, Depends(get_rp_application_service)],
    ibm_admin_client_factory: Annotated[
        IBMVerifyAdminClientFactory,
        Depends(get_ibm_sv_admin_client_factory),
    ],
) -> AccessibleRPApplicationOAuthSetupRead:
    oauth_setup = await service.get_accessible_rp_application_oauth_setup(
        db=db,
        rp_application_uuid=rp_application_uuid,
        current_user=current_user,
        ibm_admin_client_factory=ibm_admin_client_factory,
    )
    return AccessibleRPApplicationOAuthSetupRead.model_validate(oauth_setup)


@router.get(
    "/rp-applications/accessible/{rp_application_uuid}/client",
    response_model=RPApplicationClientCredentialsRead,
    responses=error_responses(403, 404, 500, 503),
)
async def read_accessible_rp_application_client_credentials(
    request: Request,
    rp_application_uuid: uuid_pkg.UUID,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    current_user: Annotated[dict, Depends(get_current_user)],
    service: Annotated[RPApplicationService, Depends(get_rp_application_service)],
    ibm_admin_client_factory: Annotated[
        IBMVerifyAdminClientFactory,
        Depends(get_ibm_sv_admin_client_factory),
    ],
    workspace_uuid: Annotated[uuid_pkg.UUID | None, Query(alias="workspaceUuid")] = None,
    application_information_uuid: Annotated[
        uuid_pkg.UUID | None,
        Query(alias="applicationInformationUuid"),
    ] = None,
) -> RPApplicationClientCredentialsRead:
    credentials = await service.get_accessible_rp_application_client_credentials(
        db=db,
        rp_application_uuid=rp_application_uuid,
        current_user=current_user,
        ibm_admin_client_factory=ibm_admin_client_factory,
        expected_workspace_uuid=workspace_uuid,
        expected_application_information_uuid=application_information_uuid,
    )
    return RPApplicationClientCredentialsRead.model_validate(credentials)


@router.get(
    "/rp-applications/accessible/{rp_application_uuid}/client/rotated-secrets",
    response_model=list[RPApplicationClientRotatedSecretRead],
    responses=error_responses(403, 404, 500, 503),
)
async def read_accessible_rp_application_rotated_secrets(
    request: Request,
    rp_application_uuid: uuid_pkg.UUID,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    current_user: Annotated[dict, Depends(get_current_user)],
    service: Annotated[RPApplicationService, Depends(get_rp_application_service)],
    ibm_admin_client_factory: Annotated[
        IBMVerifyAdminClientFactory,
        Depends(get_ibm_sv_admin_client_factory),
    ],
    workspace_uuid: Annotated[uuid_pkg.UUID | None, Query(alias="workspaceUuid")] = None,
    application_information_uuid: Annotated[
        uuid_pkg.UUID | None,
        Query(alias="applicationInformationUuid"),
    ] = None,
) -> list[RPApplicationClientRotatedSecretRead]:
    rotated_secrets = await service.list_accessible_rp_application_rotated_secrets(
        db=db,
        rp_application_uuid=rp_application_uuid,
        current_user=current_user,
        ibm_admin_client_factory=ibm_admin_client_factory,
        expected_workspace_uuid=workspace_uuid,
        expected_application_information_uuid=application_information_uuid,
    )
    return [RPApplicationClientRotatedSecretRead.model_validate(secret) for secret in rotated_secrets]


@router.post(
    "/rp-applications/accessible/{rp_application_uuid}/client/rotate-secret",
    response_model=RPApplicationClientCredentialsRead,
    responses=error_responses(400, 403, 404, 500, 503),
)
async def rotate_accessible_rp_application_client_secret(
    request: Request,
    rp_application_uuid: uuid_pkg.UUID,
    payload: RPApplicationClientSecretRotateRequest,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    current_user: Annotated[dict, Depends(get_current_user)],
    service: Annotated[RPApplicationService, Depends(get_rp_application_service)],
    ibm_admin_client_factory: Annotated[
        IBMVerifyAdminClientFactory,
        Depends(get_ibm_sv_admin_client_factory),
    ],
    workspace_uuid: Annotated[uuid_pkg.UUID | None, Query(alias="workspaceUuid")] = None,
    application_information_uuid: Annotated[
        uuid_pkg.UUID | None,
        Query(alias="applicationInformationUuid"),
    ] = None,
) -> RPApplicationClientCredentialsRead:
    credentials = await service.rotate_accessible_rp_application_client_secret(
        db=db,
        rp_application_uuid=rp_application_uuid,
        current_user=current_user,
        payload=payload,
        ibm_admin_client_factory=ibm_admin_client_factory,
        expected_workspace_uuid=workspace_uuid,
        expected_application_information_uuid=application_information_uuid,
    )
    return RPApplicationClientCredentialsRead.model_validate(credentials)


@router.post(
    "/rp-applications/accessible/{rp_application_uuid}/client/rotated-secrets",
    response_model=list[RPApplicationClientRotatedSecretRead],
    responses=error_responses(400, 403, 404, 500, 503),
)
async def create_accessible_rp_application_rotated_secret(
    request: Request,
    rp_application_uuid: uuid_pkg.UUID,
    payload: RPApplicationClientRotatedSecretCreateRequest,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    current_user: Annotated[dict, Depends(get_current_user)],
    service: Annotated[RPApplicationService, Depends(get_rp_application_service)],
    ibm_admin_client_factory: Annotated[
        IBMVerifyAdminClientFactory,
        Depends(get_ibm_sv_admin_client_factory),
    ],
    workspace_uuid: Annotated[uuid_pkg.UUID | None, Query(alias="workspaceUuid")] = None,
    application_information_uuid: Annotated[
        uuid_pkg.UUID | None,
        Query(alias="applicationInformationUuid"),
    ] = None,
) -> list[RPApplicationClientRotatedSecretRead]:
    rotated_secrets = await service.create_accessible_rp_application_rotated_secret(
        db=db,
        rp_application_uuid=rp_application_uuid,
        current_user=current_user,
        payload=payload,
        ibm_admin_client_factory=ibm_admin_client_factory,
        expected_workspace_uuid=workspace_uuid,
        expected_application_information_uuid=application_information_uuid,
    )
    return [RPApplicationClientRotatedSecretRead.model_validate(secret) for secret in rotated_secrets]


@router.delete(
    "/rp-applications/accessible/{rp_application_uuid}/client/rotated-secrets",
    responses=error_responses(403, 404, 500, 503),
)
async def delete_accessible_rp_application_rotated_secret(
    request: Request,
    rp_application_uuid: uuid_pkg.UUID,
    payload: RPApplicationClientRotatedSecretDeleteRequest,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    current_user: Annotated[dict, Depends(get_current_user)],
    service: Annotated[RPApplicationService, Depends(get_rp_application_service)],
    ibm_admin_client_factory: Annotated[
        IBMVerifyAdminClientFactory,
        Depends(get_ibm_sv_admin_client_factory),
    ],
    workspace_uuid: Annotated[uuid_pkg.UUID | None, Query(alias="workspaceUuid")] = None,
    application_information_uuid: Annotated[
        uuid_pkg.UUID | None,
        Query(alias="applicationInformationUuid"),
    ] = None,
) -> dict[str, str]:
    await service.delete_accessible_rp_application_rotated_secret(
        db=db,
        rp_application_uuid=rp_application_uuid,
        current_user=current_user,
        secret_id=payload.secret_id,
        ibm_admin_client_factory=ibm_admin_client_factory,
        expected_workspace_uuid=workspace_uuid,
        expected_application_information_uuid=application_information_uuid,
    )
    return {"message": "Rotated client secret deleted"}


@router.get(
    "/rp-applications/accessible/{rp_application_uuid}/mau-report",
    response_model=MAUReportResponse,
    responses=error_responses(400, 403, 404, 409, 500),
)
async def read_accessible_rp_application_mau_report(
    request: Request,
    rp_application_uuid: uuid_pkg.UUID,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    current_user: Annotated[dict, Depends(get_current_user)],
    service: Annotated[RPApplicationService, Depends(get_rp_application_service)],
    mau_service: Annotated[MAUService, Depends(get_mau_service)],
    start_date: date | None = Query(
        None,
        description="Start date (YYYY-MM-DD), defaults to 30 days ago",
    ),
    end_date: date | None = Query(
        None,
        description="End date (YYYY-MM-DD), defaults to today",
    ),
    workspace_uuid: Annotated[uuid_pkg.UUID | None, Query(alias="workspaceUuid")] = None,
    application_information_uuid: Annotated[
        uuid_pkg.UUID | None,
        Query(alias="applicationInformationUuid"),
    ] = None,
) -> MAUReportResponse:
    application = await service.get_accessible_rp_application_department_preflight(
        db=db,
        rp_application_uuid=rp_application_uuid,
        current_user=current_user,
        **({"expected_workspace_uuid": workspace_uuid} if workspace_uuid is not None else {}),
        **({"expected_application_information_uuid": application_information_uuid} if application_information_uuid is not None else {}),
    )

    await service._require_rp_application_department(application)

    application_name = application.get("dnr_app_name") or application.get("dnrAppName")
    if not isinstance(application_name, str) or application_name.strip() == "":
        # Keep a clear user-facing failure when data is incomplete.
        raise BadRequestException("RP application does not have a mapped MAU application name")

    department_name: str | None = None
    department_id = application.get("department_id") or application.get("departmentId")
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
        partner_environment=application.get("partner_environment") or application.get("partnerEnvironment"),
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
