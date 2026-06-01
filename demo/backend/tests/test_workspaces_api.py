from fastapi import status

from src.app.api.dependencies import get_current_user, get_workspace_service
from src.app.main import app
from src.app.services.workspace_service import WorkspaceService


async def test_create_workspace_endpoint_calls_service(client):
	current_user = {"id": 10, "department_id": 5, "enabled": True, "is_superuser": True}
	created = {"id": 99, "name": "My Cozy WS", "slug": "my-cozy-ws", "department_id": 5}

	class FakeService:
		async def create_workspace(self, db, current_user, values):
			return created

	async def _fake_current_user():
		return current_user

	async def _fake_service_provider():
		return FakeService()

	app.dependency_overrides[get_current_user] = _fake_current_user
	app.dependency_overrides[get_workspace_service] = _fake_service_provider
	resp = client.post(
		"/api/v1/workspaces",
		json={"name": "My Cozy WS", "slug": None, "description": "desc"},
	)

	assert resp.status_code == status.HTTP_200_OK
	assert resp.json()["id"] == 99


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
					"created_by": 10,
				}
			]
		}

	from src.app.api.v1 import workspaces as workspaces_api

	monkeypatch.setattr(workspaces_api.crud_workspaces, "get_multi", fake_get_multi)
	app.dependency_overrides[get_current_user] = _fake_current_user
	resp = client.get("/api/v1/workspaces")

	assert resp.status_code == status.HTTP_200_OK
	assert resp.json()[0]["departmentId"] == 5
	assert "department_id" not in resp.json()[0]


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
	resp = client.get("/api/v1/rp-applications/mine")

	assert resp.status_code == status.HTTP_200_OK
	assert resp.json()[0]["workspaceUuid"] == "018f6f83-0000-0000-0000-000000000101"


async def test_get_current_user_rp_application_endpoint_calls_service(client):
	current_user = {"id": 10, "is_superuser": True}
	rp_application_uuid = "018f6f83-0000-0000-0000-000000000201"

	class FakeService:
		async def get_current_user_rp_application(self, db, rp_application_uuid, current_user):
			return {
				"id": 3,
				"uuid": rp_application_uuid,
				"name": "Benefits Portal",
				"status": "active",
				"workspace_name": "Health Workspace",
				"workspace_uuid": "018f6f83-0000-0000-0000-000000000101",
			}

	async def _fake_current_user():
		return current_user

	async def _fake_service_provider():
		return FakeService()

	app.dependency_overrides[get_current_user] = _fake_current_user
	app.dependency_overrides[get_workspace_service] = _fake_service_provider
	resp = client.get(f"/api/v1/rp-applications/mine/{rp_application_uuid}")

	assert resp.status_code == status.HTTP_200_OK
	assert resp.json()["uuid"] == rp_application_uuid
	assert resp.json()["workspaceUuid"] == "018f6f83-0000-0000-0000-000000000101"


async def test_accept_rp_application_developer_invitation_endpoint_calls_service(client):
	current_user = {"id": 10, "email": "developer@example.com", "is_superuser": True}

	class FakeService:
		async def accept_rp_application_developer_invitation(self, db, token, current_user):
			assert token == "raw-invite-token"
			return {
				"id": 4,
				"uuid": "018f6f83-0000-0000-0000-000000000111",
				"workspace_id": 42,
				"rp_application_id": 9,
				"invited_email": current_user["email"],
				"invited_by": 12,
				"role": "developer",
				"status": "accepted",
			}

	async def _fake_current_user():
		return current_user

	async def _fake_service_provider():
		return FakeService()

	app.dependency_overrides[get_current_user] = _fake_current_user
	app.dependency_overrides[get_workspace_service] = _fake_service_provider
	resp = client.post(
		"/api/v1/rp-application-developer-invitations/accept",
		json={"token": "raw-invite-token"},
	)

	assert resp.status_code == status.HTTP_200_OK
	assert resp.json()["invitedEmail"] == "developer@example.com"
	assert resp.json()["status"] == "accepted"


