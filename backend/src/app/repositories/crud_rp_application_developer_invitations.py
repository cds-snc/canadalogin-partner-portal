from fastcrud import FastCRUD

from ..models.rp_application_developer_invitation import RPApplicationDeveloperInvitation
from ..schemas.workspace import (
    RPApplicationDeveloperInvitationCreateInternal,
    RPApplicationDeveloperInvitationRead,
    RPApplicationDeveloperInvitationUpdateInternal,
)

CRUDRPApplicationDeveloperInvitation = FastCRUD[
    RPApplicationDeveloperInvitation,
    RPApplicationDeveloperInvitationCreateInternal,
    RPApplicationDeveloperInvitationUpdateInternal,
    RPApplicationDeveloperInvitationUpdateInternal,
    RPApplicationDeveloperInvitationRead,
    RPApplicationDeveloperInvitationRead,
]

crud_rp_application_developer_invitations = CRUDRPApplicationDeveloperInvitation(
    RPApplicationDeveloperInvitation
)
