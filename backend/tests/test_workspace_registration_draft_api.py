import json
from copy import deepcopy
from pathlib import Path
from unittest.mock import AsyncMock, Mock

from fastapi.testclient import TestClient
from src.app.api.dependencies import get_current_user, get_workspace_service
from src.app.core.db.database import async_get_db
from src.app.core.exceptions.http_exceptions import RegistrationDraftConflictException
from src.app.main import app

WORKSPACE_UUID = "018f6f83-0000-0000-0000-000000000201"
APPLICATION_UUID = "018f6f83-0000-0000-0000-000000000701"
APPLICATION_INFORMATION_UUID = "018f6f83-0000-0000-0000-000000000501"
ENDPOINTS_CONTRACT_PATH = Path(__file__).resolve().parents[2] / "tests/contracts/workspace-rp-registration-endpoints-complete-step.json"


def _endpoints_contract() -> dict:
    return json.loads(ENDPOINTS_CONTRACT_PATH.read_text(encoding="utf-8"))


def _draft_read(version: int = 2) -> dict:
    return {
        "application_information_uuid": APPLICATION_INFORMATION_UUID,
        "configuration_name": "Partner test A",
        "workspace_uuid": WORKSPACE_UUID,
        "rp_application_uuid": APPLICATION_UUID,
        "onboarding_state": "draft",
        "registration_draft_version": version,
        "registration_last_completed_step": "endpoints",
        "registration_answers": {
            "canada_login_environment": "test",
            "service_name_en": "Benefits Portal",
            "service_name_fr": "Portail des prestations",
        },
    }


