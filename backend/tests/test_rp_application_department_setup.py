from unittest.mock import AsyncMock, Mock

import pytest
from fastapi.testclient import TestClient

from src.app.api.dependencies import get_current_user, get_rp_application_service
from src.app.core.db.database import async_get_db
from src.app.core.exceptions.http_exceptions import (
    ForbiddenException,
    NotFoundException,
    RPApplicationDepartmentRequiredException,
)
from src.app.main import app
from src.app.repositories.dependencies import get_ibm_sv_admin_client
from src.app.services.rp_application_service import RPApplicationService

_OWNER_USER = {
    "email": "owner@example.gc.ca",
    "id": 42,
    "username": "owner@example.gc.ca",
    "is_superuser": True,
    "uuid": "018f6f83-0000-0000-0000-000000000111",
}

_APP_UUID = "018f6f83-0000-0000-0000-000000000333"


class TestDepartmentPreflightEndpoint:
    """8.1 – Owner department preflight GET endpoint."""

    def test_owner_preflight_returns_200_with_department_id(self) -> None:
        service = Mock()
        service.get_current_user_rp_application_department_preflight = AsyncMock(
            return_value={
                "id": 10,
                "uuid": _APP_UUID,
                "dnrAppName": "Benefits Portal",
                "departmentId": 5,
            }
        )

        app.dependency_overrides[get_current_user] = lambda: _OWNER_USER
        app.dependency_overrides[get_rp_application_service] = lambda: service
        app.dependency_overrides[async_get_db] = lambda: Mock()

        try:
            with TestClient(app) as client:
                response = client.get(
                    f"/api/v1/rp-applications/mine/{_APP_UUID}/department"
                )
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 200
        body = response.json()
        assert body["id"] == 10
        assert body["uuid"] == _APP_UUID
        assert body["dnrAppName"] == "Benefits Portal"
        assert body["departmentId"] == 5

    def test_owner_preflight_returns_200_with_null_department_id(self) -> None:
        service = Mock()
        service.get_current_user_rp_application_department_preflight = AsyncMock(
            return_value={
                "id": 10,
                "uuid": _APP_UUID,
                "dnrAppName": "Benefits Portal",
                "departmentId": None,
            }
        )

        app.dependency_overrides[get_current_user] = lambda: _OWNER_USER
        app.dependency_overrides[get_rp_application_service] = lambda: service
        app.dependency_overrides[async_get_db] = lambda: Mock()

        try:
            with TestClient(app) as client:
                response = client.get(
                    f"/api/v1/rp-applications/mine/{_APP_UUID}/department"
                )
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 200
        assert response.json()["departmentId"] is None

    def test_non_owner_preflight_returns_403(self) -> None:
        service = Mock()
        service.get_current_user_rp_application_department_preflight = AsyncMock(
            side_effect=ForbiddenException("Only RP application owners can access this resource")
        )

        app.dependency_overrides[get_current_user] = lambda: {
            **_OWNER_USER,
            "email": "notowner@example.gc.ca",
        }
        app.dependency_overrides[get_rp_application_service] = lambda: service
        app.dependency_overrides[async_get_db] = lambda: Mock()

        try:
            with TestClient(app) as client:
                response = client.get(
                    f"/api/v1/rp-applications/mine/{_APP_UUID}/department"
                )
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 403
        assert response.json()["error"]["code"] == "forbidden"

    def test_missing_application_returns_404(self) -> None:
        service = Mock()
        service.get_current_user_rp_application_department_preflight = AsyncMock(
            side_effect=NotFoundException("RP application not found")
        )

        app.dependency_overrides[get_current_user] = lambda: _OWNER_USER
        app.dependency_overrides[get_rp_application_service] = lambda: service
        app.dependency_overrides[async_get_db] = lambda: Mock()

        try:
            with TestClient(app) as client:
                response = client.get(
                    f"/api/v1/rp-applications/mine/{_APP_UUID}/department"
                )
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 404
        assert response.json()["error"]["code"] == "not_found"


