from unittest.mock import AsyncMock, Mock, patch

import pytest
from starlette.requests import Request

from src.app.api.dependencies import get_current_user, get_optional_user
from src.app.core.exceptions.http_exceptions import UnauthorizedException


def make_request(session: dict | None = None, authorization: str | None = None) -> Request:
    headers: list[tuple[bytes, bytes]] = []
    if authorization is not None:
        headers.append((b"authorization", authorization.encode()))

    scope = {
        "type": "http",
        "method": "GET",
        "path": "/api/v1/user/me/",
        "headers": headers,
        "session": session or {},
    }
    return Request(scope)


class TestCurrentUserDependency:
    @pytest.mark.asyncio
    async def test_get_current_user_uses_session_first(self, mock_db, current_user_dict):
        request = make_request(session={"user_uuid": str(current_user_dict["uuid"])})

        with patch("src.app.api.dependencies.crud_users") as mock_crud:
            mock_crud.get = AsyncMock(return_value=current_user_dict)

            result = await get_current_user(request, mock_db, None)

            assert result == current_user_dict
            mock_crud.get.assert_called_once_with(db=mock_db, uuid=str(current_user_dict["uuid"]), is_deleted=False)

    @pytest.mark.asyncio
    async def test_get_current_user_falls_back_to_bearer_token(self, mock_db, current_user_dict):
        request = make_request(authorization="Bearer token-value")

        with patch("src.app.api.dependencies.verify_token", new_callable=AsyncMock) as mock_verify:
            mock_verify.return_value = Mock(subject=str(current_user_dict["uuid"]))

            with patch("src.app.api.dependencies.crud_users") as mock_crud:
                mock_crud.get = AsyncMock(return_value=current_user_dict)

                result = await get_current_user(request, mock_db, "token-value")

                assert result == current_user_dict
                mock_verify.assert_awaited_once()
                mock_crud.get.assert_awaited_once_with(
                    db=mock_db,
                    uuid=str(current_user_dict["uuid"]),
                    is_deleted=False,
                )

    @pytest.mark.asyncio
    async def test_get_current_user_requires_session_or_token(self, mock_db):
        request = make_request()

        with pytest.raises(UnauthorizedException, match="User not authenticated"):
            await get_current_user(request, mock_db, None)


class TestOptionalUserDependency:
    @pytest.mark.asyncio
    async def test_get_optional_user_uses_session_first(self, mock_db, current_user_dict):
        request = make_request(session={"user_uuid": str(current_user_dict["uuid"])})

        with patch("src.app.api.dependencies.crud_users") as mock_crud:
            mock_crud.get = AsyncMock(return_value=current_user_dict)

            result = await get_optional_user(request, mock_db)

            assert result == current_user_dict
            mock_crud.get.assert_called_once_with(db=mock_db, uuid=str(current_user_dict["uuid"]), is_deleted=False)

    @pytest.mark.asyncio
    async def test_get_optional_user_returns_none_without_session_or_token(self, mock_db):
        request = make_request()

        result = await get_optional_user(request, mock_db)

        assert result is None
