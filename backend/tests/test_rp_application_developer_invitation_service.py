from contextlib import ExitStack, contextmanager
from datetime import UTC, datetime, timedelta
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch
from uuid import uuid4

import pytest
from sqlalchemy.exc import IntegrityError

from src.app.core.authorization import CanonicalRoleCode
from src.app.core.config import settings
from src.app.core.exceptions.http_exceptions import (
    BadRequestException,
    DuplicateValueException,
    ForbiddenException,
    NotFoundException,
)
from src.app.models.audit_log import AuditLog
from src.app.services.authorization_service import (
    AUTHORIZATION_STATE_KEY,
    ResolvedAuthorizationState,
    ResolvedPartnerAccess,
)
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


def _rp_application_record(workspace_id: int, *, application_id: int = 29) -> dict[str, object]:
    return {
        "id": application_id,
        "uuid": uuid4(),
        "workspace_id": workspace_id,
        "dnr_app_name": "Benefits Portal",
    }


def _invitation_record(
    *,
    workspace_id: int,
    rp_application_id: int | None,
    role: str = READ_ONLY_ROLE,
    status: str = PENDING_INVITATION_STATUS,
    invited_email: str = "invitee@example.gc.ca",
    invite_expires_at: datetime | None = None,
) -> dict[str, object]:
    now = datetime.now(UTC)
    accepted_at = now if status == ACCEPTED_INVITATION_STATUS else None
    revoked_at = now if status == REVOKED_INVITATION_STATUS else None
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
        "accepted_at": accepted_at,
        "revoked_at": revoked_at,
        "revoked_by_user_id": None,
        "revocation_actor_source": None,
        "gc_notify_notification_id": None,
        "delegated_by_grant_uuid": None,
        "revocation_reason": None,
        "replaced_by_invitation_uuid": None,
        "created_at": now,
        "updated_at": None,
        "is_deleted": False,
        "deleted_at": None,
    }


def _access_grant_record(
    *,
    workspace_id: int,
    user_id: int,
    role: str = READ_ONLY_ROLE,
    source_invitation_uuid=None,
) -> dict[str, object]:
    return {
        "id": 77,
        "uuid": uuid4(),
        "workspace_id": workspace_id,
        "user_id": user_id,
        "role": role,
        "status": "active",
        "source_invitation_uuid": source_invitation_uuid,
        "revoked_at": None,
        "revoked_by_user_id": None,
        "created_at": datetime.now(UTC),
        "updated_at": None,
        "is_deleted": False,
        "deleted_at": None,
    }


def _cl_admin_user(*, user_id: int = 1, email: str | None = None) -> dict[str, object]:
    current_user: dict[str, object] = {
        "id": user_id,
        "uuid": uuid4(),
        AUTHORIZATION_STATE_KEY: ResolvedAuthorizationState(global_role=CanonicalRoleCode.CL_ADMIN),
    }
    if email is not None:
        current_user["email"] = email
    return current_user


def _partner_user(
    workspace: dict[str, object],
    *,
    user_id: int = 51,
    email: str | None = None,
    role: CanonicalRoleCode = CanonicalRoleCode.RP_ADMIN,
) -> dict[str, object]:
    current_user: dict[str, object] = {
        "id": user_id,
        "uuid": uuid4(),
        AUTHORIZATION_STATE_KEY: ResolvedAuthorizationState(
            partner_access=(
                ResolvedPartnerAccess(
                    workspace_id=int(workspace["id"]),
                    workspace_uuid=workspace["uuid"],
                    role=role,
                ),
            )
        ),
    }
    if email is not None:
        current_user["email"] = email
    return current_user


def _unassigned_user(*, user_id: int = 51, email: str = "invitee@example.gc.ca") -> dict[str, object]:
    return {
        "id": user_id,
        "uuid": uuid4(),
        "email": email,
        AUTHORIZATION_STATE_KEY: ResolvedAuthorizationState(),
    }


@contextmanager
def _mock_service_dependencies():
    with ExitStack() as stack:
        mocks = SimpleNamespace(
            workspaces=stack.enter_context(patch("src.app.services.rp_application_developer_invitation_service.crud_workspaces")),
            applications=stack.enter_context(patch("src.app.services.rp_application_developer_invitation_service.crud_rp_applications")),
            grants=stack.enter_context(patch("src.app.services.rp_application_developer_invitation_service.crud_rp_application_access_grants")),
            invitations=stack.enter_context(
                patch("src.app.services.rp_application_developer_invitation_service.crud_rp_application_developer_invitations")
            ),
            users=stack.enter_context(patch("src.app.services.rp_application_developer_invitation_service.crud_users")),
            authorization_resolve=stack.enter_context(
                patch(
                    "src.app.services.rp_application_developer_invitation_service.AuthorizationService.resolve_for_user",
                    new=AsyncMock(return_value=ResolvedAuthorizationState()),
                )
            ),
        )
        mocks.workspaces.get = AsyncMock(return_value=None)
        mocks.applications.get = AsyncMock(return_value=None)
        mocks.grants.get = AsyncMock(return_value=None)
        mocks.grants.create = AsyncMock(return_value=None)
        mocks.invitations.get = AsyncMock(return_value=None)
        mocks.invitations.get_multi = AsyncMock(return_value={"data": []})
        mocks.invitations.create = AsyncMock(return_value=None)
        mocks.invitations.update = AsyncMock(return_value=None)
        mocks.users.get = AsyncMock(return_value=None)
        yield mocks


def _configure_context(mocks, workspace, rp_application) -> None:
    mocks.workspaces.get = AsyncMock(return_value=workspace)
    mocks.applications.get = AsyncMock(return_value=rp_application)


def _audit_logs(mock_db) -> list[AuditLog]:
    return [call.args[0] for call in mock_db.add.call_args_list if call.args and isinstance(call.args[0], AuditLog)]


