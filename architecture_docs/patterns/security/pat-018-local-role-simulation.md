# PAT-018: Local Role Simulation

Type: Pattern
Status: Active

## Problem

Local development often needs to exercise role-based routes, navigation, and
authorization before the real identity provider, role database, or claim-mapping
source is available.

Without a standard local role simulation pattern, teams can drift into
frontend-only role toggles, hard-coded admin users, or development controls that
accidentally survive into shared or production environments.

## Use When

- A local developer environment needs to simulate signed-in users or roles.
- The real identity provider, role database, or role assignment workflow is not
  available or authorized in the declared local context.
- Protected routes, role-specific navigation, permission states, or review
  fixtures need local coverage.
- All data is fake, seeded, fixture, or test-only.

## Do Not Use When

- The work is in a shared non-production or production environment.
- Real identity-provider, database, or claim-mapping behaviour is being tested.
- Role assignment, delegation, or approval is part of the business workflow.
- The role source of truth is unclear for a real deployment decision.

## Trade-Offs

- A local selector makes role-specific UI easier to build and review, but it can
  create false confidence if backend authorization is not tested.
- Static fixture users avoid an unavailable identity or database dependency, but
  they must remain a configured local substitute behind the same session and
  authorization boundaries as the selected real source.
- A dedicated local page is explicit, but it must be hidden and disabled outside
  local development.

## Approach

1. Declare the work context as `local_developer`.
2. Name the selected real identity and role source and record which behavior
   remains unverified while it is unavailable.
3. Define a small set of fixture users and roles in backend-owned local
   configuration or test fixtures.
4. Add a dev-only backend endpoint that creates or updates the simulated local
   session from an allowed fixture user.
5. Reuse the same application-owned identity or role-source boundary and
   session response shape that the real auth path will expose.
6. Put the role selector on a local-only page, normally `/dev/session` or
   `/dev/role`.
7. Use the same protected-route and RBAC dependencies that real sessions use.
8. Disable the selector, fixture endpoint, and fixture roles outside local
   development.
9. Show the current simulated user and role in the shared app shell so reviewers
   can tell which role is active.

### Fixture Users

Prefer fixture users over a raw role dropdown. Fixture users better model the
future session shape and make screenshots easier to understand.

Each fixture should include only safe local data:

```yaml
id: local-admin
display_name: Local Admin
email: local-admin@example.test
roles:
  - admin
permissions:
  - clients:read
  - clients:write
```

Keep fixture users intentionally small. Include enough roles to cover the main
authorization branches, such as viewer, editor, reviewer, and admin. Do not use
real names, real email addresses, production identifiers, or copied identity
provider claims.

### Backend Boundary

The backend owns the simulated session. The frontend selector may request a
fixture user, but API authorization must read the role from the backend session
or backend test fixture, not from arbitrary client state.

Make one canonical server-side, fail-closed enablement decision from explicit
local context, authentication mode, and feature configuration. Settings may
include:

- `APP_ENV=local` or an equivalent local-only setting
- `AUTH_MODE=local_dev` or an equivalent auth-mode setting
- `ENABLE_DEV_ROLE_SELECTOR=true` only when the environment is local

Fail closed when the configuration is inconsistent. For example, do not start
with `ENABLE_DEV_ROLE_SELECTOR=true` when `APP_ENV` is `test`, `staging`, or
`production`.

Network exposure is a separate defense-in-depth decision, not the identity
gate. Follow the selected runtime topology: bind a host-local service to
`127.0.0.1` by default, but allow a containerized service to bind its container
interfaces while the host port remains appropriately restricted. Do not rely on
network binding as the sole control for the selector.

### Selector Page

The selector page should use the normal page shell and GC Design System form
components. Keep it visibly local-only.

The page should include:

- H1 such as `Local development role selector`
- a notice that the control is for local development only
- a select or radio group listing allowed fixture users
- a summary of the selected fixture user's roles and key permissions
- a `Continue as selected user` action
- a `Clear local session` action when useful
- navigation back to `Home`

Do not put the role selector in the production account menu. When enabled
locally, it may appear in the shared menu under a clearly labelled local
development entry or from the signed-in user summary.

### Current User Display

Use the shared app shell pattern to display the current user and active role.
In local development, label the value as simulated so screenshots and reviews do
not look like real authentication evidence.

Example:

```text
Signed in as Local Admin
Role: admin (simulated)
```

For non-local authenticated apps, display only safe identity information such as
the user's display name, email, or active role when that helps the user
understand their access. Do not display tokens, raw claims, internal IDs, or
permission dumps in the UI.

### Expected Files

- `backend/app/routers/dev_auth.py`: local-only selector/session endpoint.
- `backend/app/dev_fixtures/` or `backend/app/config.py`: fixture users and
  roles.
- `backend/app/dependencies.py`: current-user and permission dependencies used
  by both simulated and real sessions.
- `frontend/src/features/devAuth/`: local role selector page and route.
- `frontend/src/features/auth/`: shared session hook and current-user types.
- `frontend/src/components/Layout/`: current-user summary in the app shell.

## Checks

### Tests

- The selector endpoint is unavailable when local role simulation is disabled.
- The backend rejects fixture users that are not in the allowlist.
- Selecting a fixture user creates the expected simulated backend session.
- The session endpoint returns the same shape for simulated and real sessions.
- Protected frontend routes show authorized and unauthorized states for fixture
  roles.
- Protected backend routes reject insufficient fixture roles through the normal
  RBAC dependency.
- Client-supplied role values are ignored outside the dev-only selector
  endpoint.
- Shared and production configuration rejects the local identity substitute
  even when one individual setting is incorrect.

### Verification

- Desktop and mobile screenshots show the selector page, signed-in user summary,
  and at least one unauthorized state.
- Local verification records the settings that enabled the selector.
- Non-local build or configuration check proves the selector route and endpoint
  are disabled.
- Verification names the selected real identity and role source and the
  provider, claim-mapping, persistence, and assurance behavior that remains
  unverified.
- Storybook or equivalent review fixtures cover major role-specific UI states
  when they are meaningful.

### Stop Conditions

- A shared non-production or production environment needs role switching.
- Real user, role, tenant, or permission data is required.
- Role persistence, role assignment, approval, audit, or recovery rules are in
  scope.
- The team needs to prove real identity-provider, claim-mapping, or database
  authorization behaviour.

## Related Standards And Patterns

- [STD-002: Work Contexts](../../standards/std-002-work-contexts.md)
- [STD-013: Security and Privacy Basics](../../standards/std-013-security-and-privacy-basics.md)
- [PAT-004: Protected Route](../frontend/pat-004-protected-route.md)
- [PAT-009: OIDC Backend Session](pat-009-oidc-backend-session.md)
- [PAT-010: RBAC Policy Check](pat-010-rbac-policy-check.md)
- [PAT-025: Dependency Substitution](../full-stack/pat-025-dependency-substitution.md)
