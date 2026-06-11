import uuid as uuid_pkg
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class AuditLogBase(BaseModel):
    model_config = ConfigDict(
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    user: str = Field(..., max_length=255)
    user_uuid: uuid_pkg.UUID | None = None
    target: str = Field(..., max_length=128)
    target_uuid: uuid_pkg.UUID | None = None
    operation: str = Field(..., max_length=16)
    description: str


class AuditLogCreate(AuditLogBase):
    model_config = ConfigDict(extra="forbid", validate_by_name=True, validate_by_alias=True, alias_generator=to_camel, populate_by_name=True)


class AuditLogCreateInternal(AuditLogBase):
    pass


class AuditLogRead(AuditLogBase):
    model_config = ConfigDict(
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    uuid: uuid_pkg.UUID
    created_at: datetime


class AuditLogUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")


class AuditLogUpdateInternal(BaseModel):
    pass


class AuditLogDelete(BaseModel):
    pass
