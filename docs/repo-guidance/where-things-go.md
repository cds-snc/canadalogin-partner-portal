# Where Things Go

Use this guide to understand where local prompts, skills, agents, docs, and automation should look for repo context.

Use [ownership-and-updates.md](ownership-and-updates.md) to decide ownership and update flow.
Use [architecture-docs.md](architecture-docs.md) to resolve shared architecture
document IDs, baselines, controls, and catalogs to generated files.
Use [adoption-levels.md](adoption-levels.md) to decide how much Delorean process
agents should apply.

The Delorean core repo remains the source of truth for shared guidance. This
repo stores only local starters and solution-specific files. Generated solution
repos also receive shared architecture guidance from `delorean_architecture`.

Agent customization files are source-first in the upstream template. The
template stores them under `agent-configs/`; the scaffold and update helpers
materialize them into tool-native target paths such as `.github/`, `.agents/`,
or `.claude/` in generated solution repos.

## Local Context Folders

| Folder | Normal Use |
|---|---|
| [LOCAL_DEVELOPMENT.md](../../LOCAL_DEVELOPMENT.md) | Short human-facing command sheet for the local application lifecycle. |
| [GETTING_STARTED.md](../../GETTING_STARTED.md) | Short human-facing first steps for a new solution repo created from this template. |
| `getting-started/` | Template-maintainer scaffold helper and docs. This folder is excluded from generated solution repos. |
| `agent-configs/vscode/prompts/` source; `.github/prompts/` generated target | Reusable VS Code and GitHub Copilot prompts for common work. |
| `agent-configs/shared/skills/` source; `.github/skills/`, `.agents/skills/`, or `.claude/skills/` generated targets | Local skills with repo-specific procedures and `references.md` loading manifests. |
| `agent-configs/vscode/agents/` source; `.github/agents/` generated target | VS Code and GitHub Copilot agent instructions and roles. |
| `agent-configs/codex/AGENTS.md` source; `AGENTS.md` generated target for Codex | Codex project instructions for generated solution repos. This is separate from the upstream template-maintainer root `AGENTS.md`. |
| `agent-configs/codex/agents/` source; `.codex/agents/*.toml` generated target | Standalone Codex custom-agent definitions for the six Delorean phase roles. |
| `agent-configs/codex/skills/` source; `.agents/skills/dl-*/SKILL.md` generated target | Discoverable Codex workflow skills aligned with the cross-tool workflow catalog. |
| `agent-configs/shared/hooks/` source; `.github/hooks/` generated target | Local automation hooks. |
| `agent-configs/vscode/vscode/extensions.json` source; `.vscode/extensions.json` generated target | VS Code extension recommendations for the starter stack and local agent workflow. |
| `agent-configs/vscode/vscode/launch.json` source; `.vscode/launch.json` generated target | VS Code starter app, test, and browser debug configurations. |
| `agent-configs/vscode/vscode/settings.json` source; `.vscode/settings.json` generated target | VS Code workspace settings, including conservative terminal command auto-approval defaults for routine Delorean checks. |
| `agent-configs/vscode/vscode/tasks.json` source; `.vscode/tasks.json` generated target | VS Code task shortcuts for routine Delorean diagnostics, verification, active OpenSpec change picking, OpenSpec validation, and app start commands. |
| `repo-configs/github/workflows/` source; `.github/workflows/` generated target | Active GitHub Actions workflow source files. |
| `repo-configs/github/workflows-archive/` source; `.github/workflows-archive/` generated target | Inactive GitHub Actions workflow examples. |
| `scripts/delorean/` | Helper scripts used by hooks and lightweight workflows. |
| [scripts/delorean/collect-agent-run.sh](../../scripts/delorean/collect-agent-run.sh) | Local agent-run bundle collector for review context. |
| [scripts/delorean/create-openspec-change.sh](../../scripts/delorean/create-openspec-change.sh) | Local-first OpenSpec change package creator when the official OpenSpec CLI is unavailable or not needed. |
| [scripts/delorean/doctor.sh](../../scripts/delorean/doctor.sh) | Non-mutating local setup and readiness diagnostic used by `make doctor`. |
| [scripts/delorean/select-openspec-change.sh](../../scripts/delorean/select-openspec-change.sh) | Local active OpenSpec change picker used by Make and VS Code tasks. |
| [scripts/delorean/run-frontend-standards-checks.sh](../../scripts/delorean/run-frontend-standards-checks.sh) | Lightweight GC Design System usage guard for frontend work. |
| [scripts/delorean/run-ui-page-shell-checks.sh](../../scripts/delorean/run-ui-page-shell-checks.sh) | Lightweight page shell and shared menu checker for starter UI pages. |
| [scripts/delorean/update-architecture-docs.sh](../../scripts/delorean/update-architecture-docs.sh) | Helper for refreshing only generated `architecture_docs/` from `delorean_architecture` in an existing solution repo. |
| [scripts/delorean/update-from-template.sh](../../scripts/delorean/update-from-template.sh) | Helper for refreshing template-owned files in an existing solution repo, including `--target` support when run from a separate template checkout. |
| [docs/repo-guidance/docs-audience.md](docs-audience.md) | Human, agent, template, example, local tool, and archive classification for Markdown content. |
| [docs/repo-guidance/architecture-docs.md](architecture-docs.md) | ID-first lookup guide for generated architecture guidance from `delorean_architecture`. |
| [docs/repo-guidance/adoption-levels.md](adoption-levels.md) | Adoption-level guide for agent orchestration and required outputs. |
| [docs/repo-guidance/agent-tool-permissions.md](agent-tool-permissions.md) | Starter guidance for durable agent command-prefix approvals. |
| `frontend/` | Optional React, TypeScript, Vite, and GC Design System starter frontend. |
| [frontend/README.md](../../frontend/README.md) | Frontend starter purpose and commands. |
| [frontend/DEV_SETUP.md](../../frontend/DEV_SETUP.md) | Frontend local setup, lint, format, typecheck, and test notes. |
| [frontend/package.json](../../frontend/package.json) | Frontend package scripts used by local checks and optional workflows. |
| [frontend/eslint.config.js](../../frontend/eslint.config.js) | Frontend lint configuration. |
| [frontend/tsconfig.json](../../frontend/tsconfig.json) | Frontend TypeScript project references. |
| `backend/` | Optional FastAPI starter backend. |
| [backend/README.md](../../backend/README.md) | Backend starter purpose, local run command, and standards links. |
| [backend/requirements-dev.txt](../../backend/requirements-dev.txt) | Backend development dependencies for linting, formatting, and tests. |
| [Makefile](../../Makefile) | Friendly level-aware local command entrypoint for starter dev servers, backend checks, dependency setup, optional OpenSpec CLI setup, and hooks. |
| [.flake8](../../.flake8) | Backend Flake8 lint configuration. |
| [pytest.ini](../../pytest.ini) | Backend pytest and coverage configuration. |
| [delorean/config.yaml](../../delorean/config.yaml) | Delorean adoption level and active feature expectations for agents. |
| `docs/templates/` | Small local templates for specs, evidence, and setup. |
| [docs/templates/openspec-template.md](../templates/openspec-template.md) | OpenSpec-compatible `spec.md` helper template. |
| [docs/templates/openspec-change-package-template.md](../templates/openspec-change-package-template.md) | Full local-first OpenSpec change package starter. |
| [docs/templates/work-context-and-assumptions-template.md](../templates/work-context-and-assumptions-template.md) | Reusable local, shared non-production, and production assumption block. |
| [docs/repo-guidance/openspec-and-delorean.md](openspec-and-delorean.md) | How OpenSpec specs and changes connect to Delorean evidence, approvals, and release readiness. |
| [docs/templates/evidence-bundle-template.md](../templates/evidence-bundle-template.md) | Starter evidence bundle template. |
| `architecture_docs/` | Generated shared architecture guidance copied from `delorean_architecture` by the scaffold helper. Reference documents by stable ID and title first. |
| `architecture_docs/standards/README.md` | Lookup index for `STD-*` standards. |
| `architecture_docs/standards/catalog.yml` | Machine-readable standards routing index for categories, task triggers, and related standards. |
| `architecture_docs/patterns/README.md` | Lookup index for `PAT-*` patterns. |
| `architecture_docs/patterns/catalog.yml` | Machine-readable pattern routing index for problems, fit criteria, related standards, and related patterns. |
| `architecture_docs/controls/README.md` | Lookup index for reusable controls such as `GC-WEB-*`. |
| `architecture_docs/controls/catalog.yml` | Machine-readable control registry for control namespaces, categories, related standards, and baseline use. |
| `architecture_docs/baselines/README.md` | Lookup index for `BAS-*` baseline profiles. |
| `architecture_docs/baselines/catalog.yml` | Machine-readable baseline profile registry. |
| `architecture_docs/baselines/bas-001-government-of-canada-web-application-baseline.controls.yml` | Machine-readable active GC web application baseline control profile. |
| `architecture_docs/templates/README.md` | Lookup index for `TPL-*` reusable templates. |
| `architecture_docs/architecture/README.md` | Lookup index for reusable architecture note, ADR, and reference architecture guidance. |
| `architecture_docs/architecture/reference/catalog.yml` | Machine-readable reusable reference architecture registry. |
| `architecture_docs/architecture/adrs/catalog.yml` | Machine-readable published architecture decision registry. |
| [docs/repo-guidance/ownership-and-updates.md](ownership-and-updates.md) | Ownership and update rules for local artifacts. |
| [docs/reference/local-verification.md](../reference/local-verification.md) | Local verification setup and bypass guidance. |
| [docs/reference/advanced-getting-started.md](../reference/advanced-getting-started.md) | Fuller setup, prompt, OpenSpec, evidence, architecture ID, and update-helper reference. |
| [docs/reference/container-local-build-and-run.md](../reference/container-local-build-and-run.md) | Local backend container build, run, health check, and optional scan guidance. |
| [docs/reference/architecture-diagram-samples/](../reference/architecture-diagram-samples/) | Local PlantUML C4 and AWS topology examples for architecture diagram tool evaluation. |
| [docs/reference/agent-run-log-bundles.md](../reference/agent-run-log-bundles.md) | Local review bundle guidance for saving agent logs and repo context. |
| [docs/reference/delorean-workflows.md](../reference/delorean-workflows.md) | Workflow diagrams for prompt entrypoints, phase loops, UI review, autopilot, re-entry, and archive follow-through. |
| [docs/reference/using-official-openspec.md](../reference/using-official-openspec.md) | Optional official OpenSpec CLI usage guidance. |
| [docs/reference/update-from-template.md](../reference/update-from-template.md) | Pull latest template-owned files into a solution repo. |
| `docs/architecture/` | Optional solution architecture notes and ADRs. Create only when local solution architecture records are needed. |
| `docs/design/` | Solution design notes and design packages. |
| `docs/reference/` | Task-specific human reference, setup details, and first-tester walkthroughs. |
| `docs/repo-guidance/` | Repo maps, ownership rules, update rules, docs-audience, and agent-tool guidance. |
| STD-001: Document Identifiers | Architecture guidance ID, title, and filename rules. |
| STD-003: Full-Stack Application Stack | Accepted full-stack React/FastAPI application stack decisions and local-safe defaults. |
| STD-017: Government of Canada Standards Review | Main standards impact check for Government of Canada design, accessibility, official languages, security, privacy, IAM, IM, and evidence. |
| STD-019: Government of Canada Web Application Baseline Governance | Active GC web application baseline governance, control status, evidence, deferred control, and exception rules. |
| BAS-001: Government of Canada Web Application Baseline | Active reusable baseline profile for GC web applications. |
| STD-002: Work Contexts | Local, shared non-production, and production work boundary standard. |
| STD-006: GC UI Page Layout Rules | Local approved page pattern and page shell rules for user-facing UI work. |
| STD-004: Frontend React and TypeScript | Starter React and TypeScript frontend standard. |
| STD-005: Frontend GC Design System | Main starter GC Design System usage standard. |
| STD-007: UI Accessibility Basics | General UI accessibility review starter. |
| STD-008: Backend FastAPI | Starter FastAPI backend standard. |
| STD-009: REST API | Starter REST API standard. |
| STD-010: API Response and Error Models | Starter API response and error model standard. |
| STD-011: Logging and Observability | Starter logging and observability standard. |
| STD-012: Testing Basics | Starter testing and evidence standard. |
| STD-013: Security and Privacy Basics | Starter security and privacy standard. |
| STD-014: Secrets and Configuration | Starter secrets, environment variable, and configuration standard. |
| STD-015: Code Quality, Linting, and Formatting | Starter linting, formatting, type check, and static check standard. |
| STD-016: Container Build and Deployment | Starter container build and deployment standard. |
| STD-020: Database Persistence | Starter relational persistence, model, migration, repository, seed-data, and stored-record standard. |
| PAT-001: UI Page Patterns | Approved starter page patterns. |
| PAT-012: Alembic PostgreSQL Change | PostgreSQL schema change and Alembic migration pattern. |
| GC-WEB-* controls | Reusable control expectations referenced by `BAS-*` baseline profiles. |
| TPL-004: Pattern Template | Template for adding a new recipe. |
| TPL-010: Reference Architecture Template | Template for reusable reference architecture documents. |
| TPL-011: GC Web Application Baseline Assessment Template | Template for release or meaningful-change baseline assessment records. |
| TPL-012: Control Template | Template for reusable controls. |
| TPL-013: Baseline Profile Template | Template for reusable baseline profiles. |
| [delorean/templates/approval-response-template.md](../../delorean/templates/approval-response-template.md) | Starter approval response template. |
| [delorean/templates/waiver-template.md](../../delorean/templates/waiver-template.md) | Starter waiver template. |
| `delorean/evidence/` | Evidence created by the solution. |
| [docs/reference/approval-routing-and-reentry.md](../reference/approval-routing-and-reentry.md) | Human approval, waiver, and re-entry decision guidance. |
| [openspec/README.md](../../openspec/README.md) | OpenSpec folder purpose and official-compatible starter structure. |
| `openspec/specs/` | Current functional requirements and scenarios by capability. |
| `openspec/changes/` | Proposed changes with proposal, design, tasks, and spec deltas. |
| [openspec/specs/README.md](../../openspec/specs/README.md) | Current spec folder guidance. |
| [openspec/changes/README.md](../../openspec/changes/README.md) | Active change folder guidance. |
| [openapi/README.md](../../openapi/README.md) | API contract folder purpose. |
| `openapi/` | API contracts. |
| [tests/README.md](../../tests/README.md) | Test folder purpose. |
| `tests/` | Automated tests and test notes. |

