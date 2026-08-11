from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, Mock, patch

import pytest
from fastcrud.exceptions.http_exceptions import CustomException
from starlette.requests import Request

from src.app.api.v1.oidc import oidc_callback, oidc_login
from src.app.core.config import settings
from src.app.core.exceptions.http_exceptions import ForbiddenException
from src.app.core.oidc import build_oidc_redirect_uri, get_oidc_client, get_oidc_server_metadata_url, sync_oidc_user


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


@pytest.fixture(autouse=True)
def _stable_oidc_group_settings():
    with patch.multiple(
        settings,
        OIDC_GROUP_CLAIM_KEY="groupIds",
        OIDC_ADMIN_GROUP_NAME="admin",
        OIDC_APPLICATION_OWNERS_GROUP_NAME="application owners",
        CLPP_ADMIN_ROLE_NAME="admin",
        CLPP_APPLICATION_OWNERS_ROLE_NAME="application owners",
    ):
        yield


class TestSyncOidcUser:
    @pytest.mark.asyncio
    async def test_sync_oidc_user_preserves_local_roles_instead_of_overwriting_from_upstream_claims(self, mock_db):
        claims = {
            "sub": "subject-123",
            "email": "oidc.user@example.com",
            "name": "OIDC User",
            settings.OIDC_GROUP_CLAIM_KEY: [settings.OIDC_APPLICATION_OWNERS_GROUP_NAME],
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
        refreshed_user = {
            **existing_user,
            "username": "oidc.user@example.com",
            "email": "oidc.user@example.com",
        }

        with patch("src.app.core.oidc.crud_users") as mock_crud:
            mock_crud.get = AsyncMock(side_effect=[existing_user, refreshed_user])
            mock_crud.update = AsyncMock(return_value=None)

            result = await sync_oidc_user(mock_db, claims)

        assert result == refreshed_user
        mock_crud.update.assert_awaited_once()
        update_kwargs = mock_crud.update.await_args.kwargs
        assert update_kwargs["db"] == mock_db
        assert update_kwargs["uuid"] == existing_user["uuid"]
        assert update_kwargs["object"]["email"] == "oidc.user@example.com"
        assert update_kwargs["object"]["username"] == "oidc.user@example.com"
        assert "last_login_at" in update_kwargs["object"]
        assert "role_ids" not in update_kwargs["object"]

    @pytest.mark.asyncio
    async def test_sync_oidc_user_allows_local_roles_without_upstream_application_owners_claim(self, mock_db):
        claims = {
            "sub": "subject-123",
            "email": "oidc.user@example.com",
            "name": "OIDC User",
            settings.OIDC_GROUP_CLAIM_KEY: ["developers"],
        }
        email_linked_user = {
            "id": 8,
            "uuid": "019cfc22-bff2-7168-ae43-387a301d8fcc",
            "username": "legacy.user@example.com",
            "email": "oidc.user@example.com",
            "name": "OIDC User",
            "auth_provider": None,
            "auth_subject": None,
            "role_ids": [2],
        }
        refreshed_user = {
            **email_linked_user,
            "username": "oidc.user@example.com",
            "auth_provider": settings.OIDC_PROVIDER_NAME,
            "auth_subject": "subject-123",
        }

        with patch("src.app.core.oidc.crud_users") as mock_crud:
            mock_crud.get = AsyncMock(side_effect=[None, email_linked_user, refreshed_user])
            mock_crud.update = AsyncMock(return_value=None)

            result = await sync_oidc_user(mock_db, claims)

        assert result == refreshed_user
        mock_crud.update.assert_awaited_once()
        update_kwargs = mock_crud.update.await_args.kwargs
        assert update_kwargs["uuid"] == email_linked_user["uuid"]
        assert update_kwargs["object"]["auth_provider"] == settings.OIDC_PROVIDER_NAME
        assert update_kwargs["object"]["auth_subject"] == "subject-123"
        assert update_kwargs["object"]["email"] == "oidc.user@example.com"
        assert update_kwargs["object"]["username"] == "oidc.user@example.com"
        assert "last_login_at" in update_kwargs["object"]
        assert "role_ids" not in update_kwargs["object"]

    @pytest.mark.asyncio
    async def test_sync_oidc_user_rejects_application_owners_membership_without_local_roles(self, mock_db):
        claims = {
            "sub": "subject-123",
            "email": "oidc.user@example.com",
            "name": "OIDC User",
            settings.OIDC_GROUP_CLAIM_KEY: [settings.OIDC_APPLICATION_OWNERS_GROUP_NAME],
        }
        created_user = {
            "id": 7,
            "uuid": "019cfc22-bff2-7168-ae43-387a301d8fcb",
            "username": "oidc.user@example.com",
            "email": "oidc.user@example.com",
            "name": "OIDC User",
            "auth_provider": settings.OIDC_PROVIDER_NAME,
            "auth_subject": "subject-123",
            "role_ids": None,
        }

        with patch("src.app.core.oidc.crud_users") as mock_crud, patch(
            "src.app.core.oidc.crud_rp_application_developer_invitations"
        ) as mock_invitations:
            mock_crud.get = AsyncMock(side_effect=[None, None])
            mock_crud.create = AsyncMock(return_value=created_user)
            mock_crud.update = AsyncMock(return_value=None)
            mock_invitations.get_multi = AsyncMock(return_value={"data": []})

            with pytest.raises(ForbiddenException, match="not allowed"):
                await sync_oidc_user(mock_db, claims)

        mock_crud.create.assert_not_awaited()
        mock_crud.update.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_sync_oidc_user_allows_existing_user_with_active_partner_grant(self, mock_db):
        claims = {
            "sub": "subject-123",
            "email": "oidc.user@example.com",
            "name": "OIDC User",
            settings.OIDC_GROUP_CLAIM_KEY: ["developers"],
        }
        existing_user = {
            "id": 9,
            "uuid": "019cfc22-bff2-7168-ae43-387a301d8fcd",
            "username": "oidc.user@example.com",
            "email": "oidc.user@example.com",
            "auth_provider": settings.OIDC_PROVIDER_NAME,
            "auth_subject": "subject-123",
            "role_ids": None,
        }
        refreshed_user = {
            **existing_user,
            "last_login_at": "2026-08-10T00:00:00Z",
        }

        with patch("src.app.core.oidc.crud_users") as mock_crud, patch(
            "src.app.core.oidc.crud_rp_application_access_grants"
        ) as mock_access_grants:
            mock_crud.get = AsyncMock(side_effect=[existing_user, refreshed_user])
            mock_crud.update = AsyncMock(return_value=None)
            mock_access_grants.get = AsyncMock(
                return_value={"uuid": "018f6f83-0000-0000-0000-000000000999", "role": "RP Admin"}
            )

            result = await sync_oidc_user(mock_db, claims)

        assert result == refreshed_user
        mock_crud.update.assert_awaited_once()
        mock_access_grants.get.assert_awaited()

    @pytest.mark.asyncio
    async def test_sync_oidc_user_creates_unknown_user_when_pending_invitation_exists(self, mock_db):
        claims = {
            "sub": "subject-456",
            "email": "invitee@example.gc.ca",
            "name": "Invited User",
            settings.OIDC_GROUP_CLAIM_KEY: ["developers"],
        }
        created_user = {
            "id": 11,
            "uuid": "019cfc22-bff2-7168-ae43-387a301d8fce",
            "username": "invitee@example.gc.ca",
            "email": "invitee@example.gc.ca",
            "name": "Invited User",
            "auth_provider": settings.OIDC_PROVIDER_NAME,
            "auth_subject": "subject-456",
            "role_ids": None,
        }
        refreshed_user = {
            **created_user,
            "last_login_at": "2026-08-10T00:00:00Z",
        }

        with patch("src.app.core.oidc.crud_users") as mock_crud, patch(
            "src.app.core.oidc.crud_rp_application_developer_invitations"
        ) as mock_invitations, patch(
            "src.app.core.oidc.crud_rp_application_access_grants"
        ) as mock_access_grants:
            mock_crud.get = AsyncMock(side_effect=[None, None, refreshed_user])
            mock_crud.create = AsyncMock(return_value=created_user)
            mock_crud.update = AsyncMock(return_value=None)
            mock_invitations.get_multi = AsyncMock(
                return_value={
                    "data": [
                        {
                            "invite_expires_at": datetime.now(UTC) + timedelta(days=1)
                        }
                    ]
                }
            )
            mock_access_grants.get = AsyncMock(return_value=None)

            result = await sync_oidc_user(mock_db, claims)

        assert result == refreshed_user
        mock_crud.create.assert_awaited_once()
        mock_crud.update.assert_awaited_once()

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
        assert "last_login_at" in update_kwargs["object"]
        assert "role_ids" not in update_kwargs["object"]


class TestOidcCallback:
    @pytest.mark.asyncio
    async def test_oidc_login_delegates_to_service(self):
        request = make_request()
        mock_service = Mock()
        mock_service.login = AsyncMock(return_value="redirect-response")

        result = await oidc_login(request, mock_service, ui_locales=None)

        assert result == "redirect-response"
        mock_service.login.assert_awaited_once_with(request, ui_locales=None)

    @pytest.mark.asyncio
    async def test_oidc_callback_delegates_to_service(self, mock_db):
        request = make_request()
        mock_service = Mock()
        response = Mock(status_code=307, headers={"location": "/app"})
        mock_service.callback = AsyncMock(return_value=response)

        result = await oidc_callback(request, mock_db, mock_service)

        assert result is response
        mock_service.callback.assert_awaited_once_with(request=request, db=mock_db)


class TestOidcConfiguration:
    def test_get_oidc_client_raises_service_unavailable_when_client_is_not_configured(self):
        with patch("src.app.core.oidc.register_oidc_client"):
            with patch("src.app.core.oidc.oauth.create_client", return_value=None):
                with pytest.raises(CustomException) as exc_info:
                    get_oidc_client()

        assert exc_info.value.status_code == 503
        assert exc_info.value.detail == "OIDC login is not configured."

    def test_get_oidc_server_metadata_url_appends_discovery_path_for_base_url(self):
        with patch.object(settings, "OIDC_SERVER_METADATA_URL", "https://cds-gcsignin-dev.verify.ibm.com"):
            assert (
                get_oidc_server_metadata_url()
                == "https://cds-gcsignin-dev.verify.ibm.com/.well-known/openid-configuration"
            )

    def test_get_oidc_server_metadata_url_preserves_explicit_discovery_url(self):
        discovery_url = "https://cds-gcsignin-dev.verify.ibm.com/.well-known/openid-configuration"

        with patch.object(settings, "OIDC_SERVER_METADATA_URL", discovery_url):
            assert get_oidc_server_metadata_url() == discovery_url


class TestBuildOidcRedirectUri:
    def test_uses_explicit_redirect_uri_when_configured(self):
        request = make_request()

        with patch.object(settings, "OIDC_REDIRECT_URI", "http://127.0.0.1:8000/api/v1/auth/oidc/callback"):
            redirect_uri = build_oidc_redirect_uri(request)

        assert redirect_uri == "http://127.0.0.1:8000/api/v1/auth/oidc/callback"

    def test_falls_back_to_request_callback_route_when_no_explicit_redirect_uri(self):
        request = Mock()
        request.url_for = Mock(return_value="http://localhost:8000/api/v1/auth/oidc/callback")

        with patch.object(settings, "OIDC_REDIRECT_URI", None):
            redirect_uri = build_oidc_redirect_uri(request)

        assert redirect_uri == "http://localhost:8000/api/v1/auth/oidc/callback"
