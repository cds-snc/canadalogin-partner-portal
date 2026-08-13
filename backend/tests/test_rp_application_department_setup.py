from unittest.mock import AsyncMock, Mock
from uuid import UUID

import casbin
import pytest
from fastapi.testclient import TestClient
from src.app.api.dependencies import get_current_user, get_rp_application_service
from src.app.core.access_control import CASBIN_MODEL_PATH, database_enforcer_provider
from src.app.core.authorization import CanonicalRoleCode
from src.app.core.db.database import async_get_db
from src.app.core.exceptions.http_exceptions import (
    NotFoundException,
    RPApplicationDepartmentRequiredException,
)
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


class TestDepartmentPreflightEndpoint:
    """8.1 – Grant-scoped department preflight GET endpoint."""

    def test_granted_partner_preflight_returns_200_with_department_id(self) -> None:
        service = Mock()
        service.get_accessible_rp_application_department_preflight = AsyncMock(
            return_value={
                "id": 10,
                "uuid": _APP_UUID,
                "dnrAppName": "Benefits Portal",
                "departmentId": 5,
            }
        )

        app.dependency_overrides[get_current_user] = lambda: _OWNER_USER
        override_rp_application_authorization()
        app.dependency_overrides[get_rp_application_service] = lambda: service
        app.dependency_overrides[async_get_db] = lambda: Mock()

        try:
            with TestClient(app) as client:
                response = client.get(f"/api/v1/rp-applications/accessible/{_APP_UUID}/department")
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 200
        body = response.json()
        assert body["id"] == 10
        assert body["uuid"] == _APP_UUID
        assert body["dnrAppName"] == "Benefits Portal"
        assert body["departmentId"] == 5

    def test_granted_partner_preflight_returns_200_with_null_department_id(self) -> None:
        service = Mock()
        service.get_accessible_rp_application_department_preflight = AsyncMock(
            return_value={
                "id": 10,
                "uuid": _APP_UUID,
                "dnrAppName": "Benefits Portal",
                "departmentId": None,
            }
        )

        app.dependency_overrides[get_current_user] = lambda: _OWNER_USER
        override_rp_application_authorization()
        app.dependency_overrides[get_rp_application_service] = lambda: service
        app.dependency_overrides[async_get_db] = lambda: Mock()

        try:
            with TestClient(app) as client:
                response = client.get(f"/api/v1/rp-applications/accessible/{_APP_UUID}/department")
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 200
        assert response.json()["departmentId"] is None

    def test_out_of_scope_preflight_returns_404(self) -> None:
        service = Mock()
        service.get_accessible_rp_application_department_preflight = AsyncMock(side_effect=NotFoundException("RP application not found"))

        app.dependency_overrides[get_current_user] = lambda: {
            **_OWNER_USER,
            "email": "notowner@example.gc.ca",
        }
        override_rp_application_authorization()
        app.dependency_overrides[get_rp_application_service] = lambda: service
        app.dependency_overrides[async_get_db] = lambda: Mock()

        try:
            with TestClient(app) as client:
                response = client.get(f"/api/v1/rp-applications/accessible/{_APP_UUID}/department")
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 404
        assert response.json()["error"]["code"] == "not_found"

    def test_missing_application_returns_404(self) -> None:
        service = Mock()
        service.get_accessible_rp_application_department_preflight = AsyncMock(side_effect=NotFoundException("RP application not found"))

        app.dependency_overrides[get_current_user] = lambda: _OWNER_USER
        override_rp_application_authorization()
        app.dependency_overrides[get_rp_application_service] = lambda: service
        app.dependency_overrides[async_get_db] = lambda: Mock()

        try:
            with TestClient(app) as client:
                response = client.get(f"/api/v1/rp-applications/accessible/{_APP_UUID}/department")
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 404
        assert response.json()["error"]["code"] == "not_found"


