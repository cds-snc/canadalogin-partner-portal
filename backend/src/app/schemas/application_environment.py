import uuid as uuid_pkg
from datetime import datetime
from typing import Literal, Self

from pydantic import AnyHttpUrl, BaseModel, ConfigDict, Field, model_validator
from pydantic.alias_generators import to_camel


class ApplicationEnvironmentCreate(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    application_url_en: AnyHttpUrl = Field(..., max_length=512)
    application_url_fr: AnyHttpUrl = Field(..., max_length=512)
    can_decrypt_messages: bool
    can_encrypt_requests: bool
    can_sign_messages: bool
    client_auth_method: Literal["private_key_jwt", "client_secret_basic", "client_secret_post"] | None = None
    client_type: Literal["public", "confidential"]
    copy_existing: bool
    decryption_content_algorithms: list[Literal["A128GCM", "A192GCM", "A256GCM"]]
    decryption_key_algorithms: list[Literal["RSA-OAEP", "RSA-OAEP-256"]]
    decryption_messages: list[Literal["token_endpoint_response", "id_token", "userinfo"]]
    encryption_content_algorithms: list[Literal["A128GCM", "A192GCM", "A256GCM"]]
    encryption_key_algorithms: list[Literal["RSA-OAEP", "RSA-OAEP-256"]]
    environment_name: str = Field(
        ...,
        min_length=1,
        max_length=64,
        pattern=r"^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$",
    )
    jwks_uri: AnyHttpUrl | None = None
    logout_method: Literal["front_channel", "back_channel"] | None = None
    pkce_supported: bool
    post_logout_redirect_uris: list[AnyHttpUrl] = Field(..., min_length=1)
    redirect_uris: list[AnyHttpUrl] = Field(..., min_length=1)
    sector_identifier_url: AnyHttpUrl | None = None
    shares_identifier: bool
    sign_out_request_url: AnyHttpUrl | None = None
    signing_messages: list[Literal["request_object", "token_endpoint"]]
    signing_signature_algorithms: list[
        Literal[
            "RS256",
            "RS384",
            "RS512",
            "PS256",
            "PS384",
            "PS512",
            "ES256",
            "ES384",
            "ES512",
        ]
    ]
    single_sign_out: bool
    source_environment_uuid: uuid_pkg.UUID | None = None
    tenant_code: Literal["test", "staging"]
    verification_messages: list[Literal["id_token", "userinfo"]] = Field(..., min_length=1)
    verification_signature_algorithms: list[
        Literal[
            "RS256",
            "RS384",
            "RS512",
            "PS256",
            "PS384",
            "PS512",
            "ES256",
            "ES384",
            "ES512",
        ]
    ] = Field(..., min_length=1)

    @model_validator(mode="after")
    def validate_conditional_fields(self) -> Self:
        if self.copy_existing and self.source_environment_uuid is None:
            raise ValueError("sourceEnvironmentUuid is required when copyExisting is enabled")
        if self.single_sign_out and (self.logout_method is None or self.sign_out_request_url is None):
            raise ValueError("logout configuration is required when singleSignOut is enabled")
        if self.client_type == "public" and not self.pkce_supported:
            raise ValueError("pkceSupported is required for public clients")
        if self.client_type == "confidential" and self.client_auth_method is None:
            raise ValueError("clientAuthMethod is required for confidential clients")
        if self.client_auth_method == "private_key_jwt" and self.jwks_uri is None:
            raise ValueError("jwksUri is required for private_key_jwt clients")
        if self.shares_identifier and self.sector_identifier_url is None:
            raise ValueError("sectorIdentifierUrl is required when sharesIdentifier is enabled")
        if self.can_sign_messages and (not self.signing_messages or not self.signing_signature_algorithms):
            raise ValueError("signing configuration is required when canSignMessages is enabled")
        if self.can_encrypt_requests and (not self.encryption_key_algorithms or not self.encryption_content_algorithms):
            raise ValueError("encryption configuration is required when canEncryptRequests is enabled")
        if self.can_decrypt_messages and (
            not self.decryption_messages or not self.decryption_key_algorithms or not self.decryption_content_algorithms
        ):
            raise ValueError("decryption configuration is required when canDecryptMessages is enabled")
        return self


class ApplicationEnvironmentApplicationRead(BaseModel):
    model_config = ConfigDict(
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    uuid: uuid_pkg.UUID
    name_en: str
    name_fr: str | None = None


class ApplicationEnvironmentRead(BaseModel):
    model_config = ConfigDict(
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    uuid: uuid_pkg.UUID
    partner_label: str
    tenant_code: str
    status_code: str
    config: dict[str, object] | None = None
    created_at: datetime
    updated_at: datetime | None = None


class ApplicationEnvironmentListRead(BaseModel):
    model_config = ConfigDict(
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    application: ApplicationEnvironmentApplicationRead
    data: list[ApplicationEnvironmentRead]
    total_count: int
    has_more: bool
    page: int
    items_per_page: int
