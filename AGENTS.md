# Delorean Solution Agent Instructions

<!-- delorean-template:codex-agents v1 -->

This file is the Codex project instruction file for a generated Delorean
solution repo. It is owned by this solution repo after scaffold and should be
kept aligned with local docs, standards, checks, and agent skills.

## Start Here

Before making meaningful changes, read:

- [README.md](README.md)
- [GETTING_STARTED.md](GETTING_STARTED.md)
- [delorean/config.yaml](delorean/config.yaml)
- [docs/repo-guidance/where-things-go.md](docs/repo-guidance/where-things-go.md)
- [docs/repo-guidance/architecture-docs.md](docs/repo-guidance/architecture-docs.md)
- [docs/repo-guidance/adoption-levels.md](docs/repo-guidance/adoption-levels.md)
- [docs/repo-guidance/control-boundaries.md](docs/repo-guidance/control-boundaries.md)
- [docs/reference/local-verification.md](docs/reference/local-verification.md)

Use `delorean/config.yaml` to decide how much Delorean process applies. Skills
are level-agnostic; the agent applies the configured adoption level.

## Safe Defaults

When a request does not name an environment, assume local developer /
localhost work only:

- use fake, fixture, or test-only data;
- do not use real secrets, production identifiers, production data, or shared
  environment data;
- do not deploy, publish, push, mutate external systems, or change production;
- when creating reusable artifacts, use durable domain or environment-path
  names rather than localhost-only names; keep `local`, `test`, `fake`, or
  `demo` names for disposable fixtures, local config values, and examples that
  will not be promoted;
- record the local assumption in OpenSpec, tasks, or evidence when the change
  needs traceability.

Ask or stop before shared non-production work, production work, real secrets,
destructive actions, external systems, approvals, waivers, deployments, or a
wider permission boundary.

## Control Boundary

Before agent, skill, API, MCP, external tool, privileged command,
sensitive-data, or generated-evidence work starts, identify the control
boundary from
[docs/repo-guidance/control-boundaries.md](docs/repo-guidance/control-boundaries.md).

For local template-style work, a normal boundary is:

- allowed: repo-scoped reads and edits, local verification commands, local
  fake/test data;
- denied: production, shared environments without a named target, real secrets,
  real personal information, deployment, publishing, and external system
  mutation;
- sensitive data: none expected; do not include secrets or production data in
  prompts, logs, tests, or evidence.

## Delorean Workflow

Use OpenSpec for behavior and requirement changes:

- current requirements live in `openspec/specs/`;
- active proposed changes live in `openspec/changes/<change-id>/`;
- keep `proposal.md`, `design.md`, `tasks.md`, and spec deltas current for
  meaningful changes;
- update tests with changed scenarios;
- archive completed functional changes only after implementation and
  verification so current specs reflect the implemented behavior.

At Level 2, keep the workflow lightweight: OpenSpec, architecture guidance,
implementation, testing, local verification, and developer-readiness summaries.
Do not require Level 3 or 4 change-state, gates, Evidence Bundles, approvals,
waivers, or formal release packaging unless the user asks or the repo config
requires them.

At Level 3 or 4, maintain the configured change-state, gates, evidence,
approval, waiver, and release-readiness artifacts.

## Architecture Guidance

Generated solution repos receive reusable architecture guidance under
`architecture_docs/`.

Reference guidance by stable ID and title first, for example:

- `STD-002: Work Contexts`
- `STD-003: Full-Stack Application Stack`
- `STD-006: GC UI Page Layout Rules`
- `STD-019: Government of Canada Web Application Baseline Governance`
- `STD-020: Database Persistence`
- `PAT-001: UI Page Patterns`
- `PAT-012: Alembic PostgreSQL Change`
- `BAS-001: Government of Canada Web Application Baseline`
- `GC-WEB-007: Security`
- `TPL-006: ADR Template`
- `TPL-011: GC Web Application Baseline Assessment Template`

