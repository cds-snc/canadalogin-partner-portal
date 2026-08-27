---
name: dl-ui-review-accessibility
description: "Review and remediate accessibility risk for user-facing changes."
---

# Review Accessibility

## Recommended role

Delegate to the `qa-support` custom agent from
`.codex/agents/qa-support.toml` when specialized delegation materially
helps. Otherwise, follow this workflow in the current session.

## Purpose

Review user-facing work for accessibility risk and route remediation when findings require changes.

## Use when

- A page, component, form, content flow, or status/error path needs accessibility validation.
- Keyboard, focus, semantic HTML, ARIA, labels, language, reflow, contrast, or screen-reader behavior is in scope.
- A release needs accessibility findings, remediation notes, or evidence.

## Required inputs

- Changed pages, components, forms, or content.
- Source issue, OpenSpec scenario, design package, or pull request.
- Known accessibility expectations, target browsers/devices, and assistive-technology concerns.
- OpenSpec lifecycle state and active change ID or current spec reference when relevant.
- Control boundary summary when the review uses external tools, generated evidence, sensitive data, or privileged access.
- Existing axe, keyboard, screen-reader, or manual review evidence when available.

## Route

- Use [.agents/skills/gc-review-a11y/SKILL.md](../../../.agents/skills/gc-review-a11y/SKILL.md) for explicit accessibility findings.
- Use [.agents/skills/gc-standards/SKILL.md](../../../.agents/skills/gc-standards/SKILL.md) when GC standards may apply.
- Use [docs/reference/openspec-lifecycle.md](../../../docs/reference/openspec-lifecycle.md) and [docs/repo-guidance/control-boundaries.md](../../../docs/repo-guidance/control-boundaries.md) when those are in scope.
- QA Support applies [delorean/config.yaml](../../../delorean/config.yaml) before requiring change-state, gates, Evidence Bundles, approvals, waivers, release-readiness, MCP, or subagent outputs.
- Use [delorean/gates/gate-catalog.yaml](../../../delorean/gates/gate-catalog.yaml) and `delorean/evidence/<change-id>/change-state.yaml` when gate tracking or change-state is in scope for an active change.
- Route implementation fixes to [.codex/agents/builder-general.toml](../../../.codex/agents/builder-general.toml). Builder General should use the accessibility, GC Design System, bilingual, and UI page pattern skills as needed.
- Route verification and evidence inputs through [.codex/agents/qa-support.toml](../../../.codex/agents/qa-support.toml). Use [.agents/skills/delorean-evidence/SKILL.md](../../../.agents/skills/delorean-evidence/SKILL.md) only when an Evidence Bundle must be assembled or updated.

## Expected outputs

- Accessibility findings with severity and traceability.
- OpenSpec lifecycle state and control boundary status when relevant.
- Change-state path when in scope.
- Current Delorean phase.
- Applicable gates/checks when in scope.
- Gate summary when in scope.
- Recommended remediation and verification checks.
- Evidence inputs, skipped checks, and remaining risk.
- Evidence Bundle path when `delorean-evidence` is invoked.
- Approval or waiver status when relevant.
- Re-entry route when intent, plan, implementation, evidence, or approval gaps remain.
- Re-entry phase and reason code when blocked and in scope.

## Guardrails

- Do not claim formal accessibility approval from this skill alone.
- Do not expand tooling, file, external service, or generated-evidence scope without a control-boundary decision.
- Treat WCAG A and AA failures as blockers unless a human-approved exception exists.
- Do not copy OpenSpec requirement text into `change-state.yaml`; link back to OpenSpec.
- Preserve traceability to the issue, OpenSpec scenario, design note, tests, and evidence.

## Missing Details And Safe Defaults

When details are missing, do not stop at broad questions. Recommend the safe local path first, list one or two alternatives when useful, and continue under local developer / localhost assumptions when safe. Ask only for details needed before shared-environment work, production work, real secrets, approval, waivers, deployment, destructive changes, or wider tool/API/MCP/file access.
