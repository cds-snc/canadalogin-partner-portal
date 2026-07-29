#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd -- "${script_dir}/../.." && pwd)"

status=0
ran_any=0

is_ci() {
  [ "${CI:-}" = "true" ]
}

handle_missing_tool() {
  local message="$1"

  if is_ci; then
    echo "${message}" >&2
    status=1
  else
    echo "${message} Skipping locally." >&2
  fi
}

package_has_script() {
  local package_file="$1"
  local script_name="$2"

  if command -v python3 >/dev/null 2>&1; then
    python3 - "$package_file" "$script_name" <<'PY'
import json
import sys

package_file = sys.argv[1]
script_name = sys.argv[2]

with open(package_file, encoding="utf-8") as package:
    data = json.load(package)

sys.exit(0 if script_name in data.get("scripts", {}) else 1)
PY
    return $?
  fi

  grep -Eq "\"${script_name}\"[[:space:]]*:" "${package_file}"
}

make_has_target() {
  local target="$1"

  [ -f "${repo_root}/Makefile" ] && grep -Eq "^${target}([[:space:]]*:|:)" "${repo_root}/Makefile"
}

python_module_available() {
  local module="$1"
  local python_command="${PYTHON:-}"

  if [ -z "${python_command}" ]; then
    if [ -x "${repo_root}/.venv/bin/python" ]; then
      python_command="${repo_root}/.venv/bin/python"
    else
      python_command="python3.12"
    fi
  fi

  command -v "${python_command}" >/dev/null 2>&1 && "${python_command}" -c "import ${module}" >/dev/null 2>&1
}

run_command() {
  local description="$1"
  shift

  ran_any=1
  echo "Running ${description}..."

  if ! "$@"; then
    status=1
  fi
}

if [ -f "${repo_root}/frontend/package.json" ] &&
  package_has_script "${repo_root}/frontend/package.json" "test"; then
  if ! command -v npm >/dev/null 2>&1; then
    handle_missing_tool "frontend/package.json has 'test', but npm is not installed."
  elif [ ! -d "${repo_root}/frontend/node_modules" ]; then
    handle_missing_tool "frontend/package.json has 'test', but frontend/node_modules is not installed."
  else
    run_command "frontend npm test" npm test --prefix "${repo_root}/frontend"
  fi
fi

if [ -d "${repo_root}/backend/tests" ]; then
  if make_has_target "run-pytest"; then
    if python_module_available "pytest"; then
      run_command "make run-pytest" env PYTHONDONTWRITEBYTECODE=1 make -C "${repo_root}" run-pytest
    else
      handle_missing_tool "backend/tests exists, but pytest is not installed."
    fi
  else
    echo "backend/tests exists, but Makefile has no run-pytest target. Skipping backend tests."
  fi
fi

if [ "${ran_any}" -eq 0 ]; then
  echo "No fast test target detected. Skipping tests."
fi

exit "${status}"
