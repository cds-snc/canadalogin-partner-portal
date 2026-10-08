from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from unittest.mock import AsyncMock, Mock, patch
from urllib.parse import parse_qs, urlparse

import pytest
from fastapi import APIRouter
from fastapi.testclient import TestClient
from starlette.requests import Request
from starsessions import InMemoryStore

from src.app.api.dependencies import get_auth_service
from src.app.api.v1 import router as api_v1_router
from src.app.api.v1.logout import logout
from src.app.api.v1.logout import router as logout_router
from src.app.core.config import settings
from src.app.core.db.database import async_get_db
from src.app.core.setup import create_application
from src.app.schemas.auth import LogoutOidcResponse, LogoutResponse
from src.app.services.auth_service import AuthService
from src.app.services.oidc_logout_service import OidcLogoutService


def make_request(session: dict | None = None) -> Request:
    return Request(
        {
            "type": "http",
            "method": "POST",
            "path": "/api/v1/logout",
            "headers": [],
            "session": session or {},
        }
    )


class TestLogoutEndpoint:
    @pytest.mark.asyncio
    async def test_logout_route_delegates_to_service(self, mock_db):
        request = make_request(session={"user_uuid": "019cfc22-bff2-7168-ae43-387a301d8fcb"})
        mock_service = Mock()
        mock_service.logout = AsyncMock(return_value={"message": "Logged out successfully", "clear_cookies": True})

        result = await logout(request, mock_service)

        assert result == LogoutResponse(
            message="Logged out successfully",
            redirect_url=settings.OIDC_POST_LOGOUT_REDIRECT_URI,
        )
        mock_service.logout.assert_awaited_once_with(request=request, state=None)

    @pytest.mark.asyncio
    async def test_logout_returns_oidc_logout_details_when_service_provides_them(self, mock_db):
        request = make_request(session={"user_uuid": "019cfc22-bff2-7168-ae43-387a301d8fcb"})
        mock_service = Mock()
        mock_service.logout = AsyncMock(
            return_value={
                "message": "Logged out successfully",
                "clear_cookies": True,
                "oidc_logout": {
                    "end_session_endpoint": "https://example.verify.ibm.com/logout",
                    "id_token_hint": "id-token-value",
                    "post_logout_redirect_uri": "https://portal.example.gc.ca/logout-complete",
                    "state": "manual.opaque-state",
                },
            }
        )

        result = await logout(request, mock_service, reason="manual")

        assert result == LogoutResponse(
            message="Logged out successfully",
            oidc_logout=LogoutOidcResponse(
                end_session_endpoint="https://example.verify.ibm.com/logout",
                id_token_hint="id-token-value",
                post_logout_redirect_uri="https://portal.example.gc.ca/logout-complete",
                state="manual.opaque-state",
            ),
            redirect_url=(
                "https://example.verify.ibm.com/logout?id_token_hint=id-token-value"
                "&post_logout_redirect_uri=https%3A%2F%2Fportal.example.gc.ca%2Flogout-complete"
                "&state=manual.opaque-state"
            ),
        )
        mock_service.logout.assert_awaited_once()
        service_state = mock_service.logout.await_args.kwargs["state"]
        assert service_state.startswith("manual.")


class TrackingInMemoryStore(InMemoryStore):
    def __init__(self) -> None:
        super().__init__()
        self.removed_session_ids: list[str] = []

    async def remove(self, session_id: str) -> None:
        self.removed_session_ids.append(session_id)
        await super().remove(session_id)


class FakeConcurrentSessionService:
    def __init__(self, store: TrackingInMemoryStore) -> None:
        self.store = store

    async def remove_session(self, session_id: str) -> None:
        await self.store.remove(session_id)


