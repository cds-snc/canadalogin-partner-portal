import uuid as uuid_pkg
from typing import Annotated, Any

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from ...api.dependencies import get_current_user, get_workspace_service
from ...core.access_control import casbin_guard
from ...core.db.database import async_get_db
from ...crud.crud_workspaces import crud_workspaces
from ...schemas.workspace import (
	ApplicationContactCreate,
	ApplicationContactRead,
	ApplicationContactUpdate,
	ApplicationInfoCreate,
	ApplicationInfoRead,
	ApplicationInfoUpdate,
	RPApplicationAuditTrailRead,
	RPApplicationClientCredentialsRead,
	RPApplicationCreate,
	RPApplicationCurrentUserRead,
	RPApplicationRotatedClientSecretCreate,
	RPApplicationRotatedClientSecretRead,
	RPApplicationDeveloperInvitationAccept,
	RPApplicationDeveloperInvitationCreate,
	RPApplicationDeveloperInvitationRead,
	RPApplicationUpdate,
	WorkspaceCreate,
	WorkspaceMemberCreate,
	WorkspaceRead,
	WorkspaceUpdate,
)
from ...services.workspace_service import WorkspaceService

router = APIRouter(tags=["workspaces"])


@router.post("/workspaces")
@casbin_guard.require_permission("workspace", "write")
async def create_workspace(
	request: Request,
	values: WorkspaceCreate,
	current_user: Annotated[dict, Depends(get_current_user)],
	db: Annotated[AsyncSession, Depends(async_get_db)],
	service: Annotated[WorkspaceService, Depends(get_workspace_service)],
) -> dict[str, Any]:
	return await service.create_workspace(db=db, current_user=current_user, values=values)


@router.get("/workspaces", response_model=list[WorkspaceRead])
async def list_workspaces(
	request: Request,
	db: Annotated[AsyncSession, Depends(async_get_db)],
	current_user: Annotated[dict, Depends(get_current_user)],
	service: Annotated[WorkspaceService, Depends(get_workspace_service)],
	mine: bool = False,
) -> list[WorkspaceRead]:
	result = await crud_workspaces.get_multi(
		db=db,
		department_id=current_user.get("department_id"),
		is_deleted=False,
	)
	workspaces = result.get("data", []) if isinstance(result, dict) else result
	return [WorkspaceRead.model_validate(workspace) for workspace in workspaces]


@router.get("/workspaces/mine", response_model=list[WorkspaceRead])
async def list_current_user_workspaces(
	request: Request,
	db: Annotated[AsyncSession, Depends(async_get_db)],
	current_user: Annotated[dict, Depends(get_current_user)],
	service: Annotated[WorkspaceService, Depends(get_workspace_service)],
) -> list[WorkspaceRead]:
	workspaces = await service.list_current_user_workspaces(db=db, current_user=current_user)
	return [WorkspaceRead.model_validate(workspace) for workspace in workspaces]


@router.get("/rp-applications/mine", response_model=list[RPApplicationCurrentUserRead])
async def list_current_user_rp_applications(
	request: Request,
	db: Annotated[AsyncSession, Depends(async_get_db)],
	current_user: Annotated[dict, Depends(get_current_user)],
	service: Annotated[WorkspaceService, Depends(get_workspace_service)],
) -> list[RPApplicationCurrentUserRead]:
	applications = await service.list_current_user_rp_applications(db=db, current_user=current_user)
	return [RPApplicationCurrentUserRead.model_validate(application) for application in applications]


@router.get("/rp-applications/mine/{rp_application_uuid}", response_model=RPApplicationCurrentUserRead)
async def get_current_user_rp_application(
	request: Request,
	rp_application_uuid: uuid_pkg.UUID,
	db: Annotated[AsyncSession, Depends(async_get_db)],
	current_user: Annotated[dict, Depends(get_current_user)],
	service: Annotated[WorkspaceService, Depends(get_workspace_service)],
) -> RPApplicationCurrentUserRead:
	application = await service.get_current_user_rp_application(
		db=db,
		rp_application_uuid=rp_application_uuid,
		current_user=current_user,
	)
	return RPApplicationCurrentUserRead.model_validate(application)


