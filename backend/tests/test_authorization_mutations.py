from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock, patch
from uuid import UUID

import pytest

from src.app.core.authorization import CanonicalRoleCode
from src.app.core.exceptions.http_exceptions import (
    BadRequestException,
    DuplicateValueException,
    ForbiddenException,
    NotFoundException,
)
from src.app.models.audit_log import AuditLog
from src.app.models.rp_application_access_grant import RPApplicationAccessGrant
from src.app.services.authorization_lock_service import (
    lock_authorization_target_user,
    lock_cl_admin_roster,
    lock_workspace_identity_then_target_user,
)
from src.app.services.authorization_service import (
    AuthorizationService,
    ResolvedAuthorizationState,
    ResolvedPartnerAccess,
)

WORKSPACE_UUID = UUID("018f6f83-0000-0000-0000-000000000201")
ACTOR_UUID = UUID("018f6f83-0000-0000-0000-000000000011")
TARGET_UUID = UUID("018f6f83-0000-0000-0000-000000000012")


def _result_with_scalar(value: object) -> Mock:
    result = Mock()
    result.scalars.return_value.one_or_none.return_value = value
    return result


@pytest.mark.asyncio
async def test_mutation_locks_use_transaction_scoped_postgresql_advisory_locks() -> None:
    db = Mock()
    db.execute = AsyncMock(return_value=Mock())
    await lock_cl_admin_roster(db)
    await lock_authorization_target_user(db, 42)
    await lock_workspace_identity_then_target_user(
        db,
        workspace_id=7,
        email=" Target@Example.GC.CA ",
        target_user_id=42,
    )

    roster_call, target_call, lifecycle_call, nested_target_call = db.execute.await_args_list
    assert "pg_advisory_xact_lock" in str(roster_call.args[0])
    assert roster_call.args[1] == {"lock_key": "authorization:cl-admin-roster"}
    assert "pg_advisory_xact_lock" in str(target_call.args[0])
    assert target_call.args[1] == {"lock_key": "authorization:target-user:42"}
    assert "pg_advisory_xact_lock" in str(lifecycle_call.args[0])
    assert lifecycle_call.args[1] == {"lock_key": "rp-developer-invitation:7:target@example.gc.ca"}
    assert nested_target_call.args[1] == {"lock_key": "authorization:target-user:42"}


@pytest.mark.asyncio
async def test_disabled_users_are_not_eligible_role_mutation_actors_or_targets() -> None:
    db = Mock()
    db.execute = AsyncMock(return_value=_result_with_scalar(None))

    with pytest.raises(NotFoundException, match="User not found"):
        await AuthorizationService()._require_active_user(db, 9)

    statement = str(db.execute.await_args.args[0])
    assert '"user".enabled IS true' in statement
    assert '"user".is_deleted IS false' in statement


@pytest.mark.asyncio
async def test_partner_assignment_rejects_mixed_global_state_without_writing() -> None:
    db = Mock()
    db.add = Mock()
    service = AuthorizationService()
    workspace = SimpleNamespace(id=7, uuid=WORKSPACE_UUID)
    actor = SimpleNamespace(id=11, uuid=ACTOR_UUID)
    target = SimpleNamespace(
        id=12,
        uuid=TARGET_UUID,
        email="target@example.gc.ca",
    )

    with (
        patch(
            "src.app.services.authorization_service.lock_workspace_identity_then_target_user",
            new=AsyncMock(),
        ) as lock_identity_and_target,
        patch.object(service, "_require_active_workspace", new=AsyncMock(return_value=workspace)),
        patch.object(
            service,
            "_require_partner_mutation_authority",
            new=AsyncMock(return_value=actor),
        ),
        patch.object(service, "_require_active_user", new=AsyncMock(return_value=target)),
        patch.object(
            service,
            "_ensure_no_pending_invitation_for_target",
            new=AsyncMock(),
        ) as ensure_no_pending,
        patch.object(
            service,
            "resolve_for_user",
            new=AsyncMock(return_value=ResolvedAuthorizationState(global_role=CanonicalRoleCode.CL_ADMIN)),
        ),
        pytest.raises(BadRequestException, match="cannot be combined"),
    ):
        await service.assign_partner_role(
            db,
            target_user_id=12,
            workspace_id=7,
            role=CanonicalRoleCode.READ_ONLY,
            assigned_by_user_id=11,
        )

    lock_identity_and_target.assert_awaited_once_with(
        db,
        workspace_id=7,
        email="target@example.gc.ca",
        target_user_id=12,
    )
    ensure_no_pending.assert_awaited_once_with(
        db,
        workspace_id=7,
        target_email="target@example.gc.ca",
    )
    db.add.assert_not_called()


