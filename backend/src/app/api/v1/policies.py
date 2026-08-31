import uuid as uuid_pkg
from typing import Annotated, Any

from fastapi import APIRouter, Depends, Request
from fastcrud import PaginatedListResponse
from sqlalchemy.ext.asyncio import AsyncSession

from ...api.dependencies import get_policy_service
from ...core.access_control import casbin_guard
from ...core.db.database import async_get_db
from ...schemas.access_policy import AccessPolicyCreate, AccessPolicyOut, AccessPolicyUpdate
from ...services.policy_service import PolicyService

router = APIRouter(tags=["policies"])


@router.post("/policy", response_model=AccessPolicyOut, status_code=201)
@casbin_guard.require_permission("policies", "write")
async def write_policy(
    request: Request,
    policy: AccessPolicyCreate,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[PolicyService, Depends(get_policy_service)],
) -> dict[str, Any]:
    return await service.create_policy(db=db, policy=policy)


@router.get("/policies", response_model=PaginatedListResponse[AccessPolicyOut])
@casbin_guard.require_permission("policies", "read")
async def read_policies(
    request: Request,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[PolicyService, Depends(get_policy_service)],
    page: int = 1,
    items_per_page: int = 10,
) -> dict[str, Any]:
    return await service.list_policies(db=db, page=page, items_per_page=items_per_page)


@router.get("/policy/{policy_uuid}", response_model=AccessPolicyOut)
@casbin_guard.require_permission("policies", "read")
async def read_policy(
    request: Request,
    policy_uuid: uuid_pkg.UUID,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[PolicyService, Depends(get_policy_service)],
) -> dict[str, Any]:
    return await service.get_policy(db=db, policy_uuid=policy_uuid)


@router.patch("/policy/{policy_uuid}")
@casbin_guard.require_permission("policies", "write")
async def patch_policy(
    request: Request,
    policy_uuid: uuid_pkg.UUID,
    values: AccessPolicyUpdate,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[PolicyService, Depends(get_policy_service)],
) -> dict[str, str]:
    return await service.update_policy(db=db, policy_uuid=policy_uuid, values=values)


@router.delete("/policy/{policy_uuid}")
@casbin_guard.require_permission("policies", "write")
async def erase_policy(
    request: Request,
    policy_uuid: uuid_pkg.UUID,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[PolicyService, Depends(get_policy_service)],
) -> dict[str, str]:
    return await service.delete_policy(db=db, policy_uuid=policy_uuid)
