"""Opt-in PostgreSQL execution tests for the four-role migration chain.

These tests create and remove only uniquely named local databases. They are
skipped unless both ``RUN_FOUR_ROLE_POSTGRES_TESTS=1`` and a local
``FOUR_ROLE_POSTGRES_ADMIN_URL`` are provided.
"""

from __future__ import annotations

import json
import os
import re
import subprocess
import sys
from collections.abc import Iterator
from contextlib import contextmanager
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from pathlib import Path
from uuid import UUID, uuid4

import pytest
from alembic.config import Config
from alembic.script import ScriptDirectory
from sqlalchemy import Engine, create_engine, inspect, text
from sqlalchemy.engine import URL, make_url
from sqlalchemy.exc import DBAPIError, IntegrityError
from sqlalchemy.pool import NullPool

from src.migrations.rp_configuration_hierarchy_reconciliation_v1 import (
    build_candidate_manifest as build_hierarchy_candidate_manifest,
)
from src.migrations.rp_configuration_hierarchy_reconciliation_v1 import (
    build_report as build_hierarchy_report,
)
from src.migrations.rp_configuration_hierarchy_reconciliation_v1 import (
    load_snapshot as load_hierarchy_snapshot,
)
from src.scripts.reconcile_four_role_authorization import (
    build_candidate_manifest,
    build_report,
    load_snapshot,
)

RUN_ENV = "RUN_FOUR_ROLE_POSTGRES_TESTS"
ADMIN_URL_ENV = "FOUR_ROLE_POSTGRES_ADMIN_URL"
MANIFEST_ENV = "FOUR_ROLE_BACKFILL_MANIFEST"
HIERARCHY_MANIFEST_ENV = "RP_HIERARCHY_BACKFILL_MANIFEST"
EXPECTED_HEAD = "0032_partner_environment"
BASELINE_REVISION = "0018_application_information_review_records"
BACKEND_ROOT = Path(__file__).parents[1]
BACKEND_SRC = BACKEND_ROOT / "src"
ALEMBIC_CONFIG = BACKEND_SRC / "alembic.ini"
LOCAL_POSTGRES_HOSTS = frozenset({"127.0.0.1", "localhost", "::1"})
TEMP_DATABASE_PATTERN = re.compile(r"^four_role_migration_[0-9]+_[0-9a-f]{12}$")

pytestmark = pytest.mark.skipif(
    os.getenv(RUN_ENV) != "1",
    reason=f"set {RUN_ENV}=1 and {ADMIN_URL_ENV} to run disposable PostgreSQL migration tests",
)


@dataclass(frozen=True, slots=True)
class TemporaryPostgresDatabase:
    admin_url: URL
    database_name: str

    @property
    def sync_url(self) -> URL:
        return self.admin_url.set(
            drivername="postgresql+psycopg2",
            database=self.database_name,
        )

    def connect(self) -> Engine:
        return create_engine(self.sync_url, poolclass=NullPool)

    def run_alembic(
        self,
        operation: str,
        revision: str,
        *,
        manifest_path: Path | None = None,
        hierarchy_manifest_path: Path | None = None,
        expected_failure: str | None = None,
    ) -> None:
        if operation not in {"upgrade", "downgrade"}:
            raise ValueError("unsupported Alembic operation")
        if revision != "head" and re.fullmatch(r"[0-9]{4}_[a-z0-9_]+", revision) is None:
            raise ValueError("unsafe Alembic revision")

        environment = os.environ.copy()
        environment.update(
            {
                "POSTGRES_USER": self.admin_url.username or "",
                "POSTGRES_PASSWORD": self.admin_url.password or "",
                "POSTGRES_SERVER": self.admin_url.host or "",
                "POSTGRES_PORT": str(self.admin_url.port or 5432),
                "POSTGRES_DB": self.database_name,
                "POSTGRES_ASYNC_PREFIX": "postgresql+asyncpg://",
            }
        )
        environment.pop(MANIFEST_ENV, None)
        environment.pop(HIERARCHY_MANIFEST_ENV, None)
        if manifest_path is not None:
            environment[MANIFEST_ENV] = str(manifest_path)
        if hierarchy_manifest_path is not None:
            environment[HIERARCHY_MANIFEST_ENV] = str(hierarchy_manifest_path)

        result = subprocess.run(
            [
                sys.executable,
                "-m",
                "alembic",
                "-c",
                str(ALEMBIC_CONFIG),
                operation,
                revision,
            ],
            cwd=BACKEND_SRC,
            env=environment,
            capture_output=True,
            check=False,
            text=True,
            timeout=180,
        )
        combined_output = f"{result.stdout}\n{result.stderr}"
        if expected_failure is not None:
            if result.returncode == 0:
                pytest.fail(f"Alembic {operation} {revision} unexpectedly succeeded for disposable database {self.database_name}")
            assert expected_failure in combined_output
            return
        if result.returncode != 0:
            pytest.fail(
                f"Alembic {operation} {revision} failed for disposable database "
                f"{self.database_name}:\n{result.stdout[-4000:]}\n{result.stderr[-4000:]}"
            )


def _configured_admin_url() -> URL:
    raw_url = os.getenv(ADMIN_URL_ENV)
    if not raw_url:
        pytest.fail(f"{ADMIN_URL_ENV} is required when {RUN_ENV}=1")
    try:
        admin_url = make_url(raw_url)
    except Exception as exc:  # pragma: no cover - SQLAlchemy owns URL parsing details
        pytest.fail(f"{ADMIN_URL_ENV} is not a valid SQLAlchemy URL: {exc}")
    if not admin_url.drivername.startswith("postgresql"):
        pytest.fail(f"{ADMIN_URL_ENV} must use PostgreSQL")
    if admin_url.host not in LOCAL_POSTGRES_HOSTS:
        pytest.fail(f"{ADMIN_URL_ENV} must target localhost")
    if not admin_url.database:
        pytest.fail(f"{ADMIN_URL_ENV} must include an existing administrative database")
    if not admin_url.username:
        pytest.fail(f"{ADMIN_URL_ENV} must include a test database user")
    return admin_url.set(drivername="postgresql+psycopg2")


@contextmanager
def _temporary_postgres_database() -> Iterator[TemporaryPostgresDatabase]:
    admin_url = _configured_admin_url()
    database_name = f"four_role_migration_{os.getpid()}_{uuid4().hex[:12]}"
    assert TEMP_DATABASE_PATTERN.fullmatch(database_name)
    database = TemporaryPostgresDatabase(
        admin_url=admin_url,
        database_name=database_name,
    )
    admin_engine = create_engine(
        admin_url,
        isolation_level="AUTOCOMMIT",
        poolclass=NullPool,
    )
    quoted_name = admin_engine.dialect.identifier_preparer.quote(database_name)
    created = False
    try:
        with admin_engine.connect() as connection:
            connection.exec_driver_sql(f"CREATE DATABASE {quoted_name}")
        created = True
        yield database
    finally:
        if created:
            with admin_engine.connect() as connection:
                connection.execute(
                    text("SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = :database_name AND pid <> pg_backend_pid()"),
                    {"database_name": database_name},
                )
                connection.exec_driver_sql(f"DROP DATABASE {quoted_name}")
        admin_engine.dispose()


def _current_revision(engine: Engine) -> str:
    with engine.connect() as connection:
        return str(connection.execute(text("SELECT version_num FROM alembic_version")).scalar_one())


def _script_heads() -> list[str]:
    config = Config(str(ALEMBIC_CONFIG))
    config.set_main_option("script_location", str(BACKEND_SRC / "migrations"))
    return ScriptDirectory.from_config(config).get_heads()


