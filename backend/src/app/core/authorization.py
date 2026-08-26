"""Immutable canonical authorization vocabulary and policy contracts.

This module defines the server-owned policy for the four-role authorization
model.  It intentionally contains no database, session, Casbin, or IBM Verify
adapter wiring; later slices can adopt these contracts without making role or
permission data client-mutable.
"""

from collections.abc import Mapping
from dataclasses import dataclass
from enum import StrEnum
from types import MappingProxyType
from typing import Literal, Protocol, TypeAlias
from uuid import UUID

CL_ADMIN_ROLE_UUID = UUID("03caa6a0-9095-5e62-9cf6-7a0f0f73c49b")


class CanonicalRoleCode(StrEnum):
    """Stable machine identity for every supported product role."""

    CL_ADMIN = "cl_admin"
    RP_ADMIN = "rp_admin"
    RP_USER_EDIT = "rp_user_edit"
    READ_ONLY = "read_only"


GlobalRoleCode: TypeAlias = Literal[CanonicalRoleCode.CL_ADMIN]
PartnerRoleCode: TypeAlias = Literal[
    CanonicalRoleCode.RP_ADMIN,
    CanonicalRoleCode.RP_USER_EDIT,
    CanonicalRoleCode.READ_ONLY,
]


class RoleScope(StrEnum):
    GLOBAL = "global"
    WORKSPACE = "workspace"


@dataclass(frozen=True, slots=True)
class CanonicalRoleDefinition:
    """Immutable reference identity; display labels belong to UI content."""

    code: CanonicalRoleCode
    scope: RoleScope


CANONICAL_ROLE_DEFINITIONS: Mapping[CanonicalRoleCode, CanonicalRoleDefinition] = MappingProxyType(
    {
        CanonicalRoleCode.CL_ADMIN: CanonicalRoleDefinition(
            code=CanonicalRoleCode.CL_ADMIN,
            scope=RoleScope.GLOBAL,
        ),
        CanonicalRoleCode.RP_ADMIN: CanonicalRoleDefinition(
            code=CanonicalRoleCode.RP_ADMIN,
            scope=RoleScope.WORKSPACE,
        ),
        CanonicalRoleCode.RP_USER_EDIT: CanonicalRoleDefinition(
            code=CanonicalRoleCode.RP_USER_EDIT,
            scope=RoleScope.WORKSPACE,
        ),
        CanonicalRoleCode.READ_ONLY: CanonicalRoleDefinition(
            code=CanonicalRoleCode.READ_ONLY,
            scope=RoleScope.WORKSPACE,
        ),
    }
)
CANONICAL_ROLE_CODES = frozenset(CANONICAL_ROLE_DEFINITIONS)
PARTNER_ROLE_CODES = frozenset(
    {
        CanonicalRoleCode.RP_ADMIN,
        CanonicalRoleCode.RP_USER_EDIT,
        CanonicalRoleCode.READ_ONLY,
    }
)


class LifecycleStatus(StrEnum):
    """Shared closed vocabulary for assignment, grant, and invitation state."""

    ACTIVE = "active"
    REVOKED = "revoked"
    PENDING = "pending"
    ACCEPTED = "accepted"
    EXPIRED = "expired"


AssignmentStatus: TypeAlias = Literal[
    LifecycleStatus.ACTIVE,
    LifecycleStatus.REVOKED,
]
GrantStatus: TypeAlias = AssignmentStatus
InvitationStatus: TypeAlias = Literal[
    LifecycleStatus.PENDING,
    LifecycleStatus.ACCEPTED,
    LifecycleStatus.EXPIRED,
    LifecycleStatus.REVOKED,
]


class AssignmentSource(StrEnum):
    MIGRATION = "migration"
    BOOTSTRAP = "bootstrap"
    ADMIN = "admin"
    LOCAL_FIXTURE = "local_fixture"


class RevocationActorSource(StrEnum):
    """Provenance marker for persisted revocations with or without an actor."""

    USER = "user"
    LEGACY_UNKNOWN = "legacy_unknown"


