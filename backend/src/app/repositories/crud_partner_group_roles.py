from fastcrud import FastCRUD

from ..models.partner_group_role import PartnerGroupRole
from ..schemas.partner_group_role import (
    PartnerGroupRoleCreateInternal,
    PartnerGroupRoleDelete,
    PartnerGroupRoleRead,
    PartnerGroupRoleUpdate,
    PartnerGroupRoleUpdateInternal,
)

CRUDPartnerGroupRole = FastCRUD[
    PartnerGroupRole,
    PartnerGroupRoleCreateInternal,
    PartnerGroupRoleUpdate,
    PartnerGroupRoleUpdateInternal,
    PartnerGroupRoleDelete,
    PartnerGroupRoleRead,
]
crud_partner_group_roles = CRUDPartnerGroupRole(PartnerGroupRole)
