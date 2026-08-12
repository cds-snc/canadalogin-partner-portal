from __future__ import annotations

from contextlib import asynccontextmanager
from unittest.mock import AsyncMock, Mock, patch

import pytest
from fastapi import APIRouter, Request
from fastapi.testclient import TestClient
from pydantic import ValidationError
from starsessions.stores.memory import InMemoryStore

from src.app.api.v1.users import router as users_router
from src.app.core.config import (
    LOCAL_DEV_SESSION_FIXTURE_KEY,
    Settings,
)
from src.app.core.db.database import async_get_db
from src.app.core.local_persona_fixtures import LOCAL_PERSONA_FIXTURES
from src.app.core.setup import create_application
from src.app.services.authorization_service import ResolvedAuthorizationState
from src.app.services.oidc_service import OidcService

DEV_SESSION_PATH = "/api/v1/dev/session"
EXACT_LOCAL_CONFIG = {
    "ENVIRONMENT": "local",
    "AUTH_MODE": "local_dev",
    "ENABLE_DEV_ROLE_SELECTOR": "true",
    "OIDC_ENABLED": "false",
}
APP_METADATA = {
    "APP_NAME": "Local session test",
    "LICENSE_NAME": "MIT",
}


class _ScalarResult:
    def __init__(self, user: object | None) -> None:
        self.user = user

    def scalar_one_or_none(self) -> object | None:
        return self.user


class _StubDatabase:
    def __init__(self, *, seeded: bool = True) -> None:
        self.seeded = seeded
        self.statements: list[object] = []

    async def execute(self, statement: object) -> _ScalarResult:
        self.statements.append(statement)
        return _ScalarResult(object() if self.seeded else None)


@asynccontextmanager
async def _noop_lifespan(_app):
    yield


def _build_app(
    config: Settings,
    database: _StubDatabase,
    *,
    include_user_routes: bool = False,
):
    test_router = APIRouter()

    if include_user_routes:
        test_router.include_router(users_router, prefix="/api/v1")

    @test_router.post("/test/session/oidc")
    async def seed_oidc_session(request: Request) -> dict[str, bool]:
        request.session.clear()
        request.session.update(
            {
                "user_uuid": "019cfc22-bff2-7168-ae43-387a301d8fcb",
                "tokens": {"access_token": "fake-test-token"},
                "oidc_logout": {"sid": "fake-test-sid"},
                "oauth_state": "fake-test-state",
            }
        )
        return {"ok": True}

    @test_router.post("/test/session/unrelated")
    async def add_unrelated_session_state(request: Request) -> dict[str, bool]:
        request.session["unrelated"] = "keep"
        request.session["tokens"] = {"access_token": "later-fake-token"}
        return {"ok": True}

    @test_router.post("/test/session/mismatch")
    async def mismatch_session_user(request: Request) -> dict[str, bool]:
        request.session["user_uuid"] = "019cfc22-bff2-7168-ae43-387a301d8fcb"
        return {"ok": True}

    @test_router.get("/test/session")
    async def inspect_session(request: Request) -> dict[str, object]:
        return dict(request.session)

    with patch("src.app.core.setup.get_redis_session_store", return_value=InMemoryStore()):
        app = create_application(
            test_router,
            config,
            create_tables_on_start=False,
            lifespan=_noop_lifespan,
        )

    async def override_database():
        yield database

    app.dependency_overrides[async_get_db] = override_database
    return app


def _settings(**overrides: object) -> Settings:
    values = {**APP_METADATA, **overrides}
    if values.get("ENVIRONMENT") not in {None, "local", "test"}:
        values.setdefault("SECRET_KEY", "unit-test-shared-environment-key-000000000000")
        values.setdefault("CORS_ORIGINS", ["https://portal.example.test"])
        values.setdefault("SESSION_COOKIE_DOMAIN", ".example.test")
    return Settings(
        _env_file=None,
        **values,
    )


