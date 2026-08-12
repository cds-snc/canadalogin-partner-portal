from datetime import UTC, datetime
from types import SimpleNamespace
from unittest.mock import ANY, AsyncMock, Mock, patch
from uuid import UUID

import pytest

from src.app.core.authorization import CanonicalRoleCode
from src.app.core.exceptions.http_exceptions import (
    BadRequestException,
    ForbiddenException,
    NotFoundException,
)
from src.app.services.authorization_service import (
    ROLE_ASSIGNMENT_CANDIDATE_LIMIT,
    AuthorizationService,
    ResolvedAuthorizationState,
    ResolvedPartnerAccess,
)

ACTOR_UUID = UUID("018f6f83-0000-0000-0000-000000000011")
TARGET_UUID = UUID("018f6f83-0000-0000-0000-000000000012")
WORKSPACE_ALPHA_UUID = UUID("018f6f83-0000-0000-0000-000000000201")
WORKSPACE_BETA_UUID = UUID("018f6f83-0000-0000-0000-000000000202")
ASSIGNMENT_UUID = UUID("018f6f83-0000-0000-0000-000000000301")
NOW = datetime(2026, 8, 11, 18, 0, tzinfo=UTC)


def _rows_result(rows: list[tuple]) -> Mock:
    result = Mock()
    result.all.return_value = rows
    return result


def _scalar_result(value: object | None) -> Mock:
    result = Mock()
    result.scalars.return_value.one_or_none.return_value = value
    return result


@pytest.mark.asyncio
async def test_revoked_assignments_are_absent_from_next_request_resolution() -> None:
    revoked_global = (
        1,
        "revoked",
        NOW,
        11,
        "cl_admin",
        False,
    )
    revoked_partner = (
        2,
        "revoked",
        "read_only",
        False,
        None,
        NOW,
        11,
        7,
        WORKSPACE_ALPHA_UUID,
        False,
    )
    db = Mock()
    db.execute = AsyncMock(
        side_effect=[
            _rows_result([revoked_global]),
            _rows_result([revoked_partner]),
        ]
    )

    state = await AuthorizationService().resolve_for_user(db, user_id=12)

    assert state.global_role is None
    assert state.partner_access == ()


@pytest.mark.asyncio
async def test_partner_user_cannot_list_cl_admin_assignments() -> None:
    service = AuthorizationService()
    actor = SimpleNamespace(id=11, uuid=ACTOR_UUID)
    db = Mock()

    with (
        patch.object(
            service,
            "_require_active_user",
            new=AsyncMock(return_value=actor),
        ),
        patch.object(
            service,
            "resolve_for_user",
            new=AsyncMock(
                return_value=ResolvedAuthorizationState(
                    partner_access=(
                        ResolvedPartnerAccess(
                            workspace_id=7,
                            workspace_uuid=WORKSPACE_ALPHA_UUID,
                            role=CanonicalRoleCode.RP_ADMIN,
                        ),
                    )
                )
            ),
        ),
        pytest.raises(ForbiddenException, match="Only CL Admin"),
    ):
        await service.list_cl_admin_assignments(db, actor_user_id=11)

    db.execute.assert_not_called()


