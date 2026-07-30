import uuid as uuid_pkg
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field
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


class ApplicationInformationRead(ApplicationInformationBase, TimestampSchema, PersistentDeletion):
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

    name_en: str = Field(..., min_length=1, max_length=255)
    name_fr: str = Field(..., min_length=1, max_length=255)
    responsibility_en: str = Field(..., min_length=1, max_length=255)
    responsibility_fr: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    phone_number: str | None = Field(None, max_length=50)


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


class ApplicationInformationContactCreate(ApplicationInformationContactBase):
    model_config = ConfigDict(
        extra="forbid",
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )


class ApplicationInformationContactCreateInternal(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    application_information_id: int
    created_by: int | None = None
    name_en: str
    name_fr: str
    responsibility_en: str
    responsibility_fr: str
    email: EmailStr
    phone_number: str | None = None


class ApplicationInformationContactUpdate(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    name_en: str | None = Field(None, min_length=1, max_length=255)
    name_fr: str | None = Field(None, min_length=1, max_length=255)
    responsibility_en: str | None = Field(None, min_length=1, max_length=255)
    responsibility_fr: str | None = Field(None, min_length=1, max_length=255)
    email: EmailStr | None = None
    phone_number: str | None = Field(None, max_length=50)


class ApplicationInformationContactUpdateInternal(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    name_en: str | None = None
    name_fr: str | None = None
    responsibility_en: str | None = None
    responsibility_fr: str | None = None
    email: EmailStr | None = None
    phone_number: str | None = None
    updated_at: datetime


class ApplicationInformationContactDelete(BaseModel):
    pass