@router.patch("/rp-applications/mine/{rp_application_uuid}", response_model=RPApplicationCurrentUserRead)
async def update_current_user_rp_application(
	request: Request,
	rp_application_uuid: uuid_pkg.UUID,
	values: RPApplicationUpdate,
	current_user: Annotated[dict, Depends(get_current_user)],
	db: Annotated[AsyncSession, Depends(async_get_db)],
	service: Annotated[WorkspaceService, Depends(get_workspace_service)],
) -> RPApplicationCurrentUserRead:
	application = await service.update_current_user_rp_application(
		db=db,
		rp_application_uuid=rp_application_uuid,
		values=values,
		current_user=current_user,
	)
	return RPApplicationCurrentUserRead.model_validate(application)


@router.patch("/workspaces/{workspace_uuid}")
@casbin_guard.require_permission("workspace", "write")
async def update_workspace(
	request: Request,
	workspace_uuid: uuid_pkg.UUID,
	values: WorkspaceUpdate,
	current_user: Annotated[dict, Depends(get_current_user)],
	db: Annotated[AsyncSession, Depends(async_get_db)],
	service: Annotated[WorkspaceService, Depends(get_workspace_service)],
) -> dict[str, Any]:
	return await service.update_workspace(
		db=db,
		workspace_uuid=workspace_uuid,
		values=values,
		current_user=current_user,
	)


@router.delete("/workspaces/{workspace_uuid}")
@casbin_guard.require_permission("workspace", "write")
async def delete_workspace(
	request: Request,
	workspace_uuid: uuid_pkg.UUID,
	current_user: Annotated[dict, Depends(get_current_user)],
	db: Annotated[AsyncSession, Depends(async_get_db)],
	service: Annotated[WorkspaceService, Depends(get_workspace_service)],
) -> dict[str, str]:
	return await service.delete_workspace(
		db=db,
		workspace_uuid=workspace_uuid,
		current_user=current_user,
	)


@router.get(
	"/workspaces/{workspace_uuid}/application-info/{application_info_uuid}/contacts",
	response_model=list[ApplicationContactRead],
)
@casbin_guard.require_permission("workspace", "read")
async def list_application_contacts(
	request: Request,
	workspace_uuid: uuid_pkg.UUID,
	application_info_uuid: uuid_pkg.UUID,
	current_user: Annotated[dict, Depends(get_current_user)],
	db: Annotated[AsyncSession, Depends(async_get_db)],
	service: Annotated[WorkspaceService, Depends(get_workspace_service)],
) -> list[ApplicationContactRead]:
	application_contacts = await service.list_application_contacts(
		db=db,
		workspace_uuid=workspace_uuid,
		application_info_uuid=application_info_uuid,
		current_user=current_user,
	)
	return [ApplicationContactRead.model_validate(application_contact) for application_contact in application_contacts]


@router.post(
	"/workspaces/{workspace_uuid}/application-info/{application_info_uuid}/contacts",
	response_model=ApplicationContactRead,
)
@casbin_guard.require_permission("workspace", "write")
async def create_application_contact(
	request: Request,
	workspace_uuid: uuid_pkg.UUID,
	application_info_uuid: uuid_pkg.UUID,
	values: ApplicationContactCreate,
	current_user: Annotated[dict, Depends(get_current_user)],
	db: Annotated[AsyncSession, Depends(async_get_db)],
	service: Annotated[WorkspaceService, Depends(get_workspace_service)],
) -> ApplicationContactRead:
	application_contact = await service.create_application_contact(
		db=db,
		workspace_uuid=workspace_uuid,
		application_info_uuid=application_info_uuid,
		values=values,
		current_user=current_user,
	)
	return ApplicationContactRead.model_validate(application_contact)


@router.patch(
	"/workspaces/{workspace_uuid}/application-info/{application_info_uuid}/contacts/{application_contact_uuid}",
	response_model=ApplicationContactRead,
)
@casbin_guard.require_permission("workspace", "write")
async def update_application_contact(
	request: Request,
	workspace_uuid: uuid_pkg.UUID,
	application_info_uuid: uuid_pkg.UUID,
	application_contact_uuid: uuid_pkg.UUID,
	values: ApplicationContactUpdate,
	current_user: Annotated[dict, Depends(get_current_user)],
	db: Annotated[AsyncSession, Depends(async_get_db)],
	service: Annotated[WorkspaceService, Depends(get_workspace_service)],
) -> ApplicationContactRead:
	application_contact = await service.update_application_contact(
		db=db,
		workspace_uuid=workspace_uuid,
		application_info_uuid=application_info_uuid,
		application_contact_uuid=application_contact_uuid,
		values=values,
		current_user=current_user,
	)
	return ApplicationContactRead.model_validate(application_contact)


