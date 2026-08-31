import uuid as uuid_pkg
from typing import Any

from fastcrud import compute_offset, paginated_response
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.exceptions.http_exceptions import DuplicateValueException, NotFoundException
from ..repositories.crud_rate_limit import crud_rate_limits
from ..repositories.crud_tier import crud_tiers
from ..schemas.rate_limit import RateLimitCreate, RateLimitCreateInternal, RateLimitRead, RateLimitUpdate


class RateLimitService:
    async def create_rate_limit(
        self, db: AsyncSession, tier_uuid: uuid_pkg.UUID | str, rate_limit: RateLimitCreate
    ) -> dict[str, Any]:
        db_tier = await self._get_tier(db=db, tier_uuid=tier_uuid)
        payload = rate_limit.model_dump()
        payload["tier_id"] = db_tier["id"]

        if await crud_rate_limits.exists(db=db, name=payload["name"]):
            raise DuplicateValueException("Rate Limit Name not available")

        created_rate_limit = await crud_rate_limits.create(
            db=db,
            object=RateLimitCreateInternal(**payload),
            schema_to_select=RateLimitRead,
        )
        if created_rate_limit is None:
            raise NotFoundException("Failed to create rate limit")
        return created_rate_limit

    async def list_rate_limits(
        self, db: AsyncSession, tier_uuid: uuid_pkg.UUID | str, page: int, items_per_page: int
    ) -> dict[str, Any]:
        db_tier = await self._get_tier(db=db, tier_uuid=tier_uuid)
        rate_limits_data = await crud_rate_limits.get_multi(
            db=db,
            offset=compute_offset(page, items_per_page),
            limit=items_per_page,
            tier_id=db_tier["id"],
            schema_to_select=RateLimitRead,
        )
        return paginated_response(crud_data=rate_limits_data, page=page, items_per_page=items_per_page)

    async def get_rate_limit(
        self, db: AsyncSession, tier_uuid: uuid_pkg.UUID | str, rate_limit_uuid: uuid_pkg.UUID | str
    ) -> dict[str, Any]:
        db_tier = await self._get_tier(db=db, tier_uuid=tier_uuid)
        db_rate_limit = await crud_rate_limits.get(
            db=db,
            tier_id=db_tier["id"],
            uuid=rate_limit_uuid,
            schema_to_select=RateLimitRead,
        )
        if db_rate_limit is None:
            raise NotFoundException("Rate Limit not found")
        return db_rate_limit

    async def update_rate_limit(
        self,
        db: AsyncSession,
        tier_uuid: uuid_pkg.UUID | str,
        rate_limit_uuid: uuid_pkg.UUID | str,
        values: RateLimitUpdate,
    ) -> dict[str, str]:
        await self.get_rate_limit(db=db, tier_uuid=tier_uuid, rate_limit_uuid=rate_limit_uuid)
        await crud_rate_limits.update(db=db, object=values, uuid=rate_limit_uuid)
        return {"message": "Rate Limit updated"}

    async def delete_rate_limit(
        self, db: AsyncSession, tier_uuid: uuid_pkg.UUID | str, rate_limit_uuid: uuid_pkg.UUID | str
    ) -> dict[str, str]:
        await self.get_rate_limit(db=db, tier_uuid=tier_uuid, rate_limit_uuid=rate_limit_uuid)
        await crud_rate_limits.delete(db=db, uuid=rate_limit_uuid)
        return {"message": "Rate Limit deleted"}

    async def _get_tier(self, db: AsyncSession, tier_uuid: uuid_pkg.UUID | str) -> dict[str, Any]:
        db_tier = await crud_tiers.get(db=db, uuid=tier_uuid)
        if not db_tier:
            raise NotFoundException("Tier not found")
        return db_tier
