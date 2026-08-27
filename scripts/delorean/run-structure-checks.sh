#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd -- "${script_dir}/../.." && pwd)"

read_adoption_level() {
  local config_path="${repo_root}/delorean/config.yaml"

  if [ ! -f "${config_path}" ]; then
    echo "2"
    return 0
  fi

  awk -F ':' '
    $1 == "adoptionLevel" {
      gsub(/[[:space:]]/, "", $2)
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

adoption_level="$(read_adoption_level)"
adoption_level="${adoption_level//\"/}"
adoption_level="${adoption_level//\'/}"

vscode_prompt_paths=(
  "prompts"
  "prompts/README.md"
  "prompts/dl-requirements-shape.prompt.md"
  "prompts/dl-requirements-start.prompt.md"
  "prompts/dl-requirements-refine.prompt.md"
  "prompts/dl-requirements-answer-questions.prompt.md"
  "prompts/dl-requirements-archive.prompt.md"
  "prompts/dl-plan-feature.prompt.md"
  "prompts/dl-plan-refine.prompt.md"
  "prompts/dl-delivery-autopilot.prompt.md"
  "prompts/dl-ui-build-page.prompt.md"
  "prompts/dl-ui-refine.prompt.md"
  "prompts/dl-ui-review-accessibility.prompt.md"
  "prompts/dl-dev-continue.prompt.md"
  "prompts/dl-dev-active-change.prompt.md"
  "prompts/dl-dev-autopilot.prompt.md"
  "prompts/dl-dev-fix-bug.prompt.md"
  "prompts/dl-dev-change-api.prompt.md"
  "prompts/dl-dev-change-data.prompt.md"
  "prompts/dl-qa-commit-ready.prompt.md"
  "prompts/dl-qa-push-ready.prompt.md"
  "prompts/dl-qa-check.prompt.md"
  "prompts/dl-qa-review.prompt.md"
  "prompts/dl-security-review.prompt.md"
  "prompts/dl-docs-update.prompt.md"
  "prompts/dl-platform-update.prompt.md"
  "prompts/dl-ops-hotfix.prompt.md"
)

vscode_level2_core_prompt_paths=(
  "prompts"
  "prompts/README.md"
  "prompts/dl-requirements-start.prompt.md"
  "prompts/dl-requirements-refine.prompt.md"
  "prompts/dl-requirements-answer-questions.prompt.md"
  "prompts/dl-requirements-archive.prompt.md"
  "prompts/dl-ui-build-page.prompt.md"
  "prompts/dl-ui-refine.prompt.md"
  "prompts/dl-ui-review-accessibility.prompt.md"
  "prompts/dl-dev-continue.prompt.md"
  "prompts/dl-dev-active-change.prompt.md"
  "prompts/dl-dev-fix-bug.prompt.md"
  "prompts/dl-qa-commit-ready.prompt.md"
  "prompts/dl-qa-push-ready.prompt.md"
  "prompts/dl-qa-check.prompt.md"
  "prompts/dl-qa-review.prompt.md"
)

shared_skill_paths=(
  "skills"
  "skills/delorean-planning/SKILL.md"
  "skills/delorean-planning/references.md"
  "skills/delorean-question-resolution/SKILL.md"
  "skills/delorean-question-resolution/references.md"
  "skills/delorean-openspec/SKILL.md"
  "skills/delorean-openspec/references.md"
  "skills/delorean-design/SKILL.md"
  "skills/delorean-design/references.md"
  "skills/delorean-ui/SKILL.md"
  "skills/delorean-ui/references.md"
  "skills/delorean-evidence/SKILL.md"
  "skills/delorean-evidence/references.md"
  "skills/delorean-implementation/SKILL.md"
  "skills/delorean-implementation/references.md"
  "skills/delorean-review/SKILL.md"
  "skills/delorean-review/references.md"
  "skills/delorean-testing/SKILL.md"
  "skills/delorean-testing/references.md"
  "skills/select-ui-page-pattern/SKILL.md"
  "skills/select-ui-page-pattern/references.md"
  "skills/review-gc-design-system-alignment/SKILL.md"
  "skills/review-gc-design-system-alignment/references.md"
  "skills/aws-topology-diagrams/SKILL.md"
  "skills/aws-topology-diagrams/references.md"
  "skills/c4-architecture-diagrams/SKILL.md"
  "skills/c4-architecture-diagrams/references.md"
  "skills/gc-standards/SKILL.md"
  "skills/gc-standards/references.md"
  "skills/gc-review-a11y/SKILL.md"
  "skills/gc-review-a11y/references.md"
  "skills/gc-review-branding/SKILL.md"
  "skills/gc-review-branding/references.md"
  "skills/gc-review-bilingual/SKILL.md"
  "skills/gc-review-bilingual/references.md"
  "skills/gc-review-security/SKILL.md"
  "skills/gc-review-security/references.md"
  "skills/gc-review-iam/SKILL.md"
  "skills/gc-review-iam/references.md"
  "skills/gc-review-im/SKILL.md"
  "skills/gc-review-im/references.md"
)

vscode_agent_paths=(
  "agents"
  "agents/coordinator.agent.md"
  "agents/spec-author.agent.md"
  "agents/delivery-planner.agent.md"
  "agents/builder-general.agent.md"
  "agents/qa-support.agent.md"
  "agents/release-readiness.agent.md"
)

codex_agent_paths=(
  "agents"
  "agents/README.md"
  "agents/coordinator.toml"
  "agents/spec-author.toml"
  "agents/delivery-planner.toml"
  "agents/builder-general.toml"
  "agents/qa-support.toml"
  "agents/release-readiness.toml"
)

codex_workflow_skill_paths=(
  "skills"
  "skills/dl-requirements-shape/SKILL.md"
  "skills/dl-requirements-start/SKILL.md"
  "skills/dl-requirements-refine/SKILL.md"
  "skills/dl-requirements-answer-questions/SKILL.md"
  "skills/dl-requirements-archive/SKILL.md"
  "skills/dl-plan-feature/SKILL.md"
  "skills/dl-plan-refine/SKILL.md"
  "skills/dl-delivery-autopilot/SKILL.md"
  "skills/dl-ui-build-page/SKILL.md"
  "skills/dl-ui-refine/SKILL.md"
  "skills/dl-ui-review-accessibility/SKILL.md"
  "skills/dl-dev-continue/SKILL.md"
  "skills/dl-dev-active-change/SKILL.md"
  "skills/dl-dev-autopilot/SKILL.md"
  "skills/dl-dev-fix-bug/SKILL.md"
  "skills/dl-dev-change-api/SKILL.md"
  "skills/dl-dev-change-data/SKILL.md"
  "skills/dl-qa-commit-ready/SKILL.md"
  "skills/dl-qa-push-ready/SKILL.md"
  "skills/dl-qa-check/SKILL.md"
  "skills/dl-qa-review/SKILL.md"
  "skills/dl-security-review/SKILL.md"
  "skills/dl-docs-update/SKILL.md"
  "skills/dl-platform-update/SKILL.md"
  "skills/dl-ops-hotfix/SKILL.md"
)

shared_hook_paths=(
  "hooks"
  "hooks/README.md"
  "hooks/install.sh"
  "hooks/pre-commit"
  "hooks/commit-msg"
  "hooks/pre-push"
)

required_paths=(
  "README.md"
  ".python-version"
  "scripts/delorean"
  "scripts/delorean/doctor.sh"
  "scripts/delorean/select-openspec-change.sh"
  "scripts/delorean/run-autofix.sh"
  "scripts/delorean/run-local-verification.sh"
  "scripts/delorean/run-shellcheck.sh"
  "scripts/delorean/run-lint.sh"
  "scripts/delorean/run-frontend-standards-checks.sh"
  "scripts/delorean/run-ui-page-shell-checks.sh"
  "scripts/delorean/run-secret-checks.sh"
  "scripts/delorean/update-architecture-docs.sh"
  "scripts/delorean/update-from-template.sh"
  "scripts/delorean/check-codex-assets.sh"
  "docs/reference/first-tester-quickstart.md"
  "docs/reference"
  "docs/reference/openspec-lifecycle.md"
  "docs/reference/update-from-template.md"
  "docs/repo-guidance"
  "docs/repo-guidance/docs-audience.md"
  "docs/repo-guidance/where-things-go.md"
  "docs/repo-guidance/architecture-docs.md"
  "docs/repo-guidance/adoption-levels.md"
  "docs/repo-guidance/ownership-and-updates.md"
  "docs/repo-guidance/control-boundaries.md"
  "docs/templates"
  "delorean"
  "delorean/config.yaml"
  "openspec"
  "openspec/README.md"
  "openspec/specs"
  "openspec/specs/README.md"
  "openspec/changes"
  "openspec/changes/README.md"
  "openapi"
  "tests"
)

template_source_openspec_example_paths=(
  "openspec/specs/example-capability/spec.md"
  "openspec/changes/example-change/proposal.md"
  "openspec/changes/example-change/design.md"
  "openspec/changes/example-change/tasks.md"
  "openspec/changes/example-change/specs/example-capability/spec.md"
)

full_delorean_required_paths=(
  "scripts/delorean/run-delorean-state-checks.sh"
  "scripts/delorean/collect-agent-run.sh"
  "docs/reference/approval-routing-and-reentry.md"
  "docs/reference/agent-run-log-bundles.md"
  "delorean/templates"
  "delorean/templates/change-state-template.yaml"
  "delorean/gates"
  "delorean/gates/README.md"
  "delorean/gates/gate-catalog.yaml"
  "delorean/evidence"
)

append_github_workflow_requirements() {
  if [ -d "${repo_root}/repo-configs/github" ]; then
    required_paths+=(
      "repo-configs/github/workflows"
      "repo-configs/github/workflows/README.md"
      "repo-configs/github/workflows/template-validation.yml"
    )

    case "${adoption_level}" in
      3 | 4)
        required_paths+=(
          "repo-configs/github/workflows-archive"
          "repo-configs/github/workflows-archive/README.md"
        )
        ;;
    esac
    return 0
  fi

  required_paths+=(
    ".github/workflows"
    ".github/workflows/template-validation.yml"
  )

  case "${adoption_level}" in
    3 | 4)
      required_paths+=(".github/workflows-archive")
      ;;
  esac
}

