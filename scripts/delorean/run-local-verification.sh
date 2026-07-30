#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
status=0
passed=0
failed=0
verification_files=()
has_verification_files=0
format_files=()
has_format_files=0
markdown_files=()
has_markdown_files=0

for file in "$@"; do
  [ -z "${file}" ] && continue
  verification_files+=("${file}")
  has_verification_files=1

  case "${file}" in
    *.md)
      format_files+=("${file}")
      markdown_files+=("${file}")
      has_format_files=1
      has_markdown_files=1
      ;;
    *.json | *.yml | *.yaml | *.sh | .github/hooks/* | agent-configs/shared/hooks/* | scripts/delorean/*)
      format_files+=("${file}")
      has_format_files=1
      ;;
  esac
done

run_check() {
  local name="$1"
  local script="$2"
  shift 2

  echo
  echo "==> ${name}"
  if ! "${script_dir}/${script}" "$@"; then
    status=1
    failed=$((failed + 1))
  else
    passed=$((passed + 1))
  fi
}

run_check "Repo structure checks" "run-structure-checks.sh"
run_check "Delorean change-state checks" "run-delorean-state-checks.sh"
if [ "${has_verification_files}" -eq 1 ]; then
  echo
  echo "==> Format checks"
  if [ "${has_format_files}" -eq 1 ]; then
    if ! "${script_dir}/run-format-checks.sh" "${format_files[@]}"; then
      status=1
      failed=$((failed + 1))
    else
      passed=$((passed + 1))
    fi
  else
    echo "No requested files matched format checks. Skipping."
    passed=$((passed + 1))
  fi

  echo
  echo "==> Markdown checks"
  if [ "${has_markdown_files}" -eq 1 ]; then
    if ! "${script_dir}/run-markdown-checks.sh" "${markdown_files[@]}"; then
      status=1
      failed=$((failed + 1))
    else
      passed=$((passed + 1))
    fi
  else
    echo "No requested files matched Markdown checks. Skipping."
    passed=$((passed + 1))
  fi
else
  run_check "Format checks" "run-format-checks.sh"
  run_check "Markdown checks" "run-markdown-checks.sh"
fi
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
