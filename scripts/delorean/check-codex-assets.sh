#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd -- "${script_dir}/../.." && pwd)"

python_command=""
if [ -x "${repo_root}/.venv/bin/python" ] &&
  "${repo_root}/.venv/bin/python" -c 'import tomllib' >/dev/null 2>&1; then
  python_command="${repo_root}/.venv/bin/python"
elif command -v python3 >/dev/null 2>&1 &&
  python3 -c 'import tomllib' >/dev/null 2>&1; then
  python_command="$(command -v python3)"
else
  echo "Python 3.11 or newer is required to validate Codex assets." >&2
  exit 1
fi

"${python_command}" - "${repo_root}" <<'PY'
from __future__ import annotations

import re
import sys
from pathlib import Path

import tomllib

root = Path(sys.argv[1])
errors: list[str] = []

expected_agents = {
    "builder-general",
    "coordinator",
    "delivery-planner",
    "qa-support",
    "release-readiness",
    "spec-author",
}

expected_workflow_skills = {
    "dl-delivery-autopilot",
    "dl-dev-active-change",
    "dl-dev-autopilot",
    "dl-dev-change-api",
    "dl-dev-change-data",
    "dl-dev-continue",
    "dl-dev-fix-bug",
    "dl-docs-update",
    "dl-ops-hotfix",
    "dl-plan-feature",
    "dl-plan-refine",
    "dl-platform-update",
    "dl-qa-check",
    "dl-qa-commit-ready",
    "dl-qa-push-ready",
    "dl-qa-review",
    "dl-requirements-answer-questions",
    "dl-requirements-archive",
    "dl-requirements-refine",
    "dl-requirements-shape",
    "dl-requirements-start",
    "dl-security-review",
    "dl-ui-build-page",
    "dl-ui-refine",
    "dl-ui-review-accessibility",
}

legacy_prompt_dir = root / ".codex" / "prompts"
if legacy_prompt_dir.exists() and any(legacy_prompt_dir.iterdir()):
    errors.append(
        ".codex/prompts is not a repository discovery location; move reusable "
        "workflows to .agents/skills/<name>/SKILL.md"
    )

agent_dir = root / ".codex" / "agents"
if not agent_dir.is_dir():
    errors.append("missing project custom-agent directory: .codex/agents")
else:
    for markdown_path in sorted(agent_dir.glob("*.md")):
        if markdown_path.name != "README.md":
            errors.append(
                f"custom agents must be standalone TOML, not Markdown: "
                f"{markdown_path.relative_to(root)}"
            )

    for agent_name in sorted(expected_agents):
        agent_path = agent_dir / f"{agent_name}.toml"
        if not agent_path.is_file():
            errors.append(f"missing Codex custom agent: {agent_path.relative_to(root)}")

    seen_agent_names: set[str] = set()
    for agent_path in sorted(agent_dir.glob("*.toml")):
        try:
            agent_text = agent_path.read_text(encoding="utf-8")
            data = tomllib.loads(agent_text)
        except (OSError, tomllib.TOMLDecodeError) as exc:
            errors.append(f"invalid custom-agent TOML {agent_path.relative_to(root)}: {exc}")
            continue

        for obsolete_marker in (
            ".codex/prompts",
            "../prompts/",
            "agent-configs/vscode",
            "sync-codex-adapters",
        ):
            if obsolete_marker in agent_text:
                errors.append(
                    f"{agent_path.relative_to(root)} contains obsolete Codex routing: "
                    f"{obsolete_marker}"
                )
        if re.search(
            r"(?:builder-general|coordinator|delivery-planner|qa-support|"
            r"release-readiness|spec-author)\.md",
            agent_text,
        ):
            errors.append(
                f"{agent_path.relative_to(root)} links to a Markdown role adapter; "
                "route to custom-agent TOML instead"
            )

        for key in ("name", "description", "developer_instructions"):
            value = data.get(key)
            if not isinstance(value, str) or not value.strip():
                errors.append(
                    f"{agent_path.relative_to(root)} must define a non-empty {key} string"
                )

        name = data.get("name")
        if isinstance(name, str) and name.strip():
            if not re.fullmatch(r"[a-z0-9][a-z0-9-]*", name):
                errors.append(
                    f"{agent_path.relative_to(root)} has an invalid agent name: {name!r}"
                )
            if name in seen_agent_names:
                errors.append(f"duplicate Codex custom-agent name: {name}")
            seen_agent_names.add(name)
            if agent_path.stem in expected_agents and name != agent_path.stem:
                errors.append(
                    f"{agent_path.relative_to(root)} name must match its filename: {agent_path.stem}"
                )

