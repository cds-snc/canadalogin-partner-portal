# Update From Template

Use this guide when an existing solution repo needs to pull the latest
Delorean template-owned files from the upstream template.

The update helper is intentionally conservative. By default, it updates local
agents, workflow skills, prompts for tools that support them, hooks, workflows, Delorean starter files,
local docs templates, repo-guidance docs, verification config, the Python
version pin, and small repo support files. It does not update solution implementation code, working OpenSpec
changes, root README files, solution-owned agent instructions, or architecture
guidance owned by `delorean_architecture` unless you explicitly request those
paths from the appropriate source.

Use this helper for repos that were already scaffolded and have been developed
for a while. Do not rerun the first-time scaffold helper against a non-empty
solution repo.

Template-owned workflow sources are maintained under `repo-configs/github/` in
the upstream template. The update helper materializes them into
`.github/workflows/` and `.github/workflows-archive/` in solution repos.

## Dry Run

From the solution repo root:

```bash
make update-from-template-dry-run
```

This fetches `https://github.com/cds-snc/delorean_template.git` at `main` and prints the files that would change.

From a separate checkout of the template, target an existing solution repo:

```bash
make update-existing-solution-dry-run SOLUTION_TARGET=/path/to/solution
```

The script can also be called directly:

```bash
scripts/delorean/update-from-template.sh \
  --target /path/to/solution \
  --dry-run
```

## Apply

```bash
make update-from-template
```

Or from a separate template checkout:

```bash
make update-existing-solution SOLUTION_TARGET=/path/to/solution
```

Then review:

```bash
git status --short
git diff
```

The helper does not commit changes. Review and test before staging.

## Architecture Docs Only

Use the dedicated architecture-doc helper when the repo only needs the latest
generated guidance from `delorean_architecture` and does not need a broader
template update:

```bash
make update-architecture-docs-dry-run
make update-architecture-docs
```

From a separate template checkout, target an existing solution repo:

```bash
make update-architecture-docs-dry-run SOLUTION_TARGET=/path/to/solution
make update-architecture-docs SOLUTION_TARGET=/path/to/solution
```

The script can also be called directly:

```bash
scripts/delorean/update-architecture-docs.sh \
  --target /path/to/solution \
  --dry-run
```

By default this fetches `https://github.com/cds-snc/delorean_architecture.git`
at `main` and refreshes `architecture_docs/`. Use `ARCHITECTURE_REPO`,
`ARCHITECTURE_REF`, and `ARCHITECTURE_DOCS_DIR`, or the script's `--repo`,
`--ref`, and `--architecture-docs-dir` flags, to select another source or
target folder.

## Options

Use another branch, tag, commit, or fork:

```bash
make update-from-template TEMPLATE_REF=my-branch
make update-from-template TEMPLATE_REPO=https://github.com/example/delorean_template.git
```

Update only local agent configuration and related feedback, reference, and repo-guidance docs:

```bash
make update-agent-configs-dry-run
make update-agent-configs
make update-agent-configs AGENT_TOOL=codex
make update-agent-configs LEVEL2_PROMPT_SET=full
```

Agent configuration source files live under `agent-configs/` in the upstream
template. The update helper materializes them into the target selected by
`--agent-tool`: `vscode`, `codex`, `claude`, `all`, `none`, or `auto`.
`auto` detects existing materialized target folders and defaults to `vscode`
when none are present.

Run the script directly when you need optional flags:

```bash
scripts/delorean/update-from-template.sh --agent-config-only
scripts/delorean/update-from-template.sh --agent-config-only --agent-tool codex
scripts/delorean/update-from-template.sh --agent-config-only --level2-prompt-set full
scripts/delorean/update-from-template.sh --target /path/to/solution --dry-run
scripts/delorean/update-from-template.sh --include-architecture-docs
scripts/delorean/update-from-template.sh --include-delorean-config
scripts/delorean/update-from-template.sh --include-root-docs
scripts/delorean/update-from-template.sh --include-starter-code
scripts/delorean/update-from-template.sh --path docs/reference/local-verification.md
```

