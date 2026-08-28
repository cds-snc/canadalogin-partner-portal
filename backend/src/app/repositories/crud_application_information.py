from fastcrud import FastCRUD

from ..models.application_information import ApplicationInformation
from ..schemas.application_information import (
    ApplicationInformationCreateInternal,
    ApplicationInformationDelete,
    ApplicationInformationRead,
    ApplicationInformationUpdate,
    ApplicationInformationUpdateInternal,
)

CRUDApplicationInformation = FastCRUD[
    ApplicationInformation,
    ApplicationInformationCreateInternal,
    ApplicationInformationUpdate,
    ApplicationInformationUpdateInternal,
    ApplicationInformationDelete,
    ApplicationInformationRead,
]
crud_application_information = CRUDApplicationInformation(ApplicationInformation)
