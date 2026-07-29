#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(git -C "${script_dir}" rev-parse --show-toplevel)"
hooks_path="${script_dir#${repo_root}/}"

if ! git -C "${repo_root}" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "This script must be run inside a Git repository." >&2
  exit 1
fi

git -C "${repo_root}" config core.hooksPath "${hooks_path}"

executable_paths=(
  "${script_dir}/install.sh"
  "${script_dir}/pre-commit"
  "${script_dir}/commit-msg"
  "${script_dir}/pre-push"
  "${repo_root}/scripts/delorean/run-structure-checks.sh"
  "${repo_root}/scripts/delorean/run-autofix.sh"
  "${repo_root}/scripts/delorean/run-format-checks.sh"
  "${repo_root}/scripts/delorean/run-markdown-checks.sh"
  "${repo_root}/scripts/delorean/run-shellcheck.sh"
  "${repo_root}/scripts/delorean/run-lint.sh"
  "${repo_root}/scripts/delorean/run-openapi-checks.sh"
  "${repo_root}/scripts/delorean/run-secret-checks.sh"
  "${repo_root}/scripts/delorean/run-fast-tests.sh"
  "${repo_root}/scripts/delorean/run-container-checks.sh"
  "${repo_root}/scripts/delorean/run-local-verification.sh"
)

for executable_path in "${executable_paths[@]}"; do
  if [ -e "${executable_path}" ]; then
    chmod +x "${executable_path}"
  fi
done

echo "Git hooks installed from ${hooks_path}."
echo "Use 'make uninstall-hooks' to disable the local hook path."
