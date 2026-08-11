from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_serializer
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