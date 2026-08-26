from __future__ import annotations

import json
from datetime import UTC, datetime, timedelta
from hashlib import sha256
from uuid import UUID

from src.app.core.authorization import CanonicalRoleCode
from src.app.core.local_persona_fixtures import (
    LOCAL_ALPHA_WORKSPACE,
    LOCAL_APPLICATION_CONTACT_FIXTURES,
    LOCAL_BETA_WORKSPACE,
    LOCAL_INVITATION_FIXTURES,
    LOCAL_MAU_END_DATE,
    LOCAL_MAU_FIXTURES,
    LOCAL_MAU_START_DATE,
    LOCAL_PENDING_INVITATION_EXPIRES_AT,
    LOCAL_PERSONA_FIXTURE_TIMESTAMP,
    LOCAL_PERSONA_FIXTURES,
    LOCAL_PERSONA_UUID_NAMESPACE,
    LOCAL_PRODUCTION_REVIEW_FIXTURES,
    LOCAL_RP_APPLICATION_FIXTURES,
    LOCAL_WORKSPACE_FIXTURES,
    get_local_persona_fixture,
    local_persona_responses,
    local_persona_uuid,
)
from src.app.schemas.mau import MAUCsvRow
from src.app.schemas.rp_application import (
    WorkspaceRPApplicationRegistrationAnswers,
)

EXPECTED_PERSONA_MATRIX = (
    (
        "local-cl-admin",
        "Local CL Admin",
        "local-cl-admin@local.example",
        CanonicalRoleCode.CL_ADMIN,
        (),
    ),
    (
        "local-rp-admin",
        "Local RP Admin",
        "local-rp-admin@local.example",
        None,
        ((LOCAL_ALPHA_WORKSPACE.uuid, CanonicalRoleCode.RP_ADMIN),),
    ),
    (
        "local-rp-user-edit",
        "Local RP User Edit",
        "local-rp-user-edit@local.example",
        None,
        ((LOCAL_ALPHA_WORKSPACE.uuid, CanonicalRoleCode.RP_USER_EDIT),),
    ),
    (
        "local-read-only",
        "Local Read Only",
        "local-read-only@local.example",
        None,
        ((LOCAL_ALPHA_WORKSPACE.uuid, CanonicalRoleCode.READ_ONLY),),
    ),
    (
        "local-no-access",
        "Local No Access",
        "local-no-access@local.example",
        None,
        (),
    ),
)


def test_local_persona_catalog_has_exact_response_compatible_matrix() -> None:
    assert len(LOCAL_PERSONA_FIXTURES) == 5
    assert (
        tuple(
            (
                fixture.fixture_id,
                fixture.name,
                fixture.email,
                fixture.global_role,
                tuple((access.workspace_uuid, access.role) for access in fixture.partner_access),
            )
            for fixture in LOCAL_PERSONA_FIXTURES
        )
        == EXPECTED_PERSONA_MATRIX
    )

    assert local_persona_responses() == (
        {
            "fixtureId": "local-cl-admin",
            "name": "Local CL Admin",
            "email": "local-cl-admin@local.example",
            "globalRole": "cl_admin",
            "partnerAccess": [],
        },
        {
            "fixtureId": "local-rp-admin",
            "name": "Local RP Admin",
            "email": "local-rp-admin@local.example",
            "globalRole": None,
            "partnerAccess": [
                {
                    "workspaceUuid": str(LOCAL_ALPHA_WORKSPACE.uuid),
                    "workspaceName": LOCAL_ALPHA_WORKSPACE.name,
                    "role": "rp_admin",
                }
            ],
        },
        {
            "fixtureId": "local-rp-user-edit",
            "name": "Local RP User Edit",
            "email": "local-rp-user-edit@local.example",
            "globalRole": None,
            "partnerAccess": [
                {
                    "workspaceUuid": str(LOCAL_ALPHA_WORKSPACE.uuid),
                    "workspaceName": LOCAL_ALPHA_WORKSPACE.name,
                    "role": "rp_user_edit",
                }
            ],
        },
        {
            "fixtureId": "local-read-only",
            "name": "Local Read Only",
            "email": "local-read-only@local.example",
            "globalRole": None,
            "partnerAccess": [
                {
                    "workspaceUuid": str(LOCAL_ALPHA_WORKSPACE.uuid),
                    "workspaceName": LOCAL_ALPHA_WORKSPACE.name,
                    "role": "read_only",
                }
            ],
        },
        {
            "fixtureId": "local-no-access",
            "name": "Local No Access",
            "email": "local-no-access@local.example",
            "globalRole": None,
            "partnerAccess": [],
        },
    )


