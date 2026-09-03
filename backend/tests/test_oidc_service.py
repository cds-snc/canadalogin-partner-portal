from unittest.mock import AsyncMock, Mock, patch
from urllib.parse import parse_qs, urlparse

import pytest
from authlib.integrations.base_client.errors import MismatchingStateError

from src.app.core.exceptions.http_exceptions import ForbiddenException, UnauthorizedException
from src.app.services.oidc_service import OidcService


def make_session_service() -> Mock:
    session_service = Mock()
    session_service.reserve = AsyncMock(return_value=True)
    session_service.session_store = Mock()
    session_service.session_store.remove = AsyncMock()
    return session_service


class TestOidcService:
    @pytest.mark.asyncio
    async def test_callback_restarts_login_when_oauth_state_is_missing(self, mock_db):
        service = OidcService(session_service=make_session_service())
        request = Mock(session={"_state_oidc_stale": {"data": {}, "exp": 0}})
        client = Mock()
        client.authorize_access_token = AsyncMock(side_effect=MismatchingStateError())

        with patch("src.app.services.oidc_service.get_oidc_client", return_value=client):
            response = await service.callback(request=request, db=mock_db)

        assert request.session == {}
        assert response.status_code == 307
        assert response.headers["location"] == "/api/v1/auth/oidc/login"

    @pytest.mark.asyncio
    async def test_callback_stores_user_uuid_in_session_and_redirects(self, mock_db, monkeypatch):
        service = OidcService(session_service=make_session_service())
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
        client = Mock()
        client.authorize_access_token = AsyncMock(
            return_value={"userinfo": claims, "id_token": "id-token-value"}
        )
        client.server_metadata = {"issuer": "https://example.verify.ibm.com/oauth2"}

        monkeypatch.setattr("src.app.services.oidc_service.settings.OIDC_POST_LOGIN_REDIRECT", "/app")

        with patch("src.app.services.oidc_service.get_oidc_client", return_value=client):
            with patch("src.app.services.oidc_service.sync_oidc_user", new_callable=AsyncMock) as mock_sync:
                with patch("src.app.services.oidc_service.get_session_id", return_value="pre-auth-session-123"):
                    with patch("src.app.services.oidc_service.regenerate_session_id", return_value="local-session-123") as mock_regenerate:
                        mock_sync.return_value = oidc_user

                        response = await service.callback(request=request, db=mock_db)

        mock_regenerate.assert_called_once_with(request)
        assert request.session["user_uuid"] == oidc_user["uuid"]
        assert response.status_code == 307
        assert response.headers["location"] == "/app"

    @pytest.mark.asyncio
    async def test_callback_reserves_regenerated_local_session_before_login(self, mock_db):
        session_service = Mock()
        session_service.reserve = AsyncMock(return_value=True)
        session_service.session_store = Mock()
        session_service.session_store.remove = AsyncMock()
        service = OidcService(session_service=session_service)
        request = Mock(session={})
        claims = {"sub": "subject-123", "email": "oidc.user@example.com", "sid": "idp-session-123"}
        oidc_user = {"uuid": "019cfc22-bff2-7168-ae43-387a301d8fcb"}
        client = Mock()
        client.authorize_access_token = AsyncMock(return_value={"userinfo": claims})
        client.server_metadata = {"issuer": "https://example.verify.ibm.com/oauth2"}

        with patch("src.app.services.oidc_service.get_oidc_client", return_value=client):
            with patch("src.app.services.oidc_service.sync_oidc_user", new_callable=AsyncMock) as mock_sync:
                with patch("src.app.services.oidc_service.get_session_id", return_value="pre-auth-session-123"):
                    with patch("src.app.services.oidc_service.regenerate_session_id", return_value="local-session-123"):
                        mock_sync.return_value = oidc_user

                        response = await service.callback(request=request, db=mock_db)

        session_service.reserve.assert_awaited_once_with(
            str(oidc_user["uuid"]),
            "local-session-123",
            "idp-session-123",
        )
        session_service.session_store.remove.assert_awaited_once_with("pre-auth-session-123")
        assert response.status_code == 307

    @pytest.mark.asyncio
    async def test_callback_redirects_with_concurrent_session_limit_reason(self, mock_db):
        session_service = Mock()
        session_service.reserve = AsyncMock(return_value=False)
        logout_service = Mock()
        logout_service.remove_local_session = AsyncMock()
        service = OidcService(logout_service=logout_service, session_service=session_service)
        request = Mock(session={})
        claims = {
            "sub": "subject-123",
            "email": "oidc.user@example.com",
            "sid": "sid-123",
        }
        oidc_user = {"uuid": "019cfc22-bff2-7168-ae43-387a301d8fcb"}
        client = Mock()
        client.authorize_access_token = AsyncMock(
            return_value={"userinfo": claims, "id_token": "id-token-value"}
        )
        client.server_metadata = {"issuer": "https://example.verify.ibm.com/oauth2"}

        with patch("src.app.services.oidc_service.get_oidc_client", return_value=client):
            with patch("src.app.services.oidc_service.sync_oidc_user", new_callable=AsyncMock) as mock_sync:
                with patch("src.app.services.oidc_service.get_session_id", return_value="pre-auth-session-123"):
                    with patch("src.app.services.oidc_service.regenerate_session_id", return_value="local-session-123"):
                        mock_sync.return_value = oidc_user

                        response = await service.callback(request=request, db=mock_db)

        assert response.status_code == 307
        redirect_url = urlparse(response.headers["location"])
        assert redirect_url.path == "/access-denied"
        assert parse_qs(redirect_url.query) == {"reason": ["concurrent-session-limit"]}
        logout_service.remove_local_session.assert_awaited_once_with("pre-auth-session-123")
        assert request.session == {
            "oidc_logout": {
                "sid": "sid-123",
                "sub": "subject-123",
                "issuer": "https://example.verify.ibm.com/oauth2",
                "id_token": "id-token-value",
            }
        }

    @pytest.mark.asyncio
    async def test_callback_logs_successful_user_login(self, mock_db):
        service = OidcService(session_service=make_session_service())
        request = Mock(session={})
        claims = {"sub": "subject-123", "email": "oidc.user@example.com"}
        oidc_user = {
            "uuid": "019cfc22-bff2-7168-ae43-387a301d8fcb",
            "username": "oidcuser",
            "email": "oidc.user@example.com",
        }
        client = Mock()
        client.authorize_access_token = AsyncMock(return_value={"userinfo": claims})
        client.server_metadata = {"issuer": "https://example.verify.ibm.com/oauth2"}

        with patch("src.app.services.oidc_service.get_oidc_client", return_value=client):
            with patch("src.app.services.oidc_service.sync_oidc_user", new_callable=AsyncMock) as mock_sync:
                with patch("src.app.services.oidc_service.get_session_id", return_value="pre-auth-session-123"):
                    with patch("src.app.services.oidc_service.regenerate_session_id", return_value="local-session-123"):
                        with patch("src.app.services.oidc_service.logger") as mock_logger:
                            mock_sync.return_value = oidc_user

                            await service.callback(request=request, db=mock_db)

        mock_logger.info.assert_called_once_with("user login: %s", oidc_user["uuid"])

    @pytest.mark.asyncio
    async def test_callback_redirects_to_access_denied_without_session_for_blocked_user(
        self, mock_db, monkeypatch
    ):
        service = OidcService(session_service=make_session_service())
        request = Mock(session={})
        claims = {
            "sub": "subject-123",
            "email": "blocked.user@example.com",
            "sid": "sid-123",
        }
        client = Mock()
        client.authorize_access_token = AsyncMock(
            return_value={"userinfo": claims, "id_token": "id-token-value"}
        )
        client.server_metadata = {"issuer": "https://example.verify.ibm.com/oauth2"}

        with patch("src.app.services.oidc_service.get_oidc_client", return_value=client):
            with patch("src.app.services.oidc_service.sync_oidc_user", new_callable=AsyncMock) as mock_sync:
                with patch("src.app.services.oidc_service.regenerate_session_id") as mock_regenerate:
                    with patch("src.app.services.oidc_service.settings") as mock_settings:
                        mock_settings.OIDC_ACCESS_DENIED_REDIRECT = "/access-denied"
                        mock_sync.side_effect = ForbiddenException("User is not allowed to access this site")

                        response = await service.callback(request=request, db=mock_db)

        mock_regenerate.assert_not_called()
        assert request.session == {
            "oidc_logout": {
                "sid": "sid-123",
                "sub": "subject-123",
                "issuer": "https://example.verify.ibm.com/oauth2",
                "id_token": "id-token-value",
            }
        }
        assert response.status_code == 307
        assert response.headers["location"] == "/access-denied"

    @pytest.mark.asyncio
    async def test_callback_stores_logout_context_in_session(self, mock_db):
        service = OidcService(session_service=make_session_service())
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
                with patch("src.app.services.oidc_service.get_session_id", return_value="pre-auth-session-123"):
                    with patch("src.app.services.oidc_service.regenerate_session_id", return_value="local-session-123"):
                        mock_sync.return_value = oidc_user

                        await service.callback(request=request, db=mock_db)

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
        session_service = make_session_service()
        session_service.remove_oidc_sessions = AsyncMock()
        service = OidcService(logout_service=logout_service, session_service=session_service)

        result = await service.backchannel_logout("logout-token")

        assert result == {"message": "Backchannel logout processed"}
        logout_service.validate_logout_token.assert_awaited_once_with("logout-token")
        session_service.remove_oidc_sessions.assert_awaited_once_with("sid-123")
        logout_service.remove_local_session.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_backchannel_logout_rejects_invalid_logout_token(self):
        logout_service = Mock()
        logout_service.validate_logout_token = AsyncMock(side_effect=UnauthorizedException("Invalid logout token."))
        logout_service.remove_local_session = AsyncMock()
        service = OidcService(logout_service=logout_service)

        with pytest.raises(UnauthorizedException, match="Invalid logout token"):
            await service.backchannel_logout("logout-token")

        logout_service.remove_local_session.assert_not_awaited()
