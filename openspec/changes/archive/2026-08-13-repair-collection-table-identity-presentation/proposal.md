# Proposal: Repair collection-table identity presentation

## Why

Marking the identity column as a GCDS row header introduced a visually heavy
divider between the first and second columns on the Applications and RP-
configuration tables. The Applications table also exposes separate English
and French service-name columns even though the user needs the name matching
the interface language.

## What Changes

- Restore the quiet GCDS body-cell presentation for the identity column in
  both collection tables.
- Show one Application `Name` column using only the active interface language.
- Keep row actions accessible by including the displayed identity in each
  action's accessible name.
- Preserve the RP table's sorting, count, environments, status, and canonical
  task-hub destination.

## Work context

- Local developer / localhost only, using fake or test-only data.
- No real secrets, shared-environment mutation, production work, or deployment.

## Out of scope

- API, backend, data, permission, or route changes.
- Changes to bilingual Application editing or detail views, where both
  language values remain required and useful.
- Custom table CSS or replacement of the GCDS table.

## Requirements affected

- Current spec:
  `openspec/specs/partner-portal-workspace-and-rp-application-management/spec.md`
- Requirement: `Application and RP configuration collections use focused
comparison tables`

## Links

- `PAT-023: Frontend Data Table`
- Existing collection decision:
  `openspec/changes/archive/2026-08-13-organize-applications-and-rp-configurations/page-pattern-decision.md`
