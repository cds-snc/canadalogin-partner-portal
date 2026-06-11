from fastcrud import FastCRUD

from ..models.application_info import ApplicationInfo
from ..schemas.application_info import (
    ApplicationInfoCreateInternal,
    ApplicationInfoDelete,
    ApplicationInfoRead,
    ApplicationInfoUpdate,
    ApplicationInfoUpdateInternal,
)

CRUDApplicationInfo = FastCRUD[
    ApplicationInfo,
    ApplicationInfoCreateInternal,
    ApplicationInfoUpdate,
    ApplicationInfoUpdateInternal,
    ApplicationInfoDelete,
    ApplicationInfoRead,
]
crud_application_infos = CRUDApplicationInfo(ApplicationInfo)
