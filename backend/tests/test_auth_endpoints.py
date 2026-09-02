from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from unittest.mock import AsyncMock, Mock, patch

import pytest
from fastapi import APIRouter
from fastapi.testclient import TestClient
from starlette.requests import Request
from starsessions import InMemoryStore

from src.app.api.v1.logout import logout
from src.app.api.v1.logout import router as logout_router
from src.app.core.config import settings
from src.app.core.db.database import async_get_db
from src.app.core.setup import create_application
from src.app.schemas.auth import LogoutOidcResponse, LogoutResponse


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

        assert result == LogoutResponse(message="Logged out successfully")
        mock_service.logout.assert_awaited_once_with(request=request)

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
                },
            }
        )

        result = await logout(request, mock_service)

        assert result == LogoutResponse(
            message="Logged out successfully",
            oidc_logout=LogoutOidcResponse(
                end_session_endpoint="https://example.verify.ibm.com/logout",
                id_token_hint="id-token-value",
                post_logout_redirect_uri="https://portal.example.gc.ca/logout-complete",
            ),
        )


class TrackingInMemoryStore(InMemoryStore):
    def __init__(self) -> None:
        super().__init__()
        self.removed_session_ids: list[str] = []

    async def remove(self, session_id: str) -> None:
        self.removed_session_ids.append(session_id)
        await super().remove(session_id)


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

    router.include_router(logout_router)

    @asynccontextmanager
    async def noop_lifespan(_: object) -> AsyncIterator[None]:
        yield

    with (
        patch("src.app.core.setup.get_redis_session_store", return_value=store),
        patch.object(settings, "SESSION_COOKIE_DOMAIN", None),
    ):
        app = create_application(router, settings=settings, create_tables_on_start=False, lifespan=noop_lifespan)

    app.dependency_overrides[async_get_db] = lambda: Mock()
    return TestClient(app)


class TestLogoutSessionStoreInvalidation:
    def test_get_logout_clears_cookie_before_redirecting_to_oidc_provider(self) -> None:
        store = TrackingInMemoryStore()
        client = Mock()
        client.load_server_metadata = AsyncMock(
            return_value={"end_session_endpoint": "https://example.verify.ibm.com/logout"}
        )

        with build_logout_app(store) as test_client:
            denied_response = test_client.post("/session-denied-oidc")

            assert denied_response.status_code == 200

            with patch("src.app.services.auth_service.get_oidc_client", return_value=client):
                logout_response = test_client.get("/logout", follow_redirects=False)

        assert logout_response.status_code == 307
        assert logout_response.headers["location"].startswith("https://example.verify.ibm.com/logout?")
        assert store.data == {}
        assert any(settings.SESSION_COOKIE_NAME in cookie for cookie in logout_response.headers.get_list("set-cookie"))

    def test_get_logout_clears_pre_authentication_oauth_state(self) -> None:
        store = TrackingInMemoryStore()

        with build_logout_app(store) as client:
            pre_auth_response = client.post("/session-pre-auth")

            assert pre_auth_response.status_code == 200
            assert len(store.data) == 1

            logout_response = client.get("/logout", follow_redirects=False)

        assert logout_response.status_code == 307
        assert store.data == {}
        assert any(settings.SESSION_COOKIE_NAME in cookie for cookie in logout_response.headers.get_list("set-cookie"))

    def test_get_logout_clears_unauthenticated_browser_session(self) -> None:
        store = TrackingInMemoryStore()

        with build_logout_app(store) as client:
            denied_response = client.post("/session-denied")

            assert denied_response.status_code == 200
            assert len(store.data) == 1

            logout_response = client.get("/logout", follow_redirects=False)

        assert logout_response.status_code == 307
        assert logout_response.headers["location"] == settings.OIDC_POST_LOGOUT_REDIRECT_URI
        assert store.data == {}
        assert any(settings.SESSION_COOKIE_NAME in cookie for cookie in logout_response.headers.get_list("set-cookie"))

    def test_logout_removes_server_side_session_from_store(self) -> None:
        store = TrackingInMemoryStore()

        with build_logout_app(store) as client:
            login_response = client.post("/session-login")

            assert login_response.status_code == 200
            assert len(store.data) == 1

            logout_response = client.post("/logout")

            assert logout_response.status_code == 200
            assert store.data == {}
            assert len(store.removed_session_ids) == 1
            assert any(
                settings.SESSION_COOKIE_NAME in cookie for cookie in logout_response.headers.get_list("set-cookie")
            )