async def test_accept_rp_application_developer_invitation_endpoint_rejects_invalid_token(monkeypatch, client):
	current_user = {"id": 10, "email": "developer@example.com", "is_superuser": True}

	async def _fake_current_user():
		return current_user

	async def fake_invitation_get(*args, **kwargs):
		return None

	from src.app.crud import crud_rp_application_developer_invitations as invitation_crud

	monkeypatch.setattr(invitation_crud.crud_rp_application_developer_invitations, "get", fake_invitation_get)
	app.dependency_overrides[get_current_user] = _fake_current_user
	app.dependency_overrides[get_workspace_service] = lambda: WorkspaceService()
	resp = client.post(
		"/api/v1/rp-application-developer-invitations/accept",
		json={"token": "bogus-token"},
	)

	assert resp.status_code == status.HTTP_404_NOT_FOUND


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
					"created_by": 10,
				}
			]

	async def _fake_current_user():
		return current_user

	async def _fake_service_provider():
		return FakeService()

	app.dependency_overrides[get_current_user] = _fake_current_user
	app.dependency_overrides[get_workspace_service] = _fake_service_provider
	resp = client.get("/api/v1/workspaces/mine")

	assert resp.status_code == status.HTTP_200_OK
	assert resp.json()[0]["uuid"] == "018f6f83-0000-0000-0000-000000000101"
	assert resp.json()[0]["departmentId"] == 5


async def test_list_rp_application_developer_invitations_endpoint_calls_service(client):
	current_user = {"id": 10, "is_superuser": True}

	class FakeService:
		async def list_rp_application_developer_invitations(self, db, workspace_uuid, rp_application_uuid, current_user):
			return [
				{
					"id": 4,
					"uuid": "018f6f83-0000-0000-0000-000000000111",
					"workspace_id": 42,
					"rp_application_id": 9,
					"invited_email": "developer@example.com",
					"invited_by": current_user["id"],
					"role": "developer",
					"status": "pending",
				}
			]

	async def _fake_current_user():
		return current_user

	async def _fake_service_provider():
		return FakeService()

	app.dependency_overrides[get_current_user] = _fake_current_user
	app.dependency_overrides[get_workspace_service] = _fake_service_provider
	resp = client.get(
		"/api/v1/workspaces/018f6f83-0000-0000-0000-000000000001/applications/018f6f83-0000-0000-0000-000000000099/developer-invitations"
	)

	assert resp.status_code == status.HTTP_200_OK
	assert resp.json()[0]["status"] == "pending"


async def test_revoke_rp_application_developer_invitation_endpoint_calls_service(client):
	current_user = {"id": 10, "is_superuser": True}

	class FakeService:
		async def revoke_rp_application_developer_invitation(self, db, workspace_uuid, rp_application_uuid, invitation_uuid, current_user):
			return {
				"id": 4,
				"uuid": str(invitation_uuid),
				"workspace_id": 42,
				"rp_application_id": 9,
				"invited_email": "developer@example.com",
				"invited_by": current_user["id"],
				"role": "developer",
				"status": "revoked",
			}

	async def _fake_current_user():
		return current_user

	async def _fake_service_provider():
		return FakeService()

	app.dependency_overrides[get_current_user] = _fake_current_user
	app.dependency_overrides[get_workspace_service] = _fake_service_provider
	resp = client.delete(
		"/api/v1/workspaces/018f6f83-0000-0000-0000-000000000001/applications/018f6f83-0000-0000-0000-000000000099/developer-invitations/018f6f83-0000-0000-0000-000000000111"
	)

	assert resp.status_code == status.HTTP_200_OK
	assert resp.json()["status"] == "revoked"


