import importlib.util
from pathlib import Path
from unittest.mock import Mock, patch

from src.app.models.rp_application import RPApplication

MIGRATION_PATH = Path(__file__).parents[1] / "src" / "migrations" / "versions" / "0030_rp_hierarchy_constraints.py"


def _load_migration_module():
    spec = importlib.util.spec_from_file_location(
        "rp_hierarchy_constraints_migration",
        MIGRATION_PATH,
    )
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_upgrade_rechecks_locked_snapshot_before_activating_constraints() -> None:
    migration = _load_migration_module()
    connection = Mock()
    report = {"counts": {}}

    with (
        patch.object(migration.op, "get_bind", return_value=connection),
        patch.object(migration, "load_snapshot", return_value={"rows": []}) as load_snapshot,
        patch.object(migration, "build_report", return_value=report) as build_report,
        patch.object(migration, "has_blocking_findings", return_value=False) as has_blocking_findings,
        patch.object(migration.op, "alter_column") as alter_column,
        patch.object(migration.op, "create_check_constraint") as create_check_constraint,
    ):
        migration.upgrade()

    assert migration.revision == "0030_rp_hierarchy_constraints"
    assert migration.down_revision == "0029_rp_hierarchy_reconcile"
    lock_sql = str(connection.execute.call_args.args[0])
    assert "LOCK TABLE workspace, application_information, rp_application" in lock_sql
    load_snapshot.assert_called_once_with(connection)
    build_report.assert_called_once_with({"rows": []})
    has_blocking_findings.assert_called_once_with(report)
    assert alter_column.call_args.kwargs["nullable"] is False
    constraints = {call.args[0]: call.args[2] for call in create_check_constraint.call_args_list}
    assert "workspace_id IS NULL AND application_information_id IS NULL" in constraints["ck_rp_application_hierarchy_pair"]
    assert constraints["ck_rp_application_configuration_name_nonblank"] == "length(trim(configuration_name)) > 0"
    assert "canada_login_environment IN" in constraints["ck_rp_application_partner_required_fields"]
    assert "canada_login_environment IS NOT NULL" in constraints["ck_rp_application_partner_required_fields"]
    assert "length(trim(configuration_name)) > 0" in constraints["ck_rp_application_partner_required_fields"]


def test_upgrade_stops_before_schema_changes_when_findings_remain() -> None:
    migration = _load_migration_module()

    with (
        patch.object(migration.op, "get_bind", return_value=Mock()),
        patch.object(migration, "load_snapshot", return_value={}),
        patch.object(migration, "build_report", return_value={"blocking": True}),
        patch.object(migration, "has_blocking_findings", return_value=True),
        patch.object(migration.op, "alter_column") as alter_column,
        patch.object(migration.op, "create_check_constraint") as create_check_constraint,
    ):
        try:
            migration.upgrade()
        except RuntimeError as error:
            assert "reconciliation findings remain" in str(error)
        else:  # pragma: no cover - defensive assertion
            raise AssertionError("migration should fail closed")

    alter_column.assert_not_called()
    create_check_constraint.assert_not_called()


def test_downgrade_restores_nullable_name_after_removing_constraints() -> None:
    migration = _load_migration_module()

    with (
        patch.object(migration.op, "drop_constraint") as drop_constraint,
        patch.object(migration.op, "alter_column") as alter_column,
    ):
        migration.downgrade()

    assert [call.args[0] for call in drop_constraint.call_args_list] == [
        "ck_rp_application_partner_required_fields",
        "ck_rp_application_configuration_name_nonblank",
        "ck_rp_application_hierarchy_pair",
    ]
    assert alter_column.call_args.kwargs["nullable"] is True


def test_final_model_matches_activated_hierarchy_contract() -> None:
    table = RPApplication.__table__
    assert table.columns["configuration_name"].nullable is False
    assert {constraint.name for constraint in table.constraints} >= {
        "ck_rp_application_hierarchy_pair",
        "ck_rp_application_configuration_name_nonblank",
        "ck_rp_application_partner_required_fields",
    }
