"""Guarded, transactional persistence for deterministic local personas."""

from __future__ import annotations

from collections.abc import Mapping, Sequence
from dataclasses import dataclass, field
from typing import Any, Final
from uuid import UUID

from redis.asyncio import Redis as AsyncRedis
from sqlalchemy import delete, or_, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.authorization import (
    CL_ADMIN_ROLE_UUID,
    AssignmentSource,
    CanonicalRoleCode,
    LifecycleStatus,
)
from ..core.local_persona_fixtures import (
    LOCAL_APPLICATION_CONTACT_FIXTURES,
    LOCAL_INVITATION_FIXTURES,
    LOCAL_MAU_FIXTURES,
    LOCAL_PERSONA_AUTH_PROVIDER,
    LOCAL_PERSONA_FIXTURE_TIMESTAMP,
    LOCAL_PERSONA_FIXTURES,
    LOCAL_PERSONA_PROFILE_IMAGE_URL,
    LOCAL_PERSONA_UUID_NAMESPACE,
    LOCAL_PRODUCTION_REVIEW_FIXTURES,
    LOCAL_RP_APPLICATIONS_BY_KEY,
    LOCAL_WORKSPACE_FIXTURES,
    LocalPersonaFixture,
    LocalPersonaPartnerAccess,
    LocalRPApplicationFixture,
    LocalWorkspaceFixture,
    local_mau_cache_catalog,
)
from ..models.application_information import ApplicationInformation
from ..models.application_information_contact import ApplicationInformationContact
from ..models.department import Department
from ..models.role import Role
from ..models.rp_application import RPApplication
from ..models.rp_application_access_grant import RPApplicationAccessGrant
from ..models.rp_application_developer_invitation import (
    RPApplicationDeveloperInvitation,
)
from ..models.rp_application_promotion_request import (
    RPApplicationPromotionRequest,
)
from ..models.user import User
from ..models.user_role import UserRole
from ..models.workspace import Workspace
from ..models.workspace_member import WorkspaceMember

_LOCAL_PERSONA_SEED_LOCK_KEY: Final = "local-persona-fixtures:v1"
_EXACT_ENVIRONMENT: Final = "local"
_EXACT_AUTH_MODE: Final = "local_dev"
_EXACT_SELECTOR_VALUE: Final = "true"
_LEGACY_LOCAL_PERSONA_EMAILS: Final = {fixture.fixture_id: f"{fixture.fixture_id}@example.test" for fixture in LOCAL_PERSONA_FIXTURES}
_MUTABLE_LOCAL_PERSONA_USER_FIELDS: Final = frozenset({"department_id", "updated_at"})


@dataclass(frozen=True, slots=True)
class LocalPersonaSeedGate:
    """Raw composition inputs; values deliberately receive no normalization."""

    environment: str | None
    auth_mode: str | None
    enable_dev_role_selector: str | None

    @classmethod
    def from_environment(
        cls,
        environ: Mapping[str, str],
    ) -> LocalPersonaSeedGate:
        return cls(
            environment=environ.get("ENVIRONMENT"),
            auth_mode=environ.get("AUTH_MODE"),
            enable_dev_role_selector=environ.get("ENABLE_DEV_ROLE_SELECTOR"),
        )

    def require_enabled(self) -> None:
        if self.environment != _EXACT_ENVIRONMENT or self.auth_mode != _EXACT_AUTH_MODE or self.enable_dev_role_selector != _EXACT_SELECTOR_VALUE:
            raise LocalPersonaSeedGateError("local persona seed requires the exact local development triple gate")


@dataclass(frozen=True, slots=True)
class LocalPersonaRecordCounts:
    departments: int = 0
    users: int = 0
    workspaces: int = 0
    applications: int = 0
    rp_applications: int = 0
    user_roles: int = 0
    partner_grants: int = 0
    contacts: int = 0
    invitations: int = 0
    production_reviews: int = 0
    mau_records: int = 0

    @property
    def total(self) -> int:
        return sum(
            (
                self.departments,
                self.users,
                self.workspaces,
                self.applications,
                self.rp_applications,
                self.user_roles,
                self.partner_grants,
                self.contacts,
                self.invitations,
                self.production_reviews,
                self.mau_records,
            )
        )

    def with_mau_records(self, mau_records: int) -> LocalPersonaRecordCounts:
        return LocalPersonaRecordCounts(
            departments=self.departments,
            users=self.users,
            workspaces=self.workspaces,
            applications=self.applications,
            rp_applications=self.rp_applications,
            user_roles=self.user_roles,
            partner_grants=self.partner_grants,
            contacts=self.contacts,
            invitations=self.invitations,
            production_reviews=self.production_reviews,
            mau_records=mau_records,
        )

    def to_dict(self) -> dict[str, int]:
        return {
            "departments": self.departments,
            "users": self.users,
            "workspaces": self.workspaces,
            "applications": self.applications,
            "rpApplications": self.rp_applications,
            "userRoles": self.user_roles,
            "partnerGrants": self.partner_grants,
            "contacts": self.contacts,
            "invitations": self.invitations,
            "productionReviews": self.production_reviews,
            "mauRecords": self.mau_records,
        }


@dataclass(frozen=True, slots=True)
class LocalPersonaSeedReport:
    action: str
    outcome: str
    counts: LocalPersonaRecordCounts

    def to_dict(self) -> dict[str, object]:
        return {
            "action": self.action,
            "outcome": self.outcome,
            "namespace": str(LOCAL_PERSONA_UUID_NAMESPACE),
            "counts": self.counts.to_dict(),
        }


class LocalPersonaSeedError(RuntimeError):
    code = "LOCAL_PERSONA_SEED_FAILED"

    def to_dict(self) -> dict[str, str]:
        return {"code": self.code, "message": str(self)}


class LocalPersonaSeedGateError(LocalPersonaSeedError):
    code = "LOCAL_PERSONA_GATE_CLOSED"


class LocalPersonaCleanupConfirmationError(LocalPersonaSeedError):
    code = "LOCAL_PERSONA_CLEANUP_CONFIRMATION_REQUIRED"


class LocalPersonaFixtureStateError(LocalPersonaSeedError):
    code = "LOCAL_PERSONA_FIXTURE_STATE_INVALID"


class LocalPersonaCacheError(LocalPersonaSeedError):
    code = "LOCAL_PERSONA_CACHE_FAILED"


@dataclass(slots=True)
class _LoadedFixtureState:
    cl_admin_role: Role | None
    departments: list[Department]
    users: list[User]
    workspaces: list[Workspace]
    applications: list[ApplicationInformation]
    rp_applications: list[RPApplication]
    user_roles: list[UserRole]
    partner_grants: list[RPApplicationAccessGrant]
    workspace_members: list[WorkspaceMember]
    contacts: list[ApplicationInformationContact] = field(default_factory=list)
    invitations: list[RPApplicationDeveloperInvitation] = field(default_factory=list)
    production_reviews: list[RPApplicationPromotionRequest] = field(
        default_factory=list,
    )

    @property
    def counts(self) -> LocalPersonaRecordCounts:
        return LocalPersonaRecordCounts(
            departments=len(self.departments),
            users=len(self.users),
            workspaces=len(self.workspaces),
            applications=len(self.applications),
            rp_applications=len(self.rp_applications),
            user_roles=len(self.user_roles),
            partner_grants=len(self.partner_grants),
            contacts=len(self.contacts),
            invitations=len(self.invitations),
            production_reviews=len(self.production_reviews),
        )


