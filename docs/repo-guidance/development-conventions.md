# Development Conventions

Type: Solution Repository Guidance
Status: Active
Last verified: 2026-07-28

## Scope And Sources Of Truth

This guide contains implementation and verification conventions specific to
the CanadaLogin Partner Portal. Durable architecture choices live in
[the solution architecture index](../architecture/README.md). Product behaviour
belongs in product specifications and, after Delorean is materialized, OpenSpec.

Use these sources in order:

1. accepted ADRs;
2. implementation, tests, and executable configuration such as `Makefile`,
   `backend/pyproject.toml`, `frontend/package.json`,
   `frontend/eslint.config.js`, `frontend/prettier.config.js`, and
   `frontend/tsconfig.json`;
3. the current [codebase architecture](../architecture/codebase.md);
4. this guide; and
5. task-specific local skills and legacy reference documentation.

If the implementation or executable configuration conflicts with this guide,
treat it as documentation drift. Verify the intended behaviour and update the
code or documentation together instead of silently relying on the discrepancy.

## General Conventions

- Keep changes explicit, typed, focused, and testable.
- Extend the closest maintained feature before introducing a new layout or
  abstraction.
- Add or update tests for behaviour changes.
- Keep backend and frontend API contracts synchronized.
- Do not commit secrets, credentials, tokens, or real `.env` files.
- Keep generated files generated; do not edit them by hand.

## API Contract Conventions

[ADR-002](../architecture/adrs/adr-002-api-wire-and-error-contract.md)
proposes a canonical camelCase JSON contract, but it is not yet accepted
because current endpoints use mixed casing.

Until that ADR is resolved:

- preserve the implemented request and response field names for an existing
  endpoint;
- treat a serialized field rename or casing change as an API contract change;
- update Pydantic models, OpenAPI, TypeScript wire types, clients, and tests
  together;
- use explicit Pydantic response models where practical; and
- avoid extending casing drift in new endpoint designs without recording the
  decision.

Handled backend errors use the shared nested `error` envelope defined in
`backend/src/app/core/schemas.py`. Route and service business failures use
project exceptions from `core.exceptions.http_exceptions`. Pydantic validators
may still use `ValueError` for field validation.

Route-level OpenAPI error documentation reuses
`core.exceptions.openapi.error_responses(...)`. Do not create one-off handled
error JSON shapes.

## Backend Conventions

### Layer Boundaries

The target dependency direction is:

```text
API route -> service or workflow -> repository -> database or external system
```

- `api/` owns HTTP declarations, dependency injection, response models, status
  codes, and permission decorators.
- `services/` owns business validation and orchestration.
- `repositories/` owns FastCRUD/SQLAlchemy access and external-system adapters.
- `workflows/` owns explicit lifecycle transitions when a domain needs them.
- `models/` contains SQLAlchemy persistence models.
- `schemas/` contains public request/response models and internal transfer
  shapes.

Some legacy routes cross these boundaries. They are not templates for new work.

### Schemas, Models, And Persistence

- Use typed SQLAlchemy 2.0 models and async database access.
- Keep ORM models separate from public Pydantic schemas.
- Use `ConfigDict(extra="forbid")` for request models that should reject
  undeclared fields.
- Use the nearest maintained domain to select schema composition, soft-delete,
  timestamp, and public-identifier patterns. They are common patterns, not
  universal requirements for every model.
- Add an Alembic migration for every database schema or durable seed-data
  change.
- Keep Alembic `revision` values at 32 characters or fewer.
- Review migrations for constraints, nullability, indexes, data conversion,
  downgrade behaviour, and policy/data lifecycle.

### Errors, Authorization, Cache, And Jobs

- Raise project HTTP exceptions for route/service business failures rather than
  returning ad hoc error payloads.
- Keep request validation in Pydantic schemas when practical.
- Add a Casbin decorator only with a defined resource/action vocabulary,
  deployed policy provisioning, and allow/deny tests.
- Ensure intended grants can be provisioned idempotently in target environments
  and are covered by tests. Existing feature grants use data migrations, while
  proposed [ADR-003](../architecture/adrs/adr-003-casbin-authorization-model.md)
  will settle the authoritative provisioning mechanism.
- Do not add another policy source that increases the current migration/seeder
  drift while ADR-003 remains proposed.
- Keep object ownership and domain authorization in services even when a
  Casbin route guard succeeds.
- Invalidate affected caches on write paths.
- Put ARQ task functions in `core/worker/functions.py`, registration and
  schedules in `core/worker/settings.py`, and enqueue calls in services.
- Run the ARQ worker as a separate process. FastAPI startup creates the queue
  pool but does not spawn the worker.

### Python Style

- Files and functions use `snake_case`; classes use `PascalCase`; constants use
  `UPPER_SNAKE_CASE`.
- Group imports as standard library, third-party, then internal modules.
- Use concrete parameter and return annotations for app code.
- Follow the style of the maintained module for `Optional[T]` versus
  `T | None`; the repository does not impose one universal spelling.
- Ruff and mypy configuration in `backend/pyproject.toml` are authoritative.

## Frontend Conventions

### Layer Boundaries

The target dependency direction is:

```text
route -> feature page or hook -> typed fetch client -> backend API
```

- Keep `src/routes/` files focused on URLs, route guards, loaders, and page
  selection.
- Keep feature UI and orchestration under `src/features/<feature>/`.
- Put reusable request mechanics and feature API clients under `src/fetch/`.
- Use `requestJson(...)` and `buildApiUrl(...)`; do not scatter raw `fetch()`
  calls through components.
- Use TanStack Query for server data and mutations.
- Use Zustand for client-side state such as the current-user projection and
  preferences, not as a replacement for server state.
