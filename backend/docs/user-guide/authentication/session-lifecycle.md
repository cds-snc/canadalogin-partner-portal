# Authenticated Session Lifecycle

This guide describes how the Partner Portal creates, validates, and invalidates authenticated browser sessions. It is the canonical design reference for the OIDC services, Redis-backed Starsessions store, PostgreSQL audit trail, and authentication console events.

## Trust Boundaries And Stored Data

| Boundary | Responsibility | Data retained |
| --- | --- | --- |
| Browser | Sends the opaque `app_session` cookie over configured cookie scope | Session identifier only |
| Frontend SPA | Starts OIDC login and revalidates server state on protected route entry | Transient user state only |
| FastAPI backend | Exchanges OIDC code, synchronizes the portal user, and authorizes requests | Request-scoped session access |
| OIDC identity provider | Authenticates users and sends signed backchannel logout tokens | Identity-provider session state |
| Redis | Stores the server-side Starsessions record | `user_uuid`, OIDC tokens, and logout metadata |
| PostgreSQL | Stores portal users and durable audit records | Authentication event metadata |

Tokens, ID tokens, opaque cookies, local session IDs, OIDC `sid` values, and raw logout tokens must never be written to the audit table or application console logs.

## Successful Login

The frontend directs a user to `GET /api/v1/auth/oidc/login`. The backend uses the authorization-code flow and returns the browser to the configured post-login URL only after it has synchronized the portal user and created the server-side session.

```mermaid
sequenceDiagram
    autonumber
    participant B as Browser
    participant FE as Frontend SPA
    participant BE as FastAPI Backend
    participant IDP as OIDC Identity Provider
    participant R as Redis Session Store
    participant DB as PostgreSQL

    B->>FE: Select sign in
    FE->>BE: GET /auth/oidc/login
    BE-->>B: Redirect to OIDC authorization endpoint
    B->>IDP: Authenticate
    IDP-->>B: Redirect to /auth/oidc/callback with code and state
    B->>BE: GET /auth/oidc/callback
    BE->>IDP: Exchange authorization code
    IDP-->>BE: Claims and tokens
    BE->>DB: Synchronize portal user and roles
    BE->>BE: Regenerate local session ID
    BE->>R: Store user UUID, tokens, and logout metadata
    BE->>DB: Insert audit_log LOGIN event
    BE->>BE: Emit authentication.login with user UUID
    BE-->>B: Set opaque app_session cookie and redirect to SPA
```

A callback denied by portal access rules clears the transient session and redirects to the configured access-denied page. It does not produce a successful `LOGIN` event.

## Session Validation

Protected frontend routes call `revalidateCurrentUser()` before relying on cached Zustand state. The request reaches `get_current_user()`, which resolves an active portal user from the server-side session first. A bearer token is only a fallback when no valid session user is present. When revalidation fails, the frontend redirects the browser to OIDC login rather than trusting cached client state.

```mermaid
sequenceDiagram
    participant FE as Frontend Route Guard
    participant BE as FastAPI Backend
    participant R as Redis Session Store
    participant DB as PostgreSQL

    FE->>BE: GET /api/v1/user/me/
    BE->>R: Load session using opaque cookie identifier
    alt Session contains user UUID
        BE->>DB: Read active portal user
        DB-->>BE: User
        BE-->>FE: Authenticated user
    else Missing, expired, or invalid session
        BE-->>FE: Authentication failure
        FE->>FE: Clear transient state and redirect to OIDC login
    end
```

Sessions have a fixed lifetime unless `SESSION_ROLLING` is enabled. The relevant OIDC, cookie, and Redis settings are documented in [Configuration](../../getting-started/configuration.md).

## User-Initiated Logout

The frontend clears its transient auth state before navigating to `GET /api/v1/logout`; API clients can also use `POST /api/v1/logout`. The backend captures the authenticated user identity before clearing the session, removes the server-side record, records the transition, and returns or redirects to the OIDC end-session endpoint when configured.

