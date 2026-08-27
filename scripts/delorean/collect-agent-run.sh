#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd -- "${script_dir}/../.." && pwd)"

name="agent-run"
output_root="${repo_root}/.delorean/agent-runs"
use_evidence_root=0
redact=1
include_agent_config=1
include_worktree_files=1
max_worktree_file_bytes=1048576
notes=()
notes_file=""
logs=()

usage() {
  cat <<'USAGE'
Usage: collect-agent-run.sh [options]

Collect a local review bundle for a completed or in-progress agent run.

Options:
  --name NAME              Short bundle name. Defaults to agent-run.
  --output-root DIR        Directory for bundles. Defaults to .delorean/agent-runs.
  --evidence               Save under delorean/evidence/agent-runs instead.
  --log PATH               Copy a terminal log, exported transcript, or log directory. May be repeated.
  --note TEXT              Add a note to notes.md. May be repeated.
  --notes-file PATH        Copy notes from a Markdown or text file.
  --no-agent-config        Do not include local agent, prompt, and skill files.
  --no-worktree-files      Do not copy changed tracked or untracked text files.
  --max-worktree-file-bytes BYTES
                           Maximum size for each changed worktree file copy. Defaults to 1048576.
  --no-redact              Copy logs and text files without lightweight redaction.
  -h, --help               Show this help.

The default output is gitignored local context for later review in Codex or ChatGPT.
Review the bundle before sharing it. Lightweight redaction is helpful, but not a
substitute for human review when logs may contain secrets or personal information.
USAGE
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --name)
      name="${2:?Missing value for --name}"
      shift 2
      ;;
    --output-root)
      output_root="${2:?Missing value for --output-root}"
      shift 2
      ;;
    --evidence)
      use_evidence_root=1
      shift
      ;;
    --log)
      logs+=("${2:?Missing value for --log}")
      shift 2
      ;;
    --note)
      notes+=("${2:?Missing value for --note}")
      shift 2
      ;;
    --notes-file)
      notes_file="${2:?Missing value for --notes-file}"
      shift 2
      ;;
    --no-agent-config)
      include_agent_config=0
      shift
      ;;
    --no-worktree-files)
      include_worktree_files=0
      shift
      ;;
    --max-worktree-file-bytes)
      max_worktree_file_bytes="${2:?Missing value for --max-worktree-file-bytes}"
      shift 2
      ;;
    --no-redact)
      redact=0
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

if [ "${use_evidence_root}" -eq 1 ]; then
  output_root="${repo_root}/delorean/evidence/agent-runs"
fi

