---
name: delorean-design
description: Refine technical design, impacted artifacts, slice sequencing, design blockers, and design handoff for a Delorean change.
---

# Purpose

Help refine the design for a change before or during planning and implementation.

This skill makes sure the technical approach is clear enough to build and verify, without putting implementation detail into OpenSpec requirements.

# Use when

Use this skill when the user asks to:

- refine the design
- fix a weak or unclear `design.md`
- decide whether an ADR is needed
- map OpenSpec behaviour to UI, API, data, tests, docs, evidence, or architecture
- split the work into implementation slices
- identify design blockers before implementation
- repair design drift found during implementation or verification

# Inputs

- Source request or issue.
- OpenSpec change ID or current spec reference.
- `openspec/changes/<change-id>/design.md` when an active change exists.
- `delorean/evidence/<change-id>/change-state.yaml` when available.
- Related design package, ADR, architecture note, API contract, UI decision, or data model.
- Impacted code, docs, tests, contracts, and evidence paths when known.
- Work context and control boundary when known.

# Output Scope

This skill is adoption-level agnostic. The invoking agent decides whether Delorean process artifacts such as change-state, gates, evidence packaging, approval or waiver context, release-readiness context, or subagent handoffs are required. Use or suggest those artifacts only when they are provided, requested, or required by the invoking agent.

# Procedure

1. Identify the change ID and current Delorean phase.
2. Read the OpenSpec proposal, design, tasks, and spec delta when an active change exists.
3. Read change-state and gate catalog when they exist and are in scope.
4. Identify the design question:
   - approach unclear
   - slices unclear
   - UI path unclear
   - API contract unclear
   - data approach unclear
   - security/privacy/accessibility/operations unclear
   - implementation drifted from design
   - verification found a design gap
5. Update or propose updates to `design.md`.
6. Use `docs/design/<change-id>/` only when the design needs more room than the OpenSpec `design.md`.
7. Add or update implementation slices in `design.md` when the work is bigger than one small task.
8. Add or update `tasks.md` so design follow-up and implementation tasks are clear.
9. Decide whether an ADR is needed. Use an ADR only for durable choices that future teams must understand.
10. Update change-state when phase, gates, blockers, re-entry, evidence inputs, or next task changed and change-state is in scope.
11. Do not approve exceptions, waivers, production changes, or release readiness.

# Expected output

```text
Design refinement result:
- Change ID:
- Change-state path:
- Current Delorean phase:
- OpenSpec lifecycle state:
- Design files reviewed:
- Design files changed:
- Main design decision:
- Slices changed:
- Impacted artifacts:
- ADR needed:
- UI/API/data/security/accessibility/operations impacts:
- Tasks updated:
- Gates updated:
- Blockers:
- Re-entry needed:
- Next recommended task:
```

# Escalate when

- The design changes scope or user intent.
- The design needs a human architecture decision.
- The design affects protected environments, sensitive data, real secrets, production, destructive changes, or external systems.
- A waiver, risk acceptance, or approval is needed.
