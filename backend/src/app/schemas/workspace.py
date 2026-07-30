import uuid as uuid_pkg
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

from ..core.schemas import PersistentDeletion, TimestampSchema


class WorkspaceBase(BaseModel):
    model_config = ConfigDict(
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    name: str = Field(..., min_length=2, max_length=128)
    slug: str | None = Field(None, min_length=1, max_length=128)
    description: str | None = None


class WorkspaceRead(WorkspaceBase, TimestampSchema, PersistentDeletion):
    model_config = ConfigDict(
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    id: int
    uuid: uuid_pkg.UUID
    department_id: int
    created_by: int | None = None


class WorkspaceCreate(WorkspaceBase):
    model_config = ConfigDict(
        extra="forbid",
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    department_uuid: uuid_pkg.UUID


class WorkspaceCreateInternal(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    name: str
    slug: str
    description: str | None = None
    department_id: int
    created_by: int | None = None


class WorkspaceUpdate(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    name: str | None = Field(None, min_length=2, max_length=128)
    slug: str | None = Field(None, min_length=1, max_length=128)
    description: str | None = None
    department_uuid: uuid_pkg.UUID | None = None


class WorkspaceUpdateInternal(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    name: str | None = None
    slug: str | None = None
    description: str | None = None
    department_id: int | None = None
    updated_at: datetime


class WorkspaceDelete(BaseModel):
    pass