@pytest.mark.asyncio
async def test_cl_admin_assignment_list_returns_only_public_projection() -> None:
    service = AuthorizationService()
    db = Mock()
    db.execute = AsyncMock(
        return_value=_rows_result(
            [
                (
                    ASSIGNMENT_UUID,
                    TARGET_UUID,
                    "Target User",
                    "target@example.test",
                    NOW,
                )
            ]
        )
    )

    with (
        patch.object(service, "_require_active_user", new=AsyncMock()),
        patch.object(service, "_require_cl_admin_actor", new=AsyncMock()),
    ):
        assignments = await service.list_cl_admin_assignments(
            db,
            actor_user_id=11,
        )

    assert assignments[0].model_dump(mode="json", by_alias=True) == {
        "assignedAt": NOW.isoformat().replace("+00:00", "Z"),
        "assignmentUuid": str(ASSIGNMENT_UUID),
        "role": "cl_admin",
        "userEmail": "target@example.test",
        "userName": "Target User",
        "userUuid": str(TARGET_UUID),
        "workspaceUuid": None,
    }
    statement = str(db.execute.await_args.args[0])
    assert 'JOIN "user"' in statement
    assert '"user".enabled IS true' in statement
    assert '"user".is_deleted IS false' in statement
    assert "user_role.status" in statement
    assert "role.code" in statement


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("state", "expected_eligible", "expected_reason"),
    [
        (ResolvedAuthorizationState(), True, "eligible"),
        (
            ResolvedAuthorizationState(global_role=CanonicalRoleCode.CL_ADMIN),
            False,
            "already_cl_admin",
        ),
        (
            ResolvedAuthorizationState(
                partner_access=(
                    ResolvedPartnerAccess(
                        workspace_id=7,
                        workspace_uuid=WORKSPACE_ALPHA_UUID,
                        role=CanonicalRoleCode.RP_USER_EDIT,
                    ),
                )
            ),
            False,
            "active_partner_access",
        ),
    ],
)
async def test_cl_admin_assignment_eligibility_is_resolved_from_canonical_state(
    state: ResolvedAuthorizationState,
    expected_eligible: bool,
    expected_reason: str,
) -> None:
    service = AuthorizationService()
    target = SimpleNamespace(
        id=12,
        uuid=TARGET_UUID,
        enabled=True,
    )
    db = Mock()
    db.execute = AsyncMock(return_value=_scalar_result(target))

    with (
        patch.object(service, "_require_active_user", new=AsyncMock()),
        patch.object(service, "_require_cl_admin_actor", new=AsyncMock()),
        patch.object(service, "resolve_for_user", new=AsyncMock(return_value=state)) as resolve,
    ):
        eligibility = await service.get_cl_admin_assignment_eligibility(
            db,
            target_user_uuid=TARGET_UUID,
            actor_user_id=11,
        )

    assert eligibility.model_dump(mode="json", by_alias=True) == {
        "eligible": expected_eligible,
        "reason": expected_reason,
        "userUuid": str(TARGET_UUID),
    }
    resolve.assert_awaited_once_with(db, user_id=12)
    statement = str(db.execute.await_args.args[0])
    assert '"user".uuid' in statement
    assert '"user".is_deleted IS false' in statement


@pytest.mark.asyncio
async def test_disabled_user_is_ineligible_for_cl_admin_without_role_resolution() -> None:
    service = AuthorizationService()
    target = SimpleNamespace(
        id=12,
        uuid=TARGET_UUID,
        enabled=False,
    )
    db = Mock()
    db.execute = AsyncMock(return_value=_scalar_result(target))
    resolve = AsyncMock()

    with (
        patch.object(service, "_require_active_user", new=AsyncMock()),
        patch.object(service, "_require_cl_admin_actor", new=AsyncMock()),
        patch.object(service, "resolve_for_user", new=resolve),
    ):
        eligibility = await service.get_cl_admin_assignment_eligibility(
            db,
            target_user_uuid=TARGET_UUID,
            actor_user_id=11,
        )

    assert eligibility.eligible is False
    assert eligibility.reason == "inactive_user"
    resolve.assert_not_awaited()


@pytest.mark.asyncio
async def test_partner_user_cannot_read_cl_admin_assignment_eligibility() -> None:
    service = AuthorizationService()
    actor = SimpleNamespace(id=11, uuid=ACTOR_UUID)
    actor_state = ResolvedAuthorizationState(
        partner_access=(
            ResolvedPartnerAccess(
                workspace_id=7,
                workspace_uuid=WORKSPACE_ALPHA_UUID,
                role=CanonicalRoleCode.RP_ADMIN,
            ),
        )
    )
    db = Mock()

    with (
        patch.object(service, "_require_active_user", new=AsyncMock(return_value=actor)),
        patch.object(service, "resolve_for_user", new=AsyncMock(return_value=actor_state)),
        pytest.raises(ForbiddenException, match="Only CL Admin"),
    ):
        await service.get_cl_admin_assignment_eligibility(
            db,
            target_user_uuid=TARGET_UUID,
            actor_user_id=11,
        )

    db.execute.assert_not_called()


