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

## Blockers Encountered

1. The OpenSpec apply preflight expects the change directory to be committed before creating an isolated worktree, but `openspec/changes/move-workspaces-to-demo/` is still untracked and I cannot create a commit without explicit user instruction.

## Validation Completed

- `cd demo/backend && UV_PROJECT_ENVIRONMENT=../../.venv uv run pytest tests/test_post_api.py -q`
- `cd demo/backend && UV_PROJECT_ENVIRONMENT=../../.venv uv run pytest tests/test_policy.py tests/test_post_access_control.py -q`
- `cd demo/backend && UV_PROJECT_ENVIRONMENT=../../.venv uv run pytest tests/test_workspaces_api.py -q`
- `cd demo/backend && UV_PROJECT_ENVIRONMENT=../../.venv uv run pytest tests/test_post_api.py tests/test_policy.py tests/test_post_access_control.py tests/test_workspaces_api.py -q`

## Remaining Backend Route Surface

- `GET /api/v1/workspaces` still is not mirrored in demo and would require the supporting repository stub or the real migrated data layer behind it
- developer-invite creation and any remaining application-contact routes under the application-info subtree are still not mirrored from `backend/src/app/api/v1/workspaces.py`
- any backend route behavior that still requires richer request schemas than the minimal demo placeholders currently added

## Remaining Backend Migration Work

- replace the current placeholder demo `WorkspaceService` methods with real migrated logic from `backend/src/app/services/workspace_service.py`
- replace the current minimal demo workspace/application-info schemas with the real migrated contracts where needed
- bring over the workspace/application-info repository adapters that the real demo service layer needs, while keeping shared dependencies in the main app

## Recommended Next Step

Finish any remaining thin workspace routes such as `/api/v1/workspaces` and invite/application-contact endpoints if needed, then shift Task 2.2 from route wiring to real service/schema/repository migration behind the now-broader demo route surface.