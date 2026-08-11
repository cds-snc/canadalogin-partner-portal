import pytest
from pydantic import ValidationError

from src.app.schemas.rp_application import (
    WorkspaceRPApplicationRegistrationCreate,
    WorkspaceRPApplicationRegistrationUpdate,
)


def make_valid_registration_payload() -> dict[str, object]:
    return {
        "application_information_uuid": "018f6f83-0000-0000-0000-000000000501",
        "canada_login_environment": "staging",
        "service_name_en": "Benefits Portal",
        "service_name_fr": "Portail des prestations",
        "application_environment_url_en": "https://benefits.canada.ca",
        "application_environment_url_fr": "https://prestations.canada.ca",
        "redirect_uris": ["https://benefits.canada.ca/callback"],
        "post_logout_redirect_uris": [
            "https://benefits.canada.ca/logout-complete"
        ],
        "logout_mode": "front_channel",
        "logout_uri": "https://benefits.canada.ca/logout",
        "client_type": "confidential",
        "supports_authorization_code_flow": True,
        "client_auth_method": "private_key_jwt",
        "private_key_distribution_method": "jwks_uri",
        "jwks_uri": "https://benefits.canada.ca/.well-known/jwks.json",
        "requested_scopes": ["openid", "profile", "email"],
        "sector_identifier": "https://benefits.canada.ca",
        "shares_pairwise_identifiers": False,
        "migration_sector_identifier_url": "https://benefits.canada.ca/sector.json",
        "pkce_supported": True,
        "pkce_algorithms": ["S256"],
        "request_signing_supported": False,
        "request_signing_roadmap": True,
        "request_signing_revisit_on": "2027-03",
        "signature_validation_supported": True,
        "signature_validation_targets": ["id_token", "userinfo"],
        "signature_validation_algorithms": ["RS256"],
        "request_encryption_supported": False,
        "request_encryption_roadmap": False,
        "message_decryption_supported": True,
        "message_decryption_targets": ["id_token", "userinfo"],
        "message_decryption_key_management_algorithms": ["RSA-OAEP-256"],
        "message_decryption_content_algorithms": ["A256GCM"],
    }


class TestWorkspaceRPApplicationRegistrationSchemas:
    def test_create_accepts_valid_questionnaire_payload(self) -> None:
        payload = WorkspaceRPApplicationRegistrationCreate(
            **make_valid_registration_payload()
        )

        assert payload.canada_login_environment == "staging"
        assert payload.requested_scopes == ["openid", "profile", "email"]
        assert payload.logout_mode == "front_channel"

    def test_create_requires_openid_scope(self) -> None:
        payload = make_valid_registration_payload()
        payload["requested_scopes"] = ["profile", "email"]

        with pytest.raises(ValidationError, match="requested_scopes must include 'openid'"):
            WorkspaceRPApplicationRegistrationCreate(**payload)

    def test_create_requires_pkce_for_public_clients(self) -> None:
        payload = make_valid_registration_payload()
        payload["client_type"] = "public"
        payload["pkce_supported"] = False

        with pytest.raises(ValidationError, match="pkce_supported must be true for public clients"):
            WorkspaceRPApplicationRegistrationCreate(**payload)

    def test_create_requires_private_key_branch_value(self) -> None:
        payload = make_valid_registration_payload()
        payload["jwks_uri"] = None

        with pytest.raises(
            ValidationError,
            match="jwks_uri is required when private_key_distribution_method is jwks_uri",
        ):
            WorkspaceRPApplicationRegistrationCreate(**payload)

    def test_create_rejects_front_channel_logout_for_non_canada_ca_domains(self) -> None:
        payload = make_valid_registration_payload()
        payload["application_environment_url_en"] = "https://benefits.example.gc.ca"

        with pytest.raises(
            ValidationError,
            match="front_channel logout is allowed only for RP applications under canada.ca",
        ):
            WorkspaceRPApplicationRegistrationCreate(**payload)

    def test_create_requires_other_algorithm_detail(self) -> None:
        payload = make_valid_registration_payload()
        payload["message_decryption_key_management_algorithms"] = ["other"]

        with pytest.raises(
            ValidationError,
            match="message_decryption_other_key_management_algorithm is required when 'other' is selected",
        ):
            WorkspaceRPApplicationRegistrationCreate(**payload)

    def test_create_requires_roadmap_answer_for_unsupported_capability(self) -> None:
        payload = make_valid_registration_payload()
        payload["request_encryption_roadmap"] = None

        with pytest.raises(
            ValidationError,
            match="request_encryption_roadmap is required when request_encryption_supported is false",
        ):
            WorkspaceRPApplicationRegistrationCreate(**payload)

    def test_update_allows_partial_questionnaire_changes(self) -> None:
        payload = WorkspaceRPApplicationRegistrationUpdate(
            request_signing_supported=False,
            request_signing_roadmap=False,
        )

        assert payload.request_signing_supported is False
        assert payload.request_signing_roadmap is False

    def test_update_requires_private_key_distribution_when_switching_auth_method(self) -> None:
        with pytest.raises(
            ValidationError,
            match="private_key_distribution_method is required when client_auth_method is private_key_jwt",
        ):
            WorkspaceRPApplicationRegistrationUpdate(
                client_auth_method="private_key_jwt"
            )
