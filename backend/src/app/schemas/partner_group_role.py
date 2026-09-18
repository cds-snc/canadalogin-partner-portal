from datetime import datetime

from pydantic import BaseModel

from ..core.schemas import PersistentDeletion, TimestampSchema, UUIDSchema


class PartnerGroupRoleCreateInternal(BaseModel):
    partner_group_id: int
    role_id: int


class PartnerGroupRoleRead(
    TimestampSchema,
    PartnerGroupRoleCreateInternal,
    UUIDSchema,
    PersistentDeletion,
):
    id: int


class PartnerGroupRoleUpdate(BaseModel):
    pass


class PartnerGroupRoleUpdateInternal(PartnerGroupRoleUpdate):
    updated_at: datetime


class PartnerGroupRoleDelete(BaseModel):
    is_deleted: bool
    deleted_at: datetime
