import asyncio
import threading
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncEngine, async_sessionmaker
from sqlalchemy.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import DeclarativeBase, MappedAsDataclass

from ..config import settings
from .connection import build_async_engine, get_database_url


class Base(DeclarativeBase, MappedAsDataclass):
    pass


DATABASE_URI = settings.POSTGRES_URI
DATABASE_PREFIX = settings.POSTGRES_ASYNC_PREFIX
DATABASE_URL = get_database_url(settings)

_lock = threading.Lock()
_engines: dict[int, AsyncEngine] = {}
_sessions: dict[int, async_sessionmaker[AsyncSession]] = {}
_reader_engines: dict[int, AsyncEngine] = {}
_reader_sessions: dict[int, async_sessionmaker[AsyncSession]] = {}


def get_async_engine(*, reader: bool = False) -> AsyncEngine:
    reader = reader and bool(settings.POSTGRES_READER_SERVER)
    engines = _reader_engines if reader else _engines
    loop = asyncio.get_running_loop()
    loop_id = id(loop)
    with _lock:
        if loop_id not in engines:
            engines[loop_id] = build_async_engine(settings, reader=reader)
        return engines[loop_id]


def local_session(*, reader: bool = False) -> AsyncSession:
    reader = reader and bool(settings.POSTGRES_READER_SERVER)
    sessions = _reader_sessions if reader else _sessions
    loop = asyncio.get_running_loop()
    loop_id = id(loop)
    engine = get_async_engine(reader=reader)
    with _lock:
        if loop_id not in sessions:
            sessions[loop_id] = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
        return sessions[loop_id]()


async def async_get_db() -> AsyncGenerator[AsyncSession, None]:
    async with local_session() as db:
        yield db


async def async_get_reader_db() -> AsyncGenerator[AsyncSession, None]:
    """Opt in only for stale-safe reads; auth and write paths keep async_get_db."""
    async with local_session(reader=True) as db:
        yield db
