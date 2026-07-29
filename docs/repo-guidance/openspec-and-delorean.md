# OpenSpec And Delorean

Use this to understand how OpenSpec artifacts fit into the Delorean template.

## OpenSpec Role

OpenSpec is the Spec and Plan artifact layer for functional behavior.

- `openspec/specs/` owns current specs.
- `openspec/changes/<change-id>/` owns proposed and in-progress changes until implementation and verification are complete.
- Requirements and scenarios live inside `spec.md` files.
- `tasks.md` owns implementation tasks plus routine review and verification checklist items.
- OpenSpec requirements can carry Delorean business-rule IDs, such as `BR-123`.
- OpenSpec scenarios can carry Delorean scenario IDs, such as `SCN-123`.

At Level 2, OpenSpec is lightweight, but current specs are still expected to be
accurate. Use active changes for proposed behavior, then archive completed
functional changes so `openspec/specs/` remains the current source for
requirements and scenarios. This keeps Level 2 repos ready for a later Level 3
or Level 4 upgrade without reconstructing missing requirement history.

## Work Context Rule

OpenSpec changes should say whether the work is local-only, for a shared non-production environment, or production-facing. If the request does not name an environment, assume local developer / localhost work with fake or test-only data and no real secrets.

Use STD-002: Work Contexts and [docs/templates/work-context-and-assumptions-template.md](../templates/work-context-and-assumptions-template.md) to record safe assumptions and human decisions needed before non-local or production work.

## Delorean Role

Delorean still owns the delivery operating model around OpenSpec:

- Workflow phases, agents, skills, local standards, and approval routing stay in Delorean guidance.
- [docs/templates/evidence-bundle-template.md](../templates/evidence-bundle-template.md) records verification and review evidence.
- [delorean/templates/approval-response-template.md](../../delorean/templates/approval-response-template.md) records human approval state and re-entry.
- [delorean/templates/waiver-template.md](../../delorean/templates/waiver-template.md) records exceptions, risk, controls, and review dates.
- Release readiness remains a Delorean responsibility.

OpenSpec does not replace tests, evidence, human approval, waivers, release readiness, or Delorean phase gates.

See [docs/reference/using-official-openspec.md](../reference/using-official-openspec.md) when a solution repo intentionally opts into the official OpenSpec CLI.

See [docs/reference/openspec-lifecycle.md](../reference/openspec-lifecycle.md) for lifecycle states, validation, archive, and no-CI-mutation guidance.

## Delorean Change State

OpenSpec owns current specs and active change packages.

Delorean change state lives at `delorean/evidence/<change-id>/change-state.yaml`.

The change state records the current Delorean phase, OpenSpec lifecycle state, gate and check statuses, control boundary status, evidence links, approval or waiver status, and re-entry needs.

Do not copy requirement text into the change state. Link to the OpenSpec requirement, scenario, proposal, design note, task, or spec delta instead.

Do not put Delorean state files or gate results into `openspec/changes/<change-id>/` unless the repo intentionally adopts a custom OpenSpec schema later.

OpenSpec `tasks.md` may contain checklist items for running checks and creating evidence, but the latest gate or check result belongs in Delorean change state.

## Lifecycle Rule

Current behavior belongs under `openspec/specs/`. Proposed or in-progress behavior belongs under `openspec/changes/<change-id>/`.

Plan and implementation work from the active change artifacts. Put delivery sequencing, implementation tasks, and review or verification checklist items in `tasks.md` instead of creating a separate delivery plan or OpenSpec review checklist by default. Verification validates the active change, normally with `openspec validate <change-id> --strict` when the official OpenSpec CLI is enabled. After implementation and verification, lightweight developer readiness at Level 2 or release-readiness at higher levels archives completed active changes with `openspec archive <change-id> --yes` so current specs reflect implemented behavior and the completed change package moves under `openspec/changes/archive/`.

Archive follow-through is required for functional changes. After archive,
inspect the branch diff and confirm `openspec/specs/<capability>/spec.md` was
created or updated for every archived functional delta. Do not use
`--skip-specs` for functional changes with spec deltas. If current specs did
not change when they should have, treat archive as incomplete and record or fix
the reason before merge or release-readiness.

Do not have CI, hooks, or agents invisibly apply, sync, archive, or commit OpenSpec changes. Those updates should be visible in the branch or pull request.

## Requirement Changes And Bugs

For Level 2 work, classify behavior work before implementation:

- Small requirement change: create or update an active OpenSpec change with the
  changed requirement and scenarios, then implement and archive after
  verification.
- Additional small requirement: add the new requirement or scenario in an
  active change, add matching tests, then archive after verification.
- Requirement bug: update the requirement or add the missing scenario that
  explains the corrected behavior.
- Technical bug: if the current spec is already correct, reference the existing
  requirement or scenario and add a regression test; if the failing path was not
  specified, add or modify a scenario in an active change.

A functional fix is not complete just because the code changed. It is complete
when the code, tests, active OpenSpec delta, and current spec after archive all
describe the same behavior.

## Checklist Placement

Use OpenSpec defaults unless a solution repo explicitly adopts a custom schema:

- Put implementation tasks in `tasks.md`.
- Put review, local-check, evidence, and archive-readiness checklist items in `tasks.md`.
- Do not create `review.md`, `review-checklist.md`, or a standalone delivery-plan file by default.
- Do not mark approval or waiver checklist items complete unless a human decision record exists.
- Keep verification results, skipped-check reasons, approvals, waivers, and release-readiness summaries in Delorean evidence artifacts, then link them back to the relevant OpenSpec change, requirement, scenario, and task.

## Suggested Links

| OpenSpec item | Delorean link |
|---|---|
| Requirement | Business-rule ID when the behavior is rule-driven |
| Scenario | Scenario ID, test, check, or manual validation note |
| Change `proposal.md` | Work-start summary or issue link |
| Change `design.md` | Design package, ADR, or architecture note when needed |
| Change `tasks.md` | Implementation, review, and verification checklist |
| Spec delta | Impacted OpenSpec requirement or scenario |
| Verified scenario | Evidence Bundle scenario coverage |
| Completed active change | Release-ready archive result |
| Approval-sensitive change | Approval response or waiver template |

## Evidence Notes

For meaningful changes, the Evidence Bundle should link:

- OpenSpec spec or change ID.
- Requirement names or business rule IDs.
- Scenario names.
- Tests or checks run.
- OpenSpec validation status and archive status when an active change is in scope.
- Skipped checks and reasons.
- Approval, waiver, or re-entry records when needed.

Tests and Evidence Bundle entries should link back to OpenSpec requirements and scenarios when they are relevant.
