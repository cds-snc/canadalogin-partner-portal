"""Deterministic, fake local-persona catalog for role-path verification.

The catalog contains no runtime enablement decision and grants no authority by
itself. The guarded seed service persists these records, while the later local
session adapter may expose only the response-safe allowlist below.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from types import MappingProxyType
from typing import Final
from uuid import UUID, uuid5

from .authorization import CanonicalRoleCode

LOCAL_PERSONA_UUID_NAMESPACE: Final = UUID("204fb450-dd86-55b5-9bc2-eb06b16e182c")
LOCAL_PERSONA_FIXTURE_TIMESTAMP: Final = datetime(2026, 8, 11, 12, 0, tzinfo=UTC)
LOCAL_PERSONA_AUTH_PROVIDER: Final = "local_dev"
LOCAL_PERSONA_PROFILE_IMAGE_URL: Final = "https://example.test/assets/local-persona.svg"


def local_persona_uuid(record_type: str, fixture_key: str) -> UUID:
    """Derive a stable UUIDv5 within the one recorded local-fixture namespace."""

    if not record_type or not fixture_key:
        raise ValueError("record_type and fixture_key are required")
    return uuid5(
        LOCAL_PERSONA_UUID_NAMESPACE,
        f"canadalogin-partner-portal:{record_type}:{fixture_key}",
    )


@dataclass(frozen=True, slots=True)
class LocalDepartmentFixture:
    key: str
    uuid: UUID
    name: str
    name_fr: str
    abbreviation: str
    abbreviation_fr: str


@dataclass(frozen=True, slots=True)
class LocalRPApplicationFixture:
    key: str
    uuid: UUID
    name: str
    partner_environment: str
    canada_login_environment: str

    @property
    def configuration_name(self) -> str:
        """Match the stable label assigned to legacy local fixtures by 0028."""

        return f"{self.name} [{str(self.uuid)[:8]}]"


@dataclass(frozen=True, slots=True)
class LocalApplicationInformationFixture:
    key: str
    uuid: UUID
    service_name_en: str
    service_name_fr: str
    overview: str = "Fake local-only Application used for role-path verification."
    technology_and_protocol: str = "OIDC"
    security_and_privacy: str = "Local fake data only."
    usage: str = "Local role-path verification."
    migration_or_transition_plan: str = "No migration required for local fixtures."


@dataclass(frozen=True, slots=True)
class LocalWorkspaceFixture:
    key: str
    uuid: UUID
    name: str
    slug: str
    description: str
    department: LocalDepartmentFixture
    application_information: LocalApplicationInformationFixture
    applications: tuple[LocalRPApplicationFixture, ...]


@dataclass(frozen=True, slots=True)
class LocalPersonaPartnerAccess:
    workspace_key: str
    workspace_uuid: UUID
    workspace_name: str
    role: CanonicalRoleCode
    grant_uuid: UUID

    def to_response(self) -> dict[str, str]:
        return {
            "workspaceUuid": str(self.workspace_uuid),
            "workspaceName": self.workspace_name,
            "role": self.role.value,
        }


@dataclass(frozen=True, slots=True)
class LocalPersonaFixture:
    fixture_id: str
    name: str
    email: str
    user_uuid: UUID
    global_role: CanonicalRoleCode | None = None
    global_assignment_uuid: UUID | None = None
    partner_access: tuple[LocalPersonaPartnerAccess, ...] = ()

    def to_response(self) -> dict[str, object]:
        """Return the safe shape consumed by the later dev-session endpoint."""

        return {
            "fixtureId": self.fixture_id,
            "name": self.name,
            "email": self.email,
            "globalRole": self.global_role.value if self.global_role else None,
            "partnerAccess": [access.to_response() for access in self.partner_access],
        }


LOCAL_ALPHA_DEPARTMENT: Final = LocalDepartmentFixture(
    key="alpha",
    uuid=local_persona_uuid("department", "alpha"),
    name="Local Partner Alpha Department",
    name_fr="Ministère partenaire local Alpha",
    abbreviation="LPA",
    abbreviation_fr="MPLA",
)
LOCAL_BETA_DEPARTMENT: Final = LocalDepartmentFixture(
    key="beta",
    uuid=local_persona_uuid("department", "beta"),
    name="Local Partner Beta Department",
    name_fr="Ministère partenaire local Bêta",
    abbreviation="LPB",
    abbreviation_fr="MPLB",
)

LOCAL_ALPHA_WORKSPACE: Final = LocalWorkspaceFixture(
    key="alpha",
    uuid=local_persona_uuid("workspace", "alpha"),
    name="Local Partner Workspace Alpha",
    slug="local-partner-alpha",
    description="Fake local-only partner workspace used for allowed-scope verification.",
    department=LOCAL_ALPHA_DEPARTMENT,
    application_information=LocalApplicationInformationFixture(
        key="alpha",
        uuid=local_persona_uuid("application-information", "alpha"),
        service_name_en="Local Alpha Application",
        service_name_fr="Application locale Alpha",
    ),
    applications=(
        LocalRPApplicationFixture(
            key="alpha-primary",
            uuid=local_persona_uuid("rp-application", "alpha-primary"),
            name="Local Alpha Test RP Application",
            partner_environment="Local Alpha QA",
            canada_login_environment="test",
        ),
    ),
)
LOCAL_BETA_WORKSPACE: Final = LocalWorkspaceFixture(
    key="beta",
    uuid=local_persona_uuid("workspace", "beta"),
    name="Local Partner Workspace Beta",
    slug="local-partner-beta",
    description="Fake local-only partner workspace used for cross-scope denial verification.",
    department=LOCAL_BETA_DEPARTMENT,
    application_information=LocalApplicationInformationFixture(
        key="beta",
        uuid=local_persona_uuid("application-information", "beta"),
        service_name_en="Local Beta Application",
        service_name_fr="Application locale Bêta",
    ),
    applications=(
        LocalRPApplicationFixture(
            key="beta-primary",
            uuid=local_persona_uuid("rp-application", "beta-primary"),
            name="Local Beta Test RP Application",
            partner_environment="Local Beta QA",
            canada_login_environment="test",
        ),
    ),
)

LOCAL_WORKSPACE_FIXTURES: Final = (
    LOCAL_ALPHA_WORKSPACE,
    LOCAL_BETA_WORKSPACE,
)


def _alpha_access(
    fixture_id: str,
    role: CanonicalRoleCode,
) -> tuple[LocalPersonaPartnerAccess, ...]:
    return (
        LocalPersonaPartnerAccess(
            workspace_key=LOCAL_ALPHA_WORKSPACE.key,
            workspace_uuid=LOCAL_ALPHA_WORKSPACE.uuid,
            workspace_name=LOCAL_ALPHA_WORKSPACE.name,
            role=role,
            grant_uuid=local_persona_uuid("partner-grant", fixture_id),
        ),
    )


LOCAL_PERSONA_FIXTURES: Final = (
    LocalPersonaFixture(
        fixture_id="local-cl-admin",
        name="Local CL Admin",
        email="local-cl-admin@local.example",
        user_uuid=local_persona_uuid("user", "local-cl-admin"),
        global_role=CanonicalRoleCode.CL_ADMIN,
        global_assignment_uuid=local_persona_uuid(
            "user-role",
            "local-cl-admin:cl_admin",
        ),
    ),
    LocalPersonaFixture(
        fixture_id="local-rp-admin",
        name="Local RP Admin",
        email="local-rp-admin@local.example",
        user_uuid=local_persona_uuid("user", "local-rp-admin"),
        partner_access=_alpha_access(
            "local-rp-admin",
            CanonicalRoleCode.RP_ADMIN,
        ),
    ),
    LocalPersonaFixture(
        fixture_id="local-rp-user-edit",
        name="Local RP User Edit",
        email="local-rp-user-edit@local.example",
        user_uuid=local_persona_uuid("user", "local-rp-user-edit"),
        partner_access=_alpha_access(
            "local-rp-user-edit",
            CanonicalRoleCode.RP_USER_EDIT,
        ),
    ),
    LocalPersonaFixture(
        fixture_id="local-read-only",
        name="Local Read Only",
        email="local-read-only@local.example",
        user_uuid=local_persona_uuid("user", "local-read-only"),
        partner_access=_alpha_access(
            "local-read-only",
            CanonicalRoleCode.READ_ONLY,
        ),
    ),
    LocalPersonaFixture(
        fixture_id="local-no-access",
        name="Local No Access",
        email="local-no-access@local.example",
        user_uuid=local_persona_uuid("user", "local-no-access"),
    ),
)

LOCAL_PERSONAS_BY_ID: Final = MappingProxyType({fixture.fixture_id: fixture for fixture in LOCAL_PERSONA_FIXTURES})
LOCAL_WORKSPACES_BY_KEY: Final = MappingProxyType({fixture.key: fixture for fixture in LOCAL_WORKSPACE_FIXTURES})


def get_local_persona_fixture(fixture_id: str) -> LocalPersonaFixture | None:
    """Resolve an exact allowlisted ID without normalization or role input."""

    return LOCAL_PERSONAS_BY_ID.get(fixture_id)


def local_persona_responses() -> tuple[dict[str, object], ...]:
    return tuple(fixture.to_response() for fixture in LOCAL_PERSONA_FIXTURES)


__all__ = [
    "LOCAL_ALPHA_WORKSPACE",
    "LOCAL_BETA_WORKSPACE",
    "LOCAL_PERSONA_AUTH_PROVIDER",
    "LOCAL_PERSONA_FIXTURE_TIMESTAMP",
    "LOCAL_PERSONA_FIXTURES",
    "LOCAL_PERSONA_PROFILE_IMAGE_URL",
    "LOCAL_PERSONA_UUID_NAMESPACE",
    "LOCAL_PERSONAS_BY_ID",
    "LOCAL_WORKSPACE_FIXTURES",
    "LOCAL_WORKSPACES_BY_KEY",
    "LocalApplicationInformationFixture",
    "LocalDepartmentFixture",
    "LocalPersonaFixture",
    "LocalPersonaPartnerAccess",
    "LocalRPApplicationFixture",
    "LocalWorkspaceFixture",
    "get_local_persona_fixture",
    "local_persona_responses",
    "local_persona_uuid",
]
