# Partner Portal MVP — Data Flow Diagrams

## Purpose

This document describes how data moves through the CanadaLogin Partner Portal MVP end-to-end, including happy paths, async processes, and error paths. Diagrams are authored in Mermaid so they can be exported and reused by the CDS Valentine threat modeling tool.

## Trust Boundaries

```mermaid
flowchart LR
    subgraph public["Public Internet (untrusted)"]
        user["Partner Developer Browser"]
    end

    subgraph edge["Edge / CDN (semi-trusted)"]
        cdn["CDN + WAF"]
    end

    subgraph app["Application Tier (trusted)"]
        fe["Frontend SPA"]
        be["FastAPI Backend"]
        worker["ARQ Workers"]
    end

    subgraph data["Data Tier (trusted, restricted)"]
        pg[("PostgreSQL")]
        redis[("Redis")]
    end

    subgraph external["External Services (trusted by contract)"]
        oidc["OIDC Provider"]
        verify["IBM Security Verify"]
        notify["Email/OTP Provider"]
        dnr["D&R MAU Pipeline"]
    end

    user --> cdn --> fe
    fe --> be
    be --> pg
    be --> redis
    be --> oidc
    be --> verify
    be --> notify
    be --> dnr
    worker --> redis
    worker --> pg
    worker --> verify
    worker --> notify
```

## DFD-1: Sign-Up And Email OTP Validation

```mermaid
sequenceDiagram
    autonumber
    participant U as User Browser
    participant FE as Frontend SPA
    participant BE as Backend API
    participant DB as PostgreSQL
    participant R as Redis
    participant N as Email/OTP Provider

    U->>FE: Open sign-up page
    FE->>BE: POST /api/v1/auth/signup {gc_email, password}
    BE->>BE: Validate GC email domain
    BE->>BE: Validate password complexity
    alt invalid input
        BE-->>FE: 400 ErrorResponse (BadRequestException)
        FE-->>U: Show field errors
    else valid
        BE->>DB: Insert User (status=pending_email)
        BE->>R: Store OTP hash with TTL
        BE->>N: Send OTP email
        N-->>BE: Delivery accepted
        BE-->>FE: 202 Accepted
        U->>FE: Enter OTP
        FE->>BE: POST /api/v1/auth/verify-otp {otp}
        BE->>R: Compare + consume OTP
        alt OTP invalid/expired
            BE-->>FE: 400 ErrorResponse
        else OTP valid
            BE->>DB: Update User status=email_verified
            BE-->>FE: 200 OK, continue to passkey step
        end
    end
```

Edge cases:
- OTP retries are rate-limited via Redis counters.
- Email delivery failures from the provider raise a `BadGatewayException` and surface a retry CTA to the user.

## DFD-2: Passkey Registration, Department, And Terms

```mermaid
sequenceDiagram
    autonumber
    participant U as User Browser
    participant FE as Frontend SPA
    participant BE as Backend API
    participant DB as PostgreSQL
    participant V as IBM Security Verify

    FE->>BE: POST /api/v1/auth/passkey/register-options
    BE-->>FE: WebAuthn challenge
    U->>FE: Authenticator ceremony
    FE->>BE: POST /api/v1/auth/passkey/register {attestation}
    BE->>BE: Verify attestation
    BE->>DB: Persist passkey credential
    BE-->>FE: 200 OK

    FE->>BE: GET /api/v1/departments
    BE->>DB: Read departments
    BE-->>FE: List
    U->>FE: Select department
    FE->>BE: PATCH /api/v1/users/me {department_id}
    BE->>DB: Update user.department_id
    BE-->>FE: 200 OK

    U->>FE: Accept Terms & Conditions
    FE->>BE: POST /api/v1/users/me/terms-acceptance
    BE->>DB: Insert TermsAcceptance(ts, version)
    BE-->>FE: 200 OK, onboarding ready for workspace setup
```

## DFD-3: Workspace Profile Setup And RP Import From IBM Security Verify

```mermaid
sequenceDiagram
    autonumber
    participant U as User Browser
    participant FE as Frontend SPA
    participant BE as Backend API
    participant V as IBM Security Verify
    participant DB as PostgreSQL
    participant W as ARQ Worker

    FE->>BE: POST /api/v1/workspace-profile/setup
    BE->>V: PATCH application(s) owner = user.email (source of truth)
    alt Verify error
        V-->>BE: 4xx / 5xx
        BE-->>FE: ErrorResponse (upstream message preserved)
    else success
        V-->>BE: 200 OK
        BE->>W: Enqueue RpImportJob(user_email)
        BE-->>FE: 202 Accepted (importing)
    end

    W->>V: GET applications?owner_email=user.email
    V-->>W: RP applications list (rp_ids)
    W->>DB: Upsert RpApplication rows linked to user
    W-->>BE: Job complete (status in Redis)

    U->>FE: Poll status
    FE->>BE: GET /api/v1/rp-applications/mine
    BE->>DB: Read RP apps for current user
    BE-->>FE: List of RP apps (unassigned department)

    U->>FE: Assign department to each RP
    FE->>BE: PATCH /api/v1/rp-applications/{uuid} {department_id}
    BE->>DB: Update RP app department
    BE-->>FE: 200 OK
```

Error paths:
- If no RP applications are returned for the user's verified email, the worker records an empty result and the UI shows an explicit empty state (see PRD open question 4).
- Stale Verify ownership data results in a partial import; the user can retry from the UI.

## DFD-4: View Current Secret

