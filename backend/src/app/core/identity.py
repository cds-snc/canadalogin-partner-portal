"""Server-owned identity helpers for partner-access admission."""

from __future__ import annotations

from collections.abc import Mapping, Sequence
from typing import Any

AUTHENTICATED_EMAIL_KEY = "_authenticated_verified_email"
AUTHENTICATED_EMAIL_VERIFIED_KEY = "_authenticated_email_verified"
AUTHENTICATION_PROVIDER_KEY = "_authentication_provider"

SESSION_AUTHENTICATED_EMAIL_KEY = "authenticated_verified_email"
SESSION_AUTHENTICATED_EMAIL_VERIFIED_KEY = "authenticated_email_verified"
SESSION_AUTHENTICATION_PROVIDER_KEY = "authentication_provider"
SESSION_PREPARED_INVITATION_UUID_KEY = "prepared_invitation_uuid"


def normalize_email_identity(value: object) -> str | None:
    """Return the one deliberately narrow email normalization used by invites."""

    if not isinstance(value, str):
        return None
    normalized = value.strip().lower()
    if not normalized or normalized.count("@") != 1:
        return None
    local_part, domain = normalized.rsplit("@", 1)
    if not local_part or not domain or domain.startswith(".") or domain.endswith("."):
        return None
    return normalized


def resolve_verified_email_claim(claims: Mapping[str, Any]) -> str | None:
    """Resolve one unambiguous verified email from trusted OIDC claims.

    ``email_verified`` must be the JSON boolean ``true``. Duplicate claim names
    are tolerated only when they normalize to the same exact address; provider
    aliases, plus-addressing, and dot rewriting are intentionally not applied.
    """

    if claims.get("email_verified") is not True:
        return None

    resolved: set[str] = set()
    for claim_name in ("email", "mail"):
        raw_value = claims.get(claim_name)
        if raw_value is None:
            continue
        if isinstance(raw_value, Sequence) and not isinstance(raw_value, str):
            return None
        normalized = normalize_email_identity(raw_value)
        if normalized is None:
            return None
        resolved.add(normalized)

    if len(resolved) != 1:
        return None
    return next(iter(resolved))


def normalize_partner_access_domain(value: object) -> str:
    """Normalize one exact permitted email domain or reject unsafe syntax."""

    if not isinstance(value, str):
        raise ValueError("partner-access email domains must be text")
    normalized = value.strip().lower().removeprefix("@")
    labels = normalized.split(".")
    if (
        not normalized
        or len(normalized) > 253
        or normalized.startswith(".")
        or normalized.endswith(".")
        or ".." in normalized
        or "@" in normalized
        or ":" in normalized
        or "/" in normalized
        or "*" in normalized
        or any(
            not label
            or len(label) > 63
            or label.startswith("-")
            or label.endswith("-")
            or not all(character.isalnum() or character == "-" for character in label)
            for label in labels
        )
    ):
        raise ValueError("partner-access email domains must be exact domain names")
    return normalized


def email_satisfies_partner_access_policy(
    email: object,
    allowed_domains: Sequence[str],
) -> bool:
    """Return whether an email belongs to one configured exact domain."""

    normalized_email = normalize_email_identity(email)
    if normalized_email is None:
        return False
    domain = normalized_email.rsplit("@", 1)[1]
    return domain in allowed_domains
