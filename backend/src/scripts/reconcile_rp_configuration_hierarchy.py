"""Inventory RP hierarchy gaps without changing data.

Run from ``backend``. The report and candidate manifest use only public UUIDs,
enum decisions, counts, and digests; names, contact data, provider identifiers,
questionnaire answers, and secrets are excluded.
"""

from __future__ import annotations

import argparse
import json
from collections.abc import Mapping
from pathlib import Path
from typing import Any

import sqlalchemy as sa

from ..app.core.config import settings
from ..migrations.rp_configuration_hierarchy_reconciliation_v1 import (
    build_candidate_manifest,
    build_report,
    has_blocking_findings,
    load_snapshot,
    validate_reviewed_manifest,
)


def _write_json(path: Path | None, payload: Mapping[str, Any]) -> None:
    rendered = json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True) + "\n"
    if path is None:
        print(rendered, end="")
        return
    path.write_text(rendered, encoding="utf-8")


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, help="Write the dry-run report")
    parser.add_argument(
        "--candidate-manifest",
        type=Path,
        help="Write an unreviewed explicit UUID mapping template",
    )
    parser.add_argument(
        "--reviewed-manifest",
        type=Path,
        help="Validate a reviewed manifest against the current snapshot",
    )
    parser.add_argument(
        "--fail-on-findings",
        action="store_true",
        help="Exit non-zero when any hierarchy finding remains",
    )
    return parser.parse_args()


def main() -> int:
    args = _parse_args()
    engine = sa.create_engine(settings.POSTGRES_SYNC_PREFIX + settings.POSTGRES_URI)
    try:
        with engine.connect() as connection:
            report = build_report(load_snapshot(connection))
    finally:
        engine.dispose()

    _write_json(args.output, report)
    if args.candidate_manifest is not None:
        _write_json(args.candidate_manifest, build_candidate_manifest(report))
    if args.reviewed_manifest is not None:
        try:
            manifest = json.loads(args.reviewed_manifest.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            raise SystemExit("reviewed manifest is not readable valid JSON") from exc
        errors = validate_reviewed_manifest(manifest, report)
        if errors:
            raise SystemExit("reviewed manifest is invalid: " + "; ".join(errors))
    return 1 if args.fail_on_findings and has_blocking_findings(report) else 0


if __name__ == "__main__":
    raise SystemExit(main())
