# Review Security

<!-- delorean-template:codex-generated from agent-configs/vscode/prompts/dl-security-review.prompt.md; run scripts/delorean/sync-codex-adapters.sh --write -->

Codex prompt adapter generated from `agent-configs/vscode/prompts/dl-security-review.prompt.md`.

Recommended role: [QA Support](../agents/qa-support.md). When Codex subagent tooling is available, invoke that role with this prompt. If it is unavailable, read the role file and follow this prompt in the current session.


## Purpose

Review a change for security and privacy risk, then route remediation or approval-sensitive follow-up.

## Use when

- Work touches authentication, authorization, sessions, tokens, roles, scopes, secrets, personal information, logging, or trust boundaries.
- A security or privacy reviewer needs a compact findings and evidence view.
- A release needs security status, residual-risk notes, or waiver context.

## Required inputs

- Changed code, API, config, data path, auth flow, or deployment surface.
- Source issue, OpenSpec scenario, threat model, ADR, or pull request.
- Known data classification, personal information, auth model, and deployment context.
- OpenSpec lifecycle state and active change ID or current spec reference when relevant.
- Permission profile, tool/API/MCP access, file scope, sensitive-data handling, and audit expectations.
- Existing scan results, review notes, or findings when available.

## Route

- Use [.agents/skills/gc-review-security/SKILL.md](../../.agents/skills/gc-review-security/SKILL.md) for explicit security and privacy findings.
- Use [.agents/skills/gc-review-iam/SKILL.md](../../.agents/skills/gc-review-iam/SKILL.md) when identity, auth, sessions, tokens, claims, scopes, or roles are in scope.
- Use [docs/repo-guidance/control-boundaries.md](../../docs/repo-guidance/control-boundaries.md) to verify permissions, allowlists, auth paths, sensitive-data handling, and audit expectations.
- Use [docs/reference/openspec-lifecycle.md](../../docs/reference/openspec-lifecycle.md) when security-relevant behavior is tracked by an active OpenSpec change.
- QA Support applies [delorean/config.yaml](../../delorean/config.yaml) before requiring change-state, gates, Evidence Bundles, approvals, waivers, release-readiness, MCP, or subagent outputs.
- Use [delorean/gates/gate-catalog.yaml](../../delorean/gates/gate-catalog.yaml) and `delorean/evidence/<change-id>/change-state.yaml` when gate tracking or change-state is in scope for an active change.
- Route implementation fixes to [.codex/agents/builder-general.md](../agents/builder-general.md), including frontend-only fixes.
- Route verification and evidence inputs through [.codex/agents/qa-support.md](../agents/qa-support.md). Use [.agents/skills/delorean-evidence/SKILL.md](../../.agents/skills/delorean-evidence/SKILL.md) only when an Evidence Bundle must be assembled or updated.

## Expected outputs

- Security and privacy findings with severity, traceability, and remediation guidance.
- Control-boundary findings and required permission or sensitive-data handling changes.
- OpenSpec lifecycle state when relevant.
- Change-state path when in scope.
- Current Delorean phase.
- Applicable gates/checks when in scope.
- Gate summary when in scope.
- Tests, scans, checks, or manual review needed to verify the result.
- Evidence inputs, residual risk, and waiver or specialist-review needs.
- Evidence Bundle path when `delorean-evidence` is invoked.
- Approval or waiver status when relevant.
- Re-entry route when intent, plan, implementation, evidence, or approval gaps remain.
- Re-entry phase and reason code when blocked and in scope.

## Guardrails

- Do not print secret values.
- Do not expand auth, API, MCP, file, environment, or sensitive-data scope without an explicit control-boundary decision.
- Do not approve risk acceptance, privacy decisions, waivers, or release readiness.
- Do not copy OpenSpec requirement text into `change-state.yaml`; link back to OpenSpec.
- Escalate suspected secret exposure, missing access control, or sensitive-data leakage immediately.

## Missing Details And Safe Defaults

When details are missing, do not stop at broad questions. Recommend the safe local path first, list one or two alternatives when useful, and continue under local developer / localhost assumptions when safe. Ask only for details needed before shared-environment work, production work, real secrets, approval, waivers, deployment, destructive changes, or wider tool/API/MCP/file access.
