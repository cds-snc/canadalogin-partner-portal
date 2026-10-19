import asyncio
from unittest.mock import AsyncMock, Mock

import pytest
from pydantic import ValidationError
from sqlalchemy.engine import make_url

from src.app.core.config import PostgresSettings, Settings
from src.app.core.db import connection, database


@pytest.fixture(autouse=True)
def clear_postgres_environment(monkeypatch):
    for field in PostgresSettings.model_fields:
        monkeypatch.delenv(field, raising=False)


@pytest.mark.parametrize("iam", [False, True])
def test_reader_changes_only_url_host(iam):
    settings = PostgresSettings(
        POSTGRES_IAM_AUTH_ENABLED=iam,
        POSTGRES_SERVER="writer.proxy.example.ca",
        POSTGRES_READER_SERVER="reader.proxy.example.ca",
        POSTGRES_USER="user@reader.proxy.example.ca",
        POSTGRES_PASSWORD="writer.proxy.example.ca:p@ss/?#%",
        POSTGRES_DB="writer.proxy.example.ca",
        POSTGRES_PORT=6432,
        AWS_REGION="ca-central-1",
    )
    writer = make_url(connection.get_database_url(settings))
    reader = make_url(connection.get_database_url(settings, reader=True))

    assert writer.host == settings.POSTGRES_SERVER
    assert reader.host == settings.POSTGRES_READER_SERVER
    assert reader.set(host=writer.host) == writer
    assert reader.username == settings.POSTGRES_USER
    assert reader.password == (None if iam else settings.POSTGRES_PASSWORD)


def test_reader_preserves_url_options():
    # Protect the host-only contract even when a URL carries driver/query options.
    settings = Mock(spec=PostgresSettings)
    settings.POSTGRES_IAM_AUTH_ENABLED = False
    settings.POSTGRES_ASYNC_PREFIX = "postgresql+asyncpg://"
    settings.POSTGRES_URI = "user:p%40ss@writer.example.ca:6432/db?command_timeout=10&application_name=writer.example.ca"
    settings.POSTGRES_READER_SERVER = "reader.example.ca"
    writer = make_url(connection.get_database_url(settings))
    reader = connection.get_database_url(settings, reader=True)
    assert reader == writer.set(host="reader.example.ca")


@pytest.mark.parametrize("iam", [False, True])
@pytest.mark.parametrize(
    "hostname",
    ["", " ", " reader.example.ca", "reader.example.ca ", "https://reader.example.ca", "reader:5432", "reader/db",
     "reader?ssl=true", "reader#fragment", "user@reader", "reader..example.ca", "-reader.example.ca", "reader-.example.ca",
     "reader_example.ca", "a" * 64 + ".example.ca", ".".join(["a" * 63] * 4)],
)
def test_rejects_invalid_reader_hostname(iam, hostname):
    with pytest.raises(ValidationError, match="POSTGRES_READER_SERVER"):
        PostgresSettings(
            POSTGRES_IAM_AUTH_ENABLED=iam,
            POSTGRES_SERVER="writer.example.ca",
            POSTGRES_USER="app",
            POSTGRES_DB="app",
            AWS_REGION="ca-central-1",
            POSTGRES_READER_SERVER=hostname,
        )


def test_reader_environment_is_validated_in_application_settings(monkeypatch):
    monkeypatch.setenv("POSTGRES_READER_SERVER", "reader.proxy.example.ca")
    assert Settings(_env_file=None).POSTGRES_READER_SERVER == "reader.proxy.example.ca"
    monkeypatch.setenv("POSTGRES_READER_SERVER", "reader:5432")
    with pytest.raises(ValidationError, match="POSTGRES_READER_SERVER"):
        Settings(_env_file=None)


