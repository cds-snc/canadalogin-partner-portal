from unittest.mock import AsyncMock, Mock

import pytest

from src.app.api.v1.tasks import create_task, get_task


def unwrap_endpoint(endpoint):
    current = endpoint
    while hasattr(current, "__wrapped__"):
        current = current.__wrapped__
    return current


class TestTaskRoutes:
    @pytest.mark.asyncio
    async def test_create_task_delegates_to_service(self):
        mock_service = Mock()
        mock_service.create_task = AsyncMock(return_value={"id": "job-1"})

        result = await unwrap_endpoint(create_task)("hello", mock_service)

        assert result == {"id": "job-1"}
        mock_service.create_task.assert_awaited_once_with(message="hello")

    @pytest.mark.asyncio
    async def test_get_task_delegates_to_service(self):
        mock_service = Mock()
        mock_service.get_task = AsyncMock(return_value={"id": "job-1", "status": "queued"})

        result = await unwrap_endpoint(get_task)("job-1", mock_service)

        assert result == {"id": "job-1", "status": "queued"}
        mock_service.get_task.assert_awaited_once_with(task_id="job-1")
