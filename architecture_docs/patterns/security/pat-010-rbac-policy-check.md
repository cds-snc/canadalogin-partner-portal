# PAT-010: RBAC Policy Check

Type: Pattern
Status: Active

## Problem

Permission checks need a repeatable policy boundary so routes do not embed one-off role logic.

## Use When

- A backend route or service action requires roles or permissions.
- Users can access only resources they own or administer.

## Do Not Use When

- A route is public.
- A simple authenticated-user check is enough and no resource ownership applies.

## Trade-Offs

- Centralizes permission checks, but requires clear role, policy, and ownership definitions.
- Coarse RBAC may not be enough when object-level or tenant-level rules are required.
- Stored policy systems require a reviewed initialization lifecycle; code- or
  configuration-defined policies may not need seed data.

## Approach

1. Define the protected resource, action, role or permission, policy owner, and
   decision semantics in an API contract, architecture note, or ADR.
2. Choose a server-side policy boundary. A policy engine, an application policy
   module, or another centralized and testable approach may be used; this
   pattern does not require a specific product.
3. When the selected policy store requires data, add idempotent seed,
   bootstrap, or migration data for the new resource or action. When policy is
   defined in code or configuration, record why stored initialization data is
   not applicable.
4. Store the role and permission source on the server side.
5. Map identity-provider claims only through trusted backend logic.
6. Enforce the policy in the selected service, dependency, or route boundary
   before returning protected data or performing the action.
7. Enforce object, tenant, workspace, or ownership boundaries when coarse role
   membership alone is not sufficient.
8. When the selected identity or role source is unavailable or outside
   authorized scope locally, use
   [PAT-018: Local Role Simulation](pat-018-local-role-simulation.md) only as an
   explicitly configured identity substitute. Fixture roles must use the same
   policy boundary as the selected real source and must not make real-source
   verification appear complete.
9. Return safe `401` or `403` errors without revealing sensitive resource details.
10. Audit sensitive denied and successful actions when required.

### Expected Files

- `backend/app/dependencies.py`: current-user and permission dependencies.
- `backend/app/services/<resource>_service.py`: resource ownership checks.
- `backend/app/models/`: role or permission models when needed.
- Migration, seed, bootstrap, or policy configuration: policy initialization
  when the selected implementation requires it.
- `backend/tests/test_<resource>_access.py`: access-control tests.

## Checks

### Tests

- Anonymous request is rejected.
- Authenticated user without the role is rejected.
- User with the role but wrong resource owner is rejected.
- User with the correct role and resource access succeeds.
- Client-supplied role values are ignored.
- Required policy seed, bootstrap, or migration data is idempotent and produces
  the intended policy.
- Local fixture roles use the same policy checks as real roles when local role
  simulation is enabled.

### Verification

- Authorization test output.
- IAM review note for sensitive features.
- Privileged-action coverage.
- Identity or role-source mode used by the tests and any remaining
  real-source verification.

### Stop Conditions

- Role source of truth is unclear.
- Resource ownership or tenant boundary is unclear.
- A human approval is required to create or change privileged roles.

## Related Schema Contracts

- Schema contract: [ARCH-SCHEMA-PAT-010-RBAC-POLICY-CHECK](../../schemas/patterns/pat-010-rbac-policy-check.schema.yaml)
- Used for: helping agents and reviewers check policy definition, policy-store
  initialization, server enforcement, resource boundaries, safe failures, and
  authorization tests.
- Notes: The schema contract supports this pattern. It does not replace this
  pattern as the source of truth.
