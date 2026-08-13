# Proposal: Open RP configurations from their collection

## Summary

Make every RP-configuration table row open the selected RP configuration's
task hub, where authorized users can reach Configuration, Usage, Manage
credentials, and state-appropriate setup tasks.

## Why

The current table sends an editable draft directly into registration and sends
other records directly into the secret-free Configuration view. Both paths
bypass the RP-configuration hub, so Usage and credential lifecycle tasks are
not discoverable from the collection.

## Work context

- Local developer / localhost only.
- Use existing fake or test-only records and no real secrets.
- Shared non-production, production, deployment, and external-system mutation
  are out of scope.

## What Changes

- Change the single row action to `View RP configuration` and route it to the
  canonical Application-scoped RP-configuration hub.
- Preserve the draft editor's `Resume setup` action on the hub.
- Keep role-aware task visibility and backend authorization unchanged.
- Add English/French copy and regression tests.

## Out of scope

- New table controls, inline actions, API fields, database changes, or
  permission changes.
- Provider calls, credential retrieval, rotation, or deployment.

## Requirements or scenarios affected

- Current spec:
  `openspec/specs/partner-portal-workspace-and-rp-application-management/spec.md`
- Requirement: `Application and RP configuration collections use focused
comparison tables`
- Scenario: `Each RP-configuration row has one clear destination`
- Existing current behavior preserved:
  `Canonical Application-scoped RP configuration overview is a task hub` in
  `partner-portal-rp-application-experience`.

## Risks

- A draft editor could lose the convenient setup path if the hub does not show
  its existing state-aware resume action. The same slice verifies that action
  on the hub before completion.

## Links

- Work context: `STD-002: Work Contexts`
- Page pattern: `PAT-001: UI Page Patterns`
- Table pattern: `PAT-023: Frontend Data Table`
- Existing decision:
  `openspec/changes/archive/2026-08-13-organize-applications-and-rp-configurations/page-pattern-decision.md`
