from unittest.mock import AsyncMock, Mock

import pytest

from src.app.api.v1.health import health, ready


class TestHealthRoutes:
    @pytest.mark.asyncio
    async def test_health_delegates_to_service(self):
        mock_service = Mock()
        mock_service.health = AsyncMock(return_value=(200, {"status": "healthy"}))

        response = await health(mock_service)

        assert response.status_code == 200
        mock_service.health.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_ready_delegates_to_service(self, mock_db):
        mock_service = Mock()
        mock_service.ready = AsyncMock(return_value=(200, {"status": "healthy"}))

        response = await ready(Mock(), mock_db, mock_service)

        assert response.status_code == 200
        mock_service.ready.assert_awaited_once()
