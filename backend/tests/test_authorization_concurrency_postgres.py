"""Opt-in PostgreSQL races for canonical authorization mutations.

The tests use the guarded migration-test harness to create and drop uniquely
named localhost databases. Normal unit runs leave them skipped.
"""

from __future__ import annotations

import asyncio
import os
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from typing import Any
from uuid import UUID

import pytest
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from src.app.core.authorization import CanonicalRoleCode, LifecycleStatus
from src.app.core.exceptions.http_exceptions import (
    BadRequestException,
    ForbiddenException,
)
from src.app.core.local_persona_fixtures import (
    LOCAL_ALPHA_WORKSPACE,
    LOCAL_PERSONA_FIXTURES,
)
from src.app.models.role import Role
from src.app.models.rp_application_access_grant import RPApplicationAccessGrant
from src.app.models.user import User
from src.app.models.user_role import UserRole
from src.app.models.workspace import Workspace
from src.app.services.authorization_service import AuthorizationService
from src.app.services.local_persona_seed_service import (
    LocalPersonaSeedGate,
    LocalPersonaSeedService,
)
from tests.test_four_role_migrations_postgres import (
    TemporaryPostgresDatabase,
    _temporary_postgres_database,
)

RUN_ENV = "RUN_AUTHORIZATION_CONCURRENCY_POSTGRES_TESTS"

pytestmark = pytest.mark.skipif(
    os.getenv(RUN_ENV) != "1",
    reason=(f"set {RUN_ENV}=1 and FOUR_ROLE_POSTGRES_ADMIN_URL to run disposable authorization concurrency tests"),
)


@dataclass(frozen=True, slots=True)
class _Context:
    actor_id: int
    actor_uuid: UUID
    target_id: int
    target_uuid: UUID
    workspace_id: int
    workspace_uuid: UUID


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
    async with session_factory() as db:
        actor = (await db.scalars(select(User).where(User.uuid == actor_fixture.user_uuid))).one()
        target = (await db.scalars(select(User).where(User.uuid == target_fixture.user_uuid))).one()
        workspace = (await db.scalars(select(Workspace).where(Workspace.uuid == LOCAL_ALPHA_WORKSPACE.uuid))).one()
        return _Context(
            actor_id=actor.id,
            actor_uuid=actor.uuid,
            target_id=target.id,
            target_uuid=target.uuid,
            workspace_id=workspace.id,
            workspace_uuid=workspace.uuid,
        )


async def _simultaneous_transactions(
    session_factory: async_sessionmaker[AsyncSession],
    *mutations: Callable[[AsyncSession], Awaitable[Any]],
) -> list[Any]:
    """Release mutations after each transaction owns a distinct connection."""

    barrier = asyncio.Barrier(len(mutations))
    backend_pids: set[int] = set()

    async def run(mutation: Callable[[AsyncSession], Awaitable[Any]]) -> Any:
        async with session_factory.begin() as db:
            backend_pid = await db.scalar(text("SELECT pg_backend_pid()"))
            assert backend_pid is not None
            backend_pids.add(int(backend_pid))
            await barrier.wait()
            return await mutation(db)

    tasks = [asyncio.create_task(run(mutation)) for mutation in mutations]
    results = list(await asyncio.gather(*tasks, return_exceptions=True))
    assert len(backend_pids) == len(mutations)
    return results


def _assert_one_success(
    results: list[Any],
    *,
    expected_failure: type[BaseException],
) -> Any:
    successes = [result for result in results if not isinstance(result, BaseException)]
    failures = [result for result in results if isinstance(result, BaseException)]
    assert len(successes) == 1, results
    assert len(failures) == 1, results
    assert isinstance(failures[0], expected_failure), results
    return successes[0]


async def _active_cl_admin_rows(
    db: AsyncSession,
) -> list[tuple[int, UUID]]:
    rows = (
        await db.execute(
            select(User.id, User.uuid)
            .join(UserRole, UserRole.user_id == User.id)
            .join(Role, Role.id == UserRole.role_id)
            .where(
                UserRole.status == LifecycleStatus.ACTIVE.value,
                Role.code == CanonicalRoleCode.CL_ADMIN.value,
                Role.is_deleted.is_(False),
                User.enabled.is_(True),
                User.is_deleted.is_(False),
            )
            .order_by(User.id)
        )
    ).all()
    return [(int(user_id), user_uuid) for user_id, user_uuid in rows]


