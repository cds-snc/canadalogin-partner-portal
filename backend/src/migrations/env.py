import asyncio
import importlib
import os
import pkgutil
from datetime import UTC, datetime
from logging.config import fileConfig

from alembic import context
from sqlalchemy import create_engine, pool
from sqlalchemy.engine import Connection

from app.core.config import settings
from app.core.db.connection import build_async_engine, get_database_url
from app.core.db.database import Base

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

database_url = get_database_url(settings)

# If running a dry-run autogenerate (no existing DB), allow overriding the DB URL
# by setting ALEMBIC_DRY_RUN=1 in the environment. This helps generate a clean
# initial migration without requiring the project's production DB state.
if os.getenv("ALEMBIC_DRY_RUN") == "1":
    if settings.POSTGRES_IAM_AUTH_ENABLED:
        raise ValueError("ALEMBIC_DRY_RUN cannot be used with POSTGRES_IAM_AUTH_ENABLED")
    # use an in-memory sqlite DB for autogeneration comparison
    database_url = "sqlite:///:memory:"

if config.config_file_name is not None:
    fileConfig(config.config_file_name)


def import_models(package_name):
    package = importlib.import_module(package_name)
    for _, module_name, _ in pkgutil.walk_packages(package.__path__, package.__name__ + "."):
        importlib.import_module(module_name)


import_models("app.models")
target_metadata = Base.metadata


def process_revision_directives(context, revision, directives) -> None:
    """Give new revisions a UTC timestamp ID (e.g. ``20261021163000``).

    Sequential, hand-picked IDs collide when two branches add a migration at
    the same time. Timestamps don't, and they sort in creation order. An
    explicit ``--rev-id`` on the command line is still respected.
    """
    if getattr(config.cmd_opts, "rev_id", None):
        return
    for directive in directives:
        directive.rev_id = datetime.now(UTC).strftime("%Y%m%d%H%M%S")


def _is_plain_revision_command() -> bool:
    """True for ``alembic revision`` without ``--autogenerate``.

    ``revision_environment = true`` runs this file for every ``alembic
    revision`` so the hook above applies. A plain revision only renders a
    template, so it shouldn't need a database connection.
    """
    cmd_opts = config.cmd_opts
    cmd = getattr(cmd_opts, "cmd", None)
    return bool(cmd) and cmd[0].__name__ == "revision" and not getattr(cmd_opts, "autogenerate", False)


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL and not an Engine, though an Engine is acceptable here as well.  By
    skipping the Engine creation we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the script output.
    """
    context.configure(
        url=database_url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        process_revision_directives=process_revision_directives,
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        process_revision_directives=process_revision_directives,
    )

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """In this scenario we need to create an Engine and associate a connection with the context."""

    connectable = build_async_engine(settings, poolclass=pool.NullPool)

    try:
        async with connectable.connect() as connection:
            await connection.run_sync(do_run_migrations)
    finally:
        await connectable.dispose()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""

    if _is_plain_revision_command():
        context.configure(
            url=database_url,
            as_sql=True,
            target_metadata=target_metadata,
            process_revision_directives=process_revision_directives,
        )
        context.run_migrations()
        return

    # Support a dry-run sync flow to autogenerate migrations against an
    # in-memory SQLite DB without requiring async drivers. When
    # ALEMBIC_DRY_RUN=1 is set we use a synchronous sqlite engine and run
    # migrations directly; otherwise run the normal async flow.
    if os.getenv("ALEMBIC_DRY_RUN") == "1":
        engine = create_engine(database_url)
        with engine.connect() as connection:
            do_run_migrations(connection)
        engine.dispose()
        return

    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
