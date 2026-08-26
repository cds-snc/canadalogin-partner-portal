"""Deterministic, fake local-persona catalog for role-path verification.

The catalog contains no runtime enablement decision and grants no authority by
itself. The guarded seed service persists these records, while the later local
session adapter may expose only the response-safe allowlist below.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import UTC, date, datetime, timedelta
from types import MappingProxyType
from typing import Final
from uuid import UUID, uuid5

from .authorization import CanonicalRoleCode

LOCAL_PERSONA_UUID_NAMESPACE: Final = UUID("204fb450-dd86-55b5-9bc2-eb06b16e182c")
LOCAL_PERSONA_FIXTURE_TIMESTAMP: Final = datetime(2026, 8, 11, 12, 0, tzinfo=UTC)
LOCAL_PERSONA_AUTH_PROVIDER: Final = "local_dev"
LOCAL_PERSONA_PROFILE_IMAGE_URL: Final = "https://assets.local.example/local-persona.svg"
LOCAL_MAU_START_DATE: Final = date(2026, 8, 18)
LOCAL_MAU_END_DATE: Final = date(2026, 8, 24)
LOCAL_PENDING_INVITATION_EXPIRES_AT: Final = datetime(
    2099,
    12,
    31,
    23,
    59,
    59,
    tzinfo=UTC,
)


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
    configuration_name: str
    partner_environment: str
    canada_login_environment: str
    source_application_key: str | None = None
    registration_draft_version: int = 1
    registration_last_completed_step: str | None = None
    registration_completed_at: datetime | None = None

    def registration_payload(
        self,
        *,
        service_name_en: str,
        service_name_fr: str,
    ) -> dict[str, object]:
        """Return a secret-free local OIDC registration snapshot."""

        hostname = f"{self.key}.apps.local.example"
        payload: dict[str, object] = {
            "canada_login_environment": self.canada_login_environment,
            "service_name_en": service_name_en,
            "service_name_fr": service_name_fr,
        }
        if self.registration_last_completed_step in {
            "endpoints",
            "client-and-access",
            "signing",
            "encryption",
        }:
            payload.update(
                {
                    "application_environment_url_en": f"https://{hostname}/en",
                    "application_environment_url_fr": f"https://{hostname}/fr",
                    "redirect_uris": [f"https://{hostname}/oidc/callback"],
                    "post_logout_redirect_uris": [f"https://{hostname}/signed-out"],
                    "logout_mode": "front_channel",
                    "logout_uri": f"https://{hostname}/oidc/logout",
                }
            )
        if self.registration_last_completed_step in {
            "client-and-access",
            "signing",
            "encryption",
        }:
            payload.update(
                {
                    "client_type": "confidential",
                    "supports_authorization_code_flow": True,
                    "client_auth_method": "private_key_jwt",
                    "private_key_distribution_method": "jwks_uri",
                    "jwks_uri": f"https://{hostname}/.well-known/jwks.json",
                    "requested_scopes": ["openid", "profile", "email", "language"],
                    "sector_identifier": f"https://{hostname}/sector-identifier.json",
                    "shares_pairwise_identifiers": False,
                    "pkce_supported": True,
                    "pkce_algorithms": ["S256"],
                }
            )
        if self.registration_last_completed_step in {"signing", "encryption"}:
            payload.update(
                {
                    "request_signing_supported": True,
                    "request_signing_targets": ["request_object", "token_endpoint"],
                    "request_signing_algorithms": ["PS256"],
                    "signature_validation_supported": True,
                    "signature_validation_targets": ["id_token", "userinfo"],
                    "signature_validation_algorithms": ["PS256"],
                }
            )
        if self.registration_last_completed_step == "encryption":
            payload.update(
                {
                    "request_encryption_supported": True,
                    "request_encryption_targets": ["request_object"],
                    "request_encryption_key_management_algorithms": ["RSA-OAEP-256"],
                    "request_encryption_content_algorithms": ["A256GCM"],
                    "message_decryption_supported": True,
                    "message_decryption_targets": ["id_token", "userinfo"],
                    "message_decryption_key_management_algorithms": ["RSA-OAEP-256"],
                    "message_decryption_content_algorithms": ["A256GCM"],
                }
            )
        return payload


@dataclass(frozen=True, slots=True)
class LocalApplicationContactFixture:
    key: str
    uuid: UUID
    name_en: str
    name_fr: str
    responsibility_en: str
    responsibility_fr: str
    email: str
    first_name: str
    last_name: str
    phone_number: str
    alternate_phone_number: str | None = None
    identity_confirmed_at: datetime | None = None


@dataclass(frozen=True, slots=True)
class LocalInvitationFixture:
    key: str
    uuid: UUID
    workspace_key: str
    rp_application_key: str | None
    invited_email: str
    token_hash: str
    invite_expires_at: datetime
    role: CanonicalRoleCode
    status: str
    created_at: datetime
    accepted_at: datetime | None = None
    revoked_at: datetime | None = None
    revoked_by_fixture_id: str | None = None
    revocation_actor_source: str | None = None
    revocation_reason: str | None = None
    replaced_by_invitation_key: str | None = None

    @property
    def replaced_by_invitation_uuid(self) -> UUID | None:
        if self.replaced_by_invitation_key is None:
            return None
        return local_persona_uuid(
            "developer-invitation",
            self.replaced_by_invitation_key,
        )


@dataclass(frozen=True, slots=True)
class LocalProductionReviewFixture:
    application_key: str
    status: str
    external_reference: str
    requested_at: datetime
    reviewed_at: datetime | None = None
    decided_at: datetime | None = None
    reviewed_by_team: str | None = None


@dataclass(frozen=True, slots=True)
class LocalMAURecordFixture:
    application_key: str
    application_name: str
    record_date: date
    total_logins: int
    unique_users: int
    failed_logins: int
    successful_logins: int
    mtd_unique_users: int

    @property
    def cache_key(self) -> str:
        return f"mau:{self.application_name}"

    @property
    def cache_field(self) -> str:
        return self.record_date.isoformat()

    def to_cache_json(self) -> str:
        return json.dumps(
            {
                "application_name": self.application_name,
                "date": self.record_date.isoformat(),
                "failed_logins": self.failed_logins,
                "mtd_unique_users": self.mtd_unique_users,
                "successful_logins": self.successful_logins,
                "total_logins": self.total_logins,
                "unique_users": self.unique_users,
            },
            separators=(",", ":"),
            sort_keys=True,
        )


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
    contacts: tuple[LocalApplicationContactFixture, ...] = ()


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
        service_name_en="Alpha benefits finder",
        service_name_fr="Outil de recherche des prestations Alpha",
        overview="Synthetic bilingual benefits-finder service for local designer walkthroughs.",
        security_and_privacy="Synthetic local-only records; no real personal information or credentials.",
        usage="Representative partner configuration and usage-report walkthroughs.",
        contacts=(
            LocalApplicationContactFixture(
                key="alpha-program",
                uuid=local_persona_uuid("application-contact", "alpha-program"),
                name_en="Avery Example (synthetic)",
                name_fr="Avery Exemple (synthétique)",
                responsibility_en="Program and service owner",
                responsibility_fr="Responsable du programme et du service",
                email="alpha.program@local.example",
                first_name="Avery",
                last_name="Example",
                phone_number="+1 613-555-0101",
                identity_confirmed_at=LOCAL_PERSONA_FIXTURE_TIMESTAMP + timedelta(days=1),
            ),
            LocalApplicationContactFixture(
                key="alpha-technical",
                uuid=local_persona_uuid("application-contact", "alpha-technical"),
                name_en="Morgan Example (synthetic)",
                name_fr="Morgan Exemple (synthétique)",
                responsibility_en="Technical integration lead",
                responsibility_fr="Responsable de l'intégration technique",
                email="alpha.technical@local.example",
                first_name="Morgan",
                last_name="Example",
                phone_number="+1 613-555-0102",
                alternate_phone_number="+1 613-555-0192",
                identity_confirmed_at=LOCAL_PERSONA_FIXTURE_TIMESTAMP + timedelta(days=1, hours=1),
            ),
            LocalApplicationContactFixture(
                key="alpha-security",
                uuid=local_persona_uuid("application-contact", "alpha-security"),
                name_en="Riley Example (synthetic)",
                name_fr="Riley Exemple (synthétique)",
                responsibility_en="Security and privacy contact",
                responsibility_fr="Personne-ressource pour la sécurité et la protection des renseignements personnels",
                email="alpha.security@local.example",
                first_name="Riley",
                last_name="Example",
                phone_number="+1 613-555-0103",
            ),
        ),
    ),
    applications=(
        LocalRPApplicationFixture(
            key="alpha-test-complete",
            uuid=local_persona_uuid("rp-application", "alpha-test-complete"),
            name="Alpha benefits finder - Test completed",
            configuration_name="Test - completed registration",
            partner_environment="Alpha integration",
            canada_login_environment="test",
            registration_draft_version=5,
            registration_last_completed_step="encryption",
            registration_completed_at=LOCAL_PERSONA_FIXTURE_TIMESTAMP + timedelta(days=2),
        ),
        LocalRPApplicationFixture(
            key="alpha-test-draft",
            uuid=local_persona_uuid("rp-application", "alpha-test-draft"),
            name="Alpha benefits finder - Test draft",
            configuration_name="Test - draft endpoints",
            partner_environment="Alpha feature preview",
            canada_login_environment="test",
            registration_draft_version=2,
            registration_last_completed_step="endpoints",
        ),
        LocalRPApplicationFixture(
            key="alpha-staging-complete",
            uuid=local_persona_uuid("rp-application", "alpha-staging-complete"),
            name="Alpha benefits finder - Staging",
            configuration_name="Staging - partner acceptance",
            partner_environment="Alpha acceptance",
            canada_login_environment="staging",
            source_application_key="alpha-test-complete",
            registration_draft_version=5,
            registration_last_completed_step="encryption",
            registration_completed_at=LOCAL_PERSONA_FIXTURE_TIMESTAMP + timedelta(days=3),
        ),
        LocalRPApplicationFixture(
            key="alpha-production-complete",
            uuid=local_persona_uuid("rp-application", "alpha-production-complete"),
            name="Alpha benefits finder - Production",
            configuration_name="Production - review pending",
            partner_environment="Alpha public service",
            canada_login_environment="production",
            source_application_key="alpha-staging-complete",
            registration_draft_version=5,
            registration_last_completed_step="encryption",
            registration_completed_at=LOCAL_PERSONA_FIXTURE_TIMESTAMP + timedelta(days=4),
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
        service_name_en="Beta account service",
        service_name_fr="Service de compte Bêta",
        overview="Synthetic separate-scope Application for CL Admin oversight and access-denial checks.",
    ),
    applications=(
        LocalRPApplicationFixture(
            key="beta-test-complete",
            uuid=local_persona_uuid("rp-application", "beta-test-complete"),
            name="Beta account service - Test",
            configuration_name="Test - completed registration",
            partner_environment="Beta integration",
            canada_login_environment="test",
            registration_draft_version=5,
            registration_last_completed_step="encryption",
            registration_completed_at=LOCAL_PERSONA_FIXTURE_TIMESTAMP + timedelta(days=2),
        ),
        LocalRPApplicationFixture(
            key="beta-staging-complete",
            uuid=local_persona_uuid("rp-application", "beta-staging-complete"),
            name="Beta account service - Staging",
            configuration_name="Staging - completed registration",
            partner_environment="Beta acceptance",
            canada_login_environment="staging",
            source_application_key="beta-test-complete",
            registration_draft_version=5,
            registration_last_completed_step="encryption",
            registration_completed_at=LOCAL_PERSONA_FIXTURE_TIMESTAMP + timedelta(days=3),
        ),
        LocalRPApplicationFixture(
            key="beta-production-complete",
            uuid=local_persona_uuid("rp-application", "beta-production-complete"),
            name="Beta account service - Production",
            configuration_name="Production - review approved",
            partner_environment="Beta public service",
            canada_login_environment="production",
            source_application_key="beta-staging-complete",
            registration_draft_version=5,
            registration_last_completed_step="encryption",
            registration_completed_at=LOCAL_PERSONA_FIXTURE_TIMESTAMP + timedelta(days=4),
        ),
    ),
)

LOCAL_WORKSPACE_FIXTURES: Final = (
    LOCAL_ALPHA_WORKSPACE,
    LOCAL_BETA_WORKSPACE,
)
LOCAL_APPLICATION_CONTACT_FIXTURES: Final = tuple(
    contact for workspace in LOCAL_WORKSPACE_FIXTURES for contact in workspace.application_information.contacts
)
LOCAL_RP_APPLICATION_FIXTURES: Final = tuple(application for workspace in LOCAL_WORKSPACE_FIXTURES for application in workspace.applications)
LOCAL_RP_APPLICATIONS_BY_KEY: Final = MappingProxyType({fixture.key: fixture for fixture in LOCAL_RP_APPLICATION_FIXTURES})

LOCAL_INVITATION_FIXTURES: Final = (
    LocalInvitationFixture(
        key="alpha-pending-edit",
        uuid=local_persona_uuid("developer-invitation", "alpha-pending-edit"),
        workspace_key="alpha",
        rp_application_key=None,
        invited_email="pending.developer@local.example",
        token_hash="54e6213ff05d24d35769292df7c73fccc6c9336147fe1e1a064b2923e4ae07d0",
        invite_expires_at=LOCAL_PENDING_INVITATION_EXPIRES_AT,
        role=CanonicalRoleCode.RP_USER_EDIT,
        status="pending",
        created_at=LOCAL_PERSONA_FIXTURE_TIMESTAMP + timedelta(days=6),
    ),
    LocalInvitationFixture(
        key="alpha-accepted-read-only",
        uuid=local_persona_uuid(
            "developer-invitation",
            "alpha-accepted-read-only",
        ),
        workspace_key="alpha",
        rp_application_key="alpha-test-complete",
        invited_email="accepted.reviewer@local.example",
        token_hash="4b02d6d20b93663d2156eeddca430219b4d8f3b877c73d0a4edac32e87d6ced8",
        invite_expires_at=LOCAL_PERSONA_FIXTURE_TIMESTAMP + timedelta(days=30),
        role=CanonicalRoleCode.READ_ONLY,
        status="accepted",
        created_at=LOCAL_PERSONA_FIXTURE_TIMESTAMP + timedelta(days=1),
        accepted_at=LOCAL_PERSONA_FIXTURE_TIMESTAMP + timedelta(days=2),
    ),
    LocalInvitationFixture(
        key="alpha-expired-admin",
        uuid=local_persona_uuid("developer-invitation", "alpha-expired-admin"),
        workspace_key="alpha",
        rp_application_key="alpha-staging-complete",
        invited_email="expired.admin@local.example",
        token_hash="e7b182685f8bd16c872cccf5204464759723691fb7c7fa12b1fd5b50a57ea99d",
        invite_expires_at=LOCAL_PERSONA_FIXTURE_TIMESTAMP - timedelta(days=7),
        role=CanonicalRoleCode.RP_ADMIN,
        status="expired",
        created_at=LOCAL_PERSONA_FIXTURE_TIMESTAMP - timedelta(days=21),
    ),
    LocalInvitationFixture(
        key="alpha-revoked-edit",
        uuid=local_persona_uuid("developer-invitation", "alpha-revoked-edit"),
        workspace_key="alpha",
        rp_application_key=None,
        invited_email="pending.developer@local.example",
        token_hash="efe81b7725c4c0f0257460e4849e2f5a0f6154ea153bedd16ab60a57fa2f8436",
        invite_expires_at=LOCAL_PERSONA_FIXTURE_TIMESTAMP + timedelta(days=30),
        role=CanonicalRoleCode.RP_USER_EDIT,
        status="revoked",
        created_at=LOCAL_PERSONA_FIXTURE_TIMESTAMP,
        revoked_at=LOCAL_PERSONA_FIXTURE_TIMESTAMP + timedelta(days=5),
        revoked_by_fixture_id="local-rp-admin",
        revocation_actor_source="user",
        revocation_reason="Reissued as the current synthetic invitation.",
        replaced_by_invitation_key="alpha-pending-edit",
    ),
)

LOCAL_PRODUCTION_REVIEW_FIXTURES: Final = (
    LocalProductionReviewFixture(
        application_key="alpha-production-complete",
        status="pending",
        external_reference="SYNTHETIC-ALPHA-REVIEW-001",
        requested_at=LOCAL_PERSONA_FIXTURE_TIMESTAMP + timedelta(days=5),
    ),
    LocalProductionReviewFixture(
        application_key="beta-production-complete",
        status="approved",
        external_reference="SYNTHETIC-BETA-REVIEW-001",
        requested_at=LOCAL_PERSONA_FIXTURE_TIMESTAMP + timedelta(days=3),
        reviewed_at=LOCAL_PERSONA_FIXTURE_TIMESTAMP + timedelta(days=5),
        decided_at=LOCAL_PERSONA_FIXTURE_TIMESTAMP + timedelta(days=5),
        reviewed_by_team="Synthetic CanadaLogin review team",
    ),
)


def _local_mau_records() -> tuple[LocalMAURecordFixture, ...]:
    completed_alpha_applications = tuple(
        application for application in LOCAL_ALPHA_WORKSPACE.applications if application.registration_completed_at is not None
    )
    records: list[LocalMAURecordFixture] = []
    record_days = (LOCAL_MAU_END_DATE - LOCAL_MAU_START_DATE).days + 1
    for application_index, application in enumerate(completed_alpha_applications):
        base_logins = 180 + (application_index * 85)
        base_unique_users = 112 + (application_index * 41)
        for day_index in range(record_days):
            failed_logins = 4 + ((application_index + day_index) % 3)
            total_logins = base_logins + (day_index * 17)
            records.append(
                LocalMAURecordFixture(
                    application_key=application.key,
                    application_name=application.name,
                    record_date=LOCAL_MAU_START_DATE + timedelta(days=day_index),
                    total_logins=total_logins,
                    unique_users=base_unique_users + (day_index * 9),
                    failed_logins=failed_logins,
                    successful_logins=total_logins - failed_logins,
                    mtd_unique_users=540 + (application_index * 170) + (day_index * 28),
                )
            )
    return tuple(records)


LOCAL_MAU_FIXTURES: Final = _local_mau_records()


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


def local_mau_cache_catalog() -> dict[str, dict[str, str]]:
    """Return the exact namespaced Redis hashes owned by the local fixtures."""

    catalog: dict[str, dict[str, str]] = {}
    for fixture in LOCAL_MAU_FIXTURES:
        catalog.setdefault(fixture.cache_key, {})[fixture.cache_field] = fixture.to_cache_json()
    return catalog


__all__ = [
    "LOCAL_ALPHA_WORKSPACE",
    "LOCAL_APPLICATION_CONTACT_FIXTURES",
    "LOCAL_BETA_WORKSPACE",
    "LOCAL_INVITATION_FIXTURES",
    "LOCAL_MAU_END_DATE",
    "LOCAL_MAU_FIXTURES",
    "LOCAL_MAU_START_DATE",
    "LOCAL_PENDING_INVITATION_EXPIRES_AT",
    "LOCAL_PERSONA_AUTH_PROVIDER",
    "LOCAL_PERSONA_FIXTURE_TIMESTAMP",
    "LOCAL_PERSONA_FIXTURES",
    "LOCAL_PERSONA_PROFILE_IMAGE_URL",
    "LOCAL_PERSONA_UUID_NAMESPACE",
    "LOCAL_PERSONAS_BY_ID",
    "LOCAL_PRODUCTION_REVIEW_FIXTURES",
    "LOCAL_RP_APPLICATION_FIXTURES",
    "LOCAL_RP_APPLICATIONS_BY_KEY",
    "LOCAL_WORKSPACE_FIXTURES",
    "LOCAL_WORKSPACES_BY_KEY",
    "LocalApplicationContactFixture",
    "LocalApplicationInformationFixture",
    "LocalDepartmentFixture",
    "LocalInvitationFixture",
    "LocalMAURecordFixture",
    "LocalPersonaFixture",
    "LocalPersonaPartnerAccess",
    "LocalProductionReviewFixture",
    "LocalRPApplicationFixture",
    "LocalWorkspaceFixture",
    "get_local_persona_fixture",
    "local_mau_cache_catalog",
    "local_persona_responses",
    "local_persona_uuid",
]