class TestDepartmentAssignmentEndpoint:
    """8.2 – Grant-scoped department assignment PATCH endpoint."""

    def test_granted_partner_assignment_success_returns_200_with_updated_dto(self) -> None:
        service = Mock()
        service.assign_accessible_rp_application_department = AsyncMock(
            return_value={
                "id": 10,
                "uuid": _APP_UUID,
                "dnrAppName": "Benefits Portal",
                "departmentId": 7,
            }
        )

        app.dependency_overrides[get_current_user] = lambda: _OWNER_USER
        override_rp_application_authorization()
        app.dependency_overrides[get_rp_application_service] = lambda: service
        app.dependency_overrides[async_get_db] = lambda: Mock()

        try:
            with TestClient(app) as client:
                response = client.patch(
                    f"/api/v1/rp-applications/accessible/{_APP_UUID}/department",
                    json={"departmentUuid": "018f6f83-0000-0000-0000-000000000777"},
                )
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 200
        body = response.json()
        assert body["departmentId"] == 7

    def test_assignment_non_workspace_department_returns_409(self) -> None:
        service = Mock()
        from fastcrud.exceptions.http_exceptions import CustomException

        service.assign_accessible_rp_application_department = AsyncMock(
            side_effect=CustomException(
                status_code=409,
                detail="RP configuration Department is inherited from its workspace",
            )
        )

        app.dependency_overrides[get_current_user] = lambda: _OWNER_USER
        override_rp_application_authorization()
        app.dependency_overrides[get_rp_application_service] = lambda: service
        app.dependency_overrides[async_get_db] = lambda: Mock()

        try:
            with TestClient(app) as client:
                response = client.patch(
                    f"/api/v1/rp-applications/accessible/{_APP_UUID}/department",
                    json={"departmentUuid": "018f6f83-0000-0000-0000-000000000999"},
                )
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 409

    def test_assignment_legacy_conflict_returns_409(self) -> None:
        from fastcrud.exceptions.http_exceptions import CustomException

        service = Mock()
        service.assign_accessible_rp_application_department = AsyncMock(
            side_effect=CustomException(status_code=409, detail="RP application already has a department assigned")
        )

        app.dependency_overrides[get_current_user] = lambda: _OWNER_USER
        override_rp_application_authorization()
        app.dependency_overrides[get_rp_application_service] = lambda: service
        app.dependency_overrides[async_get_db] = lambda: Mock()

        try:
            with TestClient(app) as client:
                response = client.patch(
                    f"/api/v1/rp-applications/accessible/{_APP_UUID}/department",
                    json={"departmentUuid": "018f6f83-0000-0000-0000-000000000777"},
                )
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 409


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
                    "onboardingState": "under_review",
                    "promotionStatus": "review_tracked",
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
        assert response.json()[0]["onboardingState"] == "under_review"
        assert response.json()[0]["promotionStatus"] == "review_tracked"
        service.list_accessible_rp_applications.assert_awaited_once_with(
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
        service.get_accessible_rp_application_department_preflight = AsyncMock(
            return_value={
                "id": 10,
                "uuid": _APP_UUID,
                "dnr_app_name": "Benefits Portal",
                "department_id": None,
                "partner_environment": "Partner production",
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
        service.get_accessible_rp_application_department_preflight = AsyncMock(
            return_value={
                "id": 10,
                "uuid": _APP_UUID,
                "dnr_app_name": "Benefits Portal",
                "department_id": None,
                "partner_environment": "Partner production",
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
        assert response.json()["partner_environment"] == "Partner production"
        service.get_accessible_rp_application_department_preflight.assert_awaited_once_with(
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


class TestDepartmentPreflightServiceMethod:
    """Service-level tests for the department preflight logic."""

    @pytest.mark.asyncio
    async def test_preflight_raises_not_found_without_workspace_grant(self) -> None:
        import src.app.services.rp_application_service as rp_module
        from src.app.core.exceptions.http_exceptions import NotFoundException

        service = RPApplicationService()
        db = Mock()

        app_record = {
            "id": 10,
            "uuid": "018f6f83-0000-0000-0000-000000000333",
            "dnr_app_name": "Benefits Portal",
            "department_id": None,
            "partner_environment": "Partner staging",
            "is_deleted": False,
            "application_owner": {"owners": [{"email": "owner@example.gc.ca"}]},
        }

        original_get = rp_module.crud_rp_applications.get
        rp_module.crud_rp_applications.get = AsyncMock(return_value=app_record)
        service._get_effective_workspace_department = AsyncMock(  # type: ignore[method-assign]
            return_value=(7, UUID("018f6f83-0000-0000-0000-000000000777"))
        )
        try:
            with pytest.raises(NotFoundException):
                await service.get_accessible_rp_application_department_preflight(
                    db=db,
                    rp_application_uuid="018f6f83-0000-0000-0000-000000000333",
                    current_user={"email": "owner@example.gc.ca"},
                )
        finally:
            rp_module.crud_rp_applications.get = original_get

    @pytest.mark.asyncio
    async def test_preflight_returns_summary_read_for_grant_user(self) -> None:
        import src.app.services.rp_application_service as rp_module

        service = RPApplicationService()
        db = Mock()

        app_record = {
            "id": 10,
            "uuid": "018f6f83-0000-0000-0000-000000000333",
            "workspace_id": 23,
            "dnr_app_name": "Benefits Portal",
            "department_id": None,
            "partner_environment": "Partner staging",
            "is_deleted": False,
            "application_owner": {"owners": [{"email": "owner@example.gc.ca"}]},
        }

        original_get = rp_module.crud_rp_applications.get
        rp_module.crud_rp_applications.get = AsyncMock(return_value=app_record)
        service._get_effective_workspace_department = AsyncMock(  # type: ignore[method-assign]
            return_value=(7, UUID("018f6f83-0000-0000-0000-000000000777"))
        )
        try:
            result = await service.get_accessible_rp_application_department_preflight(
                db=db,
                rp_application_uuid="018f6f83-0000-0000-0000-000000000333",
                current_user=_partner_user(CanonicalRoleCode.READ_ONLY),
            )
        finally:
            rp_module.crud_rp_applications.get = original_get

        assert result["dnrAppName"] == "Benefits Portal"
        assert result["departmentId"] == 7
        assert result["partnerEnvironment"] == "Partner staging"

    @pytest.mark.asyncio
    async def test_preflight_raises_not_found_for_out_of_scope_user(self) -> None:
        import src.app.services.rp_application_service as rp_module
        from src.app.core.exceptions.http_exceptions import NotFoundException

        service = RPApplicationService()
        db = Mock()

        app_record = {
            "id": 10,
            "uuid": "018f6f83-0000-0000-0000-000000000333",
            "dnr_app_name": "Benefits Portal",
            "department_id": None,
            "is_deleted": False,
            "application_owner": {"owners": [{"email": "owner@example.gc.ca"}]},
        }

        original_get = rp_module.crud_rp_applications.get
        rp_module.crud_rp_applications.get = AsyncMock(return_value=app_record)
        try:
            with pytest.raises(NotFoundException):
                await service.get_accessible_rp_application_department_preflight(
                    db=db,
                    rp_application_uuid="018f6f83-0000-0000-0000-000000000333",
                    current_user={"email": "notowner@example.gc.ca"},
                )
        finally:
            rp_module.crud_rp_applications.get = original_get

    @pytest.mark.asyncio
    async def test_assignment_raises_not_found_without_workspace_grant(self) -> None:
        import uuid as uuid_pkg

        import src.app.services.rp_application_service as rp_module
        from src.app.core.exceptions.http_exceptions import NotFoundException
        from src.app.schemas.rp_application import AccessibleRPApplicationDepartmentAssignRequest

        service = RPApplicationService()
        db = Mock()

        app_record = {
            "id": 10,
            "uuid": "018f6f83-0000-0000-0000-000000000333",
            "dnr_app_name": "Benefits Portal",
            "department_id": None,
            "is_deleted": False,
            "application_owner": {"owners": [{"email": "owner@example.gc.ca"}]},
        }

        original_app_get = rp_module.crud_rp_applications.get
        original_dept_get = rp_module.crud_departments.get
        rp_module.crud_rp_applications.get = AsyncMock(return_value=app_record)
        rp_module.crud_departments.get = AsyncMock(return_value=None)
        try:
            with pytest.raises(NotFoundException):
                await service.assign_accessible_rp_application_department(
                    db=db,
                    rp_application_uuid="018f6f83-0000-0000-0000-000000000333",
                    current_user={"email": "owner@example.gc.ca"},
                    payload=AccessibleRPApplicationDepartmentAssignRequest(department_uuid=uuid_pkg.UUID("018f6f83-0000-0000-0000-000000000999")),
                )
        finally:
            rp_module.crud_rp_applications.get = original_app_get
            rp_module.crud_departments.get = original_dept_get

    @pytest.mark.asyncio
    async def test_assignment_rejects_non_workspace_department_for_grant_user(self) -> None:
        import uuid as uuid_pkg

        import src.app.services.rp_application_service as rp_module
        from fastcrud.exceptions.http_exceptions import CustomException
        from src.app.schemas.rp_application import AccessibleRPApplicationDepartmentAssignRequest

        service = RPApplicationService()
        db = Mock()

        app_record = {
            "id": 10,
            "uuid": "018f6f83-0000-0000-0000-000000000333",
            "workspace_id": 23,
            "dnr_app_name": "Benefits Portal",
            "department_id": None,
            "is_deleted": False,
            "application_owner": {"owners": [{"email": "owner@example.gc.ca"}]},
        }

        original_app_get = rp_module.crud_rp_applications.get
        rp_module.crud_rp_applications.get = AsyncMock(return_value=app_record)
        service._get_effective_workspace_department = AsyncMock(  # type: ignore[method-assign]
            return_value=(7, UUID("018f6f83-0000-0000-0000-000000000777"))
        )
        try:
            with pytest.raises(CustomException) as exc_info:
                await service.assign_accessible_rp_application_department(
                    db=db,
                    rp_application_uuid="018f6f83-0000-0000-0000-000000000333",
                    current_user=_partner_user(CanonicalRoleCode.RP_USER_EDIT),
                    payload=AccessibleRPApplicationDepartmentAssignRequest(department_uuid=uuid_pkg.UUID("018f6f83-0000-0000-0000-000000000999")),
                )
        finally:
            rp_module.crud_rp_applications.get = original_app_get

        assert exc_info.value.status_code == 409

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
