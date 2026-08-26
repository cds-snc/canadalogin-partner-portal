"""Opt-in PostgreSQL races for canonical assignment and invitation lifecycle.

The tests create and drop uniquely named localhost databases through the same
guarded harness as the migration tests. Normal unit runs leave them skipped.
"""

from __future__ import annotations

import asyncio
import os
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Any
from urllib.parse import parse_qs, urlsplit
from uuid import UUID

import pytest
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from src.app.core.authorization import CanonicalRoleCode, LifecycleStatus
from src.app.core.identity import (
    AUTHENTICATED_EMAIL_KEY,
    AUTHENTICATED_EMAIL_VERIFIED_KEY,
    AUTHENTICATION_PROVIDER_KEY,
)
from src.app.core.local_persona_fixtures import (
    LOCAL_ALPHA_WORKSPACE,
    LOCAL_PERSONA_FIXTURES,
)
from src.app.models.audit_log import AuditLog
from src.app.models.rp_application import RPApplication
from src.app.models.rp_application_access_grant import RPApplicationAccessGrant
from src.app.models.rp_application_developer_invitation import (
    RPApplicationDeveloperInvitation,
)
from src.app.models.user import User
from src.app.models.user_role import UserRole
from src.app.models.workspace import Workspace
from src.app.services.authorization_service import (
    AUTHORIZATION_STATE_KEY,
    AuthorizationService,
    ResolvedAuthorizationState,
)
from src.app.services.local_persona_seed_service import (
    LocalPersonaSeedGate,
    LocalPersonaSeedService,
)
from src.app.services.rp_application_developer_invitation_service import (
    RPApplicationDeveloperInvitationService,
)

from tests.test_four_role_migrations_postgres import (
    TemporaryPostgresDatabase,
    _temporary_postgres_database,
)

RUN_ENV = "RUN_INVITATION_CONCURRENCY_POSTGRES_TESTS"

pytestmark = pytest.mark.skipif(
    os.getenv(RUN_ENV) != "1",
    reason=(f"set {RUN_ENV}=1 and FOUR_ROLE_POSTGRES_ADMIN_URL to run disposable invitation concurrency tests"),
)


@dataclass(frozen=True, slots=True)
class _Context:
    actor_id: int
    actor_uuid: UUID
    target_id: int
    target_uuid: UUID
    target_email: str
    workspace_id: int
    workspace_uuid: UUID
    application_uuid: UUID

    @property
    def actor(self) -> dict[str, object]:
        return {
            "id": self.actor_id,
            "uuid": self.actor_uuid,
            "email": LOCAL_PERSONA_FIXTURES[0].email,
            AUTHORIZATION_STATE_KEY: ResolvedAuthorizationState(global_role=CanonicalRoleCode.CL_ADMIN),
        }

    @property
    def target(self) -> dict[str, object]:
        return {
            "id": self.target_id,
            "uuid": self.target_uuid,
            "email": self.target_email,
            AUTHENTICATED_EMAIL_KEY: self.target_email,
            AUTHENTICATED_EMAIL_VERIFIED_KEY: True,
            AUTHENTICATION_PROVIDER_KEY: "oidc",
            AUTHORIZATION_STATE_KEY: ResolvedAuthorizationState(),
        }


def _seed_gate() -> LocalPersonaSeedGate:
    return LocalPersonaSeedGate(
        environment="local",
        auth_mode="local_dev",
        enable_dev_role_selector="true",
    )


async def _seed_context(
    session_factory: async_sessionmaker[AsyncSession],
) -> _Context:
    async with session_factory() as db:
        await LocalPersonaSeedService().seed(
            db,
            gate=_seed_gate(),
            terms_version="v1",
        )

    actor_fixture = LOCAL_PERSONA_FIXTURES[0]
    target_fixture = LOCAL_PERSONA_FIXTURES[-1]
    application_fixture = LOCAL_ALPHA_WORKSPACE.applications[0]
    async with session_factory() as db:
        actor = (await db.scalars(select(User).where(User.uuid == actor_fixture.user_uuid))).one()
        target = (await db.scalars(select(User).where(User.uuid == target_fixture.user_uuid))).one()
        target.email = "local-no-access@example.com"
        await db.commit()
        workspace = (await db.scalars(select(Workspace).where(Workspace.uuid == LOCAL_ALPHA_WORKSPACE.uuid))).one()
        application = (await db.scalars(select(RPApplication).where(RPApplication.uuid == application_fixture.uuid))).one()
        return _Context(
            actor_id=actor.id,
            actor_uuid=actor.uuid,
            target_id=target.id,
            target_uuid=target.uuid,
            target_email=target.email,
            workspace_id=workspace.id,
            workspace_uuid=workspace.uuid,
            application_uuid=application.uuid,
        )


