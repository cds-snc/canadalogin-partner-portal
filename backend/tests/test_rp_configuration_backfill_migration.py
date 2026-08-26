import importlib.util
import uuid as uuid_pkg
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from src.app.core.rp_configuration import build_default_configuration_name

MIGRATION_PATH = Path(__file__).parents[1] / "src" / "migrations" / "versions" / "0028_rp_configuration_backfill.py"


def _load_migration_module():
    spec = importlib.util.spec_from_file_location(
        "rp_configuration_backfill_migration",
        MIGRATION_PATH,
    )
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_backfill_label_matches_runtime_builder_and_is_bounded() -> None:
    migration = _load_migration_module()
    stable_uuid = uuid_pkg.UUID("018f6f83-1234-5678-9000-000000000701")
    row = {
        "uuid": stable_uuid,
        "dnr_app_name": "  Cafe\N{COMBINING ACUTE ACCENT} " + "x" * 200,
    }

    migration_label = migration._default_configuration_name(row)
    runtime_label = build_default_configuration_name(
        row["dnr_app_name"],
        stable_uuid,
    )

    assert migration.revision == "0028_rp_config_backfill"
    assert migration.down_revision == "0027_contact_identity_expand"
    assert len(migration.revision) <= 32
    assert migration_label == runtime_label
    assert migration_label.startswith("Café")
    assert migration_label.endswith("[018f6f83]")
    assert len(migration_label) == 128


def test_backfill_updates_only_missing_names_and_missing_workspace_department() -> None:
    migration = _load_migration_module()
    stable_uuid = uuid_pkg.UUID("018f6f83-1234-5678-9000-000000000701")
    contradiction_result = MagicMock()
    contradiction_result.scalar_one.return_value = 0
    name_result = MagicMock()
    name_result.mappings.return_value = [{"id": 7, "uuid": stable_uuid, "dnr_app_name": "Benefits Portal"}]
    update_result = MagicMock()
    department_result = MagicMock()
    connection = MagicMock()
    connection.execute.side_effect = [
        contradiction_result,
        name_result,
        update_result,
        department_result,
    ]

    with patch.object(migration.op, "get_bind", return_value=connection):
        migration.upgrade()

    assert connection.execute.call_count == 4
    label_update_params = connection.execute.call_args_list[2].args[1]
    assert label_update_params == [
        {
            "rp_application_id": 7,
            "configuration_name": "Benefits Portal [018f6f83]",
        }
    ]
    source = MIGRATION_PATH.read_text(encoding="utf-8")
    assert "oidc_registration_payload" not in source
    assert "application_information_id =" not in source
    assert "canada_login_environment =" not in source


def test_backfill_fails_before_writes_on_department_contradiction() -> None:
    migration = _load_migration_module()
    contradiction_result = MagicMock()
    contradiction_result.scalar_one.return_value = 2
    connection = MagicMock()
    connection.execute.return_value = contradiction_result

    with patch.object(migration.op, "get_bind", return_value=connection):
        with pytest.raises(RuntimeError, match="2 workspace-linked RP rows"):
            migration.upgrade()

    connection.execute.assert_called_once()


def test_backfill_downgrade_is_intentionally_non_destructive() -> None:
    migration = _load_migration_module()
    source = MIGRATION_PATH.read_text(encoding="utf-8")

    migration.downgrade()

    downgrade_source = source.split("def downgrade()", maxsplit=1)[1]
    assert "UPDATE" not in downgrade_source
    assert "DELETE" not in downgrade_source
