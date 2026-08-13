from fastcrud import FastCRUD

from ..models.application_information_contact import ApplicationInformationContact
from ..schemas.application_information import (
    ApplicationInformationContactCreateInternal,
    ApplicationInformationContactDelete,
    ApplicationInformationContactRecordRead,
    ApplicationInformationContactUpdate,
    ApplicationInformationContactUpdateInternal,
)

CRUDApplicationInformationContact = FastCRUD[
    ApplicationInformationContact,
    ApplicationInformationContactCreateInternal,
    ApplicationInformationContactUpdate,
    ApplicationInformationContactUpdateInternal,
    ApplicationInformationContactDelete,
    ApplicationInformationContactRecordRead,
]
crud_application_information_contacts = CRUDApplicationInformationContact(ApplicationInformationContact)