def _insert_user(
    connection,
    *,
    email: str,
    user_uuid: UUID,
    is_superuser: bool,
    role_ids: list[int] | None,
) -> int:
    return int(
        connection.execute(
            text(
                """
                INSERT INTO "user" (
                    name, username, email, profile_image_url, uuid, created_at,
                    updated_at, last_login_at, deleted_at, is_deleted,
                    is_superuser, enabled, department_id, tier_id, role_ids
                ) VALUES (
                    :name, :email, :email, :profile_image_url, :uuid, :created_at,
                    NULL, NULL, NULL, FALSE, :is_superuser, TRUE, NULL, NULL,
                    CAST(:role_ids AS json)
                )
                RETURNING id
                """
            ),
            {
                "name": email.split("@", maxsplit=1)[0],
                "email": email,
                "profile_image_url": "https://example.invalid/profile.png",
                "uuid": user_uuid,
                "created_at": datetime.now(UTC),
                "is_superuser": is_superuser,
                "role_ids": json.dumps(role_ids) if role_ids is not None else None,
            },
        ).scalar_one()
    )


def _populate_0018_fixture(engine: Engine) -> dict[str, object]:
    fixture: dict[str, object] = {
        "admin_user_uuid": uuid4(),
        "partner_user_uuid": uuid4(),
        "other_user_uuid": uuid4(),
        "workspace_uuid": uuid4(),
        "application_information_uuid": uuid4(),
        "membership_uuid": uuid4(),
        "application_uuid": uuid4(),
        "accepted_invitation_uuid": uuid4(),
        "pending_invitation_uuid": uuid4(),
        "legacy_revoked_invitation_uuid": uuid4(),
        "grant_uuid": uuid4(),
        "legacy_revoked_grant_uuid": uuid4(),
    }
    now = datetime.now(UTC)
    legacy_revoked_created_at = now - timedelta(days=2)
    legacy_revoked_updated_at = now - timedelta(days=1)
    fixture["legacy_revoked_at_source"] = legacy_revoked_updated_at
    with engine.begin() as connection:
        admin_role_id = int(connection.execute(text("SELECT id FROM role WHERE name = 'admin' AND is_deleted = FALSE")).scalar_one())
        admin_user_id = _insert_user(
            connection,
            email="migration-admin@example.gc.ca",
            user_uuid=fixture["admin_user_uuid"],
            is_superuser=True,
            role_ids=[admin_role_id],
        )
        partner_user_id = _insert_user(
            connection,
            email="migration-partner@example.gc.ca",
            user_uuid=fixture["partner_user_uuid"],
            is_superuser=False,
            role_ids=None,
        )
        other_user_id = _insert_user(
            connection,
            email="migration-other@example.gc.ca",
            user_uuid=fixture["other_user_uuid"],
            is_superuser=False,
            role_ids=None,
        )
        department_id = int(connection.execute(text("SELECT id FROM department WHERE is_deleted = FALSE ORDER BY id LIMIT 1")).scalar_one())
        workspace_id = int(
            connection.execute(
                text(
                    """
                    INSERT INTO workspace (
                        name, slug, department_id, created_by, uuid, description,
                        created_at, updated_at, deleted_at, is_deleted
                    ) VALUES (
                        'Four-role migration workspace',
                        :slug,
                        :department_id,
                        :created_by,
                        :uuid,
                        'Disposable migration fixture',
                        :created_at,
                        NULL,
                        NULL,
                        FALSE
                    )
                    RETURNING id
                    """
                ),
                {
                    "slug": f"four-role-{uuid4().hex[:12]}",
                    "department_id": department_id,
                    "created_by": admin_user_id,
                    "uuid": fixture["workspace_uuid"],
                    "created_at": now,
                },
            ).scalar_one()
        )
        connection.execute(
            text(
                """
                INSERT INTO workspace_member (
                    workspace_id, user_id, invited_by, uuid, role,
                    created_at, deleted_at, is_deleted
                ) VALUES (
                    :workspace_id, :user_id, :invited_by, :uuid,
                    'workspace_member', :created_at, NULL, FALSE
                )
                """
            ),
            {
                "workspace_id": workspace_id,
                "user_id": other_user_id,
                "invited_by": admin_user_id,
                "uuid": fixture["membership_uuid"],
                "created_at": now,
            },
        )
        application_information_id = int(
            connection.execute(
                text(
                    """
                    INSERT INTO application_information (
                        workspace_id, created_by, uuid, service_name_en,
                        service_name_fr, overview, technology_and_protocol,
                        security_and_privacy, usage,
                        migration_or_transition_plan, created_at, updated_at,
                        deleted_at, is_deleted
                    ) VALUES (
                        :workspace_id, :created_by, :uuid,
                        'Four-role migration service',
                        'Service de migration quatre rôles',
                        'Disposable overview', 'OIDC', 'Protected B',
                        'Disposable usage', 'Disposable plan', :created_at,
                        NULL, NULL, FALSE
                    )
                    RETURNING id
                    """
                ),
                {
                    "workspace_id": workspace_id,
                    "created_by": admin_user_id,
                    "uuid": fixture["application_information_uuid"],
                    "created_at": now,
                },
            ).scalar_one()
        )
        application_id = int(
            connection.execute(
                text(
                    """
                    INSERT INTO rp_application (
                        department_id, dnr_app_name, created_by, uuid,
                        created_at, updated_at, deleted_at, is_deleted,
                        workspace_id, application_information_id,
                        canada_login_environment
                    ) VALUES (
                        :department_id, 'Four-role migration RP', :created_by,
                        :uuid, :created_at, NULL, NULL, FALSE, :workspace_id,
                        :application_information_id, 'test'
                    )
                    RETURNING id
                    """
                ),
                {
                    "department_id": department_id,
                    "created_by": admin_user_id,
                    "uuid": fixture["application_uuid"],
                    "created_at": now,
                    "workspace_id": workspace_id,
                    "application_information_id": application_information_id,
                },
            ).scalar_one()
        )
        connection.execute(
            text(
                """
                INSERT INTO rp_application_developer_invitation (
                    workspace_id, rp_application_id, invited_email, token_hash,
                    invite_expires_at, invited_by, role, status, accepted_at,
                    revoked_at, gc_notify_notification_id,
                    delegated_by_grant_uuid, uuid, created_at, updated_at,
                    deleted_at, is_deleted
                ) VALUES (
                    :workspace_id, :application_id,
                    'legacy-revoked@example.gc.ca', :token_hash,
                    :invite_expires_at, :invited_by, 'Read Only', 'revoked',
                    NULL, :revoked_at, NULL, NULL, :uuid, :created_at,
                    :updated_at, NULL, FALSE
                )
                """
            ),
            {
                "workspace_id": workspace_id,
                "application_id": application_id,
                "token_hash": uuid4().hex,
                "invite_expires_at": now + timedelta(days=1),
                "invited_by": admin_user_id,
                "revoked_at": now,
                "uuid": fixture["legacy_revoked_invitation_uuid"],
                "created_at": now - timedelta(days=1),
                "updated_at": now,
            },
        )
        connection.execute(
            text(
                """
                INSERT INTO rp_application_developer_invitation (
                    workspace_id, rp_application_id, invited_email, token_hash,
                    invite_expires_at, invited_by, role, status, accepted_at,
                    revoked_at, gc_notify_notification_id,
                    delegated_by_grant_uuid, uuid, created_at, updated_at,
                    deleted_at, is_deleted
                ) VALUES (
                    :workspace_id, :application_id, :invited_email, :token_hash,
                    :invite_expires_at, :invited_by, 'RP User (Edit)', 'accepted',
                    :accepted_at, NULL, NULL, NULL, :uuid, :created_at, NULL,
                    NULL, FALSE
                )
                """
            ),
            {
                "workspace_id": workspace_id,
                "application_id": application_id,
                "invited_email": "migration-partner@example.gc.ca",
                "token_hash": uuid4().hex,
                "invite_expires_at": now + timedelta(days=7),
                "invited_by": admin_user_id,
                "accepted_at": now,
                "uuid": fixture["accepted_invitation_uuid"],
                "created_at": now,
            },
        )
        connection.execute(
            text(
                """
                INSERT INTO rp_application_access_grant (
                    workspace_id, user_id, role, status,
                    source_invitation_uuid, uuid, created_at, updated_at,
                    deleted_at, is_deleted
                ) VALUES (
                    :workspace_id, :user_id, 'Read Only', 'revoked',
                    NULL, :uuid, :created_at, :updated_at, NULL, FALSE
                )
                """
            ),
            {
                "workspace_id": workspace_id,
                "user_id": other_user_id,
                "uuid": fixture["legacy_revoked_grant_uuid"],
                "created_at": legacy_revoked_created_at,
                "updated_at": legacy_revoked_updated_at,
            },
        )
        connection.execute(
            text(
                """
                INSERT INTO rp_application_access_grant (
                    workspace_id, user_id, role, status,
                    source_invitation_uuid, uuid, created_at, updated_at,
                    deleted_at, is_deleted
                ) VALUES (
                    :workspace_id, :user_id, 'RP User (Edit)', 'active',
                    :source_invitation_uuid, :uuid, :created_at, NULL,
                    NULL, FALSE
                )
                """
            ),
            {
                "workspace_id": workspace_id,
                "user_id": partner_user_id,
                "source_invitation_uuid": fixture["accepted_invitation_uuid"],
                "uuid": fixture["grant_uuid"],
                "created_at": now,
            },
        )
        connection.execute(
            text(
                """
                INSERT INTO rp_application_developer_invitation (
                    workspace_id, rp_application_id, invited_email, token_hash,
                    invite_expires_at, invited_by, role, status, accepted_at,
                    revoked_at, gc_notify_notification_id,
                    delegated_by_grant_uuid, uuid, created_at, updated_at,
                    deleted_at, is_deleted
                ) VALUES (
                    :workspace_id, :application_id, ' Staff@Example.GC.CA ',
                    :token_hash, :invite_expires_at, :invited_by, 'Read Only',
                    'pending', NULL, NULL, NULL, :delegated_by_grant_uuid,
                    :uuid, :created_at, NULL, NULL, FALSE
                )
                """
            ),
            {
                "workspace_id": workspace_id,
                "application_id": application_id,
                "token_hash": uuid4().hex,
                "invite_expires_at": now + timedelta(days=7),
                "invited_by": admin_user_id,
                "delegated_by_grant_uuid": fixture["grant_uuid"],
                "uuid": fixture["pending_invitation_uuid"],
                "created_at": now,
            },
        )

    fixture.update(
        {
            "admin_role_id": admin_role_id,
            "admin_user_id": admin_user_id,
            "partner_user_id": partner_user_id,
            "other_user_id": other_user_id,
            "workspace_id": workspace_id,
            "application_id": application_id,
            "application_information_id": application_information_id,
        }
    )
    return fixture


