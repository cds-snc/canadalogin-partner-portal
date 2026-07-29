# Advanced Getting Started

Use this after the short path in [GETTING_STARTED.md](../../GETTING_STARTED.md)
when you need more setup detail or want to understand what the generated repo
contains.

## Local Boundary

Default first-use work is local developer work: frontend and backend on
localhost, fake or test-only data, no real secrets, no production data, no
deployment, and no external system changes.

Use STD-002: Work Contexts when work mentions localhost, shared environments,
production, deployment, secrets, data, or external services. Agents should
suggest a safe local path and record assumptions instead of asking broad
environment questions.

## Repo Map

Use [../repo-guidance/where-things-go.md](../repo-guidance/where-things-go.md)
when changing structure, ownership, update behavior, agent/tool permissions,
adoption level, OpenSpec routing, or architecture document lookup.

The most common repo areas are:

- `frontend/`: optional React, TypeScript, Vite, and GC Design System starter.
- `backend/`: optional FastAPI starter backend.
- `openspec/`: current functional specs and proposed change packages.
- `openapi/`: API contracts.
- `tests/`: shared or cross-cutting tests and notes.
- `docs/repo-guidance/`: repo maps, ownership rules, adoption-level guidance,
  and architecture lookup guidance.
- `docs/reference/`: task-specific human reference.
- `architecture_docs/`: generated architecture guidance from
  `delorean_architecture` in generated solution repos.

## Prompts, Skills, And Agents

Generated VS Code solution repos receive:

- `.github/prompts/`: prompt wrappers for common work.
- `.github/skills/`: reusable procedures for planning, implementation, review,
  and testing.
- `.github/agents/`: phase-aware agent roles for Spec, Plan, Implement,
  Verify, and Release-ready.
- `.vscode/`: extension recommendations, launch configurations, settings, and
  task shortcuts.

Codex targets receive a generated root `AGENTS.md`, shared skills under
`.agents/skills/`, role adapters under `.codex/agents/`, and prompt adapters
under `.codex/prompts/`. Claude targets receive shared skills under
`.claude/skills/`.

Start with these prompt names for common work:

- `dl-requirements-start`: turn a rough brief or PRD into an OpenSpec change.
- `dl-requirements-refine`: repair requirements, scenarios, tasks, or lifecycle
  state.
- `dl-requirements-answer-questions`: resolve OpenSpec open questions with
  focused human feedback.
- `dl-requirements-archive`: archive a completed OpenSpec change into current
  specs after verification.
- `dl-plan-refine`: repair technical approach, impacted artifacts, or slice
  planning.
- `dl-ui-refine`: refine UI, page shell, navigation, GC Design System,
  accessibility, or bilingual behavior.
- `dl-dev-continue`: continue the next safe task for an active change.
- `dl-dev-active-change`: keep working local slices for one named change.
- `dl-dev-autopilot`: scan the active change queue and continue ready local
  slices across changes.
- `dl-qa-check`: run or plan the local quality loop.
- `dl-qa-review`: review scoped work before developer readiness.
- `dl-qa-commit-ready`: check staged changes before committing.
- `dl-qa-push-ready`: run the pre-push path before updating a remote.

Use [delorean-workflows.md](delorean-workflows.md) when you want workflow
diagrams for prompt entrypoints, re-entry, autopilot, and archive follow-through.

## Dependency Setup

Use the short path first:

```sh
make help
make doctor
make setup-local-env
```

Install all starter app dependencies when you are ready to run the app:

```sh
make setup
```

This installs or verifies Node.js, installs frontend dependencies from
`frontend/package-lock.json`, creates or reuses `.venv` with Python 3.12,
installs backend development dependencies, and installs the optional official
OpenSpec CLI.

Install only one side when needed:

```sh
make install-frontend-deps
make install-dev-python
```

Start both starter services:

```sh
make dev
```

Use `make start-frontend` or `make start-backend` when you only need one
service.

