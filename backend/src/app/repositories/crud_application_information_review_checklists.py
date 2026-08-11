from fastcrud import FastCRUD

from ..models.application_information_review_checklist import (
    ApplicationInformationReviewChecklist,
)
from ..schemas.application_information import (
    ApplicationInformationReviewChecklistSummaryCreateInternal,
    ApplicationInformationReviewChecklistSummaryDelete,
    ApplicationInformationReviewChecklistSummaryRecordRead,
    ApplicationInformationReviewChecklistSummaryUpdate,
    ApplicationInformationReviewChecklistSummaryUpdateInternal,
)

CRUDApplicationInformationReviewChecklist = FastCRUD[
    ApplicationInformationReviewChecklist,
    ApplicationInformationReviewChecklistSummaryCreateInternal,
    ApplicationInformationReviewChecklistSummaryUpdate,
    ApplicationInformationReviewChecklistSummaryUpdateInternal,
    ApplicationInformationReviewChecklistSummaryDelete,
    ApplicationInformationReviewChecklistSummaryRecordRead,
]
crud_application_information_review_checklists = CRUDApplicationInformationReviewChecklist(
    ApplicationInformationReviewChecklist
)