def _write_reviewed_manifest(
    tmp_path: Path,
    engine: Engine,
) -> Path:
    manifest_path = tmp_path / "four-role-reviewed-test-manifest.json"
    with engine.connect() as connection:
        report = build_report(load_snapshot(connection))
    manifest = build_candidate_manifest(report)
    manifest.update(
        reviewed=True,
        reviewReference="TEST-ONLY-LOCAL-MIGRATION-HARNESS",
        clAdminAssignments=[],
        workspaceMemberDispositions=[],
    )
    manifest_path.write_text(
        json.dumps(manifest, indent=2, sort_keys=True),
        encoding="utf-8",
    )
    return manifest_path


def _write_reviewed_hierarchy_manifest(
    tmp_path: Path,
    engine: Engine,
    *,
    application_uuid: UUID,
    canada_login_environment: str,
) -> Path:
    manifest_path = tmp_path / "rp-hierarchy-reviewed-test-manifest.json"
    with engine.connect() as connection:
        report = build_hierarchy_report(load_hierarchy_snapshot(connection))
    manifest = build_hierarchy_candidate_manifest(report)
    manifest.update(
        reviewed=True,
        reviewReference="TEST-ONLY-LOCAL-HIERARCHY-MAP",
    )
    for mapping in manifest["mappings"]:
        mapping["applicationUuid"] = str(application_uuid)
        mapping["canadaLoginEnvironment"] = canada_login_environment
    manifest_path.write_text(
        json.dumps(manifest, indent=2, sort_keys=True),
        encoding="utf-8",
    )
    return manifest_path


def _insert_0019_compatibility_rows(engine: Engine, fixture: dict[str, object]) -> None:
    """Prove expansion accepts exact legacy labels before canonical cutover."""

    now = datetime.now(UTC)
    with engine.begin() as connection:
        connection.execute(
            text(
                """
                INSERT INTO rp_application_access_grant (
                    workspace_id, user_id, role, status,
                    source_invitation_uuid, uuid, created_at, updated_at,
                    deleted_at, is_deleted, revoked_at, revoked_by_user_id
                ) VALUES (
                    :workspace_id, :user_id, 'Read Only', 'revoked',
                    NULL, :uuid, :created_at, NULL, NULL, FALSE,
                    :revoked_at, NULL
                )
                """
            ),
            {
                "workspace_id": fixture["workspace_id"],
                "user_id": fixture["other_user_id"],
                "uuid": uuid4(),
                "created_at": now,
                "revoked_at": now,
            },
        )
        connection.execute(
            text(
                """
                INSERT INTO rp_application_developer_invitation (
                    workspace_id, rp_application_id, invited_email, token_hash,
                    invite_expires_at, invited_by, role, status, accepted_at,
                    revoked_at, gc_notify_notification_id,
                    delegated_by_grant_uuid, revocation_reason,
                    replaced_by_invitation_uuid, uuid, created_at, updated_at,
                    deleted_at, is_deleted
                ) VALUES (
                    :workspace_id, :application_id,
                    'compatibility-expired@example.gc.ca', :token_hash,
                    :invite_expires_at, :invited_by, 'RP Admin', 'expired',
                    NULL, NULL, NULL, NULL, NULL, NULL, :uuid,
                    :created_at, NULL, NULL, FALSE
                )
                """
            ),
            {
                "workspace_id": fixture["workspace_id"],
                "application_id": fixture["application_id"],
                "token_hash": uuid4().hex,
                "invite_expires_at": now - timedelta(days=1),
                "invited_by": fixture["admin_user_id"],
                "uuid": uuid4(),
                "created_at": now - timedelta(days=2),
            },
        )


def _logical_four_role_state(engine: Engine) -> dict[str, object]:
    with engine.connect() as connection:
        return {
            "revision": _current_revision(engine),
            "role_codes": connection.execute(text("SELECT name, code FROM role ORDER BY name")).all(),
            "user_roles": connection.execute(
                text(
                    """
                    SELECT u.uuid, r.code, ur.status, ur.assignment_source
                    FROM user_role AS ur
                    JOIN "user" AS u ON u.id = ur.user_id
                    JOIN role AS r ON r.id = ur.role_id
                    ORDER BY u.uuid, r.code
                    """
                )
            ).all(),
            "grants": connection.execute(
                text(
                    """
                    SELECT uuid, role, status, source_invitation_uuid,
                           revoked_at, revoked_by_user_id
                    FROM rp_application_access_grant
                    ORDER BY uuid
                    """
                )
            ).all(),
            "invitations": connection.execute(
                text(
                    """
                    SELECT uuid, role, status, delegated_by_grant_uuid,
                           revocation_reason, replaced_by_invitation_uuid
                    FROM rp_application_developer_invitation
                    ORDER BY uuid
                    """
                )
            ).all(),
            "workspace_members": connection.execute(text("SELECT uuid, role, is_deleted FROM workspace_member ORDER BY uuid")).all(),
        }


def _assert_integrity_error(engine: Engine, statement: str, parameters: dict[str, object]) -> None:
    with pytest.raises(IntegrityError), engine.begin() as connection:
        connection.execute(text(statement), parameters)


def _assert_database_rejection(
    engine: Engine,
    statement: str,
    parameters: dict[str, object],
    *,
    expected_sqlstate: str,
    expected_message: str,
) -> None:
    """Assert a deliberate PostgreSQL rejection, including trigger exceptions."""
    with pytest.raises(DBAPIError) as caught, engine.begin() as connection:
        connection.execute(text(statement), parameters)

    original_error = caught.value.orig
    sqlstate = getattr(original_error, "sqlstate", None) or getattr(
        original_error,
        "pgcode",
        None,
    )
    assert sqlstate == expected_sqlstate
    assert expected_message in str(original_error)