case "${output_root}" in
  /*)
    ;;
  *)
    output_root="${PWD}/${output_root}"
    ;;
esac

slugify() {
  local value="$1"
  value="$(printf '%s' "${value}" | tr '[:upper:]' '[:lower:]' | tr -cs '[:alnum:]._-' '-' | sed -E 's/^-+//; s/-+$//; s/-{2,}/-/g')"
  if [ -z "${value}" ]; then
    value="agent-run"
  fi
  printf '%s' "${value}"
}

resolve_path() {
  case "$1" in
    /*)
      printf '%s' "$1"
      ;;
    *)
      printf '%s/%s' "${PWD}" "$1"
      ;;
  esac
}

is_text_file() {
  local path="$1"

  case "${path}" in
    *.bat | *.css | *.csv | *.env | *.html | *.js | *.json | *.log | *.md | *.py | *.sh | *.txt | *.ts | *.tsx | *.xml | *.yaml | *.yml)
      return 0
      ;;
  esac

  if command -v file >/dev/null 2>&1; then
    if file --brief --mime "${path}" | grep -Eq '^(text/|application/(json|xml|x-sh|x-shellscript|javascript)|.*charset=(us-ascii|utf-8))'; then
      return 0
    fi
  fi

  return 1
}

copy_redacted_file() {
  local source_path="$1"
  local dest_path="$2"

  mkdir -p "$(dirname -- "${dest_path}")"

  if [ "${redact}" -ne 1 ] || ! is_text_file "${source_path}" || ! command -v perl >/dev/null 2>&1; then
    cp "${source_path}" "${dest_path}"
    return 0
  fi

  perl -pe 's/((?:TOKEN|SECRET|PASSWORD|PASS|API[_-]?KEY|AUTHORIZATION|PRIVATE[_-]?KEY)[A-Z0-9_-]*\s*[:=]\s*)\S+/${1}[REDACTED]/ig; s/(Bearer\s+)[A-Za-z0-9._~+\/=-]+/${1}[REDACTED]/g; s/(github_pat|ghp|glpat|xox[baprs]?)-[A-Za-z0-9_-]+/[REDACTED]/g; s/(AKIA|ASIA)[A-Z0-9]{16}/[REDACTED]/g' "${source_path}" > "${dest_path}"
}

copy_path_contents() {
  local source_path="$1"
  local dest_path="$2"

  if [ -d "${source_path}" ]; then
    while IFS= read -r -d '' file_path; do
      local relative_path="${file_path#"${source_path}"/}"
      copy_redacted_file "${file_path}" "${dest_path}/${relative_path}"
    done < <(find "${source_path}" -type f -print0)
  elif [ -f "${source_path}" ]; then
    copy_redacted_file "${source_path}" "${dest_path}"
  fi
}

file_size_bytes() {
  local path="$1"
  if stat -f '%z' "${path}" >/dev/null 2>&1; then
    stat -f '%z' "${path}"
  else
    stat -c '%s' "${path}" 2>/dev/null || echo 0
  fi
}

should_skip_worktree_file() {
  local relative_path="$1"

  case "${relative_path}" in
    "" | /* | *".."* | .git/* | .delorean/agent-runs/* | node_modules/* | */node_modules/* | frontend/dist/* | dist/* | build/* | coverage/* | */coverage/* | .pytest_cache/* | */.pytest_cache/* | __pycache__/* | */__pycache__/*)
      return 0
      ;;
    .env | .env.* | */.env | */.env.* | *.pem | *.key | *.p12 | *.pfx | *.crt | *.cer)
      return 0
      ;;
  esac

  return 1
}

