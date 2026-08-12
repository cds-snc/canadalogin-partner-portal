"""Safe API DTOs for canonical authorization context and resource scope."""

from datetime import datetime
from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel, ConfigDict, model_validator
from pydantic.alias_generators import to_camel

from ..core.authorization import CanonicalRoleCode, GlobalRoleCode, PartnerRoleCode


class AuthorizationContractModel(BaseModel):
    """Base for immutable camelCase authorization wire contracts."""

    model_config = ConfigDict(
        extra="forbid",
        frozen=True,
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
        serialize_by_alias=True,
    )


class PartnerAuthorizationScopeRead(AuthorizationContractModel):
    workspace_uuid: UUID
    role: PartnerRoleCode


class AuthorizationContextRead(AuthorizationContractModel):
    """Safe effective-access context returned to an authenticated client."""

    global_role: GlobalRoleCode | None = None
    partner_access: tuple[PartnerAuthorizationScopeRead, ...] = ()

    @model_validator(mode="after")
    def validate_assignment_invariants(self) -> "AuthorizationContextRead":
        if self.global_role is not None and self.partner_access:
            raise ValueError("CL Admin and partner access cannot be combined")

        workspace_uuids = [access.workspace_uuid for access in self.partner_access]
        if len(workspace_uuids) != len(set(workspace_uuids)):
            raise ValueError("partner access must contain at most one role per workspace")
        return self


class AuthenticatedAuthorizationContextRead(AuthorizationContractModel):
    """Composable current-user response fragment with its canonical wire key."""

    authorization_context: AuthorizationContextRead


class AccessibleRPApplicationAuthorizationRead(AuthorizationContractModel):
    """Role and public workspace scope attached to a grant-accessible RP app."""

    workspace_uuid: UUID
    role: PartnerRoleCode


class ClAdminRoleAssignmentCreate(AuthorizationContractModel):
    """Public target for a canonical CL Admin assignment."""

    user_uuid: UUID


class ClAdminAssignmentEligibilityReason(StrEnum):
    """Stable reason codes for the server-owned CL Admin eligibility decision."""

    ELIGIBLE = "eligible"
    ALREADY_CL_ADMIN = "already_cl_admin"
    ACTIVE_PARTNER_ACCESS = "active_partner_access"
    INACTIVE_USER = "inactive_user"


class ClAdminAssignmentEligibilityRead(AuthorizationContractModel):
    """Current eligibility for assigning the global CL Admin role to one user."""

    user_uuid: UUID
    eligible: bool
    reason: ClAdminAssignmentEligibilityReason


class PartnerRoleAssignmentCreate(AuthorizationContractModel):
    """Public target and fixed partner role for a workspace assignment."""

    user_uuid: UUID
    role: PartnerRoleCode


class PartnerRoleAssignmentUpdate(AuthorizationContractModel):
    """Atomic replacement role for an existing workspace assignment."""

    role: PartnerRoleCode


class RoleAssignmentRead(AuthorizationContractModel):
    """Public-safe canonical assignment projection."""

    assignment_uuid: UUID
    user_uuid: UUID
    user_name: str
    user_email: str
    role: CanonicalRoleCode
    workspace_uuid: UUID | None
    assigned_at: datetime


class RoleAssignmentCandidateRead(AuthorizationContractModel):
    """Minimal eligible-user projection for assignment search."""

    uuid: UUID
    name: str
    email: str


class RoleAssignmentMutationMessage(AuthorizationContractModel):
    """Stable message response for successful assignment revocation."""

    message: str


__all__ = [
    "AuthenticatedAuthorizationContextRead",
    "AuthorizationContextRead",
    "AuthorizationContractModel",
    "CanonicalRoleCode",
    "ClAdminAssignmentEligibilityRead",
    "ClAdminAssignmentEligibilityReason",
    "ClAdminRoleAssignmentCreate",
    "AccessibleRPApplicationAuthorizationRead",
    "PartnerRoleAssignmentCreate",
    "PartnerRoleAssignmentUpdate",
    "PartnerAuthorizationScopeRead",
    "RoleAssignmentCandidateRead",
    "RoleAssignmentMutationMessage",
    "RoleAssignmentRead",
]
