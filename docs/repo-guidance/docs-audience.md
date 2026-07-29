# Content Audience

Use this guide to decide which Markdown files humans are expected to read, which files are reference material, and which files should be loaded through agents, skills, prompts, or templates.

This is the classification layer for the current docs shape. Move or consolidate files only when links, skills, agents, prompts, and update scripts are updated together.

## Audience Labels

| Label | Meaning | Rule |
|---|---|---|
| Human primary | A developer or tester is expected to read this during normal setup or first use. | Keep short, task-oriented, and linked from `README.md` or `GETTING_STARTED.md`. |
| Human reference | A developer may read this when doing a specific task, but it is not required upfront. | Keep discoverable through `docs/README.md`, `docs/reference/`, and `docs/repo-guidance/`. |
| Agent-loaded | Agents or skills should load this when a trigger applies. Humans should not need to browse it manually. | Reference it from skill `SKILL.md` files, skill `references.md` manifests, agent contracts, prompts, or repo-guidance files. |
| Reviewer reference | Architects, security, privacy, accessibility, QA, or release reviewers may review against this material. | Keep it in standards, architecture, reference, or repo-guidance, not in an agent-only folder. |
| Template | A copy-and-adapt artifact. | Keep short and clearly marked as a template. |
| Example | A starter scenario, sample change, or illustrative file. | Keep clearly separated from real solution work. |
| Tool support | Command, hook, workflow, or MCP support material. | Keep close to the script or tool it documents. |
| Archive | Optional or inactive material. | Keep out of the primary reading path. |

## Human Primary

These are the files a new developer or first tester should reasonably be asked to read.

| File | Why |
|---|---|
| [README.md](../../README.md) | Entry point and repo purpose. |
| [GETTING_STARTED.md](../../GETTING_STARTED.md) | Short first setup path after creating a solution repo. |
| [docs/README.md](../README.md) | Short docs index and audience routing. |
| [docs/reference/local-verification.md](../reference/local-verification.md) | Local checks, hooks, and CI expectations. |
| [docs/reference/update-from-template.md](../reference/update-from-template.md) | Refreshing template-owned files in a solution repo. |
| [docs/reference/agent-run-log-bundles.md](../reference/agent-run-log-bundles.md) | Human explanation for local agent-run review bundles. |

## Human Reference

These are useful when a developer is doing the specific task named by the file.

| File or folder | Use |
|---|---|
| [backend/README.md](../../backend/README.md) | Backend starter setup and commands. |
| [frontend/README.md](../../frontend/README.md) | Frontend starter setup and commands. |
| [frontend/DEV_SETUP.md](../../frontend/DEV_SETUP.md) | Frontend local development details. |
| [docs/reference/advanced-getting-started.md](../reference/advanced-getting-started.md) | Fuller setup, prompt, OpenSpec, evidence, architecture ID, and update-helper reference. |
| [docs/reference/architecture-diagram-samples/](../reference/architecture-diagram-samples/) | PlantUML C4 and AWS topology examples for architecture diagram tool evaluation. |
| [docs/reference/container-local-build-and-run.md](../reference/container-local-build-and-run.md) | Local container build and health-check flow. |
| [docs/reference/delorean-workflows.md](../reference/delorean-workflows.md) | Prompt entrypoints and diagrams for Delorean workflows, re-entry, UI review, autopilot, and archive follow-through. |
| [docs/reference/first-tester-quickstart.md](../reference/first-tester-quickstart.md) | End-to-end first tester path. |
| `getting-started/template-smoke-test.md` | Upstream template maintainer smoke test. Excluded from generated solution repos. |
| [docs/reference/using-official-openspec.md](../reference/using-official-openspec.md) | Optional official OpenSpec CLI usage. |
| [docs/repo-guidance/agent-tool-permissions.md](agent-tool-permissions.md) | Recommended command approvals for agent tools, the active OpenSpec change picker, and generated VS Code workspace extension recommendations, debug configurations, settings, and tasks. |
| [docs/repo-guidance/where-things-go.md](where-things-go.md) | Where local context lives. |
| [docs/repo-guidance/ownership-and-updates.md](ownership-and-updates.md) | Artifact ownership and update rules. |
| [docs/repo-guidance/architecture-docs.md](architecture-docs.md) | How to resolve architecture `STD-*`, `PAT-*`, and `TPL-*` IDs to generated files. |
| [docs/repo-guidance/adoption-levels.md](adoption-levels.md) | How adoption level changes agent orchestration and required outputs. |
| [docs/repo-guidance/openspec-and-delorean.md](openspec-and-delorean.md) | How OpenSpec connects to evidence, approvals, and tests. |
| `architecture_docs/patterns/README.md` | Architecture-derived implementation pattern index in generated solution repos. |
| `architecture_docs/baselines/README.md` | Architecture-derived baseline profile index in generated solution repos. |
| `architecture_docs/controls/README.md` | Architecture-derived reusable control index in generated solution repos. |
| `architecture_docs/architecture/README.md` | Architecture-derived ADR and reference architecture index in generated solution repos. |
| [openapi/README.md](../../openapi/README.md) | API contract folder purpose. |
| [openspec/README.md](../../openspec/README.md) | OpenSpec folder purpose. |
| [tests/README.md](../../tests/README.md) | Shared test folder purpose. |
| [docs/reference/approval-routing-and-reentry.md](../reference/approval-routing-and-reentry.md) | Approval and re-entry decision guidance. |

