#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd -- "${script_dir}/../.." && pwd)"
status=0
ran_any=0
container_check_mode="${DELOREAN_CONTAINER_CHECK_MODE:-off}"

is_ci() {
  [ "${CI:-}" = "true" ]
}

truthy() {
  local value="$1"

  [ "${value}" = "1" ] || [ "${value}" = "true" ]
}

container_checks_required() {
  truthy "${DELOREAN_CONTAINER_CHECKS_REQUIRED:-}" ||
    [ "${container_check_mode}" = "required" ]
}

container_checks_enabled() {
  truthy "${DELOREAN_RUN_CONTAINER_CHECKS:-}" ||
    truthy "${DELOREAN_CONTAINER_CHECKS_ENABLED:-}" ||
    [ "${container_check_mode}" = "auto" ] ||
    container_checks_required
}

make_has_target() {
  local target="$1"

  [ -f "${repo_root}/Makefile" ] && grep -Eq "^${target}([[:space:]]*:|:)" "${repo_root}/Makefile"
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

skip_or_fail() {
  local message="$1"

  if is_ci && container_checks_required; then
    echo "${message}" >&2
    status=1
  else
    echo "${message}"
  fi
}

if [ ! -f "${repo_root}/backend/Dockerfile" ]; then
  echo "No backend/Dockerfile found. Skipping container checks."
  exit 0
fi

case "${container_check_mode}" in
  off | auto | required)
    ;;
  *)
    echo "Unknown DELOREAN_CONTAINER_CHECK_MODE='${container_check_mode}'. Use off, auto, or required." >&2
    exit 1
    ;;
esac

if ! container_checks_enabled; then
  echo "Container checks are disabled by default for this starter."
  echo "Set DELOREAN_RUN_CONTAINER_CHECKS=1 or DELOREAN_CONTAINER_CHECK_MODE=auto to run them."
  exit 0
fi

if ! command -v docker >/dev/null 2>&1; then
  skip_or_fail "Docker CLI is not installed. Install the Docker CLI with a Docker-compatible local container runtime, such as Colima, Docker Desktop if approved, or another approved runtime. Skipping container checks."
  exit "${status}"
fi

if ! docker info >/dev/null 2>&1; then
  if command -v colima >/dev/null 2>&1; then
    skip_or_fail "Docker CLI is installed, but no Docker-compatible daemon is available. If using Colima, run: colima start. Skipping container checks."
  else
    skip_or_fail "Docker CLI is installed, but no Docker-compatible daemon is available. Start an approved local container runtime, then rerun container checks. Skipping container checks."
  fi
  exit "${status}"
fi

if make_has_target "build-backend-container"; then
  run_command "backend container build" make -C "${repo_root}" build-backend-container
else
  skip_or_fail "backend/Dockerfile exists, but Makefile has no build-backend-container target. Skipping container build."
fi

if [ "${status}" -eq 0 ] && make_has_target "test-backend-container"; then
  run_command "backend container health check" make -C "${repo_root}" test-backend-container
elif [ "${status}" -eq 0 ]; then
  echo "Makefile has no test-backend-container target. Skipping container health check."
fi

if make_has_target "scan-backend-container"; then
  if command -v trivy >/dev/null 2>&1 ||
    command -v grype >/dev/null 2>&1 ||
    { command -v docker >/dev/null 2>&1 && docker scout version >/dev/null 2>&1; }; then
    run_command "backend container scan adapter" make -C "${repo_root}" scan-backend-container
  else
    echo "No container scanner found. Install Docker Scout, Trivy, or Grype to scan the backend image."
    echo "Skipping container scan."
  fi
else
  echo "Makefile has no scan-backend-container target. Container scanning is not configured."
fi

if [ "${ran_any}" -eq 0 ]; then
  echo "No container checks ran."
fi

exit "${status}"
