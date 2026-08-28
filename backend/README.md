# CanadaLogin Partner Portal Backend

FastAPI backend for the CanadaLogin Partner Portal.

## Features

- Async FastAPI + SQLAlchemy 2.0
- PostgreSQL database with Alembic migrations
- Unified `repositories/` data-access layer for database `FastCRUD` adapters and IBM Security Verify clients
- OIDC authentication with Authlib
- S3-backed aggregate MAU ingestion
- Bounded IBM Security Verify integration for RP setup, credentials, and scoped usage
- Redis-backed server-side sessions
- Casbin authorization
- Rate limiting
- ARQ background jobs
- Redis caching

## IBM Security Verify Configuration

The backend uses a server-to-server, client-credentials adapter for the
specific IBM Security Verify operations required by Partner Portal workflows:
discovering or adopting RP applications, applying supported RP configuration,
managing RP client secrets, and reading application-scoped login counts. It is
not a generic Verify administration surface and does not expose broad user,
group, application-catalog, tier, or policy administration.

**This is NOT for end-user login** - user authentication uses the OIDC config above.

```bash
# IBM Security Verify Admin API (required)
IBM_SV_ADMIN_BASE_URL="https://your-tenant.verify.ibm.com"
IBM_SV_ADMIN_CLIENT_ID="your-api-client-id"
IBM_SV_ADMIN_CLIENT_SECRET="your-api-client-secret"
```

Provision the client with only the provider permissions required by these
bounded operations. OIDC establishes the signed-in identity; portal roles and
workspace access are resolved from the portal database on every protected
request.

## Invitation delivery

The portal does not send invitation email and has no GC Notify or other mail
transport dependency. An authorized administrator creates or reissues an
invitation, copies the generated link, and shares it through an approved
channel. `RP_APPLICATION_INVITE_URL_BASE` configures the frontend base used for
that link.

## Setup

```bash
cd backend
UV_PROJECT_ENVIRONMENT=../.venv uv sync --group dev --extra dev
```

If you are working from the repo root, prefer `make bk-install`, `make bk-test`, `make bk-lint`, and `make bk-typecheck`. The top-level `Makefile` pins backend `uv` commands to the repo-root `.venv`.

For local host-run backend development, the app also needs PostgreSQL and Redis running on `localhost`. The repo-root workflow is:

```bash
# Start your local container runtime first if needed.
# macOS example:
colima start

make bk-install
make db-up
make bk-dev
```

`make db-up` starts the `db` and `redis` services from `backend/docker-compose.yml` and publishes them to the host on `localhost:5432` and `localhost:6379`.

OIDC establishes identity only. Upstream group claims and application-owner
metadata do not grant portal authorization. Each protected request resolves
active canonical CL Admin assignments and workspace-scoped partner grants from
the local database; unknown, legacy, mixed, or duplicate active state fails
closed. Use `INITIAL_CL_ADMIN_EMAIL` only during controlled environment setup
to bootstrap the first normalized CL Admin assignment. It creates a new enabled
identity when needed, but fails closed for an existing disabled or deleted user.

## Deterministic local role sessions

The fake role selector is an explicit local-only identity substitute. From the
repository root, seed its stable `local.example` identities and start both apps
with the exact gate using:

```bash
make seed-local-personas
make start-local-personas
```

`start-local-personas` sets `ENVIRONMENT=local`, `AUTH_MODE=local_dev`,
`ENABLE_DEV_ROLE_SELECTOR=true`, and `OIDC_ENABLED=false` for that process. It
also pins post-login, access-denied, and logout redirects to the configured
loopback frontend host so a host-only simulated session is not stranded by an
ambient `.env` redirect. It does not change `.env`, auto-seed application
startup, or enable the adapter in
any shared environment. Partial values or an OIDC/local-dev conflict stop
configuration loading. In ordinary OIDC mode the development route is not
mounted and is absent from OpenAPI.

To remove and recreate only the namespaced fake persona records:

```bash
make reset-local-personas
```

The development API is `GET|POST|DELETE /api/v1/dev/session`. POST accepts only
`{"fixtureId":"<allowlisted-id>"}`; it never accepts a role or user UUID.
Browser mutations must send a loopback Origin allowed by
`DEV_SESSION_ALLOWED_ORIGINS`. An absent Origin is accepted only to support
local command-line and automated-test clients. Keep these settings and fixture
commands on a developer workstation; do not use them against shared data.

## Running

```bash
UV_PROJECT_ENVIRONMENT=../.venv uv run uvicorn src.app.main:app --reload --host 127.0.0.1 --port 8000
```

If you start the backend directly with `uv run uvicorn ...`, make sure PostgreSQL and Redis are already reachable on the host first. From the repo root:

```bash
make db-up
make bk-dev
```

Useful local service helpers from the repo root:

```bash
make db-up
make db-logs
make db-down
```

## Migrations

When authoring Alembic migrations in `backend/src/migrations/versions/`, keep the internal `revision` string at 32 characters or fewer. Prefer short symbolic ids; the filename can stay more descriptive if needed.

The fixed four-role persistence rollout uses the reviewed
`0019_four_role_expand` -> `0020_four_role_backfill` ->
`0021_four_role_constraints` sequence, followed by the additive
`0022_invitation_revocation_actor` and `0023_authorization_im` history and
information-management revisions. Revision 0020 never derives access from
legacy admin flags, role arrays, or workspace memberships. An explicit
`FOUR_ROLE_BACKFILL_MANIFEST` is optional and, when supplied, must keep both
legacy-assignment lists empty; canonical CL Admin and partner access are
established through the bootstrap and role-management flows. The dry-run
reconciliation and optional review-provenance flow is documented in
`backend/src/migrations/README.md`.

## Docker

```bash
docker compose up --build
```

Use `docker compose up -d db redis` when you only want the dependency services for a host-run backend, and `docker compose up --build` when you want the backend itself to run inside Docker too.

## Documentation

See `docs/` for detailed documentation.