async def test_resend_rp_application_developer_invitation_endpoint_calls_service(client):
	current_user = {"id": 10, "is_superuser": True}

	class FakeService:
		async def resend_rp_application_developer_invitation(self, db, workspace_uuid, rp_application_uuid, invitation_uuid, current_user):
			return {
				"id": 5,
				"uuid": "018f6f83-0000-0000-0000-000000000112",
				"workspace_id": 42,
				"rp_application_id": 9,
				"invited_email": "developer@example.com",
				"invited_by": current_user["id"],
				"role": "developer",
				"status": "pending",
			}

	async def _fake_current_user():
		return current_user

	async def _fake_service_provider():
		return FakeService()

	app.dependency_overrides[get_current_user] = _fake_current_user
	app.dependency_overrides[get_workspace_service] = _fake_service_provider
	resp = client.post(
		"/api/v1/workspaces/018f6f83-0000-0000-0000-000000000001/applications/018f6f83-0000-0000-0000-000000000099/developer-invitations/018f6f83-0000-0000-0000-000000000111/resend"
	)

	assert resp.status_code == status.HTTP_200_OK
	assert resp.json()["status"] == "pending"


async def test_patch_current_user_rp_application_endpoint_calls_service(client):
	current_user = {"id": 10, "email": "developer@example.com", "is_superuser": True}
	rp_application_uuid = "018f6f83-0000-0000-0000-000000000099"

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
	resp = client.patch(
		f"/api/v1/rp-applications/mine/{rp_application_uuid}",
		json={"name": "Renamed App"},
	)

	assert resp.status_code == status.HTTP_200_OK
	assert resp.json()["name"] == "[TBS] - Renamed App"


async def test_get_current_user_rp_application_endpoint_allows_invited_developer_without_membership(monkeypatch, client):
	current_user = {"id": 10, "email": "developer@example.com", "is_superuser": True}
	rp_application_uuid = "018f6f83-0000-0000-0000-000000000099"

	async def _fake_current_user():
		return current_user

	async def fake_rp_get(*args, **kwargs):
		return {
			"id": 33,
			"uuid": rp_application_uuid,
			"name": "Benefits Portal",
			"status": "active",
			"workspace_id": 7,
			"ibm_sv_application_id": "ibm-app-123",
		}

	async def fake_workspace_get(*args, **kwargs):
		return {
			"id": 7,
			"uuid": "018f6f83-0000-0000-0000-000000000101",
			"name": "Health Workspace",
			"department_id": 5,
		}

	async def fake_membership_get(*args, **kwargs):
		return None

	async def fake_invitation_get_multi(*args, **kwargs):
		return {
			"data": [
				{
					"id": 4,
					"rp_application_id": 33,
					"workspace_id": 7,
					"invited_email": "developer@example.com",
					"accepted_at": "2026-06-01T00:00:00Z",
					"invite_expires_at": "2026-06-30T00:00:00Z",
				}
			]
		}

	from src.app.crud import crud_rp_applications, crud_rp_application_developer_invitations, crud_workspace_members, crud_workspaces

	monkeypatch.setattr(crud_rp_applications.crud_rp_applications, "get", fake_rp_get)
	monkeypatch.setattr(crud_workspaces.crud_workspaces, "get", fake_workspace_get)
	monkeypatch.setattr(crud_workspace_members.crud_workspace_members, "get", fake_membership_get)
	monkeypatch.setattr(crud_rp_application_developer_invitations.crud_rp_application_developer_invitations, "get_multi", fake_invitation_get_multi)
	app.dependency_overrides[get_current_user] = _fake_current_user
	app.dependency_overrides[get_workspace_service] = lambda: WorkspaceService()
	resp = client.get(f"/api/v1/rp-applications/mine/{rp_application_uuid}")

	assert resp.status_code == status.HTTP_200_OK
	assert resp.json()["uuid"] == rp_application_uuid
	assert resp.json()["workspaceUuid"] == "018f6f83-0000-0000-0000-000000000101"


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
					"application_name": "Benefits Portal",
					"program_line_of_business": "Benefits",
					"current_sign_in_options": ["GC_KEY"],
					"rp_application_uuid": "018f6f83-0000-0000-0000-000000000401",
				}
			]

	async def _fake_current_user():
		return current_user

	async def _fake_service_provider():
		return FakeService()

	app.dependency_overrides[get_current_user] = _fake_current_user
	app.dependency_overrides[get_workspace_service] = _fake_service_provider
	resp = client.get(
		"/api/v1/workspaces/018f6f83-0000-0000-0000-000000000001/application-info"
	)

	assert resp.status_code == status.HTTP_200_OK
	body = resp.json()
	assert body[0]["applicationName"] == "Benefits Portal"
	assert body[0]["programLineOfBusiness"] == "Benefits"
	assert body[0]["currentSignInOptions"] == ["GC_KEY"]
	assert body[0]["rpApplicationUuid"] == "018f6f83-0000-0000-0000-000000000401"


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

	assert resp.status_code == status.HTTP_200_OK
	assert resp.json()["name"] == "[TBS] - Application One"


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
	resp = client.patch(
		"/api/v1/workspaces/018f6f83-0000-0000-0000-000000000001/applications/018f6f83-0000-0000-0000-000000000099",
		json={"name": "Renamed App"},
	)

	assert resp.status_code == status.HTTP_200_OK
	assert resp.json()["name"] == "[TBS] - Renamed App"