class TestInvitationCreationAndDelegation:
    @pytest.mark.asyncio
    async def test_cl_admin_can_create_workspace_only_rp_admin_invitation(
        self,
        mock_db,
    ) -> None:
        service = RPApplicationDeveloperInvitationService()
        workspace = _workspace_record()
        created_invitation = _invitation_record(
            workspace_id=int(workspace["id"]),
            rp_application_id=None,
            role=RP_ADMIN_ROLE,
        )

        with _mock_service_dependencies() as mocks:
            mocks.workspaces.get = AsyncMock(return_value=workspace)
            mocks.invitations.create = AsyncMock(return_value=created_invitation)

            result = await service.create_developer_invitation(
                db=mock_db,
                workspace_uuid=workspace["uuid"],
                rp_application_uuid=None,
                current_user=_cl_admin_user(),
                invited_email="invitee@example.gc.ca",
                role=RP_ADMIN_ROLE,
                invite_expires_at=datetime.now(UTC) + timedelta(days=5),
            )

        created_payload = mocks.invitations.create.call_args.kwargs["object"]
        assert created_payload.workspace_id == workspace["id"]
        assert created_payload.rp_application_id is None
        assert result["rp_application_id"] is None
        mocks.applications.get.assert_not_awaited()
        mock_db.commit.assert_awaited_once()

    @pytest.mark.asyncio
    @pytest.mark.parametrize("delegated_role", [RP_USER_EDIT_ROLE, READ_ONLY_ROLE])
    async def test_create_normalizes_email_hashes_token_and_records_delegated_grant(self, mock_db, delegated_role) -> None:
        service = RPApplicationDeveloperInvitationService()
        workspace = _workspace_record()
        rp_application = _rp_application_record(int(workspace["id"]))
        delegated_grant = _access_grant_record(
            workspace_id=int(workspace["id"]),
            user_id=51,
            role=RP_ADMIN_ROLE,
        )
        created_invitation = _invitation_record(
            workspace_id=int(workspace["id"]),
            rp_application_id=int(rp_application["id"]),
            role=delegated_role,
        )
        actor = _partner_user(workspace)

        with (
            _mock_service_dependencies() as mocks,
            patch(
                "src.app.services.rp_application_developer_invitation_service.secrets.token_urlsafe",
                return_value="raw-token-value",
            ),
        ):
            _configure_context(mocks, workspace, rp_application)
            mocks.grants.get = AsyncMock(return_value=delegated_grant)
            mocks.invitations.create = AsyncMock(return_value=created_invitation)

            result = await service.create_developer_invitation(
                db=mock_db,
                workspace_uuid=workspace["uuid"],
                rp_application_uuid=rp_application["uuid"],
                current_user=actor,
                invited_email=" Invitee@Example.GC.CA ",
                role=delegated_role,
                invite_expires_at=datetime.now(UTC) + timedelta(days=5),
            )

        created_payload = mocks.invitations.create.call_args.kwargs["object"]
        assert created_payload.invited_email == "invitee@example.gc.ca"
        assert created_payload.role == delegated_role
        assert created_payload.delegated_by_grant_uuid == delegated_grant["uuid"]
        assert created_payload.token_hash != "raw-token-value"
        assert mocks.invitations.create.call_args.kwargs["commit"] is False
        mock_db.commit.assert_awaited_once()
        assert result["acceptance_url"] == (f"{settings.RP_APPLICATION_INVITE_URL_BASE}/raw-token-value")
        audit_log = _audit_logs(mock_db)[0]
        assert audit_log.operation == "invite_create"
        assert audit_log.user_uuid == actor["uuid"]
        assert "invitee@example.gc.ca" not in audit_log.description
        assert "raw-token-value" not in audit_log.description

    @pytest.mark.asyncio
    async def test_cl_admin_can_bootstrap_rp_admin_without_delegation_provenance(self, mock_db) -> None:
        service = RPApplicationDeveloperInvitationService()
        workspace = _workspace_record()
        rp_application = _rp_application_record(int(workspace["id"]))
        created_invitation = _invitation_record(
            workspace_id=int(workspace["id"]),
            rp_application_id=int(rp_application["id"]),
            role=RP_ADMIN_ROLE,
        )

        with _mock_service_dependencies() as mocks:
            _configure_context(mocks, workspace, rp_application)
            mocks.invitations.create = AsyncMock(return_value=created_invitation)

            await service.create_developer_invitation(
                db=mock_db,
                workspace_uuid=workspace["uuid"],
                rp_application_uuid=rp_application["uuid"],
                current_user=_cl_admin_user(),
                invited_email="invitee@example.gc.ca",
                role=RP_ADMIN_ROLE,
                invite_expires_at=datetime.now(UTC) + timedelta(days=5),
            )

        created_payload = mocks.invitations.create.call_args.kwargs["object"]
        assert created_payload.role == RP_ADMIN_ROLE
        assert created_payload.delegated_by_grant_uuid is None

    @pytest.mark.asyncio
    async def test_existing_active_identity_uses_role_assignment_not_invitation(
        self,
        mock_db,
    ) -> None:
        service = RPApplicationDeveloperInvitationService()
        workspace = _workspace_record()

        with _mock_service_dependencies() as mocks:
            mocks.workspaces.get = AsyncMock(return_value=workspace)
            mocks.users.get = AsyncMock(return_value={"id": 73, "enabled": True, "is_deleted": False})

            with pytest.raises(DuplicateValueException, match="use role assignment"):
                await service.create_developer_invitation(
                    db=mock_db,
                    workspace_uuid=workspace["uuid"],
                    rp_application_uuid=None,
                    current_user=_cl_admin_user(),
                    invited_email="invitee@example.gc.ca",
                    role=READ_ONLY_ROLE,
                    invite_expires_at=datetime.now(UTC) + timedelta(days=5),
                )

        mocks.invitations.create.assert_not_awaited()
        mock_db.rollback.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_disabled_identity_is_not_reinvited(
        self,
        mock_db,
    ) -> None:
        service = RPApplicationDeveloperInvitationService()
        workspace = _workspace_record()

        with _mock_service_dependencies() as mocks:
            mocks.workspaces.get = AsyncMock(return_value=workspace)
            mocks.users.get = AsyncMock(return_value={"id": 73, "enabled": False, "is_deleted": False})

            with pytest.raises(BadRequestException, match="not eligible"):
                await service.create_developer_invitation(
                    db=mock_db,
                    workspace_uuid=workspace["uuid"],
                    rp_application_uuid=None,
                    current_user=_cl_admin_user(),
                    invited_email="invitee@example.gc.ca",
                    role=READ_ONLY_ROLE,
                    invite_expires_at=datetime.now(UTC) + timedelta(days=5),
                )

        mocks.invitations.create.assert_not_awaited()
        mock_db.rollback.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_duplicate_pending_is_scoped_to_email_and_workspace_not_application(self, mock_db) -> None:
        service = RPApplicationDeveloperInvitationService()
        workspace = _workspace_record()
        rp_application = _rp_application_record(int(workspace["id"]))
        other_application_invitation = _invitation_record(
            workspace_id=int(workspace["id"]),
            rp_application_id=30,
        )

        with _mock_service_dependencies() as mocks:
            _configure_context(mocks, workspace, rp_application)
            mocks.invitations.get_multi = AsyncMock(return_value={"data": [other_application_invitation]})

            with pytest.raises(DuplicateValueException, match="active invitation"):
                await service.create_developer_invitation(
                    db=mock_db,
                    workspace_uuid=workspace["uuid"],
                    rp_application_uuid=rp_application["uuid"],
                    current_user=_cl_admin_user(),
                    invited_email="INVITEE@example.gc.ca",
                    role=READ_ONLY_ROLE,
                    invite_expires_at=datetime.now(UTC) + timedelta(days=5),
                )

        query = mocks.invitations.get_multi.call_args.kwargs
        assert query["workspace_id"] == workspace["id"]
        assert query["invited_email__ilike"] == "invitee@example.gc.ca"
        assert "rp_application_id" not in query
        mocks.invitations.create.assert_not_awaited()
        mock_db.rollback.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_existing_active_grant_blocks_invitation_creation(self, mock_db) -> None:
        service = RPApplicationDeveloperInvitationService()
        workspace = _workspace_record()
        rp_application = _rp_application_record(int(workspace["id"]))
        existing_grant = _access_grant_record(workspace_id=int(workspace["id"]), user_id=73)

        with _mock_service_dependencies() as mocks:
            _configure_context(mocks, workspace, rp_application)
            mocks.users.get = AsyncMock(return_value={"id": 73})
            mocks.grants.get = AsyncMock(return_value=existing_grant)

            with pytest.raises(DuplicateValueException, match="use role replacement"):
                await service.create_developer_invitation(
                    db=mock_db,
                    workspace_uuid=workspace["uuid"],
                    rp_application_uuid=rp_application["uuid"],
                    current_user=_cl_admin_user(),
                    invited_email="invitee@example.gc.ca",
                    role=RP_USER_EDIT_ROLE,
                    invite_expires_at=datetime.now(UTC) + timedelta(days=5),
                )

        mocks.invitations.create.assert_not_awaited()
        lifecycle_lock, target_lock = mock_db.execute.await_args_list[:2]
        assert lifecycle_lock.args[1] == {"lock_key": (f"rp-developer-invitation:{workspace['id']}:invitee@example.gc.ca")}
        assert target_lock.args[1] == {"lock_key": "authorization:target-user:73"}

    @pytest.mark.asyncio
    async def test_rp_admin_cannot_assign_rp_admin(self, mock_db) -> None:
        service = RPApplicationDeveloperInvitationService()
        workspace = _workspace_record()
        rp_application = _rp_application_record(int(workspace["id"]))
        delegated_grant = _access_grant_record(workspace_id=int(workspace["id"]), user_id=51, role=RP_ADMIN_ROLE)

        with _mock_service_dependencies() as mocks:
            _configure_context(mocks, workspace, rp_application)
            mocks.grants.get = AsyncMock(return_value=delegated_grant)

            with pytest.raises(ForbiddenException, match="Only CL Admin can assign the RP Admin role"):
                await service.create_developer_invitation(
                    db=mock_db,
                    workspace_uuid=workspace["uuid"],
                    rp_application_uuid=rp_application["uuid"],
                    current_user=_partner_user(workspace),
                    invited_email="invitee@example.gc.ca",
                    role=RP_ADMIN_ROLE,
                    invite_expires_at=datetime.now(UTC) + timedelta(days=5),
                )

    @pytest.mark.asyncio
    async def test_legacy_superuser_flag_is_not_invitation_authority(self, mock_db) -> None:
        service = RPApplicationDeveloperInvitationService()
        workspace = _workspace_record()
        rp_application = _rp_application_record(int(workspace["id"]))

        with _mock_service_dependencies() as mocks:
            _configure_context(mocks, workspace, rp_application)

            with pytest.raises(ForbiddenException, match="Canonical authorization state"):
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
    async def test_display_label_role_is_rejected(self, mock_db) -> None:
        service = RPApplicationDeveloperInvitationService()
        workspace = _workspace_record()
        rp_application = _rp_application_record(int(workspace["id"]))

        with _mock_service_dependencies() as mocks:
            _configure_context(mocks, workspace, rp_application)

            with pytest.raises(BadRequestException, match="Unsupported invitation role"):
                await service.create_developer_invitation(
                    db=mock_db,
                    workspace_uuid=workspace["uuid"],
                    rp_application_uuid=rp_application["uuid"],
                    current_user=_cl_admin_user(),
                    invited_email="invitee@example.gc.ca",
                    role="Read Only",
                    invite_expires_at=datetime.now(UTC) + timedelta(days=5),
                )

    @pytest.mark.asyncio
    async def test_out_of_scope_rp_admin_is_non_confirming_before_resource_lookups(
        self,
        mock_db,
    ) -> None:
        service = RPApplicationDeveloperInvitationService()
        target_workspace = _workspace_record()
        actor_workspace = _workspace_record()
        actor_workspace["id"] = 18
        rp_application = _rp_application_record(int(target_workspace["id"]))

        with _mock_service_dependencies() as mocks:
            _configure_context(mocks, target_workspace, rp_application)

            for requested_workspace_uuid in (
                target_workspace["uuid"],
                uuid4(),
            ):
                with pytest.raises(NotFoundException, match="Workspace not found"):
                    await service.reissue_developer_invitation(
                        db=mock_db,
                        workspace_uuid=requested_workspace_uuid,
                        rp_application_uuid=rp_application["uuid"],
                        invitation_uuid=uuid4(),
                        current_user=_partner_user(actor_workspace),
                        invite_expires_at=datetime.now(UTC) + timedelta(days=5),
                    )

        mocks.workspaces.get.assert_not_awaited()
        mocks.applications.get.assert_not_awaited()
        mocks.invitations.get.assert_not_awaited()


