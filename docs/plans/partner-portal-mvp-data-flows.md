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
        canadalogin["CanadaLogin (OIDC IdP)"]
        verify["IBM Security Verify (RP Registry)"]
        s3["D&R MAU Data (S3)"]
    end

    user --> cdn --> fe
    fe --> be
    be --> pg
    be --> redis
    be --> canadalogin
    be --> verify
    worker --> redis
    worker --> pg
    worker --> verify
    worker --> s3
```

## DFD-1: OIDC Login Via CanadaLogin

All user sign-up, identity verification, passkey registration, and OTP validation are handled entirely by CanadaLogin (the OIDC IdP). The portal only consumes the resulting OIDC authorization code.

```mermaid
sequenceDiagram
    autonumber
    participant U as User Browser
    participant FE as Frontend SPA
    participant BE as Backend API
    participant CL as CanadaLogin (OIDC IdP)
    participant DB as PostgreSQL
    participant R as Redis

    U->>FE: Visit login page
    FE->>BE: GET /api/v1/auth/oidc/login
    BE-->>U: 302 Redirect → CanadaLogin authorization endpoint (PKCE S256)
    Note over U,CL: Sign-up / passkey / OTP entirely on CanadaLogin side
    U->>CL: Authenticate (passkey, OTP, or other CanadaLogin method)
    CL-->>U: 302 Redirect → /api/v1/auth/oidc/callback?code=...
    U->>BE: GET /api/v1/auth/oidc/callback?code=...&state=...
    BE->>CL: Exchange authorization code for tokens (authlib)
    CL-->>BE: id_token, access_token, refresh_token
    BE->>BE: sync_oidc_user() — validate sub + email claims
    alt missing sub or email claim
        BE-->>U: 401 ForbiddenException (access denied)
    else claims valid
        BE->>BE: Map group claims → portal roles (admin / application owners)
        BE->>DB: Upsert User (auth_provider, auth_subject, email, role_ids, last_login_at)
        BE->>BE: regenerate_session_id(request) — prevent session fixation
        BE->>R: Store session (user_uuid, tokens, oidc_logout{sid, sub, issuer, id_token})
        BE->>R: Map OIDC SID → local session_id (for backchannel logout)
        BE-->>U: Set-Cookie app_session (domain=.canada.ca, 8 h max-age, SameSite=lax)
        U->>FE: Continue to onboarding or dashboard
    end
```

Edge cases:
- Missing `sub` claim → 401; missing `email` claim → 401 ForbiddenException.
- Absent group claim → user receives default (non-admin) role.
- PKCE `state` mismatch → authlib raises an error before token exchange.

## DFD-2: Department Selection And Terms Acceptance

These are portal-side post-login onboarding steps. Passkey registration is handled by CanadaLogin and does not appear here.

```mermaid
sequenceDiagram
    autonumber
    participant U as User Browser
    participant FE as Frontend SPA
    participant BE as Backend API
    participant DB as PostgreSQL

    FE->>BE: GET /api/v1/departments
    BE->>DB: Read departments (is_deleted=false, abbreviation IS NOT NULL)
    BE-->>FE: Paginated department list
    U->>FE: Select department
    FE->>BE: PATCH /api/v1/user/me/department {department_id}
    BE->>BE: user_service.set_department_for_user()
    BE->>DB: UPDATE user SET department_id = ?
    BE-->>FE: 200 OK

    U->>FE: Accept Terms & Conditions
    FE->>BE: PATCH /api/v1/user/me/accept-terms
    BE->>BE: user_service.accept_terms()
    BE->>DB: UPDATE user SET accepted_terms_at=now(), terms_version=TERMS_VERSION
    BE->>DB: INSERT AuditLog (target=terms, operation=ACCEPT, user_uuid, created_at)
    BE-->>FE: 200 OK — onboarding complete