## Agent-Loaded And Reviewer Reference

These files should primarily be consumed through agents, skills, prompts, or automated checks.

| File or folder | Expected consumer |
|---|---|
| `AGENTS.md` | Upstream template maintainer instructions. Excluded from generated solution repos; Codex scaffold targets receive their own generated-solution instructions from `agent-configs/codex/AGENTS.md`. |
| `agent-configs/codex/AGENTS.md` source; `AGENTS.md` generated Codex target | Codex project instructions for generated solution repos. |
| `agent-configs/codex/agents/` source; `.codex/agents/` generated Codex target | Generated Codex role adapters for the six Delorean phase agents. |
| `agent-configs/codex/prompts/` source; `.codex/prompts/` generated Codex target | Generated Codex prompt adapters aligned with the VS Code prompt catalog. |
| `agent-configs/vscode/copilot-instructions.md` source; `.github/copilot-instructions.md` generated target | GitHub Copilot agent mode. |
| `agent-configs/vscode/agents/` source; `.github/agents/` generated target | VS Code and GitHub Copilot agent definitions and routing contracts. |
| `agent-configs/vscode/prompts/` source; `.github/prompts/` generated target | VS Code and GitHub Copilot prompt entrypoints. |
| `agent-configs/shared/skills/` source; `.github/skills/`, `.agents/skills/`, or `.claude/skills/` generated targets | Skill procedures, working sets, and reference-loading manifests. |
| `architecture_docs/standards/` | Architecture-derived standards loaded by skills based on affected area and reviewed by human reviewers when relevant. |
| `architecture_docs/standards/catalog.yml` | Machine-readable standards routing index loaded before choosing which standards to read. |
| `architecture_docs/patterns/` | Architecture-derived patterns loaded by skills and agents when a common implementation shape applies. |
| `architecture_docs/patterns/catalog.yml` | Machine-readable pattern routing index loaded before choosing which patterns to read. |
| `architecture_docs/baselines/` | Architecture-derived baseline profiles loaded when app-type baseline assessment may apply. |
| `architecture_docs/baselines/catalog.yml` | Machine-readable baseline routing index loaded before baseline assessment. |
| `architecture_docs/controls/` | Architecture-derived reusable controls loaded when baseline or control evidence applies. |
| `architecture_docs/controls/catalog.yml` | Machine-readable reusable control registry loaded before choosing control details. |
| `architecture_docs/architecture/reference/catalog.yml` | Machine-readable reference architecture registry loaded when a solution follows or varies from a reusable reference architecture. |
| `architecture_docs/architecture/adrs/catalog.yml` | Machine-readable published ADR registry loaded when reusable ADRs are published. |
| `architecture_docs/templates/` | Reusable architecture templates loaded by skills, agents, and reviewers by `TPL-*` ID. |
| [delorean/templates/](../../delorean/templates/) | Approval and waiver payload templates. |
| `agent-configs/shared/hooks/` source; `.github/hooks/` generated target | Hook behavior loaded through setup and local verification docs. |
| [scripts/delorean/](../../scripts/delorean/) | Local check adapters invoked by agents, hooks, and CI. |

## Templates

These are copy-and-fill artifacts.

