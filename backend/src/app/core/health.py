import logging
from uuid import uuid4

from redis.asyncio import Redis
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

LOGGER = logging.getLogger(__name__)

REDIS_HEALTH_KEY_PREFIX = "healthcheck:"


async def check_database_health(db: AsyncSession) -> bool:
    try:
        await db.execute(text("SELECT 1"))
        return True
    except Exception as e:
        LOGGER.exception(f"Database health check failed with error: {e}")
        return False


async def check_redis_health(redis: Redis) -> bool:
    try:
        test_key = f"{REDIS_HEALTH_KEY_PREFIX}{uuid4().hex}"
        test_value = "ok"
        await redis.set(test_key, test_value, ex=30)
        stored = await redis.get(test_key)
        if stored is None or stored.decode() != test_value:
            LOGGER.error("Redis health check: value mismatch after set/get")
            return False
        await redis.delete(test_key)
        return True
    except Exception as e:
        LOGGER.exception(f"Redis health check failed with error: {e}")
        return False
