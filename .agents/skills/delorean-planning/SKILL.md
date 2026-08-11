---
name: delorean-planning
description: Shape a change before implementation so scope, risks, evidence, and traceability are clear.
---

# Purpose

Shape a change before implementation so scope, risks, evidence, and traceability are clear.

# Local wrapper metadata

Source: Delorean core, local template wrapper
Snapshot or version: Template starter, update when synced from Delorean core
Owner: Repo maintainers until replaced by a solution owner
Applies to phases: Spec, Plan
Skill perspective: Clarifies scope, risk, impacted artifacts, OpenSpec lifecycle state, Delorean change-state, control boundaries, gate status, traceability, and evidence needs.
Invocation criteria: Use when a request needs shaping before implementation or handoff.
Pre-handoff checks: Traceability, OpenSpec lifecycle state when relevant, change-state path when relevant, control boundary when relevant, applicable gate status, page pattern decision when user-facing UI is affected, open questions, risks, impacted artifacts, evidence needs, implementation handoff status, and receiving agent are named.
Related local gates: [delorean/gates/gate-catalog.yaml](../../../delorean/gates/gate-catalog.yaml), [docs/templates/openspec-template.md](../../../docs/templates/openspec-template.md), [docs/templates/repo-checklist.md](../../../docs/templates/repo-checklist.md)
Refresh model: Review when Delorean core guidance changes or when local workflow drift is found

# Inputs

- Work request, issue, or problem statement.
- Work context when known: local developer / localhost, shared non-production environment, or production. If unknown, assume local-only and record it.
- Relevant prompt wrapper from `.github/prompts/`.
- Existing specs, design notes, ADRs, or evidence.
- Active change-state path and current gate status when a change ID is known.
- Permission profile, API/MCP access, file scope, sensitive-data handling, or audit expectations when relevant.
- Known approval, evidence, or traceability expectations.

# Reference Loading

Use [references.md](references.md) as the loading manifest. Load only the always-needed references plus the sections that match the affected area. Browse or verify official external sources when current policy, product version, or compliance detail matters.

# Output Scope

This skill is adoption-level agnostic. The invoking agent decides whether Delorean process artifacts such as change-state, gates, evidence packaging, approval or waiver context, release-readiness context, or subagent handoffs are required. Use or suggest those artifacts only when they are provided, requested, or required by the invoking agent.

# Procedure

1. Restate the change in plain language.
2. Identify the work context. If it is not named, use the local developer / localhost default from STD-002: Work Contexts.
3. When information is missing, suggest a recommended safe option and one or two alternatives. Ask only for details that block safe local progress or that are needed before shared-environment, production, secret, approval, waiver, deployment, destructive, or wider-boundary work.
4. Identify users, systems, and artifacts affected.
5. Identify whether new names will create reusable artifacts or disposable local fixtures. For reusable artifacts, use durable domain or environment-path names and keep `local`, `test`, `fake`, or `demo` names limited to fixtures, config values, and examples that will not be promoted.
6. Decide whether the next step is an OpenSpec change, current spec reference, design package, ADR, or clarification.
7. Identify OpenSpec lifecycle state when OpenSpec is in scope: current spec only, draft active change, accepted active change, ready to archive, or archived.
8. For Level 2 behavior work, classify the request as a new requirement,
   requirement adjustment, requirement bug, technical bug against an existing
   requirement, or non-functional change. Use an active OpenSpec change when
   requirements or scenarios need to change, and use a current spec reference
   only when the existing spec already describes the expected behavior.
9. When gate tracking is in scope, read [delorean/gates/gate-catalog.yaml](../../../delorean/gates/gate-catalog.yaml) and identify applicable gates/checks.
10. When change-state is in scope, create or update `delorean/evidence/<change-id>/change-state.yaml` for meaningful active changes. Set `change.currentPhase`, `openspec.lifecycleState`, control boundary status, and gate statuses as `pending`, `not_started`, or `not_applicable`.
11. Identify the control boundary when agents, APIs, MCP servers, external tools, privileged commands, sensitive data, or generated evidence are in scope.
12. Run the GC standards impact check when UI, content, API, data, identity, security, privacy, records, or evidence may be affected.
13. For user-facing UI work, record the approved page pattern decision before implementation, then name the primary task navigation paths and the GC Design System components or page template to use, or record a custom UI exception.
14. Capture open questions, risks, standards impact, traceability links, validation command, current spec freshness expectation, and archive expectation when OpenSpec is relevant.
15. For active OpenSpec changes, put delivery sequencing, implementation tasks, and review or verification checklist items in `tasks.md`; do not create a standalone delivery-plan or review-checklist artifact by default.
16. When gate tracking is in scope, do not use OpenSpec `tasks.md` as the only gate status record. The latest gate/check result belongs in `change-state.yaml`.
17. Decide whether implementation is `ready`, `waiting_for_confirmation`, or `blocked`.
18. If implementation is ready or waiting only for user confirmation, include a builder handoff block for [.github/agents/builder-general.agent.md](../../agents/builder-general.agent.md). Use domain-specific skills inside that builder for UI, API, data, tooling, or mixed work.
19. Keep the plan small enough to review.
20. Ask directly when route, implementation-start, or pasted next-prompt choices are unclear.

# Outputs

- Short planning summary.
- OpenSpec lifecycle state, active change ID or current spec reference, validation command, and archive expectation when relevant.
- Current spec freshness expectation for functional work.
- Active OpenSpec `tasks.md` updates for delivery sequencing, implementation tasks, and review or verification checklist items when relevant.
- Change-state path, current Delorean phase, applicable gates/checks, gate summary, Evidence Bundle path when evidence packaging is in scope, approval or waiver status, and re-entry phase or reason code when relevant and in scope.
- Control boundary summary with allowed tools, APIs, MCP servers, file scope, sensitive-data handling, required approvals, and audit expectations when relevant.
- Recommended next step, with direct user confirmation when it is an actionable user choice that cannot safely default.
- Impacted folders or artifacts.
- Standards impact block when standards apply.
- Page pattern decision when user-facing UI is affected.
- Primary task navigation paths for user-facing page work.
- GC Design System component plan or custom UI exceptions for UI work.
- Open questions and risks.
- Links to source materials and expected evidence.
- Implementation handoff status and receiving agent.
- Builder handoff block when implementation can proceed after confirmation.

# When to escalate

- Intent, ownership, or approval path is unclear.
- OpenSpec lifecycle state, validation, archive expectation, or no-CI-mutation expectations are unclear.
- Permission profile, API/MCP access, file scope, sensitive-data handling, or audit expectations are unclear.
- When gate tracking is in scope, a required gate/check status is missing, stale, failed, or not linked to evidence.
- The change affects security, privacy, accessibility, operations, or reusable
  architecture guidance.
- A UI plan skips GC Design System components without a clear exception.
- A UI plan relies on breadcrumbs, direct URLs, or browser history as the main navigation path.
- User-facing page work would start from a blank custom layout without a recorded human-approved exception.
- Required evidence or traceability expectations conflict.
- The work needs source-of-truth guidance from Delorean core.

# Source and ownership

- This is a local template wrapper.
- Delorean core remains the source of truth for shared skill guidance.
- Solution repos may customize local examples, but should not silently change the Delorean operating expectations.
