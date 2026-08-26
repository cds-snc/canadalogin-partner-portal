import json
from dataclasses import FrozenInstanceError
from datetime import UTC, datetime
from uuid import UUID

import pytest
from pydantic import ValidationError
from src.app.core.authorization import (
    CANONICAL_ROLE_CODES,
    CANONICAL_ROLE_DEFINITIONS,
    PARTNER_ROLE_CODES,
    ROLE_PERMISSION_MATRIX,
    CanonicalResourceScopeDecisionPoint,
    CanonicalRoleCode,
    Capability,
    EffectiveRoleScope,
    LifecycleStatus,
    ResourceScopeDecisionReason,
    ResourceScopeRequest,
    RoleScope,
    role_allows,
)
from src.app.schemas.authorization import (
    AuthenticatedAuthorizationContextRead,
    AuthorizationContextRead,
    PartnerAuthorizationScopeRead,
)
from src.app.schemas.authorization_audit import (
    AuthorizationActorType,
    AuthorizationAuditActor,
    AuthorizationAuditResult,
    InvitationTransitionAction,
    InvitationTransitionAuditEvent,
    PrivilegedAccessAuditEvent,
    PrivilegedResourceType,
    RoleAssignmentAuditEvent,
    RoleRevocationAuditEvent,
)
from src.app.schemas.rp_application import AccessibleRPApplicationRead, RPApplicationRead
from src.app.schemas.user import AuthenticatedUserRead

WORKSPACE_ALPHA_UUID = UUID("11111111-1111-4111-8111-111111111111")
WORKSPACE_BETA_UUID = UUID("22222222-2222-4222-8222-222222222222")
USER_UUID = UUID("33333333-3333-4333-8333-333333333333")
ACTOR_UUID = UUID("44444444-4444-4444-8444-444444444444")
ASSIGNMENT_UUID = UUID("55555555-5555-4555-8555-555555555555")
INVITATION_UUID = UUID("66666666-6666-4666-8666-666666666666")
RP_APPLICATION_UUID = UUID("77777777-7777-4777-8777-777777777777")
NOW = datetime(2026, 8, 11, 14, 0, tzinfo=UTC)


class TestCanonicalAuthorizationVocabulary:
    def test_role_codes_and_lifecycle_values_are_closed(self):
        assert {role.value for role in CANONICAL_ROLE_CODES} == {
            "cl_admin",
            "rp_admin",
            "rp_user_edit",
            "read_only",
        }
        assert PARTNER_ROLE_CODES == {
            CanonicalRoleCode.RP_ADMIN,
            CanonicalRoleCode.RP_USER_EDIT,
            CanonicalRoleCode.READ_ONLY,
        }
        assert {status.value for status in LifecycleStatus} == {
            "active",
            "revoked",
            "pending",
            "accepted",
            "expired",
        }

    def test_role_code_identity_and_scope_definitions_are_immutable(self):
        assert CANONICAL_ROLE_DEFINITIONS[CanonicalRoleCode.CL_ADMIN].scope is RoleScope.GLOBAL
        assert all(CANONICAL_ROLE_DEFINITIONS[role].scope is RoleScope.WORKSPACE for role in PARTNER_ROLE_CODES)

        with pytest.raises(TypeError):
            CANONICAL_ROLE_DEFINITIONS[CanonicalRoleCode.CL_ADMIN] = CANONICAL_ROLE_DEFINITIONS[CanonicalRoleCode.CL_ADMIN]  # type: ignore[index]
        with pytest.raises(FrozenInstanceError):
            CANONICAL_ROLE_DEFINITIONS[CanonicalRoleCode.CL_ADMIN].scope = RoleScope.WORKSPACE  # type: ignore[misc]