@router.delete("/workspaces/{workspace_uuid}/application-info/{application_info_uuid}/contacts/{application_contact_uuid}")
@casbin_guard.require_permission("workspace", "write")
async def delete_application_contact(
	request: Request,
	workspace_uuid: uuid_pkg.UUID,
	application_info_uuid: uuid_pkg.UUID,
	application_contact_uuid: uuid_pkg.UUID,
	current_user: Annotated[dict, Depends(get_current_user)],
	db: Annotated[AsyncSession, Depends(async_get_db)],
	service: Annotated[WorkspaceService, Depends(get_workspace_service)],
) -> dict[str, str]:
	return await service.delete_application_contact(
		db=db,
		workspace_uuid=workspace_uuid,
		application_info_uuid=application_info_uuid,
		application_contact_uuid=application_contact_uuid,
		current_user=current_user,
	)


@router.post("/workspaces/{workspace_uuid}/members")
@casbin_guard.require_permission("workspace", "write")
async def add_member(
	request: Request,
	workspace_uuid: uuid_pkg.UUID,
	values: WorkspaceMemberCreate,
	current_user: Annotated[dict, Depends(get_current_user)],
	db: Annotated[AsyncSession, Depends(async_get_db)],
	service: Annotated[WorkspaceService, Depends(get_workspace_service)],
) -> dict[str, Any]:
	return await service.add_member(
		db=db,
		workspace_uuid=workspace_uuid,
		target_user_uuid=values.user_uuid,
		role=values.role,
		current_user=current_user,
	)


@router.get("/workspaces/{workspace_uuid}/members")
@casbin_guard.require_permission("workspace", "read")
async def list_members(
	request: Request,
	workspace_uuid: uuid_pkg.UUID,
	current_user: Annotated[dict, Depends(get_current_user)],
	db: Annotated[AsyncSession, Depends(async_get_db)],
	service: Annotated[WorkspaceService, Depends(get_workspace_service)],
) -> list[dict[str, Any]]:
	return await service.list_members(
		db=db,
		workspace_uuid=workspace_uuid,
		current_user=current_user,
	)


@router.delete("/workspaces/{workspace_uuid}/members/{user_uuid}")
@casbin_guard.require_permission("workspace", "write")
async def delete_member(
	request: Request,
	workspace_uuid: uuid_pkg.UUID,
	user_uuid: uuid_pkg.UUID,
	current_user: Annotated[dict, Depends(get_current_user)],
	db: Annotated[AsyncSession, Depends(async_get_db)],
	service: Annotated[WorkspaceService, Depends(get_workspace_service)],
) -> dict[str, str]:
	await service.remove_member(
		db=db,
		workspace_uuid=workspace_uuid,
		target_user_uuid=user_uuid,
		current_user=current_user,
	)
	return {"message": "member removed"}


@router.post(
	"/workspaces/{workspace_uuid}/applications/{rp_application_uuid}/developers/invite",
	response_model=RPApplicationDeveloperInvitationRead,
)
@casbin_guard.require_permission("workspace", "write")
async def invite_rp_application_developer(
	request: Request,
	workspace_uuid: uuid_pkg.UUID,
	rp_application_uuid: uuid_pkg.UUID,
	values: RPApplicationDeveloperInvitationCreate,
	current_user: Annotated[dict, Depends(get_current_user)],
	db: Annotated[AsyncSession, Depends(async_get_db)],
	service: Annotated[WorkspaceService, Depends(get_workspace_service)],
) -> RPApplicationDeveloperInvitationRead:
	invitation = await service.invite_rp_application_developer(
		db=db,
		workspace_uuid=workspace_uuid,
		rp_application_uuid=rp_application_uuid,
		values=values,
		current_user=current_user,
	)
	return RPApplicationDeveloperInvitationRead.model_validate(invitation)


