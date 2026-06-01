# Apply Progress

## Completed This Session

- Completed Task 1.1 by mapping the backend extraction boundary from `backend/src/app/api/v1/workspaces.py` into `WorkspaceService`, workspace/application-info schemas, repositories, dependency providers, and `backend/tests/test_workspaces_api.py`.
- Completed Task 1.2 by mapping the frontend extraction boundary across `frontend/src/fetch/workspaces.ts`, `frontend/src/fetch/application-info.ts`, workspace route files, invite and current-user RP application routes, workspace pages/components, generated route wiring, and the focused workspaces unit tests.
- Completed Task 1.3 by separating workspace-owned code from shared infrastructure that must stay in the main app.
- Unblocked the demo backend by adding the minimum local app, dependency, cache, access-control, workflow, and test scaffolding needed for `demo/backend` to import and test its own API modules.
- Started Task 2.1 by adding the first demo workspace backend routes and providers for `POST /api/v1/workspaces`, `GET /api/v1/rp-applications/mine`, `GET /api/v1/rp-applications/mine/{rp_application_uuid}`, and `POST /api/v1/rp-application-developer-invitations/accept`.
- Added focused demo backend coverage for the first migrated workspace route slice in `demo/backend/tests/test_workspaces_api.py`.
- Expanded the demo workspace route slice with `GET /api/v1/workspaces/mine` and invitation-management endpoints for list, revoke, and resend under `/api/v1/workspaces/{workspace_uuid}/applications/{rp_application_uuid}/developer-invitations`.
- Expanded the demo workspace route slice again with `PATCH /api/v1/rp-applications/mine/{rp_application_uuid}` and `GET /api/v1/workspaces/{workspace_uuid}/application-info`.
- Grew focused demo backend workspace coverage to 10 route-level tests in `demo/backend/tests/test_workspaces_api.py`.
- Expanded the demo workspace route slice with workspace-scoped RP application create, update, delete, and client-credential read endpoints.
- Expanded the demo workspace route slice again with rotated client-secret list, create, delete, and rotate endpoints for workspace-scoped RP applications.
- Expanded the demo workspace route slice again with RP application usage summary and audit-trail read endpoints.
- Grew focused demo backend workspace coverage to 21 route-level tests in `demo/backend/tests/test_workspaces_api.py`.
- Expanded the demo workspace route slice with workspace update/delete and membership add/list/delete endpoints.
- Expanded the demo workspace route slice again with application-info create, update, and delete endpoints.
- Grew focused demo backend workspace coverage to 29 route-level tests in `demo/backend/tests/test_workspaces_api.py`.
- Completed Task 2.1 by adding the migrated workspace and RP application backend routes to `demo/backend` with the demo app dependencies they need.
- Completed Task 2.2 by recreating the workspace service, schema, and CRUD helper surface in `demo/backend` to preserve the existing API contracts used by the moved feature.
- Completed Task 2.3 by migrating invited-developer acceptance and current-user RP application backend behavior into `demo/backend`.
- Completed Task 2.4 by adding focused demo backend tests for workspace management and invited-developer flows.
- Completed focused demo backend validation for the migrated workspace and invited-developer feature slice with `UV_PROJECT_ENVIRONMENT=.venv uv run pytest demo/backend/tests/test_workspaces_api.py -q`.
- Completed Task 3.1 by adding the migrated workspace management pages, route wiring, and fetch helpers to `demo/frontend`.
- Completed Task 3.2 by migrating invitation entry routes and current-user RP application detail routes into `demo/frontend` with a preserved nested workspace route layout.
- Completed Task 3.3 by recreating the workspace-related copy and feature-specific frontend dependencies needed by the demo workspace slice.
- Completed Task 3.4 by adding focused demo frontend tests for workspace fetch helpers and invitation route search parsing.
- Completed focused demo frontend syntax validation for the migrated workspace frontend slice with `get_errors` on the new demo frontend files.
- Completed Task 4.1 by removing the main backend workspace route registration and the workspace service/dependency shim from the main app.
- Completed Task 4.2 by removing the main frontend workspace route subtree and the page modules that only served the extracted feature.
- Completed Task 4.3 by retaining shared main-app dependencies such as the workspace repository layer and shared fetch helpers used by unrelated features.
- Completed Task 5.2 by validating the demo frontend workspace slice with focused syntax checks on the migrated demo files.
- Completed Task 5.3 by validating the main frontend after workspace removal with a focused Vitest slice and confirming the deleted workspace route imports no longer resolve.
- Completed Task 5.4 by documenting the remaining verification follow-up: the repo worktree is still dirty outside this change, so final git-side cleanup remains for the later finalize step.

