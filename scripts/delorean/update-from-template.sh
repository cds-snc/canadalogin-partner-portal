#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
template_repo="https://github.com/cds-snc/delorean_template.git"
template_ref="main"
architecture_repo="https://github.com/cds-snc/delorean_architecture.git"
architecture_ref="main"
architecture_docs_dir="architecture_docs"
target_dir=""
dry_run=0
include_root_docs=0
include_starter_code=0
include_architecture_docs=0
include_delorean_config=0
agent_config_only=0
agent_tool="auto"
level2_prompt_set="${LEVEL2_PROMPT_SET:-core}"
extra_paths=()
level2_core_prompt_files=(
  "README.md"
  "dl-requirements-start.prompt.md"
  "dl-requirements-refine.prompt.md"
  "dl-requirements-answer-questions.prompt.md"
  "dl-requirements-archive.prompt.md"
  "dl-ui-build-page.prompt.md"
  "dl-ui-refine.prompt.md"
  "dl-ui-review-accessibility.prompt.md"
  "dl-dev-continue.prompt.md"
  "dl-dev-active-change.prompt.md"
  "dl-dev-fix-bug.prompt.md"
  "dl-qa-commit-ready.prompt.md"
  "dl-qa-push-ready.prompt.md"
  "dl-qa-check.prompt.md"
  "dl-qa-review.prompt.md"
)

usage() {
  cat <<'USAGE'
Usage: update-from-template.sh [options]

Pull the latest Delorean template-owned files into an existing solution repo.

Options:
  --target PATH            Existing solution repo to update. Defaults to the current Git repo.
  --repo URL               Template repo URL. Defaults to cds-snc/delorean_template.
  --ref REF                Template branch, tag, or commit. Defaults to main.
  --architecture-repo URL  Architecture guidance repo URL. Defaults to cds-snc/delorean_architecture.
  --architecture-ref REF   Architecture guidance branch, tag, or commit. Defaults to main.
  --architecture-docs-dir PATH
                           Target folder for copied architecture docs. Defaults to architecture_docs.
  --dry-run                Show what would change without writing files.
  --agent-config-only      Only update local agents, prompts, skills, hooks, and related repo-guidance docs.
  --agent-tool TOOL        Agent customization target for materialized files. Supported: auto, vscode, codex, claude, all, none.
  --level2-prompt-set SET  Prompt set for Level 2 repos. Supported: core, full. Defaults to core.
  --include-level2-nice-to-have-prompts
                           Alias for --level2-prompt-set full.
  --include-architecture-docs
                           Refresh generated architecture_docs/ from delorean_architecture.
  --include-delorean-config
                           Also update delorean/config.yaml. By default existing solution adoption level is preserved.
  --include-root-docs      Also update README.md and GETTING_STARTED.md.
  --include-starter-code   Also update starter frontend, backend, openapi, and tests.
  --path PATH              Also update a specific path from the template. May be repeated.
  -h, --help               Show this help.

The script does not commit changes. Review git status and git diff after it runs.
Architecture guidance under architecture_docs/ is owned by
delorean_architecture. Use --include-architecture-docs when you want to refresh
that generated guidance from the architecture repo.
Use scripts/delorean/update-architecture-docs.sh when you only need to refresh
architecture_docs/ without updating template-owned files.

By default, this helper preserves solution-owned state:
- delorean/config.yaml is added when missing, but not overwritten unless
  --include-delorean-config is provided.
- openspec/specs/, openspec/changes/, and delorean/evidence/ keep local
  solution contents. Only their README starter files are refreshed.

Agent customization source files live under agent-configs/ in the template and
are materialized into generated project paths. With --agent-tool auto, this
helper detects existing VS Code, Codex, or Claude target folders in the current
repo and updates those targets. If none are present, it defaults to vscode.
For Codex, generated AGENTS.md is refreshed only when the existing file still
has the generated Codex marker; custom solution-owned AGENTS.md files are
preserved. Codex agent and prompt adapters are refreshed under .codex/agents/
and .codex/prompts/.

Level 2 repos receive the core prompt set by default. Use
--include-level2-nice-to-have-prompts or --level2-prompt-set full when the repo
should receive every starter prompt.

Reusable GitHub workflow source files live under repo-configs/github/ in the
template and are materialized into .github/workflows/ and
.github/workflows-archive/ in solution repos.
USAGE
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --target)
      target_dir="${2:?Missing value for --target}"
      shift 2
      ;;
    --repo)
      template_repo="${2:?Missing value for --repo}"
      shift 2
      ;;
    --ref)
      template_ref="${2:?Missing value for --ref}"
      shift 2
      ;;
    --architecture-repo)
      architecture_repo="${2:?Missing value for --architecture-repo}"
      shift 2
      ;;
    --architecture-ref)
      architecture_ref="${2:?Missing value for --architecture-ref}"
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
    --agent-config-only)
      agent_config_only=1
      shift
      ;;
    --agent-tool)
      agent_tool="${2:?Missing value for --agent-tool}"
      shift 2
      ;;
    --level2-prompt-set)
      level2_prompt_set="${2:?Missing value for --level2-prompt-set}"
      shift 2
      ;;
    --include-level2-nice-to-have-prompts)
      level2_prompt_set="full"
      shift
      ;;
    --include-architecture-docs)
      include_architecture_docs=1
      shift
      ;;
    --include-delorean-config)
      include_delorean_config=1
      shift
      ;;
    --include-root-docs)
      include_root_docs=1
      shift
      ;;
    --include-starter-code)
      include_starter_code=1
      shift
      ;;
    --path)
      extra_paths+=("${2:?Missing value for --path}")
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

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