append_prefixed_paths() {
  local prefix="$1"
  shift

  for path in "$@"; do
    required_paths+=("${prefix}/${path}")
  done
}

append_agent_config_requirements() {
  if [ -d "${repo_root}/agent-configs" ]; then
    required_paths+=(
      "agent-configs/README.md"
      "agent-configs/shared/README.md"
      "agent-configs/shared/reference-map.yaml"
      "agent-configs/vscode/README.md"
      "agent-configs/codex/README.md"
      "agent-configs/codex/AGENTS.md"
      "agent-configs/claude/README.md"
      "agent-configs/vscode/copilot-instructions.md"
      "agent-configs/vscode/vscode/extensions.json"
      "agent-configs/vscode/vscode/launch.json"
      "agent-configs/vscode/vscode/settings.json"
      "agent-configs/vscode/vscode/tasks.json"
    )
    append_prefixed_paths "agent-configs/shared" "${shared_hook_paths[@]}"
    append_prefixed_paths "agent-configs/shared" "${shared_skill_paths[@]}"
    append_prefixed_paths "agent-configs/vscode" "${vscode_prompt_paths[@]}"
    append_prefixed_paths "agent-configs/vscode" "${vscode_agent_paths[@]}"
    append_prefixed_paths "agent-configs/codex" "${codex_agent_paths[@]}"
    append_prefixed_paths "agent-configs/codex" "${codex_workflow_skill_paths[@]}"
    return 0
  fi

  local materialized_target_count=0

  if [ -d "${repo_root}/.github/hooks" ]; then
    append_prefixed_paths ".github" "${shared_hook_paths[@]}"
  fi

  if [ -d "${repo_root}/.github/agents" ] || [ -d "${repo_root}/.github/prompts" ] || [ -d "${repo_root}/.github/skills" ]; then
    materialized_target_count=$((materialized_target_count + 1))
    required_paths+=(
      ".github/copilot-instructions.md"
      ".vscode/extensions.json"
      ".vscode/launch.json"
      ".vscode/settings.json"
      ".vscode/tasks.json"
    )
    append_prefixed_paths ".github" "${shared_skill_paths[@]}"
    case "${adoption_level}" in
      2)
        append_prefixed_paths ".github" "${vscode_level2_core_prompt_paths[@]}"
        ;;
      *)
        append_prefixed_paths ".github" "${vscode_prompt_paths[@]}"
        ;;
    esac
    append_prefixed_paths ".github" "${vscode_agent_paths[@]}"
  fi

  if [ -d "${repo_root}/.agents/skills" ] || [ -d "${repo_root}/.codex/agents" ] || [ -d "${repo_root}/.codex/prompts" ]; then
    materialized_target_count=$((materialized_target_count + 1))
    required_paths+=("AGENTS.md")
    if [ -d "${repo_root}/.agents/skills" ]; then
      append_prefixed_paths ".agents" "${shared_skill_paths[@]}"
      append_prefixed_paths ".agents" "${codex_workflow_skill_paths[@]}"
    fi
    if [ -d "${repo_root}/.codex/agents" ]; then
      append_prefixed_paths ".codex" "${codex_agent_paths[@]}"
    fi
  fi

  if [ -d "${repo_root}/.claude/skills" ]; then
    materialized_target_count=$((materialized_target_count + 1))
    append_prefixed_paths ".claude" "${shared_skill_paths[@]}"
  fi

  if [ "${materialized_target_count}" -eq 0 ]; then
    echo "No agent customization source or generated target folder found. Skipping agent config path requirements."
  fi
}

