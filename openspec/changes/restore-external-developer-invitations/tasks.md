# Tasks

## 0. Change Split And Capability Coordination

- [x] 0.1 Create a dedicated active change for external developer invitations and scoped access instead of leaving that behavior inside the generic PRD-gap change.
	Progress note (2026-08-10): created `restore-external-developer-invitations` and moved invitation planning ownership here.
- [x] 0.2 Record that `advance-onboarding-governance-and-reporting` still owns role-boundary guidance for the same capability.
	Progress note (2026-08-10): this package owns invitation lifecycle and access behavior; the onboarding package keeps the guidance-only requirement.

## 1. Invitation Management Contract

- [ ] 1.1 Record the invitation management route and API surfaces for bootstrap `CL Admin` invitations and delegated `RP Admin` invitations anchored to one existing partner workspace, using an existing workspace-scoped RP application as the first-release management entry point if needed.
- [ ] 1.2 Define the invitation lifecycle states and action rules for create, reissue, revoke, accept, and expire.
- [ ] 1.3 Define the persisted invitation fields using the archived invitation schema concepts: invited email, token hash, expiry, inviter, accepted or revoked timestamps, assigned invitation role, optional GC Notify notification identifier, related audit-safe identifiers, and any data needed to record delegated inviter authority.
- [x] 1.4 Define the first-release delivery posture as tokenized-link creation without requiring automatic email dispatch, and record GC Notify delivery as a follow-on capability.
	Progress note (2026-08-10): first release does not require automatic email send; invitation creation can produce a tokenized acceptance link for manual or out-of-band delivery.
- [x] 1.5 Define the bootstrap and delegated assignment constraint: only `CL Admin` users can create or assign `RP Admin`, while `RP Admin` users can invite only `RP User (Edit)` and `Read Only`.
	Progress note (2026-08-10): aligned the invitation role model to the PRD starting roles and removed the separate `partner_role_manager` label.

## 2. Acceptance And Identity Validation

- [ ] 2.1 Define the tokenized acceptance route at `/invitations/rp-applications/$token`.
- [ ] 2.2 Define valid, invalid, expired, revoked, signed-in email-mismatch, and repeated-login acceptance outcomes.
- [x] 2.3 Decide whether accepted invitees must still complete department setup before using current-user RP application routes.
	Progress note (2026-08-10): accepted invitees use the invitation's existing partner workspace context and do not complete a separate self-service department-setup step during invitation acceptance. Department remains metadata rather than an authorization boundary for invited access.
- [ ] 2.4 Define the invitation-backed login or eligibility path needed because current OIDC login denies users outside the configured admin and application-owners groups, including the pending-invitation email match check before rejection.
- [ ] 2.5 Define how first login creates or updates the local user record, assigns partner-scoped invited roles, and carries forward the invitation's partner context so the invited user is not redirected into the generic `/profile/setup` flow.

## 3. Partner-Scoped Access Enforcement

- [x] 3.1 Enumerate the exact current-user RP application surfaces that invited developers can use in the first release for `RP Admin`, `RP User (Edit)`, and `Read Only`, using the adopted rule that `RP User (Edit)` can submit RP requests and perform secret rotation workflows but does not manage roles, while `Read Only` cannot edit or view secret values.
	Progress note (2026-08-10): mapped the live `/your-applications` and `/api/v1/rp-applications/mine/**` family plus the planned invitation-management surface. `RP Admin`, `RP User (Edit)`, and `Read Only` can all list RP applications within their granted partner workspace, view app summary or OAuth configuration, and read MAU reports for those RP applications. `RP Admin` and `RP User (Edit)` can use manage-credentials and secret-rotation routes for RP applications inside that partner scope. `Read Only` cannot access secret routes. Invitation-backed users do not use `/your-applications/$rpApplicationUuid/department-setup`, and only `RP Admin` can access developer-invitation management for `RP User (Edit)` and `Read Only` invites.
- [x] 3.2 Define denial behavior for unrelated RP applications, workspace routes, and any unauthorized secret or administrative actions.
	Progress note (2026-08-10): for invitation-backed access, out-of-scope current-user RP-application routes and unauthorized secret or invitation-management subresources should resolve as not found rather than confirming the resource exists. This keeps the invited-app scope least-information and avoids leaking unrelated application or workspace existence.
- [ ] 3.3 Define how accepted invitations make partner-scoped RP applications appear in current-user application lists without granting workspace membership or relying only on `application_owner` email matching.
- [ ] 3.3 Define how accepted invitations make partner-scoped RP applications appear in current-user application lists without granting workspace membership or relying only on `application_owner` email matching.
	Progress note (2026-08-10): first-release assumption is workspace-wide partner access. A granted invited role should surface all active RP applications in the granted partner workspace through `/api/v1/rp-applications/mine`; per-RP filtering inside that workspace is out of scope unless a later change introduces it.
- [ ] 3.4 Define how delegated `RP Admin` users invite their own staff only within their existing partner workspace context.
- [ ] 3.5 Define the replacement or coexistence strategy for the current owner-email access checks on `/api/v1/rp-applications/mine/**` so invitation-backed users can reach only RP applications allowed by a partner-scoped invited-role grant.
	Progress note (2026-08-10): the current owner-email path that must be replaced or extended is concentrated in `backend/src/app/services/rp_application_service.py` across `list_current_user_rp_applications`, `get_current_user_rp_application_department_preflight`, `assign_current_user_rp_application_department`, `_get_current_user_secret_context`, and `get_current_user_rp_application_by_uuid` for MAU reporting. The likely replacement is a partner-scoped access-grant model that links user, workspace as first-release partner scope, invited role, and lifecycle status.

## 4. Verification And Archive Coordination

- [x] 4.1 Run `make validate-openspec-change CHANGE_ID=restore-external-developer-invitations`.
	Progress note (2026-08-10): strict OpenSpec validation passed for `restore-external-developer-invitations` using the local CLI workflow.
- [ ] 4.2 Add backend tests for lifecycle, token validation, acceptance, mismatch, revoke, expire, and access-denial paths when implementation starts.
- [ ] 4.3 Add frontend tests for invitation acceptance loading, success, error, missing-token, and access-restricted states when implementation starts.
- [ ] 4.4 Coordinate future archive with `advance-onboarding-governance-and-reporting` so the resulting current spec preserves both invitation requirements and onboarding guidance for `partner-portal-external-developer-invitations-and-scoped-access`.