@pytest.mark.asyncio
async def test_direct_partner_assignment_rejects_pending_invitation() -> None:
    db = Mock()
    db.execute = AsyncMock(return_value=_result_with_scalar(TARGET_UUID))

    with pytest.raises(DuplicateValueException, match="pending invitation"):
        await AuthorizationService()._ensure_no_pending_invitation_for_target(
            db,
            workspace_id=7,
            target_email=" Target@Example.GC.CA ",
        )

    statement = str(db.execute.await_args.args[0])
    assert "rp_application_developer_invitation" in statement
    assert "lower(btrim" in statement
    assert "status" in statement


@pytest.mark.asyncio
async def test_cl_admin_can_directly_manage_rp_admin_assignment() -> None:
    db = Mock()
    service = AuthorizationService()
    workspace = SimpleNamespace(id=7, uuid=WORKSPACE_UUID)
    actor = SimpleNamespace(id=11, uuid=ACTOR_UUID)

    with (
        patch.object(service, "_require_active_user", new=AsyncMock(return_value=actor)),
        patch.object(
            service,
            "resolve_for_user",
            new=AsyncMock(return_value=ResolvedAuthorizationState(global_role=CanonicalRoleCode.CL_ADMIN)),
        ),
    ):
        resolved_actor = await service._require_partner_mutation_authority(
            db,
            actor_user_id=11,
            workspace=workspace,
            managed_roles=frozenset({CanonicalRoleCode.RP_ADMIN}),
        )

    assert resolved_actor is actor


@pytest.mark.asyncio
async def test_same_workspace_rp_admin_can_manage_lower_partner_assignment() -> None:
    db = Mock()
    service = AuthorizationService()
    workspace = SimpleNamespace(id=7, uuid=WORKSPACE_UUID)
    actor = SimpleNamespace(id=11, uuid=ACTOR_UUID)
    actor_state = ResolvedAuthorizationState(
        partner_access=(
            ResolvedPartnerAccess(
                workspace_id=7,
                workspace_uuid=WORKSPACE_UUID,
                role=CanonicalRoleCode.RP_ADMIN,
            ),
        )
    )

    with (
        patch.object(service, "_require_active_user", new=AsyncMock(return_value=actor)),
        patch.object(
            service,
            "resolve_for_user",
            new=AsyncMock(return_value=actor_state),
        ),
    ):
        resolved_actor = await service._require_partner_mutation_authority(
            db,
            actor_user_id=11,
            workspace=workspace,
            managed_roles=frozenset({CanonicalRoleCode.RP_USER_EDIT}),
        )

    assert resolved_actor is actor


@pytest.mark.asyncio
async def test_partner_role_replacement_is_atomic_and_creates_new_history_row() -> None:
    db = Mock()
    db.add = Mock()
    db.flush = AsyncMock()
    service = AuthorizationService()
    workspace = SimpleNamespace(id=7, uuid=WORKSPACE_UUID)
    actor = SimpleNamespace(id=11, uuid=ACTOR_UUID)
    target = SimpleNamespace(id=12, uuid=TARGET_UUID)
    old_grant = SimpleNamespace(
        uuid=UUID("018f6f83-0000-0000-0000-000000000301"),
        status="active",
        revoked_at=None,
        revoked_by_user_id=None,
        updated_at=None,
    )
    target_state = ResolvedAuthorizationState(
        partner_access=(
            ResolvedPartnerAccess(
                workspace_id=7,
                workspace_uuid=WORKSPACE_UUID,
                role=CanonicalRoleCode.READ_ONLY,
            ),
        )
    )

    with (
        patch(
            "src.app.services.authorization_service.lock_authorization_target_user",
            new=AsyncMock(),
        ) as lock_target,
        patch.object(service, "_require_active_workspace", new=AsyncMock(return_value=workspace)),
        patch.object(service, "_require_active_user", new=AsyncMock(return_value=target)),
        patch.object(service, "resolve_for_user", new=AsyncMock(return_value=target_state)),
        patch.object(
            service,
            "_require_partner_mutation_authority",
            new=AsyncMock(return_value=actor),
        ),
        patch.object(
            service,
            "_get_active_partner_grant_for_update",
            new=AsyncMock(return_value=old_grant),
        ),
    ):
        replacement = await service.replace_partner_role(
            db,
            target_user_id=12,
            workspace_id=7,
            role=CanonicalRoleCode.RP_USER_EDIT,
            replaced_by_user_id=11,
        )

    lock_target.assert_awaited_once_with(db, 12)
    assert old_grant.status == "revoked"
    assert old_grant.revoked_by_user_id == 11
    assert old_grant.revoked_at == old_grant.updated_at
    assert replacement is not old_grant
    assert replacement.role == CanonicalRoleCode.RP_USER_EDIT.value
    assert replacement.status == "active"
    assert replacement.uuid != old_grant.uuid
    added_objects = [call.args[0] for call in db.add.call_args_list]
    assert replacement in added_objects
    assert sum(isinstance(item, AuditLog) for item in added_objects) == 2
    assert sum(isinstance(item, RPApplicationAccessGrant) for item in added_objects) == 1
    db.flush.assert_awaited_once()


