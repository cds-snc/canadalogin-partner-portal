
from datetime import UTC, datetime, timedelta

import pytest
from fastapi import status

from src.app.api.dependencies import get_current_user, get_workspace_service
from src.app.core.exceptions.http_exceptions import ForbiddenException
from src.app.main import app


@pytest.mark.asyncio
async def test_create_workspace_endpoint_calls_service(monkeypatch, client):
    # arrange
    current_user = {"id": 10, "department_id": 5, "enabled": True, "is_superuser": True}
    created = {"id": 99, "name": "My Cozy WS", "slug": "my-cozy-ws", "department_id": 5}

    async def fake_get_current_user():
        return current_user

    class FakeService:
        async def create_workspace(self, db, current_user, values):
            return created

    async def _fake_current_user():
        return current_user

    async def _fake_service_provider():
        return FakeService()

    app.dependency_overrides[get_current_user] = _fake_current_user
    app.dependency_overrides[get_workspace_service] = _fake_service_provider
    try:
        # act
        resp = client.post("/api/v1/workspaces", json={"name": "My Cozy WS", "slug": None, "description": "desc"})
    finally:
        app.dependency_overrides = {}

    # assert
    assert resp.status_code == status.HTTP_200_OK
    assert resp.json()["id"] == 99


@pytest.mark.asyncio
async def test_list_workspaces_endpoint_serializes_camel_case_from_schema(monkeypatch, client):
    current_user = {"id": 10, "department_id": 5, "is_superuser": True}

    async def _fake_current_user():
        return current_user

    async def fake_get_multi(*args, **kwargs):
        return {
            "data": [
                {
                    "id": 99,
                    "uuid": "018f6f83-0000-0000-0000-000000000099",
                    "name": "Health Workspace",
                    "slug": "health-workspace",
                    "description": "desc",
                    "department_id": 5,
                    "created_at": "2026-04-08T00:00:00",
                    "updated_at": None,
                    "deleted_at": None,
                    "is_deleted": False,
                    "created_by": 10,
                }
            ]
        }

    from src.app.api.v1 import workspaces as workspaces_api

    monkeypatch.setattr(workspaces_api.crud_workspaces, "get_multi", fake_get_multi)
    app.dependency_overrides[get_current_user] = _fake_current_user
    try:
        resp = client.get("/api/v1/workspaces")
    finally:
        app.dependency_overrides = {}

    assert resp.status_code == status.HTTP_200_OK
    assert resp.json()[0]["departmentId"] == 5
    assert "department_id" not in resp.json()[0]


@pytest.mark.asyncio
async def test_add_member_endpoint_translates_service_error(monkeypatch, client):
    current_user = {"id": 1, "is_superuser": True}

    async def fake_get_current_user():
        return current_user

    class FakeService:
        async def add_member(self, db, workspace_uuid, target_user_uuid, role, current_user):
            raise ForbiddenException("Only admin")

    async def _fake_current_user():
        return current_user

    async def _fake_service_provider():
        return FakeService()

    app.dependency_overrides[get_current_user] = _fake_current_user
    app.dependency_overrides[get_workspace_service] = _fake_service_provider
    try:
        resp = client.post(
            "/api/v1/workspaces/018f6f83-0000-0000-0000-000000000001/members",
            json={"user_uuid": "018f6f83-0000-0000-0000-000000000002", "role": "member"},
        )

        assert resp.status_code == status.HTTP_403_FORBIDDEN
    finally:
        app.dependency_overrides = {}


@pytest.mark.asyncio
async def test_delete_member_endpoint_success(monkeypatch, client):
    current_user = {"id": 1, "is_superuser": True}

    async def fake_get_current_user():
        return current_user

    class FakeService:
        async def remove_member(self, db, workspace_uuid, target_user_uuid, current_user):
            return None

    async def _fake_current_user():
        return current_user

    async def _fake_service_provider():
        return FakeService()

    app.dependency_overrides[get_current_user] = _fake_current_user
    app.dependency_overrides[get_workspace_service] = _fake_service_provider
    try:
        resp = client.delete("/api/v1/workspaces/018f6f83-0000-0000-0000-000000000001/members/018f6f83-0000-0000-0000-000000000002")
        assert resp.status_code == status.HTTP_200_OK
        assert resp.json()["message"] == "member removed"
    finally:
        app.dependency_overrides = {}


