"""Add department catalog fields and seed the GC organization list.

Revision ID: 20260323_11
Revises: 20260323_10
Create Date: 2026-03-23 00:00:02.000000
"""

from __future__ import annotations

import csv
from datetime import UTC, datetime
from pathlib import Path

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql
from uuid6 import uuid7

revision = "20260323_11"
down_revision = "20260323_10"
branch_labels = None
depends_on = None


DEPARTMENT_SEED_FILE = Path(__file__).resolve().parents[2] / "app" / "data" / "gc_org_info.csv"


def get_column_names(inspector: sa.Inspector, table_name: str) -> set[str]:
    return {column["name"] for column in inspector.get_columns(table_name)}


def get_index_names(inspector: sa.Inspector, table_name: str) -> set[str]:
    return {index["name"] for index in inspector.get_indexes(table_name)}


def normalize_text(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = value.strip()
    return cleaned or None


def parse_gc_org_id(value: str | None) -> int | None:
    cleaned = normalize_text(value)
    if cleaned is None or not cleaned.isdigit():
        return None
    return int(cleaned)


def load_seed_rows() -> list[dict[str, object]]:
    with DEPARTMENT_SEED_FILE.open(newline="", encoding="utf-8-sig") as csv_file:
        reader = csv.DictReader(csv_file)
        return [
            {
                "abbreviation": abbreviation,
                "abbreviation_fr": normalize_text(row.get("abreviation")),
                "gc_org_id": parse_gc_org_id(row.get("gc_orgID")),
                "lead_department_name": normalize_text(row.get("lead_department")),
                "lead_department_name_fr": normalize_text(row.get("ministère_responsable")),
                "name": normalize_text(row.get("harmonized_name")) or normalize_text(row.get("legal_title")) or "Unknown department",
                "name_fr": normalize_text(row.get("nom_harmonisé")) or normalize_text(row.get("appellation_légale")),
            }
            for row in reader
            if (abbreviation := normalize_text(row.get("abbreviation"))) is not None
        ]


def ensure_department_catalog_columns(inspector: sa.Inspector) -> None:
    columns = get_column_names(inspector, "department")
    if "gc_org_id" not in columns:
        op.add_column("department", sa.Column("gc_org_id", sa.Integer(), nullable=True))
    if "name_fr" not in columns:
        op.add_column("department", sa.Column("name_fr", sa.String(length=128), nullable=True))
    if "abbreviation" not in columns:
        op.add_column("department", sa.Column("abbreviation", sa.String(length=16), nullable=True))
    if "abbreviation_fr" not in columns:
        op.add_column("department", sa.Column("abbreviation_fr", sa.String(length=16), nullable=True))
    if "lead_department_name" not in columns:
        op.add_column("department", sa.Column("lead_department_name", sa.String(length=64), nullable=True))
    if "lead_department_name_fr" not in columns:
        op.add_column("department", sa.Column("lead_department_name_fr", sa.String(length=192), nullable=True))


def ensure_department_catalog_indexes(bind: sa.Connection) -> None:
    inspector = sa.inspect(bind)
    indexes = get_index_names(inspector, "department")
    if "ix_department_gc_org_id" not in indexes:
        op.create_index("ix_department_gc_org_id", "department", ["gc_org_id"], unique=True)


def seed_departments(bind: sa.Connection) -> None:
    department = sa.table(
        "department",
        sa.column("id", sa.Integer()),
        sa.column("gc_org_id", sa.Integer()),
        sa.column("name", sa.String()),
        sa.column("name_fr", sa.String()),
        sa.column("abbreviation", sa.String()),
        sa.column("abbreviation_fr", sa.String()),
        sa.column("lead_department_name", sa.String()),
        sa.column("lead_department_name_fr", sa.String()),
        sa.column("uuid", postgresql.UUID(as_uuid=True)),
        sa.column("created_at", sa.DateTime(timezone=True)),
        sa.column("deleted_at", sa.DateTime(timezone=True)),
        sa.column("is_deleted", sa.Boolean()),
    )

    for row in load_seed_rows():
        lookup_conditions = [department.c.name == row["name"]]
        if row["gc_org_id"] is not None:
            lookup_conditions.insert(0, department.c.gc_org_id == row["gc_org_id"])

        existing_id = bind.execute(sa.select(department.c.id).where(sa.or_(*lookup_conditions))).scalar_one_or_none()

        values = {
            "abbreviation": row["abbreviation"],
            "abbreviation_fr": row["abbreviation_fr"],
            "gc_org_id": row["gc_org_id"],
            "lead_department_name": row["lead_department_name"],
            "lead_department_name_fr": row["lead_department_name_fr"],
            "name": row["name"],
            "name_fr": row["name_fr"],
        }

        if existing_id is None:
            bind.execute(
                sa.insert(department).values(
                    **values,
                    created_at=datetime.now(UTC),
                    deleted_at=None,
                    is_deleted=False,
                    uuid=uuid7(),
                )
            )
            continue

        bind.execute(sa.update(department).where(department.c.id == existing_id).values(**values))


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if not inspector.has_table("department"):
        return

    ensure_department_catalog_columns(inspector)
    ensure_department_catalog_indexes(bind)
    seed_departments(bind)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if not inspector.has_table("department"):
        return

    department = sa.table(
        "department",
        sa.column("gc_org_id", sa.Integer()),
    )
    seed_ids = [row["gc_org_id"] for row in load_seed_rows() if row["gc_org_id"] is not None]
    if seed_ids:
        bind.execute(sa.delete(department).where(department.c.gc_org_id.in_(seed_ids)))

    inspector = sa.inspect(bind)
    indexes = get_index_names(inspector, "department")
    if "ix_department_gc_org_id" in indexes:
        op.drop_index("ix_department_gc_org_id", table_name="department")

    columns = get_column_names(inspector, "department")
    for column_name in [
        "lead_department_name_fr",
        "lead_department_name",
        "abbreviation_fr",
        "abbreviation",
        "name_fr",
        "gc_org_id",
    ]:
        if column_name in columns:
            op.drop_column("department", column_name)
