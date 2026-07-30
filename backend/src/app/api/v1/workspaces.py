import uuid as uuid_pkg
from typing import Annotated, Any

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from ...api.dependencies import get_current_user, get_workspace_service
from ...core.access_control import casbin_guard
from ...core.db.database import async_get_db
from ...core.exceptions.openapi import error_responses
from ...schemas.application_information import (
    ApplicationInformationContactCreate,
    ApplicationInformationContactRead,
    ApplicationInformationContactUpdate,
    ApplicationInformationCreate,
    ApplicationInformationRead,
    ApplicationInformationUpdate,
)
from ...schemas.workspace_member import (
    WorkspaceMemberCreate,
    WorkspaceMemberRead,
    WorkspaceMemberUpdate,
)
from ...schemas.workspace import WorkspaceCreate, WorkspaceRead, WorkspaceUpdate
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
) -> list[dict[str, Any]]:
    return await service.list_workspaces(db=db)


@router.get(
    "/workspaces/mine",
    response_model=list[WorkspaceRead],
    responses=error_responses(401, 403, 500),
)
@casbin_guard.require_permission("workspace", "read")
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
@casbin_guard.require_permission("workspace", "read")
async def read_workspace(
    request: Request,
    workspace_uuid: uuid_pkg.UUID,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[WorkspaceService, Depends(get_workspace_service)],
) -> dict[str, Any]:
    return await service.get_workspace_by_uuid(db=db, workspace_uuid=workspace_uuid)


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
    "/workspaces/{workspace_uuid}/members",
    response_model=list[WorkspaceMemberRead],
    responses=error_responses(401, 403, 404, 422, 500),
)
async def read_workspace_members(
    request: Request,
    workspace_uuid: uuid_pkg.UUID,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[WorkspaceService, Depends(get_workspace_service)],
    current_user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> list[dict[str, Any]]:
    return await service.list_workspace_members(
        db=db,
        workspace_uuid=workspace_uuid,
        current_user=current_user,
    )


@router.post(
    "/workspaces/{workspace_uuid}/members",
    response_model=WorkspaceMemberRead,
    status_code=201,
    responses=error_responses(400, 401, 403, 404, 409, 422, 500),
)
async def write_workspace_member(
    request: Request,
    workspace_uuid: uuid_pkg.UUID,
    payload: WorkspaceMemberCreate,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[WorkspaceService, Depends(get_workspace_service)],
    current_user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> dict[str, Any]:
    return await service.add_workspace_member(
        db=db,
        workspace_uuid=workspace_uuid,
        payload=payload,
        current_user=current_user,
    )


@router.patch(
    "/workspaces/{workspace_uuid}/members/{user_uuid}",
    response_model=WorkspaceMemberRead,
    responses=error_responses(400, 401, 403, 404, 409, 422, 500),
)
async def patch_workspace_member(
    request: Request,
    workspace_uuid: uuid_pkg.UUID,
    user_uuid: uuid_pkg.UUID,
    payload: WorkspaceMemberUpdate,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[WorkspaceService, Depends(get_workspace_service)],
    current_user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> dict[str, Any]:
    return await service.update_workspace_member_role(
        db=db,
        workspace_uuid=workspace_uuid,
        user_uuid=user_uuid,
        payload=payload,
        current_user=current_user,
    )


@router.delete(
    "/workspaces/{workspace_uuid}/members/{user_uuid}",
    responses=error_responses(401, 403, 404, 422, 500),
)
async def erase_workspace_member(
    request: Request,
    workspace_uuid: uuid_pkg.UUID,
    user_uuid: uuid_pkg.UUID,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[WorkspaceService, Depends(get_workspace_service)],
    current_user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> dict[str, str]:
    return await service.remove_workspace_member(
        db=db,
        workspace_uuid=workspace_uuid,
        user_uuid=user_uuid,
        current_user=current_user,
    )


@router.patch(
    "/workspaces/{workspace_uuid}",
    response_model=WorkspaceRead,
    responses=error_responses(400, 401, 403, 404, 409, 422, 500),
)
@casbin_guard.require_permission("workspace", "write")
async def patch_workspace(
    request: Request,
    workspace_uuid: uuid_pkg.UUID,
    values: WorkspaceUpdate,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[WorkspaceService, Depends(get_workspace_service)],
) -> dict[str, Any]:
    return await service.update_workspace(
        db=db,
        workspace_uuid=workspace_uuid,
        values=values,
    )


@router.delete(
    "/workspaces/{workspace_uuid}",
    responses=error_responses(401, 403, 404, 422, 500),
)
@casbin_guard.require_permission("workspace", "write")
async def erase_workspace(
    request: Request,
    workspace_uuid: uuid_pkg.UUID,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[WorkspaceService, Depends(get_workspace_service)],
) -> dict[str, str]:
    return await service.delete_workspace(db=db, workspace_uuid=workspace_uuid)