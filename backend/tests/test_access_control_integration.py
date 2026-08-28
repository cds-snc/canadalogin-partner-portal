from unittest.mock import AsyncMock, Mock, patch

import casbin
from fastapi.testclient import TestClient
from src.app.core.access_control import (
    CASBIN_MODEL_PATH,
    MultiSubjectEnforcer,
    database_enforcer_provider,
)
from src.app.core.db.database import async_get_db
from src.app.main import app


def make_enforcer(*policies: tuple[str, str, str]) -> MultiSubjectEnforcer:
    enforcer = casbin.Enforcer(str(CASBIN_MODEL_PATH))
    if policies:
        enforcer.add_policies(list(policies))
    return MultiSubjectEnforcer(enforcer)


def override_dependencies(current_user: dict, enforcer: MultiSubjectEnforcer) -> None:
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
    def test_authorization_policy_routes_are_retired(self) -> None:
        try:
            with build_test_client() as client:
                responses = (
                    client.get("/api/v1/policies"),
                    client.post("/api/v1/policy", json={"subject": "cl_admin"}),
                    client.patch(
                        "/api/v1/policy/018f6f83-0000-0000-0000-000000000001",
                        json={"subject": "cl_admin"},
                    ),
                    client.delete("/api/v1/policy/018f6f83-0000-0000-0000-000000000001"),
                )
        finally:
            app.dependency_overrides.clear()

        assert {response.status_code for response in responses} == {404}

    def test_department_reference_reads_remain_without_catalog_mutations(self) -> None:
        paths = app.openapi()["paths"]

        assert set(paths["/api/v1/departments"]) == {"get"}
        assert set(paths["/api/v1/department/{department_uuid}"]) == {"get"}
        assert set(paths["/api/v1/departments/by-id/{department_id}"]) == {"get"}
        assert "/api/v1/department" not in paths

    def test_user_directory_is_read_only_outside_invitation_and_access_routes(self) -> None:
        paths = app.openapi()["paths"]

        assert "/api/v1/user" not in paths
        assert set(paths["/api/v1/user/{user_uuid}"]) == {"get"}
        assert set(paths["/api/v1/users/{user_uuid}/access"]) == {"get"}
        assert set(paths["/api/v1/users/invitation-target-resolution"]) == {"post"}

    def test_tier_catalog_routes_are_retired(self) -> None:
        override_dependencies(
            {
                "authorization_context": {
                    "globalRole": "cl_admin",
                    "partnerAccess": [],
                }
            },
            make_enforcer(),
        )

        try:
            with build_test_client() as client:
                responses = (
                    client.get("/api/v1/tiers"),
                    client.post("/api/v1/tier", json={"name": "retired"}),
                    client.patch(
                        "/api/v1/tier/018f6f4b-2c8a-7bd2-8dc5-29f8d51fda11",
                        json={"name": "retired"},
                    ),
                    client.delete("/api/v1/tier/018f6f4b-2c8a-7bd2-8dc5-29f8d51fda11"),
                )
        finally:
            app.dependency_overrides.clear()

        assert {response.status_code for response in responses} == {404}

    def test_rate_limit_catalog_routes_are_retired(self) -> None:
        override_dependencies(
            {
                "authorization_context": {
                    "globalRole": None,
                    "partnerAccess": [
                        {
                            "workspaceUuid": "018f6f83-0000-0000-0000-000000000010",
                            "role": "read_only",
                        }
                    ],
                }
            },
            make_enforcer(),
        )
        try:
            with build_test_client() as client:
                responses = (
                    client.get("/api/v1/tier/018f6f4b-2c8a-7bd2-8dc5-29f8d51fda11/rate_limits"),
                    client.post(
                        "/api/v1/tier/018f6f4b-2c8a-7bd2-8dc5-29f8d51fda11/rate_limit",
                        json={},
                    ),
                    client.get("/api/v1/user/018f6f4b-2c8a-7bd2-8dc5-29f8d51fda11/rate_limits"),
                    client.get("/api/v1/user/018f6f4b-2c8a-7bd2-8dc5-29f8d51fda11/tier"),
                    client.patch(
                        "/api/v1/user/018f6f4b-2c8a-7bd2-8dc5-29f8d51fda11/tier",
                        json={},
                    ),
                )
        finally:
            app.dependency_overrides.clear()

        assert {response.status_code for response in responses} == {404}

    def test_roles_route_returns_only_immutable_canonical_reference(self) -> None:
        override_dependencies(
            {
                "authorization_context": {
                    "globalRole": None,
                    "partnerAccess": [],
                }
            },
            make_enforcer(),
        )

        try:
            with build_test_client() as client:
                response = client.get("/api/v1/roles")
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 200
        assert response.json() == [
            {"code": "cl_admin", "scope": "global"},
            {"code": "rp_admin", "scope": "workspace"},
            {"code": "rp_user_edit", "scope": "workspace"},
            {"code": "read_only", "scope": "workspace"},
        ]

    def test_role_definition_mutation_routes_are_retired(self) -> None:
        override_dependencies(
            {
                "authorization_context": {
                    "globalRole": "cl_admin",
                    "partnerAccess": [],
                }
            },
            make_enforcer(("cl_admin", "roles", "read")),
        )

        try:
            with build_test_client() as client:
                responses = (
                    client.post(
                        "/api/v1/role",
                        json={"name": "Arbitrary", "description": "not allowed"},
                    ),
                    client.patch(
                        "/api/v1/role/cl_admin",
                        json={"name": "Renamed"},
                    ),
                    client.delete("/api/v1/role/cl_admin"),
                )
        finally:
            app.dependency_overrides.clear()

        assert [response.status_code for response in responses] == [404, 405, 405]
