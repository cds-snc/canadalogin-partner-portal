from unittest.mock import AsyncMock, Mock
from uuid import UUID

import casbin
import pytest
from fastapi.testclient import TestClient
from src.app.api.dependencies import get_current_user, get_rp_application_service
from src.app.core.access_control import CASBIN_MODEL_PATH, database_enforcer_provider
from src.app.core.authorization import CanonicalRoleCode
from src.app.core.db.database import async_get_db
from src.app.core.exceptions.http_exceptions import RPApplicationDepartmentRequiredException
from src.app.main import app
from src.app.repositories.dependencies import get_ibm_sv_admin_client
from src.app.services.authorization_service import (
    AUTHORIZATION_STATE_KEY,
    ResolvedAuthorizationState,
    ResolvedPartnerAccess,
)
from src.app.services.rp_application_service import RPApplicationService

_WORKSPACE_UUID = UUID("018f6f83-0000-0000-0000-000000000201")


def _partner_user(
    role: CanonicalRoleCode = CanonicalRoleCode.RP_ADMIN,
) -> dict:
    return {
        "email": "partner@example.gc.ca",
        "id": 77,
        "username": "partner@example.gc.ca",
        "uuid": "018f6f83-0000-0000-0000-000000000111",
        AUTHORIZATION_STATE_KEY: ResolvedAuthorizationState(
            partner_access=(
                ResolvedPartnerAccess(
                    workspace_id=23,
                    workspace_uuid=_WORKSPACE_UUID,
                    role=role,
                ),
            )
        ),
    }


_OWNER_USER = _partner_user()

_APP_UUID = "018f6f83-0000-0000-0000-000000000333"


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
        ("admin", "mau_report", "read"),
    )


class TestRetiredDepartmentCompatibilityEndpoint:
    """RP-configuration Department is inherited; the old record adapter is unavailable."""

    def test_department_preflight_and_assignment_are_absent_from_openapi(self) -> None:
        path = "/api/v1/rp-applications/accessible/{rp_application_uuid}/department"

        assert path not in app.openapi()["paths"]

    @pytest.mark.parametrize("method", ["get", "patch"])
    def test_department_preflight_and_assignment_return_safe_unavailable(self, method: str) -> None:
        with TestClient(app) as client:
            response = client.request(
                method,
                f"/api/v1/rp-applications/accessible/{_APP_UUID}/department",
                json=({"departmentUuid": "018f6f83-0000-0000-0000-000000000777"} if method == "patch" else None),
            )

        assert response.status_code == 404


