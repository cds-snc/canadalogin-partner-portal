---
name: delorean-openspec
description: Refine and manage OpenSpec specs and active changes so requirements, scenarios, slices, tasks, lifecycle state, archive follow-through, and handoff are clear.
---

# Purpose

Refine OpenSpec current specs and active change packages so they are clear enough to plan, implement, verify, or archive.

This skill helps when OpenSpec content is too vague, too broad, too detailed, missing scenarios, missing tasks, not aligned with the current Delorean phase, or ready for archive follow-through.

# Use when

Use this skill when the user asks to:

- refine an OpenSpec spec
- refine an active OpenSpec change
- split or merge implementation slices
- expand requirements or scenarios
- fix vague or untestable requirements
- clean up proposal, design, tasks, or spec deltas
- prepare an OpenSpec change for planning, implementation, verification, developer-readiness archive, or release-readiness archive
- archive a completed OpenSpec change and confirm current specs were updated
- fix OpenSpec validation issues
- decide what the next implementation task should be

# Inputs

- Change ID, spec path, capability name, issue, source request, or scenario.
- `openspec/changes/<change-id>/` when an active change exists.
- `openspec/specs/<capability>/spec.md` when current behaviour is affected.
- `delorean/evidence/<change-id>/change-state.yaml` when available.
- `delorean/gates/gate-catalog.yaml` when available.
- Design notes, ADRs, UI decisions, API contracts, tests, or evidence when relevant.
- Refinement goal: clarify, expand, split, merge, fix validation, prepare planning, prepare implementation, prepare verification, or prepare archive.

# OpenSpec and Delorean split

OpenSpec owns:

- current specs
- active change proposal
- active change design
- active change tasks
- requirements
- scenarios

When Delorean process artifacts are in scope, Delorean owns:

- current phase
- gate/check status
- control boundary status
- evidence links
- approval or waiver state
- re-entry needs
- release readiness

Do not copy requirements into change-state. Link to OpenSpec instead.

# Output Scope

This skill is adoption-level agnostic. The invoking agent decides whether Delorean process artifacts such as change-state, gates, evidence packaging, approval or waiver context, release-readiness context, or subagent handoffs are required. Use or suggest those artifacts only when they are provided, requested, or required by the invoking agent.

# What a good slice looks like

A slice is a small piece of behaviour that can be implemented, checked, and evidenced.

A good slice has:

- a plain name
- a user or system outcome
- one or more linked requirements or scenarios
- clear in-scope and out-of-scope notes
- impacted areas, such as UI, API, data, tests, docs, contracts, or evidence
- durable names for reusable artifacts, with localhost-only names reserved for
  disposable fixtures, local config values, and examples that will not be
  promoted
- a small implementation checklist
- a verification task
- an evidence task when review is needed
- a clear exit point

Slices usually belong in:

- `openspec/changes/<change-id>/design.md` as the slice plan
- `openspec/changes/<change-id>/tasks.md` as the work checklist

Requirements and scenarios remain in:

- `openspec/changes/<change-id>/specs/<capability>/spec.md`

# Level 2 current spec discipline

At Level 2, OpenSpec stays lightweight, but current requirements and scenarios
must still be accurate for functional work. Treat small requirement changes,
additional requirements, requirement bugs, and missing regression scenarios as
active OpenSpec changes. Keep proposed behavior under
`openspec/changes/<change-id>/` until implementation and verification are
complete, then archive so `openspec/specs/` reflects the implemented behavior.

For a technical bug where the current spec already describes the expected
behavior, reference that current requirement or scenario and add or update the
regression test. If the failing path was not represented by a scenario, add the
missing scenario through an active change.

# Modified requirement merge discipline

OpenSpec archive treats `## MODIFIED Requirements` entries as replacement
bodies for the matching current requirement. When adding a scenario to an
existing requirement, do not create a partial modified requirement containing
only the new scenario. Carry forward the complete target requirement text and
all existing scenarios that should remain, then add or update the scenario
being changed. Use a new `## ADDED Requirements` entry only when the behavior is
a genuinely new requirement.

Before archiving a change that has modified requirements, compare the scenario
headings in the current spec and the delta. After archive, confirm existing
scenarios were preserved unless the change intentionally removed them and that
removal is recorded in the OpenSpec change. `make validate-openspec-change`
runs a local scenario-preservation preflight after official OpenSpec validation.
When a scenario is intentionally removed, record
`allow-scenario-removal: <scenario-id>` in the delta and explain the reason in
the change package.

# Archive follow-through

Archive is complete only when both OpenSpec outcomes are visible in the branch
diff:

- the completed spec deltas have been folded into
  `openspec/specs/<capability>/spec.md`; and
- the completed change package has moved under
  `openspec/changes/archive/<date>-<change-id>/`.

Use the default archive path for functional changes:

```sh
openspec archive <change-id> --yes
```

Do not use `--skip-specs` for a functional OpenSpec change. Use it only for an
intentional docs-only, tooling-only, or infrastructure-only change with no spec
delta to promote, and record that reason in `tasks.md`, `change-state.yaml`, or
the final handoff when those artifacts are in scope.