skill_root = root / ".agents" / "skills"
if not skill_root.is_dir():
    errors.append("missing repository skill directory: .agents/skills")
else:
    for skill_name in sorted(expected_workflow_skills):
        skill_path = skill_root / skill_name / "SKILL.md"
        if not skill_path.is_file():
            errors.append(f"missing Codex workflow skill: {skill_path.relative_to(root)}")

    seen_skill_names: set[str] = set()
    for skill_path in sorted(skill_root.glob("*/SKILL.md")):
        relative_path = skill_path.relative_to(root)
        text = skill_path.read_text(encoding="utf-8")
        match = re.match(r"\A---\n(?P<frontmatter>.*?)\n---\n(?P<body>.*)\Z", text, re.DOTALL)
        if not match:
            errors.append(f"invalid or missing YAML frontmatter: {relative_path}")
            continue

        fields: dict[str, str] = {}
        for line in match.group("frontmatter").splitlines():
            field_match = re.match(r"^([a-z][a-z0-9-]*):\s*(.*)$", line)
            if not field_match:
                errors.append(f"unsupported skill frontmatter line in {relative_path}: {line!r}")
                continue
            fields[field_match.group(1)] = field_match.group(2).strip()

        unexpected_fields = set(fields) - {"name", "description"}
        if unexpected_fields:
            errors.append(
                f"{relative_path} frontmatter has unsupported fields: "
                f"{', '.join(sorted(unexpected_fields))}"
            )

        raw_name = fields.get("name", "").strip("\"'")
        raw_description = fields.get("description", "").strip()
        if not raw_name:
            errors.append(f"{relative_path} must define a non-empty name")
        elif raw_name != skill_path.parent.name:
            errors.append(
                f"{relative_path} name must match its folder: {skill_path.parent.name}"
            )
        elif raw_name in seen_skill_names:
            errors.append(f"duplicate repository skill name: {raw_name}")
        else:
            seen_skill_names.add(raw_name)

        if not raw_description or raw_description in {'""', "''"}:
            errors.append(f"{relative_path} must define a non-empty description")
        if not match.group("body").strip():
            errors.append(f"{relative_path} must include workflow instructions")

        if skill_path.parent.name in expected_workflow_skills:
            for obsolete_marker in (
                ".codex/prompts",
                "Codex prompt adapter",
                "agent-configs/vscode/prompts",
            ):
                if obsolete_marker in text:
                    errors.append(
                        f"{relative_path} contains obsolete prompt-adapter marker: "
                        f"{obsolete_marker}"
                    )

            for link_target in re.findall(r"\]\(([^)]+)\)", text):
                if link_target.startswith(("#", "http://", "https://", "mailto:")):
                    continue
                linked_path = link_target.split("#", 1)[0]
                if not (skill_path.parent / linked_path).resolve().exists():
                    errors.append(
                        f"{relative_path} has a broken relative link: {link_target}"
                    )

if errors:
    for error in errors:
        print(f"Codex asset check: {error}", file=sys.stderr)
    raise SystemExit(1)

print(
    f"Codex asset checks passed: {len(expected_agents)} custom agents and "
    f"{len(expected_workflow_skills)} workflow skills."
)
PY
