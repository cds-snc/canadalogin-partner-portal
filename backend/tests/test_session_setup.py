from unittest.mock import AsyncMock, patch

import pytest
from fastapi import APIRouter, FastAPI
from starlette.middleware.sessions import SessionMiddleware as StarletteSessionMiddleware
from starsessions import SessionAutoloadMiddleware, SessionMiddleware

from src.app.core.config import settings
from src.app.core.setup import create_application, lifespan_factory


class TestSessionMiddlewareSetup:
    def test_create_application_uses_starsessions_middleware(self) -> None:
        app = create_application(APIRouter(), settings, create_tables_on_start=False)

        middleware_classes = [middleware.cls for middleware in app.user_middleware]

        assert SessionMiddleware in middleware_classes
        assert SessionAutoloadMiddleware in middleware_classes
        assert StarletteSessionMiddleware not in middleware_classes


class TestSessionLifespan:
    @pytest.mark.asyncio
    async def test_lifespan_initializes_and_closes_session_redis(self) -> None:
        app = FastAPI()
        lifespan = lifespan_factory(settings, create_tables_on_start=False)

        with (
            patch("src.app.core.setup.create_redis_cache_pool", new=AsyncMock()) as mock_cache_create,
            patch("src.app.core.setup.create_redis_queue_pool", new=AsyncMock()) as mock_queue_create,
            patch("src.app.core.setup.create_redis_rate_limit_pool", new=AsyncMock()) as mock_rate_limit_create,
            patch("src.app.core.setup.create_redis_session_pool", new=AsyncMock(), create=True) as mock_session_create,
            patch("src.app.core.setup.close_redis_cache_pool", new=AsyncMock()) as mock_cache_close,
            patch("src.app.core.setup.close_redis_queue_pool", new=AsyncMock()) as mock_queue_close,
            patch("src.app.core.setup.close_redis_rate_limit_pool", new=AsyncMock()) as mock_rate_limit_close,
            patch("src.app.core.setup.close_redis_session_pool", new=AsyncMock(), create=True) as mock_session_close,
        ):
            async with lifespan(app):
                assert app.state.initialization_complete.is_set()

        mock_cache_create.assert_awaited_once()
        mock_queue_create.assert_awaited_once()
        mock_rate_limit_create.assert_awaited_once()
        mock_session_create.assert_awaited_once()
        mock_cache_close.assert_awaited_once()
        mock_queue_close.assert_awaited_once()
        mock_rate_limit_close.assert_awaited_once()
        mock_session_close.assert_awaited_once()
