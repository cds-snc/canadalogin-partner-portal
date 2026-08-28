import importlib.util
from pathlib import Path
from unittest.mock import Mock, patch

import pytest

MIGRATION_PATH = Path(__file__).parents[1] / "src" / "migrations" / "versions" / "0031_cross_namespace_uuid_guard.py"


def _load_migration_module():
    spec = importlib.util.spec_from_file_location(
        "cross_namespace_uuid_guard_migration",
        MIGRATION_PATH,
    )
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def _connection_with_collision(collision=None):
    connection = Mock()
    lock_result = Mock()
    collision_result = Mock()
    collision_result.mappings.return_value.first.return_value = collision
    connection.execute.side_effect = [lock_result, collision_result]
    return connection


def test_upgrade_preflights_and_installs_symmetric_transactional_guards() -> None:
    migration = _load_migration_module()
    connection = _connection_with_collision()

    with (
        patch.object(migration.op, "get_bind", return_value=connection),
        patch.object(migration.op, "execute") as execute,
    ):
        migration.upgrade()

    assert migration.revision == "0031_cross_namespace_uuid_guard"
    assert migration.down_revision == "0030_rp_hierarchy_constraints"
    preflight_sql = str(connection.execute.call_args_list[1].args[0])
    assert "rp.workspace_id = ai.workspace_id" in preflight_sql
    assert "rp.uuid = ai.uuid" in preflight_sql
    rendered = "\n".join(str(call.args[0]) for call in execute.call_args_list)
    assert "pg_advisory_xact_lock" in rendered
    assert "trg_application_information_public_uuid_guard" in rendered
    assert "trg_rp_application_public_uuid_guard" in rendered


def test_upgrade_stops_and_records_public_ids_when_collision_exists() -> None:
    migration = _load_migration_module()
    connection = _connection_with_collision(
        {
            "workspace_uuid": "018f6f83-0000-0000-0000-000000000201",
            "public_uuid": "018f6f83-0000-0000-0000-000000000501",
        }
    )

    with (
        patch.object(migration.op, "get_bind", return_value=connection),
        patch.object(migration.op, "execute") as execute,
        pytest.raises(RuntimeError) as exc_info,
    ):
        migration.upgrade()

    assert "workspaceUuid=018f6f83-0000-0000-0000-000000000201" in str(exc_info.value)
    assert "publicUuid=018f6f83-0000-0000-0000-000000000501" in str(exc_info.value)
    execute.assert_not_called()


def test_downgrade_removes_only_cross_namespace_guards() -> None:
    migration = _load_migration_module()

    with patch.object(migration.op, "execute") as execute:
        migration.downgrade()

    rendered = [str(call.args[0]) for call in execute.call_args_list]
    assert rendered == [
        "DROP TRIGGER IF EXISTS trg_rp_application_public_uuid_guard ON rp_application",
        "DROP TRIGGER IF EXISTS trg_application_information_public_uuid_guard ON application_information",
        "DROP FUNCTION IF EXISTS guard_application_rp_public_uuid_collision()",
    ]
