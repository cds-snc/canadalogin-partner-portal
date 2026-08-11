from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, patch
from uuid import uuid4

import pytest

from src.app.core.config import settings
from src.app.core.exceptions.http_exceptions import BadRequestException, DuplicateValueException, ForbiddenException, NotFoundException
from src.app.services.rp_application_developer_invitation_service import (
    ACCEPTED_INVITATION_STATUS,
    EXPIRED_INVITATION_STATUS,
    PENDING_INVITATION_STATUS,
    READ_ONLY_ROLE,
    REVOKED_INVITATION_STATUS,
    RP_ADMIN_ROLE,
    RP_USER_EDIT_ROLE,
    RPApplicationDeveloperInvitationService,
)


def _workspace_record() -> dict[str, object]:
    return {
        "id": 17,
        "uuid": uuid4(),
        "name": "Benefits partner",
        "department_id": 3,
    }


def _rp_application_record(workspace_id: int) -> dict[str, object]:
    return {
        "id": 29,
        "uuid": uuid4(),
        "workspace_id": workspace_id,
        "dnr_app_name": "Benefits Portal",
    }


def _invitation_record(
    *,
    workspace_id: int,
    rp_application_id: int,
    role: str = READ_ONLY_ROLE,
    status: str = PENDING_INVITATION_STATUS,
    invited_email: str = "invitee@example.gc.ca",
    invite_expires_at: datetime | None = None,
) -> dict[str, object]:
    now = datetime.now(UTC)
    return {
        "id": 99,
        "uuid": uuid4(),
        "workspace_id": workspace_id,
        "rp_application_id": rp_application_id,
        "invited_email": invited_email,
        "invite_expires_at": invite_expires_at or now + timedelta(days=7),
        "invited_by": 51,
        "role": role,
        "status": status,
        "accepted_at": None,
        "revoked_at": None,
        "gc_notify_notification_id": None,
        "delegated_by_grant_uuid": None,
        "created_at": now,
        "updated_at": None,
        "is_deleted": False,
        "deleted_at": None,
    }


def _access_grant_record(*, workspace_id: int, user_id: int, role: str = READ_ONLY_ROLE) -> dict[str, object]:
    return {
        "id": 77,
        "uuid": uuid4(),
        "workspace_id": workspace_id,
        "user_id": user_id,
        "role": role,
        "status": "active",
        "source_invitation_uuid": None,
        "created_at": datetime.now(UTC),
        "updated_at": None,
        "is_deleted": False,
        "deleted_at": None,
    }


