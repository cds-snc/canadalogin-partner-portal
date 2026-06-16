from unittest.mock import AsyncMock, Mock, patch

import pytest
from starlette.requests import Request

from src.app.api.v1.oidc import oidc_callback, oidc_login
from src.app.core.config import settings
from src.app.core.exceptions.http_exceptions import ForbiddenException
from src.app.core.oidc import sync_oidc_user


def make_request(session: dict | None = None) -> Request:
    return Request(
        {
            "type": "http",
            "method": "GET",
            "path": "/api/v1/auth/oidc/callback",
            "headers": [],
            "session": session or {},
        }
    )


class TestSyncOidcUser:
    @pytest.mark.asyncio
    async def test_sync_oidc_user_creates_missing_user_for_allowed_group(self, mock_db):
        claims = {
            "sub": "subject-123",
            "email": "oidc.user@example.com",
            "name": "OIDC User",
            "preferred_username": "oidcuser",
            settings.OIDC_GROUP_CLAIM_KEY: [settings.OIDC_ADMIN_GROUP_NAME],
        }

        created_user = {
            "id": 7,
            "uuid": "019cfc22-bff2-7168-ae43-387a301d8fcb",
            "username": "oidc.user@example.com",
            "email": "oidc.user@example.com",
            "name": "OIDC User",
            "auth_provider": settings.OIDC_PROVIDER_NAME,
            "auth_subject": "subject-123",
            "role_ids": [1],
        }

        with patch("src.app.core.oidc.crud_users") as mock_crud:
            with patch("src.app.core.oidc.crud_roles") as mock_roles:
                mock_roles.get = AsyncMock(
                    return_value={"id": 1, "name": settings.CLPP_ADMIN_ROLE_NAME}
                )
                mock_crud.get = AsyncMock(side_effect=[None, None, created_user])
                mock_crud.create = AsyncMock(return_value=created_user)
                mock_crud.update = AsyncMock(return_value=None)

                result = await sync_oidc_user(mock_db, claims)

        assert result == created_user
        mock_crud.create.assert_awaited_once()
        create_kwargs = mock_crud.create.await_args.kwargs
        assert create_kwargs["db"] == mock_db
        created_object = create_kwargs["object"]
        assert created_object.name == "oidc.user@example.com"
        assert created_object.email == "oidc.user@example.com"
        assert created_object.username == "oidc.user@example.com"
        assert created_object.auth_provider == settings.OIDC_PROVIDER_NAME
        assert created_object.auth_subject == "subject-123"
        mock_crud.update.assert_awaited_once()
        update_kwargs = mock_crud.update.await_args.kwargs
        assert update_kwargs["db"] == mock_db
        assert update_kwargs["uuid"] == created_user["uuid"]
        assert update_kwargs["object"]["role_ids"] == [1]

    @pytest.mark.asyncio
    async def test_sync_oidc_user_creates_missing_user_for_application_owners(self, mock_db):
        claims = {
            "sub": "subject-123",
            "email": "oidc.user@example.com",
            "name": "OIDC User",
            "preferred_username": "oidcuser",
            settings.OIDC_GROUP_CLAIM_KEY: [
                settings.OIDC_APPLICATION_OWNERS_GROUP_NAME
            ],
        }

        created_user = {
            "id": 8,
            "uuid": "019cfc22-bff2-7168-ae43-387a301d8fcc",
            "username": "oidc.user@example.com",
            "email": "oidc.user@example.com",
            "name": "OIDC User",
            "auth_provider": settings.OIDC_PROVIDER_NAME,
            "auth_subject": "subject-123",
            "role_ids": [2],
        }

        with patch("src.app.core.oidc.crud_users") as mock_crud:
            with patch("src.app.core.oidc.crud_roles") as mock_roles:
                mock_roles.get = AsyncMock(return_value={"id": 2, "name": "application owners"})
                mock_crud.get = AsyncMock(side_effect=[None, None, created_user])
                mock_crud.create = AsyncMock(return_value=created_user)
                mock_crud.update = AsyncMock(return_value=None)

                result = await sync_oidc_user(mock_db, claims)

        assert result == created_user
        mock_crud.create.assert_awaited_once()
        mock_crud.update.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_sync_oidc_user_rejects_user_outside_allowed_groups(self, mock_db):
        claims = {
            "sub": "subject-123",
            "email": "oidc.user@example.com",
            "name": "OIDC User",
            settings.OIDC_GROUP_CLAIM_KEY: ["developers"],
        }

        with patch("src.app.core.oidc.crud_users") as mock_crud:
            with patch("src.app.core.oidc.crud_roles") as mock_roles:
                with pytest.raises(ForbiddenException, match="not allowed"):
                    await sync_oidc_user(mock_db, claims)

                mock_roles.get.assert_not_called()
                mock_crud.get.assert_not_called()
                mock_crud.update.assert_not_called()
                mock_crud.create.assert_not_called()

    @pytest.mark.asyncio
    async def test_sync_oidc_user_uses_internal_schema_for_session_user_id(self, mock_db):
        claims = {
            "sub": "subject-123",
            "email": "oidc.user@example.com",
            "name": "OIDC User",
            settings.OIDC_GROUP_CLAIM_KEY: [settings.OIDC_ADMIN_GROUP_NAME],
        }
        existing_user = {
            "id": 7,
            "uuid": "019cfc22-bff2-7168-ae43-387a301d8fcb",
            "username": "oidcuser",
            "email": "oidc.user@example.com",
            "auth_provider": settings.OIDC_PROVIDER_NAME,
            "auth_subject": "subject-123",
            "role_ids": [7],
        }

        with patch("src.app.core.oidc.crud_users") as mock_crud:
            with patch("src.app.core.oidc.crud_roles") as mock_roles:
                mock_roles.get = AsyncMock(
                    return_value={"id": 1, "name": settings.CLPP_ADMIN_ROLE_NAME}
                )
                mock_crud.get = AsyncMock(side_effect=[existing_user, existing_user])
                mock_crud.update = AsyncMock(return_value=None)

                result = await sync_oidc_user(mock_db, claims)

        assert result == existing_user
        mock_crud.update.assert_awaited_once()
        assert mock_crud.update.await_args is not None
        update_kwargs = mock_crud.update.await_args.kwargs
        assert update_kwargs["db"] == mock_db
        assert update_kwargs["uuid"] == existing_user["uuid"]
        assert update_kwargs["object"]["email"] == "oidc.user@example.com"
        assert update_kwargs["object"]["username"] == "oidc.user@example.com"
        assert update_kwargs["object"]["role_ids"] == [1]


class TestOidcCallback:
    @pytest.mark.asyncio
    async def test_oidc_login_delegates_to_service(self):
        request = make_request()
        mock_service = Mock()
        mock_service.login = AsyncMock(return_value="redirect-response")

        result = await oidc_login(request, mock_service)

        assert result == "redirect-response"
        mock_service.login.assert_awaited_once_with(request)

    @pytest.mark.asyncio
    async def test_oidc_callback_delegates_to_service(self, mock_db):
        request = make_request()
        mock_service = Mock()
        response = Mock(status_code=307, headers={"location": "/app"})
        mock_service.callback = AsyncMock(return_value=response)

        result = await oidc_callback(request, mock_db, mock_service)

        assert result is response
        mock_service.callback.assert_awaited_once_with(request=request, db=mock_db)
