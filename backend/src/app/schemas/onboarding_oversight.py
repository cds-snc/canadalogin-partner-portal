import uuid as uuid_pkg
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

from .onboarding import OnboardingState
from .rp_application import CanadaLoginEnvironment
from .rp_application_promotion_request import PromotionRequestStatus

OnboardingOversightRecordType = Literal[
    "workspace",
    "application_information",
    "rp_application",
    "production_progression",
]

OnboardingOversightReportMetric = Literal[
    "onboarding_throughput",
    "invitation_conversion",
    "secret_rotation_hygiene",
]

OnboardingOversightReportGroupBy = Literal["day", "week", "month"]


class OnboardingOversightQueueRowRead(BaseModel):
    model_config = ConfigDict(
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    record_type: OnboardingOversightRecordType
    record_uuid: uuid_pkg.UUID
    primary_record_label: str = Field(..., min_length=1, max_length=255)
    workspace_uuid: uuid_pkg.UUID
    workspace_name: str = Field(..., min_length=1, max_length=128)
    department_uuid: uuid_pkg.UUID | None = None
    department_name: str | None = Field(default=None, max_length=100)
    onboarding_state: OnboardingState
    current_environment: CanadaLoginEnvironment | None = None
    target_environment: CanadaLoginEnvironment | None = None
    promotion_status: PromotionRequestStatus | None = None
    external_review_reference: str | None = Field(default=None, max_length=255)
    last_activity_at: datetime | None = None
    detail_path: str = Field(..., min_length=1)


class OnboardingOversightReportAppliedFiltersRead(BaseModel):
    model_config = ConfigDict(
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    metric: OnboardingOversightReportMetric
    start_date: date
    end_date: date
    group_by: OnboardingOversightReportGroupBy | None = None
    policy_window_days: int | None = Field(default=None, ge=1)


class OnboardingOversightReportSummaryRead(BaseModel):
    model_config = ConfigDict(
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    submitted_count: int | None = Field(default=None, ge=0)
    approved_count: int | None = Field(default=None, ge=0)
    launched_count: int | None = Field(default=None, ge=0)
    invitations_sent: int | None = Field(default=None, ge=0)
    invitations_accepted: int | None = Field(default=None, ge=0)
    conversion_rate: float | None = Field(default=None, ge=0, le=100)
    total_rp_applications: int | None = Field(default=None, ge=0)
    compliant_rp_applications: int | None = Field(default=None, ge=0)
    non_compliant_rp_applications: int | None = Field(default=None, ge=0)
    hygiene_rate: float | None = Field(default=None, ge=0, le=100)
    policy_window_days: int | None = Field(default=None, ge=1)


class OnboardingOversightReportRowRead(BaseModel):
    model_config = ConfigDict(
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    bucket_label: str = Field(..., min_length=1, max_length=64)
    bucket_start: date | None = None
    bucket_end: date | None = None
    submitted_count: int | None = Field(default=None, ge=0)
    approved_count: int | None = Field(default=None, ge=0)
    launched_count: int | None = Field(default=None, ge=0)
    invitations_sent: int | None = Field(default=None, ge=0)
    invitations_accepted: int | None = Field(default=None, ge=0)
    conversion_rate: float | None = Field(default=None, ge=0, le=100)
    total_rp_applications: int | None = Field(default=None, ge=0)
    compliant_rp_applications: int | None = Field(default=None, ge=0)
    non_compliant_rp_applications: int | None = Field(default=None, ge=0)
    hygiene_rate: float | None = Field(default=None, ge=0, le=100)


class OnboardingOversightReportRead(BaseModel):
    model_config = ConfigDict(
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    metric: OnboardingOversightReportMetric
    title: str = Field(..., min_length=1, max_length=128)
    generated_at: datetime
    applied_filters: OnboardingOversightReportAppliedFiltersRead
    summary: OnboardingOversightReportSummaryRead
    rows: list[OnboardingOversightReportRowRead]
    export_available: bool = True