Do not commit `frontend/node_modules/`, `.venv/`, local `.env` files, local
certificates, coverage output, or cache folders.

## OpenSpec

Use `openspec/specs/` for current functional requirements and scenarios.

Use `openspec/changes/` for proposed changes with `proposal.md`, `design.md`,
`tasks.md`, and spec deltas.

Create a local-first change package:

```sh
make new-openspec-change CHANGE_ID=my-change CAPABILITY=my-capability TITLE="My Change"
```

Pick or validate an active change:

```sh
make pick-openspec-change
make validate-active-openspec-change
```

The official OpenSpec CLI is optional. Use
[using-official-openspec.md](using-official-openspec.md) only when the solution
repo intentionally opts in. If it is enabled, `make setup` installs it and
`make check-openspec-cli` verifies that `openspec` is on `PATH`.

OpenSpec does not replace tests, evidence, approvals, waivers, verification, or
release readiness.

## Local Verification And Hooks

Hooks are opt-in:

```sh
make setup-hooks
```

Remove the hook path:

```sh
make uninstall-hooks
```

Run the full local loop:

```sh
scripts/delorean/run-local-verification.sh
```

The starter checks cover structure, formatting, Markdown, shell checks when
available, lint/type checks, secret checks, fast tests, and optional container
checks. See [local-verification.md](local-verification.md) for details, skipped
checks, strict traceability mode, and troubleshooting.

## Agent Run Review Context

Use this when you want to feed a completed or in-progress agent run back into
Codex, ChatGPT, or another reviewer:

```sh
make collect-agent-run
```

The default bundle location is `.delorean/agent-runs/`, which is ignored by
Git. Use [agent-run-log-bundles.md](agent-run-log-bundles.md) before sharing a
bundle or preserving one under `delorean/evidence/`.

## Evidence And Adoption Levels

The generated repo records its Delorean adoption level in
`delorean/config.yaml`.

At Level 2, agents focus on OpenSpec support, implementation, architecture
guidance, testing, local verification, and lightweight developer readiness.
They do not require change-state, gates, Evidence Bundles, approval records,
waiver records, or formal release-readiness packaging unless you explicitly ask
for those artifacts.

At Level 3, meaningful changes should keep lightweight change-state, gates, and
evidence summaries aligned.

At Level 4, meaningful changes use the fuller Delorean workflow, including
formal gates, Evidence Bundles, approvals or waivers when applicable, and
release-readiness packaging.

Use [../templates/evidence-bundle-template.md](../templates/evidence-bundle-template.md)
when a change needs review evidence. Use
[approval-routing-and-reentry.md](approval-routing-and-reentry.md) when approval
state, waiver state, or re-entry decisions are involved.

## Architecture IDs

Generated solution repos receive reusable architecture guidance under
`architecture_docs/`.

Use [../repo-guidance/architecture-docs.md](../repo-guidance/architecture-docs.md)
to route by category or task trigger and resolve architecture document IDs such
as `STD-003`, `STD-019`, `STD-020`, `BAS-001`, `GC-WEB-007`, `PAT-001`,
`PAT-012`, `TPL-006`, and `TPL-011`.

Reference reusable architecture guidance by stable document ID and title first.
Extend locally only when the solution needs a specific adaptation.

## Updating Template-Owned Files Later

Use [update-from-template.md](update-from-template.md) when a solution repo
needs newer template-owned docs, local checks, prompts, skills, agents, hooks,
workflows, or starter support files.

Preview updates:

```sh
make update-from-template-dry-run
```

Refresh only generated agent configuration:

```sh
make update-agent-configs-dry-run
make update-agent-configs AGENT_TOOL=codex
```

From a separate checkout of the upstream template:

```sh
make update-existing-solution-dry-run SOLUTION_TARGET=/path/to/solution
```

Review generated diffs before keeping template updates. Solution-specific code,
OpenSpec changes, evidence, contracts, README text, and local docs remain owned
by the solution repo.