class TestPermissionMatrix:
    def test_matrix_is_role_only_and_default_deny(self):
        assert set(ROLE_PERMISSION_MATRIX) == set(CANONICAL_ROLE_CODES)
        assert all(isinstance(role, CanonicalRoleCode) for role in ROLE_PERMISSION_MATRIX)

        with pytest.raises(TypeError):
            ROLE_PERMISSION_MATRIX[CanonicalRoleCode.CL_ADMIN] = ROLE_PERMISSION_MATRIX[CanonicalRoleCode.CL_ADMIN]  # type: ignore[index]

        assert role_allows(CanonicalRoleCode.CL_ADMIN, Capability.ACCESS_ADMINISTRATION)
        assert not role_allows(
            CanonicalRoleCode.CL_ADMIN,
            Capability.APPLICATION_INFORMATION_READ,
        )
        assert not role_allows(
            CanonicalRoleCode.CL_ADMIN,
            Capability.RP_CONFIGURATION_READ,
        )
        assert not role_allows(CanonicalRoleCode.CL_ADMIN, Capability.PARTNER_SECRET_READ)
        assert not role_allows(CanonicalRoleCode.CL_ADMIN, Capability.PARTNER_SECRET_LIFECYCLE)

        assert role_allows(CanonicalRoleCode.RP_ADMIN, Capability.PARTNER_INVITATION_MANAGE)
        assert role_allows(CanonicalRoleCode.RP_ADMIN, Capability.PARTNER_STAFF_ASSIGNMENT)
        assert not role_allows(CanonicalRoleCode.RP_ADMIN, Capability.RP_ADMIN_ASSIGNMENT)

        assert role_allows(CanonicalRoleCode.RP_USER_EDIT, Capability.RP_CONFIGURATION_WRITE)
        assert not role_allows(CanonicalRoleCode.RP_USER_EDIT, Capability.PARTNER_INVITATION_MANAGE)

        assert role_allows(CanonicalRoleCode.READ_ONLY, Capability.MAU_REPORT_READ)
        assert not role_allows(CanonicalRoleCode.READ_ONLY, Capability.RP_CONFIGURATION_WRITE)
        assert not role_allows(CanonicalRoleCode.READ_ONLY, Capability.APPLICATION_INFORMATION_WRITE)


class TestResourceScopeDecisionPoint:
    def test_global_role_still_requires_an_allowed_capability(self):
        decision_point = CanonicalResourceScopeDecisionPoint()
        cl_admin = (EffectiveRoleScope(CanonicalRoleCode.CL_ADMIN),)

        allowed = decision_point.decide(
            ResourceScopeRequest(
                role_scopes=cl_admin,
                capability=Capability.CROSS_WORKSPACE_METADATA_READ,
                resource_workspace_uuid=WORKSPACE_BETA_UUID,
            )
        )
        secret_denied = decision_point.decide(
            ResourceScopeRequest(
                role_scopes=cl_admin,
                capability=Capability.PARTNER_SECRET_READ,
                resource_workspace_uuid=WORKSPACE_ALPHA_UUID,
            )
        )

        assert allowed.allowed is True
        assert allowed.reason is ResourceScopeDecisionReason.ALLOWED_GLOBAL
        assert secret_denied.allowed is False
        assert secret_denied.reason is ResourceScopeDecisionReason.CAPABILITY_NOT_ALLOWED

    def test_partner_capability_is_bound_to_the_matching_workspace(self):
        decision_point = CanonicalResourceScopeDecisionPoint()
        assignments = (
            EffectiveRoleScope(CanonicalRoleCode.RP_USER_EDIT, WORKSPACE_ALPHA_UUID),
            EffectiveRoleScope(CanonicalRoleCode.READ_ONLY, WORKSPACE_BETA_UUID),
        )

        alpha_write = decision_point.decide(
            ResourceScopeRequest(
                role_scopes=assignments,
                capability=Capability.RP_CONFIGURATION_WRITE,
                resource_workspace_uuid=WORKSPACE_ALPHA_UUID,
            )
        )
        beta_write = decision_point.decide(
            ResourceScopeRequest(
                role_scopes=assignments,
                capability=Capability.RP_CONFIGURATION_WRITE,
                resource_workspace_uuid=WORKSPACE_BETA_UUID,
            )
        )

        assert alpha_write.allowed is True
        assert alpha_write.role is CanonicalRoleCode.RP_USER_EDIT
        assert beta_write.allowed is False
        assert beta_write.reason is ResourceScopeDecisionReason.WORKSPACE_SCOPE_MISMATCH

    def test_mixed_or_duplicate_assignments_fail_closed(self):
        decision_point = CanonicalResourceScopeDecisionPoint()
        mixed = decision_point.decide(
            ResourceScopeRequest(
                role_scopes=(
                    EffectiveRoleScope(CanonicalRoleCode.CL_ADMIN),
                    EffectiveRoleScope(CanonicalRoleCode.READ_ONLY, WORKSPACE_ALPHA_UUID),
                ),
                capability=Capability.MAU_REPORT_READ,
                resource_workspace_uuid=WORKSPACE_ALPHA_UUID,
            )
        )
        duplicate = decision_point.decide(
            ResourceScopeRequest(
                role_scopes=(
                    EffectiveRoleScope(CanonicalRoleCode.RP_ADMIN, WORKSPACE_ALPHA_UUID),
                    EffectiveRoleScope(CanonicalRoleCode.READ_ONLY, WORKSPACE_ALPHA_UUID),
                ),
                capability=Capability.MAU_REPORT_READ,
                resource_workspace_uuid=WORKSPACE_ALPHA_UUID,
            )
        )

        assert mixed.reason is ResourceScopeDecisionReason.CONFLICTING_ASSIGNMENTS
        assert duplicate.reason is ResourceScopeDecisionReason.CONFLICTING_ASSIGNMENTS


