## Why

Owners can navigate from dashboard to RP application owner routes even when the selected RP application has no associated department. This creates inconsistent behavior and prevents the product from enforcing a required application state before showing details and MAU data.

## What Changes

- Add a database-only owner-scoped department preflight endpoint for one RP application: `GET /api/v1/rp-applications/mine/{rpApplicationUuid}/department`.
- Add a one-time owner-scoped assignment endpoint: `PATCH /api/v1/rp-applications/mine/{rpApplicationUuid}/department` accepting a JSON DTO with `departmentUuid`.
- Enforce one-time assignment semantics for the new PATCH endpoint (assign only when RP application `departmentId` is currently null).
- Add backend conflict handling for protected owner child routes when an owned RP application has no department, including `409` conflict response with specific code for frontend routing decisions.
- Keep owner department preflight endpoint informational (`200` with `departmentId: null`) so frontend route guards can perform normal branching.
- Add frontend route guard behavior under `/rp-applications/mine/$rpApplicationUuid` to redirect missing-department applications to `/rp-applications/mine/$rpApplicationUuid/department-setup`.
- Add a dedicated frontend setup route/page at `/rp-applications/mine/$rpApplicationUuid/department-setup` with application-specific copy, no cancel path, and no success toast.
- Use existing profile onboarding precedence: user profile department setup remains first; RP application department setup runs after user-level onboarding is complete.
- Add conflict-aware frontend fallback mapping (`409` with the RP-application-department-required code routes to department setup).
- Extend owner OAuth setup response to include department name fields for details display (`departmentName`, `departmentNameFr`) resolved from local database.
- Add department label rendering on the owner OAuth setup page (`Department` label, localized value selection in frontend).
- Preserve dashboard list visuals (no missing-department badge/status changes in this change).
- Add backend and frontend tests for endpoint contracts, access control, routing, conflict behavior, and setup flow outcomes.

## Capabilities

### New Capabilities
- `current-user-rp-application-department-setup`: Owner-scoped RP application department precondition enforcement, one-time assignment API, and frontend setup route/guard flow.

### Modified Capabilities
- `current-user-rp-oauth-setup`: Extend OAuth setup behavior to include department display fields and missing-department conflict handling for protected owner child routes.

## Impact

- Backend API/routes: `backend/src/app/api/v1/rp_applications.py`.
- Backend schemas/services: `backend/src/app/schemas/rp_application.py`, `backend/src/app/services/rp_application_service.py`, exception handling surfaces as needed for conflict code behavior.
- Backend data access: `backend/src/app/repositories/crud_departments.py` read path for department name resolution.
- Frontend routes/pages: RP application parent route guard, new department setup route/page, owner OAuth setup page, and MAU route/page redirect handling.
- Frontend fetch contracts: `frontend/src/fetch/rp-applications.ts` new owner department preflight and assignment DTOs/endpoints, updated OAuth setup DTO fields.
- Localization: EN/FR translation catalogs for RP application department setup and details field labels/messages.
- Tests: backend API/service ownership and conflict tests; frontend route guard, setup page, and redirect mapping tests.