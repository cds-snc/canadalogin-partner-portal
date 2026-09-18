"""Create application ERD tables and seed lookup catalogs.

Revision ID: 0010_application_erd_tables
Revises: 0009_dynamic_user_roles
Create Date: 2026-09-15

"""

from __future__ import annotations

from collections.abc import Sequence
from datetime import UTC, datetime
from typing import Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql
from uuid6 import uuid7

revision: str = "0010_application_erd_tables"
down_revision: Union[str, None] = "0009_dynamic_user_roles"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


LOOKUP_SEEDS = {
    "application_configuration_status": [
        {"code": "draft", "label_en": "Draft", "label_fr": "Brouillon"},
        {"code": "submitted", "label_en": "Submitted", "label_fr": "Soumis"},
        {"code": "published", "label_en": "Published", "label_fr": "Publié"},
    ],
    "tenant": [
        {"code": "test", "label_en": "Test", "label_fr": "Test"},
        {"code": "staging", "label_en": "Staging", "label_fr": "Préproduction"},
        {"code": "production", "label_en": "Production", "label_fr": "Production"},
    ],
    "application_configuration_client_type": [
        {"code": "public", "label_en": "Public", "label_fr": "Public"},
        {"code": "confidential", "label_en": "Confidential", "label_fr": "Confidentiel"},
    ],
    "signing_algorithm": [
        {"code": "RS256"},
        {"code": "RS384"},
        {"code": "RS512"},
        {"code": "PS256"},
        {"code": "PS384"},
        {"code": "PS512"},
        {"code": "ES256"},
        {"code": "ES384"},
        {"code": "ES512"},
    ],
    "encryption_key_algorithm": [
        {"code": "RSA-OAEP"},
        {"code": "RSA-OAEP-256"},
    ],
    "encryption_content_algorithm": [
        {"code": "A128GCM"},
        {"code": "A192GCM"},
        {"code": "A256GCM"},
    ],
    "client_auth_method": [
        {"code": "private_key_jwt", "label_en": "Private Key JWT", "label_fr": "JWT de clé privée"},
        {"code": "client_secret_basic", "label_en": "Client Secret (Basic)", "label_fr": "Secret client (Basic)"},
        {"code": "client_secret_post", "label_en": "Client Secret (POST)", "label_fr": "Secret client (POST)"},
    ],
    "authentication_protocol": [
        {"code": "oidc", "label_en": "OpenID Connect", "label_fr": "OpenID Connect"},
        {"code": "saml", "label_en": "SAML 2.0", "label_fr": "SAML 2.0"},
    ],
    "logout_method": [
        {"code": "front_channel", "label_en": "Front-Channel", "label_fr": "Canal frontal"},
        {"code": "back_channel", "label_en": "Back-Channel", "label_fr": "Canal arrière"},
    ],
}


