from unittest.mock import AsyncMock, Mock, patch

import pytest

from src.app.core.exceptions.http_exceptions import UnauthorizedException
from src.app.services.auth_service import AuthService


class TestAuthService:
    @pytest.mark.asyncio
    async def test_login_rejects_when_local_password_login_disabled(self, mock_db, monkeypatch) -> None:
        service = AuthService()
        form_data = Mock(username="demo", password="secret")

        monkeypatch.setattr("src.app.services.auth_service.settings.LOCAL_PASSWORD_LOGIN_ENABLED", False)

        with pytest.raises(UnauthorizedException, match="Local password login is disabled"):
            await service.login(form_data=form_data, db=mock_db)

    @pytest.mark.asyncio
    async def test_login_issues_uuid_subject_tokens(self, mock_db, monkeypatch) -> None:
        service = AuthService()
        form_data = Mock(username="demo", password="secret")
        user = {
            "uuid": "019cfc22-bff2-7168-ae43-387a301d8fcb",
            "username": "demo",
        }

        monkeypatch.setattr("src.app.services.auth_service.settings.LOCAL_PASSWORD_LOGIN_ENABLED", True)

        with patch("src.app.services.auth_service.authenticate_user", new_callable=AsyncMock) as mock_authenticate:
            with patch("src.app.services.auth_service.create_access_token", new_callable=AsyncMock) as mock_access:
                with patch("src.app.services.auth_service.create_refresh_token", new_callable=AsyncMock) as mock_refresh:
                    mock_authenticate.return_value = user
                    mock_access.return_value = "access-token"
                    mock_refresh.return_value = "refresh-token"

                    result = await service.login(form_data=form_data, db=mock_db)

        assert result["access_token"] == "access-token"
        assert result["refresh_token"] == "refresh-token"
        mock_access.assert_awaited_once()
        mock_refresh.assert_awaited_once_with(data={"sub": user["uuid"]})
        assert mock_access.await_args.kwargs["data"] == {"sub": user["uuid"]}

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
    async def test_refresh_access_token_requires_cookie(self, mock_db) -> None:
        service = AuthService()
        request = Mock(cookies={})

        with pytest.raises(UnauthorizedException, match="Refresh token missing"):
            await service.refresh_access_token(request=request, db=mock_db)
