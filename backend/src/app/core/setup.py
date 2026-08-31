from asyncio import Event
from collections.abc import AsyncGenerator, Callable
from contextlib import _AsyncGeneratorContextManager, asynccontextmanager
from typing import Any, cast

import fastapi
import redis.asyncio as redis
from anyio.to_thread import current_default_thread_limiter
from arq import create_pool
from arq.connections import RedisSettings
from fastapi import APIRouter, Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_redoc_html, get_swagger_ui_html
from fastapi.openapi.utils import get_openapi
from starsessions import SessionAutoloadMiddleware, SessionMiddleware
from starsessions.stores.redis import RedisStore

from ..api.dependencies import get_current_superuser
from ..core.logger import logging
from ..core.utils.rate_limit import rate_limiter
from ..middleware.client_cache_middleware import ClientCacheMiddleware
from ..middleware.logger_middleware import LoggerMiddleware
from ..models import *  # noqa: F403
from ..repositories.dependencies import close_ibm_sv_admin_client as close_ibm_sv_admin_client_dep
from ..repositories.dependencies import set_ibm_sv_admin_client
from ..repositories.ibm_sv_admin import IBMVerifyAdminClient, create_admin_oauth_client
from .exceptions import register_exception_handlers

logger = logging.getLogger(__name__)

from ..models import *  # noqa: F403
from .config import (
    AppSettings,
    ClientSideCacheSettings,
    CORSSettings,
    DatabaseSettings,
    EnvironmentOption,
    EnvironmentSettings,
    IBMVerifySettings,
    OIDCSettings,
    RedisCacheSettings,
    RedisQueueSettings,
    RedisRateLimiterSettings,
    RedisSessionSettings,
    SessionSettings,
    settings,
)
from .db.database import Base, get_async_engine
from .oidc import warm_oidc_metadata
from .utils import cache, queue

redis_session_client: redis.Redis | None = None
redis_session_store: RedisStore | None = None


# -------------- database --------------
async def create_tables() -> None:
    logger.info("Creating database tables...")
    async with get_async_engine().begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables created successfully")


# -------------- cache --------------
async def create_redis_cache_pool() -> None:
    logger.info("Creating Redis cache pool...")
    cache.pool = redis.ConnectionPool.from_url(settings.REDIS_CACHE_URL)
    cache.client = redis.Redis.from_pool(cache.pool)  # type: ignore
    logger.info("Redis cache pool created")


async def close_redis_cache_pool() -> None:
    if cache.client is not None:
        logger.info("Closing Redis cache pool...")
        await cache.client.aclose()  # type: ignore
        logger.info("Redis cache pool closed")


# -------------- queue --------------
async def create_redis_queue_pool() -> None:
    logger.info("Creating Redis queue pool...")
    queue.pool = await create_pool(
        RedisSettings(
            host=settings.REDIS_QUEUE_HOST or "localhost",
            port=settings.REDIS_QUEUE_PORT or 6379,
            database=settings.REDIS_QUEUE_DB or 0,
            password=settings.REDIS_QUEUE_PASSWORD.get_secret_value() if settings.REDIS_QUEUE_PASSWORD else None,
            ssl=settings.REDIS_QUEUE_SSL or False,
        )
    )
    logger.info("Redis queue pool created")


async def close_redis_queue_pool() -> None:
    if queue.pool is not None:
        logger.info("Closing Redis queue pool...")
        await queue.pool.aclose()  # type: ignore
        logger.info("Redis queue pool closed")


# -------------- rate limit --------------
async def create_redis_rate_limit_pool() -> None:
    logger.info("Creating Redis rate limiter...")
    rate_limiter.initialize(settings.REDIS_RATE_LIMIT_URL)  # type: ignore
    logger.info("Redis rate limiter initialized")


async def close_redis_rate_limit_pool() -> None:
    if rate_limiter.client is not None:
        logger.info("Closing Redis rate limiter...")
        await rate_limiter.client.aclose()  # type: ignore
        logger.info("Redis rate limiter closed")


# -------------- session store --------------
def get_redis_session_store() -> RedisStore:
    global redis_session_client, redis_session_store

    if redis_session_store is None:
        logger.info("Creating Redis session store...")
        redis_session_client = redis.Redis.from_url(settings.REDIS_SESSION_URL)
        redis_session_store = RedisStore(
            connection=redis_session_client,
            prefix=settings.REDIS_SESSION_PREFIX,
            gc_ttl=settings.REDIS_SESSION_GC_TTL,
        )
        logger.info("Redis session store created")

    return redis_session_store


