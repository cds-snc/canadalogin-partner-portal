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


def get_async_engine() -> AsyncEngine:
    loop = asyncio.get_running_loop()
    loop_id = id(loop)
    with _lock:
        if loop_id not in _engines:
            _engines[loop_id] = build_async_engine(settings)
        return _engines[loop_id]


def local_session() -> AsyncSession:
    loop = asyncio.get_running_loop()
    loop_id = id(loop)
    engine = get_async_engine()
    with _lock:
        if loop_id not in _sessions:
            _sessions[loop_id] = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
        return _sessions[loop_id]()


async def async_get_db() -> AsyncGenerator[AsyncSession, None]:
    async with local_session() as db:
        yield db
