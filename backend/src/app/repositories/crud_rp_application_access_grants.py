from fastcrud import FastCRUD

from ..models.rp_application_access_grant import RPApplicationAccessGrant
from ..schemas.rp_application_access_grant import (
    RPApplicationAccessGrantCreateInternal,
    RPApplicationAccessGrantDelete,
    RPApplicationAccessGrantReadInternal,
    RPApplicationAccessGrantUpdate,
    RPApplicationAccessGrantUpdateInternal,
)

CRUDRPApplicationAccessGrant = FastCRUD[
    RPApplicationAccessGrant,
    RPApplicationAccessGrantCreateInternal,
    RPApplicationAccessGrantUpdate,
    RPApplicationAccessGrantUpdateInternal,
    RPApplicationAccessGrantDelete,
    RPApplicationAccessGrantReadInternal,
]
crud_rp_application_access_grants = CRUDRPApplicationAccessGrant(RPApplicationAccessGrant)
