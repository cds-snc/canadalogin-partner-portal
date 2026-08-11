import uuid as uuid_pkg
from datetime import UTC, datetime
from unittest.mock import AsyncMock, Mock

import casbin
from fastapi.testclient import TestClient
from fastcrud.exceptions.http_exceptions import CustomException

from src.app.api.dependencies import (
    get_current_user,
    get_ibm_sv_admin_service,
    get_rp_application_developer_invitation_service,
    get_workspace_service,
)
from src.app.core.access_control import CASBIN_MODEL_PATH, database_enforcer_provider
from src.app.core.db.database import async_get_db
from src.app.core.exceptions.http_exceptions import BadRequestException, ForbiddenException, NotFoundException
from src.app.main import app


def make_enforcer(*policies: tuple[str, str, str]) -> casbin.Enforcer:
    enforcer = casbin.Enforcer(str(CASBIN_MODEL_PATH))
    if policies:
        enforcer.add_policies(list(policies))
    return enforcer


def sample_workspace_payload(*, name: str = "Benefits Workspace") -> dict[str, object]:
    return {
        "id": 9,
        "uuid": "018f6f83-0000-0000-0000-000000000201",
        "name": name,
        "slug": "benefits-workspace" if name == "Benefits Workspace" else "renamed-workspace",
        "department_id": 7,
        "description": "Primary workspace",
        "created_by": 42,
        "created_at": datetime(2026, 7, 30, 12, 0, tzinfo=UTC).isoformat(),
        "updated_at": None,
        "deleted_at": None,
        "is_deleted": False,
    }


def sample_application_information_payload(*, service_name_en: str = "Example service") -> dict[str, object]:
    return {
        "id": 17,
        "uuid": "018f6f83-0000-0000-0000-000000000501",
        "workspace_id": 9,
        "created_by": 42,
        "service_name_en": service_name_en,
        "service_name_fr": "Service exemple" if service_name_en == "Example service" else "Service mis a jour",
        "overview": "Overview text",
        "technology_and_protocol": "OIDC with backend mediation",
        "security_and_privacy": "Protected B controls apply",
        "usage": "Partner onboarding usage",
        "migration_or_transition_plan": "Phased transition",
        "created_at": datetime(2026, 7, 30, 15, 0, tzinfo=UTC).isoformat(),
        "updated_at": None,
        "deleted_at": None,
        "is_deleted": False,
    }


def sample_application_information_contact_payload(*, responsibility_en: str = "Product owner") -> dict[str, object]:
    return {
        "id": 3,
        "uuid": "018f6f83-0000-0000-0000-000000000601",
        "application_information_id": 17,
        "created_by": 42,
        "name_en": "Jane Doe",
        "name_fr": "Jeanne Doe",
        "responsibility_en": responsibility_en,
        "responsibility_fr": "Responsable du produit" if responsibility_en == "Product owner" else "Responsabilite mise a jour",
        "email": "jane.doe@example.gc.ca",
        "phone_number": "555-555-5555",
        "created_at": datetime(2026, 7, 30, 15, 15, tzinfo=UTC).isoformat(),
        "updated_at": None,
        "deleted_at": None,
        "is_deleted": False,
    }


def sample_application_information_review_note_payload(
    *,
    body: str = "Checklist evidence reference still missing",
) -> dict[str, object]:
    return {
        "id": 2,
        "uuid": "018f6f83-0000-0000-0000-000000000911",
        "application_information_id": 17,
        "body": body,
        "author_name": "CL Admin",
        "author_email": "admin@example.gc.ca",
        "author_user_uuid": "018f6f83-0000-0000-0000-000000000001",
        "created_at": datetime(2026, 8, 11, 12, 30, tzinfo=UTC).isoformat(),
        "updated_at": None,
    }


def sample_application_information_review_checklist_payload() -> dict[str, object]:
    return {
        "id": 3,
        "uuid": "018f6f83-0000-0000-0000-000000000912",
        "application_information_id": 17,
        "review_disposition": "changes_requested",
        "application_information_status": "complete",
        "contacts_status": "incomplete",
        "environment_registration_status": "complete",
        "promotion_metadata_status": "not_started",
        "evidence_reference_status": "incomplete",
        "process_links_status": "complete",
        "rationale": "Need a linked evidence reference before approval",
        "reviewed_by_name": "CL Admin",
        "reviewed_by_user_uuid": "018f6f83-0000-0000-0000-000000000001",
        "created_at": datetime(2026, 8, 11, 12, 10, tzinfo=UTC).isoformat(),
        "updated_at": datetime(2026, 8, 11, 12, 35, tzinfo=UTC).isoformat(),
    }


def sample_rp_application_payload(*, dnr_app_name: str = "Benefits Portal") -> dict[str, object]:
    return {
        "id": 33,
        "uuid": "018f6f83-0000-0000-0000-000000000701",
        "workspace_id": 9,
        "department_id": 7,
        "application_information_id": 17,
        "dnr_app_name": dnr_app_name,
        "canada_login_environment": "staging",
        "status": None,
        "created_by": 42,
        "created_at": datetime(2026, 7, 30, 16, 0, tzinfo=UTC).isoformat(),
        "updated_at": None,
        "deleted_at": None,
        "is_deleted": False,
        "ibm_sv_application_id": None,
        "oidc_registration_payload": {
            "service_name_en": dnr_app_name,
            "requested_scopes": ["openid", "profile"],
        },
        "application_owner": None,
        "promotion_target_environment": None,
        "promotion_status": None,
        "promotion_external_reference": None,
        "promotion_reviewed_by_user_uuid": None,
        "promotion_reviewed_by_team": None,
        "promotion_requested_at": None,
        "promotion_reviewed_at": None,
        "promotion_decided_at": None,
    }


def sample_submitted_rp_application_payload() -> dict[str, object]:
    return {
        **sample_rp_application_payload(),
        "onboarding_state": "submitted",
        "submitted_at": datetime(2026, 8, 11, 12, 0, tzinfo=UTC).isoformat(),
        "under_review_at": None,
        "approved_at": None,
        "launched_at": None,
    }


def sample_review_tracked_production_rp_application_payload() -> dict[str, object]:
    return {
        **sample_rp_application_payload(),
        "canada_login_environment": "production",
        "onboarding_state": "under_review",
        "submitted_at": datetime(2026, 8, 11, 11, 30, tzinfo=UTC).isoformat(),
        "under_review_at": datetime(2026, 8, 11, 11, 45, tzinfo=UTC).isoformat(),
        "approved_at": None,
        "launched_at": None,
        "promotion_target_environment": "production",
        "promotion_status": "review_tracked",
        "promotion_external_reference": "CAB-123",
        "promotion_reviewed_by_user_uuid": None,
        "promotion_reviewed_by_team": None,
        "promotion_requested_at": datetime(2026, 8, 11, 11, 45, tzinfo=UTC).isoformat(),
        "promotion_reviewed_at": None,
        "promotion_decided_at": None,
    }


def sample_approved_production_rp_application_payload() -> dict[str, object]:
    return {
        **sample_review_tracked_production_rp_application_payload(),
        "promotion_status": "approved",
        "promotion_reviewed_by_user_uuid": "018f6f83-0000-0000-0000-000000000001",
        "promotion_reviewed_by_team": "CanadaLogin",
        "promotion_reviewed_at": datetime(2026, 8, 11, 12, 15, tzinfo=UTC).isoformat(),
        "promotion_decided_at": datetime(2026, 8, 11, 12, 15, tzinfo=UTC).isoformat(),
    }