async def test_get_rp_application_client_credentials_endpoint_calls_service(client):
	current_user = {"id": 10, "is_superuser": True}

	class FakeService:
		async def get_rp_application_client_credentials(self, db, workspace_uuid, rp_application_uuid, current_user):
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
	resp = client.get(
		"/api/v1/workspaces/018f6f83-0000-0000-0000-000000000001/applications/018f6f83-0000-0000-0000-000000000099/client"
	)

	assert resp.status_code == status.HTTP_200_OK
	assert resp.json()["client_id"] == "client-id-123"


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
	resp = client.delete(
		"/api/v1/workspaces/018f6f83-0000-0000-0000-000000000001/applications/018f6f83-0000-0000-0000-000000000099"
	)

	assert resp.status_code == status.HTTP_200_OK
	assert resp.json()["message"] == "RP application deleted"


async def test_list_rp_application_rotated_client_secrets_endpoint_calls_service(client):
	current_user = {"id": 10, "is_superuser": True}

	class FakeService:
		async def list_rp_application_rotated_client_secrets(self, db, workspace_uuid, rp_application_uuid, current_user):
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
	resp = client.get(
		"/api/v1/workspaces/018f6f83-0000-0000-0000-000000000001/applications/018f6f83-0000-0000-0000-000000000099/client/rotated-secrets"
	)

	assert resp.status_code == status.HTTP_200_OK
	assert resp.json()[0]["description"] == "April rotation"


async def test_create_rp_application_rotated_client_secret_endpoint_calls_service(client):
	current_user = {"id": 10, "is_superuser": True}
	captured_values = {}

	class FakeService:
		async def create_rp_application_rotated_client_secret(self, db, workspace_uuid, rp_application_uuid, current_user, values=None):
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
	resp = client.post(
		"/api/v1/workspaces/018f6f83-0000-0000-0000-000000000001/applications/018f6f83-0000-0000-0000-000000000099/client/rotated-secrets",
		json={
			"description": "April rotation",
			"rotatedSecretExpiredAt": 1775692800,
		},
	)

	assert resp.status_code == status.HTTP_200_OK
	assert resp.json()[0]["value"] == "another one"
	assert captured_values["values"].description == "April rotation"


async def test_delete_rp_application_rotated_client_secret_endpoint_calls_service(client):
	current_user = {"id": 10, "is_superuser": True}
	captured_values = {}

	class FakeService:
		async def delete_rp_application_rotated_client_secret(self, db, workspace_uuid, rp_application_uuid, rotated_secret_id, current_user):
			captured_values["rotated_secret_id"] = rotated_secret_id
			return {"message": "rotated secret deleted"}

	async def _fake_current_user():
		return current_user

	async def _fake_service_provider():
		return FakeService()

	app.dependency_overrides[get_current_user] = _fake_current_user
	app.dependency_overrides[get_workspace_service] = _fake_service_provider
	resp = client.delete(
		"/api/v1/workspaces/018f6f83-0000-0000-0000-000000000001/applications/018f6f83-0000-0000-0000-000000000099/client/rotated-secrets/secret-2"
	)

	assert resp.status_code == status.HTTP_200_OK
	assert captured_values["rotated_secret_id"] == "secret-2"


