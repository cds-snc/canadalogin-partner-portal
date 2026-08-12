"""Opt-in PostgreSQL race for one-time RP application department assignment.

The test uses the guarded migration-test harness to create and drop a uniquely
named localhost database. Normal unit runs leave it skipped.
"""

from __future__ import annotations

import asyncio
import os
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any
from uuid import UUID, uuid4

import pytest
from fastcrud.exceptions.http_exceptions import CustomException
from sqlalchemy import insert, select, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from src.app.core.authorization import CanonicalRoleCode
from src.app.core.local_persona_fixtures import (
    LOCAL_ALPHA_WORKSPACE,
    LOCAL_PERSONA_FIXTURES,
)
from src.app.models.audit_log import AuditLog
from src.app.models.department import Department
from src.app.models.rp_application import RPApplication
from src.app.models.user import User
from src.app.models.workspace import Workspace
from src.app.schemas.rp_application import AccessibleRPApplicationDepartmentAssignRequest
from src.app.services.authorization_service import (
    AUTHORIZATION_STATE_KEY,
    AuthorizationService,
)
from src.app.services.local_persona_seed_service import (
    LocalPersonaSeedGate,
    LocalPersonaSeedService,
)
from src.app.services.rp_application_service import RPApplicationService
from tests.test_four_role_migrations_postgres import (
    TemporaryPostgresDatabase,
    _temporary_postgres_database,
)

RUN_ENV = "RUN_RP_APPLICATION_DEPARTMENT_CONCURRENCY_POSTGRES_TESTS"

pytestmark = pytest.mark.skipif(
    os.getenv(RUN_ENV) != "1",
    reason=(f"set {RUN_ENV}=1 and FOUR_ROLE_POSTGRES_ADMIN_URL to run the disposable department-assignment concurrency test"),
)


@dataclass(frozen=True, slots=True)
class _Context:
    application_uuid: UUID
    department_uuids: tuple[UUID, UUID]
    current_user: dict[str, Any]


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

    application_uuid = uuid4()
    async with session_factory.begin() as db:
        actor = (await db.scalars(select(User).where(User.uuid == LOCAL_PERSONA_FIXTURES[0].user_uuid))).one()
        target = (await db.scalars(select(User).where(User.uuid == LOCAL_PERSONA_FIXTURES[-1].user_uuid))).one()
        workspace = (await db.scalars(select(Workspace).where(Workspace.uuid == LOCAL_ALPHA_WORKSPACE.uuid))).one()
        departments = list((await db.scalars(select(Department).where(Department.is_deleted.is_(False)).order_by(Department.id).limit(2))).all())
        assert len(departments) == 2

        await AuthorizationService().assign_partner_role(
            db,
            target_user_id=target.id,
            workspace_id=workspace.id,
            role=CanonicalRoleCode.RP_USER_EDIT,
            assigned_by_user_id=actor.id,
        )
        await db.execute(
            insert(RPApplication).values(
                uuid=application_uuid,
                workspace_id=workspace.id,
                department_id=None,
                dnr_app_name="Department assignment concurrency fixture",
                created_by=actor.id,
                created_at=datetime.now(UTC),
                is_deleted=False,
            )
        )

        target_id = target.id
        target_uuid = target.uuid
        target_name = target.name
        target_email = target.email
        department_uuids = (departments[0].uuid, departments[1].uuid)

    async with session_factory() as db:
        authorization_state = await AuthorizationService().resolve_for_user(
            db,
            user_id=target_id,
        )

    return _Context(
        application_uuid=application_uuid,
        department_uuids=department_uuids,
        current_user={
            "id": target_id,
            "uuid": target_uuid,
            "name": target_name,
            "email": target_email,
            AUTHORIZATION_STATE_KEY: authorization_state,
        },
    )


async def _exercise(
    database: TemporaryPostgresDatabase,
) -> None:
    engine = create_async_engine(
        database.sync_url.set(drivername="postgresql+asyncpg"),
        pool_pre_ping=True,
    )
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    try:
        context = await _seed_context(session_factory)
        barrier = asyncio.Barrier(2)
        backend_pids: set[int] = set()

        async def assign(department_uuid: UUID) -> dict[str, Any]:
            async with session_factory() as db:
                backend_pid = await db.scalar(text("SELECT pg_backend_pid()"))
                assert backend_pid is not None
                backend_pids.add(int(backend_pid))
                await barrier.wait()
                return await RPApplicationService().assign_accessible_rp_application_department(
                    db=db,
                    rp_application_uuid=context.application_uuid,
                    current_user=context.current_user,
                    payload=AccessibleRPApplicationDepartmentAssignRequest(
                        department_uuid=department_uuid,
                    ),
                )

        results = list(
            await asyncio.gather(
                *(assign(department_uuid) for department_uuid in context.department_uuids),
                return_exceptions=True,
            )
        )
        successes = [result for result in results if not isinstance(result, BaseException)]
        failures = [result for result in results if isinstance(result, BaseException)]
        assert len(backend_pids) == 2
        assert len(successes) == 1, results
        assert len(failures) == 1, results
        assert isinstance(failures[0], CustomException)
        assert failures[0].status_code == 409

        async with session_factory() as db:
            application = (
                await db.scalars(
                    select(RPApplication).where(
                        RPApplication.uuid == context.application_uuid,
                    )
                )
            ).one()
            audits = list(
                (
                    await db.scalars(
                        select(AuditLog).where(
                            AuditLog.target_uuid == context.application_uuid,
                            AuditLog.operation == "UPDATE",
                        )
                    )
                ).all()
            )

        assert application.department_id == successes[0]["departmentId"]
        assert application.updated_at is not None
        assert len(audits) == 1
    finally:
        await engine.dispose()


def test_department_assignment_concurrency_postgres() -> None:
    with _temporary_postgres_database() as database:
        database.run_alembic("upgrade", "head")
        asyncio.run(_exercise(database))
