import uuid as uuid_pkg

from pydantic import BaseModel, ConfigDict, Field
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
