## 1. Backend OAuth Setup Endpoint

- [x] 1.1 Add a strict OAuth setup response schema in `backend/src/app/schemas/rp_application.py` with explicit fields: `rpApplicationName`, `status`, optional `applicationUrl`, optional `discoveryEndpoint`, `clientId`, `clientSecret`, optional `pkceEnabled`, `redirectUris`, optional `logoutUri`, and `logoutRedirectUris`.
- [x] 1.2 Add a service method in `backend/src/app/services/rp_application_service.py` to resolve current-user ownership from local owner snapshots and load the local RP application record.
- [x] 1.3 Integrate IBM Verify retrieval in the new service method to assemble `clientId`, `clientSecret`, `pkceEnabled`, `redirectUris`, `logoutUri`, and `logoutRedirectUris` for the authorized RP application.
- [x] 1.4 Source `discoveryEndpoint` from backend OIDC settings and include it in the endpoint response.
- [x] 1.5 Enforce missing `clientSecret` as unexpected failure in service response assembly.
- [x] 1.6 Add `GET /api/v1/rp-applications/mine/{rp_application_uuid}/oauth-setup` route in `backend/src/app/api/v1/rp_applications.py` using the new service method.

## 2. Backend Tests

- [x] 2.1 Add API test coverage for owner success (`200`) on the new OAuth setup endpoint.
- [x] 2.2 Add API test coverage for non-owner access denial (`403`).
- [x] 2.3 Add API test coverage for missing RP resource (`404`) and verify response contract.
- [x] 2.4 Add API/service test coverage for upstream unexpected failure handling, including missing secret behavior.

## 3. Frontend Data and Routing

- [x] 3.1 Add a frontend fetch type and function in `frontend/src/fetch/rp-applications.ts` for `/api/v1/rp-applications/mine/{rpApplicationUuid}/oauth-setup` with no-store semantics.
- [x] 3.2 Add a production route file for `/rp-applications/mine/$rpApplicationUuid` and ensure route tree generation includes it.
- [x] 3.3 Keep dashboard RP links in `frontend/src/features/dashboard/pages/DashboardPage.tsx` using current label behavior and target the same current-user route.
- [x] 3.4 Add generic error route `/error` with query kind handling (`not_found`, `unexpected`) and fallback-to-unexpected behavior.

## 4. Frontend Page and Error Flow

- [x] 4.1 Implement read-only RP OAuth setup detail page UI with section order: Application context first, OAuth setup second.
- [x] 4.2 Implement client secret UI behavior: masked by default, explicit reveal/hide interaction.
- [x] 4.3 Implement RP detail error redirects: `403 -> /access-denied`, `404 -> /error?kind=not_found`, all other failures including 5xx/network -> `/error?kind=unexpected`.
- [x] 4.4 Add generic error page actions for navigation to dashboard and home.

## 5. Localization

- [x] 5.1 Add English translation keys for RP OAuth setup page labels/messages and generic error variants/actions.
- [x] 5.2 Add French translation keys matching the new English keys and route copy.

## 6. Frontend Tests

- [x] 6.1 Add test coverage that dashboard RP links navigate to `/rp-applications/mine/$rpApplicationUuid`.
- [x] 6.2 Add test coverage for RP OAuth setup page happy-path render, including section ordering and secret mask/reveal behavior.
- [x] 6.3 Add test coverage for RP OAuth setup redirect mapping (`403`, `404`, `unexpected`).
- [x] 6.4 Add test coverage for `/error` route variant rendering and unknown-kind fallback.

## 7. Verification and Readiness

- [x] 7.1 Run backend targeted tests for new endpoint and ownership/error scenarios.
- [x] 7.2 Run frontend test suites covering route, page, and error routing behavior.
- [x] 7.3 Run linters/type checks for changed backend and frontend files.
- [x] 7.4 Re-run `openspec status --change add-current-user-rp-oauth-setup-page` and confirm the change is apply-ready.