@pytest.mark.asyncio
async def test_list_rp_applications_endpoint_calls_service(client):
    current_user = {"id": 10, "is_superuser": True}

    class FakeService:
        async def list_rp_applications(self, db, workspace_uuid, current_user):
            return [{"id": 3, "ibm_sv_application_id": "ibm-app-123"}]

    async def _fake_current_user():
        return current_user

    async def _fake_service_provider():
        return FakeService()

    app.dependency_overrides[get_current_user] = _fake_current_user
    app.dependency_overrides[get_workspace_service] = _fake_service_provider
    try:
        resp = client.get(
            "/api/v1/workspaces/018f6f83-0000-0000-0000-000000000001/applications"
        )
    finally:
        app.dependency_overrides = {}

    assert resp.status_code == status.HTTP_200_OK
    assert resp.json() == [{"id": 3, "ibm_sv_application_id": "ibm-app-123"}]


@pytest.mark.asyncio
async def test_invite_rp_application_developer_endpoint_calls_service(client):
    current_user = {"id": 10, "is_superuser": True}

    class FakeService:
        async def invite_rp_application_developer(
            self, db, workspace_uuid, rp_application_uuid, values, current_user
        ):
            return {
                "id": 4,
                "uuid": "018f6f83-0000-0000-0000-000000000111",
                "workspace_id": 42,
                "rp_application_id": 9,
                "invited_email": values.email,
                "invited_by": current_user["id"],
                "role": "developer",
                "invite_expires_at": datetime.now(UTC) + timedelta(days=7),
                "accepted_at": None,
                "revoked_at": None,
                "gc_notify_notification_id": "notify-123",
                "created_at": datetime.now(UTC),
                "updated_at": None,
                "deleted_at": None,
                "is_deleted": False,
            }

    async def _fake_current_user():
        return current_user

    async def _fake_service_provider():
        return FakeService()

    app.dependency_overrides[get_current_user] = _fake_current_user
    app.dependency_overrides[get_workspace_service] = _fake_service_provider
    try:
        resp = client.post(
            "/api/v1/workspaces/018f6f83-0000-0000-0000-000000000001/applications/018f6f83-0000-0000-0000-000000000099/developers/invite",
            json={"email": "developer@example.com"},
        )
    finally:
        app.dependency_overrides = {}

    assert resp.status_code == status.HTTP_200_OK
    assert resp.json()["invitedEmail"] == "developer@example.com"


@pytest.mark.asyncio
async def test_list_rp_application_developer_invitations_endpoint_calls_service(client):
    current_user = {"id": 10, "is_superuser": True}

    class FakeService:
        async def list_rp_application_developer_invitations(
            self, db, workspace_uuid, rp_application_uuid, current_user
        ):
            return [
                {
                    "id": 4,
                    "uuid": "018f6f83-0000-0000-0000-000000000111",
                    "workspace_id": 42,
                    "rp_application_id": 9,
                    "invited_email": "developer@example.com",
                    "invited_by": current_user["id"],
                    "role": "developer",
                    "invite_expires_at": datetime.now(UTC) + timedelta(days=7),
                    "accepted_at": None,
                    "revoked_at": None,
                    "gc_notify_notification_id": "notify-123",
                    "created_at": datetime.now(UTC),
                    "updated_at": None,
                    "deleted_at": None,
                    "is_deleted": False,
                    "status": "pending",
                }
            ]

    async def _fake_current_user():
        return current_user

    async def _fake_service_provider():
        return FakeService()

    app.dependency_overrides[get_current_user] = _fake_current_user
    app.dependency_overrides[get_workspace_service] = _fake_service_provider
    try:
        resp = client.get(
            "/api/v1/workspaces/018f6f83-0000-0000-0000-000000000001/applications/018f6f83-0000-0000-0000-000000000099/developer-invitations"
        )
    finally:
        app.dependency_overrides = {}

    assert resp.status_code == status.HTTP_200_OK
    assert resp.json()[0]["status"] == "pending"