def test_local_persona_catalog_uses_one_fixed_uuidv5_namespace() -> None:
    assert LOCAL_PERSONA_UUID_NAMESPACE == UUID("204fb450-dd86-55b5-9bc2-eb06b16e182c")
    all_uuids = [
        *(workspace.department.uuid for workspace in LOCAL_WORKSPACE_FIXTURES),
        *(workspace.uuid for workspace in LOCAL_WORKSPACE_FIXTURES),
        *(workspace.application_information.uuid for workspace in LOCAL_WORKSPACE_FIXTURES),
        *(application.uuid for workspace in LOCAL_WORKSPACE_FIXTURES for application in workspace.applications),
        *(contact.uuid for contact in LOCAL_APPLICATION_CONTACT_FIXTURES),
        *(invitation.uuid for invitation in LOCAL_INVITATION_FIXTURES),
        *(fixture.user_uuid for fixture in LOCAL_PERSONA_FIXTURES),
        *(fixture.global_assignment_uuid for fixture in LOCAL_PERSONA_FIXTURES if fixture.global_assignment_uuid is not None),
        *(access.grant_uuid for fixture in LOCAL_PERSONA_FIXTURES for access in fixture.partner_access),
    ]

    assert len(all_uuids) == len(set(all_uuids))
    assert all(value.version == 5 for value in all_uuids)
    assert local_persona_uuid("user", "local-cl-admin") == LOCAL_PERSONA_FIXTURES[0].user_uuid


def test_alpha_and_beta_are_fake_distinct_cross_scope_fixtures() -> None:
    assert LOCAL_WORKSPACE_FIXTURES == (
        LOCAL_ALPHA_WORKSPACE,
        LOCAL_BETA_WORKSPACE,
    )
    assert LOCAL_ALPHA_WORKSPACE.uuid != LOCAL_BETA_WORKSPACE.uuid
    assert LOCAL_ALPHA_WORKSPACE.department.uuid != LOCAL_BETA_WORKSPACE.department.uuid
    assert LOCAL_ALPHA_WORKSPACE.applications[0].uuid != LOCAL_BETA_WORKSPACE.applications[0].uuid
    assert {application.canada_login_environment for application in LOCAL_ALPHA_WORKSPACE.applications} == {
        "test",
        "staging",
        "production",
    }
    assert {application.canada_login_environment for application in LOCAL_BETA_WORKSPACE.applications} == {
        "test",
        "staging",
        "production",
    }
    assert all(access.workspace_uuid == LOCAL_ALPHA_WORKSPACE.uuid for fixture in LOCAL_PERSONA_FIXTURES for access in fixture.partner_access)
    assert all("local" in workspace.name.lower() for workspace in LOCAL_WORKSPACE_FIXTURES)


def test_alpha_walkthrough_catalog_has_bilingual_contacts_and_configuration_states() -> None:
    assert len(LOCAL_APPLICATION_CONTACT_FIXTURES) == 3
    assert all(
        contact.name_en and contact.name_fr and contact.responsibility_en and contact.responsibility_fr and contact.email.endswith("@local.example")
        for contact in LOCAL_APPLICATION_CONTACT_FIXTURES
    )
    assert all("synt" in contact.name_en.lower() for contact in LOCAL_APPLICATION_CONTACT_FIXTURES)

    alpha_applications = {application.key: application for application in LOCAL_ALPHA_WORKSPACE.applications}
    assert alpha_applications["alpha-test-draft"].registration_completed_at is None
    assert alpha_applications["alpha-test-draft"].registration_last_completed_step == "endpoints"
    assert all(
        alpha_applications[key].registration_completed_at is not None
        for key in (
            "alpha-test-complete",
            "alpha-staging-complete",
            "alpha-production-complete",
        )
    )
    assert alpha_applications["alpha-staging-complete"].source_application_key == "alpha-test-complete"
    assert alpha_applications["alpha-production-complete"].source_application_key == "alpha-staging-complete"
    for application in LOCAL_RP_APPLICATION_FIXTURES:
        payload = application.registration_payload(
            service_name_en="Synthetic service",
            service_name_fr="Service synthétique",
        )
        assert "client_secret" not in payload
        WorkspaceRPApplicationRegistrationAnswers.model_validate(payload)