@dataclass(frozen=True, slots=True)
class _LoadedMAUState:
    records_by_key: Mapping[str, Mapping[str, str]]

    @property
    def count(self) -> int:
        return sum(len(records) for records in self.records_by_key.values())


def _expected_counts() -> LocalPersonaRecordCounts:
    return LocalPersonaRecordCounts(
        departments=len(LOCAL_WORKSPACE_FIXTURES),
        users=len(LOCAL_PERSONA_FIXTURES),
        workspaces=len(LOCAL_WORKSPACE_FIXTURES),
        applications=len(LOCAL_WORKSPACE_FIXTURES),
        rp_applications=sum(len(workspace.applications) for workspace in LOCAL_WORKSPACE_FIXTURES),
        user_roles=sum(fixture.global_assignment_uuid is not None for fixture in LOCAL_PERSONA_FIXTURES),
        partner_grants=sum(len(fixture.partner_access) for fixture in LOCAL_PERSONA_FIXTURES),
        contacts=len(LOCAL_APPLICATION_CONTACT_FIXTURES),
        invitations=len(LOCAL_INVITATION_FIXTURES),
        production_reviews=len(LOCAL_PRODUCTION_REVIEW_FIXTURES),
        mau_records=len(LOCAL_MAU_FIXTURES),
    )


EXPECTED_LOCAL_PERSONA_COUNTS: Final = _expected_counts()
_EXPECTED_LOCAL_PERSONA_DATABASE_COUNTS: Final = EXPECTED_LOCAL_PERSONA_COUNTS.with_mau_records(0)


def _expected_partner_grants() -> tuple[
    tuple[LocalPersonaFixture, LocalPersonaPartnerAccess],
    ...,
]:
    return tuple((fixture, access) for fixture in LOCAL_PERSONA_FIXTURES for access in fixture.partner_access)


def _expected_applications() -> tuple[
    tuple[LocalWorkspaceFixture, LocalRPApplicationFixture],
    ...,
]:
    return tuple((workspace, application) for workspace in LOCAL_WORKSPACE_FIXTURES for application in workspace.applications)