@pytest.mark.asyncio
async def test_revoke_rp_application_developer_invitation_endpoint_calls_service(client):
    current_user = {"id": 10, "is_superuser": True}

    class FakeService:
        async def revoke_rp_application_developer_invitation(
            self, db, workspace_uuid, rp_application_uuid, invitation_uuid, current_user
        ):
            return {
                "id": 4,
                "uuid": str(invitation_uuid),
                "workspace_id": 42,
                "rp_application_id": 9,
                "invited_email": "developer@example.com",
                "invited_by": current_user["id"],
                "role": "developer",
                "invite_expires_at": datetime.now(UTC) + timedelta(days=7),
                "accepted_at": None,
                "revoked_at": datetime.now(UTC),
                "gc_notify_notification_id": "notify-123",
                "created_at": datetime.now(UTC),
                "updated_at": datetime.now(UTC),
                "deleted_at": None,
                "is_deleted": False,
                "status": "revoked",
            }

    async def _fake_current_user():
        return current_user

    async def _fake_service_provider():
        return FakeService()

    app.dependency_overrides[get_current_user] = _fake_current_user
    app.dependency_overrides[get_workspace_service] = _fake_service_provider
    try:
        resp = client.delete(
            "/api/v1/workspaces/018f6f83-0000-0000-0000-000000000001/applications/018f6f83-0000-0000-0000-000000000099/developer-invitations/018f6f83-0000-0000-0000-000000000111"
        )
    finally:
        app.dependency_overrides = {}

    assert resp.status_code == status.HTTP_200_OK
    assert resp.json()["status"] == "revoked"


@pytest.mark.asyncio
async def test_resend_rp_application_developer_invitation_endpoint_calls_service(client):
    current_user = {"id": 10, "is_superuser": True}

    class FakeService:
        async def resend_rp_application_developer_invitation(
            self, db, workspace_uuid, rp_application_uuid, invitation_uuid, current_user
        ):
            return {
                "id": 5,
                "uuid": "018f6f83-0000-0000-0000-000000000112",
                "workspace_id": 42,
                "rp_application_id": 9,
                "invited_email": "developer@example.com",
                "invited_by": current_user["id"],
                "role": "developer",
                "invite_expires_at": datetime.now(UTC) + timedelta(days=7),
                "accepted_at": None,
                "revoked_at": None,
                "gc_notify_notification_id": "notify-456",
                "created_at": datetime.now(UTC),
                "updated_at": None,
                "deleted_at": None,
                "is_deleted": False,
                "status": "pending",
            }

    async def _fake_current_user():
        return current_user

    async def _fake_service_provider():
        return FakeService()

    app.dependency_overrides[get_current_user] = _fake_current_user
    app.dependency_overrides[get_workspace_service] = _fake_service_provider
    try:
        resp = client.post(
            "/api/v1/workspaces/018f6f83-0000-0000-0000-000000000001/applications/018f6f83-0000-0000-0000-000000000099/developer-invitations/018f6f83-0000-0000-0000-000000000111/resend"
        )
    finally:
        app.dependency_overrides = {}

    assert resp.status_code == status.HTTP_200_OK
    assert resp.json()["status"] == "pending"


