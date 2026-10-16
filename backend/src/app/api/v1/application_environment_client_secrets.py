import uuid as uuid_pkg
from typing import Annotated, Any

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from ...api.dependencies import (
    get_application_environment_client_secret_service,
    get_current_user,
)
from ...core.access_control import casbin_guard
from ...core.db.database import async_get_db
from ...core.exceptions.openapi import error_responses
from ...repositories.dependencies import get_ibm_sv_admin_client
from ...repositories.ibm_sv_admin import IBMVerifyAdminClient
from ...schemas.application_environment_client_secret import (
    ApplicationEnvironmentClientSecretCreateRequest,
    ApplicationEnvironmentClientSecretCredentialsRead,
    ApplicationEnvironmentClientSecretPermissionsRead,
    ApplicationEnvironmentClientSecretRotateRequest,
    ApplicationEnvironmentRotatedClientSecretRead,
)
from ...services.application_environment_client_secret_service import (
    ApplicationEnvironmentClientSecretService,
)

router = APIRouter(tags=["application-environment-client-secrets"])


@router.get(
    "/applications/{application_uuid}/environments/{environment_uuid}/client/permissions",
    response_model=ApplicationEnvironmentClientSecretPermissionsRead,
    responses=error_responses(403, 404, 500),
)
@casbin_guard.require_application_permission("applications", "read")
async def read_application_environment_client_secret_permissions(
    request: Request,
    application_uuid: uuid_pkg.UUID,
    environment_uuid: uuid_pkg.UUID,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    current_user: Annotated[dict[str, Any], Depends(get_current_user)],
    service: Annotated[
        ApplicationEnvironmentClientSecretService,
        Depends(get_application_environment_client_secret_service),
    ],
) -> ApplicationEnvironmentClientSecretPermissionsRead:
    _ = request
    permissions = await service.get_client_secret_permissions(
        db=db,
        application_uuid=application_uuid,
        environment_uuid=environment_uuid,
        current_user=current_user,
    )
    return ApplicationEnvironmentClientSecretPermissionsRead.model_validate(permissions)


@router.get(
    "/applications/{application_uuid}/environments/{environment_uuid}/client",
    response_model=ApplicationEnvironmentClientSecretCredentialsRead,
    responses=error_responses(400, 403, 404, 500),
)
@casbin_guard.require_application_permission("applications", "read")
async def read_application_environment_client_credentials(
    request: Request,
    application_uuid: uuid_pkg.UUID,
    environment_uuid: uuid_pkg.UUID,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    current_user: Annotated[dict[str, Any], Depends(get_current_user)],
    service: Annotated[
        ApplicationEnvironmentClientSecretService,
        Depends(get_application_environment_client_secret_service),
    ],
    ibm_admin_client: Annotated[
        IBMVerifyAdminClient,
        Depends(get_ibm_sv_admin_client),
    ],
) -> ApplicationEnvironmentClientSecretCredentialsRead:
    _ = request
    credentials = await service.get_client_credentials(
        db=db,
        application_uuid=application_uuid,
        environment_uuid=environment_uuid,
        current_user=current_user,
        ibm_admin_client=ibm_admin_client,
    )
    return ApplicationEnvironmentClientSecretCredentialsRead.model_validate(credentials)


@router.get(
    "/applications/{application_uuid}/environments/{environment_uuid}/client/rotated-secrets",
    response_model=list[ApplicationEnvironmentRotatedClientSecretRead],
    responses=error_responses(400, 403, 404, 500),
)
@casbin_guard.require_application_permission("applications", "read")
async def read_application_environment_rotated_client_secrets(
    request: Request,
    application_uuid: uuid_pkg.UUID,
    environment_uuid: uuid_pkg.UUID,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    current_user: Annotated[dict[str, Any], Depends(get_current_user)],
    service: Annotated[
        ApplicationEnvironmentClientSecretService,
        Depends(get_application_environment_client_secret_service),
    ],
    ibm_admin_client: Annotated[
        IBMVerifyAdminClient,
        Depends(get_ibm_sv_admin_client),
    ],
) -> list[ApplicationEnvironmentRotatedClientSecretRead]:
    _ = request
    secrets = await service.list_rotated_secrets(
        db=db,
        application_uuid=application_uuid,
        environment_uuid=environment_uuid,
        current_user=current_user,
        ibm_admin_client=ibm_admin_client,
    )
    return [ApplicationEnvironmentRotatedClientSecretRead.model_validate(secret) for secret in secrets]


