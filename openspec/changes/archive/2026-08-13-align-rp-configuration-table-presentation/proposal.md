# Proposal: Align the RP-configuration table presentation

## Why

The Application collection uses the shared richer `DataTable` presentation,
while its nested RP-configuration collection calls the lower-level GCDS table
directly. The result is visually inconsistent even though both pages present
comparable records in the same workspace hierarchy.

## What Changes

- Use the shared collection-table presentation for RP configurations.
- Keep the existing Name, Partner environment, CanadaLogin environment,
  Status, and Action information architecture.
- Add useful sorting for comparison columns, a localized record count, and a
  contained GCDS row link matching other collection actions.
- Keep filtering and pagination off for the expected small collection.
- Preserve the canonical RP task-hub destination and accessible row identity.

## Work context

- Local developer / localhost only, using fake or test-only data.
- No real secrets, shared-environment mutation, production work, or deployment.

## Out of scope

- API, backend, data, permission, or route changes.
- Filtering, pagination, bulk actions, inline editing, or custom table CSS.

## Requirements affected

- Current spec:
  `openspec/specs/partner-portal-workspace-and-rp-application-management/spec.md`
- Requirement: `Application and RP configuration collections use focused
comparison tables`
- Scenario: `Small RP-configuration table omits unnecessary controls`

## Risks

- Reusing the shared wrapper must not lose the RP table's row-header semantics
  or turn navigation into a script-only button. The implementation extends the
  wrapper with an explicit row-header mapping and an href-based GCDS link action.

## Links

- `PAT-001: UI Page Patterns`
- `PAT-023: Frontend Data Table`
- Existing table decision:
  `openspec/changes/archive/2026-08-13-organize-applications-and-rp-configurations/page-pattern-decision.md`
