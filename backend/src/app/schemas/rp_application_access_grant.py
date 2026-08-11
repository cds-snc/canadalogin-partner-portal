import uuid as uuid_pkg
from datetime import datetime

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel

from ..core.schemas import PersistentDeletion


class RPApplicationAccessGrantRead(PersistentDeletion):
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
    role: str
    status: str
    source_invitation_uuid: uuid_pkg.UUID | None = None
    created_at: datetime
    updated_at: datetime | None = None
    deleted_at: datetime | None = None


class RPApplicationAccessGrantCreateInternal(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    workspace_id: int
    user_id: int
    role: str
    status: str = "active"
    source_invitation_uuid: uuid_pkg.UUID | None = None


class RPApplicationAccessGrantUpdate(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    role: str | None = None
    status: str | None = None
    source_invitation_uuid: uuid_pkg.UUID | None = None


class RPApplicationAccessGrantUpdateInternal(RPApplicationAccessGrantUpdate):
    updated_at: datetime | None = None


class RPApplicationAccessGrantDelete(BaseModel):
    is_deleted: bool
    deleted_at: datetime