async def create_redis_session_pool() -> None:
    get_redis_session_store()


async def close_redis_session_pool() -> None:
    global redis_session_client, redis_session_store

    if redis_session_client is not None:
        logger.info("Closing Redis session store...")
        await cast(Any, redis_session_client).aclose()
        redis_session_client = None
        redis_session_store = None
        logger.info("Redis session store closed")


# -------------- IBM Security Verify --------------
async def create_ibm_sv_admin_client() -> None:
    logger.info("Creating IBM Security Verify admin client...")
    try:
        oauth_client = await create_admin_oauth_client()
    except ValueError as exc:
        # In test environments the IBM SV admin base URL may not be configured.
        # Avoid failing application startup; log and skip creating the client.
        logger.warning("IBM SV admin client not configured: %s", exc)
        return
    if oauth_client.token is None or oauth_client.token.is_expired():
        await oauth_client.fetch_token()

    client = IBMVerifyAdminClient(oauth_client)
    set_ibm_sv_admin_client(client)
    logger.info("IBM Security Verify admin client created")


async def close_ibm_sv_admin_client() -> None:
    logger.info("Closing IBM Security Verify admin client...")
    await close_ibm_sv_admin_client_dep()
    logger.info("IBM Security Verify admin client closed")



# -------------- application --------------
async def set_threadpool_tokens(number_of_tokens: int = 100) -> None:
    limiter = current_default_thread_limiter()
    limiter.total_tokens = number_of_tokens


def lifespan_factory(
    settings: (
        DatabaseSettings
        | RedisCacheSettings
        | AppSettings
        | ClientSideCacheSettings
        | CORSSettings
        | RedisQueueSettings
        | RedisRateLimiterSettings
        | RedisSessionSettings
        | EnvironmentSettings
        | SessionSettings
        | OIDCSettings
        | IBMVerifySettings
    ),
    create_tables_on_start: bool = False,
) -> Callable[[FastAPI], _AsyncGeneratorContextManager[Any]]:
    """Factory to create a lifespan async context manager for a FastAPI app."""

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncGenerator:
        logger.info("Starting application...")
        initialization_complete = Event()
        app.state.initialization_complete = initialization_complete

        await set_threadpool_tokens()

        try:
            if isinstance(settings, RedisCacheSettings):
                await create_redis_cache_pool()

            if isinstance(settings, RedisQueueSettings):
                await create_redis_queue_pool()

            if isinstance(settings, RedisRateLimiterSettings):
                await create_redis_rate_limit_pool()

            if isinstance(settings, RedisSessionSettings):
                await create_redis_session_pool()

            if isinstance(settings, IBMVerifySettings):
                await create_ibm_sv_admin_client()

            if isinstance(settings, OIDCSettings):
                try:
                    await warm_oidc_metadata()
                except Exception:
                    logger.exception("Failed to warm OIDC discovery metadata on startup")

            if create_tables_on_start:
                await create_tables()

            initialization_complete.set()
            logger.info("Application started successfully")

            yield

        finally:
            logger.info("Shutting down application...")

            if isinstance(settings, RedisCacheSettings):
                await close_redis_cache_pool()

            if isinstance(settings, RedisQueueSettings):
                await close_redis_queue_pool()

            if isinstance(settings, RedisRateLimiterSettings):
                await close_redis_rate_limit_pool()

            if isinstance(settings, RedisSessionSettings):
                await close_redis_session_pool()

            if isinstance(settings, IBMVerifySettings):
                await close_ibm_sv_admin_client()

            logger.info("Application shutdown complete")

    return lifespan