def upgrade() -> None:
    op.create_table(
        "application_configuration_status",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("code", sa.String(length=64), nullable=False),
        sa.Column("display_order", sa.Integer(), nullable=False),
        sa.Column("is_deprecated", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("label_en", sa.String(length=64), nullable=True),
        sa.Column("label_fr", sa.String(length=64), nullable=True),
        sa.Column("uuid", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code"),
        sa.UniqueConstraint("uuid"),
    )
    op.create_index(op.f("ix_application_configuration_status_code"), "application_configuration_status", ["code"], unique=True)
    op.create_index(op.f("ix_application_configuration_status_display_order"), "application_configuration_status", ["display_order"], unique=False)
    op.create_index(op.f("ix_application_configuration_status_is_deprecated"), "application_configuration_status", ["is_deprecated"], unique=False)
    op.create_index(op.f("ix_application_configuration_status_is_deleted"), "application_configuration_status", ["is_deleted"], unique=False)

    op.create_table(
        "application_configuration_default_attribute_mapping",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("target_name", sa.String(length=128), nullable=False),
        sa.Column("source_id", sa.String(length=128), nullable=False),
        sa.Column("source_kind", sa.String(length=128), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_application_configuration_default_attribute_mapping_is_deleted"),
        "application_configuration_default_attribute_mapping",
        ["is_deleted"],
        unique=False,
    )

    op.create_table(
        "tenant",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("code", sa.String(length=64), nullable=False),
        sa.Column("display_order", sa.Integer(), nullable=False),
        sa.Column("is_deprecated", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("label_en", sa.String(length=64), nullable=True),
        sa.Column("label_fr", sa.String(length=64), nullable=True),
        sa.Column("tenant_url", sa.String(length=512), nullable=True),
        sa.Column("authorize_endpoint_context_salt", sa.String(length=128), nullable=True),
        sa.Column("default_identity_source_id", sa.String(length=256), nullable=True),
        sa.Column("default_template_id", sa.String(length=256), nullable=True),
        sa.Column("default_auth_policy_id", sa.String(length=256), nullable=True),
        sa.Column("default_theme_id", sa.String(length=128), nullable=True),
        sa.Column("uuid", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code"),
        sa.UniqueConstraint("uuid"),
    )
    op.create_index(op.f("ix_tenant_code"), "tenant", ["code"], unique=True)
    op.create_index(op.f("ix_tenant_display_order"), "tenant", ["display_order"], unique=False)
    op.create_index(op.f("ix_tenant_is_deprecated"), "tenant", ["is_deprecated"], unique=False)
    op.create_index(op.f("ix_tenant_is_deleted"), "tenant", ["is_deleted"], unique=False)

    for table_name in ("signing_algorithm", "encryption_key_algorithm", "encryption_content_algorithm"):
        op.create_table(
            table_name,
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("code", sa.String(length=64), nullable=False),
            sa.Column("display_order", sa.Integer(), nullable=False),
            sa.Column("is_deprecated", sa.Boolean(), nullable=False, server_default=sa.text("false")),
            sa.Column("uuid", sa.UUID(), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("is_deleted", sa.Boolean(), nullable=False),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("code"),
            sa.UniqueConstraint("uuid"),
        )
        op.create_index(op.f(f"ix_{table_name}_code"), table_name, ["code"], unique=True)
        op.create_index(op.f(f"ix_{table_name}_display_order"), table_name, ["display_order"], unique=False)
        op.create_index(op.f(f"ix_{table_name}_is_deprecated"), table_name, ["is_deprecated"], unique=False)
        op.create_index(op.f(f"ix_{table_name}_is_deleted"), table_name, ["is_deleted"], unique=False)

    op.create_table(
        "application_configuration_client_type",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("code", sa.String(length=64), nullable=False),
        sa.Column("display_order", sa.Integer(), nullable=False),
        sa.Column("is_deprecated", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("label_en", sa.String(length=64), nullable=True),
        sa.Column("label_fr", sa.String(length=64), nullable=True),
        sa.Column("uuid", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code"),
        sa.UniqueConstraint("uuid"),
    )
    op.create_index(op.f("ix_application_configuration_client_type_code"), "application_configuration_client_type", ["code"], unique=True)
    op.create_index(
        op.f("ix_application_configuration_client_type_display_order"),
        "application_configuration_client_type",
        ["display_order"],
        unique=False,
    )
    op.create_index(
        op.f("ix_application_configuration_client_type_is_deprecated"),
        "application_configuration_client_type",
        ["is_deprecated"],
        unique=False,
    )
    op.create_index(
        op.f("ix_application_configuration_client_type_is_deleted"),
        "application_configuration_client_type",
        ["is_deleted"],
        unique=False,
    )

    op.create_table(
        "client_auth_method",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("code", sa.String(length=64), nullable=False),
        sa.Column("display_order", sa.Integer(), nullable=False),
        sa.Column("is_deprecated", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("label_en", sa.String(length=64), nullable=True),
        sa.Column("label_fr", sa.String(length=64), nullable=True),
        sa.Column("uuid", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code"),
        sa.UniqueConstraint("uuid"),
    )
    op.create_index(op.f("ix_client_auth_method_code"), "client_auth_method", ["code"], unique=True)
    op.create_index(op.f("ix_client_auth_method_display_order"), "client_auth_method", ["display_order"], unique=False)
    op.create_index(op.f("ix_client_auth_method_is_deprecated"), "client_auth_method", ["is_deprecated"], unique=False)
    op.create_index(op.f("ix_client_auth_method_is_deleted"), "client_auth_method", ["is_deleted"], unique=False)

    for table_name in ("authentication_protocol", "logout_method"):
        op.create_table(
            table_name,
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("code", sa.String(length=64), nullable=False),
            sa.Column("display_order", sa.Integer(), nullable=False),
            sa.Column("is_deprecated", sa.Boolean(), nullable=False, server_default=sa.text("false")),
            sa.Column("label_en", sa.String(length=64), nullable=True),
            sa.Column("label_fr", sa.String(length=64), nullable=True),
            sa.Column("uuid", sa.UUID(), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("is_deleted", sa.Boolean(), nullable=False),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("code"),
            sa.UniqueConstraint("uuid"),
        )
        op.create_index(op.f(f"ix_{table_name}_code"), table_name, ["code"], unique=True)
        op.create_index(op.f(f"ix_{table_name}_display_order"), table_name, ["display_order"], unique=False)
        op.create_index(op.f(f"ix_{table_name}_is_deprecated"), table_name, ["is_deprecated"], unique=False)
        op.create_index(op.f(f"ix_{table_name}_is_deleted"), table_name, ["is_deleted"], unique=False)

    op.create_table(
        "partner_group",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("department_id", sa.Integer(), nullable=False),
        sa.Column("name_en", sa.String(length=256), nullable=False),
        sa.Column("name_fr", sa.String(length=256), nullable=True),
        sa.Column("uuid", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(["department_id"], ["department.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("uuid"),
    )
    op.create_index(op.f("ix_partner_group_department_id"), "partner_group", ["department_id"], unique=False)
    op.create_index(op.f("ix_partner_group_is_deleted"), "partner_group", ["is_deleted"], unique=False)

    op.create_table(
        "application",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("partner_group_id", sa.Integer(), nullable=False),
        sa.Column("name_en", sa.String(length=256), nullable=False),
        sa.Column("name_fr", sa.String(length=256), nullable=True),
        sa.Column("uuid", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(["partner_group_id"], ["partner_group.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("uuid"),
    )
    op.create_index(op.f("ix_application_partner_group_id"), "application", ["partner_group_id"], unique=False)
    op.create_index(op.f("ix_application_is_deleted"), "application", ["is_deleted"], unique=False)

    op.create_table(
        "application_configuration",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("application_id", sa.Integer(), nullable=False),
        sa.Column("application_configuration_status_id", sa.Integer(), nullable=False),
        sa.Column("application_configuration_client_type_id", sa.Integer(), nullable=False),
        sa.Column("authentication_protocol_id", sa.Integer(), nullable=False),
        sa.Column("tenant_id", sa.Integer(), nullable=False),
        sa.Column("partner_label", sa.String(length=512), nullable=False),
        sa.Column("application_url_en", sa.String(length=512), nullable=False),
        sa.Column("application_url_fr", sa.String(length=512), nullable=False),
        sa.Column("config", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("config_version", sa.String(length=32), nullable=True),
        sa.Column("ibm_application_id", sa.String(length=128), nullable=True),
        sa.Column("ibm_client_id", sa.String(length=128), nullable=True),
        sa.Column("dnr_application_name", sa.String(length=128), nullable=True),
        sa.Column("uuid", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(["application_id"], ["application.id"]),
        sa.ForeignKeyConstraint(["application_configuration_client_type_id"], ["application_configuration_client_type.id"]),
        sa.ForeignKeyConstraint(["application_configuration_status_id"], ["application_configuration_status.id"]),
        sa.ForeignKeyConstraint(["authentication_protocol_id"], ["authentication_protocol.id"]),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenant.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("uuid"),
    )
    op.create_index(op.f("ix_application_configuration_application_id"), "application_configuration", ["application_id"], unique=False)
    op.create_index(
        op.f("ix_application_configuration_application_configuration_client_type_id"),
        "application_configuration",
        ["application_configuration_client_type_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_application_configuration_application_configuration_status_id"),
        "application_configuration",
        ["application_configuration_status_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_application_configuration_authentication_protocol_id"),
        "application_configuration",
        ["authentication_protocol_id"],
        unique=False,
    )
    op.create_index(op.f("ix_application_configuration_is_deleted"), "application_configuration", ["is_deleted"], unique=False)
    op.create_index(op.f("ix_application_configuration_tenant_id"), "application_configuration", ["tenant_id"], unique=False)

    _seed_lookup_rows()


def _seed_lookup_rows() -> None:
    bind = op.get_bind()
    now = datetime.now(UTC)

    for table_name, seeds in LOOKUP_SEEDS.items():
        lookup_table = sa.table(
            table_name,
            sa.column("code", sa.String(length=64)),
            sa.column("display_order", sa.Integer()),
            sa.column("label_en", sa.String(length=64)),
            sa.column("label_fr", sa.String(length=64)),
            sa.column("uuid", postgresql.UUID(as_uuid=True)),
            sa.column("created_at", sa.DateTime(timezone=True)),
            sa.column("deleted_at", sa.DateTime(timezone=True)),
            sa.column("is_deleted", sa.Boolean()),
            sa.column("is_deprecated", sa.Boolean()),
        )
        existing_codes = set(bind.execute(sa.select(lookup_table.c.code)).scalars())
        rows = [
            {
                **seed,
                "display_order": display_order,
                "uuid": uuid7(),
                "created_at": now,
                "deleted_at": None,
                "is_deleted": False,
                "is_deprecated": False,
            }
            for display_order, seed in enumerate(seeds, start=1)
            if seed["code"] not in existing_codes
        ]
        if rows:
            bind.execute(sa.insert(lookup_table), rows)


def downgrade() -> None:
    op.drop_index(op.f("ix_application_configuration_tenant_id"), table_name="application_configuration")
    op.drop_index(op.f("ix_application_configuration_is_deleted"), table_name="application_configuration")
    op.drop_index(op.f("ix_application_configuration_authentication_protocol_id"), table_name="application_configuration")
    op.drop_index(op.f("ix_application_configuration_application_configuration_status_id"), table_name="application_configuration")
    op.drop_index(op.f("ix_application_configuration_application_configuration_client_type_id"), table_name="application_configuration")
    op.drop_index(op.f("ix_application_configuration_application_id"), table_name="application_configuration")
    op.drop_table("application_configuration")

    for table_name in ("logout_method", "authentication_protocol"):
        op.drop_index(op.f(f"ix_{table_name}_is_deleted"), table_name=table_name)
        op.drop_index(op.f(f"ix_{table_name}_is_deprecated"), table_name=table_name)
        op.drop_index(op.f(f"ix_{table_name}_display_order"), table_name=table_name)
        op.drop_index(op.f(f"ix_{table_name}_code"), table_name=table_name)
        op.drop_table(table_name)

    op.drop_index(op.f("ix_application_is_deleted"), table_name="application")
    op.drop_index(op.f("ix_application_partner_group_id"), table_name="application")
    op.drop_table("application")

    op.drop_index(op.f("ix_partner_group_is_deleted"), table_name="partner_group")
    op.drop_index(op.f("ix_partner_group_department_id"), table_name="partner_group")
    op.drop_table("partner_group")

    op.drop_index(op.f("ix_client_auth_method_is_deleted"), table_name="client_auth_method")
    op.drop_index(op.f("ix_client_auth_method_is_deprecated"), table_name="client_auth_method")
    op.drop_index(op.f("ix_client_auth_method_display_order"), table_name="client_auth_method")
    op.drop_index(op.f("ix_client_auth_method_code"), table_name="client_auth_method")
    op.drop_table("client_auth_method")

    op.drop_index(op.f("ix_application_configuration_client_type_is_deleted"), table_name="application_configuration_client_type")
    op.drop_index(op.f("ix_application_configuration_client_type_is_deprecated"), table_name="application_configuration_client_type")
    op.drop_index(op.f("ix_application_configuration_client_type_display_order"), table_name="application_configuration_client_type")
    op.drop_index(op.f("ix_application_configuration_client_type_code"), table_name="application_configuration_client_type")
    op.drop_table("application_configuration_client_type")

    for table_name in ("encryption_content_algorithm", "encryption_key_algorithm", "signing_algorithm"):
        op.drop_index(op.f(f"ix_{table_name}_is_deleted"), table_name=table_name)
        op.drop_index(op.f(f"ix_{table_name}_is_deprecated"), table_name=table_name)
        op.drop_index(op.f(f"ix_{table_name}_display_order"), table_name=table_name)
        op.drop_index(op.f(f"ix_{table_name}_code"), table_name=table_name)
        op.drop_table(table_name)

    op.drop_index(op.f("ix_tenant_is_deleted"), table_name="tenant")
    op.drop_index(op.f("ix_tenant_is_deprecated"), table_name="tenant")
    op.drop_index(op.f("ix_tenant_display_order"), table_name="tenant")
    op.drop_index(op.f("ix_tenant_code"), table_name="tenant")
    op.drop_table("tenant")

    op.drop_index(
        op.f("ix_application_configuration_default_attribute_mapping_is_deleted"),
        table_name="application_configuration_default_attribute_mapping",
    )
    op.drop_table("application_configuration_default_attribute_mapping")

    op.drop_index(op.f("ix_application_configuration_status_is_deleted"), table_name="application_configuration_status")
    op.drop_index(op.f("ix_application_configuration_status_is_deprecated"), table_name="application_configuration_status")
    op.drop_index(op.f("ix_application_configuration_status_display_order"), table_name="application_configuration_status")
    op.drop_index(op.f("ix_application_configuration_status_code"), table_name="application_configuration_status")
    op.drop_table("application_configuration_status")
