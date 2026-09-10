from unittest.mock import AsyncMock, Mock, patch

import pytest
from starlette.requests import Request

from src.app.api.v1.oidc import oidc_callback, oidc_login
from src.app.core.config import settings
from src.app.core.oidc import build_oidc_redirect_uri, sync_oidc_user


def make_request(session: dict | None = None) -> Request:
    return Request(
        {
            "type": "http",
            "method": "GET",
            "path": "/api/v1/auth/oidc/callback",
            "headers": [],
            "session": session or {},
        }
    )


class TestSyncOidcUser:
    @pytest.mark.asyncio
    async def test_sync_oidc_user_does_not_require_groups_or_assign_roles(self, mock_db):
        claims = {
            "sub": "subject-123",
            "email": "oidc.user@example.com",
            "name": "OIDC User",
        }
        existing_user = {
            "id": 7,
            "uuid": "019cfc22-bff2-7168-ae43-387a301d8fcb",
            "username": "oidc.user@example.com",
            "email": "oidc.user@example.com",
            "name": "OIDC User",
            "auth_provider": settings.OIDC_PROVIDER_NAME,
            "auth_subject": "subject-123",
        }

        with patch("src.app.core.oidc.crud_users") as mock_crud:
            mock_crud.get = AsyncMock(side_effect=[existing_user, existing_user])
            mock_crud.update = AsyncMock(return_value=None)

            result = await sync_oidc_user(mock_db, claims)

        assert result == existing_user
        update_values = mock_crud.update.await_args.kwargs["object"]
        assert set(update_values) == {"last_login_at", "email", "username"}
        assert update_values["email"] == "oidc.user@example.com"
        assert update_values["username"] == "oidc.user@example.com"

    @pytest.mark.asyncio
    async def test_sync_oidc_user_links_local_user_by_email_without_roles(self, mock_db):
        claims = {"sub": "subject-123", "email": "local.user@example.com"}
        local_user = {
            "id": 7,
            "uuid": "019cfc22-bff2-7168-ae43-387a301d8fcb",
            "username": "local.user@example.com",
            "email": "local.user@example.com",
        }

        with patch("src.app.core.oidc.crud_users") as mock_crud:
            mock_crud.get = AsyncMock(side_effect=[None, local_user, local_user])
            mock_crud.update = AsyncMock(return_value=None)

            result = await sync_oidc_user(mock_db, claims)

        assert result == local_user
        update_values = mock_crud.update.await_args.kwargs["object"]
        assert set(update_values) == {"auth_provider", "auth_subject", "last_login_at", "username", "email"}


class TestOidcCallback:
    @pytest.mark.asyncio
    async def test_oidc_login_delegates_to_service(self):
        request = make_request()
        mock_service = Mock()
        mock_service.login = AsyncMock(return_value="redirect-response")

        result = await oidc_login(request, mock_service, ui_locales=None)

        assert result == "redirect-response"
        mock_service.login.assert_awaited_once_with(request, ui_locales=None)

    @pytest.mark.asyncio
    async def test_oidc_callback_delegates_to_service(self, mock_db):
        request = make_request()
        mock_service = Mock()
        response = Mock(status_code=307, headers={"location": "/app"})
        mock_service.callback = AsyncMock(return_value=response)

        result = await oidc_callback(request, mock_db, mock_service)

        assert result is response
        mock_service.callback.assert_awaited_once_with(request=request, db=mock_db)


class TestBuildOidcRedirectUri:
    def test_uses_explicit_redirect_uri_when_configured(self):
        request = make_request()

        with patch.object(settings, "OIDC_REDIRECT_URI", "http://127.0.0.1:8000/api/v1/auth/oidc/callback"):
            redirect_uri = build_oidc_redirect_uri(request)

        assert redirect_uri == "http://127.0.0.1:8000/api/v1/auth/oidc/callback"

    def test_falls_back_to_request_callback_route_when_no_explicit_redirect_uri(self):
        request = Mock()
        request.url_for = Mock(return_value="http://localhost:8000/api/v1/auth/oidc/callback")

        with patch.object(settings, "OIDC_REDIRECT_URI", None):
            redirect_uri = build_oidc_redirect_uri(request)

        assert redirect_uri == "http://localhost:8000/api/v1/auth/oidc/callback"