## Boundary Findings

### Backend workspace-owned slice

- `backend/src/app/api/v1/workspaces.py`
- `backend/src/app/services/workspace_service.py`
- workspace-related schemas in `backend/src/app/schemas/workspace.py`
- application-info schemas in `backend/src/app/schemas/application_info.py`
- workspace/application-info repositories such as `crud_workspaces`, `crud_workspace_members`, `crud_rp_applications`, `crud_rp_application_developer_invitations`, `crud_application_infos`, and `crud_application_contacts`
- route-level coverage in `backend/tests/test_workspaces_api.py`

### Frontend workspace-owned slice

- `frontend/src/fetch/workspaces.ts`
- `frontend/src/fetch/application-info.ts`
- `frontend/src/features/workspaces/**`
- workspace route files under `frontend/src/routes/workspaces/**`
- invitation route `frontend/src/routes/invitations/rp-applications.ts`
- current-user RP application route `frontend/src/routes/rp-applications/mine/$rpApplicationUuid.ts`
- generated route wiring in `frontend/src/routeTree.gen.ts`
- focused frontend tests in `frontend/tests/unit/routes/workspaces-route.test.ts` and `frontend/tests/unit/features/workspaces/workspaces-api.test.ts`

### Shared infrastructure that should remain in the main app unless proven otherwise

- dependency providers in `backend/src/app/api/dependencies.py`
- shared auth/session/current-user flows
- shared DB/session helpers
- shared exception and access-control layers
- shared utility modules such as slugification and config
- backend repositories reused outside the workspace slice, including `crud_workspaces` from `backend/src/app/services/user_service.py`
- frontend dashboard usage that still imports workspace fetch helpers today

## Validation Completed

- `cd demo/backend && UV_PROJECT_ENVIRONMENT=../../.venv uv run pytest tests/test_post_api.py -q`
- `cd demo/backend && UV_PROJECT_ENVIRONMENT=../../.venv uv run pytest tests/test_policy.py tests/test_post_access_control.py -q`
- `cd demo/backend && UV_PROJECT_ENVIRONMENT=../../.venv uv run pytest tests/test_workspaces_api.py -q`
- `cd demo/backend && UV_PROJECT_ENVIRONMENT=../../.venv uv run pytest tests/test_post_api.py tests/test_policy.py tests/test_post_access_control.py tests/test_workspaces_api.py -q`
- `cd /Users/yiwei.wang/repo/gc-signin-partner-portal && UV_PROJECT_ENVIRONMENT=.venv uv run pytest demo/backend/tests/test_workspaces_api.py -q`
- `get_errors` on the new demo frontend workspace route, fetch, page, and test files
- `get_errors` on the edited main backend modules after workspace removal
- `grep_search` checks confirming the main app no longer has workspace route entry points or workspace service registration strings
- `make ft-test` after deleting stale main-app workspace route and page tests
- `cd frontend && pnpm run test -- tests/unit/pages/DashboardPage.test.tsx tests/unit/features/workspaces/components/ApplicationInfoModal.test.tsx tests/unit/features/workspaces/components/WorkspaceApplicationModal.test.tsx tests/unit/features/workspaces/components/WorkspaceClientCredentialsModal.test.tsx tests/unit/features/workspaces/components/ApplicationContactModal.test.tsx`

## Recommended Next Step

Proceed to the verify/finalize workflow now that the task checklist is complete; the remaining follow-up is git-side cleanup because the broader worktree still contains unrelated changes.