```

## DFD-3: RP Application Sync (ARQ Cron Job)

RP application configurations are imported and kept current by a background ARQ cron job. There is no user-initiated workspace setup step.

```mermaid
sequenceDiagram
    autonumber
    participant W as ARQ Worker
    participant V as IBM Security Verify (RP Registry)
    participant DB as PostgreSQL

    Note over W: Cron: every 10 min (minute={0,10,20,30,40,50})<br/>Active window: 06:00–21:00<br/>run_at_startup=true, unique=true, timeout=300 s
    W->>V: Admin API — list_oidc_applications()
    V-->>W: Full list of RP application configs
    loop For each application
        W->>W: Compute config hash — skip if unchanged
        W->>DB: Upsert RPApplication (dnr_app_name, ibm_sv_application_id, config fields)
        W->>DB: INSERT AuditLog (target=rp_application, operation=UPDATE/CREATE)
    end
```

User read path (separate from the sync job):

```mermaid
sequenceDiagram
    autonumber
    participant U as User Browser
    participant FE as Frontend SPA
    participant BE as Backend API
    participant DB as PostgreSQL

    FE->>BE: GET /api/v1/rp-applications/mine
    BE->>DB: Read RPApplication rows for current user
    BE-->>FE: List of RP apps

    U->>FE: Assign department to an RP application
    FE->>BE: PATCH /api/v1/rp-applications/{uuid} {department_id}
    BE->>DB: UPDATE rp_application SET department_id = ?
    BE-->>FE: 200 OK
```

## DFD-4: View Client Credentials

```mermaid
sequenceDiagram
    autonumber
    participant U as User Browser
    participant FE as Frontend SPA
    participant BE as Backend API
    participant C as Casbin Guard
    participant V as IBM Security Verify (RP Registry)
    participant DB as PostgreSQL

    U->>FE: Navigate to client credentials page
    FE->>BE: GET /api/v1/rp-applications/mine/{uuid}/client
    BE->>C: enforce(user, rp_client_secret:read)
    alt unauthorized
        C-->>BE: deny
        BE-->>FE: 403 ErrorResponse
        FE-->>U: Access denied
    else authorized
        BE->>V: get_client_secret(client_id)
        V-->>BE: clientId, clientSecret, clientSecretId
        BE->>DB: INSERT AuditLog (target=rp_application, operation=REVEAL_SECRET, user_uuid, target_uuid)
        BE-->>FE: RPApplicationClientCredentialsRead {clientId, clientSecret, clientSecretId}
        FE-->>U: Display credentials
    end
```

## DFD-5: Rotate Secret (Named, Old Secret Expires In 30 Days)

The user provides a description (name) for the rotation. The frontend computes `rotatedSecretExpiredAt = now + 30 days` (epoch seconds) before sending the request. Secrets are managed entirely in IBM Security Verify — no secret data is written to PostgreSQL.

```mermaid
sequenceDiagram
    autonumber
    participant U as User Browser
    participant FE as Frontend SPA
    participant BE as Backend API
    participant C as Casbin Guard
    participant V as IBM Security Verify (RP Registry)
    participant DB as PostgreSQL

    U->>FE: Provide rotation description (name) and confirm
    FE->>FE: Compute rotatedSecretExpiredAt = now + 30 days (epoch s)
    FE->>BE: POST /api/v1/rp-applications/mine/{uuid}/client/rotated-secrets
    Note right of FE: {description, rotatedSecretExpiredAt}
    BE->>C: enforce(user, rp_client_secret:write)
    alt unauthorized
        C-->>BE: deny
        BE-->>FE: 403 ErrorResponse
    else authorized
        BE->>V: update_client_secret(client_id, {deleteRotatedSecrets:false, description, rotatedSecretExpiredAt})
        Note right of BE: Old secret stays active for 30 days
        V-->>BE: list[RPApplicationClientRotatedSecretRead]
        BE->>DB: INSERT AuditLog (target=rp_application, operation=ROTATE_SECRET, user_uuid, target_uuid)
        BE-->>FE: Rotated secrets list (includes new secret value, secretId, expiredAt)
        FE-->>U: Display copy-once UI with new secret
    end
