#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd -- "${script_dir}/../.." && pwd)"

target_files=()

if [ "$#" -gt 0 ]; then
  for input_path in "$@"; do
    if [ -f "${input_path}" ]; then
      normalized_path="$(cd -- "$(dirname -- "${input_path}")" && pwd)/$(basename -- "${input_path}")"
    elif [ -f "${repo_root}/${input_path}" ]; then
      normalized_path="${repo_root}/${input_path}"
    else
      echo "Skipping missing format-check file: ${input_path}" >&2
      continue
    fi

    rel_path="${normalized_path#${repo_root}/}"

    case "${rel_path}" in
      *.md | *.yml | *.yaml | *.json | *.sh | \
      .github/hooks/pre-commit | .github/hooks/commit-msg | .github/hooks/pre-push | \
      agent-configs/shared/hooks/pre-commit | agent-configs/shared/hooks/commit-msg | agent-configs/shared/hooks/pre-push)
        target_files+=("${normalized_path}")
        ;;
    esac
  done

  if [ "${#target_files[@]}" -eq 0 ]; then
    echo "No files matched the requested format-check scope."
    exit 0
  fi
fi

tmp_file="$(mktemp "${TMPDIR:-/tmp}/delorean-format-files.XXXXXX")"
grep_file="$(mktemp "${TMPDIR:-/tmp}/delorean-trailing-space.XXXXXX")"
trap 'rm -f "${tmp_file}" "${grep_file}"' EXIT

if [ "${#target_files[@]}" -gt 0 ]; then
  printf '%s\0' "${target_files[@]}" > "${tmp_file}"
else
  find "${repo_root}" \
    -path "${repo_root}/.git" -prune -o \
    -path "*/node_modules" -prune -o \
    -path "*/dist" -prune -o \
    -path "*/build" -prune -o \
    -path "*/coverage" -prune -o \
    -path "*/storybook-static" -prune -o \
    -path "*/.playwright-mcp" -prune -o \
    -path "*/.venv" -prune -o \
    -path "*/venv" -prune -o \
    -path "*/__MACOSX" -prune -o \
    -path "*/__pycache" -prune -o \
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
fi

status=0

while IFS= read -r -d '' file; do
  rel_path="${file#${repo_root}/}"

  if grep -nH '[[:blank:]]$' "${file}" > "${grep_file}" 2>/dev/null; then
    echo "Trailing whitespace found in ${rel_path}:"
    sed "s#${repo_root}/##" "${grep_file}"
    status=1
  fi
  : > "${grep_file}"

  if [ -s "${file}" ]; then
    last_byte="$(tail -c 1 "${file}" | od -An -tx1 | tr -d '[:space:]')"
    if [ "${last_byte}" != "0a" ]; then
      echo "Missing final newline: ${rel_path}"
      status=1
    fi
  fi
done < "${tmp_file}"

if git -C "${repo_root}" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  if [ "${#target_files[@]}" -gt 0 ]; then
    git -C "${repo_root}" diff --check -- "${target_files[@]#${repo_root}/}" || status=1
  else
    git -C "${repo_root}" diff --check || status=1
  fi
fi

if [ "${status}" -eq 0 ]; then
  echo "Format checks passed."
fi

exit "${status}"
