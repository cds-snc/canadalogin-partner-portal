from fastcrud import FastCRUD

from ..models.access_policy import AccessPolicy
from ..schemas.access_policy import AccessPolicyCreate, AccessPolicyOut, AccessPolicyUpdate

CRUDAccessPolicy = FastCRUD[
    AccessPolicy,
    AccessPolicyCreate,
    AccessPolicyUpdate,
    AccessPolicyUpdate,
    AccessPolicyUpdate,
    AccessPolicyOut,
]
crud_access_policies = CRUDAccessPolicy(AccessPolicy)