async def _simultaneous(
    *operations: Callable[[asyncio.Event], Awaitable[Any]],
) -> list[Any]:
    start = asyncio.Event()
    tasks = [asyncio.create_task(operation(start)) for operation in operations]
    await asyncio.sleep(0)
    start.set()
    return list(await asyncio.gather(*tasks, return_exceptions=True))


def _assert_one_success(results: list[Any]) -> Any:
    successes = [result for result in results if not isinstance(result, BaseException)]
    failures = [result for result in results if isinstance(result, BaseException)]
    assert len(successes) == 1, results
    assert len(failures) == 1, results
    return successes[0]


async def _run_assignment_acceptance_race(
    session_factory: async_sessionmaker[AsyncSession],
    context: _Context,
) -> None:
    invitation_service = RPApplicationDeveloperInvitationService()
    async with session_factory() as db:
        invitation = await invitation_service.create_developer_invitation(
            db=db,
            workspace_uuid=context.workspace_uuid,
            rp_application_uuid=context.application_uuid,
            current_user=context.actor,
            invited_email=context.target_email,
            role=CanonicalRoleCode.READ_ONLY.value,
            invite_expires_at=datetime.now(UTC) + timedelta(days=1),
        )
    fragment_parameters = parse_qs(
        urlsplit(str(invitation["acceptance_url"])).fragment,
        strict_parsing=True,
    )
    [raw_token] = fragment_parameters["token"]
    async with session_factory() as db:
        prepared_invitation_uuid = await invitation_service.prepare_developer_invitation(
            db=db,
            token=raw_token,
        )

    async def accept(start: asyncio.Event) -> object:
        async with session_factory() as db:
            await start.wait()
            return await RPApplicationDeveloperInvitationService().accept_prepared_developer_invitation(
                db=db,
                invitation_uuid=prepared_invitation_uuid,
                current_user=context.target,
            )

    async def assign(start: asyncio.Event) -> object:
        async with session_factory.begin() as db:
            await start.wait()
            return await AuthorizationService().assign_cl_admin(
                db,
                target_user_id=context.target_id,
                assigned_by_user_id=context.actor_id,
            )

    _assert_one_success(await _simultaneous(accept, assign))

    async with session_factory() as db:
        state = await AuthorizationService().resolve_for_user(
            db,
            user_id=context.target_id,
        )
        assert bool(state.global_role) is not bool(state.partner_access)
        invitations = list(
            (await db.scalars(select(RPApplicationDeveloperInvitation).where(RPApplicationDeveloperInvitation.uuid == invitation["uuid"]))).all()
        )
        assert len(invitations) == 1
        persisted_invitation = invitations[0]
        grants = list(
            (
                await db.scalars(
                    select(RPApplicationAccessGrant).where(
                        RPApplicationAccessGrant.user_id == context.target_id,
                        RPApplicationAccessGrant.status == LifecycleStatus.ACTIVE.value,
                    )
                )
            ).all()
        )
        global_assignments = int(
            await db.scalar(
                select(func.count())
                .select_from(UserRole)
                .where(
                    UserRole.user_id == context.target_id,
                    UserRole.status == LifecycleStatus.ACTIVE.value,
                )
            )
            or 0
        )
        assert len(grants) + global_assignments == 1
        if grants:
            assert persisted_invitation.status == LifecycleStatus.ACCEPTED.value
            assert grants[0].source_invitation_uuid == persisted_invitation.uuid
        else:
            assert persisted_invitation.status == LifecycleStatus.PENDING.value

        audit_descriptions = list((await db.scalars(select(AuditLog.description).where(AuditLog.target_uuid == persisted_invitation.uuid))).all())
        assert audit_descriptions
        assert all(raw_token not in description for description in audit_descriptions)
        assert all(context.target_email not in description for description in audit_descriptions)