@router.post(
	"/rp-application-developer-invitations/accept",
	response_model=RPApplicationDeveloperInvitationRead,
)
async def accept_rp_application_developer_invitation(
	request: Request,
	values: RPApplicationDeveloperInvitationAccept,
	current_user: Annotated[dict, Depends(get_current_user)],
	db: Annotated[AsyncSession, Depends(async_get_db)],
	service: Annotated[WorkspaceService, Depends(get_workspace_service)],
) -> RPApplicationDeveloperInvitationRead:
	invitation = await service.accept_rp_application_developer_invitation(
		db=db,
		token=values.token,
		current_user=current_user,
	)
	return RPApplicationDeveloperInvitationRead.model_validate(invitation)


@router.get(
	"/workspaces/{workspace_uuid}/applications/{rp_application_uuid}/developer-invitations",
	response_model=list[RPApplicationDeveloperInvitationRead],
)
@casbin_guard.require_permission("workspace", "read")
async def list_rp_application_developer_invitations(
	request: Request,
	workspace_uuid: uuid_pkg.UUID,
	rp_application_uuid: uuid_pkg.UUID,
	current_user: Annotated[dict, Depends(get_current_user)],
	db: Annotated[AsyncSession, Depends(async_get_db)],
	service: Annotated[WorkspaceService, Depends(get_workspace_service)],
) -> list[RPApplicationDeveloperInvitationRead]:
	invitations = await service.list_rp_application_developer_invitations(
		db=db,
		workspace_uuid=workspace_uuid,
		rp_application_uuid=rp_application_uuid,
		current_user=current_user,
	)
	return [RPApplicationDeveloperInvitationRead.model_validate(invitation) for invitation in invitations]


@router.delete(
	"/workspaces/{workspace_uuid}/applications/{rp_application_uuid}/developer-invitations/{invitation_uuid}",
	response_model=RPApplicationDeveloperInvitationRead,
)
@casbin_guard.require_permission("workspace", "write")
async def revoke_rp_application_developer_invitation(
	request: Request,
	workspace_uuid: uuid_pkg.UUID,
	rp_application_uuid: uuid_pkg.UUID,
	invitation_uuid: uuid_pkg.UUID,
	current_user: Annotated[dict, Depends(get_current_user)],
	db: Annotated[AsyncSession, Depends(async_get_db)],
	service: Annotated[WorkspaceService, Depends(get_workspace_service)],
) -> RPApplicationDeveloperInvitationRead:
	invitation = await service.revoke_rp_application_developer_invitation(
		db=db,
		workspace_uuid=workspace_uuid,
		rp_application_uuid=rp_application_uuid,
		invitation_uuid=invitation_uuid,
		current_user=current_user,
	)
	return RPApplicationDeveloperInvitationRead.model_validate(invitation)


@router.post(
	"/workspaces/{workspace_uuid}/applications/{rp_application_uuid}/developer-invitations/{invitation_uuid}/resend",
	response_model=RPApplicationDeveloperInvitationRead,
)
@casbin_guard.require_permission("workspace", "write")
async def resend_rp_application_developer_invitation(
	request: Request,
	workspace_uuid: uuid_pkg.UUID,
	rp_application_uuid: uuid_pkg.UUID,
	invitation_uuid: uuid_pkg.UUID,
	current_user: Annotated[dict, Depends(get_current_user)],
	db: Annotated[AsyncSession, Depends(async_get_db)],
	service: Annotated[WorkspaceService, Depends(get_workspace_service)],
) -> RPApplicationDeveloperInvitationRead:
	invitation = await service.resend_rp_application_developer_invitation(
		db=db,
		workspace_uuid=workspace_uuid,
		rp_application_uuid=rp_application_uuid,
		invitation_uuid=invitation_uuid,
		current_user=current_user,
	)
	return RPApplicationDeveloperInvitationRead.model_validate(invitation)


@router.post("/workspaces/{workspace_uuid}/applications")
@casbin_guard.require_permission("workspace", "write")
async def create_rp_application(
	request: Request,
	workspace_uuid: uuid_pkg.UUID,
	values: RPApplicationCreate,
	current_user: Annotated[dict, Depends(get_current_user)],
	db: Annotated[AsyncSession, Depends(async_get_db)],
	service: Annotated[WorkspaceService, Depends(get_workspace_service)],
) -> dict[str, Any]:
	return await service.create_rp_application(
		db=db,
		workspace_uuid=workspace_uuid,
		values=values,
		current_user=current_user,
	)


