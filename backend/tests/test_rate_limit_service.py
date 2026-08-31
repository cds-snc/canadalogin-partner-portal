from unittest.mock import AsyncMock, patch

import pytest

from src.app.core.exceptions.http_exceptions import DuplicateValueException, NotFoundException
from src.app.schemas.rate_limit import RateLimitCreate, RateLimitUpdate
from src.app.services.rate_limit_service import RateLimitService


class TestRateLimitService:
    @pytest.mark.asyncio
    async def test_create_rate_limit_rejects_missing_tier(self, mock_db) -> None:
        service = RateLimitService()

        with patch("src.app.services.rate_limit_service.crud_tiers") as mock_tiers:
            mock_tiers.get = AsyncMock(return_value=None)

            with pytest.raises(NotFoundException, match="Tier not found"):
                await service.create_rate_limit(
                    db=mock_db,
                    tier_uuid="018f6f83-0f2b-7b0f-b2fb-96c4d8a4b201",
                    rate_limit=RateLimitCreate(path="/users", limit=5, period=60, name="users:5:60"),
                )

    @pytest.mark.asyncio
    async def test_create_rate_limit_rejects_duplicate_name(self, mock_db) -> None:
        service = RateLimitService()

        with patch("src.app.services.rate_limit_service.crud_tiers") as mock_tiers:
            mock_tiers.get = AsyncMock(return_value={"id": 1, "uuid": "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b201", "name": "free"})

            with patch("src.app.services.rate_limit_service.crud_rate_limits") as mock_limits:
                mock_limits.exists = AsyncMock(return_value=True)

                with pytest.raises(DuplicateValueException, match="Rate Limit Name not available"):
                    await service.create_rate_limit(
                        db=mock_db,
                        tier_uuid="018f6f83-0f2b-7b0f-b2fb-96c4d8a4b201",
                        rate_limit=RateLimitCreate(path="/users", limit=5, period=60, name="users:5:60"),
                    )

    @pytest.mark.asyncio
    async def test_update_rate_limit_rejects_missing_rate_limit(self, mock_db) -> None:
        service = RateLimitService()

        with patch("src.app.services.rate_limit_service.crud_tiers") as mock_tiers:
            mock_tiers.get = AsyncMock(return_value={"id": 1, "uuid": "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b201", "name": "free"})

            with patch("src.app.services.rate_limit_service.crud_rate_limits") as mock_limits:
                mock_limits.get = AsyncMock(return_value=None)

                with pytest.raises(NotFoundException, match="Rate Limit not found"):
                    await service.update_rate_limit(
                        db=mock_db,
                        tier_uuid="018f6f83-0f2b-7b0f-b2fb-96c4d8a4b201",
                        rate_limit_uuid="018f6f83-0f2b-7b0f-b2fb-96c4d8a4b202",
                        values=RateLimitUpdate(limit=10),
                    )