architecture_guidance_paths=(
  "architecture_docs/README.md"
  "architecture_docs/architecture/README.md"
  "architecture_docs/standards/README.md"
  "architecture_docs/standards/catalog.yml"
  "architecture_docs/standards/std-001-document-identifiers.md"
  "architecture_docs/standards/std-002-work-contexts.md"
  "architecture_docs/standards/std-003-full-stack-application-stack.md"
  "architecture_docs/standards/std-006-gc-ui-page-layout-rules.md"
  "architecture_docs/standards/std-017-gc-standards-review.md"
  "architecture_docs/standards/std-018-frontend-css-and-design-system-boundary.md"
  "architecture_docs/standards/std-019-government-of-canada-web-application-baseline.md"
  "architecture_docs/patterns/README.md"
  "architecture_docs/patterns/catalog.yml"
  "architecture_docs/patterns/design/pat-001-ui-page-patterns.md"
  "architecture_docs/patterns/frontend/pat-013-gcds-react-app-shell.md"
  "architecture_docs/patterns/frontend/pat-014-bilingual-route-and-i18n.md"
  "architecture_docs/patterns/frontend/pat-015-storybook-ui-review-fixture.md"
  "architecture_docs/controls/README.md"
  "architecture_docs/controls/catalog.yml"
  "architecture_docs/controls/gc-web/gc-web-001-scope-and-applicability.md"
  "architecture_docs/controls/gc-web/gc-web-002-canada-ca-design-federal-identity-and-page-shell.md"
  "architecture_docs/controls/gc-web/gc-web-007-security.md"
  "architecture_docs/baselines/README.md"
  "architecture_docs/baselines/catalog.yml"
  "architecture_docs/baselines/bas-001-government-of-canada-web-application-baseline.md"
  "architecture_docs/baselines/bas-001-government-of-canada-web-application-baseline.controls.yml"
  "architecture_docs/architecture/reference/README.md"
  "architecture_docs/architecture/reference/catalog.yml"
  "architecture_docs/architecture/adrs/README.md"
  "architecture_docs/architecture/adrs/catalog.yml"
  "architecture_docs/templates/README.md"
  "architecture_docs/templates/architecture/tpl-005-architecture-note-template.md"
  "architecture_docs/templates/architecture/tpl-006-adr-template.md"
  "architecture_docs/templates/architecture/tpl-010-reference-architecture-template.md"
  "architecture_docs/templates/design/tpl-007-page-pattern-decision-template.md"
  "architecture_docs/templates/design/tpl-008-design-review-checklist-template.md"
  "architecture_docs/templates/review/tpl-009-verification-note-template.md"
  "architecture_docs/templates/review/tpl-011-gc-web-application-baseline-assessment-template.md"
  "architecture_docs/templates/standards/tpl-003-standards-impact-template.md"
  "architecture_docs/templates/controls/tpl-012-control-template.md"
  "architecture_docs/templates/baselines/tpl-013-baseline-profile-template.md"
)