read_adoption_level() {
  local repo_root="$1"
  local config_path="${repo_root}/delorean/config.yaml"

  if [ ! -f "${config_path}" ]; then
    echo "2"
    return 0
  fi

  awk -F ':' '
    $1 == "adoptionLevel" {
      gsub(/[[:space:]]/, "", $2)
      gsub(/"/, "", $2)
      gsub(/\047/, "", $2)
      print $2
      found = 1
      exit
    }
    END {
      if (!found) {
        print "2"
      }
    }
  ' "${config_path}"
}

run_rsync() {
  local target_path="$1"
  local source_kind="$2"
  shift 2

  if [ "$dry_run" -ne 1 ]; then
    rsync "$@"
    return 0
  fi

  rsync "$@" | while IFS= read -r line; do
    local code
    local item
    local full_path

    [ -n "$line" ] || continue

    code="${line%%[[:space:]]*}"
    item="${line:${#code}}"
    item="${item#"${item%%[![:space:]]*}"}"

    if [ "$item" = "$line" ] || [ "$item" = "./" ] || [ "$item" = "." ]; then
      continue
    fi

    case "$code" in
      .d* | cd*)
        continue
        ;;
      .f..t*)
        continue
        ;;
    esac

    if [ "$source_kind" = "dir" ]; then
      item="${item#./}"
      if [ "$target_path" = "." ]; then
        full_path="$item"
      else
        full_path="${target_path%/}/${item}"
      fi
    else
      full_path="$target_path"
    fi

    echo "${code} ${full_path}"
  done
}

copy_path() {
  local source_root="$1"
  local repo_root="$2"
  local path="$3"
  local source_path="${source_root}/${path}"
  local dest_path="${repo_root}/${path}"

  if [ ! -e "$source_path" ]; then
    echo "Template path does not exist, skipping: ${path}" >&2
    return 0
  fi

  if [ -d "$source_path" ]; then
    if [ "$dry_run" -ne 1 ]; then
      mkdir -p "$dest_path"
    fi
    run_rsync "$path" "dir" "${rsync_args[@]}" "${source_path}/" "${dest_path}/"
  else
    if [ "$dry_run" -ne 1 ]; then
      mkdir -p "$(dirname "$dest_path")"
    fi
    run_rsync "$path" "file" "${rsync_args[@]}" "$source_path" "$dest_path"
  fi
}

copy_path_if_missing() {
  local source_root="$1"
  local repo_root="$2"
  local path="$3"
  local dest_path="${repo_root}/${path}"

  if [ -e "$dest_path" ]; then
    echo "Preserving existing solution-owned path: ${path}"
    return 0
  fi

  copy_path "$source_root" "$repo_root" "$path"
}

