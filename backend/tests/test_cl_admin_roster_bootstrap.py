import json
from unittest.mock import AsyncMock, Mock, patch

import pytest

from src.app.core.authorization import CL_ADMIN_ROLE_UUID
from src.app.core.config import FirstUserSettings
from src.app.models.audit_log import AuditLog
from src.app.models.role import Role
from src.app.models.user import User
from src.app.models.user_role import UserRole
from src.app.services.cl_admin_roster_bootstrap import (
    CLAdminRosterBootstrapService,
    CLAdminRosterConfigurationError,
    CLAdminRosterConflictError,
    parse_initial_cl_admin_emails,
)


def _scalar_result(value):
    result = Mock()
    result.scalar_one_or_none.return_value = value
    return result


def _first_result(value):
    result = Mock()
    result.first.return_value = value
    return result


def _rows_result(values):
    result = Mock()
    result.all.return_value = values
    return result


@pytest.mark.parametrize(
    ("value", "expected"),
    [
        ('["admin.one@example.test"]', ("admin.one@example.test",)),
        (
            '[" Admin.Two@example.test ", "admin.one@example.test"]',
            ("admin.one@example.test", "admin.two@example.test"),
        ),
    ],
)
def test_parse_initial_cl_admin_emails_normalizes_and_orders(value: str, expected: tuple[str, ...]) -> None:
    assert parse_initial_cl_admin_emails(value) == expected


@pytest.mark.parametrize(
    "value",
    ["", "not json", "{}", "[]", '["admin@example.test", " ADMIN@example.test "]', '["not-an-email"]'],
)
def test_parse_initial_cl_admin_emails_rejects_invalid_configuration(value: str) -> None:
    with pytest.raises(CLAdminRosterConfigurationError):
        parse_initial_cl_admin_emails(value)


def test_parse_initial_cl_admin_emails_allows_missing_roster_as_noop() -> None:
    assert parse_initial_cl_admin_emails(None) is None


def test_retired_single_email_setting_is_not_a_bootstrap_fallback() -> None:
    assert not hasattr(FirstUserSettings(), "INITIAL_CL_ADMIN_EMAIL")


@pytest.mark.asyncio
async def test_bootstrap_missing_roster_does_not_touch_database(mock_db) -> None:
    outcome = await CLAdminRosterBootstrapService().bootstrap(mock_db, configured_emails=None)

    assert outcome.skipped is True
    mock_db.execute.assert_not_called()
    mock_db.commit.assert_not_awaited()


@pytest.mark.asyncio
async def test_bootstrap_creates_sorted_roster_and_minimized_audits(mock_db) -> None:
    created: list[object] = []

    def add(value: object) -> None:
        created.append(value)

    async def flush() -> None:
        for value in created:
            if isinstance(value, Role) and value.id is None:
                value.id = 7
            if isinstance(value, User) and value.id is None:
                value.id = 11 + len([item for item in created if isinstance(item, User)])

    mock_db.execute = AsyncMock(
        side_effect=[
            _scalar_result(None),
            _scalar_result(None),
            _first_result(None),
            _rows_result([]),
            _scalar_result(None),
            _first_result(None),
            _rows_result([]),
        ]
    )
    mock_db.add = Mock(side_effect=add)
    mock_db.flush = AsyncMock(side_effect=flush)
    mock_db.refresh = AsyncMock()
    mock_db.commit = AsyncMock()
    mock_db.rollback = AsyncMock()

    with (
        patch("src.app.services.cl_admin_roster_bootstrap.lock_cl_admin_roster", new_callable=AsyncMock) as roster_lock,
        patch("src.app.services.cl_admin_roster_bootstrap.lock_authorization_target_user", new_callable=AsyncMock) as user_lock,
    ):
        outcome = await CLAdminRosterBootstrapService().bootstrap(
            mock_db,
            configured_emails='["admin.two@example.test", "admin.one@example.test"]',
        )

    users = [value for value in created if isinstance(value, User)]
    assignments = [value for value in created if isinstance(value, UserRole)]
    audits = [value for value in created if isinstance(value, AuditLog)]
    assert [user.email for user in users] == ["admin.one@example.test", "admin.two@example.test"]
    assert outcome.created_users == 2
    assert outcome.created_assignments == 2
    assert outcome.unchanged_assignments == 0
    assert len(assignments) == len(audits) == 2
    assert all(assignment.role_id == 7 for assignment in assignments)
    for audit in audits:
        payload = json.loads(audit.description)
        assert payload["assignmentSource"] == "bootstrap"
        assert "admin.one@example.test" not in audit.description
        assert "admin.two@example.test" not in audit.description
        assert "Uuid" not in audit.description
    roster_lock.assert_awaited_once_with(mock_db)
    assert user_lock.await_count == 2
    mock_db.commit.assert_awaited_once()
    mock_db.rollback.assert_not_awaited()


