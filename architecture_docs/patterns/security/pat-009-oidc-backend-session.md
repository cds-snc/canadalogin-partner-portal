# PAT-009: OIDC Backend Session

Type: Pattern
Status: Active

## Problem

OIDC sign-in needs a secure browser-to-backend session boundary without storing sensitive tokens in the browser.

## Use When

- Users authenticate through an OIDC provider.
- The browser should not store sensitive access, refresh, or ID tokens.
- Backend routes need to know the current user and roles.

## Do Not Use When

- The caller is a machine-to-machine client.
- The app is static and has no backend session boundary.
- The feature only needs simulated users or roles and no OIDC provider
  interaction is in scope. Use
  [PAT-018: Local Role Simulation](pat-018-local-role-simulation.md) as a
  constrained identity substitute while preserving the same backend session
  and authorization contracts.

## Trade-Offs

- Reduces browser token exposure, but adds backend session storage, cookie, logout, and provider configuration complexity.
- Real identity assurance, MFA, and claim mapping need explicit project decisions.
- A provider simulator or in-memory development session store can unblock
  development, but cannot prove real-provider or deployed multi-instance
  session behavior.

## Approach

1. Frontend sends the user to a backend login-start endpoint.
2. Select the provider implementation explicitly. When the real provider is
   unavailable or outside authorized scope, use an OIDC-compatible simulator
   through [PAT-025: Dependency Substitution](../full-stack/pat-025-dependency-substitution.md),
   or use PAT-018 only when OIDC protocol behavior is not in scope.
3. Backend uses OIDC discovery and a trusted library.
4. Backend validates issuer, audience, state, nonce, redirect URI, and token
   response according to the provider contract.
5. Backend maps trusted claims to a local user/session record.
6. Choose a server-side session store whose lifetime, revocation, concurrency,
   and multi-worker or multi-instance behavior match the solution target. An
   in-memory store is only an explicitly configured development or test
   substitute.
7. Backend creates a secure server-side session and sends an `HttpOnly` cookie
   with an explicit `SameSite` policy in every context. Use `Secure` whenever
   HTTPS is used and require it in shared and production contexts; explicitly
   documented plain-HTTP loopback development may omit only `Secure`.
8. For local development, choose and document one browser-facing hostname for
   the frontend, API, login, callback, logout, and post-authentication redirect
   flow. Treat `localhost` and `127.0.0.1` as distinct cookie hosts; do not mix
   them across browser-visible URLs or silently rewrite one to the other without
   verifying the complete session flow.
9. Prefer same-origin behavior or a development proxy when it fits the
   architecture. When the browser calls the backend across origins, configure
   the exact documented frontend origin, credential support, cookie attributes,
   and redirect URLs together. Do not combine credentialed CORS with a wildcard
   allowed origin.
10. Limit credentialed browser requests to calls that participate in this
    cookie-session design. Cross-origin session requests normally need
    `credentials: include`; same-origin requests may use the browser's
    same-origin default. Do not make `credentials: include` a universal rule for
    unrelated API clients.
11. Review the CSRF posture for state-changing requests in the context of the
    selected `SameSite`, origin, proxy, and request-validation design. Use the
    project-approved CSRF control when cookie policy and origin checks alone do
    not provide the required protection.
12. Backend invalidates the application session on logout and performs federated
    logout when required.
13. Missing provider configuration or provider failure must fail closed. It
    must not silently activate a simulator, fixture identity, or development
    session mode.

### Expected Files

- `backend/app/routers/auth.py`: login, callback, session, logout endpoints.
- `backend/app/services/auth_service.py`: provider and session behavior.
- `backend/app/dependencies.py`: current-user dependency.
- `frontend/src/features/auth/`: login, callback, logout, and session UI.
- `frontend/src/fetch/` or `frontend/src/services/`: session requests.

## Checks

### Tests

- Login start redirects to the provider.
- Callback rejects invalid state or nonce.
- Session endpoint returns the current user without exposing sensitive tokens.
- Logout clears the application session.
- Protected backend route rejects missing or expired session.
- The documented local hostname flow sets, sends, expires, and clears the
  session cookie without `localhost` and `127.0.0.1` drift.
- Cross-origin session calls, when used, send the intended credentials and are
  accepted only from the documented CORS origin.
- State-changing requests exercise the selected CSRF posture.
- Login, callback, logout, and post-authentication redirects remain on the
  documented local hostname.
- Session expiry and revocation work with the selected store topology.
- Provider or session substitutes expose the same application-owned session
  shape and authorization path.
- Shared configuration permits an eligible provider or session substitute only
  when it is explicitly declared and configured. Production rejects development
  and test substitutes, and PAT-018 fixture modes remain local-only.
- Provider failure does not silently fall back to a substitute.

### Verification

- IAM review notes for real provider setup.
- Backend and frontend auth tests.
- Verification note proving tokens are not stored in browser local storage.
- Local browser, integration, or equivalent verification under the documented
  hostname covering cookie acceptance, credentialed session requests, CORS,
  CSRF posture, and login, callback, logout, and post-authentication redirects.
- Provider and session-store modes used during verification, plus remaining
  real-provider and deployed-store behavior that was not exercised.

### Stop Conditions

- The requested result specifically requires unavailable real-provider
  metadata, credentials, redirect configuration, or live provider behavior.
- Assurance level, MFA, claim mapping, or provider approval is unclear.
- Production or shared-environment identity testing is requested without a
  named, authorized target.

## Related Schema Contracts

- Schema contract: [ARCH-SCHEMA-PAT-009-OIDC-BACKEND-SESSION](../../schemas/patterns/pat-009-oidc-backend-session.schema.yaml)
- Used for: helping agents and reviewers check the OIDC and backend-session
  boundary, cookie security, local hostname consistency, credentialed requests,
  CORS, CSRF posture, redirects, session-store behavior, and verification.
- Notes: The schema contract supports this pattern. It does not replace this
  pattern as the source of truth.