async def test_rotate_rp_application_client_secret_endpoint_calls_service(client):
	current_user = {"id": 10, "is_superuser": True}
	captured_values = {}

	class FakeService:
		async def rotate_rp_application_client_secret(self, db, workspace_uuid, rp_application_uuid, current_user, values=None):
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
	resp = client.post(
		"/api/v1/workspaces/018f6f83-0000-0000-0000-000000000001/applications/018f6f83-0000-0000-0000-000000000099/client/rotate-secret",
		json={
			"deleteRotatedSecrets": True,
			"description": "April rotation",
			"rotatedSecretExpiredAt": 1775692800,
		},
	)

	assert resp.status_code == status.HTTP_200_OK
	assert resp.json()["client_secret"] == "rotated-secret-value"
	assert captured_values["values"].delete_rotated_secrets is True
	assert captured_values["values"].description == "April rotation"
	assert captured_values["values"].rotated_secret_expired_at == 1775692800


async def test_get_rp_application_usage_summary_endpoint_calls_service(client):
	current_user = {"id": 10, "is_superuser": True}

	class FakeService:
		async def get_rp_application_usage_summary(self, db, workspace_uuid, rp_application_uuid, selected_date, current_user):
			assert selected_date == "2026-04-09"
			return {"failed": 2, "succeeded": 9, "total": 11}

	async def _fake_current_user():
		return current_user

	async def _fake_service_provider():
		return FakeService()

	app.dependency_overrides[get_current_user] = _fake_current_user
	app.dependency_overrides[get_workspace_service] = _fake_service_provider
	resp = client.get(
		"/api/v1/workspaces/018f6f83-0000-0000-0000-000000000001/applications/018f6f83-0000-0000-0000-000000000099/usage/summary?selected_date=2026-04-09"
	)

	assert resp.status_code == status.HTTP_200_OK
	assert resp.json() == {"failed": 2, "succeeded": 9, "total": 11}


async def test_get_rp_application_audit_trail_endpoint_calls_service(client):
	current_user = {"id": 10, "is_superuser": True}

	class FakeService:
		async def get_rp_application_audit_trail(self, db, workspace_uuid, rp_application_uuid, selected_date, current_user, size):
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
				"next": "1744200000000, event-2",
				"total": 20,
			}

	async def _fake_current_user():
		return current_user

	async def _fake_service_provider():
		return FakeService()

	app.dependency_overrides[get_current_user] = _fake_current_user
	app.dependency_overrides[get_workspace_service] = _fake_service_provider
	resp = client.get(
		"/api/v1/workspaces/018f6f83-0000-0000-0000-000000000001/applications/018f6f83-0000-0000-0000-000000000099/usage/audit-trail?selected_date=2026-04-09"
	)

	assert resp.status_code == status.HTTP_200_OK
	assert resp.json()["events"][0]["originDisplay"] == "192.168.xxx.xxx"


async def test_get_rp_application_audit_trail_search_after_endpoint_calls_service(client):
	current_user = {"id": 10, "is_superuser": True}

	class FakeService:
		async def get_rp_application_audit_trail_search_after(self, db, workspace_uuid, rp_application_uuid, selected_date, current_user, size, search_after):
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
	resp = client.get(
		"/api/v1/workspaces/018f6f83-0000-0000-0000-000000000001/applications/018f6f83-0000-0000-0000-000000000099/usage/audit-trail/search-after?selected_date=2026-04-09&search_after=%221744200000000%22%2C%20%22event-2%22"
	)

	assert resp.status_code == status.HTTP_200_OK
	assert resp.json() == {"events": [], "next": None, "total": 20}


async def test_update_workspace_endpoint_calls_service(client):
	current_user = {"id": 10, "is_superuser": True}
	workspace_uuid = "018f6f83-0000-0000-0000-000000000001"

	class FakeService:
		async def update_workspace(self, db, workspace_uuid, values, current_user):
			assert values.name == "Renamed Workspace"
			return {"id": 99, "name": "Renamed Workspace"}

	async def _fake_current_user():
		return current_user

	async def _fake_service_provider():
		return FakeService()

	app.dependency_overrides[get_current_user] = _fake_current_user
	app.dependency_overrides[get_workspace_service] = _fake_service_provider
	resp = client.patch(
		f"/api/v1/workspaces/{workspace_uuid}",
		json={"name": "Renamed Workspace"},
	)

	assert resp.status_code == status.HTTP_200_OK
	assert resp.json()["name"] == "Renamed Workspace"


