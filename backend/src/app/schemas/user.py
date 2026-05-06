import uuid as uuid_pkg
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field
from pydantic.alias_generators import to_camel

from ..core.schemas import PersistentDeletion, TimestampSchema, UUIDSchema
from ..schemas.rate_limit import RateLimitRead


class UserBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=30, examples=["User Userson"])
    username: str = Field(..., min_length=2, max_length=20, pattern=r"^[a-z0-9]+$", examples=["userson"])
    email: EmailStr = Field(..., examples=["user.userson@example.com"])


class User(TimestampSchema, UserBase, UUIDSchema, PersistentDeletion):
    model_config = ConfigDict(
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    profile_image_url: str = Field(default="https://www.profileimageurl.com")
    hashed_password: str | None = None
    auth_provider: str | None = None
    auth_subject: str | None = None
    is_superuser: bool = False
    enabled: bool = False
    department_id: int | None = None
    role_ids: list[int] | None = None
    tier_id: int | None = None


class UserRead(UserBase):
    model_config = ConfigDict(validate_by_name=True, validate_by_alias=True, alias_generator=to_camel, populate_by_name=True)

    uuid: uuid_pkg.UUID
    department_abbreviation: str | None = None
    department_uuid: uuid_pkg.UUID | None = None
    is_superuser: bool = False
    role_uuids: list[uuid_pkg.UUID] | None = None
    tier_uuid: uuid_pkg.UUID | None = None

    name: str = Field(..., min_length=2, max_length=30, examples=["User Userson"])
    username: str = Field(..., min_length=2, max_length=20, pattern=r"^[a-z0-9]+$", examples=["userson"])
    email: EmailStr = Field(..., examples=["user.userson@example.com"])
    profile_image_url: str = "https://www.profileimageurl.com"
    auth_provider: str | None = None
    auth_subject: str | None = None


class UserReadInternal(UserRead):
    model_config = ConfigDict(validate_by_name=True, validate_by_alias=True, alias_generator=to_camel, populate_by_name=True)

    id: int
    department_id: int | None = None
    role_ids: list[int] | None = None
    tier_id: int | None = None


class UserTierRead(UserRead):
    model_config = ConfigDict(validate_by_name=True, validate_by_alias=True, alias_generator=to_camel, populate_by_name=True)

    tier_name: str
    tier_created_at: datetime


class UserDepartmentRead(UserRead):
    model_config = ConfigDict(validate_by_name=True, validate_by_alias=True, alias_generator=to_camel, populate_by_name=True)

    department_abbreviation_fr: str | None = None
    department_name: str
    department_created_at: datetime


class UserRateLimitsRead(UserRead):
    model_config = ConfigDict(validate_by_name=True, validate_by_alias=True, alias_generator=to_camel, populate_by_name=True)

    tier_rate_limits: list[RateLimitRead]


class UserCreate(UserBase):
    model_config = ConfigDict(extra="forbid", validate_by_name=True, validate_by_alias=True, alias_generator=to_camel, populate_by_name=True)

    password: str | None = None


class UserCreateInternal(UserBase):
    hashed_password: str | None = None
    auth_provider: str | None = None
    auth_subject: str | None = None


class UserUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid", validate_by_name=True, validate_by_alias=True, alias_generator=to_camel, populate_by_name=True)

    name: str | None = Field(None, min_length=2, max_length=30, examples=["User Userberg"])
    username: str | None = Field(None, min_length=2, max_length=20, pattern=r"^[a-z0-9]+$", examples=["userberg"])
    email: EmailStr | None = Field(None, examples=["user.userberg@example.com"])
    profile_image_url: str | None = Field(None, pattern=r"^(https?|ftp)://[^\s/$.?#].[^\s]*$", examples=["https://www.profileimageurl.com"])
    auth_provider: str | None = Field(None, max_length=50)
    auth_subject: str | None = Field(None, max_length=255)


class UserUpdateInternal(UserUpdate):
    updated_at: datetime


class UserRoleUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid", validate_by_name=True, validate_by_alias=True, alias_generator=to_camel, populate_by_name=True)

    role_uuid: uuid_pkg.UUID


class UserAddRole(BaseModel):
    model_config = ConfigDict(extra="forbid", validate_by_name=True, validate_by_alias=True, alias_generator=to_camel, populate_by_name=True)

    role_uuid: uuid_pkg.UUID


class UserRemoveRole(BaseModel):
    model_config = ConfigDict(extra="forbid", validate_by_name=True, validate_by_alias=True, alias_generator=to_camel, populate_by_name=True)

    role_uuid: uuid_pkg.UUID


class UserTierUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid", validate_by_name=True, validate_by_alias=True, alias_generator=to_camel, populate_by_name=True)

    tier_uuid: uuid_pkg.UUID


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
