"""Opt-in disposable-PostgreSQL verification for local persona fixtures."""

from __future__ import annotations

import asyncio
import os

import pytest
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from src.app.core.authorization import (
    CL_ADMIN_ROLE_UUID,
    AssignmentSource,
    CanonicalRoleCode,
)
from src.app.core.local_persona_fixtures import (
    LOCAL_ALPHA_WORKSPACE,
    LOCAL_APPLICATION_CONTACT_FIXTURES,
    LOCAL_BETA_WORKSPACE,
    LOCAL_INVITATION_FIXTURES,
    LOCAL_PERSONA_FIXTURES,
    LOCAL_PRODUCTION_REVIEW_FIXTURES,
    LOCAL_WORKSPACE_FIXTURES,
    local_mau_cache_catalog,
)
from src.app.models.application_information import ApplicationInformation
from src.app.models.application_information_contact import ApplicationInformationContact
from src.app.models.department import Department
from src.app.models.role import Role
from src.app.models.rp_application import RPApplication
from src.app.models.rp_application_access_grant import RPApplicationAccessGrant
from src.app.models.rp_application_developer_invitation import (
    RPApplicationDeveloperInvitation,
)
from src.app.models.rp_application_promotion_request import (
    RPApplicationPromotionRequest,
)
from src.app.models.user import User
from src.app.models.user_role import UserRole
from src.app.models.workspace import Workspace
from src.app.models.workspace_member import WorkspaceMember
from src.app.services.authorization_service import AuthorizationService
from src.app.services.local_persona_seed_service import (
    EXPECTED_LOCAL_PERSONA_COUNTS,
    LocalPersonaFixtureStateError,
    LocalPersonaRecordCounts,
    LocalPersonaSeedGate,
    LocalPersonaSeedService,
)
from tests.test_four_role_migrations_postgres import (
    TemporaryPostgresDatabase,
    _temporary_postgres_database,
)

RUN_ENV = "RUN_LOCAL_PERSONA_SEED_POSTGRES_TESTS"

pytestmark = pytest.mark.skipif(
    os.getenv(RUN_ENV) != "1",
    reason=(f"set {RUN_ENV}=1 and FOUR_ROLE_POSTGRES_ADMIN_URL to run the disposable local-persona seed test"),
)


def _gate() -> LocalPersonaSeedGate:
    return LocalPersonaSeedGate(
        environment="local",
        auth_mode="local_dev",
        enable_dev_role_selector="true",
    )


class InMemoryMAURedis:
    def __init__(self) -> None:
        self.hashes: dict[str, dict[str, str]] = {}
        self.strings: dict[str, str] = {"unrelated:developer-data": "preserve"}

    async def type(self, key: str) -> bytes:
        if key in self.hashes:
            return b"hash"
        if key in self.strings:
            return b"string"
        return b"none"

    async def hgetall(self, key: str) -> dict[bytes, bytes]:
        return {field.encode(): value.encode() for field, value in self.hashes.get(key, {}).items()}

    async def hset(self, key: str, *, mapping: dict[str, str]) -> int:
        target = self.hashes.setdefault(key, {})
        created = sum(field not in target for field in mapping)
        target.update(mapping)
        return created

    async def delete(self, *keys: str) -> int:
        removed = 0
        for key in keys:
            removed += int(key in self.hashes or key in self.strings)
            self.hashes.pop(key, None)
            self.strings.pop(key, None)
        return removed


