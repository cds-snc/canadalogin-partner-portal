from typing import Annotated

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from ...api.dependencies import get_health_service
from ...core.db.database import async_get_db
from ...core.schemas import HealthCheck, ReadyCheck
from ...core.utils.cache import async_get_redis
from ...services.health_service import HealthService

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthCheck)
async def health(service: Annotated[HealthService, Depends(get_health_service)]):
    http_status, response = await service.health()
    return JSONResponse(status_code=http_status, content=response)


@router.get("/ready", response_model=ReadyCheck)
async def ready(
    redis: Annotated[Redis, Depends(async_get_redis)],
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[HealthService, Depends(get_health_service)],
):
    http_status, response = await service.ready(redis=redis, db=db)
    return JSONResponse(status_code=http_status, content=response)
