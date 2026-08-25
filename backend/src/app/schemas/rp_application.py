import json
import uuid as uuid_pkg
from collections.abc import Sequence
from datetime import datetime
from typing import Literal, Optional

from pydantic import AnyHttpUrl, BaseModel, ConfigDict, Field, field_validator, model_validator
from pydantic.alias_generators import to_camel
from uuid6 import uuid7

from ..core.authorization import CanonicalRoleCode
from ..core.rp_configuration import normalize_configuration_name, normalize_partner_environment
from ..core.schemas import PersistentDeletion, UUIDSchema
from .authorization import AccessibleRPApplicationAuthorizationRead
from .onboarding import OnboardingLifecycleRead, OnboardingState

CanadaLoginEnvironment = Literal["test", "staging", "production"]
LogoutMode = Literal["back_channel", "front_channel"]
ClientType = Literal["confidential", "public"]
ClientAuthMethod = Literal[
    "private_key_jwt",
    "client_secret_basic",
    "client_secret_post",
]
PrivateKeyDistributionMethod = Literal[
    "jwks_uri",
    "offline_exchange",
    "not_available",
]
RequestedScope = Literal["openid", "profile", "email", "phone", "language"]
PKCEAlgorithm = Literal["S256", "other"]
SigningTarget = Literal["request_object", "token_endpoint"]
SignatureValidationTarget = Literal["id_token", "userinfo"]
SignatureAlgorithm = Literal[
    "RS256",
    "RS384",
    "RS512",
    "PS256",
    "PS384",
    "PS512",
    "ES256",
    "ES384",
    "ES512",
    "other",
]
RequestEncryptionTarget = Literal["request_object"]
MessageDecryptionTarget = Literal["token_endpoint_response", "id_token", "userinfo"]
KeyManagementAlgorithm = Literal["RSA-OAEP-256", "RSA-OAEP", "other"]
ContentEncryptionAlgorithm = Literal["A128GCM", "A192GCM", "A256GCM", "other"]
RegistrationDataStep = Literal[
    "basics",
    "endpoints",
    "client-and-access",
    "signing",
    "encryption",
]
RegistrationSaveMode = Literal["partial", "completeStep"]


def _contains_other(value: Sequence[str] | None) -> bool:
    return value is not None and "other" in value


def _is_canada_ca_url(value: AnyHttpUrl | None) -> bool:
    if value is None:
        return False
    host = (value.host or "").lower()
    return host == "canada.ca" or host.endswith(".canada.ca")


