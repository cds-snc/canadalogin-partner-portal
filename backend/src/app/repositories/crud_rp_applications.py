from fastcrud import FastCRUD

from ..models.rp_application import RPApplication
from ..schemas.workspace import (
    RPApplicationCreateInternal,
    RPApplicationDelete,
    RPApplicationRead,
    RPApplicationUpdate,
    RPApplicationUpdateInternal,
)

CRUDRPApplication = FastCRUD[
    RPApplication,
    RPApplicationCreateInternal,
    RPApplicationUpdate,
    RPApplicationUpdateInternal,
    RPApplicationDelete,
    RPApplicationRead,
]
crud_rp_applications = CRUDRPApplication(RPApplication)
