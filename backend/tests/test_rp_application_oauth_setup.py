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
                "clientId": "client-id-123",
                "clientSecret": "secret-value-123",
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
            "clientId": "client-id-123",
            "clientSecret": "secret-value-123",
            "pkceEnabled": True,
            "redirectUris": ["https://benefits.example.gc.ca/callback"],
            "logoutUri": "https://benefits.example.gc.ca/backchannel-logout",
            "logoutRedirectUris": [
                "https://benefits.example.gc.ca/logout-complete"
            ],
        }

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
    async def test_service_raises_unexpected_error_when_secret_missing(self) -> None:
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

        try:
            with pytest.raises(RuntimeError):
                await service.get_current_user_rp_application_oauth_setup(
                    db=db,
                    rp_application_uuid="018f6f83-0000-0000-0000-000000000337",
                    current_user={"email": "owner@example.gc.ca"},
                    ibm_admin_client=ibm_admin_client,
                )
        finally:
            rp_application_module.crud_rp_applications.get = original_get

        ibm_admin_client.get_application_detail.assert_awaited_once_with("ibm-app-337")
        ibm_admin_client.get_client_secret.assert_awaited_once_with("client-id-337")
