import asyncio
from typing import cast

from arq.cli import watch_reload
from arq.connections import RedisSettings
from arq.cron import CronJob
from arq.typing import WorkerSettingsType
from arq.worker import check_health, run_worker

from ...core.config import settings
from ...core.logger import logging  # noqa: F401
from .functions import on_job_end, on_job_start, shutdown, startup, sync_ibm_verify_rp_applications

REDIS_QUEUE_HOST = settings.REDIS_QUEUE_HOST
REDIS_QUEUE_PORT = settings.REDIS_QUEUE_PORT


class WorkerSettings:
    functions = [sync_ibm_verify_rp_applications]
    cron_jobs = [
        CronJob(
            "sync_ibm_verify_rp_applications",
            sync_ibm_verify_rp_applications,
            month=None,
            day=None,
            weekday=None,
            hour=None,
            minute={0, 10, 20, 30, 40, 50}, # run every 10 minutes
            second=0,
            microsecond=0,
            run_at_startup=True,
            unique=True,
            job_id=None,
            timeout_s=300.0,
            keep_result_s=None,
            keep_result_forever=None,
            max_tries=1,
        )
    ]
    redis_settings = RedisSettings(host=REDIS_QUEUE_HOST, port=REDIS_QUEUE_PORT)
    on_startup = startup
    on_shutdown = shutdown
    on_job_start = on_job_start
    on_job_end = on_job_end
    handle_signals = False


def start_arq_service(check: bool = False, burst: int | None = None, watch: str | None = None):
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
