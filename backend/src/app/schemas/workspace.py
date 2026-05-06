import uuid as uuid_pkg
from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field
from pydantic.alias_generators import to_camel

from ..core.schemas import PersistentDeletion, TimestampSchema, UUIDSchema


class WorkspaceBase(TimestampSchema):
    name: str = Field(..., min_length=1, max_length=128)
    # slug may be provided by client, but server will generate one if missing
    slug: str | None = Field(None, min_length=1, max_length=128)
    description: str | None = None


class WorkspaceCreate(WorkspaceBase):
    pass


class WorkspaceCreateInternal(BaseModel):
    model_config = {"arbitrary_types_allowed": True}
    name: str
    slug: str
    description: str | None = None
    department_id: int
    created_by: int | None = None


class WorkspaceRead(WorkspaceBase, UUIDSchema, PersistentDeletion):
    id: int
    department_id: int
    created_by: int | None = None
    model_config = ConfigDict(
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )


class WorkspaceUpdate(WorkspaceBase):
    pass


class WorkspaceUpdateInternal(WorkspaceUpdate):
    pass


class WorkspaceDelete(PersistentDeletion):
    pass


# WorkspaceMember schemas
class WorkspaceMemberBase(TimestampSchema):
    role: str = Field(..., min_length=1, max_length=32)


class WorkspaceMemberCreate(WorkspaceMemberBase):
    # User to add to the workspace (UUID exposed to API)
    model_config = ConfigDict(
        extra="forbid",
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )
    # Accept snake_case alias from clients as well
    userUuid: uuid_pkg.UUID = Field(..., alias="user_uuid")


class WorkspaceMemberCreateInternal(BaseModel):
    model_config = {"arbitrary_types_allowed": True}
    workspace_id: int
    user_id: int
    role: str
    invited_by: int | None = None


class WorkspaceMemberRead(WorkspaceMemberBase, UUIDSchema, PersistentDeletion):
    id: int
    workspace_id: int
    user_id: int
    user_email: str | None = None
    user_name: str | None = None
    model_config = ConfigDict(
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )


class WorkspaceMemberUpdate(WorkspaceMemberBase):
    pass


class WorkspaceMemberUpdateInternal(WorkspaceMemberUpdate):
    pass


class WorkspaceMemberDelete(PersistentDeletion):
    pass


# RPApplication scaffold schemas
class RPApplicationBase(BaseModel):
    model_config = ConfigDict(
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    name: str = Field(..., min_length=1, max_length=128)
    settings: dict[str, Any] | None = None
    status: str = "draft"


class RPApplicationRead(RPApplicationBase, UUIDSchema, PersistentDeletion):
    id: int
    workspace_id: int
    application_info_id: int | None = None
    created_by: int | None
    created_at: datetime
    ibm_sv_application_id: str | None = None


class RPApplicationCurrentUserRead(BaseModel):
    model_config = ConfigDict(
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    id: int
    uuid: uuid_pkg.UUID
    name: str
    status: str
    settings: dict[str, Any] | None = None
    ibm_sv_application_id: str | None = None
    workspace_name: str
    workspace_uuid: uuid_pkg.UUID


class RPApplicationCreate(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    name: str = Field(..., min_length=1, max_length=128)
    description: str = ""
    application_url: str = ""
    redirect_uris: list[str] = Field(default_factory=list)
    client_type: Literal["public", "confidential"] | None = None
    client_auth_method: Literal["default", "client_secret_basic", "private_key_jwt"] | None = None
    pkce_enabled: bool | None = None
    jwks_uri: str = ""
    company_name: str = ""
    logout_method: str = "none"
    logout_uri: str = ""
    post_logout_redirect_uris: list[str] = Field(default_factory=list)
    owners: list[str] = Field(default_factory=list)
    status: str = "draft"
    application_info_uuid: uuid_pkg.UUID | None = None


class RPApplicationUpdate(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    name: str | None = Field(None, min_length=1, max_length=128)
    description: str | None = None
    application_url: str | None = None
    redirect_uris: list[str] | None = None
    client_type: Literal["public", "confidential"] | None = None
    client_auth_method: Literal["default", "client_secret_basic", "private_key_jwt"] | None = None
    pkce_enabled: bool | None = None
    jwks_uri: str | None = None
    company_name: str | None = None
    logout_method: str | None = None
    logout_uri: str | None = None
    post_logout_redirect_uris: list[str] | None = None
    owners: list[str] | None = None
    status: str | None = None


class RPApplicationCreateInternal(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    workspace_id: int
    application_info_id: int | None = None
    name: str
    ibm_sv_application_id: str | None = None
    status: str = "draft"
    created_by: int | None = None


class RPApplicationUpdateInternal(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    name: str | None = None
    status: str | None = None
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
