"""Prevent Application and RP-configuration public UUID collisions.

Revision ID: 0031_cross_namespace_uuid_guard
Revises: 0030_rp_hierarchy_constraints
Create Date: 2026-08-13

The legacy workspace route resolves both resource types at one path shape. A
locked preflight stops on retained same-workspace collisions, then symmetric
triggers use a transaction-scoped advisory lock to serialize new UUID checks
across both tables.
"""

from __future__ import annotations

from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op

revision: str = "0031_cross_namespace_uuid_guard"
down_revision: Union[str, None] = "0030_rp_hierarchy_constraints"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    connection = op.get_bind()
    connection.execute(sa.text("LOCK TABLE application_information, rp_application IN SHARE ROW EXCLUSIVE MODE"))
    collision = (
        connection.execute(
            sa.text(
                "SELECT w.uuid AS workspace_uuid, ai.uuid AS public_uuid "
                "FROM application_information ai "
                "JOIN rp_application rp "
                "ON rp.workspace_id = ai.workspace_id AND rp.uuid = ai.uuid "
                "JOIN workspace w ON w.id = ai.workspace_id "
                "ORDER BY w.uuid, ai.uuid LIMIT 1"
            )
        )
        .mappings()
        .first()
    )
    if collision is not None:
        raise RuntimeError(
            "Application/RP public UUID collision blocks route activation: "
            f"workspaceUuid={collision['workspace_uuid']} "
            f"publicUuid={collision['public_uuid']}"
        )

    op.execute(
        """
        CREATE FUNCTION guard_application_rp_public_uuid_collision()
        RETURNS trigger
        LANGUAGE plpgsql
        AS $$
        DECLARE
            collision_exists boolean;
        BEGIN
            IF NEW.workspace_id IS NULL THEN
                RETURN NEW;
            END IF;

            PERFORM pg_advisory_xact_lock(
                hashtextextended(NEW.workspace_id::text || ':' || NEW.uuid::text, 0)
            );

            IF TG_TABLE_NAME = 'application_information' THEN
                SELECT EXISTS (
                    SELECT 1 FROM rp_application
                    WHERE workspace_id = NEW.workspace_id AND uuid = NEW.uuid
                ) INTO collision_exists;
            ELSE
                SELECT EXISTS (
                    SELECT 1 FROM application_information
                    WHERE workspace_id = NEW.workspace_id AND uuid = NEW.uuid
                ) INTO collision_exists;
            END IF;

            IF collision_exists THEN
                RAISE EXCEPTION 'Application and RP configuration public UUIDs must not collide within a workspace'
                    USING ERRCODE = '23514';
            END IF;
            RETURN NEW;
        END;
        $$
        """
    )
    op.execute(
        """
        CREATE TRIGGER trg_application_information_public_uuid_guard
        BEFORE INSERT OR UPDATE OF uuid, workspace_id
        ON application_information
        FOR EACH ROW
        EXECUTE FUNCTION guard_application_rp_public_uuid_collision()
        """
    )
    op.execute(
        """
        CREATE TRIGGER trg_rp_application_public_uuid_guard
        BEFORE INSERT OR UPDATE OF uuid, workspace_id
        ON rp_application
        FOR EACH ROW
        EXECUTE FUNCTION guard_application_rp_public_uuid_collision()
        """
    )


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS trg_rp_application_public_uuid_guard ON rp_application")
    op.execute("DROP TRIGGER IF EXISTS trg_application_information_public_uuid_guard ON application_information")
    op.execute("DROP FUNCTION IF EXISTS guard_application_rp_public_uuid_collision()")
