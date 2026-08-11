# Change API

<!-- delorean-template:codex-generated from agent-configs/vscode/prompts/dl-dev-change-api.prompt.md; run scripts/delorean/sync-codex-adapters.sh --write -->

Codex prompt adapter generated from `agent-configs/vscode/prompts/dl-dev-change-api.prompt.md`.

Recommended role: [Coordinator](../agents/coordinator.md). When Codex subagent tooling is available, invoke that role with this prompt. If it is unavailable, read the role file and follow this prompt in the current session.


## Purpose

Change API or contract behavior with explicit compatibility, artifact, test, and evidence expectations.

## Use when

- REST resources, methods, response models, errors, pagination, versioning, OpenAPI, or external integrations may change.
- A backend change affects an API contract or downstream consumer.
- Compatibility, rollout, or migration sequencing needs review.

## Required inputs

- Contract or API summary and intended behavior.
- OpenSpec change, scenario, issue, ADR, or current OpenAPI reference.
- Known consumers, compatibility expectations, rollout constraints, and security concerns.
- OpenSpec lifecycle state and active change ID or current spec reference when relevant.
- Permission profile, API/MCP access, sensitive-data handling, and audit expectations when relevant.
- Existing contract tests, OpenAPI exports, or integration evidence when available.

## Route

- Route through [.codex/agents/coordinator.md](../agents/coordinator.md).
- Use [.codex/agents/spec-author.md](../agents/spec-author.md) when behavior, scenarios, or contract intent is unclear.
- Use [.codex/agents/delivery-planner.md](../agents/delivery-planner.md) to map contract, implementation, test, evidence, and compatibility work.
- Use [docs/reference/openspec-lifecycle.md](../../docs/reference/openspec-lifecycle.md) when the API change is an active OpenSpec change.
- The Coordinator applies [delorean/config.yaml](../../delorean/config.yaml) before requiring change-state, gates, Evidence Bundles, approvals, waivers, release-readiness, MCP, or subagent outputs.
- Use [delorean/gates/gate-catalog.yaml](../../delorean/gates/gate-catalog.yaml) and `delorean/evidence/<change-id>/change-state.yaml` when gate tracking or change-state is in scope for an active change.
- Use [.agents/skills/delorean-evidence/SKILL.md](../../.agents/skills/delorean-evidence/SKILL.md) when API evidence inputs need to be assembled into an Evidence Bundle.
- Use [docs/repo-guidance/control-boundaries.md](../../docs/repo-guidance/control-boundaries.md) when API access, auth scope, external integration, MCP access, sensitive data, or audit behavior changes.
- Use STD-009: REST API, STD-010: API Response and Error Models, and `openapi/` as local references.

## Expected outputs

- Spec or Plan package with contract scope and compatibility expectations.
- OpenSpec lifecycle state and archive expectation when relevant.
- Change-state path when in scope.
- Current Delorean phase when in scope.
- Applicable gates/checks when in scope.
- Gate summary when in scope.
- Control boundary summary when relevant.
- Impacted OpenSpec, OpenAPI, docs, tests, and evidence list.
- Evidence Bundle path when `delorean-evidence` is invoked.
- Approval or waiver status when relevant.
- Re-entry phase and reason code when blocked and in scope.
- Implementation and verification handoff with contract checks.
- Approval or re-entry needs when compatibility or policy risk remains.

## Guardrails

- Do not treat implementation as ready until Plan accepts the contract scope and validation strategy.
- Do not move active OpenSpec deltas into current specs before implementation and verification are complete.
- Do not expand API, MCP, auth, network, sensitive-data, or audit scope without recording the control boundary and approval path.
- Record no-update rationale when OpenSpec, OpenAPI, docs, or tests are intentionally unchanged.
- Do not copy OpenSpec requirement text into `change-state.yaml`; link back to OpenSpec.
- Preserve traceability from scenarios or requirements to contract checks and evidence.

## Missing Details And Safe Defaults

When details are missing, do not stop at broad questions. Recommend the safe local path first, list one or two alternatives when useful, and continue under local developer / localhost assumptions when safe. Ask only for details needed before shared-environment work, production work, real secrets, approval, waivers, deployment, destructive changes, or wider tool/API/MCP/file access.
