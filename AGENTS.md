# CanadaLogin Partner Portal - Agent Guide

Fast reference for AI agents. Self-contained — all essential coding standards here.

## Architecture

```
backend/  (FastAPI + SQLAlchemy/PostgreSQL + Redis + Authlib OIDC + Casbin + ARQ)
├── api/v1/ (routes) → services/ (logic) → repositories/ (FastCRUD + ISV) → models/
├── schemas/ (Pydantic) / workflows/ (state) / core/ (config, auth, exceptions)
├── core/worker/ (ARQ: WorkerSettings + task functions)
└── tests/ + migrations/versions/

frontend/  (Vite + React 19 + TanStack Router/Query + Zustand + RHF/Zod + Vitest + Playwright)
├── routes/ (thin, TanStack) → features/<name>/ (pages + hooks) → fetch/ (API clients)
├── components/ (shared UI) / store/ (Zustand) / lib/ / types/
└── tests/ (unit/ + e2e/)
```

## Required Skills (Optional Deeper Reference)

For authoritative detail, load these before complex work:
- Backend: `.github/skills/backend-developer/SKILL.md`
- Frontend: `.github/skills/frontend-developer/SKILL.md`

## Coding Standards

### General

Type-safe, explicit, small, testable. Add tests for all behavior changes. Use existing features as templates — extend patterns, don't invent new layouts.

**API contracts:** backend returns Pydantic schemas (`XRead`) as JSON; frontend `fetch/` clients use TypeScript types matching those schemas. Keep both sides in sync.

Backend schemas use `model_config = ConfigDict(validate_by_name=True, validate_by_alias=True, alias_generator=to_camel, populate_by_name=True)` — fields are snake_case in Python but serialized/deserialized as camelCase over the wire. Frontend types and API calls must use camelCase to match.

### Backend

**Layered architecture — strict separation of concerns:**
- `api/` — thin routes: declare endpoint, `@casbin_guard.require_permission(...)`, inject deps with `Annotated[..., Depends(...)]`, call service, return result. **No business logic.**
- `services/` — business logic: async methods, typed params, raise project exceptions, call repository adapters. **Logic lives here.**
- `repositories/` — data access: `FastCRUD[...]` adapters in `crud_*.py`, IBM Security Verify clients. **No direct ORM in routes.**
- `workflows/` — explicit state transitions when resource has a lifecycle (approve/reject/submit/activate).
- `models/` — SQLAlchemy: `Mapped[...]`, `mapped_column`, `__tablename__`, timestamps, soft-delete (`is_deleted`, `deleted_at`), `uuid` for public-safe resources.

**Schema pattern:** `XBase` → compose `X(TimestampSchema, XBase, UUIDSchema, PersistentDeletion)` → `XCreate` / `XCreateInternal` / `XUpdate` / `XUpdateInternal` / `XRead`. Use `ConfigDict(extra="forbid")` on request models. Keep `XRead` as explicit response contract.

**Error handling:** use project exceptions from `core.exceptions.http_exceptions` (never raw `HTTPException` or `ValueError`). Shared envelope: `error.code`, `error.message`, `error.details`, `error.requestId`. For OpenAPI error docs: `core.exceptions.openapi.error_responses(...)`.

**Casbin access control:** `@casbin_guard.require_permission("resource", "action")`. Subject resolution: superusers → `admin`, role users → role name, else → username. Prefer `read`/`write` for CRUD, explicit verbs (approve/reject) for workflow. **Always seed `access_policy` rows** when adding protected resources or actions.

**Naming:** files/functions `snake_case`, classes `PascalCase`, constants `UPPER_SNAKE_CASE`.
**Imports:** stdlib, third-party, internal app modules.
**Types:** `Optional[T]` preferred over `T | None`.
**Cache:** invalidate cached resources on write paths that update them.

**ARQ background tasks:** `core/worker/` owns all async background jobs.
- Task functions live in `core/worker/functions.py` — `async def task(ctx, ...)`, first param is `Worker`/`dict` context.
- Register ad-hoc tasks in `WorkerSettings.functions`; scheduled/cron in `WorkerSettings.cron_jobs`.
- Enqueue from service layer via `queue.pool.enqueue_job("function_name", *args)`.
- Worker spawns as daemon thread on FastAPI startup; runs in separate container in production.
- Key paths: `core/worker/settings.py` (`WorkerSettings`), `core/worker/functions.py` (task impl), `core/utils/queue.py` (shared Redis pool).

