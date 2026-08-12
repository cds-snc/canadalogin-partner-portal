import uuid as uuid_pkg
from datetime import UTC, datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator
from pydantic.alias_generators import to_camel

from ..core.authorization import AssignmentSource, AssignmentStatus, LifecycleStatus


class UserRoleContract(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    status: AssignmentStatus
    assignment_source: AssignmentSource
    assigned_at: datetime
    assigned_by_user_id: int | None = None
    revoked_at: datetime | None = None
    revoked_by_user_id: int | None = None

    @model_validator(mode="after")
    def validate_lifecycle(self) -> "UserRoleContract":
        if self.assignment_source is AssignmentSource.ADMIN and self.assigned_by_user_id is None:
            raise ValueError("admin assignments require an assigning actor")
        if self.status is LifecycleStatus.ACTIVE and (self.revoked_at is not None or self.revoked_by_user_id is not None):
            raise ValueError("active assignments cannot carry revocation metadata")
        if self.status is LifecycleStatus.REVOKED and self.revoked_at is None:
            raise ValueError("revoked assignments require revoked_at")
        return self


class UserRoleRead(UserRoleContract):
    id: int
    uuid: uuid_pkg.UUID
    user_id: int
    role_id: int
    created_at: datetime
    updated_at: datetime | None = None


class UserRoleCreateInternal(UserRoleContract):
    user_id: int
    role_id: int
    status: AssignmentStatus = LifecycleStatus.ACTIVE
    assigned_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class UserRoleUpdate(BaseModel):
    """Lifecycle-only mutation; identity and source remain immutable."""

    model_config = ConfigDict(extra="forbid")

    status: AssignmentStatus | None = None
    revoked_at: datetime | None = None
    revoked_by_user_id: int | None = None


class UserRoleUpdateInternal(UserRoleUpdate):
    updated_at: datetime | None = None


class UserRoleDelete(BaseModel):
    """FastCRUD type parameter only; assignments are revoked, never deleted."""

    model_config = ConfigDict(extra="forbid")