copy_agent_config_dir() {
  local source_root="$1"
  local repo_root="$2"
  local source_path="$3"
  local dest_path="$4"
  local full_source_path="${source_root}/${source_path}"
  local full_dest_path="${repo_root}/${dest_path}"

  if [ ! -d "$full_source_path" ]; then
    return 0
  fi

  if [ "$dry_run" -ne 1 ]; then
    mkdir -p "$full_dest_path"
  fi
  run_rsync "$dest_path" "dir" "${rsync_args[@]}" "${full_source_path}/" "${full_dest_path}/"
}

copy_agent_config_file() {
  local source_root="$1"
  local repo_root="$2"
  local source_path="$3"
  local dest_path="$4"
  local full_source_path="${source_root}/${source_path}"
  local full_dest_path="${repo_root}/${dest_path}"

  if [ ! -f "$full_source_path" ]; then
    return 0
  fi

  if [ "$dry_run" -ne 1 ]; then
    mkdir -p "$(dirname "$full_dest_path")"
  fi
  run_rsync "$dest_path" "file" "${rsync_args[@]}" "$full_source_path" "$full_dest_path"
}

copy_codex_agents_file() {
  local source_root="$1"
  local repo_root="$2"
  local source_path="codex/AGENTS.md"
  local dest_path="AGENTS.md"
  local full_source_path="${source_root}/${source_path}"
  local full_dest_path="${repo_root}/${dest_path}"
  local generated_marker="delorean-template:codex-agents"

  if [ ! -f "$full_source_path" ]; then
    return 0
  fi

  if [ -e "$full_dest_path" ] && ! grep -q "$generated_marker" "$full_dest_path"; then
    echo "Preserving existing solution-owned Codex instructions: ${dest_path}"
    return 0
  fi

  copy_agent_config_file "$source_root" "$repo_root" "$source_path" "$dest_path"
}

remove_deprecated_agent_feedback_mcp_paths() {
  local repo_root="$1"
  local deprecated_path
  local deprecated_vscode_dir=".vscode"
  local deprecated_github_dir=".github"
  local deprecated_mcp_dir="mcp"
  local deprecated_mcp_config="mcp.json"

  for deprecated_path in "${deprecated_github_dir}/${deprecated_mcp_dir}" "${deprecated_vscode_dir}/${deprecated_mcp_config}"; do
    if [ ! -e "${repo_root}/${deprecated_path}" ]; then
      continue
    fi

    if [ "$dry_run" -eq 1 ]; then
      echo "Would remove deprecated VS Code feedback path: ${deprecated_path}"
    else
      rm -rf -- "${repo_root:?}/${deprecated_path}"
      echo "Removed deprecated VS Code feedback path: ${deprecated_path}"
    fi
  done
}

is_level2_core_prompt_file() {
  local prompt_file="$1"
  local core_prompt_file

  for core_prompt_file in "${level2_core_prompt_files[@]}"; do
    if [ "${prompt_file}" = "${core_prompt_file}" ]; then
      return 0
    fi
  done

  return 1
}

write_level2_core_prompt_readme() {
  local repo_root="$1"
  local target_path="${repo_root}/.github/prompts/README.md"

  if [ "$dry_run" -eq 1 ]; then
    echo "Would write Level 2 core prompt README: .github/prompts/README.md"
    return 0
  fi

  mkdir -p "$(dirname -- "${target_path}")"
  cat >"${target_path}" <<'EOF'
# Prompts

This Level 2 scaffold includes the core prompt set by default so the prompt
picker stays small while developers learn the workflow.

## Core Prompts

| Prompt | Use when |
|---|---|
| `dl-requirements-start` | Turn a rough brief, requirements note, or issue into the first active OpenSpec change package. |
| `dl-requirements-refine` | Clean up requirements, scenarios, tasks, validation, or next-slice clarity. |
| `dl-requirements-answer-questions` | List OpenSpec open questions, resolve answerable ones from repo context, and collect human decisions. |
| `dl-requirements-archive` | Archive a completed OpenSpec change into current specs after verification. |
| `dl-ui-build-page` | Build a new user-facing page, layout, form, or navigation path. |
| `dl-ui-refine` | Fix or improve an existing UI, page pattern, route, accessibility, or bilingual issue. |
| `dl-ui-review-accessibility` | Review and remediate accessibility risk for user-facing changes. |
| `dl-dev-continue` | Continue the next safe task from an active change. |
| `dl-dev-active-change` | Continue ready local slices inside one active change until blocked, complete, or at the slice limit. |
| `dl-dev-fix-bug` | Investigate and fix a defect or failing check. |
| `dl-qa-commit-ready` | Check staged changes, hook readiness, and commit-message readiness before committing. |
| `dl-qa-push-ready` | Run pre-push readiness checks and confirm the branch is safe to push. |
| `dl-qa-check` | Run a local quality loop before review or handoff. |
| `dl-qa-review` | Review the scoped change across code, docs, specs, tests, and evidence before handoff. |

## Nice-To-Have Prompts

Nice-to-have prompts such as repo-wide autopilot, full delivery autopilot,
platform updates, security review, data/API change specializations, and hotfix
handling are available from the template when the repo needs them.

For a new Level 2 repo, scaffold with:

```sh
/path/to/delorean_template/getting-started/scaffold-solution-repo.sh --target /path/to/repo --include-level2-nice-to-have-prompts
```

For an existing solution repo, refresh agent configs with:

```sh
scripts/delorean/update-from-template.sh --agent-config-only --level2-prompt-set full
```
EOF
}