| File or folder | Use |
|---|---|
| [docs/templates/](../templates/) | Local solution templates for copy-and-fill artifacts. |
| TPL-005: Architecture Note Template | Architecture note starter. |
| [delorean/templates/approval-response-template.md](../../delorean/templates/approval-response-template.md) | Human approval response template. |
| [delorean/templates/waiver-template.md](../../delorean/templates/waiver-template.md) | Waiver and exception template. |

## Examples

These are illustrative starter files and should not be confused with real solution content.

| File or folder | Use |
|---|---|
| [delorean/examples/](../../delorean/examples/) | Example feature and debug scenarios. |
| `openspec/specs/**` except `README.md` | Upstream template-only examples or maintainer current specs. The scaffold resets this folder to README-only starter contents in generated solution repos. |
| `openspec/changes/**` except `README.md` | Upstream template-only examples or maintainer change packages. The scaffold resets this folder to README-only starter contents in generated solution repos. |
| `delorean/evidence/**` except `README.md` | Upstream template-maintenance evidence and change-state records. The scaffold resets this folder to README-only starter contents in generated solution repos. |

## Local Tools And Archive

| File or folder | Use |
|---|---|
| `getting-started/scaffold-solution-repo.sh` | Local scaffold helper for creating a solution repo from this template. Excluded from generated solution repos. |
| `getting-started/README.md` | Upstream template-maintainer scaffold guide. Excluded from generated solution repos. |
| `repo-configs/github/workflows/` source; `.github/workflows/` generated target | Active workflow source files materialized into generated solution repos. |
| `repo-configs/github/workflows-archive/` source; `.github/workflows-archive/` generated target | Inactive example workflow source files. |
| `.delorean/agent-runs/` | Ignored local raw review bundles. Not source-controlled and not formal evidence. |

## Current Docs Folder Shape

Generated solution repos separate task reference, first-tester walkthroughs,
repo guidance, architecture-derived guidance, solution notes, and templates:

```text
architecture_docs/    # generated architecture standards, patterns, controls, baselines, templates, reference architecture, and indexes

docs/
  reference/        # task-specific human reference and first-tester walkthroughs
  repo-guidance/    # repo maps, ownership rules, update rules, docs-audience, and agent-tool guidance
  design/           # solution design notes
  templates/        # copy-and-fill artifacts
```

Create `docs/architecture/` only when a solution needs local architecture notes
or ADRs. Reusable architecture guidance belongs in generated `architecture_docs/`.

When moving or consolidating docs, update related links in:

- `README.md`
- `GETTING_STARTED.md`
- `AGENTS.md` when maintaining the upstream template
- `agent-configs/codex/AGENTS.md` when changing generated Codex instructions
- `agent-configs/vscode/agents/`, `agent-configs/vscode/prompts/`, and the
  Codex adapter sync script when changing generated Codex role or prompt
  adapters
- `agent-configs/vscode/agents/`
- `agent-configs/shared/skills/`
- `agent-configs/vscode/prompts/`
- `scripts/delorean/update-from-template.sh`
- `docs/repo-guidance/architecture-docs.md`
- `docs/repo-guidance/adoption-levels.md`
- `docs/repo-guidance/where-things-go.md`
- `docs/repo-guidance/ownership-and-updates.md`

## Consolidation Candidates

Start with these, because they are most likely to reduce human reading load without weakening agent context:

1. Keep [GETTING_STARTED.md](../../GETTING_STARTED.md) as the short first-use path, keep [docs/reference/advanced-getting-started.md](../reference/advanced-getting-started.md) as the detailed setup reference, keep [docs/reference/first-tester-quickstart.md](../reference/first-tester-quickstart.md) as the human smoke path, and keep `getting-started/template-smoke-test.md` template-maintainer-only.
2. Keep [docs/reference/local-verification.md](../reference/local-verification.md) as the human checks guide and keep hook/workflow script READMEs as local tool reference.
3. Move detailed standards usage into skills by strengthening `agent-configs/shared/skills/*/SKILL.md` trigger rules and reference loading, rather than asking humans to read every standard.
4. Keep upstream template examples and maintainer OpenSpec changes clearly marked and reset OpenSpec and Delorean evidence state folders to README-only starter contents in generated solution repos; do not mix template-maintenance artifacts with real solution artifacts.
