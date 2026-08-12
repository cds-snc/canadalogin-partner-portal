from datetime import UTC, datetime
from unittest.mock import AsyncMock, Mock

from fastapi.testclient import TestClient

from src.app.api.dependencies import get_current_user, get_rp_application_developer_invitation_service
from src.app.core.db.database import async_get_db
from src.app.core.exceptions.http_exceptions import ForbiddenException, NotFoundException
from src.app.main import app


def sample_accept_response() -> dict[str, object]:
    return {
        "invitation": {
            "id": 121,
            "uuid": "018f6f83-0000-0000-0000-000000000801",
            "workspace_id": 9,
            "rp_application_id": 33,
            "invited_email": "invitee@example.gc.ca",
            "invite_expires_at": datetime(2026, 8, 20, 12, 0, tzinfo=UTC).isoformat(),
            "invited_by": 42,
            "role": "read_only",
            "status": "accepted",
            "accepted_at": datetime(2026, 8, 10, 12, 15, tzinfo=UTC).isoformat(),
            "revoked_at": None,
            "revocation_actor_source": None,
            "gc_notify_notification_id": None,
            "delegated_by_grant_uuid": None,
            "created_at": datetime(2026, 8, 10, 12, 0, tzinfo=UTC).isoformat(),
            "updated_at": datetime(2026, 8, 10, 12, 15, tzinfo=UTC).isoformat(),
            "deleted_at": None,
            "is_deleted": False,
        },
        "access_grant": {
            "id": 77,
            "uuid": "018f6f83-0000-0000-0000-000000000901",
            "workspace_id": 9,
            "user_id": 42,
            "role": "read_only",
            "status": "active",
            "source_invitation_uuid": "018f6f83-0000-0000-0000-000000000801",
            "created_at": datetime(2026, 8, 10, 12, 15, tzinfo=UTC).isoformat(),
            "updated_at": None,
            "deleted_at": None,
            "is_deleted": False,
        },
        "next_destination": "/workspaces/018f6f83-0000-0000-0000-000000000201",
    }


class TestRPApplicationDeveloperInvitationApi:
    def test_accept_invitation_route_delegates_to_service(self) -> None:
        service = Mock()
        service.accept_developer_invitation = AsyncMock(return_value=sample_accept_response())
        current_user = {
            "id": 42,
            "email": "invitee@example.gc.ca",
            "username": "invitee@example.gc.ca",
            "is_superuser": False,
        }
        db = Mock()

        app.dependency_overrides[get_current_user] = lambda: current_user
        app.dependency_overrides[get_rp_application_developer_invitation_service] = lambda: service
        app.dependency_overrides[async_get_db] = lambda: db

        try:
            with TestClient(app) as client:
                response = client.post(
                    "/api/v1/rp-application-developer-invitations/accept",
                    json={"token": "raw-token-value"},
                )
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 200
        body = response.json()
        assert body["invitation"]["status"] == "accepted"
        assert body["accessGrant"]["uuid"] == "018f6f83-0000-0000-0000-000000000901"
        assert body["nextDestination"] == ("/workspaces/018f6f83-0000-0000-0000-000000000201")
        assert {
            "id",
            "workspaceId",
            "rpApplicationId",
            "invitedBy",
            "revokedByUserId",
            "revocationActorSource",
            "gcNotifyNotificationId",
            "isDeleted",
            "deletedAt",
        }.isdisjoint(body["invitation"])
        assert {
            "id",
            "workspaceId",
            "userId",
            "revokedByUserId",
            "isDeleted",
            "deletedAt",
        }.isdisjoint(body["accessGrant"])
        service.accept_developer_invitation.assert_awaited_once_with(
            db=db,
            token="raw-token-value",
            current_user=current_user,
        )

    def test_openapi_publishes_only_public_invitation_and_grant_fields(self) -> None:
        schemas = app.openapi()["components"]["schemas"]
        invitation_properties = set(schemas["RPApplicationDeveloperInvitationRead"]["properties"])
        grant_properties = set(schemas["RPApplicationAccessGrantRead"]["properties"])
        create_properties = set(schemas["RPApplicationDeveloperInvitationCreate"]["properties"])
        reissue_properties = set(schemas["RPApplicationDeveloperInvitationReissue"]["properties"])

        assert invitation_properties == {
            "acceptedAt",
            "createdAt",
            "delegatedByGrantUuid",
            "invitedEmail",
            "inviteExpiresAt",
            "replacedByInvitationUuid",
            "revocationReason",
            "revokedAt",
            "role",
            "status",
            "updatedAt",
            "uuid",
        }
        assert grant_properties == {
            "createdAt",
            "revokedAt",
            "role",
            "sourceInvitationUuid",
            "status",
            "updatedAt",
            "uuid",
        }
        assert create_properties == {"inviteExpiresAt", "invitedEmail", "role"}
        assert reissue_properties == {"inviteExpiresAt"}

    def test_accept_invitation_route_surfaces_forbidden(self) -> None:
        service = Mock()
        service.accept_developer_invitation = AsyncMock(side_effect=ForbiddenException("Signed-in email does not match this invitation"))

        app.dependency_overrides[get_current_user] = lambda: {
            "id": 42,
            "email": "other@example.gc.ca",
            "username": "other@example.gc.ca",
            "is_superuser": False,
        }
        app.dependency_overrides[get_rp_application_developer_invitation_service] = lambda: service
        app.dependency_overrides[async_get_db] = lambda: Mock()

        try:
            with TestClient(app) as client:
                response = client.post(
                    "/api/v1/rp-application-developer-invitations/accept",
                    json={"token": "raw-token-value"},
                )
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 403
        assert response.json()["error"]["code"] == "forbidden"

    def test_accept_invitation_route_surfaces_not_found(self) -> None:
        service = Mock()
        service.accept_developer_invitation = AsyncMock(side_effect=NotFoundException("Developer invitation not found"))

        app.dependency_overrides[get_current_user] = lambda: {
            "id": 42,
            "email": "invitee@example.gc.ca",
            "username": "invitee@example.gc.ca",
            "is_superuser": False,
        }
        app.dependency_overrides[get_rp_application_developer_invitation_service] = lambda: service
        app.dependency_overrides[async_get_db] = lambda: Mock()

        try:
            with TestClient(app) as client:
                response = client.post(
                    "/api/v1/rp-application-developer-invitations/accept",
                    json={"token": "missing-token"},
                )
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 404
        assert response.json()["error"]["code"] == "not_found"