async def test_delete_workspace_endpoint_calls_service(client):
	current_user = {"id": 10, "is_superuser": True}

	class FakeService:
		async def delete_workspace(self, db, workspace_uuid, current_user):
			return {"message": "Workspace deleted"}

	async def _fake_current_user():
		return current_user

	async def _fake_service_provider():
		return FakeService()

	app.dependency_overrides[get_current_user] = _fake_current_user
	app.dependency_overrides[get_workspace_service] = _fake_service_provider
	resp = client.delete(
		"/api/v1/workspaces/018f6f83-0000-0000-0000-000000000001"
	)

	assert resp.status_code == status.HTTP_200_OK
	assert resp.json()["message"] == "Workspace deleted"


async def test_add_member_endpoint_translates_service_error(client):
	current_user = {"id": 1, "is_superuser": True}

	class FakeService:
		async def add_member(self, db, workspace_uuid, target_user_uuid, role, current_user):
			from src.app.core.exceptions.http_exceptions import ForbiddenException

			raise ForbiddenException("Only admin")

	async def _fake_current_user():
		return current_user

	async def _fake_service_provider():
		return FakeService()

	app.dependency_overrides[get_current_user] = _fake_current_user
	app.dependency_overrides[get_workspace_service] = _fake_service_provider
	resp = client.post(
		"/api/v1/workspaces/018f6f83-0000-0000-0000-000000000001/members",
		json={"userUuid": "018f6f83-0000-0000-0000-000000000002", "role": "member"},
	)

	assert resp.status_code == status.HTTP_403_FORBIDDEN


async def test_list_members_endpoint_calls_service(client):
	current_user = {"id": 1, "is_superuser": True}

	class FakeService:
		async def list_members(self, db, workspace_uuid, current_user):
			return [{"userUuid": "018f6f83-0000-0000-0000-000000000002", "role": "member"}]

	async def _fake_current_user():
		return current_user

	async def _fake_service_provider():
		return FakeService()

	app.dependency_overrides[get_current_user] = _fake_current_user
	app.dependency_overrides[get_workspace_service] = _fake_service_provider
	resp = client.get(
		"/api/v1/workspaces/018f6f83-0000-0000-0000-000000000001/members"
	)

	assert resp.status_code == status.HTTP_200_OK
	assert resp.json()[0]["role"] == "member"


async def test_delete_member_endpoint_success(client):
	current_user = {"id": 1, "is_superuser": True}

	class FakeService:
		async def remove_member(self, db, workspace_uuid, target_user_uuid, current_user):
			return None

	async def _fake_current_user():
		return current_user

	async def _fake_service_provider():
		return FakeService()

	app.dependency_overrides[get_current_user] = _fake_current_user
	app.dependency_overrides[get_workspace_service] = _fake_service_provider
	resp = client.delete(
		"/api/v1/workspaces/018f6f83-0000-0000-0000-000000000001/members/018f6f83-0000-0000-0000-000000000002"
	)

	assert resp.status_code == status.HTTP_200_OK
	assert resp.json()["message"] == "member removed"


async def test_invite_rp_application_developer_endpoint_calls_service(client):
	current_user = {"id": 10, "is_superuser": True}

	class FakeService:
		async def invite_rp_application_developer(self, db, workspace_uuid, rp_application_uuid, values, current_user):
			assert values.email == "developer@example.com"
			return {
				"id": 4,
				"uuid": "018f6f83-0000-0000-0000-000000000111",
				"workspace_id": 42,
				"rp_application_id": 9,
				"invited_email": values.email,
				"invited_by": current_user["id"],
				"role": "developer",
				"status": "pending",
			}

	async def _fake_current_user():
		return current_user

	async def _fake_service_provider():
		return FakeService()

	app.dependency_overrides[get_current_user] = _fake_current_user
	app.dependency_overrides[get_workspace_service] = _fake_service_provider
	resp = client.post(
		"/api/v1/workspaces/018f6f83-0000-0000-0000-000000000001/applications/018f6f83-0000-0000-0000-000000000099/developers/invite",
		json={"email": "developer@example.com"},
	)

	assert resp.status_code == status.HTTP_200_OK
	assert resp.json()["invitedEmail"] == "developer@example.com"


