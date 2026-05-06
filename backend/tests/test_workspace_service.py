from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, Mock, patch

import pytest

from src.app.core.exceptions.http_exceptions import BadRequestException, ForbiddenException, NotFoundException
from src.app.schemas.workspace import (
    RPApplicationClientRotatedSecretCreateRequest,
    RPApplicationClientSecretRotateRequest,
    RPApplicationCreate,
    RPApplicationDeveloperInvitationCreate,
    RPApplicationUpdate,
    WorkspaceCreate,
)
from src.app.services.workspace_service import WorkspaceService


class TestWorkspaceService:
    def test_extract_ibm_application_id_from_links_href(self) -> None:
        service = WorkspaceService()

        application_id = service._extract_ibm_application_id(
            {
                "_links": {
                    "self": {
                        "href": "/appaccess/v1.0/applications/5759026966126103430",
                        "title": "[NRCan] - test",
                        "reconciliationId": "",
                    }
                }
            }
        )

        assert application_id == "5759026966126103430"

    @pytest.mark.asyncio
    async def test_create_workspace_requires_department_and_enabled(self, mock_db) -> None:
        service = WorkspaceService()
        values = WorkspaceCreate(name="Test WS", slug=None, description=None)

        # no department
        with pytest.raises(ForbiddenException):
            await service.create_workspace(db=mock_db, current_user={"id": 1, "enabled": True}, values=values)

        # not enabled
        with pytest.raises(ForbiddenException):
            await service.create_workspace(db=mock_db, current_user={"id": 1, "department_id": 2, "enabled": False}, values=values)

    @pytest.mark.asyncio
    async def test_create_workspace_creates_and_adds_admin(self, mock_db) -> None:
        service = WorkspaceService()
        values = WorkspaceCreate(name="My Cozy WS", slug=None, description="desc")

        current_user = {"id": 10, "department_id": 5, "enabled": True}

        with patch("src.app.services.workspace_service.crud_workspaces") as mock_workspaces:
            mock_workspaces.create = AsyncMock(return_value={"id": 99, "name": values.name, "slug": "my-cozy-ws", "department_id": 5})

            with patch("src.app.services.workspace_service.crud_workspace_members") as mock_members:
                mock_members.create = AsyncMock(return_value={"id": 1, "workspace_id": 99, "user_id": 10, "role": "workspace_admin"})

                created = await service.create_workspace(db=mock_db, current_user=current_user, values=values)

        assert created["id"] == 99
        mock_workspaces.create.assert_awaited_once()
        mock_members.create.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_add_member_requires_admin(self, mock_db) -> None:
        service = WorkspaceService()
        workspace_uuid = "018f6f83-0000-0000-0000-000000000001"
        target_user_uuid = "018f6f83-0000-0000-0000-000000000002"

        # workspace exists
        with patch("src.app.services.workspace_service.crud_workspaces") as mock_workspaces:
            mock_workspaces.get = AsyncMock(return_value={"id": 20, "department_id": 5})

            # caller not a member/admin
            with patch("src.app.services.workspace_service.crud_workspace_members") as mock_members:
                mock_members.get = AsyncMock(return_value=None)

                with pytest.raises(ForbiddenException):
                    await service.add_member(
                        db=mock_db,
                        workspace_uuid=workspace_uuid,
                        target_user_uuid=target_user_uuid,
                        role="member",
                        current_user={"id": 2},
                    )

    @pytest.mark.asyncio
    async def test_add_member_checks_target_user_and_department(self, mock_db) -> None:
        service = WorkspaceService()
        workspace_uuid = "018f6f83-0000-0000-0000-000000000003"
        target_user_uuid = "018f6f83-0000-0000-0000-000000000004"

        # setup workspace and caller admin
        with patch("src.app.services.workspace_service.crud_workspaces") as mock_workspaces:
            mock_workspaces.get = AsyncMock(return_value={"id": 30, "department_id": 7})

            with patch("src.app.services.workspace_service.crud_workspace_members") as mock_members:
                # return a caller membership for all calls in this test
                mock_members.get = AsyncMock(return_value={"id": 2, "workspace_id": 30, "user_id": 1, "role": "workspace_admin"})

                with patch("src.app.services.workspace_service.crud_users") as mock_users:
                    # target user missing
                    mock_users.get = AsyncMock(return_value=None)
                    with pytest.raises(NotFoundException):
                        await service.add_member(
                            db=mock_db,
                            workspace_uuid=workspace_uuid,
                            target_user_uuid=target_user_uuid,
                            role="member",
                            current_user={"id": 1},
                        )

    @pytest.mark.asyncio
    async def test_remove_member_cannot_remove_last_admin(self, mock_db) -> None:
        service = WorkspaceService()
        workspace_uuid = "018f6f83-0000-0000-0000-000000000005"
        target_user_uuid = "018f6f83-0000-0000-0000-000000000006"

        with patch("src.app.services.workspace_service.crud_workspaces") as mock_workspaces:
            mock_workspaces.get = AsyncMock(return_value={"id": 40, "department_id": 9})

            with patch("src.app.services.workspace_service.crud_workspace_members") as mock_members:
                # caller is admin then target membership (return sequentially, but safe if called more than twice)
                seq = [
                    {"id": 3, "workspace_id": 40, "user_id": 1, "role": "workspace_admin"},
                    {"id": 4, "workspace_id": 40, "user_id": 2, "role": "workspace_admin"},
                ]

                def _members_get_side_effect(*a, **k):
                    # return next item in seq, but if exhausted return the last item
                    if len(seq) > 1:
                        return seq.pop(0)
                    return seq[0]

                mock_members.get = AsyncMock(side_effect=_members_get_side_effect)
                # admins listing returns single admin total -> cannot remove
                mock_members.get_multi = AsyncMock(return_value={"total": 1, "items": [{"id": 3, "role": "workspace_admin"}]})

                with patch("src.app.services.workspace_service.crud_users") as mock_users:
                    mock_users.get = AsyncMock(return_value={"id": 2, "department_id": 9})

                    with pytest.raises(ForbiddenException):
                        await service.remove_member(
                            db=mock_db,
                            workspace_uuid=workspace_uuid,
                            target_user_uuid=target_user_uuid,
                            current_user={"id": 1},
                        )

    @pytest.mark.asyncio
    async def test_create_rp_application_calls_ibm_before_local_create(self, mock_db) -> None:
        mock_ibm_service = Mock()
        mock_ibm_service.create_application = AsyncMock(return_value={"id": "ibm-app-123"})

        service = WorkspaceService(ibm_sv_admin_service=mock_ibm_service)
        values = RPApplicationCreate(
            name="Application One",
            description="Example application",
            application_url="https://example.gc.ca",
            redirect_uris=["https://example.gc.ca/callback"],
            client_type="confidential",
            client_auth_method="client_secret_basic",
            pkce_enabled=False,
        )

        with patch("src.app.services.workspace_service.crud_workspaces") as mock_workspaces:
            mock_workspaces.get = AsyncMock(return_value={"id": 42, "department_id": 7})

            with patch("src.app.services.workspace_service.crud_workspace_members") as mock_members:
                mock_members.get = AsyncMock(return_value={"id": 2, "workspace_id": 42, "user_id": 10, "role": "workspace_admin"})

                with patch("src.app.services.workspace_service.crud_departments") as mock_departments:
                    mock_departments.get = AsyncMock(return_value={"id": 7, "abbreviation": "TBS"})

                    with patch("src.app.services.workspace_service.crud_rp_applications") as mock_rp_applications:
                        async def create_side_effect(*args, **kwargs):
                            assert mock_ibm_service.create_application.await_count == 1
                            created_object = kwargs["object"]
                            assert created_object.ibm_sv_application_id == "ibm-app-123"
                            assert created_object.name == "[TBS] - Application One"
                            assert not hasattr(created_object, "settings")
                            return {
                                "id": 3,
                                "workspace_id": 42,
                                "name": "[TBS] - Application One",
                                "ibm_sv_application_id": "ibm-app-123",
                            }

                        mock_rp_applications.create = AsyncMock(side_effect=create_side_effect)

                        created = await service.create_rp_application(
                            db=mock_db,
                            workspace_uuid="018f6f83-0000-0000-0000-000000000010",
                            values=values,
                            current_user={"id": 10},
                        )

        assert created["ibm_sv_application_id"] == "ibm-app-123"
        mock_ibm_service.create_application.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_invite_rp_application_developer_creates_invitation_and_sends_notify(self, mock_db) -> None:
        mock_notify_service = Mock()
        mock_notify_service.send_email = AsyncMock(return_value={"id": "notify-123"})
        service = WorkspaceService(gc_notify_service=mock_notify_service)
        values = RPApplicationDeveloperInvitationCreate(email="developer@example.com")

        with patch("src.app.services.workspace_service.crud_workspaces") as mock_workspaces:
            mock_workspaces.get = AsyncMock(return_value={"id": 42, "department_id": 7})

            with patch("src.app.services.workspace_service.crud_workspace_members") as mock_members:
                mock_members.get = AsyncMock(
                    return_value={"id": 2, "workspace_id": 42, "user_id": 10, "role": "workspace_admin"}
                )

                with patch("src.app.services.workspace_service.crud_rp_applications") as mock_rp_applications:
                    mock_rp_applications.get = AsyncMock(
                        return_value={"id": 9, "workspace_id": 42, "uuid": "018f6f83-0000-0000-0000-000000000099", "name": "Example App"}
                    )

                    with patch(
                        "src.app.services.workspace_service.crud_rp_application_developer_invitations"
                    ) as mock_invitations:
                        mock_invitations.create = AsyncMock(
                            return_value={
                                "id": 4,
                                "uuid": "018f6f83-0000-0000-0000-000000000111",
                                "workspace_id": 42,
                                "rp_application_id": 9,
                                "invited_email": "developer@example.com",
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
                        )

                        created = await service.invite_rp_application_developer(
                            db=mock_db,
                            workspace_uuid="018f6f83-0000-0000-0000-000000000001",
                            rp_application_uuid="018f6f83-0000-0000-0000-000000000099",
                            values=values,
                            current_user={"id": 10, "email": "admin@example.com", "name": "Admin User"},
                        )

        assert created["invited_email"] == "developer@example.com"
        mock_invitations.create.assert_awaited_once()
        mock_notify_service.send_email.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_accept_rp_application_developer_invitation_marks_invitation_accepted_for_current_user(
        self, mock_db
    ) -> None:
        service = WorkspaceService()

        with patch(
            "src.app.services.workspace_service.crud_rp_application_developer_invitations"
        ) as mock_invitations:
            mock_invitations.get = AsyncMock(
                return_value={
                    "id": 4,
                    "uuid": "018f6f83-0000-0000-0000-000000000111",
                    "workspace_id": 42,
                    "rp_application_id": 9,
                    "invited_email": "developer@example.com",
                    "role": "developer",
                    "invite_expires_at": datetime.now(UTC) + timedelta(days=7),
                    "accepted_at": None,
                    "revoked_at": None,
                    "created_at": datetime.now(UTC),
                    "updated_at": None,
                    "deleted_at": None,
                    "is_deleted": False,
                }
            )
            mock_invitations.update = AsyncMock(
                return_value={
                    "id": 4,
                    "uuid": "018f6f83-0000-0000-0000-000000000111",
                    "workspace_id": 42,
                    "rp_application_id": 9,
                    "invited_email": "developer@example.com",
                    "role": "developer",
                    "invite_expires_at": datetime.now(UTC) + timedelta(days=7),
                    "accepted_at": datetime.now(UTC),
                    "revoked_at": None,
                    "created_at": datetime.now(UTC),
                    "updated_at": datetime.now(UTC),
                    "deleted_at": None,
                    "is_deleted": False,
                }
            )

            accepted = await service.accept_rp_application_developer_invitation(
                db=mock_db,
                token="raw-invite-token",
                current_user={"id": 10, "email": "developer@example.com"},
            )

        assert accepted["accepted_at"] is not None
        mock_invitations.update.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_list_rp_application_developer_invitations_returns_statuses(self, mock_db) -> None:
        service = WorkspaceService()

        with patch("src.app.services.workspace_service.crud_workspaces") as mock_workspaces:
            mock_workspaces.get = AsyncMock(return_value={"id": 42, "department_id": 7})

            with patch("src.app.services.workspace_service.crud_workspace_members") as mock_members:
                mock_members.get = AsyncMock(
                    return_value={"id": 2, "workspace_id": 42, "user_id": 10, "role": "workspace_admin"}
                )

                with patch("src.app.services.workspace_service.crud_rp_applications") as mock_rp_applications:
                    mock_rp_applications.get = AsyncMock(
                        return_value={"id": 9, "workspace_id": 42, "uuid": "018f6f83-0000-0000-0000-000000000099"}
                    )

                    with patch(
                        "src.app.services.workspace_service.crud_rp_application_developer_invitations"
                    ) as mock_invitations:
                        mock_invitations.get_multi = AsyncMock(
                            return_value={
                                "data": [
                                    {
                                        "id": 4,
                                        "uuid": "018f6f83-0000-0000-0000-000000000111",
                                        "workspace_id": 42,
                                        "rp_application_id": 9,
                                        "invited_email": "accepted@example.com",
                                        "role": "developer",
                                        "invite_expires_at": datetime.now(UTC) + timedelta(days=7),
                                        "accepted_at": datetime.now(UTC),
                                        "revoked_at": None,
                                        "created_at": datetime(2026, 4, 1, tzinfo=UTC),
                                        "updated_at": None,
                                        "deleted_at": None,
                                        "is_deleted": False,
                                    },
                                    {
                                        "id": 5,
                                        "uuid": "018f6f83-0000-0000-0000-000000000112",
                                        "workspace_id": 42,
                                        "rp_application_id": 9,
                                        "invited_email": "expired@example.com",
                                        "role": "developer",
                                        "invite_expires_at": datetime.now(UTC) - timedelta(days=1),
                                        "accepted_at": None,
                                        "revoked_at": None,
                                        "created_at": datetime(2026, 4, 2, tzinfo=UTC),
                                        "updated_at": None,
                                        "deleted_at": None,
                                        "is_deleted": False,
                                    },
                                ]
                            }
                        )

                        invitations = await service.list_rp_application_developer_invitations(
                            db=mock_db,
                            workspace_uuid="018f6f83-0000-0000-0000-000000000001",
                            rp_application_uuid="018f6f83-0000-0000-0000-000000000099",
                            current_user={"id": 10},
                        )

        assert [invitation["status"] for invitation in invitations] == ["expired", "accepted"]

    @pytest.mark.asyncio
    async def test_revoke_rp_application_developer_invitation_marks_invitation_revoked(self, mock_db) -> None:
        service = WorkspaceService()

        with patch("src.app.services.workspace_service.crud_workspaces") as mock_workspaces:
            mock_workspaces.get = AsyncMock(return_value={"id": 42, "department_id": 7})

            with patch("src.app.services.workspace_service.crud_workspace_members") as mock_members:
                mock_members.get = AsyncMock(
                    return_value={"id": 2, "workspace_id": 42, "user_id": 10, "role": "workspace_admin"}
                )

                with patch("src.app.services.workspace_service.crud_rp_applications") as mock_rp_applications:
                    mock_rp_applications.get = AsyncMock(
                        return_value={"id": 9, "workspace_id": 42, "uuid": "018f6f83-0000-0000-0000-000000000099"}
                    )

                    with patch(
                        "src.app.services.workspace_service.crud_rp_application_developer_invitations"
                    ) as mock_invitations:
                        mock_invitations.get = AsyncMock(
                            return_value={
                                "id": 4,
                                "uuid": "018f6f83-0000-0000-0000-000000000111",
                                "workspace_id": 42,
                                "rp_application_id": 9,
                                "invited_email": "developer@example.com",
                                "role": "developer",
                                "invite_expires_at": datetime.now(UTC) + timedelta(days=7),
                                "accepted_at": None,
                                "revoked_at": None,
                                "created_at": datetime.now(UTC),
                                "updated_at": None,
                                "deleted_at": None,
                                "is_deleted": False,
                            }
                        )
                        mock_invitations.update = AsyncMock(
                            return_value={
                                "id": 4,
                                "uuid": "018f6f83-0000-0000-0000-000000000111",
                                "workspace_id": 42,
                                "rp_application_id": 9,
                                "invited_email": "developer@example.com",
                                "role": "developer",
                                "invite_expires_at": datetime.now(UTC) + timedelta(days=7),
                                "accepted_at": None,
                                "revoked_at": datetime.now(UTC),
                                "created_at": datetime.now(UTC),
                                "updated_at": datetime.now(UTC),
                                "deleted_at": None,
                                "is_deleted": False,
                            }
                        )

                        revoked = await service.revoke_rp_application_developer_invitation(
                            db=mock_db,
                            workspace_uuid="018f6f83-0000-0000-0000-000000000001",
                            rp_application_uuid="018f6f83-0000-0000-0000-000000000099",
                            invitation_uuid="018f6f83-0000-0000-0000-000000000111",
                            current_user={"id": 10},
                        )

        assert revoked["status"] == "revoked"
        mock_invitations.update.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_resend_rp_application_developer_invitation_revokes_old_and_creates_new(self, mock_db) -> None:
        mock_notify_service = Mock()
        mock_notify_service.send_email = AsyncMock(return_value={"id": "notify-456"})
        service = WorkspaceService(gc_notify_service=mock_notify_service)

        with patch("src.app.services.workspace_service.crud_workspaces") as mock_workspaces:
            mock_workspaces.get = AsyncMock(return_value={"id": 42, "department_id": 7})

            with patch("src.app.services.workspace_service.crud_workspace_members") as mock_members:
                mock_members.get = AsyncMock(
                    return_value={"id": 2, "workspace_id": 42, "user_id": 10, "role": "workspace_admin"}
                )

                with patch("src.app.services.workspace_service.crud_rp_applications") as mock_rp_applications:
                    mock_rp_applications.get = AsyncMock(
                        return_value={
                            "id": 9,
                            "workspace_id": 42,
                            "uuid": "018f6f83-0000-0000-0000-000000000099",
                            "name": "Example App",
                        }
                    )

                    with patch(
                        "src.app.services.workspace_service.crud_rp_application_developer_invitations"
                    ) as mock_invitations:
                        mock_invitations.get = AsyncMock(
                            return_value={
                                "id": 4,
                                "uuid": "018f6f83-0000-0000-0000-000000000111",
                                "workspace_id": 42,
                                "rp_application_id": 9,
                                "invited_email": "developer@example.com",
                                "role": "developer",
                                "invite_expires_at": datetime.now(UTC) - timedelta(days=1),
                                "accepted_at": None,
                                "revoked_at": None,
                                "created_at": datetime.now(UTC),
                                "updated_at": None,
                                "deleted_at": None,
                                "is_deleted": False,
                            }
                        )
                        mock_invitations.get_multi = AsyncMock(
                            return_value={
                                "data": [
                                    {
                                        "id": 4,
                                        "uuid": "018f6f83-0000-0000-0000-000000000111",
                                        "workspace_id": 42,
                                        "rp_application_id": 9,
                                        "invited_email": "developer@example.com",
                                        "role": "developer",
                                        "invite_expires_at": datetime.now(UTC) - timedelta(days=1),
                                        "accepted_at": None,
                                        "revoked_at": None,
                                        "created_at": datetime.now(UTC),
                                        "updated_at": None,
                                        "deleted_at": None,
                                        "is_deleted": False,
                                    }
                                ]
                            }
                        )
                        mock_invitations.update = AsyncMock(return_value=None)
                        mock_invitations.create = AsyncMock(
                            return_value={
                                "id": 5,
                                "uuid": "018f6f83-0000-0000-0000-000000000112",
                                "workspace_id": 42,
                                "rp_application_id": 9,
                                "invited_email": "developer@example.com",
                                "role": "developer",
                                "invite_expires_at": datetime.now(UTC) + timedelta(days=7),
                                "accepted_at": None,
                                "revoked_at": None,
                                "gc_notify_notification_id": "notify-456",
                                "created_at": datetime.now(UTC),
                                "updated_at": None,
                                "deleted_at": None,
                                "is_deleted": False,
                            }
                        )

                        resent = await service.resend_rp_application_developer_invitation(
                            db=mock_db,
                            workspace_uuid="018f6f83-0000-0000-0000-000000000001",
                            rp_application_uuid="018f6f83-0000-0000-0000-000000000099",
                            invitation_uuid="018f6f83-0000-0000-0000-000000000111",
                            current_user={"id": 10, "email": "admin@example.com", "name": "Admin User"},
                        )

        assert resent["status"] == "pending"
        mock_invitations.update.assert_awaited_once()
        mock_invitations.create.assert_awaited_once()
        mock_notify_service.send_email.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_create_rp_application_adds_creator_auth_subject_to_owners(self, mock_db) -> None:
        mock_ibm_service = Mock()
        mock_ibm_service.build_application_creation_payload = Mock(
            return_value={
                "name": "[TBS] - Application One",
                "templateId": "998",
                "owners": ["ibm|creator-subject"],
            }
        )
        mock_ibm_service.create_application = AsyncMock(return_value={"id": "ibm-app-123"})

        service = WorkspaceService(ibm_sv_admin_service=mock_ibm_service)
        values = RPApplicationCreate(
            name="Application One",
            description="Example application",
            application_url="https://example.gc.ca",
            redirect_uris=["https://example.gc.ca/callback"],
        )

        with patch("src.app.services.workspace_service.crud_workspaces") as mock_workspaces:
            mock_workspaces.get = AsyncMock(return_value={"id": 42, "department_id": 7})

            with patch("src.app.services.workspace_service.crud_workspace_members") as mock_members:
                mock_members.get = AsyncMock(return_value={"id": 2, "workspace_id": 42, "user_id": 10, "role": "workspace_admin"})

                with patch("src.app.services.workspace_service.crud_departments") as mock_departments:
                    mock_departments.get = AsyncMock(return_value={"id": 7, "abbreviation": "TBS"})

                    with patch("src.app.services.workspace_service.crud_rp_applications") as mock_rp_applications:
                        mock_rp_applications.create = AsyncMock(
                            return_value={
                                "id": 3,
                                "workspace_id": 42,
                                "name": "[TBS] - Application One",
                                "ibm_sv_application_id": "ibm-app-123",
                            }
                        )

                        await service.create_rp_application(
                            db=mock_db,
                            workspace_uuid="018f6f83-0000-0000-0000-000000000010",
                            values=values,
                            current_user={"id": 10, "auth_subject": "ibm|creator-subject"},
                        )

        mock_ibm_service.build_application_creation_payload.assert_called_once()
        _, owners = mock_ibm_service.build_application_creation_payload.call_args.args
        assert owners == ["ibm|creator-subject"]

    @pytest.mark.asyncio
    async def test_create_rp_application_rolls_back_ibm_on_local_failure(self, mock_db) -> None:
        mock_ibm_service = Mock()
        mock_ibm_service.create_application = AsyncMock(return_value={"id": "ibm-app-123"})
        mock_ibm_service.delete_application = AsyncMock()

        service = WorkspaceService(ibm_sv_admin_service=mock_ibm_service)
        values = RPApplicationCreate(
            name="Application One",
            description="Example application",
            application_url="https://example.gc.ca",
            redirect_uris=["https://example.gc.ca/callback"],
            client_type="confidential",
            client_auth_method="client_secret_basic",
        )

        with patch("src.app.services.workspace_service.crud_workspaces") as mock_workspaces:
            mock_workspaces.get = AsyncMock(return_value={"id": 42, "department_id": 7})

            with patch("src.app.services.workspace_service.crud_workspace_members") as mock_members:
                mock_members.get = AsyncMock(return_value={"id": 2, "workspace_id": 42, "user_id": 10, "role": "workspace_admin"})

                with patch("src.app.services.workspace_service.crud_departments") as mock_departments:
                    mock_departments.get = AsyncMock(return_value={"id": 7, "abbreviation": "TBS"})

                    with patch("src.app.services.workspace_service.crud_rp_applications") as mock_rp_applications:
                        mock_rp_applications.create = AsyncMock(side_effect=RuntimeError("db write failed"))

                        with pytest.raises(RuntimeError, match="db write failed"):
                            await service.create_rp_application(
                                db=mock_db,
                                workspace_uuid="018f6f83-0000-0000-0000-000000000010",
                                values=values,
                                current_user={"id": 10},
                            )

        mock_ibm_service.delete_application.assert_awaited_once_with("ibm-app-123")

    @pytest.mark.asyncio
    async def test_create_rp_application_links_application_info_when_uuid_is_provided(self, mock_db) -> None:
        mock_ibm_service = Mock()
        mock_ibm_service.create_application = AsyncMock(return_value={"id": "ibm-app-123"})

        service = WorkspaceService(ibm_sv_admin_service=mock_ibm_service)
        values = RPApplicationCreate(
            name="Application One",
            application_info_uuid="018f6f83-0000-0000-0000-000000000211",
        )

        with patch("src.app.services.workspace_service.crud_workspaces") as mock_workspaces:
            mock_workspaces.get = AsyncMock(return_value={"id": 42, "department_id": 7})

            with patch("src.app.services.workspace_service.crud_workspace_members") as mock_members:
                mock_members.get = AsyncMock(
                    return_value={"id": 2, "workspace_id": 42, "user_id": 10, "role": "workspace_admin"}
                )

                with patch("src.app.services.workspace_service.crud_departments") as mock_departments:
                    mock_departments.get = AsyncMock(return_value={"id": 7, "abbreviation": "TBS"})

                    with patch("src.app.services.workspace_service.crud_application_infos") as mock_application_infos:
                        mock_application_infos.get = AsyncMock(
                            return_value={
                                "id": 9,
                                "workspace_id": 42,
                                "uuid": "018f6f83-0000-0000-0000-000000000211",
                                "application_name": "Benefits Portal",
                            }
                        )

                        with patch("src.app.services.workspace_service.crud_rp_applications") as mock_rp_applications:
                            mock_rp_applications.get = AsyncMock(return_value=None)

                            async def create_side_effect(*args, **kwargs):
                                created_object = kwargs["object"]
                                assert created_object.application_info_id == 9
                                return {
                                    "id": 3,
                                    "workspace_id": 42,
                                    "name": "[TBS] - Application One",
                                    "application_info_id": 9,
                                    "ibm_sv_application_id": "ibm-app-123",
                                }

                            mock_rp_applications.create = AsyncMock(side_effect=create_side_effect)

                            created = await service.create_rp_application(
                                db=mock_db,
                                workspace_uuid="018f6f83-0000-0000-0000-000000000010",
                                values=values,
                                current_user={"id": 10},
                            )

        assert created["application_info_id"] == 9

    @pytest.mark.asyncio
    async def test_create_rp_application_revives_soft_deleted_linked_record(self, mock_db) -> None:
        mock_ibm_service = Mock()
        mock_ibm_service.create_application = AsyncMock(return_value={"id": "ibm-app-456"})

        service = WorkspaceService(ibm_sv_admin_service=mock_ibm_service)
        values = RPApplicationCreate(
            name="Application One",
            application_info_uuid="018f6f83-0000-0000-0000-000000000211",
        )

        with patch("src.app.services.workspace_service.crud_workspaces") as mock_workspaces:
            mock_workspaces.get = AsyncMock(return_value={"id": 42, "department_id": 7})

            with patch("src.app.services.workspace_service.crud_workspace_members") as mock_members:
                mock_members.get = AsyncMock(
                    return_value={"id": 2, "workspace_id": 42, "user_id": 10, "role": "workspace_admin"}
                )

                with patch("src.app.services.workspace_service.crud_departments") as mock_departments:
                    mock_departments.get = AsyncMock(return_value={"id": 7, "abbreviation": "TBS"})

                    with patch("src.app.services.workspace_service.crud_application_infos") as mock_application_infos:
                        mock_application_infos.get = AsyncMock(
                            return_value={
                                "id": 9,
                                "workspace_id": 42,
                                "uuid": "018f6f83-0000-0000-0000-000000000211",
                                "application_name": "Benefits Portal",
                            }
                        )

                        with patch("src.app.services.workspace_service.crud_rp_applications") as mock_rp_applications:
                            mock_rp_applications.get = AsyncMock(
                                side_effect=[
                                    None,
                                    {
                                        "id": 3,
                                        "uuid": "018f6f83-0000-0000-0000-000000000333",
                                        "workspace_id": 42,
                                        "application_info_id": 9,
                                        "is_deleted": True,
                                        "deleted_at": datetime.now(UTC),
                                        "ibm_sv_application_id": "old-ibm-app-123",
                                        "name": "[TBS] - Old Application",
                                        "status": "draft",
                                    },
                                ]
                            )

                            async def update_side_effect(*args, **kwargs):
                                assert kwargs["id"] == 3
                                updated_object = kwargs["object"]
                                assert updated_object["application_info_id"] == 9
                                assert updated_object["ibm_sv_application_id"] == "ibm-app-456"
                                assert updated_object["is_deleted"] is False
                                assert updated_object["deleted_at"] is None
                                return {
                                    "id": 3,
                                    "uuid": "018f6f83-0000-0000-0000-000000000333",
                                    "workspace_id": 42,
                                    "application_info_id": 9,
                                    "name": "[TBS] - Application One",
                                    "ibm_sv_application_id": "ibm-app-456",
                                    "is_deleted": False,
                                }

                            mock_rp_applications.update = AsyncMock(side_effect=update_side_effect)
                            mock_rp_applications.create = AsyncMock()

                            created = await service.create_rp_application(
                                db=mock_db,
                                workspace_uuid="018f6f83-0000-0000-0000-000000000010",
                                values=values,
                                current_user={"id": 10},
                            )

        assert created["id"] == 3
        assert created["application_info_id"] == 9
        mock_rp_applications.create.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_create_rp_application_refetches_revived_record_when_update_returns_none(self, mock_db) -> None:
        mock_ibm_service = Mock()
        mock_ibm_service.create_application = AsyncMock(return_value={"id": "ibm-app-456"})

        service = WorkspaceService(ibm_sv_admin_service=mock_ibm_service)
        values = RPApplicationCreate(
            name="Application One",
            application_info_uuid="018f6f83-0000-0000-0000-000000000211",
        )

        with patch("src.app.services.workspace_service.crud_workspaces") as mock_workspaces:
            mock_workspaces.get = AsyncMock(return_value={"id": 42, "department_id": 7})

            with patch("src.app.services.workspace_service.crud_workspace_members") as mock_members:
                mock_members.get = AsyncMock(
                    return_value={"id": 2, "workspace_id": 42, "user_id": 10, "role": "workspace_admin"}
                )

                with patch("src.app.services.workspace_service.crud_departments") as mock_departments:
                    mock_departments.get = AsyncMock(return_value={"id": 7, "abbreviation": "TBS"})

                    with patch("src.app.services.workspace_service.crud_application_infos") as mock_application_infos:
                        mock_application_infos.get = AsyncMock(
                            return_value={
                                "id": 9,
                                "workspace_id": 42,
                                "uuid": "018f6f83-0000-0000-0000-000000000211",
                                "application_name": "Benefits Portal",
                            }
                        )

                        with patch("src.app.services.workspace_service.crud_rp_applications") as mock_rp_applications:
                            mock_rp_applications.get = AsyncMock(
                                side_effect=[
                                    None,
                                    {
                                        "id": 3,
                                        "uuid": "018f6f83-0000-0000-0000-000000000333",
                                        "workspace_id": 42,
                                        "application_info_id": 9,
                                        "is_deleted": True,
                                        "deleted_at": datetime.now(UTC),
                                        "ibm_sv_application_id": "old-ibm-app-123",
                                        "name": "[TBS] - Old Application",
                                        "status": "draft",
                                    },
                                    {
                                        "id": 3,
                                        "uuid": "018f6f83-0000-0000-0000-000000000333",
                                        "workspace_id": 42,
                                        "application_info_id": 9,
                                        "name": "[TBS] - Application One",
                                        "ibm_sv_application_id": "ibm-app-456",
                                        "is_deleted": False,
                                    },
                                ]
                            )
                            mock_rp_applications.update = AsyncMock(return_value=None)
                            mock_rp_applications.create = AsyncMock()

                            created = await service.create_rp_application(
                                db=mock_db,
                                workspace_uuid="018f6f83-0000-0000-0000-000000000010",
                                values=values,
                                current_user={"id": 10},
                            )

        assert created["id"] == 3
        assert created["ibm_sv_application_id"] == "ibm-app-456"
        mock_rp_applications.create.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_update_rp_application_updates_ibm_before_local_row(self, mock_db) -> None:
        mock_ibm_service = Mock()
        mock_ibm_service.get_application_detail = AsyncMock(return_value={"id": "ibm-app-123", "name": "[TBS] - Application One"})
        mock_ibm_service.build_application_update_payload = AsyncMock(return_value={"name": "[TBS] - Renamed App"})
        mock_ibm_service.update_application = AsyncMock(return_value=True)

        service = WorkspaceService(ibm_sv_admin_service=mock_ibm_service)
        values = RPApplicationUpdate(name="Renamed App", redirect_uris=["https://example.gc.ca/updated-callback"])

        with patch("src.app.services.workspace_service.crud_workspaces") as mock_workspaces:
            mock_workspaces.get = AsyncMock(return_value={"id": 42, "department_id": 7})

            with patch("src.app.services.workspace_service.crud_workspace_members") as mock_members:
                mock_members.get = AsyncMock(return_value={"id": 2, "workspace_id": 42, "user_id": 10, "role": "workspace_admin"})

                with patch("src.app.services.workspace_service.crud_departments") as mock_departments:
                    mock_departments.get = AsyncMock(return_value={"id": 7, "abbreviation": "TBS"})

                    with patch("src.app.services.workspace_service.crud_rp_applications") as mock_rp_applications:
                        mock_rp_applications.get = AsyncMock(
                            side_effect=[
                                {
                                    "id": 3,
                                    "workspace_id": 42,
                                    "uuid": "018f6f83-0000-0000-0000-000000000099",
                                    "name": "[TBS] - Application One",
                                    "ibm_sv_application_id": "ibm-app-123",
                                },
                                {
                                    "id": 3,
                                    "workspace_id": 42,
                                    "uuid": "018f6f83-0000-0000-0000-000000000099",
                                    "name": "[TBS] - Renamed App",
                                    "ibm_sv_application_id": "ibm-app-123",
                                },
                            ]
                        )

                        async def update_side_effect(*args, **kwargs):
                            assert mock_ibm_service.update_application.await_count == 1
                            updated_object = kwargs["object"]
                            assert isinstance(updated_object, dict)
                            assert "settings" not in updated_object
                            assert updated_object["name"] == "[TBS] - Renamed App"
                            assert updated_object["updated_at"]
                            return True

                        mock_rp_applications.update = AsyncMock(side_effect=update_side_effect)
                        updated = await service.update_rp_application(
                            db=mock_db,
                            workspace_uuid="018f6f83-0000-0000-0000-000000000010",
                            rp_application_uuid="018f6f83-0000-0000-0000-000000000099",
                            values=values,
                            current_user={"id": 10},
                        )

        assert updated["name"] == "[TBS] - Renamed App"
        mock_ibm_service.update_application.assert_awaited_once_with("ibm-app-123", {"name": "[TBS] - Renamed App"})

    @pytest.mark.asyncio
    async def test_list_rp_applications_fetches_settings_from_ibm(self, mock_db) -> None:
        mock_ibm_service = Mock()
        mock_ibm_service.get_application_detail = AsyncMock(
            return_value={
                "description": "Example application",
                "providers": {
                    "oidc": {
                        "applicationUrl": "https://example.gc.ca",
                        "properties": {
                            "additionalConfig": {
                                "clientAuthMethod": "client_secret_basic",
                                "logoutOption": "none",
                            },
                            "doNotGenerateClientSecret": "false",
                            "redirectUris": ["https://example.gc.ca/callback"],
                        },
                        "requirePkceVerification": "false",
                    },
                    "saml": {
                        "properties": {
                            "companyName": "Example Company",
                        }
                    },
                },
            }
        )

        service = WorkspaceService(ibm_sv_admin_service=mock_ibm_service)

        with patch("src.app.services.workspace_service.crud_workspaces") as mock_workspaces:
            mock_workspaces.get = AsyncMock(return_value={"id": 42, "department_id": 7})

            with patch("src.app.services.workspace_service.crud_workspace_members") as mock_members:
                mock_members.get = AsyncMock(
                    return_value={"id": 2, "workspace_id": 42, "user_id": 10, "role": "workspace_viewer"}
                )

                with patch("src.app.services.workspace_service.crud_rp_applications") as mock_rp_applications:
                    mock_rp_applications.get_multi = AsyncMock(
                        return_value={
                            "data": [
                                {
                                    "id": 3,
                                    "workspace_id": 42,
                                    "uuid": "018f6f83-0000-0000-0000-000000000099",
                                    "name": "[TBS] - Application One",
                                    "ibm_sv_application_id": "ibm-app-123",
                                    "status": "draft",
                                }
                            ]
                        }
                    )

                    result = await service.list_rp_applications(
                        db=mock_db,
                        workspace_uuid="018f6f83-0000-0000-0000-000000000010",
                        current_user={"id": 10},
                    )

        assert result[0]["settings"] == {
            "application_url": "https://example.gc.ca",
            "client_auth_method": "client_secret_basic",
            "client_type": "confidential",
            "company_name": "Example Company",
            "description": "Example application",
            "jwks_uri": "",
            "logout_method": "none",
            "logout_uri": "",
            "pkce_enabled": False,
            "post_logout_redirect_uris": [],
            "redirect_uris": ["https://example.gc.ca/callback"],
        }
        mock_ibm_service.get_application_detail.assert_awaited_once_with("ibm-app-123")

    @pytest.mark.asyncio
    async def test_list_rp_applications_requires_workspace_membership(self, mock_db) -> None:
        service = WorkspaceService()

        with patch("src.app.services.workspace_service.crud_workspaces") as mock_workspaces:
            mock_workspaces.get = AsyncMock(return_value={"id": 42, "department_id": 7})

            with patch("src.app.services.workspace_service.crud_workspace_members") as mock_members:
                mock_members.get = AsyncMock(return_value=None)

                with pytest.raises(ForbiddenException, match="Only workspace members"):
                    await service.list_rp_applications(
                        db=mock_db,
                        workspace_uuid="018f6f83-0000-0000-0000-000000000010",
                        current_user={"id": 10},
                    )

    @pytest.mark.asyncio
    async def test_list_application_infos_includes_linked_rp_application_uuid(self, mock_db) -> None:
        service = WorkspaceService()

        with patch("src.app.services.workspace_service.crud_workspaces") as mock_workspaces:
            mock_workspaces.get = AsyncMock(return_value={"id": 42, "department_id": 7})

            with patch("src.app.services.workspace_service.crud_workspace_members") as mock_members:
                mock_members.get = AsyncMock(
                    return_value={"id": 2, "workspace_id": 42, "user_id": 10, "role": "workspace_viewer"}
                )

                with patch("src.app.services.workspace_service.crud_application_infos") as mock_application_infos:
                    mock_application_infos.get_multi = AsyncMock(
                        return_value={
                            "data": [
                                {
                                    "id": 9,
                                    "workspace_id": 42,
                                    "uuid": "application-info-uuid-1",
                                    "application_name": "Benefits Portal",
                                }
                            ]
                        }
                    )

                    with patch("src.app.services.workspace_service.crud_rp_applications") as mock_rp_applications:
                        mock_rp_applications.get = AsyncMock(
                            return_value={
                                "id": 3,
                                "uuid": "rp-application-uuid-1",
                                "application_info_id": 9,
                                "workspace_id": 42,
                            }
                        )

                        result = await service.list_application_infos(
                            db=mock_db,
                            workspace_uuid="018f6f83-0000-0000-0000-000000000010",
                            current_user={"id": 10},
                        )

        assert result == [
            {
                "id": 9,
                "workspace_id": 42,
                "uuid": "application-info-uuid-1",
                "application_name": "Benefits Portal",
                "rp_application_uuid": "rp-application-uuid-1",
            }
        ]
        mock_rp_applications.get.assert_awaited_once_with(
            db=mock_db,
            application_info_id=9,
            is_deleted=False,
        )

    @pytest.mark.asyncio
    async def test_list_current_user_workspaces_returns_member_workspaces(self, mock_db) -> None:
        service = WorkspaceService()

        with patch("src.app.services.workspace_service.crud_workspace_members") as mock_members:
            mock_members.get_multi = AsyncMock(
                return_value={
                    "data": [
                        {"workspace_id": 42, "user_id": 10, "role": "workspace_admin"},
                        {"workspace_id": 43, "user_id": 10, "role": "workspace_viewer"},
                    ]
                }
            )

            with patch("src.app.services.workspace_service.crud_workspaces") as mock_workspaces:
                mock_workspaces.get = AsyncMock(
                    side_effect=[
                        {"id": 42, "uuid": "workspace-uuid-1", "name": "Health Workspace"},
                        {"id": 43, "uuid": "workspace-uuid-2", "name": "Service Workspace"},
                    ]
                )

                result = await service.list_current_user_workspaces(
                    db=mock_db,
                    current_user={"id": 10},
                )

        assert [workspace["name"] for workspace in result] == [
            "Health Workspace",
            "Service Workspace",
        ]

    @pytest.mark.asyncio
    async def test_list_current_user_rp_applications_returns_workspace_context(self, mock_db) -> None:
        service = WorkspaceService()

        with patch.object(
            service,
            "list_current_user_workspaces",
            AsyncMock(
                return_value=[
                    {"id": 42, "uuid": "workspace-uuid-1", "name": "Health Workspace"},
                    {"id": 43, "uuid": "workspace-uuid-2", "name": "Service Workspace"},
                ]
            ),
        ):
            with patch("src.app.services.workspace_service.crud_rp_applications") as mock_rp_applications:
                mock_rp_applications.get_multi = AsyncMock(
                    side_effect=[
                        {
                            "data": [
                                {
                                    "id": 3,
                                    "workspace_id": 42,
                                    "uuid": "application-uuid-1",
                                    "name": "Benefits Portal",
                                    "status": "active",
                                }
                            ]
                        },
                        {
                            "data": [
                                {
                                    "id": 4,
                                    "workspace_id": 43,
                                    "uuid": "application-uuid-2",
                                    "name": "Claims Service",
                                    "status": "active",
                                }
                            ]
                        },
                    ]
                )

                with patch.object(
                    service,
                    "_enrich_rp_application_with_ibm_settings",
                    AsyncMock(side_effect=lambda rp_application, workspace_uuid: rp_application),
                ):
                    result = await service.list_current_user_rp_applications(
                        db=mock_db,
                        current_user={"id": 10},
                    )

        assert [application["workspace_name"] for application in result] == [
            "Health Workspace",
            "Service Workspace",
        ]
        assert [application["workspace_uuid"] for application in result] == [
            "workspace-uuid-1",
            "workspace-uuid-2",
        ]

    @pytest.mark.asyncio
    async def test_list_current_user_rp_applications_includes_accepted_invited_applications(
        self, mock_db
    ) -> None:
        service = WorkspaceService()

        with patch.object(service, "list_current_user_workspaces", AsyncMock(return_value=[])):
            with patch(
                "src.app.services.workspace_service.crud_rp_application_developer_invitations"
            ) as mock_invitations:
                mock_invitations.get_multi = AsyncMock(
                    return_value={
                        "data": [
                            {
                                "id": 4,
                                "workspace_id": 42,
                                "rp_application_id": 9,
                                "invited_email": "developer@example.com",
                                "accepted_at": datetime.now(UTC),
                                "revoked_at": None,
                                "invite_expires_at": datetime.now(UTC) + timedelta(days=7),
                                "is_deleted": False,
                            }
                        ]
                    }
                )

                with patch("src.app.services.workspace_service.crud_rp_applications") as mock_rp_applications:
                    mock_rp_applications.get = AsyncMock(
                        return_value={
                            "id": 9,
                            "workspace_id": 42,
                            "uuid": "018f6f83-0000-0000-0000-000000000099",
                            "name": "Benefits Portal",
                            "status": "active",
                        }
                    )

                    with patch("src.app.services.workspace_service.crud_workspaces") as mock_workspaces:
                        mock_workspaces.get = AsyncMock(
                            return_value={
                                "id": 42,
                                "uuid": "018f6f83-0000-0000-0000-000000000001",
                                "name": "Health Workspace",
                            }
                        )

                        with patch.object(
                            service,
                            "_enrich_rp_application_with_ibm_settings",
                            AsyncMock(side_effect=lambda rp_application, workspace_uuid: rp_application),
                        ):
                            result = await service.list_current_user_rp_applications(
                                db=mock_db,
                                current_user={"id": 10, "email": "developer@example.com"},
                            )

        assert len(result) == 1
        assert result[0]["workspace_name"] == "Health Workspace"
        assert result[0]["uuid"] == "018f6f83-0000-0000-0000-000000000099"

    @pytest.mark.asyncio
    async def test_get_current_user_rp_application_allows_accepted_invited_developer(self, mock_db) -> None:
        service = WorkspaceService()

        with patch("src.app.services.workspace_service.crud_rp_applications") as mock_rp_applications:
            mock_rp_applications.get = AsyncMock(
                return_value={
                    "id": 9,
                    "workspace_id": 42,
                    "uuid": "018f6f83-0000-0000-0000-000000000099",
                    "name": "Benefits Portal",
                    "status": "active",
                }
            )

            with patch("src.app.services.workspace_service.crud_workspaces") as mock_workspaces:
                mock_workspaces.get = AsyncMock(
                    return_value={
                        "id": 42,
                        "uuid": "018f6f83-0000-0000-0000-000000000001",
                        "name": "Health Workspace",
                    }
                )

                with patch("src.app.services.workspace_service.crud_workspace_members") as mock_members:
                    mock_members.get = AsyncMock(return_value=None)

                    with patch(
                        "src.app.services.workspace_service.crud_rp_application_developer_invitations"
                    ) as mock_invitations:
                        mock_invitations.get_multi = AsyncMock(
                            return_value={
                                "data": [
                                    {
                                        "id": 4,
                                        "workspace_id": 42,
                                        "rp_application_id": 9,
                                        "invited_email": "developer@example.com",
                                        "accepted_at": datetime.now(UTC),
                                        "revoked_at": None,
                                        "invite_expires_at": datetime.now(UTC) + timedelta(days=7),
                                        "is_deleted": False,
                                    }
                                ]
                            }
                        )

                        with patch.object(
                            service,
                            "_enrich_rp_application_with_ibm_settings",
                            AsyncMock(side_effect=lambda rp_application, workspace_uuid: rp_application),
                        ):
                            result = await service.get_current_user_rp_application(
                                db=mock_db,
                                rp_application_uuid="018f6f83-0000-0000-0000-000000000099",
                                current_user={"id": 10, "email": "developer@example.com"},
                            )

        assert result["workspace_name"] == "Health Workspace"
        assert result["uuid"] == "018f6f83-0000-0000-0000-000000000099"

    @pytest.mark.asyncio
    async def test_update_current_user_rp_application_allows_accepted_invited_developer(self, mock_db) -> None:
        mock_ibm_service = Mock()
        mock_ibm_service.get_application_detail = AsyncMock(return_value={"id": "ibm-app-123", "name": "Benefits Portal"})
        mock_ibm_service.build_application_update_payload = AsyncMock(return_value={"name": "[TBS] - Renamed App"})
        mock_ibm_service.update_application = AsyncMock(return_value=True)

        service = WorkspaceService(ibm_sv_admin_service=mock_ibm_service)
        values = RPApplicationUpdate(name="Renamed App")

        with patch("src.app.services.workspace_service.crud_rp_applications") as mock_rp_applications:
            mock_rp_applications.get = AsyncMock(
                side_effect=[
                    {
                        "id": 9,
                        "workspace_id": 42,
                        "uuid": "018f6f83-0000-0000-0000-000000000099",
                        "name": "Benefits Portal",
                        "status": "active",
                        "ibm_sv_application_id": "ibm-app-123",
                    },
                    {
                        "id": 9,
                        "workspace_id": 42,
                        "uuid": "018f6f83-0000-0000-0000-000000000099",
                        "name": "[TBS] - Renamed App",
                        "status": "active",
                        "ibm_sv_application_id": "ibm-app-123",
                    },
                ]
            )
            mock_rp_applications.update = AsyncMock(return_value=True)

            with patch("src.app.services.workspace_service.crud_workspaces") as mock_workspaces:
                mock_workspaces.get = AsyncMock(
                    return_value={
                        "id": 42,
                        "uuid": "018f6f83-0000-0000-0000-000000000001",
                        "name": "Health Workspace",
                        "department_id": 7,
                    }
                )

                with patch("src.app.services.workspace_service.crud_workspace_members") as mock_members:
                    mock_members.get = AsyncMock(return_value=None)

                    with patch("src.app.services.workspace_service.crud_departments") as mock_departments:
                        mock_departments.get = AsyncMock(return_value={"id": 7, "abbreviation": "TBS"})

                        with patch(
                            "src.app.services.workspace_service.crud_rp_application_developer_invitations"
                        ) as mock_invitations:
                            mock_invitations.get_multi = AsyncMock(
                                return_value={
                                    "data": [
                                        {
                                            "id": 4,
                                            "workspace_id": 42,
                                            "rp_application_id": 9,
                                            "invited_email": "developer@example.com",
                                            "accepted_at": datetime.now(UTC),
                                            "revoked_at": None,
                                            "invite_expires_at": datetime.now(UTC) + timedelta(days=7),
                                            "is_deleted": False,
                                        }
                                    ]
                                }
                            )

                            updated = await service.update_current_user_rp_application(
                                db=mock_db,
                                rp_application_uuid="018f6f83-0000-0000-0000-000000000099",
                                values=values,
                                current_user={"id": 10, "email": "developer@example.com"},
                            )

        assert updated["name"] == "[TBS] - Renamed App"
        mock_ibm_service.update_application.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_get_rp_application_client_credentials_reads_client_id_and_secret(self, mock_db) -> None:
        mock_ibm_service = Mock()
        mock_ibm_service.get_application_detail = AsyncMock(
            return_value={
                "providers": {
                    "oidc": {
                        "properties": {
                            "clientId": "client-id-123",
                            "doNotGenerateClientSecret": "false",
                        }
                    }
                }
            }
        )
        mock_ibm_service.get_client_secret = AsyncMock(
            return_value={
                "clientSecrets": [
                    {
                        "id": "secret-1",
                        "secret": "top-secret-value",
                    }
                ]
            }
        )

        service = WorkspaceService(ibm_sv_admin_service=mock_ibm_service)

        with patch("src.app.services.workspace_service.crud_workspaces") as mock_workspaces:
            mock_workspaces.get = AsyncMock(return_value={"id": 42, "department_id": 7})

            with patch("src.app.services.workspace_service.crud_workspace_members") as mock_members:
                mock_members.get = AsyncMock(
                    return_value={"id": 2, "workspace_id": 42, "user_id": 10, "role": "workspace_admin"}
                )

                with patch("src.app.services.workspace_service.crud_rp_applications") as mock_rp_applications:
                    mock_rp_applications.get = AsyncMock(
                        return_value={
                            "id": 3,
                            "workspace_id": 42,
                            "uuid": "018f6f83-0000-0000-0000-000000000099",
                            "name": "[TBS] - Application One",
                            "ibm_sv_application_id": "ibm-app-123",
                        }
                    )

                    result = await service.get_rp_application_client_credentials(
                        db=mock_db,
                        workspace_uuid="018f6f83-0000-0000-0000-000000000010",
                        rp_application_uuid="018f6f83-0000-0000-0000-000000000099",
                        current_user={"id": 10},
                    )

        assert result == {
            "client_id": "client-id-123",
            "client_secret": "top-secret-value",
            "client_secret_id": "secret-1",
        }
        mock_ibm_service.get_client_secret.assert_awaited_once_with("client-id-123")

    @pytest.mark.asyncio
    async def test_list_rp_application_rotated_client_secrets_returns_normalized_items(self, mock_db) -> None:
        mock_ibm_service = Mock()
        mock_ibm_service.get_application_detail = AsyncMock(
            return_value={
                "providers": {
                    "oidc": {
                        "properties": {
                            "clientId": "client-id-123",
                            "doNotGenerateClientSecret": "false",
                        }
                    }
                }
            }
        )
        mock_ibm_service.get_client_secret = AsyncMock(
            return_value={
                "clientSecrets": [
                    {
                        "description": "April rotation",
                        "value": "another one",
                        "expiredAt": 1775692800,
                        "rotatedAt": 1773100800,
                    }
                ]
            }
        )

        service = WorkspaceService(ibm_sv_admin_service=mock_ibm_service)

        with patch("src.app.services.workspace_service.crud_workspaces") as mock_workspaces:
            mock_workspaces.get = AsyncMock(return_value={"id": 42, "department_id": 7})

            with patch("src.app.services.workspace_service.crud_workspace_members") as mock_members:
                mock_members.get = AsyncMock(
                    return_value={"id": 2, "workspace_id": 42, "user_id": 10, "role": "workspace_admin"}
                )

                with patch("src.app.services.workspace_service.crud_rp_applications") as mock_rp_applications:
                    mock_rp_applications.get = AsyncMock(
                        return_value={
                            "id": 3,
                            "workspace_id": 42,
                            "uuid": "018f6f83-0000-0000-0000-000000000099",
                            "name": "[TBS] - Application One",
                            "ibm_sv_application_id": "ibm-app-123",
                        }
                    )

                    result = await service.list_rp_application_rotated_client_secrets(
                        db=mock_db,
                        workspace_uuid="018f6f83-0000-0000-0000-000000000010",
                        rp_application_uuid="018f6f83-0000-0000-0000-000000000099",
                        current_user={"id": 10},
                    )

        assert result == [
            {
                "description": "April rotation",
                "expired_at": 1775692800,
                "rotated_at": 1773100800,
                "value": "another one",
                "secret_id": "/rotatedSecrets/0",
            }
        ]
        mock_ibm_service.get_client_secret.assert_awaited_once_with("client-id-123")

    @pytest.mark.asyncio
    async def test_list_rp_application_rotated_client_secrets_uses_path_fallback_when_secret_id_is_missing(
        self,
        mock_db,
    ) -> None:
        mock_ibm_service = Mock()
        mock_ibm_service.get_application_detail = AsyncMock(
            return_value={
                "providers": {
                    "oidc": {
                        "properties": {
                            "clientId": "client-id-123",
                            "doNotGenerateClientSecret": "false",
                        }
                    }
                }
            }
        )
        mock_ibm_service.get_client_secret = AsyncMock(
            return_value={
                "clientSecrets": [
                    {
                        "description": "April rotation",
                        "value": "another one",
                        "expiredAt": 1775692800,
                        "rotatedAt": 1773100800,
                    }
                ]
            }
        )

        service = WorkspaceService(ibm_sv_admin_service=mock_ibm_service)

        with patch("src.app.services.workspace_service.crud_workspaces") as mock_workspaces:
            mock_workspaces.get = AsyncMock(return_value={"id": 42, "department_id": 7})

            with patch("src.app.services.workspace_service.crud_workspace_members") as mock_members:
                mock_members.get = AsyncMock(
                    return_value={"id": 2, "workspace_id": 42, "user_id": 10, "role": "workspace_admin"}
                )

                with patch("src.app.services.workspace_service.crud_rp_applications") as mock_rp_applications:
                    mock_rp_applications.get = AsyncMock(
                        return_value={
                            "id": 3,
                            "workspace_id": 42,
                            "uuid": "018f6f83-0000-0000-0000-000000000099",
                            "name": "[TBS] - Application One",
                            "ibm_sv_application_id": "ibm-app-123",
                        }
                    )

                    result = await service.list_rp_application_rotated_client_secrets(
                        db=mock_db,
                        workspace_uuid="018f6f83-0000-0000-0000-000000000010",
                        rp_application_uuid="018f6f83-0000-0000-0000-000000000099",
                        current_user={"id": 10},
                    )

        assert result == [
            {
                "description": "April rotation",
                "expired_at": 1775692800,
                "rotated_at": 1773100800,
                "value": "another one",
                "secret_id": "/rotatedSecrets/0",
            }
        ]
        mock_ibm_service.get_client_secret.assert_awaited_once_with("client-id-123")

    @pytest.mark.asyncio
    async def test_create_rp_application_rotated_client_secret_sends_named_rotation_payload(self, mock_db) -> None:
        mock_ibm_service = Mock()
        mock_ibm_service.get_application_detail = AsyncMock(
            return_value={
                "providers": {
                    "oidc": {
                        "properties": {
                            "clientId": "client-id-123",
                            "doNotGenerateClientSecret": "false",
                        }
                    }
                }
            }
        )
        mock_ibm_service.update_client_secret = AsyncMock(
            return_value={
                "clientSecrets": [
                    {
                        "description": "April rotation",
                        "value": "another one",
                        "expiredAt": 1775692800,
                        "rotatedAt": 1773100800,
                    }
                ]
            }
        )

        service = WorkspaceService(ibm_sv_admin_service=mock_ibm_service)
        values = RPApplicationClientRotatedSecretCreateRequest(
            description="April rotation",
            rotatedSecretExpiredAt=int((datetime.now(UTC) + timedelta(days=7)).timestamp()),
        )

        with patch("src.app.services.workspace_service.crud_workspaces") as mock_workspaces:
            mock_workspaces.get = AsyncMock(return_value={"id": 42, "department_id": 7})

            with patch("src.app.services.workspace_service.crud_workspace_members") as mock_members:
                mock_members.get = AsyncMock(
                    return_value={"id": 2, "workspace_id": 42, "user_id": 10, "role": "workspace_admin"}
                )

                with patch("src.app.services.workspace_service.crud_rp_applications") as mock_rp_applications:
                    mock_rp_applications.get = AsyncMock(
                        return_value={
                            "id": 3,
                            "workspace_id": 42,
                            "uuid": "018f6f83-0000-0000-0000-000000000099",
                            "name": "[TBS] - Application One",
                            "ibm_sv_application_id": "ibm-app-123",
                        }
                    )

                    result = await service.create_rp_application_rotated_client_secret(
                        db=mock_db,
                        workspace_uuid="018f6f83-0000-0000-0000-000000000010",
                        rp_application_uuid="018f6f83-0000-0000-0000-000000000099",
                        current_user={"id": 10},
                        values=values,
                    )

        assert result == [
            {
                "description": "April rotation",
                "expired_at": 1775692800,
                "rotated_at": 1773100800,
                "value": "another one",
                "secret_id": "/rotatedSecrets/0",
            }
        ]
        mock_ibm_service.update_client_secret.assert_awaited_once_with(
            "client-id-123",
            {
                "deleteRotatedSecrets": False,
                "description": "April rotation",
                "rotatedSecretExpiredAt": values.rotated_secret_expired_at,
            },
        )

    @pytest.mark.asyncio
    async def test_delete_rp_application_rotated_client_secret_uses_identifier(self, mock_db) -> None:
        mock_ibm_service = Mock()
        mock_ibm_service.get_application_detail = AsyncMock(
            return_value={
                "providers": {
                    "oidc": {
                        "properties": {
                            "clientId": "client-id-123",
                            "doNotGenerateClientSecret": "false",
                        }
                    }
                }
            }
        )
        mock_ibm_service.get_client_secret = AsyncMock(
            return_value={
                "clientSecrets": [
                    {
                        "description": "April rotation",
                        "value": "another one",
                        "expiredAt": 1775692800,
                        "rotatedAt": 1773100800,
                    }
                ]
            }
        )
        mock_ibm_service.delete_rotated_client_secrets = AsyncMock(return_value=True)

        service = WorkspaceService(ibm_sv_admin_service=mock_ibm_service)

        with patch("src.app.services.workspace_service.crud_workspaces") as mock_workspaces:
            mock_workspaces.get = AsyncMock(return_value={"id": 42, "department_id": 7})

            with patch("src.app.services.workspace_service.crud_workspace_members") as mock_members:
                mock_members.get = AsyncMock(
                    return_value={"id": 2, "workspace_id": 42, "user_id": 10, "role": "workspace_admin"}
                )

                with patch("src.app.services.workspace_service.crud_rp_applications") as mock_rp_applications:
                    mock_rp_applications.get = AsyncMock(
                        return_value={
                            "id": 3,
                            "workspace_id": 42,
                            "uuid": "018f6f83-0000-0000-0000-000000000099",
                            "name": "[TBS] - Application One",
                            "ibm_sv_application_id": "ibm-app-123",
                        }
                    )

                    await service.delete_rp_application_rotated_client_secret(
                        db=mock_db,
                        workspace_uuid="018f6f83-0000-0000-0000-000000000010",
                        rp_application_uuid="018f6f83-0000-0000-0000-000000000099",
                        rotated_secret_id="another one",
                        current_user={"id": 10},
                    )

        mock_ibm_service.delete_rotated_client_secrets.assert_awaited_once_with(
            "client-id-123",
            ["another one"],
        )

    @pytest.mark.asyncio
    async def test_rotate_rp_application_client_secret_returns_new_secret(self, mock_db) -> None:
        mock_ibm_service = Mock()
        mock_ibm_service.get_application_detail = AsyncMock(
            return_value={
                "providers": {
                    "oidc": {
                        "properties": {
                            "clientId": "client-id-123",
                            "doNotGenerateClientSecret": "false",
                        }
                    }
                }
            }
        )
        mock_ibm_service.update_client_secret = AsyncMock(
            return_value={
                "id": "secret-2",
                "secret": "rotated-secret-value",
            }
        )

        service = WorkspaceService(ibm_sv_admin_service=mock_ibm_service)

        with patch("src.app.services.workspace_service.crud_workspaces") as mock_workspaces:
            mock_workspaces.get = AsyncMock(return_value={"id": 42, "department_id": 7})

            with patch("src.app.services.workspace_service.crud_workspace_members") as mock_members:
                mock_members.get = AsyncMock(
                    return_value={"id": 2, "workspace_id": 42, "user_id": 10, "role": "workspace_admin"}
                )

                with patch("src.app.services.workspace_service.crud_rp_applications") as mock_rp_applications:
                    mock_rp_applications.get = AsyncMock(
                        return_value={
                            "id": 3,
                            "workspace_id": 42,
                            "uuid": "018f6f83-0000-0000-0000-000000000099",
                            "name": "[TBS] - Application One",
                            "ibm_sv_application_id": "ibm-app-123",
                        }
                    )

                    result = await service.rotate_rp_application_client_secret(
                        db=mock_db,
                        workspace_uuid="018f6f83-0000-0000-0000-000000000010",
                        rp_application_uuid="018f6f83-0000-0000-0000-000000000099",
                        current_user={"id": 10},
                    )

        assert result == {
            "client_id": "client-id-123",
            "client_secret": "rotated-secret-value",
            "client_secret_id": "secret-2",
        }
        mock_ibm_service.update_client_secret.assert_awaited_once_with(
            "client-id-123",
            {
                "deleteRotatedSecrets": False,
                "description": "",
                "rotatedSecretExpiredAt": 0,
            },
        )

    @pytest.mark.asyncio
    async def test_rotate_rp_application_client_secret_rejects_public_clients(self, mock_db) -> None:
        mock_ibm_service = Mock()
        mock_ibm_service.get_application_detail = AsyncMock(
            return_value={
                "providers": {
                    "oidc": {
                        "properties": {
                            "clientId": "client-id-123",
                            "doNotGenerateClientSecret": "true",
                        }
                    }
                }
            }
        )

        service = WorkspaceService(ibm_sv_admin_service=mock_ibm_service)

        with patch("src.app.services.workspace_service.crud_workspaces") as mock_workspaces:
            mock_workspaces.get = AsyncMock(return_value={"id": 42, "department_id": 7})

            with patch("src.app.services.workspace_service.crud_workspace_members") as mock_members:
                mock_members.get = AsyncMock(
                    return_value={"id": 2, "workspace_id": 42, "user_id": 10, "role": "workspace_admin"}
                )

                with patch("src.app.services.workspace_service.crud_rp_applications") as mock_rp_applications:
                    mock_rp_applications.get = AsyncMock(
                        return_value={
                            "id": 3,
                            "workspace_id": 42,
                            "uuid": "018f6f83-0000-0000-0000-000000000099",
                            "name": "[TBS] - Application One",
                            "ibm_sv_application_id": "ibm-app-123",
                        }
                    )

                    with pytest.raises(BadRequestException, match="does not support client secrets"):
                        await service.rotate_rp_application_client_secret(
                            db=mock_db,
                            workspace_uuid="018f6f83-0000-0000-0000-000000000010",
                            rp_application_uuid="018f6f83-0000-0000-0000-000000000099",
                            current_user={"id": 10},
                        )

    @pytest.mark.asyncio
    async def test_rotate_rp_application_client_secret_rejects_named_rotation_expiry_over_30_days(self, mock_db) -> None:
        mock_ibm_service = Mock()
        mock_ibm_service.get_application_detail = AsyncMock(
            return_value={
                "providers": {
                    "oidc": {
                        "properties": {
                            "clientId": "client-id-123",
                            "doNotGenerateClientSecret": "false",
                        }
                    }
                }
            }
        )

        service = WorkspaceService(ibm_sv_admin_service=mock_ibm_service)
        values = RPApplicationClientSecretRotateRequest(
            deleteRotatedSecrets=True,
            description="April rotation",
            rotatedSecretExpiredAt=int((datetime.now(UTC) + timedelta(days=31)).timestamp()),
        )

        with patch("src.app.services.workspace_service.crud_workspaces") as mock_workspaces:
            mock_workspaces.get = AsyncMock(return_value={"id": 42, "department_id": 7})

            with patch("src.app.services.workspace_service.crud_workspace_members") as mock_members:
                mock_members.get = AsyncMock(
                    return_value={"id": 2, "workspace_id": 42, "user_id": 10, "role": "workspace_admin"}
                )

                with patch("src.app.services.workspace_service.crud_rp_applications") as mock_rp_applications:
                    mock_rp_applications.get = AsyncMock(
                        return_value={
                            "id": 3,
                            "workspace_id": 42,
                            "uuid": "018f6f83-0000-0000-0000-000000000099",
                            "name": "[TBS] - Application One",
                            "ibm_sv_application_id": "ibm-app-123",
                        }
                    )

                    with pytest.raises(BadRequestException, match="within 30 days"):
                        await service.rotate_rp_application_client_secret(
                            db=mock_db,
                            workspace_uuid="018f6f83-0000-0000-0000-000000000010",
                            rp_application_uuid="018f6f83-0000-0000-0000-000000000099",
                            current_user={"id": 10},
                            values=values,
                        )

        mock_ibm_service.update_client_secret.assert_not_called()

    @pytest.mark.asyncio
    async def test_rotate_rp_application_client_secret_sends_named_rotation_payload(self, mock_db) -> None:
        mock_ibm_service = Mock()
        mock_ibm_service.get_application_detail = AsyncMock(
            return_value={
                "providers": {
                    "oidc": {
                        "properties": {
                            "clientId": "client-id-123",
                            "doNotGenerateClientSecret": "false",
                        }
                    }
                }
            }
        )
        mock_ibm_service.update_client_secret = AsyncMock(
            return_value={
                "id": "secret-2",
                "secret": "rotated-secret-value",
            }
        )

        service = WorkspaceService(ibm_sv_admin_service=mock_ibm_service)
        values = RPApplicationClientSecretRotateRequest(
            deleteRotatedSecrets=True,
            description="April rotation",
            rotatedSecretExpiredAt=int((datetime.now(UTC) + timedelta(days=7)).timestamp()),
        )

        with patch("src.app.services.workspace_service.crud_workspaces") as mock_workspaces:
            mock_workspaces.get = AsyncMock(return_value={"id": 42, "department_id": 7})

            with patch("src.app.services.workspace_service.crud_workspace_members") as mock_members:
                mock_members.get = AsyncMock(
                    return_value={"id": 2, "workspace_id": 42, "user_id": 10, "role": "workspace_admin"}
                )

                with patch("src.app.services.workspace_service.crud_rp_applications") as mock_rp_applications:
                    mock_rp_applications.get = AsyncMock(
                        return_value={
                            "id": 3,
                            "workspace_id": 42,
                            "uuid": "018f6f83-0000-0000-0000-000000000099",
                            "name": "[TBS] - Application One",
                            "ibm_sv_application_id": "ibm-app-123",
                        }
                    )

                    result = await service.rotate_rp_application_client_secret(
                        db=mock_db,
                        workspace_uuid="018f6f83-0000-0000-0000-000000000010",
                        rp_application_uuid="018f6f83-0000-0000-0000-000000000099",
                        current_user={"id": 10},
                        values=values,
                    )

        assert result == {
            "client_id": "client-id-123",
            "client_secret": "rotated-secret-value",
            "client_secret_id": "secret-2",
        }
        mock_ibm_service.update_client_secret.assert_awaited_once_with(
            "client-id-123",
            {
                "deleteRotatedSecrets": True,
                "description": "April rotation",
                "rotatedSecretExpiredAt": values.rotated_secret_expired_at,
            },
        )

    @pytest.mark.asyncio
    async def test_delete_rp_application_deletes_ibm_before_local_delete(self, mock_db) -> None:
        mock_ibm_service = Mock()
        mock_ibm_service.delete_application = AsyncMock()

        service = WorkspaceService(ibm_sv_admin_service=mock_ibm_service)

        with patch("src.app.services.workspace_service.crud_workspaces") as mock_workspaces:
            mock_workspaces.get = AsyncMock(return_value={"id": 42, "department_id": 7})

            with patch("src.app.services.workspace_service.crud_workspace_members") as mock_members:
                mock_members.get = AsyncMock(return_value={"id": 2, "workspace_id": 42, "user_id": 10, "role": "workspace_admin"})

                with patch("src.app.services.workspace_service.crud_rp_applications") as mock_rp_applications:
                    mock_rp_applications.get = AsyncMock(
                        return_value={
                            "id": 3,
                            "workspace_id": 42,
                            "uuid": "018f6f83-0000-0000-0000-000000000099",
                            "name": "[TBS] - Application One",
                            "ibm_sv_application_id": "ibm-app-123",
                        }
                    )

                    async def delete_side_effect(*args, **kwargs):
                        assert mock_ibm_service.delete_application.await_count == 1
                        return True

                    mock_rp_applications.delete = AsyncMock(side_effect=delete_side_effect)

                    result = await service.delete_rp_application(
                        db=mock_db,
                        workspace_uuid="018f6f83-0000-0000-0000-000000000010",
                        rp_application_uuid="018f6f83-0000-0000-0000-000000000099",
                        current_user={"id": 10},
                    )

        assert result["message"] == "RP application deleted"
        mock_ibm_service.delete_application.assert_awaited_once_with("ibm-app-123")

    @pytest.mark.asyncio
    async def test_get_rp_application_usage_summary_requires_workspace_membership(self, mock_db) -> None:
        service = WorkspaceService()

        with patch("src.app.services.workspace_service.crud_workspaces") as mock_workspaces:
            mock_workspaces.get = AsyncMock(return_value={"id": 42, "department_id": 7})

            with patch("src.app.services.workspace_service.crud_workspace_members") as mock_members:
                mock_members.get = AsyncMock(return_value=None)

                with pytest.raises(ForbiddenException, match="Only workspace members"):
                    await service.get_rp_application_usage_summary(
                        db=mock_db,
                        workspace_uuid="018f6f83-0000-0000-0000-000000000010",
                        rp_application_uuid="018f6f83-0000-0000-0000-000000000099",
                        selected_date="2026-04-09",
                        current_user={"id": 10},
                    )

    @pytest.mark.asyncio
    async def test_get_rp_application_usage_summary_normalizes_totals(self, mock_db) -> None:
        mock_ibm_service = Mock()
        mock_ibm_service.get_application_total_logins = AsyncMock(
            return_value={
                "response": {
                    "report": {
                        "failed_logins": {"doc_count": 2},
                        "successful_logins": {"doc_count": 19},
                        "unique_users": {"value": 5},
                    }
                }
            }
        )

        service = WorkspaceService(ibm_sv_admin_service=mock_ibm_service)

        with patch("src.app.services.workspace_service.crud_workspaces") as mock_workspaces:
            mock_workspaces.get = AsyncMock(return_value={"id": 42, "department_id": 7})

            with patch("src.app.services.workspace_service.crud_workspace_members") as mock_members:
                mock_members.get = AsyncMock(
                    return_value={"id": 2, "workspace_id": 42, "user_id": 10, "role": "workspace_viewer"}
                )

                with patch("src.app.services.workspace_service.crud_rp_applications") as mock_rp_applications:
                    mock_rp_applications.get = AsyncMock(
                        return_value={
                            "id": 3,
                            "workspace_id": 42,
                            "uuid": "018f6f83-0000-0000-0000-000000000099",
                            "name": "[TBS] - Application One",
                            "ibm_sv_application_id": "ibm-app-123",
                        }
                    )

                    result = await service.get_rp_application_usage_summary(
                        db=mock_db,
                        workspace_uuid="018f6f83-0000-0000-0000-000000000010",
                        rp_application_uuid="018f6f83-0000-0000-0000-000000000099",
                        selected_date="2026-04-09",
                        current_user={"id": 10},
                    )

        assert result == {"failed": 2, "succeeded": 19, "total": 21}
        mock_ibm_service.get_application_total_logins.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_get_rp_application_usage_summary_uses_exact_day_epoch_range(self, mock_db) -> None:
        mock_ibm_service = Mock()
        mock_ibm_service.get_application_total_logins = AsyncMock(return_value={"failed": 0, "successful": 0, "total": 0})

        service = WorkspaceService(ibm_sv_admin_service=mock_ibm_service)

        with patch("src.app.services.workspace_service.crud_workspaces") as mock_workspaces:
            mock_workspaces.get = AsyncMock(return_value={"id": 42, "department_id": 7})

            with patch("src.app.services.workspace_service.crud_workspace_members") as mock_members:
                mock_members.get = AsyncMock(
                    return_value={"id": 2, "workspace_id": 42, "user_id": 10, "role": "workspace_viewer"}
                )

                with patch("src.app.services.workspace_service.crud_rp_applications") as mock_rp_applications:
                    mock_rp_applications.get = AsyncMock(
                        return_value={
                            "id": 3,
                            "workspace_id": 42,
                            "uuid": "018f6f83-0000-0000-0000-000000000099",
                            "name": "[TBS] - Application One",
                            "ibm_sv_application_id": "ibm-app-123",
                        }
                    )

                    await service.get_rp_application_usage_summary(
                        db=mock_db,
                        workspace_uuid="018f6f83-0000-0000-0000-000000000010",
                        rp_application_uuid="018f6f83-0000-0000-0000-000000000099",
                        selected_date="2026-04-09",
                        current_user={"id": 10},
                    )

        _, from_date, to_date = mock_ibm_service.get_application_total_logins.await_args.args
        assert from_date == "1775692800000"
        assert to_date == "1775779199999"

    @pytest.mark.asyncio
    async def test_get_rp_application_usage_summary_accepts_unix_millisecond_selected_date(self, mock_db) -> None:
        mock_ibm_service = Mock()
        mock_ibm_service.get_application_total_logins = AsyncMock(return_value={"failed": 0, "successful": 0, "total": 0})

        service = WorkspaceService(ibm_sv_admin_service=mock_ibm_service)

        with patch("src.app.services.workspace_service.crud_workspaces") as mock_workspaces:
            mock_workspaces.get = AsyncMock(return_value={"id": 42, "department_id": 7})

            with patch("src.app.services.workspace_service.crud_workspace_members") as mock_members:
                mock_members.get = AsyncMock(
                    return_value={"id": 2, "workspace_id": 42, "user_id": 10, "role": "workspace_viewer"}
                )

                with patch("src.app.services.workspace_service.crud_rp_applications") as mock_rp_applications:
                    mock_rp_applications.get = AsyncMock(
                        return_value={
                            "id": 3,
                            "workspace_id": 42,
                            "uuid": "018f6f83-0000-0000-0000-000000000099",
                            "name": "[TBS] - Application One",
                            "ibm_sv_application_id": "ibm-app-123",
                        }
                    )

                    await service.get_rp_application_usage_summary(
                        db=mock_db,
                        workspace_uuid="018f6f83-0000-0000-0000-000000000010",
                        rp_application_uuid="018f6f83-0000-0000-0000-000000000099",
                        selected_date="1775692800000",
                        current_user={"id": 10},
                    )

        _, from_date, to_date = mock_ibm_service.get_application_total_logins.await_args.args
        assert from_date == "1775692800000"
        assert to_date == "1775779199999"

    @pytest.mark.asyncio
    async def test_get_rp_application_audit_trail_masks_sensitive_fields(self, mock_db) -> None:
        mock_ibm_service = Mock()
        mock_ibm_service.get_application_audit_trail = AsyncMock(
            return_value={
                "events": [
                    {
                        "username": "jane.doe@example.com",
                        "origin": "192.168.10.20",
                        "result": "SUCCESS",
                        "timestamp": 1744200000000,
                        "country": "Canada",
                    }
                ],
                "next": '"1744200000000", "event-2"',
                "total": 20,
            }
        )
        mock_ibm_service.parse_audit_trail = Mock(
            return_value=[
                {
                    "username": "jane.doe@example.com",
                    "username_display": "ja***@example.com",
                    "username_known": True,
                    "origin": "192.168.10.20",
                    "origin_display": "192.168.xxx.xxx",
                    "ip_version": 4,
                    "result": "success",
                    "time_seconds": 1744200000,
                    "country": "Canada",
                }
            ]
        )

        service = WorkspaceService(ibm_sv_admin_service=mock_ibm_service)

        with patch("src.app.services.workspace_service.crud_workspaces") as mock_workspaces:
            mock_workspaces.get = AsyncMock(return_value={"id": 42, "department_id": 7})

            with patch("src.app.services.workspace_service.crud_workspace_members") as mock_members:
                mock_members.get = AsyncMock(
                    return_value={"id": 2, "workspace_id": 42, "user_id": 10, "role": "workspace_viewer"}
                )

                with patch("src.app.services.workspace_service.crud_rp_applications") as mock_rp_applications:
                    mock_rp_applications.get = AsyncMock(
                        return_value={
                            "id": 3,
                            "workspace_id": 42,
                            "uuid": "018f6f83-0000-0000-0000-000000000099",
                            "name": "[TBS] - Application One",
                            "ibm_sv_application_id": "ibm-app-123",
                        }
                    )

                    result = await service.get_rp_application_audit_trail(
                        db=mock_db,
                        workspace_uuid="018f6f83-0000-0000-0000-000000000010",
                        rp_application_uuid="018f6f83-0000-0000-0000-000000000099",
                        selected_date="2026-04-09",
                        current_user={"id": 10},
                    )

        assert result == {
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
            "next": '"1744200000000", "event-2"',
            "total": 20,
        }
        mock_ibm_service.parse_audit_trail.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_rp_application_audit_trail_search_after_returns_cursor_page(self, mock_db) -> None:
        mock_ibm_service = Mock()
        mock_ibm_service.get_application_audit_trail_search_after = AsyncMock(
            return_value={
                "events": [{"username": "UNKNOWN", "origin": "2001:db8::1", "result": "FAILURE", "timestamp": 1744203600000, "country": "Canada"}],
                "next": None,
                "total": 20,
            }
        )
        mock_ibm_service.parse_audit_trail = Mock(
            return_value=[
                {
                    "username": "UNKNOWN",
                    "username_display": "",
                    "username_known": False,
                    "origin": "2001:db8::1",
                    "origin_display": "2001:0db8:xxxx:xxxx:xxxx:xxxx:xxxx:xxxx",
                    "ip_version": 6,
                    "result": "failure",
                    "time_seconds": 1744203600,
                    "country": "Canada",
                }
            ]
        )

        service = WorkspaceService(ibm_sv_admin_service=mock_ibm_service)

        with patch("src.app.services.workspace_service.crud_workspaces") as mock_workspaces:
            mock_workspaces.get = AsyncMock(return_value={"id": 42, "department_id": 7})

            with patch("src.app.services.workspace_service.crud_workspace_members") as mock_members:
                mock_members.get = AsyncMock(
                    return_value={"id": 2, "workspace_id": 42, "user_id": 10, "role": "workspace_viewer"}
                )

                with patch("src.app.services.workspace_service.crud_rp_applications") as mock_rp_applications:
                    mock_rp_applications.get = AsyncMock(
                        return_value={
                            "id": 3,
                            "workspace_id": 42,
                            "uuid": "018f6f83-0000-0000-0000-000000000099",
                            "name": "[TBS] - Application One",
                            "ibm_sv_application_id": "ibm-app-123",
                        }
                    )

                    result = await service.get_rp_application_audit_trail_search_after(
                        db=mock_db,
                        workspace_uuid="018f6f83-0000-0000-0000-000000000010",
                        rp_application_uuid="018f6f83-0000-0000-0000-000000000099",
                        selected_date="2026-04-09",
                        current_user={"id": 10},
                        search_after='"1744200000000", "event-2"',
                    )

        assert result["next"] is None
        assert result["events"][0]["origin_display"] == "2001:0db8:xxxx:xxxx:xxxx:xxxx:xxxx:xxxx"
        mock_ibm_service.get_application_audit_trail_search_after.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_get_rp_application_usage_summary_rejects_missing_ibm_application_id(self, mock_db) -> None:
        mock_ibm_service = Mock()
        service = WorkspaceService(ibm_sv_admin_service=mock_ibm_service)

        with patch("src.app.services.workspace_service.crud_workspaces") as mock_workspaces:
            mock_workspaces.get = AsyncMock(return_value={"id": 42, "department_id": 7})

            with patch("src.app.services.workspace_service.crud_workspace_members") as mock_members:
                mock_members.get = AsyncMock(
                    return_value={"id": 2, "workspace_id": 42, "user_id": 10, "role": "workspace_viewer"}
                )

                with patch("src.app.services.workspace_service.crud_rp_applications") as mock_rp_applications:
                    mock_rp_applications.get = AsyncMock(
                        return_value={
                            "id": 3,
                            "workspace_id": 42,
                            "uuid": "018f6f83-0000-0000-0000-000000000099",
                            "name": "[TBS] - Application One",
                            "ibm_sv_application_id": None,
                        }
                    )

                    with pytest.raises(BadRequestException, match="missing its IBM Security Verify application ID"):
                        await service.get_rp_application_usage_summary(
                            db=mock_db,
                            workspace_uuid="018f6f83-0000-0000-0000-000000000010",
                            rp_application_uuid="018f6f83-0000-0000-0000-000000000099",
                            selected_date="2026-04-09",
                            current_user={"id": 10},
                        )
