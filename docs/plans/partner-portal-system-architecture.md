# CanadaLogin Partner Portal Infrastructure Architecture

## Document Status

- Status: Draft
- Date: 2026-05-28
- Purpose: High-level infrastructure handoff for AWS setup

## 1. Infrastructure Summary

CanadaLogin Partner Portal requires a simple web application setup on AWS with separate frontend and backend delivery targets.

- Frontend: static site build deployed to Amazon S3
- Backend: container image pushed to Amazon ECR and deployed to Amazon ECS
- Database: PostgreSQL
- Cache and session store: Redis
- External integrations: CanadaLogin OIDC identity provider, GC Notify, IBM Verify

Note: Amazon ECR is the image registry and Amazon ECS is the container runtime target.

## 2. Target AWS Topology

```mermaid
flowchart LR
    User[End User]
    Browser[Browser]

    subgraph AWS[AWS]
        S3[S3 Frontend Hosting]
        ECR[ECR Backend Image]
        Compute[Amazon ECS]
        PG[(PostgreSQL)]
        Redis[(Redis)]
    end

    subgraph External[External Services]
        OIDC[CanadaLogin OIDC IdP]
        Notify[GC Notify]
        IBM[IBM Verify]
    end

    User --> Browser
    Browser --> S3
    Browser --> Compute
    ECR --> Compute
    Compute --> PG
    Compute --> Redis
    Compute --> OIDC
    Compute --> Notify
    Compute --> IBM
```

## 3. Required Infrastructure Components

### 3.1 Frontend

- Deploy the built frontend as static assets in Amazon S3.
- Serve the frontend over HTTPS.
- The frontend needs to call the backend API endpoint.

### 3.2 Backend

- Build the backend as a container image.
- Push the image to Amazon ECR.
- Deploy the container from ECR into Amazon ECS.
- The backend must have outbound access to PostgreSQL, Redis, CanadaLogin OIDC, GC Notify, and IBM Verify.

### 3.3 Data Services

- PostgreSQL for application data.
- Redis for backend runtime state.

Redis is used by the application for multiple purposes, but the infrastructure requirement is simply that a Redis service is available to the backend.

## 4. External Integrations

- CanadaLogin OIDC IdP: user authentication
- GC Notify: email notifications for invitation flow
- IBM Verify: RP application and client management

These are external dependencies and are not hosted inside AWS as part of this application stack.

## 5. Environment and Network Requirements

- Frontend must be reachable by end users over HTTPS.
- Backend API must be reachable by the frontend over HTTPS.
- Backend must be able to establish outbound connections to:
  - PostgreSQL
  - Redis
  - CanadaLogin OIDC endpoints
  - GC Notify API
  - IBM Verify API

## 6. Minimal Deployment Checklist

- S3 bucket for frontend deployment
- ECR repository for backend image
- ECS service or task for backend runtime
- PostgreSQL instance
- Redis instance
- DNS and TLS for frontend and backend endpoints
- Runtime configuration for external services:
  - CanadaLogin OIDC
  - GC Notify
  - IBM Verify

## 7. Recommendations From Env Samples

Based on `backend/.env.sample` and `frontend/.env.sample`, the infrastructure team should plan configuration in these groups.

### 7.1 Store As Secrets

- `POSTGRES_PASSWORD`
- `SECRET_KEY`
- `SESSION_SECRET_KEY`
- `OIDC_CLIENT_SECRET`
- `IBM_SV_ADMIN_CLIENT_SECRET`
- `GC_NOTIFY_API_KEY`
- `REDIS_SESSION_PASSWORD` if Redis auth is enabled

These should be stored in AWS Secrets Manager or an equivalent secret store, not hardcoded in task definitions or deployment scripts.

### 7.2 Store As Runtime Configuration

- Backend database endpoint values: `POSTGRES_SERVER`, `POSTGRES_PORT`, `POSTGRES_DB`, `POSTGRES_USER`
- Redis endpoint values for session, cache, queue, and rate limiting
- OIDC metadata and client ID values
- IBM Verify base URL and client ID
- GC Notify template IDs and invite expiry settings
- Frontend variables: `VITE_APP_ENVIRONMENT`, `VITE_APP_TITLE`, `VITE_API_BASE_URL`, `VITE_AUTH_POST_LOGIN_PATH`

### 7.3 Production Recommendations

- Set `ENVIRONMENT` to `production` in deployed environments.
- Set `SESSION_COOKIE_SECURE=true` in production so session cookies are only sent over HTTPS.
- Replace `CORS_ORIGINS=["*"]` with the real frontend origin or origins.
- Set `OIDC_POST_LOGIN_REDIRECT` to the real frontend auth-complete URL.
- Set `RP_APPLICATION_INVITE_URL_BASE` to the public frontend invitation URL.
- Set `VITE_API_BASE_URL` to the public backend API origin unless the final setup is strictly same-origin and intentionally relies on browser-origin resolution.

### 7.4 Redis Recommendation

The backend sample exposes separate Redis settings for sessions, cache, queue. Infrastructure can back these with one managed Redis service if desired.
### 7.5 Frontend Routing Recommendation

The frontend sample shows that post-login routing is client-side.

- `VITE_AUTH_POST_LOGIN_PATH` should remain a frontend route such as `/dashboard`.
- `VITE_API_BASE_URL` should point to the backend origin, not the frontend S3 origin.