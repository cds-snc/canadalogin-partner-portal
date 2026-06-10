from fastcrud import FastCRUD

from ..models.workspace import Workspace
from ..schemas.workspace import (
    WorkspaceCreateInternal,
    WorkspaceDelete,
    WorkspaceRead,
    WorkspaceUpdate,
    WorkspaceUpdateInternal,
)

CRUDWorkspace = FastCRUD[
    Workspace,
    WorkspaceCreateInternal,
    WorkspaceUpdate,
    WorkspaceUpdateInternal,
    WorkspaceDelete,
    WorkspaceRead,
]
crud_workspaces = CRUDWorkspace(Workspace)
