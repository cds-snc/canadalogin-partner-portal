# Rollout: Clarify role management specifications

## Purpose

This note captures the operational cutover work that sits outside runtime implementation for `clarify-role-management-spec`.

It is intentionally local and repo-grounded:

- initial `CL Admin` bootstrap uses the existing superuser seed path already documented in the backend docs
- additional approved `CL Admin` users are added through the shipped user-role assignment flow
- partner users are not backfilled from legacy `application_owner` snapshots

This document does not approve production work on its own. Shared-environment or production execution still needs the normal human ownership, approvals, and release sequencing.

## Preconditions

- Backend migrations are applied, including the seeded `admin` role from `backend/src/migrations/versions/0004_seed_roles.py`.
- The approved bootstrap `CL Admin` email list is known.
- The grant-aware current-user RP application access changes are deployed together with the invitation or onboarding flow that creates `rp_application_access_grant` rows.
- The legacy owner-email fallback is still available until the invitation or grant creation path is verified.

## Cutover Task: Seed The Initial `CL Admin` Users

1. Seed the first bootstrap admin with the existing superuser path. Set `SUPERUSER=<approved-email>` in the backend environment and run the documented backend command from `backend/`:

```bash
UV_PROJECT_ENVIRONMENT=../.venv uv run python -m src.scripts.create_first_superuser
```

2. Confirm the created local user row matches the approved bootstrap email and has `is_superuser=True`.
3. Sign in with that seeded account and verify platform-admin access to the role and user administration surfaces.
4. Use the shipped user-role assignment flow to add the seeded `admin` role to any additional approved `CL Admin` users.
   The live API contract is `POST /api/v1/user/{user_uuid}/roles/{role_uuid}` after the bootstrap admin can authenticate.
5. Keep the bootstrap superuser account in place until at least one additional approved `CL Admin` user has confirmed local role-managed access.
6. Remove the temporary `SUPERUSER` environment override after bootstrap is complete so repeated startup does not become the long-term administration path.

## Go-Live Runbook

### Required sequencing

1. Deploy the local-role OIDC sign-in behavior from `clarify-role-management-spec`.
2. Deploy the invitation or onboarding path that creates and maintains `rp_application_access_grant` records.
3. Seed the minimal initial `CL Admin` set with the cutover task above.
4. Verify the bootstrap `CL Admin` account can sign in, read assigned user roles, and assign the `admin` role to another approved user.
5. Bootstrap the first partner-side `RP Admin` users through the built-in invitation flow.
6. Only after the invitation or grant creation path is working for real users, remove the legacy `application owners` gate and retire the owner-email fallback.

### Explicit non-backfill rule

- Do not create partner access by replaying historical `application_owner` email snapshots into `rp_application_access_grant` rows.
- Do not bulk-seed partner users during cutover.
- After the initial `CL Admin` bootstrap, all partner access starts through the normal invitation and role-assignment flows.

### Validation checklist

- A seeded `CL Admin` user can sign in without relying on the upstream `application owners` group.
- The bootstrap `CL Admin` can use the shipped user-role admin flow to grant `admin` to another approved user.
- Grant-backed current-user RP application access works for the intended workspace scope.
- `Read Only` grants cannot access secret routes.
- No partner user receives access only because their email still appears in a legacy `application_owner` snapshot once the fallback is retired.

### Rollback posture

- Keep the legacy owner-email fallback in place until invitation or onboarding grant creation is validated.
- If bootstrap `CL Admin` sign-in fails, restore the last known-good environment that still includes the fallback or re-run the bootstrap superuser seed for the approved email.
- Do not remove the fallback in the same release step that introduces grant-aware runtime behavior unless the grant creation flow has already been verified in the target environment.