@router.patch("/workspaces/{workspace_uuid}/applications/{rp_application_uuid}")
@casbin_guard.require_permission("workspace", "write")
async def update_rp_application(
	request: Request,
	workspace_uuid: uuid_pkg.UUID,
	rp_application_uuid: uuid_pkg.UUID,
	values: RPApplicationUpdate,
	current_user: Annotated[dict, Depends(get_current_user)],
	db: Annotated[AsyncSession, Depends(async_get_db)],
	service: Annotated[WorkspaceService, Depends(get_workspace_service)],
) -> dict[str, Any]:
	return await service.update_rp_application(
		db=db,
		workspace_uuid=workspace_uuid,
		rp_application_uuid=rp_application_uuid,
		values=values,
		current_user=current_user,
	)


@router.get(
	"/workspaces/{workspace_uuid}/applications/{rp_application_uuid}/client",
	response_model=RPApplicationClientCredentialsRead,
)
@casbin_guard.require_permission("workspace", "read")
async def get_rp_application_client_credentials(
	request: Request,
	workspace_uuid: uuid_pkg.UUID,
	rp_application_uuid: uuid_pkg.UUID,
	current_user: Annotated[dict, Depends(get_current_user)],
	db: Annotated[AsyncSession, Depends(async_get_db)],
	service: Annotated[WorkspaceService, Depends(get_workspace_service)],
) -> RPApplicationClientCredentialsRead:
	credentials = await service.get_rp_application_client_credentials(
		db=db,
		workspace_uuid=workspace_uuid,
		rp_application_uuid=rp_application_uuid,
		current_user=current_user,
	)
	return RPApplicationClientCredentialsRead.model_validate(credentials)


@router.get(
	"/workspaces/{workspace_uuid}/applications/{rp_application_uuid}/client/rotated-secrets",
	response_model=list[RPApplicationRotatedClientSecretRead],
)
@casbin_guard.require_permission("workspace", "read")
async def list_rp_application_rotated_client_secrets(
	request: Request,
	workspace_uuid: uuid_pkg.UUID,
	rp_application_uuid: uuid_pkg.UUID,
	current_user: Annotated[dict, Depends(get_current_user)],
	db: Annotated[AsyncSession, Depends(async_get_db)],
	service: Annotated[WorkspaceService, Depends(get_workspace_service)],
) -> list[RPApplicationRotatedClientSecretRead]:
	rotated_secrets = await service.list_rp_application_rotated_client_secrets(
		db=db,
		workspace_uuid=workspace_uuid,
		rp_application_uuid=rp_application_uuid,
		current_user=current_user,
	)
	return [RPApplicationRotatedClientSecretRead.model_validate(secret) for secret in rotated_secrets]


@router.post(
	"/workspaces/{workspace_uuid}/applications/{rp_application_uuid}/client/rotated-secrets",
	response_model=list[RPApplicationRotatedClientSecretRead],
)
@casbin_guard.require_permission("workspace", "write")
async def create_rp_application_rotated_client_secret(
	request: Request,
	workspace_uuid: uuid_pkg.UUID,
	rp_application_uuid: uuid_pkg.UUID,
	values: RPApplicationRotatedClientSecretCreate,
	current_user: Annotated[dict, Depends(get_current_user)],
	db: Annotated[AsyncSession, Depends(async_get_db)],
	service: Annotated[WorkspaceService, Depends(get_workspace_service)],
) -> list[RPApplicationRotatedClientSecretRead]:
	rotated_secrets = await service.create_rp_application_rotated_client_secret(
		db=db,
		workspace_uuid=workspace_uuid,
		rp_application_uuid=rp_application_uuid,
		current_user=current_user,
		values=values,
	)
	return [RPApplicationRotatedClientSecretRead.model_validate(secret) for secret in rotated_secrets]