async def _fixture_counts(db: AsyncSession) -> LocalPersonaRecordCounts:
    department_uuids = tuple(workspace.department.uuid for workspace in LOCAL_WORKSPACE_FIXTURES)
    user_uuids = tuple(fixture.user_uuid for fixture in LOCAL_PERSONA_FIXTURES)
    workspace_uuids = tuple(workspace.uuid for workspace in LOCAL_WORKSPACE_FIXTURES)
    application_information_uuids = tuple(workspace.application_information.uuid for workspace in LOCAL_WORKSPACE_FIXTURES)
    application_uuids = tuple(application.uuid for workspace in LOCAL_WORKSPACE_FIXTURES for application in workspace.applications)
    assignment_uuids = tuple(fixture.global_assignment_uuid for fixture in LOCAL_PERSONA_FIXTURES if fixture.global_assignment_uuid is not None)
    grant_uuids = tuple(access.grant_uuid for fixture in LOCAL_PERSONA_FIXTURES for access in fixture.partner_access)
    contact_uuids = tuple(fixture.uuid for fixture in LOCAL_APPLICATION_CONTACT_FIXTURES)
    invitation_uuids = tuple(fixture.uuid for fixture in LOCAL_INVITATION_FIXTURES)

    return LocalPersonaRecordCounts(
        departments=int(await db.scalar(select(func.count()).select_from(Department).where(Department.uuid.in_(department_uuids))) or 0),
        users=int(await db.scalar(select(func.count()).select_from(User).where(User.uuid.in_(user_uuids))) or 0),
        workspaces=int(await db.scalar(select(func.count()).select_from(Workspace).where(Workspace.uuid.in_(workspace_uuids))) or 0),
        applications=int(
            await db.scalar(
                select(func.count()).select_from(ApplicationInformation).where(ApplicationInformation.uuid.in_(application_information_uuids))
            )
            or 0
        ),
        rp_applications=int(await db.scalar(select(func.count()).select_from(RPApplication).where(RPApplication.uuid.in_(application_uuids))) or 0),
        user_roles=int(await db.scalar(select(func.count()).select_from(UserRole).where(UserRole.uuid.in_(assignment_uuids))) or 0),
        partner_grants=int(
            await db.scalar(select(func.count()).select_from(RPApplicationAccessGrant).where(RPApplicationAccessGrant.uuid.in_(grant_uuids))) or 0
        ),
        contacts=int(
            await db.scalar(
                select(func.count()).select_from(ApplicationInformationContact).where(ApplicationInformationContact.uuid.in_(contact_uuids))
            )
            or 0
        ),
        invitations=int(
            await db.scalar(
                select(func.count()).select_from(RPApplicationDeveloperInvitation).where(RPApplicationDeveloperInvitation.uuid.in_(invitation_uuids))
            )
            or 0
        ),
        production_reviews=int(
            await db.scalar(
                select(func.count())
                .select_from(RPApplicationPromotionRequest)
                .where(RPApplicationPromotionRequest.rp_application_id.in_(select(RPApplication.id).where(RPApplication.uuid.in_(application_uuids))))
            )
            or 0
        ),
    )


