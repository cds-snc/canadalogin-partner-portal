from unittest.mock import AsyncMock, Mock
from uuid import UUID

import casbin
import pytest
from fastapi.testclient import TestClient

import src.app.services.rp_application_service as rp_application_module
from src.app.api.dependencies import get_current_user, get_rp_application_service
from src.app.core.access_control import CASBIN_MODEL_PATH, database_enforcer_provider
from src.app.core.authorization import CanonicalRoleCode
from src.app.core.db.database import async_get_db
from src.app.core.exceptions.http_exceptions import NotFoundException
from src.app.main import app
from src.app.repositories.dependencies import get_ibm_sv_admin_client
from src.app.services.authorization_service import (
    AUTHORIZATION_STATE_KEY,
    ResolvedAuthorizationState,
    ResolvedPartnerAccess,
)
from src.app.services.rp_application_service import RPApplicationService

WORKSPACE_UUID = UUID("018f6f83-0000-0000-0000-000000000023")


def current_user_with_partner_role(role: CanonicalRoleCode) -> dict:
    return {
        "id": 77,
        AUTHORIZATION_STATE_KEY: ResolvedAuthorizationState(
            partner_access=(
                ResolvedPartnerAccess(
                    workspace_id=23,
                    workspace_uuid=WORKSPACE_UUID,
                    role=role,
                ),
            )
        ),
    }


def make_enforcer(*policies: tuple[str, str, str]) -> casbin.Enforcer:
    enforcer = casbin.Enforcer(str(CASBIN_MODEL_PATH))
    if policies:
        enforcer.add_policies(list(policies))
    return enforcer


def override_rp_application_authorization() -> None:
    app.dependency_overrides[database_enforcer_provider] = lambda: make_enforcer(
        ("admin", "rp_applications", "read"),
        ("admin", "rp_client_secret", "read"),
        ("admin", "rp_client_secret", "write"),
    )


