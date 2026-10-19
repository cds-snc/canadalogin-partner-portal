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
        if self.tenant_code == "staging" and not self.single_sign_out:
            raise ValueError("singleSignOut is required for staging environments")
        if self.single_sign_out and (self.logout_method is None or self.sign_out_request_url is None):
            raise ValueError("logout configuration is required when singleSignOut is enabled")
        if self.client_type == "public" and not self.pkce_supported:
            raise ValueError("pkceSupported is required for public clients")
        if self.client_type == "confidential" and self.client_auth_method is None:
            raise ValueError("clientAuthMethod is required for confidential clients")
        if self.client_auth_method == "private_key_jwt" and self.jwks_uri is None:
            raise ValueError("jwksUri is required for private_key_jwt clients")
        if self.can_sign_messages and (not self.signing_messages or not self.signing_signature_algorithms):
            raise ValueError("signing configuration is required when canSignMessages is enabled")
        if self.can_encrypt_requests and (not self.encryption_key_algorithms or not self.encryption_content_algorithms):
            raise ValueError("encryption configuration is required when canEncryptRequests is enabled")
        if self.can_decrypt_messages and (
            not self.decryption_messages or not self.decryption_key_algorithms or not self.decryption_content_algorithms
        ):
            raise ValueError("decryption configuration is required when canDecryptMessages is enabled")
        return self


