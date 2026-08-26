#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd -- "${script_dir}/../.." && pwd)"

tmp_file="$(mktemp "${TMPDIR:-/tmp}/delorean-shell-files.XXXXXX")"
trap 'rm -f "${tmp_file}"' EXIT

if [ "$#" -gt 0 ]; then
  target_files=()

  for input_path in "$@"; do
    if [ -f "${input_path}" ]; then
      normalized_path="$(cd -- "$(dirname -- "${input_path}")" && pwd)/$(basename -- "${input_path}")"
    elif [ -f "${repo_root}/${input_path}" ]; then
      normalized_path="${repo_root}/${input_path}"
    else
      echo "Skipping missing shell-check file: ${input_path}" >&2
      continue
    fi

    case "${normalized_path}" in
      "${repo_root}"/*)
        ;;
      *)
        echo "Shell-check file is outside the repository: ${input_path}" >&2
        exit 1
        ;;
    esac

    rel_path="${normalized_path#"${repo_root}"/}"
    case "${rel_path}" in
      *.sh | .github/hooks/pre-commit | .github/hooks/commit-msg | .github/hooks/pre-push | \
        agent-configs/shared/hooks/pre-commit | agent-configs/shared/hooks/commit-msg | agent-configs/shared/hooks/pre-push)
        target_files+=("${normalized_path}")
        ;;
    esac
  done

  if [ "${#target_files[@]}" -eq 0 ]; then
    echo "No shell scripts matched the requested scope."
    exit 0
  fi

  printf '%s\0' "${target_files[@]}" > "${tmp_file}"
else
  find "${repo_root}" \
    -path "${repo_root}/.git" -prune -o \
    -path "*/node_modules" -prune -o \
    -path "*/dist" -prune -o \
    -path "*/build" -prune -o \
    -path "*/coverage" -prune -o \
    -path "*/storybook-static" -prune -o \
    -path "*/.venv" -prune -o \
    -path "*/venv" -prune -o \
    -path "*/.uv-cache" -prune -o \
    -path "*/.mypy_cache" -prune -o \
    -path "*/.ruff_cache" -prune -o \
    -path "*/test-results" -prune -o \
    -path "*/playwright-report" -prune -o \
    -path "*/__MACOSX" -prune -o \
    -path "*/__pycache__" -prune -o \
    -path "*/.pytest_cache" -prune -o \
    -type f \( \
      -name "*.sh" -o \
      -path "${repo_root}/.github/hooks/pre-commit" -o \
      -path "${repo_root}/.github/hooks/commit-msg" -o \
      -path "${repo_root}/.github/hooks/pre-push" -o \
      -path "${repo_root}/agent-configs/shared/hooks/pre-commit" -o \
      -path "${repo_root}/agent-configs/shared/hooks/commit-msg" -o \
      -path "${repo_root}/agent-configs/shared/hooks/pre-push" \
    \) -print0 > "${tmp_file}"
fi

abs_files=()
rel_files=()

while IFS= read -r -d '' file; do
  abs_files+=("${file}")
  rel_files+=("${file#"${repo_root}"/}")
done < "${tmp_file}"

if [ "${#abs_files[@]}" -eq 0 ]; then
  echo "No shell scripts found."
  exit 0
fi

if command -v shellcheck >/dev/null 2>&1; then
  shellcheck -P "${repo_root}/bin" -x "${abs_files[@]}"
elif command -v docker >/dev/null 2>&1 && { [ "${CI:-}" = "true" ] || [ "${USE_DOCKER_SHELLCHECK:-}" = "1" ]; }; then
  shellcheck_image="${SHELLCHECK_DOCKER_IMAGE:-koalaman/shellcheck:stable}"
  echo "Using ShellCheck Docker image: ${shellcheck_image}"
  docker run --rm \
    -v "${repo_root}:/mnt" \
    -w /mnt \
    "${shellcheck_image}" \
    -P ./bin \
    -x \
    "${rel_files[@]}"
else
  if [ "${CI:-}" = "true" ]; then
    echo "ShellCheck is required in CI, but neither shellcheck nor Docker is available." >&2
    exit 1
  fi

  echo "ShellCheck is not installed. Skipping shell checks locally." >&2
  echo "Install shellcheck, or set USE_DOCKER_SHELLCHECK=1 to use Docker." >&2
fi
