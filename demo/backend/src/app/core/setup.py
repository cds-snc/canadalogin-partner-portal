from contextlib import asynccontextmanager
from typing import Any

from fastapi import APIRouter, FastAPI


async def create_redis_cache_pool() -> None:
	return None


async def create_redis_queue_pool() -> None:
	return None


async def create_redis_rate_limit_pool() -> None:
	return None


async def close_redis_cache_pool() -> None:
	return None


async def close_redis_queue_pool() -> None:
	return None


async def close_redis_rate_limit_pool() -> None:
	return None


async def create_tables() -> None:
	return None


def create_application(
	router: APIRouter,
	settings: Any | None = None,
	create_tables_on_start: bool = False,
) -> FastAPI:
	@asynccontextmanager
	async def lifespan(_app: FastAPI):
		yield

	app = FastAPI(lifespan=lifespan)
	app.include_router(router)
	return app