@pytest.mark.asyncio
async def test_password_reader_engine_does_not_use_aws(monkeypatch):
    client = Mock(side_effect=AssertionError("Password reader must not use AWS"))
    monkeypatch.setattr(connection.boto3, "client", client)
    settings = PostgresSettings(POSTGRES_READER_SERVER="reader.example.ca", POSTGRES_PASSWORD="p@ss/?#%")
    engine = connection.build_async_engine(settings, reader=True)
    try:
        assert engine.url.host == settings.POSTGRES_READER_SERVER
        assert engine.url.password == settings.POSTGRES_PASSWORD
        assert not list(engine.dialect.dispatch.do_connect)
        client.assert_not_called()
    finally:
        await engine.dispose()


@pytest.fixture
def isolated_caches(monkeypatch):
    monkeypatch.setattr(database, "settings", PostgresSettings())
    for name in ("_engines", "_sessions", "_reader_engines", "_reader_sessions"):
        monkeypatch.setattr(database, name, {})


def test_reader_and_writer_caches_are_per_event_loop(isolated_caches):
    database.settings.POSTGRES_READER_SERVER = "reader.example.ca"
    loops = [asyncio.new_event_loop(), asyncio.new_event_loop()]

    async def check_loop():
        writer = database.get_async_engine()
        reader = database.get_async_engine(reader=True)
        assert reader is database.get_async_engine(reader=True)
        assert writer is database.get_async_engine()
        assert reader is not writer
        assert reader.url.host == "reader.example.ca"
        async with database.local_session() as writer_session, database.local_session(reader=True) as reader_session:
            assert writer_session.bind is writer
            assert reader_session.bind is reader
            loop_id = id(asyncio.get_running_loop())
            assert database._reader_sessions[loop_id].kw["expire_on_commit"] is False
        return writer, reader

    try:
        first, second = [loop.run_until_complete(check_loop()) for loop in loops]
        assert all(left is not right for left in first for right in second)
        assert len(database._engines) == len(database._reader_engines) == 2
        assert len(database._sessions) == len(database._reader_sessions) == 2
    finally:
        for loop in loops:
            for engines in (database._engines, database._reader_engines):
                engine = engines.get(id(loop))
                if engine is not None:
                    loop.run_until_complete(engine.dispose())
            loop.close()


@pytest.mark.asyncio
async def test_missing_reader_reuses_writer_engine_and_session_factory_dynamically(isolated_caches):
    writer = database.get_async_engine()
    reader = None
    try:
        assert connection.get_database_url(database.settings, reader=True) == connection.get_database_url(database.settings)
        assert database.get_async_engine(reader=True) is writer
        async with database.local_session(reader=True) as session:
            assert session.bind is writer
        assert not database._reader_engines
        assert not database._reader_sessions
        writer_factory = database._sessions[id(asyncio.get_running_loop())]

        database.settings.POSTGRES_READER_SERVER = "reader.example.ca"
        reader = database.get_async_engine(reader=True)
        assert reader is not writer
        async with database.local_session(reader=True) as session:
            assert session.bind is reader

        database.settings.POSTGRES_READER_SERVER = None
        assert database.get_async_engine(reader=True) is writer
        async with database.local_session(reader=True) as session:
            assert session.bind is writer
        assert database._sessions[id(asyncio.get_running_loop())] is writer_factory
    finally:
        await writer.dispose()
        if reader is not None:
            await reader.dispose()


@pytest.mark.asyncio
@pytest.mark.parametrize("dependency, expected_options", [(database.async_get_db, {}), (database.async_get_reader_db, {"reader": True})])
async def test_dependencies_select_session_and_close_on_error(monkeypatch, dependency, expected_options):
    context = Mock()
    context.__aenter__ = AsyncMock(return_value=object())
    context.__aexit__ = AsyncMock(return_value=False)
    factory = Mock(return_value=context)
    monkeypatch.setattr(database, "local_session", factory)
    generator = dependency()
    assert await anext(generator) is context.__aenter__.return_value
    factory.assert_called_once_with(**expected_options)
    with pytest.raises(RuntimeError, match="request failed"):
        await generator.athrow(RuntimeError("request failed"))
    context.__aexit__.assert_awaited_once()
