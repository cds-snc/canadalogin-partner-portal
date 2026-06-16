# CanadaLogin Partner Portal


Monorepo for the CanadaLogin Partner Portal - a FastAPI backend and Vite + React frontend.


This root README summarizes the repository, quick-start commands, and where to find detailed docs for each part.

## Makefile Usage (Recommended)

This repository provides a top-level `Makefile` to simplify common developer tasks for both backend and frontend. **Use `make` targets instead of running commands directly.**

Backend `make` targets pin `uv` to the repo-root `.venv`, which avoids accidentally creating or using a separate `backend/.venv`.

Key targets:

| Task                | Backend         | Frontend         | Both (composite) |
|---------------------|----------------|------------------|------------------|
| Install deps        | `make install` | `make frontend-install` | `make all-install` |
| Build               | —              | `make frontend-build`   | `make all-build`   |
| Dev server          | —              | `make frontend-dev`     | —                |
| Test                | `make test`    | `make frontend-test`    | `make all-test`    |
| Lint                | `make lint`    | `make frontend-lint`    | `make all-lint`    |
| Format              | `make format`  | `make frontend-format`  | `make all-format`  |
| Typecheck           | `make typecheck` | —                | —                |

Shortcuts: `make bk-*` for backend, `make ft-*` for frontend (e.g., `make bk-test`, `make ft-lint`).

Run `make help` for a full list of available targets.

## Repository layout

- `backend/` — FastAPI application and backend tooling (detailed boilerplate with OIDC, Redis sessions, Casbin, Postgres, ARQ jobs)
  - `src/` — Python package and app code
  - `tests/` — pytest test suite and helpers
  - `docker-compose.yml`, `Dockerfile` — container/dev orchestration
  - `docs/`, `mkdocs.yml` — backend documentation site (rich guides and examples)
- `frontend/` — Vite + React (TypeScript) frontend (TanStack Router/Query, Tailwind, Vitest, Playwright)
  - `src/` — React source, routes, components
  - `public/` — static assets
  - `package.json`, `pnpm-lock.yaml` — frontend tooling and scripts
- `test-results/`, `tests/` — test artifacts and e2e reports

## Backend (FastAPI) — Highlights

- Async FastAPI app with SQLAlchemy 2.0 and Alembic migrations
- Unified `repositories/` data-access layer for both database `FastCRUD` adapters and IBM Security Verify API clients
- Centralized exception handling with a shared `ErrorResponse` envelope and reusable OpenAPI error response docs
- Pydantic v2 models, OIDC via Authlib, Redis-backed server sessions, JWT fallback for tests
- GC Notify-backed RP application developer invitations with app-scoped access for invited users
- Casbin authorization decorators, rate limiting, ARQ background jobs, caching helpers
- Multiple deployment modes: local (uvicorn), staging (gunicorn + uvicorn workers), production (nginx)
- MAU (Monthly Active User) data loading from AWS S3 via IAM role assumption (cross-account ARQ cron job), cached in Redis with query-by-app and date-range support

For full backend docs and configuration, see `backend/README.md` and the site at `backend/docs/`.

### Backend Error Contract

Backend API errors are standardized through `backend/src/app/core/exceptions/handlers.py` and `backend/src/app/core/schemas.py`.

- All handled API errors return `{"error": {"code", "message", "details", "requestId"}}`
- Request validation errors summarize the first validation issue in `error.message` and keep the full validation payload in `error.details`
- IBM Security Verify `400` responses preserve upstream user-facing messages while keeping upstream response payloads in `error.details.responseBody`
- Route-level OpenAPI error documentation should reuse `backend/src/app/core/exceptions/openapi.py:error_responses(...)`

When extending backend behavior, prefer project exceptions from `backend/src/app/core/exceptions/http_exceptions.py` over raw `HTTPException` or `ValueError` in route and service code.

docker compose up --build

Quick local backend start (minimal):

```
# 1. (First time) Setup backend environment
make install

# 2. (Optional) Run backend setup script for environment selection
cd backend && ./setup.py  # choose local/staging/production or run './setup.py local'

# 3. Start backend development server
cd backend && UV_PROJECT_ENVIRONMENT=../.venv uv run uvicorn src.app.main:app --reload --host 127.0.0.1 --port 8000
```

Common backend tasks (via Makefile):

```
# Run backend tests
make test

# Lint backend
make lint

# Format backend
make format

# Typecheck backend
make typecheck

# Run migrations (no Makefile target)
cd backend/src && UV_PROJECT_ENVIRONMENT=../../.venv uv run alembic upgrade head

# Start with docker compose (local)
cd backend && docker compose up --build
```

## Frontend (Vite + React) — Highlights

- TypeScript + Vite, Tailwind CSS, TanStack Router/Query/Table, React Hook Form, Zod
- Dev tooling: Vitest (unit), Playwright (E2E), Storybook, TanStack devtools
- Package management: `pnpm` recommended; Husky + Commitizen + Commitlint configured
- TanStack Router nested-route rule: when you add a child route under an existing page route, the parent must become a layout route that renders `Outlet`, and the old page component should move into an `index.ts` child route. If the URL changes but the old page stays visible, verify the parent route layout before assuming the child route is broken.


Quick local frontend start:

```
# 1. Install frontend dependencies
make frontend-install

# 2. Start frontend dev server
make frontend-dev
```

Common frontend tasks (via Makefile):

```
# Lint frontend
make frontend-lint

# Format frontend
make frontend-format

# Run all frontend tests (unit + e2e)
make frontend-test

# Build frontend for production
make frontend-build

# Preview production build
make frontend-preview
```

## Full stack with Docker

The `backend/docker-compose.yml` can run the backend and required services (Postgres, Redis). The frontend can be built and served by a static server or included in a multi-service compose stack.

Example (from `backend/`):

```
cd backend
docker compose up --build
```

## Configuration & environment

- Backend: create `backend/src/.env` (or copy from examples) and set `ENVIRONMENT`, DB, Redis, OIDC, and session variables.
- Backend invitation flow also requires GC Notify and invite-link settings: `GC_NOTIFY_API_KEY`, `GC_NOTIFY_RP_APPLICATION_INVITE_TEMPLATE_ID`, `GC_NOTIFY_EMAIL_REPLY_TO_ID` (optional), `RP_APPLICATION_INVITE_URL_BASE`, `RP_APPLICATION_INVITATION_EXPIRE_DAYS`, and `OIDC_ACCESS_DENIED_REDIRECT`.
- Frontend: environment variables for API base URLs can be set via Vite's `import.meta.env` or `.env` files in `frontend/`.

Do NOT commit secrets or `.env` files to source control.


## Testing

- **Backend tests:** `make test` (runs all backend tests)
- **Frontend tests:** `make frontend-test` (runs all frontend tests)
- **All tests:** `make all-test` (runs backend and frontend tests)
- **Frontend E2E reports:** Playwright reports are stored under `frontend/playwright-report/`.


## Devtools & utilities

- Frontend includes TanStack devtools, Storybook, and helper components under `frontend/src/components/utils/development-tools`.
- Backend provides management scripts in `backend/scripts/` for different deployment modes.

## Contributing

See the backend contribution and code-of-conduct files in `backend/CONTRIBUTING.md` and `backend/CODE_OF_CONDUCT.md` for guidelines. The frontend also contains development setup steps in `frontend/README.md`.

## Where to find more details

- Backend full docs and guides: `backend/docs/` and `backend/README.md`.
- Frontend detailed README and package list: `frontend/README.md`.

