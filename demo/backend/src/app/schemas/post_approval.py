from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

from ..core.schemas import PersistentDeletion, TimestampSchema, UUIDSchema


class PostApprovalCreateInternal(BaseModel):
    model_config = ConfigDict(extra="forbid", validate_by_name=True, validate_by_alias=True, alias_generator=to_camel, populate_by_name=True)

    post_id: int
    submitted_by_user_id: int
    reviewed_by_user_id: int | None = None
    from_status: str = Field(..., max_length=32)
    to_status: str = Field(..., max_length=32)
    decision: str = Field(..., max_length=32)
    comment: str | None = Field(None, max_length=500)


class PostApprovalRead(TimestampSchema, UUIDSchema, PersistentDeletion):
    model_config = ConfigDict(from_attributes=True, validate_by_name=True, validate_by_alias=True, alias_generator=to_camel, populate_by_name=True)

    post_id: int
    submitted_by_user_id: int
    reviewed_by_user_id: int | None = None
    from_status: str
    to_status: str
    decision: str
    comment: str | None = None


class PostApprovalUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid", validate_by_name=True, validate_by_alias=True, alias_generator=to_camel, populate_by_name=True)

    reviewed_by_user_id: int | None = None
    to_status: str | None = Field(None, max_length=32)
    decision: str | None = Field(None, max_length=32)
    comment: str | None = Field(None, max_length=500)


class PostApprovalUpdateInternal(PostApprovalUpdate):
    updated_at: datetime


class PostApprovalDelete(BaseModel):
    model_config = ConfigDict(extra="forbid", validate_by_name=True, validate_by_alias=True, alias_generator=to_camel, populate_by_name=True)

    is_deleted: bool
    deleted_at: datetime