async def _assert_seeded_authorization_and_records(
    session_factory: async_sessionmaker[AsyncSession],
    redis: InMemoryMAURedis,
) -> None:
    async with session_factory() as db:
        assert await _fixture_counts(db) == EXPECTED_LOCAL_PERSONA_COUNTS.with_mau_records(0)

        users = list((await db.scalars(select(User).where(User.uuid.in_(tuple(fixture.user_uuid for fixture in LOCAL_PERSONA_FIXTURES))))).all())
        users_by_uuid = {user.uuid: user for user in users}
        assert len(users_by_uuid) == 5
        assert all(
            user.enabled
            and not user.is_deleted
            and not user.is_superuser
            and user.accepted_terms_at is not None
            and user.terms_version == "v1"
            and user.role_ids is None
            for user in users
        )

        departments = list(
            (
                await db.scalars(
                    select(Department).where(Department.uuid.in_(tuple(workspace.department.uuid for workspace in LOCAL_WORKSPACE_FIXTURES)))
                )
            ).all()
        )
        workspaces = list(
            (await db.scalars(select(Workspace).where(Workspace.uuid.in_(tuple(workspace.uuid for workspace in LOCAL_WORKSPACE_FIXTURES))))).all()
        )
        application_information = list(
            (
                await db.scalars(
                    select(ApplicationInformation).where(
                        ApplicationInformation.uuid.in_(tuple(workspace.application_information.uuid for workspace in LOCAL_WORKSPACE_FIXTURES))
                    )
                )
            ).all()
        )
        applications = list(
            (
                await db.scalars(
                    select(RPApplication).where(
                        RPApplication.uuid.in_(
                            tuple(application.uuid for workspace in LOCAL_WORKSPACE_FIXTURES for application in workspace.applications)
                        )
                    )
                )
            ).all()
        )
        assert len(departments) == 2
        assert len(workspaces) == 2
        assert len(application_information) == 2
        assert len(applications) == 7
        workspace_ids_by_uuid = {workspace.uuid: workspace.id for workspace in workspaces}
        application_ids_by_uuid = {application.uuid: application.id for application in application_information}
        application_workspace_ids = {application.uuid: application.workspace_id for application in applications}
        assert application_workspace_ids == {
            application.uuid: workspace_ids_by_uuid[workspace.uuid]
            for workspace in LOCAL_WORKSPACE_FIXTURES
            for application in workspace.applications
        }
        assert {application.uuid: application.application_information_id for application in applications} == {
            application.uuid: application_ids_by_uuid[workspace.application_information.uuid]
            for workspace in LOCAL_WORKSPACE_FIXTURES
            for application in workspace.applications
        }

        assignment = (await db.scalars(select(UserRole).where(UserRole.uuid == LOCAL_PERSONA_FIXTURES[0].global_assignment_uuid))).one()
        assert assignment.assignment_source == AssignmentSource.LOCAL_FIXTURE.value
        assigned_role = await db.get(Role, assignment.role_id)
        assert assigned_role is not None
        assert assigned_role.uuid == CL_ADMIN_ROLE_UUID
        assert assigned_role.code == CanonicalRoleCode.CL_ADMIN.value

        grants = list(
            (
                await db.scalars(
                    select(RPApplicationAccessGrant).where(
                        RPApplicationAccessGrant.uuid.in_(
                            tuple(access.grant_uuid for fixture in LOCAL_PERSONA_FIXTURES for access in fixture.partner_access)
                        )
                    )
                )
            ).all()
        )
        assert len(grants) == 3
        assert {grant.role for grant in grants} == {
            CanonicalRoleCode.RP_ADMIN.value,
            CanonicalRoleCode.RP_USER_EDIT.value,
            CanonicalRoleCode.READ_ONLY.value,
        }
        assert {grant.workspace_id for grant in grants} == {workspace_ids_by_uuid[LOCAL_ALPHA_WORKSPACE.uuid]}
        assert workspace_ids_by_uuid[LOCAL_BETA_WORKSPACE.uuid] not in {grant.workspace_id for grant in grants}

        fixture_user_ids = tuple(user.id for user in users)
        fixture_workspace_ids = tuple(workspace.id for workspace in workspaces)
        legacy_memberships = int(
            await db.scalar(
                select(func.count())
                .select_from(WorkspaceMember)
                .where((WorkspaceMember.user_id.in_(fixture_user_ids)) | (WorkspaceMember.workspace_id.in_(fixture_workspace_ids)))
            )
            or 0
        )
        assert legacy_memberships == 0

        contacts = list(
            (
                await db.scalars(
                    select(ApplicationInformationContact).where(
                        ApplicationInformationContact.uuid.in_(tuple(fixture.uuid for fixture in LOCAL_APPLICATION_CONTACT_FIXTURES))
                    )
                )
            ).all()
        )
        assert len(contacts) == 3
        assert all(contact.email.endswith("@local.example") for contact in contacts)

        invitations = list(
            (
                await db.scalars(
                    select(RPApplicationDeveloperInvitation).where(
                        RPApplicationDeveloperInvitation.uuid.in_(tuple(fixture.uuid for fixture in LOCAL_INVITATION_FIXTURES))
                    )
                )
            ).all()
        )
        assert {invitation.status for invitation in invitations} == {
            "pending",
            "accepted",
            "expired",
            "revoked",
        }
        assert all(invitation.gc_notify_notification_id is None and len(invitation.token_hash) == 64 for invitation in invitations)

        production_reviews = list(
            (
                await db.scalars(
                    select(RPApplicationPromotionRequest).where(
                        RPApplicationPromotionRequest.rp_application_id.in_(tuple(application.id for application in applications))
                    )
                )
            ).all()
        )
        assert {review.review_status for review in production_reviews} == {fixture.status for fixture in LOCAL_PRODUCTION_REVIEW_FIXTURES}

        authorization_service = AuthorizationService()
        for fixture in LOCAL_PERSONA_FIXTURES:
            user = users_by_uuid[fixture.user_uuid]
            state = await authorization_service.resolve_for_user(
                db,
                user_id=user.id,
            )
            assert state.global_role == fixture.global_role
            assert tuple((access.workspace_uuid, access.role) for access in state.partner_access) == tuple(
                (access.workspace_uuid, access.role) for access in fixture.partner_access
            )
            assert all(access.workspace_uuid != LOCAL_BETA_WORKSPACE.uuid for access in state.partner_access)

    assert redis.hashes == local_mau_cache_catalog()


