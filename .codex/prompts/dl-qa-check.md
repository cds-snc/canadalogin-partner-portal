# Check Work

<!-- delorean-template:codex-generated from agent-configs/vscode/prompts/dl-qa-check.prompt.md; run scripts/delorean/sync-codex-adapters.sh --write -->

Codex prompt adapter generated from `agent-configs/vscode/prompts/dl-qa-check.prompt.md`.

Recommended role: [QA Support](../agents/qa-support.md). When Codex subagent tooling is available, invoke that role with this prompt. If it is unavailable, read the role file and follow this prompt in the current session.


## Purpose

Run a local quality loop before review so the repo is easier to verify and maintain.

## Use when

- Work is ready for local checks before a pull request or review.
- A team needs to confirm docs, tests, specs, contracts, and evidence are aligned.
- A change touches API, UI, data, operations, or mixed areas.

Use `dl-qa-commit-ready` instead when the immediate goal is a local commit.
Use `dl-qa-push-ready` instead when the immediate goal is updating a remote
branch.

## Required inputs

- Change summary.
- Files or areas changed.
- Expected checks to run.
- Known skipped checks and why.
- OpenSpec lifecycle state, active change ID, or current spec reference when relevant.
- Control boundary summary and permission exceptions when relevant.
- Evidence or traceability requirements for the work.

## Route

- Start with [docs/repo-guidance/where-things-go.md](../../docs/repo-guidance/where-things-go.md).
- Use [docs/templates/repo-checklist.md](../../docs/templates/repo-checklist.md) for repo setup checks when relevant.
- Use [docs/templates/evidence-bundle-template.md](../../docs/templates/evidence-bundle-template.md) to collect proof.
- QA Support applies [delorean/config.yaml](../../delorean/config.yaml) before requiring change-state, gates, Evidence Bundles, approvals, waivers, release-readiness, MCP, or subagent outputs.
- When gate tracking is in scope, use [delorean/gates/gate-catalog.yaml](../../delorean/gates/gate-catalog.yaml) to check which verification gates apply.
- When change-state is in scope, use `delorean/evidence/<change-id>/change-state.yaml` for the latest gate/check results, skipped checks, evidence links, approval/waiver status, and re-entry when an active change is in scope.
- When evidence packaging is in scope, use [.agents/skills/delorean-evidence/SKILL.md](../../.agents/skills/delorean-evidence/SKILL.md) to assemble or update the Evidence Bundle from existing evidence inputs.
- Use STD-017: Government of Canada Standards Review and `scripts/delorean/run-frontend-standards-checks.sh` when Government of Canada standards or frontend UI are involved. For user-facing UI, also verify primary task navigation paths and raw HTML control exceptions.
- Use STD-020: Database Persistence and PAT-012: Alembic PostgreSQL Change when relational persistence, models, repositories, migrations, seed data, or stored records changed.
- Check `tests/`, `openspec/`, and `openapi/` when the change touches behavior or contracts.
- When an active OpenSpec change is in scope, update or flag review and verification checklist items in `tasks.md`.
- Use [docs/reference/openspec-lifecycle.md](../../docs/reference/openspec-lifecycle.md) to include OpenSpec validation status and archive expectation when active changes are in scope.
- Use [docs/repo-guidance/control-boundaries.md](../../docs/repo-guidance/control-boundaries.md) to include control-compliance status when tools, APIs, MCP servers, file scopes, sensitive data, or environments are in scope.
- Link to Delorean core for shared quality, review, and evidence expectations.

## Expected outputs

- Local quality checklist.
- Commands run and results.
- OpenSpec validation status and archive readiness when relevant.
- Change-state path when in scope.
- Current Delorean phase when in scope.
- OpenSpec lifecycle state.
- Applicable gates/checks when in scope.
- Gate summary when in scope.
- Active OpenSpec `tasks.md` review and verification checklist status when relevant.
- Control-compliance status and unresolved permission exceptions when relevant.
- Evidence Bundle path when `delorean-evidence` is invoked.
- Approval or waiver status when relevant.
- Re-entry phase and reason code when blocked and in scope.
- Skipped checks with reasons.
- GC Design System usage, primary task navigation paths, and raw HTML control exception status when UI changed.
- Evidence links and remaining risks.

## Guardrails

- Do not report checks as passing if they were not run.
- Do not silently drop evidence or traceability requirements.
- Do not copy OpenSpec requirement text into `change-state.yaml`; link back to OpenSpec.
- Do not archive active OpenSpec changes from a quality loop unless this is explicitly a release-readiness step.
- Do not ignore control-boundary drift or permission expansion.
- Keep results concise and tied to the change.
- In a copied solution repo, verify solution-specific assumptions against local specs, docs, tests, and evidence.
- Avoid adding solution-specific assumptions only when explicitly maintaining the upstream template baseline.

## Missing Details And Safe Defaults

When details are missing, do not stop at broad questions. Recommend the safe local path first, list one or two alternatives when useful, and continue under local developer / localhost assumptions when safe. Ask only for details needed before shared-environment work, production work, real secrets, approval, waivers, deployment, destructive changes, or wider tool/API/MCP/file access.
