import importlib.util
from pathlib import Path
from types import ModuleType
from typing import Any

MIGRATION_PATH = Path(__file__).resolve().parents[1] / "src" / "migrations" / "versions" / "0012_partner_developer_write.py"


class _Result:
    def first(self) -> None:
        return None


class _Bind:
    def __init__(self) -> None:
        self.calls: list[tuple[Any, object | None]] = []

    def execute(self, statement: Any, parameters: object | None = None) -> _Result:
        self.calls.append((statement, parameters))
        return _Result()


def _load_migration() -> ModuleType:
    spec = importlib.util.spec_from_file_location("partner_developer_write_migration", MIGRATION_PATH)
    assert spec is not None
    assert spec.loader is not None
    migration = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(migration)
    return migration


def test_upgrade_seeds_partner_developer_application_write_policy(monkeypatch: Any) -> None:
    migration = _load_migration()
    bind = _Bind()
    monkeypatch.setattr(migration.op, "get_bind", lambda: bind)

    migration.upgrade()

    assert len(bind.calls) == 2
    statement, parameters = bind.calls[1]
    assert "INSERT INTO access_policy" in statement.text
    assert parameters["subject"] == "Partner Developer"
    assert parameters["resource"] == "applications"
    assert parameters["action"] == "write"