class TestMissingDepartmentConflictRoutes:
    """8.3 – Grant-scoped child routes return 409 + rp_application_department_required when department missing."""

    @pytest.mark.parametrize(
        "role",
        [
            CanonicalRoleCode.RP_ADMIN,
            CanonicalRoleCode.RP_USER_EDIT,
            CanonicalRoleCode.READ_ONLY,
        ],
    )
    def test_current_user_application_list_uses_canonical_grant_without_oidc_access_token(
        self,
        role: CanonicalRoleCode,
    ) -> None:
        service = Mock()
        service.list_accessible_rp_applications = AsyncMock(
            return_value=[
                {
                    "uuid": _APP_UUID,
                    "workspaceUuid": str(_WORKSPACE_UUID),
                    "workspaceName": "Benefits Workspace",
                    "serviceNameEn": "Benefits Portal",
                    "serviceNameFr": "Portail des prestations",
                    "role": role,
                    "canadaLoginEnvironment": "production",
                    "registrationCompletedAt": "2026-08-11T12:00:00Z",
                    "productionReviewStatus": "pending",
                }
            ]
        )
        current_user = _partner_user(role)
        db = Mock()

        app.dependency_overrides[get_current_user] = lambda: current_user
        app.dependency_overrides[get_rp_application_service] = lambda: service
        app.dependency_overrides[async_get_db] = lambda: db

        try:
            with TestClient(app) as client:
                response = client.get("/api/v1/rp-applications/accessible")
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 200
        assert response.json()[0]["serviceNameEn"] == "Benefits Portal"
        assert response.json()[0]["workspaceName"] == "Benefits Workspace"
        assert response.json()[0]["canadaLoginEnvironment"] == "production"
        assert response.json()[0]["registrationCompletedAt"] == "2026-08-11T12:00:00Z"
        assert response.json()[0]["productionReviewStatus"] == "pending"
        assert "onboardingState" not in response.json()[0]
        assert "promotionStatus" not in response.json()[0]
        service.list_accessible_rp_applications.assert_awaited_once_with(
            db=db,
            current_user=current_user,
        )

    def test_mau_report_destinations_serialize_only_navigation_context(self) -> None:
        service = Mock()
        service.list_accessible_mau_report_destinations = AsyncMock(
            return_value=[
                {
                    "uuid": _APP_UUID,
                    "workspaceUuid": str(_WORKSPACE_UUID),
                    "workspaceName": "Benefits Workspace",
                    "applicationInformationUuid": "018f6f83-0000-0000-0000-000000000444",
                    "applicationNameEn": "Benefits service",
                    "applicationNameFr": "Service de prestations",
                    "configurationName": "Benefits production",
                    "partnerEnvironment": "Partner production",
                    "canadaLoginEnvironment": "production",
                }
            ]
        )
        current_user = _partner_user(CanonicalRoleCode.READ_ONLY)
        db = Mock()
        app.dependency_overrides[get_current_user] = lambda: current_user
        app.dependency_overrides[get_rp_application_service] = lambda: service
        app.dependency_overrides[async_get_db] = lambda: db

        try:
            with TestClient(app) as client:
                response = client.get("/api/v1/rp-applications/accessible/mau-report-destinations")
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 200
        assert response.json() == [
            {
                "uuid": _APP_UUID,
                "workspaceUuid": str(_WORKSPACE_UUID),
                "workspaceName": "Benefits Workspace",
                "applicationInformationUuid": "018f6f83-0000-0000-0000-000000000444",
                "applicationNameEn": "Benefits service",
                "applicationNameFr": "Service de prestations",
                "configurationName": "Benefits production",
                "partnerEnvironment": "Partner production",
                "canadaLoginEnvironment": "production",
            }
        ]
        service.list_accessible_mau_report_destinations.assert_awaited_once_with(
            db=db,
            current_user=current_user,
        )

    def test_oauth_setup_missing_department_returns_409_with_code(self) -> None:
        service = Mock()
        service.get_accessible_rp_application_oauth_setup = AsyncMock(side_effect=RPApplicationDepartmentRequiredException())

        app.dependency_overrides[get_current_user] = lambda: _OWNER_USER
        override_rp_application_authorization()
        app.dependency_overrides[get_rp_application_service] = lambda: service
        app.dependency_overrides[get_ibm_sv_admin_client] = lambda: Mock()
        app.dependency_overrides[async_get_db] = lambda: Mock()

        try:
            with TestClient(app) as client:
                response = client.get(f"/api/v1/rp-applications/accessible/{_APP_UUID}/oauth-setup")
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 409
        assert response.json()["error"]["code"] == "rp_application_department_required"

    def test_mau_report_missing_department_returns_409_with_code(self) -> None:
        from src.app.api.dependencies import get_mau_service

        service = Mock()
        service.get_accessible_rp_application_mau_context = AsyncMock(
            return_value={
                "id": 10,
                "uuid": _APP_UUID,
                "dnr_app_name": "Benefits Portal",
                "configuration_name": "Benefits production",
                "canada_login_environment": "production",
                "department_id": None,
                "partner_environment": "Partner production",
                "workspace_uuid": str(_WORKSPACE_UUID),
                "workspace_name": "Benefits workspace",
                "application_information_uuid": "018f6f83-0000-0000-0000-000000000444",
                "application_name_en": "Benefits service",
                "application_name_fr": "Service de prestations",
            }
        )
        service._require_rp_application_department = AsyncMock(side_effect=RPApplicationDepartmentRequiredException())

        app.dependency_overrides[get_current_user] = lambda: _OWNER_USER
        override_rp_application_authorization()
        app.dependency_overrides[get_rp_application_service] = lambda: service
        app.dependency_overrides[get_mau_service] = lambda: Mock()
        app.dependency_overrides[async_get_db] = lambda: Mock()

        try:
            with TestClient(app) as client:
                response = client.get(f"/api/v1/rp-applications/accessible/{_APP_UUID}/mau-report")
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 409
        assert response.json()["error"]["code"] == "rp_application_department_required"

    def test_mau_report_grant_backed_user_without_platform_role_reaches_service(self) -> None:
        import uuid as uuid_pkg

        from src.app.api.dependencies import get_mau_service

        service = Mock()
        service.get_accessible_rp_application_mau_context = AsyncMock(
            return_value={
                "id": 10,
                "uuid": _APP_UUID,
                "dnr_app_name": "Benefits Portal",
                "configuration_name": "Benefits production",
                "canada_login_environment": "production",
                "department_id": None,
                "partner_environment": "Partner production",
                "workspace_uuid": str(_WORKSPACE_UUID),
                "workspace_name": "Benefits workspace",
                "application_information_uuid": "018f6f83-0000-0000-0000-000000000444",
                "application_name_en": "Benefits service",
                "application_name_fr": "Service de prestations",
            }
        )
        service._require_rp_application_department = AsyncMock(return_value=None)

        mau_service = Mock()
        mau_service.get_mau_by_application = AsyncMock(return_value=[])

        current_user = {
            "email": "invitee@example.gc.ca",
            "id": 77,
            "username": "invitee@example.gc.ca",
            "is_superuser": False,
            "role_ids": [],
        }
        db = Mock()

        app.dependency_overrides[get_current_user] = lambda: current_user
        app.dependency_overrides[get_rp_application_service] = lambda: service
        app.dependency_overrides[get_mau_service] = lambda: mau_service
        app.dependency_overrides[async_get_db] = lambda: db

        try:
            with TestClient(app) as client:
                response = client.get(f"/api/v1/rp-applications/accessible/{_APP_UUID}/mau-report")
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 200
        assert response.json()["application_name"] == "Benefits Portal"
        assert response.json()["workspace_name"] == "Benefits workspace"
        assert response.json()["application_name_en"] == "Benefits service"
        assert response.json()["application_name_fr"] == "Service de prestations"
        assert response.json()["configuration_name"] == "Benefits production"
        assert response.json()["canada_login_environment"] == "production"
        assert response.json()["partner_environment"] == "Partner production"
        service.get_accessible_rp_application_mau_context.assert_awaited_once_with(
            db=db,
            current_user=current_user,
            rp_application_uuid=uuid_pkg.UUID(_APP_UUID),
        )
        mau_service.get_mau_by_application.assert_awaited_once()