class Capability(StrEnum):
    """Application-owned capability keys; anything absent is denied."""

    ACCESS_ADMINISTRATION = "access_administration"
    PARTNER_BOOTSTRAP = "partner_bootstrap"
    CL_ADMIN_ASSIGNMENT = "cl_admin_assignment"
    RP_ADMIN_ASSIGNMENT = "rp_admin_assignment"
    PARTNER_STAFF_ASSIGNMENT = "partner_staff_assignment"
    CROSS_WORKSPACE_METADATA_READ = "cross_workspace_metadata_read"
    ONBOARDING_OVERSIGHT_READ = "onboarding_oversight_read"
    PRODUCTION_REVIEW = "production_review"
    WORKSPACE_METADATA_READ = "workspace_metadata_read"
    WORKSPACE_METADATA_WRITE = "workspace_metadata_write"
    APPLICATION_INFORMATION_READ = "application_information_read"
    APPLICATION_INFORMATION_WRITE = "application_information_write"
    RP_CONFIGURATION_READ = "rp_configuration_read"
    RP_CONFIGURATION_WRITE = "rp_configuration_write"
    PARTNER_SECRET_READ = "partner_secret_read"
    PARTNER_SECRET_LIFECYCLE = "partner_secret_lifecycle"
    PRODUCTION_REVIEW_REQUEST_WRITE = "production_review_request_write"
    MAU_REPORT_READ = "mau_report_read"
    PARTNER_INVITATION_MANAGE = "partner_invitation_manage"


@dataclass(frozen=True, slots=True)
class RolePermissionSet:
    allowed: frozenset[Capability]

    def allows(self, capability: Capability) -> bool:
        return capability in self.allowed

    @property
    def denied(self) -> frozenset[Capability]:
        return frozenset(Capability).difference(self.allowed)


ROLE_PERMISSION_MATRIX: Mapping[CanonicalRoleCode, RolePermissionSet] = MappingProxyType(
    {
        CanonicalRoleCode.CL_ADMIN: RolePermissionSet(
            allowed=frozenset(
                {
                    Capability.ACCESS_ADMINISTRATION,
                    Capability.PARTNER_BOOTSTRAP,
                    Capability.CL_ADMIN_ASSIGNMENT,
                    Capability.RP_ADMIN_ASSIGNMENT,
                    Capability.PARTNER_STAFF_ASSIGNMENT,
                    Capability.CROSS_WORKSPACE_METADATA_READ,
                    Capability.ONBOARDING_OVERSIGHT_READ,
                    Capability.PRODUCTION_REVIEW,
                }
            )
        ),
        CanonicalRoleCode.RP_ADMIN: RolePermissionSet(
            allowed=frozenset(
                {
                    Capability.WORKSPACE_METADATA_READ,
                    Capability.WORKSPACE_METADATA_WRITE,
                    Capability.APPLICATION_INFORMATION_READ,
                    Capability.APPLICATION_INFORMATION_WRITE,
                    Capability.RP_CONFIGURATION_READ,
                    Capability.RP_CONFIGURATION_WRITE,
                    Capability.PARTNER_SECRET_READ,
                    Capability.PARTNER_SECRET_LIFECYCLE,
                    Capability.PRODUCTION_REVIEW_REQUEST_WRITE,
                    Capability.MAU_REPORT_READ,
                    Capability.PARTNER_INVITATION_MANAGE,
                    Capability.PARTNER_STAFF_ASSIGNMENT,
                }
            )
        ),
        CanonicalRoleCode.RP_USER_EDIT: RolePermissionSet(
            allowed=frozenset(
                {
                    Capability.WORKSPACE_METADATA_READ,
                    Capability.APPLICATION_INFORMATION_READ,
                    Capability.APPLICATION_INFORMATION_WRITE,
                    Capability.RP_CONFIGURATION_READ,
                    Capability.RP_CONFIGURATION_WRITE,
                    Capability.PARTNER_SECRET_READ,
                    Capability.PARTNER_SECRET_LIFECYCLE,
                    Capability.PRODUCTION_REVIEW_REQUEST_WRITE,
                    Capability.MAU_REPORT_READ,
                }
            )
        ),
        CanonicalRoleCode.READ_ONLY: RolePermissionSet(
            allowed=frozenset(
                {
                    Capability.WORKSPACE_METADATA_READ,
                    Capability.APPLICATION_INFORMATION_READ,
                    Capability.RP_CONFIGURATION_READ,
                    Capability.MAU_REPORT_READ,
                }
            )
        ),
    }
)


