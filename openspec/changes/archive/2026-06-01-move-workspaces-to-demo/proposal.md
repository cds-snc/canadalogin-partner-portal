## Why

The workspaces and RP application management feature currently lives in the main partner portal app even though this change needs that slice to live exclusively in the existing demo apps. Keeping it in the main app creates the wrong ownership boundary, makes the main stack carry feature-specific complexity it should no longer host, and blocks a clean separation between essential platform behavior and demo-only functionality. This should be addressed now so the demo apps become the single maintained home for that feature while the rest of the main system remains untouched.

## What Changes

**Workspace and RP Application Feature Ownership**
- From: The main backend and frontend own workspace management, RP application management, invitation acceptance, and current-user RP application flows.
- To: `demo/backend` and `demo/frontend` own that complete feature slice, including its API routes, service logic, frontend pages, fetch helpers, route wiring, translations, and focused tests.
- Reason: The feature needs to live in demo rather than in the primary app.
- Impact: Breaking for the main app implementation surface; behavior is preserved in demo.

**Main App Feature Surface**
- From: The main app exposes workspace-related APIs and UI flows as part of the primary product surface.
- To: The main app no longer exposes that workspace feature slice after demo parity is established.
- Reason: The user explicitly wants the rest of the main app left intact while removing the workspace slice from it.
- Impact: Breaking for any main-app-only consumers of the moved feature; shared infrastructure remains in place.

**Invite and Current-User RP Application Flows**
- From: Invited-developer acceptance and `/rp-applications/mine*` flows are implemented in the main app alongside workspace-member functionality.
- To: Those flows move with the rest of the feature into demo and retain their existing route and API contracts there.
- Reason: They are part of the same feature boundary and must remain functional after the move.
- Impact: Non-breaking within demo if parity is preserved.

## Capabilities

### New Capabilities
- `demo-workspace-management`: Move workspace CRUD, membership management, application info management, client credential management, and usage reporting into the demo backend and frontend.
- `demo-invited-developer-flows`: Preserve invitation acceptance and current-user RP application access flows inside demo using the existing app-scoped contracts.
- `main-app-workspace-removal`: Remove the workspace feature slice from the main app after demo has equivalent registrations, dependencies, and focused coverage.

### Modified Capabilities

## Impact

- Affected backend code includes `backend/src/app/api/v1/workspaces.py`, `WorkspaceService`, workspace-related schemas and repositories, and route-level tests.
- Affected frontend code includes `frontend/src/features/workspaces`, `frontend/src/fetch/workspaces.ts`, related `application-info` fetch helpers, route files, translations, and tests.
- Affected demo systems include `demo/backend` and `demo/frontend`, which will receive the moved feature and its validation coverage.
- Shared auth, DB/session, common exception handling, and generic authorization layers are intentionally not targets for removal unless a dependency proves to be workspace-exclusive.