@pytest.mark.asyncio
async def test_workspace_assignment_list_returns_one_canonical_scope() -> None:
    service = AuthorizationService()
    workspace = SimpleNamespace(id=7, uuid=WORKSPACE_ALPHA_UUID)
    db = Mock()
    db.execute = AsyncMock(
        return_value=_rows_result(
            [
                (
                    ASSIGNMENT_UUID,
                    TARGET_UUID,
                    "Target User",
                    "target@example.test",
                    "rp_user_edit",
                    WORKSPACE_ALPHA_UUID,
                    NOW,
                )
            ]
        )
    )

    with (
        patch.object(
            service,
            "_require_active_workspace_by_uuid",
            new=AsyncMock(return_value=workspace),
        ),
        patch.object(
            service,
            "_require_workspace_role_management_scope",
            new=AsyncMock(),
        ),
    ):
        assignments = await service.list_workspace_role_assignments(
            db,
            workspace_uuid=WORKSPACE_ALPHA_UUID,
            actor_user_id=11,
        )

    assert len(assignments) == 1
    assert assignments[0].role is CanonicalRoleCode.RP_USER_EDIT
    assert assignments[0].workspace_uuid == WORKSPACE_ALPHA_UUID
    assert set(assignments[0].model_dump(mode="json", by_alias=True)) == {
        "assignedAt",
        "assignmentUuid",
        "role",
        "userEmail",
        "userName",
        "userUuid",
        "workspaceUuid",
    }


@pytest.mark.asyncio
async def test_cl_admin_candidate_search_is_bounded_and_excludes_ineligible_users() -> None:
    service = AuthorizationService()
    workspace = SimpleNamespace(id=7, uuid=WORKSPACE_ALPHA_UUID)
    db = Mock()
    db.execute = AsyncMock(return_value=_rows_result([(TARGET_UUID, "Target User", "target@example.test")]))

    with (
        patch.object(
            service,
            "_require_active_workspace_by_uuid",
            new=AsyncMock(return_value=workspace),
        ),
        patch.object(
            service,
            "_require_workspace_role_management_scope",
            new=AsyncMock(
                return_value=ResolvedAuthorizationState(
                    global_role=CanonicalRoleCode.CL_ADMIN,
                )
            ),
        ),
    ):
        candidates = await service.search_workspace_role_assignment_candidates(
            db,
            workspace_uuid=WORKSPACE_ALPHA_UUID,
            actor_user_id=11,
            query="  target%_  ",
        )

    assert candidates[0].model_dump(mode="json", by_alias=True) == {
        "uuid": str(TARGET_UUID),
        "name": "Target User",
        "email": "target@example.test",
    }
    statement = db.execute.await_args.args[0]
    statement_text = str(statement)
    assert statement._limit_clause.value == ROLE_ASSIGNMENT_CANDIDATE_LIMIT
    assert statement_text.count("EXISTS") == 2
    assert '"user".enabled IS true' in statement_text
    assert '"user".is_deleted IS false' in statement_text
    parameters = statement.compile().params
    assert "%target\\%\\_%" in parameters.values()


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("query", "rows", "expected_count"),
    [
        ("  TARGET@EXAMPLE.TEST  ", [(TARGET_UUID, "Target User", "target@example.test")], 1),
        ("unknown@example.test", [], 0),
        ("Target User", [], 0),
    ],
)
async def test_rp_admin_candidate_search_requires_an_exact_normalized_email(
    query: str,
    rows: list[tuple],
    expected_count: int,
) -> None:
    service = AuthorizationService()
    workspace = SimpleNamespace(id=7, uuid=WORKSPACE_ALPHA_UUID)
    db = Mock()
    db.execute = AsyncMock(return_value=_rows_result(rows))
    actor_state = ResolvedAuthorizationState(
        partner_access=(
            ResolvedPartnerAccess(
                workspace_id=7,
                workspace_uuid=WORKSPACE_ALPHA_UUID,
                role=CanonicalRoleCode.RP_ADMIN,
            ),
        )
    )

    with (
        patch.object(
            service,
            "_require_active_workspace_by_uuid",
            new=AsyncMock(return_value=workspace),
        ),
        patch.object(
            service,
            "_require_workspace_role_management_scope",
            new=AsyncMock(return_value=actor_state),
        ),
    ):
        candidates = await service.search_workspace_role_assignment_candidates(
            db,
            workspace_uuid=WORKSPACE_ALPHA_UUID,
            actor_user_id=11,
            query=query,
        )

    assert len(candidates) == expected_count
    statement = db.execute.await_args.args[0]
    statement_text = str(statement)
    assert statement._limit_clause.value == ROLE_ASSIGNMENT_CANDIDATE_LIMIT
    assert statement_text.count("EXISTS") == 2
    assert '"user".email = ' in statement_text
    assert "LIKE" not in statement_text
    assert query.strip().lower() in statement.compile().params.values()


