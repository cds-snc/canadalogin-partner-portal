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

## Implementation and verification follow-up

- [x] Align backend and frontend role-read contracts with the adopted user role model.
- [ ] Make route-level Casbin authorization evaluate all assigned platform roles for a user.
- [ ] Remove role deletion from the admin UI and backend contract so roles are only assigned or unassigned.
- [ ] Replace OIDC group-driven role assignment with explicit role-managed authorization rules.
- [ ] Replace RP-application owner-email permission checks with a durable app-scoped access model.
- [ ] Add or update backend tests for duplicate role-name rejection, duplicate user-role rejection, remove-missing-role rejection, multi-role permission evaluation, and any adopted replacement for legacy permission paths.
- [ ] Add or update frontend tests for role CRUD without role deletion and for user role assignment or removal flows in the platform admin UI.
- [x] Validate the active change with `make validate-openspec-change CHANGE_ID=clarify-role-management-spec` with the OpenSpec CLI available on `PATH`.
- [x] Run the relevant local verification checks for the touched backend, frontend, and OpenSpec artifacts when implementation begins.

## Archive follow-through

- [ ] Archive with `openspec archive clarify-role-management-spec --yes` after implementation and verification are complete.
- [ ] Confirm `openspec/specs/partner-portal-role-management/spec.md` is created from the delta during archive.
- [ ] Confirm `openspec/specs/partner-portal-platform-administration-and-supportability/spec.md` preserves its non-role scenarios while moving detailed role behavior to the dedicated capability.
