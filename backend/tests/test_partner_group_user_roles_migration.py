from __future__ import annotations

import importlib.util
from datetime import UTC, datetime
from pathlib import Path
from types import ModuleType
from typing import Any


MIGRATION_PATH = (
    Path(__file__).resolve().parents[1]
    / "src"
    / "migrations"
    / "versions"
    / "0013_partner_group_user_roles.py"
)


class _MappingResult:
    def __init__(self, rows: list[dict[str, Any]]) -> None:
        self.rows = rows

    def mappings(self) -> _MappingResult:
        return self

    def all(self) -> list[dict[str, Any]]:
        return self.rows


class _BackfillBind:
    def __init__(self, assignments: list[dict[str, Any]]) -> None:
        self.assignments = assignments
        self.inserted_rows: list[dict[str, Any]] = []

    def execute(self, statement: Any, parameters: Any = None) -> _MappingResult | None:
        sql = str(statement)
        if sql.lstrip().startswith("SELECT"):
            return _MappingResult(self.assignments)
        if sql.lstrip().startswith("DELETE"):
            return None
        if sql.lstrip().startswith("INSERT"):
            self.inserted_rows.extend(parameters)
            return None
        raise AssertionError(f"Unexpected statement: {sql}")


class _DowngradeBind:
    def __init__(self, memberships: list[dict[str, Any]]) -> None:
        self.memberships = memberships
        self.statements: list[str] = []
        self.restored_rows: list[dict[str, Any]] = []

    def execute(self, statement: Any, parameters: Any = None) -> _MappingResult | None:
        sql = str(statement)
        self.statements.append(sql)
        if sql.lstrip().startswith("SELECT"):
            return _MappingResult(self.memberships)
        if sql.lstrip().startswith("DELETE"):
            return None
        if sql.lstrip().startswith("INSERT"):
            self.restored_rows.extend(parameters)
            return None
        raise AssertionError(f"Unexpected statement: {sql}")


def _load_migration() -> ModuleType:
    spec = importlib.util.spec_from_file_location(
        "partner_group_user_roles_migration", MIGRATION_PATH
    )
    assert spec is not None and spec.loader is not None
    migration = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(migration)
    return migration


def test_backfill_creates_one_group_role_grant_per_active_user() -> None:
    migration = _load_migration()
    created_at = datetime(2026, 1, 1, tzinfo=UTC)
    bind = _BackfillBind(
        [
            {
                "partner_group_id": 4,
                "user_id": 10,
                "role_id": 7,
                "created_at": created_at,
                "user_role_created_at": created_at,
            },
            {
                "partner_group_id": 4,
                "user_id": 11,
                "role_id": 7,
                "created_at": created_at,
                "user_role_created_at": created_at,
            },
        ]
    )

    migration._backfill_active_user_memberships(bind)

    assert {
        (row["partner_group_id"], row["user_id"], row["role_id"])
        for row in bind.inserted_rows
    } == {(4, 10, 7), (4, 11, 7)}


def test_downgrade_collapses_user_grants_before_restoring_group_roles(monkeypatch):
    migration = _load_migration()
    created_at = datetime(2026, 1, 1, tzinfo=UTC)
    bind = _DowngradeBind(
        [
            {
                "partner_group_id": 4,
                "role_id": 7,
                "created_at": created_at,
                "updated_at": None,
                "deleted_at": None,
                "is_deleted": False,
            },
            {
                "partner_group_id": 4,
                "role_id": 7,
                "created_at": created_at,
                "updated_at": None,
                "deleted_at": None,
                "is_deleted": False,
            },
        ]
    )
    monkeypatch.setattr(migration.op, "get_bind", lambda: bind)
    monkeypatch.setattr(migration.op, "f", lambda name: name)
    monkeypatch.setattr(migration.op, "drop_constraint", lambda *args, **kwargs: None)
    monkeypatch.setattr(migration.op, "drop_index", lambda *args, **kwargs: None)
    monkeypatch.setattr(migration.op, "drop_column", lambda *args, **kwargs: None)
    monkeypatch.setattr(migration.op, "create_unique_constraint", lambda *args, **kwargs: None)

    migration.downgrade()

    delete_position = next(
        index
        for index, sql in enumerate(bind.statements)
        if sql.lstrip().startswith("DELETE")
    )
    insert_position = next(
        index
        for index, sql in enumerate(bind.statements)
        if sql.lstrip().startswith("INSERT")
    )
    assert delete_position < insert_position
    assert len(bind.restored_rows) == 1
    assert (bind.restored_rows[0]["partner_group_id"], bind.restored_rows[0]["role_id"]) == (4, 7)