from unittest.mock import AsyncMock, patch

import pytest
from pydantic import SecretStr

from src.app.core import security


@pytest.mark.asyncio
@pytest.mark.parametrize("token_type", list(security.TokenType))
async def test_signed_token_round_trip(token_type, mock_db, monkeypatch):
    monkeypatch.setattr(security, "SECRET_KEY", SecretStr("test-signing-key-not-for-production"))
    monkeypatch.setattr(security, "ALGORITHM", "HS256")
    create_token = (
        security.create_access_token
        if token_type == security.TokenType.ACCESS
        else security.create_refresh_token
    )
    token = await create_token({"sub": "test-user"})

    with patch.object(security.crud_token_blacklist, "exists", new=AsyncMock(return_value=False)):
        result = await security.verify_token(token, token_type, mock_db)

    assert result is not None
    assert result.subject == "test-user"


@pytest.mark.asyncio
async def test_token_signed_with_wrong_key_is_rejected(mock_db, monkeypatch):
    monkeypatch.setattr(security, "SECRET_KEY", SecretStr("test-signing-key-not-for-production"))
    monkeypatch.setattr(security, "ALGORITHM", "HS256")
    token = await security.create_access_token({"sub": "test-user"})
    monkeypatch.setattr(security, "SECRET_KEY", SecretStr("different-test-key-not-for-production"))

    with patch.object(security.crud_token_blacklist, "exists", new=AsyncMock(return_value=False)):
        result = await security.verify_token(token, security.TokenType.ACCESS, mock_db)

    assert result is None