- Reuse shared layout and GC Design System wrappers before adding new
  primitives.

### Routing And Authentication

- Treat `src/routeTree.gen.ts` as generated output.
- When adding a child beneath an existing page route, make the parent a layout
  that renders `<Outlet>` and move its former page to an `index` child.
- Use the shared helpers in `src/features/auth/auth-routing.ts` for route-entry
  session decisions.
- Protected route entry revalidates the server session and fails closed. See
  accepted
  [ADR-001](../architecture/adrs/adr-001-bff-and-server-session-authority.md).
- Do not infer a required frontend `/login` route. The current protected-route
  flow starts backend OIDC login directly.
- Backend authorization remains required even when the frontend redirects or
  hides a control.

### TypeScript And UI Style

- Route, hook, utility, and fetch files normally use `kebab-case`.
- Component and page files and exported React components use `PascalCase`.
- Exported functions, hooks, component props, API responses, and store shapes
  are explicitly typed.
- Use React Hook Form and Zod for non-trivial forms.
- TypeScript, ESLint, and Prettier configuration are authoritative.
- Current Prettier settings use width 80, tabs with width 2, semicolons, double
  quotes, and ES5 trailing commas.
- ESLint enforces, among other rules, camelCase identifiers, consistent type
  imports, explicit return types, `return-await`, React hook dependencies, and
  JSX prop ordering. It does not define a universal import-order rule.

## Feature Checklists

### Backend Feature

Check the affected scope for:

1. SQLAlchemy model and Alembic migration;
2. public and internal Pydantic schemas;
3. repository or external adapter;
4. service logic;
5. route and dependency provider;
6. workflow transitions where applicable;
7. project exceptions and OpenAPI error declarations;
8. cache invalidation;
9. Casbin permission and durable policy provisioning; and
10. service, API, migration-adjacent, and allow/deny tests.

Not every feature needs every item. Record why a normally expected layer does
not apply.

### Frontend Feature

Check the affected scope for:

1. route or route-layout change;
2. feature page and feature hook;
3. typed fetch client and API contract update;
4. TanStack Query invalidation or update behaviour;
5. Zustand changes only for genuine client-side state;
6. shared layout or UI reuse;
7. route-entry authentication behaviour;
8. loading, empty, error, success, and unauthorized states;
9. unit tests; and
10. Playwright coverage when a real browser flow changes.

## Commands And Verification

The root `Makefile` is the command source of truth.

| Purpose | Command | Actual scope |
|---|---|---|
| Install backend | `make bk-install` | Sync backend dependencies into the root virtual environment. |
| Install frontend | `make ft-install` | Run `pnpm install` in `frontend/`. |
| Run backend | `make bk-dev` | Start the API on `127.0.0.1:8000`. |
| Run worker | `make bk-worker` | Start the separate local ARQ worker process. |
| Run frontend | `make ft-dev` | Start Vite. |
| Backend tests | `make bk-test` | Run the backend pytest suite. |
| Frontend tests | `make ft-test` | Run frontend Vitest unit tests only. |
| Combined tests | `make all-test` | Run backend tests and frontend unit tests; no Playwright. |
| Browser tests | `cd frontend && pnpm run test:e2e` | Run Playwright separately. |
| Backend lint | `make bk-lint` | Run Ruff checks on backend source. |
| Backend typecheck | `make bk-typecheck` | Run mypy on `src/app`. |
| Backend autofix | `make bk-format` | Run Ruff lint autofix; this is not a full formatter pass. |
| Frontend lint | `make ft-lint` | Run ESLint with zero warnings. |
| Frontend build | `make ft-build` | Run TypeScript and Vite production build. |
| Frontend format | `make ft-format` | Format frontend `src` TypeScript/TSX with Prettier. |
| Apply migrations | `make bk-migration` | Upgrade Alembic to `head`; it does not author a revision. |

Before completing affected backend work, normally run:

```bash
make bk-test
make bk-lint
make bk-typecheck
```

Before completing affected frontend work, normally run:

```bash
make ft-test
make ft-lint
make ft-build
```

Run Playwright separately when route behaviour or a real browser flow changes:

```bash
cd frontend
pnpm run test:e2e
```

Use focused tests during development, but complete with checks proportional to
the changed risk and scope. Record any relevant check that could not run and
the remaining risk.

## Key Paths And Configuration

| Path | Purpose |
|---|---|
| `backend/src/app/` | Backend application code. |
| `backend/tests/` | Backend pytest suite. |
| `backend/src/migrations/versions/` | Alembic migrations and durable data seeds. |
| `backend/.env.sample` | Backend local configuration example. |
| `backend/.env` | Backend settings file loaded by the current Pydantic configuration; do not commit it. |
| `frontend/src/` | Frontend application code. |
| `frontend/tests/unit/` | Vitest unit tests. |
| `frontend/e2e/` | Playwright browser tests. |
| `frontend/.env.sample` | Frontend configuration example. |
| `docs/architecture/` | Solution architecture notes and ADRs. |
| `architecture_docs/` | Generated Delorean guidance after materialization; do not add local decisions here. |

## Common Pitfalls

- Treating a proposed ADR as an accepted rule.
- Describing all current API fields as camelCase despite known snake_case
  contracts.
- Putting business logic or direct persistence access into new routes.
- Adding a protected action without durable policy provisioning and deny-path
  tests.
- Running queued work in the web process instead of the separate worker.
- Editing `routeTree.gen.ts` manually.
- Trusting hydrated Zustand state for protected route entry.
- Assuming `make ft-test` or `make all-test` runs Playwright.
- Describing Ruff autofix as full backend formatting.
- Copying generic or historical documentation without validating it against
  the current implementation.
