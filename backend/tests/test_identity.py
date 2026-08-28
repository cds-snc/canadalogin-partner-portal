from src.app.core.identity import (
    email_satisfies_partner_access_policy,
    normalize_email_identity,
    normalize_partner_access_domain,
    resolve_verified_email_claim,
)


def test_email_identity_normalization_is_exact_and_minimal() -> None:
    assert normalize_email_identity(" Person+tag@Example.GC.CA ") == "person+tag@example.gc.ca"
    assert normalize_email_identity("person@example.gc.ca") != normalize_email_identity("person+tag@example.gc.ca")
    assert normalize_email_identity("not-an-email") is None


def test_verified_email_claim_requires_boolean_verification_and_no_conflict() -> None:
    assert (
        resolve_verified_email_claim(
            {
                "email": " Person@Example.GC.CA ",
                "mail": "person@example.gc.ca",
                "email_verified": True,
            }
        )
        == "person@example.gc.ca"
    )
    assert resolve_verified_email_claim({"email": "person@example.gc.ca", "email_verified": "true"}) is None
    assert (
        resolve_verified_email_claim(
            {
                "email": "person@example.gc.ca",
                "mail": "other@example.gc.ca",
                "email_verified": True,
            }
        )
        is None
    )
    assert resolve_verified_email_claim({"email": ["person@example.gc.ca"], "email_verified": True}) is None


def test_partner_access_policy_uses_exact_configured_domains() -> None:
    domains = [normalize_partner_access_domain("@Example.GC.CA")]

    assert email_satisfies_partner_access_policy("person@example.gc.ca", domains)
    assert not email_satisfies_partner_access_policy("person@sub.example.gc.ca", domains)
    assert not email_satisfies_partner_access_policy("person@example.ca", domains)
