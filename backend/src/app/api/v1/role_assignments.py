"""Canonical role-assignment administration routes."""

from collections.abc import Awaitable
from typing import Annotated, Any, TypeVar
from uuid import UUID

from fastapi import APIRouter, Depends, Path, Query
from sqlalchemy.ext.asyncio import AsyncSession

from ...api.dependencies import get_authorization_service, get_current_user
from ...core.db.database import async_get_db
from ...core.exceptions.http_exceptions import ForbiddenException
from ...core.exceptions.openapi import error_responses
from ...schemas.authorization import (
    ClAdminAssignmentEligibilityRead,
    ClAdminRoleAssignmentCreate,
    PartnerRoleAssignmentCreate,
    PartnerRoleAssignmentUpdate,
    RoleAssignmentCandidateRead,
    RoleAssignmentMutationMessage,
    RoleAssignmentRead,
)
from ...services.authorization_service import (
    ROLE_ASSIGNMENT_CANDIDATE_MAX_QUERY_LENGTH,
    ROLE_ASSIGNMENT_CANDIDATE_MIN_QUERY_LENGTH,
    AuthorizationService,
)

router = APIRouter(tags=["role assignments"])
MutationResult = TypeVar("MutationResult")


def _current_user_id(current_user: dict[str, Any]) -> int:
    user_id = current_user.get("id")
    if not isinstance(user_id, int) or isinstance(user_id, bool):
        raise ForbiddenException("Authorization state could not be resolved.")
    return user_id


async def _commit_mutation(
    db: AsyncSession,
    operation: Awaitable[MutationResult],
) -> MutationResult:
    """Make the API boundary own commit and rollback for one mutation."""

    try:
        result = await operation
        await db.commit()
        return result
    except Exception:
        await db.rollback()
        raise