def build_logout_app(store: TrackingInMemoryStore) -> TestClient:
    router = APIRouter()

    @router.post("/session-login")
    async def session_login(request: Request) -> dict[str, str]:
        request.session["user_uuid"] = "019cfc22-bff2-7168-ae43-387a301d8fcb"
        return {"message": "logged in"}

    @router.post("/session-denied")
    async def session_denied(request: Request) -> dict[str, str]:
        request.session["ui_locales"] = "en"
        return {"message": "denied"}

    @router.post("/session-pre-auth")
    async def session_pre_auth(request: Request) -> dict[str, str]:
        request.session["_state_oidc_pending"] = {
            "data": {"nonce": "pending-nonce"},
            "exp": 0,
        }
        request.session["nonce"] = "pending-nonce"
        return {"message": "pre-authentication state created"}

    @router.post("/session-denied-oidc")
    async def session_denied_oidc(request: Request) -> dict[str, str]:
        request.session["oidc_logout"] = {"id_token": "id-token-value"}
        return {"message": "denied OIDC session created"}

    @router.post("/api/v1/auth/oidc/backchannel-logout")
    async def backchannel_logout() -> dict[str, str]:
        return {"message": "backchannel logout received"}

    router.include_router(logout_router)

    @asynccontextmanager
    async def noop_lifespan(_: object) -> AsyncIterator[None]:
        yield

    with (
        patch("src.app.core.setup.get_redis_session_store", return_value=store),
        patch.object(settings, "SESSION_COOKIE_DOMAIN", None),
        patch.object(settings, "CORS_ORIGINS", ["https://portal.example.gc.ca"]),
    ):
        app = create_application(router, settings=settings, create_tables_on_start=False, lifespan=noop_lifespan)

    app.dependency_overrides[get_auth_service] = lambda: AuthService(
        logout_service=OidcLogoutService(store=store),
        session_service=FakeConcurrentSessionService(store),
    )
    app.dependency_overrides[async_get_db] = lambda: Mock()
    return TestClient(app)


def build_csrf_api_app(store: TrackingInMemoryStore) -> TestClient:
    router = APIRouter(prefix="/api")
    router.include_router(api_v1_router)

    @asynccontextmanager
    async def noop_lifespan(_: object) -> AsyncIterator[None]:
        yield

    with (
        patch("src.app.core.setup.get_redis_session_store", return_value=store),
        patch.object(settings, "SESSION_COOKIE_DOMAIN", None),
        patch.object(settings, "CSRF_COOKIE_DOMAIN", None),
        patch.object(settings, "CORS_ORIGINS", ["https://portal.example.gc.ca"]),
    ):
        app = create_application(router, settings=settings, create_tables_on_start=False, lifespan=noop_lifespan)

    return TestClient(app)


def csrf_headers(client: TestClient) -> dict[str, str]:
    csrf_token = client.cookies.get(settings.CSRF_COOKIE_NAME)
    assert csrf_token
    return {"x-csrftoken": csrf_token}


class TestCsrfProtection:
    def test_csrf_endpoint_sets_readable_noncacheable_cookie(self) -> None:
        with build_csrf_api_app(TrackingInMemoryStore()) as client:
            response = client.get("/api/v1/csrf")

        assert response.status_code == 204
        assert response.headers["cache-control"] == "no-store"
        assert client.cookies.get(settings.CSRF_COOKIE_NAME)
        assert "httponly" not in response.headers["set-cookie"].lower()

    def test_session_cookie_requests_require_the_matching_csrf_token(self) -> None:
        store = TrackingInMemoryStore()

        with build_logout_app(store) as client:
            login_response = client.post("/session-login")
            csrf_token = client.cookies.get(settings.CSRF_COOKIE_NAME)

            assert login_response.status_code == 200
            assert csrf_token

            rejected_response = client.post("/session-denied")

            assert rejected_response.status_code == 403
            assert rejected_response.json()["error"]["code"] == "csrf_error"
            assert rejected_response.headers["content-type"].startswith("application/json")

            mismatched_response = client.post("/session-denied", headers={"x-csrftoken": "wrong-token"})
            assert mismatched_response.status_code == 403

            accepted_response = client.post("/session-denied", headers={"x-csrftoken": csrf_token})

        assert accepted_response.status_code == 200

    def test_bearer_only_request_does_not_require_a_csrf_token(self) -> None:
        with build_logout_app(TrackingInMemoryStore()) as client:
            response = client.post("/session-denied", headers={"Authorization": "Bearer access-token"})

        assert response.status_code == 200

    def test_oidc_backchannel_logout_is_exempt_with_a_session_cookie(self) -> None:
        with build_logout_app(TrackingInMemoryStore()) as client:
            login_response = client.post("/session-login")
            assert login_response.status_code == 200

            response = client.post("/api/v1/auth/oidc/backchannel-logout")

        assert response.status_code == 200

    def test_csrf_rejection_keeps_cors_headers(self) -> None:
        with build_logout_app(TrackingInMemoryStore()) as client:
            login_response = client.post("/session-login")
            assert login_response.status_code == 200

            response = client.post("/session-denied", headers={"Origin": "https://portal.example.gc.ca"})

        assert response.status_code == 403
        assert response.headers["access-control-allow-origin"] == "https://portal.example.gc.ca"


