"""Typed audit events for canonical authorization changes and decisions."""

from enum import StrEnum
from typing import Literal, TypeAlias
from uuid import UUID

from pydantic import AwareDatetime, Field, model_validator

from ..core.authorization import (
    AssignmentSource,
    CanonicalRoleCode,
    Capability,
    InvitationStatus,
    LifecycleStatus,
    PartnerRoleCode,
    ResourceScopeDecisionReason,
)
from .authorization import AuthorizationContractModel


class AuthorizationAuditResult(StrEnum):
    ALLOWED = "allowed"
    SUCCEEDED = "succeeded"
    DENIED = "denied"
    FAILED = "failed"


MutationAuditResult: TypeAlias = Literal[
    AuthorizationAuditResult.SUCCEEDED,
    AuthorizationAuditResult.DENIED,
    AuthorizationAuditResult.FAILED,
]
PrivilegedAccessAuditResult: TypeAlias = Literal[
    AuthorizationAuditResult.ALLOWED,
    AuthorizationAuditResult.DENIED,
]


class AuthorizationActorType(StrEnum):
    USER = "user"
    SYSTEM = "system"


class InvitationTransitionAction(StrEnum):
    CREATE = "create"
    ACCEPT = "accept"
    REVOKE = "revoke"
    REISSUE = "reissue"
    EXPIRE = "expire"


class AuthorizationAuditActor(AuthorizationContractModel):
    type: AuthorizationActorType
    user_uuid: UUID | None = None

    @model_validator(mode="after")
    def validate_actor_identifier(self) -> "AuthorizationAuditActor":
        if self.type is AuthorizationActorType.USER and self.user_uuid is None:
            raise ValueError("user audit actors require a user UUID")
        if self.type is AuthorizationActorType.SYSTEM and self.user_uuid is not None:
            raise ValueError("system audit actors cannot carry a user UUID")
        return self


class AuthorizationAuditEventBase(AuthorizationContractModel):
    event_version: Literal[1] = 1
    timestamp: AwareDatetime
    actor: AuthorizationAuditActor
    correlation_id: str | None = Field(default=None, min_length=1, max_length=128)
    reason_code: str | None = Field(
        default=None,
        min_length=1,
        max_length=128,
        pattern=r"^[a-z0-9][a-z0-9_.-]*$",
    )


class RoleAssignmentAuditEvent(AuthorizationAuditEventBase):
    event_name: Literal["authorization.role_assigned"] = "authorization.role_assigned"
    action: Literal["assign"] = "assign"
    result: MutationAuditResult
    assignment_uuid: UUID | None = None
    target_user_uuid: UUID
    role: CanonicalRoleCode
    workspace_uuid: UUID | None = None
    assignment_source: AssignmentSource
    previous_role: PartnerRoleCode | None = None

    @model_validator(mode="after")
    def validate_role_scope(self) -> "RoleAssignmentAuditEvent":
        _validate_role_workspace(self.role, self.workspace_uuid)
        if self.result is AuthorizationAuditResult.SUCCEEDED and self.assignment_uuid is None:
            raise ValueError("successful assignment events require an assignment UUID")
        if self.previous_role is not None and self.role is CanonicalRoleCode.CL_ADMIN:
            raise ValueError("global role assignment cannot replace a partner role")
        if self.previous_role == self.role:
            raise ValueError("previous role must differ from the assigned role")
        return self


class RoleRevocationAuditEvent(AuthorizationAuditEventBase):
    event_name: Literal["authorization.role_revoked"] = "authorization.role_revoked"
    action: Literal["revoke"] = "revoke"
    result: MutationAuditResult
    assignment_uuid: UUID
    target_user_uuid: UUID
    role: CanonicalRoleCode
    workspace_uuid: UUID | None = None

    @model_validator(mode="after")
    def validate_role_scope(self) -> "RoleRevocationAuditEvent":
        _validate_role_workspace(self.role, self.workspace_uuid)
        return self


