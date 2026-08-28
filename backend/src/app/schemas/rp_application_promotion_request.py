import uuid as uuid_pkg
from datetime import datetime
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints
from pydantic.alias_generators import to_camel

PromotionRequestTargetEnvironment = Literal["production"]
ProductionReviewStatus = Literal[
    "pending",
    "approved",
    "rejected",
]
# Compatibility name for internal imports while the product contract uses
# Production-review terminology.
PromotionRequestStatus = ProductionReviewStatus
ProductionReviewDecisionStatus = Literal[
    "approved",
    "rejected",
]
# Internal compatibility name for service and repository imports.
PromotionReviewStatus = ProductionReviewDecisionStatus

ExternalReference = Annotated[
    str,
    StringConstraints(strip_whitespace=True, min_length=1, max_length=255),
]
ReviewerTeam = Annotated[
    str,
    StringConstraints(strip_whitespace=True, min_length=1, max_length=128),
]


class RPApplicationProductionReviewRead(BaseModel):
    model_config = ConfigDict(
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    target_environment: PromotionRequestTargetEnvironment
    status: ProductionReviewStatus
    external_reference: str | None = None
    reviewed_by_user_uuid: uuid_pkg.UUID | None = None
    reviewed_by_team: str | None = None
    requested_at: datetime
    reviewed_at: datetime | None = None
    decided_at: datetime | None = None
    created_at: datetime
    updated_at: datetime | None = None


class ApplicationRPConfigurationProductionReviewRead(RPApplicationProductionReviewRead):
    """Production-review context with public Application and lineage identifiers."""

    application_information_uuid: uuid_pkg.UUID
    source_rp_configuration_uuid: uuid_pkg.UUID | None = None
    target_rp_configuration_uuid: uuid_pkg.UUID
    target_configuration_name: str = Field(..., min_length=1, max_length=128)


class ProductionReviewRequest(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    external_reference: ExternalReference


class ProductionReviewDecision(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    status: ProductionReviewDecisionStatus
    external_reference: ExternalReference | None = None
    reviewed_by_team: ReviewerTeam | None = None


# Internal source compatibility while service/repository names are migrated.
RPApplicationPromotionRequestRead = RPApplicationProductionReviewRead
ApplicationRPConfigurationPromotionRequestRead = ApplicationRPConfigurationProductionReviewRead
PromotionRequestUpsert = ProductionReviewRequest
PromotionReviewUpdate = ProductionReviewDecision


class RPApplicationPromotionRequestCreateInternal(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    rp_application_id: int
    target_environment: PromotionRequestTargetEnvironment = "production"
    review_status: ProductionReviewStatus = "pending"
    # The non-null legacy column remains during the expand/compatibility phase.
    # It is not exposed and is never used to derive a product outcome.
    status: Literal["review_tracked"] = "review_tracked"
    external_reference: ExternalReference | None = None
    reviewed_by_user_id: int | None = None
    reviewed_by_team: ReviewerTeam | None = None
    requested_at: datetime
    reviewed_at: datetime | None = None
    decided_at: datetime | None = None


class RPApplicationPromotionRequestUpdate(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    review_status: ProductionReviewStatus | None = None
    external_reference: ExternalReference | None = None
    reviewed_by_user_id: int | None = None
    reviewed_by_team: ReviewerTeam | None = None
    requested_at: datetime | None = None
    reviewed_at: datetime | None = None
    decided_at: datetime | None = None


class RPApplicationPromotionRequestUpdateInternal(RPApplicationPromotionRequestUpdate):
    updated_at: datetime | None = None


class RPApplicationPromotionRequestDelete(BaseModel):
    is_deleted: bool
    deleted_at: datetime
