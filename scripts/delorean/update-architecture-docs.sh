#!/usr/bin/env bash
set -euo pipefail

architecture_repo="https://github.com/cds-snc/delorean_architecture.git"
architecture_ref="main"
architecture_docs_dir="architecture_docs"
target_dir=""
dry_run=0

usage() {
  cat <<'USAGE'
Usage: update-architecture-docs.sh [options]

Refresh generated architecture_docs/ from delorean_architecture.

Options:
  --target PATH            Existing solution repo to update. Defaults to the current Git repo.
  --repo URL               Architecture guidance repo URL. Alias for --architecture-repo.
  --ref REF                Architecture guidance branch, tag, or commit. Alias for --architecture-ref.
  --architecture-repo URL  Architecture guidance repo URL. Defaults to cds-snc/delorean_architecture.
  --architecture-ref REF   Architecture guidance branch, tag, or commit. Defaults to main.
  --architecture-docs-dir PATH
                           Target folder for copied architecture docs. Defaults to architecture_docs.
  --dry-run                Show what would change without writing files.
  -h, --help               Show this help.

The script fetches the selected architecture repo/ref and rsyncs its docs/
folder into the target repo's generated architecture_docs/ folder with --delete.
It does not update template-owned files, commit changes, push, deploy, or use
secrets. Review git status and git diff after it runs.
USAGE
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Required command not found: $1" >&2
    exit 1
  fi
}

fetch_repo_ref() {
  local repo="$1"
  local ref="$2"
  local destination="$3"

  mkdir -p "${destination}"
  git init -q "${destination}"
  git -C "${destination}" remote add origin "${repo}"

  if ! git -C "${destination}" fetch --depth 1 origin "${ref}" >/dev/null; then
    echo "Unable to fetch architecture ref '${ref}' from ${repo}." >&2
    exit 1
  fi

  git -C "${destination}" checkout -q --detach FETCH_HEAD
}

run_rsync() {
  local target_path="$1"
  shift

  if [ "${dry_run}" -ne 1 ]; then
    rsync "$@"
    return 0
  fi

  rsync "$@" | while IFS= read -r line; do
    local code
    local item

    [ -n "${line}" ] || continue

    code="${line%%[[:space:]]*}"
    item="${line:${#code}}"
    item="${item#"${item%%[![:space:]]*}"}"

    if [ "${item}" = "${line}" ] || [ "${item}" = "./" ] || [ "${item}" = "." ]; then
      continue
    fi

    case "${code}" in
      .d* | cd*)
        continue
        ;;
      .f..t*)
        continue
        ;;
    esac

    item="${item#./}"
    echo "${code} ${target_path%/}/${item}"
  done
}

copy_architecture_guidance() {
  local architecture_source_root="$1"
  local repo_root="$2"
  local source_path="${architecture_source_root}/docs"
  local dest_path="${repo_root}/${architecture_docs_dir}"
  local rsync_args=(-a --checksum --exclude ".DS_Store" --delete)

  if [ ! -d "${source_path}" ]; then
    echo "Architecture guidance docs folder does not exist: docs" >&2
    exit 1
  fi

  if [ "${dry_run}" -eq 1 ]; then
    rsync_args+=(--dry-run --itemize-changes)
    echo "Dry run only. No architecture docs will be changed."
  else
    mkdir -p "${dest_path}"
  fi

  echo "Refreshing architecture guidance from ${architecture_repo} at ${architecture_ref} into ${architecture_docs_dir}."
  run_rsync "${architecture_docs_dir}" "${rsync_args[@]}" "${source_path}/" "${dest_path}/"
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --target)
      target_dir="${2:?Missing value for --target}"
      shift 2
      ;;
    --repo | --architecture-repo)
      architecture_repo="${2:?Missing value for $1}"
      shift 2
      ;;
    --ref | --architecture-ref)
      architecture_ref="${2:?Missing value for $1}"
      shift 2
      ;;
    --architecture-docs-dir)
      architecture_docs_dir="${2:?Missing value for --architecture-docs-dir}"
      shift 2
      ;;
    --dry-run)
      dry_run=1
      shift
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

require_command git
require_command rsync

case "${architecture_docs_dir}" in
  "" | /* | ../* | */../* | */..)
    echo "--architecture-docs-dir must be a relative path inside the target repo." >&2
    exit 2
    ;;
esac

if [ -n "${target_dir}" ]; then
  case "${target_dir}" in
    /*)
      ;;
    *)
      target_dir="${PWD}/${target_dir}"
      ;;
  esac

  if [ ! -d "${target_dir}" ]; then
    echo "Target repo does not exist: ${target_dir}" >&2
    exit 1
  fi

  repo_root="$(git -C "${target_dir}" rev-parse --show-toplevel)"
else
  repo_root="$(git rev-parse --show-toplevel)"
fi

tmp_dir="$(mktemp -d "${TMPDIR:-/tmp}/delorean-architecture-docs.XXXXXX")"
trap 'rm -rf "${tmp_dir}"' EXIT

fetch_repo_ref "${architecture_repo}" "${architecture_ref}" "${tmp_dir}/architecture"
copy_architecture_guidance "${tmp_dir}/architecture" "${repo_root}"

if [ "${dry_run}" -eq 1 ]; then
  echo "Architecture docs dry run complete."
else
  echo "Architecture docs update complete. Review with: git status --short && git diff"
fi