@router.delete(
	"/workspaces/{workspace_uuid}/applications/{rp_application_uuid}/client/rotated-secrets/{rotated_secret_id}",
)
@casbin_guard.require_permission("workspace", "write")
async def delete_rp_application_rotated_client_secret(
	request: Request,
	workspace_uuid: uuid_pkg.UUID,
	rp_application_uuid: uuid_pkg.UUID,
	rotated_secret_id: str,
	current_user: Annotated[dict, Depends(get_current_user)],
	db: Annotated[AsyncSession, Depends(async_get_db)],
	service: Annotated[WorkspaceService, Depends(get_workspace_service)],
) -> dict[str, str]:
	return await service.delete_rp_application_rotated_client_secret(
		db=db,
		workspace_uuid=workspace_uuid,
		rp_application_uuid=rp_application_uuid,
		rotated_secret_id=rotated_secret_id,
		current_user=current_user,
	)


@router.post(
	"/workspaces/{workspace_uuid}/applications/{rp_application_uuid}/client/rotate-secret",
	response_model=RPApplicationClientCredentialsRead,
)
@casbin_guard.require_permission("workspace", "write")
async def rotate_rp_application_client_secret(
	request: Request,
	workspace_uuid: uuid_pkg.UUID,
	rp_application_uuid: uuid_pkg.UUID,
	values: RPApplicationRotatedClientSecretCreate,
	current_user: Annotated[dict, Depends(get_current_user)],
	db: Annotated[AsyncSession, Depends(async_get_db)],
	service: Annotated[WorkspaceService, Depends(get_workspace_service)],
) -> RPApplicationClientCredentialsRead:
	credentials = await service.rotate_rp_application_client_secret(
		db=db,
		workspace_uuid=workspace_uuid,
		rp_application_uuid=rp_application_uuid,
		current_user=current_user,
		values=values,
	)
	return RPApplicationClientCredentialsRead.model_validate(credentials)


@router.delete("/workspaces/{workspace_uuid}/applications/{rp_application_uuid}")
@casbin_guard.require_permission("workspace", "write")
async def delete_rp_application(
	request: Request,
	workspace_uuid: uuid_pkg.UUID,
	rp_application_uuid: uuid_pkg.UUID,
	current_user: Annotated[dict, Depends(get_current_user)],
	db: Annotated[AsyncSession, Depends(async_get_db)],
	service: Annotated[WorkspaceService, Depends(get_workspace_service)],
) -> dict[str, str]:
	return await service.delete_rp_application(
		db=db,
		workspace_uuid=workspace_uuid,
		rp_application_uuid=rp_application_uuid,
		current_user=current_user,
	)


@router.get("/workspaces/{workspace_uuid}/applications/{rp_application_uuid}/usage/summary")
@casbin_guard.require_permission("workspace", "read")
async def get_rp_application_usage_summary(
	request: Request,
	workspace_uuid: uuid_pkg.UUID,
	rp_application_uuid: uuid_pkg.UUID,
	selected_date: str,
	current_user: Annotated[dict, Depends(get_current_user)],
	db: Annotated[AsyncSession, Depends(async_get_db)],
	service: Annotated[WorkspaceService, Depends(get_workspace_service)],
) -> dict[str, int]:
	return await service.get_rp_application_usage_summary(
		db=db,
		workspace_uuid=workspace_uuid,
		rp_application_uuid=rp_application_uuid,
		selected_date=selected_date,
		current_user=current_user,
	)


@router.get(
	"/workspaces/{workspace_uuid}/applications/{rp_application_uuid}/usage/audit-trail",
	response_model=RPApplicationAuditTrailRead,
)
@casbin_guard.require_permission("workspace", "read")
async def get_rp_application_audit_trail(
	request: Request,
	workspace_uuid: uuid_pkg.UUID,
	rp_application_uuid: uuid_pkg.UUID,
	selected_date: str,
	current_user: Annotated[dict, Depends(get_current_user)],
	db: Annotated[AsyncSession, Depends(async_get_db)],
	service: Annotated[WorkspaceService, Depends(get_workspace_service)],
	size: int = 25,
) -> RPApplicationAuditTrailRead:
	audit_trail = await service.get_rp_application_audit_trail(
		db=db,
		workspace_uuid=workspace_uuid,
		rp_application_uuid=rp_application_uuid,
		selected_date=selected_date,
		current_user=current_user,
		size=size,
	)
	return RPApplicationAuditTrailRead.model_validate(audit_trail)


