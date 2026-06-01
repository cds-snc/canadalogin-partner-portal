# Move Workspaces To Demo Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development
> to implement this plan task-by-task.

**Goal:** Move the workspace and RP application management feature from the main backend/frontend into the existing demo apps, then remove that feature slice from the main app without disturbing shared infrastructure.

**Architecture:** The migration is a bounded feature extraction centered on `backend/src/app/api/v1/workspaces.py`, `backend/src/app/services/workspace_service.py`, `frontend/src/fetch/workspaces.ts`, and the frontend workspace route tree. Shared auth, database, exception, and authorization infrastructure remains in place unless it proves to be workspace-exclusive, while demo receives equivalent backend route registration, frontend route wiring, and focused verification coverage before main-app removal.

**Tech Stack:** FastAPI, SQLAlchemy async, Pydantic, React, TanStack Router, TanStack Query, Vitest, pytest, pnpm, uv

---

## Task 1: Map extraction boundaries

**Files:**
- Modify: `openspec/changes/move-workspaces-to-demo/tasks.md`
- Inspect: `backend/src/app/api/v1/workspaces.py`
- Inspect: `backend/src/app/services/workspace_service.py`
- Inspect: `backend/tests/test_workspaces_api.py`
- Inspect: `frontend/src/fetch/workspaces.ts`
- Inspect: `frontend/src/routes/workspaces.ts`
- Inspect: `frontend/src/routes/workspaces/index.ts`
- Inspect: `frontend/src/routes/workspaces/$workspaceUuid.ts`
- Inspect: `frontend/src/routes/workspaces/$workspaceUuid/index.ts`
- Inspect: `frontend/src/routes/workspaces/$workspaceUuid/applications/$rpApplicationUuid.ts`
- Inspect: `frontend/src/routes/workspaces/$workspaceUuid/application-info/$applicationInfoUuid.ts`
- Inspect: `frontend/src/routes/invitations/rp-applications.ts`
- Inspect: `frontend/src/routes/rp-applications/mine/$rpApplicationUuid.ts`
- Inspect: `frontend/src/features/workspaces/pages/WorkspacesPage.tsx`
- Inspect: `frontend/tests/unit/routes/workspaces-route.test.ts`
- Inspect: `frontend/tests/unit/features/workspaces/workspaces-api.test.ts`

- [ ] **Step 1:** Read `backend/src/app/api/v1/workspaces.py` and list every directly referenced schema, dependency provider, repository, and service method in a working note.
- [ ] **Step 2:** Read `backend/src/app/services/workspace_service.py` and mark which collaborators are workspace-owned versus clearly shared platform utilities.
- [ ] **Step 3:** Read `frontend/src/fetch/workspaces.ts`, the workspace route files, and the invite/current-user route files, then map which pages and APIs form the feature boundary.
- [ ] **Step 4:** Read `backend/tests/test_workspaces_api.py`, `frontend/tests/unit/routes/workspaces-route.test.ts`, and `frontend/tests/unit/features/workspaces/workspaces-api.test.ts` to identify which tests should move or be mirrored into demo.
- [ ] **Step 5:** Update `openspec/changes/move-workspaces-to-demo/tasks.md` progress locally if needed and record the extraction inventory in your session notes.
- [ ] **Step 6:** Commit the boundary mapping checkpoint.

## Task 2: Move backend workspace routes into demo

**Files:**
- Create or Modify: `demo/backend/src/app/api/v1/workspaces.py`
- Create or Modify: `demo/backend/src/app/services/workspace_service.py`
- Create or Modify: `demo/backend/src/app/schemas/workspace.py`
- Create or Modify: `demo/backend/src/app/schemas/application_info.py`
- Create or Modify: `demo/backend/src/app/crud/crud_workspaces.py`
- Modify: demo backend app/router registration files under `demo/backend/src/app/`
- Reference: `backend/src/app/api/v1/workspaces.py`
- Reference: `backend/src/app/services/workspace_service.py`

- [ ] **Step 1:** Write or update a focused demo backend test file for one migrated workspace route before moving implementation.
- [ ] **Step 2:** Run the narrow demo backend test command for that route and confirm it fails because the route is missing or incomplete.
- [ ] **Step 3:** Copy or recreate `backend/src/app/api/v1/workspaces.py` into `demo/backend/src/app/api/v1/workspaces.py`, then trim imports to match the demo app layout.
- [ ] **Step 4:** Copy or recreate the workspace service, workspace schemas, application info schemas, and CRUD helpers into demo using the extraction inventory from Task 1.
- [ ] **Step 5:** Update demo backend router registration so the migrated workspace endpoints are mounted when the demo app starts.
- [ ] **Step 6:** Run the same focused demo backend test again and make it pass with minimal code changes.
- [ ] **Step 7:** Commit the demo backend workspace migration checkpoint.

