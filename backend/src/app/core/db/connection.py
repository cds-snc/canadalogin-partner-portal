import ssl
from typing import Any

import boto3
from sqlalchemy import event
from sqlalchemy.engine import URL
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine

from ..config import PostgresSettings


def get_database_url(db_settings: PostgresSettings) -> URL | str:
    if db_settings.POSTGRES_IAM_AUTH_ENABLED:
        return URL.create(
            "postgresql+asyncpg",
            username=db_settings.POSTGRES_USER,
            host=db_settings.POSTGRES_SERVER,
            port=db_settings.POSTGRES_PORT,
            database=db_settings.POSTGRES_DB,
        )
    return f"{db_settings.POSTGRES_ASYNC_PREFIX}{db_settings.POSTGRES_URI}"


def build_async_engine(db_settings: PostgresSettings, **engine_options: Any) -> AsyncEngine:
    """Use the writer for runtime and migrations; sign each new IAM connection."""
    url = get_database_url(db_settings)
    connect_args: dict[str, Any] = {}
    if db_settings.POSTGRES_IAM_AUTH_ENABLED:
        # RDS Proxy uses public certificates, not the direct-RDS-only CA bundle.
        connect_args["ssl"] = ssl.create_default_context()

    engine = create_async_engine(url, echo=False, future=True, connect_args=connect_args, **engine_options)
    if db_settings.POSTGRES_IAM_AUTH_ENABLED:
        # Keep the SDK credential provider chain (including refreshable ECS task
        # credentials), rather than copying access keys into a static session.
        region = db_settings.AWS_REGION
        rds = boto3.client("rds", region_name=region)

        @event.listens_for(engine.sync_engine, "do_connect")
        def provide_iam_token(dialect: Any, connection_record: Any, cargs: list[Any], cparams: dict[str, Any]) -> None:
            cparams["password"] = rds.generate_db_auth_token(
                DBHostname=cparams["host"],
                Port=cparams["port"],
                DBUsername=cparams["user"],
                Region=region,
            )

    return engine
