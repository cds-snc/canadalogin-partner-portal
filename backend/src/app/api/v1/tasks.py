from typing import Any

from fastapi import APIRouter, Depends

from ...api.dependencies import get_task_service, rate_limiter_dependency
from ...core.access_control import casbin_guard
from ...schemas.job import Job
from ...services.task_service import TaskService

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.post("/task", response_model=Job, status_code=201, dependencies=[Depends(rate_limiter_dependency)])
@casbin_guard.require_permission("tasks", "write")
async def create_task(message: str, service: TaskService = Depends(get_task_service)) -> dict[str, str]:
    """Create a new background task.

    Parameters
    ----------
    message: str
        The message or data to be processed by the task.

    Returns
    -------
    dict[str, str]
        A dictionary containing the ID of the created task.
    """
    return await service.create_task(message=message)


@router.get("/task/{task_id}")
@casbin_guard.require_permission("tasks", "read")
async def get_task(task_id: str, service: TaskService = Depends(get_task_service)) -> dict[str, Any] | None:
    """Get information about a specific background task.

    Parameters
    ----------
    task_id: str
        The ID of the task.

    Returns
    -------
    Optional[dict[str, Any]]
        A dictionary containing information about the task if found, or None otherwise.
    """
    return await service.get_task(task_id=task_id)
