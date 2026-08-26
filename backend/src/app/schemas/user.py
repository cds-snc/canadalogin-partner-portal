import uuid as uuid_pkg
from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, EmailStr, Field
from pydantic.alias_generators import to_camel

from ..core.authorization import GlobalRoleCode, InvitationStatus, PartnerRoleCode
from ..core.schemas import PersistentDeletion, TimestampSchema, UUIDSchema
from .authorization import AuthorizationContextRead, AuthorizationContractModel


class UserBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=30, examples=["User Userson"])
    email: EmailStr = Field(..., examples=["user.userson@example.com"])


class User(TimestampSchema, UserBase, UUIDSchema, PersistentDeletion):
    model_config = ConfigDict(
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    username: EmailStr = Field(..., examples=["user.userson@example.com"])
    profile_image_url: str = Field(default="https://www.profileimageurl.com")
    auth_provider: str | None = None
    auth_subject: str | None = None
    is_superuser: bool = False
    enabled: bool = False
    department_id: int | None = None
    role_ids: list[int] | None = None
    tier_id: int | None = None
    accepted_terms_at: datetime | None = None
    terms_version: str | None = None


class UserRead(UserBase):
    model_config = ConfigDict(validate_by_name=True, validate_by_alias=True, alias_generator=to_camel, populate_by_name=True)

    uuid: uuid_pkg.UUID
    username: EmailStr
    department_abbreviation: str | None = None
    department_uuid: uuid_pkg.UUID | None = None
    profile_image_url: str = "https://www.profileimageurl.com"
    auth_provider: str | None = None
    enabled: bool = False
    accepted_terms_at: datetime | None = None
    terms_version: str | None = None


class AuthenticatedUserRead(AuthorizationContractModel):
    """Target current-user contract without legacy authorization sources."""

    uuid: uuid_pkg.UUID
    name: str = Field(..., min_length=2, max_length=30)
    email: EmailStr
    username: EmailStr
    department_abbreviation: str | None = None
    department_uuid: uuid_pkg.UUID | None = None
    profile_image_url: str = "https://www.profileimageurl.com"
    accepted_terms_at: datetime | None = None
    terms_version: str | None = None
    authorization_context: AuthorizationContextRead


class UserAccessIdentityRead(AuthorizationContractModel):
    """Public identity and account state for CL Admin access management."""

    uuid: uuid_pkg.UUID
    name: str
    email: EmailStr
    username: EmailStr
    enabled: bool


class UserDirectoryWorkspaceAccessRead(AuthorizationContractModel):
    workspace_uuid: uuid_pkg.UUID
    workspace_name: str
    role: PartnerRoleCode


class UserAccessDirectoryRead(AuthorizationContractModel):
    """Safe access-oriented user projection for the CL Admin directory."""

    uuid: uuid_pkg.UUID
    name: str
    email: EmailStr
    enabled: bool
    global_role: GlobalRoleCode | None = None
    workspace_assignments: tuple[UserDirectoryWorkspaceAccessRead, ...] = ()


class UserGlobalAccessSummaryRead(AuthorizationContractModel):
    assignment_uuid: uuid_pkg.UUID
    role: GlobalRoleCode
    assigned_at: datetime


class UserWorkspaceAccessSummaryRead(AuthorizationContractModel):
    assignment_uuid: uuid_pkg.UUID
    workspace_uuid: uuid_pkg.UUID
    workspace_name: str
    role: PartnerRoleCode
    assigned_at: datetime


class UserPendingInvitationSummaryRead(AuthorizationContractModel):
    invitation_uuid: uuid_pkg.UUID
    workspace_uuid: uuid_pkg.UUID
    workspace_name: str
    role: PartnerRoleCode
    status: InvitationStatus
    invite_expires_at: datetime
    created_at: datetime


class UserPendingInvitationDirectoryRead(UserPendingInvitationSummaryRead):
    """Minimal cross-workspace pending invitation projection for CL Admin."""

    invited_email: EmailStr


class UserAccessAdministrationRead(AuthorizationContractModel):
    """CL Admin projection containing canonical access, never provider data."""

    user: UserAccessIdentityRead
    global_assignment: UserGlobalAccessSummaryRead | None = None
    workspace_assignments: tuple[UserWorkspaceAccessSummaryRead, ...] = ()
    pending_invitations: tuple[UserPendingInvitationSummaryRead, ...] = ()


class UserInvitationTargetResolutionOutcome(StrEnum):
    NEW_IDENTITY = "new_identity"
    EXISTING_IDENTITY = "existing_identity"
    INELIGIBLE_IDENTITY = "ineligible_identity"


class UserInvitationTargetResolutionRequest(AuthorizationContractModel):
    invited_email: EmailStr


class UserInvitationTargetResolutionRead(AuthorizationContractModel):
    outcome: UserInvitationTargetResolutionOutcome
    user_uuid: uuid_pkg.UUID | None = None


class UserReadInternal(UserRead):
    model_config = ConfigDict(validate_by_name=True, validate_by_alias=True, alias_generator=to_camel, populate_by_name=True)

    id: int
    auth_subject: str | None = None
    department_id: int | None = None
    deleted_at: datetime | None = None
    is_deleted: bool = False
    is_superuser: bool = False
    role_ids: list[int] | None = None
    tier_id: int | None = None


class UserDepartmentRead(UserRead):
    model_config = ConfigDict(validate_by_name=True, validate_by_alias=True, alias_generator=to_camel, populate_by_name=True)

    department_abbreviation_fr: str | None = None
    department_name: str
    department_created_at: datetime


class UserCreate(UserBase):
    model_config = ConfigDict(extra="forbid", validate_by_name=True, validate_by_alias=True, alias_generator=to_camel, populate_by_name=True)


class UserCreateInternal(UserBase):
    username: EmailStr
    auth_provider: str | None = None
    auth_subject: str | None = None
    enabled: bool = False


class UserUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid", validate_by_name=True, validate_by_alias=True, alias_generator=to_camel, populate_by_name=True)

    name: str | None = Field(None, min_length=2, max_length=30, examples=["User Userberg"])
    email: EmailStr | None = Field(None, examples=["user.userberg@example.com"])
    profile_image_url: str | None = Field(None, pattern=r"^(https?|ftp)://[^\s/$.?#].[^\s]*$", examples=["https://www.profileimageurl.com"])
    enabled: bool | None = None


class UserUpdateInternal(UserUpdate):
    auth_provider: str | None = Field(None, max_length=50)
    auth_subject: str | None = Field(None, max_length=255)
    updated_at: datetime


class UserDepartmentUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid", validate_by_name=True, validate_by_alias=True, alias_generator=to_camel, populate_by_name=True)

    department_abbreviation: str | None = Field(None, min_length=2, max_length=16)


class UserDelete(BaseModel):
    model_config = ConfigDict(extra="forbid", validate_by_name=True, validate_by_alias=True, alias_generator=to_camel, populate_by_name=True)

    is_deleted: bool
    deleted_at: datetime


class UserRestoreDeleted(BaseModel):
    model_config = ConfigDict(validate_by_name=True, validate_by_alias=True, alias_generator=to_camel, populate_by_name=True)

    is_deleted: bool