## Key Starter Files

- [OpenSpec template](../templates/openspec-template.md)
- [OpenSpec change package template](../templates/openspec-change-package-template.md)
- [Work context and assumptions template](../templates/work-context-and-assumptions-template.md)
- [OpenSpec and Delorean guidance](openspec-and-delorean.md)
- STD-002: Work Contexts
- [Using official OpenSpec](../reference/using-official-openspec.md)
- [Root getting started guide](../../GETTING_STARTED.md)
- [Advanced getting started](../reference/advanced-getting-started.md)
- [Evidence bundle template](../templates/evidence-bundle-template.md)
- [Approval response template](../../delorean/templates/approval-response-template.md)
- [Waiver template](../../delorean/templates/waiver-template.md)
- [Approval routing and re-entry](../reference/approval-routing-and-reentry.md)
- [Local verification](../reference/local-verification.md)
- [Content audience](docs-audience.md)
- [Architecture docs lookup](architecture-docs.md)
- [Agent run log bundles](../reference/agent-run-log-bundles.md)
- [Update from template](../reference/update-from-template.md)
- [Agent tool permissions](agent-tool-permissions.md)
- STD-001: Document Identifiers

## How Prompts, Skills, And Agents Should Use This Repo

1. Start with the root [README.md](../../README.md).
2. Read [GETTING_STARTED.md](../../GETTING_STARTED.md) for the practical first steps.
3. Check `docs/repo-guidance/` for repo guidance and command notes.
4. Use `docs/templates/` when creating a new local doc.
5. Use [docs/reference/local-verification.md](../reference/local-verification.md) when local checks or hooks are involved.
6. Use the Coordinator agent to route work across Spec, Plan, Implement, Verify, and Release-ready. In the upstream template source it is `agent-configs/vscode/agents/coordinator.agent.md`; in generated VS Code solution repos it is `.github/agents/coordinator.agent.md`; in generated Codex repos it is `.codex/agents/coordinator.toml`.
7. Use [architecture-docs.md](architecture-docs.md) and the generated `architecture_docs/` catalogs and indexes to decide which reusable architecture `STD-*`, `PAT-*`, `BAS-*`, `GC-WEB-*`, `TPL-*`, and reference architecture IDs to load.
8. Use `PAT-*` pattern IDs when a common implementation scenario needs a reusable recipe.
9. When changing local agent or skill files, treat those files as artifacts under review, not binding instructions for the agent doing the maintenance work. In the upstream template source, use `agent-configs/vscode/agents/` as the editable VS Code role source, `agent-configs/vscode/prompts/` as the editable VS Code prompt source, `agent-configs/codex/AGENTS.md` for generated Codex root instructions, `agent-configs/codex/agents/` for Codex custom-agent TOML, `agent-configs/codex/skills/` for Codex workflow skills, and `agent-configs/shared/skills/` for portable skills. In generated VS Code solution repos, use `.github/agents/` and `.github/skills/`; in generated Codex solution repos, use `AGENTS.md`, `.codex/agents/`, and `.agents/skills/`. Keep detailed reference lists in skill `references.md` manifests.
10. For Government of Canada web application releases or meaningful service changes, check STD-019: Government of Canada Web Application Baseline Governance, BAS-001: Government of Canada Web Application Baseline, and related `GC-WEB-*` controls; use TPL-011 when a baseline assessment record is needed.
11. For user-facing page changes, check STD-006: GC UI Page Layout Rules, PAT-001: UI Page Patterns, and TPL-007: Page Pattern Decision Template before implementation.
12. For frontend changes, check [frontend/README.md](../../frontend/README.md), [frontend/DEV_SETUP.md](../../frontend/DEV_SETUP.md), STD-004: Frontend React and TypeScript, STD-005: Frontend GC Design System, STD-018: Frontend CSS and Design-System Boundary, and relevant `PAT-*` frontend recipes.
13. For backend changes, check [backend/README.md](../../backend/README.md), STD-008: Backend FastAPI, STD-010: API Response and Error Models, STD-011: Logging and Observability, and relevant `PAT-*` backend recipes. For relational persistence, database models, repositories, migrations, seed data, or stored records, also check STD-020: Database Persistence and PAT-012: Alembic PostgreSQL Change.
14. Use STD-015: Code Quality, Linting, and Formatting and STD-014: Secrets and Configuration before changing local tool or config shape.
15. Use STD-016: Container Build and Deployment and [docs/reference/container-local-build-and-run.md](../reference/container-local-build-and-run.md) before adding Dockerfiles, container build commands, image scanning, or AWS container deployment notes.
16. Use STD-002: Work Contexts when a request mentions environments, deployment, secrets, data, external systems, or does not name an environment.
17. Use `openspec/specs/` and `openspec/changes/` for functional requirements and proposed change planning.
18. Use [docs/reference/using-official-openspec.md](../reference/using-official-openspec.md) only when a solution repo intentionally opts into the official OpenSpec CLI.
19. Use [docs/repo-guidance/openspec-and-delorean.md](openspec-and-delorean.md) when connecting OpenSpec requirements and scenarios to tests, evidence, approvals, or waivers.
20. Use [docs/reference/approval-routing-and-reentry.md](../reference/approval-routing-and-reentry.md) when approval state changes or re-entry is needed.
21. Read solution docs from `docs/`, `openspec/`, `openapi/`, and `tests/`.
22. Link to Delorean core when operating model guidance is needed and to
    `architecture_docs/` when reusable architecture guidance is needed.

## What Should Stay Outside The Solution Repo

- Shared architecture standards, patterns, baselines, controls, reference
  architectures, ADR catalogs, and reusable templates from `delorean_architecture`.
- Shared operating model guidance from Delorean core.
- Large source-of-truth documents.
- Cross-repo examples that are not specific to this solution.
