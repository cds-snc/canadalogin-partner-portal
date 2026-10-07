import asyncio
from typing import Any, cast

from arq.cli import watch_reload
from arq.connections import RedisSettings
from arq.typing import WorkerSettingsType
from arq.worker import check_health, run_worker

from ...core.config import settings
from ...core.logger import logging  # noqa: F401
from .functions import on_job_end, on_job_start, shutdown, startup

REDIS_QUEUE_HOST = settings.REDIS_QUEUE_HOST or "localhost"
REDIS_QUEUE_PORT = settings.REDIS_QUEUE_PORT or 6379
REDIS_QUEUE_PASSWORD = settings.REDIS_QUEUE_PASSWORD.get_secret_value() if settings.REDIS_QUEUE_PASSWORD else None
REDIS_QUEUE_SSL = settings.REDIS_QUEUE_SSL or False
REDIS_QUEUE_DB = settings.REDIS_QUEUE_DB or 0


class WorkerSettings:
    functions: list[Any] = []
    cron_jobs: list[Any] = []
    redis_settings = RedisSettings(
        host=REDIS_QUEUE_HOST,
        port=REDIS_QUEUE_PORT,
        database=REDIS_QUEUE_DB,
        password=REDIS_QUEUE_PASSWORD,
        ssl=REDIS_QUEUE_SSL,
    )
    on_startup = startup
    on_shutdown = shutdown
    on_job_start = on_job_start
    on_job_end = on_job_end
    handle_signals = False


def start_arq_service(check: bool = False, burst: int | None = None, watch: str | None = None):
    if not WorkerSettings.functions and not WorkerSettings.cron_jobs:
        logging.info("No ARQ jobs configured; skipping worker startup")
        return

    worker_settings_ = cast("WorkerSettingsType", WorkerSettings)

    if check:
        exit(check_health(worker_settings_))
    else:
        kwargs = {} if burst is None else {"burst": burst}
        if watch:
            asyncio.run(watch_reload(watch, worker_settings_))
        else:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                run_worker(worker_settings_, **kwargs)
            finally:
                asyncio.set_event_loop(None)
                loop.close()


if __name__ == "__main__":
    start_arq_service()
    # python -m src.app.core.worker.settings