def _assert_post_migration_state(engine: Engine, fixture: dict[str, object]) -> None:
    assert _current_revision(engine) == EXPECTED_HEAD
    inspector = inspect(engine)
    user_columns = {column["name"] for column in inspector.get_columns("user")}
    role_columns = {column["name"] for column in inspector.get_columns("role")}
    invitation_columns = {column["name"] for column in inspector.get_columns("rp_application_developer_invitation")}
    assert {"is_superuser", "role_ids"}.issubset(user_columns)
    assert "code" in role_columns
    assert "user_role" in inspector.get_table_names()
    assert "revoked_by_user_id" in invitation_columns
    assert "revocation_actor_source" in invitation_columns
    audit_indexes = {item["name"] for item in inspector.get_indexes("audit_log")}
    assert {
        "ix_audit_log_created_at",
        "ix_audit_log_target_uuid_created_at",
        "ix_audit_log_target_operation_created_at",
    }.issubset(audit_indexes)

    with engine.connect() as connection:
        assert (
            connection.execute(
                text(
                    "SELECT COUNT(*) FROM role WHERE code = 'cl_admin' AND uuid = '03caa6a0-9095-5e62-9cf6-7a0f0f73c49b'::uuid AND is_deleted = FALSE"
                )
            ).scalar_one()
            == 1
        )
        assert (
            connection.execute(
                text(
                    """
                SELECT COUNT(*)
                FROM user_role AS ur
                JOIN role AS r ON r.id = ur.role_id
                WHERE ur.user_id = :user_id
                  AND r.code = 'cl_admin'
                  AND ur.status = 'active'
                """
                ),
                {"user_id": fixture["admin_user_id"]},
            ).scalar_one()
            == 0
        )
        grant = connection.execute(
            text(
                """
                SELECT role, status, source_invitation_uuid
                FROM rp_application_access_grant
                WHERE uuid = :uuid
                """
            ),
            {"uuid": fixture["grant_uuid"]},
        ).one()
        assert tuple(grant) == (
            "rp_user_edit",
            "active",
            fixture["accepted_invitation_uuid"],
        )
        legacy_revoked_grant = connection.execute(
            text(
                """
                SELECT role, status, revoked_at, revoked_by_user_id
                FROM rp_application_access_grant
                WHERE uuid = :uuid
                """
            ),
            {"uuid": fixture["legacy_revoked_grant_uuid"]},
        ).one()
        assert tuple(legacy_revoked_grant) == (
            "read_only",
            "revoked",
            fixture["legacy_revoked_at_source"],
            None,
        )
        invitation_rows = connection.execute(
            text(
                """
                SELECT uuid, role, status, delegated_by_grant_uuid,
                       revoked_by_user_id, revocation_actor_source
                FROM rp_application_developer_invitation
                ORDER BY uuid
                """
            )
        ).all()
        assert {row.role for row in invitation_rows}.issubset({"rp_admin", "rp_user_edit", "read_only"})
        pending = next(row for row in invitation_rows if row.status == "pending")
        assert pending.delegated_by_grant_uuid == fixture["grant_uuid"]
        assert all(row.revoked_by_user_id is None for row in invitation_rows)
        legacy_revoked = next(row for row in invitation_rows if row.uuid == fixture["legacy_revoked_invitation_uuid"])
        assert legacy_revoked.revocation_actor_source == "legacy_unknown"
        assert all(row.revocation_actor_source is None for row in invitation_rows if row.status != "revoked")
        assert (
            connection.execute(
                text("SELECT COUNT(*) FROM workspace_member WHERE uuid = :uuid"),
                {"uuid": fixture["membership_uuid"]},
            ).scalar_one()
            == 1
        )
        assert (
            connection.execute(
                text(
                    """
                    SELECT COUNT(*)
                    FROM rp_application_access_grant
                    WHERE workspace_id = :workspace_id
                      AND user_id = :user_id
                      AND status = 'active'
                      AND is_deleted = FALSE
                    """
                ),
                {
                    "workspace_id": fixture["workspace_id"],
                    "user_id": fixture["other_user_id"],
                },
            ).scalar_one()
            == 0
        )
        assert connection.execute(text("SELECT COUNT(*) FROM role WHERE code IS NULL")).scalar_one() >= 1
        provenance = connection.execute(
            text(
                """
                SELECT description
                FROM audit_log
                WHERE target = 'authorization_model'
                  AND operation = 'auth_migrate'
                ORDER BY created_at DESC
                LIMIT 1
                """
            )
        ).scalar_one()
        decision = json.loads(provenance)
        assert decision["snapshotSha256"]
        assert decision["manifestSha256"]
        assert decision["decisionCounts"] == {
            "clAdminAssignments": 0,
            "workspaceGrants": 0,
            "workspaceQuarantines": 0,
        }


