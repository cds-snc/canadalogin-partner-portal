import uuid as uuid_pkg
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

from ..core.schemas import PersistentDeletion, TimestampSchema


class RoleBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=64, examples=["admin"])
    description: str | None = Field(None, max_length=255, examples=["Administrator role"])


class Role(TimestampSchema, RoleBase, PersistentDeletion):
    pass


class RoleRead(RoleBase):
    model_config = ConfigDict(
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    id: int
    uuid: uuid_pkg.UUID
    created_at: datetime


class RoleCreate(RoleBase):
    model_config = ConfigDict(
        extra="forbid",
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )


class RoleCreateInternal(RoleCreate):
    pass


class RoleUpdate(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    name: str | None = Field(None, min_length=2, max_length=64)
    description: str | None = Field(None, max_length=255)


class RoleUpdateInternal(RoleUpdate):
    updated_at: datetime


class RoleDelete(BaseModel):
    is_deleted: bool
    deleted_at: datetime
