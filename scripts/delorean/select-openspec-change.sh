#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd -- "${script_dir}/../.." && pwd)"

mode="print"
change_id="${CHANGE_ID:-}"

usage() {
  cat <<'USAGE'
Usage: select-openspec-change.sh [options]

Pick or inspect an active OpenSpec change from openspec/changes.

Options:
  --list              List active changes and exit.
  --print             Pick a change and print the selected ID. This is default.
  --validate          Pick a change and run make validate-openspec-change.
  --change-id ID      Use the provided change ID instead of prompting.
  -h, --help          Show this help.

CHANGE_ID can also be set in the environment.
USAGE
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --list)
      mode="list"
      shift
      ;;
    --print)
      mode="print"
      shift
      ;;
    --validate)
      mode="validate"
      shift
      ;;
    --change-id)
      change_id="${2:?Missing value for --change-id}"
      shift 2
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

changes_dir="${repo_root}/openspec/changes"

if [ ! -d "${changes_dir}" ]; then
  echo "OpenSpec changes folder is missing: openspec/changes" >&2
  exit 1
fi

if [ -n "${change_id}" ] && ! printf '%s' "${change_id}" | grep -Eq '^[a-z0-9][a-z0-9._-]*$'; then
  echo "Change ID must use lowercase letters, numbers, dots, underscores, or hyphens, and start with a letter or number." >&2
  exit 2
fi

changes=()
while IFS= read -r path; do
  id="$(basename -- "${path}")"
  case "${id}" in
    archive | archived)
      continue
      ;;
  esac
  changes+=("${id}")
done < <(find "${changes_dir}" -mindepth 1 -maxdepth 1 -type d -print | sort)

if [ "${#changes[@]}" -eq 0 ]; then
  echo "No active OpenSpec changes found under openspec/changes." >&2
  exit 1
fi

change_title() {
  local id="$1"
  local proposal="${changes_dir}/${id}/proposal.md"

  if [ ! -f "${proposal}" ]; then
    return 0
  fi

  awk '
    /^# Proposal:/ {
      sub(/^# Proposal:[[:space:]]*/, "")
      print
      exit
    }
  ' "${proposal}"
}

change_phase() {
  local id="$1"
  local state="${repo_root}/delorean/evidence/${id}/change-state.yaml"

  if [ ! -f "${state}" ]; then
    return 0
  fi

  awk -F ':' '
    /^[[:space:]]*currentPhase:/ {
      value = $2
      gsub(/^[[:space:]"]+|[[:space:]"]+$/, "", value)
      print value
      exit
    }
  ' "${state}"
}

print_change_list() {
  local index=1
  local title
  local phase
  local id

  echo "Active OpenSpec changes:"
  for id in "${changes[@]}"; do
    title="$(change_title "${id}")"
    phase="$(change_phase "${id}")"
    printf '%2d) %s' "${index}" "${id}"
    if [ -n "${title}" ]; then
      printf ' - %s' "${title}"
    fi
    if [ -n "${phase}" ]; then
      printf ' [%s]' "${phase}"
    fi
    printf '\n'
    index=$((index + 1))
  done
}

if [ "${mode}" = "list" ]; then
  print_change_list
  exit 0
fi

selected_id=""

if [ -n "${change_id}" ]; then
  if [ ! -d "${changes_dir}/${change_id}" ]; then
    echo "OpenSpec change does not exist: ${change_id}" >&2
    exit 1
  fi
  selected_id="${change_id}"
elif [ "${#changes[@]}" -eq 1 ]; then
  selected_id="${changes[0]}"
elif [ -t 0 ]; then
  print_change_list
  printf 'Select change [1-%d]: ' "${#changes[@]}"
  IFS= read -r selection

  if ! printf '%s' "${selection}" | grep -Eq '^[0-9]+$'; then
    echo "Selection must be a number." >&2
    exit 2
  fi

  if [ "${selection}" -lt 1 ] || [ "${selection}" -gt "${#changes[@]}" ]; then
    echo "Selection is out of range." >&2
    exit 2
  fi

  selected_id="${changes[$((selection - 1))]}"
else
  print_change_list >&2
  echo "Multiple active changes found. Set CHANGE_ID or pass --change-id." >&2
  exit 2
fi

case "${mode}" in
  print)
    printf 'Selected OpenSpec change: %s\n' "${selected_id}"
    printf 'Path: openspec/changes/%s\n' "${selected_id}"
    ;;
  validate)
    echo "Validating OpenSpec change: ${selected_id}"
    make -C "${repo_root}" validate-openspec-change CHANGE_ID="${selected_id}"
    ;;
  *)
    echo "Unsupported mode: ${mode}" >&2
    exit 2
    ;;
esac
