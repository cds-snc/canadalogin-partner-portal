---
name: dl-ops-hotfix
description: "Handle urgent containment, rollback, or hotfix work with evidence and approval boundaries intact."
---

# Hotfix Incident

## Recommended role

Delegate to the `coordinator` custom agent from
`.codex/agents/coordinator.toml` when specialized delegation materially
helps. Otherwise, follow this workflow in the current session.

## Purpose

Route urgent repair work while preserving evidence, approval boundaries, and follow-up traceability.

## Use when

- A production issue, protected-environment problem, urgent rollback, or hotfix needs action.
- The team needs a small but explicit plan for containment, remediation, verification, and approval.
- A fix may bypass normal timing but still needs ownership, rationale, evidence, and follow-up.

## Required inputs

- Incident or hotfix summary.
- Affected users, systems, environments, and current impact.
- Desired containment, rollback, or repair outcome.
- Known constraints, approvals, risks, logs, and evidence.
- OpenSpec lifecycle state and active change ID or current spec reference when relevant.
- Permission profile, environment scope, API/MCP access, sensitive-data handling, and audit expectations.

## Route

- Route through [.codex/agents/coordinator.toml](../../../.codex/agents/coordinator.toml).
- Use [.agents/skills/dl-dev-fix-bug/SKILL.md](../dl-dev-fix-bug/SKILL.md) when root-cause diagnosis is the main work.
- Use [.agents/skills/dl-security-review/SKILL.md](../dl-security-review/SKILL.md) when security or privacy risk is involved.
- Route implementation fixes to [.codex/agents/builder-general.toml](../../../.codex/agents/builder-general.toml).
- The Coordinator applies [delorean/config.yaml](../../../delorean/config.yaml) before requiring change-state, gates, Evidence Bundles, approvals, waivers, release-readiness, MCP, or subagent outputs.
- Route verification through [.codex/agents/qa-support.toml](../../../.codex/agents/qa-support.toml) and readiness through [.codex/agents/release-readiness.toml](../../../.codex/agents/release-readiness.toml) only when release-readiness is enabled or explicitly requested.
- Use [docs/repo-guidance/control-boundaries.md](../../../docs/repo-guidance/control-boundaries.md) before accessing protected environments, logs, sensitive data, APIs, MCP servers, or privileged tools.
- Use [docs/reference/openspec-lifecycle.md](../../../docs/reference/openspec-lifecycle.md) when the hotfix changes expected behavior tracked by OpenSpec.

## Expected outputs

- Containment, rollback, or hotfix plan with owner and approval needs.
- Control boundary summary and audit expectations.
- OpenSpec lifecycle state and follow-up archive expectation when relevant.
- Implementation and verification notes tied to the affected behavior.
- Evidence inputs, or Evidence Bundle and approval-response notes when `delorean-evidence` or release-readiness is invoked.
- Follow-up re-entry route for root cause, tests, docs, risk, or permanent remediation.

## Guardrails

- Do not bypass human approval for protected-environment, waiver, exception, or residual-risk decisions.
- Do not bypass permission profiles, environment protections, sensitive-data rules, or audit requirements.
- Keep emergency scope tight and record follow-up work explicitly.
- Preserve logs, checks, and rationale needed for post-incident review.

## Missing Details And Safe Defaults

When details are missing, do not stop at broad questions. Recommend a safe local reproduction, stub, or analysis path first when that can help without touching protected systems. Ask before shared-environment work, production work, real secrets, approval, waivers, deployment, rollback, destructive changes, or wider tool/API/MCP/file access.
