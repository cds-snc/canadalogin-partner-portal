from unittest.mock import AsyncMock, Mock

import pytest
from fastapi.testclient import TestClient

import src.app.services.rp_application_service as rp_application_module
from src.app.api.dependencies import get_current_user, get_rp_application_service
from src.app.core.db.database import async_get_db
from src.app.core.exceptions.http_exceptions import ForbiddenException, NotFoundException
from src.app.main import app
from src.app.repositories.dependencies import get_ibm_sv_admin_client
from src.app.services.rp_application_service import RPApplicationService


class TestCurrentUserRPOAuthSetupAPI:
    def test_oauth_setup_owner_success_response_contract(self) -> None:
        service = Mock()
        service.get_current_user_rp_application_oauth_setup = AsyncMock(
            return_value={
                "rpApplicationName": "Benefits Portal",
                "status": "active",
                "applicationUrl": "https://benefits.example.gc.ca",
                "discoveryEndpoint": "https://cds-gcsignin-dev.verify.ibm.com/oauth2/.well-known/openid-configuration",
                "pkceEnabled": True,
                "redirectUris": [
                    "https://benefits.example.gc.ca/callback",
                ],
                "logoutUri": "https://benefits.example.gc.ca/backchannel-logout",
                "logoutRedirectUris": [
                    "https://benefits.example.gc.ca/logout-complete",
                ],
            }
        )

        app.dependency_overrides[get_current_user] = lambda: {
            "email": "owner@example.gc.ca",
            "id": 42,
            "uuid": "018f6f83-0000-0000-0000-000000000111",
        }
        app.dependency_overrides[get_rp_application_service] = lambda: service
        app.dependency_overrides[get_ibm_sv_admin_client] = lambda: Mock()
        app.dependency_overrides[async_get_db] = lambda: Mock()

        try:
            with TestClient(app) as client:
                response = client.get(
                    "/api/v1/rp-applications/mine/"
                    "018f6f83-0000-0000-0000-000000000333/oauth-setup"
                )
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 200
        assert response.json() == {
            "rpApplicationName": "Benefits Portal",
            "status": "active",
            "applicationUrl": "https://benefits.example.gc.ca",
            "discoveryEndpoint": "https://cds-gcsignin-dev.verify.ibm.com/oauth2/.well-known/openid-configuration",
            "pkceEnabled": True,
            "redirectUris": ["https://benefits.example.gc.ca/callback"],
            "logoutUri": "https://benefits.example.gc.ca/backchannel-logout",
            "logoutRedirectUris": [
                "https://benefits.example.gc.ca/logout-complete"
            ],
        }

    def test_client_credentials_owner_success_response_contract(self) -> None:
        service = Mock()
        service.get_current_user_rp_application_client_credentials = AsyncMock(
            return_value={
                "clientId": "client-id-123",
                "clientSecret": "secret-value-123",
                "clientSecretId": "secret-id-123",
            }
        )

        app.dependency_overrides[get_current_user] = lambda: {
            "email": "owner@example.gc.ca",
            "id": 42,
            "uuid": "018f6f83-0000-0000-0000-000000000111",
        }
        app.dependency_overrides[get_rp_application_service] = lambda: service
        app.dependency_overrides[get_ibm_sv_admin_client] = lambda: Mock()
        app.dependency_overrides[async_get_db] = lambda: Mock()

        try:
            with TestClient(app) as client:
                response = client.get(
                    "/api/v1/rp-applications/mine/"
                    "018f6f83-0000-0000-0000-000000000333/client"
                )
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 200
        assert response.json() == {
            "clientId": "client-id-123",
            "clientSecret": "secret-value-123",
            "clientSecretId": "secret-id-123",
        }

    def test_rotated_secrets_owner_success_response_contract(self) -> None:
        service = Mock()
        service.list_current_user_rp_application_rotated_secrets = AsyncMock(
            return_value=[
                {
                    "description": "30 days",
                    "expiredAt": 1782345600,
                    "path": "/rotatedSecrets/0",
                    "rotatedAt": 1779824867,
                    "value": "{sha512}redacted",
                    "secretId": "/rotatedSecrets/0",
                }
            ]
        )

        app.dependency_overrides[get_current_user] = lambda: {
            "email": "owner@example.gc.ca",
            "id": 42,
            "uuid": "018f6f83-0000-0000-0000-000000000111",
        }
        app.dependency_overrides[get_rp_application_service] = lambda: service
        app.dependency_overrides[get_ibm_sv_admin_client] = lambda: Mock()
        app.dependency_overrides[async_get_db] = lambda: Mock()

        try:
            with TestClient(app) as client:
                response = client.get(
                    "/api/v1/rp-applications/mine/"
                    "018f6f83-0000-0000-0000-000000000333/client/rotated-secrets"
                )
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 200
        assert response.json() == [
            {
                "description": "30 days",
                "expiredAt": 1782345600,
                "rotatedAt": 1779824867,
                "value": "{sha512}redacted",
                "secretId": "/rotatedSecrets/0",
            }
        ]

    def test_rotate_secret_owner_success_response_contract(self) -> None:
        service = Mock()
        service.rotate_current_user_rp_application_client_secret = AsyncMock(
            return_value={
                "clientId": "client-id-123",
                "clientSecret": "secret-value-456",
                "clientSecretId": "secret-id-456",
            }
        )

        app.dependency_overrides[get_current_user] = lambda: {
            "email": "owner@example.gc.ca",
            "id": 42,
            "uuid": "018f6f83-0000-0000-0000-000000000111",
        }
        app.dependency_overrides[get_rp_application_service] = lambda: service
        app.dependency_overrides[get_ibm_sv_admin_client] = lambda: Mock()
        app.dependency_overrides[async_get_db] = lambda: Mock()

        try:
            with TestClient(app) as client:
                response = client.post(
                    "/api/v1/rp-applications/mine/"
                    "018f6f83-0000-0000-0000-000000000333/client/rotate-secret",
                    json={
                        "deleteRotatedSecrets": False,
                        "description": "",
                        "rotatedSecretExpiredAt": 0,
                    },
                )
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 200
        assert response.json() == {
            "clientId": "client-id-123",
            "clientSecret": "secret-value-456",
            "clientSecretId": "secret-id-456",
        }

    def test_delete_rotated_secret_owner_success_response_contract(self) -> None:
        service = Mock()
        service.delete_current_user_rp_application_rotated_secret = AsyncMock(
            return_value=True
        )

        app.dependency_overrides[get_current_user] = lambda: {
            "email": "owner@example.gc.ca",
            "id": 42,
            "uuid": "018f6f83-0000-0000-0000-000000000111",
        }
        app.dependency_overrides[get_rp_application_service] = lambda: service
        app.dependency_overrides[get_ibm_sv_admin_client] = lambda: Mock()
        app.dependency_overrides[async_get_db] = lambda: Mock()

        try:
            with TestClient(app) as client:
                response = client.delete(
                    "/api/v1/rp-applications/mine/"
                    "018f6f83-0000-0000-0000-000000000333/client/rotated-secrets/"
                    "%7Bsha512%7Dredacted"
                )
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 200
        assert response.json() == {"message": "Rotated client secret deleted"}
        service.delete_current_user_rp_application_rotated_secret.assert_awaited_once()
        assert (
            service.delete_current_user_rp_application_rotated_secret.await_args.kwargs[
                "value"
            ]
            == "{sha512}redacted"
        )

    def test_oauth_setup_non_owner_returns_403(self) -> None:
        service = Mock()
        service.get_current_user_rp_application_oauth_setup = AsyncMock(
            side_effect=ForbiddenException(
                "Only RP application owners can view OAuth setup"
            )
        )

        app.dependency_overrides[get_current_user] = lambda: {
            "email": "viewer@example.gc.ca",
            "id": 43,
            "uuid": "018f6f83-0000-0000-0000-000000000112",
        }
        app.dependency_overrides[get_rp_application_service] = lambda: service
        app.dependency_overrides[get_ibm_sv_admin_client] = lambda: Mock()
        app.dependency_overrides[async_get_db] = lambda: Mock()

        try:
            with TestClient(app) as client:
                response = client.get(
                    "/api/v1/rp-applications/mine/"
                    "018f6f83-0000-0000-0000-000000000334/oauth-setup"
                )
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 403
        assert response.json()["error"]["code"] == "forbidden"

    def test_oauth_setup_missing_resource_returns_404(self) -> None:
        service = Mock()
        service.get_current_user_rp_application_oauth_setup = AsyncMock(
            side_effect=NotFoundException("RP application not found")
        )

        app.dependency_overrides[get_current_user] = lambda: {
            "email": "owner@example.gc.ca",
            "id": 42,
            "uuid": "018f6f83-0000-0000-0000-000000000111",
        }
        app.dependency_overrides[get_rp_application_service] = lambda: service
        app.dependency_overrides[get_ibm_sv_admin_client] = lambda: Mock()
        app.dependency_overrides[async_get_db] = lambda: Mock()

        try:
            with TestClient(app) as client:
                response = client.get(
                    "/api/v1/rp-applications/mine/"
                    "018f6f83-0000-0000-0000-000000000335/oauth-setup"
                )
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 404
        assert response.json()["error"]["code"] == "not_found"


