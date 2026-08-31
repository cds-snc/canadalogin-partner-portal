from unittest.mock import AsyncMock, patch

import pytest

from src.app.core.exceptions.http_exceptions import DuplicateValueException, NotFoundException
from src.app.schemas.tier import TierCreate, TierUpdate
from src.app.services.tier_service import TierService


class TestTierService:
    @pytest.mark.asyncio
    async def test_create_tier_rejects_duplicate_name(self, mock_db) -> None:
        service = TierService()

        with patch("src.app.services.tier_service.crud_tiers") as mock_tiers:
            mock_tiers.exists = AsyncMock(return_value=True)

            with pytest.raises(DuplicateValueException, match="Tier Name not available"):
                await service.create_tier(db=mock_db, tier=TierCreate(name="free"))

    @pytest.mark.asyncio
    async def test_get_tier_by_name_raises_when_missing(self, mock_db) -> None:
        service = TierService()

        with patch("src.app.services.tier_service.crud_tiers") as mock_tiers:
            mock_tiers.get = AsyncMock(return_value=None)

            with pytest.raises(NotFoundException, match="Tier not found"):
                await service.get_tier_by_uuid(db=mock_db, tier_uuid="018f6f83-0f2b-7b0f-b2fb-96c4d8a4b401")

    @pytest.mark.asyncio
    async def test_update_tier_updates_existing_tier(self, mock_db) -> None:
        service = TierService()
        tier_uuid = "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b401"

        with patch("src.app.services.tier_service.crud_tiers") as mock_tiers:
            mock_tiers.get = AsyncMock(return_value={"id": 1, "uuid": tier_uuid, "name": "free"})
            mock_tiers.update = AsyncMock(return_value=None)

            result = await service.update_tier(db=mock_db, tier_uuid=tier_uuid, values=TierUpdate(name="pro"))

        assert result == {"message": "Tier updated"}
