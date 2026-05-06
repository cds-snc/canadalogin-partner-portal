import asyncio
import importlib
import os
import pkgutil
from logging.config import fileConfig

from alembic import context
from sqlalchemy import create_engine, pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from app.core.config import settings
from app.core.db.database import Base

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

config.set_main_option(
    "sqlalchemy.url",
    f"{settings.POSTGRES_ASYNC_PREFIX}{settings.POSTGRES_USER}:{settings.POSTGRES_PASSWORD}@{settings.POSTGRES_SERVER}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}",
)

# If running a dry-run autogenerate (no existing DB), allow overriding the DB URL
# by setting ALEMBIC_DRY_RUN=1 in the environment. This helps generate a clean
# initial migration without requiring the project's production DB state.
if os.getenv("ALEMBIC_DRY_RUN") == "1":
    # use an in-memory sqlite DB for autogeneration comparison
    config.set_main_option("sqlalchemy.url", "sqlite:///:memory:")

if config.config_file_name is not None:
    fileConfig(config.config_file_name)


def import_models(package_name):
    package = importlib.import_module(package_name)
    for _, module_name, _ in pkgutil.walk_packages(package.__path__, package.__name__ + "."):
        importlib.import_module(module_name)


import_models("app.models")
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL and not an Engine, though an Engine is acceptable here as well.  By
    skipping the Engine creation we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the script output.
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """In this scenario we need to create an Engine and associate a connection with the context."""

    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""

    # Support a dry-run sync flow to autogenerate migrations against an
    # in-memory SQLite DB without requiring async drivers. When
    # ALEMBIC_DRY_RUN=1 is set we use a synchronous sqlite engine and run
    # migrations directly; otherwise run the normal async flow.
    if os.getenv("ALEMBIC_DRY_RUN") == "1":
        sync_url = config.get_main_option("sqlalchemy.url")
        engine = create_engine(sync_url)
        with engine.connect() as connection:
            do_run_migrations(connection)
        engine.dispose()
        return

    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
