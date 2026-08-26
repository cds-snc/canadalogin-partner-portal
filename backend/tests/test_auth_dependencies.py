from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import pytest
from src.app.api.dependencies import (
    DEFAULT_LIMIT,
    DEFAULT_PERIOD,
    get_current_user,
    get_optional_user,
    rate_limiter_dependency,
)
from src.app.core.exceptions.http_exceptions import UnauthorizedException
from src.app.core.identity import (
    AUTHENTICATED_EMAIL_KEY,
    AUTHENTICATED_EMAIL_VERIFIED_KEY,
    AUTHENTICATION_PROVIDER_KEY,
    SESSION_AUTHENTICATED_EMAIL_KEY,
    SESSION_AUTHENTICATED_EMAIL_VERIFIED_KEY,
    SESSION_AUTHENTICATION_PROVIDER_KEY,
)
from src.app.services.authorization_service import (
    AUTHORIZATION_STATE_KEY,
    ResolvedAuthorizationState,
)
from starlette.requests import Request


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
        "app": SimpleNamespace(state=SimpleNamespace()),
    }
    return Request(scope)


class TestCurrentUserDependency:
    @pytest.mark.asyncio
    async def test_get_current_user_uses_session_first(self, mock_db, current_user_dict):
        request = make_request(session={"user_uuid": str(current_user_dict["uuid"])})

        with patch("src.app.api.dependencies.crud_users") as mock_crud:
            mock_crud.get = AsyncMock(return_value=current_user_dict)

            with patch("src.app.api.dependencies.get_authorization_service") as service_factory:
                service_factory.return_value.resolve_for_user = AsyncMock(return_value=ResolvedAuthorizationState())

                result = await get_current_user(request, mock_db, None)

            assert result[AUTHORIZATION_STATE_KEY] == ResolvedAuthorizationState()
            assert result["authorization_context"].model_dump(mode="json") == {
                "globalRole": None,
                "partnerAccess": [],
            }
            mock_crud.get.assert_called_once_with(
                db=mock_db,
                uuid=str(current_user_dict["uuid"]),
                is_deleted=False,
                enabled=True,
            )

    @pytest.mark.asyncio
    async def test_get_current_user_rejects_unsupported_bearer_token(self, mock_db):
        request = make_request(authorization="Bearer attacker-controlled-token")

        with pytest.raises(UnauthorizedException, match="User not authenticated"):
            await get_current_user(request, mock_db, None)

    @pytest.mark.asyncio
    async def test_get_current_user_projects_server_owned_verified_email_context(self, mock_db, current_user_dict):
        request = make_request(
            session={
                "user_uuid": str(current_user_dict["uuid"]),
                SESSION_AUTHENTICATED_EMAIL_KEY: "invitee@example.gc.ca",
                SESSION_AUTHENTICATED_EMAIL_VERIFIED_KEY: True,
                SESSION_AUTHENTICATION_PROVIDER_KEY: "oidc",
            }
        )

        with (
            patch("src.app.api.dependencies.crud_users") as mock_crud,
            patch("src.app.api.dependencies.get_authorization_service") as service_factory,
        ):
            mock_crud.get = AsyncMock(return_value=current_user_dict)
            service_factory.return_value.resolve_for_user = AsyncMock(return_value=ResolvedAuthorizationState())

            result = await get_current_user(request, mock_db, None)

        assert result[AUTHENTICATED_EMAIL_KEY] == "invitee@example.gc.ca"
        assert result[AUTHENTICATED_EMAIL_VERIFIED_KEY] is True
        assert result[AUTHENTICATION_PROVIDER_KEY] == "oidc"

    @pytest.mark.asyncio
    async def test_get_current_user_requires_session(self, mock_db):
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
            mock_crud.get.assert_called_once_with(
                db=mock_db,
                uuid=str(current_user_dict["uuid"]),
                is_deleted=False,
                enabled=True,
            )

    @pytest.mark.asyncio
    async def test_get_optional_user_returns_none_without_session(self, mock_db):
        request = make_request()

        result = await get_optional_user(request, mock_db)

        assert result is None


class TestRateLimiterDependency:
    @pytest.mark.asyncio
    async def test_authenticated_user_uses_default_limits_without_tier_catalog(self, mock_db):
        request = make_request()

        with patch(
            "src.app.api.dependencies.rate_limiter.is_rate_limited",
            new=AsyncMock(return_value=False),
        ) as is_rate_limited:
            await rate_limiter_dependency(request, mock_db, {"id": 42})

        is_rate_limited.assert_awaited_once_with(
            db=mock_db,
            user_id=42,
            path="api_v1_user_me",
            limit=DEFAULT_LIMIT,
            period=DEFAULT_PERIOD,
        )
