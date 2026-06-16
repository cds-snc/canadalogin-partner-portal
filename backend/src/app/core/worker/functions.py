import asyncio
import logging
from typing import Any

import structlog
import uvloop
from arq.worker import Worker
from redis.asyncio import Redis as AsyncRedis

from ...api.dependencies import get_rp_application_service
from ...core.config import settings
from ...core.db.database import local_session
from ...repositories.dependencies import get_ibm_sv_admin_client
from ...services.mau_service import MAUService
from .timezone_utils import is_in_hour_window

asyncio.set_event_loop_policy(uvloop.EventLoopPolicy())


# -------- background tasks --------
async def sample_background_task(ctx: Worker, name: str) -> str:
    await asyncio.sleep(5)
    return f"Task {name} is complete!"


async def sync_ibm_verify_rp_applications(ctx: dict[str, Any]) -> dict[str, int]:
    if not is_in_hour_window(6, 21):
        return {"skipped": True}
    ibm_admin_client = await get_ibm_sv_admin_client()
    service = get_rp_application_service()

    async with local_session() as db:
        result = await service.sync_rp_applications_from_ibm_verify(db=db, ibm_admin_client=ibm_admin_client)

    logging.info("IBM Verify RP application sync completed: %s", result)
    return result


async def load_mau_data(ctx: dict[str, Any]) -> dict[str, bool]:
    if not is_in_hour_window(6, 17):
        return {"skipped": True}
    redis = AsyncRedis.from_url(settings.REDIS_CACHE_URL)
    try:
        service = MAUService(redis=redis)
        loaded = await service.load_yesterday_mau_if_missing()
        logging.info("MAU data loaded: %s", loaded)
        return {"loaded": loaded}
    finally:
        await redis.aclose()  # type: ignore[attr-defined]


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
