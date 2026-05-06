"""Add application info and contact tables.

Revision ID: 0008_app_info_contacts
Revises: 0007_drop_rp_app_settings
Create Date: 2026-04-14
"""

from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0008_app_info_contacts"
down_revision: Union[str, None] = "0007_drop_rp_app_settings"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if not inspector.has_table("application_info"):
        op.create_table(
            "application_info",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("workspace_id", sa.Integer(), nullable=False),
            sa.Column("uuid", sa.UUID(), nullable=False),
            sa.Column("application_name", sa.String(length=255), nullable=False),
            sa.Column("about_application", sa.Text(), nullable=False),
            sa.Column("program_line_of_business", sa.String(length=255), nullable=False),
            sa.Column("application_url", sa.String(length=500), nullable=False),
            sa.Column("application_description", sa.Text(), nullable=False),
            sa.Column("portal_name", sa.String(length=255), nullable=True),
            sa.Column("technology", sa.String(length=255), nullable=False),
            sa.Column("authentication_protocol", sa.String(length=100), nullable=False),
            sa.Column("planned_oidc_implementation_date", sa.String(length=100), nullable=True),
            sa.Column("tech_stack", sa.Text(), nullable=False),
            sa.Column("requests_profile_data_pushes", sa.Boolean(), nullable=False),
            sa.Column("has_access_management_layer", sa.Boolean(), nullable=False),
            sa.Column("rollback_strategy", sa.Text(), nullable=False),
            sa.Column("credential_assurance_level", sa.String(length=100), nullable=False),
            sa.Column("identity_assurance_level", sa.String(length=100), nullable=False),
            sa.Column("identity_proofing_method", sa.String(length=255), nullable=False),
            sa.Column("identity_proofing_method_other", sa.Text(), nullable=True),
            sa.Column("is_cbas", sa.Boolean(), nullable=False),
            sa.Column("has_account_recovery", sa.Boolean(), nullable=False),
            sa.Column("authority_to_collect_personal_information", sa.Text(), nullable=False),
            sa.Column("has_privacy_notice", sa.Boolean(), nullable=False),
            sa.Column("user_types", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
            sa.Column("user_type_other", sa.Text(), nullable=True),
            sa.Column("monthly_active_users", sa.Integer(), nullable=True),
            sa.Column("peak_usage_periods", sa.Text(), nullable=True),
            sa.Column("personal_information_collected", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
            sa.Column("personal_information_other", sa.Text(), nullable=True),
            sa.Column("current_sign_in_options", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
            sa.Column("current_sign_in_options_other", sa.Text(), nullable=True),
            sa.Column("consolidator_used", sa.String(length=255), nullable=True),
            sa.Column("current_mfa_options", sa.String(length=255), nullable=True),
            sa.Column("uses_canadalogin_migration", sa.Boolean(), nullable=False),
            sa.Column("migration_rationale", sa.Text(), nullable=True),
            sa.Column("schedule_blackout_periods", sa.Text(), nullable=True),
            sa.Column("transition_risks", sa.Text(), nullable=True),
            sa.Column("transition_mitigations", sa.Text(), nullable=True),
            sa.Column("created_by", sa.Integer(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("is_deleted", sa.Boolean(), nullable=False),
            sa.ForeignKeyConstraint(["created_by"], ["user.id"]),
            sa.ForeignKeyConstraint(["workspace_id"], ["workspace.id"]),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("uuid"),
        )
        op.create_index(op.f("ix_application_info_workspace_id"), "application_info", ["workspace_id"], unique=False)
        op.create_index(op.f("ix_application_info_is_deleted"), "application_info", ["is_deleted"], unique=False)

    if not inspector.has_table("application_contact"):
        op.create_table(
            "application_contact",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("application_info_id", sa.Integer(), nullable=False),
            sa.Column("uuid", sa.UUID(), nullable=False),
            sa.Column("first_name", sa.String(length=100), nullable=False),
            sa.Column("last_name", sa.String(length=100), nullable=False),
            sa.Column("title_role", sa.String(length=255), nullable=False),
            sa.Column("email", sa.String(length=255), nullable=False),
            sa.Column("phone_number", sa.String(length=50), nullable=False),
            sa.Column("alternate_phone_number", sa.String(length=50), nullable=True),
            sa.Column("contact_type", sa.String(length=100), nullable=True),
            sa.Column("action", sa.String(length=100), nullable=True),
            sa.Column("contact_roles", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("is_deleted", sa.Boolean(), nullable=False),
            sa.ForeignKeyConstraint(["application_info_id"], ["application_info.id"]),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("uuid"),
        )
        op.create_index(op.f("ix_application_contact_application_info_id"), "application_contact", ["application_info_id"], unique=False)
        op.create_index(op.f("ix_application_contact_is_deleted"), "application_contact", ["is_deleted"], unique=False)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if inspector.has_table("application_contact"):
        op.drop_index(op.f("ix_application_contact_is_deleted"), table_name="application_contact")
        op.drop_index(op.f("ix_application_contact_application_info_id"), table_name="application_contact")
        op.drop_table("application_contact")

    if inspector.has_table("application_info"):
        op.drop_index(op.f("ix_application_info_is_deleted"), table_name="application_info")
        op.drop_index(op.f("ix_application_info_workspace_id"), table_name="application_info")
        op.drop_table("application_info")