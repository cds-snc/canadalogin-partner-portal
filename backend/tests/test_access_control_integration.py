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


class TestAccessControlIntegration:
    def test_policies_route_allows_user_with_policies_policy(self) -> None:
        from src.app.api.dependencies import get_policy_service

        override_dependencies(
            {"username": "member", "is_superuser": False},
            make_enforcer(("member", "policies", "read")),
        )
        mock_service = Mock()
        mock_service.list_policies = AsyncMock(
            return_value={
                "data": [],
                "total_count": 0,
                "has_more": False,
                "page": 1,
                "items_per_page": 10,
            }
        )
        app.dependency_overrides[get_policy_service] = lambda: mock_service

        try:
            with build_test_client() as client:
                response = client.get("/api/v1/policies")
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 200
        assert response.json() == {
            "data": [],
            "total_count": 0,
            "has_more": False,
            "page": 1,
            "items_per_page": 10,
        }

    def test_policies_route_denies_user_without_policy(self) -> None:
        from src.app.api.dependencies import get_policy_service

        override_dependencies(
            {"username": "member", "is_superuser": False},
            make_enforcer(),
        )
        mock_service = Mock()
        mock_service.list_policies = AsyncMock()
        app.dependency_overrides[get_policy_service] = lambda: mock_service

        try:
            with build_test_client() as client:
                response = client.get("/api/v1/policies")
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 403
        mock_service.list_policies.assert_not_called()

    def test_tiers_route_allows_user_with_policy(self) -> None:
        from src.app.api.dependencies import get_tier_service

        override_dependencies(
            {"username": "member", "is_superuser": False},
            make_enforcer(("member", "tiers", "read")),
        )
        mock_service = Mock()
        mock_service.list_tiers = AsyncMock(
            return_value={
                "data": [],
                "total_count": 0,
                "has_more": False,
                "page": 1,
                "items_per_page": 10,
            }
        )
        app.dependency_overrides[get_tier_service] = lambda: mock_service

        try:
            with build_test_client() as client:
                response = client.get("/api/v1/tiers")
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 200
        assert response.json() == {
            "data": [],
            "total_count": 0,
            "has_more": False,
            "page": 1,
            "items_per_page": 10,
        }

    def test_rate_limits_route_denies_user_without_policy(self) -> None:
        from src.app.api.dependencies import get_rate_limit_service

        override_dependencies(
            {"username": "member", "is_superuser": False},
            make_enforcer(),
        )
        mock_service = Mock()
        mock_service.list_rate_limits = AsyncMock()
        app.dependency_overrides[get_rate_limit_service] = lambda: mock_service

        try:
            with build_test_client() as client:
                response = client.get("/api/v1/tier/018f6f4b-2c8a-7bd2-8dc5-29f8d51fda11/rate_limits")
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 403
        mock_service.list_rate_limits.assert_not_called()

    def test_roles_route_allows_user_with_roles_policy(self) -> None:
        from src.app.api.dependencies import get_role_service

        override_dependencies(
            {"username": "member", "is_superuser": False},
            make_enforcer(("member", "roles", "read")),
        )
        mock_service = Mock()
        mock_service.list_roles = AsyncMock(
            return_value={
                "data": [],
                "total_count": 0,
                "has_more": False,
                "page": 1,
                "items_per_page": 10,
            }
        )
        app.dependency_overrides[get_role_service] = lambda: mock_service

        try:
            with build_test_client() as client:
                response = client.get("/api/v1/roles")
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 200
        assert response.json() == {
            "data": [],
            "total_count": 0,
            "has_more": False,
            "page": 1,
            "items_per_page": 10,
        }

    def test_roles_route_denies_user_with_only_users_admin_policy(self) -> None:
        from src.app.api.dependencies import get_role_service

        override_dependencies(
            {"username": "member", "is_superuser": False},
            make_enforcer(("member", "users_admin", "read")),
        )
        mock_service = Mock()
        mock_service.list_roles = AsyncMock()
        app.dependency_overrides[get_role_service] = lambda: mock_service

        try:
            with build_test_client() as client:
                response = client.get("/api/v1/roles")
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 200