```mermaid
sequenceDiagram
    autonumber
    participant U as User Browser
    participant FE as Frontend SPA
    participant BE as Backend API
    participant C as Casbin Guard
    participant V as IBM Security Verify

    FE->>BE: GET /api/v1/rp-applications/{uuid}/secret
    BE->>C: enforce(user, "secret:view")
    alt unauthorized
        C-->>BE: deny
        BE-->>FE: 403 ErrorResponse
    else authorized
        BE->>V: GET application/{rp_id}/credentials (metadata only)
        V-->>BE: Client ID, masked secret metadata
        BE-->>FE: View payload (no plaintext secret value)
    end
```

## DFD-5: Rotate Secret With Old-Secret Expiry

```mermaid
sequenceDiagram
    autonumber
    participant U as User Browser
    participant FE as Frontend SPA
    participant BE as Backend API
    participant C as Casbin Guard
    participant V as IBM Security Verify
    participant DB as PostgreSQL

    U->>FE: Submit rotate {expires_at}
    FE->>BE: POST /api/v1/rp-applications/{uuid}/secret/rotate {expires_at}
    BE->>C: enforce(user, "secret:rotate")
    BE->>BE: Validate expires_at within allowed window
    alt invalid window
        BE-->>FE: 400 ErrorResponse
    else valid
        BE->>V: POST rotation (new secret, old secret expires_at)
        V-->>BE: New secret value + rotation id
        BE->>DB: Insert SecretRotation(rp_id, rotation_id, expires_at)
        BE-->>FE: 200 OK (one-time secret value)
        FE-->>U: Display copy-once UI
    end
```

## DFD-6: Generate New Secret (Immediate Replacement)

```mermaid
sequenceDiagram
    autonumber
    participant U as User Browser
    participant FE as Frontend SPA
    participant BE as Backend API
    participant C as Casbin Guard
    participant V as IBM Security Verify
    participant DB as PostgreSQL

    U->>FE: Confirm destructive replace
    FE->>BE: POST /api/v1/rp-applications/{uuid}/secret/regenerate
    BE->>C: enforce(user, "secret:rotate")
    BE->>V: DELETE current secret
    BE->>V: POST new secret
    V-->>BE: New secret value
    BE->>DB: Insert SecretRotation(rp_id, kind="regenerate")
    BE-->>FE: 200 OK (one-time secret value)
```

Error path: if `DELETE` succeeds but `POST` fails, the service raises an upstream-preserving error and emits a structured log with rotation id for operator recovery.

## DFD-7: MAU Dashboard Read

```mermaid
sequenceDiagram
    autonumber
    participant U as User Browser
    participant FE as Frontend SPA
    participant BE as Backend API
    participant R as Redis (cache)
    participant DNR as D&R MAU Pipeline

    FE->>BE: GET /api/v1/rp-applications/{uuid}/usage?month=YYYY-MM
    BE->>R: GET cache(rp_id, month)
    alt cache hit
        R-->>BE: cached aggregates
    else cache miss
        BE->>DNR: Query MAU aggregates for rp_id, month
        DNR-->>BE: {mau_mtd, success_rate, active_users_mtd, daily_series?}
        BE->>R: SET cache with TTL
    end
    BE-->>FE: Aggregates JSON
    FE-->>U: Render dashboard (optional line chart)
```

Edge cases:
- D&R pipeline unavailable → `ServiceUnavailableException`, UI shows degraded state with last cached values when present.
- Invalid month window → `BadRequestException`.

## DFD-8: Support And FAQ Outbound Links

```mermaid
sequenceDiagram
    autonumber
    participant U as User Browser
    participant FE as Frontend SPA
    participant JIRA as PSO Jira Intake
    participant GCX as GCExchange/Marketing

    U->>FE: Click Submit Support Request
    FE-->>U: window.open(JIRA_URL, _blank)
    U->>JIRA: Fill and submit form

    U->>FE: Click View FAQs
    FE-->>U: window.open(GCX_URL, _blank)
    U->>GCX: Browse FAQ content
```

No portal data crosses to these surfaces beyond the user's own browser navigation.

## DFD-9: Authenticated Session Lifecycle (Cross-Cutting)

```mermaid
sequenceDiagram
    autonumber
    participant U as User Browser
    participant FE as Frontend SPA
    participant BE as Backend API
    participant O as OIDC Provider
    participant R as Redis

    U->>FE: Visit protected route
    FE->>BE: GET /api/v1/auth/session
    alt no session
        BE-->>FE: 401
        FE->>O: Redirect to OIDC login
        O-->>FE: Callback with code
        FE->>BE: GET /api/v1/auth/callback?code
        BE->>O: Exchange code for tokens
        BE->>R: Create session (id, user_id, ttl)
        BE-->>FE: Set-Cookie session_id
    else valid session
        BE->>R: Touch session (sliding window)
        BE-->>FE: 200 user payload
    end

    Note over BE,R: Idle + absolute timeouts enforced<br/>Session purged on expiry → 401 → re-auth
```

## Threat Modeling Hand-Off Notes

When importing these DFDs into Valentine, treat the following as primary assets and trust crossings:

- **Assets**: user identity, passkey credentials, OTP codes, session cookies, client secrets, MAU aggregates, terms acceptance records.
- **Trust crossings**: Browser → CDN, CDN → API, API → IBM Security Verify, API → D&R pipeline, API → Email provider, API → OIDC.
- **Highest-risk flows**: DFD-5 and DFD-6 (secret material handling) and DFD-3 (ownership mutation in Verify).
