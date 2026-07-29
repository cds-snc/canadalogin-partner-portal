# PAT-004: Protected Route

Type: Pattern
Status: Active

## Problem

Protected frontend routes need a clear session and authorization boundary so unauthenticated or unauthorized users are handled predictably.

## Use When

- A frontend page requires an authenticated user or a specific role.
- The backend owns the session and authorization decision.

## Do Not Use When

- The page is public content.
- Authorization is only cosmetic. Server-side routes still need their own checks.

## Trade-Offs

- Improves route-level consistency, but it does not replace backend authorization checks.
- User experience depends on clear loading, signed-out, forbidden, and retry states.
- Server revalidation adds a request at route entry when freshness matters, but
  prevents stale cached state from being treated as current authorization.

## Approach

1. Add a session endpoint or client helper that returns the current user and
   server-side roles.
2. Use the selected router's route guard, loader, or protected wrapper pattern.
   For React Router, keep the protected boundary in the route tree; for
   TanStack Router, use route guards.
3. Use TanStack Query or the project's server-state client for the
   current-session fetch.
4. When authorization freshness matters, revalidate the server-backed session
   during protected-route entry before rendering protected content. Configure
   the guard, loader, or query call so a stale client cache cannot satisfy that
   check by itself.
5. Treat cached query, store, or browser state as a user-experience hint only,
   never as the authorization source of truth.
6. Fail closed when revalidation rejects, expires, times out, or otherwise
   cannot confirm access. Do not render protected content; show a safe
   signed-out, unavailable, or retry path according to the confirmed state.
7. Show loading, signed-out, unauthorized, and authorized states.
8. Keep public sign-in, login-start, callback, and recovery routes outside the
   protected boundary so users can enter or restore authentication without a
   redirect loop.
9. Redirect a confirmed unauthenticated user to the backend login start route
   or to a public sign-in entry page for the configured authentication
   implementation.
10. When the selected identity or role source is unavailable or outside
   authorized scope during local development, use
   [PAT-018: Local Role Simulation](../security/pat-018-local-role-simulation.md)
   as an explicitly configured substitute so simulated roles still use the
   backend-owned session and authorization contracts. It does not replace
   real-provider verification when that behavior is part of the solution
   target.
11. When route revalidation uses a cookie-backed backend session during local
    development, follow
    [PAT-009: OIDC Backend Session](../security/pat-009-oidc-backend-session.md)
    for local hostname, cookie, credentials, CORS, CSRF, and redirect alignment.
    Verify route entry under the documented local hostname; a missing session
    caused by `localhost` and `127.0.0.1` drift must not be mistaken for an
    authorization-rule failure.
12. Never authorize secret, admin, or data-changing actions based only on client
   state.

### Expected Files

- `frontend/src/features/auth/`: session hooks and auth pages.
- `frontend/src/routes/`: protected route definitions when routing is enabled.
- `frontend/src/fetch/` or `frontend/src/services/`: typed session request.
- `backend/app/routers/`: protected backend routes with server-side checks.

## Checks

### Tests

- Authenticated user sees the page.
- Unauthenticated user is redirected or shown the signed-out state.
- Authenticated user without the role sees the unauthorized state.
- Stale cached client authentication does not grant route access when the
  server rejects or cannot confirm the session.
- Revalidation failure does not render protected content and exposes a safe
  retry, unavailable, or sign-in path.
- Public sign-in and authentication entry routes remain reachable.
- Backend rejects missing or insufficient authorization even if the frontend is bypassed.

### Verification

- Unit tests for route/session behavior.
- Backend authorization tests.
- Screenshot or UI verification for signed-out and unauthorized states when
  user-facing.
- Local role simulation screenshots when local fixture roles are used.
- When PAT-009 supplies the backend cookie session locally, verification under
  its documented hostname proves the protected-route session request receives
  the intended cookie and reaches the expected authorized or signed-out state.

### Stop Conditions

- The requested result specifically requires unavailable real
  identity-provider configuration or behavior.
- Role source of truth is unclear for a non-local decision.
- Production or shared-environment login testing is requested without a named,
  authorized target.

## Related Schema Contracts

- Schema contract: [ARCH-SCHEMA-PAT-004-PROTECTED-ROUTE](../../schemas/patterns/pat-004-protected-route.schema.yaml)
- Used for: helping agents and reviewers check server-backed session
  revalidation, fail-closed route entry, public sign-in reachability, backend
  enforcement, cookie-session local verification when PAT-009 applies, user
  states, and authorization tests.
- Notes: The schema contract supports this pattern. It does not replace this
  pattern as the source of truth.
