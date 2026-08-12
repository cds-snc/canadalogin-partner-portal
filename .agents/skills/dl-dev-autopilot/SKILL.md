---
name: dl-dev-autopilot
description: "Scan active OpenSpec changes and continue ready local slices across the queue until blocked, complete, or limits are reached."
---

# DL Dev Autopilot

## Recommended role

Delegate to the `coordinator` custom agent from
`.codex/agents/coordinator.toml` when specialized delegation materially
helps. Otherwise, follow this workflow in the current session.

## Purpose

Scan active OpenSpec change packages, select the next safe ready local slice,
implement or verify it, and continue across changes until blocked, complete, or
the configured limits are reached.

Use this when the user asks to work the queue, continue across active changes,
move to the next change when the current one is done, or run repo-level dev
autopilot. Use [$dl-dev-active-change](../dl-dev-active-change/SKILL.md)
when the user wants to stay inside one named or active change.

## Inputs

Optional:

- Preferred starting change ID or change-state path.
- Slice limit. Default: 3 total ready implementation or verification slices.
- Change limit. Default: 2 changes.
- Preferred area: UI, API, data, tests, docs, evidence, design, OpenSpec,
  security, accessibility, or release-readiness.
- Whether to include verification-only tasks after implementation tasks.
- Whether to include lightweight verification or evidence follow-through tasks.
- Known blocker or failing check.

## Queue Scan

1. Read [delorean/config.yaml](../../../delorean/config.yaml) before requiring
   change-state, gates, Evidence Bundles, approvals, waivers, release-readiness,
   MCP, or subagent outputs.
2. Establish the control boundary:
   - local developer / localhost only unless explicitly named otherwise
   - fake or test-only data
   - no real secrets
   - no production action
   - no shared environment action
   - no external system changes
3. Build the candidate queue from `openspec/changes/*/` directories with a
   `tasks.md` file.
4. If the user named a change, evaluate that change first. When that change has
   no ready slice and is not blocked, move to the next candidate change.
5. Skip candidate changes when:
   - the change is an example or archived package
   - `delorean/evidence/<change-id>/change-state.yaml` says blocked, archived,
     closed, approval needed, waiver needed, production, shared environment,
     real secrets, real data, external systems, deployment, destructive action,
     or wider permission is in scope
   - `tasks.md` has no unchecked implementation or verification work except
     release-readiness or archive-only tasks, and the user did not explicitly
     ask for developer readiness or archive follow-through
   - at Level 2, the only remaining work is evidence-only,
     release-readiness-only, archive-only, or heavy review packaging, unless
     the user explicitly asked to include verification, evidence follow-through,
     developer readiness, or archive follow-through
   - the proposal, design, or task list is too unclear to implement safely
6. For each remaining candidate, read:
   - `proposal.md`
   - `design.md`
   - `tasks.md`
   - `specs/**/spec.md`
   - `delorean/evidence/<change-id>/change-state.yaml` when it exists
7. Use current specs under `openspec/specs/**` only as context. Do not invent
   implementation work from current specs alone when no active change package
   describes the change.
8. Before asking the user, use
   [.agents/skills/delorean-question-resolution/SKILL.md](../../../.agents/skills/delorean-question-resolution/SKILL.md)
   when a planning, design, standards, evidence, or affected-artifact question
   may be answerable from repo guidance, OpenSpec, architecture docs, code,
   tests, contracts, templates, or approved docs.

## Execution Loop

1. Determine limits:
   - default slice limit: 3 total ready slices
   - default change limit: 2 changes
   - use lower user-provided limits when present
   - continue beyond defaults only when the user explicitly says no limit or
     names larger limits
2. Pick the next ready local task from the first eligible candidate change:
   - use the user-named task if provided and safe
   - otherwise pick the first unchecked task that is local-first,
     implementation-ready, verification-ready, or eligible evidence
     follow-through, and not blocked
   - prefer completing the current slice before starting another slice
   - at Level 2, treat evidence-only or formal release-packaging tasks as
     ineligible by default unless the user explicitly asked to include
     verification, evidence follow-through, developer readiness, or archive
     follow-through
   - at Level 2 with developer readiness or evidence follow-through enabled,
     keep it lightweight:
     update `tasks.md`, record checks, skipped checks, screenshots or command
     outputs when practical, and note residual risk; do not require a formal
     Evidence Bundle unless requested
   - at Level 3 or 4, include required verification, evidence, or gate tasks
     after implementation tasks complete when those outputs are required by
     [delorean/config.yaml](../../../delorean/config.yaml)
3. Begin the first ready slice immediately. Do not stop after only summarizing
   the queue, route, or selected change.
4. Invoke Builder General for implementation-ready tasks when subagent support
   is available, otherwise directly implement the slice.
5. Invoke QA Support when the next ready task is verification-only and subagent
   support is available, otherwise directly run or record the checks.
6. After each completed slice:
   - update that change's `tasks.md`
   - run or record relevant local checks
   - update change-state phase, gates, evidence inputs, skipped checks,
     findings, re-entry, blockers, or next task only when those outputs are in
     scope for the configured adoption level
   - reassess whether the current change still has ready work
7. Before moving to the next change or reporting the current change complete,
   check whether implementation tasks for the current change are complete and
   the holistic QA review task is unchecked or missing:
   - when missing, add it under `Review and verification` in `tasks.md`
   - invoke QA Support for holistic change review when subagent support is
     available, otherwise perform the same review directly using the QA Support
     route
   - treat this as a completion gate, not a formal Evidence Bundle requirement
     at Level 2
   - stay on the current change when QA reports blocking or actionable findings,
     and route fixes to Builder General when they are inside the current safe
     scope
   - mark the holistic QA review task complete only after QA passes or findings
     are recorded as non-blocking follow-up
8. When the current change has no ready implementation, verification, or
   eligible evidence follow-through work and is not blocked, move to the next
   eligible change until the slice limit, change limit, queue completion, or a
   hard stop condition applies.

## Stop Conditions

Stop and report the blocker instead of continuing when:

- no eligible active change has a ready unchecked implementation, verification,
  or eligible evidence follow-through task
- the default or requested slice limit has been reached
- the default or requested change limit has been reached
- every remaining candidate change is blocked, unclear, archive-only,
  formal-release-readiness-only, or approval-sensitive, unless the user asked
  for developer readiness or archive follow-through
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
- continuing would drift outside the selected OpenSpec change package
- subagent/tool support is unavailable and direct reasoning cannot safely
  complete the next slice

## Expected Output

```text
Dev autopilot result:
- Queue source:
- Starting change ID:
- Slice limit:
- Change limit:
- Changes scanned:
- Changes skipped and reasons:
- Changes touched:
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
- Next ready change/task when one remains:
```

