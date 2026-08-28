---
name: delorean-testing
description: Identify and add the highest-value tests for a change, then capture useful verification evidence.
---

# Purpose

Identify and add the highest-value tests for a change.

# Local wrapper metadata

Source: Delorean core, local template wrapper
Snapshot or version: Template starter, update when synced from Delorean core
Owner: Repo maintainers until replaced by a solution owner
Applies to phases: Verify
Skill perspective: Checks coverage, regression risk, OpenSpec validation status, Delorean gate status, control-compliance status, and evidence quality.
Invocation criteria: Use when behavior, contracts, risks, or acceptance checks need verification.
Pre-handoff checks: Traceability to OpenSpec requirements or scenarios when present, OpenSpec lifecycle state when relevant, change-state path when relevant, control boundary when relevant, updated tests or checks, gate results, evidence links, skipped checks, and open risks are captured.
Related local gates: [delorean/gates/gate-catalog.yaml](../../../delorean/gates/gate-catalog.yaml), [scripts/delorean/run-local-verification.sh](../../../scripts/delorean/run-local-verification.sh), [docs/repo-guidance/openspec-and-delorean.md](../../../docs/repo-guidance/openspec-and-delorean.md)
Refresh model: Review when Delorean core guidance changes or when local workflow drift is found

# Inputs

- Change summary and impacted behavior.
- Existing tests and test commands.
- Related spec, API contract, design note, ADR, or issue.
- OpenSpec lifecycle state and active change ID or current spec reference when relevant.
- Change-state path, current Delorean phase, gate summary, approval or waiver status, and re-entry state when available.
- Control boundary summary and any permission exceptions when relevant.
- Known risks, acceptance checks, and work context. If the context is unknown, verify only the local developer / localhost path.

# Reference Loading

Use [references.md](references.md) as the loading manifest. Load only the always-needed references plus the sections that match the verification target. Browse or verify official external sources when current policy, product version, or compliance detail matters.

# Output Scope

This skill is adoption-level agnostic. The invoking agent decides whether Delorean process artifacts such as change-state, gates, evidence packaging, approval or waiver context, release-readiness context, or subagent handoffs are required. Use or suggest those artifacts only when they are provided, requested, or required by the invoking agent.

# Procedure

1. Identify the behavior or contract that must be protected.
2. Identify the work context. Keep verification local-only unless a shared environment or production target has been explicitly named and approved.
3. Inspect existing tests before adding new ones.
4. Identify whether tests map to current specs, an active OpenSpec change, or missing requirements/scenarios.
5. Prefer focused tests that catch likely regressions.
6. For UI work, include useful page shell, primary task navigation path, screenshot, accessibility, keyboard, visible text, and GC Design System evidence when practical.
7. Add or update tests near the behavior they cover.
8. When gate tracking is in scope, use [delorean/gates/gate-catalog.yaml](../../../delorean/gates/gate-catalog.yaml) to check which verification gates apply.
9. Record commands run, skipped checks, standards checks, OpenSpec validation status, control-compliance status, and evidence links.
10. When change-state is in scope, update `delorean/evidence/<change-id>/change-state.yaml` with test, OpenSpec validation, local quality, accessibility, security, and evidence-related gate results when evidence exists.
11. Record skipped checks and reasons in the configured verification output. When evidence packaging is in scope, provide inputs for `delorean-evidence`; do not assemble the Evidence Bundle from this skill.
12. If a gate fails and change-state is in scope, set the re-entry phase and reason code in `change-state.yaml`. Otherwise report the blocker and recommended re-entry route.
13. For active OpenSpec changes, update or flag review and verification checklist items in `tasks.md` when checks, evidence, or skipped-check decisions establish their status.
14. For Level 2 functional work, flag stale or missing OpenSpec requirements or scenarios as verification drift instead of treating tests alone as sufficient.

# Outputs

- Test plan or test changes.
- Commands run and results.
- OpenSpec validation status, normally `openspec validate <change-id> --strict` when the official CLI is enabled and an active change is in scope.
- Requirement and scenario coverage status, including stale current specs or missing regression scenarios.
- Active `tasks.md` review and verification checklist status when an active OpenSpec change is in scope.
- Change-state path, current Delorean phase, applicable gates/checks, gate summary, Evidence Bundle path when evidence packaging is in scope, approval or waiver status, and re-entry phase or reason code when blocked and in scope.
- Control-compliance status when tool/API/MCP access, agent permissions, sensitive data, environment access, or policy exceptions are in scope.
- Skipped checks with reasons.
- Evidence notes and remaining risk.
- Standards check results when standards applied.
- UI page shell checker result when user-facing page shell work changed.
- Primary task navigation path and raw HTML control exception status when user-facing UI changed.

# When to escalate

- No test path exists for a risky change.
- Test setup is unclear or unreliable.
- The change affects shared contracts, security, privacy, accessibility, or operations.
- Applicable standards cannot be checked with available local commands or evidence.
- User-facing UI has unclear navigation paths or unexplained raw HTML controls.
- Required evidence cannot be produced with available checks.
- OpenSpec validation or control-compliance evidence is required but missing.
- When gate tracking is in scope, a required gate/check status is missing, stale, failed, or not linked to evidence.

# Source and ownership

- This is a local template wrapper.
- Delorean core remains the source of truth for shared skill guidance.
- Solution repos may customize local examples, but should not silently change the Delorean operating expectations.
