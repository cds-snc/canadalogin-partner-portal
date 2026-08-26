import importlib.util
from pathlib import Path
from unittest.mock import patch

from sqlalchemy import CheckConstraint
from src.app.models.rp_application_promotion_request import RPApplicationPromotionRequest

MIGRATION_PATH = Path(__file__).parents[1] / "src" / "migrations" / "versions" / "0033_registration_review_contract.py"


def _load_migration_module():
    spec = importlib.util.spec_from_file_location(
        "registration_review_contract_migration",
        MIGRATION_PATH,
    )
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_registration_review_expand_is_additive_and_only_backfills_explicit_records() -> None:
    migration = _load_migration_module()

    assert migration.revision == "0033_registration_review"
    assert migration.down_revision == "0032_partner_environment"
    assert len(migration.revision) <= 32

    with (
        patch.object(migration.op, "add_column") as add_column,
        patch.object(migration.op, "create_check_constraint") as create_check,
        patch.object(migration.op, "create_index") as create_index,
        patch.object(migration.op, "execute") as execute,
    ):
        migration.upgrade()

    columns = {(call.args[0], call.args[1].name): call.args[1] for call in add_column.call_args_list}
    assert set(columns) == {
        ("rp_application", "registration_completed_at"),
        ("rp_application_promotion_request", "review_status"),
    }
    assert all(column.nullable is True for column in columns.values())
    assert create_check.call_args.args == (
        "ck_rp_application_promotion_request_review_status",
        "rp_application_promotion_request",
        "review_status IS NULL OR review_status IN ('pending', 'approved', 'rejected')",
    )
    assert create_index.call_args.args == (
        "ix_rp_application_promotion_request_review_status",
        "rp_application_promotion_request",
        ["review_status"],
    )
    assert create_index.call_args.kwargs == {"unique": False}

    statements = [str(call.args[0]) for call in execute.call_args_list]
    assert len(statements) == 2
    assert "registration_completed_at = submitted_at" in statements[0]
    assert "submitted_at IS NOT NULL" in statements[0]
    assert "WHEN 'review_tracked' THEN 'pending'" in statements[1]
    assert "WHEN 'approved' THEN 'approved'" in statements[1]
    assert "BTRIM(external_reference) <> ''" in statements[1]
    assert "reviewed_at IS NOT NULL" in statements[1]
    assert "decided_at IS NOT NULL" in statements[1]
    assert "reviewed_by_user_id IS NOT NULL" in statements[1]
    assert "BTRIM(reviewed_by_team) <> ''" in statements[1]
    assert "changes_requested" not in statements[1]
    assert "launched" not in statements[1]


def test_registration_review_downgrade_removes_only_new_contract_columns() -> None:
    migration = _load_migration_module()

    with (
        patch.object(migration.op, "drop_index") as drop_index,
        patch.object(migration.op, "drop_constraint") as drop_constraint,
        patch.object(migration.op, "drop_column") as drop_column,
    ):
        migration.downgrade()

    drop_index.assert_called_once_with(
        "ix_rp_application_promotion_request_review_status",
        table_name="rp_application_promotion_request",
    )
    drop_constraint.assert_called_once_with(
        "ck_rp_application_promotion_request_review_status",
        "rp_application_promotion_request",
        type_="check",
    )
    assert [call.args for call in drop_column.call_args_list] == [
        ("rp_application_promotion_request", "review_status"),
        ("rp_application", "registration_completed_at"),
    ]


def test_production_review_model_mirrors_the_database_status_constraint() -> None:
    constraints = {
        constraint.name: str(constraint.sqltext)
        for constraint in RPApplicationPromotionRequest.__table__.constraints
        if isinstance(constraint, CheckConstraint)
    }

    assert constraints == {
        "ck_rp_application_promotion_request_review_status": ("review_status IS NULL OR review_status IN ('pending', 'approved', 'rejected')")
    }
