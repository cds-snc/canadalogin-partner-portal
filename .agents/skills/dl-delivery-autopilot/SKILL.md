---
name: dl-delivery-autopilot
description: "Orchestrate planning, implementation, QA, and review across active OpenSpec changes until blocked, complete, or limits are reached."
---

# DL Delivery Autopilot

## Recommended role

Delegate to the `coordinator` custom agent from
`.codex/agents/coordinator.toml` when specialized delegation materially
helps. Otherwise, follow this workflow in the current session.

## Purpose

Move active Delorean/OpenSpec work through planning, implementation, QA, and
review until blocked, complete, or configured limits are reached.

Use this when the user wants the system to keep progressing a change or queue,
including resolving agent-answerable planning blockers such as UI page-pattern
decisions, design gaps, standards mapping, task slicing, or verification
readiness before development starts or continues.

Use [$dl-dev-autopilot](../dl-dev-autopilot/SKILL.md) when changes are
already implementation-ready and the user only wants ready local implementation
slices worked.

## Inputs

Optional:

- Preferred starting change ID or change-state path.
- Slice limit. Default: 3 total delivery actions.
- Change limit. Default: 2 changes.
- Preferred area: requirements, design, UI, API, data, implementation, tests,
  docs, evidence, security, accessibility, or release-readiness.
- Whether to include lightweight verification or evidence follow-through tasks.
- Whether to include release-readiness packaging.
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
4. If the user named a change, evaluate that change first. When that change is
   complete or blocked by a true human decision, move or stop according to the
   requested limits and stop conditions.
5. For each candidate, read:
   - `proposal.md`
   - `design.md`
   - `tasks.md`
   - `specs/**/spec.md`
   - `delorean/evidence/<change-id>/change-state.yaml` when it exists
6. Use current specs under `openspec/specs/**` only as context. Do not invent
   implementation work from current specs alone when no active change package
   describes the change.
7. Before asking the user, use
   [.agents/skills/delorean-question-resolution/SKILL.md](../../../.agents/skills/delorean-question-resolution/SKILL.md)
   when a planning, design, standards, evidence, or affected-artifact question
   may be answerable from repo guidance, OpenSpec, architecture docs, code,
   tests, contracts, templates, or approved docs.

## Execution Loop

1. Determine limits:
   - default action limit: 3 total delivery actions
   - default change limit: 2 changes
   - use lower user-provided limits when present
   - continue beyond defaults only when the user explicitly says no limit or
     names larger limits
2. For the first eligible candidate, classify the next blocker or task:
   - requirements or OpenSpec unclear
   - design, impacted-artifact, or slice plan unclear
   - UI page-pattern decision missing
   - implementation-ready local task exists
   - verification, holistic QA review, or eligible evidence follow-through
     remains
   - release-readiness packaging remains and is explicitly in scope
   - true human decision or approval-sensitive blocker
3. Resolve agent-answerable planning blockers before declaring the change
   blocked:
   - invoke Spec Author when requirements, scenarios, or OpenSpec lifecycle
     state need repair
   - invoke Delivery Planner when design, impacted artifacts, task slices,
     standards mapping, or implementation-readiness need repair
   - invoke [$dl-ui-build-page](../dl-ui-build-page/SKILL.md) when a UI
     page-pattern decision is missing; when workflow routing is unavailable, use
     Delivery Planner with
     [.agents/skills/select-ui-page-pattern/SKILL.md](../../../.agents/skills/select-ui-page-pattern/SKILL.md)
   - record resolved decisions in `proposal.md`, `design.md`, or `tasks.md`
   - preserve true human-only decisions as open questions in the active
     OpenSpec package
4. When planning is ready, invoke
   [$dl-dev-active-change](../dl-dev-active-change/SKILL.md) for one
   named change or [$dl-dev-autopilot](../dl-dev-autopilot/SKILL.md) for
   queue implementation, according to the user request and limits.
5. After implementation tasks complete, invoke QA Support for holistic review
   when the holistic QA review task is unchecked or missing.
6. If QA reports actionable defects inside the current safe scope, route fixes
   to Builder General and continue the QA loop until verification passes or a
   blocker is identified.
7. At Level 2, keep verification and evidence follow-through lightweight unless
   the user explicitly asks for fuller evidence packaging. Do not require a
   formal Evidence Bundle or release-readiness package by default.
8. At Level 3 or 4, include required verification, evidence, gate, or
   release-readiness tasks when required by
   [delorean/config.yaml](../../../delorean/config.yaml).
9. Reassess the current change after each completed delivery action. Continue
   until the action limit, change limit, queue completion, or a hard stop
   condition applies.

## Stop Conditions

Stop and report the blocker instead of continuing when:

- no eligible active change has agent-resolvable planning work,
  implementation-ready work, verification work, or eligible follow-through work
- the default or requested action limit has been reached
- the default or requested change limit has been reached
- every remaining candidate change is blocked, unclear after agent-resolvable
  planning, archive-only, release-readiness-only, or approval-sensitive
- approval or waiver is required before continuing
- the next task needs production, shared non-production, real secrets, real
  data, external systems, destructive action, deployment, or wider permissions
- a business, source-of-truth, route ownership, custom UI exception, standards
  exception, approval, or waiver decision has multiple valid human-owned
  outcomes
- no approved UI page pattern fits and an exception path must be approved
- the OpenSpec change and implementation disagree in a way that cannot be
  repaired safely from repo context
- a check fails in a way that requires scope, product, design, security,
  privacy, accessibility, operations, approval, or waiver input
- subagent/tool support is unavailable and direct reasoning cannot safely
  complete the next planning, implementation, or verification action

## Expected Output

```text
Delivery autopilot result:
- Queue source:
- Starting change ID:
- Action limit:
- Change limit:
- Changes scanned:
- Changes skipped and reasons:
- Changes touched:
- Planning blockers resolved:
- Development actions completed:
- QA/review actions completed:
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