apply_level2_prompt_set() {
  local source_root="$1"
  local repo_root="$2"
  local source_prompt_dir="${source_root}/vscode/prompts"
  local target_prompt_dir="${repo_root}/.github/prompts"
  local source_prompt
  local prompt_file

  if [ "${adoption_level}" != "2" ] || [ "${level2_prompt_set}" != "core" ]; then
    return 0
  fi

  if [ ! -d "${source_prompt_dir}" ] || [ ! -d "${target_prompt_dir}" ]; then
    return 0
  fi

  for source_prompt in "${source_prompt_dir}"/*.prompt.md; do
    if [ ! -e "${source_prompt}" ]; then
      continue
    fi

    prompt_file="$(basename -- "${source_prompt}")"
    if is_level2_core_prompt_file "${prompt_file}"; then
      continue
    fi

    if [ "$dry_run" -eq 1 ]; then
      if [ -e "${target_prompt_dir}/${prompt_file}" ]; then
        echo "Would remove Level 2 nice-to-have prompt: .github/prompts/${prompt_file}"
      fi
    else
      rm -f -- "${target_prompt_dir}/${prompt_file}"
    fi
  done

  write_level2_core_prompt_readme "${repo_root}"
}

detect_agent_tool() {
  local repo_root="$1"
  local detected=()

  if [ -d "${repo_root}/.github/agents" ] || [ -d "${repo_root}/.github/prompts" ] || [ -d "${repo_root}/.github/skills" ]; then
    detected+=("vscode")
  fi
  if [ -d "${repo_root}/.agents/skills" ] || [ -d "${repo_root}/.codex/agents" ] || [ -d "${repo_root}/.codex/prompts" ] || grep -q "delorean-template:codex-agents" "${repo_root}/AGENTS.md" 2>/dev/null; then
    detected+=("codex")
  fi
  if [ -d "${repo_root}/.claude/skills" ] || [ -d "${repo_root}/.claude/agents" ]; then
    detected+=("claude")
  fi

  if [ "${#detected[@]}" -eq 0 ]; then
    printf '%s\n' "vscode"
  elif [ "${#detected[@]}" -eq 1 ]; then
    printf '%s\n' "${detected[0]}"
  else
    printf '%s\n' "all"
  fi
}

materialize_shared_agent_configs() {
  local source_root="$1"
  local repo_root="$2"

  copy_agent_config_dir "$source_root" "$repo_root" "shared/hooks" ".github/hooks"
}

materialize_vscode_agent_configs() {
  local source_root="$1"
  local repo_root="$2"

  copy_agent_config_dir "$source_root" "$repo_root" "vscode/agents" ".github/agents"
  copy_agent_config_dir "$source_root" "$repo_root" "vscode/prompts" ".github/prompts"
  copy_agent_config_dir "$source_root" "$repo_root" "shared/skills" ".github/skills"
  copy_agent_config_file "$source_root" "$repo_root" "vscode/copilot-instructions.md" ".github/copilot-instructions.md"
  copy_agent_config_file "$source_root" "$repo_root" "vscode/vscode/extensions.json" ".vscode/extensions.json"
  copy_agent_config_file "$source_root" "$repo_root" "vscode/vscode/launch.json" ".vscode/launch.json"
  copy_agent_config_file "$source_root" "$repo_root" "vscode/vscode/settings.json" ".vscode/settings.json"
  copy_agent_config_file "$source_root" "$repo_root" "vscode/vscode/tasks.json" ".vscode/tasks.json"
  remove_deprecated_agent_feedback_mcp_paths "$repo_root"
}

materialize_codex_agent_configs() {
  local source_root="$1"
  local repo_root="$2"

  copy_codex_agents_file "$source_root" "$repo_root"
  copy_agent_config_dir "$source_root" "$repo_root" "shared/skills" ".agents/skills"
  copy_agent_config_dir "$source_root" "$repo_root" "codex/agents" ".codex/agents"
  copy_agent_config_dir "$source_root" "$repo_root" "codex/prompts" ".codex/prompts"
  copy_agent_config_file "$source_root" "$repo_root" "codex/config.toml" ".codex/config.toml"
}

materialize_claude_agent_configs() {
  local source_root="$1"
  local repo_root="$2"

  copy_agent_config_dir "$source_root" "$repo_root" "shared/skills" ".claude/skills"
  copy_agent_config_dir "$source_root" "$repo_root" "claude/agents" ".claude/agents"
  copy_agent_config_dir "$source_root" "$repo_root" "claude/commands" ".claude/commands"
}

materialize_agent_configs() {
  local template_root="$1"
  local repo_root="$2"
  local selected_tool="$3"
  local source_root="${template_root}/agent-configs"

  if [ "$selected_tool" = "auto" ]; then
    selected_tool="$(detect_agent_tool "$repo_root")"
  fi

  echo "Materializing agent customization target: ${selected_tool}"

  if [ "$selected_tool" = "none" ]; then
    return 0
  fi

  if [ ! -d "$source_root" ]; then
    echo "Template agent config source folder does not exist, skipping: agent-configs" >&2
    return 0
  fi

  case "$selected_tool" in
    vscode)
      materialize_shared_agent_configs "$source_root" "$repo_root"
      materialize_vscode_agent_configs "$source_root" "$repo_root"
      ;;
    codex)
      materialize_shared_agent_configs "$source_root" "$repo_root"
      materialize_codex_agent_configs "$source_root" "$repo_root"
      ;;
    claude)
      materialize_shared_agent_configs "$source_root" "$repo_root"
      materialize_claude_agent_configs "$source_root" "$repo_root"
      ;;
    all)
      materialize_shared_agent_configs "$source_root" "$repo_root"
      materialize_vscode_agent_configs "$source_root" "$repo_root"
      materialize_codex_agent_configs "$source_root" "$repo_root"
      materialize_claude_agent_configs "$source_root" "$repo_root"
      ;;
  esac
}

materialize_github_workflow_configs() {
  local template_root="$1"
  local repo_root="$2"
  local source_root="${template_root}/repo-configs/github"

  if [ ! -d "$source_root" ]; then
    echo "Template GitHub workflow source folder does not exist, skipping: repo-configs/github" >&2
    return 0
  fi

  echo "Materializing GitHub workflow configs."

  copy_agent_config_dir "$source_root" "$repo_root" "workflows" ".github/workflows"
  copy_agent_config_dir "$source_root" "$repo_root" "workflows-archive" ".github/workflows-archive"
}

require_command git
require_command rsync

case "${architecture_docs_dir}" in
  "" | /* | ../* | */../* | */..)
    echo "--architecture-docs-dir must be a relative path inside the target repo." >&2
    exit 2
    ;;