class TestDepartmentAssignmentEndpoint:
    """8.2 – Owner department assignment PATCH endpoint."""

    def test_owner_assignment_success_returns_200_with_updated_dto(self) -> None:
        service = Mock()
        service.assign_current_user_rp_application_department = AsyncMock(
            return_value={
                "id": 10,
                "uuid": _APP_UUID,
                "dnrAppName": "Benefits Portal",
                "departmentId": 7,
            }
        )

        app.dependency_overrides[get_current_user] = lambda: _OWNER_USER
        app.dependency_overrides[get_rp_application_service] = lambda: service
        app.dependency_overrides[async_get_db] = lambda: Mock()

        try:
            with TestClient(app) as client:
                response = client.patch(
                    f"/api/v1/rp-applications/mine/{_APP_UUID}/department",
                    json={"departmentUuid": "018f6f83-0000-0000-0000-000000000777"},
                )
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 200
        body = response.json()
        assert body["departmentId"] == 7

    def test_assignment_unknown_department_returns_404(self) -> None:
        service = Mock()
        service.assign_current_user_rp_application_department = AsyncMock(
            side_effect=NotFoundException("Department not found")
        )

        app.dependency_overrides[get_current_user] = lambda: _OWNER_USER
        app.dependency_overrides[get_rp_application_service] = lambda: service
        app.dependency_overrides[async_get_db] = lambda: Mock()

        try:
            with TestClient(app) as client:
                response = client.patch(
                    f"/api/v1/rp-applications/mine/{_APP_UUID}/department",
                    json={"departmentUuid": "018f6f83-0000-0000-0000-000000000999"},
                )
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 404

    def test_assignment_already_set_returns_409_conflict(self) -> None:
        from fastcrud.exceptions.http_exceptions import CustomException

        service = Mock()
        service.assign_current_user_rp_application_department = AsyncMock(
            side_effect=CustomException(status_code=409, detail="RP application already has a department assigned")
        )

        app.dependency_overrides[get_current_user] = lambda: _OWNER_USER
        app.dependency_overrides[get_rp_application_service] = lambda: service
        app.dependency_overrides[async_get_db] = lambda: Mock()

        try:
            with TestClient(app) as client:
                response = client.patch(
                    f"/api/v1/rp-applications/mine/{_APP_UUID}/department",
                    json={"departmentUuid": "018f6f83-0000-0000-0000-000000000777"},
                )
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 409


class TestMissingDepartmentConflictRoutes:
    """8.3 – Owner child routes return 409 + rp_application_department_required when department missing."""

    def test_oauth_setup_missing_department_returns_409_with_code(self) -> None:
        service = Mock()
        service.get_current_user_rp_application_oauth_setup = AsyncMock(
            side_effect=RPApplicationDepartmentRequiredException()
        )

        app.dependency_overrides[get_current_user] = lambda: _OWNER_USER
        app.dependency_overrides[get_rp_application_service] = lambda: service
        app.dependency_overrides[get_ibm_sv_admin_client] = lambda: Mock()
        app.dependency_overrides[async_get_db] = lambda: Mock()

        try:
            with TestClient(app) as client:
                response = client.get(
                    f"/api/v1/rp-applications/mine/{_APP_UUID}/oauth-setup"
                )
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 409
        assert response.json()["error"]["code"] == "rp_application_department_required"

    def test_mau_report_missing_department_returns_409_with_code(self) -> None:
        from src.app.api.dependencies import (
            get_ibm_sv_user_service,
            get_mau_service,
        )

        service = Mock()
        service.get_current_user_rp_application_by_uuid = AsyncMock(
            return_value={
                "id": 10,
                "uuid": _APP_UUID,
                "dnr_app_name": "Benefits Portal",
                "department_id": None,
            }
        )
        service._require_rp_application_department = AsyncMock(
            side_effect=RPApplicationDepartmentRequiredException()
        )

        app.dependency_overrides[get_current_user] = lambda: _OWNER_USER
        app.dependency_overrides[get_rp_application_service] = lambda: service
        app.dependency_overrides[get_ibm_sv_user_service] = lambda: Mock()
        app.dependency_overrides[get_mau_service] = lambda: Mock()
        app.dependency_overrides[async_get_db] = lambda: Mock()

        try:
            with TestClient(app) as client:
                response = client.get(
                    f"/api/v1/rp-applications/mine/{_APP_UUID}/mau-report"
                )
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 409
        assert response.json()["error"]["code"] == "rp_application_department_required"


