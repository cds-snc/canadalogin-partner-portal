# Tasks: Clarify role management specifications

## Spec refinement

- [x] Create an active OpenSpec change for dedicated role-management requirements.
- [x] Confirm the work context is local-only for this planning slice.
- [x] Identify the role-management gap across current specs, frontend admin pages, and backend services.
- [x] Add a dedicated `partner-portal-role-management` capability delta.
- [x] Add a platform-administration delta so detailed role behavior is not left inside the broad governance requirement.
- [x] Record the standards impact and boundary with workspace membership roles in `design.md`.

## Planning follow-up

- [x] Confirm whether the platform user role model is intentionally multi-role for all admin flows and API contracts.
- [x] Decide whether the singular user-role read endpoint stays supported, is expanded, or is replaced with a list-based read surface.
- [x] Decide the expected delete behavior when a platform role is still assigned to one or more users.
- [x] Confirm whether any current spec text outside the platform-administration capability also needs a cross-reference to the new role-management capability.
- [x] Decide whether MVP2 continues to use the OIDC `application owners` group as a portal authorization source.
	Progress note (2026-08-10): no. MVP2 authorization should use locally managed roles after OIDC authentication and should stop deriving application access from the upstream `application owners` group.
- [x] Decide whether MVP2 implementation depends on a historical-user migration to grant first access.
	Progress note (2026-08-10): no. Implementation should assume no partner access is auto-granted at cutover. A small initial `CL Admin` set is seeded operationally, and all later partner access uses the built-in invitation and role-assignment flows.

## Implementation and verification follow-up

- [x] Align backend and frontend role-read contracts with the adopted user role model.
- [x] Confirm route-level Casbin authorization evaluates all assigned platform roles for a user.
	Progress note (2026-08-10): `backend/src/app/core/access_control.py` resolves every assigned role name plus the user identity and authorizes through `MultiSubjectEnforcer`, so any matching role subject can satisfy a permission check.
- [x] Record that current admin behavior still supports role deletion through the roles UI and `DELETE /api/v1/role/{role_uuid}`, so the current-behavior spec keeps deletion instead of treating durable role records as already shipped.
- [ ] If product wants durable reusable role records, open a separate behavior change to remove role deletion from the admin UI and backend contract.
- [ ] Replace OIDC group-driven role assignment and the `application owners` eligibility gate with explicit role-managed authorization rules after OIDC authentication.
- [ ] Replace RP-application owner-email permission checks with a durable app-scoped access model.
- [ ] Add or update backend tests for duplicate role-name rejection, duplicate user-role rejection, remove-missing-role rejection, multi-role permission evaluation, login without upstream `application owners` membership when local roles allow access, and any adopted replacement for legacy permission paths.
- [ ] Add or update frontend tests for role CRUD including deletion and for user role assignment or removal flows in the platform admin UI.
- [x] Validate the active change with `make validate-openspec-change CHANGE_ID=clarify-role-management-spec` with the OpenSpec CLI available on `PATH`.
- [x] Run the relevant local verification checks for the touched backend, frontend, and OpenSpec artifacts when implementation begins.

## Rollout follow-up

- [ ] Prepare a go-live cutover task outside runtime implementation to seed the initial `CL Admin` users before the legacy `application owners` gate is removed.
- [ ] Prepare the go-live cutover runbook so partner users are not backfilled; after the initial `CL Admin` seed, all partner access starts through the built-in invitation flow.

## Archive follow-through

- [ ] Archive with `openspec archive clarify-role-management-spec --yes` after implementation and verification are complete.
- [ ] Confirm `openspec/specs/partner-portal-role-management/spec.md` is created from the delta during archive.
- [ ] Confirm `openspec/specs/partner-portal-platform-administration-and-supportability/spec.md` preserves its non-role scenarios while moving detailed role behavior to the dedicated capability.