## Task 3: Preserve invited-developer backend flows in demo

**Files:**
- Modify: `demo/backend/src/app/api/v1/workspaces.py`
- Modify: `demo/backend/src/app/services/workspace_service.py`
- Create or Modify: demo backend tests covering invitation acceptance and `/rp-applications/mine*`
- Reference: `backend/src/app/api/v1/workspaces.py`
- Reference: `backend/src/app/services/workspace_service.py`

- [ ] **Step 1:** Add a failing demo backend test for invitation acceptance and a failing demo backend test for a `/rp-applications/mine*` flow.
- [ ] **Step 2:** Run the two focused demo backend tests and confirm they fail against the current demo state.
- [ ] **Step 3:** Implement the invitation acceptance endpoint and current-user RP application endpoints in demo by recreating the relevant route and service behavior.
- [ ] **Step 4:** Verify the demo backend keeps the app-scoped semantics for invited developers rather than forcing workspace membership access.
- [ ] **Step 5:** Re-run the focused invitation and current-user RP application tests until they pass.
- [ ] **Step 6:** Commit the invited-developer backend parity checkpoint.

## Task 4: Move frontend workspace management into demo

**Files:**
- Create or Modify: `demo/frontend/src/fetch/workspaces.ts`
- Create or Modify: `demo/frontend/src/features/workspaces/pages/WorkspacesPage.tsx`
- Create or Modify: `demo/frontend/src/features/workspaces/pages/workspaces.css`
- Create or Modify: `demo/frontend/src/routes/workspaces.ts`
- Create or Modify: `demo/frontend/src/routes/workspaces/index.ts`
- Create or Modify: `demo/frontend/src/routes/workspaces/$workspaceUuid.ts`
- Create or Modify: `demo/frontend/src/routes/workspaces/$workspaceUuid/index.ts`
- Create or Modify: `demo/frontend/src/routes/workspaces/$workspaceUuid/applications/$rpApplicationUuid.ts`
- Create or Modify: `demo/frontend/src/routes/workspaces/$workspaceUuid/application-info/$applicationInfoUuid.ts`
- Reference: `frontend/src/fetch/workspaces.ts`
- Reference: `frontend/src/features/workspaces/pages/WorkspacesPage.tsx`

- [ ] **Step 1:** Add or copy a failing demo frontend route or API test for the main workspace page.
- [ ] **Step 2:** Run a focused demo frontend test command and confirm the workspace route or fetch behavior is not wired yet.
- [ ] **Step 3:** Recreate `frontend/src/fetch/workspaces.ts` and the minimum workspace page surface inside `demo/frontend`.
- [ ] **Step 4:** Recreate the workspace route tree in `demo/frontend`, keeping the same nested route structure needed by TanStack Router.
- [ ] **Step 5:** Re-run the focused demo frontend workspace test and make it pass with the smallest viable implementation.
- [ ] **Step 6:** Commit the demo frontend workspace migration checkpoint.

## Task 5: Move invite and current-user frontend flows into demo

**Files:**
- Create or Modify: `demo/frontend/src/routes/invitations/rp-applications.ts`
- Create or Modify: `demo/frontend/src/routes/rp-applications/mine/$rpApplicationUuid.ts`
- Create or Modify: demo frontend pages and hooks required by those routes
- Modify: `demo/frontend/src/fetch/workspaces.ts`
- Reference: `frontend/src/routes/invitations/rp-applications.ts`
- Reference: `frontend/src/routes/rp-applications/mine/$rpApplicationUuid.ts`

- [ ] **Step 1:** Add failing demo frontend tests for the invitation entry route and the current-user RP application detail route.
- [ ] **Step 2:** Run those focused tests and confirm route resolution or data loading fails before the implementation is moved.
- [ ] **Step 3:** Recreate the invitation route and current-user RP application route in `demo/frontend`, preserving token handling and app-scoped fetch behavior.
- [ ] **Step 4:** Check the parent route layout assumptions so nested demo routes render children correctly instead of leaving the old parent page visible.
- [ ] **Step 5:** Re-run the focused invite/current-user demo frontend tests until they pass.
- [ ] **Step 6:** Commit the invited-developer frontend parity checkpoint.