class TestInvitationTransitions:
    @pytest.mark.asyncio
    async def test_focused_workspace_invitation_revalidates_parent_and_role_scope(
        self,
        mock_db,
    ) -> None:
        service = RPApplicationDeveloperInvitationService()
        workspace = _workspace_record()
        lower_role_invitation = _invitation_record(
            workspace_id=int(workspace["id"]),
            rp_application_id=None,
            role=READ_ONLY_ROLE,
        )

        with _mock_service_dependencies() as mocks:
            mocks.workspaces.get = AsyncMock(return_value=workspace)
            mocks.grants.get = AsyncMock(
                return_value=_access_grant_record(
                    workspace_id=int(workspace["id"]),
                    user_id=51,
                    role=RP_ADMIN_ROLE,
                )
            )
            mocks.invitations.get = AsyncMock(return_value=lower_role_invitation)

            result = await service.get_developer_invitation(
                db=mock_db,
                workspace_uuid=workspace["uuid"],
                invitation_uuid=lower_role_invitation["uuid"],
                current_user=_partner_user(workspace),
            )

        assert result["uuid"] == lower_role_invitation["uuid"]
        assert mocks.invitations.get.await_args.kwargs["workspace_id"] == workspace["id"]
        assert mocks.invitations.get.await_args.kwargs["uuid"] == lower_role_invitation["uuid"]

    @pytest.mark.asyncio
    async def test_focused_workspace_invitation_hides_an_unmanageable_rp_admin_record(
        self,
        mock_db,
    ) -> None:
        service = RPApplicationDeveloperInvitationService()
        workspace = _workspace_record()
        rp_admin_invitation = _invitation_record(
            workspace_id=int(workspace["id"]),
            rp_application_id=None,
            role=RP_ADMIN_ROLE,
        )

        with _mock_service_dependencies() as mocks:
            mocks.workspaces.get = AsyncMock(return_value=workspace)
            mocks.grants.get = AsyncMock(
                return_value=_access_grant_record(
                    workspace_id=int(workspace["id"]),
                    user_id=51,
                    role=RP_ADMIN_ROLE,
                )
            )
            mocks.invitations.get = AsyncMock(return_value=rp_admin_invitation)

            with pytest.raises(NotFoundException, match="Developer invitation not found"):
                await service.get_developer_invitation(
                    db=mock_db,
                    workspace_uuid=workspace["uuid"],
                    invitation_uuid=rp_admin_invitation["uuid"],
                    current_user=_partner_user(workspace),
                )

    @pytest.mark.asyncio
    async def test_list_marks_expired_pending_invitation(self, mock_db) -> None:
        service = RPApplicationDeveloperInvitationService()
        workspace = _workspace_record()
        rp_application = _rp_application_record(int(workspace["id"]))
        expired_invitation = _invitation_record(
            workspace_id=int(workspace["id"]),
            rp_application_id=int(rp_application["id"]),
            role=RP_USER_EDIT_ROLE,
            invite_expires_at=datetime.now(UTC) - timedelta(minutes=1),
        )

        with _mock_service_dependencies() as mocks:
            _configure_context(mocks, workspace, rp_application)
            mocks.invitations.get_multi = AsyncMock(return_value={"data": [expired_invitation]})

            result = await service.list_developer_invitations(
                db=mock_db,
                workspace_uuid=workspace["uuid"],
                rp_application_uuid=rp_application["uuid"],
                current_user=_cl_admin_user(),
            )

        assert result[0]["status"] == EXPIRED_INVITATION_STATUS
        expiration_update = mocks.invitations.update.call_args.kwargs["object"]
        assert expiration_update["status"] == EXPIRED_INVITATION_STATUS
        audit_log = _audit_logs(mock_db)[0]
        assert audit_log.operation == "invite_expire"
        assert audit_log.user_uuid is None

    @pytest.mark.asyncio
    async def test_revoke_pending_records_reason_and_time(self, mock_db) -> None:
        service = RPApplicationDeveloperInvitationService()
        workspace = _workspace_record()
        rp_application = _rp_application_record(int(workspace["id"]))
        invitation = _invitation_record(
            workspace_id=int(workspace["id"]),
            rp_application_id=int(rp_application["id"]),
        )
        actor = _cl_admin_user()

        with _mock_service_dependencies() as mocks:
            _configure_context(mocks, workspace, rp_application)
            mocks.invitations.get = AsyncMock(return_value=invitation)

            result = await service.revoke_developer_invitation(
                db=mock_db,
                workspace_uuid=workspace["uuid"],
                rp_application_uuid=rp_application["uuid"],
                invitation_uuid=invitation["uuid"],
                current_user=actor,
            )

        update = mocks.invitations.update.call_args.kwargs
        assert update["object"]["status"] == REVOKED_INVITATION_STATUS
        assert update["object"]["revocation_reason"] == "revoked_by_authorized_actor"
        assert update["object"]["revoked_by_user_id"] == actor["id"]
        assert update["object"]["revocation_actor_source"] == "user"
        assert update["commit"] is False
        assert result["revoked_at"] is not None
        audit_log = _audit_logs(mock_db)[0]
        assert audit_log.operation == "invite_revoke"
        assert audit_log.user_uuid == actor["uuid"]
        mock_db.commit.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_accepted_invitation_cannot_be_revoked(self, mock_db) -> None:
        service = RPApplicationDeveloperInvitationService()
        workspace = _workspace_record()
        rp_application = _rp_application_record(int(workspace["id"]))
        invitation = _invitation_record(
            workspace_id=int(workspace["id"]),
            rp_application_id=int(rp_application["id"]),
            status=ACCEPTED_INVITATION_STATUS,
        )

        with _mock_service_dependencies() as mocks:
            _configure_context(mocks, workspace, rp_application)
            mocks.invitations.get = AsyncMock(return_value=invitation)

            with pytest.raises(BadRequestException, match="cannot be revoked"):
                await service.revoke_developer_invitation(
                    db=mock_db,
                    workspace_uuid=workspace["uuid"],
                    rp_application_uuid=rp_application["uuid"],
                    invitation_uuid=invitation["uuid"],
                    current_user=_cl_admin_user(),
                )

        mocks.invitations.update.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_rp_admin_reissue_hides_non_delegable_invitation_role(
        self,
        mock_db,
    ) -> None:
        service = RPApplicationDeveloperInvitationService()
        workspace = _workspace_record()
        rp_application = _rp_application_record(int(workspace["id"]))
        invitation = _invitation_record(
            workspace_id=int(workspace["id"]),
            rp_application_id=int(rp_application["id"]),
            role=RP_ADMIN_ROLE,
        )
        delegated_grant = _access_grant_record(
            workspace_id=int(workspace["id"]),
            user_id=51,
            role=RP_ADMIN_ROLE,
        )

        with _mock_service_dependencies() as mocks:
            _configure_context(mocks, workspace, rp_application)
            mocks.grants.get = AsyncMock(return_value=delegated_grant)
            mocks.invitations.get = AsyncMock(return_value=invitation)

            with pytest.raises(
                NotFoundException,
                match="Developer invitation not found",
            ):
                await service.reissue_developer_invitation(
                    db=mock_db,
                    workspace_uuid=workspace["uuid"],
                    rp_application_uuid=rp_application["uuid"],
                    invitation_uuid=invitation["uuid"],
                    current_user=_partner_user(workspace),
                    invite_expires_at=datetime.now(UTC) + timedelta(days=5),
                )

        mocks.invitations.update.assert_not_awaited()
        mocks.invitations.create.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_reissue_pending_revokes_then_links_replacement_atomically(self, mock_db) -> None:
        service = RPApplicationDeveloperInvitationService()
        workspace = _workspace_record()
        rp_application = _rp_application_record(int(workspace["id"]))
        invitation = _invitation_record(
            workspace_id=int(workspace["id"]),
            rp_application_id=int(rp_application["id"]),
            role=RP_USER_EDIT_ROLE,
        )
        replacement = _invitation_record(
            workspace_id=int(workspace["id"]),
            rp_application_id=int(rp_application["id"]),
            role=RP_USER_EDIT_ROLE,
        )
        actor = _cl_admin_user()

        with (
            _mock_service_dependencies() as mocks,
            patch(
                "src.app.services.rp_application_developer_invitation_service.secrets.token_urlsafe",
                return_value="fresh-token",
            ),
        ):
            _configure_context(mocks, workspace, rp_application)
            mocks.invitations.get = AsyncMock(return_value=invitation)
            mocks.invitations.get_multi = AsyncMock(return_value={"data": [invitation]})
            mocks.invitations.create = AsyncMock(return_value=replacement)

            result = await service.reissue_developer_invitation(
                db=mock_db,
                workspace_uuid=workspace["uuid"],
                rp_application_uuid=rp_application["uuid"],
                invitation_uuid=invitation["uuid"],
                current_user=actor,
                invite_expires_at=datetime.now(UTC) + timedelta(days=10),
            )

        first_update = mocks.invitations.update.await_args_list[0].kwargs
        lineage_update = mocks.invitations.update.await_args_list[1].kwargs
        assert first_update["object"]["status"] == REVOKED_INVITATION_STATUS
        assert first_update["object"]["revocation_reason"] == "reissued"
        assert first_update["object"]["revoked_by_user_id"] == actor["id"]
        assert first_update["object"]["revocation_actor_source"] == "user"
        assert lineage_update["object"]["replaced_by_invitation_uuid"] == replacement["uuid"]
        assert first_update["commit"] is False
        assert lineage_update["commit"] is False
        assert mocks.invitations.create.call_args.kwargs["commit"] is False
        mock_db.commit.assert_awaited_once()
        assert result["acceptance_url"].endswith("/fresh-token")
        audit_logs = _audit_logs(mock_db)
        assert [audit_log.operation for audit_log in audit_logs] == [
            "invite_reissue",
            "invite_reissue",
        ]
        assert all(audit_log.user_uuid == actor["uuid"] for audit_log in audit_logs)
        assert all("fresh-token" not in audit_log.description for audit_log in audit_logs)

    @pytest.mark.asyncio
    async def test_reissue_expired_creates_new_record_without_replacement_link(self, mock_db) -> None:
        service = RPApplicationDeveloperInvitationService()
        workspace = _workspace_record()
        rp_application = _rp_application_record(int(workspace["id"]))
        expired_invitation = _invitation_record(
            workspace_id=int(workspace["id"]),
            rp_application_id=int(rp_application["id"]),
            status=EXPIRED_INVITATION_STATUS,
        )
        replacement = _invitation_record(
            workspace_id=int(workspace["id"]),
            rp_application_id=int(rp_application["id"]),
        )

        with _mock_service_dependencies() as mocks:
            _configure_context(mocks, workspace, rp_application)
            mocks.invitations.get = AsyncMock(return_value=expired_invitation)
            mocks.invitations.get_multi = AsyncMock(return_value={"data": [expired_invitation]})
            mocks.invitations.create = AsyncMock(return_value=replacement)

            result = await service.reissue_developer_invitation(
                db=mock_db,
                workspace_uuid=workspace["uuid"],
                rp_application_uuid=rp_application["uuid"],
                invitation_uuid=expired_invitation["uuid"],
                current_user=_cl_admin_user(),
                invite_expires_at=datetime.now(UTC) + timedelta(days=10),
            )

        assert result["uuid"] == replacement["uuid"]
        mocks.invitations.create.assert_awaited_once()
        mocks.invitations.update.assert_not_awaited()
        mock_db.commit.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_concurrent_reissue_conflicts_with_other_pending_record(self, mock_db) -> None:
        service = RPApplicationDeveloperInvitationService()
        workspace = _workspace_record()
        rp_application = _rp_application_record(int(workspace["id"]))
        invitation = _invitation_record(
            workspace_id=int(workspace["id"]),
            rp_application_id=int(rp_application["id"]),
            status=REVOKED_INVITATION_STATUS,
        )
        competing_pending = _invitation_record(
            workspace_id=int(workspace["id"]),
            rp_application_id=30,
        )

        with _mock_service_dependencies() as mocks:
            _configure_context(mocks, workspace, rp_application)
            mocks.invitations.get = AsyncMock(return_value=invitation)
            mocks.invitations.get_multi = AsyncMock(return_value={"data": [invitation, competing_pending]})

            with pytest.raises(DuplicateValueException, match="active invitation"):
                await service.reissue_developer_invitation(
                    db=mock_db,
                    workspace_uuid=workspace["uuid"],
                    rp_application_uuid=rp_application["uuid"],
                    invitation_uuid=invitation["uuid"],
                    current_user=_cl_admin_user(),
                    invite_expires_at=datetime.now(UTC) + timedelta(days=10),
                )

        mocks.invitations.create.assert_not_awaited()
        mock_db.rollback.assert_awaited_once()
        lock_sql = str(mock_db.execute.call_args.args[0])
        assert "pg_advisory_xact_lock" in lock_sql

    @pytest.mark.asyncio
    async def test_reissue_integrity_collision_rolls_back_old_transition(self, mock_db) -> None:
        service = RPApplicationDeveloperInvitationService()
        workspace = _workspace_record()
        rp_application = _rp_application_record(int(workspace["id"]))
        invitation = _invitation_record(
            workspace_id=int(workspace["id"]),
            rp_application_id=int(rp_application["id"]),
        )

        with _mock_service_dependencies() as mocks:
            _configure_context(mocks, workspace, rp_application)
            mocks.invitations.get = AsyncMock(return_value=invitation)
            mocks.invitations.get_multi = AsyncMock(return_value={"data": [invitation]})
            mocks.invitations.create = AsyncMock(side_effect=IntegrityError("INSERT", {}, RuntimeError("duplicate")))

            with pytest.raises(DuplicateValueException, match="active invitation"):
                await service.reissue_developer_invitation(
                    db=mock_db,
                    workspace_uuid=workspace["uuid"],
                    rp_application_uuid=rp_application["uuid"],
                    invitation_uuid=invitation["uuid"],
                    current_user=_cl_admin_user(),
                    invite_expires_at=datetime.now(UTC) + timedelta(days=10),
                )

        mock_db.rollback.assert_awaited_once()
        mock_db.commit.assert_not_awaited()


