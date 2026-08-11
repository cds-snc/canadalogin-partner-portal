# CanadaLogin Partner Portal


Monorepo for the CanadaLogin Partner Portal - a FastAPI backend and Vite + React frontend.


This root README summarizes the repository, quick-start commands, and where to
find detailed docs for each part. Start with the
[documentation index](docs/README.md) for current solution architecture,
architecture decisions, and development conventions.

## Makefile Usage (Recommended)

This repository provides a top-level `Makefile` to simplify common developer tasks for both backend and frontend. **Use `make` targets instead of running commands directly.**

Backend `make` targets pin `uv` to the repo-root `.venv`, which avoids accidentally creating or using a separate `backend/.venv`.
They also default `UV_CACHE_DIR` to a writable local path so sandboxed shells do not fail on `~/.cache/uv` permissions.

For local host-run backend development, start your local container runtime first, for example `colima start` on macOS or Docker Desktop. The backend expects PostgreSQL on `localhost:5432` and Redis on `localhost:6379`; `make dev`, `make bk-dev`, and `make start-dev` now bring those dependency services up and apply migrations automatically before launching the app.

Key targets:

| Task | Backend | Frontend | Composite |
|---|---|---|---|
| Install dependencies | `make install` | `make frontend-install` | `make all-install` |
| Start Postgres and Redis | `make db-up` | — | — |
| Reset local DB and reseed local access | `make db-reset-local` | — | — |
| Build | — | `make frontend-build` | `make all-build` (frontend only) |
| Development server | `make dev` or `make bk-dev` | `make frontend-dev` | `make start-dev` |
| Test | `make test` | `make frontend-test` (unit) | `make all-test` (backend + frontend unit) |
| Lint | `make lint` | `make frontend-lint` | `make all-lint` |
| Autofix or format | `make format` (Ruff autofix) | `make frontend-format` | `make all-format` |
| Typecheck | `make typecheck` | Included in frontend build | — |

Shortcuts: `make bk-*` for backend, `make ft-*` for frontend (e.g., `make bk-test`, `make ft-lint`).

Common local service helpers: `make db-up`, `make db-logs`, `make db-down`, and `make db-reset-local`.

Run `make help` for a full list of available targets.

## Repository layout

- `backend/` — FastAPI application and backend tooling (detailed boilerplate with OIDC, Redis sessions, Casbin, Postgres, ARQ jobs)
  - `src/` — Python package and app code
  - `tests/` — pytest test suite and helpers
  - `docker-compose.yml`, `Dockerfile` — container/dev orchestration
  - `docs/`, `mkdocs.yml` — inherited backend reference material; validate it
    against the current solution docs and code
- `frontend/` — Vite + React (TypeScript) frontend (TanStack Router/Query, Tailwind, Vitest, Playwright)
  - `src/` — React source, routes, components
  - `public/` — static assets
  - `package.json`, `pnpm-lock.yaml` — frontend tooling and scripts
- `backend/tests/` — backend pytest suite
- `frontend/tests/unit/`, `frontend/e2e/` — frontend unit and browser tests

## Backend (FastAPI) — Highlights

- Async FastAPI app with SQLAlchemy 2.0 and Alembic migrations
- Unified `repositories/` data-access layer for both database `FastCRUD` adapters and IBM Security Verify API clients
- Centralized exception handling with a shared `ErrorResponse` envelope and reusable OpenAPI error response docs
- Pydantic v2 models, OIDC via Authlib, Redis-backed server sessions, JWT fallback for tests
- Casbin authorization decorators, rate limiting, ARQ background jobs, caching helpers
- Multiple deployment modes: local (uvicorn), staging (gunicorn + uvicorn workers), production (nginx)
- MAU (Monthly Active User) data loading from AWS S3 via IAM role assumption (cross-account ARQ cron job), cached in Redis with query-by-app and date-range support

For current repository conventions and architecture, use `docs/`. The
`backend/README.md` and `backend/docs/` tree remain useful reference material
but include inherited boilerplate that may not match the current portal.

### Backend Error Contract