class RPApplicationBase(BaseModel):
    model_config = ConfigDict(
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    dnr_app_name: str = Field(..., min_length=1, max_length=128)


class RPApplicationRead(RPApplicationBase, OnboardingLifecycleRead, UUIDSchema, PersistentDeletion):
    id: int
    workspace_id: int | None = None
    department_id: int | None
    application_information_id: int | None = None
    configuration_name: str = Field(..., min_length=1, max_length=128)
    partner_environment: str | None = Field(default=None, min_length=1, max_length=128)
    created_by: int | None
    created_at: datetime
    canada_login_environment: str | None = None
    status: str | None = None
    ibm_sv_application_id: str | None = None
    oidc_registration_payload: dict[str, object] | None = None
    registration_draft_version: int = Field(default=0, ge=0)
    registration_last_completed_step: RegistrationDataStep | None = None
    promotion_target_environment: str | None = None
    promotion_status: str | None = None
    promotion_external_reference: str | None = None
    promotion_reviewed_by_user_uuid: uuid_pkg.UUID | None = None
    promotion_reviewed_by_team: str | None = None
    promotion_requested_at: datetime | None = None
    promotion_reviewed_at: datetime | None = None
    promotion_decided_at: datetime | None = None


class AccessibleRPApplicationRead(AccessibleRPApplicationAuthorizationRead):
    """Grant-derived projection without internal integer identifiers."""

    uuid: uuid_pkg.UUID
    application_information_uuid: uuid_pkg.UUID | None = None
    dnr_app_name: str
    configuration_name: str | None = Field(default=None, max_length=128)
    partner_environment: str | None = Field(default=None, min_length=1, max_length=128)
    ibm_sv_application_id: str | None = None
    department_uuid: uuid_pkg.UUID | None = None
    canada_login_environment: str | None = None
    onboarding_state: OnboardingState | None = None
    promotion_status: str | None = None


class RPApplicationSummaryRead(BaseModel):
    """Secret-free summary shared by workspace and current-user lists."""

    model_config = ConfigDict(
        extra="forbid",
        frozen=True,
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
        serialize_by_alias=True,
    )

    uuid: uuid_pkg.UUID
    workspace_uuid: uuid_pkg.UUID
    workspace_name: str
    service_name_en: str
    service_name_fr: str
    configuration_name: str | None = Field(default=None, max_length=128)
    partner_environment: str | None = Field(default=None, min_length=1, max_length=128)
    canada_login_environment: str | None = None
    onboarding_state: OnboardingState | None = None
    promotion_status: str | None = None
    registration_last_completed_step: RegistrationDataStep | None = None
    resume_task_path: str | None = None
    role: CanonicalRoleCode | None = None


class ApplicationRPConfigurationSummaryRead(RPApplicationSummaryRead):
    """Secret-free RP configuration summary scoped to one Application."""

    application_information_uuid: uuid_pkg.UUID
    configuration_name: str = Field(..., min_length=1, max_length=128)


class ApplicationRPConfigurationPartnerEnvironmentUpdate(BaseModel):
    """Focused metadata update that cannot mutate registration or lifecycle state."""

    model_config = ConfigDict(
        extra="forbid",
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    partner_environment: str = Field(..., min_length=1, max_length=128)

    @field_validator("partner_environment", mode="before")
    @classmethod
    def normalize_partner_environment(cls, value: object) -> str:
        if not isinstance(value, str):
            raise ValueError("partner environment must be text")
        normalized = normalize_partner_environment(value)
        assert normalized is not None
        return normalized


class ApplicationRPConfigurationPartnerEnvironmentRead(BaseModel):
    """Public result of the focused Partner-environment metadata update."""

    model_config = ConfigDict(
        extra="forbid",
        frozen=True,
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
        serialize_by_alias=True,
    )

    workspace_uuid: uuid_pkg.UUID
    application_information_uuid: uuid_pkg.UUID
    rp_configuration_uuid: uuid_pkg.UUID
    partner_environment: str = Field(..., min_length=1, max_length=128)
    updated_at: datetime


class AccessibleRPApplicationOAuthSetupRead(BaseModel):
    model_config = ConfigDict(
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    rp_application_name: str
    status: str
    canada_login_environment: str | None = None
    onboarding_state: OnboardingState | None = None
    promotion_status: str | None = None
    application_url: str | None = None
    discovery_endpoint: str | None = None
    department_name: Optional[str] = None
    department_name_fr: Optional[str] = None
    pkce_enabled: bool | None = None
    redirect_uris: list[str] = Field(default_factory=list)
    logout_uri: str | None = None
    logout_redirect_uris: list[str] = Field(default_factory=list)


class WorkspaceRPApplicationRegistrationBase(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    application_information_uuid: uuid_pkg.UUID | None = None
    canada_login_environment: CanadaLoginEnvironment | None = None
    service_name_en: str | None = Field(None, min_length=1, max_length=128)
    service_name_fr: str | None = Field(None, min_length=1, max_length=128)
    application_environment_url_en: AnyHttpUrl | None = None
    application_environment_url_fr: AnyHttpUrl | None = None
    redirect_uris: list[AnyHttpUrl] | None = None
    post_logout_redirect_uris: list[AnyHttpUrl] | None = None
    logout_mode: LogoutMode | None = None
    logout_uri: AnyHttpUrl | None = None
    client_type: ClientType | None = None
    supports_authorization_code_flow: bool | None = None
    client_auth_method: ClientAuthMethod | None = None
    private_key_distribution_method: PrivateKeyDistributionMethod | None = None
    jwks_uri: AnyHttpUrl | None = None
    offline_jwk_or_certificate: str | None = Field(None, min_length=1)
    requested_scopes: list[RequestedScope] | None = None
    sector_identifier: str | None = Field(None, min_length=1, max_length=500)
    shares_pairwise_identifiers: bool | None = None
    migration_sector_identifier_url: AnyHttpUrl | None = None
    pkce_supported: bool | None = None
    pkce_algorithms: list[PKCEAlgorithm] | None = None
    pkce_other_algorithm: str | None = Field(None, min_length=1, max_length=128)
    request_signing_supported: bool | None = None
    request_signing_targets: list[SigningTarget] | None = None
    request_signing_algorithms: list[SignatureAlgorithm] | None = None
    request_signing_other_algorithm: str | None = Field(None, min_length=1, max_length=128)
    request_signing_roadmap: bool | None = None
    request_signing_revisit_on: str | None = Field(None, min_length=1, max_length=32)
    signature_validation_supported: bool | None = None
    signature_validation_targets: list[SignatureValidationTarget] | None = None
    signature_validation_algorithms: list[SignatureAlgorithm] | None = None
    signature_validation_other_algorithm: str | None = Field(None, min_length=1, max_length=128)
    signature_validation_roadmap: bool | None = None
    signature_validation_revisit_on: str | None = Field(None, min_length=1, max_length=32)
    request_encryption_supported: bool | None = None
    request_encryption_targets: list[RequestEncryptionTarget] | None = None
    request_encryption_key_management_algorithms: list[KeyManagementAlgorithm] | None = None
    request_encryption_other_key_management_algorithm: str | None = Field(None, min_length=1, max_length=128)
    request_encryption_content_algorithms: list[ContentEncryptionAlgorithm] | None = None
    request_encryption_other_content_algorithm: str | None = Field(None, min_length=1, max_length=128)
    request_encryption_roadmap: bool | None = None
    request_encryption_revisit_on: str | None = Field(None, min_length=1, max_length=32)
    message_decryption_supported: bool | None = None
    message_decryption_targets: list[MessageDecryptionTarget] | None = None
    message_decryption_key_management_algorithms: list[KeyManagementAlgorithm] | None = None
    message_decryption_other_key_management_algorithm: str | None = Field(None, min_length=1, max_length=128)
    message_decryption_content_algorithms: list[ContentEncryptionAlgorithm] | None = None
    message_decryption_other_content_algorithm: str | None = Field(None, min_length=1, max_length=128)
    message_decryption_roadmap: bool | None = None
    message_decryption_revisit_on: str | None = Field(None, min_length=1, max_length=32)

    @field_validator("offline_jwk_or_certificate")
    @classmethod
    def validate_public_offline_key_material(cls, value: str | None) -> str | None:
        if value is None:
            return None

        normalized = value.strip()
        upper_value = normalized.upper()
        if "PRIVATE KEY" in upper_value:
            raise ValueError("offline_jwk_or_certificate must not contain private key material")
        if normalized.startswith("{"):
            try:
                jwk = json.loads(normalized)
            except json.JSONDecodeError as exc:
                raise ValueError("offline_jwk_or_certificate must be valid public JWK JSON") from exc
            if not isinstance(jwk, dict):
                raise ValueError("offline_jwk_or_certificate must be a public JWK object")
            private_members = {"d", "p", "q", "dp", "dq", "qi", "oth", "k"}
            if str(jwk.get("kty", "")).lower() == "oct" or private_members.intersection(jwk):
                raise ValueError("offline_jwk_or_certificate must not contain private or symmetric key members")
            if not isinstance(jwk.get("kty"), str) or not str(jwk["kty"]).strip():
                raise ValueError("offline_jwk_or_certificate public JWK requires kty")
            return normalized
        if "-----BEGIN CERTIFICATE-----" not in upper_value or "-----END CERTIFICATE-----" not in upper_value:
            raise ValueError("offline_jwk_or_certificate must be a public certificate or public JWK")
        return normalized

    @model_validator(mode="after")
    def validate_questionnaire(self) -> "WorkspaceRPApplicationRegistrationBase":
        if self.supports_authorization_code_flow is False:
            raise ValueError("supports_authorization_code_flow must be true for CanadaLogin OIDC registrations")

        if self.requested_scopes is not None and "openid" not in self.requested_scopes:
            raise ValueError("requested_scopes must include 'openid'")

        if self.logout_mode is not None and self.logout_uri is None:
            raise ValueError("logout_uri is required when logout_mode is provided")

        if self.logout_mode == "front_channel":
            urls = [
                value
                for value in (
                    self.application_environment_url_en,
                    self.application_environment_url_fr,
                )
                if value is not None
            ]
            if urls and not all(_is_canada_ca_url(value) for value in urls):
                raise ValueError("front_channel logout is allowed only for RP applications under canada.ca")

        if self.client_type == "public" and self.pkce_supported is False:
            raise ValueError("pkce_supported must be true for public clients")

        if self.pkce_supported is True and not self.pkce_algorithms:
            raise ValueError("pkce_algorithms are required when pkce_supported is true")
        if _contains_other(self.pkce_algorithms) and not self.pkce_other_algorithm:
            raise ValueError("pkce_other_algorithm is required when 'other' is selected for pkce_algorithms")

        if self.client_auth_method == "private_key_jwt":
            if self.private_key_distribution_method is None:
                raise ValueError("private_key_distribution_method is required when client_auth_method is private_key_jwt")
            if self.private_key_distribution_method == "jwks_uri" and self.jwks_uri is None:
                raise ValueError("jwks_uri is required when private_key_distribution_method is jwks_uri")
            if self.private_key_distribution_method == "offline_exchange" and not self.offline_jwk_or_certificate:
                raise ValueError("offline_jwk_or_certificate is required when private_key_distribution_method is offline_exchange")

        self._validate_signing_branch()
        self._validate_signature_validation_branch()
        self._validate_request_encryption_branch()
        self._validate_message_decryption_branch()
        return self

    def _validate_signing_branch(self) -> None:
        if self.request_signing_supported is True:
            if not self.request_signing_targets:
                raise ValueError("request_signing_targets are required when request_signing_supported is true")
            if not self.request_signing_algorithms:
                raise ValueError("request_signing_algorithms are required when request_signing_supported is true")
            if _contains_other(self.request_signing_algorithms) and not self.request_signing_other_algorithm:
                raise ValueError("request_signing_other_algorithm is required when 'other' is selected for request_signing_algorithms")
        elif self.request_signing_supported is False:
            if self.request_signing_roadmap is None:
                raise ValueError("request_signing_roadmap is required when request_signing_supported is false")
            if self.request_signing_roadmap and not self.request_signing_revisit_on:
                raise ValueError("request_signing_revisit_on is required when request_signing_roadmap is true")

    def _validate_signature_validation_branch(self) -> None:
        if self.signature_validation_supported is True:
            if not self.signature_validation_targets:
                raise ValueError("signature_validation_targets are required when signature_validation_supported is true")
            if not self.signature_validation_algorithms:
                raise ValueError("signature_validation_algorithms are required when signature_validation_supported is true")
            if _contains_other(self.signature_validation_algorithms) and not self.signature_validation_other_algorithm:
                raise ValueError("signature_validation_other_algorithm is required when 'other' is selected for signature_validation_algorithms")
        elif self.signature_validation_supported is False:
            if self.signature_validation_roadmap is None:
                raise ValueError("signature_validation_roadmap is required when signature_validation_supported is false")
            if self.signature_validation_roadmap and not self.signature_validation_revisit_on:
                raise ValueError("signature_validation_revisit_on is required when signature_validation_roadmap is true")

    def _validate_request_encryption_branch(self) -> None:
        if self.request_encryption_supported is True:
            if not self.request_encryption_targets:
                raise ValueError("request_encryption_targets are required when request_encryption_supported is true")
            if not self.request_encryption_key_management_algorithms:
                raise ValueError("request_encryption_key_management_algorithms are required when request_encryption_supported is true")
            if not self.request_encryption_content_algorithms:
                raise ValueError("request_encryption_content_algorithms are required when request_encryption_supported is true")
            if _contains_other(self.request_encryption_key_management_algorithms) and not self.request_encryption_other_key_management_algorithm:
                raise ValueError(
                    "request_encryption_other_key_management_algorithm is required "
                    "when 'other' is selected for "
                    "request_encryption_key_management_algorithms"
                )
            if _contains_other(self.request_encryption_content_algorithms) and not self.request_encryption_other_content_algorithm:
                raise ValueError(
                    "request_encryption_other_content_algorithm is required when 'other' is selected for request_encryption_content_algorithms"
                )
        elif self.request_encryption_supported is False:
            if self.request_encryption_roadmap is None:
                raise ValueError("request_encryption_roadmap is required when request_encryption_supported is false")
            if self.request_encryption_roadmap and not self.request_encryption_revisit_on:
                raise ValueError("request_encryption_revisit_on is required when request_encryption_roadmap is true")

    def _validate_message_decryption_branch(self) -> None:
        if self.message_decryption_supported is True:
            if not self.message_decryption_targets:
                raise ValueError("message_decryption_targets are required when message_decryption_supported is true")
            if not self.message_decryption_key_management_algorithms:
                raise ValueError("message_decryption_key_management_algorithms are required when message_decryption_supported is true")
            if not self.message_decryption_content_algorithms:
                raise ValueError("message_decryption_content_algorithms are required when message_decryption_supported is true")
            if _contains_other(self.message_decryption_key_management_algorithms) and not self.message_decryption_other_key_management_algorithm:
                raise ValueError(
                    "message_decryption_other_key_management_algorithm is required "
                    "when 'other' is selected for "
                    "message_decryption_key_management_algorithms"
                )
            if _contains_other(self.message_decryption_content_algorithms) and not self.message_decryption_other_content_algorithm:
                raise ValueError(
                    "message_decryption_other_content_algorithm is required when 'other' is selected for message_decryption_content_algorithms"
                )
        elif self.message_decryption_supported is False:
            if self.message_decryption_roadmap is None:
                raise ValueError("message_decryption_roadmap is required when message_decryption_supported is false")
            if self.message_decryption_roadmap and not self.message_decryption_revisit_on:
                raise ValueError("message_decryption_revisit_on is required when message_decryption_roadmap is true")


class WorkspaceRPApplicationRegistrationCreate(WorkspaceRPApplicationRegistrationBase):
    application_information_uuid: uuid_pkg.UUID
    configuration_name: str = Field(..., min_length=1, max_length=128)
    partner_environment: str = Field(..., min_length=1, max_length=128)
    canada_login_environment: CanadaLoginEnvironment
    service_name_en: str = Field(..., min_length=1, max_length=128)
    service_name_fr: str = Field(..., min_length=1, max_length=128)
    application_environment_url_en: AnyHttpUrl
    application_environment_url_fr: AnyHttpUrl
    redirect_uris: list[AnyHttpUrl] = Field(..., min_length=1)
    post_logout_redirect_uris: list[AnyHttpUrl] = Field(default_factory=list)
    logout_mode: LogoutMode
    logout_uri: AnyHttpUrl
    client_type: ClientType
    supports_authorization_code_flow: bool
    client_auth_method: ClientAuthMethod
    requested_scopes: list[RequestedScope] = Field(..., min_length=1)
    sector_identifier: str = Field(..., min_length=1, max_length=500)
    shares_pairwise_identifiers: bool
    pkce_supported: bool
    request_signing_supported: bool
    signature_validation_supported: bool
    request_encryption_supported: bool
    message_decryption_supported: bool

    @field_validator("configuration_name", mode="before")
    @classmethod
    def normalize_configuration_name(cls, value: object) -> str:
        if not isinstance(value, str):
            raise ValueError("configuration name must be text")
        normalized = normalize_configuration_name(value)
        assert normalized is not None
        return normalized

    @field_validator("partner_environment", mode="before")
    @classmethod
    def normalize_partner_environment(cls, value: object) -> str:
        if not isinstance(value, str):
            raise ValueError("partner environment must be text")
        normalized = normalize_partner_environment(value)
        assert normalized is not None
        return normalized


class WorkspaceRPApplicationRegistrationUpdate(WorkspaceRPApplicationRegistrationBase):
    pass


class WorkspaceRPApplicationRegistrationAnswers(WorkspaceRPApplicationRegistrationBase):
    """Typed partial questionnaire values without step-completeness validation."""

    @model_validator(mode="after")
    def validate_questionnaire(self) -> "WorkspaceRPApplicationRegistrationAnswers":
        return self


class WorkspaceRPApplicationRegistrationDraftCreate(WorkspaceRPApplicationRegistrationAnswers):
    application_information_uuid: uuid_pkg.UUID
    configuration_name: str = Field(..., min_length=1, max_length=128)
    partner_environment: str = Field(..., min_length=1, max_length=128)
    canada_login_environment: CanadaLoginEnvironment
    service_name_en: str = Field(..., min_length=1, max_length=128)
    service_name_fr: str = Field(..., min_length=1, max_length=128)

    @field_validator("configuration_name", mode="before")
    @classmethod
    def normalize_configuration_name(cls, value: object) -> str:
        if not isinstance(value, str):
            raise ValueError("configuration name must be text")
        normalized = normalize_configuration_name(value)
        assert normalized is not None
        return normalized

    @field_validator("partner_environment", mode="before")
    @classmethod
    def normalize_partner_environment(cls, value: object) -> str:
        if not isinstance(value, str):
            raise ValueError("partner environment must be text")
        normalized = normalize_partner_environment(value)
        assert normalized is not None
        return normalized


class ApplicationRPConfigurationRegistrationDraftCreate(BaseModel):
    """Minimum Basics payload for an Application-scoped RP configuration."""

    model_config = ConfigDict(
        extra="forbid",
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    configuration_name: str = Field(..., min_length=1, max_length=128)
    partner_environment: str = Field(..., min_length=1, max_length=128)
    canada_login_environment: CanadaLoginEnvironment

    @field_validator("configuration_name", mode="before")
    @classmethod
    def normalize_configuration_name(cls, value: object) -> str:
        if not isinstance(value, str):
            raise ValueError("configuration name must be text")
        normalized = normalize_configuration_name(value)
        assert normalized is not None
        return normalized

    @field_validator("partner_environment", mode="before")
    @classmethod
    def normalize_partner_environment(cls, value: object) -> str:
        if not isinstance(value, str):
            raise ValueError("partner environment must be text")
        normalized = normalize_partner_environment(value)
        assert normalized is not None
        return normalized


class ApplicationRPConfigurationCopyCreate(BaseModel):
    """Create one independent named draft from one selected source."""

    model_config = ConfigDict(
        extra="forbid",
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    target_configuration_name: str = Field(..., min_length=1, max_length=128)
    target_partner_environment: str = Field(..., min_length=1, max_length=128)
    target_environment: CanadaLoginEnvironment

    @field_validator("target_configuration_name", mode="before")
    @classmethod
    def normalize_target_configuration_name(cls, value: object) -> str:
        if not isinstance(value, str):
            raise ValueError("target configuration name must be text")
        normalized = normalize_configuration_name(value)
        assert normalized is not None
        return normalized

    @field_validator("target_partner_environment", mode="before")
    @classmethod
    def normalize_target_partner_environment(cls, value: object) -> str:
        if not isinstance(value, str):
            raise ValueError("target partner environment must be text")
        normalized = normalize_partner_environment(value)
        assert normalized is not None
        return normalized


class ApplicationRPConfigurationProgressionCreate(BaseModel):
    """Create one explicitly named target from one selected source."""

    model_config = ConfigDict(
        extra="forbid",
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    target_configuration_name: str = Field(..., min_length=1, max_length=128)
    target_partner_environment: str = Field(..., min_length=1, max_length=128)
    target_environment: Literal["staging", "production"]

    @field_validator("target_configuration_name", mode="before")
    @classmethod
    def normalize_target_configuration_name(cls, value: object) -> str:
        if not isinstance(value, str):
            raise ValueError("target configuration name must be text")
        normalized = normalize_configuration_name(value)
        assert normalized is not None
        return normalized

    @field_validator("target_partner_environment", mode="before")
    @classmethod
    def normalize_target_partner_environment(cls, value: object) -> str:
        if not isinstance(value, str):
            raise ValueError("target partner environment must be text")
        normalized = normalize_partner_environment(value)
        assert normalized is not None
        return normalized


class ApplicationRPConfigurationCopyRead(BaseModel):
    """Public source/target lineage for a newly copied draft."""

    model_config = ConfigDict(
        extra="forbid",
        frozen=True,
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
        serialize_by_alias=True,
    )

    workspace_uuid: uuid_pkg.UUID
    application_information_uuid: uuid_pkg.UUID
    source_rp_configuration_uuid: uuid_pkg.UUID
    source_configuration_name: str
    source_partner_environment: str | None = Field(default=None, min_length=1, max_length=128)
    source_environment: CanadaLoginEnvironment
    target_rp_configuration_uuid: uuid_pkg.UUID
    target_configuration_name: str
    target_partner_environment: str = Field(..., min_length=1, max_length=128)
    target_environment: CanadaLoginEnvironment
    target_registration_draft_version: int = Field(..., ge=0)
    target_registration_last_completed_step: RegistrationDataStep | None = None
    copy_policy_version: int = Field(..., ge=1)


class ApplicationRPConfigurationProgressionRead(BaseModel):
    """Public source/target lineage for a newly created progression draft."""

    model_config = ConfigDict(
        extra="forbid",
        frozen=True,
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
        serialize_by_alias=True,
    )

    workspace_uuid: uuid_pkg.UUID
    application_information_uuid: uuid_pkg.UUID
    source_rp_configuration_uuid: uuid_pkg.UUID
    source_configuration_name: str
    source_partner_environment: str | None = Field(default=None, min_length=1, max_length=128)
    source_environment: CanadaLoginEnvironment
    target_rp_configuration_uuid: uuid_pkg.UUID
    target_configuration_name: str
    target_partner_environment: str | None = Field(default=None, min_length=1, max_length=128)
    target_environment: Literal["staging", "production"]
    target_registration_draft_version: int = Field(..., ge=0)
    target_registration_last_completed_step: RegistrationDataStep | None = None
    self_serve: bool
    promotion_status: str | None = None


class WorkspaceRPApplicationRegistrationDraftPatch(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    step_id: RegistrationDataStep
    save_mode: RegistrationSaveMode
    expected_draft_version: int = Field(..., ge=0)
    configuration_name: str | None = Field(default=None, min_length=1, max_length=128)
    partner_environment: str | None = Field(default=None, min_length=1, max_length=128)
    registration_answers: WorkspaceRPApplicationRegistrationAnswers

    @field_validator("configuration_name", mode="before")
    @classmethod
    def normalize_configuration_name(cls, value: object) -> str | None:
        if value is None:
            return None
        if not isinstance(value, str):
            raise ValueError("configuration name must be text")
        return normalize_configuration_name(value)

    @field_validator("partner_environment", mode="before")
    @classmethod
    def normalize_partner_environment(cls, value: object) -> str | None:
        if value is not None and not isinstance(value, str):
            raise ValueError("partner environment must be text")
        return normalize_partner_environment(value)


class WorkspaceRPApplicationRegistrationDraftRead(BaseModel):
    model_config = ConfigDict(
        extra="ignore",
        frozen=True,
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
        serialize_by_alias=True,
    )

    workspace_uuid: uuid_pkg.UUID
    rp_application_uuid: uuid_pkg.UUID
    application_information_uuid: uuid_pkg.UUID
    onboarding_state: Literal["draft"]
    configuration_name: str = Field(..., min_length=1, max_length=128)
    partner_environment: str | None = Field(default=None, min_length=1, max_length=128)
    registration_draft_version: int = Field(..., ge=0)
    registration_last_completed_step: RegistrationDataStep | None = None
    registration_answers: WorkspaceRPApplicationRegistrationAnswers


class WorkspaceRPApplicationConfigurationRead(BaseModel):
    """Portal-owned, secret-free RP registration configuration."""

    model_config = ConfigDict(
        extra="forbid",
        frozen=True,
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
        serialize_by_alias=True,
    )

    workspace_uuid: uuid_pkg.UUID
    rp_application_uuid: uuid_pkg.UUID
    service_name_en: str
    service_name_fr: str
    configuration_name: str | None = Field(default=None, max_length=128)
    partner_environment: str | None = Field(default=None, min_length=1, max_length=128)
    canada_login_environment: CanadaLoginEnvironment | None = None
    onboarding_state: OnboardingState | None = None
    promotion_status: str | None = None
    registration_draft_version: int = Field(..., ge=0)
    registration_last_completed_step: RegistrationDataStep | None = None
    registration_answers: WorkspaceRPApplicationRegistrationAnswers
    offline_public_key_provided: bool = False


class ApplicationRPConfigurationRead(WorkspaceRPApplicationConfigurationRead):
    """Secret-free Configuration view with public Application ancestry."""

    application_information_uuid: uuid_pkg.UUID
    configuration_name: str = Field(..., min_length=1, max_length=128)
    partner_environment: str | None = Field(default=None, min_length=1, max_length=128)


class WorkspaceRPApplicationRegistrationSubmissionRead(BaseModel):
    model_config = ConfigDict(
        extra="ignore",
        frozen=True,
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
        serialize_by_alias=True,
    )

    workspace_uuid: uuid_pkg.UUID
    rp_application_uuid: uuid_pkg.UUID
    onboarding_state: Literal["submitted"]
    registration_draft_version: int = Field(..., ge=0)
    service_name_en: str
    service_name_fr: str


class RPApplicationCreate(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    department_id: int
    dnr_app_name: str = Field(..., min_length=1, max_length=128)
    ibm_sv_application_id: str | None = Field(None, max_length=128)


class RPApplicationUpdate(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    dnr_app_name: str | None = Field(None, min_length=1, max_length=128)
    department_id: int | None = None
    ibm_sv_application_id: str | None = Field(None, max_length=128)


class RPApplicationCreateInternal(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    uuid: uuid_pkg.UUID = Field(default_factory=uuid7)
    workspace_id: int | None = None
    department_id: int | None
    application_information_id: int | None = None
    dnr_app_name: str
    configuration_name: str = Field(..., min_length=1, max_length=128)
    partner_environment: str | None = Field(default=None, min_length=1, max_length=128)
    source_rp_configuration_id: int | None = Field(default=None, ge=1)
    canada_login_environment: str | None = None
    status: str | None = None
    ibm_sv_application_id: str | None = None
    oidc_registration_payload: dict[str, object] | None = None
    registration_creation_key: uuid_pkg.UUID | None = None
    registration_draft_version: int = Field(default=0, ge=0)
    registration_last_completed_step: RegistrationDataStep | None = None
    created_by: int | None = None

    @field_validator("configuration_name", mode="before")
    @classmethod
    def normalize_configuration_name(cls, value: object) -> str | None:
        if value is not None and not isinstance(value, str):
            raise ValueError("configuration name must be text")
        return normalize_configuration_name(value)

    @field_validator("partner_environment", mode="before")
    @classmethod
    def normalize_partner_environment(cls, value: object) -> str | None:
        if value is not None and not isinstance(value, str):
            raise ValueError("partner environment must be text")
        return normalize_partner_environment(value)


class RPApplicationUpdateInternal(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    workspace_id: int | None = None
    dnr_app_name: str | None = None
    department_id: int | None = None
    application_information_id: int | None = None
    configuration_name: str | None = Field(default=None, max_length=128)
    partner_environment: str | None = Field(default=None, min_length=1, max_length=128)
    source_rp_configuration_id: int | None = Field(default=None, ge=1)
    canada_login_environment: str | None = None
    status: str | None = None
    oidc_registration_payload: dict[str, object] | None = None
    registration_draft_version: int | None = Field(default=None, ge=0)
    registration_last_completed_step: RegistrationDataStep | None = None
    updated_at: datetime

    @field_validator("configuration_name", mode="before")
    @classmethod
    def normalize_configuration_name(cls, value: object) -> str | None:
        if value is not None and not isinstance(value, str):
            raise ValueError("configuration name must be text")
        return normalize_configuration_name(value)

    @field_validator("partner_environment", mode="before")
    @classmethod
    def normalize_partner_environment(cls, value: object) -> str | None:
        if value is not None and not isinstance(value, str):
            raise ValueError("partner environment must be text")
        return normalize_partner_environment(value)


class RPApplicationDelete(PersistentDeletion):
    pass


class RPApplicationClientCredentialsRead(BaseModel):
    model_config = ConfigDict(
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    client_id: str
    client_secret: str | None = None
    client_secret_id: str | None = None


class RPApplicationClientRotatedSecretRead(BaseModel):
    model_config = ConfigDict(
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    description: str | None = None
    expired_at: int | None = Field(None, alias="expiredAt")
    rotated_at: int | None = Field(None, alias="rotatedAt")
    value: str | None = Field(None, alias="value")
    secret_id: str | None = Field(None, alias="secretId")


class RPApplicationClientRotatedSecretCreateRequest(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    description: str = Field(..., min_length=1)
    rotated_secret_expired_at: int = Field(..., alias="rotatedSecretExpiredAt", ge=1)


class RPApplicationClientRotatedSecretDeleteRequest(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    secret_id: str = Field(..., alias="secretId", min_length=1, max_length=512)


class RPApplicationClientSecretRotateRequest(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    delete_rotated_secrets: bool = Field(False, alias="deleteRotatedSecrets")
    description: str = ""
    rotated_secret_expired_at: int = Field(0, alias="rotatedSecretExpiredAt")


class RPApplicationUsageSummaryRead(BaseModel):
    model_config = ConfigDict(
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    total: int
    succeeded: int
    failed: int


class AccessibleRPApplicationSummaryRead(BaseModel):
    model_config = ConfigDict(
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    id: int
    uuid: uuid_pkg.UUID
    dnr_app_name: str
    department_id: Optional[int] = None
    partner_environment: str | None = Field(default=None, min_length=1, max_length=128)


class AccessibleRPApplicationDepartmentAssignRequest(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    department_uuid: uuid_pkg.UUID


class RPApplicationUsageAuditEventRead(BaseModel):
    model_config = ConfigDict(
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    username: str
    username_display: str
    username_known: bool
    origin: str
    origin_display: str
    ip_version: int | None = None
    result: str
    time_seconds: int | None = None
    country: str


class RPApplicationUsageAuditTrailRead(BaseModel):
    model_config = ConfigDict(
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    events: list[RPApplicationUsageAuditEventRead] = Field(default_factory=list)
    next: str | None = None
    total: int | None = None
