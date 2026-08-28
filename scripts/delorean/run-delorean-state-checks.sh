#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd -- "${script_dir}/../.." && pwd)"

state_files=()
while IFS= read -r -d '' file; do
  state_files+=("${file}")
done < <(find "${repo_root}/delorean/evidence" \
  -mindepth 2 \
  -maxdepth 2 \
  -type f \
  -name "change-state.yaml" \
  -print0)

if [ "${#state_files[@]}" -eq 0 ]; then
  echo "No Delorean change-state files found; skipping state checks."
  exit 0
fi

required_keys=(
  "version:"
  "change:"
  "id:"
  "currentPhase:"
  "openspec:"
  "lifecycleState:"
  "controlBoundary:"
  "gates:"
  "evidence:"
  "reentry:"
)

status=0

for file in "${state_files[@]}"; do
  rel_path="${file#"${repo_root}"/}"
  change_id="$(basename "$(dirname "${file}")")"

  for key in "${required_keys[@]}"; do
    if ! grep -Fq "${key}" "${file}"; then
      echo "${rel_path}: missing required key '${key}'" >&2
      status=1
    fi
  done

  if ! grep -Fq "id: \"${change_id}\"" "${file}" \
    && ! grep -Fq "id: ${change_id}" "${file}"; then
    echo "${rel_path}: change.id does not match path change ID '${change_id}'" >&2
    status=1
  fi

  if grep -Fq "inScope: true" "${file}"; then
    if grep -Eq 'lifecycleState:[[:space:]]*"?archived"?' "${file}"; then
      archive_path_line="$(grep -E '^[[:space:]]*archivePath:' "${file}" | head -n 1 || true)"
      if ! printf '%s' "${archive_path_line}" | grep -Fq "openspec/changes/archive/" \
        || ! printf '%s' "${archive_path_line}" | grep -Fq "${change_id}"; then
        echo "${rel_path}: archived OpenSpec state must record archivePath under openspec/changes/archive/ for '${change_id}'" >&2
        status=1
      fi
    elif ! grep -Fq "activeChangePath: \"openspec/changes/${change_id}\"" "${file}" \
      && ! grep -Fq "activeChangePath: openspec/changes/${change_id}" "${file}"; then
      echo "${rel_path}: openspec.activeChangePath does not match path change ID '${change_id}'" >&2
      status=1
    fi
  fi
done

if [ "${status}" -eq 0 ]; then
  echo "Delorean change-state checks passed."
fi

exit "${status}"
