from fastcrud import FastCRUD

from ..models.rp_application_access_grant import RPApplicationAccessGrant
from ..schemas.rp_application_access_grant import (
    RPApplicationAccessGrantCreateInternal,
    RPApplicationAccessGrantDelete,
    RPApplicationAccessGrantRead,
    RPApplicationAccessGrantUpdate,
    RPApplicationAccessGrantUpdateInternal,
)

CRUDRPApplicationAccessGrant = FastCRUD[
    RPApplicationAccessGrant,
    RPApplicationAccessGrantCreateInternal,
    RPApplicationAccessGrantUpdate,
    RPApplicationAccessGrantUpdateInternal,
    RPApplicationAccessGrantDelete,
    RPApplicationAccessGrantRead,
]
crud_rp_application_access_grants = CRUDRPApplicationAccessGrant(RPApplicationAccessGrant)