Backend API errors are standardized through `backend/src/app/core/exceptions/handlers.py` and `backend/src/app/core/schemas.py`.

- All handled API errors return `{"error": {"code", "message", "details", "requestId"}}`
- Request validation errors summarize the first validation issue in `error.message` and keep the full validation payload in `error.details`
- IBM Security Verify `400` responses preserve upstream user-facing messages while keeping upstream response payloads in `error.details.responseBody`
- Route-level OpenAPI error documentation should reuse `backend/src/app/core/exceptions/openapi.py:error_responses(...)`

When extending backend behavior, prefer project exceptions from `backend/src/app/core/exceptions/http_exceptions.py` over raw `HTTPException` or `ValueError` in route and service code.

Quick local backend start (minimal):

```
# 1. Install backend dependencies
make bk-install

# 2. Create local configuration on first use, then fill in safe local values
cp backend/.env.sample backend/.env

# 3. Start your container runtime if needed
# macOS example: colima start

# 4. Start the backend development server
make bk-dev
```

`make bk-dev` runs the backend on the host, not in Docker. It now starts Postgres and Redis and applies migrations automatically before launching, but your container runtime still needs to be available.

Common backend tasks (via Makefile):

```
# Start dependency services used by the host-run backend
make db-up

# Tail dependency service logs
make db-logs

# Stop dependency services
make db-down

# Rebuild the local Postgres/Redis state, apply migrations, and rerun
# the local superuser and access-policy seed scripts
make db-reset-local

# Run backend tests
make test

# Lint backend
make lint

# Apply Ruff lint autofixes
make format

# Typecheck backend
make typecheck

# Apply migrations
make bk-migration

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

# Run frontend unit tests
make frontend-test

# Build frontend for production
make frontend-build

# Preview production build
make frontend-preview

# Run Playwright browser tests separately
cd frontend && pnpm run test:e2e
```

## Full stack with Docker

The `backend/docker-compose.yml` can run the backend and required services (Postgres, Redis). The frontend can be built and served by a static server or included in a multi-service compose stack.

For the common mixed local workflow, run `make bk-dev` or `make start-dev` from the repo root after your container runtime is available. Those targets now ensure Postgres and Redis are up and migrate the local database before the host-run backend starts. You can still use `make db-up` when you only want the dependency services. This compose file publishes PostgreSQL on `localhost:5432` and Redis on `localhost:6379` so the host-run backend can connect.

Example (from `backend/`):

```
cd backend
docker compose up --build
```

## Configuration & environment

- Backend: create `backend/.env` from `backend/.env.sample` and set
  `ENVIRONMENT`, DB, Redis, OIDC, and session variables.
- Frontend: environment variables for API base URLs can be set via Vite's `import.meta.env` or `.env` files in `frontend/`.

Do NOT commit secrets or `.env` files to source control.


## Testing

- **Backend tests:** `make test` (runs all backend tests)
- **Frontend unit tests:** `make frontend-test`
- **All default tests:** `make all-test` (backend and frontend unit tests)
- **Frontend browser tests:** `cd frontend && pnpm run test:e2e`
- **Frontend E2E reports:** Playwright reports are stored under `frontend/playwright-report/`.


## Devtools & utilities

- Frontend includes TanStack devtools, Storybook, and helper components under `frontend/src/components/utils/development-tools`.
- Backend provides management scripts in `backend/scripts/` for different deployment modes.

## Contributing

See the backend contribution and code-of-conduct files in `backend/CONTRIBUTING.md` and `backend/CODE_OF_CONDUCT.md` for guidelines. The frontend also contains development setup steps in `frontend/README.md`.

## Where to find more details

- [Documentation index](docs/README.md).
- [Current solution architecture and ADRs](docs/architecture/README.md).
- [Repository-specific development and verification conventions](docs/repo-guidance/development-conventions.md).
- Backend reference material: `backend/docs/` and `backend/README.md`; validate
  inherited boilerplate guidance against the current solution docs and code.
- Frontend setup and package reference: `frontend/README.md`.