async def _run_invitation_creation_assignment_race(
    session_factory: async_sessionmaker[AsyncSession],
    context: _Context,
) -> None:
    async def create(start: asyncio.Event) -> object:
        async with session_factory() as db:
            await start.wait()
            return await RPApplicationDeveloperInvitationService().create_developer_invitation(
                db=db,
                workspace_uuid=context.workspace_uuid,
                rp_application_uuid=None,
                current_user=context.actor,
                invited_email=context.target_email,
                role=CanonicalRoleCode.READ_ONLY.value,
                invite_expires_at=datetime.now(UTC) + timedelta(days=1),
            )

    async def assign(start: asyncio.Event) -> object:
        async with session_factory.begin() as db:
            await start.wait()
            return await AuthorizationService().assign_partner_role(
                db,
                target_user_id=context.target_id,
                workspace_id=context.workspace_id,
                role=CanonicalRoleCode.READ_ONLY,
                assigned_by_user_id=context.actor_id,
            )

    _assert_one_success(await _simultaneous(create, assign))

    async with session_factory() as db:
        pending_count = int(
            await db.scalar(
                select(func.count())
                .select_from(RPApplicationDeveloperInvitation)
                .where(
                    RPApplicationDeveloperInvitation.workspace_id == context.workspace_id,
                    func.lower(func.btrim(RPApplicationDeveloperInvitation.invited_email)) == context.target_email,
                    RPApplicationDeveloperInvitation.status == LifecycleStatus.PENDING.value,
                )
            )
            or 0
        )
        active_grant_count = int(
            await db.scalar(
                select(func.count())
                .select_from(RPApplicationAccessGrant)
                .where(
                    RPApplicationAccessGrant.workspace_id == context.workspace_id,
                    RPApplicationAccessGrant.user_id == context.target_id,
                    RPApplicationAccessGrant.status == LifecycleStatus.ACTIVE.value,
                )
            )
            or 0
        )
        assert pending_count + active_grant_count == 1


async def _run_invitation_reissue_assignment_race(
    session_factory: async_sessionmaker[AsyncSession],
    context: _Context,
) -> None:
    invitation_service = RPApplicationDeveloperInvitationService()
    async with session_factory() as db:
        original = await invitation_service.create_developer_invitation(
            db=db,
            workspace_uuid=context.workspace_uuid,
            rp_application_uuid=context.application_uuid,
            current_user=context.actor,
            invited_email=context.target_email,
            role=CanonicalRoleCode.RP_USER_EDIT.value,
            invite_expires_at=datetime.now(UTC) + timedelta(days=1),
        )
    async with session_factory() as db:
        await invitation_service.revoke_developer_invitation(
            db=db,
            workspace_uuid=context.workspace_uuid,
            rp_application_uuid=context.application_uuid,
            invitation_uuid=original["uuid"],
            current_user=context.actor,
        )

    async def reissue(start: asyncio.Event) -> object:
        async with session_factory() as db:
            await start.wait()
            return await RPApplicationDeveloperInvitationService().reissue_developer_invitation(
                db=db,
                workspace_uuid=context.workspace_uuid,
                rp_application_uuid=context.application_uuid,
                invitation_uuid=original["uuid"],
                current_user=context.actor,
                invite_expires_at=datetime.now(UTC) + timedelta(days=2),
            )

    async def assign(start: asyncio.Event) -> object:
        async with session_factory.begin() as db:
            await start.wait()
            return await AuthorizationService().assign_partner_role(
                db,
                target_user_id=context.target_id,
                workspace_id=context.workspace_id,
                role=CanonicalRoleCode.RP_USER_EDIT,
                assigned_by_user_id=context.actor_id,
            )

    _assert_one_success(await _simultaneous(reissue, assign))

    async with session_factory() as db:
        invitations = list(
            (
                await db.scalars(
                    select(RPApplicationDeveloperInvitation).where(
                        RPApplicationDeveloperInvitation.workspace_id == context.workspace_id,
                        func.lower(func.btrim(RPApplicationDeveloperInvitation.invited_email)) == context.target_email,
                    )
                )
            ).all()
        )
        pending_count = sum(invitation.status == LifecycleStatus.PENDING.value for invitation in invitations)
        active_grant_count = int(
            await db.scalar(
                select(func.count())
                .select_from(RPApplicationAccessGrant)
                .where(
                    RPApplicationAccessGrant.workspace_id == context.workspace_id,
                    RPApplicationAccessGrant.user_id == context.target_id,
                    RPApplicationAccessGrant.status == LifecycleStatus.ACTIVE.value,
                )
            )
            or 0
        )
        assert len(invitations) in {1, 2}
        assert pending_count + active_grant_count == 1


