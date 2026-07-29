#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd -- "${script_dir}/../.." && pwd)"
openapi_file="${OPENAPI_FILE:-openapi/openapi.json}"
openapi_path="${repo_root}/${openapi_file}"
mode="${DELOREAN_OPENAPI_CHECK_MODE:-auto}"
force=0
api_changed=0
openapi_contract_changed=0

case "${openapi_file}" in
  /*)
    openapi_path="${openapi_file}"
    ;;
esac

for arg in "$@"; do
  case "${arg}" in
    --force)
      force=1
      ;;
  esac
done

is_ci() {
  [ "${CI:-}" = "true" ]
}

make_has_target() {
  local target="$1"

  [ -f "${repo_root}/Makefile" ] && grep -Eq "^${target}([[:space:]]*:|:)" "${repo_root}/Makefile"
}

python_backend_available() {
  local python_command="${PYTHON:-}"

  if [ -z "${python_command}" ]; then
    if [ -x "${repo_root}/.venv/bin/python" ]; then
      python_command="${repo_root}/.venv/bin/python"
    else
      python_command="python3.12"
    fi
  fi

  command -v "${python_command}" >/dev/null 2>&1 &&
    PYTHONPATH="${repo_root}/backend" "${python_command}" -c "from app.main import app; app.openapi()" >/dev/null 2>&1
}

handle_missing_tool() {
  local message="$1"

  if is_ci; then
    echo "${message}" >&2
    return 1
  fi

  echo "${message} Skipping locally." >&2
  return 0
}

changed_files_from_git() {
  if [ -n "${DELOREAN_CHANGED_FILES:-}" ]; then
    printf "%s\n" "${DELOREAN_CHANGED_FILES}"
    return 0
  fi

  if [ -n "${GITHUB_BASE_REF:-}" ]; then
    if ! git -C "${repo_root}" rev-parse --verify "origin/${GITHUB_BASE_REF}" >/dev/null 2>&1; then
      git -C "${repo_root}" fetch --no-tags --depth=1 origin "${GITHUB_BASE_REF}" >/dev/null 2>&1 || true
    fi
    if git -C "${repo_root}" rev-parse --verify "origin/${GITHUB_BASE_REF}" >/dev/null 2>&1; then
      git -C "${repo_root}" diff --name-only "origin/${GITHUB_BASE_REF}...HEAD"
      return 0
    fi
  fi

  if [ -n "${GITHUB_EVENT_BEFORE:-}" ] &&
    [ "${GITHUB_EVENT_BEFORE}" != "0000000000000000000000000000000000000000" ] &&
    git -C "${repo_root}" rev-parse --verify "${GITHUB_EVENT_BEFORE}" >/dev/null 2>&1; then
    git -C "${repo_root}" diff --name-only "${GITHUB_EVENT_BEFORE}..HEAD"
    return 0
  fi

  local upstream=""
  upstream="$(git -C "${repo_root}" rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>/dev/null || true)"
  if [ -n "${upstream}" ]; then
    git -C "${repo_root}" diff --name-only "${upstream}...HEAD"
    return 0
  fi

  {
    git -C "${repo_root}" diff --cached --name-only --diff-filter=ACMRTD
    git -C "${repo_root}" diff --name-only --diff-filter=ACMRTD
    git -C "${repo_root}" ls-files --others --exclude-standard
  } | sort -u
}

is_backend_api_change() {
  local file="$1"

  case "${file}" in
    backend/app/*.py | backend/app/*/*.py | backend/app/*/*/*.py | backend/scripts/export_openapi.py)
      return 0
      ;;
    backend/requirements.txt | backend/requirements-dev.txt | openapi/* | openapi/*/* | openapi/*/*/*)
      return 0
      ;;
  esac

  return 1
}

is_openapi_contract_change() {
  local file="$1"

  [ "${file}" = "${openapi_file}" ]
}

if [ "${mode}" = "off" ]; then
  echo "OpenAPI checks are disabled by DELOREAN_OPENAPI_CHECK_MODE=off."
  exit 0
fi

if [ "${force}" -eq 0 ]; then
  changed_files="$(changed_files_from_git || true)"

  while IFS= read -r file; do
    [ -z "${file}" ] && continue
    if is_openapi_contract_change "${file}"; then
      openapi_contract_changed=1
    fi
    if is_backend_api_change "${file}"; then
      api_changed=1
    fi
  done <<EOF
${changed_files}
EOF

  if [ "${api_changed}" -eq 0 ]; then
    echo "No backend API or OpenAPI contract changes detected. Skipping OpenAPI checks."
    exit 0
  fi
fi

if [ ! -f "${openapi_path}" ]; then
  if [ "${mode}" = "required" ] || [ "${openapi_contract_changed}" -eq 1 ]; then
    echo "OpenAPI contract is required but ${openapi_file} is missing." >&2
    echo "Run \`make export-openapi\` and commit the reviewed contract." >&2
    exit 1
  fi

  echo "No committed OpenAPI contract found at ${openapi_file}."
  echo "Skipping freshness check because no contract is currently committed."
  echo "Run \`make export-openapi\` when the API contract should be created."
  exit 0
fi

if ! make_has_target "check-openapi"; then
  handle_missing_tool "Makefile has no check-openapi target."
  exit $?
fi

if ! python_backend_available; then
  handle_missing_tool "Backend dependencies for OpenAPI export are not installed."
  exit $?
fi

echo "Running OpenAPI freshness check for ${openapi_file}..."
make -C "${repo_root}" check-openapi