class TestOAuthSetupDepartmentFields:
    """8.4 – OAuth setup DTO includes departmentName and departmentNameFr."""

    def test_oauth_setup_includes_department_name_fields(self) -> None:
        service = Mock()
        service.get_accessible_rp_application_oauth_setup = AsyncMock(
            return_value={
                "rpApplicationName": "Benefits Portal",
                "status": "active",
                "applicationUrl": None,
                "discoveryEndpoint": "https://example.verify.ibm.com/.well-known/openid-configuration",
                "departmentName": "Treasury Board of Canada Secretariat",
                "departmentNameFr": "Secrétariat du Conseil du Trésor du Canada",
                "pkceEnabled": None,
                "redirectUris": [],
                "logoutUri": None,
                "logoutRedirectUris": [],
            }
        )

        app.dependency_overrides[get_current_user] = lambda: _OWNER_USER
        override_rp_application_authorization()
        app.dependency_overrides[get_rp_application_service] = lambda: service
        app.dependency_overrides[get_ibm_sv_admin_client] = lambda: Mock()
        app.dependency_overrides[async_get_db] = lambda: Mock()

        try:
            with TestClient(app) as client:
                response = client.get(f"/api/v1/rp-applications/accessible/{_APP_UUID}/oauth-setup")
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 200
        body = response.json()
        assert body["departmentName"] == "Treasury Board of Canada Secretariat"
        assert body["departmentNameFr"] == "Secrétariat du Conseil du Trésor du Canada"

    def test_oauth_setup_department_name_can_be_null(self) -> None:
        service = Mock()
        service.get_accessible_rp_application_oauth_setup = AsyncMock(
            return_value={
                "rpApplicationName": "Benefits Portal",
                "status": "active",
                "applicationUrl": None,
                "discoveryEndpoint": None,
                "departmentName": None,
                "departmentNameFr": None,
                "pkceEnabled": None,
                "redirectUris": [],
                "logoutUri": None,
                "logoutRedirectUris": [],
            }
        )

        app.dependency_overrides[get_current_user] = lambda: _OWNER_USER
        override_rp_application_authorization()
        app.dependency_overrides[get_rp_application_service] = lambda: service
        app.dependency_overrides[get_ibm_sv_admin_client] = lambda: Mock()
        app.dependency_overrides[async_get_db] = lambda: Mock()

        try:
            with TestClient(app) as client:
                response = client.get(f"/api/v1/rp-applications/accessible/{_APP_UUID}/oauth-setup")
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 200
        body = response.json()
        assert body["departmentName"] is None
        assert body["departmentNameFr"] is None


class TestDepartmentRequirement:
    @pytest.mark.asyncio
    async def test_require_department_raises_conflict_when_null(self) -> None:
        from src.app.core.exceptions.http_exceptions import RPApplicationDepartmentRequiredException

        service = RPApplicationService()
        with pytest.raises(RPApplicationDepartmentRequiredException):
            await service._require_rp_application_department({"department_id": None})

    @pytest.mark.asyncio
    async def test_require_department_passes_when_set(self) -> None:
        service = RPApplicationService()
        # Should not raise when department_id is set
        await service._require_rp_application_department({"department_id": 5})
