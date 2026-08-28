"""Explicit, triple-gated CLI for deterministic local persona fixtures."""

from __future__ import annotations

import argparse
import asyncio
import json
import logging
import os
from collections.abc import Mapping, Sequence

from ..app.core.config import settings
from ..app.core.db.database import local_session
from ..app.services.local_persona_seed_service import (
    LocalPersonaSeedError,
    LocalPersonaSeedGate,
    LocalPersonaSeedReport,
    LocalPersonaSeedService,
)

logger = logging.getLogger(__name__)


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Seed or explicitly clean up fake local persona fixtures.",
    )
    parser.add_argument(
        "--cleanup",
        action="store_true",
        help="Remove only the deterministic local persona fixture namespace.",
    )
    parser.add_argument(
        "--confirm-cleanup",
        action="store_true",
        help="Required explicit confirmation when --cleanup is used.",
    )
    return parser


async def _execute(
    *,
    cleanup: bool,
    confirm_cleanup: bool,
    gate: LocalPersonaSeedGate,
) -> LocalPersonaSeedReport:
    service = LocalPersonaSeedService()
    async with local_session() as session:
        if cleanup:
            return await service.cleanup(
                session,
                gate=gate,
                confirmed=confirm_cleanup,
                terms_version=settings.TERMS_VERSION,
            )
        return await service.seed(
            session,
            gate=gate,
            terms_version=settings.TERMS_VERSION,
        )


def main(
    argv: Sequence[str] | None = None,
    *,
    environ: Mapping[str, str] | None = None,
) -> int:
    args = _parser().parse_args(argv)
    if args.confirm_cleanup and not args.cleanup:
        _parser().error("--confirm-cleanup is valid only with --cleanup")

    gate = LocalPersonaSeedGate.from_environment(environ if environ is not None else os.environ)
    try:
        # Validate before opening a database session so every non-local or
        # inconsistent composition fails before any persistence interaction.
        gate.require_enabled()
        report = asyncio.run(
            _execute(
                cleanup=args.cleanup,
                confirm_cleanup=args.confirm_cleanup,
                gate=gate,
            )
        )
    except LocalPersonaSeedError as exc:
        logger.error(json.dumps(exc.to_dict(), sort_keys=True))
        return 1
    except Exception:
        logger.error(
            json.dumps(
                {
                    "code": "LOCAL_PERSONA_SEED_UNEXPECTED_FAILURE",
                    "message": "local persona command failed safely",
                },
                sort_keys=True,
            )
        )
        return 1

    print(json.dumps(report.to_dict(), sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