@pytest.mark.parametrize(
    "overrides",
    [
        {"ENVIRONMENT": "local", "AUTH_MODE": "local_dev", "ENABLE_DEV_ROLE_SELECTOR": "false"},
        {"ENVIRONMENT": "local", "AUTH_MODE": "oidc", "ENABLE_DEV_ROLE_SELECTOR": "true"},
        {"ENVIRONMENT": "dev", "AUTH_MODE": "local_dev", "ENABLE_DEV_ROLE_SELECTOR": "true"},
        {"ENVIRONMENT": "test", "AUTH_MODE": "local_dev", "ENABLE_DEV_ROLE_SELECTOR": "true"},
        {"ENVIRONMENT": "staging", "AUTH_MODE": "local_dev", "ENABLE_DEV_ROLE_SELECTOR": "true"},
        {"ENVIRONMENT": "production", "AUTH_MODE": "local_dev", "ENABLE_DEV_ROLE_SELECTOR": "true"},
        {
            "ENVIRONMENT": "local",
            "AUTH_MODE": "local_dev",
            "ENABLE_DEV_ROLE_SELECTOR": "true",
            "OIDC_ENABLED": "true",
        },
    ],
)
def test_partial_or_conflicting_local_auth_configuration_fails_closed(
    overrides: dict[str, object],
) -> None:
    with pytest.raises(ValidationError):
        _settings(**overrides)


@pytest.mark.parametrize("raw_selector", ["TRUE", "1", "yes", " true "])
def test_selector_boolean_requires_exact_configuration_spelling(raw_selector: str) -> None:
    with pytest.raises(ValidationError):
        _settings(
            ENVIRONMENT="local",
            AUTH_MODE="local_dev",
            ENABLE_DEV_ROLE_SELECTOR=raw_selector,
        )


@pytest.mark.parametrize(
    "environment",
    ["local", "dev", "test", "staging", "production"],
)
def test_dev_session_is_absent_from_normal_mode_openapi(environment: str) -> None:
    config = _settings(
        ENVIRONMENT=environment,
        AUTH_MODE="oidc",
        ENABLE_DEV_ROLE_SELECTOR="false",
        OIDC_ENABLED="false",
    )
    app = _build_app(config, _StubDatabase())

    assert DEV_SESSION_PATH not in app.openapi()["paths"]
    with TestClient(app, base_url="http://127.0.0.1:8000") as client:
        assert client.get(DEV_SESSION_PATH).status_code == 404


@pytest.mark.parametrize(
    "origin",
    ["https://portal.example.ca", "*", "http://localhost:3000/path"],
)
def test_dev_session_origin_configuration_is_limited_to_loopback_origins(
    origin: str,
) -> None:
    with pytest.raises(ValidationError):
        _settings(
            **EXACT_LOCAL_CONFIG,
            DEV_SESSION_ALLOWED_ORIGINS=[origin],
        )


def test_exact_local_composition_mounts_only_the_fixed_dev_session_contract() -> None:
    app = _build_app(_settings(**EXACT_LOCAL_CONFIG), _StubDatabase())

    operations = app.openapi()["paths"][DEV_SESSION_PATH]

    assert set(operations) == {"get", "post", "delete"}


def test_internal_route_guard_fails_closed_if_runtime_state_is_changed() -> None:
    app = _build_app(_settings(**EXACT_LOCAL_CONFIG), _StubDatabase())
    app.state.local_dev_session_gate = ("production", "oidc", False, False)

    with TestClient(app, base_url="http://127.0.0.1:8000") as client:
        response = client.get(DEV_SESSION_PATH)

    assert response.status_code == 404


def test_get_returns_safe_fixed_catalog_and_no_current_fixture_initially() -> None:
    app = _build_app(_settings(**EXACT_LOCAL_CONFIG), _StubDatabase())

    with TestClient(app, base_url="http://127.0.0.1:8000") as client:
        response = client.get(DEV_SESSION_PATH)

    assert response.status_code == 200
    assert response.json() == {
        "enabled": True,
        "currentFixtureId": None,
        "fixtures": [fixture.to_response() for fixture in LOCAL_PERSONA_FIXTURES],
    }


