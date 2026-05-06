from fastcrud import FastCRUD

from ..models.post_approval import PostApproval
from ..schemas.post_approval import (
    PostApprovalCreateInternal,
    PostApprovalDelete,
    PostApprovalRead,
    PostApprovalUpdate,
    PostApprovalUpdateInternal,
)

CRUDPostApproval = FastCRUD[
    PostApproval,
    PostApprovalCreateInternal,
    PostApprovalUpdate,
    PostApprovalUpdateInternal,
    PostApprovalDelete,
    PostApprovalRead,
]
crud_post_approvals = CRUDPostApproval(PostApproval)
