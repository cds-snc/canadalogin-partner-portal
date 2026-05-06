from typing import Any

from arq.jobs import Job as ArqJob

from ..core.exceptions.http_exceptions import CustomException
from ..core.utils import queue


class TaskService:
    async def create_task(self, message: str) -> dict[str, str]:
        if queue.pool is None:
            raise CustomException(status_code=503, detail="Queue is not available")

        job = await queue.pool.enqueue_job("sample_background_task", message)
        if job is None:
            raise CustomException(status_code=500, detail="Failed to create task")

        return {"id": job.job_id}

    async def get_task(self, task_id: str) -> dict[str, Any] | None:
        if queue.pool is None:
            raise CustomException(status_code=503, detail="Queue is not available")

        job = ArqJob(task_id, queue.pool)
        job_info = await job.info()
        if job_info is None:
            return None

        return job_info.__dict__
