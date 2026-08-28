import uuid as uuid_pkg
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

from .rp_application_promotion_request import ProductionReviewStatus


class ProductionReviewQueueRowRead(BaseModel):
    """Cross-workspace CL Admin view of one explicit Production review."""

    model_config = ConfigDict(
        extra="forbid",
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    rp_configuration_uuid: uuid_pkg.UUID
    configuration_name: str = Field(..., min_length=1, max_length=128)
    source_rp_configuration_uuid: uuid_pkg.UUID | None = None
    application_information_uuid: uuid_pkg.UUID
    application_name_en: str = Field(..., min_length=1, max_length=255)
    application_name_fr: str = Field(..., min_length=1, max_length=255)
    workspace_uuid: uuid_pkg.UUID
    workspace_name: str = Field(..., min_length=1, max_length=128)
    department_uuid: uuid_pkg.UUID | None = None
    department_name: str | None = Field(default=None, max_length=100)
    review_status: ProductionReviewStatus
    external_review_reference: str = Field(..., min_length=1, max_length=255)
    reviewed_by_user_uuid: uuid_pkg.UUID | None = None
    reviewed_by_team: str | None = Field(default=None, max_length=128)
    requested_at: datetime
    reviewed_at: datetime | None = None
    decided_at: datetime | None = None
    updated_at: datetime | None = None
    detail_path: str = Field(..., min_length=1)


# Internal import compatibility; the serialized contract no longer contains
# an onboarding record type or lifecycle state.
OnboardingOversightQueueRowRead = ProductionReviewQueueRowRead
