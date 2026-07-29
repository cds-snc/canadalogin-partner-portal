#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
status=0
passed=0
failed=0

run_check() {
  local name="$1"
  local script="$2"

  echo
  echo "==> ${name}"
  if ! "${script_dir}/${script}"; then
    status=1
    failed=$((failed + 1))
  else
    passed=$((passed + 1))
  fi
}

run_check "Repo structure checks" "run-structure-checks.sh"
run_check "Delorean change-state checks" "run-delorean-state-checks.sh"
run_check "Format checks" "run-format-checks.sh"
run_check "Markdown checks" "run-markdown-checks.sh"
run_check "Shell checks" "run-shellcheck.sh"
run_check "Lint and type checks" "run-lint.sh"
run_check "Frontend GC Design System checks" "run-frontend-standards-checks.sh"
run_check "UI page shell checks" "run-ui-page-shell-checks.sh"
run_check "Secret checks" "run-secret-checks.sh"
run_check "Fast tests" "run-fast-tests.sh"
run_check "Optional container checks" "run-container-checks.sh"

echo
echo "==> Summary"
echo "Passed checks: ${passed}"
echo "Failed checks: ${failed}"

if [ "${status}" -ne 0 ]; then
  echo "For auto-fixable formatting issues, run 'make fix', review the changes, stage them, and rerun verification."
fi

exit "${status}"
