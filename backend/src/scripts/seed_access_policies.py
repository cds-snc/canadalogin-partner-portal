import asyncio
import logging
import traceback

from sqlalchemy import select

from ..app.core.config import settings
from ..app.core.db.database import AsyncSession, local_session
from ..app.models.access_policy import AccessPolicy

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DEFAULT_POLICIES = [
    ("admin", "departments", "read"),
    ("admin", "departments", "write"),
    ("admin", "tasks", "read"),
    ("admin", "tasks", "write"),
    ("admin", "tiers", "read"),
    ("admin", "tiers", "write"),
    ("admin", "rate_limits", "read"),
    ("admin", "rate_limits", "write"),
    ("admin", "roles", "read"),
    ("admin", "roles", "write"),
    ("admin", "rp_applications", "read"),
    ("admin", "rp_applications", "write"),
    ("application owners", "rp_applications", "read"),
    ("application owners", "rp_applications", "write"),
    ("admin", "users_admin", "read"),
    ("admin", "users_admin", "write"),
    ("admin", "workspace", "read"),
    ("admin", "workspace", "write"),
]


async def seed_access_policies(session: AsyncSession) -> None:
    for subject, resource, action in DEFAULT_POLICIES:
        query = select(AccessPolicy).where(
            AccessPolicy.subject == subject,
            AccessPolicy.resource == resource,
            AccessPolicy.action == action,
        )
        result = await session.execute(query)
        existing_policy = result.scalar_one_or_none()

        if existing_policy is not None:
            logger.info("Policy already exists: %s %s %s", subject, resource, action)
            continue

        session.add(AccessPolicy(subject=subject, resource=resource, action=action))
        logger.info("Seeded policy: %s %s %s", subject, resource, action)

    await session.commit()


async def main() -> None:
    # Diagnostic: log target DB connection
    try:
        async with local_session() as session:
            # print some connection info
            try:
                # show configured DB url pieces from settings for debugging
                logger.info(
                    "Seeding policies to DB: %s@%s:%s/%s",
                    settings.POSTGRES_USER,
                    settings.POSTGRES_SERVER,
                    settings.POSTGRES_PORT,
                    settings.POSTGRES_DB,
                )
            except Exception:
                logger.info("Could not read DB settings for debug output")

            await seed_access_policies(session)
    except Exception as exc:  # pragma: no cover - runtime helper
        logger.error("Failed to seed access policies: %s", exc)
        logger.error(traceback.format_exc())


if __name__ == "__main__":
    asyncio.run(main())
