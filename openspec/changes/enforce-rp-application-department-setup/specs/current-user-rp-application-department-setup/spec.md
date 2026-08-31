## ADDED Requirements

### Requirement: Owner-scoped RP application department preflight endpoint
The system SHALL provide a database-only owner-scoped endpoint at `GET /api/v1/rp-applications/mine/{rpApplicationUuid}/department` that returns RP application department preflight state used for route preflight and setup context. The endpoint MUST NOT call IBM Verify SDK clients.

#### Scenario: Owner retrieves RP application department preflight
- **WHEN** an authenticated owner requests `GET /api/v1/rp-applications/mine/{rpApplicationUuid}/department`
- **THEN** the API returns `200` with JSON DTO `CurrentUserRPApplicationSummaryRead` containing exactly `id`, `uuid`, `dnrAppName`, and `departmentId`

#### Scenario: Department preflight endpoint returns unset department state
- **WHEN** the owned RP application has no associated department
- **THEN** the API returns `200` and `departmentId` is `null`

#### Scenario: Non-owner requests department preflight
- **WHEN** an authenticated user who does not own the RP application requests the department preflight endpoint
- **THEN** the API returns `403` with error code `forbidden`

#### Scenario: Missing RP application department preflight resource
- **WHEN** the requested RP application UUID does not exist or is not available to current user scope
- **THEN** the API returns `404` with error code `not_found`

### Requirement: Owner-scoped one-time department assignment endpoint
The system SHALL provide `PATCH /api/v1/rp-applications/mine/{rpApplicationUuid}/department` to assign an RP application department for owner-scoped setup. The endpoint MUST accept DTO `CurrentUserRPApplicationDepartmentAssignRequest` with required field `departmentUuid`.

#### Scenario: Owner assigns missing department
- **WHEN** an authenticated owner submits `PATCH /api/v1/rp-applications/mine/{rpApplicationUuid}/department` with body `{ "departmentUuid": "<uuid>" }` and the RP application `departmentId` is currently null
- **THEN** the API resolves the department UUID from local department records, updates RP application `departmentId`, records RP application update audit, and returns `200` with updated `CurrentUserRPApplicationSummaryRead`

#### Scenario: Assignment uses unknown department UUID
- **WHEN** an owner submits a `departmentUuid` that does not map to an active local department
- **THEN** the API returns `404` with error code `not_found`

#### Scenario: Assignment submitted after department already set
- **WHEN** an owner submits assignment for an RP application where `departmentId` is already non-null
- **THEN** the API does not modify the record and returns conflict-class response (`409` with error code `conflict`)

### Requirement: Parent route guard redirects missing-department RP applications
The frontend SHALL enforce RP application department setup in the parent route `/rp-applications/mine/$rpApplicationUuid` using the owner department preflight endpoint.

#### Scenario: Guard redirects to setup route
- **WHEN** the parent RP application route preflight receives department preflight data with `departmentId` set to `null`
- **THEN** navigation is redirected to `/rp-applications/mine/$rpApplicationUuid/department-setup` and preserves intended destination via redirect search state

#### Scenario: Guard allows already-assigned application routes
- **WHEN** the parent route preflight receives department preflight data with non-null `departmentId`
- **THEN** navigation continues to requested owner child route

#### Scenario: Guard avoids setup redirect loop
- **WHEN** the current path is `/rp-applications/mine/$rpApplicationUuid/department-setup`
- **THEN** the parent guard does not redirect back to setup for that same navigation

### Requirement: RP application department setup page behavior
The frontend SHALL provide `/rp-applications/mine/$rpApplicationUuid/department-setup` as a forced application-level setup flow.

#### Scenario: Setup page displays application context
- **WHEN** the setup page loads for an owned RP application
- **THEN** it displays the RP application name using the same display convention as dashboard (`dnrAppName` primary)

#### Scenario: Setup page department picker strategy
- **WHEN** setup page loads department options
- **THEN** it uses the same simple fetch strategy as profile setup (`useDepartments(1, 200)`) and client-side alphabetical sort

#### Scenario: Setup page successful assignment navigation
- **WHEN** assignment succeeds from setup page
- **THEN** frontend redirects to supplied redirect target, or defaults to `/rp-applications/mine/$rpApplicationUuid` when no redirect is provided

#### Scenario: Setup page race where assignment is already complete
- **WHEN** setup submit receives conflict indicating assignment is already complete
- **THEN** frontend navigates to `/rp-applications/mine/$rpApplicationUuid` instead of staying in an error state

#### Scenario: Setup page forced flow UI
- **WHEN** user is on setup page
- **THEN** the page does not present a cancel/back action and does not show success toast for RP application assignment

### Requirement: Protected owner child routes enforce missing-department conflict
The backend SHALL enforce RP application department precondition on protected owner child routes and return specific conflict signaling when missing.

#### Scenario: OAuth setup blocked by missing department
- **WHEN** owner calls `GET /api/v1/rp-applications/mine/{rpApplicationUuid}/oauth-setup` and RP application has null `departmentId`
- **THEN** API returns `409` with error code `rp_application_department_required`

#### Scenario: MAU report blocked by missing department
- **WHEN** owner calls `GET /api/v1/rp-applications/mine/{rpApplicationUuid}/mau-report` and RP application has null `departmentId`
- **THEN** API returns `409` with error code `rp_application_department_required`

### Requirement: Frontend redirect mapping for missing-department conflict
Frontend owner RP application pages SHALL map the missing-department conflict code to setup route recovery.

#### Scenario: OAuth setup page receives missing-department conflict
- **WHEN** OAuth setup fetch fails with `409` and code `rp_application_department_required`
- **THEN** frontend redirects to `/rp-applications/mine/$rpApplicationUuid/department-setup`

#### Scenario: MAU report page receives missing-department conflict
- **WHEN** MAU report fetch fails with `409` and code `rp_application_department_required`
- **THEN** frontend redirects to `/rp-applications/mine/$rpApplicationUuid/department-setup`

### Requirement: Access/error behavior parity for setup route
The setup route SHALL preserve owner-route access semantics for non-owner and missing-resource cases.

#### Scenario: Setup route forbidden case
- **WHEN** a non-owner accesses `/rp-applications/mine/$rpApplicationUuid/department-setup`
- **THEN** frontend resolves to `/access-denied` via `403` behavior

#### Scenario: Setup route not-found case
- **WHEN** setup route is requested for missing RP application
- **THEN** frontend resolves to `/error?kind=not_found` via `404` behavior
