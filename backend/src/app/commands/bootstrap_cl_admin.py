"""Run the explicit configured CL Admin roster bootstrap command."""

import asyncio
import logging

from ..core.config import settings
from ..core.db.database import local_session
from ..services.cl_admin_roster_bootstrap import (
    CLAdminRosterBootstrapService,
    CLAdminRosterConfigurationError,
)

logger = logging.getLogger(__name__)


async def run_bootstrap_command() -> int:
    """Bootstrap from application configuration and return a process-safe status."""

    try:
        async with local_session() as session:
            outcome = await CLAdminRosterBootstrapService().bootstrap(
                session,
                configured_emails=settings.INITIAL_CL_ADMIN_EMAILS,
            )
    except CLAdminRosterConfigurationError:
        logger.error("CL Admin roster bootstrap failed category=invalid_configuration")
        return 1
    except Exception:
        logger.error("CL Admin roster bootstrap failed category=operation_failed")
        return 1

    logger.info(
        "CL Admin roster bootstrap completed created_users=%d created_assignments=%d unchanged_assignments=%d skipped=%s",
        outcome.created_users,
        outcome.created_assignments,
        outcome.unchanged_assignments,
        outcome.skipped,
    )
    return 0


def main() -> None:
    """Run the command as a module entry point."""

    raise SystemExit(asyncio.run(run_bootstrap_command()))


if __name__ == "__main__":
    main()