@pytest.mark.asyncio
async def test_focused_partner_replacement_rejects_a_stale_assignment_uuid() -> None:
    db = Mock()
    db.add = Mock()
    db.flush = AsyncMock()
    service = AuthorizationService()
    workspace = SimpleNamespace(id=7, uuid=WORKSPACE_UUID)
    actor = SimpleNamespace(id=11, uuid=ACTOR_UUID)
    target = SimpleNamespace(id=12, uuid=TARGET_UUID)
    active_grant = SimpleNamespace(
        uuid=UUID("018f6f83-0000-0000-0000-000000000399"),
        status="active",
        revoked_at=None,
        revoked_by_user_id=None,
        updated_at=None,
    )
    target_state = ResolvedAuthorizationState(
        partner_access=(
            ResolvedPartnerAccess(
                workspace_id=7,
                workspace_uuid=WORKSPACE_UUID,
                role=CanonicalRoleCode.READ_ONLY,
            ),
        )
    )

    with (
        patch(
            "src.app.services.authorization_service.lock_authorization_target_user",
            new=AsyncMock(),
        ),
        patch.object(service, "_require_active_workspace", new=AsyncMock(return_value=workspace)),
        patch.object(service, "_require_active_user", new=AsyncMock(return_value=target)),
        patch.object(service, "resolve_for_user", new=AsyncMock(return_value=target_state)),
        patch.object(
            service,
            "_require_partner_mutation_authority",
            new=AsyncMock(return_value=actor),
        ),
        patch.object(
            service,
            "_get_active_partner_grant_for_update",
            new=AsyncMock(return_value=active_grant),
        ),
        pytest.raises(NotFoundException, match="Active partner role assignment not found"),
    ):
        await service.replace_partner_role(
            db,
            target_user_id=12,
            workspace_id=7,
            role=CanonicalRoleCode.RP_USER_EDIT,
            replaced_by_user_id=11,
            expected_assignment_uuid=UUID("018f6f83-0000-0000-0000-000000000301"),
        )

    assert active_grant.status == "active"
    db.add.assert_not_called()
    db.flush.assert_not_awaited()


@pytest.mark.asyncio
async def test_same_workspace_rp_admin_cannot_manage_rp_admin_assignment() -> None:
    db = Mock()
    service = AuthorizationService()
    workspace = SimpleNamespace(id=7, uuid=WORKSPACE_UUID)
    actor = SimpleNamespace(id=11, uuid=ACTOR_UUID)
    actor_state = ResolvedAuthorizationState(
        partner_access=(
            ResolvedPartnerAccess(
                workspace_id=7,
                workspace_uuid=WORKSPACE_UUID,
                role=CanonicalRoleCode.RP_ADMIN,
            ),
        )
    )

    with (
        patch.object(service, "_require_active_user", new=AsyncMock(return_value=actor)),
        patch.object(service, "resolve_for_user", new=AsyncMock(return_value=actor_state)),
        pytest.raises(ForbiddenException, match="Only CL Admin"),
    ):
        await service._require_partner_mutation_authority(
            db,
            actor_user_id=11,
            workspace=workspace,
            managed_roles=frozenset({CanonicalRoleCode.RP_ADMIN}),
        )


@pytest.mark.asyncio
async def test_last_admin_roster_counts_only_enabled_non_deleted_users() -> None:
    assignment = SimpleNamespace(user_id=12)
    roster_result = Mock()
    roster_result.scalars.return_value.all.return_value = [assignment]
    db = Mock()
    db.execute = AsyncMock(return_value=roster_result)
    db.flush = AsyncMock()
    db.add = Mock()
    actor = SimpleNamespace(id=11, uuid=ACTOR_UUID)
    target = SimpleNamespace(id=12, uuid=TARGET_UUID)
    service = AuthorizationService()

    with (
        patch(
            "src.app.services.authorization_service.lock_cl_admin_roster",
            new=AsyncMock(),
        ),
        patch(
            "src.app.services.authorization_service.lock_authorization_target_user",
            new=AsyncMock(),
        ),
        patch.object(
            service,
            "_require_active_user",
            new=AsyncMock(side_effect=[actor, target]),
        ),
        patch.object(service, "_require_cl_admin_actor", new=AsyncMock()),
        patch.object(
            service,
            "resolve_for_user",
            new=AsyncMock(return_value=ResolvedAuthorizationState(global_role=CanonicalRoleCode.CL_ADMIN)),
        ),
        pytest.raises(ForbiddenException, match="last active CL Admin"),
    ):
        await service.revoke_cl_admin(
            db,
            target_user_id=12,
            revoked_by_user_id=11,
        )

    roster_statement = str(db.execute.await_args.args[0])
    assert 'JOIN "user"' in roster_statement
    assert '"user".enabled IS true' in roster_statement
    assert '"user".is_deleted IS false' in roster_statement
    db.flush.assert_not_awaited()
