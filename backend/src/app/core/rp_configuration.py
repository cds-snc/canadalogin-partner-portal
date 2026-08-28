"""Shared RP-configuration domain normalization."""

from __future__ import annotations

import unicodedata
import uuid as uuid_pkg

RP_CONFIGURATION_NAME_MAX_LENGTH = 128
RP_PARTNER_ENVIRONMENT_MAX_LENGTH = 128
RP_CONFIGURATION_REFERENCE_LENGTH = 8


def normalize_configuration_name(value: str | None) -> str | None:
    """Return one bounded NFC label while preserving optional expand state."""

    if value is None:
        return None
    if not isinstance(value, str):
        raise ValueError("configuration name must be text")

    normalized = unicodedata.normalize("NFC", value.strip())
    if not normalized:
        raise ValueError("configuration name must not be blank")
    if len(normalized) > RP_CONFIGURATION_NAME_MAX_LENGTH:
        raise ValueError(f"configuration name must be at most {RP_CONFIGURATION_NAME_MAX_LENGTH} characters")
    return normalized


def normalize_partner_environment(value: str | None) -> str | None:
    """Return one bounded NFC partner label while preserving legacy absence."""

    if value is None:
        return None
    if not isinstance(value, str):
        raise ValueError("partner environment must be text")

    normalized = unicodedata.normalize("NFC", value.strip())
    if not normalized:
        raise ValueError("partner environment must not be blank")
    if len(normalized) > RP_PARTNER_ENVIRONMENT_MAX_LENGTH:
        raise ValueError(f"partner environment must be at most {RP_PARTNER_ENVIRONMENT_MAX_LENGTH} characters")
    return normalized


def build_default_configuration_name(
    public_name: str | None,
    rp_configuration_uuid: uuid_pkg.UUID,
) -> str:
    """Build a deterministic safe label without provider payload or secrets."""

    normalized_public_name = unicodedata.normalize(
        "NFC",
        (public_name or "").strip(),
    )
    base_name = normalized_public_name or "RP configuration"
    reference = rp_configuration_uuid.hex[:RP_CONFIGURATION_REFERENCE_LENGTH]
    suffix = f" [{reference}]"
    available_base_length = RP_CONFIGURATION_NAME_MAX_LENGTH - len(suffix)
    bounded_base_name = base_name[:available_base_length].rstrip()
    if not bounded_base_name:
        bounded_base_name = "RP configuration"
    return f"{bounded_base_name}{suffix}"
