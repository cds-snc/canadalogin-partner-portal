<h1 align="center">CanadaLogin Partner Portal - Backend</h1>

FastAPI backend for the CanadaLogin Partner Portal.

## Features

- Async FastAPI + SQLAlchemy 2.0
- PostgreSQL database with Alembic migrations
- Unified `repositories/` data-access layer for database `FastCRUD` adapters and IBM Security Verify clients
- OIDC authentication with Authlib
- GC Notify-backed RP application developer invitations
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

## RP Application Developer Invitations

The backend supports inviting external developers to work on a single RP application without making them workspace members.

Current v1 behavior:

- a `workspace_admin` can invite any email address to a specific RP application
- the invitation email is sent through GC Notify
- an unknown OIDC user is only auto-created if their email has an active invitation
- unknown and uninvited OIDC users are redirected to `/access-denied` and do not get a backend session
- invited developers can accept the invitation and then view and edit RP application details only
- invited developers do not get workspace membership or general workspace access
- there is currently no workspace-admin frontend screen for creating invitations; invitation creation is backend API-only for now

### Required configuration

```bash
# OIDC deny redirect for blocked sign-ins
OIDC_ACCESS_DENIED_REDIRECT="/access-denied"

# GC Notify
GC_NOTIFY_BASE_URL="https://api.notification.canada.ca"
GC_NOTIFY_API_KEY="your-gc-notify-api-key"
GC_NOTIFY_RP_APPLICATION_INVITE_TEMPLATE_ID="your-template-id"
GC_NOTIFY_EMAIL_REPLY_TO_ID="optional-reply-to-id"

# Frontend URL used in invite emails
RP_APPLICATION_INVITE_URL_BASE="http://localhost:3000/invitations/rp-applications"
RP_APPLICATION_INVITATION_EXPIRE_DAYS=7
```

### API surface

- `POST /api/v1/workspaces/{workspace_uuid}/applications/{rp_application_uuid}/developers/invite`
- `POST /api/v1/rp-application-developer-invitations/accept`
- `GET /api/v1/rp-applications/mine`
- `GET /api/v1/rp-applications/mine/{rp_application_uuid}`
- `PATCH /api/v1/rp-applications/mine/{rp_application_uuid}`

### How to use it

1. Sign in as a workspace admin.
2. Create the invitation through the backend API because there is not yet a workspace-admin UI for this action.
3. The developer signs in through OIDC with the same email address.
4. The developer opens the emailed invite link and accepts the invitation.
5. The frontend redirects them to `/rp-applications/mine/{rpApplicationUuid}` where they can review and update RP application details.

Example invite request:

```bash
curl -X POST \
	"http://localhost:8000/api/v1/workspaces/{workspace_uuid}/applications/{rp_application_uuid}/developers/invite" \
	-H "Content-Type: application/json" \
	-H "Cookie: your-session-cookie" \
	-d '{"email":"developer@example.com"}'
```

Replace `{workspace_uuid}` and `{rp_application_uuid}` with the target workspace and RP application UUIDs for the invitation.

If the signed-in email is neither an existing user nor an invited email, the backend refuses session creation and redirects the user to `/access-denied`.

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

When authoring Alembic migrations in `backend/src/migrations/versions/`, keep the internal `revision` string at 32 characters or fewer. Prefer short symbolic ids such as `0005_rp_app_dev_invites`; the filename can stay more descriptive if needed.

## Docker

```bash
docker compose up --build
```

## Documentation

See `docs/` for detailed documentation.
