# Tasks: Open RP configurations from their collection

## Specification and design

- [x] Classify this as a small requirement correction.
- [x] Confirm local-only work context and no secret or production scope.
- [x] Record the existing table and task-hub page patterns with no custom UI
      exception.
- [x] Preserve every existing scenario in the modified requirement delta.
- [x] Validate the active OpenSpec change strictly.

## Implementation

- [x] Route each RP-configuration row's one action to its canonical task hub.
- [x] Add equivalent English/French `View RP configuration` copy.
- [x] Preserve state-aware `Resume setup` on the task hub for editable drafts.
- [x] Keep read-only and capability-based task visibility unchanged.

## Tests and verification

- [x] Add regression coverage for draft and read-only row destinations.
- [x] Add regression coverage for the hub's draft resume action and read-only
      omission.
- [x] Run focused frontend tests and translation contracts.
- [x] Run frontend lint and production build.
- [x] Run relevant GC Design System and accessibility-oriented checks.
- [x] Run holistic local diff and OpenSpec scenario-preservation review.

## Developer readiness

- [x] Confirm implementation and verification are complete.
- [x] Archive the functional change without `--skip-specs`.
- [x] Confirm the current spec contains the corrected row-destination scenario
      and all previously existing scenarios.
