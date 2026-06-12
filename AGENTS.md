# CanadaLogin Partner Portal - Agent Guide

Fast reference for coding agents in this monorepo.

## Overview

- `backend/`: FastAPI + SQLAlchemy 2.0 + PostgreSQL + Redis
- `frontend/`: Vite + React (TypeScript) + TanStack Router/Query

## Required Repo Skills

- For backend implementation, bugfix, or refactor work, use `.github/skills/backend-developer/SKILL.md`.
- For frontend implementation, bugfix, or refactor work, use `.github/skills/frontend-developer/SKILL.md`.
- If a task touches both layers, use both skills and keep backend/frontend contracts aligned.
- Treat these skill files as the source of truth for detailed coding standards and workflow patterns.

## Core Commands

### Backend

Use repo-root make targets when possible:

```bash
make bk-install
make bk-test
make bk-lint
make bk-format
make bk-typecheck
```

Direct `uv` usage from `backend/` requires `UV_PROJECT_ENVIRONMENT=../.venv`.

```bash
cd backend
UV_PROJECT_ENVIRONMENT=../.venv uv sync --group dev --extra dev
UV_PROJECT_ENVIRONMENT=../.venv uv run uvicorn src.app.main:app --reload --host 127.0.0.1 --port 8000
UV_PROJECT_ENVIRONMENT=../.venv uv run pytest -q
UV_PROJECT_ENVIRONMENT=../.venv uv run ruff check src/
UV_PROJECT_ENVIRONMENT=../.venv uv run mypy src/app
cd src && UV_PROJECT_ENVIRONMENT=../../.venv uv run alembic upgrade head
```

#### Migration note: keep Alembic `revision` values <= 32 chars.

### Frontend

Use repo-root make targets when possible:

```bash
make ft-install
make ft-build
make ft-test
make ft-lint
make ft-format
make ft-dev
```

Direct `pnpm` usage from `frontend/`
```bash
cd frontend
pnpm install
pnpm run dev
pnpm run lint
pnpm run format
pnpm run test
pnpm run test:unit
pnpm run test:e2e
pnpm run build
```

## Coding Standards

### General

- Prioritize explicit, type-safe, small, testable code.

### Frontend

- File naming: `kebab-case`; components: `PascalCase`; hooks/utils: `camelCase`.
- Prefer Zod + React Hook Form for forms.
- Prefer TanStack Query for data fetching and TanStack Router for routing.
- Keep import order: external, internal, types, utilities, assets/styles.
- Use explicit component return types.

Routing and invited developer constraints:

- For nested routes, convert parent into a layout with `Outlet` and move current page to `index.ts`.
  - `/rp-applications/mine/$rpApplicationUuid`
  - `/access-denied`
  - `/auth-complete`

Formatting/lint reminders:

- Prettier: width 80, tabs, semicolons, double quotes.
- ESLint highlights: `camelcase`, `typescript-eslint/return-await`, `react-hooks/exhaustive-deps`.

### Backend

- Use type hints everywhere (`Optional[T]` preferred over `T | None`).
- Keep data access in repositories and business logic in services.
- Use project exceptions from `core.exceptions.http_exceptions` (avoid raw `HTTPException`/`ValueError`).
- Preserve centralized exception handling and error envelope (`error.code`, `error.message`, `error.details`, `error.requestId`).
- For OpenAPI error docs, use `core.exceptions.openapi.error_responses(...)`.
- Blocked OIDC sign-ins redirect to `access-denied page` via `OIDC_ACCESS_DENIED_REDIRECT` and must not create a session.

## Key Paths

- Backend app code: `backend/src/app/`
- Frontend app code: `frontend/src/`
- Backend docs: `backend/docs/`

## Environment

- Backend env file: `backend/src/.env`
- Frontend env file: `frontend/.env` (set `VITE_API_BASE_URL`)
- Never commit secrets or `.env` files.

## Testing Expectations

- Add/adjust tests for all behavior changes.
- Unit tests: clear AAA structure and focused assertions.
- Integration tests: verify status codes and response contracts.
- Backend contract-impacting changes should run: `make bk-test`, `make bk-lint`, `make bk-typecheck`.