class TestAuthorizationApiContracts:
    def test_authenticated_context_uses_canonical_camel_case_wire_fields(self):
        response = AuthenticatedAuthorizationContextRead(
            authorization_context=AuthorizationContextRead(
                partner_access=(
                    PartnerAuthorizationScopeRead(
                        workspace_uuid=WORKSPACE_ALPHA_UUID,
                        role=CanonicalRoleCode.RP_USER_EDIT,
                    ),
                )
            )
        )

        assert response.model_dump(mode="json") == {
            "authorizationContext": {
                "globalRole": None,
                "partnerAccess": [
                    {
                        "workspaceUuid": str(WORKSPACE_ALPHA_UUID),
                        "role": "rp_user_edit",
                    }
                ],
            }
        }

    def test_authorization_context_rejects_mixed_and_duplicate_scope(self):
        scope = PartnerAuthorizationScopeRead(
            workspace_uuid=WORKSPACE_ALPHA_UUID,
            role=CanonicalRoleCode.RP_ADMIN,
        )
        with pytest.raises(ValidationError, match="cannot be combined"):
            AuthorizationContextRead(
                global_role=CanonicalRoleCode.CL_ADMIN,
                partner_access=(scope,),
            )
        with pytest.raises(ValidationError, match="one role per workspace"):
            AuthorizationContextRead(partner_access=(scope, scope))

    def test_target_user_and_rp_application_contracts_exclude_legacy_internal_fields(self):
        context = AuthorizationContextRead(global_role=CanonicalRoleCode.CL_ADMIN)
        user = AuthenticatedUserRead(
            uuid=USER_UUID,
            name="Test User",
            email="user@example.gc.ca",
            username="user@example.gc.ca",
            authorization_context=context,
        )
        application = AccessibleRPApplicationRead(
            uuid=RP_APPLICATION_UUID,
            dnr_app_name="Example RP",
            workspace_uuid=WORKSPACE_ALPHA_UUID,
            role=CanonicalRoleCode.READ_ONLY,
        )

        user_payload = user.model_dump(mode="json")
        application_payload = application.model_dump(mode="json")
        assert user_payload["authorizationContext"]["globalRole"] == "cl_admin"
        assert application_payload["workspaceUuid"] == str(WORKSPACE_ALPHA_UUID)
        assert application_payload["role"] == "read_only"

        legacy_or_internal_fields = {
            "id",
            "roleIds",
            "roleUuids",
            "isSuperuser",
            "hasPartnerAccessGrant",
            "workspaceId",
            "departmentId",
            "authSubject",
        }
        assert legacy_or_internal_fields.isdisjoint(user_payload)
        assert legacy_or_internal_fields.isdisjoint(application_payload)

    def test_openapi_schemas_use_wire_names_and_canonical_role_values(self):
        user_schema = AuthenticatedUserRead.model_json_schema(by_alias=True)
        application_schema = AccessibleRPApplicationRead.model_json_schema(by_alias=True)
        serialized_schema = json.dumps({"user": user_schema, "application": application_schema})

        assert "authorizationContext" in user_schema["properties"]
        assert "workspaceUuid" in application_schema["properties"]
        assert '"cl_admin"' in serialized_schema
        assert '"rp_admin"' in serialized_schema
        assert '"rp_user_edit"' in serialized_schema
        assert '"read_only"' in serialized_schema
        assert "isSuperuser" not in serialized_schema

    def test_public_rp_application_contracts_exclude_retired_owner_snapshots(self):
        accessible_schema = AccessibleRPApplicationRead.model_json_schema(by_alias=True)
        workspace_schema = RPApplicationRead.model_json_schema(by_alias=True)

        assert "applicationOwner" not in accessible_schema["properties"]
        assert "ibmSvApplicationId" not in accessible_schema["properties"]
        assert "applicationOwner" not in workspace_schema["properties"]