@pytest.mark.asyncio
async def test_list_application_infos_endpoint_serializes_camel_case_from_schema(client):
    current_user = {"id": 10, "is_superuser": True}

    class FakeService:
        async def list_application_infos(self, db, workspace_uuid, current_user):
            return [
                {
                    "id": 3,
                    "uuid": "018f6f83-0000-0000-0000-000000000301",
                    "workspace_id": 7,
                    "created_by": 10,
                    "created_at": "2026-04-08T00:00:00",
                    "is_deleted": False,
                    "application_name": "Benefits Portal",
                    "about_application": "Benefits service",
                    "program_line_of_business": "Benefits",
                    "application_url": "https://benefits.example.gc.ca",
                    "application_description": "Benefits access for citizens",
                    "portal_name": "Benefits Portal Suite",
                    "technology": "Web portal",
                    "authentication_protocol": "OIDC",
                    "planned_oidc_implementation_date": None,
                    "tech_stack": "FastAPI + React",
                    "requests_profile_data_pushes": False,
                    "has_access_management_layer": True,
                    "rollback_strategy": "Blue-green rollback",
                    "credential_assurance_level": "2",
                    "identity_assurance_level": "2",
                    "identity_proofing_method": "EXTERNAL_ID_PROVIDER",
                    "identity_proofing_method_other": None,
                    "is_cbas": True,
                    "has_account_recovery": True,
                    "authority_to_collect_personal_information": "Department act",
                    "has_privacy_notice": True,
                    "user_types": ["PUBLIC"],
                    "user_type_other": None,
                    "monthly_active_users": 12000,
                    "peak_usage_periods": "Tax season",
                    "personal_information_collected": ["EMAIL_ADDRESS"],
                    "personal_information_other": None,
                    "current_sign_in_options": ["GC_KEY"],
                    "current_sign_in_options_other": None,
                    "consolidator_used": "NONE",
                    "current_mfa_options": "NONE",
                    "uses_canadalogin_migration": False,
                    "migration_rationale": None,
                    "schedule_blackout_periods": None,
                    "transition_risks": None,
                    "transition_mitigations": None,
                    "rp_application_uuid": "018f6f83-0000-0000-0000-000000000401",
                }
            ]

    async def _fake_current_user():
        return current_user

    async def _fake_service_provider():
        return FakeService()

    app.dependency_overrides[get_current_user] = _fake_current_user
    app.dependency_overrides[get_workspace_service] = _fake_service_provider
    try:
        resp = client.get(
            "/api/v1/workspaces/018f6f83-0000-0000-0000-000000000001/application-info"
        )
    finally:
        app.dependency_overrides = {}

    assert resp.status_code == status.HTTP_200_OK
    body = resp.json()
    assert body[0]["applicationName"] == "Benefits Portal"
    assert body[0]["programLineOfBusiness"] == "Benefits"
    assert body[0]["currentSignInOptions"] == ["GC_KEY"]
    assert body[0]["rpApplicationUuid"] == "018f6f83-0000-0000-0000-000000000401"
    assert "application_name" not in body[0]


@pytest.mark.asyncio
async def test_list_current_user_workspaces_endpoint_calls_service(client):
    current_user = {"id": 10, "is_superuser": True}

    class FakeService:
        async def list_current_user_workspaces(self, db, current_user):
            return [
                {
                    "id": 1,
                    "uuid": "018f6f83-0000-0000-0000-000000000101",
                    "name": "Health Workspace",
                    "slug": "health-workspace",
                    "description": None,
                    "department_id": 5,
                    "created_at": "2026-04-08T00:00:00",
                    "updated_at": None,
                    "deleted_at": None,
                    "is_deleted": False,
                    "created_by": 10,
                }
            ]

    async def _fake_current_user():
        return current_user

    async def _fake_service_provider():
        return FakeService()

    app.dependency_overrides[get_current_user] = _fake_current_user
    app.dependency_overrides[get_workspace_service] = _fake_service_provider
    try:
        resp = client.get("/api/v1/workspaces/mine")
    finally:
        app.dependency_overrides = {}

    assert resp.status_code == status.HTTP_200_OK
    assert resp.json()[0]["uuid"] == "018f6f83-0000-0000-0000-000000000101"


@pytest.mark.asyncio
async def test_list_current_user_rp_applications_endpoint_calls_service(client):
    current_user = {"id": 10, "is_superuser": True}

    class FakeService:
        async def list_current_user_rp_applications(self, db, current_user):
            return [
                {
                    "id": 3,
                    "uuid": "018f6f83-0000-0000-0000-000000000201",
                    "name": "Benefits Portal",
                    "status": "active",
                    "workspace_name": "Health Workspace",
                    "workspace_uuid": "018f6f83-0000-0000-0000-000000000101",
                }
            ]

    async def _fake_current_user():
        return current_user

    async def _fake_service_provider():
        return FakeService()

    app.dependency_overrides[get_current_user] = _fake_current_user
    app.dependency_overrides[get_workspace_service] = _fake_service_provider
    try:
        resp = client.get("/api/v1/rp-applications/mine")
    finally:
        app.dependency_overrides = {}

    assert resp.status_code == status.HTTP_200_OK
    assert resp.json()[0]["workspaceUuid"] == "018f6f83-0000-0000-0000-000000000101"


