#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd -- "${script_dir}/../.." && pwd)"
status=0
ran_any=0
fix_scope="${DELOREAN_FIX_SCOPE:-all}"

case "${fix_scope}" in
  all | format | frontend | backend | ruff)
    ;;
  *)
    echo "Unknown DELOREAN_FIX_SCOPE='${fix_scope}'. Use all, format, frontend, backend, or ruff." >&2
    exit 1
    ;;
esac

is_ci() {
  [ "${CI:-}" = "true" ]
}

scope_includes() {
  local scope="$1"

  [ "${fix_scope}" = "all" ] || [ "${fix_scope}" = "${scope}" ]
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

ruff_config_present() {
  [ -f "${repo_root}/ruff.toml" ] ||
    [ -f "${repo_root}/.ruff.toml" ] ||
    { [ -f "${repo_root}/pyproject.toml" ] && grep -Eq '^\[tool\.ruff' "${repo_root}/pyproject.toml"; }
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

# Passed to run_command, which invokes it through its "$@" command arguments.
# shellcheck disable=SC2329
fix_generic_format() {
  local tmp_file
  tmp_file="$(mktemp "${TMPDIR:-/tmp}/delorean-autofix-files.XXXXXX")"

  if ! command -v perl >/dev/null 2>&1; then
    rm -f "${tmp_file}"
    handle_missing_tool "Generic whitespace fixes require perl."
    return
  fi

  find "${repo_root}" \
    -path "${repo_root}/.git" -prune -o \
    -path "*/node_modules" -prune -o \
    -path "*/dist" -prune -o \
    -path "*/build" -prune -o \
    -path "*/coverage" -prune -o \
    -path "*/storybook-static" -prune -o \
    -path "*/.venv" -prune -o \
    -path "*/venv" -prune -o \
    -path "*/__MACOSX" -prune -o \
    -path "*/__pycache__" -prune -o \
    -path "*/.pytest_cache" -prune -o \
    -type f \( \
      -name "*.md" -o \
      -name "*.yml" -o \
      -name "*.yaml" -o \
      -name "*.json" -o \
      -name "*.sh" -o \
      -path "${repo_root}/.github/hooks/pre-commit" -o \
      -path "${repo_root}/.github/hooks/commit-msg" -o \
      -path "${repo_root}/.github/hooks/pre-push" -o \
      -path "${repo_root}/agent-configs/shared/hooks/pre-commit" -o \
      -path "${repo_root}/agent-configs/shared/hooks/commit-msg" -o \
      -path "${repo_root}/agent-configs/shared/hooks/pre-push" \
    \) -print0 > "${tmp_file}"

  while IFS= read -r -d '' file; do
    perl -0pi -e 's/[ \t]+(?=\r?\n)//g; s/[ \t]+\z//;' "${file}"

    if [ -s "${file}" ]; then
      last_byte="$(tail -c 1 "${file}" | od -An -tx1 | tr -d '[:space:]')"
      if [ "${last_byte}" != "0a" ]; then
        printf '\n' >> "${file}"
      fi
    fi
  done < "${tmp_file}"

  rm -f "${tmp_file}"
}

fix_frontend() {
  local package_file="${repo_root}/frontend/package.json"

  if [ ! -f "${package_file}" ]; then
    return
  fi

  if package_has_script "${package_file}" "fix"; then
    run_frontend_script "fix"
  else
    run_frontend_script "lint:fix"
    run_frontend_script "format"
  fi
}

fix_backend() {
  if ! { [ -f "${repo_root}/backend/requirements-dev.txt" ] || [ -d "${repo_root}/backend" ]; }; then
    return
  fi

  if make_has_target "fmt-python"; then
    ran_any=1
    if python_module_available "black"; then
      run_command "make fmt-python" make -C "${repo_root}" fmt-python
    else
      handle_missing_tool "Backend formatting is configured, but black is not installed."
    fi
  fi
}

fix_ruff() {
  if ! ruff_config_present; then
    return
  fi

  ran_any=1

  if ! command -v ruff >/dev/null 2>&1; then
    handle_missing_tool "Ruff config is present, but ruff is not installed."
    return
  fi

  run_command "ruff check --fix" ruff check --fix "${repo_root}"
  run_command "ruff format" ruff format "${repo_root}"
}

if scope_includes "format"; then
  run_command "generic whitespace and final newline fixes" fix_generic_format
fi

if scope_includes "frontend"; then
  fix_frontend
fi

if scope_includes "backend"; then
  fix_backend
fi

if scope_includes "backend" || [ "${fix_scope}" = "ruff" ]; then
  fix_ruff
fi

if [ "${ran_any}" -eq 0 ] && [ "${status}" -eq 0 ]; then
  echo "No auto-fix commands detected for scope '${fix_scope}'."
fi

if [ "${status}" -eq 0 ]; then
  echo "Auto-fix pass completed. Review and stage any changed files before committing."
fi

exit "${status}"