@pytest.mark.asyncio
async def test_candidate_search_authorizes_before_workspace_lookup() -> None:
    service = AuthorizationService()
    actor = SimpleNamespace(id=11, uuid=ACTOR_UUID)
    workspace_lookup = AsyncMock()
    db = Mock()

    with (
        patch.object(service, "_require_active_user", new=AsyncMock(return_value=actor)),
        patch.object(
            service,
            "resolve_for_user",
            new=AsyncMock(return_value=ResolvedAuthorizationState()),
        ),
        patch.object(
            service,
            "_require_active_workspace_by_uuid",
            new=workspace_lookup,
        ),
        pytest.raises(NotFoundException, match="Workspace not found"),
    ):
        await service.search_workspace_role_assignment_candidates(
            db,
            workspace_uuid=WORKSPACE_ALPHA_UUID,
            actor_user_id=11,
            query="known@example.test",
        )

    workspace_lookup.assert_not_awaited()
    db.execute.assert_not_called()


@pytest.mark.parametrize("query", ["", " ", "x", "x" * 101])
def test_candidate_search_rejects_blank_or_out_of_bounds_queries(query: str) -> None:
    with pytest.raises(BadRequestException, match="between 2 and 100"):
        AuthorizationService._normalize_candidate_query(query)


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "state",
    [
        ResolvedAuthorizationState(),
        ResolvedAuthorizationState(
            partner_access=(
                ResolvedPartnerAccess(
                    workspace_id=7,
                    workspace_uuid=WORKSPACE_ALPHA_UUID,
                    role=CanonicalRoleCode.RP_USER_EDIT,
                ),
            )
        ),
        ResolvedAuthorizationState(
            partner_access=(
                ResolvedPartnerAccess(
                    workspace_id=8,
                    workspace_uuid=WORKSPACE_BETA_UUID,
                    role=CanonicalRoleCode.RP_ADMIN,
                ),
            )
        ),
    ],
)
async def test_workspace_list_and_candidate_authority_denies_lower_or_out_of_scope(
    state: ResolvedAuthorizationState,
) -> None:
    service = AuthorizationService()
    actor = SimpleNamespace(id=11, uuid=ACTOR_UUID)
    workspace = SimpleNamespace(id=7, uuid=WORKSPACE_ALPHA_UUID)

    with (
        patch.object(
            service,
            "_require_active_user",
            new=AsyncMock(return_value=actor),
        ),
        patch.object(service, "resolve_for_user", new=AsyncMock(return_value=state)),
        pytest.raises(ForbiddenException, match="same-workspace RP Admin"),
    ):
        await service._require_workspace_role_management_actor(
            Mock(),
            actor_user_id=11,
            workspace=workspace,
        )


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "state",
    [
        ResolvedAuthorizationState(global_role=CanonicalRoleCode.CL_ADMIN),
        ResolvedAuthorizationState(
            partner_access=(
                ResolvedPartnerAccess(
                    workspace_id=7,
                    workspace_uuid=WORKSPACE_ALPHA_UUID,
                    role=CanonicalRoleCode.RP_ADMIN,
                ),
            )
        ),
    ],
)
async def test_workspace_list_and_candidate_authority_allows_cl_or_scoped_rp_admin(
    state: ResolvedAuthorizationState,
) -> None:
    service = AuthorizationService()
    actor = SimpleNamespace(id=11, uuid=ACTOR_UUID)
    workspace = SimpleNamespace(id=7, uuid=WORKSPACE_ALPHA_UUID)

    with (
        patch.object(
            service,
            "_require_active_user",
            new=AsyncMock(return_value=actor),
        ),
        patch.object(service, "resolve_for_user", new=AsyncMock(return_value=state)),
    ):
        result = await service._require_workspace_role_management_actor(
            Mock(),
            actor_user_id=11,
            workspace=workspace,
        )

    assert result is actor


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "state",
    [
        ResolvedAuthorizationState(),
        ResolvedAuthorizationState(
            partner_access=(
                ResolvedPartnerAccess(
                    workspace_id=8,
                    workspace_uuid=WORKSPACE_BETA_UUID,
                    role=CanonicalRoleCode.RP_ADMIN,
                ),
            )
        ),
    ],
)
async def test_out_of_scope_role_management_is_safe_not_found_before_workspace_lookup(
    state: ResolvedAuthorizationState,
) -> None:
    service = AuthorizationService()
    actor = SimpleNamespace(id=11, uuid=ACTOR_UUID)
    workspace_lookup = AsyncMock()

    with (
        patch.object(service, "_require_active_user", new=AsyncMock(return_value=actor)),
        patch.object(service, "resolve_for_user", new=AsyncMock(return_value=state)),
        patch.object(
            service,
            "_require_active_workspace_by_uuid",
            new=workspace_lookup,
        ),
        pytest.raises(NotFoundException, match="Workspace not found"),
    ):
        await service.list_workspace_role_assignments(
            Mock(),
            workspace_uuid=WORKSPACE_ALPHA_UUID,
            actor_user_id=11,
        )

    workspace_lookup.assert_not_awaited()


