import uuid as uuid_pkg
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator
from pydantic.alias_generators import to_camel

from ..core.schemas import PersistentDeletion, TimestampSchema


class ApplicationInformationBase(BaseModel):
    model_config = ConfigDict(
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    service_name_en: str = Field(..., min_length=1, max_length=255)
    service_name_fr: str = Field(..., min_length=1, max_length=255)
    overview: str = Field(..., min_length=1)
    technology_and_protocol: str = Field(..., min_length=1)
    security_and_privacy: str = Field(..., min_length=1)
    usage: str = Field(..., min_length=1)
    migration_or_transition_plan: str = Field(..., min_length=1)


class ApplicationInformationRead(
    ApplicationInformationBase,
    TimestampSchema,
    PersistentDeletion,
):
    model_config = ConfigDict(
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    id: int
    uuid: uuid_pkg.UUID
    workspace_id: int
    created_by: int | None = None


ApplicationChecklistKey = Literal[
    "business_context",
    "contacts",
    "migration_planning",
    "security_posture",
    "service_identity",
    "technical_integration",
]
ApplicationChecklistStatus = Literal[
    "attention_required",
    "missing",
    "provided",
]


class ApplicationInformationChecklistItemRead(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        frozen=True,
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
        serialize_by_alias=True,
    )

    key: ApplicationChecklistKey
    status: ApplicationChecklistStatus


class ApplicationInformationChecklistRead(BaseModel):
    """Status-only checklist projection that excludes contact PII."""

    model_config = ConfigDict(
        extra="forbid",
        frozen=True,
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
        serialize_by_alias=True,
    )

    application_information_uuid: uuid_pkg.UUID
    application_name_en: str
    application_name_fr: str
    items: list[ApplicationInformationChecklistItemRead]
    cats_evidence_status: Literal["not_configured"] = "not_configured"


class ApplicationInformationCreate(ApplicationInformationBase):
    model_config = ConfigDict(
        extra="forbid",
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )


class ApplicationInformationCreateInternal(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    workspace_id: int
    created_by: int | None = None
    service_name_en: str
    service_name_fr: str
    overview: str
    technology_and_protocol: str
    security_and_privacy: str
    usage: str
    migration_or_transition_plan: str


class ApplicationInformationUpdate(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    service_name_en: str | None = Field(None, min_length=1, max_length=255)
    service_name_fr: str | None = Field(None, min_length=1, max_length=255)
    overview: str | None = Field(None, min_length=1)
    technology_and_protocol: str | None = Field(None, min_length=1)
    security_and_privacy: str | None = Field(None, min_length=1)
    usage: str | None = Field(None, min_length=1)
    migration_or_transition_plan: str | None = Field(None, min_length=1)


class ApplicationInformationUpdateInternal(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    service_name_en: str | None = None
    service_name_fr: str | None = None
    overview: str | None = None
    technology_and_protocol: str | None = None
    security_and_privacy: str | None = None
    usage: str | None = None
    migration_or_transition_plan: str | None = None
    updated_at: datetime


class ApplicationInformationDelete(BaseModel):
    pass


class ApplicationInformationContactBase(BaseModel):
    model_config = ConfigDict(
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    responsibility_en: str = Field(..., min_length=1, max_length=255)
    responsibility_fr: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    phone_number: str | None = Field(None, max_length=50)
    alternate_phone_number: str | None = Field(None, max_length=50)


class ApplicationInformationContactRecordRead(ApplicationInformationContactBase, TimestampSchema, PersistentDeletion):
    model_config = ConfigDict(
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    id: int
    uuid: uuid_pkg.UUID
    application_information_id: int
    created_by: int | None = None
    name_en: str | None = Field(default=None, min_length=1, max_length=255)
    name_fr: str | None = Field(default=None, min_length=1, max_length=255)
    first_name: str | None = Field(default=None, min_length=1, max_length=100)
    last_name: str | None = Field(default=None, min_length=1, max_length=100)
    alternate_phone_number: str | None = Field(default=None, max_length=50)
    identity_confirmed_at: datetime | None = None
    identity_confirmed_by: int | None = None


class ApplicationInformationContactRead(ApplicationInformationContactBase, TimestampSchema, PersistentDeletion):
    model_config = ConfigDict(
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    id: int
    uuid: uuid_pkg.UUID
    application_information_id: int
    created_by: int | None = None
    name_en: str | None = Field(default=None, min_length=1, max_length=255)
    name_fr: str | None = Field(default=None, min_length=1, max_length=255)
    first_name: str | None = Field(default=None, min_length=1, max_length=100)
    last_name: str | None = Field(default=None, min_length=1, max_length=100)
    identity_confirmed_at: datetime | None = None
    identity_confirmed_by_user_uuid: uuid_pkg.UUID | None = None
    identity_confirmation_required: bool


class ApplicationInformationContactCreate(ApplicationInformationContactBase):
    model_config = ConfigDict(
        extra="forbid",
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)

    @field_validator("first_name", "last_name", "responsibility_en", "responsibility_fr", mode="before")
    @classmethod
    def normalize_required_text(cls, value: object) -> object:
        if isinstance(value, str):
            normalized = value.strip()
            if not normalized:
                raise ValueError("value must not be blank")
            return normalized
        return value


class ApplicationInformationContactCreateInternal(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    application_information_id: int
    created_by: int | None = None
    name_en: str | None = None
    name_fr: str | None = None
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    responsibility_en: str
    responsibility_fr: str
    email: EmailStr
    phone_number: str | None = None
    alternate_phone_number: str | None = Field(default=None, max_length=50)
    identity_confirmed_at: datetime | None = None
    identity_confirmed_by: int | None = Field(default=None, ge=1)


class ApplicationInformationContactUpdate(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    first_name: str | None = Field(None, min_length=1, max_length=100)
    last_name: str | None = Field(None, min_length=1, max_length=100)
    responsibility_en: str | None = Field(None, min_length=1, max_length=255)
    responsibility_fr: str | None = Field(None, min_length=1, max_length=255)
    email: EmailStr | None = None
    phone_number: str | None = Field(None, max_length=50)
    alternate_phone_number: str | None = Field(None, max_length=50)

    @field_validator("first_name", "last_name", "responsibility_en", "responsibility_fr", mode="before")
    @classmethod
    def normalize_optional_text(cls, value: object) -> object:
        if isinstance(value, str):
            normalized = value.strip()
            if not normalized:
                raise ValueError("value must not be blank")
            return normalized
        return value


class ApplicationInformationContactUpdateInternal(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    name_en: str | None = None
    name_fr: str | None = None
    first_name: str | None = Field(default=None, min_length=1, max_length=100)
    last_name: str | None = Field(default=None, min_length=1, max_length=100)
    responsibility_en: str | None = None
    responsibility_fr: str | None = None
    email: EmailStr | None = None
    phone_number: str | None = None
    alternate_phone_number: str | None = Field(default=None, max_length=50)
    identity_confirmed_at: datetime | None = None
    identity_confirmed_by: int | None = Field(default=None, ge=1)
    updated_at: datetime


class ApplicationInformationContactDelete(BaseModel):
    pass
