## 1. Backend Contracts and Error Signaling

- [x] 1.1 Add DTO `CurrentUserRPApplicationSummaryRead` in `backend/src/app/schemas/rp_application.py` with fields `id`, `uuid`, `dnrAppName`, and `departmentId`.
- [x] 1.2 Add DTO `CurrentUserRPApplicationDepartmentAssignRequest` in `backend/src/app/schemas/rp_application.py` with required `departmentUuid` field.
- [x] 1.3 Extend `RPApplicationCurrentUserOAuthSetupRead` in `backend/src/app/schemas/rp_application.py` with `departmentName` and `departmentNameFr`.
- [x] 1.4 Implement missing-department conflict signaling with code `rp_application_department_required` in backend error handling path.

## 2. Backend Service Logic

- [x] 2.1 Add service method in `backend/src/app/services/rp_application_service.py` to read one owner-scoped RP application department preflight record from local DB only (no IBM SDK).
- [x] 2.2 Add service method to assign RP application department from `departmentUuid` and enforce one-time assignment semantics (only when current `department_id` is null).
- [x] 2.3 Add local department name resolution (`departmentName`, `departmentNameFr`) to OAuth setup response assembly.
- [x] 2.4 Add shared precondition check in service layer that raises missing-department conflict for protected owner child flows (`oauth-setup`, `mau-report`).
- [x] 2.5 Add RP application audit logging for successful department assignment update.

## 3. Backend Routes

- [x] 3.1 Add `GET /api/v1/rp-applications/mine/{rp_application_uuid}/department` in `backend/src/app/api/v1/rp_applications.py` returning `CurrentUserRPApplicationSummaryRead`.
- [x] 3.2 Add `PATCH /api/v1/rp-applications/mine/{rp_application_uuid}/department` in `backend/src/app/api/v1/rp_applications.py` accepting `CurrentUserRPApplicationDepartmentAssignRequest` and returning updated `CurrentUserRPApplicationSummaryRead`.
- [x] 3.3 Update owner child routes in `backend/src/app/api/v1/rp_applications.py` to include `409` conflict responses for missing department precondition.

## 4. Frontend Fetch Contracts

- [x] 4.1 Add `CurrentUserRPApplicationSummaryRead` and `CurrentUserRPApplicationDepartmentAssignRequest` types in `frontend/src/fetch/rp-applications.ts`.
- [x] 4.2 Add fetch function for `GET /api/v1/rp-applications/mine/{rpApplicationUuid}/department` with no-store semantics.
- [x] 4.3 Add fetch function for `PATCH /api/v1/rp-applications/mine/{rpApplicationUuid}/department` with JSON body `{ departmentUuid }`.
- [x] 4.4 Extend `CurrentUserRPOAuthSetupRead` in `frontend/src/fetch/rp-applications.ts` with `departmentName` and `departmentNameFr`.

## 5. Frontend Routing and Setup Flow

- [x] 5.1 Update parent route guard in `frontend/src/routes/rp-applications/mine/$rpApplicationUuid.ts` to preflight department endpoint and redirect missing-department apps to `/rp-applications/mine/$rpApplicationUuid/department-setup`.
- [x] 5.2 Add allowlist behavior in the parent guard so `/department-setup` does not redirect-loop.
- [x] 5.3 Add route file for `/rp-applications/mine/$rpApplicationUuid/department-setup` and include breadcrumb integration.
- [x] 5.4 Implement department setup page under `frontend/src/features/rp-applications/pages/` with application-specific copy, forced flow UI, department picker (`useDepartments(1, 200)`), and redirect-on-success behavior.
- [x] 5.5 Ensure setup flow does not show success toast and does not include cancel/back action.

## 6. Frontend Owner Child Pages

- [x] 6.1 Update OAuth setup page in `frontend/src/features/rp-applications/pages/CurrentUserRPOAuthSetupPage.tsx` to render `Department` row from localized `departmentName`/`departmentNameFr`.
- [x] 6.2 Update OAuth setup page error handling to route `409` + `rp_application_department_required` to `/rp-applications/mine/$rpApplicationUuid/department-setup`.
- [x] 6.3 Update MAU report page/hook flow to route `409` + `rp_application_department_required` to `/rp-applications/mine/$rpApplicationUuid/department-setup`.
- [x] 6.4 Preserve existing `403 -> /access-denied`, `404 -> /error?kind=not_found`, and default unexpected error routing.

## 7. Localization

- [x] 7.1 Add EN translation keys for RP application department setup page copy and OAuth setup `Department` label.
- [x] 7.2 Add FR translation keys matching EN additions.

## 8. Backend Tests

- [x] 8.1 Add API tests for owner department preflight endpoint success (`200`), non-owner (`403`), and missing resource (`404`).
- [x] 8.2 Add API/service tests for assignment endpoint success, unknown department (`404`), and already-assigned conflict behavior.
- [x] 8.3 Add API tests verifying `409` + `rp_application_department_required` for missing-department access to owner `oauth-setup` and `mau-report` routes.
- [x] 8.4 Add tests validating OAuth setup DTO includes `departmentName` and `departmentNameFr` from local DB.

## 9. Frontend Tests

- [x] 9.1 Add route guard tests for parent RP application route redirect behavior when department preflight `departmentId` is null.
- [x] 9.2 Add setup page tests for application name rendering, forced-flow controls, department submission, and redirect fallback behavior.
- [x] 9.3 Add OAuth setup page tests for department row rendering and `409` conflict redirect handling.
- [x] 9.4 Add MAU flow tests for `409` conflict redirect handling.

## 10. Verification

- [x] 10.1 Run backend targeted tests for RP application owner routes and new assignment/department-preflight behavior.
- [x] 10.2 Run frontend unit tests for route guard, setup page, OAuth details, and MAU redirect behavior.
- [x] 10.3 Run backend lint/typecheck and frontend lint/build checks for changed files.
- [x] 10.4 Run `openspec status --change enforce-rp-application-department-setup` and confirm apply-ready status.
