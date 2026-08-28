from __future__ import annotations

from uuid import UUID

from src.app.core.authorization import CanonicalRoleCode
from src.app.core.local_persona_fixtures import (
    LOCAL_ALPHA_WORKSPACE,
    LOCAL_BETA_WORKSPACE,
    LOCAL_PERSONA_FIXTURES,
    LOCAL_PERSONA_UUID_NAMESPACE,
    LOCAL_WORKSPACE_FIXTURES,
    get_local_persona_fixture,
    local_persona_responses,
    local_persona_uuid,
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
        *(application.uuid for workspace in LOCAL_WORKSPACE_FIXTURES for application in workspace.applications),
        *(fixture.user_uuid for fixture in LOCAL_PERSONA_FIXTURES),
        *(fixture.global_assignment_uuid for fixture in LOCAL_PERSONA_FIXTURES if fixture.global_assignment_uuid is not None),
        *(access.grant_uuid for fixture in LOCAL_PERSONA_FIXTURES for access in fixture.partner_access),
    ]

    assert len(all_uuids) == len(set(all_uuids))
    assert all(value.version == 5 for value in all_uuids)
    assert local_persona_uuid("user", "local-cl-admin") == all_uuids[6]


def test_alpha_and_beta_are_fake_distinct_cross_scope_fixtures() -> None:
    assert LOCAL_WORKSPACE_FIXTURES == (
        LOCAL_ALPHA_WORKSPACE,
        LOCAL_BETA_WORKSPACE,
    )
    assert LOCAL_ALPHA_WORKSPACE.uuid != LOCAL_BETA_WORKSPACE.uuid
    assert LOCAL_ALPHA_WORKSPACE.department.uuid != LOCAL_BETA_WORKSPACE.department.uuid
    assert LOCAL_ALPHA_WORKSPACE.applications[0].uuid != LOCAL_BETA_WORKSPACE.applications[0].uuid
    assert LOCAL_ALPHA_WORKSPACE.applications[0].canada_login_environment == "test"
    assert LOCAL_BETA_WORKSPACE.applications[0].canada_login_environment == "test"
    assert all(access.workspace_uuid == LOCAL_ALPHA_WORKSPACE.uuid for fixture in LOCAL_PERSONA_FIXTURES for access in fixture.partner_access)
    assert all("local" in workspace.name.lower() for workspace in LOCAL_WORKSPACE_FIXTURES)


def test_fixture_lookup_is_an_exact_allowlist() -> None:
    assert get_local_persona_fixture("local-rp-admin") is LOCAL_PERSONA_FIXTURES[1]
    assert get_local_persona_fixture("LOCAL-RP-ADMIN") is None
    assert get_local_persona_fixture(" local-rp-admin ") is None
    assert get_local_persona_fixture("rp_admin") is None