esac

case "${agent_tool}" in
  auto | vscode | codex | claude | all | none)
    ;;
  *)
    echo "--agent-tool must be one of: auto, vscode, codex, claude, all, none." >&2
    exit 2
    ;;
esac

case "${level2_prompt_set}" in
  core | full)
    ;;
  *)
    echo "--level2-prompt-set must be one of: core, full." >&2
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

adoption_level="$(read_adoption_level "${repo_root}")"
adoption_level="${adoption_level//\"/}"
adoption_level="${adoption_level//\'/}"

tmp_dir="$(mktemp -d "${TMPDIR:-/tmp}/delorean-template-sync.XXXXXX")"
trap 'rm -rf "$tmp_dir"' EXIT

echo "Fetching template ${template_repo} at ${template_ref}..."
git clone --depth 1 --branch "$template_ref" "$template_repo" "$tmp_dir/template" >/dev/null

if [ "$agent_config_only" -eq 1 ]; then
  copy_paths=(
    "scripts/delorean/doctor.sh"
    "scripts/delorean/select-openspec-change.sh"
    "scripts/delorean/collect-agent-run.sh"
    "scripts/delorean/run-ui-page-shell-checks.sh"
    "scripts/delorean/run-frontend-standards-checks.sh"
    "scripts/delorean/update-from-template.sh"
    "docs/reference/agent-run-log-bundles.md"
    "docs/reference/approval-routing-and-reentry.md"
    "docs/reference/container-local-build-and-run.md"
    "docs/reference/local-verification.md"
    "docs/repo-guidance/agent-tool-permissions.md"
    "docs/repo-guidance/adoption-levels.md"
    "docs/repo-guidance/control-boundaries.md"
    "docs/repo-guidance/docs-audience.md"
    "docs/repo-guidance/openspec-and-delorean.md"
    "docs/repo-guidance/where-things-go.md"
    "docs/repo-guidance/ownership-and-updates.md"
  )
