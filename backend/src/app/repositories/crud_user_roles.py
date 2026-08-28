from fastcrud import FastCRUD

from ..models.user_role import UserRole
from ..schemas.user_role import (
    UserRoleCreateInternal,
    UserRoleDelete,
    UserRoleRead,
    UserRoleUpdate,
    UserRoleUpdateInternal,
)

CRUDUserRole = FastCRUD[
    UserRole,
    UserRoleCreateInternal,
    UserRoleUpdate,
    UserRoleUpdateInternal,
    UserRoleDelete,
    UserRoleRead,
]
crud_user_roles = CRUDUserRole(UserRole)