@pytest.mark.parametrize(
    "origin",
    [None, "http://127.0.0.1:8000", "http://localhost:3000"],
)
def test_selecting_allowlisted_fixture_uses_normal_session_shape(
    origin: str | None,
) -> None:
    database = _StubDatabase()
    app = _build_app(_settings(**EXACT_LOCAL_CONFIG), database)
    fixture = LOCAL_PERSONA_FIXTURES[1]
    headers = {"Origin": origin} if origin else {}

    with TestClient(app, base_url="http://127.0.0.1:8000") as client:
        client.post("/test/session/oidc")
        response = client.post(
            DEV_SESSION_PATH,
            json={"fixtureId": fixture.fixture_id},
            headers=headers,
        )
        session = client.get("/test/session").json()
        current = client.get(DEV_SESSION_PATH).json()

    assert response.status_code == 204
    assert session == {
        "user_uuid": str(fixture.user_uuid),
        LOCAL_DEV_SESSION_FIXTURE_KEY: fixture.fixture_id,
    }
    assert current["currentFixtureId"] == fixture.fixture_id
    assert len(database.statements) == 2
    selected_sql = str(database.statements[0])
    assert '"user".enabled IS true' in selected_sql
    assert '"user".is_deleted IS false' in selected_sql
    assert '"user".auth_provider' in selected_sql
    assert '"user".auth_subject' in selected_sql


def test_selecting_persona_rotates_into_a_host_only_authenticated_session() -> None:
    config = _settings(
        **EXACT_LOCAL_CONFIG,
        # Simulate an ambient shared-environment value from a developer .env.
        # Local composition must still issue a host-only cookie.
        SESSION_COOKIE_DOMAIN="canada.ca",
    )
    app = _build_app(config, _StubDatabase(), include_user_routes=True)
    fixture = LOCAL_PERSONA_FIXTURES[0]
    current_user = {
        "id": 1,
        "uuid": fixture.user_uuid,
        "username": fixture.email,
        "email": fixture.email,
        "name": fixture.name,
        "department_id": None,
        "tier_id": None,
    }
    authorization_service = Mock()
    authorization_service.resolve_for_user = AsyncMock(
        return_value=ResolvedAuthorizationState(global_role=fixture.global_role),
    )

    with (
        patch(
            "src.app.api.dependencies.crud_users.get",
            new=AsyncMock(return_value=current_user),
        ),
        patch(
            "src.app.api.dependencies.get_authorization_service",
            return_value=authorization_service,
        ),
    ):
        with TestClient(app, base_url="http://127.0.0.1:8000") as client:
            client.post("/test/session/oidc")
            previous_session_id = client.cookies.get("app_session")
            response = client.post(
                DEV_SESSION_PATH,
                json={"fixtureId": fixture.fixture_id},
                headers={"Origin": "http://127.0.0.1:3000"},
            )
            rotated_session_id = client.cookies.get("app_session")
            selected = client.get(DEV_SESSION_PATH)
            current = client.get("/api/v1/user/me/")

        with TestClient(
            app,
            base_url="http://127.0.0.1:8000",
            cookies={"app_session": previous_session_id or ""},
        ) as replay_client:
            replayed_session = replay_client.get("/test/session").json()
            replayed_current_user = replay_client.get("/api/v1/user/me/")

    assert response.status_code == 204
    assert "domain=" not in response.headers["set-cookie"].lower()
    assert config.SESSION_COOKIE_DOMAIN is None
    assert previous_session_id is not None
    assert rotated_session_id is not None
    assert rotated_session_id != previous_session_id
    assert selected.status_code == 200
    assert selected.json()["currentFixtureId"] == fixture.fixture_id
    assert current.status_code == 200
    assert current.json()["uuid"] == str(fixture.user_uuid)
    assert replayed_session == {}
    assert replayed_current_user.status_code == 401


@pytest.mark.parametrize("origin", ["https://evil.example", "null", "not an origin"])
def test_foreign_or_malformed_origin_is_denied_before_database_access(origin: str) -> None:
    database = _StubDatabase()
    app = _build_app(_settings(**EXACT_LOCAL_CONFIG), database)

    with TestClient(app, base_url="http://127.0.0.1:8000") as client:
        response = client.post(
            DEV_SESSION_PATH,
            json={"fixtureId": LOCAL_PERSONA_FIXTURES[0].fixture_id},
            headers={"Origin": origin},
        )

    assert response.status_code == 403
    assert database.statements == []