class TestAuthorizationAuditContracts:
    @staticmethod
    def actor() -> AuthorizationAuditActor:
        return AuthorizationAuditActor(type=AuthorizationActorType.USER, user_uuid=ACTOR_UUID)

    def test_assignment_and_revocation_events_capture_minimum_identifiers(self):
        assignment = RoleAssignmentAuditEvent(
            timestamp=NOW,
            actor=self.actor(),
            correlation_id="request-123",
            result=AuthorizationAuditResult.SUCCEEDED,
            assignment_uuid=ASSIGNMENT_UUID,
            target_user_uuid=USER_UUID,
            role=CanonicalRoleCode.RP_ADMIN,
            workspace_uuid=WORKSPACE_ALPHA_UUID,
            assignment_source="admin",
        )
        revocation = RoleRevocationAuditEvent(
            timestamp=NOW,
            actor=self.actor(),
            result=AuthorizationAuditResult.SUCCEEDED,
            assignment_uuid=ASSIGNMENT_UUID,
            target_user_uuid=USER_UUID,
            role=CanonicalRoleCode.RP_ADMIN,
            workspace_uuid=WORKSPACE_ALPHA_UUID,
        )

        assert assignment.model_dump(mode="json")["eventName"] == "authorization.role_assigned"
        assert revocation.model_dump(mode="json")["eventName"] == "authorization.role_revoked"

    def test_invitation_events_accept_only_action_consistent_canonical_transitions(self):
        accepted = InvitationTransitionAuditEvent(
            timestamp=NOW,
            actor=self.actor(),
            action=InvitationTransitionAction.ACCEPT,
            result=AuthorizationAuditResult.SUCCEEDED,
            invitation_uuid=INVITATION_UUID,
            workspace_uuid=WORKSPACE_ALPHA_UUID,
            target_user_uuid=USER_UUID,
            role=CanonicalRoleCode.RP_USER_EDIT,
            previous_status=LifecycleStatus.PENDING,
            new_status=LifecycleStatus.ACCEPTED,
        )
        assert accepted.model_dump(mode="json")["newStatus"] == "accepted"

        created = InvitationTransitionAuditEvent(
            timestamp=NOW,
            actor=self.actor(),
            action=InvitationTransitionAction.CREATE,
            result=AuthorizationAuditResult.SUCCEEDED,
            invitation_uuid=INVITATION_UUID,
            workspace_uuid=WORKSPACE_ALPHA_UUID,
            role=CanonicalRoleCode.READ_ONLY,
            previous_status=None,
            new_status=LifecycleStatus.PENDING,
        )
        reissued = InvitationTransitionAuditEvent(
            timestamp=NOW,
            actor=self.actor(),
            action=InvitationTransitionAction.REISSUE,
            result=AuthorizationAuditResult.SUCCEEDED,
            invitation_uuid=INVITATION_UUID,
            workspace_uuid=WORKSPACE_ALPHA_UUID,
            role=CanonicalRoleCode.READ_ONLY,
            previous_status=None,
            new_status=LifecycleStatus.PENDING,
            prior_invitation_uuid=ASSIGNMENT_UUID,
        )
        assert created.model_dump(mode="json")["action"] == "create"
        assert reissued.model_dump(mode="json")["priorInvitationUuid"] == str(ASSIGNMENT_UUID)

        with pytest.raises(ValidationError, match="action does not match"):
            InvitationTransitionAuditEvent(
                timestamp=NOW,
                actor=self.actor(),
                action=InvitationTransitionAction.ACCEPT,
                result=AuthorizationAuditResult.SUCCEEDED,
                invitation_uuid=INVITATION_UUID,
                workspace_uuid=WORKSPACE_ALPHA_UUID,
                role=CanonicalRoleCode.RP_USER_EDIT,
                previous_status=LifecycleStatus.EXPIRED,
                new_status=LifecycleStatus.PENDING,
            )

    def test_privileged_access_event_records_decision_without_freeform_payload(self):
        event = PrivilegedAccessAuditEvent(
            timestamp=NOW,
            actor=self.actor(),
            result=AuthorizationAuditResult.DENIED,
            role=CanonicalRoleCode.CL_ADMIN,
            capability=Capability.PARTNER_SECRET_READ,
            resource_type=PrivilegedResourceType.VERIFY,
            resource_uuid=RP_APPLICATION_UUID,
            decision_reason=ResourceScopeDecisionReason.CAPABILITY_NOT_ALLOWED,
            reason_code="secret_boundary",
        )
        payload = event.model_dump(mode="json")

        assert payload["result"] == "denied"
        assert "verifyOperation" not in payload
        assert {"email", "token", "secret", "claims", "metadata"}.isdisjoint(payload)

        with pytest.raises(ValidationError, match="Extra inputs are not permitted"):
            RoleRevocationAuditEvent(
                timestamp=NOW,
                actor=self.actor(),
                result=AuthorizationAuditResult.DENIED,
                assignment_uuid=ASSIGNMENT_UUID,
                target_user_uuid=USER_UUID,
                role=CanonicalRoleCode.CL_ADMIN,
                token="must-not-be-recorded",  # type: ignore[call-arg]
            )
