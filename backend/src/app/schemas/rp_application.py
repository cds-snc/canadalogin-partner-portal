import uuid as uuid_pkg
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field
from pydantic.alias_generators import to_camel

from ..core.schemas import PersistentDeletion, UUIDSchema


class RPApplicationBase(BaseModel):
    model_config = ConfigDict(
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    dnr_app_name: str = Field(..., min_length=1, max_length=128)


class RPApplicationOwnerRead(BaseModel):
    model_config = ConfigDict(
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    email: str = Field(..., min_length=1, max_length=254)


class RPApplicationOwnerSnapshotRead(BaseModel):
    model_config = ConfigDict(
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    owners: list[RPApplicationOwnerRead] = Field(default_factory=list)


class RPApplicationRead(RPApplicationBase, UUIDSchema, PersistentDeletion):
    id: int
    department_id: int | None
    created_by: int | None
    created_at: datetime
    ibm_sv_application_id: str | None = None
    application_owner: RPApplicationOwnerSnapshotRead | None = None


class RPApplicationCurrentUserRead(BaseModel):
    model_config = ConfigDict(
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    id: int
    uuid: uuid_pkg.UUID
    dnr_app_name: str
    ibm_sv_application_id: str | None = None
    department_id: int | None
    application_owner: RPApplicationOwnerSnapshotRead | None = None


class RPApplicationCreate(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    department_id: int
    dnr_app_name: str = Field(..., min_length=1, max_length=128)
    ibm_sv_application_id: str | None = Field(None, max_length=128)


class RPApplicationUpdate(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    dnr_app_name: str | None = Field(None, min_length=1, max_length=128)
    department_id: int | None = None
    ibm_sv_application_id: str | None = Field(None, max_length=128)


class RPApplicationCreateInternal(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    department_id: int | None
    dnr_app_name: str
    ibm_sv_application_id: str | None = None
    created_by: int | None = None
    application_owner: RPApplicationOwnerSnapshotRead | None = None


class RPApplicationUpdateInternal(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    dnr_app_name: str | None = None
    department_id: int | None = None
    application_owner: RPApplicationOwnerSnapshotRead | None = None
    updated_at: datetime


class RPApplicationDelete(PersistentDeletion):
    pass


class RPApplicationDeveloperInvitationCreate(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    email: EmailStr


class RPApplicationDeveloperInvitationAccept(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    token: str = Field(..., min_length=1)


class RPApplicationDeveloperInvitationCreateInternal(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    workspace_id: int
    rp_application_id: int
    invited_email: str
    invited_by: int | None = None
    role: str = "developer"
    token_hash: str
    invite_expires_at: datetime
    gc_notify_notification_id: str | None = None


class RPApplicationDeveloperInvitationUpdateInternal(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    accepted_at: datetime | None = None
    revoked_at: datetime | None = None
    gc_notify_notification_id: str | None = None
    updated_at: datetime


RPApplicationDeveloperInvitationStatus = Literal[
    "pending", "accepted", "revoked", "expired"
]


class RPApplicationDeveloperInvitationRead(UUIDSchema, PersistentDeletion):
    id: int
    workspace_id: int
    rp_application_id: int
    invited_email: str
    invited_by: int | None = None
    role: str
    invite_expires_at: datetime
    accepted_at: datetime | None = None
    revoked_at: datetime | None = None
    gc_notify_notification_id: str | None = None
    created_at: datetime
    updated_at: datetime | None = None
    model_config = ConfigDict(
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )


class RPApplicationDeveloperInvitationManagementRead(
    RPApplicationDeveloperInvitationRead
):
    status: RPApplicationDeveloperInvitationStatus


class RPApplicationClientCredentialsRead(BaseModel):
    model_config = ConfigDict(
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    client_id: str
    client_secret: str | None = None
    client_secret_id: str | None = None


class RPApplicationClientRotatedSecretRead(BaseModel):
    model_config = ConfigDict(
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    description: str | None = None
    expired_at: int | None = Field(None, alias="expiredAt")
    rotated_at: int | None = Field(None, alias="rotatedAt")
    value: str | None = Field(None, alias="value")
    secret_id: str | None = Field(None, alias="secretId")


class RPApplicationClientRotatedSecretCreateRequest(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    description: str = Field(..., min_length=1)
    rotated_secret_expired_at: int = Field(..., alias="rotatedSecretExpiredAt", ge=1)


class RPApplicationClientSecretRotateRequest(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    delete_rotated_secrets: bool = Field(False, alias="deleteRotatedSecrets")
    description: str = ""
    rotated_secret_expired_at: int = Field(0, alias="rotatedSecretExpiredAt")


class RPApplicationUsageSummaryRead(BaseModel):
    model_config = ConfigDict(
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    total: int
    succeeded: int
    failed: int


class RPApplicationUsageAuditEventRead(BaseModel):
    model_config = ConfigDict(
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    username: str
    username_display: str
    username_known: bool
    origin: str
    origin_display: str
    ip_version: int | None = None
    result: str
    time_seconds: int | None = None
    country: str


class RPApplicationUsageAuditTrailRead(BaseModel):
    model_config = ConfigDict(
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    events: list[RPApplicationUsageAuditEventRead] = Field(default_factory=list)
    next: str | None = None
    total: int | None = None
