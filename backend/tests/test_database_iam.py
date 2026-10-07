import asyncio
import ssl
from unittest.mock import AsyncMock, Mock, call

import asyncpg
import pytest
from pydantic import ValidationError
from sqlalchemy import pool
from sqlalchemy.engine import URL, make_url

from src.app.core.config import PostgresSettings, Settings
from src.app.core.db import connection, database


@pytest.fixture(autouse=True)
def clear_postgres_environment(monkeypatch):
    for field in PostgresSettings.model_fields:
        monkeypatch.delenv(field, raising=False)


def iam_settings(**overrides) -> PostgresSettings:
    values = {
        "POSTGRES_IAM_AUTH_ENABLED": True,
        "POSTGRES_SERVER": "writer.proxy.example.ca",
        "POSTGRES_USER": "partner_portal_app",
        "POSTGRES_DB": "partner_portal",
        "POSTGRES_PORT": 6432,
        "AWS_REGION": "ca-central-1",
    }
    values.update(overrides)
    return PostgresSettings(**values)


def test_iam_environment_and_passwordless_url(monkeypatch):
    for field, value in {
        "POSTGRES_IAM_AUTH_ENABLED": "true",
        "POSTGRES_SERVER": "writer.proxy.example.ca",
        "POSTGRES_USER": "partner_portal_app",
        "POSTGRES_DB": "partner_portal",
        "AWS_REGION": "ca-central-1",
        "POSTGRES_READER_SERVER": "reader.proxy.example.ca",
    }.items():
        monkeypatch.setenv(field, value)

    settings = PostgresSettings()
    url = connection.get_database_url(settings)

    assert isinstance(url, URL)
    assert url.password is None
    assert url.host == settings.POSTGRES_SERVER
    assert url.port == 5432
    assert settings.POSTGRES_READER_SERVER == "reader.proxy.example.ca"
    assert make_url(f"{settings.POSTGRES_ASYNC_PREFIX}{settings.POSTGRES_URI}").password is None


def test_application_settings_inherit_iam_environment_validation(monkeypatch):
    for field, value in {
        "POSTGRES_IAM_AUTH_ENABLED": "true",
        "POSTGRES_SERVER": "writer.proxy.example.ca",
        "POSTGRES_USER": "partner_portal_app",
        "POSTGRES_DB": "partner_portal",
        "AWS_REGION": "ca-central-1",
    }.items():
        monkeypatch.setenv(field, value)
    settings = Settings(_env_file=None)
    assert settings.POSTGRES_IAM_AUTH_ENABLED
    assert connection.get_database_url(settings).password is None
    monkeypatch.delenv("POSTGRES_USER")
    with pytest.raises(ValidationError, match="POSTGRES_USER"):
        Settings(_env_file=None)


@pytest.mark.parametrize(
    "overrides, field",
    [
        ({"AWS_REGION": None}, "AWS_REGION"),
        ({"AWS_REGION": " "}, "AWS_REGION"),
        ({"AWS_REGION": "not-a-region"}, "AWS_REGION"),
        ({"POSTGRES_SERVER": ""}, "POSTGRES_SERVER"),
        ({"POSTGRES_SERVER": "https://writer.proxy.example.ca"}, "POSTGRES_SERVER"),
        ({"POSTGRES_SERVER": "writer.proxy.example.ca:5432"}, "POSTGRES_SERVER"),
        ({"POSTGRES_USER": " "}, "POSTGRES_USER"),
        ({"POSTGRES_DB": ""}, "POSTGRES_DB"),
        ({"POSTGRES_PORT": 0}, "POSTGRES_PORT"),
        ({"POSTGRES_PORT": 65536}, "POSTGRES_PORT"),
        ({"POSTGRES_URL": "postgresql+asyncpg://override/db"}, "POSTGRES_URL"),
        ({"POSTGRES_URL": ""}, "POSTGRES_URL"),
        ({"POSTGRES_ASYNC_PREFIX": "postgresql://"}, "POSTGRES_ASYNC_PREFIX"),
        ({"POSTGRES_ASYNC_PREFIX": "sqlite+aiosqlite:///"}, "POSTGRES_ASYNC_PREFIX"),
    ],
)
def test_iam_rejects_invalid_configuration(overrides, field):
    with pytest.raises(ValidationError, match=field):
        iam_settings(**overrides)


@pytest.mark.parametrize("field", ["POSTGRES_SERVER", "POSTGRES_USER", "POSTGRES_DB"])
def test_iam_requires_explicit_connection_identity(field):
    values = iam_settings().model_dump(exclude={field, "POSTGRES_URI"})
    with pytest.raises(ValidationError, match=field):
        PostgresSettings(**values)