@router.post(
    "/applications/{application_uuid}/environments/{environment_uuid}/client/rotate-secret",
    response_model=ApplicationEnvironmentClientSecretCredentialsRead,
    responses=error_responses(400, 403, 404, 500),
)
@casbin_guard.require_application_permission("applications", "write")
async def rotate_application_environment_client_secret(
    request: Request,
    application_uuid: uuid_pkg.UUID,
    environment_uuid: uuid_pkg.UUID,
    payload: ApplicationEnvironmentClientSecretRotateRequest,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    current_user: Annotated[dict[str, Any], Depends(get_current_user)],
    service: Annotated[
        ApplicationEnvironmentClientSecretService,
        Depends(get_application_environment_client_secret_service),
    ],
    ibm_admin_client: Annotated[
        IBMVerifyAdminClient,
        Depends(get_ibm_sv_admin_client),
    ],
) -> ApplicationEnvironmentClientSecretCredentialsRead:
    _ = request
    credentials = await service.rotate_secret(
        db=db,
        application_uuid=application_uuid,
        environment_uuid=environment_uuid,
        current_user=current_user,
        payload=payload,
        ibm_admin_client=ibm_admin_client,
    )
    return ApplicationEnvironmentClientSecretCredentialsRead.model_validate(credentials)


@router.post(
    "/applications/{application_uuid}/environments/{environment_uuid}/client/rotated-secrets",
    response_model=list[ApplicationEnvironmentRotatedClientSecretRead],
    responses=error_responses(400, 403, 404, 500),
)
@casbin_guard.require_application_permission("applications", "write")
async def create_application_environment_rotated_client_secret(
    request: Request,
    application_uuid: uuid_pkg.UUID,
    environment_uuid: uuid_pkg.UUID,
    payload: ApplicationEnvironmentClientSecretCreateRequest,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    current_user: Annotated[dict[str, Any], Depends(get_current_user)],
    service: Annotated[
        ApplicationEnvironmentClientSecretService,
        Depends(get_application_environment_client_secret_service),
    ],
    ibm_admin_client: Annotated[
        IBMVerifyAdminClient,
        Depends(get_ibm_sv_admin_client),
    ],
) -> list[ApplicationEnvironmentRotatedClientSecretRead]:
    _ = request
    secrets = await service.create_rotated_secret(
        db=db,
        application_uuid=application_uuid,
        environment_uuid=environment_uuid,
        current_user=current_user,
        payload=payload,
        ibm_admin_client=ibm_admin_client,
    )
    return [ApplicationEnvironmentRotatedClientSecretRead.model_validate(secret) for secret in secrets]


@router.delete(
    "/applications/{application_uuid}/environments/{environment_uuid}/client/rotated-secrets/{value}",
    responses=error_responses(400, 403, 404, 500),
)
@casbin_guard.require_application_permission("applications", "write")
async def delete_application_environment_rotated_client_secret(
    request: Request,
    application_uuid: uuid_pkg.UUID,
    environment_uuid: uuid_pkg.UUID,
    value: str,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    current_user: Annotated[dict[str, Any], Depends(get_current_user)],
    service: Annotated[
        ApplicationEnvironmentClientSecretService,
        Depends(get_application_environment_client_secret_service),
    ],
    ibm_admin_client: Annotated[
        IBMVerifyAdminClient,
        Depends(get_ibm_sv_admin_client),
    ],
) -> dict[str, str]:
    _ = request
    await service.delete_rotated_secret(
        db=db,
        application_uuid=application_uuid,
        environment_uuid=environment_uuid,
        current_user=current_user,
        value=value,
        ibm_admin_client=ibm_admin_client,
    )
    return {"message": "Rotated client secret deleted"}