class LocalPersonaSeedService:
    """Create or remove only the recorded namespace's fake local fixtures."""

    def __init__(self, redis: AsyncRedis | None = None) -> None:
        self._redis = redis

    async def seed(
        self,
        db: AsyncSession,
        *,
        gate: LocalPersonaSeedGate,
        terms_version: str,
    ) -> LocalPersonaSeedReport:
        gate.require_enabled()
        self._require_terms_version(terms_version)

        database_created = False
        async with db.begin():
            await self._lock_namespace(db)
            state = await self._load_state(db)
            if state.counts.total:
                self._assert_state_matches(
                    state,
                    terms_version=terms_version,
                    require_complete=True,
                )
                database_state = state
            else:
                self._require_canonical_role(state.cl_admin_role)
                await self._create_fixtures(
                    db,
                    cl_admin_role=state.cl_admin_role,
                    terms_version=terms_version,
                )
                database_state = await self._load_state(db)
                self._assert_state_matches(
                    database_state,
                    terms_version=terms_version,
                    require_complete=True,
                )
                database_created = True

        cache_changed = await self._seed_or_repair_mau_state()
        cache_state = await self._load_mau_state()
        self._assert_mau_state_matches(cache_state, require_complete=True)
        counts = database_state.counts.with_mau_records(cache_state.count)
        return LocalPersonaSeedReport(
            action="seed",
            outcome=("created" if database_created else "repaired" if cache_changed else "unchanged"),
            counts=counts,
        )

    async def cleanup(
        self,
        db: AsyncSession,
        *,
        gate: LocalPersonaSeedGate,
        confirmed: bool,
        terms_version: str,
    ) -> LocalPersonaSeedReport:
        gate.require_enabled()
        if confirmed is not True:
            raise LocalPersonaCleanupConfirmationError("local persona cleanup requires explicit confirmation")
        self._require_terms_version(terms_version)

        async with db.begin():
            await self._lock_namespace(db)
            state = await self._load_state(db)
            if state.workspace_members:
                raise LocalPersonaFixtureStateError("legacy workspace membership conflicts with local persona cleanup")
            if state.counts.total:
                self._assert_state_matches(
                    state,
                    terms_version=terms_version,
                    require_complete=False,
                    allow_legacy_persona_emails=True,
                )

            cache_state = await self._load_mau_state()
            self._assert_mau_state_matches(
                cache_state,
                require_complete=False,
            )
            removed_counts = state.counts.with_mau_records(cache_state.count)
            if not removed_counts.total:
                return LocalPersonaSeedReport(
                    action="cleanup",
                    outcome="unchanged",
                    counts=removed_counts,
                )

            await self._delete_mau_state()
            if state.counts.total:
                await self._delete_fixtures(db)
            remaining_state = await self._load_state(db)
            if remaining_state.counts.total or remaining_state.workspace_members:
                raise LocalPersonaFixtureStateError("local persona cleanup did not remove the complete namespace")
            remaining_cache_state = await self._load_mau_state()
            if remaining_cache_state.count:
                raise LocalPersonaFixtureStateError("local persona cleanup did not remove the complete MAU namespace")
            return LocalPersonaSeedReport(
                action="cleanup",
                outcome="removed",
                counts=removed_counts,
            )

    async def _lock_namespace(self, db: AsyncSession) -> None:
        await db.execute(
            text("SELECT pg_advisory_xact_lock(hashtextextended(:lock_key, 0))"),
            {"lock_key": _LOCAL_PERSONA_SEED_LOCK_KEY},
        )

    async def _load_state(self, db: AsyncSession) -> _LoadedFixtureState:
        expected_user_uuids = tuple(fixture.user_uuid for fixture in LOCAL_PERSONA_FIXTURES)
        expected_emails = tuple(fixture.email for fixture in LOCAL_PERSONA_FIXTURES)
        expected_fixture_ids = tuple(fixture.fixture_id for fixture in LOCAL_PERSONA_FIXTURES)
        users = list(
            (
                await db.scalars(
                    select(User).where(
                        or_(
                            User.uuid.in_(expected_user_uuids),
                            User.email.in_(expected_emails),
                            User.username.in_(expected_emails),
                            User.auth_subject.in_(expected_fixture_ids),
                        )
                    )
                )
            ).all()
        )

        expected_department_uuids = tuple(workspace.department.uuid for workspace in LOCAL_WORKSPACE_FIXTURES)
        expected_department_names = tuple(workspace.department.name for workspace in LOCAL_WORKSPACE_FIXTURES)
        departments = list(
            (
                await db.scalars(
                    select(Department).where(
                        or_(
                            Department.uuid.in_(expected_department_uuids),
                            Department.name.in_(expected_department_names),
                        )
                    )
                )
            ).all()
        )

        expected_workspace_uuids = tuple(workspace.uuid for workspace in LOCAL_WORKSPACE_FIXTURES)
        expected_workspace_names = tuple(workspace.name for workspace in LOCAL_WORKSPACE_FIXTURES)
        expected_workspace_slugs = tuple(workspace.slug for workspace in LOCAL_WORKSPACE_FIXTURES)
        workspaces = list(
            (
                await db.scalars(
                    select(Workspace).where(
                        or_(
                            Workspace.uuid.in_(expected_workspace_uuids),
                            Workspace.name.in_(expected_workspace_names),
                            Workspace.slug.in_(expected_workspace_slugs),
                        )
                    )
                )
            ).all()
        )

        expected_application_information_uuids = tuple(workspace.application_information.uuid for workspace in LOCAL_WORKSPACE_FIXTURES)
        expected_application_information_names = tuple(workspace.application_information.service_name_en for workspace in LOCAL_WORKSPACE_FIXTURES)
        applications = list(
            (
                await db.scalars(
                    select(ApplicationInformation).where(
                        or_(
                            ApplicationInformation.uuid.in_(expected_application_information_uuids),
                            ApplicationInformation.service_name_en.in_(expected_application_information_names),
                        )
                    )
                )
            ).all()
        )

        expected_applications = _expected_applications()
        expected_application_uuids = tuple(application.uuid for _, application in expected_applications)
        expected_application_names = tuple(application.name for _, application in expected_applications)
        rp_applications = list(
            (
                await db.scalars(
                    select(RPApplication).where(
                        or_(
                            RPApplication.uuid.in_(expected_application_uuids),
                            RPApplication.dnr_app_name.in_(expected_application_names),
                        )
                    )
                )
            ).all()
        )

        application_information_ids = tuple(application.id for application in applications)
        expected_contact_uuids = tuple(fixture.uuid for fixture in LOCAL_APPLICATION_CONTACT_FIXTURES)
        expected_contact_emails = tuple(fixture.email for fixture in LOCAL_APPLICATION_CONTACT_FIXTURES)
        contact_predicates = [
            ApplicationInformationContact.uuid.in_(expected_contact_uuids),
            ApplicationInformationContact.email.in_(expected_contact_emails),
        ]
        if application_information_ids:
            contact_predicates.append(ApplicationInformationContact.application_information_id.in_(application_information_ids))
        contacts = list((await db.scalars(select(ApplicationInformationContact).where(or_(*contact_predicates)))).all())

        workspace_ids = tuple(workspace.id for workspace in workspaces)
        rp_application_ids = tuple(application.id for application in rp_applications)
        invitation_predicates = [
            RPApplicationDeveloperInvitation.uuid.in_(tuple(fixture.uuid for fixture in LOCAL_INVITATION_FIXTURES)),
            RPApplicationDeveloperInvitation.invited_email.in_(tuple(fixture.invited_email for fixture in LOCAL_INVITATION_FIXTURES)),
            RPApplicationDeveloperInvitation.token_hash.in_(tuple(fixture.token_hash for fixture in LOCAL_INVITATION_FIXTURES)),
        ]
        if workspace_ids:
            invitation_predicates.append(RPApplicationDeveloperInvitation.workspace_id.in_(workspace_ids))
        if rp_application_ids:
            invitation_predicates.append(RPApplicationDeveloperInvitation.rp_application_id.in_(rp_application_ids))
        invitations = list((await db.scalars(select(RPApplicationDeveloperInvitation).where(or_(*invitation_predicates)))).all())

        production_reviews = (
            list(
                (
                    await db.scalars(
                        select(RPApplicationPromotionRequest).where(RPApplicationPromotionRequest.rp_application_id.in_(rp_application_ids))
                    )
                ).all()
            )
            if rp_application_ids
            else []
        )

        user_ids = tuple(user.id for user in users)
        expected_assignment_uuids = tuple(
            fixture.global_assignment_uuid for fixture in LOCAL_PERSONA_FIXTURES if fixture.global_assignment_uuid is not None
        )
        user_role_predicates = [UserRole.uuid.in_(expected_assignment_uuids)]
        grant_predicates = [RPApplicationAccessGrant.uuid.in_(tuple(access.grant_uuid for _, access in _expected_partner_grants()))]
        if user_ids:
            user_role_predicates.append(UserRole.user_id.in_(user_ids))
            grant_predicates.append(RPApplicationAccessGrant.user_id.in_(user_ids))

        user_roles = list((await db.scalars(select(UserRole).where(or_(*user_role_predicates)))).all())
        partner_grants = list((await db.scalars(select(RPApplicationAccessGrant).where(or_(*grant_predicates)))).all())

        workspace_member_predicates = []
        if user_ids:
            workspace_member_predicates.append(WorkspaceMember.user_id.in_(user_ids))
        if workspace_ids:
            workspace_member_predicates.append(WorkspaceMember.workspace_id.in_(workspace_ids))
        workspace_members = (
            list((await db.scalars(select(WorkspaceMember).where(or_(*workspace_member_predicates)))).all()) if workspace_member_predicates else []
        )

        cl_admin_role = (await db.scalars(select(Role).where(Role.code == CanonicalRoleCode.CL_ADMIN.value))).one_or_none()
        return _LoadedFixtureState(
            cl_admin_role=cl_admin_role,
            departments=departments,
            users=users,
            workspaces=workspaces,
            applications=applications,
            rp_applications=rp_applications,
            user_roles=user_roles,
            partner_grants=partner_grants,
            workspace_members=workspace_members,
            contacts=contacts,
            invitations=invitations,
            production_reviews=production_reviews,
        )

    def _assert_state_matches(
        self,
        state: _LoadedFixtureState,
        *,
        terms_version: str,
        require_complete: bool,
        allow_legacy_persona_emails: bool = False,
    ) -> None:
        self._assert_catalog_rows(
            state.departments,
            tuple(workspace.department.uuid for workspace in LOCAL_WORKSPACE_FIXTURES),
            "departments",
            require_complete=require_complete,
        )
        self._assert_catalog_rows(
            state.users,
            tuple(fixture.user_uuid for fixture in LOCAL_PERSONA_FIXTURES),
            "users",
            require_complete=require_complete,
        )
        self._assert_catalog_rows(
            state.workspaces,
            tuple(workspace.uuid for workspace in LOCAL_WORKSPACE_FIXTURES),
            "workspaces",
            require_complete=require_complete,
        )
        self._assert_catalog_rows(
            state.applications,
            tuple(workspace.application_information.uuid for workspace in LOCAL_WORKSPACE_FIXTURES),
            "Applications",
            require_complete=require_complete,
        )
        self._assert_catalog_rows(
            state.rp_applications,
            tuple(application.uuid for _, application in _expected_applications()),
            "RP applications",
            require_complete=require_complete,
        )
        self._assert_catalog_rows(
            state.user_roles,
            tuple(fixture.global_assignment_uuid for fixture in LOCAL_PERSONA_FIXTURES if fixture.global_assignment_uuid is not None),
            "global assignments",
            require_complete=require_complete,
        )
        self._assert_catalog_rows(
            state.partner_grants,
            tuple(access.grant_uuid for _, access in _expected_partner_grants()),
            "partner grants",
            require_complete=require_complete,
        )
        self._assert_catalog_rows(
            state.contacts,
            tuple(fixture.uuid for fixture in LOCAL_APPLICATION_CONTACT_FIXTURES),
            "Application contacts",
            require_complete=require_complete,
        )
        self._assert_catalog_rows(
            state.invitations,
            tuple(fixture.uuid for fixture in LOCAL_INVITATION_FIXTURES),
            "developer invitations",
            require_complete=require_complete,
        )
        if state.workspace_members:
            raise LocalPersonaFixtureStateError("local persona state contains legacy workspace membership authority")
        if require_complete and state.counts != _EXPECTED_LOCAL_PERSONA_DATABASE_COUNTS:
            raise LocalPersonaFixtureStateError("local persona state is partial or contains unexpected records")

        departments_by_uuid = {department.uuid: department for department in state.departments}
        users_by_uuid = {user.uuid: user for user in state.users}
        workspaces_by_uuid = {workspace.uuid: workspace for workspace in state.workspaces}
        rp_applications_by_uuid = {application.uuid: application for application in state.rp_applications}
        cl_admin_user = users_by_uuid.get(
            next(fixture.user_uuid for fixture in LOCAL_PERSONA_FIXTURES if fixture.global_role is CanonicalRoleCode.CL_ADMIN)
        )

        for workspace_fixture in LOCAL_WORKSPACE_FIXTURES:
            department = departments_by_uuid.get(workspace_fixture.department.uuid)
            if department is not None:
                self._require_fields(
                    department,
                    {
                        "name": workspace_fixture.department.name,
                        "name_fr": workspace_fixture.department.name_fr,
                        "abbreviation": workspace_fixture.department.abbreviation,
                        "abbreviation_fr": workspace_fixture.department.abbreviation_fr,
                        "gc_org_id": None,
                        "created_at": LOCAL_PERSONA_FIXTURE_TIMESTAMP,
                        "updated_at": None,
                        "deleted_at": None,
                        "is_deleted": False,
                    },
                    "department",
                )

        alpha_department = departments_by_uuid.get(LOCAL_WORKSPACE_FIXTURES[0].department.uuid)
        for fixture in LOCAL_PERSONA_FIXTURES:
            user = users_by_uuid.get(fixture.user_uuid)
            if user is not None:
                expected_email = fixture.email
                legacy_email = _LEGACY_LOCAL_PERSONA_EMAILS[fixture.fixture_id]
                if allow_legacy_persona_emails and user.email == legacy_email and user.username == legacy_email:
                    expected_email = legacy_email
                self._require_fields(
                    user,
                    {
                        "name": fixture.name,
                        "username": expected_email,
                        "email": expected_email,
                        "auth_provider": LOCAL_PERSONA_AUTH_PROVIDER,
                        "auth_subject": fixture.fixture_id,
                        "profile_image_url": LOCAL_PERSONA_PROFILE_IMAGE_URL,
                        "created_at": LOCAL_PERSONA_FIXTURE_TIMESTAMP,
                        "updated_at": None,
                        "last_login_at": None,
                        "deleted_at": None,
                        "is_deleted": False,
                        "is_superuser": False,
                        "enabled": True,
                        "accepted_terms_at": LOCAL_PERSONA_FIXTURE_TIMESTAMP,
                        "terms_version": terms_version,
                        "department_id": alpha_department.id if alpha_department else None,
                        "role_ids": None,
                    },
                    "user",
                    allowed_drift=_MUTABLE_LOCAL_PERSONA_USER_FIELDS,
                )

        for workspace_fixture in LOCAL_WORKSPACE_FIXTURES:
            workspace = workspaces_by_uuid.get(workspace_fixture.uuid)
            department = departments_by_uuid.get(workspace_fixture.department.uuid)
            if workspace is not None:
                self._require_fields(
                    workspace,
                    {
                        "name": workspace_fixture.name,
                        "slug": workspace_fixture.slug,
                        "description": workspace_fixture.description,
                        "department_id": department.id if department else None,
                        "created_by": cl_admin_user.id if cl_admin_user else None,
                        "created_at": LOCAL_PERSONA_FIXTURE_TIMESTAMP,
                        "updated_at": None,
                        "deleted_at": None,
                        "is_deleted": False,
                    },
                    "workspace",
                )

        application_information_by_uuid = {application.uuid: application for application in state.applications}
        for workspace_fixture in LOCAL_WORKSPACE_FIXTURES:
            application_fixture = workspace_fixture.application_information
            application = application_information_by_uuid.get(application_fixture.uuid)
            workspace = workspaces_by_uuid.get(workspace_fixture.uuid)
            if application is not None:
                self._require_fields(
                    application,
                    {
                        "workspace_id": workspace.id if workspace else None,
                        "service_name_en": application_fixture.service_name_en,
                        "service_name_fr": application_fixture.service_name_fr,
                        "overview": application_fixture.overview,
                        "technology_and_protocol": application_fixture.technology_and_protocol,
                        "security_and_privacy": application_fixture.security_and_privacy,
                        "usage": application_fixture.usage,
                        "migration_or_transition_plan": application_fixture.migration_or_transition_plan,
                        "created_by": cl_admin_user.id if cl_admin_user else None,
                        "created_at": LOCAL_PERSONA_FIXTURE_TIMESTAMP,
                        "updated_at": None,
                        "deleted_at": None,
                        "is_deleted": False,
                    },
                    "Application",
                )

        for workspace_fixture, rp_fixture in _expected_applications():
            rp_application = rp_applications_by_uuid.get(rp_fixture.uuid)
            workspace = workspaces_by_uuid.get(workspace_fixture.uuid)
            department = departments_by_uuid.get(workspace_fixture.department.uuid)
            if rp_application is not None:
                self._require_fields(
                    rp_application,
                    {
                        "workspace_id": workspace.id if workspace else None,
                        "department_id": department.id if department else None,
                        "application_information_id": (
                            application_information_by_uuid[workspace_fixture.application_information.uuid].id
                            if workspace_fixture.application_information.uuid in application_information_by_uuid
                            else None
                        ),
                        "dnr_app_name": rp_fixture.name,
                        "configuration_name": rp_fixture.configuration_name,
                        "partner_environment": rp_fixture.partner_environment,
                        "source_rp_configuration_id": (
                            rp_applications_by_uuid[LOCAL_RP_APPLICATIONS_BY_KEY[rp_fixture.source_application_key].uuid].id
                            if rp_fixture.source_application_key is not None
                            and LOCAL_RP_APPLICATIONS_BY_KEY[rp_fixture.source_application_key].uuid in rp_applications_by_uuid
                            else None
                        ),
                        "canada_login_environment": rp_fixture.canada_login_environment,
                        "status": "active",
                        "created_by": cl_admin_user.id if cl_admin_user else None,
                        "ibm_sv_application_id": None,
                        "application_owner": None,
                        "oidc_registration_payload": rp_fixture.registration_payload(
                            service_name_en=workspace_fixture.application_information.service_name_en,
                            service_name_fr=workspace_fixture.application_information.service_name_fr,
                        ),
                        "registration_creation_key": None,
                        "registration_draft_version": rp_fixture.registration_draft_version,
                        "registration_last_completed_step": rp_fixture.registration_last_completed_step,
                        "registration_completed_at": rp_fixture.registration_completed_at,
                        "onboarding_state": None,
                        "submitted_at": None,
                        "under_review_at": None,
                        "approved_at": None,
                        "launched_at": None,
                        "created_at": LOCAL_PERSONA_FIXTURE_TIMESTAMP,
                        "updated_at": None,
                        "deleted_at": None,
                        "is_deleted": False,
                    },
                    "RP application",
                )

        self._assert_contact_fields(
            state=state,
            application_information_by_uuid=application_information_by_uuid,
            cl_admin_user=cl_admin_user,
        )

        assignments_by_uuid = {assignment.uuid: assignment for assignment in state.user_roles}
        if state.user_roles:
            self._require_canonical_role(state.cl_admin_role)
        for fixture in LOCAL_PERSONA_FIXTURES:
            if fixture.global_assignment_uuid is None:
                continue
            assignment = assignments_by_uuid.get(fixture.global_assignment_uuid)
            user = users_by_uuid.get(fixture.user_uuid)
            if assignment is not None:
                self._require_fields(
                    assignment,
                    {
                        "user_id": user.id if user else None,
                        "role_id": state.cl_admin_role.id if state.cl_admin_role else None,
                        "status": LifecycleStatus.ACTIVE.value,
                        "assignment_source": AssignmentSource.LOCAL_FIXTURE.value,
                        "assigned_at": LOCAL_PERSONA_FIXTURE_TIMESTAMP,
                        "assigned_by_user_id": None,
                        "revoked_at": None,
                        "revoked_by_user_id": None,
                        "created_at": LOCAL_PERSONA_FIXTURE_TIMESTAMP,
                        "updated_at": None,
                    },
                    "global assignment",
                )

        grants_by_uuid = {grant.uuid: grant for grant in state.partner_grants}
        for fixture, access in _expected_partner_grants():
            grant = grants_by_uuid.get(access.grant_uuid)
            user = users_by_uuid.get(fixture.user_uuid)
            workspace = workspaces_by_uuid.get(access.workspace_uuid)
            if grant is not None:
                self._require_fields(
                    grant,
                    {
                        "workspace_id": workspace.id if workspace else None,
                        "user_id": user.id if user else None,
                        "role": access.role.value,
                        "status": LifecycleStatus.ACTIVE.value,
                        "source_invitation_uuid": None,
                        "revoked_at": None,
                        "revoked_by_user_id": None,
                        "created_at": LOCAL_PERSONA_FIXTURE_TIMESTAMP,
                        "updated_at": None,
                        "deleted_at": None,
                        "is_deleted": False,
                    },
                    "partner grant",
                )

        self._assert_invitation_and_review_fields(
            state=state,
            users_by_uuid=users_by_uuid,
            workspaces_by_uuid=workspaces_by_uuid,
            rp_applications_by_uuid=rp_applications_by_uuid,
            cl_admin_user=cl_admin_user,
            require_complete=require_complete,
        )

    def _assert_contact_fields(
        self,
        *,
        state: _LoadedFixtureState,
        application_information_by_uuid: Mapping[UUID, ApplicationInformation],
        cl_admin_user: User | None,
    ) -> None:
        contacts_by_uuid = {contact.uuid: contact for contact in state.contacts}
        for workspace_fixture in LOCAL_WORKSPACE_FIXTURES:
            application_information = application_information_by_uuid.get(workspace_fixture.application_information.uuid)
            for contact_fixture in workspace_fixture.application_information.contacts:
                contact = contacts_by_uuid.get(contact_fixture.uuid)
                if contact is None:
                    continue
                self._require_fields(
                    contact,
                    {
                        "application_information_id": (application_information.id if application_information is not None else None),
                        "name_en": contact_fixture.name_en,
                        "name_fr": contact_fixture.name_fr,
                        "responsibility_en": contact_fixture.responsibility_en,
                        "responsibility_fr": contact_fixture.responsibility_fr,
                        "email": contact_fixture.email,
                        "phone_number": contact_fixture.phone_number,
                        "first_name": contact_fixture.first_name,
                        "last_name": contact_fixture.last_name,
                        "alternate_phone_number": contact_fixture.alternate_phone_number,
                        "identity_confirmed_at": contact_fixture.identity_confirmed_at,
                        "identity_confirmed_by": (
                            cl_admin_user.id if contact_fixture.identity_confirmed_at is not None and cl_admin_user is not None else None
                        ),
                        "created_by": cl_admin_user.id if cl_admin_user else None,
                        "created_at": LOCAL_PERSONA_FIXTURE_TIMESTAMP,
                        "updated_at": None,
                        "deleted_at": None,
                        "is_deleted": False,
                    },
                    "Application contact",
                )

    def _assert_invitation_and_review_fields(
        self,
        *,
        state: _LoadedFixtureState,
        users_by_uuid: Mapping[UUID, User],
        workspaces_by_uuid: Mapping[UUID, Workspace],
        rp_applications_by_uuid: Mapping[UUID, RPApplication],
        cl_admin_user: User | None,
        require_complete: bool,
    ) -> None:
        rp_admin_fixture = next(fixture for fixture in LOCAL_PERSONA_FIXTURES if fixture.fixture_id == "local-rp-admin")
        rp_admin_user = users_by_uuid.get(rp_admin_fixture.user_uuid)
        rp_admin_grant_uuid = rp_admin_fixture.partner_access[0].grant_uuid
        workspaces_by_key = {fixture.key: workspaces_by_uuid.get(fixture.uuid) for fixture in LOCAL_WORKSPACE_FIXTURES}
        rp_applications_by_key = {key: rp_applications_by_uuid.get(fixture.uuid) for key, fixture in LOCAL_RP_APPLICATIONS_BY_KEY.items()}
        invitations_by_uuid = {invitation.uuid: invitation for invitation in state.invitations}
        for invitation_fixture in LOCAL_INVITATION_FIXTURES:
            invitation = invitations_by_uuid.get(invitation_fixture.uuid)
            if invitation is None:
                continue
            workspace = workspaces_by_key[invitation_fixture.workspace_key]
            rp_application = (
                rp_applications_by_key[invitation_fixture.rp_application_key] if invitation_fixture.rp_application_key is not None else None
            )
            revoked_by_user = (
                users_by_uuid.get(
                    next(fixture.user_uuid for fixture in LOCAL_PERSONA_FIXTURES if fixture.fixture_id == invitation_fixture.revoked_by_fixture_id)
                )
                if invitation_fixture.revoked_by_fixture_id is not None
                else None
            )
            self._require_fields(
                invitation,
                {
                    "workspace_id": workspace.id if workspace else None,
                    "rp_application_id": (rp_application.id if rp_application else None),
                    "invited_email": invitation_fixture.invited_email,
                    "token_hash": invitation_fixture.token_hash,
                    "invite_expires_at": invitation_fixture.invite_expires_at,
                    "role": invitation_fixture.role.value,
                    "invited_by": rp_admin_user.id if rp_admin_user else None,
                    "status": invitation_fixture.status,
                    "accepted_at": invitation_fixture.accepted_at,
                    "revoked_at": invitation_fixture.revoked_at,
                    "revoked_by_user_id": (revoked_by_user.id if revoked_by_user else None),
                    "revocation_actor_source": invitation_fixture.revocation_actor_source,
                    "gc_notify_notification_id": None,
                    "delegated_by_grant_uuid": rp_admin_grant_uuid,
                    "revocation_reason": invitation_fixture.revocation_reason,
                    "replaced_by_invitation_uuid": invitation_fixture.replaced_by_invitation_uuid,
                    "created_at": invitation_fixture.created_at,
                    "updated_at": None,
                    "deleted_at": None,
                    "is_deleted": False,
                },
                "developer invitation",
            )

        self._assert_production_review_fields(
            state=state,
            rp_applications_by_key=rp_applications_by_key,
            cl_admin_user=cl_admin_user,
            require_complete=require_complete,
        )

    def _assert_production_review_fields(
        self,
        *,
        state: _LoadedFixtureState,
        rp_applications_by_key: Mapping[str, RPApplication | None],
        cl_admin_user: User | None,
        require_complete: bool,
    ) -> None:
        expected_application_ids = {
            application.id
            for fixture in LOCAL_PRODUCTION_REVIEW_FIXTURES
            if (application := rp_applications_by_key.get(fixture.application_key)) is not None
        }
        actual_application_ids = [review.rp_application_id for review in state.production_reviews]
        if any(application_id not in expected_application_ids for application_id in actual_application_ids):
            raise LocalPersonaFixtureStateError("Production reviews collide with non-fixture records")
        if len(actual_application_ids) != len(set(actual_application_ids)):
            raise LocalPersonaFixtureStateError("Production reviews contain duplicate fixtures")
        if require_complete and set(actual_application_ids) != expected_application_ids:
            raise LocalPersonaFixtureStateError("Production reviews are incomplete")

        reviews_by_application_id = {review.rp_application_id: review for review in state.production_reviews}
        for fixture in LOCAL_PRODUCTION_REVIEW_FIXTURES:
            rp_application = rp_applications_by_key.get(fixture.application_key)
            if rp_application is None:
                continue
            review = reviews_by_application_id.get(rp_application.id)
            if review is None:
                continue
            is_terminal = fixture.status in {"approved", "rejected"}
            self._require_fields(
                review,
                {
                    "target_environment": "production",
                    "requested_at": fixture.requested_at,
                    "review_status": fixture.status,
                    "status": "review_tracked",
                    "external_reference": fixture.external_reference,
                    "reviewed_by_user_id": (cl_admin_user.id if is_terminal and cl_admin_user is not None else None),
                    "reviewed_by_team": fixture.reviewed_by_team,
                    "reviewed_at": fixture.reviewed_at,
                    "decided_at": fixture.decided_at,
                    "created_at": fixture.requested_at,
                    "updated_at": fixture.decided_at,
                    "deleted_at": None,
                    "is_deleted": False,
                },
                "Production review",
            )

    async def _create_fixtures(
        self,
        db: AsyncSession,
        *,
        cl_admin_role: Role | None,
        terms_version: str,
    ) -> None:
        self._require_canonical_role(cl_admin_role)
        assert cl_admin_role is not None

        departments = {
            workspace_fixture.key: Department(
                name=workspace_fixture.department.name,
                gc_org_id=None,
                name_fr=workspace_fixture.department.name_fr,
                abbreviation=workspace_fixture.department.abbreviation,
                abbreviation_fr=workspace_fixture.department.abbreviation_fr,
                lead_department_name=None,
                lead_department_name_fr=None,
                uuid=workspace_fixture.department.uuid,
                created_at=LOCAL_PERSONA_FIXTURE_TIMESTAMP,
                updated_at=None,
                deleted_at=None,
                is_deleted=False,
            )
            for workspace_fixture in LOCAL_WORKSPACE_FIXTURES
        }
        db.add_all(list(departments.values()))
        await db.flush()

        alpha_department = departments[LOCAL_WORKSPACE_FIXTURES[0].key]
        users: dict[str, User] = {}
        for fixture in LOCAL_PERSONA_FIXTURES:
            user = User(
                name=fixture.name,
                username=fixture.email,
                email=fixture.email,
                auth_provider=LOCAL_PERSONA_AUTH_PROVIDER,
                auth_subject=fixture.fixture_id,
                profile_image_url=LOCAL_PERSONA_PROFILE_IMAGE_URL,
                uuid=fixture.user_uuid,
                created_at=LOCAL_PERSONA_FIXTURE_TIMESTAMP,
                updated_at=None,
                last_login_at=None,
                deleted_at=None,
                is_deleted=False,
                is_superuser=False,
                enabled=True,
                accepted_terms_at=LOCAL_PERSONA_FIXTURE_TIMESTAMP,
                terms_version=terms_version,
                role_ids=None,
            )
            user.department_id = alpha_department.id
            users[fixture.fixture_id] = user
        db.add_all(list(users.values()))
        await db.flush()

        cl_admin_user = users["local-cl-admin"]
        workspaces = {
            workspace_fixture.key: Workspace(
                name=workspace_fixture.name,
                slug=workspace_fixture.slug,
                department_id=departments[workspace_fixture.key].id,
                created_by=cl_admin_user.id,
                uuid=workspace_fixture.uuid,
                description=workspace_fixture.description,
                created_at=LOCAL_PERSONA_FIXTURE_TIMESTAMP,
                updated_at=None,
                deleted_at=None,
                is_deleted=False,
            )
            for workspace_fixture in LOCAL_WORKSPACE_FIXTURES
        }
        db.add_all(list(workspaces.values()))
        await db.flush()

        application_information = {
            workspace_fixture.key: ApplicationInformation(
                workspace_id=workspaces[workspace_fixture.key].id,
                service_name_en=workspace_fixture.application_information.service_name_en,
                service_name_fr=workspace_fixture.application_information.service_name_fr,
                overview=workspace_fixture.application_information.overview,
                technology_and_protocol=workspace_fixture.application_information.technology_and_protocol,
                security_and_privacy=workspace_fixture.application_information.security_and_privacy,
                usage=workspace_fixture.application_information.usage,
                migration_or_transition_plan=workspace_fixture.application_information.migration_or_transition_plan,
                created_by=cl_admin_user.id,
                uuid=workspace_fixture.application_information.uuid,
                created_at=LOCAL_PERSONA_FIXTURE_TIMESTAMP,
                updated_at=None,
                deleted_at=None,
                is_deleted=False,
            )
            for workspace_fixture in LOCAL_WORKSPACE_FIXTURES
        }
        db.add_all(list(application_information.values()))
        await db.flush()

        contacts = [
            ApplicationInformationContact(
                application_information_id=application_information[workspace_fixture.key].id,
                name_en=contact_fixture.name_en,
                name_fr=contact_fixture.name_fr,
                responsibility_en=contact_fixture.responsibility_en,
                responsibility_fr=contact_fixture.responsibility_fr,
                email=contact_fixture.email,
                created_by=cl_admin_user.id,
                uuid=contact_fixture.uuid,
                phone_number=contact_fixture.phone_number,
                first_name=contact_fixture.first_name,
                last_name=contact_fixture.last_name,
                alternate_phone_number=contact_fixture.alternate_phone_number,
                identity_confirmed_at=contact_fixture.identity_confirmed_at,
                identity_confirmed_by=(cl_admin_user.id if contact_fixture.identity_confirmed_at is not None else None),
                created_at=LOCAL_PERSONA_FIXTURE_TIMESTAMP,
                updated_at=None,
                deleted_at=None,
                is_deleted=False,
            )
            for workspace_fixture in LOCAL_WORKSPACE_FIXTURES
            for contact_fixture in workspace_fixture.application_information.contacts
        ]
        db.add_all(contacts)

        applications: dict[str, RPApplication] = {}
        for workspace_fixture, application_fixture in _expected_applications():
            source_application = (
                applications.get(application_fixture.source_application_key) if application_fixture.source_application_key is not None else None
            )
            if application_fixture.source_application_key is not None and source_application is None:
                raise LocalPersonaFixtureStateError("local RP configuration lineage is incomplete")
            application = RPApplication(
                workspace_id=workspaces[workspace_fixture.key].id,
                department_id=departments[workspace_fixture.key].id,
                application_information_id=application_information[workspace_fixture.key].id,
                dnr_app_name=application_fixture.name,
                configuration_name=application_fixture.configuration_name,
                partner_environment=application_fixture.partner_environment,
                source_rp_configuration_id=(source_application.id if source_application else None),
                canada_login_environment=application_fixture.canada_login_environment,
                status="active",
                created_by=cl_admin_user.id,
                uuid=application_fixture.uuid,
                ibm_sv_application_id=None,
                application_owner=None,
                oidc_registration_payload=application_fixture.registration_payload(
                    service_name_en=workspace_fixture.application_information.service_name_en,
                    service_name_fr=workspace_fixture.application_information.service_name_fr,
                ),
                registration_creation_key=None,
                registration_draft_version=application_fixture.registration_draft_version,
                registration_last_completed_step=application_fixture.registration_last_completed_step,
                registration_completed_at=application_fixture.registration_completed_at,
                onboarding_state=None,
                submitted_at=None,
                under_review_at=None,
                approved_at=None,
                launched_at=None,
                created_at=LOCAL_PERSONA_FIXTURE_TIMESTAMP,
                updated_at=None,
                deleted_at=None,
                is_deleted=False,
            )
            db.add(application)
            await db.flush()
            applications[application_fixture.key] = application

        global_assignments: list[UserRole] = []
        for fixture in LOCAL_PERSONA_FIXTURES:
            assignment_uuid = fixture.global_assignment_uuid
            if assignment_uuid is None:
                continue
            global_assignments.append(
                UserRole(
                    user_id=users[fixture.fixture_id].id,
                    role_id=cl_admin_role.id,
                    status=LifecycleStatus.ACTIVE.value,
                    assignment_source=AssignmentSource.LOCAL_FIXTURE.value,
                    assigned_at=LOCAL_PERSONA_FIXTURE_TIMESTAMP,
                    assigned_by_user_id=None,
                    revoked_at=None,
                    revoked_by_user_id=None,
                    uuid=assignment_uuid,
                    created_at=LOCAL_PERSONA_FIXTURE_TIMESTAMP,
                    updated_at=None,
                )
            )
        db.add_all(global_assignments)

        partner_grants = [
            RPApplicationAccessGrant(
                workspace_id=workspaces[access.workspace_key].id,
                user_id=users[fixture.fixture_id].id,
                role=access.role.value,
                status=LifecycleStatus.ACTIVE.value,
                source_invitation_uuid=None,
                revoked_at=None,
                revoked_by_user_id=None,
                uuid=access.grant_uuid,
                created_at=LOCAL_PERSONA_FIXTURE_TIMESTAMP,
                updated_at=None,
                deleted_at=None,
                is_deleted=False,
            )
            for fixture, access in _expected_partner_grants()
        ]
        db.add_all(partner_grants)
        await db.flush()

        rp_admin_fixture = next(fixture for fixture in LOCAL_PERSONA_FIXTURES if fixture.fixture_id == "local-rp-admin")
        rp_admin_user = users[rp_admin_fixture.fixture_id]
        rp_admin_grant_uuid = rp_admin_fixture.partner_access[0].grant_uuid
        ordered_invitation_fixtures = sorted(
            LOCAL_INVITATION_FIXTURES,
            key=lambda fixture: fixture.replaced_by_invitation_key is not None,
        )
        for invitation_fixture in ordered_invitation_fixtures:
            revoked_by_user = users[invitation_fixture.revoked_by_fixture_id] if invitation_fixture.revoked_by_fixture_id is not None else None
            invitation = RPApplicationDeveloperInvitation(
                workspace_id=workspaces[invitation_fixture.workspace_key].id,
                rp_application_id=(
                    applications[invitation_fixture.rp_application_key].id if invitation_fixture.rp_application_key is not None else None
                ),
                invited_email=invitation_fixture.invited_email,
                token_hash=invitation_fixture.token_hash,
                invite_expires_at=invitation_fixture.invite_expires_at,
                role=invitation_fixture.role.value,
                invited_by=rp_admin_user.id,
                status=invitation_fixture.status,
                accepted_at=invitation_fixture.accepted_at,
                revoked_at=invitation_fixture.revoked_at,
                revoked_by_user_id=(revoked_by_user.id if revoked_by_user else None),
                revocation_actor_source=invitation_fixture.revocation_actor_source,
                gc_notify_notification_id=None,
                delegated_by_grant_uuid=rp_admin_grant_uuid,
                revocation_reason=invitation_fixture.revocation_reason,
                replaced_by_invitation_uuid=invitation_fixture.replaced_by_invitation_uuid,
                uuid=invitation_fixture.uuid,
                created_at=invitation_fixture.created_at,
                updated_at=None,
                deleted_at=None,
                is_deleted=False,
            )
            db.add(invitation)
            await db.flush()

        production_reviews = [
            RPApplicationPromotionRequest(
                rp_application_id=applications[review_fixture.application_key].id,
                target_environment="production",
                requested_at=review_fixture.requested_at,
                review_status=review_fixture.status,
                status="review_tracked",
                external_reference=review_fixture.external_reference,
                reviewed_by_user_id=(cl_admin_user.id if review_fixture.status in {"approved", "rejected"} else None),
                reviewed_by_team=review_fixture.reviewed_by_team,
                reviewed_at=review_fixture.reviewed_at,
                decided_at=review_fixture.decided_at,
                created_at=review_fixture.requested_at,
                updated_at=review_fixture.decided_at,
                deleted_at=None,
                is_deleted=False,
            )
            for review_fixture in LOCAL_PRODUCTION_REVIEW_FIXTURES
        ]
        db.add_all(production_reviews)
        await db.flush()

    def _cache(self) -> AsyncRedis:
        if self._redis is None:
            raise LocalPersonaCacheError("local persona MAU cache client is unavailable")
        return self._redis

    @staticmethod
    def _decode_cache_value(value: Any) -> str:
        if isinstance(value, bytes):
            return value.decode("utf-8")
        return str(value)

    async def _load_mau_state(self) -> _LoadedMAUState:
        records_by_key: dict[str, dict[str, str]] = {}
        try:
            cache = self._cache()
            for cache_key in local_mau_cache_catalog():
                cache_type = self._decode_cache_value(await cache.type(cache_key))
                if cache_type == "none":
                    continue
                if cache_type != "hash":
                    raise LocalPersonaFixtureStateError("local persona MAU cache key collides with a non-hash value")
                raw_records = await cache.hgetall(cache_key)
                records_by_key[cache_key] = {self._decode_cache_value(field): self._decode_cache_value(value) for field, value in raw_records.items()}
        except LocalPersonaSeedError:
            raise
        except Exception as exc:
            raise LocalPersonaCacheError("local persona MAU cache read failed") from exc
        return _LoadedMAUState(records_by_key=records_by_key)

    @staticmethod
    def _assert_mau_state_matches(
        state: _LoadedMAUState,
        *,
        require_complete: bool,
    ) -> None:
        expected = local_mau_cache_catalog()
        for cache_key, actual_records in state.records_by_key.items():
            expected_records = expected[cache_key]
            unexpected_fields = set(actual_records).difference(expected_records)
            if unexpected_fields:
                raise LocalPersonaFixtureStateError("local persona MAU cache contains non-fixture fields")
            mismatched_fields = tuple(field for field, value in actual_records.items() if expected_records[field] != value)
            if mismatched_fields:
                raise LocalPersonaFixtureStateError("local persona MAU cache differs from the deterministic catalog")
        if require_complete and {key: dict(records) for key, records in state.records_by_key.items()} != expected:
            raise LocalPersonaFixtureStateError("local persona MAU cache is incomplete")

    async def _seed_or_repair_mau_state(self) -> bool:
        state = await self._load_mau_state()
        self._assert_mau_state_matches(state, require_complete=False)
        expected = local_mau_cache_catalog()
        changed = False
        try:
            cache = self._cache()
            for cache_key, expected_records in expected.items():
                actual_records = state.records_by_key.get(cache_key, {})
                missing_records: Mapping[
                    str | bytes,
                    bytes | float | int | str,
                ] = {field: value for field, value in expected_records.items() if field not in actual_records}
                if missing_records:
                    await cache.hset(cache_key, mapping=missing_records)
                    changed = True
        except LocalPersonaSeedError:
            raise
        except Exception as exc:
            raise LocalPersonaCacheError("local persona MAU cache write failed") from exc
        return changed

    async def _delete_mau_state(self) -> None:
        try:
            await self._cache().delete(*local_mau_cache_catalog().keys())
        except LocalPersonaSeedError:
            raise
        except Exception as exc:
            raise LocalPersonaCacheError("local persona MAU cache cleanup failed") from exc

    async def _delete_fixtures(self, db: AsyncSession) -> None:
        expected_application_uuids = tuple(application.uuid for _, application in _expected_applications())
        expected_application_information_uuids = tuple(workspace.application_information.uuid for workspace in LOCAL_WORKSPACE_FIXTURES)
        expected_workspace_uuids = tuple(workspace.uuid for workspace in LOCAL_WORKSPACE_FIXTURES)
        expected_user_uuids = tuple(fixture.user_uuid for fixture in LOCAL_PERSONA_FIXTURES)
        expected_department_uuids = tuple(workspace.department.uuid for workspace in LOCAL_WORKSPACE_FIXTURES)
        expected_assignment_uuids = tuple(
            fixture.global_assignment_uuid for fixture in LOCAL_PERSONA_FIXTURES if fixture.global_assignment_uuid is not None
        )
        expected_grant_uuids = tuple(access.grant_uuid for _, access in _expected_partner_grants())
        expected_contact_uuids = tuple(fixture.uuid for fixture in LOCAL_APPLICATION_CONTACT_FIXTURES)
        expected_invitation_uuids = tuple(fixture.uuid for fixture in LOCAL_INVITATION_FIXTURES)

        await db.execute(
            delete(RPApplicationPromotionRequest).where(
                RPApplicationPromotionRequest.rp_application_id.in_(
                    select(RPApplication.id).where(RPApplication.uuid.in_(expected_application_uuids))
                )
            )
        )
        await db.execute(delete(RPApplicationDeveloperInvitation).where(RPApplicationDeveloperInvitation.uuid.in_(expected_invitation_uuids)))
        await db.execute(delete(ApplicationInformationContact).where(ApplicationInformationContact.uuid.in_(expected_contact_uuids)))
        await db.execute(delete(RPApplicationAccessGrant).where(RPApplicationAccessGrant.uuid.in_(expected_grant_uuids)))
        await db.execute(delete(UserRole).where(UserRole.uuid.in_(expected_assignment_uuids)))
        await db.execute(delete(RPApplication).where(RPApplication.uuid.in_(expected_application_uuids)))
        await db.execute(delete(ApplicationInformation).where(ApplicationInformation.uuid.in_(expected_application_information_uuids)))
        await db.execute(delete(Workspace).where(Workspace.uuid.in_(expected_workspace_uuids)))
        await db.execute(delete(User).where(User.uuid.in_(expected_user_uuids)))
        await db.execute(delete(Department).where(Department.uuid.in_(expected_department_uuids)))
        await db.flush()

    @staticmethod
    def _assert_catalog_rows(
        rows: Sequence[object],
        expected_uuids: Sequence[UUID],
        label: str,
        *,
        require_complete: bool,
    ) -> None:
        actual_uuids = [getattr(row, "uuid", None) for row in rows]
        expected_uuid_set = set(expected_uuids)
        if any(uuid not in expected_uuid_set for uuid in actual_uuids):
            raise LocalPersonaFixtureStateError(f"{label} collide with non-fixture records")
        if len(actual_uuids) != len(set(actual_uuids)):
            raise LocalPersonaFixtureStateError(f"{label} contain duplicate fixtures")
        if require_complete and set(actual_uuids) != expected_uuid_set:
            raise LocalPersonaFixtureStateError(f"{label} are incomplete")

    @staticmethod
    def _require_fields(
        record: object,
        expected: Mapping[str, object],
        label: str,
        *,
        allowed_drift: frozenset[str] = frozenset(),
    ) -> None:
        mismatched_fields = tuple(
            field_name
            for field_name, expected_value in expected.items()
            if field_name not in allowed_drift and getattr(record, field_name) != expected_value
        )
        if mismatched_fields:
            raise LocalPersonaFixtureStateError(f"{label} differs from the deterministic catalog: {', '.join(sorted(mismatched_fields))}")

    @staticmethod
    def _require_terms_version(terms_version: str) -> None:
        if not terms_version or len(terms_version) > 20:
            raise LocalPersonaSeedError("a valid terms version is required")

    @staticmethod
    def _require_canonical_role(role: Role | None) -> None:
        if role is None or role.id is None or role.uuid != CL_ADMIN_ROLE_UUID or role.is_deleted or role.code != CanonicalRoleCode.CL_ADMIN.value:
            raise LocalPersonaFixtureStateError("canonical CL Admin role definition is unavailable or invalid")


__all__ = [
    "EXPECTED_LOCAL_PERSONA_COUNTS",
    "LocalPersonaCacheError",
    "LocalPersonaCleanupConfirmationError",
    "LocalPersonaFixtureStateError",
    "LocalPersonaRecordCounts",
    "LocalPersonaSeedError",
    "LocalPersonaSeedGate",
    "LocalPersonaSeedGateError",
    "LocalPersonaSeedReport",
    "LocalPersonaSeedService",
]
