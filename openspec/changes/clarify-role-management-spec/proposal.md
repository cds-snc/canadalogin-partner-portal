# Proposal: Clarify role management specifications

## Summary

Create a dedicated role-management capability spec and clarify how platform and workspace role assignment behaviors are specified.

## Problem or opportunity

Role-management behavior is currently spread across a broad platform-administration requirement, the workspace membership spec, and the implemented frontend and backend admin flows. The current specs do not give role catalog CRUD, user role assignment and removal, or the platform-role versus workspace-role boundary a dedicated home.

The existing implementation already exposes concrete role-management behavior:

- platform admins create, list, edit, and delete reusable roles
- platform admins add and remove multiple roles on a user record
- workspace admins manage a separate workspace membership role with a constrained vocabulary

This change creates a dedicated capability spec so those behaviors can be planned, implemented, and reviewed without relying on scattered references.

## Work context

- Local developer / localhost: yes by default unless the request says otherwise.
- Shared non-production environment: not used yet unless a target is named.
- Production: not in scope unless explicitly approved.

Selected starting context: Local developer / localhost.

## Safe assumptions

- Build and verify locally first.
- Use fake, fixture, or test-only data.
- Do not use real secrets or production identifiers.
- Keep external integrations stubbed or described until a target environment is named.
- Name reusable artifacts for the real domain concept or intended environment path, not for localhost. Keep local-only names for disposable fixtures, local config values, and examples that will not be promoted.

## Naming for reuse

- Reusable code, API, database, queue, feature flag, service, environment variable, documentation, and evidence identifiers: `partner-portal-role-management`, `clarify-role-management-spec`
- Disposable local fixture or example identifiers: role and user fixtures used only in local tests
- Environment-specific values that stay in config, .env.local, fixtures, or deployment parameters: none expected for this spec-only change
- Names that must wait for a named shared environment or production decision: none

## Suggested options

Recommended option:

- Build the local contract, implementation slice, tests, and evidence inputs first.

Other options:

- Prepare a shared non-production plan after the target environment, access path, data rules, and rollback or cleanup path are known.
- Prepare a production-readiness checklist only. Do not perform production work until approval, target, rollback, monitoring, and evidence expectations are known.

## Scope

- Add a dedicated OpenSpec capability delta for `partner-portal-role-management`.
- Specify platform role catalog CRUD behavior and platform user role assignment and removal behavior from the existing admin surfaces.
- Clarify that workspace membership roles remain workspace-scoped and separate from reusable platform roles.
- Narrow the broad platform-administration current spec so role behavior is owned by the dedicated capability instead of a catch-all requirement.
- Identify follow-on implementation and verification work needed to align the API contract with the documented behavior.

## Out of scope

- Production deployment unless explicitly approved.
- Real secrets, real production data, or external system changes unless explicitly approved.
- Changing runtime authorization policy or user-facing workflows in this change.
- Moving workspace membership requirements out of the workspace-management capability.

## Requirements or scenarios affected

- Current spec after archive: openspec/specs/partner-portal-role-management/spec.md
- Current spec to modify on archive: openspec/specs/partner-portal-platform-administration-and-supportability/spec.md
- Delta spec: openspec/changes/clarify-role-management-spec/specs/partner-portal-role-management/spec.md
- Delta spec: openspec/changes/clarify-role-management-spec/specs/partner-portal-platform-administration-and-supportability/spec.md
- Added requirements: platform role catalog management, platform user role assignment, workspace-role boundary
- Modified requirement: Platform administrators manage portal governance records

## Risks

- Missing environment details could block non-local work. Continue locally and record what is needed before shared-environment or production work.
- Historical singular user-role references in tests or planning notes can obscure the adopted multi-role contract unless the plural `/api/v1/user/{user_uuid}/roles` read surface remains the authoritative path.
- Current route-level permission checks collapse multiple assigned roles to one effective Casbin subject, which can hide assigned permissions.
- RP-application current-user access is still enforced through owner-email snapshots in service code. Replacing that with role-managed access will need a durable app-scoped access model instead of a global role swap.

## Links

- Work context standard: STD-002: Work Contexts
- OpenSpec lifecycle: docs/reference/openspec-lifecycle.md
- Evidence template: docs/templates/evidence-bundle-template.md
