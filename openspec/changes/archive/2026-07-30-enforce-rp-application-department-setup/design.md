## Context

The frontend currently routes RP application owner links from dashboard to `/rp-applications/mine/$rpApplicationUuid` and loads OAuth setup details from `/api/v1/rp-applications/mine/{rpApplicationUuid}/oauth-setup`. The parent owner route currently checks only authenticated user status and does not preflight whether the RP application itself has a department.

Backend already has owner-scoped list/read service logic for current-user RP applications in `RPApplicationService`, and it already stores `department_id` locally on RP application records. Owner OAuth setup currently authorizes ownership from local synced owner snapshot first, then calls IBM Verify APIs.

The requested change introduces an application-level precondition: owners must assign a department to an RP application before using protected owner child routes (details and MAU). This must be enforced in frontend routing and backend protected child endpoints.

Hard constraints from conversation and repository evidence:
- Owner department preflight must be database-only and MUST NOT use IBM Verify SDK.
- Assignment endpoint is owner-scoped (`/mine`) and one-time (only when department is currently unset).
- New setup route is application-scoped and forced (no cancel path).
- Profile setup remains higher-priority onboarding.
- OAuth setup page must display department label/value.

## Goals / Non-Goals

**Goals:**
- Provide owner-scoped RP application department preflight endpoint for route preflight and setup page context.
- Provide owner-scoped one-time department assignment endpoint.
- Enforce missing-department precondition on protected owner child endpoints (`oauth-setup`, `mau-report`) with deterministic conflict signaling.
- Add RP application department setup route/page and parent route guard logic.
- Extend OAuth setup DTO/UI with department display fields.
- Keep behavior consistent across direct URL access, dashboard navigation, and race conditions.

**Non-Goals:**
- No dashboard list status badge for missing department.
- No general-purpose owner API for changing an already assigned department.
- No workspace-scoped write surface for this user flow.
- No IBM Verify integration in department preflight endpoint.

## Decisions

### Decision 1: Add database-only owner department preflight endpoint
- Choice: Add `GET /api/v1/rp-applications/mine/{rpApplicationUuid}/department` returning a narrow DTO from local DB only.
- DTO: `CurrentUserRPApplicationSummaryRead`
  - `id: number`
  - `uuid: string`
  - `dnrAppName: string`
  - `departmentId: number | null`
- Rationale: Route guard and setup page need ownership + department state + display name without IBM dependency.
- Alternatives considered:
  - Reuse OAuth setup endpoint as preflight: rejected due to IBM SDK dependency and heavier payload.
  - Return `409` from department preflight when department missing: rejected because guard needs normal state-based branching.

### Decision 2: Add one-time owner assignment endpoint
- Choice: Add `PATCH /api/v1/rp-applications/mine/{rpApplicationUuid}/department`.
- Request DTO: `CurrentUserRPApplicationDepartmentAssignRequest`
  - `departmentUuid: string (uuid)`
- Success response DTO: `CurrentUserRPApplicationSummaryRead` (updated preflight state).
- Behavior:
  - Owner-only access.
  - Resolve `departmentUuid` to local `department.id`.
  - Assign only if RP application currently has no department.
  - Record audit log for RP application update.
- Rationale: Keeps flow self-contained and aligned with owner route access rules.
- Alternatives considered:
  - Query parameter request shape: rejected in favor of explicit JSON contract.
  - Reuse admin/workspace update endpoints: rejected due to access model mismatch.

### Decision 3: Protect owner child endpoints with missing-department conflict
- Choice: Enforce RP application department precondition for:
  - `GET /api/v1/rp-applications/mine/{rpApplicationUuid}/oauth-setup`
  - `GET /api/v1/rp-applications/mine/{rpApplicationUuid}/mau-report`
- Error behavior for missing department:
  - HTTP `409`
  - Error code: `rp_application_department_required`
- Rationale: Backend must enforce invariant for deep links and non-browser clients.
- Alternatives considered:
  - Frontend-only enforcement: rejected as insufficient for direct API access.