async def _run_reissue_race(
    session_factory: async_sessionmaker[AsyncSession],
    context: _Context,
) -> None:
    email = "concurrent-reissue@example.com"
    service = RPApplicationDeveloperInvitationService()
    async with session_factory() as db:
        original = await service.create_developer_invitation(
            db=db,
            workspace_uuid=context.workspace_uuid,
            rp_application_uuid=context.application_uuid,
            current_user=context.actor,
            invited_email=email,
            role=CanonicalRoleCode.RP_USER_EDIT.value,
            invite_expires_at=datetime.now(UTC) + timedelta(days=1),
        )

    async def reissue(start: asyncio.Event) -> object:
        async with session_factory() as db:
            await start.wait()
            return await RPApplicationDeveloperInvitationService().reissue_developer_invitation(
                db=db,
                workspace_uuid=context.workspace_uuid,
                rp_application_uuid=context.application_uuid,
                invitation_uuid=original["uuid"],
                current_user=context.actor,
                invite_expires_at=datetime.now(UTC) + timedelta(days=2),
            )

    replacement = _assert_one_success(await _simultaneous(reissue, reissue))
    async with session_factory() as db:
        rows = list(
            (
                await db.scalars(
                    select(RPApplicationDeveloperInvitation)
                    .where(
                        RPApplicationDeveloperInvitation.workspace_id == context.workspace_id,
                        func.lower(func.btrim(RPApplicationDeveloperInvitation.invited_email)) == email,
                    )
                    .order_by(RPApplicationDeveloperInvitation.created_at)
                )
            ).all()
        )
        assert len(rows) == 2
        prior = next(row for row in rows if row.uuid == original["uuid"])
        current = next(row for row in rows if row.uuid == replacement["uuid"])
        assert prior.status == LifecycleStatus.REVOKED.value
        assert prior.revoked_by_user_id == context.actor_id
        assert prior.revocation_actor_source == "user"
        assert prior.revoked_at is not None
        assert prior.replaced_by_invitation_uuid == current.uuid
        assert current.status == LifecycleStatus.PENDING.value
        operations = list((await db.scalars(select(AuditLog.operation).where(AuditLog.target_uuid.in_((prior.uuid, current.uuid))))).all())
        assert operations.count("invite_create") == 1
        assert operations.count("invite_reissue") == 2


async def _run_duplicate_creation_race(
    session_factory: async_sessionmaker[AsyncSession],
    context: _Context,
) -> None:
    normalized_email = "concurrent-duplicate@example.com"

    async def create(raw_email: str, start: asyncio.Event) -> object:
        async with session_factory() as db:
            await start.wait()
            return await RPApplicationDeveloperInvitationService().create_developer_invitation(
                db=db,
                workspace_uuid=context.workspace_uuid,
                rp_application_uuid=None,
                current_user=context.actor,
                invited_email=raw_email,
                role=CanonicalRoleCode.READ_ONLY.value,
                invite_expires_at=datetime.now(UTC) + timedelta(days=1),
            )

    _assert_one_success(
        await _simultaneous(
            lambda start: create(" Concurrent-Duplicate@Example.Test ", start),
            lambda start: create(normalized_email, start),
        )
    )
    async with session_factory() as db:
        rows = list(
            (
                await db.scalars(
                    select(RPApplicationDeveloperInvitation).where(
                        RPApplicationDeveloperInvitation.workspace_id == context.workspace_id,
                        func.lower(func.btrim(RPApplicationDeveloperInvitation.invited_email)) == normalized_email,
                    )
                )
            ).all()
        )
        assert len(rows) == 1
        assert rows[0].status == LifecycleStatus.PENDING.value
        assert rows[0].invited_email == normalized_email
        assert rows[0].rp_application_id is None
        audit_count = int(
            await db.scalar(
                select(func.count())
                .select_from(AuditLog)
                .where(
                    AuditLog.target_uuid == rows[0].uuid,
                    AuditLog.operation == "invite_create",
                )
            )
            or 0
        )
        assert audit_count == 1


async def _exercise(
    database: TemporaryPostgresDatabase,
    scenario: Callable[[async_sessionmaker[AsyncSession], _Context], Awaitable[None]],
) -> None:
    engine = create_async_engine(
        database.sync_url.set(drivername="postgresql+asyncpg"),
        pool_pre_ping=True,
    )
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    try:
        context = await _seed_context(session_factory)
        await scenario(session_factory, context)
    finally:
        await engine.dispose()


@pytest.mark.parametrize(
    "scenario",
    [
        _run_assignment_acceptance_race,
        _run_invitation_creation_assignment_race,
        _run_invitation_reissue_assignment_race,
        _run_reissue_race,
        _run_duplicate_creation_race,
    ],
    ids=[
        "invite-accept-vs-explicit-assignment",
        "invite-create-vs-explicit-partner-assignment",
        "invite-reissue-vs-explicit-partner-assignment",
        "concurrent-reissue",
        "normalized-duplicate-create",
    ],
)
def test_invitation_concurrency_postgres(
    scenario: Callable[[async_sessionmaker[AsyncSession], _Context], Awaitable[None]],
) -> None:
    with _temporary_postgres_database() as database:
        database.run_alembic("upgrade", "head")
        asyncio.run(_exercise(database, scenario))