class TestLogoutSessionStoreInvalidation:
    def test_post_logout_passes_state_to_oidc_provider(self) -> None:
        store = TrackingInMemoryStore()
        client = Mock()
        client.load_server_metadata = AsyncMock(
            return_value={"end_session_endpoint": "https://example.verify.ibm.com/logout"}
        )

        with build_logout_app(store) as test_client:
            denied_response = test_client.post("/session-denied-oidc")

            assert denied_response.status_code == 200

            with patch("src.app.services.auth_service.get_oidc_client", return_value=client):
                logout_response = test_client.post(
                    "/logout?reason=session-expired", headers=csrf_headers(test_client)
                )

        assert logout_response.status_code == 200
        query = parse_qs(urlparse(logout_response.json()["redirectUrl"]).query)
        state = query["state"][0]
        assert state.startswith("session-expired.")
        assert len(state.removeprefix("session-expired.")) >= 8
        assert urlparse(query["post_logout_redirect_uri"][0]).query == ""

    def test_post_logout_clears_cookie_and_returns_oidc_redirect(self) -> None:
        store = TrackingInMemoryStore()
        client = Mock()
        client.load_server_metadata = AsyncMock(
            return_value={"end_session_endpoint": "https://example.verify.ibm.com/logout"}
        )

        with build_logout_app(store) as test_client:
            denied_response = test_client.post("/session-denied-oidc")

            assert denied_response.status_code == 200

            with patch("src.app.services.auth_service.get_oidc_client", return_value=client):
                logout_response = test_client.post("/logout", headers=csrf_headers(test_client))

        assert logout_response.status_code == 200
        assert logout_response.json()["redirectUrl"].startswith("https://example.verify.ibm.com/logout?")
        assert store.data == {}
        assert any(settings.SESSION_COOKIE_NAME in cookie for cookie in logout_response.headers.get_list("set-cookie"))

    def test_post_logout_clears_pre_authentication_oauth_state(self) -> None:
        store = TrackingInMemoryStore()

        with build_logout_app(store) as client:
            pre_auth_response = client.post("/session-pre-auth")

            assert pre_auth_response.status_code == 200
            assert len(store.data) == 1

            logout_response = client.post("/logout", headers=csrf_headers(client))

        assert logout_response.status_code == 200
        assert store.data == {}
        assert any(settings.SESSION_COOKIE_NAME in cookie for cookie in logout_response.headers.get_list("set-cookie"))

    def test_post_logout_clears_unauthenticated_browser_session(self) -> None:
        store = TrackingInMemoryStore()

        with build_logout_app(store) as client:
            denied_response = client.post("/session-denied")

            assert denied_response.status_code == 200
            assert len(store.data) == 1

            logout_response = client.post("/logout", headers=csrf_headers(client))

        assert logout_response.status_code == 200
        assert logout_response.json()["redirectUrl"] == settings.OIDC_POST_LOGOUT_REDIRECT_URI
        assert store.data == {}
        assert any(settings.SESSION_COOKIE_NAME in cookie for cookie in logout_response.headers.get_list("set-cookie"))

    def test_legacy_get_logout_does_not_clear_session(self) -> None:
        store = TrackingInMemoryStore()

        with build_logout_app(store) as client:
            denied_response = client.post("/session-denied")

            assert denied_response.status_code == 200
            assert len(store.data) == 1

            logout_response = client.get("/logout")

        assert logout_response.status_code == 405
        assert len(store.data) == 1

    def test_logout_removes_server_side_session_from_store(self) -> None:
        store = TrackingInMemoryStore()

        with build_logout_app(store) as client:
            login_response = client.post("/session-login")

            assert login_response.status_code == 200
            assert len(store.data) == 1

            csrf_token = client.cookies.get(settings.CSRF_COOKIE_NAME)
            assert csrf_token
            logout_response = client.post("/logout", headers={"x-csrftoken": csrf_token})

            assert logout_response.status_code == 200
            assert store.data == {}
            assert len(store.removed_session_ids) == 2
            assert store.removed_session_ids[0] == store.removed_session_ids[1]
            assert any(
                settings.SESSION_COOKIE_NAME in cookie for cookie in logout_response.headers.get_list("set-cookie")
            )
