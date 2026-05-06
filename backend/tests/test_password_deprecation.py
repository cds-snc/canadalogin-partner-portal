import pytest

from src.app.core.config import settings
from src.app.core.exceptions.http_exceptions import UnauthorizedException
from src.app.services.auth_service import AuthService


def test_local_password_login_disabled_by_default(monkeypatch):
    # Ensure test environment doesn't accidentally enable password login via env vars
    monkeypatch.setattr(settings, "LOCAL_PASSWORD_LOGIN_ENABLED", False)
    assert settings.LOCAL_PASSWORD_LOGIN_ENABLED is False


@pytest.mark.asyncio
async def test_auth_service_rejects_when_disabled(mock_db, monkeypatch):
    monkeypatch.setattr(settings, "LOCAL_PASSWORD_LOGIN_ENABLED", False)
    service = AuthService()
    with pytest.raises(UnauthorizedException):
        await service.login(form_data=type("F", (), {"username": "u", "password": "p"})(), db=mock_db)
