from unittest.mock import AsyncMock, Mock

import pytest

from src.app.api.v1.rate_limits import (
    erase_rate_limit,
    patch_rate_limit,
    read_rate_limit,
    read_rate_limits,
    write_rate_limit,
)
from src.app.schemas.rate_limit import RateLimitCreate, RateLimitUpdate


def unwrap_endpoint(endpoint):
    current = endpoint
    while hasattr(current, "__wrapped__"):
        current = current.__wrapped__
    return current


class TestRateLimitRoutes:
    @pytest.mark.asyncio
    async def test_write_rate_limit_delegates_to_service(self, mock_db):
        tier_uuid = "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b201"
        mock_service = Mock()
        payload = RateLimitCreate(path="/users", limit=5, period=60, name="users:5:60")
        mock_service.create_rate_limit = AsyncMock(
            return_value={"uuid": "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b202", "name": "users:5:60"}
        )

        result = await unwrap_endpoint(write_rate_limit)(Mock(), tier_uuid, payload, mock_db, mock_service)

        assert result == {"uuid": "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b202", "name": "users:5:60"}
        mock_service.create_rate_limit.assert_awaited_once_with(db=mock_db, tier_uuid=tier_uuid, rate_limit=payload)

    @pytest.mark.asyncio
    async def test_read_rate_limits_delegates_to_service(self, mock_db):
        tier_uuid = "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b201"
        mock_service = Mock()
        mock_service.list_rate_limits = AsyncMock(return_value={"data": []})

        result = await unwrap_endpoint(read_rate_limits)(Mock(), tier_uuid, mock_db, mock_service, page=1, items_per_page=10)

        assert result == {"data": []}
        mock_service.list_rate_limits.assert_awaited_once_with(db=mock_db, tier_uuid=tier_uuid, page=1, items_per_page=10)

    @pytest.mark.asyncio
    async def test_read_patch_delete_rate_limit_delegate_to_service(self, mock_db):
        tier_uuid = "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b201"
        rate_limit_uuid = "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b202"
        mock_service = Mock()
        mock_service.get_rate_limit = AsyncMock(return_value={"uuid": rate_limit_uuid})
        mock_service.update_rate_limit = AsyncMock(return_value={"message": "Rate Limit updated"})
        mock_service.delete_rate_limit = AsyncMock(return_value={"message": "Rate Limit deleted"})

        read_result = await unwrap_endpoint(read_rate_limit)(Mock(), tier_uuid, rate_limit_uuid, mock_db, mock_service)
        patch_result = await unwrap_endpoint(patch_rate_limit)(
            Mock(), tier_uuid, rate_limit_uuid, RateLimitUpdate(limit=10), mock_db, mock_service
        )
        delete_result = await unwrap_endpoint(erase_rate_limit)(Mock(), tier_uuid, rate_limit_uuid, mock_db, mock_service)

        assert read_result == {"uuid": rate_limit_uuid}
        assert patch_result == {"message": "Rate Limit updated"}
        assert delete_result == {"message": "Rate Limit deleted"}