class TestCurrentUserRPOAuthSetupService:
    @pytest.mark.asyncio
    async def test_service_short_circuits_upstream_for_non_owner(self) -> None:
        service = RPApplicationService()
        db = Mock()
        ibm_admin_client = Mock()
        ibm_admin_client.get_application_detail = AsyncMock()

        original_get = rp_application_module.crud_rp_applications.get
        rp_application_module.crud_rp_applications.get = AsyncMock(
            return_value={
                "uuid": "018f6f83-0000-0000-0000-000000000336",
                "dnr_app_name": "Benefits Portal",
                "ibm_sv_application_id": "ibm-app-336",
                "application_owner": {
                    "owners": [{"email": "owner@example.gc.ca"}],
                },
            }
        )

        try:
            with pytest.raises(ForbiddenException):
                await service.get_current_user_rp_application_oauth_setup(
                    db=db,
                    rp_application_uuid="018f6f83-0000-0000-0000-000000000336",
                    current_user={"email": "not-owner@example.gc.ca"},
                    ibm_admin_client=ibm_admin_client,
                )
        finally:
            rp_application_module.crud_rp_applications.get = original_get

        ibm_admin_client.get_application_detail.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_client_credentials_raises_unexpected_error_when_secret_missing(self) -> None:
        service = RPApplicationService()
        db = Mock()
        ibm_admin_client = Mock()
        ibm_admin_client.get_application_detail = AsyncMock(
            return_value={
                "applicationState": True,
                "providers": {
                    "oidc": {
                        "applicationUrl": "https://benefits.example.gc.ca",
                        "requirePkceVerification": "true",
                        "properties": {
                            "clientId": "client-id-337",
                            "redirectUris": [
                                "https://benefits.example.gc.ca/callback"
                            ],
                        },
                    }
                },
            }
        )
        ibm_admin_client.get_client_secret = AsyncMock(return_value={})

        original_get = rp_application_module.crud_rp_applications.get
        original_create_audit_log = rp_application_module.crud_audit_log.create
        rp_application_module.crud_rp_applications.get = AsyncMock(
            return_value={
                "uuid": "018f6f83-0000-0000-0000-000000000337",
                "dnr_app_name": "Benefits Portal",
                "ibm_sv_application_id": "ibm-app-337",
                "application_owner": {
                    "owners": [{"email": "owner@example.gc.ca"}],
                },
            }
        )
        rp_application_module.crud_audit_log.create = AsyncMock()

        try:
            with pytest.raises(RuntimeError):
                await service.get_current_user_rp_application_client_credentials(
                    db=db,
                    rp_application_uuid="018f6f83-0000-0000-0000-000000000337",
                    current_user={"email": "owner@example.gc.ca"},
                    ibm_admin_client=ibm_admin_client,
                )
        finally:
            rp_application_module.crud_rp_applications.get = original_get
            rp_application_module.crud_audit_log.create = original_create_audit_log

        ibm_admin_client.get_application_detail.assert_awaited_once_with("ibm-app-337")
        ibm_admin_client.get_client_secret.assert_awaited_once_with("client-id-337")

    @pytest.mark.asyncio
    async def test_list_rotated_secrets_normalizes_response_contract(self) -> None:
        service = RPApplicationService()
        db = Mock()
        ibm_admin_client = Mock()
        ibm_admin_client.get_application_detail = AsyncMock(
            return_value={
                "providers": {
                    "oidc": {
                        "properties": {
                            "clientId": "client-id-338",
                        }
                    }
                }
            }
        )
        ibm_admin_client.get_client_secret = AsyncMock(
            return_value={
                "additionalConfig": {
                    "rotatedSecrets": [
                        {
                            "description": "30 days",
                            "value": "{sha512}redacted",
                            "rotatedAt": 1779824867.0,
                            "expiredAt": 1782345600.0,
                        }
                    ]
                }
            }
        )

        original_get = rp_application_module.crud_rp_applications.get
        original_create_audit_log = rp_application_module.crud_audit_log.create
        rp_application_module.crud_rp_applications.get = AsyncMock(
            return_value={
                "uuid": "018f6f83-0000-0000-0000-000000000338",
                "dnr_app_name": "Benefits Portal",
                "ibm_sv_application_id": "ibm-app-338",
                "application_owner": {
                    "owners": [{"email": "owner@example.gc.ca"}],
                },
            }
        )
        rp_application_module.crud_audit_log.create = AsyncMock()

        try:
            result = await service.list_current_user_rp_application_rotated_secrets(
                db=db,
                rp_application_uuid="018f6f83-0000-0000-0000-000000000338",
                current_user={"email": "owner@example.gc.ca"},
                ibm_admin_client=ibm_admin_client,
            )
        finally:
            rp_application_module.crud_rp_applications.get = original_get
            rp_application_module.crud_audit_log.create = original_create_audit_log

        assert result == [
            {
                "description": "30 days",
                "expiredAt": 1782345600,
                "rotatedAt": 1779824867,
                "value": "{sha512}redacted",
                "secretId": "/rotatedSecrets/0",
            }
        ]

    @pytest.mark.asyncio
    async def test_delete_rotated_secret_resolves_internal_path_from_value(self) -> None:
        service = RPApplicationService()
        db = Mock()
        ibm_admin_client = Mock()
        ibm_admin_client.get_application_detail = AsyncMock(
            return_value={
                "providers": {
                    "oidc": {
                        "properties": {
                            "clientId": "client-id-339",
                        }
                    }
                }
            }
        )
        ibm_admin_client.get_client_secret = AsyncMock(
            return_value={
                "additionalConfig": {
                    "rotatedSecrets": [
                        {
                            "description": "30 days",
                            "value": "{sha512}redacted",
                            "rotatedAt": 1779824867.0,
                            "expiredAt": 1782345600.0,
                        }
                    ]
                }
            }
        )
        ibm_admin_client.delete_rotated_client_secrets = AsyncMock(return_value=True)

        original_get = rp_application_module.crud_rp_applications.get
        original_create_audit_log = rp_application_module.crud_audit_log.create
        rp_application_module.crud_rp_applications.get = AsyncMock(
            return_value={
                "uuid": "018f6f83-0000-0000-0000-000000000339",
                "dnr_app_name": "Benefits Portal",
                "ibm_sv_application_id": "ibm-app-339",
                "application_owner": {
                    "owners": [{"email": "owner@example.gc.ca"}],
                },
            }
        )
        rp_application_module.crud_audit_log.create = AsyncMock()

        try:
            result = await service.delete_current_user_rp_application_rotated_secret(
                db=db,
                rp_application_uuid="018f6f83-0000-0000-0000-000000000339",
                current_user={"email": "owner@example.gc.ca"},
                value="{sha512}redacted",
                ibm_admin_client=ibm_admin_client,
            )
        finally:
            rp_application_module.crud_rp_applications.get = original_get
            rp_application_module.crud_audit_log.create = original_create_audit_log

        assert result is True
        ibm_admin_client.delete_rotated_client_secrets.assert_awaited_once_with(
            "client-id-339",
            ["{sha512}redacted"],
        )