```mermaid
sequenceDiagram
    participant B as Browser
    participant FE as Frontend SPA
    participant BE as FastAPI Backend
    participant R as Redis Session Store
    participant DB as PostgreSQL
    participant IDP as OIDC Identity Provider

    B->>FE: Select sign out
    FE->>FE: Reset transient auth state
    FE->>BE: GET or POST /logout
    BE->>BE: Capture session user UUID
    BE->>R: Remove local session
    BE->>DB: Read portal user
    BE->>DB: Insert audit_log LOGOUT event
    BE->>BE: Emit authentication.logout with user UUID
    alt OIDC end-session endpoint is available
        BE-->>B: Redirect to identity provider end-session endpoint
        B->>IDP: Complete provider logout
    else No end-session endpoint
        BE-->>B: Redirect to configured post-logout URL
    end
```

A logout request without a session remains idempotent: it clears local client/server session state but does not create a user-attributed logout event.

## Identity-Provider Backchannel Logout

The identity provider can end a portal session without a browser request by posting a signed logout token to `POST /api/v1/auth/oidc/backchannel-logout`. The backend validates issuer, audience, backchannel event, nonce absence, and `sid` before it reads and removes the matching local session.

```mermaid
sequenceDiagram
    participant IDP as OIDC Identity Provider
    participant BE as FastAPI Backend
    participant R as Redis Session Store
    participant DB as PostgreSQL

    IDP->>BE: POST backchannel-logout with signed logout token
    BE->>IDP: Load metadata and JWKS, validate token
    BE->>R: Read local session by validated sid
    alt Local session exists
        R-->>BE: Stored user UUID
        BE->>R: Remove local session
        BE->>DB: Read portal user and insert IDP_LOGOUT audit event
        BE->>BE: Emit authentication.idp_logout with user UUID
    else Session expired or already removed
        BE->>R: Remove is idempotent
        BE->>DB: Insert system-attributed IDP_LOGOUT audit event
        BE->>BE: Emit authentication.idp_logout without a user UUID
    end
    BE-->>IDP: Backchannel logout processed
```

Invalid logout tokens do not remove a local session and do not create an authentication event.

## Authentication State Model

```mermaid
stateDiagram-v2
    [*] --> Anonymous
    Anonymous --> OIDC_Authorization: Start login
    OIDC_Authorization --> Authenticated: Valid callback, user sync, session creation
    OIDC_Authorization --> Access_Denied: Denied callback
    Access_Denied --> Anonymous
    Authenticated --> Authenticated: Route revalidation succeeds
    Authenticated --> User_Logged_Out: User logout
    Authenticated --> IdP_Invalidated: Valid backchannel logout
    Authenticated --> Anonymous: Session expires or is unavailable
    User_Logged_Out --> Anonymous
    IdP_Invalidated --> Anonymous
```

## Audit And Console Events

Each completed local state transition writes one immutable `audit_log` record and one corresponding `INFO` console event.

| Transition | Audit target and operation | Console event | Attribution |
| --- | --- | --- | --- |
| Successful OIDC callback | `authentication` / `LOGIN` | `authentication.login` | Portal user UUID |
| User-initiated logout | `authentication` / `LOGOUT` | `authentication.logout` | Portal user UUID |
| Valid backchannel logout | `authentication` / `IDP_LOGOUT` | `authentication.idp_logout` | Portal user UUID when the local session remains; otherwise system audit identity and no console user UUID |

Console events include only the stable event name and `user_uuid` when available. Audit descriptions intentionally use metadata-only text. Neither output is a source of credentials or session material.

## Operational Notes

- The session cookie domain must match the browser host. In integration tests using a `testserver` host, set `SESSION_COOKIE_DOMAIN` to `None` so the cookie round-trips.
- Register `OIDC_REDIRECT_URI` exactly with the identity provider to avoid callback `redirect_uri` mismatches.
- Backchannel logout relies on the validated OIDC `sid` being used to locate the local session. A missing local record is expected after expiry or an earlier logout and is handled as an idempotent system event.
