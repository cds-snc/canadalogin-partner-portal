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