@pytest.mark.asyncio
async def test_accept_rp_application_developer_invitation_endpoint_calls_service(client):
    current_user = {"id": 10, "email": "developer@example.com", "is_superuser": True}

    class FakeService:
        async def accept_rp_application_developer_invitation(self, db, token, current_user):
            assert token == "raw-invite-token"
            assert current_user["email"] == "developer@example.com"
            return {
                "id": 4,
                "uuid": "018f6f83-0000-0000-0000-000000000111",
                "workspace_id": 42,
                "rp_application_id": 9,
                "invited_email": "developer@example.com",
                "invited_by": 12,
                "role": "developer",
                "invite_expires_at": datetime.now(UTC) + timedelta(days=7),
                "accepted_at": datetime.now(UTC),
                "revoked_at": None,
                "gc_notify_notification_id": "notify-123",
                "created_at": datetime.now(UTC),
                "updated_at": datetime.now(UTC),
                "deleted_at": None,
                "is_deleted": False,
            }

    async def _fake_current_user():
        return current_user

    async def _fake_service_provider():
        return FakeService()

    app.dependency_overrides[get_current_user] = _fake_current_user
    app.dependency_overrides[get_workspace_service] = _fake_service_provider
    try:
        resp = client.post(
            "/api/v1/rp-application-developer-invitations/accept",
            json={"token": "raw-invite-token"},
        )
    finally:
        app.dependency_overrides = {}

    assert resp.status_code == status.HTTP_200_OK
    assert resp.json()["invitedEmail"] == "developer@example.com"


@pytest.mark.asyncio
async def test_get_current_user_rp_application_endpoint_calls_service(client):
    current_user = {"id": 10, "email": "developer@example.com", "is_superuser": True}

    class FakeService:
        async def get_current_user_rp_application(self, db, rp_application_uuid, current_user):
            return {
                "id": 9,
                "uuid": str(rp_application_uuid),
                "name": "Benefits Portal",
                "status": "active",
                "workspace_name": "Health Workspace",
                "workspace_uuid": "018f6f83-0000-0000-0000-000000000001",
            }

    async def _fake_current_user():
        return current_user

    async def _fake_service_provider():
        return FakeService()

    app.dependency_overrides[get_current_user] = _fake_current_user
    app.dependency_overrides[get_workspace_service] = _fake_service_provider
    try:
        resp = client.get(
            "/api/v1/rp-applications/mine/018f6f83-0000-0000-0000-000000000099"
        )
    finally:
        app.dependency_overrides = {}

    assert resp.status_code == status.HTTP_200_OK
    assert resp.json()["workspaceUuid"] == "018f6f83-0000-0000-0000-000000000001"


@pytest.mark.asyncio
async def test_patch_current_user_rp_application_endpoint_calls_service(client):
    current_user = {"id": 10, "email": "developer@example.com", "is_superuser": True}

    class FakeService:
        async def update_current_user_rp_application(self, db, rp_application_uuid, values, current_user):
            assert values.name == "Renamed App"
            return {
                "id": 9,
                "uuid": str(rp_application_uuid),
                "name": "[TBS] - Renamed App",
                "status": "active",
                "workspace_name": "Health Workspace",
                "workspace_uuid": "018f6f83-0000-0000-0000-000000000001",
            }

    async def _fake_current_user():
        return current_user

    async def _fake_service_provider():
        return FakeService()

    app.dependency_overrides[get_current_user] = _fake_current_user
    app.dependency_overrides[get_workspace_service] = _fake_service_provider
    try:
        resp = client.patch(
            "/api/v1/rp-applications/mine/018f6f83-0000-0000-0000-000000000099",
            json={"name": "Renamed App"},
        )
    finally:
        app.dependency_overrides = {}

    assert resp.status_code == status.HTTP_200_OK
    assert resp.json()["name"] == "[TBS] - Renamed App"