class TestAccessibleRPOAuthSetupAPI:
    def test_oauth_setup_grant_backed_user_without_platform_role_reaches_service(self) -> None:
        service = Mock()
        service.get_accessible_rp_application_oauth_setup = AsyncMock(
            return_value={
                "rpApplicationName": "Benefits Portal",
                "status": "active",
                "canadaLoginEnvironment": "production",
                "onboardingState": "under_review",
                "promotionStatus": "review_tracked",
                "applicationUrl": "https://benefits.example.gc.ca",
                "discoveryEndpoint": "https://cds-gcsignin-dev.verify.ibm.com/oauth2/.well-known/openid-configuration",
                "departmentName": "Benefits",
                "departmentNameFr": "Prestations",
                "pkceEnabled": True,
                "redirectUris": ["https://benefits.example.gc.ca/callback"],
                "logoutUri": "https://benefits.example.gc.ca/backchannel-logout",
                "logoutRedirectUris": ["https://benefits.example.gc.ca/logout-complete"],
            }
        )

        current_user = {
            "email": "invitee@example.gc.ca",
            "id": 77,
            "username": "invitee@example.gc.ca",
            "is_superuser": False,
            "role_ids": [],
        }
        app.dependency_overrides[get_current_user] = lambda: current_user
        app.dependency_overrides[get_rp_application_service] = lambda: service
        app.dependency_overrides[get_ibm_sv_admin_client] = lambda: Mock()
        app.dependency_overrides[async_get_db] = lambda: Mock()

        try:
            with TestClient(app) as client:
                response = client.get("/api/v1/rp-applications/accessible/018f6f83-0000-0000-0000-000000000333/oauth-setup")
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 200
        assert response.json()["rpApplicationName"] == "Benefits Portal"
        assert response.json()["onboardingState"] == "under_review"
        assert response.json()["promotionStatus"] == "review_tracked"
        service.get_accessible_rp_application_oauth_setup.assert_awaited_once()

    def test_oauth_setup_granted_partner_success_response_contract(self) -> None:
        service = Mock()
        service.get_accessible_rp_application_oauth_setup = AsyncMock(
            return_value={
                "rpApplicationName": "Benefits Portal",
                "status": "active",
                "canadaLoginEnvironment": "staging",
                "onboardingState": "submitted",
                "promotionStatus": None,
                "applicationUrl": "https://benefits.example.gc.ca",
                "discoveryEndpoint": "https://cds-gcsignin-dev.verify.ibm.com/oauth2/.well-known/openid-configuration",
                "departmentName": None,
                "departmentNameFr": None,
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
            "username": "owner@example.gc.ca",
            "is_superuser": True,
            "uuid": "018f6f83-0000-0000-0000-000000000111",
        }
        override_rp_application_authorization()
        app.dependency_overrides[get_rp_application_service] = lambda: service
        app.dependency_overrides[get_ibm_sv_admin_client] = lambda: Mock()
        app.dependency_overrides[async_get_db] = lambda: Mock()

        try:
            with TestClient(app) as client:
                response = client.get("/api/v1/rp-applications/accessible/018f6f83-0000-0000-0000-000000000333/oauth-setup")
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 200
        assert response.json() == {
            "rpApplicationName": "Benefits Portal",
            "status": "active",
            "canadaLoginEnvironment": "staging",
            "onboardingState": "submitted",
            "promotionStatus": None,
            "applicationUrl": "https://benefits.example.gc.ca",
            "discoveryEndpoint": "https://cds-gcsignin-dev.verify.ibm.com/oauth2/.well-known/openid-configuration",
            "departmentName": None,
            "departmentNameFr": None,
            "pkceEnabled": True,
            "redirectUris": ["https://benefits.example.gc.ca/callback"],
            "logoutUri": "https://benefits.example.gc.ca/backchannel-logout",
            "logoutRedirectUris": ["https://benefits.example.gc.ca/logout-complete"],
        }

    def test_client_credentials_grant_backed_user_without_platform_role_reaches_service(self) -> None:
        service = Mock()
        service.get_accessible_rp_application_client_credentials = AsyncMock(
            return_value={
                "clientId": "client-id-123",
                "clientSecret": "secret-value-123",
                "clientSecretId": "secret-id-123",
            }
        )

        current_user = {
            "email": "invitee@example.gc.ca",
            "id": 77,
            "username": "invitee@example.gc.ca",
            "is_superuser": False,
            "role_ids": [],
        }
        app.dependency_overrides[get_current_user] = lambda: current_user
        app.dependency_overrides[get_rp_application_service] = lambda: service
        app.dependency_overrides[get_ibm_sv_admin_client] = lambda: Mock()
        app.dependency_overrides[async_get_db] = lambda: Mock()

        try:
            with TestClient(app) as client:
                response = client.get("/api/v1/rp-applications/accessible/018f6f83-0000-0000-0000-000000000333/client")
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 200
        assert response.json() == {
            "clientId": "client-id-123",
            "clientSecret": "secret-value-123",
            "clientSecretId": "secret-id-123",
        }
        service.get_accessible_rp_application_client_credentials.assert_awaited_once()

    def test_client_credentials_granted_partner_success_response_contract(self) -> None:
        service = Mock()
        service.get_accessible_rp_application_client_credentials = AsyncMock(
            return_value={
                "clientId": "client-id-123",
                "clientSecret": "secret-value-123",
                "clientSecretId": "secret-id-123",
            }
        )

        app.dependency_overrides[get_current_user] = lambda: {
            "email": "owner@example.gc.ca",
            "id": 42,
            "username": "owner@example.gc.ca",
            "is_superuser": True,
            "uuid": "018f6f83-0000-0000-0000-000000000111",
        }
        override_rp_application_authorization()
        app.dependency_overrides[get_rp_application_service] = lambda: service
        app.dependency_overrides[get_ibm_sv_admin_client] = lambda: Mock()
        app.dependency_overrides[async_get_db] = lambda: Mock()

        try:
            with TestClient(app) as client:
                response = client.get("/api/v1/rp-applications/accessible/018f6f83-0000-0000-0000-000000000333/client")
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 200
        assert response.json() == {
            "clientId": "client-id-123",
            "clientSecret": "secret-value-123",
            "clientSecretId": "secret-id-123",
        }

    def test_rotated_secrets_granted_partner_success_response_contract(self) -> None:
        service = Mock()
        service.list_accessible_rp_application_rotated_secrets = AsyncMock(
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
            "username": "owner@example.gc.ca",
            "is_superuser": True,
            "uuid": "018f6f83-0000-0000-0000-000000000111",
        }
        override_rp_application_authorization()
        app.dependency_overrides[get_rp_application_service] = lambda: service
        app.dependency_overrides[get_ibm_sv_admin_client] = lambda: Mock()
        app.dependency_overrides[async_get_db] = lambda: Mock()

        try:
            with TestClient(app) as client:
                response = client.get("/api/v1/rp-applications/accessible/018f6f83-0000-0000-0000-000000000333/client/rotated-secrets")
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

    def test_rotate_secret_granted_partner_success_response_contract(self) -> None:
        service = Mock()
        service.rotate_accessible_rp_application_client_secret = AsyncMock(
            return_value={
                "clientId": "client-id-123",
                "clientSecret": "secret-value-456",
                "clientSecretId": "secret-id-456",
            }
        )

        app.dependency_overrides[get_current_user] = lambda: {
            "email": "owner@example.gc.ca",
            "id": 42,
            "username": "owner@example.gc.ca",
            "is_superuser": True,
            "uuid": "018f6f83-0000-0000-0000-000000000111",
        }
        override_rp_application_authorization()
        app.dependency_overrides[get_rp_application_service] = lambda: service
        app.dependency_overrides[get_ibm_sv_admin_client] = lambda: Mock()
        app.dependency_overrides[async_get_db] = lambda: Mock()

        try:
            with TestClient(app) as client:
                response = client.post(
                    "/api/v1/rp-applications/accessible/018f6f83-0000-0000-0000-000000000333/client/rotate-secret",
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

    def test_delete_rotated_secret_granted_partner_success_response_contract(self) -> None:
        service = Mock()
        service.delete_accessible_rp_application_rotated_secret = AsyncMock(return_value=True)

        app.dependency_overrides[get_current_user] = lambda: {
            "email": "owner@example.gc.ca",
            "id": 42,
            "username": "owner@example.gc.ca",
            "is_superuser": True,
            "uuid": "018f6f83-0000-0000-0000-000000000111",
        }
        override_rp_application_authorization()
        app.dependency_overrides[get_rp_application_service] = lambda: service
        app.dependency_overrides[get_ibm_sv_admin_client] = lambda: Mock()
        app.dependency_overrides[async_get_db] = lambda: Mock()

        try:
            with TestClient(app) as client:
                response = client.request(
                    "DELETE",
                    "/api/v1/rp-applications/accessible/018f6f83-0000-0000-0000-000000000333/client/rotated-secrets",
                    json={"secretId": "/rotatedSecrets/0"},
                )
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 200
        assert response.json() == {"message": "Rotated client secret deleted"}
        service.delete_accessible_rp_application_rotated_secret.assert_awaited_once()
        assert service.delete_accessible_rp_application_rotated_secret.await_args.kwargs["secret_id"] == "/rotatedSecrets/0"

    def test_oauth_setup_out_of_scope_returns_404(self) -> None:
        service = Mock()
        service.get_accessible_rp_application_oauth_setup = AsyncMock(side_effect=NotFoundException("RP application not found"))

        app.dependency_overrides[get_current_user] = lambda: {
            "email": "viewer@example.gc.ca",
            "id": 43,
            "username": "viewer@example.gc.ca",
            "is_superuser": True,
            "uuid": "018f6f83-0000-0000-0000-000000000112",
        }
        override_rp_application_authorization()
        app.dependency_overrides[get_rp_application_service] = lambda: service
        app.dependency_overrides[get_ibm_sv_admin_client] = lambda: Mock()
        app.dependency_overrides[async_get_db] = lambda: Mock()

        try:
            with TestClient(app) as client:
                response = client.get("/api/v1/rp-applications/accessible/018f6f83-0000-0000-0000-000000000334/oauth-setup")
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 404
        assert response.json()["error"]["code"] == "not_found"

    def test_oauth_setup_missing_resource_returns_404(self) -> None:
        service = Mock()
        service.get_accessible_rp_application_oauth_setup = AsyncMock(side_effect=NotFoundException("RP application not found"))

        app.dependency_overrides[get_current_user] = lambda: {
            "email": "owner@example.gc.ca",
            "id": 42,
            "username": "owner@example.gc.ca",
            "is_superuser": True,
            "uuid": "018f6f83-0000-0000-0000-000000000111",
        }
        override_rp_application_authorization()
        app.dependency_overrides[get_rp_application_service] = lambda: service
        app.dependency_overrides[get_ibm_sv_admin_client] = lambda: Mock()
        app.dependency_overrides[async_get_db] = lambda: Mock()

        try:
            with TestClient(app) as client:
                response = client.get("/api/v1/rp-applications/accessible/018f6f83-0000-0000-0000-000000000335/oauth-setup")
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 404
        assert response.json()["error"]["code"] == "not_found"


class TestAccessibleRPOAuthSetupService:
    @pytest.mark.parametrize(
        "current_user",
        [
            {
                "id": 78,
                AUTHORIZATION_STATE_KEY: ResolvedAuthorizationState(),
            },
            {
                "id": 79,
                AUTHORIZATION_STATE_KEY: ResolvedAuthorizationState(global_role=CanonicalRoleCode.CL_ADMIN),
            },
        ],
        ids=["no-access", "cl-admin"],
    )
    @pytest.mark.asyncio
    async def test_service_short_circuits_upstream_without_workspace_grant(
        self,
        current_user: dict,
    ) -> None:
        service = RPApplicationService()
        db = Mock()
        ibm_admin_client = Mock()
        ibm_admin_client.get_application_detail = AsyncMock()

        original_get = rp_application_module.crud_rp_applications.get
        rp_application_module.crud_rp_applications.get = AsyncMock(
            return_value={
                "uuid": "018f6f83-0000-0000-0000-000000000336",
                "workspace_id": 23,
                "dnr_app_name": "Benefits Portal",
                "ibm_sv_application_id": "ibm-app-336",
                "application_owner": {
                    "owners": [{"email": "owner@example.gc.ca"}],
                },
            }
        )

        try:
            with pytest.raises(NotFoundException):
                await service.get_accessible_rp_application_oauth_setup(
                    db=db,
                    rp_application_uuid="018f6f83-0000-0000-0000-000000000336",
                    current_user=current_user,
                    ibm_admin_client=ibm_admin_client,
                )
        finally:
            rp_application_module.crud_rp_applications.get = original_get

        ibm_admin_client.get_application_detail.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_oauth_setup_allows_read_only_grant_user(self) -> None:
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
                            "clientId": "client-id-336",
                            "redirectUris": ["https://benefits.example.gc.ca/callback"],
                            "additionalConfig": {},
                        },
                    }
                },
            }
        )

        original_get = rp_application_module.crud_rp_applications.get
        original_department_get = rp_application_module.crud_departments.get
        rp_application_module.crud_rp_applications.get = AsyncMock(
            return_value={
                "uuid": "018f6f83-0000-0000-0000-000000000336",
                "workspace_id": 23,
                "department_id": 7,
                "dnr_app_name": "Benefits Portal",
                "ibm_sv_application_id": "ibm-app-336",
                "canada_login_environment": "production",
                "onboarding_state": "under_review",
                "promotion_status": "review_tracked",
                "application_owner": {
                    "owners": [{"email": "owner@example.gc.ca"}],
                },
            }
        )
        rp_application_module.crud_departments.get = AsyncMock(return_value={"id": 7, "name": "Benefits", "name_fr": "Prestations"})

        try:
            result = await service.get_accessible_rp_application_oauth_setup(
                db=db,
                rp_application_uuid="018f6f83-0000-0000-0000-000000000336",
                current_user=current_user_with_partner_role(CanonicalRoleCode.READ_ONLY),
                ibm_admin_client=ibm_admin_client,
            )
        finally:
            rp_application_module.crud_rp_applications.get = original_get
            rp_application_module.crud_departments.get = original_department_get

        assert result["rpApplicationName"] == "Benefits Portal"
        assert result["departmentName"] == "Benefits"
        assert result["canadaLoginEnvironment"] == "production"
        assert result["onboardingState"] == "under_review"
        assert result["promotionStatus"] == "review_tracked"

    @pytest.mark.asyncio
    async def test_client_credentials_rejects_read_only_grant_user(self) -> None:
        service = RPApplicationService()
        db = Mock()
        ibm_admin_client = Mock()
        ibm_admin_client.get_application_detail = AsyncMock()

        original_get = rp_application_module.crud_rp_applications.get
        rp_application_module.crud_rp_applications.get = AsyncMock(
            return_value={
                "uuid": "018f6f83-0000-0000-0000-000000000337",
                "workspace_id": 23,
                "dnr_app_name": "Benefits Portal",
                "ibm_sv_application_id": "ibm-app-337",
                "application_owner": {
                    "owners": [{"email": "owner@example.gc.ca"}],
                },
            }
        )
        try:
            with pytest.raises(NotFoundException):
                await service.get_accessible_rp_application_client_credentials(
                    db=db,
                    rp_application_uuid="018f6f83-0000-0000-0000-000000000337",
                    current_user=current_user_with_partner_role(CanonicalRoleCode.READ_ONLY),
                    ibm_admin_client=ibm_admin_client,
                )
        finally:
            rp_application_module.crud_rp_applications.get = original_get

        ibm_admin_client.get_application_detail.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_client_credentials_allows_rp_user_edit_grant_user(self) -> None:
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
        ibm_admin_client.get_client_secret = AsyncMock(return_value={"clientSecret": "secret-value-338", "clientSecretId": "secret-id-338"})

        original_get = rp_application_module.crud_rp_applications.get
        original_log_action = rp_application_module.AuditService.log_action
        rp_application_module.crud_rp_applications.get = AsyncMock(
            return_value={
                "uuid": "018f6f83-0000-0000-0000-000000000338",
                "workspace_id": 23,
                "dnr_app_name": "Benefits Portal",
                "ibm_sv_application_id": "ibm-app-338",
                "application_owner": {
                    "owners": [{"email": "owner@example.gc.ca"}],
                },
            }
        )
        rp_application_module.AuditService.log_action = AsyncMock()

        try:
            result = await service.get_accessible_rp_application_client_credentials(
                db=db,
                rp_application_uuid="018f6f83-0000-0000-0000-000000000338",
                current_user=current_user_with_partner_role(CanonicalRoleCode.RP_USER_EDIT),
                ibm_admin_client=ibm_admin_client,
            )
        finally:
            rp_application_module.crud_rp_applications.get = original_get
            rp_application_module.AuditService.log_action = original_log_action

        assert result == {
            "clientId": "client-id-338",
            "clientSecret": "secret-value-338",
            "clientSecretId": "secret-id-338",
        }

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
                            "redirectUris": ["https://benefits.example.gc.ca/callback"],
                        },
                    }
                },
            }
        )
        ibm_admin_client.get_client_secret = AsyncMock(return_value={})

        original_get = rp_application_module.crud_rp_applications.get
        original_log_action = rp_application_module.AuditService.log_action
        rp_application_module.crud_rp_applications.get = AsyncMock(
            return_value={
                "uuid": "018f6f83-0000-0000-0000-000000000337",
                "workspace_id": 23,
                "dnr_app_name": "Benefits Portal",
                "ibm_sv_application_id": "ibm-app-337",
                "application_owner": {
                    "owners": [{"email": "owner@example.gc.ca"}],
                },
            }
        )
        rp_application_module.AuditService.log_action = AsyncMock()

        try:
            with pytest.raises(RuntimeError):
                await service.get_accessible_rp_application_client_credentials(
                    db=db,
                    rp_application_uuid="018f6f83-0000-0000-0000-000000000337",
                    current_user=current_user_with_partner_role(CanonicalRoleCode.RP_USER_EDIT),
                    ibm_admin_client=ibm_admin_client,
                )
        finally:
            rp_application_module.crud_rp_applications.get = original_get
            rp_application_module.AuditService.log_action = original_log_action

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
        original_log_action = rp_application_module.AuditService.log_action
        rp_application_module.crud_rp_applications.get = AsyncMock(
            return_value={
                "uuid": "018f6f83-0000-0000-0000-000000000338",
                "workspace_id": 23,
                "dnr_app_name": "Benefits Portal",
                "ibm_sv_application_id": "ibm-app-338",
                "application_owner": {
                    "owners": [{"email": "owner@example.gc.ca"}],
                },
            }
        )
        rp_application_module.AuditService.log_action = AsyncMock()

        try:
            result = await service.list_accessible_rp_application_rotated_secrets(
                db=db,
                rp_application_uuid="018f6f83-0000-0000-0000-000000000338",
                current_user=current_user_with_partner_role(CanonicalRoleCode.RP_USER_EDIT),
                ibm_admin_client=ibm_admin_client,
            )
        finally:
            rp_application_module.crud_rp_applications.get = original_get
            rp_application_module.AuditService.log_action = original_log_action

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
    async def test_delete_rotated_secret_uses_non_secret_identifier(self) -> None:
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
        original_log_action = rp_application_module.AuditService.log_action
        rp_application_module.crud_rp_applications.get = AsyncMock(
            return_value={
                "uuid": "018f6f83-0000-0000-0000-000000000339",
                "workspace_id": 23,
                "dnr_app_name": "Benefits Portal",
                "ibm_sv_application_id": "ibm-app-339",
                "application_owner": {
                    "owners": [{"email": "owner@example.gc.ca"}],
                },
            }
        )
        rp_application_module.AuditService.log_action = AsyncMock()

        try:
            result = await service.delete_accessible_rp_application_rotated_secret(
                db=db,
                rp_application_uuid="018f6f83-0000-0000-0000-000000000339",
                current_user=current_user_with_partner_role(CanonicalRoleCode.RP_USER_EDIT),
                secret_id="/rotatedSecrets/0",
                ibm_admin_client=ibm_admin_client,
            )
        finally:
            rp_application_module.crud_rp_applications.get = original_get
            rp_application_module.AuditService.log_action = original_log_action

        assert result is True
        ibm_admin_client.delete_rotated_client_secrets.assert_awaited_once_with(
            "client-id-339",
            ["/rotatedSecrets/0"],
        )