### Decision 4: Add application setup route under RP application path
- Choice: Add frontend route `/rp-applications/mine/$rpApplicationUuid/department-setup`.
- Page behavior:
  - Show application name context (same display convention as dashboard, prefer `dnrAppName`).
  - Reuse simple department fetch strategy (`useDepartments(1, 200)` + client-side sort).
  - Forced flow (no cancel/back action).
  - No success toast for this flow.
  - On success, navigate to redirect target if present, else `/rp-applications/mine/$rpApplicationUuid`.
- Rationale: Application-level setup should be explicit, scoped, and deterministic.

### Decision 5: Route guard and fallback error mapping
- Choice: Parent owner route preflights department endpoint and redirects missing department to setup route, while allowing setup route itself to avoid loop.
- Fallback mapping when protected APIs return conflict:
  - `409` + `rp_application_department_required` -> redirect to setup route.
- Existing behavior preserved:
  - `403` -> `/access-denied`
  - `404` -> `/error?kind=not_found`
  - other failures -> `/error?kind=unexpected`
- Rationale: Keeps happy path and race handling coherent.

### Decision 6: Extend OAuth setup DTO with department names
- Choice: Extend owner OAuth setup response with:
  - `departmentName: string | null`
  - `departmentNameFr: string | null`
- Data source: local department table by `department_id`.
- UI: details page renders `Department` label and localized value selection in frontend.
- Rationale: avoid extra client fetch and keep display data in details payload.

### Decision 7: Error-code contract support
- Choice: expose specific conflict code `rp_application_department_required` in API error envelope for this condition.
- Rationale: frontend must distinguish this recoverable conflict from generic `409` conflicts.
- Implementation note: current HTTP exception handler maps `409` to generic `conflict`; this change requires extending error serialization for this case.

## Risks / Trade-offs

- [Risk] Introducing condition-specific `409` code may affect global error-handling assumptions.
  - Mitigation: scope custom code emission to this domain case and keep existing defaults unchanged.
- [Risk] Parent route guard can create redirect loops if setup route not allowlisted.
  - Mitigation: explicit allowlist check for `/department-setup` within RP application parent route guard.
- [Risk] Race conditions during setup submit (already assigned in parallel) can produce confusing failures.
  - Mitigation: handle assignment conflict by redirecting to details because precondition is already satisfied.
- [Risk] Enforcing backend precondition on MAU/OAuth routes may surface new `409` responses to existing clients.
  - Mitigation: document endpoint error contract and keep department preflight endpoint informational (`200`).

## Migration Plan

1. Backend contracts:
   - Add new summary and assignment DTOs.
   - Extend OAuth setup DTO with `departmentName`/`departmentNameFr`.
2. Backend endpoints/service:
  - Add owner department preflight GET route (`/mine/{rpApplicationUuid}/department`).
   - Add owner assignment PATCH route.
   - Add protected child-route precondition checks with conflict signaling.
3. Backend error handling:
   - Ensure missing-department conflict emits `rp_application_department_required`.
4. Frontend fetch contracts:
  - Add department preflight + assignment fetch functions and DTO types.
   - Extend OAuth setup fetch type with department fields.
5. Frontend routing/UI:
   - Add setup route/page.
  - Update RP parent route guard to preflight department endpoint and redirect.
   - Update OAuth and MAU pages to handle `409` missing-department redirect.
   - Add department row to OAuth setup page.
6. Localization:
   - Add EN/FR keys for setup page and details department label/copy.
7. Tests:
   - Backend API/service tests for owner access, one-time assignment, DTOs, and conflict/error codes.
   - Frontend route/fetch/page tests for guard flow, setup submission, and redirect mapping.

Rollback strategy:
- Revert new `/mine/{uuid}/department` endpoints (GET and PATCH).
- Remove setup route and guard checks.
- Revert OAuth setup DTO extension and details field rendering.
- Restore previous child-route behavior without missing-department conflict enforcement.

## Open Questions

- None blocking. Naming and scope decisions for routes, DTOs, and errors are resolved by conversation.
