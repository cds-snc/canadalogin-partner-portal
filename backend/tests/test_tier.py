from unittest.mock import AsyncMock, Mock

import pytest

from src.app.api.v1.tiers import erase_tier, patch_tier, read_tier, read_tiers, write_tier
from src.app.schemas.tier import TierCreate, TierUpdate


def unwrap_endpoint(endpoint):
    current = endpoint
    while hasattr(current, "__wrapped__"):
        current = current.__wrapped__
    return current


class TestTierRoutes:
    @pytest.mark.asyncio
    async def test_create_tier_delegates_to_service(self, mock_db):
        mock_service = Mock()
        mock_service.create_tier = AsyncMock(
            return_value={"uuid": "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b401", "name": "free", "created_at": "2026-03-17T00:00:00"}
        )

        result = await unwrap_endpoint(write_tier)(Mock(), TierCreate(name="free"), mock_db, mock_service)

        assert result["name"] == "free"
        mock_service.create_tier.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_read_tiers_delegates_to_service(self, mock_db):
        mock_service = Mock()
        mock_service.list_tiers = AsyncMock(return_value={"data": []})

        result = await unwrap_endpoint(read_tiers)(Mock(), mock_db, mock_service, page=1, items_per_page=10)

        assert result == {"data": []}
        mock_service.list_tiers.assert_awaited_once_with(db=mock_db, page=1, items_per_page=10)

    @pytest.mark.asyncio
    async def test_read_patch_delete_tier_delegate_to_service(self, mock_db):
        tier_uuid = "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b401"
        mock_service = Mock()
        mock_service.get_tier_by_uuid = AsyncMock(return_value={"uuid": tier_uuid, "name": "free"})
        mock_service.update_tier = AsyncMock(return_value={"message": "Tier updated"})
        mock_service.delete_tier = AsyncMock(return_value={"message": "Tier deleted"})

        read_result = await unwrap_endpoint(read_tier)(Mock(), tier_uuid, mock_db, mock_service)
        patch_result = await unwrap_endpoint(patch_tier)(Mock(), tier_uuid, TierUpdate(name="pro"), mock_db, mock_service)
        delete_result = await unwrap_endpoint(erase_tier)(Mock(), tier_uuid, mock_db, mock_service)

        assert read_result == {"uuid": tier_uuid, "name": "free"}
        assert patch_result == {"message": "Tier updated"}
        assert delete_result == {"message": "Tier deleted"}
