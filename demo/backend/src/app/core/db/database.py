from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import DeclarativeBase, MappedAsDataclass


class Base(DeclarativeBase, MappedAsDataclass):
	pass


local_session = None


async def async_get_db() -> AsyncGenerator[AsyncSession, None]:
	yield None  # type: ignore[misc]