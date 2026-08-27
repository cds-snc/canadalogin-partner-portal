---
name: dl-dev-active-change
description: "Continue ready implementation slices for one active change until blocked, complete, or the slice limit is reached."
---

# DL Dev Active Change

## Recommended role

Delegate to the `coordinator` custom agent from
`.codex/agents/coordinator.toml` when specialized delegation materially
helps. Otherwise, follow this workflow in the current session.

## Purpose

Continue ready implementation slices for one named or active Delorean/OpenSpec
change until blocked, complete, or the slice limit is reached.

Use this when the user wants sustained progress within one change and does not
want a prompt between every safe slice.

## Required inputs

At least one of:

- Change ID
- OpenSpec change path
- Change-state path
- "Pick the active change for me"

Optional:

- Slice limit. Default: 3 ready implementation slices.
- Preferred area: UI, API, data, tests, docs, evidence, design, OpenSpec,
  security, accessibility, or release-readiness.
- Whether to include verification-only tasks after implementation tasks.
- Whether to include lightweight verification or evidence follow-through tasks.
- Known blocker or failing check.

## Route

1. Identify exactly one active change.
2. Read [delorean/config.yaml](../../../delorean/config.yaml) before requiring
   change-state, gates, Evidence Bundles, approvals, waivers, release-readiness,
   MCP, or subagent outputs.
3. Read `delorean/evidence/<change-id>/change-state.yaml` when it exists and
   change-state is in scope.
4. Read the active OpenSpec package:
   - `proposal.md`
   - `design.md`
   - `tasks.md`
   - `specs/**/spec.md`
5. Establish the control boundary:
   - local developer / localhost only unless explicitly named otherwise
   - fake or test-only data
   - no real secrets
   - no production action
   - no shared environment action
   - no external system changes
6. Before asking the user, use
   [.agents/skills/delorean-question-resolution/SKILL.md](../../../.agents/skills/delorean-question-resolution/SKILL.md)
   when a planning, design, standards, evidence, or affected-artifact question
   may be answerable from repo guidance, OpenSpec, architecture docs, code,
   tests, contracts, templates, or approved docs.
7. Determine the slice limit:
   - default to 3 ready implementation slices
   - use a lower user-provided number when present
   - continue beyond 3 only when the user explicitly says no slice limit or
     names a larger limit
8. Repeat while under the slice limit:
   - pick the first unchecked task that is local-first, implementation-ready,
     verification-ready, or eligible evidence follow-through, and not blocked
   - prefer completing the current slice before starting a new slice
   - at Level 2, treat evidence-only or formal release-packaging tasks as
     ineligible by default unless the user explicitly asked to include
     verification, evidence follow-through, developer readiness, or archive
     follow-through
   - at Level 2 with developer readiness or evidence follow-through enabled,
     keep it lightweight:
     update `tasks.md`, record checks, skipped checks, screenshots or command
     outputs when practical, and note residual risk; do not require a formal
     Evidence Bundle unless requested
   - for Level 2 functional changes, keep requirements and scenarios current:
     update active OpenSpec deltas when behavior changes or a bug reveals a
     missing scenario, and do not call the change complete while current specs
     are stale or archive is unexplained
   - at Level 3 or 4, include required verification, evidence, or gate tasks
     after implementation tasks complete when those outputs are required by
     [delorean/config.yaml](../../../delorean/config.yaml)
   - begin the first ready slice immediately; do not stop after only
     summarizing the route
   - invoke Builder General for implementation-ready tasks when subagent
     support is available, otherwise directly implement the slice
   - invoke QA Support when the next ready task is verification-only and
     subagent support is available, otherwise directly run or record the checks
   - run or record relevant local checks after each slice
   - update `tasks.md` after each completed slice
   - update change-state phase, gates, evidence inputs, skipped checks,
     findings, re-entry, blockers, or next task only when those outputs are in
     scope for the configured adoption level
9. Before reporting the change complete, developer-readiness-ready,
   release-readiness-ready, or stopped after implementation tasks are complete,
   check whether the holistic QA review task is unchecked or missing:
   - when missing, add it under `Review and verification` in `tasks.md`
   - invoke QA Support for holistic change review when subagent support is
     available, otherwise perform the same review directly using the QA Support
     route
   - treat this as a completion gate, not a formal Evidence Bundle requirement
     at Level 2
   - mark the holistic QA review task complete only after QA passes or findings
     are recorded as non-blocking follow-up; keep it unchecked and route fixes
     to Builder General when findings are blocking or actionable inside scope
10. Stop when complete, blocked, the slice limit is reached, or a hard stop
   condition applies.

## Stop Conditions

Stop and report the blocker instead of continuing when:

- no ready unchecked implementation, verification, or eligible evidence
  follow-through task remains in this change
- the default or requested slice limit has been reached
- change-state is blocked and change-state is in scope
- approval or waiver is required before continuing
- the next task needs production, shared non-production, real secrets, real
  data, external systems, destructive action, deployment, or wider permissions
- the OpenSpec change and implementation disagree
- the design is too unclear to implement safely
- the task requires a human business decision where multiple valid outcomes
  exist
- source-of-truth ownership is unclear
- the UI needs a page pattern decision before implementation
- holistic QA review has blocking findings that cannot be fixed within the
  current safe scope
- a check fails in a way that requires scope, product, design, security,
  privacy, accessibility, operations, approval, or waiver input
- continuing would drift outside the active change
- subagent/tool support is unavailable and direct reasoning cannot safely
  complete the next slice

## Expected Output

```text
Dev active-change result:
- Change ID:
- Slice limit:
- Slices completed:
- Stop reason:
- Completed tasks:
- Files changed:
- Tasks updated:
- Change-state updates when in scope:
- Checks run:
- Skipped checks and reasons:
- Holistic QA review status:
- Evidence inputs updated:
- Blockers:
- Human decisions required:
- Re-entry needed when in scope:
- Next ready task when one remains:
```
