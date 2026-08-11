import asyncio
import logging

from sqlalchemy import select

from ..app.core.config import settings
from ..app.core.db.database import AsyncSession, local_session
from ..app.models.role import Role
from ..app.models.user import User

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def _normalize_email(value: str) -> str:
    return value.strip().lower()


def _merge_role_ids(role_ids: list[int] | None, role_id: int) -> list[int]:
    merged_role_ids = list(role_ids or [])
    if role_id not in merged_role_ids:
        merged_role_ids.append(role_id)
    return merged_role_ids


async def _ensure_admin_role(session: AsyncSession) -> Role:
    role_name = settings.CLPP_ADMIN_ROLE_NAME.strip()
    result = await session.execute(select(Role).filter_by(name=role_name))
    role = result.scalar_one_or_none()

    if role is None:
        role = Role(
            name=role_name,
            description="Administrator role mapped from OIDC admin group",
        )
        session.add(role)
        await session.flush()
        logger.info("Created local bootstrap admin role %s.", role_name)
    elif role.is_deleted:
        role.is_deleted = False
        role.deleted_at = None
        logger.info("Reactivated local bootstrap admin role %s.", role_name)

    if role.id is None:
        raise RuntimeError("Failed to resolve bootstrap admin role id")

    return role


async def create_first_user(session: AsyncSession) -> None:
    try:
        email = settings.SUPERUSER
        if email is None or not email.strip():
            logger.info("No SUPERUSER email configured; skipping first superuser seed.")
            return

        normalized_email = _normalize_email(email)
        admin_role = await _ensure_admin_role(session)

        query = select(User).filter_by(email=normalized_email)
        result = await session.execute(query)
        user = result.scalar_one_or_none()

        if user is None:
            user = User(
                name=normalized_email,
                email=normalized_email,
                username=normalized_email,
                is_superuser=True,
                enabled=True,
                role_ids=[admin_role.id],
            )
            session.add(user)

            logger.info("Admin user %s created successfully.", normalized_email)

        else:
            if not user.name:
                user.name = normalized_email
            user.email = normalized_email
            user.username = normalized_email
            user.is_superuser = True
            user.enabled = True
            user.is_deleted = False
            user.deleted_at = None
            user.role_ids = _merge_role_ids(user.role_ids, admin_role.id)

            logger.info("Admin user %s already exists; refreshed local admin access.", normalized_email)

        await session.commit()

    except Exception as e:
        logger.error("Error creating admin user: %s", e)


async def main():
    async with local_session() as session:
        await create_first_user(session)


if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    loop.run_until_complete(main())
