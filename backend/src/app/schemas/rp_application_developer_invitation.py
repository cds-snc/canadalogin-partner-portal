import uuid as uuid_pkg
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field
from pydantic.alias_generators import to_camel

from ..core.authorization import (
    InvitationStatus,
    PartnerRoleCode,
    RevocationActorSource,
)
from ..core.schemas import PersistentDeletion
from .rp_application_access_grant import RPApplicationAccessGrantRead


class RPApplicationDeveloperInvitationRead(BaseModel):
    """Minimal public invitation projection with no database identifiers."""

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
    invited_email: EmailStr
    invite_expires_at: datetime
    role: PartnerRoleCode
    status: InvitationStatus
    accepted_at: datetime | None = None
    revoked_at: datetime | None = None
    delegated_by_grant_uuid: uuid_pkg.UUID | None = None
    revocation_reason: str | None = None
    replaced_by_invitation_uuid: uuid_pkg.UUID | None = None
    created_at: datetime
    updated_at: datetime | None = None


class RPApplicationDeveloperInvitationReadInternal(PersistentDeletion):
    """Persistence projection; database keys and delivery metadata stay internal."""

    model_config = ConfigDict(
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    id: int
    uuid: uuid_pkg.UUID
    workspace_id: int
    rp_application_id: int | None
    invited_email: EmailStr
    invite_expires_at: datetime
    invited_by: int | None = None
    role: str
    status: str
    accepted_at: datetime | None = None
    revoked_at: datetime | None = None
    revoked_by_user_id: int | None = None
    revocation_actor_source: RevocationActorSource | None = None
    gc_notify_notification_id: str | None = None
    delegated_by_grant_uuid: uuid_pkg.UUID | None = None
    revocation_reason: str | None = None
    replaced_by_invitation_uuid: uuid_pkg.UUID | None = None
    created_at: datetime
    updated_at: datetime | None = None


class RPApplicationDeveloperInvitationCreate(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    invited_email: EmailStr
    role: str = Field(..., min_length=1, max_length=32)
    invite_expires_at: datetime


class RPApplicationDeveloperInvitationReissue(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    invite_expires_at: datetime


class RPApplicationDeveloperInvitationWriteResponse(RPApplicationDeveloperInvitationRead):
    acceptance_url: str


class RPApplicationDeveloperInvitationAcceptRequest(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    token: str = Field(..., min_length=1)


class RPApplicationDeveloperInvitationAcceptResponse(BaseModel):
    model_config = ConfigDict(
        extra="ignore",
        frozen=True,
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
        serialize_by_alias=True,
    )

    invitation: RPApplicationDeveloperInvitationRead
    access_grant: RPApplicationAccessGrantRead
    next_destination: str


class RPApplicationDeveloperInvitationCreateInternal(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    workspace_id: int
    rp_application_id: int | None
    invited_email: EmailStr
    token_hash: str = Field(..., min_length=1, max_length=128)
    invite_expires_at: datetime
    invited_by: int | None = None
    role: str = Field(..., min_length=1, max_length=32)
    status: str = Field(default="pending", min_length=1, max_length=32)
    accepted_at: datetime | None = None
    revoked_at: datetime | None = None
    revoked_by_user_id: int | None = None
    revocation_actor_source: RevocationActorSource | None = None
    gc_notify_notification_id: str | None = Field(None, max_length=64)
    delegated_by_grant_uuid: uuid_pkg.UUID | None = None
    revocation_reason: str | None = Field(None, max_length=255)
    replaced_by_invitation_uuid: uuid_pkg.UUID | None = None


class RPApplicationDeveloperInvitationUpdate(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    token_hash: str | None = Field(None, min_length=1, max_length=128)
    invite_expires_at: datetime | None = None
    role: str | None = Field(None, min_length=1, max_length=32)
    status: str | None = Field(None, min_length=1, max_length=32)
    accepted_at: datetime | None = None
    revoked_at: datetime | None = None
    revoked_by_user_id: int | None = None
    revocation_actor_source: RevocationActorSource | None = None
    gc_notify_notification_id: str | None = Field(None, max_length=64)
    delegated_by_grant_uuid: uuid_pkg.UUID | None = None
    revocation_reason: str | None = Field(None, max_length=255)
    replaced_by_invitation_uuid: uuid_pkg.UUID | None = None


class RPApplicationDeveloperInvitationUpdateInternal(RPApplicationDeveloperInvitationUpdate):
    updated_at: datetime | None = None


class RPApplicationDeveloperInvitationDelete(BaseModel):
    is_deleted: bool
    deleted_at: datetime