@pytest.mark.asyncio
async def test_create_rp_application_endpoint_calls_service_with_structured_json(client):
    current_user = {"id": 10, "department_id": 5, "enabled": True, "is_superuser": True}
    created = {"id": 3, "name": "[TBS] - Application One"}

    class FakeService:
        async def create_rp_application(self, db, workspace_uuid, values, current_user):
            assert values.redirect_uris == ["https://example.gc.ca/callback"]
            assert values.client_type == "confidential"
            assert str(values.application_info_uuid) == "018f6f83-0000-0000-0000-000000000211"
            return created

    async def _fake_current_user():
        return current_user

    async def _fake_service_provider():
        return FakeService()

    app.dependency_overrides[get_current_user] = _fake_current_user
    app.dependency_overrides[get_workspace_service] = _fake_service_provider
    try:
        resp = client.post(
            "/api/v1/workspaces/018f6f83-0000-0000-0000-000000000001/applications",
            json={
                "name": "Application One",
                "description": "Example application",
                "applicationUrl": "https://example.gc.ca",
                "redirectUris": ["https://example.gc.ca/callback"],
                "clientType": "confidential",
                "clientAuthMethod": "client_secret_basic",
                "pkceEnabled": False,
                "applicationInfoUuid": "018f6f83-0000-0000-0000-000000000211",
            },
        )
    finally:
        app.dependency_overrides = {}

    assert resp.status_code == status.HTTP_200_OK
    assert resp.json()["name"] == "[TBS] - Application One"


@pytest.mark.asyncio
async def test_patch_rp_application_endpoint_calls_service(client):
    current_user = {"id": 10, "is_superuser": True}

    class FakeService:
        async def update_rp_application(self, db, workspace_uuid, rp_application_uuid, values, current_user):
            assert values.name == "Renamed App"
            return {"id": 3, "name": "[TBS] - Renamed App"}

    async def _fake_current_user():
        return current_user

    async def _fake_service_provider():
        return FakeService()

    app.dependency_overrides[get_current_user] = _fake_current_user
    app.dependency_overrides[get_workspace_service] = _fake_service_provider
    try:
        resp = client.patch(
            "/api/v1/workspaces/018f6f83-0000-0000-0000-000000000001/applications/018f6f83-0000-0000-0000-000000000099",
            json={"name": "Renamed App"},
        )
    finally:
        app.dependency_overrides = {}

    assert resp.status_code == status.HTTP_200_OK
    assert resp.json()["name"] == "[TBS] - Renamed App"


@pytest.mark.asyncio
async def test_get_rp_application_client_credentials_endpoint_calls_service(client):
    current_user = {"id": 10, "is_superuser": True}

    class FakeService:
        async def get_rp_application_client_credentials(
            self, db, workspace_uuid, rp_application_uuid, current_user
        ):
            return {
                "client_id": "client-id-123",
                "client_secret": "top-secret-value",
                "client_secret_id": "secret-1",
            }

    async def _fake_current_user():
        return current_user

    async def _fake_service_provider():
        return FakeService()

    app.dependency_overrides[get_current_user] = _fake_current_user
    app.dependency_overrides[get_workspace_service] = _fake_service_provider
    try:
        resp = client.get(
            "/api/v1/workspaces/018f6f83-0000-0000-0000-000000000001/applications/018f6f83-0000-0000-0000-000000000099/client"
        )
    finally:
        app.dependency_overrides = {}

    assert resp.status_code == status.HTTP_200_OK
    assert resp.json()["client_id"] == "client-id-123"


@pytest.mark.asyncio
async def test_list_rp_application_rotated_client_secrets_endpoint_calls_service(client):
    current_user = {"id": 10, "is_superuser": True}

    class FakeService:
        async def list_rp_application_rotated_client_secrets(
            self, db, workspace_uuid, rp_application_uuid, current_user
        ):
            return [
                {
                    "description": "April rotation",
                    "expired_at": 1775692800,
                    "rotated_at": 1773100800,
                    "value": "another one",
                    "secret_id": "/rotatedSecrets/0",
                }
            ]

    async def _fake_current_user():
        return current_user

    async def _fake_service_provider():
        return FakeService()

    app.dependency_overrides[get_current_user] = _fake_current_user
    app.dependency_overrides[get_workspace_service] = _fake_service_provider
    try:
        resp = client.get(
            "/api/v1/workspaces/018f6f83-0000-0000-0000-000000000001/applications/018f6f83-0000-0000-0000-000000000099/client/rotated-secrets"
        )
    finally:
        app.dependency_overrides = {}

    assert resp.status_code == status.HTTP_200_OK
    assert resp.json()[0]["description"] == "April rotation"