else
  copy_paths=(
    "scripts/delorean"
    "delorean/README.md"
    "delorean/evidence/README.md"
    "delorean/gates"
    "delorean/templates"
    "docs/design/README.md"
    "docs/reference"
    "docs/repo-guidance"
    "docs/templates"
    ".env.example"
    ".flake8"
    ".gitignore"
    ".python-version"
    "Makefile"
    "LICENSE"
    "pytest.ini"
    "openapi/README.md"
    "openspec/README.md"
    "openspec/changes/README.md"
    "openspec/specs/README.md"
    "tests/README.md"
  )
fi

if [ "$include_root_docs" -eq 1 ]; then
  copy_paths+=("GETTING_STARTED.md" "README.md")
fi

if [ "$include_starter_code" -eq 1 ]; then
  copy_paths+=("backend" "frontend" "openapi" "tests")
fi

if [ "${#extra_paths[@]}" -gt 0 ]; then
  copy_paths+=("${extra_paths[@]}")
fi

rsync_args=(-a --checksum --exclude ".DS_Store")

if [ "$dry_run" -eq 1 ]; then
  rsync_args+=(--dry-run --itemize-changes)
  echo "Dry run only. No files will be changed."
fi

for path in "${copy_paths[@]}"; do
  copy_path "$tmp_dir/template" "$repo_root" "$path"
done

if [ "$include_delorean_config" -eq 1 ]; then
  copy_path "$tmp_dir/template" "$repo_root" "delorean/config.yaml"
else
  copy_path_if_missing "$tmp_dir/template" "$repo_root" "delorean/config.yaml"
fi

if [ "$agent_config_only" -ne 1 ]; then
  materialize_github_workflow_configs "$tmp_dir/template" "$repo_root"
fi

materialize_agent_configs "$tmp_dir/template" "$repo_root" "$agent_tool"
apply_level2_prompt_set "$tmp_dir/template/agent-configs" "$repo_root"

if [ "$include_architecture_docs" -eq 1 ]; then
  architecture_update_script="${script_dir}/update-architecture-docs.sh"

  if [ ! -f "$architecture_update_script" ]; then
    architecture_update_script="$tmp_dir/template/scripts/delorean/update-architecture-docs.sh"
  fi

  if [ ! -f "$architecture_update_script" ]; then
    echo "Architecture docs helper is missing: scripts/delorean/update-architecture-docs.sh" >&2
    exit 1
  fi

  architecture_update_args=(
    --target "$repo_root"
    --repo "$architecture_repo"
    --ref "$architecture_ref"
    --architecture-docs-dir "$architecture_docs_dir"
  )

  if [ "$dry_run" -eq 1 ]; then
    architecture_update_args+=(--dry-run)
  fi

  bash "$architecture_update_script" "${architecture_update_args[@]}"
fi

if [ "$dry_run" -eq 1 ]; then
  echo "Dry run complete."
else
  echo "Template update complete. Review with: git status --short && git diff"
fi
