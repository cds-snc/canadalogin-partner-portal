# ADR-001: BFF and Server Session Authority

Type: Architecture Decision Record
Status: Accepted

## Date

2026-07-28

## Context

The portal authenticates browser users through CanadaLogin OIDC. The browser
needs a stable login state without receiving or persisting OIDC access, refresh,
or ID tokens. Protected routes also need to distinguish current server state
from a previously hydrated client-side snapshot.

The implemented backend exchanges the authorization response, stores the user
identifier, token bundle, and logout metadata in a Redis-backed server session,
and sends the browser an opaque session cookie. The frontend keeps a current-user
projection in Zustand for rendering.

## Baseline And Control Impact

- Applicable baseline: `BAS-001: Government of Canada Web Application Baseline`
  when Delorean architecture guidance is materialized.
- Affected controls: `GC-WEB-007: Security`, `GC-WEB-008: Identity And Access`,
  and `GC-WEB-010: APIs, Interoperability, And Data Exchange`.
- Baseline status impact: applies.
- Evidence needed before release: backend session and logout tests, protected
  route tests, and confirmation that browser storage does not contain OIDC
  tokens.

## Standard, Pattern, Control, Or Baseline Decision

- Applicable guidance: `PAT-004: Protected Route` and `PAT-009: OIDC Backend
  Session`.
- Decision type: follows.
- Reason: the server must remain the authentication authority while the
  frontend still needs a convenient current-user projection. The local
  route-entry revalidation rule applies that guidance to this SPA.
- Risk or trade-off: protected route entry requires a backend round trip and
  authentication availability depends on the backend and Redis session store.
- Mitigation: share the session request implementation, keep route guards
  small, test missing, expired, and failed session revalidation, and review
  cookie, CORS, and request-forgery controls per deployment environment.
- Owner: Partner Portal maintainers.
- Review trigger: a change to identity provider, token storage, session store,
  frontend architecture, or machine-to-machine API use.
- Related schema contract: current-user response and handled API error models.
- Related waiver or evidence record: none.

## Reference Architecture Impact

- Reference architecture: none selected.
- Relationship: not applicable.
- Variation summary: none.
- Follow-up needed in the reference architecture: none.

## Decision

The FastAPI backend is the BFF and authentication authority for browser users.

- The backend owns the OIDC exchange, token bundle, logout metadata, and
  authenticated session state.
- OIDC tokens remain in the server-side session and are not stored by the
  browser.
- Browser API calls send the session cookie with credentials included.
- Protected frontend route entry revalidates the current user against the
  backend.
- Missing sessions and revalidation failures fail closed by restarting the
  backend OIDC login flow.
- Zustand may cache the current-user projection for UI state, but cached state
  does not authorize route entry or backend actions.
- Backend authentication, permission, and ownership checks remain authoritative
  for every protected API operation.
- This API does not accept locally signed bearer tokens. Its supported
  authentication scheme is the opaque server-side session cookie established
  by the OIDC authorization-code flow. Any future machine-to-machine bearer
  contract requires a separate decision covering issuer, audience, scopes,
  credential lifecycle, and an accurate OpenAPI security scheme.

This decision does not require a frontend `/login` route. The current protected
route helper redirects directly to the backend OIDC login endpoint.

Acceptance covers the BFF and session-authority boundary. It does not by itself
accept every deployment setting. Secure-cookie enforcement, SameSite and domain
configuration, allowed CORS origins, and request-forgery protection remain
environment and security verification concerns.

## Options Considered

### Option 1: Store OIDC Tokens In The Browser

- Benefits: fewer backend session dependencies.
- Costs: token lifecycle and logout logic move into the SPA.
- Risks: greater token exposure and a more complex browser security boundary.

### Option 2: Trust Hydrated Client State Until An API Rejects It

- Benefits: fewer route-entry requests.
- Costs: the UI can render protected state from a stale session snapshot.
- Risks: client state can be mistaken for current authentication evidence.

### Option 3: Server Session With Route-Entry Revalidation

- Benefits: central token handling, logout, expiry, and current-user authority.
- Costs: a backend request on protected route entry and a Redis dependency.
- Risks: session-store or backend outages prevent authenticated navigation.

Option 3 is selected.

## Consequences

- The browser receives only the session cookie and user-safe response data.
- Login, logout, expiry, and backchannel logout remain backend concerns.
- Protected route tests cover both absent sessions and revalidation failures.
- Frontend components can use Zustand for display state without treating it as
  a security boundary.
- Redis session availability is part of the portal authentication service
  level.

## Baseline Gate Impact

Verification needs to show that protected routes fail closed, backend routes
enforce authentication independently of the SPA, logout removes local session
state, and OIDC tokens are absent from browser-managed storage. Non-local
verification also needs to confirm secure-cookie settings, explicit allowed
origins, and the request-forgery posture for state-changing endpoints.

## Review Triggers

- The portal adopts browser-managed OAuth tokens.
- A non-browser client begins using the same API contract.
- The current-user or route-guard flow changes.
- The session store, cookie policy, or OIDC provider changes.
- The CORS or request-forgery control posture changes.
- Route-entry revalidation creates a measured availability or performance
  problem.

## Links

- [Codebase architecture](../codebase.md)
- [Development conventions](../../repo-guidance/development-conventions.md)
- [`OidcService`](../../../backend/src/app/services/oidc_service.py)
- [Backend session middleware](../../../backend/src/app/core/setup.py)
- [Frontend auth routing](../../../frontend/src/features/auth/auth-routing.ts)
- [Frontend auth store](../../../frontend/src/store/auth-store.ts)
