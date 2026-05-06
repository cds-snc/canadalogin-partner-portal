import logging
from datetime import UTC, datetime

from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.config import settings
from ..core.health import check_database_health, check_redis_health

STATUS_HEALTHY = "healthy"
STATUS_UNHEALTHY = "unhealthy"

LOGGER = logging.getLogger(__name__)


class HealthService:
    async def health(self) -> tuple[int, dict[str, str]]:
        return 200, {
            "status": STATUS_HEALTHY,
            "environment": settings.ENVIRONMENT.value,
            "version": str(settings.APP_VERSION or ""),
            "timestamp": datetime.now(UTC).isoformat(timespec="seconds"),
        }

    async def ready(self, redis: Redis, db: AsyncSession) -> tuple[int, dict[str, str]]:
        database_status = await check_database_health(db=db)
        LOGGER.debug(f"Database health check status: {database_status}")
        redis_status = await check_redis_health(redis=redis)
        LOGGER.debug(f"Redis health check status: {redis_status}")

        overall_status = STATUS_HEALTHY if database_status and redis_status else STATUS_UNHEALTHY
        http_status = 200 if overall_status == STATUS_HEALTHY else 503
        return http_status, {
            "status": overall_status,
            "environment": settings.ENVIRONMENT.value,
            "version": str(settings.APP_VERSION or ""),
            "app": STATUS_HEALTHY,
            "database": STATUS_HEALTHY if database_status else STATUS_UNHEALTHY,
            "redis": STATUS_HEALTHY if redis_status else STATUS_UNHEALTHY,
            "timestamp": datetime.now(UTC).isoformat(timespec="seconds"),
        }