@pytest.mark.asyncio
async def test_password_mode_retains_legacy_configuration_and_escapes_credentials(monkeypatch):
    client = Mock(side_effect=AssertionError("Password mode must not use AWS"))
    monkeypatch.setattr(connection.boto3, "client", client)
    settings = PostgresSettings(POSTGRES_USER="local@user", POSTGRES_PASSWORD="p:a/ss%?#@", POSTGRES_URL="ignored")

    engine = connection.build_async_engine(settings)
    try:
        assert not settings.POSTGRES_IAM_AUTH_ENABLED
        assert settings.POSTGRES_READER_SERVER is None
        assert engine.url.username == settings.POSTGRES_USER
        assert engine.url.password == settings.POSTGRES_PASSWORD
        assert engine.url.host == "localhost"
        assert not list(engine.dialect.dispatch.do_connect)
        client.assert_not_called()
    finally:
        await engine.dispose()


@pytest.mark.asyncio
@pytest.mark.parametrize("poolclass", [None, pool.NullPool])
async def test_tokens_only_for_new_physical_connections_with_verified_tls(monkeypatch, poolclass, caplog):
    rds = Mock()
    rds.generate_db_auth_token.side_effect = ["token-one", "token-two", "token-three"]
    client = Mock(return_value=rds)
    monkeypatch.setattr(connection.boto3, "client", client)
    physical_connections = []
    for _ in range(3):
        physical = Mock()
        physical.set_type_codec = AsyncMock()
        physical.close = AsyncMock()
        physical.is_closed.return_value = False
        physical_connections.append(physical)
    connect = AsyncMock(side_effect=physical_connections)
    monkeypatch.setattr(asyncpg, "connect", connect)
    settings = iam_settings(POSTGRES_READER_SERVER="reader.proxy.example.ca", POSTGRES_PASSWORD="unused-password")
    options = {"poolclass": poolclass} if poolclass else {}
    engine = connection.build_async_engine(settings, **options)
    # Avoid server-version/schema queries; retain real SQLAlchemy pool, hook and asyncpg adapter.
    monkeypatch.setattr(engine.sync_engine.dialect, "initialize", Mock())
    try:
        for _ in range(2):
            async with engine.connect():
                pass
        expected_connections = 2 if poolclass else 1
        assert connect.await_count == expected_connections
        assert rds.generate_db_auth_token.call_count == expected_connections

        # Disposing the pool forces a new physical connection and a fresh token.
        await engine.dispose()
        async with engine.connect():
            pass
        expected_connections += 1
        assert connect.await_count == expected_connections
        assert rds.generate_db_auth_token.call_args_list == [
            call(DBHostname=settings.POSTGRES_SERVER, Port=6432, DBUsername="partner_portal_app", Region="ca-central-1")
        ] * expected_connections
        client.assert_called_once_with("rds", region_name="ca-central-1")
        for index, invocation in enumerate(connect.await_args_list):
            params = invocation.kwargs
            assert params["host"] == settings.POSTGRES_SERVER
            assert params["port"] == 6432
            assert params["user"] == settings.POSTGRES_USER
            assert params["database"] == settings.POSTGRES_DB
            assert params["password"] == ["token-one", "token-two", "token-three"][index]
            assert isinstance(params["ssl"], ssl.SSLContext)
            assert params["ssl"].check_hostname is True
            assert params["ssl"].verify_mode == ssl.CERT_REQUIRED
            assert params["ssl"].cert_store_stats()["x509_ca"] > 0
        assert engine.url.password is None
        assert "token-" not in str(engine.url)
        assert "token-" not in caplog.text
    finally:
        await engine.dispose()


@pytest.mark.asyncio
async def test_token_failure_does_not_fall_back_to_password(monkeypatch):
    rds = Mock()
    rds.generate_db_auth_token.side_effect = RuntimeError("Signing failed")
    monkeypatch.setattr(connection.boto3, "client", Mock(return_value=rds))
    connect = AsyncMock()
    monkeypatch.setattr(asyncpg, "connect", connect)
    engine = connection.build_async_engine(iam_settings())
    try:
        with pytest.raises(RuntimeError, match="Signing failed"):
            await engine.connect()
        connect.assert_not_awaited()
    finally:
        await engine.dispose()


def test_runtime_engines_and_sessions_remain_cached_per_event_loop(monkeypatch):
    rds = Mock()
    monkeypatch.setattr(connection.boto3, "client", Mock(return_value=rds))
    monkeypatch.setattr(database, "settings", iam_settings())
    monkeypatch.setattr(database, "_engines", {})
    monkeypatch.setattr(database, "_sessions", {})
    loops = [asyncio.new_event_loop(), asyncio.new_event_loop()]

    async def check_loop():
        engine = database.get_async_engine()
        assert database.get_async_engine() is engine
        session = database.local_session()
        other_session = database.local_session()
        try:
            assert session is not other_session
            assert session.bind is engine
            assert other_session.bind is engine
            assert database._sessions[id(asyncio.get_running_loop())].kw["expire_on_commit"] is False
        finally:
            await session.close()
            await other_session.close()
        return engine

    try:
        engines = [loop.run_until_complete(check_loop()) for loop in loops]
        assert engines[0] is not engines[1]
        assert len(database._engines) == len(database._sessions) == 2
        rds.generate_db_auth_token.assert_not_called()
    finally:
        for loop in loops:
            engine = database._engines.get(id(loop))
            if engine is not None:
                loop.run_until_complete(engine.dispose())
            loop.close()