# -------------- application --------------
def create_application(
    router: APIRouter,
    settings: (
        DatabaseSettings
        | RedisCacheSettings
        | AppSettings
        | ClientSideCacheSettings
        | CORSSettings
        | RedisQueueSettings
        | RedisRateLimiterSettings
        | RedisSessionSettings
        | EnvironmentSettings
        | SessionSettings
        | OIDCSettings
        | IBMVerifySettings
    ),
    create_tables_on_start: bool = True,
    lifespan: Callable[[FastAPI], _AsyncGeneratorContextManager[Any]] | None = None,
    **kwargs: Any,
) -> FastAPI:
    """Creates and configures a FastAPI application based on the provided settings.

    This function initializes a FastAPI application and configures it with various settings
    and handlers based on the type of the `settings` object provided.

    Parameters
    ----------
    router : APIRouter
        The APIRouter object containing the routes to be included in the FastAPI application.

    settings
        An instance representing the settings for configuring the FastAPI application.
        It determines the configuration applied:

        - AppSettings: Configures basic app metadata like name, description, contact, and license info.
        - DatabaseSettings: Adds event handlers for initializing database tables during startup.
        - RedisCacheSettings: Sets up event handlers for creating and closing a Redis cache pool.
        - ClientSideCacheSettings: Integrates middleware for client-side caching.
        - CORSSettings: Integrates CORS middleware with specified origins.
        - RedisQueueSettings: Sets up event handlers for creating and closing a Redis queue pool.
        - RedisRateLimiterSettings: Sets up event handlers for creating and closing a Redis rate limiter pool.
        - EnvironmentSettings: Conditionally sets documentation URLs and integrates custom routes for API documentation
          based on the environment type.

    create_tables_on_start : bool
        A flag to indicate whether to create database tables on application startup.
        Defaults to True.

    **kwargs
        Additional keyword arguments passed directly to the FastAPI constructor.

    Returns
    -------
    FastAPI
        A fully configured FastAPI application instance.

    The function configures the FastAPI application with different features and behaviors
    based on the provided settings. It includes setting up database connections, Redis pools
    for caching, queue, and rate limiting, client-side caching, and customizing the API documentation
    based on the environment settings.
    """
    # --- before creating application ---
    if isinstance(settings, AppSettings):
        to_update = {
            "title": settings.APP_NAME,
            "description": settings.APP_DESCRIPTION,
            "contact": {"name": settings.CONTACT_NAME, "email": settings.CONTACT_EMAIL},
            "license_info": {"name": settings.LICENSE_NAME},
        }
        kwargs.update(to_update)

    if isinstance(settings, EnvironmentSettings):
        kwargs.update({"docs_url": None, "redoc_url": None, "openapi_url": None})

    # Use custom lifespan if provided, otherwise use default factory
    if lifespan is None:
        lifespan = lifespan_factory(
            settings,
            create_tables_on_start=create_tables_on_start,
        )

    application = FastAPI(lifespan=lifespan, **kwargs)
    application.include_router(router)

    if isinstance(settings, SessionSettings):
        application.add_middleware(SessionAutoloadMiddleware)
        application.add_middleware(
            SessionMiddleware,
            store=get_redis_session_store(),
            lifetime=settings.SESSION_MAX_AGE,
            rolling=settings.SESSION_ROLLING,
            cookie_name=settings.SESSION_COOKIE_NAME,
            cookie_https_only=settings.SESSION_COOKIE_SECURE,
            cookie_domain=settings.SESSION_COOKIE_DOMAIN,
            cookie_same_site=settings.SESSION_COOKIE_SAMESITE
        )

    if isinstance(settings, ClientSideCacheSettings):
        application.add_middleware(ClientCacheMiddleware, max_age=settings.CLIENT_CACHE_MAX_AGE)

    if isinstance(settings, CORSSettings):
        application.add_middleware(
            CORSMiddleware,
            allow_origins=settings.CORS_ORIGINS,
            allow_credentials=True,
            allow_methods=settings.CORS_METHODS,
            allow_headers=settings.CORS_HEADERS,
        )
    register_exception_handlers(application)

    application.add_middleware(LoggerMiddleware)
    if isinstance(settings, EnvironmentSettings):
        if settings.ENVIRONMENT != EnvironmentOption.PRODUCTION:
            docs_router = APIRouter()
            if settings.ENVIRONMENT != EnvironmentOption.LOCAL:
                docs_router = APIRouter(dependencies=[Depends(get_current_superuser)])

            @docs_router.get("/docs", include_in_schema=False)
            async def get_swagger_documentation() -> fastapi.responses.HTMLResponse:
                return get_swagger_ui_html(openapi_url="/openapi.json", title="docs")

            @docs_router.get("/redoc", include_in_schema=False)
            async def get_redoc_documentation() -> fastapi.responses.HTMLResponse:
                return get_redoc_html(openapi_url="/openapi.json", title="docs")

            @docs_router.get("/openapi.json", include_in_schema=False)
            async def openapi() -> dict[str, Any]:
                out: dict = get_openapi(title=application.title, version=application.version, routes=application.routes)
                return out

            application.include_router(docs_router)

    return application
