---
name: backend-developer
description: 'Use when adding backend features, fixing backend bugs, or refactoring the FastAPI backend in this repository, especially when work touches FastAPI routes, services, SQLAlchemy models, Alembic migrations, Casbin access control, or protected admin resources.'
argument-hint: 'Describe the backend feature, bug, or module to change.'
user-invocable: true
---

# Backend Developer

## Overview

Use this skill when backend work must follow the structure and coding standard already used in this repository.

The backend is not organized as ad hoc FastAPI files. It uses a repeatable feature pattern across models, schemas, repository adapters, services, routes, workflows, migrations, and tests. New code should extend that pattern instead of introducing a different architecture.

## When to Use

- Add a new backend feature under `backend/src/app`
- Fix a bug in API, service, auth, policy, rate-limit, tier, task, or workflow code
- Add a new database-backed resource
- Extend an existing resource with new fields, endpoints, or state transitions
- Add or adjust backend tests so they match the existing test style
- Refactor backend code while preserving the current layering and conventions

Do not use this skill for frontend-only work.

## Backend Shape

Follow the existing module layout under `backend/src/app`:

- `api/`: FastAPI routers, dependency wiring, request-to-service handoff
- `models/`: SQLAlchemy models
- `schemas/`: Pydantic request and response schemas
- `repositories/`: data-access layer for database `FastCRUD` adapters and IBM Security Verify clients
- `services/`: business logic and orchestration
- `workflows/`: explicit state-transition logic when a feature has a lifecycle
- `core/`: shared config, database, security, cache, exceptions, logging, utilities
- `middleware/`: request/response middleware

Mirror existing feature grouping. If you add a new resource, expect to touch several of these layers, not only one file.

## Required Working Pattern

### 1. Start from an existing feature

Use an existing feature as the template before writing code. Good reference sets in this repo:

- Users, roles, tiers, rate limits, policies, and workspaces follow the same layered pattern, with database adapters under `repositories/` and business logic in `services/`

Prefer extending the closest existing feature over inventing a new layout.

### 2. Keep routers thin

Routes should mostly:

- declare the endpoint
- define request and response schema usage
- inject dependencies with `Annotated[..., Depends(...)]`
- apply access-control decorators when the route is protected
- pass work into a service
- return the service result

Do not move business rules, authorization decisions, workflow transitions, or complex database logic into the route function unless the existing code in that area already does so.

### 2a. Protect admin and managed resources with Casbin

This backend uses Casbin route decorators for access control.

For protected routes, follow the existing router pattern and use:

```python
@casbin_guard.require_permission("roles", "read")
```

Match the resource and action names to the domain you are protecting. Existing examples in the repo include:

- `roles` with `read` and `write`
- `tiers` with `read` and `write`
- `rate_limits` with `read` and `write`
- `policies` with `read` and `write`
- `users_admin` with `read` and `write`
- `posts` with workflow-specific actions such as `approve` and `reject`

Do not invent a second access-control mechanism for these routes. Reuse `casbin_guard` from `core/access_control.py`.

### 2b. Follow the repository's Casbin subject model

This repo resolves the Casbin subject with the existing logic in `core/access_control.py`:

- superusers map to subject `admin`
- users with a `role_id` map to the corresponding role name
- users without a mapped role fall back to their username

When changing protected behavior, keep that subject resolution model intact. New policy design should fit this model instead of bypassing it.

### 3. Put business logic in services

Service classes are the main home for feature logic.

Match the existing style:

- one service class per domain file, such as `PostService`
- async methods with explicit typed parameters
- use `AsyncSession`
- assemble internal schemas from external input when needed
- raise project exceptions from `core.exceptions.http_exceptions`
- treat service-layer validation failures as explicit project exceptions such as `BadRequestException` or `NotFoundException`, not plain `ValueError`
- call repository adapters instead of embedding repetitive persistence code directly in routes
- invalidate cache when writes change cached data

### 4. Use workflows for lifecycle state

If a resource has state transitions, isolate that logic in `workflows/`.

Do this when actions such as approve, reject, submit, activate, suspend, or similar transitions exist. Keep the allowed transitions explicit and validate invalid transitions with the project exception pattern.

### 5. Keep schema boundaries explicit

Follow the schema split already used in the backend:

- `XBase`: shared core fields when useful
- top-level feature schema such as `X(...)`: domain schema composed from shared mixins and `XBase` when the feature uses that pattern
- `XCreate`: public create payload
- `XCreateInternal`: internal create payload enriched with server-side fields
- `XUpdate`: public partial update payload
- `XUpdateInternal`: internal update payload with fields like `updated_at`
- `XRead`: API response shape

Use `ConfigDict(extra="forbid")` for request models that should reject unexpected fields.

Use `Annotated[...]` with `Field(...)` constraints for validation instead of pushing validation into endpoint code.

The backend now standardizes API failures through the shared `ErrorResponse` envelope in `core/schemas.py` and centralized registration in `core/exceptions/handlers.py`. When adding or changing backend behavior:

