import uuid as uuid_pkg
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel

from ..core.schemas import PersistentDeletion

WorkspaceMemberRole = Literal["workspace_admin", "workspace_member"]


class WorkspaceMemberRead(PersistentDeletion):
    model_config = ConfigDict(
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    id: int
    uuid: uuid_pkg.UUID
    workspace_id: int
    user_id: int
    role: WorkspaceMemberRole
    created_at: datetime
    deleted_at: datetime | None = None
    user_email: str | None = None
    user_name: str | None = None
    user_uuid: uuid_pkg.UUID | None = None


class WorkspaceMemberCreate(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    user_uuid: uuid_pkg.UUID
    role: WorkspaceMemberRole


class WorkspaceMemberCreateInternal(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    workspace_id: int
    user_id: int
    invited_by: int | None = None
    role: WorkspaceMemberRole


class WorkspaceMemberUpdate(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    role: WorkspaceMemberRole


class WorkspaceMemberUpdateInternal(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    role: WorkspaceMemberRole


class WorkspaceMemberDelete(BaseModel):
    pass