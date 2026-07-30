from fastcrud import FastCRUD

from ..models.workspace_member import WorkspaceMember
from ..schemas.workspace_member import (
    WorkspaceMemberCreateInternal,
    WorkspaceMemberDelete,
    WorkspaceMemberRead,
    WorkspaceMemberUpdate,
    WorkspaceMemberUpdateInternal,
)

CRUDWorkspaceMember = FastCRUD[
    WorkspaceMember,
    WorkspaceMemberCreateInternal,
    WorkspaceMemberUpdate,
    WorkspaceMemberUpdateInternal,
    WorkspaceMemberDelete,
    WorkspaceMemberRead,
]
crud_workspace_members = CRUDWorkspaceMember(WorkspaceMember)