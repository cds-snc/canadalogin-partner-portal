from collections.abc import Callable, Generator
from contextlib import ExitStack
from typing import Any
from unittest.mock import AsyncMock, Mock, patch

import pytest
from faker import Faker
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.orm.session import Session
from starsessions import InMemoryStore

from src.app.core.config import settings
from src.app.main import app

DATABASE_URI = settings.POSTGRES_URI
DATABASE_PREFIX = settings.POSTGRES_SYNC_PREFIX


def _create_local_session() -> tuple[Any, Any]:
    """Create sync engine and session factory lazily for DB-dependent tests."""
    try:
        sync_engine = create_engine(DATABASE_PREFIX + DATABASE_URI)
        local_session = sessionmaker(autocommit=False, autoflush=False, bind=sync_engine)
        return sync_engine, local_session
    except (ImportError, OSError) as exc:
        pytest.skip(f"Database client libraries unavailable for test session: {exc}")


fake = Faker()


@pytest.fixture(scope="session", autouse=True)
def mock_redis_services() -> Generator[None, Any, None]:
    """Mock Redis-dependent startup hooks so tests run without a live Redis service."""
    with ExitStack() as stack:
        stack.enter_context(patch("src.app.core.setup.create_redis_cache_pool", new=AsyncMock()))
        stack.enter_context(patch("src.app.core.setup.close_redis_cache_pool", new=AsyncMock()))
        stack.enter_context(patch("src.app.core.setup.create_redis_queue_pool", new=AsyncMock()))
        stack.enter_context(patch("src.app.core.setup.close_redis_queue_pool", new=AsyncMock()))
        stack.enter_context(patch("src.app.core.setup.create_redis_rate_limit_pool", new=AsyncMock()))
        stack.enter_context(patch("src.app.core.setup.close_redis_rate_limit_pool", new=AsyncMock()))
        stack.enter_context(patch("src.app.core.setup.create_redis_session_pool", new=AsyncMock()))
        stack.enter_context(patch("src.app.core.setup.close_redis_session_pool", new=AsyncMock()))
        stack.enter_context(patch("src.app.core.setup.get_redis_session_store", return_value=InMemoryStore()))
        yield


@pytest.fixture(autouse=True)
def suppress_arq_startup_in_tests(request) -> Generator[None, Any, None]:
    """Avoid background ARQ worker startup in tests that do not explicitly verify it."""
    if request.node.nodeid.startswith("tests/test_session_setup.py"):
        yield
        return

    with patch("src.app.core.setup.start_arq_service_on_startup", new=Mock()):
        yield


@pytest.fixture(scope="session")
def client(mock_redis_services) -> Generator[TestClient, Any, None]:
    sync_engine, _ = _create_local_session()
    with TestClient(app) as _client:
        yield _client
    app.dependency_overrides = {}
    sync_engine.dispose()


@pytest.fixture
def db() -> Generator[Session, Any, None]:
    sync_engine, local_session = _create_local_session()
    session = local_session()
    yield session
    session.close()
    sync_engine.dispose()


def override_dependency(dependency: Callable[..., Any], mocked_response: Any) -> None:
    app.dependency_overrides[dependency] = lambda: mocked_response


@pytest.fixture
def mock_db():
    """Mock database session for unit tests."""
    return Mock(spec=AsyncSession)


@pytest.fixture
def mock_redis():
    """Mock Redis connection for unit tests."""
    mock_redis = Mock()
    mock_redis.get = AsyncMock(return_value=None)
    mock_redis.set = AsyncMock(return_value=True)
    mock_redis.delete = AsyncMock(return_value=True)
    return mock_redis


@pytest.fixture
def sample_user_data():
    """Generate sample user data for tests."""
    email = fake.email()
    return {
        "name": fake.name(),
        "email": email,
    }


@pytest.fixture
def sample_user_read():
    """Generate a sample UserRead object."""
    from uuid6 import uuid7

    from src.app.schemas.user import UserRead

    email = fake.email()

    return UserRead(
        uuid=uuid7(),
        name=fake.name(),
        username=email,
        email=email,
        profile_image_url=fake.image_url(),
        role_uuids=[],
        tier_uuid=None,
    )


@pytest.fixture
def current_user_dict():
    """Mock current user from auth dependency."""
    from uuid6 import uuid7

    email = fake.email()

    return {
        "id": 1,
        "uuid": uuid7(),
        "username": email,
        "email": email,
        "name": fake.name(),
        "is_superuser": False,
    }
