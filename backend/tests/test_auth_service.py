from unittest.mock import AsyncMock, Mock, patch

import pytest

from src.app.services.auth_service import AuthService


class TestAuthService:
    @pytest.mark.asyncio
    async def test_logout_blacklists_tokens_when_present(self, mock_db) -> None:
        service = AuthService()
        request = Mock(session={})

        with patch("src.app.services.auth_service.blacklist_tokens", new_callable=AsyncMock) as mock_blacklist:
            result = await service.logout(
                request=request,
                access_token="access-token",
                refresh_token="refresh-token",
                db=mock_db,
            )

        assert result == {"message": "Logged out successfully", "clear_cookies": True}
        mock_blacklist.assert_awaited_once_with(access_token="access-token", refresh_token="refresh-token", db=mock_db)

    @pytest.mark.asyncio
    async def test_logout_returns_oidc_logout_details_and_clears_logout_index(self, mock_db) -> None:
        logout_service = Mock()
        logout_service.remove_session = AsyncMock()
        service = AuthService(logout_service=logout_service)
        request = Mock(
            session={
                "user_uuid": "019cfc22-bff2-7168-ae43-387a301d8fcb",
                "oidc_logout": {
                    "sid": "sid-123",
                    "id_token": "id-token-value",
                },
            }
        )
        client = Mock()
        client.server_metadata = {
            "end_session_endpoint": "https://example.verify.ibm.com/logout",
        }

        with patch("src.app.services.auth_service.get_oidc_client", return_value=client):
            result = await service.logout(
                request=request,
                access_token=None,
                refresh_token=None,
                db=mock_db,
            )

        assert result == {
            "message": "Logged out successfully",
            "clear_cookies": True,
            "oidc_logout": {
                "end_session_endpoint": "https://example.verify.ibm.com/logout",
                "id_token_hint": "id-token-value",
                "post_logout_redirect_uri": None,
            },
        }
        logout_service.remove_session.assert_awaited_once_with("sid-123")

    @pytest.mark.asyncio
    async def test_refresh_access_token_requires_cookie(self, mock_db) -> None:
        service = AuthService()
        request = Mock(cookies={})

        from src.app.core.exceptions.http_exceptions import UnauthorizedException

        with pytest.raises(UnauthorizedException, match="Refresh token missing"):
            await service.refresh_access_token(request=request, db=mock_db)