def sample_promotion_request_payload() -> dict[str, object]:
    return {
        "target_environment": "production",
        "status": "approved",
        "external_reference": "CAB-123",
        "reviewed_by_user_uuid": "018f6f83-0000-0000-0000-000000000001",
        "reviewed_by_team": "CanadaLogin",
        "requested_at": datetime(2026, 8, 11, 11, 45, tzinfo=UTC).isoformat(),
        "reviewed_at": datetime(2026, 8, 11, 12, 15, tzinfo=UTC).isoformat(),
        "decided_at": datetime(2026, 8, 11, 12, 15, tzinfo=UTC).isoformat(),
        "created_at": datetime(2026, 8, 11, 11, 45, tzinfo=UTC).isoformat(),
        "updated_at": datetime(2026, 8, 11, 12, 15, tzinfo=UTC).isoformat(),
    }


def assert_default_onboarding_fields(payload: dict[str, object]) -> None:
    assert payload["onboardingState"] == "draft"
    assert payload["submittedAt"] is None
    assert payload["underReviewAt"] is None
    assert payload["approvedAt"] is None
    assert payload["launchedAt"] is None


def assert_default_promotion_fields(payload: dict[str, object]) -> None:
    assert payload["promotionTargetEnvironment"] is None
    assert payload["promotionStatus"] is None
    assert payload["promotionExternalReference"] is None
    assert payload["promotionReviewedByUserUuid"] is None
    assert payload["promotionReviewedByTeam"] is None
    assert payload["promotionRequestedAt"] is None
    assert payload["promotionReviewedAt"] is None
    assert payload["promotionDecidedAt"] is None


def sample_submitted_workspace_payload() -> dict[str, object]:
    return {
        **sample_workspace_payload(),
        "onboarding_state": "submitted",
        "submitted_at": datetime(2026, 8, 11, 12, 0, tzinfo=UTC).isoformat(),
        "under_review_at": None,
        "approved_at": None,
        "launched_at": None,
    }


def sample_submitted_application_information_payload() -> dict[str, object]:
    return {
        **sample_application_information_payload(),
        "onboarding_state": "submitted",
        "submitted_at": datetime(2026, 8, 11, 12, 0, tzinfo=UTC).isoformat(),
        "under_review_at": None,
        "approved_at": None,
        "launched_at": None,
    }


def sample_developer_invitation_payload(
    *,
    role: str = "Read Only",
    status: str = "pending",
    with_acceptance_url: bool = False,
) -> dict[str, object]:
    payload: dict[str, object] = {
        "id": 121,
        "uuid": "018f6f83-0000-0000-0000-000000000801",
        "workspace_id": 9,
        "rp_application_id": 33,
        "invited_email": "invitee@example.gc.ca",
        "invite_expires_at": datetime(2026, 8, 20, 12, 0, tzinfo=UTC).isoformat(),
        "invited_by": 42,
        "role": role,
        "status": status,
        "accepted_at": None,
        "revoked_at": None,
        "gc_notify_notification_id": None,
        "delegated_by_grant_uuid": None,
        "created_at": datetime(2026, 8, 10, 12, 0, tzinfo=UTC).isoformat(),
        "updated_at": None,
        "deleted_at": None,
        "is_deleted": False,
    }
    if with_acceptance_url:
        payload["acceptance_url"] = "http://localhost:3000/invitations/rp-applications/raw-token"
    return payload


