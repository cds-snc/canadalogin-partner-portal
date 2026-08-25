from src.app.core.rp_configuration_copy_policy import (
    RP_CONFIGURATION_COPY_POLICY_VERSION,
    copy_reusable_rp_configuration_answers,
)


def test_copy_policy_keeps_only_reviewed_reusable_answers_and_is_independent() -> None:
    requested_scopes = ["openid", "profile"]
    source = {
        "application_environment_url_en": "https://source.example.test",
        "client_auth_method": "client_secret_basic",
        "client_type": "confidential",
        "ibm_sv_application_id": "provider-id",
        "jwks_uri": "https://source.example.test/jwks.json",
        "offline_jwk_or_certificate": "public-key-material",
        "pkce_supported": True,
        "redirect_uris": ["https://source.example.test/callback"],
        "requested_scopes": requested_scopes,
        "sector_identifier": "https://source.example.test/sector.json",
    }

    copied = copy_reusable_rp_configuration_answers(source)

    assert RP_CONFIGURATION_COPY_POLICY_VERSION == 1
    assert copied == {
        "client_auth_method": "client_secret_basic",
        "client_type": "confidential",
        "pkce_supported": True,
        "requested_scopes": ["openid", "profile"],
    }
    assert copied["requested_scopes"] is not requested_scopes
    copied["requested_scopes"].append("email")
    assert requested_scopes == ["openid", "profile"]