class TestWorkspaceRegistrationDraftAPI:
    def test_frontend_endpoints_complete_step_contract_is_accepted(self) -> None:
        service = Mock()
        service.update_workspace_rp_application_registration_draft = AsyncMock(return_value=_draft_read(version=3))
        app.dependency_overrides[get_current_user] = lambda: {"id": 42}
        app.dependency_overrides[get_workspace_service] = lambda: service
        app.dependency_overrides[async_get_db] = lambda: Mock()

        client = TestClient(app)
        try:
            response = client.patch(
                f"/api/v1/workspaces/{WORKSPACE_UUID}/applications/{APPLICATION_UUID}/registration-draft",
                json=_endpoints_contract(),
            )
        finally:
            client.close()
            app.dependency_overrides.clear()

        assert response.status_code == 200
        payload = service.update_workspace_rp_application_registration_draft.await_args.kwargs["payload"]
        serialized_payload = payload.model_dump(mode="json", by_alias=True, exclude_none=True)
        contract = _endpoints_contract()
        assert serialized_payload.keys() == contract.keys()
        assert serialized_payload["registrationAnswers"].keys() == contract["registrationAnswers"].keys()
        assert serialized_payload["registrationAnswers"]["redirectUris"] == contract["registrationAnswers"]["redirectUris"]
        assert serialized_payload["registrationAnswers"]["logoutMode"] == "front_channel"
        assert response.json()["registrationDraftVersion"] == 3

    def test_invalid_endpoints_field_returns_traceable_422_without_calling_service(
        self,
        caplog,
    ) -> None:
        service = Mock()
        service.update_workspace_rp_application_registration_draft = AsyncMock()
        app.dependency_overrides[get_current_user] = lambda: {"id": 42}
        app.dependency_overrides[get_workspace_service] = lambda: service
        app.dependency_overrides[async_get_db] = lambda: Mock()
        invalid_contract = deepcopy(_endpoints_contract())
        invalid_contract["registrationAnswers"]["applicationEnvironmentUrlEn"] = "invalid-endpoint-value"

        client = TestClient(app)
        try:
            response = client.patch(
                f"/api/v1/workspaces/{WORKSPACE_UUID}/applications/{APPLICATION_UUID}/registration-draft",
                headers={"X-Request-ID": "registration-endpoints-422"},
                json=invalid_contract,
            )
        finally:
            client.close()
            app.dependency_overrides.clear()

        assert response.status_code == 422
        error = response.json()["error"]
        assert error["code"] == "validation_error"
        assert error["requestId"] == "registration-endpoints-422"
        assert "registrationAnswers.applicationEnvironmentUrlEn" in error["message"]
        assert any(detail["loc"] == ["body", "registrationAnswers", "applicationEnvironmentUrlEn"] for detail in error["details"])
        service.update_workspace_rp_application_registration_draft.assert_not_awaited()
        assert "registration-endpoints-422" in caplog.text
        assert "event=draft_validation" in caplog.text
        assert "step_id=endpoints" in caplog.text
        assert "save_mode=completeStep" in caplog.text
        assert "invalid_field_names=applicationEnvironmentUrlEn" in caplog.text
        assert "error_code=validation_error" in caplog.text
        assert "invalid-endpoint-value" not in caplog.text

    def test_read_and_patch_use_dedicated_typed_contract(self) -> None:
        service = Mock()
        service.get_workspace_rp_application_registration_draft = AsyncMock(return_value=_draft_read())
        service.update_workspace_rp_application_registration_draft = AsyncMock(return_value=_draft_read(version=3))
        current_user = {"id": 42, "username": "partner@example.gc.ca"}
        db = Mock()
        app.dependency_overrides[get_current_user] = lambda: current_user
        app.dependency_overrides[get_workspace_service] = lambda: service
        app.dependency_overrides[async_get_db] = lambda: db

        try:
            with TestClient(app) as client:
                read_response = client.get(f"/api/v1/workspaces/{WORKSPACE_UUID}/applications/{APPLICATION_UUID}/registration-draft")
                patch_response = client.patch(
                    f"/api/v1/workspaces/{WORKSPACE_UUID}/applications/{APPLICATION_UUID}/registration-draft",
                    json={
                        "stepId": "client-and-access",
                        "saveMode": "partial",
                        "expectedDraftVersion": 2,
                        "registrationAnswers": {"clientType": "confidential"},
                    },
                )
        finally:
            app.dependency_overrides.clear()

        assert read_response.status_code == 200
        assert read_response.json()["workspaceUuid"] == WORKSPACE_UUID
        assert read_response.json()["rpApplicationUuid"] == APPLICATION_UUID
        assert read_response.json()["applicationInformationUuid"] == APPLICATION_INFORMATION_UUID
        assert read_response.json()["configurationName"] == "Partner test A"
        assert read_response.json()["registrationDraftVersion"] == 2
        assert read_response.json()["registrationAnswers"]["serviceNameEn"] == ("Benefits Portal")
        assert "id" not in read_response.json()
        assert "oidcRegistrationPayload" not in read_response.json()
        assert patch_response.status_code == 200
        assert patch_response.json()["registrationDraftVersion"] == 3
        patch_payload = service.update_workspace_rp_application_registration_draft.await_args.kwargs["payload"]
        assert patch_payload.expected_draft_version == 2
        assert patch_payload.registration_answers.client_type == "confidential"

    def test_version_conflict_uses_stable_safe_error_code(self) -> None:
        service = Mock()
        service.update_workspace_rp_application_registration_draft = AsyncMock(
            side_effect=RegistrationDraftConflictException(
                code="registration_draft_version_conflict",
                message="The registration draft was updated by another request.",
            )
        )
        app.dependency_overrides[get_current_user] = lambda: {"id": 42}
        app.dependency_overrides[get_workspace_service] = lambda: service
        app.dependency_overrides[async_get_db] = lambda: Mock()

        try:
            with TestClient(app) as client:
                response = client.patch(
                    f"/api/v1/workspaces/{WORKSPACE_UUID}/applications/{APPLICATION_UUID}/registration-draft",
                    json={
                        "stepId": "endpoints",
                        "saveMode": "partial",
                        "expectedDraftVersion": 1,
                        "registrationAnswers": {},
                    },
                )
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 409
        error = response.json()["error"]
        assert error["code"] == "registration_draft_version_conflict"
        assert error["message"] == "The registration draft was updated by another request."
        assert error["details"] is None
        assert error["requestId"]