```

## DFD-6: Regenerate Secret (Immediate Replacement)

Generates a brand-new primary secret immediately. No description or expiry is provided — the service detects the empty payload and records `operation=REGENERATE` in the audit log. The old secret is invalidated immediately.

```mermaid
sequenceDiagram
    autonumber
    participant U as User Browser
    participant FE as Frontend SPA
    participant BE as Backend API
    participant C as Casbin Guard
    participant V as IBM Security Verify (RP Registry)
    participant DB as PostgreSQL

    U->>FE: Confirm destructive regenerate (no description or expiry)
    FE->>BE: POST /api/v1/rp-applications/mine/{uuid}/client/rotate-secret
    Note right of FE: {deleteRotatedSecrets:false, description:"", rotatedSecretExpiredAt:0}
    BE->>C: enforce(user, rp_client_secret:write)
    alt unauthorized
        C-->>BE: deny
        BE-->>FE: 403 ErrorResponse
    else authorized
        BE->>V: update_client_secret(client_id, {deleteRotatedSecrets:false, description:"", rotatedSecretExpiredAt:0})
        Note right of BE: Old primary secret invalidated immediately
        V-->>BE: RPApplicationClientCredentialsRead {clientId, clientSecret, clientSecretId}
        BE->>DB: INSERT AuditLog (target=rp_application, operation=REGENERATE, user_uuid, target_uuid)
        BE-->>FE: New credentials {clientId, clientSecret, clientSecretId}
        FE-->>U: Display copy-once UI with new secret
    end
```

Error path: if IBM Verify call fails, the service raises an upstream-preserving error and emits a structured log for operator recovery. No partial state is written to the database.

## DFD-7: MAU Data Load (ARQ Cron Job)

MAU data is pre-loaded from the D&R S3 store into Redis by a background ARQ job. The API read path (DFD-8) only reads from Redis — it never calls S3 at request time.

```mermaid
sequenceDiagram
    autonumber
    participant W as ARQ Worker
    participant STS as AWS STS
    participant S3 as D&R MAU Data (S3)
    participant R as Redis

    Note over W: Cron: at :55 past each hour<br/>Active window: 06:00–17:00
    W->>R: GET mau:loaded:{yesterday} — skip if already loaded
    alt not yet loaded
        W->>STS: assume_role(AWS_S3_ROLE_ARN, TTL=900 s)
        STS-->>W: Temporary credentials (no static password)
        W->>S3: GET {folder}date={YYYY-MM-DD}/app_login_counts.csv
        alt S3 key not found
            W-->>W: Skip gracefully — no error raised
        else CSV retrieved
            S3-->>W: CSV rows (app_name, date, counts)
            loop For each row
                W->>R: HSET mau:{app_name} {date} {row_json}
            end
            W->>R: SET mau:loaded:{date} "1"
        end
    end
```

## DFD-8: MAU Usage Report Read

The read path is Redis-only. All data was pre-populated by the ARQ load job (DFD-7).

```mermaid
sequenceDiagram
    autonumber
    participant U as User Browser
    participant FE as Frontend SPA
    participant BE as Backend API
    participant C as Casbin Guard
    participant R as Redis

    FE->>BE: GET /api/v1/rp-applications/mine/{uuid}/mau-report?start_date=&end_date=
    BE->>C: enforce(user, mau_report:read)
    alt unauthorized
        C-->>BE: deny
        BE-->>FE: 403 ErrorResponse
    else authorized
        loop For each date in requested range
            BE->>R: HGET mau:{app_name} {date}
            R-->>BE: Cached aggregate row (or null if not yet loaded)
        end
        BE-->>FE: Aggregated JSON (mau_mtd, success_rate, daily_series — nulls for missing dates)
        FE-->>U: Render MAU dashboard
    end
```

Edge cases:
- Redis miss for a date (load job has not run yet, or S3 key absent) → that date returns null; UI renders empty slot.
- Invalid date range → `BadRequestException`.

## DFD-9: Support And FAQ Outbound Links

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

## DFD-10: Authenticated Session Lifecycle (Cross-Cutting)

Sessions are managed by starsessions (Redis-backed). The cookie is `app_session` with `domain=.canada.ca`, `SameSite=lax`, 8-hour max-age, and `rolling=false`.

```mermaid
sequenceDiagram
    autonumber
    participant U as User Browser
    participant FE as Frontend SPA
    participant BE as Backend API
    participant CL as CanadaLogin (OIDC IdP)
    participant R as Redis

    U->>FE: Visit protected route
    FE->>BE: Request to any protected endpoint
    alt no valid session cookie
        BE-->>FE: 401
        FE-->>U: Redirect → GET /api/v1/auth/oidc/login (see DFD-1)
    else valid session
        BE->>R: Load session by session_id (prefix: app.sessions.)
        R-->>BE: Session data (user_uuid, tokens, oidc_logout)
        BE-->>FE: 200 — user payload
    end

    Note over BE,R: Session max-age=8 h, rolling=false<br/>Expiry → 401 → re-auth via DFD-1

    alt User-initiated logout
        FE->>BE: POST /api/v1/auth/oidc/logout
        BE->>R: Delete session from Redis
        BE-->>U: 302 Redirect → CanadaLogin logout endpoint
    else CanadaLogin backchannel logout
        CL->>BE: POST /api/v1/auth/oidc/backchannel-logout {logout_token}
        BE->>R: Look up session_id by OIDC SID
        BE->>R: Delete session from Redis
        BE-->>CL: 200 OK
    end