async def test_create_application_info_endpoint_calls_service(client):
	current_user = {"id": 10, "is_superuser": True}

	class FakeService:
		async def create_application_info(self, db, workspace_uuid, values, current_user):
			assert values.application_name == "Benefits Portal"
			return {
				"id": 3,
				"uuid": "018f6f83-0000-0000-0000-000000000301",
				"workspace_id": 7,
				"created_by": 10,
				"application_name": values.application_name,
				"program_line_of_business": "Benefits",
				"current_sign_in_options": ["GC_KEY"],
				"rp_application_uuid": "018f6f83-0000-0000-0000-000000000401",
			}

	async def _fake_current_user():
		return current_user

	async def _fake_service_provider():
		return FakeService()

	app.dependency_overrides[get_current_user] = _fake_current_user
	app.dependency_overrides[get_workspace_service] = _fake_service_provider
	resp = client.post(
		"/api/v1/workspaces/018f6f83-0000-0000-0000-000000000001/application-info",
		json={"applicationName": "Benefits Portal"},
	)

	assert resp.status_code == status.HTTP_200_OK
	assert resp.json()["applicationName"] == "Benefits Portal"


async def test_update_application_info_endpoint_calls_service(client):
	current_user = {"id": 10, "is_superuser": True}

	class FakeService:
		async def update_application_info(self, db, workspace_uuid, application_info_uuid, values, current_user):
			assert values.application_name == "Updated Portal"
			return {
				"id": 3,
				"uuid": str(application_info_uuid),
				"workspace_id": 7,
				"created_by": 10,
				"application_name": values.application_name,
				"program_line_of_business": "Benefits",
				"current_sign_in_options": ["GC_KEY"],
				"rp_application_uuid": "018f6f83-0000-0000-0000-000000000401",
			}

	async def _fake_current_user():
		return current_user

	async def _fake_service_provider():
		return FakeService()

	app.dependency_overrides[get_current_user] = _fake_current_user
	app.dependency_overrides[get_workspace_service] = _fake_service_provider
	resp = client.patch(
		"/api/v1/workspaces/018f6f83-0000-0000-0000-000000000001/application-info/018f6f83-0000-0000-0000-000000000301",
		json={"applicationName": "Updated Portal"},
	)

	assert resp.status_code == status.HTTP_200_OK
	assert resp.json()["applicationName"] == "Updated Portal"


async def test_delete_application_info_endpoint_calls_service(client):
	current_user = {"id": 10, "is_superuser": True}

	class FakeService:
		async def delete_application_info(self, db, workspace_uuid, application_info_uuid, current_user):
			return {"message": "Application info deleted"}

	async def _fake_current_user():
		return current_user

	async def _fake_service_provider():
		return FakeService()

	app.dependency_overrides[get_current_user] = _fake_current_user
	app.dependency_overrides[get_workspace_service] = _fake_service_provider
	resp = client.delete(
		"/api/v1/workspaces/018f6f83-0000-0000-0000-000000000001/application-info/018f6f83-0000-0000-0000-000000000301"
	)

	assert resp.status_code == status.HTTP_200_OK
	assert resp.json()["message"] == "Application info deleted"


