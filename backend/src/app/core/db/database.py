import asyncio
import threading
from collections.abc import AsyncGenerator
from typing import Any

from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import DeclarativeBase, MappedAsDataclass

from ..config import settings


class Base(DeclarativeBase, MappedAsDataclass):
    pass


DATABASE_URI = settings.POSTGRES_URI
DATABASE_PREFIX = settings.POSTGRES_ASYNC_PREFIX
DATABASE_URL = f"{DATABASE_PREFIX}{DATABASE_URI}"

_lock = threading.Lock()
_engines: dict[int, Any] = {}
_sessions: dict[int, async_sessionmaker[AsyncSession]] = {}


def get_async_engine():
    loop = asyncio.get_running_loop()
    loop_id = id(loop)
    with _lock:
        if loop_id not in _engines:
            _engines[loop_id] = create_async_engine(DATABASE_URL, echo=False, future=True)
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
