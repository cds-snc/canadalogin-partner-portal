# Design: Clarify role management specifications

## Technical approach

Use a dedicated capability spec to describe the implemented role-management behavior instead of leaving it inside a broad platform-administration requirement.

This change should:

- add a new `partner-portal-role-management` capability delta for reusable platform roles and platform user-role assignment behavior
- add a targeted delta for `partner-portal-platform-administration-and-supportability` so the existing catch-all governance requirement no longer owns detailed role behavior
- record that MVP2 authorization uses locally managed roles instead of deriving application access from the OIDC `application owners` group
- keep workspace membership ownership in the existing workspace-management capability, while documenting that workspace membership roles are not reusable platform roles

The spec stays fact-grounded to the current implementation where possible, while also recording one accepted MVP2 behavior change:

- the roles admin surface uses `/api/v1/roles` and `/api/v1/role/{role_uuid}` for paginated role CRUD
- the users admin surface adds and removes role assignments through `/api/v1/user/{user_uuid}/roles/{role_uuid}` and should read assigned roles as a list-based contract
- user records already expose `role_uuids` arrays, which indicates a multi-role user model
- workspace membership roles remain limited to `workspace_admin` and `workspace_member`
- current `sync_oidc_user` still denies users when neither configured upstream group matches and still rewrites local role IDs from upstream group membership

A current-spec review found no additional cross-reference work outside the platform-administration capability. `partner-portal-access-and-dashboard` only describes displaying available role context in the shared shell, and `partner-portal-workspace-and-rp-application-management` already owns the distinct workspace-scoped membership behavior that the new role-management capability references as a boundary.

Implementation decisions confirmed in this slice:

- platform users may intentionally hold multiple reusable platform roles
- current admin behavior still allows reusable platform roles to be deleted through the roles UI and `DELETE /api/v1/role/{role_uuid}`
- MVP2 authorization must stop using upstream `application owners` group membership as the source of portal access and must stop overwriting locally managed role assignments on sign-in
- MVP2 cutover should not auto-grant partner access from legacy state. A small initial `CL Admin` set is seeded operationally, and partner access is then created through the built-in role-assignment and invitation flows.

Recommended first follow-on implementation slice:

- preserve the list-based user-role read contract and multi-subject Casbin evaluation that already match the multi-role data model
- replace the current OIDC group-based role overwrite and eligibility gate with role-managed authorization after identity is established

Rollout and cutover note:

- Do not make runtime implementation depend on a historical-user migration.
- If go-live needs initial data setup, treat that as an operational cutover step: seed the first `CL Admin` users before enabling the MVP2 authorization rule.
- Do not backfill partner users during cutover. After the initial `CL Admin` seed step, use the normal admin and invitation flows to create partner access instead of keeping a legacy fallback gate.

## Work context impact

Local developer / localhost:

- Build and verify on the developer machine using fake, fixture, or test-only data.
- Use durable names for artifacts that may be reused outside localhost.

Shared non-production environment:

- Name the target environment, access path, secret source, data rules, and rollback or cleanup path before deployment or changes.

Production:

- Keep production out of scope until human approval, target, rollback, monitoring, and evidence expectations are recorded.

## Impacted artifacts

- OpenSpec delta: openspec/changes/clarify-role-management-spec/specs/partner-portal-role-management/spec.md
- OpenSpec delta: openspec/changes/clarify-role-management-spec/specs/partner-portal-platform-administration-and-supportability/spec.md
- Current spec after archive: openspec/specs/partner-portal-role-management/spec.md
- Current spec after archive: openspec/specs/partner-portal-platform-administration-and-supportability/spec.md
- Current spec reference kept as-is: openspec/specs/partner-portal-workspace-and-rp-application-management/spec.md
- Frontend: frontend/src/features/roles/pages/RolesPage.tsx
- Frontend: frontend/src/features/users/pages/UsersPage.tsx
- Frontend: frontend/src/features/users/hooks/use-user-role.ts
- Frontend: frontend/src/fetch/user-roles.ts
- Backend: backend/src/app/api/v1/roles.py
- Backend: backend/src/app/api/v1/users.py
- Backend: backend/src/app/services/role_service.py
- Backend: backend/src/app/services/user_service.py
- Backend: backend/src/app/services/workspace_service.py
- Backend: backend/src/app/core/access_control.py
- Backend: backend/src/app/core/oidc.py
- Tests: frontend/tests/unit/** role and user admin coverage, backend/tests/** role and user service or API coverage
- Evidence: delorean/evidence/clarify-role-management-spec/change-state.yaml
- Baseline assessment: not required for this spec-only refinement unless the follow-on implementation is treated as a meaningful service change
- Affected GC-WEB controls: none identified for the spec-only change; reassess during implementation if UI or access-control behavior changes

## Standards and patterns impact

Applicable guidance:

- STD-008: Backend FastAPI
- STD-009: REST API
- STD-013: Security and Privacy Basics
- STD-017: Government of Canada Standards Review
- PAT-*: none identified for the spec-only change
- BAS-001 / STD-019: advisory only for now; reassess if the follow-on implementation changes meaningful service behavior
- GC-WEB-*: none identified for the spec-only change
- TPL-011: not required unless the follow-on implementation needs baseline-assessment evidence

Selected page or implementation pattern, when applicable:

- Pattern: existing platform administration task routes and admin data-table flows
- Reason: this change documents current admin behavior and does not introduce a new page or page shell
- Custom UI or implementation exceptions: none for the spec-only change
- Evidence to collect: strict OpenSpec validation and any later admin role-management test coverage linked to the new scenarios

## Suggested implementation path

Recommended first slice:

- Finalize the dedicated capability spec and implement the multi-role permission foundation so planning and implementation both point to one authoritative role-management behavior set.

Possible later slices:

- Remove role deletion from the admin UI and backend contract so the role catalog matches the durable-record rule.
- Replace RP-application owner-email permission checks with a durable app-scoped access model that can be governed through role-management and assignment flows.
- Add or update frontend and backend tests for role CRUD, duplicate handling, assignment, unassignment, and permission evaluation flows.

## Security, privacy, accessibility, and operations notes

- Security: keep real secrets and production identifiers out of code, tests, logs, prompts, and evidence.
- Privacy: use fake or test-only data until data rules are known.
- Accessibility: no new UI is introduced in this spec-only change, but any follow-on admin-page changes should still use the existing GC Design System review path.
- Operations: no deployment or monitoring change is expected from the spec-only refinement.
- IAM: role assignment and role catalog changes affect authorization governance, so follow-on implementation should include IAM and safe-error review.
- IAM: OIDC should remain the authentication source, but MVP2 authorization should load locally managed roles after sign-in rather than deriving portal access from upstream `application owners` membership.
- GC web application baseline: do not start a BAS-001 assessment for this spec-only refinement; reassess when a role-management implementation change is prepared for release.

## Open questions that block non-local work

- What durable app-scoped assignment model should replace RP-application owner-email snapshots when current-user RP-application permissions move under role-management?