Use `--agent-config-only` when a solution repo wants the latest materialized agent targets, hooks, VS Code workspace extension recommendations, launch configurations, settings and tasks, active OpenSpec change picker, agent-run collection helper, and the reference or repo-guidance docs those agent configs depend on without refreshing broader template-owned docs and starter support files. For a default VS Code repo, this updates `.github/agents/`, `.github/prompts/`, `.github/skills/`, `.github/hooks/`, `.vscode/extensions.json`, `.vscode/launch.json`, `.vscode/settings.json`, `.vscode/tasks.json`, and `scripts/delorean/select-openspec-change.sh`. For Codex or Claude targets, it updates the corresponding `.agents/`, `.codex/`, or `.claude/` paths that are supported by the template source. It also removes deprecated generated VS Code feedback paths from existing VS Code solution repos when present.

For Codex targets, first-time scaffold writes root `AGENTS.md` from
`agent-configs/codex/AGENTS.md`, shared and Codex workflow skills to
`.agents/skills/`, and custom-agent TOML to `.codex/agents/`. Existing solution
updates refresh `AGENTS.md` only while it still has the generated Codex marker.
If a solution has replaced it with local instructions, the update helper
preserves it and prints a preservation message.

Level 2 repos use `--level2-prompt-set core` by default. That keeps the VS Code
prompt picker focused on the core onboarding prompts for requirements,
OpenSpec questions, OpenSpec archive, UI work, development, QA, and Git readiness. Use
`--level2-prompt-set full` when an existing Level 2 repo should receive the
nice-to-have prompts such as repo-wide autopilot, full delivery autopilot,
security review, platform update, data/API specialization, and hotfix prompts.

Use `--include-root-docs` only when you want to update `README.md` and `GETTING_STARTED.md`. Solution repos often customize these files. The upstream template's root `AGENTS.md` is template-maintainer guidance and is not copied into solution repos. Codex generated-solution instructions are updated from `agent-configs/codex/AGENTS.md` through agent config materialization, with the preservation rule above. Codex custom agents are refreshed from `agent-configs/codex/agents/`, and Codex workflow skills are refreshed from `agent-configs/codex/skills/`. GitHub Copilot instructions are updated through agent config materialization.

Use `--include-architecture-docs` when the repo should refresh generated shared
architecture guidance from `delorean_architecture` into `architecture_docs/`.
That folder is treated as generated reusable guidance; solution-specific
architecture decisions should live in local solution docs such as
`docs/architecture/`. Use `scripts/delorean/update-architecture-docs.sh` when
you want only this architecture-doc refresh without updating template-owned
files.

Use `--include-delorean-config` only when you intentionally want to replace the
solution repo's `delorean/config.yaml` from the template. By default, the
helper adds `delorean/config.yaml` only when missing and preserves an existing
solution adoption level.

Use `--include-starter-code` only when the solution still wants the template's
starter `frontend/`, `backend/`, `openapi/`, and `tests/` files. Do not use it
when those folders contain solution work that should be preserved. Working
OpenSpec specs, OpenSpec changes, and Delorean evidence are not refreshed by
this option; use explicit `--path` flags only when the repo owner intentionally
wants a specific upstream path.

## Preserved Solution State

The helper refreshes starter README files for OpenSpec and evidence folders,
but it does not copy upstream template-maintenance specs, OpenSpec change
packages, or evidence bundles into a solution repo by default:

- `openspec/specs/**` is solution-owned after scaffolding.
- `openspec/changes/**` is solution-owned after scaffolding.
- `delorean/evidence/**` is solution-owned after scaffolding.
- `Makefile` is preserved by default because solution repos often customize local commands. Use `--path Makefile` only when you intentionally want the template version.
- `delorean/config.yaml` is preserved unless `--include-delorean-config` is
  provided.

New template-owned generated files, such as VS Code prompts, settings, tasks,
launch profiles, extension recommendations, local helper scripts, hooks, MCP
setup, workflow files, and `.python-version` are added through the normal
update flow.

## After Updating

Run local verification that matches the changed files. At minimum, run:

```bash
scripts/delorean/run-format-checks.sh
scripts/delorean/run-markdown-checks.sh
scripts/delorean/run-structure-checks.sh
```

Record any meaningful skipped checks, conflicts, or follow-up work in the evidence bundle or PR notes.
