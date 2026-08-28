import json
import logging
from unittest.mock import AsyncMock, Mock, patch

import pytest

from src.app.core.authorization import CL_ADMIN_ROLE_UUID
from src.app.core.config import FirstUserSettings, settings
from src.app.core.logging_privacy import hash_log_value
from src.app.models.audit_log import AuditLog
from src.app.models.role import Role
from src.app.models.user import User
from src.app.models.user_role import UserRole
from src.app.schemas.authorization_audit import (
    AuthorizationActorType,
    AuthorizationAuditResult,
    RoleAssignmentAuditEvent,
)
from src.scripts.create_initial_cl_admin import create_initial_cl_admin


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


def test_initial_cl_admin_setting_uses_only_the_canonical_name(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.delenv("INITIAL_CL_ADMIN_EMAIL", raising=False)
    monkeypatch.setenv("SUPERUSER", "legacy.admin@example.test")

    assert FirstUserSettings().INITIAL_CL_ADMIN_EMAIL is None

    monkeypatch.setenv("INITIAL_CL_ADMIN_EMAIL", "initial.admin@example.test")
    assert FirstUserSettings().INITIAL_CL_ADMIN_EMAIL == "initial.admin@example.test"


@pytest.fixture(autouse=True)
def bootstrap_locks():
    with (
        patch(
            "src.scripts.create_initial_cl_admin.lock_cl_admin_roster",
            new_callable=AsyncMock,
        ) as roster_lock,
        patch(
            "src.scripts.create_initial_cl_admin.lock_authorization_target_user",
            new_callable=AsyncMock,
        ) as target_lock,
    ):
        yield roster_lock, target_lock


class TestCreateInitialCLAdmin:
    @pytest.mark.asyncio
    async def test_creates_normalized_role_user_and_assignment(
        self,
        mock_db,
        bootstrap_locks,
        caplog: pytest.LogCaptureFixture,
    ) -> None:
        created_objects: list[object] = []
        committed_objects: list[object] = []

        def add_object(value: object) -> None:
            created_objects.append(value)

        async def flush() -> None:
            for value in created_objects:
                if isinstance(value, Role) and value.id is None:
                    value.id = 7
                if isinstance(value, User) and value.id is None:
                    value.id = 11

        async def commit() -> None:
            committed_objects.extend(created_objects)

        mock_db.execute = AsyncMock(
            side_effect=[
                _scalar_result(None),
                _scalar_result(None),
                _first_result(None),
                _rows_result([]),
            ]
        )
        mock_db.add = Mock(side_effect=add_object)
        mock_db.flush = AsyncMock(side_effect=flush)
        mock_db.refresh = AsyncMock()
        mock_db.commit = AsyncMock(side_effect=commit)
        caplog.set_level(
            logging.INFO,
            logger="src.scripts.create_initial_cl_admin",
        )

        with patch.object(
            settings,
            "INITIAL_CL_ADMIN_EMAIL",
            "initial.admin@example.test ",
        ):
            await create_initial_cl_admin(mock_db)

        created_role = next(value for value in created_objects if isinstance(value, Role))
        created_user = next(value for value in created_objects if isinstance(value, User))
        assignment = next(value for value in created_objects if isinstance(value, UserRole))
        audit = next(value for value in created_objects if isinstance(value, AuditLog))
        audit_payload = json.loads(audit.description)
        audit_event = RoleAssignmentAuditEvent.model_validate(audit_payload)

        assert created_role.code == "cl_admin"
        assert created_role.uuid == CL_ADMIN_ROLE_UUID
        assert created_user.email == "initial.admin@example.test"
        assert created_user.is_superuser is False
        assert created_user.role_ids is None
        assert assignment.user_id == 11
        assert assignment.role_id == 7
        assert assignment.status == "active"
        assert assignment.assignment_source == "bootstrap"
        assert audit.user == "authorization_system"
        assert audit.user_uuid is None
        assert audit.target == "authorization_assignment"
        assert audit.target_uuid == created_user.uuid
        assert audit.operation == "role_assign"
        assert audit.created_at == assignment.assigned_at
        assert audit_event.actor.type is AuthorizationActorType.SYSTEM
        assert audit_event.actor.user_uuid is None
        assert audit_event.result is AuthorizationAuditResult.SUCCEEDED
        assert audit_event.assignment_uuid == assignment.uuid
        assert audit_event.target_user_uuid == created_user.uuid
        assert audit_event.role.value == "cl_admin"
        assert audit_event.assignment_source.value == "bootstrap"
        assert set(audit_payload) == {
            "action",
            "actor",
            "assignmentSource",
            "assignmentUuid",
            "eventName",
            "eventVersion",
            "result",
            "role",
            "targetUserUuid",
            "timestamp",
        }
        assert audit_payload["actor"] == {"type": "system"}
        assert "initial.admin@example.test" not in audit.description.lower()
        assert "initial.admin@example.test" not in caplog.text.lower()
        assert str(created_user.uuid) not in caplog.text
        assert hash_log_value(created_user.uuid) in caplog.text
        assert assignment in committed_objects
        assert audit in committed_objects
        roster_lock, target_lock = bootstrap_locks
        roster_lock.assert_awaited_once_with(mock_db)
        target_lock.assert_awaited_once_with(mock_db, 11)
        mock_db.refresh.assert_awaited_once_with(created_user)
        mock_db.commit.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_existing_assignment_is_idempotent(
        self,
        mock_db,
        caplog: pytest.LogCaptureFixture,
    ) -> None:
        role = Role(
            name="CL Admin",
            code="cl_admin",
            description="Immutable CanadaLogin platform administrator role",
            uuid=CL_ADMIN_ROLE_UUID,
        )
        role.id = 3
        user = User(
            name="Initial Admin",
            email="initial.admin@example.test",
            username="initial.admin@example.test",
            enabled=True,
        )
        user.id = 8
        assignment = UserRole(
            user_id=8,
            role_id=3,
            status="active",
            assignment_source="bootstrap",
        )

        mock_db.execute = AsyncMock(
            side_effect=[
                _scalar_result(role),
                _scalar_result(user),
                _first_result(None),
                _rows_result([(assignment, "cl_admin")]),
            ]
        )
        mock_db.add = Mock()
        mock_db.flush = AsyncMock()
        mock_db.refresh = AsyncMock()
        mock_db.commit = AsyncMock()
        caplog.set_level(
            logging.INFO,
            logger="src.scripts.create_initial_cl_admin",
        )

        with patch.object(
            settings,
            "INITIAL_CL_ADMIN_EMAIL",
            "initial.admin@example.test",
        ):
            await create_initial_cl_admin(mock_db)

        mock_db.add.assert_not_called()
        mock_db.commit.assert_awaited_once()
        assert "initial.admin@example.test" not in caplog.text.lower()
        assert str(user.uuid) not in caplog.text
        assert hash_log_value(user.uuid) in caplog.text

    @pytest.mark.asyncio
    async def test_rejects_bootstrap_user_with_partner_grant(self, mock_db) -> None:
        role = Role(
            name="CL Admin",
            code="cl_admin",
            description=None,
            uuid=CL_ADMIN_ROLE_UUID,
        )
        role.id = 3
        user = User(
            name="Initial Admin",
            email="initial.admin@example.test",
            username="initial.admin@example.test",
            enabled=True,
        )
        user.id = 8
        mock_db.execute = AsyncMock(
            side_effect=[
                _scalar_result(role),
                _scalar_result(user),
                _first_result((99,)),
            ]
        )
        mock_db.refresh = AsyncMock()

        with patch.object(
            settings,
            "INITIAL_CL_ADMIN_EMAIL",
            "initial.admin@example.test",
        ):
            with pytest.raises(RuntimeError, match="cannot have active partner access"):
                await create_initial_cl_admin(mock_db)

    @pytest.mark.asyncio
    async def test_rejects_existing_disabled_user_without_reactivating_it(
        self,
        mock_db,
    ) -> None:
        role = Role(
            name="CL Admin",
            code="cl_admin",
            description=None,
            uuid=CL_ADMIN_ROLE_UUID,
        )
        role.id = 3
        user = User(
            name="Disabled Admin",
            email="disabled.admin@example.test",
            username="disabled.admin@example.test",
            enabled=False,
        )
        user.id = 8
        mock_db.execute = AsyncMock(
            side_effect=[
                _scalar_result(role),
                _scalar_result(user),
            ]
        )
        mock_db.add = Mock()
        mock_db.flush = AsyncMock()
        mock_db.refresh = AsyncMock()
        mock_db.commit = AsyncMock()

        with patch.object(
            settings,
            "INITIAL_CL_ADMIN_EMAIL",
            "disabled.admin@example.test",
        ):
            with pytest.raises(RuntimeError, match="disabled user"):
                await create_initial_cl_admin(mock_db)

        assert user.enabled is False
        mock_db.add.assert_not_called()
        mock_db.flush.assert_not_awaited()
        mock_db.commit.assert_not_awaited()
