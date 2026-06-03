from unittest.mock import AsyncMock

import pytest
from fastapi.testclient import TestClient

from src.app.main import app


@pytest.fixture
def mock_db() -> AsyncMock:
	return AsyncMock()


@pytest.fixture
def mock_redis() -> AsyncMock:
	redis = AsyncMock()
	redis.scan = AsyncMock(return_value=(0, []))
	redis.delete = AsyncMock(return_value=0)
	return redis


@pytest.fixture
def client() -> TestClient:
	with TestClient(app) as test_client:
		yield test_client
	app.dependency_overrides = {}