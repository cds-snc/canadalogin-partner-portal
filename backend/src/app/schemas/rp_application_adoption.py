import uuid as uuid_pkg
from datetime import datetime
from typing import Literal

from pydantic import (
    AnyHttpUrl,
    AwareDatetime,
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
)
from pydantic.alias_generators import to_camel

RPApplicationAdoptionFieldName = Literal[
    "displayName",
    "providerApplicationState",
    "applicationUrl",
    "redirectUris",
    "logoutUri",
    "logoutRedirectUris",
    "pkceEnabled",
    "clientType",
    "clientAuthMethod",
]
RPApplicationAdoptionFieldStatus = Literal[
    "missing",
    "fillable",
    "preserved",
    "conflict",
]
RPApplicationAdoptionFieldValue = str | bool | list[str] | None


class RPApplicationAdoptionContractModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        extra="forbid",
        populate_by_name=True,
        validate_by_alias=True,
        validate_by_name=True,
    )


class RPApplicationAdoptionCandidateRead(RPApplicationAdoptionContractModel):
    rp_application_uuid: uuid_pkg.UUID
    configuration_name: str = Field(min_length=1, max_length=128)
    partner_environment: str | None = Field(default=None, min_length=1, max_length=128)
    name: str = Field(min_length=1, max_length=128)
    ibm_application_id: str = Field(min_length=1, max_length=128)
    metadata_completeness: Literal["complete", "incomplete"]
    missing_field_names: list[RPApplicationAdoptionFieldName]
    updated_at: datetime | None = None


class RPApplicationAdoptionCandidateListRead(RPApplicationAdoptionContractModel):
    items: list[RPApplicationAdoptionCandidateRead]


class RPApplicationAdoptionProviderMetadata(RPApplicationAdoptionContractModel):
    """Flat non-secret projection supplied by the IBM-interactions package."""

    display_name: str | None = Field(default=None, min_length=1, max_length=128)
    application_state: str | None = Field(default=None, min_length=1, max_length=64)
    application_url: AnyHttpUrl | None = None
    redirect_uris: list[AnyHttpUrl] = Field(default_factory=list, max_length=100)
    logout_uri: AnyHttpUrl | None = None
    logout_redirect_uris: list[AnyHttpUrl] = Field(default_factory=list, max_length=100)
    pkce_enabled: bool | None = None
    client_type: Literal["confidential", "public"] | None = None
    client_auth_method: (
        Literal[
            "private_key_jwt",
            "client_secret_basic",
            "client_secret_post",
        ]
        | None
    ) = None

    @field_validator("application_state", mode="before")
    @classmethod
    def normalize_application_state(cls, value: object) -> object:
        if isinstance(value, bool):
            return "active" if value else "inactive"
        return value


class RPApplicationAdoptionFieldComparisonRead(RPApplicationAdoptionContractModel):
    field_name: RPApplicationAdoptionFieldName
    status: RPApplicationAdoptionFieldStatus
    local_value: RPApplicationAdoptionFieldValue = None
    provider_value: RPApplicationAdoptionFieldValue = None


class RPApplicationAdoptionCandidatePreviewRead(RPApplicationAdoptionContractModel):
    candidate: RPApplicationAdoptionCandidateRead
    partner_environment: str | None = Field(default=None, min_length=1, max_length=128)
    canada_login_environment: Literal["test", "staging", "production"] | None = None
    fields: list[RPApplicationAdoptionFieldComparisonRead]
    fillable_field_names: list[RPApplicationAdoptionFieldName]
    preserved_local_field_names: list[RPApplicationAdoptionFieldName]
    conflicting_field_names: list[RPApplicationAdoptionFieldName]


class RPApplicationWorkspaceLinkWrite(RPApplicationAdoptionContractModel):
    workspace_uuid: uuid_pkg.UUID
    application_information_uuid: uuid_pkg.UUID
    canada_login_environment: Literal["test", "staging", "production"] | None = None


class RPApplicationWorkspaceAdoptionRead(RPApplicationAdoptionContractModel):
    rp_application_uuid: uuid_pkg.UUID
    workspace_uuid: uuid_pkg.UUID
    department_uuid: uuid_pkg.UUID
    application_information_uuid: uuid_pkg.UUID
    ibm_application_id: str = Field(min_length=1, max_length=128)
    configuration_name: str = Field(min_length=1, max_length=128)
    partner_environment: str | None = Field(default=None, min_length=1, max_length=128)
    name: str = Field(min_length=1, max_length=128)
    canada_login_environment: Literal["test", "staging", "production"]
    filled_field_names: list[RPApplicationAdoptionFieldName]
    preserved_local_field_names: list[RPApplicationAdoptionFieldName]
    conflicting_field_names: list[RPApplicationAdoptionFieldName]
    idempotent_replay: bool = False


class RPApplicationAdoptionAuditEvent(RPApplicationAdoptionContractModel):
    event_name: Literal["rp_application.workspace_adopted"] = "rp_application.workspace_adopted"
    event_version: Literal[1] = 1
    timestamp: AwareDatetime
    actor_uuid: uuid_pkg.UUID
    rp_application_uuid: uuid_pkg.UUID
    workspace_uuid: uuid_pkg.UUID
    application_information_uuid: uuid_pkg.UUID | None = None
    configuration_name: str | None = Field(default=None, min_length=1, max_length=128)
    result: Literal["succeeded", "failed"]
    correlation_id: str = Field(
        min_length=1,
        max_length=128,
        pattern=r"^[A-Za-z0-9][A-Za-z0-9_.:-]*$",
    )
    filled_field_names: list[RPApplicationAdoptionFieldName] = Field(default_factory=list)
    reason_code: str | None = Field(
        default=None,
        min_length=1,
        max_length=128,
        pattern=r"^[a-z0-9][a-z0-9_.-]*$",
    )


__all__ = [
    "RPApplicationAdoptionCandidateListRead",
    "RPApplicationAdoptionCandidatePreviewRead",
    "RPApplicationAdoptionCandidateRead",
    "RPApplicationAdoptionContractModel",
    "RPApplicationAdoptionAuditEvent",
    "RPApplicationAdoptionFieldComparisonRead",
    "RPApplicationAdoptionFieldName",
    "RPApplicationAdoptionProviderMetadata",
    "RPApplicationWorkspaceAdoptionRead",
    "RPApplicationWorkspaceLinkWrite",
]
