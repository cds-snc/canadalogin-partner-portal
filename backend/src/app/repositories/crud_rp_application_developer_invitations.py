from fastcrud import FastCRUD

from ..models.rp_application_developer_invitation import RPApplicationDeveloperInvitation
from ..schemas.rp_application_developer_invitation import (
    RPApplicationDeveloperInvitationCreateInternal,
    RPApplicationDeveloperInvitationDelete,
    RPApplicationDeveloperInvitationRead,
    RPApplicationDeveloperInvitationUpdate,
    RPApplicationDeveloperInvitationUpdateInternal,
)

CRUDRPApplicationDeveloperInvitation = FastCRUD[
    RPApplicationDeveloperInvitation,
    RPApplicationDeveloperInvitationCreateInternal,
    RPApplicationDeveloperInvitationUpdate,
    RPApplicationDeveloperInvitationUpdateInternal,
    RPApplicationDeveloperInvitationDelete,
    RPApplicationDeveloperInvitationRead,
]
crud_rp_application_developer_invitations = CRUDRPApplicationDeveloperInvitation(RPApplicationDeveloperInvitation)
