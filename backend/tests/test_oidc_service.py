from unittest.mock import AsyncMock, Mock, patch

import pytest

from src.app.core.exceptions.http_exceptions import ForbiddenException
from src.app.services.oidc_service import OidcService


class TestOidcService:
    @pytest.mark.asyncio
    async def test_callback_stores_user_uuid_in_session_and_redirects(self, mock_db, monkeypatch):
        service = OidcService()
        request = Mock(session={})
        claims = {"sub": "subject-123", "email": "oidc.user@example.com"}
        oidc_user = {
            "uuid": "019cfc22-bff2-7168-ae43-387a301d8fcb",
            "username": "oidcuser",
            "email": "oidc.user@example.com",
        }
        client = Mock()
        client.authorize_access_token = AsyncMock(return_value={"userinfo": claims})

        monkeypatch.setattr("src.app.services.oidc_service.settings.OIDC_POST_LOGIN_REDIRECT", "/app")

        with patch("src.app.services.oidc_service.get_oidc_client", return_value=client):
            with patch("src.app.services.oidc_service.sync_oidc_user", new_callable=AsyncMock) as mock_sync:
                with patch("src.app.services.oidc_service.regenerate_session_id", create=True) as mock_regenerate:
                    mock_sync.return_value = oidc_user

                    response = await service.callback(request=request, db=mock_db)

        mock_regenerate.assert_called_once_with(request)
        assert request.session["user_uuid"] == oidc_user["uuid"]
        assert response.status_code == 307
        assert response.headers["location"] == "/app"

    @pytest.mark.asyncio
    async def test_callback_redirects_to_access_denied_without_session_for_blocked_user(
        self, mock_db, monkeypatch
    ):
        service = OidcService()
        request = Mock(session={})
        claims = {"sub": "subject-123", "email": "blocked.user@example.com"}
        client = Mock()
        client.authorize_access_token = AsyncMock(return_value={"userinfo": claims})

        with patch("src.app.services.oidc_service.get_oidc_client", return_value=client):
            with patch("src.app.services.oidc_service.sync_oidc_user", new_callable=AsyncMock) as mock_sync:
                with patch("src.app.services.oidc_service.regenerate_session_id", create=True) as mock_regenerate:
                    with patch("src.app.services.oidc_service.settings") as mock_settings:
                        mock_settings.OIDC_ACCESS_DENIED_REDIRECT = "/access-denied"
                        mock_sync.side_effect = ForbiddenException("User is not allowed to access this site")

                        response = await service.callback(request=request, db=mock_db)

        mock_regenerate.assert_not_called()
        assert request.session == {}
        assert response.status_code == 307
        assert response.headers["location"] == "/access-denied"
