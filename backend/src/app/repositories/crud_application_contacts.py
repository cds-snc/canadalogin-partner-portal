from fastcrud import FastCRUD

from ..models.application_contact import ApplicationContact
from ..schemas.application_info import (
    ApplicationContactCreateInternal,
    ApplicationContactDelete,
    ApplicationContactRead,
    ApplicationContactUpdate,
    ApplicationContactUpdateInternal,
)

CRUDApplicationContact = FastCRUD[
    ApplicationContact,
    ApplicationContactCreateInternal,
    ApplicationContactUpdate,
    ApplicationContactUpdateInternal,
    ApplicationContactDelete,
    ApplicationContactRead,
]
crud_application_contacts = CRUDApplicationContact(ApplicationContact)
