from unittest.mock import AsyncMock, Mock, patch

import pytest

from src.app.core.exceptions.http_exceptions import ForbiddenException, UnauthorizedException
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
                with patch("src.app.services.oidc_service.get_session_handler") as mock_handler:
                    mock_sync.return_value = oidc_user

                    response = await service.callback(request=request, db=mock_db)

        mock_handler.assert_called_once_with(request)
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
                with patch("src.app.services.oidc_service.get_session_handler") as mock_handler:
                    with patch("src.app.services.oidc_service.settings") as mock_settings:
                        mock_settings.OIDC_ACCESS_DENIED_REDIRECT = "/access-denied"
                        mock_sync.side_effect = ForbiddenException("User is not allowed to access this site")

                        response = await service.callback(request=request, db=mock_db)

        mock_handler.assert_not_called()
        assert request.session == {}
        assert response.status_code == 307
        assert response.headers["location"] == "/access-denied"

    @pytest.mark.asyncio
    async def test_callback_stores_logout_context_in_session(self, mock_db):
        service = OidcService()
        request = Mock(session={})
        claims = {
            "sub": "subject-123",
            "email": "oidc.user@example.com",
            "sid": "sid-123",
        }
        oidc_user = {
            "uuid": "019cfc22-bff2-7168-ae43-387a301d8fcb",
            "username": "oidcuser",
            "email": "oidc.user@example.com",
        }
        token = {"userinfo": claims, "id_token": "id-token-value"}
        client = Mock()
        client.authorize_access_token = AsyncMock(return_value=token)
        client.server_metadata = {
            "issuer": "https://example.verify.ibm.com/oauth2",
        }

        with patch("src.app.services.oidc_service.get_oidc_client", return_value=client):
            with patch("src.app.services.oidc_service.sync_oidc_user", new_callable=AsyncMock) as mock_sync:
                with patch("src.app.services.oidc_service.get_session_handler") as mock_handler:
                    mock_sync.return_value = oidc_user

                    await service.callback(request=request, db=mock_db)

        mock_handler.return_value.session_id = "sid-123"
        assert request.session["oidc_logout"] == {
            "sid": "sid-123",
            "sub": "subject-123",
            "issuer": "https://example.verify.ibm.com/oauth2",
            "id_token": "id-token-value",
        }

    @pytest.mark.asyncio
    async def test_backchannel_logout_removes_matching_local_session(self):
        logout_service = Mock()
        logout_service.validate_logout_token = AsyncMock(return_value={"sid": "sid-123"})
        logout_service.remove_local_session = AsyncMock()
        service = OidcService(logout_service=logout_service)

        result = await service.backchannel_logout("logout-token")

        assert result == {"message": "Backchannel logout processed"}
        logout_service.validate_logout_token.assert_awaited_once_with("logout-token")
        logout_service.remove_local_session.assert_awaited_once_with("sid-123")

    @pytest.mark.asyncio
    async def test_backchannel_logout_rejects_invalid_logout_token(self):
        logout_service = Mock()
        logout_service.validate_logout_token = AsyncMock(side_effect=UnauthorizedException("Invalid logout token."))
        logout_service.remove_local_session = AsyncMock()
        service = OidcService(logout_service=logout_service)

        with pytest.raises(UnauthorizedException, match="Invalid logout token"):
            await service.backchannel_logout("logout-token")

        logout_service.remove_local_session.assert_not_awaited()