@router.get(
    "/role-assignments/cl-admin",
    response_model=list[RoleAssignmentRead],
    responses=error_responses(401, 403, 500),
)
async def read_cl_admin_role_assignments(
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[AuthorizationService, Depends(get_authorization_service)],
    current_user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> list[RoleAssignmentRead]:
    return await service.list_cl_admin_assignments(
        db,
        actor_user_id=_current_user_id(current_user),
    )


@router.post(
    "/role-assignments/cl-admin",
    response_model=RoleAssignmentRead,
    status_code=201,
    responses=error_responses(400, 401, 403, 404, 409, 422, 500),
)
async def write_cl_admin_role_assignment(
    payload: ClAdminRoleAssignmentCreate,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[AuthorizationService, Depends(get_authorization_service)],
    current_user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> RoleAssignmentRead:
    return await _commit_mutation(
        db,
        service.assign_cl_admin_by_uuid(
            db,
            target_user_uuid=payload.user_uuid,
            assigned_by_user_id=_current_user_id(current_user),
        ),
    )


@router.get(
    "/role-assignments/cl-admin/{userUuid}/eligibility",
    response_model=ClAdminAssignmentEligibilityRead,
    responses=error_responses(401, 403, 404, 422, 500),
)
async def read_cl_admin_role_assignment_eligibility(
    user_uuid: Annotated[UUID, Path(alias="userUuid")],
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[AuthorizationService, Depends(get_authorization_service)],
    current_user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> ClAdminAssignmentEligibilityRead:
    return await service.get_cl_admin_assignment_eligibility(
        db,
        target_user_uuid=user_uuid,
        actor_user_id=_current_user_id(current_user),
    )


@router.delete(
    "/role-assignments/cl-admin/{userUuid}",
    response_model=RoleAssignmentMutationMessage,
    responses=error_responses(401, 403, 404, 422, 500),
)
async def erase_cl_admin_role_assignment(
    user_uuid: Annotated[UUID, Path(alias="userUuid")],
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[AuthorizationService, Depends(get_authorization_service)],
    current_user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> RoleAssignmentMutationMessage:
    await _commit_mutation(
        db,
        service.revoke_cl_admin_by_uuid(
            db,
            target_user_uuid=user_uuid,
            revoked_by_user_id=_current_user_id(current_user),
        ),
    )
    return RoleAssignmentMutationMessage(message="CL Admin assignment revoked.")


@router.get(
    "/workspaces/{workspaceUuid}/role-assignments",
    response_model=list[RoleAssignmentRead],
    responses=error_responses(401, 403, 404, 422, 500),
)
async def read_workspace_role_assignments(
    workspace_uuid: Annotated[UUID, Path(alias="workspaceUuid")],
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[AuthorizationService, Depends(get_authorization_service)],
    current_user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> list[RoleAssignmentRead]:
    return await service.list_workspace_role_assignments(
        db,
        workspace_uuid=workspace_uuid,
        actor_user_id=_current_user_id(current_user),
    )


@router.get(
    "/workspaces/{workspaceUuid}/role-assignment-candidates",
    response_model=list[RoleAssignmentCandidateRead],
    responses=error_responses(400, 401, 403, 404, 422, 500),
)
async def read_workspace_role_assignment_candidates(
    workspace_uuid: Annotated[UUID, Path(alias="workspaceUuid")],
    q: Annotated[
        str,
        Query(
            min_length=ROLE_ASSIGNMENT_CANDIDATE_MIN_QUERY_LENGTH,
            max_length=ROLE_ASSIGNMENT_CANDIDATE_MAX_QUERY_LENGTH,
        ),
    ],
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[AuthorizationService, Depends(get_authorization_service)],
    current_user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> list[RoleAssignmentCandidateRead]:
    return await service.search_workspace_role_assignment_candidates(
        db,
        workspace_uuid=workspace_uuid,
        actor_user_id=_current_user_id(current_user),
        query=q,
    )


@router.post(
    "/workspaces/{workspaceUuid}/role-assignments",
    response_model=RoleAssignmentRead,
    status_code=201,
    responses=error_responses(400, 401, 403, 404, 409, 422, 500),
)
async def write_workspace_role_assignment(
    workspace_uuid: Annotated[UUID, Path(alias="workspaceUuid")],
    payload: PartnerRoleAssignmentCreate,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[AuthorizationService, Depends(get_authorization_service)],
    current_user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> RoleAssignmentRead:
    return await _commit_mutation(
        db,
        service.assign_partner_role_by_uuid(
            db,
            workspace_uuid=workspace_uuid,
            target_user_uuid=payload.user_uuid,
            role=payload.role,
            assigned_by_user_id=_current_user_id(current_user),
        ),
    )


@router.get(
    "/workspaces/{workspaceUuid}/access/assignments/{assignmentUuid}",
    response_model=RoleAssignmentRead,
    responses=error_responses(401, 403, 404, 422, 500),
)
async def read_workspace_role_assignment(
    workspace_uuid: Annotated[UUID, Path(alias="workspaceUuid")],
    assignment_uuid: Annotated[UUID, Path(alias="assignmentUuid")],
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[AuthorizationService, Depends(get_authorization_service)],
    current_user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> RoleAssignmentRead:
    return await service.get_workspace_role_assignment_by_uuid(
        db,
        workspace_uuid=workspace_uuid,
        assignment_uuid=assignment_uuid,
        actor_user_id=_current_user_id(current_user),
    )


@router.patch(
    "/workspaces/{workspaceUuid}/access/assignments/{assignmentUuid}",
    response_model=RoleAssignmentRead,
    responses=error_responses(400, 401, 403, 404, 422, 500),
)
async def patch_workspace_role_assignment_by_assignment_uuid(
    workspace_uuid: Annotated[UUID, Path(alias="workspaceUuid")],
    assignment_uuid: Annotated[UUID, Path(alias="assignmentUuid")],
    payload: PartnerRoleAssignmentUpdate,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[AuthorizationService, Depends(get_authorization_service)],
    current_user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> RoleAssignmentRead:
    return await _commit_mutation(
        db,
        service.replace_partner_role_by_assignment_uuid(
            db,
            workspace_uuid=workspace_uuid,
            assignment_uuid=assignment_uuid,
            role=payload.role,
            replaced_by_user_id=_current_user_id(current_user),
        ),
    )


@router.delete(
    "/workspaces/{workspaceUuid}/access/assignments/{assignmentUuid}",
    response_model=RoleAssignmentMutationMessage,
    responses=error_responses(401, 403, 404, 422, 500),
)
async def erase_workspace_role_assignment_by_assignment_uuid(
    workspace_uuid: Annotated[UUID, Path(alias="workspaceUuid")],
    assignment_uuid: Annotated[UUID, Path(alias="assignmentUuid")],
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[AuthorizationService, Depends(get_authorization_service)],
    current_user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> RoleAssignmentMutationMessage:
    await _commit_mutation(
        db,
        service.revoke_partner_role_by_assignment_uuid(
            db,
            workspace_uuid=workspace_uuid,
            assignment_uuid=assignment_uuid,
            revoked_by_user_id=_current_user_id(current_user),
        ),
    )
    return RoleAssignmentMutationMessage(message="Workspace role assignment revoked.")


@router.patch(
    "/workspaces/{workspaceUuid}/role-assignments/{userUuid}",
    response_model=RoleAssignmentRead,
    responses=error_responses(400, 401, 403, 404, 422, 500),
)
async def patch_workspace_role_assignment(
    workspace_uuid: Annotated[UUID, Path(alias="workspaceUuid")],
    user_uuid: Annotated[UUID, Path(alias="userUuid")],
    payload: PartnerRoleAssignmentUpdate,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[AuthorizationService, Depends(get_authorization_service)],
    current_user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> RoleAssignmentRead:
    return await _commit_mutation(
        db,
        service.replace_partner_role_by_uuid(
            db,
            workspace_uuid=workspace_uuid,
            target_user_uuid=user_uuid,
            role=payload.role,
            replaced_by_user_id=_current_user_id(current_user),
        ),
    )


@router.delete(
    "/workspaces/{workspaceUuid}/role-assignments/{userUuid}",
    response_model=RoleAssignmentMutationMessage,
    responses=error_responses(401, 403, 404, 422, 500),
)
async def erase_workspace_role_assignment(
    workspace_uuid: Annotated[UUID, Path(alias="workspaceUuid")],
    user_uuid: Annotated[UUID, Path(alias="userUuid")],
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[AuthorizationService, Depends(get_authorization_service)],
    current_user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> RoleAssignmentMutationMessage:
    await _commit_mutation(
        db,
        service.revoke_partner_role_by_uuid(
            db,
            workspace_uuid=workspace_uuid,
            target_user_uuid=user_uuid,
            revoked_by_user_id=_current_user_id(current_user),
        ),
    )
    return RoleAssignmentMutationMessage(message="Workspace role assignment revoked.")