class TestWorkspaceRoutes:
    def test_workspaces_list_allows_user_with_workspace_read_policy(self) -> None:
        service = Mock()
        service.list_workspaces = AsyncMock(return_value=[sample_workspace_payload()])

        app.dependency_overrides[get_current_user] = lambda: {
            "username": "member@example.gc.ca",
            "is_superuser": False,
        }
        app.dependency_overrides[database_enforcer_provider] = lambda: make_enforcer(
            ("member@example.gc.ca", "workspace", "read")
        )
        app.dependency_overrides[get_workspace_service] = lambda: service
        app.dependency_overrides[async_get_db] = lambda: Mock()

        try:
            with TestClient(app) as client:
                response = client.get("/api/v1/workspaces")
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 200
        body = response.json()
        assert body[0]["uuid"] == "018f6f83-0000-0000-0000-000000000201"
        assert body[0]["name"] == "Benefits Workspace"
        assert body[0]["departmentId"] == 7
        assert_default_onboarding_fields(body[0])

    def test_current_user_workspaces_list_uses_authenticated_current_user_scope(self) -> None:
        service = Mock()
        service.list_current_user_workspaces = AsyncMock(
            return_value=[sample_workspace_payload()]
        )
        current_user = {
            "id": 42,
            "username": "member@example.gc.ca",
            "is_superuser": False,
        }
        db = Mock()

        app.dependency_overrides[get_current_user] = lambda: current_user
        app.dependency_overrides[get_workspace_service] = lambda: service
        app.dependency_overrides[async_get_db] = lambda: db

        try:
            with TestClient(app) as client:
                response = client.get("/api/v1/workspaces/mine")
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 200
        assert response.json()[0]["uuid"] == "018f6f83-0000-0000-0000-000000000201"
        assert_default_onboarding_fields(response.json()[0])
        service.list_current_user_workspaces.assert_awaited_once_with(
            db=db,
            current_user=current_user,
        )

    def test_workspaces_list_denies_user_without_workspace_read_policy(self) -> None:
        service = Mock()
        service.list_workspaces = AsyncMock()

        app.dependency_overrides[get_current_user] = lambda: {
            "username": "member@example.gc.ca",
            "is_superuser": False,
        }
        app.dependency_overrides[database_enforcer_provider] = lambda: make_enforcer()
        app.dependency_overrides[get_workspace_service] = lambda: service
        app.dependency_overrides[async_get_db] = lambda: Mock()

        try:
            with TestClient(app) as client:
                response = client.get("/api/v1/workspaces")
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 403
        assert response.json()["error"]["code"] == "forbidden"
        service.list_workspaces.assert_not_called()

    def test_workspace_detail_not_found_returns_safe_error(self) -> None:
        service = Mock()
        service.get_workspace_by_uuid = AsyncMock(
            side_effect=NotFoundException("Workspace not found")
        )

        app.dependency_overrides[get_current_user] = lambda: {
            "id": 42,
            "username": "admin@example.gc.ca",
            "is_superuser": True,
        }
        app.dependency_overrides[database_enforcer_provider] = lambda: make_enforcer(
            ("admin", "workspace", "read")
        )
        app.dependency_overrides[get_workspace_service] = lambda: service
        app.dependency_overrides[async_get_db] = lambda: Mock()

        try:
            with TestClient(app) as client:
                response = client.get(
                    "/api/v1/workspaces/018f6f83-0000-0000-0000-000000000201"
                )
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 404
        assert response.json()["error"]["code"] == "not_found"

    def test_workspace_detail_uses_authenticated_current_user_scope(self) -> None:
        service = Mock()
        service.get_workspace_by_uuid = AsyncMock(return_value=sample_workspace_payload())
        current_user = {
            "id": 42,
            "username": "member@example.gc.ca",
            "is_superuser": False,
        }
        db = Mock()

        app.dependency_overrides[get_current_user] = lambda: current_user
        app.dependency_overrides[get_workspace_service] = lambda: service
        app.dependency_overrides[async_get_db] = lambda: db

        try:
            with TestClient(app) as client:
                response = client.get(
                    "/api/v1/workspaces/018f6f83-0000-0000-0000-000000000201"
                )
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 200
        assert response.json()["uuid"] == "018f6f83-0000-0000-0000-000000000201"
        assert_default_onboarding_fields(response.json())
        service.get_workspace_by_uuid.assert_awaited_once_with(
            db=db,
            workspace_uuid=uuid_pkg.UUID("018f6f83-0000-0000-0000-000000000201"),
            current_user=current_user,
        )

    def test_workspace_onboarding_state_transition_delegates_to_service(self) -> None:
        service = Mock()
        service.transition_workspace_onboarding_state = AsyncMock(
            return_value=sample_submitted_workspace_payload()
        )
        current_user = {
            "id": 42,
            "username": "workspace-admin@example.gc.ca",
            "is_superuser": False,
        }
        db = Mock()

        app.dependency_overrides[get_current_user] = lambda: current_user
        app.dependency_overrides[get_workspace_service] = lambda: service
        app.dependency_overrides[async_get_db] = lambda: db

        try:
            with TestClient(app) as client:
                response = client.post(
                    "/api/v1/workspaces/018f6f83-0000-0000-0000-000000000201/onboarding-state",
                    json={"targetState": "submitted"},
                )
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 200
        assert response.json()["onboardingState"] == "submitted"
        assert response.json()["submittedAt"] == "2026-08-11T12:00:00+00:00"
        transition_kwargs = service.transition_workspace_onboarding_state.await_args.kwargs
        assert transition_kwargs["db"] is db
        assert transition_kwargs["workspace_uuid"] == uuid_pkg.UUID(
            "018f6f83-0000-0000-0000-000000000201"
        )
        assert transition_kwargs["current_user"] == current_user
        assert transition_kwargs["payload"].target_state == "submitted"

    def test_workspace_onboarding_state_transition_surfaces_forbidden(self) -> None:
        service = Mock()
        service.transition_workspace_onboarding_state = AsyncMock(
            side_effect=ForbiddenException("You do not have enough privileges.")
        )

        app.dependency_overrides[get_current_user] = lambda: {
            "id": 55,
            "username": "member@example.gc.ca",
            "is_superuser": False,
        }
        app.dependency_overrides[get_workspace_service] = lambda: service
        app.dependency_overrides[async_get_db] = lambda: Mock()

        try:
            with TestClient(app) as client:
                response = client.post(
                    "/api/v1/workspaces/018f6f83-0000-0000-0000-000000000201/onboarding-state",
                    json={"targetState": "approved"},
                )
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 403
        assert response.json()["error"]["code"] == "forbidden"

    def test_workspace_crud_mutations_delegate_to_service_for_admin(self) -> None:
        service = Mock()
        service.create_workspace = AsyncMock(return_value=sample_workspace_payload())
        service.update_workspace = AsyncMock(
            return_value=sample_workspace_payload(name="Renamed Workspace")
        )
        service.delete_workspace = AsyncMock(return_value={"message": "Workspace deleted"})

        app.dependency_overrides[get_current_user] = lambda: {
            "id": 42,
            "username": "admin@example.gc.ca",
            "is_superuser": True,
        }
        app.dependency_overrides[database_enforcer_provider] = lambda: make_enforcer(
            ("admin", "workspace", "write")
        )
        app.dependency_overrides[get_workspace_service] = lambda: service
        app.dependency_overrides[async_get_db] = lambda: Mock()

        try:
            with TestClient(app) as client:
                create_response = client.post(
                    "/api/v1/workspaces",
                    json={
                        "name": "Benefits Workspace",
                        "departmentUuid": "018f6f83-0000-0000-0000-000000000101",
                        "description": "Primary workspace",
                    },
                )
                update_response = client.patch(
                    "/api/v1/workspaces/018f6f83-0000-0000-0000-000000000201",
                    json={
                        "name": "Renamed Workspace",
                        "slug": "renamed-workspace",
                    },
                )
                delete_response = client.delete(
                    "/api/v1/workspaces/018f6f83-0000-0000-0000-000000000201"
                )
        finally:
            app.dependency_overrides.clear()

        assert create_response.status_code == 201
        assert create_response.json()["departmentId"] == 7
        assert_default_onboarding_fields(create_response.json())
        assert update_response.status_code == 200
        assert update_response.json()["name"] == "Renamed Workspace"
        assert update_response.json()["slug"] == "renamed-workspace"
        assert_default_onboarding_fields(update_response.json())
        assert delete_response.status_code == 200

    def test_workspace_members_crud_delegates_to_service_for_workspace_admin(self) -> None:
        service = Mock()
        service.list_workspace_members = AsyncMock(
            return_value=[
                {
                    "id": 12,
                    "uuid": "018f6f83-0000-0000-0000-000000000402",
                    "workspace_id": 9,
                    "user_id": 99,
                    "role": "workspace_member",
                    "created_at": datetime(2026, 7, 30, 14, 0, tzinfo=UTC).isoformat(),
                    "deleted_at": None,
                    "is_deleted": False,
                    "user_email": "member@example.gc.ca",
                    "user_name": "Member User",
                    "user_uuid": "018f6f83-0000-0000-0000-000000000301",
                }
            ]
        )
        service.add_workspace_member = AsyncMock(
            return_value={
                "id": 12,
                "uuid": "018f6f83-0000-0000-0000-000000000402",
                "workspace_id": 9,
                "user_id": 99,
                "role": "workspace_member",
                "created_at": datetime(2026, 7, 30, 14, 0, tzinfo=UTC).isoformat(),
                "deleted_at": None,
                "is_deleted": False,
                "user_email": "member@example.gc.ca",
                "user_name": "Member User",
                "user_uuid": "018f6f83-0000-0000-0000-000000000301",
            }
        )
        service.update_workspace_member_role = AsyncMock(
            return_value={
                "id": 12,
                "uuid": "018f6f83-0000-0000-0000-000000000402",
                "workspace_id": 9,
                "user_id": 99,
                "role": "workspace_admin",
                "created_at": datetime(2026, 7, 30, 14, 0, tzinfo=UTC).isoformat(),
                "deleted_at": None,
                "is_deleted": False,
                "user_email": "member@example.gc.ca",
                "user_name": "Member User",
                "user_uuid": "018f6f83-0000-0000-0000-000000000301",
            }
        )
        service.remove_workspace_member = AsyncMock(
            return_value={"message": "Workspace member removed"}
        )
        current_user = {
            "id": 42,
            "username": "workspace-admin@example.gc.ca",
            "is_superuser": False,
        }
        db = Mock()

        app.dependency_overrides[get_current_user] = lambda: current_user
        app.dependency_overrides[get_workspace_service] = lambda: service
        app.dependency_overrides[async_get_db] = lambda: db

        try:
            with TestClient(app) as client:
                list_response = client.get(
                    "/api/v1/workspaces/018f6f83-0000-0000-0000-000000000201/members"
                )
                create_response = client.post(
                    "/api/v1/workspaces/018f6f83-0000-0000-0000-000000000201/members",
                    json={
                        "userUuid": "018f6f83-0000-0000-0000-000000000301",
                        "role": "workspace_member",
                    },
                )
                update_response = client.patch(
                    "/api/v1/workspaces/018f6f83-0000-0000-0000-000000000201/members/018f6f83-0000-0000-0000-000000000301",
                    json={"role": "workspace_admin"},
                )
                delete_response = client.delete(
                    "/api/v1/workspaces/018f6f83-0000-0000-0000-000000000201/members/018f6f83-0000-0000-0000-000000000301"
                )
        finally:
            app.dependency_overrides.clear()

        assert list_response.status_code == 200
        assert list_response.json()[0]["userEmail"] == "member@example.gc.ca"
        assert create_response.status_code == 201
        assert create_response.json()["role"] == "workspace_member"
        assert update_response.status_code == 200
        assert update_response.json()["role"] == "workspace_admin"
        assert delete_response.status_code == 200
        assert delete_response.json() == {"message": "Workspace member removed"}

    def test_workspace_members_denied_for_non_admin_actor(self) -> None:
        service = Mock()
        service.list_workspace_members = AsyncMock(
            side_effect=ForbiddenException("You do not have enough privileges.")
        )

        app.dependency_overrides[get_current_user] = lambda: {
            "id": 55,
            "username": "member@example.gc.ca",
            "is_superuser": False,
        }
        app.dependency_overrides[get_workspace_service] = lambda: service
        app.dependency_overrides[async_get_db] = lambda: Mock()

        try:
            with TestClient(app) as client:
                response = client.get(
                    "/api/v1/workspaces/018f6f83-0000-0000-0000-000000000201/members"
                )
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 403
        assert response.json()["error"]["code"] == "forbidden"

    def test_workspace_application_information_crud_delegates_to_service_for_workspace_admin(self) -> None:
        service = Mock()
        service.list_workspace_application_information = AsyncMock(
            return_value=[sample_application_information_payload()]
        )
        service.create_workspace_application_information = AsyncMock(
            return_value=sample_application_information_payload()
        )
        service.get_workspace_application_information = AsyncMock(
            return_value=sample_application_information_payload()
        )
        service.update_workspace_application_information = AsyncMock(
            return_value=sample_application_information_payload(service_name_en="Updated service")
        )
        service.delete_workspace_application_information = AsyncMock(
            return_value={"message": "Application information deleted"}
        )
        service.list_application_information_contacts = AsyncMock(
            return_value=[sample_application_information_contact_payload()]
        )
        service.add_application_information_contact = AsyncMock(
            return_value=sample_application_information_contact_payload()
        )
        service.update_application_information_contact = AsyncMock(
            return_value=sample_application_information_contact_payload(responsibility_en="Updated responsibility")
        )
        service.delete_application_information_contact = AsyncMock(
            return_value={"message": "Application information contact deleted"}
        )
        current_user = {
            "id": 42,
            "username": "workspace-admin@example.gc.ca",
            "is_superuser": False,
        }
        db = Mock()

        app.dependency_overrides[get_current_user] = lambda: current_user
        app.dependency_overrides[get_workspace_service] = lambda: service
        app.dependency_overrides[async_get_db] = lambda: db

        try:
            with TestClient(app) as client:
                list_response = client.get(
                    "/api/v1/workspaces/018f6f83-0000-0000-0000-000000000201/application-information"
                )
                create_response = client.post(
                    "/api/v1/workspaces/018f6f83-0000-0000-0000-000000000201/application-information",
                    json={
                        "serviceNameEn": "Example service",
                        "serviceNameFr": "Service exemple",
                        "overview": "Overview text",
                        "technologyAndProtocol": "OIDC with backend mediation",
                        "securityAndPrivacy": "Protected B controls apply",
                        "usage": "Partner onboarding usage",
                        "migrationOrTransitionPlan": "Phased transition",
                    },
                )
                detail_response = client.get(
                    "/api/v1/workspaces/018f6f83-0000-0000-0000-000000000201/application-information/018f6f83-0000-0000-0000-000000000501"
                )
                update_response = client.patch(
                    "/api/v1/workspaces/018f6f83-0000-0000-0000-000000000201/application-information/018f6f83-0000-0000-0000-000000000501",
                    json={"serviceNameEn": "Updated service"},
                )
                delete_response = client.delete(
                    "/api/v1/workspaces/018f6f83-0000-0000-0000-000000000201/application-information/018f6f83-0000-0000-0000-000000000501"
                )
                contacts_list_response = client.get(
                    "/api/v1/workspaces/018f6f83-0000-0000-0000-000000000201/application-information/018f6f83-0000-0000-0000-000000000501/contacts"
                )
                contact_create_response = client.post(
                    "/api/v1/workspaces/018f6f83-0000-0000-0000-000000000201/application-information/018f6f83-0000-0000-0000-000000000501/contacts",
                    json={
                        "nameEn": "Jane Doe",
                        "nameFr": "Jeanne Doe",
                        "responsibilityEn": "Product owner",
                        "responsibilityFr": "Responsable du produit",
                        "email": "jane.doe@example.gc.ca",
                        "phoneNumber": "555-555-5555",
                    },
                )
                contact_update_response = client.patch(
                    "/api/v1/workspaces/018f6f83-0000-0000-0000-000000000201/application-information/018f6f83-0000-0000-0000-000000000501/contacts/018f6f83-0000-0000-0000-000000000601",
                    json={"responsibilityEn": "Updated responsibility"},
                )
                contact_delete_response = client.delete(
                    "/api/v1/workspaces/018f6f83-0000-0000-0000-000000000201/application-information/018f6f83-0000-0000-0000-000000000501/contacts/018f6f83-0000-0000-0000-000000000601"
                )
        finally:
            app.dependency_overrides.clear()

        assert list_response.status_code == 200
        assert list_response.json()[0]["serviceNameEn"] == "Example service"
        assert_default_onboarding_fields(list_response.json()[0])
        assert create_response.status_code == 201
        assert create_response.json()["serviceNameFr"] == "Service exemple"
        assert_default_onboarding_fields(create_response.json())
        assert detail_response.status_code == 200
        assert detail_response.json()["uuid"] == "018f6f83-0000-0000-0000-000000000501"
        assert_default_onboarding_fields(detail_response.json())
        assert update_response.status_code == 200
        assert update_response.json()["serviceNameEn"] == "Updated service"
        assert_default_onboarding_fields(update_response.json())
        assert delete_response.status_code == 200
        assert delete_response.json() == {"message": "Application information deleted"}
        assert contacts_list_response.status_code == 200
        assert contacts_list_response.json()[0]["nameEn"] == "Jane Doe"
        assert contact_create_response.status_code == 201
        assert contact_create_response.json()["email"] == "jane.doe@example.gc.ca"
        assert contact_update_response.status_code == 200
        assert contact_update_response.json()["responsibilityEn"] == "Updated responsibility"
        assert contact_delete_response.status_code == 200
        assert contact_delete_response.json() == {"message": "Application information contact deleted"}

    def test_workspace_application_information_onboarding_state_transition_delegates_to_service(self) -> None:
        service = Mock()
        service.transition_workspace_application_information_onboarding_state = AsyncMock(
            return_value=sample_submitted_application_information_payload()
        )
        current_user = {
            "id": 42,
            "username": "workspace-admin@example.gc.ca",
            "is_superuser": False,
        }
        db = Mock()

        app.dependency_overrides[get_current_user] = lambda: current_user
        app.dependency_overrides[get_workspace_service] = lambda: service
        app.dependency_overrides[async_get_db] = lambda: db

        try:
            with TestClient(app) as client:
                response = client.post(
                    "/api/v1/workspaces/018f6f83-0000-0000-0000-000000000201/application-information/018f6f83-0000-0000-0000-000000000501/onboarding-state",
                    json={"targetState": "submitted"},
                )
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 200
        assert response.json()["onboardingState"] == "submitted"
        assert response.json()["submittedAt"] == "2026-08-11T12:00:00+00:00"
        transition_kwargs = service.transition_workspace_application_information_onboarding_state.await_args.kwargs
        assert transition_kwargs["db"] is db
        assert transition_kwargs["workspace_uuid"] == uuid_pkg.UUID(
            "018f6f83-0000-0000-0000-000000000201"
        )
        assert transition_kwargs["application_information_uuid"] == uuid_pkg.UUID(
            "018f6f83-0000-0000-0000-000000000501"
        )
        assert transition_kwargs["current_user"] == current_user
        assert transition_kwargs["payload"].target_state == "submitted"

    def test_workspace_application_information_denied_for_non_admin_actor(self) -> None:
        service = Mock()
        service.list_workspace_application_information = AsyncMock(
            side_effect=ForbiddenException("You do not have enough privileges.")
        )

        app.dependency_overrides[get_current_user] = lambda: {
            "id": 55,
            "username": "member@example.gc.ca",
            "is_superuser": False,
        }
        app.dependency_overrides[get_workspace_service] = lambda: service
        app.dependency_overrides[async_get_db] = lambda: Mock()

        try:
            with TestClient(app) as client:
                response = client.get(
                    "/api/v1/workspaces/018f6f83-0000-0000-0000-000000000201/application-information"
                )
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 403
        assert response.json()["error"]["code"] == "forbidden"

    def test_workspace_application_information_delete_returns_conflict_for_linked_rp_applications(self) -> None:
        service = Mock()
        service.delete_workspace_application_information = AsyncMock(
            side_effect=CustomException(
                status_code=409,
                detail=(
                    "Linked RP applications must be unlinked or removed before deleting application information"
                ),
            )
        )

        app.dependency_overrides[get_current_user] = lambda: {
            "id": 42,
            "username": "workspace-admin@example.gc.ca",
            "is_superuser": False,
        }
        app.dependency_overrides[get_workspace_service] = lambda: service
        app.dependency_overrides[async_get_db] = lambda: Mock()

        try:
            with TestClient(app) as client:
                response = client.delete(
                    "/api/v1/workspaces/018f6f83-0000-0000-0000-000000000201/application-information/018f6f83-0000-0000-0000-000000000501"
                )
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 409
        assert response.json()["error"]["code"] == "conflict"
        assert response.json()["error"]["message"] == (
            "Linked RP applications must be unlinked or removed before deleting application information"
        )

    def test_workspace_application_information_review_routes_delegate_for_superuser(self) -> None:
        service = Mock()
        service.get_workspace_application_information_review_context = AsyncMock(
            return_value={
                "notes": [sample_application_information_review_note_payload()],
                "checklist_summary": sample_application_information_review_checklist_payload(),
            }
        )
        service.add_workspace_application_information_review_note = AsyncMock(
            return_value=sample_application_information_review_note_payload(
                body="Ready for external review once evidence is linked"
            )
        )
        service.upsert_workspace_application_information_review_checklist = AsyncMock(
            return_value={
                **sample_application_information_review_checklist_payload(),
                "review_disposition": "ready_for_next_step",
            }
        )
        current_user = {
            "id": 1,
            "username": "admin@example.gc.ca",
            "is_superuser": True,
        }
        db = Mock()

        app.dependency_overrides[get_current_user] = lambda: current_user
        app.dependency_overrides[get_workspace_service] = lambda: service
        app.dependency_overrides[async_get_db] = lambda: db

        try:
            with TestClient(app) as client:
                read_response = client.get(
                    "/api/v1/workspaces/018f6f83-0000-0000-0000-000000000201/application-information/018f6f83-0000-0000-0000-000000000501/review"
                )
                note_response = client.post(
                    "/api/v1/workspaces/018f6f83-0000-0000-0000-000000000201/application-information/018f6f83-0000-0000-0000-000000000501/review/notes",
                    json={"body": "Ready for external review once evidence is linked"},
                )
                checklist_response = client.put(
                    "/api/v1/workspaces/018f6f83-0000-0000-0000-000000000201/application-information/018f6f83-0000-0000-0000-000000000501/review/checklist",
                    json={
                        "reviewDisposition": "ready_for_next_step",
                        "applicationInformationStatus": "complete",
                        "contactsStatus": "complete",
                        "environmentRegistrationStatus": "complete",
                        "promotionMetadataStatus": "incomplete",
                        "evidenceReferenceStatus": "incomplete",
                        "processLinksStatus": "complete",
                        "rationale": "Ready for external review once evidence is linked",
                    },
                )
        finally:
            app.dependency_overrides.clear()

        assert read_response.status_code == 200
        assert read_response.json()["notes"][0]["authorName"] == "CL Admin"
        assert read_response.json()["checklistSummary"]["reviewDisposition"] == "changes_requested"
        assert note_response.status_code == 201
        assert note_response.json()["body"] == "Ready for external review once evidence is linked"
        assert checklist_response.status_code == 200
        assert checklist_response.json()["reviewDisposition"] == "ready_for_next_step"
        read_kwargs = service.get_workspace_application_information_review_context.await_args.kwargs
        assert read_kwargs["db"] is db
        assert read_kwargs["workspace_uuid"] == uuid_pkg.UUID(
            "018f6f83-0000-0000-0000-000000000201"
        )
        assert read_kwargs["application_information_uuid"] == uuid_pkg.UUID(
            "018f6f83-0000-0000-0000-000000000501"
        )

    def test_workspace_application_information_review_routes_deny_non_superuser(self) -> None:
        service = Mock()
        service.get_workspace_application_information_review_context = AsyncMock()
        service.add_workspace_application_information_review_note = AsyncMock()
        service.upsert_workspace_application_information_review_checklist = AsyncMock()

        app.dependency_overrides[get_current_user] = lambda: {
            "id": 42,
            "username": "workspace-admin@example.gc.ca",
            "is_superuser": False,
        }
        app.dependency_overrides[get_workspace_service] = lambda: service
        app.dependency_overrides[async_get_db] = lambda: Mock()

        try:
            with TestClient(app) as client:
                read_response = client.get(
                    "/api/v1/workspaces/018f6f83-0000-0000-0000-000000000201/application-information/018f6f83-0000-0000-0000-000000000501/review"
                )
                note_response = client.post(
                    "/api/v1/workspaces/018f6f83-0000-0000-0000-000000000201/application-information/018f6f83-0000-0000-0000-000000000501/review/notes",
                    json={"body": "Need more review"},
                )
                checklist_response = client.put(
                    "/api/v1/workspaces/018f6f83-0000-0000-0000-000000000201/application-information/018f6f83-0000-0000-0000-000000000501/review/checklist",
                    json={
                        "reviewDisposition": "pending",
                        "applicationInformationStatus": "complete",
                        "contactsStatus": "complete",
                        "environmentRegistrationStatus": "complete",
                        "promotionMetadataStatus": "complete",
                        "evidenceReferenceStatus": "incomplete",
                        "processLinksStatus": "complete",
                    },
                )
        finally:
            app.dependency_overrides.clear()

        assert read_response.status_code == 403
        assert note_response.status_code == 403
        assert checklist_response.status_code == 403
        service.get_workspace_application_information_review_context.assert_not_called()
        service.add_workspace_application_information_review_note.assert_not_called()
        service.upsert_workspace_application_information_review_checklist.assert_not_called()

    def test_workspace_rp_application_crud_delegates_to_service_for_workspace_admin(self) -> None:
        service = Mock()
        service.list_workspace_rp_applications = AsyncMock(
            return_value=[sample_rp_application_payload()]
        )
        service.create_workspace_rp_application = AsyncMock(
            return_value=sample_rp_application_payload()
        )
        service.get_workspace_rp_application = AsyncMock(
            return_value=sample_rp_application_payload()
        )
        service.update_workspace_rp_application = AsyncMock(
            return_value=sample_rp_application_payload(dnr_app_name="Benefits Portal Updated")
        )
        service.delete_workspace_rp_application = AsyncMock(
            return_value={"message": "RP application deleted"}
        )
        current_user = {
            "id": 42,
            "username": "workspace-admin@example.gc.ca",
            "is_superuser": False,
        }
        db = Mock()

        app.dependency_overrides[get_current_user] = lambda: current_user
        app.dependency_overrides[get_workspace_service] = lambda: service
        app.dependency_overrides[async_get_db] = lambda: db

        try:
            with TestClient(app) as client:
                list_response = client.get(
                    "/api/v1/workspaces/018f6f83-0000-0000-0000-000000000201/applications"
                )
                create_response = client.post(
                    "/api/v1/workspaces/018f6f83-0000-0000-0000-000000000201/applications",
                    json={
                        "applicationInformationUuid": "018f6f83-0000-0000-0000-000000000501",
                        "canadaLoginEnvironment": "staging",
                        "serviceNameEn": "Benefits Portal",
                        "serviceNameFr": "Portail des prestations",
                        "applicationEnvironmentUrlEn": "https://benefits.canada.ca",
                        "applicationEnvironmentUrlFr": "https://prestations.canada.ca",
                        "redirectUris": ["https://benefits.canada.ca/callback"],
                        "postLogoutRedirectUris": ["https://benefits.canada.ca/logout-complete"],
                        "logoutMode": "front_channel",
                        "logoutUri": "https://benefits.canada.ca/logout",
                        "clientType": "confidential",
                        "supportsAuthorizationCodeFlow": True,
                        "clientAuthMethod": "client_secret_basic",
                        "requestedScopes": ["openid", "profile"],
                        "sectorIdentifier": "https://benefits.canada.ca",
                        "sharesPairwiseIdentifiers": False,
                        "pkceSupported": True,
                        "pkceAlgorithms": ["S256"],
                        "requestSigningSupported": False,
                        "requestSigningRoadmap": False,
                        "signatureValidationSupported": True,
                        "signatureValidationTargets": ["id_token"],
                        "signatureValidationAlgorithms": ["RS256"],
                        "requestEncryptionSupported": False,
                        "requestEncryptionRoadmap": False,
                        "messageDecryptionSupported": True,
                        "messageDecryptionTargets": ["id_token"],
                        "messageDecryptionKeyManagementAlgorithms": ["RSA-OAEP-256"],
                        "messageDecryptionContentAlgorithms": ["A256GCM"],
                    },
                )
                detail_response = client.get(
                    "/api/v1/workspaces/018f6f83-0000-0000-0000-000000000201/applications/018f6f83-0000-0000-0000-000000000701"
                )
                update_response = client.patch(
                    "/api/v1/workspaces/018f6f83-0000-0000-0000-000000000201/applications/018f6f83-0000-0000-0000-000000000701",
                    json={
                        "serviceNameEn": "Benefits Portal Updated",
                        "requestedScopes": ["openid", "profile", "email"],
                    },
                )
                delete_response = client.delete(
                    "/api/v1/workspaces/018f6f83-0000-0000-0000-000000000201/applications/018f6f83-0000-0000-0000-000000000701"
                )
        finally:
            app.dependency_overrides.clear()

        assert list_response.status_code == 200
        assert list_response.json()[0]["dnrAppName"] == "Benefits Portal"
        assert_default_onboarding_fields(list_response.json()[0])
        assert_default_promotion_fields(list_response.json()[0])
        assert create_response.status_code == 201
        assert create_response.json()["workspaceId"] == 9
        assert_default_onboarding_fields(create_response.json())
        assert_default_promotion_fields(create_response.json())
        assert detail_response.status_code == 200
        assert detail_response.json()["applicationInformationId"] == 17
        assert_default_onboarding_fields(detail_response.json())
        assert_default_promotion_fields(detail_response.json())
        assert update_response.status_code == 200
        assert update_response.json()["dnrAppName"] == "Benefits Portal Updated"
        assert_default_onboarding_fields(update_response.json())
        assert_default_promotion_fields(update_response.json())
        assert delete_response.status_code == 200
        assert delete_response.json() == {"message": "RP application deleted"}

    def test_workspace_rp_application_onboarding_state_transition_delegates_to_service(self) -> None:
        service = Mock()
        service.transition_workspace_rp_application_onboarding_state = AsyncMock(
            return_value=sample_submitted_rp_application_payload()
        )
        current_user = {
            "id": 42,
            "username": "workspace-admin@example.gc.ca",
            "is_superuser": False,
        }
        db = Mock()

        app.dependency_overrides[get_current_user] = lambda: current_user
        app.dependency_overrides[get_workspace_service] = lambda: service
        app.dependency_overrides[async_get_db] = lambda: db

        try:
            with TestClient(app) as client:
                response = client.post(
                    "/api/v1/workspaces/018f6f83-0000-0000-0000-000000000201/applications/018f6f83-0000-0000-0000-000000000701/onboarding-state",
                    json={"targetState": "submitted"},
                )
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 200
        assert response.json()["onboardingState"] == "submitted"
        assert response.json()["submittedAt"] == "2026-08-11T12:00:00+00:00"
        assert_default_promotion_fields(response.json())
        transition_kwargs = service.transition_workspace_rp_application_onboarding_state.await_args.kwargs
        assert transition_kwargs["db"] is db
        assert transition_kwargs["workspace_uuid"] == uuid_pkg.UUID(
            "018f6f83-0000-0000-0000-000000000201"
        )
        assert transition_kwargs["rp_application_uuid"] == uuid_pkg.UUID(
            "018f6f83-0000-0000-0000-000000000701"
        )
        assert transition_kwargs["current_user"] == current_user
        assert transition_kwargs["payload"].target_state == "submitted"

    def test_workspace_rp_application_onboarding_state_transition_surfaces_bad_request(self) -> None:
        service = Mock()
        service.transition_workspace_rp_application_onboarding_state = AsyncMock(
            side_effect=BadRequestException(
                "Production RP applications cannot move to 'approved' or 'launched' without a recorded promotion request"
            )
        )

        app.dependency_overrides[get_current_user] = lambda: {
            "id": 1,
            "username": "admin@example.gc.ca",
            "is_superuser": True,
        }
        app.dependency_overrides[get_workspace_service] = lambda: service
        app.dependency_overrides[async_get_db] = lambda: Mock()

        try:
            with TestClient(app) as client:
                response = client.post(
                    "/api/v1/workspaces/018f6f83-0000-0000-0000-000000000201/applications/018f6f83-0000-0000-0000-000000000701/onboarding-state",
                    json={"targetState": "approved"},
                )
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 400
        assert response.json()["error"]["message"] == (
            "Production RP applications cannot move to 'approved' or 'launched' without a recorded promotion request"
        )

    def test_read_workspace_rp_application_promotion_request_delegates_to_service(self) -> None:
        service = Mock()
        service.get_workspace_rp_application_promotion_request = AsyncMock(
            return_value=sample_promotion_request_payload()
        )
        current_user = {
            "id": 42,
            "username": "workspace-admin@example.gc.ca",
            "is_superuser": False,
        }
        db = Mock()

        app.dependency_overrides[get_current_user] = lambda: current_user
        app.dependency_overrides[get_workspace_service] = lambda: service
        app.dependency_overrides[async_get_db] = lambda: db

        try:
            with TestClient(app) as client:
                response = client.get(
                    "/api/v1/workspaces/018f6f83-0000-0000-0000-000000000201/applications/018f6f83-0000-0000-0000-000000000701/promotion-request"
                )
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 200
        assert response.json()["targetEnvironment"] == "production"
        assert response.json()["status"] == "approved"
        assert response.json()["externalReference"] == "CAB-123"
        get_kwargs = service.get_workspace_rp_application_promotion_request.await_args.kwargs
        assert get_kwargs["db"] is db
        assert get_kwargs["workspace_uuid"] == uuid_pkg.UUID(
            "018f6f83-0000-0000-0000-000000000201"
        )
        assert get_kwargs["rp_application_uuid"] == uuid_pkg.UUID(
            "018f6f83-0000-0000-0000-000000000701"
        )
        assert get_kwargs["current_user"] == current_user

    def test_workspace_rp_application_promotion_request_post_delegates_to_service(self) -> None:
        service = Mock()
        service.upsert_workspace_rp_application_promotion_request = AsyncMock(
            return_value=sample_review_tracked_production_rp_application_payload()
        )
        current_user = {
            "id": 42,
            "username": "workspace-admin@example.gc.ca",
            "is_superuser": False,
        }
        db = Mock()

        app.dependency_overrides[get_current_user] = lambda: current_user
        app.dependency_overrides[get_workspace_service] = lambda: service
        app.dependency_overrides[async_get_db] = lambda: db

        try:
            with TestClient(app) as client:
                response = client.post(
                    "/api/v1/workspaces/018f6f83-0000-0000-0000-000000000201/applications/018f6f83-0000-0000-0000-000000000701/promotion-request",
                    json={"externalReference": "CAB-123"},
                )
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 200
        assert response.json()["promotionTargetEnvironment"] == "production"
        assert response.json()["promotionStatus"] == "review_tracked"
        assert response.json()["promotionExternalReference"] == "CAB-123"
        write_kwargs = service.upsert_workspace_rp_application_promotion_request.await_args.kwargs
        assert write_kwargs["db"] is db
        assert write_kwargs["workspace_uuid"] == uuid_pkg.UUID(
            "018f6f83-0000-0000-0000-000000000201"
        )
        assert write_kwargs["rp_application_uuid"] == uuid_pkg.UUID(
            "018f6f83-0000-0000-0000-000000000701"
        )
        assert write_kwargs["current_user"] == current_user
        assert write_kwargs["payload"].external_reference == "CAB-123"

    def test_workspace_rp_application_promotion_request_patch_delegates_to_service(self) -> None:
        service = Mock()
        service.review_workspace_rp_application_promotion_request = AsyncMock(
            return_value=sample_approved_production_rp_application_payload()
        )

        app.dependency_overrides[get_current_user] = lambda: {
            "id": 1,
            "username": "admin@example.gc.ca",
            "is_superuser": True,
        }
        app.dependency_overrides[get_workspace_service] = lambda: service
        app.dependency_overrides[async_get_db] = lambda: Mock()

        try:
            with TestClient(app) as client:
                response = client.patch(
                    "/api/v1/workspaces/018f6f83-0000-0000-0000-000000000201/applications/018f6f83-0000-0000-0000-000000000701/promotion-request",
                    json={
                        "status": "approved",
                        "externalReference": "CAB-123",
                        "reviewedByTeam": "CanadaLogin",
                    },
                )
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 200
        assert response.json()["promotionStatus"] == "approved"
        assert response.json()["promotionReviewedByTeam"] == "CanadaLogin"
        assert response.json()["promotionReviewedAt"] == "2026-08-11T12:15:00Z"
        patch_kwargs = service.review_workspace_rp_application_promotion_request.await_args.kwargs
        assert patch_kwargs["workspace_uuid"] == uuid_pkg.UUID(
            "018f6f83-0000-0000-0000-000000000201"
        )
        assert patch_kwargs["rp_application_uuid"] == uuid_pkg.UUID(
            "018f6f83-0000-0000-0000-000000000701"
        )
        assert patch_kwargs["payload"].status == "approved"
        assert patch_kwargs["payload"].external_reference == "CAB-123"
        assert patch_kwargs["payload"].reviewed_by_team == "CanadaLogin"

    def test_workspace_rp_application_denied_for_non_admin_actor(self) -> None:
        service = Mock()
        service.list_workspace_rp_applications = AsyncMock(
            side_effect=ForbiddenException("You do not have enough privileges.")
        )

        app.dependency_overrides[get_current_user] = lambda: {
            "id": 55,
            "username": "member@example.gc.ca",
            "is_superuser": False,
        }
        app.dependency_overrides[get_workspace_service] = lambda: service
        app.dependency_overrides[async_get_db] = lambda: Mock()

        try:
            with TestClient(app) as client:
                response = client.get(
                    "/api/v1/workspaces/018f6f83-0000-0000-0000-000000000201/applications"
                )
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 403
        assert response.json()["error"]["code"] == "forbidden"

    def test_workspace_rp_application_developer_invitation_routes_delegate_to_service(self) -> None:
        invitation_service = Mock()
        invitation_service.list_developer_invitations = AsyncMock(
            return_value=[sample_developer_invitation_payload()]
        )
        invitation_service.create_developer_invitation = AsyncMock(
            return_value=sample_developer_invitation_payload(with_acceptance_url=True)
        )
        invitation_service.revoke_developer_invitation = AsyncMock(
            return_value=sample_developer_invitation_payload(status="revoked")
        )
        invitation_service.reissue_developer_invitation = AsyncMock(
            return_value=sample_developer_invitation_payload(with_acceptance_url=True)
        )
        current_user = {
            "id": 42,
            "username": "workspace-admin@example.gc.ca",
            "email": "workspace-admin@example.gc.ca",
            "is_superuser": True,
        }
        db = Mock()

        app.dependency_overrides[get_current_user] = lambda: current_user
        app.dependency_overrides[get_rp_application_developer_invitation_service] = lambda: invitation_service
        app.dependency_overrides[async_get_db] = lambda: db

        try:
            with TestClient(app) as client:
                list_response = client.get(
                    "/api/v1/workspaces/018f6f83-0000-0000-0000-000000000201/applications/018f6f83-0000-0000-0000-000000000701/developer-invitations"
                )
                create_response = client.post(
                    "/api/v1/workspaces/018f6f83-0000-0000-0000-000000000201/applications/018f6f83-0000-0000-0000-000000000701/developer-invitations",
                    json={
                        "invitedEmail": "invitee@example.gc.ca",
                        "role": "Read Only",
                        "inviteExpiresAt": "2026-08-20T12:00:00Z",
                    },
                )
                revoke_response = client.post(
                    "/api/v1/workspaces/018f6f83-0000-0000-0000-000000000201/applications/018f6f83-0000-0000-0000-000000000701/developer-invitations/018f6f83-0000-0000-0000-000000000801/revoke"
                )
                reissue_response = client.post(
                    "/api/v1/workspaces/018f6f83-0000-0000-0000-000000000201/applications/018f6f83-0000-0000-0000-000000000701/developer-invitations/018f6f83-0000-0000-0000-000000000801/reissue",
                    json={
                        "inviteExpiresAt": "2026-08-27T12:00:00Z",
                    },
                )
        finally:
            app.dependency_overrides.clear()

        assert list_response.status_code == 200
        assert list_response.json()[0]["invitedEmail"] == "invitee@example.gc.ca"
        assert create_response.status_code == 201
        assert create_response.json()["acceptanceUrl"].endswith("/raw-token")
        assert revoke_response.status_code == 200
        assert revoke_response.json()["status"] == "revoked"
        assert reissue_response.status_code == 200
        assert reissue_response.json()["acceptanceUrl"].endswith("/raw-token")

        invitation_service.list_developer_invitations.assert_awaited_once_with(
            db=db,
            workspace_uuid=uuid_pkg.UUID("018f6f83-0000-0000-0000-000000000201"),
            rp_application_uuid=uuid_pkg.UUID("018f6f83-0000-0000-0000-000000000701"),
            current_user=current_user,
        )
        create_kwargs = invitation_service.create_developer_invitation.await_args.kwargs
        assert create_kwargs["db"] is db
        assert create_kwargs["workspace_uuid"] == uuid_pkg.UUID("018f6f83-0000-0000-0000-000000000201")
        assert create_kwargs["rp_application_uuid"] == uuid_pkg.UUID("018f6f83-0000-0000-0000-000000000701")
        assert create_kwargs["current_user"] == current_user
        assert create_kwargs["invited_email"] == "invitee@example.gc.ca"
        assert create_kwargs["role"] == "Read Only"
        assert create_kwargs["invite_expires_at"] == datetime(2026, 8, 20, 12, 0, tzinfo=UTC)
        invitation_service.revoke_developer_invitation.assert_awaited_once_with(
            db=db,
            workspace_uuid=uuid_pkg.UUID("018f6f83-0000-0000-0000-000000000201"),
            rp_application_uuid=uuid_pkg.UUID("018f6f83-0000-0000-0000-000000000701"),
            invitation_uuid=uuid_pkg.UUID("018f6f83-0000-0000-0000-000000000801"),
            current_user=current_user,
        )
        reissue_kwargs = invitation_service.reissue_developer_invitation.await_args.kwargs
        assert reissue_kwargs["db"] is db
        assert reissue_kwargs["workspace_uuid"] == uuid_pkg.UUID("018f6f83-0000-0000-0000-000000000201")
        assert reissue_kwargs["rp_application_uuid"] == uuid_pkg.UUID("018f6f83-0000-0000-0000-000000000701")
        assert reissue_kwargs["invitation_uuid"] == uuid_pkg.UUID("018f6f83-0000-0000-0000-000000000801")
        assert reissue_kwargs["current_user"] == current_user
        assert reissue_kwargs["invite_expires_at"] == datetime(2026, 8, 27, 12, 0, tzinfo=UTC)

    def test_workspace_rp_application_developer_invitation_create_surfaces_forbidden(self) -> None:
        invitation_service = Mock()
        invitation_service.create_developer_invitation = AsyncMock(
            side_effect=ForbiddenException("Only CL Admin can assign the RP Admin role")
        )

        app.dependency_overrides[get_current_user] = lambda: {
            "id": 55,
            "username": "rp-admin@example.gc.ca",
            "email": "rp-admin@example.gc.ca",
            "is_superuser": False,
        }
        app.dependency_overrides[get_rp_application_developer_invitation_service] = lambda: invitation_service
        app.dependency_overrides[async_get_db] = lambda: Mock()

        try:
            with TestClient(app) as client:
                response = client.post(
                    "/api/v1/workspaces/018f6f83-0000-0000-0000-000000000201/applications/018f6f83-0000-0000-0000-000000000701/developer-invitations",
                    json={
                        "invitedEmail": "invitee@example.gc.ca",
                        "role": "RP Admin",
                        "inviteExpiresAt": "2026-08-20T12:00:00Z",
                    },
                )
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 403
        assert response.json()["error"]["code"] == "forbidden"

    def test_workspace_rp_application_telemetry_routes_delegate_to_service_for_workspace_admin(self) -> None:
        service = Mock()
        service.get_workspace_rp_application_usage_summary = AsyncMock(
            return_value={"total": 11, "succeeded": 9, "failed": 2}
        )
        service.get_workspace_rp_application_audit_events = AsyncMock(
            return_value={"events": [], "next": '"1775692800000", "event-2"', "total": 20}
        )
        service.get_workspace_rp_application_audit_events_search_after = AsyncMock(
            return_value={"events": [], "next": None, "total": 20}
        )
        current_user = {
            "id": 42,
            "username": "workspace-admin@example.gc.ca",
            "is_superuser": False,
        }
        db = Mock()
        ibm_sv_admin_service = Mock()

        app.dependency_overrides[get_current_user] = lambda: current_user
        app.dependency_overrides[get_workspace_service] = lambda: service
        app.dependency_overrides[get_ibm_sv_admin_service] = lambda: ibm_sv_admin_service
        app.dependency_overrides[async_get_db] = lambda: db

        try:
            with TestClient(app) as client:
                usage_response = client.get(
                    "/api/v1/workspaces/018f6f83-0000-0000-0000-000000000201/applications/018f6f83-0000-0000-0000-000000000701/usage/summary",
                    params={"selected_date": "1775692800000"},
                )
                audit_response = client.get(
                    "/api/v1/workspaces/018f6f83-0000-0000-0000-000000000201/applications/018f6f83-0000-0000-0000-000000000701/audit-events",
                    params={"selected_date": "1775692800000", "size": 25},
                )
                search_after_response = client.get(
                    "/api/v1/workspaces/018f6f83-0000-0000-0000-000000000201/applications/018f6f83-0000-0000-0000-000000000701/audit-events/search-after",
                    params={
                        "selected_date": "1775692800000",
                        "size": 25,
                        "search_after": '"1775692800000", "event-2"',
                    },
                )
        finally:
            app.dependency_overrides.clear()

        assert usage_response.status_code == 200
        assert usage_response.json() == {"total": 11, "succeeded": 9, "failed": 2}
        assert audit_response.status_code == 200
        assert audit_response.json()["total"] == 20
        assert search_after_response.status_code == 200
        assert search_after_response.json()["next"] is None
        service.get_workspace_rp_application_usage_summary.assert_awaited_once_with(
            db=db,
            workspace_uuid=uuid_pkg.UUID("018f6f83-0000-0000-0000-000000000201"),
            rp_application_uuid=uuid_pkg.UUID("018f6f83-0000-0000-0000-000000000701"),
            current_user=current_user,
            ibm_sv_admin_service=ibm_sv_admin_service,
            selected_date="1775692800000",
        )
        service.get_workspace_rp_application_audit_events.assert_awaited_once_with(
            db=db,
            workspace_uuid=uuid_pkg.UUID("018f6f83-0000-0000-0000-000000000201"),
            rp_application_uuid=uuid_pkg.UUID("018f6f83-0000-0000-0000-000000000701"),
            current_user=current_user,
            ibm_sv_admin_service=ibm_sv_admin_service,
            selected_date="1775692800000",
            size=25,
        )
        service.get_workspace_rp_application_audit_events_search_after.assert_awaited_once_with(
            db=db,
            workspace_uuid=uuid_pkg.UUID("018f6f83-0000-0000-0000-000000000201"),
            rp_application_uuid=uuid_pkg.UUID("018f6f83-0000-0000-0000-000000000701"),
            current_user=current_user,
            ibm_sv_admin_service=ibm_sv_admin_service,
            selected_date="1775692800000",
            size=25,
            search_after='"1775692800000", "event-2"',
        )