Use [docs/repo-guidance/architecture-docs.md](docs/repo-guidance/architecture-docs.md)
and the generated `architecture_docs/**/catalog.yml` files to resolve IDs to
files only when a tool needs to load them.

## Skills

Codex scaffold targets receive portable local skills under `.agents/skills/`.
Use them when your Codex runtime surfaces local skills. If the runtime does not
load them automatically, read the relevant `SKILL.md` file directly.

Common choices:

- `delorean-planning`: scope, sequence, impacted artifacts, standards, and
  implementation handoff.
- `delorean-question-resolution`: resolve OpenSpec, design, planning, or
  standards questions from repo context before asking humans.
- `delorean-openspec`: refine requirements, scenarios, tasks, validation
  readiness, and archive follow-through.
- `delorean-implementation`: implement a scoped change and keep impacted
  artifacts aligned.
- `delorean-testing`: select and add the highest-value tests.
- `delorean-review`: review code, docs, specs, tests, and evidence.
- `delorean-ui`, `select-ui-page-pattern`, and
  `review-gc-design-system-alignment`: use before and after user-facing UI
  changes.
- `gc-standards` and `gc-review-*`: use when Government of Canada standards,
  accessibility, bilingual, security, privacy, IAM, or records concerns may
  apply.

## Codex Agents And Workflow Skills

Codex scaffold targets receive six project-scoped custom agents under
`.codex/agents/`:

- `coordinator.toml`
- `spec-author.toml`
- `delivery-planner.toml`
- `builder-general.toml`
- `qa-support.toml`
- `release-readiness.toml`

Each standalone TOML file defines `name`, `description`, and
`developer_instructions`. When Codex subagent or multi-agent tooling is
available, invoke the receiving role with a concise handoff. If it is
unavailable, follow the target role contract in the current session.

Reusable Codex workflows are discoverable repo skills under
`.agents/skills/<name>/SKILL.md`. Invoke the skill that matches the request,
for example:

- `$dl-requirements-start`
- `$dl-dev-continue`
- `$dl-dev-autopilot`
- `$dl-ui-build-page`
- `$dl-qa-check`
- `$dl-qa-review`

Each workflow skill records its recommended receiving role.

## Implementation Rules

- Prefer existing repo patterns, commands, helpers, tests, and local docs.
- Keep local files thin and practical; link to reusable architecture guidance
  instead of copying it.
- Keep generated architecture guidance in `architecture_docs/`; do not recreate
  duplicate architecture source docs in this repo.
- Local-first reusable work should still be named for the real use case. Put
  environment-specific values in config, fixtures, `.env.local`, or deployment
  parameters, and do not bake `local`, `test`, `fake`, or `demo` into reusable
  code, API, database, queue, feature flag, service, or evidence identifiers
  unless the artifact is explicitly disposable.
- Do not assume Docker Desktop. Container guidance should work with a
  Docker-compatible local runtime such as Colima, Docker Desktop if approved,
  or another approved runtime.
- Treat `frontend/` and `backend/` as optional starter examples that the
  solution may keep, replace, or remove.
- When changing prompts, agents, skills, hooks, workflows, standards,
  templates, source/generated paths, or evidence paths, update related docs,
  scaffold/update helpers, and structure checks together.
- When changing scaffold behavior, run dry-run checks and at least one real
  temporary scaffold when practical, then verify the generated repo structure.
- When designing, testing, or changing local agent or skill files, treat those
  files as artifacts under review. Follow active system, developer, user, and
  this `AGENTS.md` first.

## Verification

Use [docs/reference/local-verification.md](docs/reference/local-verification.md)
to select checks. Common local commands are:

```sh
scripts/delorean/run-structure-checks.sh
scripts/delorean/run-format-checks.sh
scripts/delorean/run-markdown-checks.sh
scripts/delorean/run-delorean-state-checks.sh
scripts/delorean/run-local-verification.sh
```

If a relevant check cannot run, record the skipped-check reason and remaining
risk clearly.
