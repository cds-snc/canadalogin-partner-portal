---
id: dl-dev-continue
description: Continue the next safe task from an active Delorean/OpenSpec change.
use_when:
  - An active change already exists.
  - The user wants to continue implementation, verification, evidence, or fix work.
  - The next task should be chosen from OpenSpec tasks and Delorean change-state when change-state is in scope.
agent: Coordinator
---

# DL Continue Work

## Purpose

Continue the next safe task from an active Delorean/OpenSpec change.

Use this when the work has already started and you do not want to restart shaping, planning, or design.

## Required inputs

At least one of:

- Change ID
- OpenSpec change path
- Change-state path
- Current task or finding
- "Pick the next task for me"

Optional:

- Preferred area: UI, API, data, tests, docs, evidence, design, OpenSpec, security, accessibility, or release-readiness
- Whether to continue implementation or verification
- Known blocker or failing check

## Route

1. Identify the change ID.
2. The assigned agent applies [delorean/config.yaml](../../delorean/config.yaml) before requiring change-state, gates, Evidence Bundles, approvals, waivers, release-readiness, MCP, or subagent outputs.
3. Read `delorean/evidence/<change-id>/change-state.yaml` when it exists and change-state is in scope.
4. Read `delorean/gates/gate-catalog.yaml` when it exists and gate tracking is in scope.
5. Read the active OpenSpec package:
   - `proposal.md`
   - `design.md`
   - `tasks.md`
   - `specs/**/spec.md`
6. Check whether work may continue:
   - not blocked
   - no unresolved approval needed
   - no waiver needed before this task
   - no production, real secret, real data, external system, or wider permission boundary needed
7. Pick the next safe task:
   - use the user-named task if provided
   - otherwise pick the first unchecked task that is local-first and not blocked
   - prefer completing the current slice before starting a new slice
8. Route to the right skill:
   - `delorean-openspec` for spec, scenario, slice, validation, or task repair
   - `delorean-design` for design drift or unclear approach
   - `delorean-ui` for UI, navigation, page pattern, GC Design System, accessibility, bilingual, or UI evidence
   - `delorean-implementation` for code or docs implementation
   - `delorean-testing` for checks and verification
   - `delorean-review` for review findings and evidence alignment
9. Complete one small task or explain why it is blocked.
10. Update `tasks.md`.
11. Update change-state phase, gates, evidence inputs, findings, skipped checks, re-entry, or next task only when those outputs are in scope.
12. Use `delorean-evidence` only when evidence inputs need to be assembled into an Evidence Bundle.
13. Run or record relevant local checks.

## Expected output

```text
Continue work result:
- Change ID:
- Change-state path when in scope:
- Current Delorean phase when in scope:
- OpenSpec lifecycle state:
- Selected task:
- Why this task was selected:
- Files changed:
- Tasks updated:
- Gates updated when in scope:
- Checks run:
- Skipped checks and reasons:
- Evidence inputs updated:
- Blockers:
- Re-entry needed when in scope:
- Next recommended task:
```

## Stop conditions

Stop or ask for human input when:

- change-state is blocked and change-state is in scope
- approval or waiver is required before continuing
- the next task needs production, real secrets, real data, external systems, destructive action, deployment, or wider permissions
- the OpenSpec change and implementation disagree
- the design is too unclear to implement safely
- the UI needs a page pattern decision before implementation
- the next unchecked task is not safe to infer
