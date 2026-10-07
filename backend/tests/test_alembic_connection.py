import importlib.util
import sys
from pathlib import Path
from types import ModuleType
from unittest.mock import AsyncMock, MagicMock, Mock

import asyncpg
import pytest
from alembic import context
from alembic.config import Config
from sqlalchemy import pool
from sqlalchemy.engine import URL

from src.app.core import config
from src.app.core.db import connection, database

ENV_PATH = Path(__file__).resolve().parents[1] / "src" / "migrations" / "env.py"


def load_alembic_env(monkeypatch, iam_enabled=False, offline=True):
    for field in config.PostgresSettings.model_fields:
        monkeypatch.delenv(field, raising=False)
    settings = config.PostgresSettings(
        POSTGRES_IAM_AUTH_ENABLED=iam_enabled,
        POSTGRES_SERVER="writer.proxy.example.ca",
        POSTGRES_USER="partner_portal_app",
        POSTGRES_DB="partner_portal",
        AWS_REGION="ca-central-1",
    )
    monkeypatch.setattr(config, "settings", settings)
    # Alembic runs with backend/src on sys.path, while pytest imports src.app.
    for name, module in {
        "app.core.config": config,
        "app.core.db.connection": connection,
        "app.core.db.database": database,
    }.items():
        monkeypatch.setitem(sys.modules, name, module)
    models = ModuleType("app.models")
    models.__path__ = []
    monkeypatch.setitem(sys.modules, "app.models", models)
    monkeypatch.setattr(context, "config", Config(), raising=False)
    monkeypatch.setattr(context, "is_offline_mode", Mock(return_value=offline))
    monkeypatch.setattr(context, "configure", Mock())
    monkeypatch.setattr(context, "begin_transaction", MagicMock())
    monkeypatch.setattr(context, "run_migrations", Mock())
    spec = importlib.util.spec_from_file_location("portal_alembic_env", ENV_PATH)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module, settings


def test_iam_offline_url_is_passwordless_and_does_not_sign(monkeypatch):
    monkeypatch.delenv("ALEMBIC_DRY_RUN", raising=False)
    client = Mock(side_effect=AssertionError("Offline migrations must not use AWS"))
    monkeypatch.setattr(connection.boto3, "client", client)

    module, _ = load_alembic_env(monkeypatch, iam_enabled=True)

    assert module.build_async_engine is connection.build_async_engine
    url = context.configure.call_args.kwargs["url"]
    assert isinstance(url, URL)
    assert url.password is None
    assert url.host == "writer.proxy.example.ca"
    client.assert_not_called()


@pytest.mark.asyncio
@pytest.mark.parametrize("iam_enabled", [False, True])
async def test_alembic_reuses_connection_builder_with_null_pool(monkeypatch, iam_enabled):
    monkeypatch.delenv("ALEMBIC_DRY_RUN", raising=False)
    module, settings = load_alembic_env(monkeypatch, iam_enabled=iam_enabled)
    rds = Mock()
    rds.generate_db_auth_token.return_value = "migration-token"
    client = Mock(return_value=rds)
    monkeypatch.setattr(connection.boto3, "client", client)
    connect = AsyncMock(side_effect=ConnectionError("Mock database unavailable"))
    monkeypatch.setattr(asyncpg, "connect", connect)
    engines = []

    def build_engine(*args, **kwargs):
        engine = connection.build_async_engine(*args, **kwargs)
        assert isinstance(engine.pool, pool.NullPool)
        monkeypatch.setattr(engine.sync_engine, "dispose", Mock(wraps=engine.sync_engine.dispose))
        engines.append(engine)
        return engine

    builder = Mock(side_effect=build_engine)
    monkeypatch.setattr(module, "build_async_engine", builder)
    with pytest.raises(ConnectionError, match="Mock database unavailable"):
        await module.run_async_migrations()

    builder.assert_called_once_with(settings, poolclass=pool.NullPool)
    engines[0].sync_engine.dispose.assert_called_once()
    params = connect.await_args.kwargs
    assert params["host"] == settings.POSTGRES_SERVER
    if iam_enabled:
        assert engines[0].url.password is None
        assert params["password"] == "migration-token"
        assert params["ssl"].check_hostname is True
        rds.generate_db_auth_token.assert_called_once_with(
            DBHostname=settings.POSTGRES_SERVER, Port=5432, DBUsername=settings.POSTGRES_USER, Region="ca-central-1"
        )
    else:
        assert params["password"] == settings.POSTGRES_PASSWORD
        assert "ssl" not in params
        client.assert_not_called()


def test_alembic_dry_run_is_rejected_with_iam(monkeypatch):
    monkeypatch.setenv("ALEMBIC_DRY_RUN", "1")
    with pytest.raises(ValueError, match="ALEMBIC_DRY_RUN"):
        load_alembic_env(monkeypatch, iam_enabled=True)


@pytest.mark.parametrize("offline", [False, True])
def test_alembic_dry_run_retains_legacy_sqlite_mode(monkeypatch, offline):
    monkeypatch.setenv("ALEMBIC_DRY_RUN", "1")
    client = Mock(side_effect=AssertionError("SQLite dry-run must not use AWS"))
    monkeypatch.setattr(connection.boto3, "client", client)
    module, _ = load_alembic_env(monkeypatch, offline=offline)
    assert module.database_url == "sqlite:///:memory:"
    if offline:
        assert context.configure.call_args.kwargs["url"] == "sqlite:///:memory:"
    else:
        assert context.configure.call_args.kwargs["connection"].engine.url.drivername == "sqlite"
    client.assert_not_called()