### Frontend

**Architecture — strict separation of concerns:**
- `routes/` — thin TanStack Router files: define URL with `createFileRoute(...)`, attach auth guard (`beforeLoad`), lazy-load page. **No page logic.**
- `features/<name>/pages/` — page components assembling UI and feature hooks.
- `features/<name>/hooks/` — feature hooks owning `useQuery(...)` and state orchestration.
- `fetch/` — API clients using `requestJson(...)` and `buildApiUrl(...)`. **No raw `fetch()` in components.**
- `store/` — Zustand for auth state, preferences, admin state. Not ad hoc globals.
- **Never edit `routeTree.gen.ts`** manually. For nested child routes, convert parent to layout with `<Outlet>` and move page to `index.ts`.

**Auth routing:** use `requireAuthenticatedUser()` / `redirectAuthenticatedUser()` from `src/features/auth/auth-routing.ts`. **Revalidate server session** on route entry — don't trust cached Zustand alone. Fail closed on revalidation failure (redirect to `/login`). Keep `/login` public.

**Naming:** files `kebab-case`, components `PascalCase`, hooks/utils `camelCase`, constants `UPPER_SNAKE_CASE`.
**Import order:** external libs, internal components/hooks, types, utilities, assets/styles.
**Formatting (Prettier):** width 80, tabs, semicolons, double quotes, trailing comma `es5`.
**Lint (ESLint errors):** `camelcase`, `typescript-eslint/return-await`, `react-hooks/exhaustive-deps`.
**Forms:** Zod schemas + React Hook Form.
**State:** TanStack Query for server data, Zustand for app state.

## Commands

### Backend
```bash
make bk-install
make bk-test
make bk-lint
make bk-typecheck
make bk-format
```
**Migration note:** keep Alembic `revision` values ≤ 32 chars.

### Frontend
```bash
make ft-install
make ft-build
make ft-test
make ft-lint
make ft-format
make ft-dev
```

## Feature Checklists

**Backend** — new resource needs: Model → Schemas (XCreate/XRead/XUpdate) → Repository (FastCRUD) → Service → Routes → Dependency provider → Workflow (if state transitions) → Alembic migration → Tests (API + service + access-control) → Cache invalidation (if cached) → Casbin policy seed (if protected).

**Frontend** — new feature needs: Route → Feature page → Feature hook → Fetch client → Store update (if app state) → Shared UI (if needed) → Auth-routing update (if protected) → Unit tests → E2E (if user flow changes).

## Verification

| Layer | Run before completing work |
|---|---|
| Backend | `make bk-test && make bk-lint && make bk-typecheck` |
| Frontend | `make ft-test && make ft-lint && make ft-build` |

## Key Paths

| Path | Notes |
|---|---|
| `backend/src/app/` | App code. Env: `backend/src/.env` |
| `frontend/src/` | App code. Env: `frontend/.env` (set `VITE_API_BASE_URL`) |
| `backend/docs/` | Backend documentation |
| `backend/src/app/core/worker/` | ARQ worker: `settings.py`, `functions.py` |
| — | **Never commit `.env` files or secrets** |

## Common Mistakes

### Backend
- Business logic in routes instead of services
- Raw `HTTPException`/`ValueError` instead of project exceptions
- Direct ORM queries in routes instead of `FastCRUD` repository adapters
- Schema/model change without Alembic migration
- Casbin decorator without seeding corresponding `access_policy` rows
- Adding code in a style that ignores existing layering/patterns

### Frontend
- Page logic in route files instead of feature pages/hooks
- Editing `routeTree.gen.ts` by hand
- Raw `fetch()` calls in components instead of `src/fetch/` helpers
- Protected routes trusting cached Zustand state instead of server revalidation
- Breaking `camelcase`, `return-await`, or `exhaustive-deps` lint rules
- Making `/login` behave as a protected route


