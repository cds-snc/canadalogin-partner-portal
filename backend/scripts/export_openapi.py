#!/usr/bin/env python3
"""Export or check the FastAPI OpenAPI schema for the backend."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
BACKEND_ROOT = REPO_ROOT / "backend"


def render_schema() -> str:
    """Return the current application schema in a stable text format."""
    sys.path.insert(0, str(BACKEND_ROOT))

    from src.app.main import app  # noqa: PLC0415 - imported after path setup

    return json.dumps(app.openapi(), indent=2, sort_keys=True) + "\n"


def display_path(path: Path) -> str:
    """Prefer a repository-relative path in command output."""
    try:
        return str(path.relative_to(REPO_ROOT))
    except ValueError:
        return str(path)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Export or check the FastAPI OpenAPI schema.",
    )
    parser.add_argument(
        "--output",
        default="openapi/openapi.json",
        help="Output path relative to the repo root, or an absolute path.",
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="Fail if the committed OpenAPI file does not match the backend app.",
    )
    args = parser.parse_args()

    output_path = (REPO_ROOT / args.output).resolve()
    rendered = render_schema()

    if args.check:
        if not output_path.exists():
            print(
                f"OpenAPI file is missing: {display_path(output_path)}",
                file=sys.stderr,
            )
            print(
                "Run `make export-openapi` when this repo commits an API contract.",
                file=sys.stderr,
            )
            return 1

        current = output_path.read_text(encoding="utf-8")
        if current != rendered:
            print(
                f"OpenAPI file is out of date: {display_path(output_path)}",
                file=sys.stderr,
            )
            print(
                "Run `make export-openapi` and review the contract diff.",
                file=sys.stderr,
            )
            return 1

        print(f"OpenAPI file is current: {display_path(output_path)}")
        return 0

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(rendered, encoding="utf-8")
    print(f"Wrote OpenAPI file: {display_path(output_path)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