@pytest.mark.asyncio
async def test_in_scope_lower_role_management_is_forbidden_before_workspace_lookup() -> None:
    service = AuthorizationService()
    actor = SimpleNamespace(id=11, uuid=ACTOR_UUID)
    workspace_lookup = AsyncMock()
    state = ResolvedAuthorizationState(
        partner_access=(
            ResolvedPartnerAccess(
                workspace_id=7,
                workspace_uuid=WORKSPACE_ALPHA_UUID,
                role=CanonicalRoleCode.RP_USER_EDIT,
            ),
        )
    )

    with (
        patch.object(service, "_require_active_user", new=AsyncMock(return_value=actor)),
        patch.object(service, "resolve_for_user", new=AsyncMock(return_value=state)),
        patch.object(
            service,
            "_require_active_workspace_by_uuid",
            new=workspace_lookup,
        ),
        pytest.raises(ForbiddenException, match="same-workspace RP Admin"),
    ):
        await service.list_workspace_role_assignments(
            Mock(),
            workspace_uuid=WORKSPACE_ALPHA_UUID,
            actor_user_id=11,
        )

    workspace_lookup.assert_not_awaited()


@pytest.mark.asyncio
async def test_public_partner_assignment_delegates_to_canonical_mutation() -> None:
    service = AuthorizationService()
    actor = SimpleNamespace(id=11, uuid=ACTOR_UUID)
    target = SimpleNamespace(
        id=12,
        uuid=TARGET_UUID,
        name="Target User",
        email="target@example.test",
    )
    workspace = SimpleNamespace(id=7, uuid=WORKSPACE_ALPHA_UUID)
    persisted_assignment = SimpleNamespace(
        uuid=ASSIGNMENT_UUID,
        role="read_only",
        created_at=NOW,
    )
    canonical_mutation = AsyncMock(return_value=persisted_assignment)

    with (
        patch.object(
            service,
            "_require_active_workspace_by_uuid",
            new=AsyncMock(return_value=workspace),
        ),
        patch.object(
            service,
            "_require_workspace_role_management_scope",
            new=AsyncMock(return_value=actor),
        ),
        patch.object(
            service,
            "_require_partner_mutation_authority",
            new=AsyncMock(return_value=actor),
        ),
        patch.object(
            service,
            "_require_active_user_by_uuid",
            new=AsyncMock(return_value=target),
        ),
        patch.object(service, "assign_partner_role", new=canonical_mutation),
    ):
        assignment = await service.assign_partner_role_by_uuid(
            Mock(),
            workspace_uuid=WORKSPACE_ALPHA_UUID,
            target_user_uuid=TARGET_UUID,
            role=CanonicalRoleCode.READ_ONLY,
            assigned_by_user_id=11,
        )

    canonical_mutation.assert_awaited_once_with(
        ANY,
        target_user_id=12,
        workspace_id=7,
        role=CanonicalRoleCode.READ_ONLY,
        assigned_by_user_id=11,
    )
    assert assignment.assignment_uuid == ASSIGNMENT_UUID
    assert assignment.user_uuid == TARGET_UUID
    assert assignment.role is CanonicalRoleCode.READ_ONLY