def test_unknown_or_client_supplied_role_never_creates_a_session() -> None:
    database = _StubDatabase()
    app = _build_app(_settings(**EXACT_LOCAL_CONFIG), database)

    with TestClient(app, base_url="http://127.0.0.1:8000") as client:
        unknown = client.post(DEV_SESSION_PATH, json={"fixtureId": "local-arbitrary"})
        arbitrary_role = client.post(
            DEV_SESSION_PATH,
            json={
                "fixtureId": LOCAL_PERSONA_FIXTURES[0].fixture_id,
                "role": "cl_admin",
            },
        )
        session = client.get("/test/session").json()

    assert unknown.status_code == 400
    assert arbitrary_role.status_code == 422
    assert session == {}
    assert database.statements == []


def test_unseeded_or_unusable_fixture_fails_without_session_mutation() -> None:
    database = _StubDatabase(seeded=False)
    app = _build_app(_settings(**EXACT_LOCAL_CONFIG), database)

    with TestClient(app, base_url="http://127.0.0.1:8000") as client:
        client.post("/test/session/oidc")
        before = client.get("/test/session").json()
        response = client.post(
            DEV_SESSION_PATH,
            json={"fixtureId": LOCAL_PERSONA_FIXTURES[0].fixture_id},
        )
        after = client.get("/test/session").json()

    assert response.status_code == 404
    assert after == before


def test_current_fixture_requires_marker_user_and_seeded_identity_to_match() -> None:
    database = _StubDatabase()
    app = _build_app(_settings(**EXACT_LOCAL_CONFIG), database)

    with TestClient(app, base_url="http://127.0.0.1:8000") as client:
        client.post(
            DEV_SESSION_PATH,
            json={"fixtureId": LOCAL_PERSONA_FIXTURES[2].fixture_id},
        )
        client.post("/test/session/mismatch")
        response = client.get(DEV_SESSION_PATH)

    assert response.status_code == 200
    assert response.json()["currentFixtureId"] is None


def test_delete_clears_only_matching_local_simulation_state() -> None:
    app = _build_app(_settings(**EXACT_LOCAL_CONFIG), _StubDatabase())
    fixture = LOCAL_PERSONA_FIXTURES[3]

    with TestClient(app, base_url="http://127.0.0.1:8000") as client:
        client.post(DEV_SESSION_PATH, json={"fixtureId": fixture.fixture_id})
        client.post("/test/session/unrelated")
        response = client.delete(DEV_SESSION_PATH)
        session = client.get("/test/session").json()

    assert response.status_code == 204
    assert session == {
        "unrelated": "keep",
        "tokens": {"access_token": "later-fake-token"},
    }


def test_delete_does_not_clear_an_oidc_session_without_local_marker() -> None:
    app = _build_app(_settings(**EXACT_LOCAL_CONFIG), _StubDatabase())

    with TestClient(app, base_url="http://127.0.0.1:8000") as client:
        client.post("/test/session/oidc")
        before = client.get("/test/session").json()
        response = client.delete(DEV_SESSION_PATH)
        after = client.get("/test/session").json()

    assert response.status_code == 204
    assert after == before


@pytest.mark.asyncio
async def test_oidc_callback_removes_local_marker_before_storing_real_session(
    mock_db,
) -> None:
    fixture = LOCAL_PERSONA_FIXTURES[0]
    request = Mock(
        session={
            "user_uuid": str(fixture.user_uuid),
            LOCAL_DEV_SESSION_FIXTURE_KEY: fixture.fixture_id,
        }
    )
    client = Mock(
        authorize_access_token=AsyncMock(
            return_value={
                "userinfo": {"sub": "real-subject", "email": "real@example.gc.ca"},
                "access_token": "fake-real-token",
            }
        ),
        server_metadata={"issuer": "https://example.test"},
    )
    real_user_uuid = "019cfc22-bff2-7168-ae43-387a301d8fcb"

    with (
        patch("src.app.services.oidc_service.get_oidc_client", return_value=client),
        patch(
            "src.app.services.oidc_service.sync_oidc_user",
            new=AsyncMock(return_value={"uuid": real_user_uuid}),
        ),
        patch("src.app.services.oidc_service.get_session_handler"),
    ):
        response = await OidcService().callback(request=request, db=mock_db)

    assert response.status_code == 307
    assert request.session["user_uuid"] == real_user_uuid
    assert LOCAL_DEV_SESSION_FIXTURE_KEY not in request.session
