from unittest.mock import AsyncMock, Mock, patch

import pytest

from src.app.core.config import settings
from src.app.services.auth_service import AuthService


class TestAuthService:
    @pytest.mark.asyncio
    async def test_logout_returns_basic_payload_with_empty_session(self) -> None:
        service = AuthService()
        request = Mock(session={})

        result = await service.logout(request=request)

        assert result == {"message": "Logged out successfully", "clear_cookies": True}

    @pytest.mark.asyncio
    async def test_logout_returns_oidc_logout_details_and_clears_session(self) -> None:
        logout_service = Mock()
        logout_service.remove_local_session = AsyncMock()
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
            result = await service.logout(request=request)

        assert result == {
            "message": "Logged out successfully",
            "clear_cookies": True,
            "oidc_logout": {
                "end_session_endpoint": "https://example.verify.ibm.com/logout",
                "id_token_hint": "id-token-value",
                "post_logout_redirect_uri": settings.OIDC_POST_LOGOUT_REDIRECT_URI,
            },
        }
        logout_service.remove_local_session.assert_awaited_once_with("sid-123")

    @pytest.mark.asyncio
    async def test_refresh_access_token_requires_cookie(self, mock_db) -> None:
        service = AuthService()
        request = Mock(cookies={})

        from src.app.core.exceptions.http_exceptions import UnauthorizedException

        with pytest.raises(UnauthorizedException, match="Refresh token missing"):
            await service.refresh_access_token(request=request, db=mock_db)