class InvitationTransitionAuditEvent(AuthorizationAuditEventBase):
    event_name: Literal["authorization.invitation_transitioned"] = "authorization.invitation_transitioned"
    action: InvitationTransitionAction
    result: MutationAuditResult
    invitation_uuid: UUID
    workspace_uuid: UUID
    target_user_uuid: UUID | None = None
    role: PartnerRoleCode
    previous_status: InvitationStatus | None
    new_status: InvitationStatus
    replacement_invitation_uuid: UUID | None = None
    prior_invitation_uuid: UUID | None = None

    @model_validator(mode="after")
    def validate_transition(self) -> "InvitationTransitionAuditEvent":
        expected_states = {
            InvitationTransitionAction.CREATE: (
                None,
                LifecycleStatus.PENDING,
            ),
            InvitationTransitionAction.ACCEPT: (
                LifecycleStatus.PENDING,
                LifecycleStatus.ACCEPTED,
            ),
            InvitationTransitionAction.REVOKE: (
                LifecycleStatus.PENDING,
                LifecycleStatus.REVOKED,
            ),
            InvitationTransitionAction.EXPIRE: (
                LifecycleStatus.PENDING,
                LifecycleStatus.EXPIRED,
            ),
        }
        if self.action in expected_states:
            if (self.previous_status, self.new_status) != expected_states[self.action]:
                raise ValueError("invitation event action does not match its lifecycle transition")
            if self.replacement_invitation_uuid is not None or self.prior_invitation_uuid is not None:
                raise ValueError("non-reissue invitation events cannot carry reissue lineage")
        elif self.action is InvitationTransitionAction.REISSUE:
            revoking_prior = (
                self.previous_status is LifecycleStatus.PENDING
                and self.new_status is LifecycleStatus.REVOKED
                and self.replacement_invitation_uuid is not None
                and self.prior_invitation_uuid is None
            )
            creating_replacement = (
                self.previous_status is None
                and self.new_status is LifecycleStatus.PENDING
                and self.replacement_invitation_uuid is None
                and self.prior_invitation_uuid is not None
            )
            if not (revoking_prior or creating_replacement):
                raise ValueError("reissue events require one valid invitation lineage transition")
        if self.action is InvitationTransitionAction.ACCEPT and self.target_user_uuid is None:
            raise ValueError("accepted invitation events require a target user")
        return self


class InvitationTransitionAttemptAuditEvent(AuthorizationAuditEventBase):
    """A minimized denied or failed invitation lifecycle attempt."""

    event_name: Literal["authorization.invitation_transition_attempted"] = "authorization.invitation_transition_attempted"
    action: Literal[InvitationTransitionAction.ACCEPT] = InvitationTransitionAction.ACCEPT
    result: Literal[
        AuthorizationAuditResult.DENIED,
        AuthorizationAuditResult.FAILED,
    ]
    invitation_uuid: UUID
    workspace_uuid: UUID
    target_user_uuid: UUID | None = None
    role: PartnerRoleCode
    current_status: InvitationStatus


class PrivilegedResourceType(StrEnum):
    PLATFORM = "platform"
    WORKSPACE = "workspace"
    RP_APPLICATION = "rp_application"
    VERIFY = "verify"


class PrivilegedAccessAuditEvent(AuthorizationAuditEventBase):
    event_name: Literal["authorization.privileged_access_decided"] = "authorization.privileged_access_decided"
    action: Literal["authorize"] = "authorize"
    result: PrivilegedAccessAuditResult
    role: CanonicalRoleCode | None = None
    capability: Capability
    resource_type: PrivilegedResourceType
    resource_uuid: UUID | None = None
    workspace_uuid: UUID | None = None
    decision_reason: ResourceScopeDecisionReason

    @model_validator(mode="after")
    def validate_decision_context(self) -> "PrivilegedAccessAuditEvent":
        if self.result is AuthorizationAuditResult.ALLOWED and self.role is None:
            raise ValueError("allowed privileged access requires a canonical role")
        return self


AuthorizationAuditEvent: TypeAlias = (
    RoleAssignmentAuditEvent
    | RoleRevocationAuditEvent
    | InvitationTransitionAuditEvent
    | InvitationTransitionAttemptAuditEvent
    | PrivilegedAccessAuditEvent
)


def _validate_role_workspace(role: CanonicalRoleCode, workspace_uuid: UUID | None) -> None:
    if role is CanonicalRoleCode.CL_ADMIN and workspace_uuid is not None:
        raise ValueError("CL Admin audit events cannot carry a workspace scope")
    if role is not CanonicalRoleCode.CL_ADMIN and workspace_uuid is None:
        raise ValueError("partner role audit events require a workspace UUID")
