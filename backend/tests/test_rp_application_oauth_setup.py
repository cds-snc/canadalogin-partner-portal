from unittest.mock import AsyncMock, Mock

import pytest
from fastapi.testclient import TestClient

import src.app.services.rp_application_service as rp_application_module
from src.app.api.dependencies import get_current_user, get_rp_application_service
from src.app.core.db.database import async_get_db
from src.app.core.exceptions.http_exceptions import ForbiddenException
from src.app.main import app
from src.app.repositories.dependencies import get_ibm_sv_admin_client
from src.app.services.rp_application_service import RPApplicationService


class TestLegacyRPApplicationAPIDisabled:
    def test_oauth_setup_is_denied_before_service_call(self) -> None:
        service = Mock()
        service.get_current_user_rp_application_oauth_setup = AsyncMock(
            side_effect=ForbiddenException("Only RP application owners can view OAuth setup")
        )

        app.dependency_overrides[get_current_user] = lambda: {
            "email": "viewer@example.gc.ca",
            "id": 43,
            "username": "viewer@example.gc.ca",
            "is_superuser": True,
            "uuid": "018f6f83-0000-0000-0000-000000000112",
        }
        app.dependency_overrides[get_rp_application_service] = lambda: service
        app.dependency_overrides[get_ibm_sv_admin_client] = lambda: Mock()
        app.dependency_overrides[async_get_db] = lambda: Mock()

        try:
            with TestClient(app) as client:
                response = client.get("/api/v1/rp-applications/mine/018f6f83-0000-0000-0000-000000000334/oauth-setup")
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 403
        assert response.json()["error"]["code"] == "forbidden"
        service.get_current_user_rp_application_oauth_setup.assert_not_awaited()

    def test_oauth_setup_missing_resource_is_also_denied_before_service_call(self) -> None:
        service = Mock()
        service.get_current_user_rp_application_oauth_setup = AsyncMock()

        app.dependency_overrides[get_current_user] = lambda: {
            "email": "owner@example.gc.ca",
            "id": 42,
            "username": "owner@example.gc.ca",
            "is_superuser": True,
            "uuid": "018f6f83-0000-0000-0000-000000000111",
        }
        app.dependency_overrides[get_rp_application_service] = lambda: service
        app.dependency_overrides[get_ibm_sv_admin_client] = lambda: Mock()
        app.dependency_overrides[async_get_db] = lambda: Mock()

        try:
            with TestClient(app) as client:
                response = client.get("/api/v1/rp-applications/mine/018f6f83-0000-0000-0000-000000000335/oauth-setup")
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 403
        assert response.json()["error"]["code"] == "forbidden"
        service.get_current_user_rp_application_oauth_setup.assert_not_awaited()


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
async def test_shared_rp_audit_helper_logs_non_secret_operation() -> None:
    db = Mock()
    log_action = AsyncMock()
    original_log_action = rp_application_module.AuditService.log_action
    rp_application_module.AuditService.log_action = log_action
    try:
        await RPApplicationService()._create_audit_log_entry(
            db=db,
            current_user={"name": "Developer", "uuid": "user-uuid"},
            rp_application_data={"uuid": "application-uuid"},
            operation="UPDATE",
            description="Updated RP application",
        )
    finally:
        rp_application_module.AuditService.log_action = original_log_action

    log_action.assert_awaited_once_with(
        db=db,
        user="Developer",
        user_uuid="user-uuid",
        target="rp_application",
        target_uuid="application-uuid",
        operation="UPDATE",
        description="Updated RP application",
    )
