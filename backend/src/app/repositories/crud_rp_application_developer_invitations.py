from fastcrud import FastCRUD

from ..models.rp_application_developer_invitation import RPApplicationDeveloperInvitation
from ..schemas.rp_application_developer_invitation import (
    RPApplicationDeveloperInvitationCreateInternal,
    RPApplicationDeveloperInvitationDelete,
    RPApplicationDeveloperInvitationReadInternal,
    RPApplicationDeveloperInvitationUpdate,
    RPApplicationDeveloperInvitationUpdateInternal,
)

CRUDRPApplicationDeveloperInvitation = FastCRUD[
    RPApplicationDeveloperInvitation,
    RPApplicationDeveloperInvitationCreateInternal,
    RPApplicationDeveloperInvitationUpdate,
    RPApplicationDeveloperInvitationUpdateInternal,
    RPApplicationDeveloperInvitationDelete,
    RPApplicationDeveloperInvitationReadInternal,
]
crud_rp_application_developer_invitations = CRUDRPApplicationDeveloperInvitation(RPApplicationDeveloperInvitation)