def test_invitation_and_production_review_catalogs_cover_lifecycle_without_plaintext_tokens() -> None:
    assert {fixture.status for fixture in LOCAL_INVITATION_FIXTURES} == {
        "pending",
        "accepted",
        "expired",
        "revoked",
    }
    assert all(
        fixture.invited_email.endswith("@local.example") and len(fixture.token_hash) == 64 and "://" not in fixture.token_hash
        for fixture in LOCAL_INVITATION_FIXTURES
    )
    for fixture in LOCAL_INVITATION_FIXTURES:
        known_fixture_markers = {
            fixture.key,
            fixture.invited_email,
            str(fixture.uuid),
            f"canadalogin-partner-portal:invitation-fixture:{fixture.key}",
        }
        assert fixture.token_hash not in {sha256(marker.encode("utf-8")).hexdigest() for marker in known_fixture_markers}
    assert {fixture.status for fixture in LOCAL_PRODUCTION_REVIEW_FIXTURES} == {
        "pending",
        "approved",
    }
    assert all(fixture.external_reference.startswith("SYNTHETIC-") for fixture in LOCAL_PRODUCTION_REVIEW_FIXTURES)


def test_invitation_catalog_has_deterministic_temporally_stable_examples() -> None:
    assert LOCAL_PENDING_INVITATION_EXPIRES_AT == datetime(
        2099,
        12,
        31,
        23,
        59,
        59,
        tzinfo=UTC,
    )
    assert LOCAL_PENDING_INVITATION_EXPIRES_AT >= datetime(2099, 1, 1, tzinfo=UTC)
    assert tuple(
        (
            fixture.key,
            fixture.status,
            fixture.invite_expires_at.isoformat(),
        )
        for fixture in LOCAL_INVITATION_FIXTURES
    ) == (
        ("alpha-pending-edit", "pending", "2099-12-31T23:59:59+00:00"),
        ("alpha-accepted-read-only", "accepted", "2026-09-10T12:00:00+00:00"),
        ("alpha-expired-admin", "expired", "2026-08-04T12:00:00+00:00"),
        ("alpha-revoked-edit", "revoked", "2026-09-10T12:00:00+00:00"),
    )

    invitations_by_key = {fixture.key: fixture for fixture in LOCAL_INVITATION_FIXTURES}
    pending = invitations_by_key["alpha-pending-edit"]
    expired = invitations_by_key["alpha-expired-admin"]
    assert pending.created_at < pending.invite_expires_at
    assert expired.created_at < expired.invite_expires_at
    assert expired.invite_expires_at < LOCAL_PERSONA_FIXTURE_TIMESTAMP


def test_mau_catalog_has_three_completed_alpha_configurations_and_fixed_date_rows() -> None:
    assert LOCAL_MAU_START_DATE.isoformat() == "2026-08-18"
    assert LOCAL_MAU_END_DATE.isoformat() == "2026-08-24"
    assert len(LOCAL_MAU_FIXTURES) == 21
    assert {fixture.application_key for fixture in LOCAL_MAU_FIXTURES} == {
        "alpha-test-complete",
        "alpha-staging-complete",
        "alpha-production-complete",
    }
    expected_dates = {LOCAL_MAU_START_DATE + timedelta(days=day_index) for day_index in range(7)}
    assert LOCAL_MAU_END_DATE == LOCAL_MAU_START_DATE + timedelta(days=6)
    dates_by_application = {
        application_key: {fixture.record_date for fixture in LOCAL_MAU_FIXTURES if fixture.application_key == application_key}
        for application_key in {fixture.application_key for fixture in LOCAL_MAU_FIXTURES}
    }
    assert set(dates_by_application) == {
        "alpha-test-complete",
        "alpha-staging-complete",
        "alpha-production-complete",
    }
    assert all(record_dates == expected_dates for record_dates in dates_by_application.values())
    assert all(
        json.loads(fixture.to_cache_json())["date"] == fixture.record_date.isoformat()
        and MAUCsvRow.from_cache_json(fixture.to_cache_json()).date == fixture.record_date
        and fixture.successful_logins + fixture.failed_logins == fixture.total_logins
        for fixture in LOCAL_MAU_FIXTURES
    )


def test_fixture_lookup_is_an_exact_allowlist() -> None:
    assert get_local_persona_fixture("local-rp-admin") is LOCAL_PERSONA_FIXTURES[1]
    assert get_local_persona_fixture("LOCAL-RP-ADMIN") is None
    assert get_local_persona_fixture(" local-rp-admin ") is None
    assert get_local_persona_fixture("rp_admin") is None
