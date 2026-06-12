"""IBM Security Verify Admin API endpoints."""

from typing import Annotated, Any, cast

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, Field

from ...core.access_control import casbin_guard
from ...core.exceptions.openapi import error_responses
from ...repositories.dependencies import get_ibm_sv_admin_client
from ...repositories.ibm_sv_admin import IBMVerifyAdminClient

router = APIRouter(tags=["ibm-sv-admin"])


class ApplicationCreateRequest(BaseModel):
    name: str
    description: str = ""
    application_url: str = ""
    redirect_uris: list[str] = Field(default_factory=list)
    owners: list[str] = Field(default_factory=list)


class ApplicationUpdateRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    application_url: str | None = None
    redirect_uris: list[str] | None = None


# User endpoints
@router.get("/ibm-sv-admin/users")
@casbin_guard.require_permission("isv_user", "read")
async def list_users(
    request: Request,
    client: Annotated[IBMVerifyAdminClient, Depends(get_ibm_sv_admin_client)],
) -> list[dict[str, Any]]:
    """List all users from IBM Security Verify."""
    payload = await client.fetch_users()
    resources = payload.Resources or []
    return [user.model_dump(by_alias=True, exclude_none=True) for user in resources]


@router.get("/ibm-sv-admin/users/search")
@casbin_guard.require_permission("isv_user", "read")
async def search_users(
    request: Request,
    username: str,
    client: Annotated[IBMVerifyAdminClient, Depends(get_ibm_sv_admin_client)],
) -> list[dict[str, Any]]:
    """Search users by name in IBM Security Verify."""
    payload = await client.search_users_by_name(username)
    resources = payload.Resources or []
    return [user.model_dump(by_alias=True, exclude_none=True) for user in resources]


# Application endpoints
@router.get("/ibm-sv-admin/applications")
@casbin_guard.require_permission("isv_application", "read")
async def list_applications(
    request: Request,
    client: Annotated[IBMVerifyAdminClient, Depends(get_ibm_sv_admin_client)],
) -> Any:
    """List all applications from IBM Security Verify."""
    return await client.list_applications()


@router.get("/ibm-sv-admin/applications/{application_id}")
@casbin_guard.require_permission("isv_application", "read")
async def get_application(
    request: Request,
    application_id: str,
    client: Annotated[IBMVerifyAdminClient, Depends(get_ibm_sv_admin_client)],
) -> dict[str, Any]:
    """Get application details from IBM Security Verify."""
    payload = await client.get_application_detail(application_id)
    return cast("dict[str, Any]", payload.model_dump(by_alias=True, exclude_none=True))


@router.post("/ibm-sv-admin/applications", responses=error_responses(400, 401, 403, 422))
@casbin_guard.require_permission("isv_application", "write")
async def create_application(
    request: Request,
    app_data: ApplicationCreateRequest,
    client: Annotated[IBMVerifyAdminClient, Depends(get_ibm_sv_admin_client)],
) -> dict[str, Any]:
    """Create a new application in IBM Security Verify."""
    from ...services.ibm_sv_admin_service import IBMVerifyAdminService

    service = IBMVerifyAdminService(client)
    payload_data = {
        "name": app_data.name,
        "description": app_data.description,
        "application_url": app_data.application_url,
        "redirect_uris": app_data.redirect_uris,
    }
    return await service.create_application_from_payload(payload_data, app_data.owners)


@router.put("/ibm-sv-admin/applications/{application_id}")
@casbin_guard.require_permission("isv_application", "write")
async def update_application(
    request: Request,
    application_id: str,
    app_data: ApplicationUpdateRequest,
    client: Annotated[IBMVerifyAdminClient, Depends(get_ibm_sv_admin_client)],
) -> dict[str, str]:
    """Update an application in IBM Security Verify."""
    from ...services.ibm_sv_admin_service import IBMVerifyAdminService

    service = IBMVerifyAdminService(client)
    payload_data = {k: v for k, v in app_data.model_dump().items() if v is not None}
    await service.update_application_from_payload(application_id, payload_data)
    return {"message": "Application updated"}


@router.delete("/ibm-sv-admin/applications/{application_id}")
@casbin_guard.require_permission("isv_application", "write")
async def delete_application(
    request: Request,
    application_id: str,
    client: Annotated[IBMVerifyAdminClient, Depends(get_ibm_sv_admin_client)],
) -> dict[str, str]:
    """Delete an application from IBM Security Verify."""
    await client.delete_application(application_id)
    return {"message": "Application deleted"}


