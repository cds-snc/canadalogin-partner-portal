from fastcrud import FastCRUD

from ..models.rp_application_promotion_request import RPApplicationPromotionRequest
from ..schemas.rp_application_promotion_request import (
    RPApplicationPromotionRequestCreateInternal,
    RPApplicationPromotionRequestDelete,
    RPApplicationPromotionRequestRead,
    RPApplicationPromotionRequestUpdate,
    RPApplicationPromotionRequestUpdateInternal,
)

CRUDRPApplicationPromotionRequest = FastCRUD[
    RPApplicationPromotionRequest,
    RPApplicationPromotionRequestCreateInternal,
    RPApplicationPromotionRequestUpdate,
    RPApplicationPromotionRequestUpdateInternal,
    RPApplicationPromotionRequestDelete,
    RPApplicationPromotionRequestRead,
]
crud_rp_application_promotion_requests = CRUDRPApplicationPromotionRequest(
    RPApplicationPromotionRequest
)