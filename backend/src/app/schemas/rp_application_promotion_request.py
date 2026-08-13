import uuid as uuid_pkg
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

PromotionRequestTargetEnvironment = Literal["production"]
PromotionRequestStatus = Literal[
    "review_tracked",
    "changes_requested",
    "approved",
    "launched",
]
PromotionReviewStatus = Literal[
    "changes_requested",
    "approved",
    "launched",
]


class RPApplicationPromotionRequestRead(BaseModel):
    model_config = ConfigDict(
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    target_environment: PromotionRequestTargetEnvironment
    status: PromotionRequestStatus
    external_reference: str | None = None
    reviewed_by_user_uuid: uuid_pkg.UUID | None = None
    reviewed_by_team: str | None = None
    requested_at: datetime
    reviewed_at: datetime | None = None
    decided_at: datetime | None = None
    created_at: datetime
    updated_at: datetime | None = None


class ApplicationRPConfigurationPromotionRequestRead(RPApplicationPromotionRequestRead):
    """Promotion review context with public Application and lineage identifiers."""

    application_information_uuid: uuid_pkg.UUID
    source_rp_configuration_uuid: uuid_pkg.UUID | None = None
    target_rp_configuration_uuid: uuid_pkg.UUID
    target_configuration_name: str = Field(..., min_length=1, max_length=128)


class PromotionRequestUpsert(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    external_reference: str | None = Field(default=None, min_length=1, max_length=255)


class PromotionReviewUpdate(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    status: PromotionReviewStatus
    external_reference: str | None = Field(default=None, min_length=1, max_length=255)
    reviewed_by_team: str | None = Field(default=None, min_length=1, max_length=128)


class RPApplicationPromotionRequestCreateInternal(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    rp_application_id: int
    target_environment: PromotionRequestTargetEnvironment = "production"
    status: PromotionRequestStatus = "review_tracked"
    external_reference: str | None = Field(default=None, min_length=1, max_length=255)
    reviewed_by_user_id: int | None = None
    reviewed_by_team: str | None = Field(default=None, min_length=1, max_length=128)
    requested_at: datetime
    reviewed_at: datetime | None = None
    decided_at: datetime | None = None


class RPApplicationPromotionRequestUpdate(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    status: PromotionRequestStatus | None = None
    external_reference: str | None = Field(default=None, min_length=1, max_length=255)
    reviewed_by_user_id: int | None = None
    reviewed_by_team: str | None = Field(default=None, min_length=1, max_length=128)
    requested_at: datetime | None = None
    reviewed_at: datetime | None = None
    decided_at: datetime | None = None


class RPApplicationPromotionRequestUpdateInternal(RPApplicationPromotionRequestUpdate):
    updated_at: datetime | None = None


class RPApplicationPromotionRequestDelete(BaseModel):
    is_deleted: bool
    deleted_at: datetime
