## Why

Dashboard users can click RP application names today, but the production frontend has no matching current-user detail route and no dedicated OAuth setup page. Users need a read-only, current-user scoped page that shows IBM Verify-backed OAuth client setup details, with predictable error routing and no workspace concepts in the UI.

## What Changes

- Add a new current-user backend endpoint to return a strict OAuth setup DTO for one RP application: `GET /api/v1/rp-applications/mine/{rpApplicationUuid}/oauth-setup`.
- Source discovery metadata from backend OIDC configuration and include `discoveryEndpoint` in the OAuth setup DTO.
- Include logout integration fields in the OAuth setup DTO: `logoutUri` and `logoutRedirectUris`.
- Keep authorization local-first using synced RP owner data, then fetch IBM Verify details only after authorization passes.
- Treat missing client secret in the backend response assembly as an unexpected error condition.
- Add a production frontend route at `/rp-applications/mine/$rpApplicationUuid` and render a read-only detail page.
- Present page sections in this order: Application context first, OAuth client setup second.
- Keep dashboard RP link labels unchanged and route them to the new detail page behavior.
- Add a reusable generic error route at `/error` with query kind support (`not_found`, `unexpected`) and standard actions.
- Map failures as follows: `403 -> /access-denied`, `404 -> /error?kind=not_found`, all other failures including 5xx/network -> `/error?kind=unexpected`.
- Add EN/FR translation keys for new page and generic error route.
- Add backend and frontend tests covering authorization, happy path, and redirect/error behavior.

## Capabilities

### New Capabilities
- `current-user-rp-oauth-setup`: Current-user scoped, read-only OAuth setup detail retrieval and rendering for RP applications.
- `generic-error-route`: Reusable generic error page route and typed error-kind routing behavior.

### Modified Capabilities
- None.

## Impact

- Backend API: `backend/src/app/api/v1/rp_applications.py`.
- Backend schemas/services: `backend/src/app/schemas/rp_application.py`, `backend/src/app/services/rp_application_service.py`, IBM Verify service integration.
- Frontend routing/pages: `frontend/src/routes`, `frontend/src/features/dashboard/pages/DashboardPage.tsx`, new RP detail page, and generated route tree updates.
- Frontend fetch contracts: `frontend/src/fetch/workspaces.ts`, request error routing in `frontend/src/fetch/request-json.ts` as needed.
- Frontend fetch contracts: `frontend/src/fetch/rp-applications.ts`, request error routing in `frontend/src/fetch/request-json.ts` as needed.
- Localization: `frontend/src/assets/locales/en/translations.json` and `frontend/src/assets/locales/fr/translations.json`.
- Tests: backend RP application API tests and frontend route/page behavior tests.