async def _exercise_seed(database: TemporaryPostgresDatabase) -> None:
    async_url = database.sync_url.set(drivername="postgresql+asyncpg")
    engine = create_async_engine(async_url, pool_pre_ping=True)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    redis = InMemoryMAURedis()
    service = LocalPersonaSeedService(redis=redis)  # type: ignore[arg-type]
    try:
        async with session_factory() as db:
            first_report = await service.seed(
                db,
                gate=_gate(),
                terms_version="v1",
            )
        assert first_report.action == "seed"
        assert first_report.outcome == "created"
        assert first_report.counts == EXPECTED_LOCAL_PERSONA_COUNTS

        async with session_factory() as db:
            second_report = await service.seed(
                db,
                gate=_gate(),
                terms_version="v1",
            )
        assert second_report.action == "seed"
        assert second_report.outcome == "unchanged"
        assert second_report.to_dict()["counts"] == first_report.to_dict()["counts"]

        await _assert_seeded_authorization_and_records(session_factory, redis)

        missing_contact_uuid = LOCAL_APPLICATION_CONTACT_FIXTURES[0].uuid
        async with session_factory.begin() as db:
            await db.execute(delete(ApplicationInformationContact).where(ApplicationInformationContact.uuid == missing_contact_uuid))

        async with session_factory() as db:
            with pytest.raises(
                LocalPersonaFixtureStateError,
                match="contacts are incomplete",
            ):
                await service.seed(
                    db,
                    gate=_gate(),
                    terms_version="v1",
                )

        async with session_factory() as db:
            assert (await _fixture_counts(db)).contacts == 2

        async with session_factory() as db:
            cleanup_report = await service.cleanup(
                db,
                gate=_gate(),
                confirmed=True,
                terms_version="v1",
            )
        assert cleanup_report.action == "cleanup"
        assert cleanup_report.outcome == "removed"
        assert cleanup_report.counts == LocalPersonaRecordCounts(
            departments=2,
            users=5,
            workspaces=2,
            applications=2,
            rp_applications=7,
            user_roles=1,
            partner_grants=3,
            contacts=2,
            invitations=4,
            production_reviews=2,
            mau_records=21,
        )

        async with session_factory() as db:
            assert await _fixture_counts(db) == LocalPersonaRecordCounts()
            canonical_role_count = int(await db.scalar(select(func.count()).select_from(Role).where(Role.uuid == CL_ADMIN_ROLE_UUID)) or 0)
            assert canonical_role_count == 1
        assert redis.hashes == {}
        assert redis.strings == {"unrelated:developer-data": "preserve"}

        async with session_factory() as db:
            second_cleanup_report = await service.cleanup(
                db,
                gate=_gate(),
                confirmed=True,
                terms_version="v1",
            )
        assert second_cleanup_report.outcome == "unchanged"
        assert second_cleanup_report.counts == LocalPersonaRecordCounts()
    finally:
        await engine.dispose()


def test_local_persona_seed_twice_partial_detection_and_cleanup_postgres() -> None:
    with _temporary_postgres_database() as database:
        database.run_alembic("upgrade", "head")
        asyncio.run(_exercise_seed(database))
