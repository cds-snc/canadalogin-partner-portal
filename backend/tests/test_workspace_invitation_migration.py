import importlib.util
from pathlib import Path
from unittest.mock import Mock, patch

import pytest

MIGRATION_PATH = Path(__file__).parents[1] / "src" / "migrations" / "versions" / "0025_workspace_invitations.py"


def _load_migration_module():
    spec = importlib.util.spec_from_file_location(
        "workspace_invitation_migration",
        MIGRATION_PATH,
    )
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_workspace_invitation_migration_is_additive_and_preserves_provenance() -> None:
    source = MIGRATION_PATH.read_text(encoding="utf-8")

    assert 'down_revision: Union[str, None] = "0024_registration_draft"' in source
    assert '"rp_application_developer_invitation"' in source
    assert '"rp_application_id"' in source
    assert "nullable=True" in source
    assert "UPDATE rp_application_developer_invitation" not in source
    assert "DELETE FROM rp_application_developer_invitation" not in source
    assert "INSERT INTO rp_application_developer_invitation" not in source


def test_workspace_invitation_downgrade_rejects_workspace_only_records() -> None:
    migration = _load_migration_module()
    result = Mock()
    result.scalar_one.return_value = 1
    connection = Mock()
    connection.execute.return_value = result

    with (
        patch.object(migration.op, "get_bind", return_value=connection),
        patch.object(migration.op, "alter_column") as alter_column,
        pytest.raises(RuntimeError, match="workspace-only invitations exist"),
    ):
        migration.downgrade()

    alter_column.assert_not_called()


def test_workspace_invitation_downgrade_restores_not_null_when_safe() -> None:
    migration = _load_migration_module()
    result = Mock()
    result.scalar_one.return_value = 0
    connection = Mock()
    connection.execute.return_value = result

    with (
        patch.object(migration.op, "get_bind", return_value=connection),
        patch.object(migration.op, "alter_column") as alter_column,
    ):
        migration.downgrade()

    alter_column.assert_called_once()
    assert alter_column.call_args.kwargs["nullable"] is False
