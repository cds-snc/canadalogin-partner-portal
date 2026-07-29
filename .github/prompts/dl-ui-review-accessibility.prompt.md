---
id: dl-ui-review-accessibility
description: Review and remediate accessibility risk for user-facing changes.
use_when:
  - User-facing UI, forms, content, keyboard behavior, focus behavior, or screen-reader behavior needs explicit accessibility validation.
  - Accessibility findings need remediation, verification findings, or evidence inputs.
default_golden_paths:
  - accessibility_review_remediation
common_overlays:
  - feature_delivery
  - incident_hotfix
  - gc_standards
  - evidence_review
required_inputs:
  - changed_ui_or_content_scope
  - scenario_or_issue_reference
  - accessibility_expectations
  - business_rule_ids_when_relevant
  - existing_evidence_when_available
produces:
  - verification_package
  - implementation_package_when_remediation_is_needed
  - conditional_approval_or_waiver_context
agent: QA Support
---

# Review Accessibility

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

- Use [.github/skills/gc-review-a11y/SKILL.md](../skills/gc-review-a11y/SKILL.md) for explicit accessibility findings.
- Use [.github/skills/gc-standards/SKILL.md](../skills/gc-standards/SKILL.md) when GC standards may apply.
- Use [docs/reference/openspec-lifecycle.md](../../docs/reference/openspec-lifecycle.md) and [docs/repo-guidance/control-boundaries.md](../../docs/repo-guidance/control-boundaries.md) when those are in scope.
- QA Support applies [delorean/config.yaml](../../delorean/config.yaml) before requiring change-state, gates, Evidence Bundles, approvals, waivers, release-readiness, MCP, or subagent outputs.
- Use [delorean/gates/gate-catalog.yaml](../../delorean/gates/gate-catalog.yaml) and `delorean/evidence/<change-id>/change-state.yaml` when gate tracking or change-state is in scope for an active change.
- Route implementation fixes to [.github/agents/builder-general.agent.md](../agents/builder-general.agent.md). Builder General should use the accessibility, GC Design System, bilingual, and UI page pattern skills as needed.
- Route verification and evidence inputs through [.github/agents/qa-support.agent.md](../agents/qa-support.agent.md). Use [.github/skills/delorean-evidence/SKILL.md](../skills/delorean-evidence/SKILL.md) only when an Evidence Bundle must be assembled or updated.

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

- Do not claim formal accessibility approval from this prompt alone.
- Do not expand tooling, file, external service, or generated-evidence scope without a control-boundary decision.
- Treat WCAG A and AA failures as blockers unless a human-approved exception exists.
- Do not copy OpenSpec requirement text into `change-state.yaml`; link back to OpenSpec.
- Preserve traceability to the issue, OpenSpec scenario, design note, tests, and evidence.

## Missing Details And Safe Defaults

When details are missing, do not stop at broad questions. Recommend the safe local path first, list one or two alternatives when useful, and continue under local developer / localhost assumptions when safe. Ask only for details needed before shared-environment work, production work, real secrets, approval, waivers, deployment, destructive changes, or wider tool/API/MCP/file access.
