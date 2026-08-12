from datetime import UTC, datetime

import pytest
from pydantic import ValidationError

from src.app.core.authorization import AssignmentSource, LifecycleStatus
from src.app.models.audit_log import AuditLog
from src.app.models.role import Role
from src.app.models.rp_application_access_grant import RPApplicationAccessGrant
from src.app.models.rp_application_developer_invitation import RPApplicationDeveloperInvitation
from src.app.models.user_role import UserRole
from src.app.schemas.user_role import UserRoleCreateInternal


def _constraint_names(model: type) -> set[str]:
    return {constraint.name for constraint in model.__table__.constraints if constraint.name is not None}


def _index_names(model: type) -> set[str]:
    return {index.name for index in model.__table__.indexes}


def test_user_role_model_has_normalized_assignment_integrity() -> None:
    assert {
        "uuid",
        "user_id",
        "role_id",
        "status",
        "assignment_source",
        "assigned_at",
        "assigned_by_user_id",
        "revoked_at",
        "revoked_by_user_id",
    }.issubset(UserRole.__table__.columns.keys())
    assert {
        "ck_user_role_status",
        "ck_user_role_assignment_source",
        "ck_user_role_admin_actor",
        "ck_user_role_lifecycle",
    }.issubset(_constraint_names(UserRole))
    assert "uq_user_role_active_user_role" in _index_names(UserRole)

    foreign_keys = {(foreign_key.parent.name, foreign_key.target_fullname): foreign_key.ondelete for foreign_key in UserRole.__table__.foreign_keys}
    assert foreign_keys[("user_id", "user.id")] == "RESTRICT"
    assert foreign_keys[("role_id", "role.id")] == "RESTRICT"
    assert foreign_keys[("assigned_by_user_id", "user.id")] == "RESTRICT"
    assert foreign_keys[("revoked_by_user_id", "user.id")] == "RESTRICT"


def test_role_code_is_nullable_during_expand_but_constrained_to_cl_admin() -> None:
    assert Role.__table__.columns["code"].nullable is True
    assert Role.__table__.columns["code"].unique is True
    assert "ck_role_canonical_code" in _constraint_names(Role)


def test_grant_and_invitation_keep_both_restricted_provenance_links() -> None:
    grant_source_fk = next(
        foreign_key for foreign_key in RPApplicationAccessGrant.__table__.foreign_keys if foreign_key.parent.name == "source_invitation_uuid"
    )
    delegation_fk = next(
        foreign_key for foreign_key in RPApplicationDeveloperInvitation.__table__.foreign_keys if foreign_key.parent.name == "delegated_by_grant_uuid"
    )
    revocation_actor_fk = next(
        foreign_key for foreign_key in RPApplicationDeveloperInvitation.__table__.foreign_keys if foreign_key.parent.name == "revoked_by_user_id"
    )

    assert grant_source_fk.target_fullname == "rp_application_developer_invitation.uuid"
    assert grant_source_fk.ondelete == "RESTRICT"
    assert delegation_fk.target_fullname == "rp_application_access_grant.uuid"
    assert delegation_fk.ondelete == "RESTRICT"
    assert revocation_actor_fk.target_fullname == "user.id"
    assert revocation_actor_fk.ondelete == "RESTRICT"
    assert "ix_rp_application_developer_invitation_revoked_by_user_id" in _index_names(RPApplicationDeveloperInvitation)
    assert "revocation_actor_source" in RPApplicationDeveloperInvitation.__table__.columns
    assert "uq_rp_access_grant_source_invitation" in _index_names(RPApplicationAccessGrant)
    assert "uq_rp_developer_invitation_pending_email_workspace" in _index_names(RPApplicationDeveloperInvitation)
    assert "ck_rp_access_grant_role" in _constraint_names(RPApplicationAccessGrant)
    assert "ck_rp_invitation_role" in _constraint_names(RPApplicationDeveloperInvitation)
    assert "ck_rp_invitation_revocation_actor" in _constraint_names(RPApplicationDeveloperInvitation)
    assert RPApplicationDeveloperInvitation.__table__.columns["workspace_id"].nullable is False
    assert RPApplicationDeveloperInvitation.__table__.columns["rp_application_id"].nullable is True
    assert "RP Admin" not in str(
        next(constraint.sqltext for constraint in RPApplicationAccessGrant.__table__.constraints if constraint.name == "ck_rp_access_grant_role")
    )


def test_user_role_schema_enforces_lifecycle_and_admin_actor() -> None:
    now = datetime.now(UTC)
    valid = UserRoleCreateInternal(
        user_id=1,
        role_id=2,
        status=LifecycleStatus.ACTIVE,
        assignment_source=AssignmentSource.MIGRATION,
        assigned_at=now,
    )
    assert valid.status is LifecycleStatus.ACTIVE

    with pytest.raises(ValidationError, match="admin assignments require an assigning actor"):
        UserRoleCreateInternal(
            user_id=1,
            role_id=2,
            status=LifecycleStatus.ACTIVE,
            assignment_source=AssignmentSource.ADMIN,
            assigned_at=now,
        )

    with pytest.raises(ValidationError, match="revoked assignments require revoked_at"):
        UserRoleCreateInternal(
            user_id=1,
            role_id=2,
            status=LifecycleStatus.REVOKED,
            assignment_source=AssignmentSource.MIGRATION,
            assigned_at=now,
        )


def test_user_role_repository_is_exported() -> None:
    from src.app.repositories import crud_user_roles

    assert crud_user_roles.model is UserRole


def test_audit_log_has_indexes_for_time_and_target_discovery() -> None:
    assert {
        "ix_audit_log_created_at",
        "ix_audit_log_target_uuid_created_at",
        "ix_audit_log_target_operation_created_at",
    }.issubset(_index_names(AuditLog))