@pytest.mark.asyncio
async def test_bootstrap_preserves_existing_eligible_user_and_is_idempotent(mock_db) -> None:
    role = Role(name="CL Admin", code="cl_admin", description=None, uuid=CL_ADMIN_ROLE_UUID)
    role.id = 3
    user = User(name="Existing Name", email="admin.one@example.test", username="existing-username", enabled=True)
    user.id = 8
    assignment = UserRole(user_id=8, role_id=3, status="active", assignment_source="bootstrap")
    mock_db.execute = AsyncMock(
        side_effect=[
            _scalar_result(role),
            _scalar_result(user),
            _first_result(None),
            _rows_result([(assignment, "cl_admin", False)]),
        ]
    )
    mock_db.add = Mock()
    mock_db.refresh = AsyncMock()
    mock_db.commit = AsyncMock()
    mock_db.rollback = AsyncMock()

    with (
        patch("src.app.services.cl_admin_roster_bootstrap.lock_cl_admin_roster", new_callable=AsyncMock),
        patch("src.app.services.cl_admin_roster_bootstrap.lock_authorization_target_user", new_callable=AsyncMock),
    ):
        outcome = await CLAdminRosterBootstrapService().bootstrap(mock_db, configured_emails='["admin.one@example.test"]')

    assert outcome.created_users == 0
    assert outcome.created_assignments == 0
    assert outcome.unchanged_assignments == 1
    assert user.name == "Existing Name"
    assert user.username == "existing-username"
    assert user.enabled is True
    mock_db.add.assert_not_called()
    mock_db.commit.assert_awaited_once()


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "user",
    [
        User(name="Disabled", email="admin.one@example.test", username="disabled", enabled=False),
        User(name="Deleted", email="admin.one@example.test", username="deleted", enabled=True, is_deleted=True),
    ],
)
async def test_bootstrap_conflicting_lifecycle_rolls_back_all_changes(mock_db, user: User) -> None:
    role = Role(name="CL Admin", code="cl_admin", description=None, uuid=CL_ADMIN_ROLE_UUID)
    role.id = 3
    user.id = 8
    mock_db.execute = AsyncMock(side_effect=[_scalar_result(role), _scalar_result(user)])
    mock_db.refresh = AsyncMock()
    mock_db.rollback = AsyncMock()
    mock_db.commit = AsyncMock()

    with (
        patch("src.app.services.cl_admin_roster_bootstrap.lock_cl_admin_roster", new_callable=AsyncMock),
        patch("src.app.services.cl_admin_roster_bootstrap.lock_authorization_target_user", new_callable=AsyncMock),
        pytest.raises(CLAdminRosterConflictError),
    ):
        await CLAdminRosterBootstrapService().bootstrap(mock_db, configured_emails='["admin.one@example.test"]')

    mock_db.rollback.assert_awaited_once()
    mock_db.commit.assert_not_awaited()


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("has_partner_access", "active_assignments"),
    [
        (True, []),
        (False, [(object(), "rp_admin", False)]),
    ],
)
async def test_bootstrap_conflicting_partner_or_global_access_rolls_back_all_changes(
    mock_db,
    has_partner_access: bool,
    active_assignments: list[tuple[object, str, bool]],
) -> None:
    role = Role(name="CL Admin", code="cl_admin", description=None, uuid=CL_ADMIN_ROLE_UUID)
    role.id = 3
    user = User(name="Existing", email="admin.one@example.test", username="existing", enabled=True)
    user.id = 8
    query_results = [_scalar_result(role), _scalar_result(user), _first_result(1 if has_partner_access else None)]
    if not has_partner_access:
        query_results.append(_rows_result(active_assignments))
    mock_db.execute = AsyncMock(side_effect=query_results)
    mock_db.refresh = AsyncMock()
    mock_db.rollback = AsyncMock()
    mock_db.commit = AsyncMock()

    with (
        patch("src.app.services.cl_admin_roster_bootstrap.lock_cl_admin_roster", new_callable=AsyncMock),
        patch("src.app.services.cl_admin_roster_bootstrap.lock_authorization_target_user", new_callable=AsyncMock),
        pytest.raises(CLAdminRosterConflictError),
    ):
        await CLAdminRosterBootstrapService().bootstrap(mock_db, configured_emails='["admin.one@example.test"]')

    mock_db.rollback.assert_awaited_once()
    mock_db.commit.assert_not_awaited()


@pytest.mark.asyncio
async def test_bootstrap_rolls_back_prior_roster_writes_when_a_later_identity_conflicts(mock_db) -> None:
    created: list[object] = []
    disabled_user = User(name="Disabled", email="admin.two@example.test", username="disabled", enabled=False)
    disabled_user.id = 9

    def add(value: object) -> None:
        created.append(value)

    async def flush() -> None:
        for value in created:
            if isinstance(value, Role) and value.id is None:
                value.id = 3
            if isinstance(value, User) and value.id is None:
                value.id = 8

    mock_db.execute = AsyncMock(
        side_effect=[
            _scalar_result(None),
            _scalar_result(None),
            _first_result(None),
            _rows_result([]),
            _scalar_result(disabled_user),
        ]
    )
    mock_db.add = Mock(side_effect=add)
    mock_db.flush = AsyncMock(side_effect=flush)
    mock_db.refresh = AsyncMock()
    mock_db.rollback = AsyncMock()
    mock_db.commit = AsyncMock()

    with (
        patch("src.app.services.cl_admin_roster_bootstrap.lock_cl_admin_roster", new_callable=AsyncMock),
        patch("src.app.services.cl_admin_roster_bootstrap.lock_authorization_target_user", new_callable=AsyncMock),
        pytest.raises(CLAdminRosterConflictError),
    ):
        await CLAdminRosterBootstrapService().bootstrap(
            mock_db,
            configured_emails='["admin.one@example.test", "admin.two@example.test"]',
        )

    assert any(isinstance(value, UserRole) for value in created)
    assert any(isinstance(value, AuditLog) for value in created)
    mock_db.rollback.assert_awaited_once()
    mock_db.commit.assert_not_awaited()