if [ -d "${repo_root}/getting-started" ]; then
  required_paths+=("AGENTS.md")
  required_paths+=("getting-started/scaffold-solution-repo.sh")
  required_paths+=("getting-started/template-smoke-test.md")
  required_paths+=("${template_source_openspec_example_paths[@]}")
else
  required_paths+=("${architecture_guidance_paths[@]}")
fi

status=0

append_github_workflow_requirements
append_agent_config_requirements

case "${adoption_level}" in
  2)
    ;;
  3 | 4)
    required_paths+=("${full_delorean_required_paths[@]}")
    ;;
  *)
    echo "Unsupported Delorean adoption level in delorean/config.yaml: ${adoption_level}" >&2
    status=1
    ;;
esac

for path in "${required_paths[@]}"; do
  if [ ! -e "${repo_root}/${path}" ]; then
    echo "Missing required template path: ${path}" >&2
    status=1
  fi
done

vscode_agent_dir=""
vscode_prompt_dir=""
vscode_extensions_file=""
vscode_launch_file=""
vscode_settings_file=""
vscode_tasks_file=""

if [ -d "${repo_root}/agent-configs/vscode/agents" ]; then
  vscode_agent_dir="${repo_root}/agent-configs/vscode/agents"
  vscode_prompt_dir="${repo_root}/agent-configs/vscode/prompts"
  vscode_extensions_file="${repo_root}/agent-configs/vscode/vscode/extensions.json"
  vscode_launch_file="${repo_root}/agent-configs/vscode/vscode/launch.json"
  vscode_settings_file="${repo_root}/agent-configs/vscode/vscode/settings.json"
  vscode_tasks_file="${repo_root}/agent-configs/vscode/vscode/tasks.json"