def _assert_database_constraints(engine: Engine, fixture: dict[str, object]) -> None:
    now = datetime.now(UTC)
    common_grant = {
        "workspace_id": fixture["workspace_id"],
        "user_id": fixture["other_user_id"],
        "uuid": uuid4(),
        "created_at": now,
    }
    grant_insert = """
        INSERT INTO rp_application_access_grant (
            workspace_id, user_id, role, status, source_invitation_uuid,
            uuid, created_at, updated_at, deleted_at, is_deleted,
            revoked_at, revoked_by_user_id
        ) VALUES (
            :workspace_id, :user_id, :role, :status, :source_invitation_uuid,
            :uuid, :created_at, NULL, :deleted_at, :is_deleted,
            :revoked_at, :revoked_by_user_id
        )
    """
    for overrides in (
        {"role": "owner", "status": "active"},
        {"role": "RP Admin", "status": "active"},
        {"role": "read_only", "status": "pending"},
        {
            "role": "read_only",
            "status": "active",
            "is_deleted": True,
            "deleted_at": now,
        },
        {"role": "read_only", "status": "revoked", "revoked_at": None},
    ):
        parameters = {
            **common_grant,
            "uuid": uuid4(),
            "role": "read_only",
            "status": "active",
            "source_invitation_uuid": None,
            "deleted_at": None,
            "is_deleted": False,
            "revoked_at": None,
            "revoked_by_user_id": None,
            **overrides,
        }
        _assert_integrity_error(engine, grant_insert, parameters)

    _assert_integrity_error(
        engine,
        grant_insert,
        {
            **common_grant,
            "uuid": uuid4(),
            "role": "read_only",
            "status": "active",
            "source_invitation_uuid": fixture["accepted_invitation_uuid"],
            "deleted_at": None,
            "is_deleted": False,
            "revoked_at": None,
            "revoked_by_user_id": None,
        },
    )
    _assert_integrity_error(
        engine,
        grant_insert,
        {
            **common_grant,
            "uuid": uuid4(),
            "role": "read_only",
            "status": "active",
            "source_invitation_uuid": uuid4(),
            "deleted_at": None,
            "is_deleted": False,
            "revoked_at": None,
            "revoked_by_user_id": None,
        },
    )
    _assert_integrity_error(
        engine,
        grant_insert,
        {
            **common_grant,
            "user_id": fixture["partner_user_id"],
            "uuid": uuid4(),
            "role": "read_only",
            "status": "active",
            "source_invitation_uuid": None,
            "deleted_at": None,
            "is_deleted": False,
            "revoked_at": None,
            "revoked_by_user_id": None,
        },
    )

    invitation_insert = """
        INSERT INTO rp_application_developer_invitation (
            workspace_id, rp_application_id, invited_email, token_hash,
            invite_expires_at, invited_by, role, status, accepted_at,
            revoked_at, gc_notify_notification_id, delegated_by_grant_uuid,
            revocation_reason, replaced_by_invitation_uuid, uuid, created_at,
            updated_at, deleted_at, is_deleted
        ) VALUES (
            :workspace_id, :application_id, :invited_email, :token_hash,
            :invite_expires_at, :invited_by, :role, :status, :accepted_at,
            :revoked_at, NULL, :delegated_by_grant_uuid,
            :revocation_reason, :replaced_by_invitation_uuid, :uuid,
            :created_at, NULL, :deleted_at, :is_deleted
        )
    """
    common_invitation = {
        "workspace_id": fixture["workspace_id"],
        "application_id": fixture["application_id"],
        "invite_expires_at": now + timedelta(days=7),
        "invited_by": fixture["admin_user_id"],
        "delegated_by_grant_uuid": None,
        "revocation_reason": None,
        "replaced_by_invitation_uuid": None,
        "created_at": now,
        "deleted_at": None,
        "is_deleted": False,
        "accepted_at": None,
        "revoked_at": None,
    }
    invitation_cases = (
        {"role": "owner", "status": "pending"},
        {"role": "Read Only", "status": "pending"},
        {"role": "read_only", "status": "active"},
        {
            "role": "read_only",
            "status": "pending",
            "is_deleted": True,
            "deleted_at": now,
        },
        {"role": "read_only", "status": "revoked", "revoked_at": None},
        {
            "role": "read_only",
            "status": "pending",
            "replaced_by_invitation_uuid": fixture["accepted_invitation_uuid"],
        },
    )
    for index, overrides in enumerate(invitation_cases):
        _assert_integrity_error(
            engine,
            invitation_insert,
            {
                **common_invitation,
                "invited_email": f"invalid-{index}@example.gc.ca",
                "token_hash": uuid4().hex,
                "uuid": uuid4(),
                "role": "read_only",
                "status": "pending",
                **overrides,
            },
        )
    _assert_integrity_error(
        engine,
        invitation_insert,
        {
            **common_invitation,
            "invited_email": "  staff@example.gc.ca  ",
            "token_hash": uuid4().hex,
            "uuid": uuid4(),
            "role": "read_only",
            "status": "pending",
        },
    )

    with engine.connect() as connection:
        cl_admin_role_id = int(connection.execute(text("SELECT id FROM role WHERE code = 'cl_admin'")).scalar_one())
    user_role_insert = """
        INSERT INTO user_role (
            user_id, role_id, status, assignment_source, assigned_at,
            assigned_by_user_id, revoked_at, revoked_by_user_id,
            uuid, created_at, updated_at
        ) VALUES (
            :user_id, :role_id, :status, :assignment_source, :assigned_at,
            :assigned_by_user_id, :revoked_at, :revoked_by_user_id,
            :uuid, :created_at, NULL
        )
    """
    common_user_role = {
        "user_id": fixture["other_user_id"],
        "role_id": cl_admin_role_id,
        "assigned_at": now,
        "assigned_by_user_id": None,
        "revoked_at": None,
        "revoked_by_user_id": None,
        "created_at": now,
    }
    for overrides in (
        {"status": "pending", "assignment_source": "migration"},
        {"status": "active", "assignment_source": "inferred"},
        {"status": "active", "assignment_source": "admin"},
        {
            "status": "active",
            "assignment_source": "migration",
            "revoked_at": now,
        },
    ):
        _assert_integrity_error(
            engine,
            user_role_insert,
            {
                **common_user_role,
                "uuid": uuid4(),
                "status": "active",
                "assignment_source": "migration",
                **overrides,
            },
        )

    _assert_integrity_error(
        engine,
        """
        INSERT INTO role (
            name, description, uuid, created_at, updated_at,
            deleted_at, is_deleted, code
        ) VALUES (
            :name, NULL, :uuid, :created_at, NULL, NULL, FALSE, 'rp_admin'
        )
        """,
        {"name": f"Invalid coded role {uuid4().hex}", "uuid": uuid4(), "created_at": now},
    )
    with engine.begin() as connection:
        connection.execute(
            text(
                """
                INSERT INTO role (
                    name, description, uuid, created_at, updated_at,
                    deleted_at, is_deleted, code
                ) VALUES (
                    :name, 'Allowed uncoded legacy role', :uuid, :created_at,
                    NULL, NULL, FALSE, NULL
                )
                """
            ),
            {
                "name": f"Uncoded legacy role {uuid4().hex}",
                "uuid": uuid4(),
                "created_at": now,
            },
        )
    _assert_database_rejection(
        engine,
        "UPDATE role SET code = NULL WHERE code = 'cl_admin'",
        {},
        expected_sqlstate="P0001",
        expected_message="canonical role identity is immutable",
    )
    _assert_database_rejection(
        engine,
        "DELETE FROM role WHERE code = 'cl_admin'",
        {},
        expected_sqlstate="P0001",
        expected_message="canonical role definitions cannot be deleted",
    )
    _assert_integrity_error(
        engine,
        "DELETE FROM rp_application_developer_invitation WHERE uuid = :uuid",
        {"uuid": fixture["accepted_invitation_uuid"]},
    )
    _assert_integrity_error(
        engine,
        "DELETE FROM rp_application_access_grant WHERE uuid = :uuid",
        {"uuid": fixture["grant_uuid"]},
    )

    revocation_actor_uuid = uuid4()
    with engine.begin() as connection:
        revocation_actor_id = _insert_user(
            connection,
            email=f"revocation-actor-{revocation_actor_uuid.hex}@example.test",
            user_uuid=revocation_actor_uuid,
            is_superuser=False,
            role_ids=None,
        )
        connection.execute(
            text(
                """
                INSERT INTO rp_application_developer_invitation (
                    workspace_id, rp_application_id, invited_email, token_hash,
                    invite_expires_at, invited_by, role, status, accepted_at,
                    revoked_at, revoked_by_user_id, revocation_actor_source,
                    gc_notify_notification_id,
                    delegated_by_grant_uuid, revocation_reason,
                    replaced_by_invitation_uuid, uuid, created_at, updated_at,
                    deleted_at, is_deleted
                ) VALUES (
                    :workspace_id, :application_id, :invited_email, :token_hash,
                    :invite_expires_at, :invited_by, 'read_only', 'revoked', NULL,
                    :revoked_at, :revoked_by_user_id, 'user', NULL, NULL,
                    'revoked_by_authorized_actor', NULL, :uuid, :created_at,
                    :updated_at, NULL, FALSE
                )
                """
            ),
            {
                "workspace_id": fixture["workspace_id"],
                "application_id": fixture["application_id"],
                "invited_email": f"revoked-{revocation_actor_uuid.hex}@example.test",
                "token_hash": uuid4().hex,
                "invite_expires_at": now + timedelta(days=1),
                "invited_by": fixture["admin_user_id"],
                "revoked_at": now,
                "revoked_by_user_id": revocation_actor_id,
                "uuid": uuid4(),
                "created_at": now,
                "updated_at": now,
            },
        )
    _assert_integrity_error(
        engine,
        """
        UPDATE rp_application_developer_invitation
        SET revocation_actor_source = 'legacy_unknown'
        WHERE invited_email = :invited_email
        """,
        {"invited_email": (f"revoked-{revocation_actor_uuid.hex}@example.test")},
    )
    _assert_integrity_error(
        engine,
        'DELETE FROM "user" WHERE id = :user_id',
        {"user_id": revocation_actor_id},
    )


