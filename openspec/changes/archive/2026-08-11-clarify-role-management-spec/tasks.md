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
	Progress note (2026-08-11): blocked pending product direction. The archived current-behavior spec intentionally keeps role deletion because that is the shipped behavior today, so no follow-on change should be opened unless product explicitly chooses durable non-deletable role records.
- [x] Replace OIDC group-driven role assignment and the `application owners` eligibility gate with explicit role-managed authorization rules after OIDC authentication.
	Progress note (2026-08-10): `backend/src/app/core/oidc.py` now preserves resolved local `role_ids` on sign-in, keeps subject and email linking, denies access when the resolved user has no local portal role assignments, and no longer derives portal access from upstream `application owners` membership.
- [x] Replace RP-application owner-email permission checks with a durable app-scoped access model.
	Progress note (2026-08-11): the replacement model stays anchored to `restore-external-developer-invitations` and now fully removes the legacy owner-email fallback from the current-user `/api/v1/rp-applications/mine/**` service-layer access path. `RPApplicationService.list_current_user_rp_applications` and `_resolve_current_user_rp_application_access` now require active workspace-scoped `rp_application_access_grant` records instead of owner snapshot email matches, so list, summary, OAuth setup, credential, rotated-secret, and MAU access all resolve through the durable grant model rather than through historical owner-email snapshots. Focused backend verification passed with `.venv/bin/pytest backend/tests/test_ibm_sv_user_service.py backend/tests/test_rp_application_department_setup.py backend/tests/test_rp_application_oauth_setup.py backend/tests/test_rp_application_mau_report.py`.
- [x] Add or update backend tests for duplicate role-name rejection, duplicate user-role rejection, remove-missing-role rejection, multi-role permission evaluation, login without upstream `application owners` membership when local roles allow access, and any adopted replacement for legacy permission paths.
	Progress note (2026-08-10): `backend/tests/test_role_service.py` covers duplicate role-name rejection, `backend/tests/test_casbin_access.py` covers multi-role permission evaluation, `backend/tests/test_oidc_auth.py` covers preserved local roles plus login without the upstream `application owners` claim when local roles exist, `backend/tests/test_user_service.py` covers duplicate user-role rejection plus remove-missing-role rejection, `backend/tests/test_ibm_sv_user_service.py` covers the grant-aware `/api/v1/rp-applications/mine` list path, `backend/tests/test_rp_application_department_setup.py` covers grant-backed summary access plus department-assignment denial, and `backend/tests/test_rp_application_oauth_setup.py` covers read-only summary access plus read-only secret denial and `RP User (Edit)` secret access. Owner-email fallback retirement remains tracked by the replacement task above rather than by this verification task.
- [x] Add or update frontend tests for role CRUD including deletion and for user role assignment or removal flows in the platform admin UI.
	Progress note (2026-08-10): fetch-layer CRUD coverage already exists in `frontend/tests/unit/features/roles/roles-api.test.ts` and `frontend/tests/unit/features/user-roles/user-roles-api.test.ts`, and focused page interaction coverage now exists in `frontend/tests/unit/pages/RolesPage.test.tsx` for role deletion plus `frontend/tests/unit/pages/UsersPage.test.tsx` for add-role and remove-role flows in the platform admin UI.
- [x] Validate the active change with `make validate-openspec-change CHANGE_ID=clarify-role-management-spec` with the OpenSpec CLI available on `PATH`.
- [x] Run the relevant local verification checks for the touched backend, frontend, and OpenSpec artifacts when implementation begins.

## Rollout follow-up

- [x] Prepare a go-live cutover task outside runtime implementation to seed the initial `CL Admin` users before the legacy `application owners` gate is removed.
	Progress note (2026-08-10): see `openspec/changes/clarify-role-management-spec/rollout.md` for the bootstrap sequence using the documented `create_first_superuser` path plus the shipped user-role assignment API for any additional approved `CL Admin` users.
- [x] Prepare the go-live cutover runbook so partner users are not backfilled; after the initial `CL Admin` seed, all partner access starts through the built-in invitation flow.
	Progress note (2026-08-10): see `openspec/changes/clarify-role-management-spec/rollout.md` for cutover ordering, non-backfill rules, validation checkpoints, and rollback posture.

## Archive follow-through

- [x] Archive with `openspec archive clarify-role-management-spec --yes` after implementation and verification are complete.
	Progress note (2026-08-11): the change package is archived under `openspec/changes/archive/2026-08-11-clarify-role-management-spec/`.
- [x] Confirm `openspec/specs/partner-portal-role-management/spec.md` is created from the delta during archive.
- [x] Confirm `openspec/specs/partner-portal-platform-administration-and-supportability/spec.md` preserves its non-role scenarios while moving detailed role behavior to the dedicated capability.