elif [ -d "${repo_root}/.github/agents" ]; then
  vscode_agent_dir="${repo_root}/.github/agents"
  vscode_prompt_dir="${repo_root}/.github/prompts"
  vscode_extensions_file="${repo_root}/.vscode/extensions.json"
  vscode_launch_file="${repo_root}/.vscode/launch.json"
  vscode_settings_file="${repo_root}/.vscode/settings.json"
  vscode_tasks_file="${repo_root}/.vscode/tasks.json"
fi

if [ -n "${vscode_agent_dir}" ]; then
  for agent_file in "${vscode_agent_dir}"/*.agent.md; do
    if ! grep -q '^tools: .*agent/runSubagent' "${agent_file}"; then
      echo "Agent is missing subagent invocation tool: ${agent_file#"${repo_root}"/}" >&2
      status=1
    fi
  done

  for prompt_file in "${vscode_prompt_dir}"/*.prompt.md; do
    if grep -q '^agent: .*\.github/agents/' "${prompt_file}"; then
      echo "Prompt uses a file path in frontmatter agent instead of a VS Code agent name: ${prompt_file#"${repo_root}"/}" >&2
      status=1
    fi
  done

  coordinator_file="${vscode_agent_dir}/coordinator.agent.md"
  for selector_code in \
    "A = pick for me" \
    "S = clarify scope" \
    "P = plan work" \
    "I = build it" \
    "V = verify it" \
    "R = release check" \
    "Q = ask or paste prompt"; do
    if ! grep -q "${selector_code}" "${coordinator_file}"; then
      echo "Coordinator is missing route selector code: ${selector_code}" >&2
      status=1
    fi
  done

  if ! grep -q 'dl-delivery-autopilot.prompt.md' "${coordinator_file}"; then
    echo "Coordinator is missing delivery autopilot routing." >&2
    status=1
  fi
fi

codex_instructions_file=""
codex_instructions_requires_marker=0
if [ -f "${repo_root}/agent-configs/codex/AGENTS.md" ]; then
  codex_instructions_file="${repo_root}/agent-configs/codex/AGENTS.md"
  codex_instructions_requires_marker=1
elif { [ -d "${repo_root}/.agents/skills" ] || [ -d "${repo_root}/.codex/agents" ] || [ -d "${repo_root}/.codex/prompts" ]; } && [ -f "${repo_root}/AGENTS.md" ]; then
  codex_instructions_file="${repo_root}/AGENTS.md"
fi

if [ -n "${codex_instructions_file}" ]; then
  if [ "${codex_instructions_requires_marker}" -eq 1 ] && ! grep -q 'delorean-template:codex-agents' "${codex_instructions_file}"; then
    echo "Codex instructions are missing the generated-template marker: ${codex_instructions_file#"${repo_root}"/}" >&2
    status=1
  fi
  if grep -q 'Delorean Template Maintainer Agent Instructions' "${codex_instructions_file}"; then
    echo "Generated Codex instructions must not use template-maintainer root AGENTS.md content: ${codex_instructions_file#"${repo_root}"/}" >&2
    status=1
  fi
fi

for legacy_prompt_dir in \
  "${repo_root}/agent-configs/codex/prompts" \
  "${repo_root}/.codex/prompts"; do
  if [ -d "${legacy_prompt_dir}" ] &&
    [ -n "$(find "${legacy_prompt_dir}" -mindepth 1 -maxdepth 1 -print -quit)" ]; then
    echo "Codex repository prompts are deprecated; use discoverable skills instead: ${legacy_prompt_dir#"${repo_root}"/}" >&2
    status=1
  fi
done

for codex_agent_dir in \
  "${repo_root}/agent-configs/codex/agents" \
  "${repo_root}/.codex/agents"; do
  [ -d "${codex_agent_dir}" ] || continue
  for legacy_agent_file in "${codex_agent_dir}"/*.md; do
    [ -e "${legacy_agent_file}" ] || continue
    [ "$(basename -- "${legacy_agent_file}")" = "README.md" ] && continue
    echo "Codex custom agents must be standalone TOML: ${legacy_agent_file#"${repo_root}"/}" >&2
    status=1
  done
done

if { [ -d "${repo_root}/.agents/skills" ] || [ -d "${repo_root}/.codex/agents" ]; } &&
  [ -x "${repo_root}/scripts/delorean/check-codex-assets.sh" ]; then
  if ! "${repo_root}/scripts/delorean/check-codex-assets.sh"; then
    status=1
  fi
fi

if [ -n "${vscode_extensions_file}" ] && [ -f "${vscode_extensions_file}" ]; then
  for extension_id in \
    "GitHub.copilot" \
    "github.copilot-chat" \
    "ms-python.python" \
    "dbaeumer.vscode-eslint" \
    "prettier.prettier-vscode" \
    "ms-azuretools.vscode-containers"; do
    if ! grep -q "\"${extension_id}\"" "${vscode_extensions_file}"; then
      echo "VS Code extension recommendations are missing ${extension_id}: ${vscode_extensions_file#"${repo_root}"/}" >&2
      status=1
    fi
  done
fi

if [ -n "${vscode_launch_file}" ] && [ -f "${vscode_launch_file}" ]; then
  for launch_marker in \
    '"name": "Backend: FastAPI"' \
    '"type": "debugpy"' \
    '"module": "uvicorn"' \
    '"name": "Frontend: Vite Dev Server"' \
    '"type": "node-terminal"' \
    '"name": "Backend: Pytest All Tests"' \
    '"name": "Backend: Pytest Current File"' \
    '"name": "Frontend: Vitest All Tests"' \
    '"name": "Frontend: Vitest Current File"' \
    '"name": "Frontend: Browser Launch"' \
    '"type": "pwa-chrome"' \
    '"name": "Frontend: Browser Attach"' \
    '"name": "App: Frontend + Backend"'; do
    if ! grep -q "${launch_marker}" "${vscode_launch_file}"; then
      echo "VS Code launch config is missing ${launch_marker}: ${vscode_launch_file#"${repo_root}"/}" >&2
      status=1
    fi
  done
fi

if [ -n "${vscode_settings_file}" ] && [ -f "${vscode_settings_file}" ]; then
  if ! grep -q '"chat.tools.terminal.autoApprove"' "${vscode_settings_file}"; then
    echo "VS Code settings are missing terminal auto-approval config: ${vscode_settings_file#"${repo_root}"/}" >&2
    status=1
  fi
  if ! grep -q 'local-verification' "${vscode_settings_file}"; then
    echo "VS Code settings are missing local verification auto-approval: ${vscode_settings_file#"${repo_root}"/}" >&2
    status=1
  fi
  if ! grep -q 'doctor' "${vscode_settings_file}"; then
    echo "VS Code settings are missing doctor auto-approval: ${vscode_settings_file#"${repo_root}"/}" >&2
    status=1
  fi
  if ! grep -q 'select-openspec-change' "${vscode_settings_file}"; then
    echo "VS Code settings are missing OpenSpec picker auto-approval: ${vscode_settings_file#"${repo_root}"/}" >&2
    status=1
  fi
  if ! grep -q 'make\\\\s+validate-openspec-change\\\\s+CHANGE_ID=' "${vscode_settings_file}"; then
    echo "VS Code settings are missing flexible OpenSpec validation auto-approval: ${vscode_settings_file#"${repo_root}"/}" >&2
    status=1
  fi
  if ! grep -q 'make\\\\s+-C\\\\s+' "${vscode_settings_file}"; then
    echo "VS Code settings are missing make -C OpenSpec validation auto-approval: ${vscode_settings_file#"${repo_root}"/}" >&2
    status=1
  fi
  if ! grep -q 'source\\\\s+\\\\.venv\\\\/bin\\\\/activate' "${vscode_settings_file}"; then
    echo "VS Code settings are missing venv activation auto-approval: ${vscode_settings_file#"${repo_root}"/}" >&2
    status=1
  fi
  if ! grep -q 'setup-python-venv' "${vscode_settings_file}"; then
    echo "VS Code settings are missing setup-python-venv approval gate: ${vscode_settings_file#"${repo_root}"/}" >&2
    status=1
  fi
  if ! grep -q 'pytest\\\\b' "${vscode_settings_file}"; then
    echo "VS Code settings are missing direct pytest auto-approval: ${vscode_settings_file#"${repo_root}"/}" >&2
    status=1
  fi
  if ! grep -q '"docker": false' "${vscode_settings_file}"; then
    echo "VS Code settings are missing default Docker approval gate: ${vscode_settings_file#"${repo_root}"/}" >&2
    status=1
  fi
fi

if [ -n "${vscode_tasks_file}" ] && [ -f "${vscode_tasks_file}" ]; then
  if ! grep -q '"label": "Delorean: Doctor"' "${vscode_tasks_file}"; then
    echo "VS Code tasks are missing Delorean doctor task: ${vscode_tasks_file#"${repo_root}"/}" >&2
    status=1
  fi
  # The VS Code input variable is matched literally, not expanded by this script.
  # shellcheck disable=SC2016
  if ! grep -q 'make validate-openspec-change CHANGE_ID=${input:changeId}' "${vscode_tasks_file}"; then
    echo "VS Code tasks are missing OpenSpec validation input task: ${vscode_tasks_file#"${repo_root}"/}" >&2
    status=1
  fi
  if ! grep -q '"label": "OpenSpec: Pick Active Change"' "${vscode_tasks_file}"; then
    echo "VS Code tasks are missing OpenSpec active change picker task: ${vscode_tasks_file#"${repo_root}"/}" >&2
    status=1
  fi
  if ! grep -q '"label": "OpenSpec: Pick + Validate Active Change"' "${vscode_tasks_file}"; then
    echo "VS Code tasks are missing OpenSpec active change validation picker task: ${vscode_tasks_file#"${repo_root}"/}" >&2
    status=1
  fi
fi

openspec_change_template="${repo_root}/docs/templates/openspec-change-package-template.md"
if [ -f "${openspec_change_template}" ]; then
  if ! grep -q 'Run holistic QA review after implementation tasks are complete' "${openspec_change_template}"; then
    echo "OpenSpec change package template is missing the holistic QA review task." >&2
    status=1
  fi
  if ! grep -q 'Archive follow-through' "${openspec_change_template}" || ! grep -q -- '--skip-specs' "${openspec_change_template}"; then
    echo "OpenSpec change package template is missing archive follow-through tasks." >&2
    status=1
  fi
  if ! grep -q 'current specs are stale' "${openspec_change_template}"; then
    echo "OpenSpec change package template is missing Level 2 current-spec freshness tasks." >&2
    status=1
  fi
  if ! grep -q 'existing scenarios to preserve' "${openspec_change_template}"; then
    echo "OpenSpec change package template is missing modified-requirement scenario preservation tasks." >&2
    status=1
  fi
fi

create_openspec_change_script="${repo_root}/scripts/delorean/create-openspec-change.sh"
if [ -f "${create_openspec_change_script}" ]; then
  if ! grep -q 'Run holistic QA review after implementation tasks are complete' "${create_openspec_change_script}"; then
    echo "OpenSpec change package creator is missing the holistic QA review task." >&2
    status=1
  fi
  if ! grep -q 'Archive follow-through' "${create_openspec_change_script}" || ! grep -q -- '--skip-specs' "${create_openspec_change_script}"; then
    echo "OpenSpec change package creator is missing archive follow-through tasks." >&2
    status=1
  fi
  if ! grep -q 'current specs are stale' "${create_openspec_change_script}"; then
    echo "OpenSpec change package creator is missing Level 2 current-spec freshness tasks." >&2
    status=1
  fi
  if ! grep -q 'existing scenarios to preserve' "${create_openspec_change_script}"; then
    echo "OpenSpec change package creator is missing modified-requirement scenario preservation tasks." >&2
    status=1
  fi
fi

scenario_preservation_script="${repo_root}/scripts/delorean/check-openspec-scenario-preservation.js"
if [ ! -f "${scenario_preservation_script}" ]; then
  echo "OpenSpec scenario preservation checker is missing: scripts/delorean/check-openspec-scenario-preservation.js" >&2
  status=1
fi

if ! grep -q 'check-openspec-scenario-preservation.js' "${repo_root}/Makefile"; then
  echo "Makefile validate-openspec-change target must run the OpenSpec scenario preservation checker." >&2
  status=1
fi

openspec_lifecycle_doc="${repo_root}/docs/reference/openspec-lifecycle.md"
if [ -f "${openspec_lifecycle_doc}" ]; then
  if ! grep -q 'Archive Follow-Through' "${openspec_lifecycle_doc}" || ! grep -q -- '--skip-specs' "${openspec_lifecycle_doc}"; then
    echo "OpenSpec lifecycle guide is missing archive follow-through guidance." >&2
    status=1
  fi
  if ! grep -q 'Level 2 Current Spec Discipline' "${openspec_lifecycle_doc}"; then
    echo "OpenSpec lifecycle guide is missing Level 2 current-spec discipline guidance." >&2
    status=1
  fi
  if ! grep -q 'modified requirement includes the full scenario set to preserve' "${openspec_lifecycle_doc}"; then
    echo "OpenSpec lifecycle guide is missing modified-requirement scenario preservation guidance." >&2
    status=1
  fi
fi

for openspec_skill_file in \
  "${repo_root}/agent-configs/shared/skills/delorean-openspec/SKILL.md" \
  "${repo_root}/.github/skills/delorean-openspec/SKILL.md" \
  "${repo_root}/.agents/skills/delorean-openspec/SKILL.md" \
  "${repo_root}/.claude/skills/delorean-openspec/SKILL.md"; do
  if [ -f "${openspec_skill_file}" ]; then
    if ! grep -q 'Archive follow-through' "${openspec_skill_file}" || ! grep -q 'Current spec update checked' "${openspec_skill_file}"; then
      echo "delorean-openspec skill is missing archive follow-through guidance: ${openspec_skill_file#"${repo_root}"/}" >&2
      status=1
    fi
    if ! grep -q 'Level 2 current spec discipline' "${openspec_skill_file}"; then
      echo "delorean-openspec skill is missing Level 2 current-spec discipline guidance: ${openspec_skill_file#"${repo_root}"/}" >&2
      status=1
    fi
    if ! grep -q 'Modified requirement merge discipline' "${openspec_skill_file}"; then
      echo "delorean-openspec skill is missing modified-requirement scenario preservation guidance: ${openspec_skill_file#"${repo_root}"/}" >&2
      status=1
    fi
  fi
done

for requirements_archive_prompt in \
  "${repo_root}/agent-configs/vscode/prompts/dl-requirements-archive.prompt.md" \
  "${repo_root}/.github/prompts/dl-requirements-archive.prompt.md" \
  "${repo_root}/agent-configs/codex/skills/dl-requirements-archive/SKILL.md" \
  "${repo_root}/.agents/skills/dl-requirements-archive/SKILL.md"; do
  if [ -f "${requirements_archive_prompt}" ]; then
    if ! grep -q 'existing scenarios to preserve' "${requirements_archive_prompt}"; then
      echo "dl-requirements-archive prompt is missing modified-requirement scenario preservation guidance: ${requirements_archive_prompt#"${repo_root}"/}" >&2
      status=1
    fi
  fi
done

if [ -n "${vscode_prompt_dir}" ]; then
  active_change_prompt="${vscode_prompt_dir}/dl-dev-active-change.prompt.md"
  if [ -f "${active_change_prompt}" ]; then
    if ! grep -q 'holistic QA review task' "${active_change_prompt}"; then
      echo "Dev active-change prompt is missing holistic QA review task handling." >&2
      status=1
    fi
  fi

  autopilot_prompt="${vscode_prompt_dir}/dl-dev-autopilot.prompt.md"
  if [ -f "${autopilot_prompt}" ]; then
    if ! grep -q 'Before moving to the next change' "${autopilot_prompt}" || ! grep -q 'holistic QA review task' "${autopilot_prompt}"; then
      echo "Dev autopilot prompt is missing holistic QA review gate handling." >&2
      status=1
    fi
  fi
fi

if [ -n "${vscode_agent_dir}" ]; then
  qa_support_agent="${vscode_agent_dir}/qa-support.agent.md"
  if [ -f "${qa_support_agent}" ]; then
    if ! grep -q 'holistic QA review task' "${qa_support_agent}"; then
      echo "QA Support agent is missing holistic QA review task completion guidance." >&2
      status=1
    fi
  fi
fi

update_from_template_script="${repo_root}/scripts/delorean/update-from-template.sh"
if [ -f "${update_from_template_script}" ]; then
  # Template shell variable references are matched literally, not expanded here.
  # shellcheck disable=SC2016
  for update_marker in \
    '--target)' \
    '--include-architecture-docs)' \
    'update-architecture-docs.sh' \
    '"delorean/evidence/README.md"' \
    '".python-version"' \
    'copy_path_if_missing "$tmp_dir/template" "$repo_root" "delorean/config.yaml"' \
    'copy_paths+=("backend" "frontend" "openapi" "tests")'; do
    if ! grep -q -- "${update_marker}" "${update_from_template_script}"; then
      echo "Template update helper is missing existing-solution update marker: ${update_marker}" >&2
      status=1
    fi
  done
fi

if [ -f "${repo_root}/.python-version" ] && ! grep -qx '3\.12' "${repo_root}/.python-version"; then
  echo ".python-version must pin the starter backend to Python 3.12." >&2
  status=1
fi

if ! grep -q 'update-existing-solution-dry-run' "${repo_root}/Makefile"; then
  echo "Makefile is missing existing-solution update dry-run target." >&2
  status=1
fi

if ! grep -q '^setup-python-venv:' "${repo_root}/Makefile"; then
  echo "Makefile is missing setup-python-venv target." >&2
  status=1
fi

if ! grep -q 'update-architecture-docs-dry-run' "${repo_root}/Makefile"; then
  echo "Makefile is missing architecture-doc update dry-run target." >&2
  status=1
fi

if [ "${status}" -eq 0 ]; then
  echo "Repo structure checks passed."
fi

exit "${status}"
