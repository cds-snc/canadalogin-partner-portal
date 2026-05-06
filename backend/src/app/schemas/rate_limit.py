import uuid as uuid_pkg
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator
from pydantic.alias_generators import to_camel

from ..core.schemas import TimestampSchema


def sanitize_path(path: str) -> str:
    return path.strip("/").replace("/", "_")


class RateLimitBase(BaseModel):
    path: str = Field(..., examples=["users"])
    limit: int = Field(..., examples=[5])
    period: int = Field(..., examples=[60])

    @field_validator("path")
    def validate_and_sanitize_path(cls, v: str) -> str:
        return sanitize_path(v)


class RateLimit(TimestampSchema, RateLimitBase):
    tier_id: int | None = None
    name: str | None = Field(None, examples=["users:5:60"])


class RateLimitRead(RateLimitBase):
    model_config = ConfigDict(
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )
    id: int
    uuid: uuid_pkg.UUID
    name: str


class RateLimitCreate(RateLimitBase):
    model_config = ConfigDict(extra="forbid", validate_by_name=True, validate_by_alias=True, alias_generator=to_camel, populate_by_name=True)

    name: str | None = Field(None, examples=["api_v1_users:5:60"])


class RateLimitCreateInternal(RateLimitCreate):
    tier_id: int


class RateLimitUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid", validate_by_name=True, validate_by_alias=True, alias_generator=to_camel, populate_by_name=True)
    path: str | None = Field(default=None)
    limit: int | None = None
    period: int | None = None
    name: str | None = None

    @field_validator("path")
    def validate_and_sanitize_path(cls, v: str | None) -> str | None:
        return sanitize_path(v) if v is not None else None


class RateLimitUpdateInternal(RateLimitUpdate):
    updated_at: datetime


class RateLimitDelete(BaseModel):
    pass