async def _run_cross_revoke_race(
    session_factory: async_sessionmaker[AsyncSession],
    context: _Context,
) -> None:
    service = AuthorizationService()
    async with session_factory.begin() as db:
        await service.assign_cl_admin(
            db,
            target_user_id=context.target_id,
            assigned_by_user_id=context.actor_id,
        )

    async def actor_revokes_target(db: AsyncSession) -> UserRole:
        return await AuthorizationService().revoke_cl_admin(
            db,
            target_user_id=context.target_id,
            revoked_by_user_id=context.actor_id,
        )

    async def target_revokes_actor(db: AsyncSession) -> UserRole:
        return await AuthorizationService().revoke_cl_admin(
            db,
            target_user_id=context.actor_id,
            revoked_by_user_id=context.target_id,
        )

    _assert_one_success(
        await _simultaneous_transactions(
            session_factory,
            actor_revokes_target,
            target_revokes_actor,
        ),
        expected_failure=ForbiddenException,
    )

    async with session_factory() as db:
        active_admins = await _active_cl_admin_rows(db)
        assert len(active_admins) == 1
        remaining_user_id, remaining_user_uuid = active_admins[0]
        assert remaining_user_uuid in {context.actor_uuid, context.target_uuid}

        assignment_list = await service.list_cl_admin_assignments(
            db,
            actor_user_id=remaining_user_id,
        )
        assert [assignment.user_uuid for assignment in assignment_list] == [remaining_user_uuid]

        revoked_assignments = list(
            (
                await db.scalars(
                    select(UserRole)
                    .join(Role, Role.id == UserRole.role_id)
                    .where(
                        UserRole.status == LifecycleStatus.REVOKED.value,
                        Role.code == CanonicalRoleCode.CL_ADMIN.value,
                    )
                )
            ).all()
        )
        assert len(revoked_assignments) == 1
        assert revoked_assignments[0].revoked_at is not None
        assert revoked_assignments[0].revoked_by_user_id == remaining_user_id


async def _run_global_partner_assignment_race(
    session_factory: async_sessionmaker[AsyncSession],
    context: _Context,
) -> None:
    async def assign_global(db: AsyncSession) -> UserRole:
        return await AuthorizationService().assign_cl_admin(
            db,
            target_user_id=context.target_id,
            assigned_by_user_id=context.actor_id,
        )

    async def assign_partner(db: AsyncSession) -> RPApplicationAccessGrant:
        return await AuthorizationService().assign_partner_role(
            db,
            target_user_id=context.target_id,
            workspace_id=context.workspace_id,
            role=CanonicalRoleCode.READ_ONLY,
            assigned_by_user_id=context.actor_id,
        )

    _assert_one_success(
        await _simultaneous_transactions(
            session_factory,
            assign_global,
            assign_partner,
        ),
        expected_failure=BadRequestException,
    )

    async with session_factory() as db:
        global_count = int(
            await db.scalar(
                select(func.count())
                .select_from(UserRole)
                .join(Role, Role.id == UserRole.role_id)
                .where(
                    UserRole.user_id == context.target_id,
                    UserRole.status == LifecycleStatus.ACTIVE.value,
                    Role.code == CanonicalRoleCode.CL_ADMIN.value,
                    Role.is_deleted.is_(False),
                )
            )
            or 0
        )
        partner_count = int(
            await db.scalar(
                select(func.count())
                .select_from(RPApplicationAccessGrant)
                .where(
                    RPApplicationAccessGrant.user_id == context.target_id,
                    RPApplicationAccessGrant.workspace_id == context.workspace_id,
                    RPApplicationAccessGrant.status == LifecycleStatus.ACTIVE.value,
                    RPApplicationAccessGrant.is_deleted.is_(False),
                )
            )
            or 0
        )
        assert global_count + partner_count == 1
        assert bool(global_count) is not bool(partner_count)

        state = await AuthorizationService().resolve_for_user(
            db,
            user_id=context.target_id,
        )
        assert state.is_cl_admin is bool(global_count)
        assert bool(state.partner_access) is bool(partner_count)
        if state.partner_access:
            assert len(state.partner_access) == 1
            assert state.partner_access[0].workspace_uuid == context.workspace_uuid
            assert state.partner_access[0].role is CanonicalRoleCode.READ_ONLY


async def _exercise(
    database: TemporaryPostgresDatabase,
    scenario: Callable[
        [async_sessionmaker[AsyncSession], _Context],
        Awaitable[None],
    ],
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
        _run_cross_revoke_race,
        _run_global_partner_assignment_race,
    ],
    ids=[
        "concurrent-cross-revoke-preserves-last-cl-admin",
        "concurrent-global-vs-partner-assignment",
    ],
)
def test_authorization_concurrency_postgres(
    scenario: Callable[
        [async_sessionmaker[AsyncSession], _Context],
        Awaitable[None],
    ],
) -> None:
    with _temporary_postgres_database() as database:
        database.run_alembic("upgrade", "head")
        asyncio.run(_exercise(database, scenario))