class ApplicationEnvironmentNameUpdate(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    environment_name: str = Field(
        ...,
        min_length=1,
        max_length=64,
        pattern=r"^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$",
    )


class ApplicationEnvironmentUpdate(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    environment_name: str | None = Field(
        default=None,
        min_length=1,
        max_length=64,
        pattern=r"^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$",
    )
    application_url_en: AnyHttpUrl | None = Field(default=None, max_length=512)
    application_url_fr: AnyHttpUrl | None = Field(default=None, max_length=512)
    client_auth_method: Literal["private_key_jwt", "client_secret_basic", "client_secret_post"] | None = None
    client_type: Literal["public", "confidential"] | None = None
    jwks_uri: AnyHttpUrl | None = Field(default=None, max_length=512)
    logout_method: Literal["front_channel", "back_channel"] | None = None
    pkce_supported: bool | None = None
    post_logout_redirect_uris: list[AnyHttpUrl] | None = Field(default=None, min_length=1)
    redirect_uris: list[AnyHttpUrl] | None = Field(default=None, min_length=1)
    sign_out_request_url: AnyHttpUrl | None = Field(default=None, max_length=512)
    single_sign_out: bool | None = None
    can_sign_messages: bool | None = None
    signing_messages: list[Literal["request_object", "token_endpoint"]] | None = None
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
    ] | None = None
    can_encrypt_requests: bool | None = None
    encryption_key_algorithms: list[Literal["RSA-OAEP", "RSA-OAEP-256"]] | None = None
    encryption_content_algorithms: list[
        Literal["A128GCM", "A192GCM", "A256GCM"]
    ] | None = None
    can_decrypt_messages: bool | None = None
    decryption_messages: list[
        Literal["token_endpoint_response", "id_token", "userinfo"]
    ] | None = None
    decryption_key_algorithms: list[Literal["RSA-OAEP", "RSA-OAEP-256"]] | None = None
    decryption_content_algorithms: list[
        Literal["A128GCM", "A192GCM", "A256GCM"]
    ] | None = None
    verification_messages: list[Literal["id_token", "userinfo"]] | None = Field(
        default=None, min_length=1
    )
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
    ] | None = Field(default=None, min_length=1)

    def _validate_encryption_group(self) -> None:
        encryption_fields = (
            "can_encrypt_requests",
            "encryption_key_algorithms",
            "encryption_content_algorithms",
        )
        if not all(field_name in self.model_fields_set for field_name in encryption_fields):
            raise ValueError(
                "canEncryptRequests and encryption configuration must be provided together"
            )
        if (
            self.can_encrypt_requests is None
            or self.encryption_key_algorithms is None
            or self.encryption_content_algorithms is None
        ):
            raise ValueError(
                "canEncryptRequests and encryption configuration must not be null"
            )
        if self.can_encrypt_requests and (
            not self.encryption_key_algorithms
            or not self.encryption_content_algorithms
        ):
            raise ValueError(
                "encryption configuration is required when canEncryptRequests is enabled"
            )
        if not self.can_encrypt_requests and (
            self.encryption_key_algorithms or self.encryption_content_algorithms
        ):
            raise ValueError(
                "encryption configuration must be cleared when canEncryptRequests is disabled"
            )

    def _validate_decryption_group(self) -> None:
        decryption_fields = (
            "can_decrypt_messages",
            "decryption_messages",
            "decryption_key_algorithms",
            "decryption_content_algorithms",
        )
        if not all(field_name in self.model_fields_set for field_name in decryption_fields):
            raise ValueError(
                "canDecryptMessages and decryption configuration must be provided together"
            )
        if (
            self.can_decrypt_messages is None
            or self.decryption_messages is None
            or self.decryption_key_algorithms is None
            or self.decryption_content_algorithms is None
        ):
            raise ValueError(
                "canDecryptMessages and decryption configuration must not be null"
            )
        if self.can_decrypt_messages and (
            not self.decryption_messages
            or not self.decryption_key_algorithms
            or not self.decryption_content_algorithms
        ):
            raise ValueError(
                "decryption configuration is required when canDecryptMessages is enabled"
            )
        if not self.can_decrypt_messages and (
            self.decryption_messages
            or self.decryption_key_algorithms
            or self.decryption_content_algorithms
        ):
            raise ValueError(
                "decryption configuration must be cleared when canDecryptMessages is disabled"
            )

    @model_validator(mode="after")
    def validate_single_editable_field(self) -> Self:
        client_type_group_provided = any(
            field_name in self.model_fields_set
            for field_name in ("client_type", "pkce_supported")
        )
        if client_type_group_provided:
            if self.client_type is None or self.pkce_supported is None:
                raise ValueError(
                    "clientType and pkceSupported must be provided together"
                )
            if self.client_type == "public" and not self.pkce_supported:
                raise ValueError("pkceSupported is required for public clients")

        single_sign_out_group_provided = any(
            field_name in self.model_fields_set
            for field_name in (
                "logout_method",
                "sign_out_request_url",
                "single_sign_out",
            )
        )
        if single_sign_out_group_provided:
            if self.single_sign_out is None:
                raise ValueError("singleSignOut must be provided with logout configuration")
            if self.single_sign_out and (
                self.logout_method is None or self.sign_out_request_url is None
            ):
                raise ValueError(
                    "logout configuration is required when singleSignOut is enabled"
                )
            if not self.single_sign_out and (
                self.logout_method is not None
                or self.sign_out_request_url is not None
            ):
                raise ValueError(
                    "logout configuration must be cleared when singleSignOut is disabled"
                )

        signing_group_provided = any(
            field_name in self.model_fields_set
            for field_name in (
                "can_sign_messages",
                "signing_messages",
                "signing_signature_algorithms",
            )
        )
        if signing_group_provided:
            if not all(
                field_name in self.model_fields_set
                for field_name in (
                    "can_sign_messages",
                    "signing_messages",
                    "signing_signature_algorithms",
                )
            ):
                raise ValueError(
                    "canSignMessages and signing configuration must be provided together"
                )
            if self.can_sign_messages is None or self.signing_messages is None or self.signing_signature_algorithms is None:
                raise ValueError(
                    "canSignMessages and signing configuration must not be null"
                )
            if self.can_sign_messages and (
                not self.signing_messages or not self.signing_signature_algorithms
            ):
                raise ValueError(
                    "signing configuration is required when canSignMessages is enabled"
                )
            if not self.can_sign_messages and (
                self.signing_messages or self.signing_signature_algorithms
            ):
                raise ValueError(
                    "signing configuration must be cleared when canSignMessages is disabled"
                )

        encryption_group_provided = any(
            field_name in self.model_fields_set
            for field_name in (
                "can_encrypt_requests",
                "encryption_key_algorithms",
                "encryption_content_algorithms",
            )
        )
        if encryption_group_provided:
            self._validate_encryption_group()

        decryption_group_provided = any(
            field_name in self.model_fields_set
            for field_name in (
                "can_decrypt_messages",
                "decryption_messages",
                "decryption_key_algorithms",
                "decryption_content_algorithms",
            )
        )
        if decryption_group_provided:
            self._validate_decryption_group()

        authentication_method_group_provided = any(
            field_name in self.model_fields_set
            for field_name in ("client_auth_method", "jwks_uri")
        )
        if authentication_method_group_provided:
            if self.client_auth_method is None:
                raise ValueError("clientAuthMethod must be provided with JWKS configuration")
            if self.client_auth_method == "private_key_jwt" and self.jwks_uri is None:
                raise ValueError("jwksUri is required for private_key_jwt clients")

        verification_group_provided = any(
            field_name in self.model_fields_set
            for field_name in (
                "verification_messages",
                "verification_signature_algorithms",
            )
        )
        if verification_group_provided and (
            self.verification_messages is None
            or self.verification_signature_algorithms is None
        ):
            raise ValueError(
                "verification messages and signature algorithms must be provided together"
            )

        if (
            sum(
                value is not None
                for value in (
                    self.environment_name,
                    self.application_url_en,
                    self.application_url_fr,
                    self.post_logout_redirect_uris,
                    self.redirect_uris,
                )
            )
            + int(client_type_group_provided)
            + int(single_sign_out_group_provided)
            + int(signing_group_provided)
            + int(encryption_group_provided)
            + int(decryption_group_provided)
            + int(authentication_method_group_provided)
            + int(verification_group_provided)
            != 1
        ):
            raise ValueError("Exactly one environment field must be provided")
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
    client_id: str | None = None
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
