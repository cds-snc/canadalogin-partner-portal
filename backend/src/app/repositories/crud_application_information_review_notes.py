from fastcrud import FastCRUD

from ..models.application_information_review_note import ApplicationInformationReviewNote
from ..schemas.application_information import (
    ApplicationInformationReviewNoteCreateInternal,
    ApplicationInformationReviewNoteDelete,
    ApplicationInformationReviewNoteRecordRead,
    ApplicationInformationReviewNoteUpdate,
    ApplicationInformationReviewNoteUpdateInternal,
)

CRUDApplicationInformationReviewNote = FastCRUD[
    ApplicationInformationReviewNote,
    ApplicationInformationReviewNoteCreateInternal,
    ApplicationInformationReviewNoteUpdate,
    ApplicationInformationReviewNoteUpdateInternal,
    ApplicationInformationReviewNoteDelete,
    ApplicationInformationReviewNoteRecordRead,
]
crud_application_information_review_notes = CRUDApplicationInformationReviewNote(
    ApplicationInformationReviewNote
)
