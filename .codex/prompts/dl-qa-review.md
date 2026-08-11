# DL Review All

<!-- delorean-template:codex-generated from agent-configs/vscode/prompts/dl-qa-review.prompt.md; run scripts/delorean/sync-codex-adapters.sh --write -->

Codex prompt adapter generated from `agent-configs/vscode/prompts/dl-qa-review.prompt.md`.

Recommended role: [QA Support](../agents/qa-support.md). When Codex subagent tooling is available, invoke that role with this prompt. If it is unavailable, read the role file and follow this prompt in the current session.


## Purpose

Review the scoped work across implementation, docs, OpenSpec, contracts, tests,
standards, and evidence before handoff.

## Use when

- The user asks for a broad review of all current changes.
- A branch needs one pass for bugs, standards drift, artifact mismatch, missing
  tests, and evidence gaps.
- The change cuts across API, UI, data, docs, OpenSpec, or local tooling.

## Required inputs

- Review scope: changed files, branch, pull request, issue, OpenSpec change, or
  named folders.
- Source request, issue, scenario, or decision.
- OpenSpec change ID or current spec reference when relevant.
- Known risk areas: UI, API, data, security, accessibility, official languages,
  IAM, IM, operations, evidence, or release readiness.
- Checks already run and skipped checks when known.

## Route

1. Read [docs/repo-guidance/where-things-go.md](../../docs/repo-guidance/where-things-go.md).
2. Use STD-002: Work Contexts and assume local developer / localhost when no environment is named.
3. Use [docs/repo-guidance/control-boundaries.md](../../docs/repo-guidance/control-boundaries.md) when agents, tools, APIs, MCP, sensitive data, generated evidence, or privileged commands are in scope.
4. Use [.agents/skills/delorean-review/SKILL.md](../../.agents/skills/delorean-review/SKILL.md) for review posture.
5. Use [.agents/skills/delorean-testing/SKILL.md](../../.agents/skills/delorean-testing/SKILL.md) for verification and skipped-check assessment.
6. Use [.agents/skills/review-gc-design-system-alignment/SKILL.md](../../.agents/skills/review-gc-design-system-alignment/SKILL.md) when user-facing UI changed.
7. Use [.agents/skills/gc-standards/SKILL.md](../../.agents/skills/gc-standards/SKILL.md), STD-019, BAS-001, and targeted `gc-review-*` skills when standards or baseline findings are needed.
8. Use STD-020: Database Persistence and PAT-012: Alembic PostgreSQL Change when database-backed behavior, models, repositories, migrations, seed data, or stored records changed.
9. QA Support applies [delorean/config.yaml](../../delorean/config.yaml) before requiring change-state, gates, Evidence Bundles, approvals, waivers, release-readiness, MCP, or subagent outputs.
10. Use [delorean/gates/gate-catalog.yaml](../../delorean/gates/gate-catalog.yaml) and `delorean/evidence/<change-id>/change-state.yaml` when gate tracking or change-state is in scope for an active change.
11. Use [.agents/skills/delorean-evidence/SKILL.md](../../.agents/skills/delorean-evidence/SKILL.md) when review evidence inputs need to be assembled into an Evidence Bundle.
12. Check OpenSpec, OpenAPI, tests, docs, configured process artifacts, and evidence inputs for drift against the source request.
13. Produce findings first, then evidence and remediation guidance.

## Expected outputs

- Findings ordered by severity with file references where available.
- OpenSpec, OpenAPI, docs, tests, and evidence drift findings.
- Change-state path when in scope.
- Current Delorean phase when in scope.
- OpenSpec lifecycle state.
- Applicable gates/checks when in scope.
- Gate summary when in scope.
- Standards findings, including GC Design System, accessibility, bilingual,
  security, privacy, IAM, IM, and evidence where applicable.
- Baseline findings, including BAS-001 applicability, affected `GC-WEB-*`
  controls, evidence gaps, deferred controls, and exceptions where applicable.
- Evidence Bundle path when `delorean-evidence` is invoked.
- Approval or waiver status when relevant.
- Re-entry phase and reason code when blocked and in scope.
- Local checks run, checks skipped, and reasons.
- Required fixes or a clear pass statement.
- Remediation handoff for Builder General when defects are actionable.
- Release-readiness or human-review blockers, if any.

## Guardrails

- Review does not approve waivers, exceptions, or release readiness.
- Do not mark checks as passing unless they were run or directly assessed.
- Do not copy OpenSpec requirement text into `change-state.yaml`; link back to OpenSpec.
- Do not archive OpenSpec changes from this review prompt.
- Do not expand to production, shared environments, real secrets, deployment, or
  destructive actions without explicit approval and a named target.