@router.get("/ibm-sv-admin/applications/{application_id}/logins")
@casbin_guard.require_permission("isv_application", "read")
async def get_application_logins(
    request: Request,
    application_id: str,
    client: Annotated[IBMVerifyAdminClient, Depends(get_ibm_sv_admin_client)],
    from_date: str | None = None,
    to_date: str | None = None,
) -> dict[str, Any]:
    """Get total logins for an application."""
    payload = await client.get_application_total_logins(application_id, from_date, to_date)
    return cast("dict[str, Any]", payload.model_dump(by_alias=True, exclude_none=True))


@router.get("/ibm-sv-admin/applications/{application_id}/audit-trail")
@casbin_guard.require_permission("isv_application", "read")
async def get_application_audit_trail(
    request: Request,
    application_id: str,
    client: Annotated[IBMVerifyAdminClient, Depends(get_ibm_sv_admin_client)],
    from_date: str | None = None,
    to_date: str | None = None,
    size: int = 50,
    sort_by: str = "time",
    sort_order: str = "DESC",
) -> dict[str, Any]:
    """Get audit trail for an application."""
    from ...services.ibm_sv_admin_service import IBMVerifyAdminService

    service = IBMVerifyAdminService(client)
    return await service.get_application_audit_trail(
        application_id=application_id,
        from_date=from_date,
        to_date=to_date,
        size=size,
        sort_by=sort_by,
        sort_order=sort_order,
    )


@router.get("/ibm-sv-admin/applications/{application_id}/entitlements")
@casbin_guard.require_permission("isv_application", "read")
async def get_application_entitlements(
    request: Request,
    application_id: str,
    client: Annotated[IBMVerifyAdminClient, Depends(get_ibm_sv_admin_client)],
) -> dict[str, Any]:
    """Get entitlements for an application."""
    payload = await client.get_application_entitlements(application_id)
    return cast("dict[str, Any]", payload.model_dump(by_alias=True, exclude_none=True))


# Group endpoints
@router.get("/ibm-sv-admin/groups")
@casbin_guard.require_permission("isv_group", "read")
async def list_groups(
    request: Request,
    client: Annotated[IBMVerifyAdminClient, Depends(get_ibm_sv_admin_client)],
    count: int = 100,
    start_index: int = 1,
) -> list[dict[str, Any]]:
    """List all groups from IBM Security Verify."""
    payload = await client.list_groups(count, start_index)
    resources = payload.Resources or []
    return [group.model_dump(by_alias=True, exclude_none=True) for group in resources]


@router.get("/ibm-sv-admin/groups/search")
@casbin_guard.require_permission("isv_group", "read")
async def search_groups(
    request: Request,
    group_name: str,
    client: Annotated[IBMVerifyAdminClient, Depends(get_ibm_sv_admin_client)],
) -> list[dict[str, Any]]:
    """Search groups by name in IBM Security Verify."""
    payload = await client.search_groups_by_name(group_name)
    resources = payload.Resources or []
    return [group.model_dump(by_alias=True, exclude_none=True) for group in resources]


@router.get("/ibm-sv-admin/groups/{group_id}")
@casbin_guard.require_permission("isv_group", "read")
async def get_group(
    request: Request,
    group_id: str,
    client: Annotated[IBMVerifyAdminClient, Depends(get_ibm_sv_admin_client)],
) -> dict[str, Any]:
    """Get group details from IBM Security Verify."""
    payload = await client.get_group_by_id(group_id)
    return cast("dict[str, Any]", payload.model_dump(by_alias=True, exclude_none=True))


@router.post("/ibm-sv-admin/groups/{group_id}/users/{user_id}")
@casbin_guard.require_permission("isv_group", "write")
async def add_user_to_group(
    request: Request,
    group_id: str,
    user_id: str,
    client: Annotated[IBMVerifyAdminClient, Depends(get_ibm_sv_admin_client)],
) -> dict[str, str]:
    """Add a user to a group."""
    await client.add_user_to_group(group_id, user_id)
    return {"message": "User added to group"}


@router.delete("/ibm-sv-admin/groups/{group_id}/users/{user_id}")
@casbin_guard.require_permission("isv_group", "write")
async def remove_user_from_group(
    request: Request,
    group_id: str,
    user_id: str,
    client: Annotated[IBMVerifyAdminClient, Depends(get_ibm_sv_admin_client)],
) -> dict[str, str]:
    """Remove a user from a group."""
    await client.remove_user_from_group(group_id, user_id)
    return {"message": "User removed from group"}


@router.get("/ibm-sv-admin/groups/{group_id}/users/{user_id}/check")
@casbin_guard.require_permission("isv_group", "read")
async def check_user_in_group(
    request: Request,
    group_id: str,
    user_id: str,
    client: Annotated[IBMVerifyAdminClient, Depends(get_ibm_sv_admin_client)],
) -> dict[str, bool]:
    """Check if a user is in a group."""
    is_member = await client.is_user_in_group(group_id, user_id)
    return {"is_member": is_member}
