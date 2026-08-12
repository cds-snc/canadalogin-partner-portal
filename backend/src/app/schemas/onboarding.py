from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_serializer, model_validator
from pydantic.alias_generators import to_camel

OnboardingState = Literal[
    "draft",
    "submitted",
    "under_review",
    "approved",
    "launched",
]


class OnboardingLifecycleTransitionRequest(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    target_state: OnboardingState
    expected_draft_version: int | None = Field(default=None, ge=0)


class WorkspaceRPApplicationOnboardingLifecycleTransitionRequest(OnboardingLifecycleTransitionRequest):
    """RP application transition input with concurrency protection on submit."""

    @model_validator(mode="after")
    def require_expected_draft_version_for_submission(
        self,
    ) -> "WorkspaceRPApplicationOnboardingLifecycleTransitionRequest":
        if self.target_state == "submitted" and self.expected_draft_version is None:
            raise ValueError("expected_draft_version is required when target_state is submitted")
        return self


class OnboardingLifecycleRead(BaseModel):
    onboarding_state: OnboardingState | None = Field(default="draft")
    submitted_at: datetime | None = Field(default=None)
    under_review_at: datetime | None = Field(default=None)
    approved_at: datetime | None = Field(default=None)
    launched_at: datetime | None = Field(default=None)

    @field_serializer(
        "submitted_at",
        "under_review_at",
        "approved_at",
        "launched_at",
    )
    def serialize_milestone_timestamp(
        self,
        value: datetime | None,
        _info: Any,
    ) -> str | None:
        if value is not None:
            return value.isoformat()

        return None
