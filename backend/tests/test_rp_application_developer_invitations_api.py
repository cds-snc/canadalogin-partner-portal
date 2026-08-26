from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from datetime import UTC, datetime
from unittest.mock import ANY, AsyncMock, Mock, patch
from uuid import UUID

from fastapi import APIRouter
from fastapi.testclient import TestClient
from src.app.api.dependencies import get_current_user, get_rp_application_developer_invitation_service
from src.app.api.v1.rp_application_developer_invitations import router as invitation_router
from src.app.core.config import settings
from src.app.core.db.database import async_get_db
from src.app.core.exceptions.http_exceptions import ForbiddenException, NotFoundException
from src.app.core.setup import create_application
from src.app.main import app
from starsessions import InMemoryStore


def build_invitation_client(service: Mock, current_user: dict[str, object], db: Mock) -> TestClient:
    @asynccontextmanager
    async def noop_lifespan(_: object) -> AsyncIterator[None]:
        yield

    api_router = APIRouter(prefix="/api/v1")
    api_router.include_router(invitation_router)
    with patch("src.app.core.setup.get_redis_session_store", return_value=InMemoryStore()):
        test_app = create_application(
            api_router,
            settings=settings,
            create_tables_on_start=False,
            lifespan=noop_lifespan,
        )
    test_app.dependency_overrides[get_current_user] = lambda: current_user
    test_app.dependency_overrides[get_rp_application_developer_invitation_service] = lambda: service
    test_app.dependency_overrides[async_get_db] = lambda: db
    return TestClient(test_app)


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
    def test_prepare_then_accept_uses_only_session_bound_invitation_uuid(self) -> None:
        service = Mock()
        invitation_uuid = UUID("018f6f83-0000-0000-0000-000000000801")
        service.prepare_developer_invitation = AsyncMock(return_value=invitation_uuid)
        service.accept_prepared_developer_invitation = AsyncMock(return_value=sample_accept_response())
        current_user = {
            "id": 42,
            "email": "invitee@example.gc.ca",
            "username": "invitee@example.gc.ca",
            "is_superuser": False,
        }
        db = Mock()

        with build_invitation_client(service, current_user, db) as client:
            prepare_response = client.post(
                "/api/v1/rp-application-developer-invitations/prepare",
                json={"token": "raw-token-value"},
            )
            response = client.post(
                "/api/v1/rp-application-developer-invitations/accept-prepared",
                json={},
            )
            replay_without_preparation = client.post(
                "/api/v1/rp-application-developer-invitations/accept-prepared",
                json={},
            )

        assert prepare_response.status_code == 200
        assert prepare_response.json() == {"prepared": True}
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
        service.prepare_developer_invitation.assert_awaited_once_with(
            db=db,
            token="raw-token-value",
            correlation_id=ANY,
        )
        service.accept_prepared_developer_invitation.assert_awaited_once_with(
            db=db,
            invitation_uuid=invitation_uuid,
            current_user=current_user,
            correlation_id=ANY,
        )
        assert replay_without_preparation.status_code == 404
        assert replay_without_preparation.json()["error"]["message"] == "Developer invitation is unavailable"
        assert "raw-token-value" not in str(service.accept_prepared_developer_invitation.await_args)
        assert prepare_response.headers["Cache-Control"] == "private, no-store"
        assert response.headers["Cache-Control"] == "private, no-store"

    def test_openapi_publishes_only_public_invitation_and_grant_fields(self) -> None:
        schemas = app.openapi()["components"]["schemas"]
        invitation_properties = set(schemas["RPApplicationDeveloperInvitationRead"]["properties"])
        grant_properties = set(schemas["RPApplicationAccessGrantRead"]["properties"])
        create_properties = set(schemas["RPApplicationDeveloperInvitationCreate"]["properties"])
        reissue_properties = set(schemas["RPApplicationDeveloperInvitationReissue"]["properties"])
        prepare_properties = set(schemas["RPApplicationDeveloperInvitationPrepareRequest"]["properties"])
        paths = set(app.openapi()["paths"])

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
        assert prepare_properties == {"token"}
        assert "/api/v1/rp-application-developer-invitations/prepare" in paths
        assert "/api/v1/rp-application-developer-invitations/accept-prepared" in paths
        assert "/api/v1/rp-application-developer-invitations/accept" not in paths

    def test_failed_prepare_clears_stale_prepared_invitation(self) -> None:
        service = Mock()
        service.prepare_developer_invitation = AsyncMock(
            side_effect=[
                UUID("018f6f83-0000-0000-0000-000000000801"),
                NotFoundException("Developer invitation is unavailable"),
            ]
        )
        service.accept_prepared_developer_invitation = AsyncMock(return_value=sample_accept_response())

        current_user = {
            "id": 42,
            "email": "other@example.gc.ca",
            "username": "other@example.gc.ca",
            "is_superuser": False,
        }
        with build_invitation_client(service, current_user, Mock()) as client:
            first_prepare = client.post(
                "/api/v1/rp-application-developer-invitations/prepare",
                json={"token": "first-token"},
            )
            failed_prepare = client.post(
                "/api/v1/rp-application-developer-invitations/prepare",
                json={"token": "invalid-token"},
            )
            acceptance = client.post(
                "/api/v1/rp-application-developer-invitations/accept-prepared",
                json={},
            )

        assert first_prepare.status_code == 200
        assert failed_prepare.status_code == 404
        assert acceptance.status_code == 404
        service.accept_prepared_developer_invitation.assert_not_awaited()

    def test_prepare_validation_never_reflects_malformed_bearer_input(self) -> None:
        service = Mock()
        service.prepare_developer_invitation = AsyncMock()
        raw_token = "sensitive-token-value-" * 30

        with build_invitation_client(service, {}, Mock()) as client:
            response = client.post(
                "/api/v1/rp-application-developer-invitations/prepare",
                json={"token": raw_token},
            )

        assert response.status_code == 422
        assert raw_token not in response.text
        assert response.headers["Cache-Control"] == "private, no-store"
        service.prepare_developer_invitation.assert_not_awaited()

    def test_accept_prepared_consumes_state_even_when_acceptance_is_forbidden(self) -> None:
        service = Mock()
        service.prepare_developer_invitation = AsyncMock(return_value=UUID("018f6f83-0000-0000-0000-000000000801"))
        service.accept_prepared_developer_invitation = AsyncMock(side_effect=ForbiddenException("Developer invitation is unavailable"))

        current_user = {
            "id": 42,
            "email": "invitee@example.gc.ca",
            "username": "invitee@example.gc.ca",
            "is_superuser": False,
        }
        with build_invitation_client(service, current_user, Mock()) as client:
            prepare_response = client.post(
                "/api/v1/rp-application-developer-invitations/prepare",
                json={"token": "raw-token-value"},
            )
            response = client.post(
                "/api/v1/rp-application-developer-invitations/accept-prepared",
                json={},
            )
            second_response = client.post(
                "/api/v1/rp-application-developer-invitations/accept-prepared",
                json={},
            )

        assert prepare_response.status_code == 200
        assert response.status_code == 404
        assert response.json()["error"]["code"] == "not_found"
        assert response.json()["error"]["message"] == "Developer invitation is unavailable"
        assert second_response.status_code == 404
        service.accept_prepared_developer_invitation.assert_awaited_once()