def test_clean_database_upgrade_reaches_the_single_head_without_manifest() -> None:
    assert _script_heads() == [EXPECTED_HEAD]
    with _temporary_postgres_database() as database:
        database.run_alembic("upgrade", "head")
        engine = database.connect()
        try:
            assert _current_revision(engine) == EXPECTED_HEAD
            configuration_name = {column["name"]: column for column in inspect(engine).get_columns("rp_application")}["configuration_name"]
            assert configuration_name["nullable"] is False
            assert configuration_name["type"].length == 128
            partner_environment = {column["name"]: column for column in inspect(engine).get_columns("rp_application")}["partner_environment"]
            assert partner_environment["nullable"] is True
            assert partner_environment["type"].length == 128
            rp_constraints = {constraint["name"]: constraint for constraint in inspect(engine).get_check_constraints("rp_application")}
            assert "partner_environment IS NULL" in rp_constraints["ck_rp_application_partner_environment_nonblank"]["sqltext"]
            source_configuration = {column["name"]: column for column in inspect(engine).get_columns("rp_application")}["source_rp_configuration_id"]
            assert source_configuration["nullable"] is True
            assert any(
                foreign_key["constrained_columns"] == ["source_rp_configuration_id"]
                and foreign_key["referred_table"] == "rp_application"
                and foreign_key["referred_columns"] == ["id"]
                for foreign_key in inspect(engine).get_foreign_keys("rp_application")
            )
            assert "ix_rp_application_source_rp_configuration_id" in {index["name"] for index in inspect(engine).get_indexes("rp_application")}
            contact_columns = {column["name"]: column for column in inspect(engine).get_columns("application_information_contact")}
            assert contact_columns["name_en"]["nullable"] is True
            assert contact_columns["name_fr"]["nullable"] is True
            assert contact_columns["first_name"]["type"].length == 100
            assert contact_columns["last_name"]["type"].length == 100
            assert contact_columns["alternate_phone_number"]["type"].length == 50
            assert contact_columns["identity_confirmed_at"]["nullable"] is True
            assert contact_columns["identity_confirmed_by"]["nullable"] is True
            assert any(
                foreign_key["constrained_columns"] == ["identity_confirmed_by"]
                and foreign_key["referred_table"] == "user"
                and foreign_key["referred_columns"] == ["id"]
                for foreign_key in inspect(engine).get_foreign_keys("application_information_contact")
            )
            assert "ix_application_information_contact_identity_confirmed_by" in {
                index["name"] for index in inspect(engine).get_indexes("application_information_contact")
            }
            with engine.connect() as connection:
                assert connection.execute(text("SELECT COUNT(*) FROM role WHERE code = 'cl_admin'")).scalar_one() == 1
                assert connection.execute(text("SELECT COUNT(*) FROM user_role")).scalar_one() == 0

            database.run_alembic("downgrade", "0026_rp_config_expand")
            assert _current_revision(engine) == "0026_rp_config_expand"
            downgraded_contact_columns = {column["name"]: column for column in inspect(engine).get_columns("application_information_contact")}
            assert downgraded_contact_columns["name_en"]["nullable"] is False
            assert downgraded_contact_columns["name_fr"]["nullable"] is False
            assert "first_name" not in downgraded_contact_columns
            assert "identity_confirmed_by" not in downgraded_contact_columns

            database.run_alembic("downgrade", "0025_workspace_invitations")
            assert _current_revision(engine) == "0025_workspace_invitations"
            assert "configuration_name" not in {column["name"] for column in inspect(engine).get_columns("rp_application")}
            assert "source_rp_configuration_id" not in {column["name"] for column in inspect(engine).get_columns("rp_application")}

            database.run_alembic("upgrade", "head")
            assert _current_revision(engine) == EXPECTED_HEAD
            assert "configuration_name" in {column["name"] for column in inspect(engine).get_columns("rp_application")}
            assert "source_rp_configuration_id" in {column["name"] for column in inspect(engine).get_columns("rp_application")}
            assert "partner_environment" in {column["name"] for column in inspect(engine).get_columns("rp_application")}
            assert "first_name" in {column["name"] for column in inspect(engine).get_columns("application_information_contact")}
        finally:
            engine.dispose()


def test_rp_hierarchy_constraints_reject_invalid_writes_and_recover_after_downgrade() -> None:
    with _temporary_postgres_database() as database:
        database.run_alembic("upgrade", "head")
        engine = database.connect()
        try:
            now = datetime.now(UTC)
            with engine.begin() as connection:
                department_id = int(connection.execute(text("SELECT id FROM department WHERE is_deleted = FALSE ORDER BY id LIMIT 1")).scalar_one())
                workspace_id = int(
                    connection.execute(
                        text(
                            """
                            INSERT INTO workspace (
                                name, slug, department_id, created_by, uuid,
                                description, created_at, updated_at,
                                deleted_at, is_deleted
                            ) VALUES (
                                'Constraint workspace', :slug, :department_id,
                                NULL, :uuid, 'Disposable constraint fixture',
                                :created_at, NULL, NULL, FALSE
                            ) RETURNING id
                            """
                        ),
                        {
                            "slug": f"constraint-{uuid4().hex[:12]}",
                            "department_id": department_id,
                            "uuid": uuid4(),
                            "created_at": now,
                        },
                    ).scalar_one()
                )
                application_id = int(
                    connection.execute(
                        text(
                            """
                            INSERT INTO application_information (
                                workspace_id, created_by, uuid, service_name_en,
                                service_name_fr, overview,
                                technology_and_protocol, security_and_privacy,
                                usage, migration_or_transition_plan, created_at,
                                updated_at, deleted_at, is_deleted
                            ) VALUES (
                                :workspace_id, NULL, :uuid, 'Benefits Portal',
                                'Portail des prestations', 'Overview', 'OIDC',
                                'Protected B', 'Usage', 'Plan', :created_at,
                                NULL, NULL, FALSE
                            ) RETURNING id
                            """
                        ),
                        {
                            "workspace_id": workspace_id,
                            "uuid": uuid4(),
                            "created_at": now,
                        },
                    ).scalar_one()
                )

            insert_rp = """
                INSERT INTO rp_application (
                    workspace_id, application_information_id, department_id,
                    canada_login_environment, dnr_app_name,
                    configuration_name, created_by, uuid, created_at,
                    updated_at, deleted_at, is_deleted
                ) VALUES (
                    :workspace_id, :application_information_id, :department_id,
                    :canada_login_environment, 'Benefits Portal',
                    :configuration_name, NULL, :uuid, :created_at,
                    NULL, :deleted_at, :is_deleted
                )
            """
            insert_rp_with_partner_environment = insert_rp.replace(
                "configuration_name, created_by",
                "configuration_name, partner_environment, created_by",
            ).replace(
                ":configuration_name, NULL",
                ":configuration_name, :partner_environment, NULL",
            )
            valid = {
                "workspace_id": workspace_id,
                "application_information_id": application_id,
                "department_id": department_id,
                "canada_login_environment": "staging",
                "configuration_name": "Staging integration A",
                "uuid": uuid4(),
                "created_at": now,
                "deleted_at": None,
                "is_deleted": False,
            }
            _assert_integrity_error(
                engine,
                insert_rp,
                {**valid, "workspace_id": None},
            )
            _assert_integrity_error(
                engine,
                insert_rp,
                {**valid, "application_information_id": None},
            )
            _assert_integrity_error(
                engine,
                insert_rp,
                {**valid, "department_id": None},
            )
            _assert_integrity_error(
                engine,
                insert_rp,
                {**valid, "canada_login_environment": None},
            )
            _assert_integrity_error(
                engine,
                insert_rp,
                {**valid, "canada_login_environment": "partner-qa"},
            )
            _assert_integrity_error(
                engine,
                insert_rp,
                {**valid, "configuration_name": "   "},
            )
            _assert_integrity_error(
                engine,
                insert_rp_with_partner_environment,
                {**valid, "partner_environment": "   "},
            )
            _assert_integrity_error(
                engine,
                insert_rp,
                {
                    **valid,
                    "workspace_id": None,
                    "application_information_id": None,
                    "department_id": None,
                    "canada_login_environment": None,
                    "configuration_name": None,
                },
            )
            with engine.begin() as connection:
                connection.execute(
                    text(insert_rp_with_partner_environment),
                    {**valid, "partner_environment": "QA 2"},
                )
                connection.execute(
                    text(insert_rp),
                    {
                        **valid,
                        "configuration_name": "Legacy-compatible integration",
                        "uuid": uuid4(),
                    },
                )

            with engine.connect() as connection:
                row_count_before_partner_downgrade = int(connection.execute(text("SELECT COUNT(*) FROM rp_application")).scalar_one())
            database.run_alembic("downgrade", "0031_cross_namespace_uuid_guard")
            assert "partner_environment" not in {column["name"] for column in inspect(engine).get_columns("rp_application")}
            with engine.connect() as connection:
                assert int(connection.execute(text("SELECT COUNT(*) FROM rp_application")).scalar_one()) == (row_count_before_partner_downgrade)
            database.run_alembic("upgrade", "head")
            assert _current_revision(engine) == EXPECTED_HEAD
            with engine.connect() as connection:
                assert connection.execute(text("SELECT COUNT(*) FROM rp_application WHERE partner_environment IS NOT NULL")).scalar_one() == 0

            database.run_alembic("downgrade", "0029_rp_hierarchy_reconcile")
            assert _current_revision(engine) == "0029_rp_hierarchy_reconcile"
            assert {column["name"]: column for column in inspect(engine).get_columns("rp_application")}["configuration_name"]["nullable"] is True
            with engine.begin() as connection:
                recovery_uuid = uuid4()
                connection.execute(
                    text(insert_rp),
                    {
                        **valid,
                        "workspace_id": None,
                        "application_information_id": None,
                        "department_id": None,
                        "canada_login_environment": None,
                        "configuration_name": None,
                        "uuid": recovery_uuid,
                    },
                )
            database.run_alembic(
                "upgrade",
                "head",
                expected_failure="reconciliation findings remain",
            )
            with engine.begin() as connection:
                connection.execute(
                    text("UPDATE rp_application SET configuration_name = 'Recovered candidate' WHERE uuid = :uuid"),
                    {"uuid": recovery_uuid},
                )
            database.run_alembic("upgrade", "head")
            assert _current_revision(engine) == EXPECTED_HEAD
        finally:
            engine.dispose()


