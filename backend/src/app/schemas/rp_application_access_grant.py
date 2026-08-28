import uuid as uuid_pkg
from datetime import datetime

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel

from ..core.authorization import GrantStatus, PartnerRoleCode
from ..core.schemas import PersistentDeletion


class RPApplicationAccessGrantRead(BaseModel):
    """Public-safe grant projection used only at the HTTP boundary."""

    model_config = ConfigDict(
        extra="ignore",
        frozen=True,
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
        serialize_by_alias=True,
    )

    uuid: uuid_pkg.UUID
    role: PartnerRoleCode
    status: GrantStatus
    source_invitation_uuid: uuid_pkg.UUID | None = None
    revoked_at: datetime | None = None
    created_at: datetime
    updated_at: datetime | None = None


class RPApplicationAccessGrantReadInternal(PersistentDeletion):
    """Persistence projection; integer keys never cross the public API."""

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
    revoked_at: datetime | None = None
    revoked_by_user_id: int | None = None
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
    revoked_at: datetime | None = None
    revoked_by_user_id: int | None = None


class RPApplicationAccessGrantUpdate(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    role: str | None = None
    status: str | None = None
    source_invitation_uuid: uuid_pkg.UUID | None = None
    revoked_at: datetime | None = None
    revoked_by_user_id: int | None = None


class RPApplicationAccessGrantUpdateInternal(RPApplicationAccessGrantUpdate):
    updated_at: datetime | None = None


class RPApplicationAccessGrantDelete(BaseModel):
    is_deleted: bool
    deleted_at: datetime