- preserve the envelope shape `error.code`, `error.message`, `error.details`, and `error.requestId`
- keep request validation in schemas where possible so it flows through `RequestValidationError`
- use project exceptions for business validation so the shared handler can serialize them consistently
- preserve IBM Security Verify `400` user-facing messages when working in IBM SV clients or services

When a feature follows the shared-schema composition pattern already present in this repo, preserve it explicitly instead of flattening everything into one schema. Common examples in the current codebase include:

- `Post(TimestampSchema, PostBase, UUIDSchema, PersistentDeletion)`
- `User(TimestampSchema, UserBase, UUIDSchema, PersistentDeletion)`
- `Role(TimestampSchema, RoleBase, PersistentDeletion)`

That means:

- keep feature fields in `XBase`
- compose the main domain schema from `TimestampSchema`, `XBase`, and shared mixins such as `UUIDSchema` and `PersistentDeletion` when the neighboring feature already does so
- keep `XRead` as the explicit outward response contract, even when the composed domain schema exists

### 6. Keep model definitions consistent

SQLAlchemy models in this repo generally:

- use `Mapped[...]` and `mapped_column`
- define `__tablename__`
- keep timestamp and soft-delete fields explicit with columns such as`created_at`, `updated_at`, `deleted_at` and `is_deleted`
- use enums for constrained status values when the domain needs them
- often carry a `uuid` field for public-safe identifiers on user-facing resources such as users, posts, and post approvals
- use indexed foreign keys where the current pattern does so

Do not turn this into a false universal rule. Some models in the repo currently have soft-delete fields without a UUID column, so copy the nearest existing feature rather than forcing UUID onto every table blindly.

When adding new persistence fields, keep the style aligned with neighboring models instead of mixing in a new ORM style.

### 7. Use repository adapters where the repo already does

For database-backed resources, add or update the corresponding `repositories/crud_*.py` adapter with `FastCRUD[...]` so services can reuse the same persistence abstraction already used by the project.

Treat `repositories/` as the single data-access layer:

- database-backed resources use `FastCRUD` adapters in `repositories/crud_*.py`
- external IBM Security Verify access also lives in `repositories/`
- services depend on repository modules, not direct ORM queries in routes

### 8. Preserve dependency-injection patterns

Shared dependency constructors live in `api/dependencies.py`.

When adding a new service dependency:

- create a small provider such as `get_<feature>_service()`
- inject it into routes with `Annotated[..., Depends(...)]`
- reuse shared auth and DB dependencies instead of recreating them locally

### 8a. Preserve public identifier choices in services and routes

Single-resource lookups in this repo are intentionally not uniform. Current public APIs use stable domain identifiers such as:

- `username` for user resources
- `name` for roles and tiers
- integer ids for some existing resources such as posts, policies, tasks, and rate limits

The design direction behind UUID-bearing models is to avoid leaking raw internal ids for user-facing resources when the feature already supports a public-safe identifier. When changing or adding endpoints:

- prefer the existing public identifier used by that feature instead of introducing a second lookup style casually
- if the neighboring model and schema already expose UUID as the public identifier, prefer querying by UUID in service methods and routes rather than by internal integer id
- if the current feature is still id-based, do not silently rewrite it unless the task explicitly includes that API contract change
- keep internal integer primary keys as persistence details, not as a new public API default

### 8b. Preserve the RP application invitation access model

This repo now supports invited RP application developers with app-scoped access.

When backend work touches OIDC onboarding, RP application access, or invitation behavior:

- unknown OIDC users may only be auto-created when their email has an active invitation
- blocked OIDC logins must redirect through `OIDC_ACCESS_DENIED_REDIRECT` without creating a session
- workspace admins invite developers through `POST /api/v1/workspaces/{workspace_uuid}/applications/{rp_application_uuid}/developers/invite`
- invited users accept through `POST /api/v1/rp-application-developer-invitations/accept`
- invited-developer read and edit access flows through `/api/v1/rp-applications/mine` endpoints, not workspace-scoped membership checks
- v1 invited-developer permissions are intentionally narrow: view and edit RP application details only

If you widen this behavior, update both backend and frontend contracts and add tests for the new authorization surface.

### 9. Seed Casbin policies when you add protected resources or actions

If you add a new Casbin-protected resource or a new action on an existing resource, you must also seed the policy rows expected by the backend.

In this repo, that means updating one or both of these layers as appropriate:

- runtime seed script under `backend/src/scripts/seed_access_policies.py`
- Alembic seed migration under `backend/src/migrations/versions/` for durable environment setup

Follow the existing migration pattern used for role permissions and reviewer permissions:

- check whether `access_policy` exists before inserting
- insert only when the `(subject, resource, action)` tuple does not already exist
- respect soft-delete-aware checks where the migration pattern already does so
- add matching downgrade cleanup when the migration is specifically seeding policies

Do not add a `@casbin_guard.require_permission(...)` decorator without also ensuring the required policy rows can exist in target environments.

## Coding Standard To Preserve

