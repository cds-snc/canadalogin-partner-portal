#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd -- "${script_dir}/../.." && pwd)"

if [ -f "${repo_root}/.markdownlint.json" ] && command -v markdownlint-cli2 >/dev/null 2>&1; then
  cd "${repo_root}"
  markdownlint-cli2 "**/*.md" "#node_modules"
  exit 0
fi

if [ -f "${repo_root}/.markdownlint.json" ] && command -v markdownlint >/dev/null 2>&1; then
  cd "${repo_root}"
  markdownlint "**/*.md"
  exit 0
fi

tmp_file="$(mktemp "${TMPDIR:-/tmp}/delorean-markdown-files.XXXXXX")"
trap 'rm -f "${tmp_file}"' EXIT

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
