"""Exhaustive conformance tests for the immutable four-role permission matrix."""

from itertools import product

import pytest
from src.app.core.authorization import (
    CANONICAL_ROLE_CODES,
    ROLE_PERMISSION_MATRIX,
    CanonicalRoleCode,
    Capability,
    role_allows,
)

EXPECTED_CAPABILITIES: dict[CanonicalRoleCode, frozenset[Capability]] = {
    CanonicalRoleCode.CL_ADMIN: frozenset(
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
    ),
    CanonicalRoleCode.RP_ADMIN: frozenset(
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
    ),
    CanonicalRoleCode.RP_USER_EDIT: frozenset(
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
    ),
    CanonicalRoleCode.READ_ONLY: frozenset(
        {
            Capability.WORKSPACE_METADATA_READ,
            Capability.APPLICATION_INFORMATION_READ,
            Capability.RP_CONFIGURATION_READ,
            Capability.MAU_REPORT_READ,
        }
    ),
}


@pytest.mark.parametrize(
    ("role", "capability"),
    product(CanonicalRoleCode, Capability),
    ids=lambda value: value.value,
)
def test_every_role_capability_pair_matches_the_approved_matrix(
    role: CanonicalRoleCode,
    capability: Capability,
) -> None:
    """Exercise every allow and deny decision instead of representative samples."""

    assert role_allows(role, capability) is (capability in EXPECTED_CAPABILITIES[role])


def test_matrix_has_exactly_the_approved_roles_and_capabilities() -> None:
    """Catch extra roles or capabilities that bypass an explicit contract update."""

    assert set(CANONICAL_ROLE_CODES) == set(EXPECTED_CAPABILITIES)
    assert set(ROLE_PERMISSION_MATRIX) == set(EXPECTED_CAPABILITIES)
    for role, expected in EXPECTED_CAPABILITIES.items():
        assert ROLE_PERMISSION_MATRIX[role].allowed == expected
