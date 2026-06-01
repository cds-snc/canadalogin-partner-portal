from unittest.mock import AsyncMock, Mock, patch

import casbin
from fastapi.testclient import TestClient

from src.app.core.access_control import CASBIN_MODEL_PATH, database_enforcer_provider
from src.app.core.db.database import async_get_db
from src.app.main import app


def make_enforcer(*policies: tuple[str, str, str]) -> casbin.Enforcer:
	enforcer = casbin.Enforcer(str(CASBIN_MODEL_PATH))
	if policies:
		enforcer.add_policies(list(policies))
	return enforcer


def override_dependencies(current_user: dict, enforcer: casbin.Enforcer) -> None:
	from src.app.api.dependencies import get_current_user

	app.dependency_overrides[get_current_user] = lambda: current_user
	app.dependency_overrides[database_enforcer_provider] = lambda: enforcer
	app.dependency_overrides[async_get_db] = lambda: Mock()


def build_test_client() -> TestClient:
	stack = [
		patch("src.app.core.setup.create_redis_cache_pool", new=AsyncMock()),
		patch("src.app.core.setup.create_redis_queue_pool", new=AsyncMock()),
		patch("src.app.core.setup.create_redis_rate_limit_pool", new=AsyncMock()),
		patch("src.app.core.setup.close_redis_cache_pool", new=AsyncMock()),
		patch("src.app.core.setup.close_redis_queue_pool", new=AsyncMock()),
		patch("src.app.core.setup.close_redis_rate_limit_pool", new=AsyncMock()),
		patch("src.app.core.setup.create_tables", new=AsyncMock()),
	]

	for ctx in stack:
		ctx.start()

	client = TestClient(app)

	class ManagedClient:
		def __enter__(self):
			self._client = client.__enter__()
			return self._client

		def __exit__(self, exc_type, exc_val, exc_tb):
			try:
				return client.__exit__(exc_type, exc_val, exc_tb)
			finally:
				for ctx in reversed(stack):
					ctx.stop()

	return ManagedClient()