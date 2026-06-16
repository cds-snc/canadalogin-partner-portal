<h1 align="center">CanadaLogin Partner Portal - Backend</h1>

FastAPI backend for the CanadaLogin Partner Portal.

## Features

- Async FastAPI + SQLAlchemy 2.0
- PostgreSQL database with Alembic migrations
- Unified `repositories/` data-access layer for database `FastCRUD` adapters and IBM Security Verify clients
- OIDC authentication with Authlib
- GC Notify integration
- AWS S3 file service
- IBM Security Verify integration (ADMIN APIs)
- Redis-backed server-side sessions
- Casbin authorization
- Rate limiting
- ARQ background jobs
- Redis caching

## IBM Security Verify Configuration

The backend integrates with IBM Security Verify for **admin API operations** (server-to-server, client credentials flow). This is used for managing applications, users, and groups programmatically.

**This is NOT for end-user login** - user authentication uses the OIDC config above.

```bash
# IBM Security Verify Admin API (required)
IBM_SV_ADMIN_BASE_URL="https://your-tenant.verify.ibm.com"
IBM_SV_ADMIN_CLIENT_ID="your-api-client-id"
IBM_SV_ADMIN_CLIENT_SECRET="your-api-client-secret"
IBM_SV_ADMIN_SCOPES="openid profile email readUsers manageUsers"
```

The admin client uses client credentials flow for managing applications, users, and groups. The user client uses access tokens from user sessions for self-service operations (profile, MFA authenticators).

## Setup

```bash
cd backend
UV_PROJECT_ENVIRONMENT=../.venv uv sync --group dev --extra dev
```

If you are working from the repo root, prefer `make bk-install`, `make bk-test`, `make bk-lint`, and `make bk-typecheck`. The top-level `Makefile` pins backend `uv` commands to the repo-root `.venv`.

## Running

```bash
UV_PROJECT_ENVIRONMENT=../.venv uv run uvicorn src.app.main:app --reload --host 127.0.0.1 --port 8000
```

## Migrations

When authoring Alembic migrations in `backend/src/migrations/versions/`, keep the internal `revision` string at 32 characters or fewer. Prefer short symbolic ids; the filename can stay more descriptive if needed.

## Docker

```bash
docker compose up --build
```

## Documentation

See `docs/` for detailed documentation.
