#!/usr/bin/env bash
# Fail if the Alembic migration history is not a single linear chain.
#
# Catches the two problems that show up when migrations are added on
# parallel branches:
#   - two revision files sharing the same revision ID
#   - two revisions with the same parent (multiple heads)
#
# Run from the repo root: .github/workflows/scripts/check-alembic-heads.sh
set -euo pipefail

cd "$(dirname "$0")/../../../backend/src"

output="$(uv run --locked alembic heads 2>&1)"
echo "$output"

if grep -q "is present more than once" <<<"$output"; then
  echo "::error::Duplicate Alembic revision ID. Give your migration a new revision ID (new migrations get a timestamp ID automatically)."
  exit 1
fi

heads="$(grep -c "(head)" <<<"$output" || true)"
if [ "$heads" -ne 1 ]; then
  echo "::error::Expected 1 Alembic head, found ${heads}. Rebase on main and set your migration's down_revision (and the 'Revises:' line in its docstring) to the current head."
  exit 1
fi