Before archive:

- confirm implementation and verification are complete;
- run or record `make validate-openspec-change CHANGE_ID=<change-id>` when the
  official CLI is enabled;
- check that `tasks.md` does not leave required implementation or verification
  items incomplete;
- confirm each `## MODIFIED Requirements` body preserves existing scenarios
  that should remain, because archive replaces modified requirement bodies; and
- confirm approval, waiver, or release-readiness state only when those human
  decisions are in scope.

After archive:

- inspect the branch diff for `openspec/specs/**` updates;
- confirm existing scenarios under modified requirements are still present
  unless the change intentionally removed them;
- confirm the active `openspec/changes/<change-id>/` folder no longer exists;
- confirm the package exists under `openspec/changes/archive/`;
- confirm every archived `specs/<capability>/spec.md` delta has a matching
  current `openspec/specs/<capability>/spec.md`; and
- update `delorean/evidence/<change-id>/change-state.yaml` archive fields when
  change-state is in scope.

If current specs did not change when a functional delta was expected, treat the
archive as incomplete. Stop and inspect whether `--skip-specs` was used, the
delta file was malformed, validation warned about missing deltas, or the wrong
change ID was archived. If existing scenarios disappeared from a modified
requirement, restore them from the pre-archive current spec or version control,
then update the delta so the modified requirement includes the full scenario set
to preserve. Do not hand-move the active change to archive and call it complete
without also promoting or intentionally deferring the current spec update.

# Procedure

1. Identify whether the work is about current specs or an active change.
2. Read the active change package when it exists:
   - `proposal.md`
   - `design.md`
   - `tasks.md`
   - `specs/**/spec.md`
3. Read `change-state.yaml` when it exists and is in scope.
4. Identify the current Delorean phase and OpenSpec lifecycle state.
5. Identify the refinement goal:
   - clarify
   - expand
   - split slices
   - merge slices
   - fix design alignment
   - fix validation
   - prepare implementation
   - prepare verification
   - prepare archive
6. Check requirements:
   - Are they clear?
   - Are they testable?
   - Are they about behaviour, not implementation detail?
   - Are business-rule IDs useful?
   - Do they reflect any Level 2 requirement change, requirement bug, or
     missing behavior discovered during implementation or verification?
7. Check scenarios:
   - Do they use clear GIVEN / WHEN / THEN steps?
   - Do they cover the main success path?
   - Do they cover important error, empty, permission, accessibility, or edge cases when relevant?
   - Are scenario IDs useful?
   - Is every fixed bug covered either by an existing current scenario or by a
     new/modified scenario in the active change?
8. Check design:
   - Does `design.md` explain the approach?
   - Does it identify impacted UI, API, data, tests, docs, contracts, and evidence?
   - Does it define implementation slices when the change is bigger than one small task?
9. Check tasks:
   - Are tasks grouped by slice when helpful?
   - Is the next implementation task clear?
   - Are review, verification, evidence, and archive-readiness tasks present?
10. When Delorean process artifacts are in scope, check Delorean state:
   - Does `change-state.yaml` point to the active OpenSpec change?
   - Are relevant gates listed?
   - Is the current phase accurate?
   - Is re-entry needed?
11. Update only the artifacts needed for the requested refinement.
12. Do not archive unless archive is explicitly requested or the work is in
    lightweight developer readiness or release-readiness, and verification is
    complete.
13. When archive is in scope, follow the archive follow-through checks above.
14. For Level 2 behavior changes, do not call the change developer-ready or
    merge-ready while the current spec is stale or the archive status is
    unexplained.

# Slice repair patterns

Use these patterns when OpenSpec output is not useful.

## Too broad

Split by user outcome, API behaviour, data lifecycle step, or screen/flow.

## Too vague

Replace general wording with a testable requirement and at least one scenario.

## Too implementation-heavy

Move code, file, and library detail from `spec.md` into `design.md` or `tasks.md`.

## Too many scenarios

Keep core scenarios in the spec. Move repeated implementation checks into tests or tasks.

## UI not clear

Route to `delorean-ui` and add UI decision tasks before implementation.

## Design not clear

Route to `delorean-design` and add design-readiness tasks before implementation.

## Next work not clear

Update `tasks.md` so the next task is a small local-first implementation or verification step.

# Expected output

```text
OpenSpec refinement result:
- Change ID:
- OpenSpec lifecycle state:
- Current Delorean phase:
- Files reviewed:
- Files changed:
- Requirements refined:
- Scenarios refined:
- Slices added, split, merged, or removed:
- Tasks updated:
- Gate or change-state updates requested:
- Validation command:
- Validation result or skipped reason:
- Archive command:
- Archive path:
- Current spec update checked:
- Ready for:
- Blockers:
- Next recommended task:
```

# Escalate when

- The behaviour is unclear and no safe local assumption is possible.
- The change appears approval-sensitive.
- Production, real secrets, real data, external systems, or destructive changes are in scope.
- A requirement conflicts with standards, security, privacy, accessibility, or architecture guidance.
- Archive is requested but verification is incomplete.
- Archive completed but current specs did not update and no intentional
  `--skip-specs` reason exists.