```

## DFD-11: Audit Log Writes For Secret And Terms Actions

```mermaid
sequenceDiagram
    autonumber
    participant U as User Browser
    participant FE as Frontend SPA
    participant BE as Backend API
    participant C as Casbin Guard
    participant V as IBM Security Verify (RP Registry)
    participant DB as PostgreSQL

    alt accept Terms & Conditions
        FE->>BE: PATCH /api/v1/user/me/accept-terms
        BE->>DB: UPDATE user SET accepted_terms_at=now(), terms_version=TERMS_VERSION
        BE->>DB: INSERT AuditLog (target=terms, operation=ACCEPT, user_uuid)
        BE-->>FE: 200 OK
    else view client credentials
        U->>FE: Navigate to client credentials page
        FE->>BE: GET /api/v1/rp-applications/mine/{uuid}/client
        BE->>C: enforce(user, rp_client_secret:read)
        BE->>V: get_client_secret(client_id)
        V-->>BE: clientId, clientSecret, clientSecretId
        BE->>DB: INSERT AuditLog (target=rp_application, operation=REVEAL_SECRET, user_uuid, target_uuid)
        BE-->>FE: RPApplicationClientCredentialsRead
    else rotate secret with description (old expires in 30 days)
        FE->>BE: POST /api/v1/rp-applications/mine/{uuid}/client/rotated-secrets
        Note right of FE: {description, rotatedSecretExpiredAt=now+30d}
        BE->>C: enforce(user, rp_client_secret:write)
        BE->>V: update_client_secret(client_id, {description, rotatedSecretExpiredAt})
        V-->>BE: list[RPApplicationClientRotatedSecretRead]
        BE->>DB: INSERT AuditLog (target=rp_application, operation=ROTATE_SECRET, user_uuid, target_uuid)
        BE-->>FE: Rotated secrets list (new secret value included)
    else regenerate primary secret immediately
        FE->>BE: POST /api/v1/rp-applications/mine/{uuid}/client/rotate-secret
        Note right of FE: {description:"", rotatedSecretExpiredAt:0}
        BE->>C: enforce(user, rp_client_secret:write)
        BE->>V: update_client_secret(client_id, {description:"", rotatedSecretExpiredAt:0})
        V-->>BE: RPApplicationClientCredentialsRead
        BE->>DB: INSERT AuditLog (target=rp_application, operation=REGENERATE, user_uuid, target_uuid)
        BE-->>FE: New credentials (clientId, clientSecret, clientSecretId)
    end
```

The audit trail is built from the server-side OIDC-authenticated session. Each entry records the authenticated user, the target RP application (where applicable), the action, and the outcome. Secrets themselves are never stored in PostgreSQL — only audit log entries are.

## Threat Modeling Hand-Off Notes

When importing these DFDs into Valentine, treat the following as primary assets and trust crossings:

- **Assets**: user identity (OIDC sub + email), session cookies, client secrets (at-rest in IBM Security Verify), MAU aggregates (in Redis + S3), terms acceptance records, audit log entries.
- **Trust crossings**: Browser → CDN, CDN → API, API → CanadaLogin (OIDC), API → IBM Security Verify (RP Registry), ARQ Worker → IBM Security Verify (RP sync), ARQ Worker → AWS STS → S3 (MAU load).
- **Highest-risk flows**: DFD-5 and DFD-6 (secret material returned over the wire), DFD-1 (OIDC callback code exchange), DFD-7 (IAM role assumption for S3 access).
