"""Link RP applications to application info records.

Revision ID: 0010_rp_app_info_link
Revises: 0009_app_info_enum_keys
Create Date: 2026-04-16
"""

from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op

revision: str = "0010_rp_app_info_link"
down_revision: Union[str, None] = "0009_app_info_enum_keys"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if not inspector.has_table("rp_application") or not inspector.has_table("application_info"):
        return

    columns = {column["name"] for column in inspector.get_columns("rp_application")}
    if "application_info_id" not in columns:
        op.add_column("rp_application", sa.Column("application_info_id", sa.Integer(), nullable=True))

    foreign_keys = {foreign_key["name"] for foreign_key in inspector.get_foreign_keys("rp_application")}
    if "fk_rp_application_application_info_id" not in foreign_keys:
        op.create_foreign_key(
            "fk_rp_application_application_info_id",
            "rp_application",
            "application_info",
            ["application_info_id"],
            ["id"],
        )

    indexes = {index["name"] for index in inspector.get_indexes("rp_application")}
    if "ix_rp_application_application_info_id" not in indexes:
        op.create_index(
            "ix_rp_application_application_info_id",
            "rp_application",
            ["application_info_id"],
            unique=False,
        )

    unique_constraints = {constraint["name"] for constraint in inspector.get_unique_constraints("rp_application")}
    if "uq_rp_application_application_info_id" not in unique_constraints:
        op.create_unique_constraint(
            "uq_rp_application_application_info_id",
            "rp_application",
            ["application_info_id"],
        )

    bind.execute(
        sa.text(
            """
            WITH candidate_matches AS (
                SELECT
                    rp.id AS rp_application_id,
                    ai.id AS application_info_id,
                    COUNT(*) OVER (PARTITION BY ai.id) AS application_info_match_count,
                    COUNT(*) OVER (PARTITION BY rp.id) AS rp_application_match_count
                FROM application_info AS ai
                JOIN workspace AS ws ON ws.id = ai.workspace_id
                JOIN department AS dept ON dept.id = ws.department_id
                JOIN rp_application AS rp
                    ON rp.workspace_id = ai.workspace_id
                   AND rp.is_deleted = FALSE
                   AND rp.application_info_id IS NULL
                   AND rp.name = CONCAT('[', dept.abbreviation, '] - ', ai.application_name)
                WHERE ai.is_deleted = FALSE
            )
            UPDATE rp_application AS rp
            SET application_info_id = candidate_matches.application_info_id
            FROM candidate_matches
            WHERE rp.id = candidate_matches.rp_application_id
              AND candidate_matches.application_info_match_count = 1
              AND candidate_matches.rp_application_match_count = 1
            """
        )
    )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if not inspector.has_table("rp_application"):
        return

    indexes = {index["name"] for index in inspector.get_indexes("rp_application")}
    if "ix_rp_application_application_info_id" in indexes:
        op.drop_index("ix_rp_application_application_info_id", table_name="rp_application")

    unique_constraints = {constraint["name"] for constraint in inspector.get_unique_constraints("rp_application")}
    if "uq_rp_application_application_info_id" in unique_constraints:
        op.drop_constraint("uq_rp_application_application_info_id", "rp_application", type_="unique")

    foreign_keys = {foreign_key["name"] for foreign_key in inspector.get_foreign_keys("rp_application")}
    if "fk_rp_application_application_info_id" in foreign_keys:
        op.drop_constraint("fk_rp_application_application_info_id", "rp_application", type_="foreignkey")

    columns = {column["name"] for column in inspector.get_columns("rp_application")}
    if "application_info_id" in columns:
        op.drop_column("rp_application", "application_info_id")
