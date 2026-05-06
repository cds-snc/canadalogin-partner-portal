from unittest.mock import AsyncMock, Mock, patch

import pytest

from src.app.services.health_service import HealthService


class TestHealthService:
    @pytest.mark.asyncio
    async def test_health_returns_healthy_payload(self) -> None:
        service = HealthService()

        status_code, payload = await service.health()

        assert status_code == 200
        assert payload["status"] == "healthy"

    @pytest.mark.asyncio
    async def test_ready_returns_unhealthy_when_dependency_fails(self, mock_db) -> None:
        service = HealthService()

        with patch("src.app.services.health_service.check_database_health", new=AsyncMock(return_value=False)):
            with patch("src.app.services.health_service.check_redis_health", new=AsyncMock(return_value=True)):
                status_code, payload = await service.ready(redis=Mock(), db=mock_db)

        assert status_code == 503
        assert payload["status"] == "unhealthy"