class TestOAuthSetupDepartmentFields:
    """8.4 – OAuth setup DTO includes departmentName and departmentNameFr."""

    def test_oauth_setup_includes_department_name_fields(self) -> None:
        service = Mock()
        service.get_current_user_rp_application_oauth_setup = AsyncMock(
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
        app.dependency_overrides[get_rp_application_service] = lambda: service
        app.dependency_overrides[get_ibm_sv_admin_client] = lambda: Mock()
        app.dependency_overrides[async_get_db] = lambda: Mock()

        try:
            with TestClient(app) as client:
                response = client.get(
                    f"/api/v1/rp-applications/mine/{_APP_UUID}/oauth-setup"
                )
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 200
        body = response.json()
        assert body["departmentName"] == "Treasury Board of Canada Secretariat"
        assert body["departmentNameFr"] == "Secrétariat du Conseil du Trésor du Canada"

    def test_oauth_setup_department_name_can_be_null(self) -> None:
        service = Mock()
        service.get_current_user_rp_application_oauth_setup = AsyncMock(
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
        app.dependency_overrides[get_rp_application_service] = lambda: service
        app.dependency_overrides[get_ibm_sv_admin_client] = lambda: Mock()
        app.dependency_overrides[async_get_db] = lambda: Mock()

        try:
            with TestClient(app) as client:
                response = client.get(
                    f"/api/v1/rp-applications/mine/{_APP_UUID}/oauth-setup"
                )
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 200
        body = response.json()
        assert body["departmentName"] is None
        assert body["departmentNameFr"] is None


class TestDepartmentPreflightServiceMethod:
    """Service-level tests for the department preflight logic."""

    @pytest.mark.asyncio
    async def test_preflight_returns_summary_read_for_owner(self) -> None:
        import src.app.services.rp_application_service as rp_module

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
            result = await service.get_current_user_rp_application_department_preflight(
                db=db,
                rp_application_uuid="018f6f83-0000-0000-0000-000000000333",
                current_user={"email": "owner@example.gc.ca"},
            )
        finally:
            rp_module.crud_rp_applications.get = original_get

        assert result["dnrAppName"] == "Benefits Portal"
        assert result["departmentId"] is None

    @pytest.mark.asyncio
    async def test_preflight_raises_forbidden_for_non_owner(self) -> None:
        import src.app.services.rp_application_service as rp_module
        from src.app.core.exceptions.http_exceptions import ForbiddenException

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
            with pytest.raises(ForbiddenException):
                await service.get_current_user_rp_application_department_preflight(
                    db=db,
                    rp_application_uuid="018f6f83-0000-0000-0000-000000000333",
                    current_user={"email": "notowner@example.gc.ca"},
                )
        finally:
            rp_module.crud_rp_applications.get = original_get

    @pytest.mark.asyncio
    async def test_assignment_raises_not_found_for_unknown_department(self) -> None:
        import src.app.services.rp_application_service as rp_module
        from src.app.core.exceptions.http_exceptions import NotFoundException
        from src.app.schemas.rp_application import CurrentUserRPApplicationDepartmentAssignRequest
        import uuid as uuid_pkg

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
                await service.assign_current_user_rp_application_department(
                    db=db,
                    rp_application_uuid="018f6f83-0000-0000-0000-000000000333",
                    current_user={"email": "owner@example.gc.ca"},
                    payload=CurrentUserRPApplicationDepartmentAssignRequest(
                        department_uuid=uuid_pkg.UUID("018f6f83-0000-0000-0000-000000000999")
                    ),
                )
        finally:
            rp_module.crud_rp_applications.get = original_app_get
            rp_module.crud_departments.get = original_dept_get

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