class TestInvitationAcceptance:
    @pytest.mark.asyncio
    async def test_workspace_only_invitation_accepts_without_application_lookup(
        self,
        mock_db,
    ) -> None:
        service = RPApplicationDeveloperInvitationService()
        workspace = _workspace_record()
        invitation = _invitation_record(
            workspace_id=int(workspace["id"]),
            rp_application_id=None,
        )
        created_grant = _access_grant_record(
            workspace_id=int(workspace["id"]),
            user_id=51,
            source_invitation_uuid=invitation["uuid"],
        )

        with _mock_service_dependencies() as mocks:
            mocks.workspaces.get = AsyncMock(return_value=workspace)
            mocks.invitations.get = AsyncMock(return_value=invitation)
            mocks.grants.create = AsyncMock(return_value=created_grant)

            result = await service.accept_developer_invitation(
                db=mock_db,
                token="workspace-only-token",
                current_user=_unassigned_user(),
            )

        assert result["access_grant"]["source_invitation_uuid"] == invitation["uuid"]
        assert result["next_destination"] == f"/workspaces/{workspace['uuid']}"
        mocks.applications.get.assert_not_awaited()
        mock_db.commit.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_unknown_token_is_rejected_before_lifecycle_lock_or_mutation(self, mock_db) -> None:
        service = RPApplicationDeveloperInvitationService()

        with _mock_service_dependencies() as mocks:
            with pytest.raises(NotFoundException, match="Developer invitation not found"):
                await service.accept_developer_invitation(
                    db=mock_db,
                    token="unknown-token",
                    current_user=_unassigned_user(),
                )

        mock_db.execute.assert_not_awaited()
        mocks.grants.create.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_first_accept_validates_scope_creates_lineage_and_accepts_atomically(self, mock_db) -> None:
        service = RPApplicationDeveloperInvitationService()
        workspace = _workspace_record()
        rp_application = _rp_application_record(int(workspace["id"]))
        invitation = _invitation_record(
            workspace_id=int(workspace["id"]),
            rp_application_id=int(rp_application["id"]),
        )
        created_grant = _access_grant_record(
            workspace_id=int(workspace["id"]),
            user_id=51,
            source_invitation_uuid=invitation["uuid"],
        )
        target = _unassigned_user()

        with _mock_service_dependencies() as mocks:
            _configure_context(mocks, workspace, rp_application)
            mocks.invitations.get = AsyncMock(return_value=invitation)
            mocks.grants.create = AsyncMock(return_value=created_grant)

            result = await service.accept_developer_invitation(
                db=mock_db,
                token="token-to-accept",
                current_user=target,
            )

        grant_payload = mocks.grants.create.call_args.kwargs["object"]
        invitation_update = mocks.invitations.update.call_args.kwargs
        assert grant_payload.workspace_id == workspace["id"]
        assert grant_payload.role == CanonicalRoleCode.READ_ONLY.value
        assert grant_payload.source_invitation_uuid == invitation["uuid"]
        assert mocks.grants.create.call_args.kwargs["commit"] is False
        assert invitation_update["object"]["status"] == ACCEPTED_INVITATION_STATUS
        assert invitation_update["commit"] is False
        assert result["invitation"]["status"] == ACCEPTED_INVITATION_STATUS
        mock_db.commit.assert_awaited_once()
        audit_log = _audit_logs(mock_db)[0]
        assert audit_log.operation == "invite_accept"
        assert audit_log.user_uuid == target["uuid"]
        assert "token-to-accept" not in audit_log.description
        lifecycle_lock, target_lock = mock_db.execute.await_args_list[:2]
        assert lifecycle_lock.args[1]["lock_key"].startswith("rp-developer-invitation:")
        assert target_lock.args[1] == {"lock_key": "authorization:target-user:51"}

    @pytest.mark.asyncio
    async def test_pending_accept_rechecks_canonical_state_after_target_lock(self, mock_db) -> None:
        service = RPApplicationDeveloperInvitationService()
        workspace = _workspace_record()
        rp_application = _rp_application_record(int(workspace["id"]))
        invitation = _invitation_record(
            workspace_id=int(workspace["id"]),
            rp_application_id=int(rp_application["id"]),
        )

        with _mock_service_dependencies() as mocks:
            _configure_context(mocks, workspace, rp_application)
            mocks.invitations.get = AsyncMock(return_value=invitation)
            mocks.authorization_resolve.return_value = ResolvedAuthorizationState(global_role=CanonicalRoleCode.CL_ADMIN)

            with pytest.raises(DuplicateValueException, match="active canonical role"):
                await service.accept_developer_invitation(
                    db=mock_db,
                    token="assignment-race-token",
                    current_user=_unassigned_user(),
                )

        mocks.authorization_resolve.assert_awaited_once_with(mock_db, user_id=51)
        mocks.grants.create.assert_not_awaited()
        mocks.invitations.update.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_accepted_replay_returns_matching_lineage_without_restoring_old_role(self, mock_db) -> None:
        service = RPApplicationDeveloperInvitationService()
        workspace = _workspace_record()
        rp_application = _rp_application_record(int(workspace["id"]))
        invitation = _invitation_record(
            workspace_id=int(workspace["id"]),
            rp_application_id=int(rp_application["id"]),
            status=ACCEPTED_INVITATION_STATUS,
            role=READ_ONLY_ROLE,
        )
        changed_grant = _access_grant_record(
            workspace_id=int(workspace["id"]),
            user_id=51,
            role=RP_USER_EDIT_ROLE,
            source_invitation_uuid=invitation["uuid"],
        )

        with _mock_service_dependencies() as mocks:
            _configure_context(mocks, workspace, rp_application)
            mocks.invitations.get = AsyncMock(return_value=invitation)
            mocks.grants.get = AsyncMock(return_value=changed_grant)

            result = await service.accept_developer_invitation(
                db=mock_db,
                token="accepted-token",
                current_user=_partner_user(
                    workspace,
                    email="invitee@example.gc.ca",
                    role=CanonicalRoleCode.RP_USER_EDIT,
                ),
            )

        assert result["access_grant"]["role"] == RP_USER_EDIT_ROLE
        mocks.grants.create.assert_not_awaited()
        mocks.invitations.update.assert_not_awaited()
        mock_db.commit.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_accepted_replay_rejects_mismatched_lineage_without_mutation(self, mock_db) -> None:
        service = RPApplicationDeveloperInvitationService()
        workspace = _workspace_record()
        rp_application = _rp_application_record(int(workspace["id"]))
        invitation = _invitation_record(
            workspace_id=int(workspace["id"]),
            rp_application_id=int(rp_application["id"]),
            status=ACCEPTED_INVITATION_STATUS,
        )
        unrelated_grant = _access_grant_record(workspace_id=int(workspace["id"]), user_id=51, source_invitation_uuid=uuid4())

        with _mock_service_dependencies() as mocks:
            _configure_context(mocks, workspace, rp_application)
            mocks.invitations.get = AsyncMock(return_value=invitation)
            mocks.grants.get = AsyncMock(return_value=unrelated_grant)

            with pytest.raises(DuplicateValueException, match="lineage"):
                await service.accept_developer_invitation(
                    db=mock_db,
                    token="accepted-token",
                    current_user=_partner_user(
                        workspace,
                        email="invitee@example.gc.ca",
                        role=CanonicalRoleCode.READ_ONLY,
                    ),
                )

        mocks.grants.create.assert_not_awaited()
        mocks.invitations.update.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_pending_accept_rejects_existing_active_grant_without_re_role(self, mock_db) -> None:
        service = RPApplicationDeveloperInvitationService()
        workspace = _workspace_record()
        rp_application = _rp_application_record(int(workspace["id"]))
        invitation = _invitation_record(
            workspace_id=int(workspace["id"]),
            rp_application_id=int(rp_application["id"]),
            role=RP_ADMIN_ROLE,
        )
        existing_grant = _access_grant_record(
            workspace_id=int(workspace["id"]),
            user_id=51,
            role=READ_ONLY_ROLE,
        )

        with _mock_service_dependencies() as mocks:
            _configure_context(mocks, workspace, rp_application)
            mocks.invitations.get = AsyncMock(return_value=invitation)
            mocks.grants.get = AsyncMock(return_value=existing_grant)

            with pytest.raises(DuplicateValueException, match="use role replacement"):
                await service.accept_developer_invitation(
                    db=mock_db,
                    token="collision-token",
                    current_user=_partner_user(
                        workspace,
                        email="invitee@example.gc.ca",
                        role=CanonicalRoleCode.READ_ONLY,
                    ),
                )

        mocks.grants.create.assert_not_awaited()
        mocks.invitations.update.assert_not_awaited()

    @pytest.mark.asyncio
    @pytest.mark.parametrize(
        ("status", "message"),
        [
            (REVOKED_INVITATION_STATUS, "revoked"),
            (EXPIRED_INVITATION_STATUS, "expired"),
        ],
    )
    async def test_inactive_token_never_mutates_grant(self, mock_db, status, message) -> None:
        service = RPApplicationDeveloperInvitationService()
        workspace = _workspace_record()
        rp_application = _rp_application_record(int(workspace["id"]))
        invitation = _invitation_record(
            workspace_id=int(workspace["id"]),
            rp_application_id=int(rp_application["id"]),
            status=status,
        )

        with _mock_service_dependencies() as mocks:
            _configure_context(mocks, workspace, rp_application)
            mocks.invitations.get = AsyncMock(return_value=invitation)

            with pytest.raises(BadRequestException, match=message):
                await service.accept_developer_invitation(
                    db=mock_db,
                    token="inactive-token",
                    current_user=_unassigned_user(),
                )

        mocks.grants.get.assert_not_awaited()
        mocks.grants.create.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_elapsed_pending_invitation_transitions_to_expired_before_rejection(self, mock_db) -> None:
        service = RPApplicationDeveloperInvitationService()
        workspace = _workspace_record()
        rp_application = _rp_application_record(int(workspace["id"]))
        invitation = _invitation_record(
            workspace_id=int(workspace["id"]),
            rp_application_id=int(rp_application["id"]),
            invite_expires_at=datetime.now(UTC) - timedelta(seconds=1),
        )

        with _mock_service_dependencies() as mocks:
            _configure_context(mocks, workspace, rp_application)
            mocks.invitations.get = AsyncMock(return_value=invitation)

            with pytest.raises(BadRequestException, match="expired"):
                await service.accept_developer_invitation(
                    db=mock_db,
                    token="elapsed-token",
                    current_user=_unassigned_user(),
                )

        expiration = mocks.invitations.update.call_args.kwargs
        assert expiration["object"]["status"] == EXPIRED_INVITATION_STATUS
        assert expiration["commit"] is False
        mocks.grants.create.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_email_mismatch_is_rejected_before_scope_or_grant_mutation(self, mock_db) -> None:
        service = RPApplicationDeveloperInvitationService()
        workspace = _workspace_record()
        rp_application = _rp_application_record(int(workspace["id"]))
        invitation = _invitation_record(
            workspace_id=int(workspace["id"]),
            rp_application_id=int(rp_application["id"]),
        )

        with _mock_service_dependencies() as mocks:
            _configure_context(mocks, workspace, rp_application)
            mocks.invitations.get = AsyncMock(return_value=invitation)

            with pytest.raises(ForbiddenException, match="email does not match"):
                await service.accept_developer_invitation(
                    db=mock_db,
                    token="identity-token",
                    current_user=_unassigned_user(email="other@example.gc.ca"),
                )

        mocks.grants.create.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_username_is_not_accepted_as_verified_invitation_email(self, mock_db) -> None:
        service = RPApplicationDeveloperInvitationService()
        workspace = _workspace_record()
        rp_application = _rp_application_record(int(workspace["id"]))
        invitation = _invitation_record(
            workspace_id=int(workspace["id"]),
            rp_application_id=int(rp_application["id"]),
        )

        with _mock_service_dependencies() as mocks:
            _configure_context(mocks, workspace, rp_application)
            mocks.invitations.get = AsyncMock(return_value=invitation)

            with pytest.raises(ForbiddenException, match="email does not match"):
                await service.accept_developer_invitation(
                    db=mock_db,
                    token="username-only-token",
                    current_user={
                        "id": 51,
                        "uuid": uuid4(),
                        "username": "invitee@example.gc.ca",
                        AUTHORIZATION_STATE_KEY: ResolvedAuthorizationState(),
                    },
                )

        mocks.grants.create.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_missing_application_scope_rejects_before_grant_mutation(self, mock_db) -> None:
        service = RPApplicationDeveloperInvitationService()
        workspace = _workspace_record()
        rp_application = _rp_application_record(int(workspace["id"]))
        invitation = _invitation_record(
            workspace_id=int(workspace["id"]),
            rp_application_id=int(rp_application["id"]),
        )

        with _mock_service_dependencies() as mocks:
            mocks.workspaces.get = AsyncMock(return_value=workspace)
            mocks.applications.get = AsyncMock(return_value=None)
            mocks.invitations.get = AsyncMock(return_value=invitation)

            with pytest.raises(NotFoundException, match="unavailable"):
                await service.accept_developer_invitation(
                    db=mock_db,
                    token="cross-scope-token",
                    current_user=_unassigned_user(),
                )

        mocks.grants.create.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_invalid_persisted_status_fails_closed_before_grant_mutation(self, mock_db) -> None:
        service = RPApplicationDeveloperInvitationService()
        invitation = _invitation_record(workspace_id=17, rp_application_id=29)
        invitation["status"] = "reopened"

        with _mock_service_dependencies() as mocks:
            mocks.invitations.get = AsyncMock(return_value=invitation)

            with pytest.raises(BadRequestException, match="Unsupported invitation status"):
                await service.accept_developer_invitation(
                    db=mock_db,
                    token="bad-state-token",
                    current_user=_unassigned_user(),
                )

        mocks.grants.create.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_concurrent_grant_collision_is_safe_conflict_and_rollback(self, mock_db) -> None:
        service = RPApplicationDeveloperInvitationService()
        workspace = _workspace_record()
        rp_application = _rp_application_record(int(workspace["id"]))
        invitation = _invitation_record(
            workspace_id=int(workspace["id"]),
            rp_application_id=int(rp_application["id"]),
        )

        with _mock_service_dependencies() as mocks:
            _configure_context(mocks, workspace, rp_application)
            mocks.invitations.get = AsyncMock(return_value=invitation)
            mocks.grants.create = AsyncMock(side_effect=IntegrityError("INSERT", {}, RuntimeError("duplicate")))

            with pytest.raises(DuplicateValueException, match="conflicts"):
                await service.accept_developer_invitation(
                    db=mock_db,
                    token="racing-token",
                    current_user=_unassigned_user(),
                )

        mocks.invitations.update.assert_not_awaited()
        mock_db.rollback.assert_awaited_once()


class TestPendingInvitationLookup:
    @pytest.mark.asyncio
    async def test_has_pending_invitation_normalizes_email(self, mock_db) -> None:
        service = RPApplicationDeveloperInvitationService()
        invitation = _invitation_record(workspace_id=17, rp_application_id=29)

        with _mock_service_dependencies() as mocks:
            mocks.invitations.get_multi = AsyncMock(return_value={"data": [invitation]})

            result = await service.has_pending_invitation_for_email(
                db=mock_db,
                invited_email="Invitee@Example.GC.CA",
            )

        assert result is True
        assert mocks.invitations.get_multi.call_args.kwargs["invited_email__ilike"] == ("invitee@example.gc.ca")
