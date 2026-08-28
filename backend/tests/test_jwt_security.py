from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, patch

import jwt
import pytest

from src.app.core.security import TokenType, verify_token


@pytest.mark.asyncio
async def test_public_legacy_default_cannot_forge_an_access_token(mock_db) -> None:
    forged = jwt.encode(
        {
            "sub": "00000000-0000-0000-0000-000000000001",
            "token_type": TokenType.ACCESS,
            "exp": datetime.now(UTC) + timedelta(minutes=5),
        },
        "secret-key",
        algorithm="HS256",
    )

    with patch(
        "src.app.core.security.crud_token_blacklist.exists",
        new=AsyncMock(return_value=False),
    ):
        result = await verify_token(forged, TokenType.ACCESS, mock_db)

    assert result is None