- Prefer async end-to-end for route, service, and database-facing code
- Add concrete type hints for function parameters and return values
- Keep functions small and focused
- Reuse existing exception classes instead of raising raw `HTTPException` directly unless that file already requires it
- Reuse the shared OpenAPI helper in `core/exceptions/openapi.py` when documenting route error responses
- Reuse existing utilities from `core/` for cache, security, config, and rate limiting
- Reuse the existing Casbin integration from `core/access_control.py` for protected endpoints
- Keep naming consistent with the current codebase: singular model and schema file names, service file names ending in `_service.py`, repository adapter modules named `crud_<plural>.py`
- Match the repository's import style and formatting instead of reordering architecture for personal preference

## Feature Checklist

When adding a new backend resource or capability, check whether the change needs each of the following:

1. Model in `models/`
2. Schema updates in `schemas/`
3. Repository adapter in `repositories/`
4. Service logic in `services/`
5. API routes in `api/v1/`
6. Dependency provider in `api/dependencies.py`
7. Workflow in `workflows/` if state transitions exist
8. Alembic migration in `src/migrations/versions/`
9. Tests in `backend/tests/`
10. Cache invalidation or auth and access-control updates if the feature touches cached or protected behavior
11. Casbin policy seed updates if the feature introduces a new protected resource or action

Do not stop at the endpoint if the underlying feature also needs schema, persistence, workflow, or test changes.

## Auth And Access-Control Rules

When backend work touches protected routes or admin-style resources, explicitly check all of the following:

1. Is the route supposed to be protected with `@casbin_guard.require_permission("<resource>", "<action>")`?
2. Does the chosen `<resource>` and `<action>` follow the naming already used by the repo?
3. Will the current subject model authorize the intended actors: `admin`, role name, or username?
4. Did you seed the needed `access_policy` entries for local setup and migrated environments?
5. Did you add tests for both allow and deny behavior?

For simple CRUD admin resources, prefer `read` and `write` actions.

For workflow or moderation operations, use explicit actions such as `approve`, `reject`, or other domain verbs when the repo already models those actions distinctly.

## Testing Pattern

Match the existing backend test organization:

- API route behavior: `backend/tests/test_<feature>_api.py` or similar endpoint-focused files
- Service logic: `backend/tests/test_<feature>_service.py`
- Model or workflow behavior: `backend/tests/test_<feature>_model.py` and `backend/tests/test_<feature>_workflow.py`
- Cross-cutting auth or policy behavior: dedicated integration-style test files already present in `backend/tests/`

Use the existing fixtures in `backend/tests/conftest.py` where possible.

The current test style favors:

- `pytest`
- `pytest.mark.asyncio` for async tests
- `AsyncMock` and `Mock` for service and dependency isolation
- direct testing of route functions when appropriate
- focused assertions on delegation, returned payloads, and side effects such as cache invalidation

When access control changes, also add or update:

- subject-resolution tests for `get_casbin_subject` when role mapping behavior changes
- allow and deny route tests for protected endpoints
- policy or integration tests when a new resource or action is introduced

## Verification

Before considering backend work complete, verify the affected scope.

Typical backend commands for this repo:

```bash
make bk-test
make bk-lint
make bk-typecheck

# If running raw uv commands inside backend/, set UV_PROJECT_ENVIRONMENT=../.venv
cd backend
UV_PROJECT_ENVIRONMENT=../.venv uv run pytest tests/test_<feature>.py tests/test_<feature>_service.py
UV_PROJECT_ENVIRONMENT=../.venv uv run pytest tests/test_casbin_access.py tests/test_*access_control*.py
UV_PROJECT_ENVIRONMENT=../.venv uv run ruff check src tests
UV_PROJECT_ENVIRONMENT=../.venv uv run mypy src
```

If the change affects schema or database structure, also verify migrations against the existing Alembic setup under `backend/src/migrations`.

If the change touches invitations or invited access, also verify the narrow suite already covering this feature, including `test_oidc_service.py`, `test_oidc_auth.py`, `test_workspace_service.py`, and `test_workspaces_api.py`.

If the change adds a protected resource or action, verify both the code path and the seeded `access_policy` data path.

## Common Mistakes

- putting business rules in route functions instead of services
- adding request validation logic in endpoints instead of schemas
- changing database fields without adding a migration
- writing new code in a style that ignores the repository layer, `FastCRUD`, dependency injection, or the existing exception types
- bypassing the centralized error contract with raw `HTTPException`, plain `ValueError`, or one-off JSON error payloads in routes and services
- adding a feature without matching tests at the service or API layer
- bypassing cache invalidation on write paths that update cached resources
- adding a Casbin decorator without seeding the corresponding policy rows
- protecting a route with a resource or action name that does not match the seeded policy naming
- changing protected routes without adding allow and deny access-control tests
- introducing a new folder or architecture pattern when an existing feature already provides the template

## Expected Outcome

Code produced with this skill should look like it belongs in this backend already:

- same folder structure
- same async and typing style
- same separation between routes, services, schemas, and persistence
- same migration and test discipline
- same auth, cache, and Casbin access-control integration points where relevant