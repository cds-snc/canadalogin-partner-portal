import uuid as uuid_pkg
from typing import Annotated, Any

from fastapi import APIRouter, Depends, Request
from fastcrud import PaginatedListResponse
from sqlalchemy.ext.asyncio import AsyncSession

from ...api.dependencies import get_rate_limit_service
from ...core.access_control import casbin_guard
from ...core.db.database import async_get_db
from ...schemas.rate_limit import RateLimitCreate, RateLimitRead, RateLimitUpdate
from ...services.rate_limit_service import RateLimitService

router = APIRouter(tags=["rate_limits"])


@router.post("/tier/{tier_uuid}/rate_limit", response_model=RateLimitRead, status_code=201)
@casbin_guard.require_permission("rate_limits", "write")
async def write_rate_limit(
    request: Request,
    tier_uuid: uuid_pkg.UUID,
    rate_limit: RateLimitCreate,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[RateLimitService, Depends(get_rate_limit_service)],
) -> dict[str, Any]:
    return await service.create_rate_limit(db=db, tier_uuid=tier_uuid, rate_limit=rate_limit)


@router.get("/tier/{tier_uuid}/rate_limits", response_model=PaginatedListResponse[RateLimitRead])
@casbin_guard.require_permission("rate_limits", "read")
async def read_rate_limits(
    request: Request,
    tier_uuid: uuid_pkg.UUID,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[RateLimitService, Depends(get_rate_limit_service)],
    page: int = 1,
    items_per_page: int = 10,
) -> dict:
    return await service.list_rate_limits(db=db, tier_uuid=tier_uuid, page=page, items_per_page=items_per_page)


@router.get("/tier/{tier_uuid}/rate_limit/{rate_limit_uuid}", response_model=RateLimitRead)
@casbin_guard.require_permission("rate_limits", "read")
async def read_rate_limit(
    request: Request,
    tier_uuid: uuid_pkg.UUID,
    rate_limit_uuid: uuid_pkg.UUID,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[RateLimitService, Depends(get_rate_limit_service)],
) -> dict[str, Any]:
    return await service.get_rate_limit(db=db, tier_uuid=tier_uuid, rate_limit_uuid=rate_limit_uuid)


@router.patch("/tier/{tier_uuid}/rate_limit/{rate_limit_uuid}")
@casbin_guard.require_permission("rate_limits", "write")
async def patch_rate_limit(
    request: Request,
    tier_uuid: uuid_pkg.UUID,
    rate_limit_uuid: uuid_pkg.UUID,
    values: RateLimitUpdate,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[RateLimitService, Depends(get_rate_limit_service)],
) -> dict[str, str]:
    return await service.update_rate_limit(
        db=db,
        tier_uuid=tier_uuid,
        rate_limit_uuid=rate_limit_uuid,
        values=values,
    )


@router.delete("/tier/{tier_uuid}/rate_limit/{rate_limit_uuid}")
@casbin_guard.require_permission("rate_limits", "write")
async def erase_rate_limit(
    request: Request,
    tier_uuid: uuid_pkg.UUID,
    rate_limit_uuid: uuid_pkg.UUID,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[RateLimitService, Depends(get_rate_limit_service)],
) -> dict[str, str]:
    return await service.delete_rate_limit(db=db, tier_uuid=tier_uuid, rate_limit_uuid=rate_limit_uuid)
