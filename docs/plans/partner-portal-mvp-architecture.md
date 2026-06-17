# Partner Portal MVP — Architecture Overview

## Purpose

This document describes the actual components, services, and relationships that make up the CanadaLogin Partner Portal MVP, as scoped in [partner-portal-mvp.md](partner-portal-mvp.md). It is intended to be regenerated or validated for every build so it stays aligned with the deployed system.

## Scope

Only the components required by the four MVP journeys are included:

- Onboarding & Setup
- Manage Secrets
- Monitor & Usage Reporting
- Support & Troubleshooting

## C4-Style Context Diagram

```mermaid
flowchart LR
    user["Partner Developer<br/>(GC email holder)"]
    pso["PSO Support Operator"]

    subgraph portal["CanadaLogin Partner Portal (MVP)"]
        fe["Frontend SPA<br/>Vite + React + TanStack"]
        be["Backend BFF<br/>FastAPI"]
    end

    oidc["OIDC Identity Provider"]
    verify["IBM Security Verify<br/>(RP ownership + secrets)"]
    notify["Email Delivery<br/>(OTP)"]
    dnr["D&R MAU Pipeline"]
    jira["PSO Jira Intake"]
    gcx["GCExchange / Marketing FAQ"]
    pg[("PostgreSQL")]
    redis[("Redis<br/>sessions + cache")]

    user --> fe
    fe --> be
    be --> oidc
    be --> verify
    be --> notify
    be --> dnr
    be --> pg
    be --> redis
    fe -.link.-> jira
    fe -.link.-> gcx
    pso --> jira
```

## Container Diagram

```mermaid
flowchart TB
    subgraph browser["Browser"]
        spa["React SPA<br/>TanStack Router/Query<br/>Zustand auth store<br/>React Hook Form + Zod<br/>GCDS components"]
    end

    subgraph api["Backend Service (FastAPI)"]
        routes["api/v1 routers<br/>auth/session, profile, rp-apps,<br/>secrets, usage, health"]
        mw["middleware<br/>session, CORS, error envelope"]
        services["services<br/>OIDC session, profile sync, secret,<br/>usage, verify integration"]
        repos["repositories<br/>FastCRUD adapters,<br/>IBM SV client"]
        models["SQLAlchemy 2.0 models"]
        workers["ARQ workers<br/>(async tasks)"]
        casbin["Casbin policy guards"]
    end

    pg[("PostgreSQL")]
    redis[("Redis")]
    verify["IBM Security Verify API"]
    oidc["OIDC Provider"]
    notify["Email/OTP Provider"]
    dnr["D&R MAU Pipeline"]

    spa -- HTTPS/JSON --> routes
    routes --> mw
    routes --> casbin
    routes --> services
    services --> repos
    repos --> models
    models --> pg
    services --> redis
    workers --> redis
    services --> verify
    services --> oidc
    services --> notify
    services --> dnr
```

## Component Responsibilities

### Frontend (Vite + React)

| Component | Responsibility |
|---|---|
| TanStack Router routes | URL-driven navigation, route guards for auth + onboarding completion |
| Zustand auth store | Holds current session state and onboarding flags |
| React Query | Data fetching, caching, and mutation for backend APIs |
| React Hook Form + Zod | Sign-up forms, department selection, secret rotation forms |
| GCDS components | Accessible, bilingual UI primitives |
| Feature folders | `auth/`, `workspace-profile/`, `secrets/`, `usage/`, `support/` |

### Backend (FastAPI)

| Layer | Responsibility |
|---|---|
| `api/v1` routers | HTTP surface for auth, workspace profile, RP apps, secrets, usage, health |
| Middleware | Session cookie handling (Redis-backed), CORS, shared error envelope |
| Services | Business logic for onboarding, Verify owner sync, secret lifecycle, MAU aggregation |
| Repositories | FastCRUD adapters over SQLAlchemy and IBM Security Verify HTTP client |
| Models | User, Department, WorkspaceProfile, RpApplication, SecretRotation, TermsAcceptance |
| Casbin guards | Role-based authorization for developer view / edit-rotate operations |
| ARQ workers | Async jobs (Verify sync, OTP send, MAU refresh) |

### Backend As BFF

The backend is the browser-facing BFF for the portal SPA, not a generic public API. It owns the browser session, turns OIDC identity claims into the portal user context, and shapes Verify and MAU data into frontend-ready responses.

The BFF layer is responsible for:

- OIDC login and callback handling for browser users
- Redis-backed session lifecycle and current-user resolution
- Aggregating IBM Security Verify, department, and usage data behind one browser contract
- Keeping the SPA from calling external identity systems directly
- Enforcing access control before any browser-visible mutation or secret operation

The browser only receives an opaque session cookie. The cookie value is the Redis session identifier, not the OIDC token itself, and the backend regenerates that session identifier after the OIDC callback. The server-side session then holds the portal identity context, including the mapped `user_uuid`, the OIDC token bundle returned from the provider, and logout hints such as the `id_token` and `sid` used to complete single sign-out.

That means:

- The session cookie is the browser's login state; the SPA uses it on every request, but it never needs to read or store OIDC tokens directly.
- The user token state lives in the backend session, where the BFF can exchange it for user context, build logout redirects, and clear it on sign-out.
- Frontend requests stay same-origin and session-based, which keeps the portal contract simple while still preserving OIDC claims for server-side authorization and logout handling.

### Data Stores

| Store | Use |
|---|---|
| PostgreSQL | Persistent state: users, departments, workspace profile, RP app associations, secret rotation history, terms acceptance |
| Redis | Session store, rate limit counters, ARQ queue, MAU short-term cache |

## Deployment View

```mermaid
flowchart LR
    cdn["CDN / Edge"] --> fe_host["Frontend Static Host<br/>(built SPA)"]
    fe_host --> api_lb["API Load Balancer"]
    api_lb --> api1["FastAPI instance"]
    api_lb --> api2["FastAPI instance"]
    api1 --> pg[("PostgreSQL")]
    api2 --> pg
    api1 --> redis[("Redis")]
    api2 --> redis
    api1 --> verify["IBM Security Verify"]
    api1 --> oidc["OIDC Provider"]
    api1 --> notify["Email Provider"]
    api1 --> dnr["D&R Pipeline"]
    worker["ARQ worker"] --> redis
    worker --> pg
    worker --> verify
    worker --> notify
```

## Cross-Cutting Concerns

- **AuthN**: OIDC sign-in, server-side session in Redis, passkey second factor, email OTP for first-time verification.
- **AuthZ**: Casbin policies enforce developer view vs edit-rotate on secret operations; workspace profile is scoped to the owning user.
- **Session timeout**: Reviewed policy applied by session middleware; both idle and absolute expiry to be confirmed (see PRD open questions).
- **Observability**: structlog-based structured logs; metrics for sign-up funnel, secret operations, MAU fetches; health and readiness endpoints.
- **Error handling**: Shared `ErrorResponse` envelope from `core/exceptions` registered via the central exception handler.
- **Accessibility**: GCDS components and WCAG 2.1 AA conformance.
- **Internationalization**: i18next on the frontend, bilingual labels for department and onboarding copy.

## Build-Time Outputs

For every build, this document should be regenerated alongside:

- [partner-portal-mvp-data-flows.md](partner-portal-mvp-data-flows.md)
- [partner-portal-mvp-dependencies.md](partner-portal-mvp-dependencies.md)