## Task 6: Add demo verification coverage

**Files:**
- Create or Modify: demo backend tests for workspace and invite flows
- Create or Modify: demo frontend tests for workspace, invite, and current-user routes
- Modify: `demo/frontend/src/fetch/workspaces.ts` if test seams are needed
- Modify: `demo/backend/src/app/api/v1/workspaces.py` or `demo/backend/src/app/services/workspace_service.py` if backend test seams are needed

- [ ] **Step 1:** Expand demo backend tests to cover the key workspace CRUD, application info, invitation acceptance, and `/rp-applications/mine*` endpoints.
- [ ] **Step 2:** Run the focused demo backend test command and confirm the migrated backend feature remains green.
- [ ] **Step 3:** Expand demo frontend tests to cover workspace navigation, invitation entry, and current-user RP application interactions.
- [ ] **Step 4:** Run the focused demo frontend test command and confirm the migrated frontend feature remains green.
- [ ] **Step 5:** Commit the demo verification coverage checkpoint.

## Task 7: Remove workspace ownership from the main backend

**Files:**
- Modify or Delete: `backend/src/app/api/v1/workspaces.py`
- Modify or Delete: `backend/src/app/services/workspace_service.py`
- Modify or Delete: workspace-owned schemas and repositories under `backend/src/app/`
- Modify: main backend router registration files
- Modify: `backend/tests/test_workspaces_api.py`

- [ ] **Step 1:** Add or update a focused main backend test that proves the removed workspace feature surface is no longer registered after extraction.
- [ ] **Step 2:** Remove main backend workspace route registration and delete or detach only the workspace-owned backend modules identified in Task 1.
- [ ] **Step 3:** Keep any shared auth, DB, exception, or authorization modules that are still referenced by non-workspace code.
- [ ] **Step 4:** Run the focused main backend validation command and confirm the removed feature surface is gone without unrelated breakage.
- [ ] **Step 5:** Commit the main backend removal checkpoint.

## Task 8: Remove workspace ownership from the main frontend

**Files:**
- Modify or Delete: `frontend/src/fetch/workspaces.ts`
- Modify or Delete: `frontend/src/features/workspaces/pages/WorkspacesPage.tsx`
- Modify or Delete: workspace route files under `frontend/src/routes/workspaces*`
- Modify or Delete: `frontend/src/routes/invitations/rp-applications.ts`
- Modify or Delete: `frontend/src/routes/rp-applications/mine/$rpApplicationUuid.ts`
- Modify: `frontend/tests/unit/routes/workspaces-route.test.ts`
- Modify: `frontend/tests/unit/features/workspaces/workspaces-api.test.ts`

- [ ] **Step 1:** Add or update a focused main frontend test that proves the removed workspace feature surface is no longer present after extraction.
- [ ] **Step 2:** Remove the main frontend workspace routes, pages, and fetch wiring once the demo frontend feature is verified.
- [ ] **Step 3:** Leave unrelated routes, shared UI primitives, and application shell behavior untouched.
- [ ] **Step 4:** Run the focused main frontend validation command and confirm the removed feature surface is gone without collateral regressions.
- [ ] **Step 5:** Commit the main frontend removal checkpoint.

## Task 9: Final migration verification

**Files:**
- Modify: `openspec/changes/move-workspaces-to-demo/tasks.md`
- Reference: all migrated demo/backend and demo/frontend files
- Reference: remaining main backend/frontend registration files

- [ ] **Step 1:** Run focused demo backend validation with `cd demo/backend && pytest -q` or the most targeted migrated test selection available.
- [ ] **Step 2:** Run focused demo frontend validation with `cd demo/frontend && pnpm run test -- --runInBand` or the most targeted migrated test selection available.
- [ ] **Step 3:** Run focused main backend validation with `cd backend && UV_PROJECT_ENVIRONMENT=../.venv uv run pytest backend/tests/test_workspaces_api.py -q` or the updated equivalent.
- [ ] **Step 4:** Run focused main frontend validation with `cd frontend && pnpm run test -- tests/unit/routes/workspaces-route.test.ts tests/unit/features/workspaces/workspaces-api.test.ts` or the updated equivalent.
- [ ] **Step 5:** Update `openspec/changes/move-workspaces-to-demo/tasks.md` to reflect completed work and note any follow-up items discovered during validation.
- [ ] **Step 6:** Commit the final verification checkpoint.