def _insert_rp_backfill_fixture(
    engine: Engine,
    *,
    contradictory_department: bool = False,
) -> dict[str, object]:
    now = datetime.now(UTC)
    workspace_uuid = uuid4()
    workspace_rp_uuid = uuid4()
    candidate_rp_uuid = uuid4()
    with engine.begin() as connection:
        department_ids = [
            int(row[0]) for row in connection.execute(text("SELECT id FROM department WHERE is_deleted = FALSE ORDER BY id LIMIT 2")).all()
        ]
        assert len(department_ids) == 2
        workspace_id = int(
            connection.execute(
                text(
                    """
                    INSERT INTO workspace (
                        name, slug, department_id, created_by, uuid, description,
                        created_at, updated_at, deleted_at, is_deleted
                    ) VALUES (
                        'RP backfill workspace', :slug, :department_id, NULL,
                        :uuid, 'Disposable RP backfill fixture', :created_at,
                        NULL, NULL, FALSE
                    )
                    RETURNING id
                    """
                ),
                {
                    "slug": f"rp-backfill-{uuid4().hex[:12]}",
                    "department_id": department_ids[0],
                    "uuid": workspace_uuid,
                    "created_at": now,
                },
            ).scalar_one()
        )
        connection.execute(
            text(
                """
                INSERT INTO rp_application (
                    workspace_id, department_id, dnr_app_name,
                    configuration_name, created_by, uuid, created_at,
                    updated_at, deleted_at, is_deleted
                ) VALUES (
                    :workspace_id, :department_id, :dnr_app_name, NULL, NULL,
                    :uuid, :created_at, NULL, NULL, FALSE
                )
                """
            ),
            {
                "workspace_id": workspace_id,
                "department_id": (department_ids[1] if contradictory_department else None),
                "dnr_app_name": "Benefits Portal",
                "uuid": workspace_rp_uuid,
                "created_at": now,
            },
        )
        connection.execute(
            text(
                """
                INSERT INTO rp_application (
                    workspace_id, department_id, dnr_app_name,
                    configuration_name, created_by, uuid, created_at,
                    updated_at, deleted_at, is_deleted
                ) VALUES (
                    NULL, NULL, :dnr_app_name, NULL, NULL, :uuid,
                    :created_at, NULL, NULL, FALSE
                )
                """
            ),
            {
                "dnr_app_name": "Cafe\N{COMBINING ACUTE ACCENT} candidate",
                "uuid": candidate_rp_uuid,
                "created_at": now,
            },
        )
    return {
        "workspace_department_id": department_ids[0],
        "workspace_rp_uuid": workspace_rp_uuid,
        "candidate_rp_uuid": candidate_rp_uuid,
    }


def test_rp_configuration_backfill_is_deterministic_and_round_trippable() -> None:
    with _temporary_postgres_database() as database:
        database.run_alembic("upgrade", "0027_contact_identity_expand")
        engine = database.connect()
        try:
            fixture = _insert_rp_backfill_fixture(engine)
            database.run_alembic("upgrade", "0028_rp_config_backfill")
            assert _current_revision(engine) == "0028_rp_config_backfill"
            with engine.connect() as connection:
                workspace_row = connection.execute(
                    text("SELECT configuration_name, department_id FROM rp_application WHERE uuid = :uuid"),
                    {"uuid": fixture["workspace_rp_uuid"]},
                ).one()
                candidate_name = connection.execute(
                    text("SELECT configuration_name FROM rp_application WHERE uuid = :uuid"),
                    {"uuid": fixture["candidate_rp_uuid"]},
                ).scalar_one()
            assert workspace_row.configuration_name == (f"Benefits Portal [{fixture['workspace_rp_uuid'].hex[:8]}]")
            assert workspace_row.department_id == fixture["workspace_department_id"]
            assert candidate_name == (f"Café candidate [{fixture['candidate_rp_uuid'].hex[:8]}]")

            database.run_alembic("downgrade", "0027_contact_identity_expand")
            assert _current_revision(engine) == "0027_contact_identity_expand"
            with engine.connect() as connection:
                retained_name = connection.execute(
                    text("SELECT configuration_name FROM rp_application WHERE uuid = :uuid"),
                    {"uuid": fixture["workspace_rp_uuid"]},
                ).scalar_one()
            assert retained_name == workspace_row.configuration_name

            database.run_alembic("upgrade", "0028_rp_config_backfill")
            assert _current_revision(engine) == "0028_rp_config_backfill"
        finally:
            engine.dispose()


def test_rp_configuration_backfill_rejects_department_contradiction_atomically() -> None:
    with _temporary_postgres_database() as database:
        database.run_alembic("upgrade", "0027_contact_identity_expand")
        engine = database.connect()
        try:
            fixture = _insert_rp_backfill_fixture(
                engine,
                contradictory_department=True,
            )
            database.run_alembic(
                "upgrade",
                "0028_rp_config_backfill",
                expected_failure="contradictory Department values",
            )
            assert _current_revision(engine) == "0027_contact_identity_expand"
            with engine.connect() as connection:
                configuration_name = connection.execute(
                    text("SELECT configuration_name FROM rp_application WHERE uuid = :uuid"),
                    {"uuid": fixture["workspace_rp_uuid"]},
                ).scalar_one()
            assert configuration_name is None
        finally:
            engine.dispose()