def role_allows(role: CanonicalRoleCode, capability: Capability) -> bool:
    """Return the immutable matrix decision; unknown values fail at parsing."""

    return ROLE_PERMISSION_MATRIX[role].allows(capability)


@dataclass(frozen=True, slots=True)
class EffectiveRoleScope:
    role: CanonicalRoleCode
    workspace_uuid: UUID | None = None

    def __post_init__(self) -> None:
        expected_scope = CANONICAL_ROLE_DEFINITIONS[self.role].scope
        if expected_scope is RoleScope.GLOBAL and self.workspace_uuid is not None:
            raise ValueError("global roles cannot carry a workspace scope")
        if expected_scope is RoleScope.WORKSPACE and self.workspace_uuid is None:
            raise ValueError("partner roles require a workspace scope")


@dataclass(frozen=True, slots=True)
class ResourceScopeRequest:
    role_scopes: tuple[EffectiveRoleScope, ...]
    capability: Capability
    resource_workspace_uuid: UUID | None = None


class ResourceScopeDecisionReason(StrEnum):
    ALLOWED_GLOBAL = "allowed_global"
    ALLOWED_WORKSPACE = "allowed_workspace"
    NO_ACTIVE_ASSIGNMENT = "no_active_assignment"
    CONFLICTING_ASSIGNMENTS = "conflicting_assignments"
    CAPABILITY_NOT_ALLOWED = "capability_not_allowed"
    WORKSPACE_SCOPE_REQUIRED = "workspace_scope_required"
    WORKSPACE_SCOPE_MISMATCH = "workspace_scope_mismatch"


@dataclass(frozen=True, slots=True)
class ResourceScopeDecision:
    allowed: bool
    reason: ResourceScopeDecisionReason
    role: CanonicalRoleCode | None = None
    workspace_uuid: UUID | None = None


class ResourceScopeDecisionPoint(Protocol):
    """Application boundary used before protected resource access."""

    def decide(self, request: ResourceScopeRequest) -> ResourceScopeDecision: ...


class CanonicalResourceScopeDecisionPoint:
    """Pure fail-closed implementation of the canonical role/scope contract."""

    def decide(self, request: ResourceScopeRequest) -> ResourceScopeDecision:
        role_scopes = request.role_scopes
        if not role_scopes:
            return ResourceScopeDecision(
                allowed=False,
                reason=ResourceScopeDecisionReason.NO_ACTIVE_ASSIGNMENT,
            )

        global_scopes = [item for item in role_scopes if item.role is CanonicalRoleCode.CL_ADMIN]
        partner_scopes = [item for item in role_scopes if item.role in PARTNER_ROLE_CODES]
        workspace_uuids = [item.workspace_uuid for item in partner_scopes]
        if (global_scopes and partner_scopes) or len(global_scopes) > 1 or len(workspace_uuids) != len(set(workspace_uuids)):
            return ResourceScopeDecision(
                allowed=False,
                reason=ResourceScopeDecisionReason.CONFLICTING_ASSIGNMENTS,
            )

        capable_scopes = [item for item in role_scopes if role_allows(item.role, request.capability)]
        if not capable_scopes:
            return ResourceScopeDecision(
                allowed=False,
                reason=ResourceScopeDecisionReason.CAPABILITY_NOT_ALLOWED,
            )

        if global_scopes:
            scope = global_scopes[0]
            return ResourceScopeDecision(
                allowed=True,
                reason=ResourceScopeDecisionReason.ALLOWED_GLOBAL,
                role=scope.role,
            )

        if request.resource_workspace_uuid is None:
            return ResourceScopeDecision(
                allowed=False,
                reason=ResourceScopeDecisionReason.WORKSPACE_SCOPE_REQUIRED,
            )

        for scope in capable_scopes:
            if scope.workspace_uuid == request.resource_workspace_uuid:
                return ResourceScopeDecision(
                    allowed=True,
                    reason=ResourceScopeDecisionReason.ALLOWED_WORKSPACE,
                    role=scope.role,
                    workspace_uuid=scope.workspace_uuid,
                )

        return ResourceScopeDecision(
            allowed=False,
            reason=ResourceScopeDecisionReason.WORKSPACE_SCOPE_MISMATCH,
        )