async def test_list_application_contacts_endpoint_calls_service(client):
	current_user = {"id": 10, "is_superuser": True}

	class FakeService:
		async def list_application_contacts(self, db, workspace_uuid, application_info_uuid, current_user):
			return [
				{
					"id": 1,
					"uuid": "018f6f83-0000-0000-0000-000000000501",
					"first_name": "Jane",
					"last_name": "Doe",
					"title_role": "Manager",
					"email": "jane@example.com",
					"phone_number": "555-0100",
					"contact_roles": [],
					"application_info_id": 17,
				}
			]

	async def _fake_current_user():
		return current_user

	async def _fake_service_provider():
		return FakeService()

	app.dependency_overrides[get_current_user] = _fake_current_user
	app.dependency_overrides[get_workspace_service] = _fake_service_provider
	resp = client.get(
		"/api/v1/workspaces/018f6f83-0000-0000-0000-000000000001/application-info/018f6f83-0000-0000-0000-000000000301/contacts"
	)

	assert resp.status_code == status.HTTP_200_OK
	assert resp.json()[0]["email"] == "jane@example.com"
	assert resp.json()[0]["firstName"] == "Jane"


async def test_create_application_contact_endpoint_calls_service(client):
	current_user = {"id": 10, "is_superuser": True}

	class FakeService:
		async def create_application_contact(self, db, workspace_uuid, application_info_uuid, values, current_user):
			assert values.first_name == "Jane"
			return {
				"id": 1,
				"uuid": "018f6f83-0000-0000-0000-000000000501",
				"first_name": values.first_name,
				"last_name": values.last_name,
				"title_role": values.title_role,
				"email": values.email,
				"phone_number": values.phone_number,
				"contact_roles": values.contact_roles,
				"application_info_id": 17,
			}

	async def _fake_current_user():
		return current_user

	async def _fake_service_provider():
		return FakeService()

	app.dependency_overrides[get_current_user] = _fake_current_user
	app.dependency_overrides[get_workspace_service] = _fake_service_provider
	resp = client.post(
		"/api/v1/workspaces/018f6f83-0000-0000-0000-000000000001/application-info/018f6f83-0000-0000-0000-000000000301/contacts",
		json={
			"firstName": "Jane",
			"lastName": "Doe",
			"titleRole": "Manager",
			"email": "jane@example.com",
			"phoneNumber": "555-0100",
		},
	)

	assert resp.status_code == status.HTTP_200_OK
	assert resp.json()["firstName"] == "Jane"
	assert resp.json()["email"] == "jane@example.com"


async def test_update_application_contact_endpoint_calls_service(client):
	current_user = {"id": 10, "is_superuser": True}

	class FakeService:
		async def update_application_contact(self, db, workspace_uuid, application_info_uuid, application_contact_uuid, values, current_user):
			assert values.first_name == "Updated"
			return {
				"id": 1,
				"uuid": str(application_contact_uuid),
				"first_name": values.first_name,
				"last_name": "Doe",
				"title_role": "Director",
				"email": "jane@example.com",
				"phone_number": "555-0100",
				"contact_roles": [],
				"application_info_id": 17,
			}

	async def _fake_current_user():
		return current_user

	async def _fake_service_provider():
		return FakeService()

	app.dependency_overrides[get_current_user] = _fake_current_user
	app.dependency_overrides[get_workspace_service] = _fake_service_provider
	resp = client.patch(
		"/api/v1/workspaces/018f6f83-0000-0000-0000-000000000001/application-info/018f6f83-0000-0000-0000-000000000301/contacts/018f6f83-0000-0000-0000-000000000501",
		json={"firstName": "Updated"},
	)

	assert resp.status_code == status.HTTP_200_OK
	assert resp.json()["firstName"] == "Updated"


async def test_delete_application_contact_endpoint_calls_service(client):
	current_user = {"id": 10, "is_superuser": True}

	class FakeService:
		async def delete_application_contact(self, db, workspace_uuid, application_info_uuid, application_contact_uuid, current_user):
			return {"message": "Application contact deleted"}

	async def _fake_current_user():
		return current_user

	async def _fake_service_provider():
		return FakeService()

	app.dependency_overrides[get_current_user] = _fake_current_user
	app.dependency_overrides[get_workspace_service] = _fake_service_provider
	resp = client.delete(
		"/api/v1/workspaces/018f6f83-0000-0000-0000-000000000001/application-info/018f6f83-0000-0000-0000-000000000301/contacts/018f6f83-0000-0000-0000-000000000501"
	)

	assert resp.status_code == status.HTTP_200_OK
	assert resp.json()["message"] == "Application contact deleted"