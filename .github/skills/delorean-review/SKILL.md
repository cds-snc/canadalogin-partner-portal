---
name: delorean-review
description: Check conformance, impacted artifacts, evidence, and traceability before review or handoff.
---

# Purpose

Check whether a change conforms to local repo expectations and updates the artifacts it affects.

# Local wrapper metadata

Source: Delorean core, local template wrapper
Snapshot or version: Template starter, update when synced from Delorean core
Owner: Repo maintainers until replaced by a solution owner
Applies to phases: Plan, Verify, Release-ready
Skill perspective: Checks alignment, drift, gaps, OpenSpec lifecycle, Delorean gate status, control boundaries, readiness, evidence, and traceability.
Invocation criteria: Use before review, handoff, approval, or release-readiness decisions.
Pre-handoff checks: Traceability, OpenSpec lifecycle state when relevant, change-state path when relevant, control boundary when relevant, gate status, updated artifacts, evidence status, findings, and open risks are clear.
Related local gates: [delorean/gates/gate-catalog.yaml](../../../delorean/gates/gate-catalog.yaml), [docs/templates/evidence-bundle-template.md](../../../docs/templates/evidence-bundle-template.md), [delorean/templates/approval-response-template.md](../../../delorean/templates/approval-response-template.md)
Refresh model: Review when Delorean core guidance changes or when local workflow drift is found

# Inputs

- Change summary.
- Diff or pull request.
- Related issue, spec, design package, ADR, or evidence.
- OpenSpec lifecycle state and active change ID or current spec reference when relevant.
- Change-state path, current Delorean phase, gate summary, approval or waiver status, and re-entry state when available.
- Control boundary summary, work context, and permission exceptions when relevant.
- Expected checks and review criteria.

# Reference Loading

Use [references.md](references.md) as the loading manifest. Load only the always-needed references plus the sections that match the review surface. Browse or verify official external sources when current policy, product version, or compliance detail matters.

# Output Scope

This skill is adoption-level agnostic. The invoking agent decides whether Delorean process artifacts such as change-state, gates, evidence packaging, approval or waiver context, release-readiness context, or subagent handoffs are required. Use or suggest those artifacts only when they are provided, requested, or required by the invoking agent.

# Procedure

1. Confirm the change is traceable to a request or decision.
2. Check behavior, docs, active OpenSpec changes or current specs, active `tasks.md` checklist state, API contracts, tests, standards, work context, control boundaries, and evidence for alignment.
3. Check `delorean/evidence/<change-id>/change-state.yaml` before approval-sensitive or release-readiness review when change-state is in scope.
4. When gate tracking is in scope, confirm gate statuses from [delorean/gates/gate-catalog.yaml](../../../delorean/gates/gate-catalog.yaml) are `pass`, `waived` with a linked human record, or `not_applicable`.
5. When user-facing UI changed, verify the page pattern decision, page shell evidence, primary task navigation paths, GC Design System usage, and any custom UI exception.
6. Identify missing or outdated impacted artifacts, including stale implementation, review, or verification checklist items in active `tasks.md`.
7. For Level 2 behavior changes, confirm current requirements and scenarios will be accurate after archive before calling the change developer-ready or merge-ready.
8. Confirm completed active OpenSpec changes are ready for archive only after implementation and verification are complete. Confirm archive status in `change-state.yaml` when change-state is in scope.
9. Call out risks, regressions, standards gaps, control gaps, gate gaps, and unclear assumptions.
10. Keep findings specific, actionable, and tied to files or evidence.

# Outputs

- Review findings or clear pass statement.
- OpenSpec lifecycle state, validation/archive expectation, and drift findings when relevant.
- Current spec freshness findings for behavior changes.
- Active `tasks.md` checklist drift or completion status when an active OpenSpec change is in scope.
- Change-state path, current Delorean phase, applicable gates/checks, gate summary, Evidence Bundle path when evidence packaging is in scope, approval or waiver status, and re-entry phase or reason code when blocked and in scope.
- Control-boundary findings, including permission profile, API/MCP access, file scope, sensitive-data handling, and audit evidence when relevant.
- Missing artifact list.
- Standards findings, including primary task navigation paths, GC Design System usage, raw HTML control status, and custom UI exceptions when UI changed.
- Page pattern decision, page shell, design-system check, screenshot, and accessibility evidence gaps when user-facing page work changed.
- Suggested checks or evidence.
- Open questions and residual risk.

# When to escalate

- A change weakens approval, evidence, or traceability expectations.
- There are security, privacy, accessibility, or operational concerns.
- UI work skipped GC Design System components without a clear reason.
- User-facing page work has no recorded page pattern decision, page shell evidence, or clear primary task navigation paths.
- The review depends on reusable architecture guidance not present under
  `architecture_docs/`.
- The change appears too broad for the stated request.
- Completed active OpenSpec changes are unarchived without a stated reason.
- Level 2 behavior changes leave current requirements or scenarios stale.
- Permission profile, allowlists, sensitive-data handling, or audit evidence is missing for scoped control-sensitive work.
- When gate tracking is in scope, a required gate/check status is missing, stale, failed, or not linked to evidence.

# Source and ownership

- This is a local template wrapper.
- Delorean core remains the source of truth for shared skill guidance.
- Solution repos may customize local examples, but should not silently change the Delorean operating expectations.
