#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd -- "${script_dir}/../.." && pwd)"

target_files=()
has_target_files=0

if [ "$#" -gt 0 ]; then
  for input_path in "$@"; do
    case "${input_path}" in
      *.md)
        ;;
      *)
        continue
        ;;
    esac

    if [ -f "${input_path}" ]; then
      normalized_path="$(cd -- "$(dirname -- "${input_path}")" && pwd)/$(basename -- "${input_path}")"
    elif [ -f "${repo_root}/${input_path}" ]; then
      normalized_path="${repo_root}/${input_path}"
    else
      echo "Skipping missing markdown file: ${input_path}" >&2
      continue
    fi

    target_files+=("${normalized_path}")
    has_target_files=1
  done

  if [ "${has_target_files}" -eq 0 ]; then
    echo "No markdown files matched the requested scope."
    exit 0
  fi
fi

markdownlint_targets=()

if [ "${has_target_files}" -eq 1 ]; then
  for file in "${target_files[@]}"; do
    if [[ "${file}" == "${repo_root}/"* ]]; then
      markdownlint_targets+=("${file#${repo_root}/}")
    else
      markdownlint_targets+=("${file}")
    fi
  done
fi

if [ -f "${repo_root}/.markdownlint.json" ] && command -v markdownlint-cli2 >/dev/null 2>&1; then
  cd "${repo_root}"
  if [ "${has_target_files}" -eq 1 ]; then
    markdownlint-cli2 "${markdownlint_targets[@]}"
    exit 0
  fi
  markdownlint-cli2 "**/*.md" "#node_modules"
  exit 0
fi

if [ -f "${repo_root}/.markdownlint.json" ] && command -v markdownlint >/dev/null 2>&1; then
  cd "${repo_root}"
  if [ "${has_target_files}" -eq 1 ]; then
    markdownlint "${markdownlint_targets[@]}"
    exit 0
  fi
  markdownlint "**/*.md"
  exit 0
fi

tmp_file="$(mktemp "${TMPDIR:-/tmp}/delorean-markdown-files.XXXXXX")"
trap 'rm -f "${tmp_file}"' EXIT

if [ "${has_target_files}" -eq 1 ]; then
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
    -path "*/__MACOSX" -prune -o \
    -path "*/__pycache__" -prune -o \
    -path "*/.pytest_cache" -prune -o \
    -type f -name "*.md" -print0 > "${tmp_file}"
fi

status=0

while IFS= read -r -d '' file; do
  rel_path="${file#${repo_root}/}"
  first_line="$(sed -n '/[^[:space:]]/{p;q;}' "${file}")"

  if [ -z "${first_line}" ]; then
    echo "Markdown file is empty: ${rel_path}"
    status=1
    continue
  fi

  if [ "${first_line}" = "---" ]; then
    first_line="$(awk '
      BEGIN { in_frontmatter = 1; next_line = 0 }
      NR == 1 { next }
      in_frontmatter && $0 == "---" { in_frontmatter = 0; next_line = 1; next }
      next_line && $0 !~ /^[[:space:]]*$/ { print; exit }
    ' "${file}")"
  fi

  if [[ ! "${first_line}" =~ ^#\  ]]; then
    echo "Markdown file should start with a level-one heading: ${rel_path}"
    status=1
  fi
done < "${tmp_file}"

if [ "${status}" -eq 0 ]; then
  echo "Markdown checks passed."
fi

exit "${status}"