@pytest.mark.asyncio
async def test_create_rp_application_rotated_client_secret_endpoint_calls_service(client):
    current_user = {"id": 10, "is_superuser": True}
    captured_values = {}

    class FakeService:
        async def create_rp_application_rotated_client_secret(
            self, db, workspace_uuid, rp_application_uuid, current_user, values=None
        ):
            captured_values["values"] = values
            return [
                {
                    "description": "April rotation",
                    "expired_at": 1775692800,
                    "rotated_at": 1773100800,
                    "value": "another one",
                    "secret_id": "/rotatedSecrets/0",
                }
            ]

    async def _fake_current_user():
        return current_user

    async def _fake_service_provider():
        return FakeService()

    app.dependency_overrides[get_current_user] = _fake_current_user
    app.dependency_overrides[get_workspace_service] = _fake_service_provider
    try:
        resp = client.post(
            "/api/v1/workspaces/018f6f83-0000-0000-0000-000000000001/applications/018f6f83-0000-0000-0000-000000000099/client/rotated-secrets",
            json={
                "description": "April rotation",
                "rotatedSecretExpiredAt": 1775692800,
            },
        )
    finally:
        app.dependency_overrides = {}

    assert resp.status_code == status.HTTP_200_OK
    assert resp.json()[0]["value"] == "another one"
    assert captured_values["values"].description == "April rotation"


@pytest.mark.asyncio
async def test_delete_rp_application_rotated_client_secret_endpoint_calls_service(client):
    current_user = {"id": 10, "is_superuser": True}
    captured_values = {}

    class FakeService:
        async def delete_rp_application_rotated_client_secret(
            self, db, workspace_uuid, rp_application_uuid, rotated_secret_id, current_user
        ):
            captured_values["rotated_secret_id"] = rotated_secret_id
            return {"message": "rotated secret deleted"}

    async def _fake_current_user():
        return current_user

    async def _fake_service_provider():
        return FakeService()

    app.dependency_overrides[get_current_user] = _fake_current_user
    app.dependency_overrides[get_workspace_service] = _fake_service_provider
    try:
        resp = client.delete(
            "/api/v1/workspaces/018f6f83-0000-0000-0000-000000000001/applications/018f6f83-0000-0000-0000-000000000099/client/rotated-secrets/secret-2"
        )
    finally:
        app.dependency_overrides = {}

    assert resp.status_code == status.HTTP_200_OK
    assert captured_values["rotated_secret_id"] == "secret-2"


@pytest.mark.asyncio
async def test_rotate_rp_application_client_secret_endpoint_calls_service(client):
    current_user = {"id": 10, "is_superuser": True}
    captured_values = {}

    class FakeService:
        async def rotate_rp_application_client_secret(
            self, db, workspace_uuid, rp_application_uuid, current_user, values=None
        ):
            captured_values["values"] = values
            return {
                "client_id": "client-id-123",
                "client_secret": "rotated-secret-value",
                "client_secret_id": "secret-2",
            }

    async def _fake_current_user():
        return current_user

    async def _fake_service_provider():
        return FakeService()

    app.dependency_overrides[get_current_user] = _fake_current_user
    app.dependency_overrides[get_workspace_service] = _fake_service_provider
    try:
        resp = client.post(
            "/api/v1/workspaces/018f6f83-0000-0000-0000-000000000001/applications/018f6f83-0000-0000-0000-000000000099/client/rotate-secret",
            json={
                "deleteRotatedSecrets": True,
                "description": "April rotation",
                "rotatedSecretExpiredAt": 1775692800,
            },
        )
    finally:
        app.dependency_overrides = {}

    assert resp.status_code == status.HTTP_200_OK
    assert resp.json()["client_secret"] == "rotated-secret-value"
    assert captured_values["values"].delete_rotated_secrets is True
    assert captured_values["values"].description == "April rotation"
    assert captured_values["values"].rotated_secret_expired_at == 1775692800


@pytest.mark.asyncio
async def test_delete_rp_application_endpoint_calls_service(client):
    current_user = {"id": 10, "is_superuser": True}

    class FakeService:
        async def delete_rp_application(self, db, workspace_uuid, rp_application_uuid, current_user):
            return {"message": "RP application deleted"}

    async def _fake_current_user():
        return current_user

    async def _fake_service_provider():
        return FakeService()

    app.dependency_overrides[get_current_user] = _fake_current_user
    app.dependency_overrides[get_workspace_service] = _fake_service_provider
    try:
        resp = client.delete(
            "/api/v1/workspaces/018f6f83-0000-0000-0000-000000000001/applications/018f6f83-0000-0000-0000-000000000099"
        )
    finally:
        app.dependency_overrides = {}

    assert resp.status_code == status.HTTP_200_OK
    assert resp.json()["message"] == "RP application deleted"


