import importlib.util
from pathlib import Path
from unittest.mock import patch

MIGRATION_PATH = Path(__file__).parents[1] / "src" / "migrations" / "versions" / "0032_partner_environment_expand.py"


def _load_migration_module():
    spec = importlib.util.spec_from_file_location(
        "partner_environment_expand_migration",
        MIGRATION_PATH,
    )
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_partner_environment_expand_is_nullable_bounded_and_non_inferential() -> None:
    migration = _load_migration_module()

    assert migration.revision == "0032_partner_environment"
    assert migration.down_revision == "0031_cross_namespace_uuid_guard"
    assert len(migration.revision) <= 32

    with (
        patch.object(migration.op, "add_column") as add_column,
        patch.object(migration.op, "create_check_constraint") as create_check,
    ):
        migration.upgrade()

    table_name, column = add_column.call_args.args
    assert table_name == "rp_application"
    assert column.name == "partner_environment"
    assert column.type.length == 128
    assert column.nullable is True
    assert create_check.call_args.args == (
        "ck_rp_application_partner_environment_nonblank",
        "rp_application",
        "partner_environment IS NULL OR length(trim(partner_environment)) > 0",
    )

    source = MIGRATION_PATH.read_text(encoding="utf-8")
    assert "UPDATE rp_application" not in source
    assert "INSERT INTO rp_application" not in source
    assert "DELETE FROM rp_application" not in source


def test_partner_environment_expand_downgrade_removes_only_added_metadata() -> None:
    migration = _load_migration_module()

    with (
        patch.object(migration.op, "drop_constraint") as drop_constraint,
        patch.object(migration.op, "drop_column") as drop_column,
    ):
        migration.downgrade()

    assert drop_constraint.call_args.args == (
        "ck_rp_application_partner_environment_nonblank",
        "rp_application",
    )
    assert drop_constraint.call_args.kwargs == {"type_": "check"}
    drop_column.assert_called_once_with("rp_application", "partner_environment")