def test_rp_hierarchy_reconciliation_requires_and_applies_reviewed_mapping(
    tmp_path: Path,
) -> None:
    with _temporary_postgres_database() as database:
        database.run_alembic("upgrade", "0027_contact_identity_expand")
        engine = database.connect()
        try:
            fixture = _insert_rp_backfill_fixture(engine)
            database.run_alembic("upgrade", "0028_rp_config_backfill")
            application_uuid = uuid4()
            with engine.begin() as connection:
                workspace_id = connection.execute(
                    text("SELECT workspace_id FROM rp_application WHERE uuid = :uuid"),
                    {"uuid": fixture["workspace_rp_uuid"]},
                ).scalar_one()
                connection.execute(
                    text(
                        """
                        INSERT INTO application_information (
                            workspace_id, created_by, uuid, service_name_en,
                            service_name_fr, overview,
                            technology_and_protocol, security_and_privacy,
                            usage, migration_or_transition_plan, created_at,
                            updated_at, deleted_at, is_deleted
                        ) VALUES (
                            :workspace_id, NULL, :uuid, 'Benefits Portal',
                            'Portail des prestations', 'Disposable overview',
                            'OIDC', 'Protected B', 'Disposable usage',
                            'Disposable plan', :created_at, NULL, NULL, FALSE
                        )
                        """
                    ),
                    {
                        "workspace_id": workspace_id,
                        "uuid": application_uuid,
                        "created_at": datetime.now(UTC),
                    },
                )

            database.run_alembic(
                "upgrade",
                "head",
                expected_failure="RP_HIERARCHY_BACKFILL_MANIFEST is required",
            )
            assert _current_revision(engine) == "0028_rp_config_backfill"
            manifest_path = _write_reviewed_hierarchy_manifest(
                tmp_path,
                engine,
                application_uuid=application_uuid,
                canada_login_environment="staging",
            )
            database.run_alembic(
                "upgrade",
                "head",
                hierarchy_manifest_path=manifest_path,
            )
            assert _current_revision(engine) == EXPECTED_HEAD
            with engine.connect() as connection:
                resolved = connection.execute(
                    text(
                        """
                        SELECT ai.uuid AS application_uuid,
                               rp.canada_login_environment
                        FROM rp_application AS rp
                        JOIN application_information AS ai
                          ON ai.id = rp.application_information_id
                        WHERE rp.uuid = :uuid
                        """
                    ),
                    {"uuid": fixture["workspace_rp_uuid"]},
                ).one()
            assert resolved.application_uuid == application_uuid
            assert resolved.canada_login_environment == "staging"

            database.run_alembic("downgrade", "0028_rp_config_backfill")
            assert _current_revision(engine) == "0028_rp_config_backfill"
            with engine.connect() as connection:
                retained_environment = connection.execute(
                    text("SELECT canada_login_environment FROM rp_application WHERE uuid = :uuid"),
                    {"uuid": fixture["workspace_rp_uuid"]},
                ).scalar_one()
            assert retained_environment == "staging"
        finally:
            engine.dispose()


def test_populated_0018_upgrade_is_idempotent_constrained_and_round_trippable(
    tmp_path: Path,
) -> None:
    assert _script_heads() == [EXPECTED_HEAD]
    with _temporary_postgres_database() as database:
        database.run_alembic("upgrade", BASELINE_REVISION)
        engine = database.connect()
        try:
            assert _current_revision(engine) == BASELINE_REVISION
            fixture = _populate_0018_fixture(engine)

            database.run_alembic("upgrade", "0019_four_role_expand")
            assert _current_revision(engine) == "0019_four_role_expand"
            _insert_0019_compatibility_rows(engine, fixture)
            manifest_path = _write_reviewed_manifest(tmp_path, engine)

            database.run_alembic("upgrade", "head", manifest_path=manifest_path)
            _assert_post_migration_state(engine, fixture)
            state_after_first_upgrade = _logical_four_role_state(engine)

            database.run_alembic("upgrade", "head", manifest_path=manifest_path)
            assert _logical_four_role_state(engine) == state_after_first_upgrade
            _assert_database_constraints(engine, fixture)

            database.run_alembic("downgrade", BASELINE_REVISION)
            assert _current_revision(engine) == BASELINE_REVISION
            downgraded_inspector = inspect(engine)
            assert "user_role" not in downgraded_inspector.get_table_names()
            assert "code" not in {column["name"] for column in downgraded_inspector.get_columns("role")}
            assert "revoked_at" not in {column["name"] for column in downgraded_inspector.get_columns("rp_application_access_grant")}
            assert "revoked_by_user_id" not in {column["name"] for column in downgraded_inspector.get_columns("rp_application_developer_invitation")}
            assert "revocation_actor_source" not in {
                column["name"] for column in downgraded_inspector.get_columns("rp_application_developer_invitation")
            }
            assert {"is_superuser", "role_ids"}.issubset({column["name"] for column in downgraded_inspector.get_columns("user")})
            with engine.connect() as connection:
                assert (
                    connection.execute(
                        text("SELECT COUNT(*) FROM workspace_member WHERE uuid = :uuid"),
                        {"uuid": fixture["membership_uuid"]},
                    ).scalar_one()
                    == 1
                )
                assert (
                    connection.execute(
                        text("SELECT role FROM rp_application_access_grant WHERE uuid = :uuid"),
                        {"uuid": fixture["grant_uuid"]},
                    ).scalar_one()
                    == "rp_user_edit"
                )
                assert tuple(
                    connection.execute(
                        text(
                            """
                            SELECT status, created_at, updated_at
                            FROM rp_application_access_grant
                            WHERE uuid = :uuid
                            """
                        ),
                        {"uuid": fixture["legacy_revoked_grant_uuid"]},
                    ).one()
                ) == (
                    "revoked",
                    fixture["legacy_revoked_at_source"] - timedelta(days=1),
                    fixture["legacy_revoked_at_source"],
                )
                assert (
                    connection.execute(
                        text("SELECT source_invitation_uuid FROM rp_application_access_grant WHERE uuid = :uuid"),
                        {"uuid": fixture["grant_uuid"]},
                    ).scalar_one()
                    == fixture["accepted_invitation_uuid"]
                )
                assert (
                    connection.execute(
                        text("SELECT delegated_by_grant_uuid FROM rp_application_developer_invitation WHERE uuid = :uuid"),
                        {"uuid": fixture["pending_invitation_uuid"]},
                    ).scalar_one()
                    == fixture["grant_uuid"]
                )

            database.run_alembic("upgrade", "0019_four_role_expand")
            manifest_path = _write_reviewed_manifest(tmp_path, engine)
            database.run_alembic("upgrade", "head", manifest_path=manifest_path)
            _assert_post_migration_state(engine, fixture)
            _assert_database_constraints(engine, fixture)
        finally:
            engine.dispose()


def test_reviewed_grant_disposition_rejects_inactive_parent_records(
    tmp_path: Path,
) -> None:
    with _temporary_postgres_database() as database:
        database.run_alembic("upgrade", BASELINE_REVISION)
        engine = database.connect()
        try:
            fixture = _populate_0018_fixture(engine)
            database.run_alembic("upgrade", "0019_four_role_expand")

            with engine.begin() as connection:
                connection.execute(
                    text('UPDATE "user" SET enabled = FALSE WHERE id = :user_id'),
                    {"user_id": fixture["partner_user_id"]},
                )
            manifest_path = _write_reviewed_manifest(tmp_path, engine)
            database.run_alembic(
                "upgrade",
                "head",
                manifest_path=manifest_path,
                expected_failure="disabled or deleted user",
            )
            assert _current_revision(engine) == "0019_four_role_expand"

            with engine.begin() as connection:
                connection.execute(
                    text('UPDATE "user" SET enabled = TRUE, is_deleted = TRUE WHERE id = :user_id'),
                    {"user_id": fixture["partner_user_id"]},
                )
            manifest_path = _write_reviewed_manifest(tmp_path, engine)
            database.run_alembic(
                "upgrade",
                "head",
                manifest_path=manifest_path,
                expected_failure="disabled or deleted user",
            )
            assert _current_revision(engine) == "0019_four_role_expand"

            with engine.begin() as connection:
                connection.execute(
                    text('UPDATE "user" SET is_deleted = FALSE WHERE id = :user_id'),
                    {"user_id": fixture["partner_user_id"]},
                )
                connection.execute(
                    text("UPDATE workspace SET is_deleted = TRUE WHERE id = :workspace_id"),
                    {"workspace_id": fixture["workspace_id"]},
                )
            manifest_path = _write_reviewed_manifest(tmp_path, engine)
            database.run_alembic(
                "upgrade",
                "head",
                manifest_path=manifest_path,
                expected_failure="deleted workspace",
            )
            assert _current_revision(engine) == "0019_four_role_expand"

            with engine.begin() as connection:
                connection.execute(
                    text("UPDATE workspace SET is_deleted = FALSE WHERE id = :workspace_id"),
                    {"workspace_id": fixture["workspace_id"]},
                )
            manifest_path = _write_reviewed_manifest(tmp_path, engine)
            database.run_alembic("upgrade", "head", manifest_path=manifest_path)
            _assert_post_migration_state(engine, fixture)
        finally:
            engine.dispose()
