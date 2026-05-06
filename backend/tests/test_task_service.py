from unittest.mock import AsyncMock, Mock, patch

import pytest
from fastapi import HTTPException

from src.app.services.task_service import TaskService


class TestTaskService:
    @pytest.mark.asyncio
    async def test_create_task_raises_when_queue_unavailable(self) -> None:
        service = TaskService()

        with patch("src.app.services.task_service.queue.pool", None):
            with pytest.raises(HTTPException, match="Queue is not available"):
                await service.create_task(message="hello")

    @pytest.mark.asyncio
    async def test_get_task_returns_none_when_missing(self) -> None:
        service = TaskService()
        mock_pool = Mock()
        mock_job = Mock()
        mock_job.info = AsyncMock(return_value=None)

        with patch("src.app.services.task_service.queue.pool", mock_pool):
            with patch("src.app.services.task_service.ArqJob", return_value=mock_job):
                result = await service.get_task(task_id="job-1")

        assert result is None