class TestRPApplicationDeveloperInvitationService:
    @pytest.mark.asyncio
    async def test_create_invitation_hashes_token_and_records_delegated_grant(self, mock_db) -> None:
        service = RPApplicationDeveloperInvitationService()
        workspace = _workspace_record()
        rp_application = _rp_application_record(workspace_id=workspace["id"])
        delegated_grant_uuid = uuid4()
        created_invitation = _invitation_record(
            workspace_id=workspace["id"],
            rp_application_id=rp_application["id"],
            role=READ_ONLY_ROLE,
            invited_email="invitee@example.gc.ca",
        )

        with patch(
            "src.app.services.rp_application_developer_invitation_service.crud_workspaces"
        ) as mock_workspaces, patch(
            "src.app.services.rp_application_developer_invitation_service.crud_rp_applications"
        ) as mock_rp_applications, patch(
            "src.app.services.rp_application_developer_invitation_service.crud_rp_application_access_grants"
        ) as mock_access_grants, patch(
            "src.app.services.rp_application_developer_invitation_service.crud_rp_application_developer_invitations"
        ) as mock_invitations, patch(
            "src.app.services.rp_application_developer_invitation_service.secrets.token_urlsafe",
            return_value="raw-token-value",
        ):
            mock_workspaces.get = AsyncMock(return_value=workspace)
            mock_rp_applications.get = AsyncMock(return_value=rp_application)
            mock_access_grants.get = AsyncMock(
                return_value={"uuid": delegated_grant_uuid, "role": RP_ADMIN_ROLE}
            )
            mock_invitations.get_multi = AsyncMock(return_value={"data": []})
            mock_invitations.create = AsyncMock(return_value=created_invitation)

            result = await service.create_developer_invitation(
                db=mock_db,
                workspace_uuid=workspace["uuid"],
                rp_application_uuid=rp_application["uuid"],
                current_user={"id": 51, "is_superuser": False},
                invited_email=" Invitee@Example.GC.CA ",
                role=READ_ONLY_ROLE,
                invite_expires_at=datetime.now(UTC) + timedelta(days=5),
            )

        created_payload = mock_invitations.create.call_args.kwargs["object"]
        assert created_payload.invited_email == "invitee@example.gc.ca"
        assert created_payload.role == READ_ONLY_ROLE
        assert created_payload.status == PENDING_INVITATION_STATUS
        assert created_payload.invited_by == 51
        assert created_payload.delegated_by_grant_uuid == delegated_grant_uuid
        assert created_payload.token_hash != "raw-token-value"
        assert result["acceptance_url"] == f"{settings.RP_APPLICATION_INVITE_URL_BASE}/raw-token-value"

    @pytest.mark.asyncio
    async def test_create_invitation_rejects_duplicate_pending_invitation(self, mock_db) -> None:
        service = RPApplicationDeveloperInvitationService()
        workspace = _workspace_record()
        rp_application = _rp_application_record(workspace_id=workspace["id"])
        existing_invitation = _invitation_record(
            workspace_id=workspace["id"],
            rp_application_id=rp_application["id"],
            invited_email="invitee@example.gc.ca",
        )

        with patch(
            "src.app.services.rp_application_developer_invitation_service.crud_workspaces"
        ) as mock_workspaces, patch(
            "src.app.services.rp_application_developer_invitation_service.crud_rp_applications"
        ) as mock_rp_applications, patch(
            "src.app.services.rp_application_developer_invitation_service.crud_rp_application_developer_invitations"
        ) as mock_invitations:
            mock_workspaces.get = AsyncMock(return_value=workspace)
            mock_rp_applications.get = AsyncMock(return_value=rp_application)
            mock_invitations.get_multi = AsyncMock(return_value={"data": [existing_invitation]})

            with pytest.raises(
                DuplicateValueException,
                match="An active invitation already exists for this email and partner context",
            ):
                await service.create_developer_invitation(
                    db=mock_db,
                    workspace_uuid=workspace["uuid"],
                    rp_application_uuid=rp_application["uuid"],
                    current_user={"id": 1, "is_superuser": True},
                    invited_email="invitee@example.gc.ca",
                    role=READ_ONLY_ROLE,
                    invite_expires_at=datetime.now(UTC) + timedelta(days=5),
                )

    @pytest.mark.asyncio
    async def test_create_invitation_rejects_rp_admin_for_delegated_inviter(self, mock_db) -> None:
        service = RPApplicationDeveloperInvitationService()
        workspace = _workspace_record()
        rp_application = _rp_application_record(workspace_id=workspace["id"])

        with patch(
            "src.app.services.rp_application_developer_invitation_service.crud_workspaces"
        ) as mock_workspaces, patch(
            "src.app.services.rp_application_developer_invitation_service.crud_rp_applications"
        ) as mock_rp_applications, patch(
            "src.app.services.rp_application_developer_invitation_service.crud_rp_application_access_grants"
        ) as mock_access_grants:
            mock_workspaces.get = AsyncMock(return_value=workspace)
            mock_rp_applications.get = AsyncMock(return_value=rp_application)
            mock_access_grants.get = AsyncMock(return_value={"uuid": uuid4(), "role": RP_ADMIN_ROLE})

            with pytest.raises(ForbiddenException, match="Only CL Admin can assign the RP Admin role"):
                await service.create_developer_invitation(
                    db=mock_db,
                    workspace_uuid=workspace["uuid"],
                    rp_application_uuid=rp_application["uuid"],
                    current_user={"id": 51, "is_superuser": False},
                    invited_email="invitee@example.gc.ca",
                    role=RP_ADMIN_ROLE,
                    invite_expires_at=datetime.now(UTC) + timedelta(days=5),
                )

    @pytest.mark.asyncio
    async def test_list_invitations_marks_expired_pending_invitation(self, mock_db) -> None:
        service = RPApplicationDeveloperInvitationService()
        workspace = _workspace_record()
        rp_application = _rp_application_record(workspace_id=workspace["id"])
        expired_invitation = _invitation_record(
            workspace_id=workspace["id"],
            rp_application_id=rp_application["id"],
            role=RP_USER_EDIT_ROLE,
            invite_expires_at=datetime.now(UTC) - timedelta(minutes=1),
        )

        with patch(
            "src.app.services.rp_application_developer_invitation_service.crud_workspaces"
        ) as mock_workspaces, patch(
            "src.app.services.rp_application_developer_invitation_service.crud_rp_applications"
        ) as mock_rp_applications, patch(
            "src.app.services.rp_application_developer_invitation_service.crud_rp_application_developer_invitations"
        ) as mock_invitations:
            mock_workspaces.get = AsyncMock(return_value=workspace)
            mock_rp_applications.get = AsyncMock(return_value=rp_application)
            mock_invitations.get_multi = AsyncMock(return_value={"data": [expired_invitation]})
            mock_invitations.update = AsyncMock(return_value=None)

            result = await service.list_developer_invitations(
                db=mock_db,
                workspace_uuid=workspace["uuid"],
                rp_application_uuid=rp_application["uuid"],
                current_user={"id": 1, "is_superuser": True},
            )

        assert result[0]["status"] == EXPIRED_INVITATION_STATUS
        mock_invitations.update.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_revoke_invitation_marks_pending_invitation_revoked(self, mock_db) -> None:
        service = RPApplicationDeveloperInvitationService()
        workspace = _workspace_record()
        rp_application = _rp_application_record(workspace_id=workspace["id"])
        invitation = _invitation_record(
            workspace_id=workspace["id"],
            rp_application_id=rp_application["id"],
            role=READ_ONLY_ROLE,
        )

        with patch(
            "src.app.services.rp_application_developer_invitation_service.crud_workspaces"
        ) as mock_workspaces, patch(
            "src.app.services.rp_application_developer_invitation_service.crud_rp_applications"
        ) as mock_rp_applications, patch(
            "src.app.services.rp_application_developer_invitation_service.crud_rp_application_developer_invitations"
        ) as mock_invitations:
            mock_workspaces.get = AsyncMock(return_value=workspace)
            mock_rp_applications.get = AsyncMock(return_value=rp_application)
            mock_invitations.get = AsyncMock(return_value=invitation)
            mock_invitations.update = AsyncMock(return_value=None)

            result = await service.revoke_developer_invitation(
                db=mock_db,
                workspace_uuid=workspace["uuid"],
                rp_application_uuid=rp_application["uuid"],
                invitation_uuid=invitation["uuid"],
                current_user={"id": 1, "is_superuser": True},
            )

        assert result["status"] == REVOKED_INVITATION_STATUS
        assert result["revoked_at"] is not None
        mock_invitations.update.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_reissue_invitation_revokes_prior_pending_and_returns_new_link(self, mock_db) -> None:
        service = RPApplicationDeveloperInvitationService()
        workspace = _workspace_record()
        rp_application = _rp_application_record(workspace_id=workspace["id"])
        current_invitation = _invitation_record(
            workspace_id=workspace["id"],
            rp_application_id=rp_application["id"],
            role=RP_USER_EDIT_ROLE,
            invited_email="invitee@example.gc.ca",
        )
        reissued_invitation = _invitation_record(
            workspace_id=workspace["id"],
            rp_application_id=rp_application["id"],
            role=RP_USER_EDIT_ROLE,
            invited_email="invitee@example.gc.ca",
            invite_expires_at=datetime.now(UTC) + timedelta(days=10),
        )

        with patch(
            "src.app.services.rp_application_developer_invitation_service.crud_workspaces"
        ) as mock_workspaces, patch(
            "src.app.services.rp_application_developer_invitation_service.crud_rp_applications"
        ) as mock_rp_applications, patch(
            "src.app.services.rp_application_developer_invitation_service.crud_rp_application_developer_invitations"
        ) as mock_invitations, patch(
            "src.app.services.rp_application_developer_invitation_service.secrets.token_urlsafe",
            return_value="fresh-token-value",
        ):
            mock_workspaces.get = AsyncMock(return_value=workspace)
            mock_rp_applications.get = AsyncMock(return_value=rp_application)
            mock_invitations.get = AsyncMock(return_value=current_invitation)
            mock_invitations.update = AsyncMock(return_value=None)
            mock_invitations.create = AsyncMock(return_value=reissued_invitation)

            result = await service.reissue_developer_invitation(
                db=mock_db,
                workspace_uuid=workspace["uuid"],
                rp_application_uuid=rp_application["uuid"],
                invitation_uuid=current_invitation["uuid"],
                current_user={"id": 1, "is_superuser": True},
                invite_expires_at=datetime.now(UTC) + timedelta(days=10),
            )

        first_update = mock_invitations.update.await_args_list[0].kwargs["object"]
        created_payload = mock_invitations.create.call_args.kwargs["object"]
        assert first_update["status"] == REVOKED_INVITATION_STATUS
        assert created_payload.invited_email == "invitee@example.gc.ca"
        assert created_payload.role == RP_USER_EDIT_ROLE
        assert result["acceptance_url"] == f"{settings.RP_APPLICATION_INVITE_URL_BASE}/fresh-token-value"

    @pytest.mark.asyncio
    async def test_has_pending_invitation_for_email_returns_true_for_active_match(self, mock_db) -> None:
        service = RPApplicationDeveloperInvitationService()
        invitation = _invitation_record(workspace_id=17, rp_application_id=29)

        with patch(
            "src.app.services.rp_application_developer_invitation_service.crud_rp_application_developer_invitations"
        ) as mock_invitations:
            mock_invitations.get_multi = AsyncMock(return_value={"data": [invitation]})

            result = await service.has_pending_invitation_for_email(
                db=mock_db,
                invited_email="Invitee@Example.GC.CA",
            )

        assert result is True

    @pytest.mark.asyncio
    async def test_accept_invitation_creates_access_grant_and_marks_invitation_accepted(self, mock_db) -> None:
        service = RPApplicationDeveloperInvitationService()
        invitation = _invitation_record(workspace_id=17, rp_application_id=29)
        created_grant = _access_grant_record(workspace_id=17, user_id=51)

        with patch(
            "src.app.services.rp_application_developer_invitation_service.crud_rp_application_developer_invitations"
        ) as mock_invitations, patch(
            "src.app.services.rp_application_developer_invitation_service.crud_rp_application_access_grants"
        ) as mock_access_grants:
            mock_invitations.get = AsyncMock(return_value=invitation)
            mock_invitations.update = AsyncMock(return_value=None)
            mock_access_grants.get = AsyncMock(return_value=None)
            mock_access_grants.create = AsyncMock(return_value=created_grant)

            result = await service.accept_developer_invitation(
                db=mock_db,
                token="token-to-accept",
                current_user={"id": 51, "email": "invitee@example.gc.ca"},
            )

        created_payload = mock_access_grants.create.call_args.kwargs["object"]
        invitation_update = mock_invitations.update.call_args.kwargs["object"]
        assert created_payload.workspace_id == 17
        assert created_payload.user_id == 51
        assert created_payload.role == READ_ONLY_ROLE
        assert result["invitation"]["status"] == ACCEPTED_INVITATION_STATUS
        assert result["access_grant"]["workspace_id"] == 17
        assert invitation_update["status"] == ACCEPTED_INVITATION_STATUS

    @pytest.mark.asyncio
    async def test_accept_invitation_reuses_existing_access_grant_for_repeat_accept(self, mock_db) -> None:
        service = RPApplicationDeveloperInvitationService()
        invitation = _invitation_record(
            workspace_id=17,
            rp_application_id=29,
            status=ACCEPTED_INVITATION_STATUS,
        )
        existing_grant = _access_grant_record(workspace_id=17, user_id=51)
        existing_grant["source_invitation_uuid"] = invitation["uuid"]

        with patch(
            "src.app.services.rp_application_developer_invitation_service.crud_rp_application_developer_invitations"
        ) as mock_invitations, patch(
            "src.app.services.rp_application_developer_invitation_service.crud_rp_application_access_grants"
        ) as mock_access_grants:
            mock_invitations.get = AsyncMock(return_value=invitation)
            mock_invitations.update = AsyncMock(return_value=None)
            mock_access_grants.get = AsyncMock(return_value=existing_grant)
            mock_access_grants.create = AsyncMock(return_value=None)
            mock_access_grants.update = AsyncMock(return_value=None)

            result = await service.accept_developer_invitation(
                db=mock_db,
                token="token-to-accept",
                current_user={"id": 51, "email": "invitee@example.gc.ca"},
            )

        assert result["invitation"]["status"] == ACCEPTED_INVITATION_STATUS
        mock_access_grants.create.assert_not_awaited()
        mock_invitations.update.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_accept_invitation_rejects_unknown_token(self, mock_db) -> None:
        service = RPApplicationDeveloperInvitationService()

        with patch(
            "src.app.services.rp_application_developer_invitation_service.crud_rp_application_developer_invitations"
        ) as mock_invitations:
            mock_invitations.get = AsyncMock(return_value=None)

            with pytest.raises(NotFoundException, match="Developer invitation not found"):
                await service.accept_developer_invitation(
                    db=mock_db,
                    token="missing-token",
                    current_user={"id": 51, "email": "invitee@example.gc.ca"},
                )

    @pytest.mark.asyncio
    async def test_accept_invitation_rejects_expired_invitation(self, mock_db) -> None:
        service = RPApplicationDeveloperInvitationService()
        expired_invitation = _invitation_record(
            workspace_id=17,
            rp_application_id=29,
            invite_expires_at=datetime.now(UTC) - timedelta(minutes=1),
        )

        with patch(
            "src.app.services.rp_application_developer_invitation_service.crud_rp_application_developer_invitations"
        ) as mock_invitations:
            mock_invitations.get = AsyncMock(return_value=expired_invitation)
            mock_invitations.update = AsyncMock(return_value=None)

            with pytest.raises(BadRequestException, match="Developer invitation is expired"):
                await service.accept_developer_invitation(
                    db=mock_db,
                    token="expired-token",
                    current_user={"id": 51, "email": "invitee@example.gc.ca"},
                )

    @pytest.mark.asyncio
    async def test_accept_invitation_rejects_revoked_invitation(self, mock_db) -> None:
        service = RPApplicationDeveloperInvitationService()
        revoked_invitation = _invitation_record(
            workspace_id=17,
            rp_application_id=29,
            status=REVOKED_INVITATION_STATUS,
        )

        with patch(
            "src.app.services.rp_application_developer_invitation_service.crud_rp_application_developer_invitations"
        ) as mock_invitations:
            mock_invitations.get = AsyncMock(return_value=revoked_invitation)

            with pytest.raises(BadRequestException, match="Developer invitation is revoked"):
                await service.accept_developer_invitation(
                    db=mock_db,
                    token="revoked-token",
                    current_user={"id": 51, "email": "invitee@example.gc.ca"},
                )

    @pytest.mark.asyncio
    async def test_accept_invitation_rejects_email_mismatch(self, mock_db) -> None:
        service = RPApplicationDeveloperInvitationService()
        invitation = _invitation_record(workspace_id=17, rp_application_id=29)

        with patch(
            "src.app.services.rp_application_developer_invitation_service.crud_rp_application_developer_invitations"
        ) as mock_invitations:
            mock_invitations.get = AsyncMock(return_value=invitation)

            with pytest.raises(ForbiddenException, match="Signed-in email does not match this invitation"):
                await service.accept_developer_invitation(
                    db=mock_db,
                    token="token-to-accept",
                    current_user={"id": 51, "email": "other@example.gc.ca"},
                )
