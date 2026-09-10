import uuid as uuid_pkg
from datetime import datetime

from pydantic import BaseModel

from ..core.schemas import PersistentDeletion, TimestampSchema, UUIDSchema


class UserRoleCreateInternal(BaseModel):
    user_id: int
    role_id: int


class UserRoleRead(TimestampSchema, UserRoleCreateInternal, UUIDSchema, PersistentDeletion):
    id: int


class UserRoleUpdate(BaseModel):
    pass


class UserRoleUpdateInternal(UserRoleUpdate):
    updated_at: datetime


class UserRoleDelete(BaseModel):
    is_deleted: bool
    deleted_at: datetime
