---
name: delorean-implementation
description: Make a scoped change correctly while keeping impacted docs, specs, tests, evidence, and traceability aligned.
---

# Purpose

Make a scoped change correctly while keeping docs, specs, tests, and evidence aligned.

# Local wrapper metadata

Source: Delorean core, local template wrapper
Snapshot or version: Template starter, update when synced from Delorean core
Owner: Repo maintainers until replaced by a solution owner
Applies to phases: Implement
Skill perspective: Protects standards, OpenSpec lifecycle state, Delorean change-state, control boundaries, gate status, traceability, and impacted artifact updates while making the change.
Invocation criteria: Use when scope, expected behavior, and traceability are clear enough to implement.
Pre-handoff checks: Traceability, OpenSpec lifecycle state when relevant, change-state path when relevant, control boundary when relevant, updated artifacts, gate updates backed by evidence, verification notes, skipped checks, and open risks are recorded.
Related local gates: [delorean/gates/gate-catalog.yaml](../../../delorean/gates/gate-catalog.yaml), [scripts/delorean/run-local-verification.sh](../../../scripts/delorean/run-local-verification.sh), [docs/templates/evidence-bundle-template.md](../../../docs/templates/evidence-bundle-template.md)
Refresh model: Review when Delorean core guidance changes or when local workflow drift is found

# Inputs

- Approved or traceable work request.
- Relevant plan, OpenSpec, design package, ADR, or issue.
- OpenSpec lifecycle state and active change ID or current spec reference when relevant.
- Change-state path, current Delorean phase, gate summary, approval or waiver status, and re-entry state when available.
- Work context when known. If unknown, implement only the local developer / localhost path and record that assumption.
- Permission profile, allowed file scope, API/MCP/tool access, sensitive-data handling, and audit expectations when relevant.
- Repo standards and templates.
- Expected verification and evidence.

# Reference Loading

Use [references.md](references.md) as the loading manifest. Load only the always-needed references plus the sections that match the files or behavior being changed. Browse or verify official external sources when current policy, product version, or compliance detail matters.

# Output Scope

This skill is adoption-level agnostic. The invoking agent decides whether Delorean process artifacts such as change-state, gates, evidence packaging, approval or waiver context, release-readiness context, or subagent handoffs are required. Use or suggest those artifacts only when they are provided, requested, or required by the invoking agent.

# Continue from active tasks

When continuing an active change, pick one small safe task from `openspec/changes/<change-id>/tasks.md`. Prefer the first unchecked implementation task in the current slice unless the user names another task. Update `tasks.md` after the task, and update `change-state.yaml` only when change-state is in scope. Do not start a new slice when the current slice has unresolved required checks unless the user explicitly asks and the configured process output allows it.

Run or record the relevant local checks after the task. If a check cannot run, record the skipped-check reason instead of treating it as passing.

Before continuing, read `delorean/evidence/<change-id>/change-state.yaml` when it exists. Stop or ask if the change is blocked, approval-sensitive, outside the control boundary, waiting for human approval, or requires production, real secrets, real data, external systems, deployment, destructive action, or wider permissions.

If the task fails or implementation finds OpenSpec, design, UI, control-boundary, evidence, or gate drift, set or report re-entry instead of forcing progress.

# Procedure

1. Inspect the current repo structure and impacted files.
2. Read `delorean/evidence/<change-id>/change-state.yaml` before implementation when it exists.
3. Stop or ask when the state says blocked, approval needed, production, sensitive data, or wider permission boundary.
4. Confirm the scope, expected outputs, standards impact, OpenSpec lifecycle state, work context, and control boundary. Use local-only defaults when an environment is not named.
5. Before UI work, identify the approved page template, primary task navigation paths, and GC Design System components to use.
6. Make the smallest local-first change that satisfies the request and follows applicable standards. Use durable domain or environment-path names for reusable artifacts, and keep `local`, `test`, `fake`, or `demo` names limited to disposable fixtures, local config values, and examples that will not be promoted. Do not use real secrets, production identifiers, shared environments, or production unless explicitly approved and in scope.
7. For Government of Canada UI, use GC Design System components first and record any custom UI exception before using raw HTML controls or custom navigation.
8. Update impacted docs, active OpenSpec changes, contracts, tests, or evidence inputs.
9. For active OpenSpec changes, check off completed implementation items in `tasks.md` and keep review or verification items current when implementation establishes their status.
10. If implementation reveals changed expected behavior or missing scenario coverage, update the active OpenSpec requirement or scenario delta before treating the code task as complete.
11. When gate tracking and change-state are in scope, update implementation-related gate statuses in `change-state.yaml` only when evidence exists. Do not mark approval, waiver, release-readiness, or verification gates as passing from implementation work alone.
12. Do not move active OpenSpec deltas into `openspec/specs/`, run archive, or commit generated OpenSpec updates during implementation.
13. Record any skipped checks, standards exceptions, control exceptions, or unresolved questions.
14. Ask directly when actionable follow-up choices are blocked by unclear scope, ownership, approval, or verification expectations.

# Outputs

- Implemented change.
- OpenSpec lifecycle state and updated active change artifacts when relevant.
- Updated active `tasks.md` checklist state for completed implementation items when relevant.
- Current spec reference or active OpenSpec delta freshness for functional behavior changes.
- Change-state path, current Delorean phase, applicable gates/checks, gate summary, Evidence Bundle path when evidence packaging is in scope, approval or waiver status, and re-entry phase or reason code when relevant and in scope.
- Control boundary status and any unresolved permission, API/MCP, sensitive-data, or audit issues.
- Updated impacted artifacts.
- Standards impact notes and any custom UI exceptions.
- GC Design System components used when UI was changed.
- Primary task navigation paths when user-facing page work changed.
- Verification notes.
- Evidence inputs or evidence plan.
- Remaining risks or follow-up items.

# When to escalate

- The requested change conflicts with repo standards or Delorean core guidance.
- The implementation would replace a fitting GC Design System component with custom UI.
- The implementation would rely on breadcrumbs, direct URLs, or browser history as the main navigation path.
- The implementation requires changing approval, evidence, or traceability expectations.
- The implementation requires broader file, tool, API, MCP, environment, or sensitive-data access than the approved control boundary allows.
- When gate tracking is in scope, a required gate/check status is missing, stale, failed, or not linked to evidence.
- OpenSpec lifecycle state is unclear, or the change appears ready to archive before verification is complete.
- The scope expands beyond the original request.
- Required context is missing and a safe assumption is not possible.

# Source and ownership

- This is a local template wrapper.
- Delorean core remains the source of truth for shared skill guidance.
- Solution repos may customize local examples, but should not silently change the Delorean operating expectations.