@pytest.mark.asyncio
async def test_get_rp_application_usage_summary_endpoint_calls_service(client):
    current_user = {"id": 10, "is_superuser": True}

    class FakeService:
        async def get_rp_application_usage_summary(
            self, db, workspace_uuid, rp_application_uuid, selected_date, current_user
        ):
            assert selected_date == "2026-04-09"
            return {"failed": 2, "succeeded": 9, "total": 11}

    async def _fake_current_user():
        return current_user

    async def _fake_service_provider():
        return FakeService()

    app.dependency_overrides[get_current_user] = _fake_current_user
    app.dependency_overrides[get_workspace_service] = _fake_service_provider
    try:
        resp = client.get(
            "/api/v1/workspaces/018f6f83-0000-0000-0000-000000000001/applications/018f6f83-0000-0000-0000-000000000099/usage/summary?selected_date=2026-04-09"
        )
    finally:
        app.dependency_overrides = {}

    assert resp.status_code == status.HTTP_200_OK
    assert resp.json() == {"failed": 2, "succeeded": 9, "total": 11}


@pytest.mark.asyncio
async def test_get_rp_application_audit_trail_endpoint_calls_service(client):
    current_user = {"id": 10, "is_superuser": True}

    class FakeService:
        async def get_rp_application_audit_trail(
            self, db, workspace_uuid, rp_application_uuid, selected_date, current_user, size
        ):
            assert selected_date == "2026-04-09"
            assert size == 25
            return {
                "events": [
                    {
                        "country": "Canada",
                        "ip_version": 4,
                        "origin": "192.168.10.20",
                        "origin_display": "192.168.xxx.xxx",
                        "result": "success",
                        "time_seconds": 1744200000,
                        "username": "jane.doe@example.com",
                        "username_display": "ja***@example.com",
                        "username_known": True,
                    }
                ],
                "next": '1744200000000, "event-2"',
                "total": 20,
            }

    async def _fake_current_user():
        return current_user

    async def _fake_service_provider():
        return FakeService()

    app.dependency_overrides[get_current_user] = _fake_current_user
    app.dependency_overrides[get_workspace_service] = _fake_service_provider
    try:
        resp = client.get(
            "/api/v1/workspaces/018f6f83-0000-0000-0000-000000000001/applications/018f6f83-0000-0000-0000-000000000099/usage/audit-trail?selected_date=2026-04-09"
        )
    finally:
        app.dependency_overrides = {}

    assert resp.status_code == status.HTTP_200_OK
    assert resp.json()["events"][0]["originDisplay"] == "192.168.xxx.xxx"


@pytest.mark.asyncio
async def test_get_rp_application_audit_trail_search_after_endpoint_calls_service(client):
    current_user = {"id": 10, "is_superuser": True}

    class FakeService:
        async def get_rp_application_audit_trail_search_after(
            self,
            db,
            workspace_uuid,
            rp_application_uuid,
            selected_date,
            current_user,
            size,
            search_after,
        ):
            assert selected_date == "2026-04-09"
            assert size == 25
            assert search_after == '"1744200000000", "event-2"'
            return {"events": [], "next": None, "total": 20}

    async def _fake_current_user():
        return current_user

    async def _fake_service_provider():
        return FakeService()

    app.dependency_overrides[get_current_user] = _fake_current_user
    app.dependency_overrides[get_workspace_service] = _fake_service_provider
    try:
        resp = client.get(
            "/api/v1/workspaces/018f6f83-0000-0000-0000-000000000001/applications/018f6f83-0000-0000-0000-000000000099/usage/audit-trail/search-after?selected_date=2026-04-09&search_after=%221744200000000%22%2C%20%22event-2%22"
        )
    finally:
        app.dependency_overrides = {}

    assert resp.status_code == status.HTTP_200_OK
    assert resp.json() == {"events": [], "next": None, "total": 20}
