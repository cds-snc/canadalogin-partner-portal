#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd -- "${script_dir}/../.." && pwd)"
status=0
ran_any=0
lint_scope="${DELOREAN_LINT_SCOPE:-all}"
lint_mode="${DELOREAN_LINT_MODE:-full}"

case "${lint_scope}" in
  all | frontend | backend | ruff)
    ;;
  *)
    echo "Unknown DELOREAN_LINT_SCOPE='${lint_scope}'. Use all, frontend, backend, or ruff." >&2
    exit 1
    ;;
esac

case "${lint_mode}" in
  full | quick)
    ;;
  *)
    echo "Unknown DELOREAN_LINT_MODE='${lint_mode}'. Use full or quick." >&2
    exit 1
    ;;
esac

is_ci() {
  [ "${CI:-}" = "true" ]
}

scope_includes() {
  local scope="$1"

  [ "${lint_scope}" = "all" ] || [ "${lint_scope}" = "${scope}" ]
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

run_frontend_script() {
  local script_name="$1"
  local package_file="${repo_root}/frontend/package.json"

  if ! package_has_script "${package_file}" "${script_name}"; then
    return
  fi

  ran_any=1

  if ! command -v npm >/dev/null 2>&1; then
    handle_missing_tool "frontend/package.json has '${script_name}', but npm is not installed."
    return
  fi

  if [ ! -d "${repo_root}/frontend/node_modules" ]; then
    handle_missing_tool "frontend/package.json has '${script_name}', but frontend/node_modules is not installed."
    return
  fi

  run_command "frontend npm run ${script_name}" npm run "${script_name}" --prefix "${repo_root}/frontend"
}

if scope_includes "frontend" && [ -f "${repo_root}/frontend/package.json" ]; then
  run_frontend_script "lint"
  if [ "${lint_mode}" = "full" ]; then
    run_frontend_script "typecheck"
  fi
  run_frontend_script "format:check"
fi

if scope_includes "backend" && { [ -f "${repo_root}/backend/requirements-dev.txt" ] || [ -f "${repo_root}/.flake8" ]; }; then
  if make_has_target "lint-python"; then
    ran_any=1
    if python_module_available "flake8"; then
      run_command "make lint-python" make -C "${repo_root}" lint-python
    else
      handle_missing_tool "Backend linting is configured, but flake8 is not installed."
    fi
  fi

  if make_has_target "fmt-ci-python"; then
    ran_any=1
    if python_module_available "black"; then
      run_command "make fmt-ci-python" make -C "${repo_root}" fmt-ci-python
    else
      handle_missing_tool "Backend format checking is configured, but black is not installed."
    fi
  fi
fi

if { scope_includes "backend" || [ "${lint_scope}" = "ruff" ]; } &&
  { [ -f "${repo_root}/ruff.toml" ] ||
    [ -f "${repo_root}/.ruff.toml" ] ||
    { [ -f "${repo_root}/pyproject.toml" ] && grep -Eq '^\[tool\.ruff' "${repo_root}/pyproject.toml"; }; }; then
  ran_any=1
  if command -v ruff >/dev/null 2>&1; then
    run_command "ruff check" ruff check "${repo_root}"
    run_command "ruff format --check" ruff format --check "${repo_root}"
  else
    handle_missing_tool "Ruff config is present, but ruff is not installed."
  fi
fi

if [ "${ran_any}" -eq 0 ] && [ "${status}" -eq 0 ]; then
  echo "No lint, typecheck, or stack format commands detected. Skipping lint checks."
fi

exit "${status}"