@router.get(
	"/workspaces/{workspace_uuid}/applications/{rp_application_uuid}/usage/audit-trail/search-after",
	response_model=RPApplicationAuditTrailRead,
)
@casbin_guard.require_permission("workspace", "read")
async def get_rp_application_audit_trail_search_after(
	request: Request,
	workspace_uuid: uuid_pkg.UUID,
	rp_application_uuid: uuid_pkg.UUID,
	selected_date: str,
	search_after: str,
	current_user: Annotated[dict, Depends(get_current_user)],
	db: Annotated[AsyncSession, Depends(async_get_db)],
	service: Annotated[WorkspaceService, Depends(get_workspace_service)],
	size: int = 25,
) -> RPApplicationAuditTrailRead:
	audit_trail = await service.get_rp_application_audit_trail_search_after(
		db=db,
		workspace_uuid=workspace_uuid,
		rp_application_uuid=rp_application_uuid,
		selected_date=selected_date,
		current_user=current_user,
		size=size,
		search_after=search_after,
	)
	return RPApplicationAuditTrailRead.model_validate(audit_trail)


@router.get(
	"/workspaces/{workspace_uuid}/application-info",
	response_model=list[ApplicationInfoRead],
)
@casbin_guard.require_permission("workspace", "read")
async def list_application_infos(
	request: Request,
	workspace_uuid: uuid_pkg.UUID,
	db: Annotated[AsyncSession, Depends(async_get_db)],
	current_user: Annotated[dict, Depends(get_current_user)],
	service: Annotated[WorkspaceService, Depends(get_workspace_service)],
) -> list[ApplicationInfoRead]:
	application_infos = await service.list_application_infos(
		db=db,
		workspace_uuid=workspace_uuid,
		current_user=current_user,
	)
	return [ApplicationInfoRead.model_validate(application_info) for application_info in application_infos]


@router.post(
	"/workspaces/{workspace_uuid}/application-info",
	response_model=ApplicationInfoRead,
)
@casbin_guard.require_permission("workspace", "write")
async def create_application_info(
	request: Request,
	workspace_uuid: uuid_pkg.UUID,
	values: ApplicationInfoCreate,
	current_user: Annotated[dict, Depends(get_current_user)],
	db: Annotated[AsyncSession, Depends(async_get_db)],
	service: Annotated[WorkspaceService, Depends(get_workspace_service)],
) -> ApplicationInfoRead:
	application_info = await service.create_application_info(
		db=db,
		workspace_uuid=workspace_uuid,
		values=values,
		current_user=current_user,
	)
	return ApplicationInfoRead.model_validate(application_info)


@router.patch(
	"/workspaces/{workspace_uuid}/application-info/{application_info_uuid}",
	response_model=ApplicationInfoRead,
)
@casbin_guard.require_permission("workspace", "write")
async def update_application_info(
	request: Request,
	workspace_uuid: uuid_pkg.UUID,
	application_info_uuid: uuid_pkg.UUID,
	values: ApplicationInfoUpdate,
	current_user: Annotated[dict, Depends(get_current_user)],
	db: Annotated[AsyncSession, Depends(async_get_db)],
	service: Annotated[WorkspaceService, Depends(get_workspace_service)],
) -> ApplicationInfoRead:
	application_info = await service.update_application_info(
		db=db,
		workspace_uuid=workspace_uuid,
		application_info_uuid=application_info_uuid,
		values=values,
		current_user=current_user,
	)
	return ApplicationInfoRead.model_validate(application_info)


@router.delete("/workspaces/{workspace_uuid}/application-info/{application_info_uuid}")
@casbin_guard.require_permission("workspace", "write")
async def delete_application_info(
	request: Request,
	workspace_uuid: uuid_pkg.UUID,
	application_info_uuid: uuid_pkg.UUID,
	current_user: Annotated[dict, Depends(get_current_user)],
	db: Annotated[AsyncSession, Depends(async_get_db)],
	service: Annotated[WorkspaceService, Depends(get_workspace_service)],
) -> dict[str, str]:
	return await service.delete_application_info(
		db=db,
		workspace_uuid=workspace_uuid,
		application_info_uuid=application_info_uuid,
		current_user=current_user,
	)