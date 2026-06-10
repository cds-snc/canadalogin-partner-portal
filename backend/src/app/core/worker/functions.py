import asyncio
import logging
from typing import Any

import structlog
import uvloop
from arq.worker import Worker

from ...api.dependencies import get_rp_application_service
from ...core.db.database import local_session
from ...repositories.dependencies import get_ibm_sv_admin_client

asyncio.set_event_loop_policy(uvloop.EventLoopPolicy())


# -------- background tasks --------
async def sample_background_task(ctx: Worker, name: str) -> str:
    await asyncio.sleep(5)
    return f"Task {name} is complete!"


async def sync_ibm_verify_rp_applications(ctx: dict[str, Any]) -> dict[str, int]:
    ibm_admin_client = await get_ibm_sv_admin_client()
    service = get_rp_application_service()

    async with local_session() as db:
        result = await service.sync_rp_applications_from_ibm_verify(db=db, ibm_admin_client=ibm_admin_client)

    logging.info("IBM Verify RP application sync completed: %s", result)
    return result


# -------- base functions --------
async def startup(ctx: Worker) -> None:
    logging.info("Worker Started")


async def shutdown(ctx: Worker) -> None:
    logging.info("Worker end")


async def on_job_start(ctx: dict[str, Any]) -> None:
    structlog.contextvars.bind_contextvars(job_id=ctx["job_id"])
    logging.info("Job Started")


async def on_job_end(ctx: dict[str, Any]) -> None:
    logging.info("Job Competed")
    structlog.contextvars.clear_contextvars()
