"""Normalize application info option values to enum keys.

Revision ID: 0009_app_info_enum_keys
Revises: 0008_app_info_contacts
Create Date: 2026-04-16
"""

from collections.abc import Sequence
from typing import Any, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0009_app_info_enum_keys"
down_revision: Union[str, None] = "0008_app_info_contacts"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

application_info_table = sa.table(
    "application_info",
    sa.column("id", sa.Integer()),
    sa.column("authentication_protocol", sa.String()),
    sa.column("identity_proofing_method", sa.String()),
    sa.column("user_types", postgresql.JSONB()),
    sa.column("personal_information_collected", postgresql.JSONB()),
    sa.column("current_sign_in_options", postgresql.JSONB()),
    sa.column("consolidator_used", sa.String()),
    sa.column("current_mfa_options", sa.String()),
)

AUTHENTICATION_PROTOCOL_MAP = {
    "Both OIDC and SAML": "BOTH_OIDC_AND_SAML",
    "None": "NONE",
}

IDENTITY_PROOFING_METHOD_MAP = {
    "It does not": "NONE",
    "External ID provider": "EXTERNAL_ID_PROVIDER",
    "In-person ID provider": "IN_PERSON_ID_PROVIDER",
    "Other (Please specify)": "OTHER",
    "Sign-in partner": "EXTERNAL_ID_PROVIDER",
}

USER_TYPES_MAP = {
    "Members of the public": "PUBLIC",
    "Organizations or businesses": "ORGANIZATIONS_AND_BUSINESSES",
    "Official representatives for service users (e.g. lawyers, accountants, advocates)": "OFFICIAL_REPRESENTATIVES",
}

PERSONAL_INFORMATION_MAP = {
    "First name": "FIRST_NAME",
    "Last name": "LAST_NAME",
    "Email address": "EMAIL_ADDRESS",
    "Date of birth": "DATE_OF_BIRTH",
    "Address (mailing or residential not specified)": "ADDRESS",
}

CURRENT_SIGN_IN_OPTIONS_MAP = {
    "GCKey": "GC_KEY",
    "Interac sign in": "INTERAC_SIGN_IN",
    "Alberta.ca Account (provincial partner)": "ALBERTA_CA_ACCOUNT",
    "BC Services Card (provincial partner)": "BC_SERVICES_CARD",
    "A credential specific to a department or service": "DEPARTMENT_CREDENTIAL",
    "Others (Please specify)": "OTHER",
}

CONSOLIDATOR_USED_MAP = {
    "No consolidator": "NONE",
    "GCCF GCKey & Interact sign in (SAML)": "GCCF_GCKEY_INTERAC_SAML",
    "GCCF Consolidator (OIDC)": "GCCF_CONSOLIDATOR_OIDC",
    "Signin Canada": "SIGNIN_CANADA",
    "Enterprise Cyber Authentication Solution (ECAS)": "ECAS",
}

CURRENT_MFA_OPTIONS_MAP = {
    "No MFA": "NONE",
    "MFAaaS 1.0 (SMS/voice or email, API)": "MFAAS_1",
    "MFAaaS 2.0 (auth app or email, GUI)": "MFAAS_2",
    "MFAaaS 3.0 (auth app, email, SMS/voice, part of GCKey)": "MFAAS_3",
    "Custom MFA built internally": "CUSTOM_INTERNAL",
}


def _normalize_scalar(value: str | None, mapping: dict[str, str]) -> str | None:
    if value is None:
        return None

    return mapping.get(value, value)


def _normalize_array(values: Any, mapping: dict[str, str]) -> Any:
    if not isinstance(values, list):
        return values

    return [mapping.get(value, value) for value in values]


def _migrate(reverse: bool = False) -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if not inspector.has_table("application_info"):
        return

    scalar_maps = {
        "authentication_protocol": AUTHENTICATION_PROTOCOL_MAP,
        "identity_proofing_method": IDENTITY_PROOFING_METHOD_MAP,
        "consolidator_used": CONSOLIDATOR_USED_MAP,
        "current_mfa_options": CURRENT_MFA_OPTIONS_MAP,
    }
    array_maps = {
        "user_types": USER_TYPES_MAP,
        "personal_information_collected": PERSONAL_INFORMATION_MAP,
        "current_sign_in_options": CURRENT_SIGN_IN_OPTIONS_MAP,
    }

    if reverse:
        scalar_maps = {
            field: {mapped_value: legacy_value for legacy_value, mapped_value in mapping.items()}
            for field, mapping in scalar_maps.items()
        }
        array_maps = {
            field: {mapped_value: legacy_value for legacy_value, mapped_value in mapping.items()}
            for field, mapping in array_maps.items()
        }

    rows = bind.execute(
        sa.select(
            application_info_table.c.id,
            application_info_table.c.authentication_protocol,
            application_info_table.c.identity_proofing_method,
            application_info_table.c.user_types,
            application_info_table.c.personal_information_collected,
            application_info_table.c.current_sign_in_options,
            application_info_table.c.consolidator_used,
            application_info_table.c.current_mfa_options,
        )
    ).mappings()

    for row in rows:
        updates: dict[str, Any] = {}

        for field, mapping in scalar_maps.items():
            normalized_value = _normalize_scalar(row[field], mapping)
            if normalized_value != row[field]:
                updates[field] = normalized_value

        for field, mapping in array_maps.items():
            normalized_values = _normalize_array(row[field], mapping)
            if normalized_values != row[field]:
                updates[field] = normalized_values

        if updates:
            bind.execute(
                sa.update(application_info_table)
                .where(application_info_table.c.id == row["id"])
                .values(**updates)
            )


def upgrade() -> None:
    _migrate()


def downgrade() -> None:
    _migrate(reverse=True)
