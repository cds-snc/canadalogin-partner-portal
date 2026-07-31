import uuid as uuid_pkg
from datetime import datetime
from typing import Literal, Optional

from pydantic import AnyHttpUrl, BaseModel, ConfigDict, Field, model_validator
from pydantic.alias_generators import to_camel

from ..core.schemas import PersistentDeletion, UUIDSchema


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


def _contains_other(value: list[str] | None) -> bool:
    return bool(value) and "other" in value


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


class RPApplicationOwnerRead(BaseModel):
    model_config = ConfigDict(
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    email: str = Field(..., min_length=1, max_length=254)


class RPApplicationOwnerSnapshotRead(BaseModel):
    model_config = ConfigDict(
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    owners: list[RPApplicationOwnerRead] = Field(default_factory=list)


class RPApplicationRead(RPApplicationBase, UUIDSchema, PersistentDeletion):
    id: int
    workspace_id: int | None = None
    department_id: int | None
    application_information_id: int | None = None
    created_by: int | None
    created_at: datetime
    canada_login_environment: str | None = None
    status: str | None = None
    ibm_sv_application_id: str | None = None
    oidc_registration_payload: dict[str, object] | None = None
    application_owner: RPApplicationOwnerSnapshotRead | None = None


class RPApplicationCurrentUserRead(BaseModel):
    model_config = ConfigDict(
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    id: int
    uuid: uuid_pkg.UUID
    dnr_app_name: str
    ibm_sv_application_id: str | None = None
    department_id: int | None
    application_owner: RPApplicationOwnerSnapshotRead | None = None


class RPApplicationCurrentUserOAuthSetupRead(BaseModel):
    model_config = ConfigDict(
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    rp_application_name: str
    status: str
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

    @model_validator(mode="after")
    def validate_questionnaire(self) -> "WorkspaceRPApplicationRegistrationBase":
        if self.supports_authorization_code_flow is False:
            raise ValueError(
                "supports_authorization_code_flow must be true for CanadaLogin OIDC registrations"
            )

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
                raise ValueError(
                    "front_channel logout is allowed only for RP applications under canada.ca"
                )

        if self.client_type == "public" and self.pkce_supported is False:
            raise ValueError("pkce_supported must be true for public clients")

        if self.pkce_supported is True and not self.pkce_algorithms:
            raise ValueError(
                "pkce_algorithms are required when pkce_supported is true"
            )
        if _contains_other(self.pkce_algorithms) and not self.pkce_other_algorithm:
            raise ValueError(
                "pkce_other_algorithm is required when 'other' is selected for pkce_algorithms"
            )

        if self.client_auth_method == "private_key_jwt":
            if self.private_key_distribution_method is None:
                raise ValueError(
                    "private_key_distribution_method is required when client_auth_method is private_key_jwt"
                )
            if (
                self.private_key_distribution_method == "jwks_uri"
                and self.jwks_uri is None
            ):
                raise ValueError(
                    "jwks_uri is required when private_key_distribution_method is jwks_uri"
                )
            if (
                self.private_key_distribution_method == "offline_exchange"
                and not self.offline_jwk_or_certificate
            ):
                raise ValueError(
                    "offline_jwk_or_certificate is required when private_key_distribution_method is offline_exchange"
                )

        self._validate_signing_branch()
        self._validate_signature_validation_branch()
        self._validate_request_encryption_branch()
        self._validate_message_decryption_branch()
        return self

    def _validate_signing_branch(self) -> None:
        if self.request_signing_supported is True:
            if not self.request_signing_targets:
                raise ValueError(
                    "request_signing_targets are required when request_signing_supported is true"
                )
            if not self.request_signing_algorithms:
                raise ValueError(
                    "request_signing_algorithms are required when request_signing_supported is true"
                )
            if (
                _contains_other(self.request_signing_algorithms)
                and not self.request_signing_other_algorithm
            ):
                raise ValueError(
                    "request_signing_other_algorithm is required when 'other' is selected for request_signing_algorithms"
                )
        elif self.request_signing_supported is False:
            if self.request_signing_roadmap is None:
                raise ValueError(
                    "request_signing_roadmap is required when request_signing_supported is false"
                )
            if self.request_signing_roadmap and not self.request_signing_revisit_on:
                raise ValueError(
                    "request_signing_revisit_on is required when request_signing_roadmap is true"
                )

    def _validate_signature_validation_branch(self) -> None:
        if self.signature_validation_supported is True:
            if not self.signature_validation_targets:
                raise ValueError(
                    "signature_validation_targets are required when signature_validation_supported is true"
                )
            if not self.signature_validation_algorithms:
                raise ValueError(
                    "signature_validation_algorithms are required when signature_validation_supported is true"
                )
            if (
                _contains_other(self.signature_validation_algorithms)
                and not self.signature_validation_other_algorithm
            ):
                raise ValueError(
                    "signature_validation_other_algorithm is required when 'other' is selected for signature_validation_algorithms"
                )
        elif self.signature_validation_supported is False:
            if self.signature_validation_roadmap is None:
                raise ValueError(
                    "signature_validation_roadmap is required when signature_validation_supported is false"
                )
            if (
                self.signature_validation_roadmap
                and not self.signature_validation_revisit_on
            ):
                raise ValueError(
                    "signature_validation_revisit_on is required when signature_validation_roadmap is true"
                )

    def _validate_request_encryption_branch(self) -> None:
        if self.request_encryption_supported is True:
            if not self.request_encryption_targets:
                raise ValueError(
                    "request_encryption_targets are required when request_encryption_supported is true"
                )
            if not self.request_encryption_key_management_algorithms:
                raise ValueError(
                    "request_encryption_key_management_algorithms are required when request_encryption_supported is true"
                )
            if not self.request_encryption_content_algorithms:
                raise ValueError(
                    "request_encryption_content_algorithms are required when request_encryption_supported is true"
                )
            if (
                _contains_other(self.request_encryption_key_management_algorithms)
                and not self.request_encryption_other_key_management_algorithm
            ):
                raise ValueError(
                    "request_encryption_other_key_management_algorithm is required when 'other' is selected for request_encryption_key_management_algorithms"
                )
            if (
                _contains_other(self.request_encryption_content_algorithms)
                and not self.request_encryption_other_content_algorithm
            ):
                raise ValueError(
                    "request_encryption_other_content_algorithm is required when 'other' is selected for request_encryption_content_algorithms"
                )
        elif self.request_encryption_supported is False:
            if self.request_encryption_roadmap is None:
                raise ValueError(
                    "request_encryption_roadmap is required when request_encryption_supported is false"
                )
            if self.request_encryption_roadmap and not self.request_encryption_revisit_on:
                raise ValueError(
                    "request_encryption_revisit_on is required when request_encryption_roadmap is true"
                )

    def _validate_message_decryption_branch(self) -> None:
        if self.message_decryption_supported is True:
            if not self.message_decryption_targets:
                raise ValueError(
                    "message_decryption_targets are required when message_decryption_supported is true"
                )
            if not self.message_decryption_key_management_algorithms:
                raise ValueError(
                    "message_decryption_key_management_algorithms are required when message_decryption_supported is true"
                )
            if not self.message_decryption_content_algorithms:
                raise ValueError(
                    "message_decryption_content_algorithms are required when message_decryption_supported is true"
                )
            if (
                _contains_other(self.message_decryption_key_management_algorithms)
                and not self.message_decryption_other_key_management_algorithm
            ):
                raise ValueError(
                    "message_decryption_other_key_management_algorithm is required when 'other' is selected for message_decryption_key_management_algorithms"
                )
            if (
                _contains_other(self.message_decryption_content_algorithms)
                and not self.message_decryption_other_content_algorithm
            ):
                raise ValueError(
                    "message_decryption_other_content_algorithm is required when 'other' is selected for message_decryption_content_algorithms"
                )
        elif self.message_decryption_supported is False:
            if self.message_decryption_roadmap is None:
                raise ValueError(
                    "message_decryption_roadmap is required when message_decryption_supported is false"
                )
            if self.message_decryption_roadmap and not self.message_decryption_revisit_on:
                raise ValueError(
                    "message_decryption_revisit_on is required when message_decryption_roadmap is true"
                )


class WorkspaceRPApplicationRegistrationCreate(WorkspaceRPApplicationRegistrationBase):
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


class WorkspaceRPApplicationRegistrationUpdate(WorkspaceRPApplicationRegistrationBase):
    pass


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
    workspace_id: int | None = None
    department_id: int | None
    application_information_id: int | None = None
    dnr_app_name: str
    canada_login_environment: str | None = None
    status: str | None = None
    ibm_sv_application_id: str | None = None
    oidc_registration_payload: dict[str, object] | None = None
    created_by: int | None = None
    application_owner: RPApplicationOwnerSnapshotRead | None = None


class RPApplicationUpdateInternal(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    workspace_id: int | None = None
    dnr_app_name: str | None = None
    department_id: int | None = None
    application_information_id: int | None = None
    canada_login_environment: str | None = None
    status: str | None = None
    oidc_registration_payload: dict[str, object] | None = None
    application_owner: RPApplicationOwnerSnapshotRead | None = None
    updated_at: datetime


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


class CurrentUserRPApplicationSummaryRead(BaseModel):
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


class CurrentUserRPApplicationDepartmentAssignRequest(BaseModel):
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