copy_changed_worktree_files() {
  local list_file="${bundle_dir}/git/changed-worktree-files.txt"
  local skipped_file="${bundle_dir}/git/skipped-worktree-files.txt"
  local dest_root="${bundle_dir}/worktree/changed-files"
  local bundle_relative_path=""

  case "${bundle_dir}" in
    "${repo_root}/"*)
      bundle_relative_path="${bundle_dir#"${repo_root}"/}"
      ;;
  esac

  : > "${list_file}"
  : > "${skipped_file}"

  {
    git -C "${repo_root}" diff --name-only -- || true
    git -C "${repo_root}" diff --cached --name-only -- || true
    git -C "${repo_root}" ls-files --others --exclude-standard || true
  } | awk 'NF && !seen[$0]++' > "${list_file}"

  if [ ! -s "${list_file}" ]; then
    return 0
  fi

  mkdir -p "${dest_root}"

  while IFS= read -r relative_path; do
    [ -n "${relative_path}" ] || continue

    if [ -n "${bundle_relative_path}" ]; then
      case "${relative_path}" in
        "${bundle_relative_path}" | "${bundle_relative_path}"/*)
          echo "Skipped ${relative_path}: current bundle output" >> "${skipped_file}"
          continue
          ;;
      esac
    fi

    if should_skip_worktree_file "${relative_path}"; then
      echo "Skipped ${relative_path}: path is excluded from review bundles" >> "${skipped_file}"
      continue
    fi

    local source_path="${repo_root}/${relative_path}"
    if [ ! -f "${source_path}" ]; then
      echo "Skipped ${relative_path}: not a regular file" >> "${skipped_file}"
      continue
    fi

    local size
    size="$(file_size_bytes "${source_path}")"
    if [ "${size}" -gt "${max_worktree_file_bytes}" ] 2>/dev/null; then
      echo "Skipped ${relative_path}: file is ${size} bytes, above limit ${max_worktree_file_bytes}" >> "${skipped_file}"
      continue
    fi

    if ! is_text_file "${source_path}"; then
      echo "Skipped ${relative_path}: not detected as text" >> "${skipped_file}"
      continue
    fi

    copy_redacted_file "${source_path}" "${dest_root}/${relative_path}"
  done < "${list_file}"
}

timestamp="$(date -u +"%Y%m%dT%H%M%SZ")"
slug="$(slugify "${name}")"
bundle_dir="${output_root}/${timestamp}-${slug}"

mkdir -p "${bundle_dir}/git" "${bundle_dir}/logs" "${bundle_dir}/tooling"

run_git_capture() {
  local output_name="$1"
  shift

  git -C "${repo_root}" "$@" > "${bundle_dir}/git/${output_name}" 2>&1 || true
}

current_branch="$(git -C "${repo_root}" branch --show-current 2>/dev/null || true)"
head_sha="$(git -C "${repo_root}" rev-parse HEAD 2>/dev/null || true)"

cat > "${bundle_dir}/README.md" <<EOF
# Agent Run Bundle

- Name: ${name}
- Captured: ${timestamp}
- Repo: ${repo_root}
- Branch: ${current_branch:-unknown}
- Head: ${head_sha:-unknown}
- Output: ${bundle_dir}

This bundle is local review context for Codex, ChatGPT, or another reviewer.
Review it before sharing. Do not treat raw logs as approval records or release
evidence unless they have been curated for that purpose.

Changed tracked and untracked text files are copied under worktree/changed-files/
when worktree capture is enabled. Review copied files before sharing.
EOF

run_git_capture "status-short.txt" status --short
run_git_capture "status.txt" status
run_git_capture "diff-stat.txt" diff --stat
run_git_capture "diff.patch" diff --
run_git_capture "diff-staged.patch" diff --cached --
run_git_capture "recent-commits.txt" log --oneline -n 20
run_git_capture "tracked-agent-files.txt" ls-files AGENTS.md agent-configs .github/copilot-instructions.md .github/agents .github/prompts .github/skills .agents/skills .codex .claude

if [ "${include_worktree_files}" -eq 1 ]; then
  copy_changed_worktree_files
fi

{
  echo "# Tool Versions"
  echo
  for tool in git gh codex docker node npm python3; do
    if command -v "${tool}" >/dev/null 2>&1; then
      echo "## ${tool}"
      "${tool}" --version 2>&1 | head -n 5 || true
      echo
    fi
  done
} > "${bundle_dir}/tooling/versions.txt"

{
  echo "# Notes"
  echo
  if [ "${#notes[@]}" -eq 0 ] && [ -z "${notes_file}" ]; then
    echo "_No notes supplied._"
  fi
  if [ "${#notes[@]}" -gt 0 ]; then
    for note in "${notes[@]}"; do
      echo "- ${note}"
    done
  fi
  if [ -n "${notes_file}" ]; then
    resolved_notes_file="$(resolve_path "${notes_file}")"
    if [ -f "${resolved_notes_file}" ]; then
      notes_file_copy="${bundle_dir}/tooling/notes-file.txt"
      copy_redacted_file "${resolved_notes_file}" "${notes_file_copy}"
      echo
      echo "## Notes File"
      echo
      cat "${notes_file_copy}"
    else
      echo
      echo "Missing notes file: ${notes_file}"
    fi
  fi
} > "${bundle_dir}/notes.md"

if [ "${include_agent_config}" -eq 1 ]; then
  mkdir -p "${bundle_dir}/agent-config"
  for config_path in \
    "AGENTS.md" \
    "agent-configs" \
    ".github/copilot-instructions.md" \
    ".github/agents" \
    ".github/prompts" \
    ".github/skills" \
    ".agents/skills" \
    ".codex" \
    ".claude" \
    "docs/repo-guidance/where-things-go.md" \
    "docs/repo-guidance/ownership-and-updates.md"; do
    source_path="${repo_root}/${config_path}"
    if [ -e "${source_path}" ]; then
      copy_path_contents "${source_path}" "${bundle_dir}/agent-config/${config_path}"
    fi
  done
fi

log_index=0
if [ "${#logs[@]}" -gt 0 ]; then
  for log_path in "${logs[@]}"; do
    log_index=$((log_index + 1))
    resolved_log_path="$(resolve_path "${log_path}")"
    safe_name="$(slugify "$(basename -- "${log_path}")")"
    if [ ! -e "${resolved_log_path}" ]; then
      echo "Missing log path: ${log_path}" > "${bundle_dir}/logs/${log_index}-${safe_name}.missing.txt"
      continue
    fi
    copy_path_contents "${resolved_log_path}" "${bundle_dir}/logs/${log_index}-${safe_name}"
  done
fi

echo "Created agent run bundle: ${bundle_dir}"
