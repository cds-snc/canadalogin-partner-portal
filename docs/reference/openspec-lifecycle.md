# OpenSpec Lifecycle

Use this when a solution repo creates, updates, implements, verifies, or completes an OpenSpec change.

## Lifecycle States

- Current spec only: work references existing behavior under `openspec/specs/`.
- Draft active change: proposed behavior lives under `openspec/changes/<change-id>/`, but the team has not accepted it as the working baseline.
- Accepted active change: the team is planning, implementing, or verifying against the active change.
- Ready to archive: implementation and verification are complete, and current specs are ready to be updated by archive.
- Archived: the change has been folded into `openspec/specs/` and moved under `openspec/changes/archive/`.

## Work Context For Active Changes

Every active change should make clear whether it is local-only, intended for a shared non-production environment, or production-facing. If the request does not say, use the local-only default from STD-002: Work Contexts.

A local-only OpenSpec change can be proposed, planned, implemented, reviewed,
verified, and archived with local tests and fake data. It must not imply
deployment, production approval, production secrets, or production release
readiness.

Before a change moves to a shared environment, record the target environment, access path, data rules, secret source, rollback or cleanup path, and evidence expectations. Before a change touches production, record explicit human approval, release owner, rollback, monitoring, and evidence expectations.

## Phase Mapping

| Delorean phase | OpenSpec action |
|---|---|
| Spec | Create or update `openspec/changes/<change-id>/` with proposal, design when needed, tasks, and spec deltas. |
| Plan | Plan from the active change artifacts. Put delivery sequencing plus review and verification checklist items in `tasks.md`. Do not update current specs yet. |
| Implement | Implement the active change tasks. Check off completed `tasks.md` items and keep active change artifacts current if behavior changes. |
| Verify | Validate the active change, update or confirm review and verification items in `tasks.md`, and map requirements or scenarios to tests and evidence. |
| Release-ready or developer readiness | Confirm active `tasks.md` checklist state, then archive completed active changes so `openspec/specs/` reflects implemented behavior and the change package moves to archive. At Level 2 this is lightweight developer review/archive-readiness, not formal release approval, but current specs still need to be accurate before the work is treated as done. |

## Level 2 Current Spec Discipline

Level 2 keeps process lightweight, but it should not leave functional specs
stale. For small requirement adjustments, additional requirements, requirement
bugs, and technical bugs that reveal missing scenario coverage, use an active
OpenSpec change to update requirements or scenarios before or alongside the
code change.

For a purely technical bug where the current requirement and scenario already
describe the expected behavior, reference the current spec and add or update a
test that proves the implementation now matches it. If the failing path was not
captured by a scenario, add the missing scenario through an active change.

Before a Level 2 behavior change is developer-ready or merge-ready, archive the
completed functional change or record why archive is intentionally deferred.
The desired end state is that `openspec/specs/` accurately describes the
implemented behavior without needing Level 3 or Level 4 reconstruction work.

## Relationship to Delorean change state

Delorean phase and OpenSpec lifecycle state are related, but they are not identical.

During Delorean Verify, an OpenSpec change is usually still an accepted active change.

Archive belongs after implementation and verification are complete. At Level 2,
that can be lightweight developer readiness. At Level 3, use the configured
lightweight Delorean readiness expectations. At Level 4, use the configured
full release-readiness expectations.

`change-state.yaml` records the current Delorean phase, OpenSpec validation result, archive status, and reason if archive is deferred.

## Archive Follow-Through

Archiving a functional OpenSpec change has two required outcomes:

- current specs under `openspec/specs/<capability>/spec.md` reflect the
  implemented behavior from the completed delta; and
- the completed change package moves from `openspec/changes/<change-id>/` to
  `openspec/changes/archive/<date>-<change-id>/`.

Use `openspec archive <change-id> --yes` for completed functional changes. Do
not use `--skip-specs` for a functional change with spec deltas. Use
`--skip-specs` only for an intentional docs-only, tooling-only, or
infrastructure-only change that has no current functional spec update, and
record why the current specs are intentionally unchanged.

OpenSpec archive treats `## MODIFIED Requirements` entries as replacement
bodies for the matching current requirement. If a change adds a scenario to an
existing requirement, the modified requirement delta must include the full
target requirement text and every existing scenario that should remain, plus
the new or changed scenario. A partial modified requirement can remove omitted
scenarios during archive.

`make validate-openspec-change CHANGE_ID=<change-id>` includes a local
scenario-preservation preflight for this case. If a scenario is intentionally
removed from a modified requirement, record the removal in the delta with
`allow-scenario-removal: <scenario-id>` and explain the reason in the change
package.

Before archive, confirm implementation and verification tasks are complete and
run `make validate-openspec-change CHANGE_ID=<change-id>` when the official CLI
is enabled. After archive, inspect the branch diff and confirm:

- `openspec/specs/**` was created or updated for each affected capability;
- existing scenarios under modified requirements were preserved unless the
  change intentionally removed them and recorded that reason;
- `openspec/changes/<change-id>/` no longer exists;
- the archived package exists under `openspec/changes/archive/`; and
- `change-state.yaml` archive fields are updated when change-state is in
  scope.

If `openspec/specs/**` did not change when a functional delta was expected,
treat archive as incomplete. Check whether `--skip-specs` was used, the wrong
change ID was archived, or the delta format prevented promotion. If existing
scenarios disappeared from a modified requirement, restore them from the
pre-archive current spec or from version control, then update the delta so the
modified requirement includes the full scenario set to preserve. Do not
hand-move a change folder to archive and call it complete unless the current
spec update was also applied or intentionally deferred with a recorded reason.

## Command Guidance

- `/opsx:apply` or equivalent assistant work means implementation. It is not approval and should not be run by CI.
- `make validate-openspec-change CHANGE_ID=<change-id>` validates an active change when the official OpenSpec CLI is enabled.
- `openspec archive <change-id> --yes` is the normal completion action for a finished change.
- `openspec archive <change-id> --yes --skip-specs` must not be used for
  functional changes with spec deltas.
- Separate sync is not the default Delorean path. Use it only when the team intentionally needs current specs updated before archive, and record the reason.
- CI should validate OpenSpec artifacts, but should not apply, sync, archive, or commit generated changes back to the branch.
- Keep routine review checklists in `tasks.md` unless the solution intentionally adopts a custom OpenSpec schema.
- Do not mark approval or waiver tasks complete unless a human decision record exists.

## Required Output

When OpenSpec is in scope, include:

- OpenSpec lifecycle state
- active change ID or current spec reference
- whether implementation is allowed to proceed from the available artifacts
- validation command that should run
- active `tasks.md` checklist status when relevant
- current spec freshness status for behavior changes
- whether archive is required before merge or release
- reason if a completed active change remains unarchived
