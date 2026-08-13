import pytest
from pydantic import ValidationError
from src.app.schemas.rp_application import (
    WorkspaceRPApplicationRegistrationCreate,
    WorkspaceRPApplicationRegistrationDraftCreate,
    WorkspaceRPApplicationRegistrationDraftPatch,
    WorkspaceRPApplicationRegistrationDraftRead,
    WorkspaceRPApplicationRegistrationUpdate,
)


def make_valid_registration_payload() -> dict[str, object]:
    return {
        "application_information_uuid": "018f6f83-0000-0000-0000-000000000501",
        "configuration_name": "Staging integration A",
        "partner_environment": "Partner QA 2",
        "canada_login_environment": "staging",
        "service_name_en": "Benefits Portal",
        "service_name_fr": "Portail des prestations",
        "application_environment_url_en": "https://benefits.canada.ca",
        "application_environment_url_fr": "https://prestations.canada.ca",
        "redirect_uris": ["https://benefits.canada.ca/callback"],
        "post_logout_redirect_uris": ["https://benefits.canada.ca/logout-complete"],
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
    def test_draft_create_requires_only_valid_basics(self) -> None:
        payload = WorkspaceRPApplicationRegistrationDraftCreate(
            applicationInformationUuid="018f6f83-0000-0000-0000-000000000501",
            configurationName="Test integration A",
            partnerEnvironment="  Cafe\N{COMBINING ACUTE ACCENT} QA  ",
            canadaLoginEnvironment="test",
            serviceNameEn="Benefits Portal",
            serviceNameFr="Portail des prestations",
        )

        assert payload.model_dump(mode="json", by_alias=True, exclude_none=True) == {
            "applicationInformationUuid": "018f6f83-0000-0000-0000-000000000501",
            "configurationName": "Test integration A",
            "partnerEnvironment": "Café QA",
            "canadaLoginEnvironment": "test",
            "serviceNameEn": "Benefits Portal",
            "serviceNameFr": "Portail des prestations",
        }

    def test_partial_draft_patch_does_not_claim_step_completeness(self) -> None:
        payload = WorkspaceRPApplicationRegistrationDraftPatch(
            stepId="signing",
            saveMode="partial",
            expectedDraftVersion=3,
            registrationAnswers={"requestSigningSupported": False},
        )

        assert payload.registration_answers.request_signing_supported is False
        assert payload.registration_answers.request_signing_roadmap is None

    def test_draft_read_exposes_only_public_ids_typed_answers_and_flow_metadata(
        self,
    ) -> None:
        payload = WorkspaceRPApplicationRegistrationDraftRead.model_validate(
            {
                "workspaceUuid": "018f6f83-0000-0000-0000-000000000201",
                "rpApplicationUuid": "018f6f83-0000-0000-0000-000000000701",
                "applicationInformationUuid": "018f6f83-0000-0000-0000-000000000501",
                "configurationName": "Test integration A",
                "partnerEnvironment": "QA 2",
                "onboardingState": "draft",
                "registrationDraftVersion": 2,
                "registrationLastCompletedStep": "endpoints",
                "registrationAnswers": {
                    "serviceNameEn": "Benefits Portal",
                    "serviceNameFr": "Portail des prestations",
                },
                "id": 33,
                "createdBy": 42,
                "oidcRegistrationPayload": {"unsafe": "raw"},
            }
        )

        serialized = payload.model_dump(mode="json", by_alias=True)
        assert serialized["workspaceUuid"] == "018f6f83-0000-0000-0000-000000000201"
        assert serialized["registrationAnswers"]["serviceNameEn"] == "Benefits Portal"
        assert serialized["partnerEnvironment"] == "QA 2"
        assert "partnerEnvironment" not in serialized["registrationAnswers"]
        assert "id" not in serialized
        assert "createdBy" not in serialized
        assert "oidcRegistrationPayload" not in serialized

    @pytest.mark.parametrize(
        "unsafe_material",
        [
            '{"kty":"RSA","n":"public","e":"AQAB","d":"private"}',
            '{"kty":"oct","k":"symmetric"}',
            "-----BEGIN PRIVATE KEY-----\nsecret\n-----END PRIVATE KEY-----",
            "not a certificate or JWK",
        ],
    )
    def test_partial_draft_rejects_private_or_untyped_offline_key_material(
        self,
        unsafe_material: str,
    ) -> None:
        with pytest.raises(ValidationError, match="offline_jwk_or_certificate"):
            WorkspaceRPApplicationRegistrationDraftPatch(
                stepId="client-and-access",
                saveMode="partial",
                expectedDraftVersion=1,
                registrationAnswers={
                    "offlineJwkOrCertificate": unsafe_material,
                },
            )

    @pytest.mark.parametrize(
        "public_material",
        [
            '{"kty":"RSA","n":"public-modulus","e":"AQAB"}',
            "-----BEGIN CERTIFICATE-----\nPUBLIC\n-----END CERTIFICATE-----",
        ],
    )
    def test_partial_draft_accepts_public_offline_key_material(
        self,
        public_material: str,
    ) -> None:
        payload = WorkspaceRPApplicationRegistrationDraftPatch(
            stepId="client-and-access",
            saveMode="partial",
            expectedDraftVersion=1,
            registrationAnswers={
                "offlineJwkOrCertificate": public_material,
            },
        )

        assert payload.registration_answers.offline_jwk_or_certificate == public_material

    def test_create_accepts_valid_questionnaire_payload(self) -> None:
        payload = WorkspaceRPApplicationRegistrationCreate(**make_valid_registration_payload())

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
            WorkspaceRPApplicationRegistrationUpdate(client_auth_method="private_key_jwt")
