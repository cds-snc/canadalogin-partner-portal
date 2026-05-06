import uuid as uuid_pkg
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

from ..core.schemas import PersistentDeletion, TimestampSchema


class DepartmentBase(BaseModel):
    model_config = ConfigDict(
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    name: str = Field(..., min_length=2, max_length=100, examples=["Engineering"])
    gc_org_id: int | None = Field(None, ge=1)
    name_fr: str | None = Field(None, max_length=128)
    abbreviation: str | None = Field(None, max_length=16)
    abbreviation_fr: str | None = Field(None, max_length=16)
    lead_department_name: str | None = Field(None, max_length=64)
    lead_department_name_fr: str | None = Field(None, max_length=192)


class Department(TimestampSchema, DepartmentBase, PersistentDeletion):
    pass


class DepartmentRead(DepartmentBase):
    model_config = ConfigDict(
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    id: int
    uuid: uuid_pkg.UUID
    created_at: datetime


class DepartmentCreate(DepartmentBase):
    model_config = ConfigDict(extra="forbid", validate_by_name=True, validate_by_alias=True, alias_generator=to_camel, populate_by_name=True)


class DepartmentCreateInternal(DepartmentCreate):
    pass


class DepartmentUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid", validate_by_name=True, validate_by_alias=True, alias_generator=to_camel, populate_by_name=True)
    name: str | None = Field(None, min_length=2, max_length=100)
    gc_org_id: int | None = Field(None, ge=1)
    name_fr: str | None = Field(None, max_length=128)
    abbreviation: str | None = Field(None, max_length=16)
    abbreviation_fr: str | None = Field(None, max_length=16)
    lead_department_name: str | None = Field(None, max_length=64)
    lead_department_name_fr: str | None = Field(None, max_length=192)


class DepartmentUpdateInternal(DepartmentUpdate):
    updated_at: datetime


class DepartmentDelete(BaseModel):
    pass
