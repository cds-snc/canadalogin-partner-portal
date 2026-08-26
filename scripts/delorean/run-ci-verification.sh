#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd -- "${script_dir}/../.." && pwd)"
base_ref="${DELOREAN_BASE_SHA:-}"
head_ref="${DELOREAN_HEAD_SHA:-HEAD}"

if [[ "${base_ref}" =~ ^0+$ ]]; then
  base_ref=""
fi

if [ -z "${base_ref}" ]; then
  echo "No CI comparison base was provided; running full-repository verification."
  exec "${script_dir}/run-local-verification.sh"
fi

case "${base_ref}" in
  -*)
    echo "Invalid CI comparison base: ${base_ref}" >&2
    exit 1
    ;;
esac

case "${head_ref}" in
  -*)
    echo "Invalid CI comparison head: ${head_ref}" >&2
    exit 1
    ;;
esac

if ! resolved_base="$(git -C "${repo_root}" rev-parse --verify "${base_ref}^{commit}" 2>/dev/null)"; then
  echo "Unable to resolve CI comparison base as a commit: ${base_ref}" >&2
  exit 1
fi

if ! resolved_head="$(git -C "${repo_root}" rev-parse --verify "${head_ref}^{commit}" 2>/dev/null)"; then
  echo "Unable to resolve CI comparison head as a commit: ${head_ref}" >&2
  exit 1
fi

changed_file_list="$(mktemp "${TMPDIR:-/tmp}/delorean-ci-changed-files.XXXXXX")"
trap 'rm -f "${changed_file_list}"' EXIT

if ! git -C "${repo_root}" diff \
  --name-only \
  --diff-filter=ACMRTUXB \
  -z \
  "${resolved_base}...${resolved_head}" \
  -- > "${changed_file_list}"; then
  echo "Unable to calculate the CI change set for ${resolved_base}...${resolved_head}." >&2
  exit 1
fi

changed_files=()
while IFS= read -r -d '' file; do
  changed_files+=("${file}")
done < "${changed_file_list}"

echo "Running PR-aware verification for ${#changed_files[@]} changed file(s)."
echo "Comparison: ${resolved_base}...${resolved_head}"

DELOREAN_FILE_SCOPE=changed \
  DELOREAN_FORMAT_DIFF_BASE="${resolved_base}" \
  DELOREAN_FORMAT_DIFF_HEAD="${resolved_head}" \
  "${script_dir}/run-local-verification.sh" "${changed_files[@]}"
