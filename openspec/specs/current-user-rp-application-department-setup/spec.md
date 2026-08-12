# current-user-rp-application-department-setup

## Purpose
Define the grant-scoped RP application department preflight and forced setup flow with workspace-role-aware read and write behavior.
## Requirements
### Requirement: Parent route guard redirects missing-department RP applications

The frontend SHALL enforce RP application department setup in the parent route
`/your-applications/$rpApplicationUuid` using the grant-derived accessible
application and department-preflight endpoints. It SHALL redirect only an
in-scope RP Admin or RP User (Edit) into the write setup flow. Read Only SHALL
not be offered department-assignment controls.

#### Scenario: Guard redirects to setup route

- **WHEN** the parent route receives `AccessibleRPApplicationRead` for an RP Admin or RP User (Edit) and `AccessibleRPApplicationSummaryRead.departmentId` is `null`
- **THEN** navigation is redirected to `/your-applications/$rpApplicationUuid/department-setup`
- **AND** the intended destination is preserved through redirect search state

#### Scenario: Guard allows already-assigned application routes

- **WHEN** the parent route receives in-scope accessible application preflight data with non-null `departmentId`
- **THEN** navigation continues to the requested accessible application child route

#### Scenario: Guard avoids setup redirect loop

- **WHEN** an authorized partner editor is already on `/your-applications/$rpApplicationUuid/department-setup`
- **THEN** the parent guard does not redirect back to setup for that same navigation

#### Scenario: Guard does not expose department assignment to Read Only

- **WHEN** a Read Only user opens an in-scope RP application whose department is unset
- **THEN** the parent guard does not redirect the user into the department-assignment form
- **AND** missing-department handling offers no mutation control to that user

### Requirement: RP application department setup page behavior

The frontend SHALL provide
`/your-applications/$rpApplicationUuid/department-setup` as a forced
application-level setup flow for RP Admin and RP User (Edit) with an active
grant for the owning workspace.

#### Scenario: Setup page displays application context

- **WHEN** the setup page loads for an RP application available to the authorized partner editor
- **THEN** it displays the RP application name from `AccessibleRPApplicationSummaryRead.dnrAppName` using the same convention as the accessible applications page

#### Scenario: Setup page department picker strategy

- **WHEN** the setup page loads department options
- **THEN** it uses the same simple fetch strategy as profile setup (`useDepartments(1, 200)`) and client-side alphabetical sort

#### Scenario: Setup page successful assignment navigation

- **WHEN** assignment succeeds from the setup page
- **THEN** the frontend redirects to the supplied redirect target, or defaults to `/your-applications/$rpApplicationUuid` when no redirect is provided

#### Scenario: Setup page race where assignment is already complete

- **WHEN** setup submit receives conflict indicating assignment is already complete
- **THEN** the frontend navigates to `/your-applications/$rpApplicationUuid` instead of staying in an error state

#### Scenario: Setup page forced flow UI

- **WHEN** an authorized partner editor is on the setup page
- **THEN** the page does not present a cancel or back action and does not show a success toast for RP application assignment

### Requirement: Frontend redirect mapping for missing-department conflict

Frontend accessible RP application pages SHALL map the missing-department
conflict according to the caller's canonical role. RP Admin and RP User (Edit)
may enter the setup recovery flow; Read Only SHALL not receive that write flow.

#### Scenario: OAuth setup page receives missing-department conflict

- **WHEN** the accessible OAuth setup fetch fails with `409` and code `rp_application_department_required`
- **THEN** an RP Admin or RP User (Edit) is redirected to `/your-applications/$rpApplicationUuid/department-setup`
- **AND** a Read Only user is redirected to `/access-denied` without assignment controls

#### Scenario: MAU report page receives missing-department conflict

- **WHEN** the accessible MAU report fetch fails with `409` and code `rp_application_department_required`
- **THEN** an RP Admin or RP User (Edit) is redirected to `/your-applications/$rpApplicationUuid/department-setup`
- **AND** a Read Only user is redirected to `/access-denied` without assignment controls

### Requirement: Grant-derived accessible RP application department preflight endpoint

The system SHALL provide the database-only endpoint
`GET /api/v1/rp-applications/accessible/{rpApplicationUuid}/department` for an
RP application covered by the caller's active canonical partner workspace
grant. RP Admin, RP User (Edit), and Read Only SHALL be able to read preflight
state. The endpoint MUST NOT call IBM Verify SDK clients.

The endpoint SHALL return DTO `AccessibleRPApplicationSummaryRead` containing
exactly `id`, `uuid`, `dnrAppName`, and `departmentId`. A caller without an
active partner grant for the owning workspace, a caller with a revoked grant,
or a caller whose role is outside the permitted partner set SHALL receive the
same `404 not_found` response as a missing RP application. Historical owner
snapshots SHALL NOT authorize this endpoint.

#### Scenario: Authorized partner user retrieves RP application department preflight

- **WHEN** an RP Admin, RP User (Edit), or Read Only user requests `GET /api/v1/rp-applications/accessible/{rpApplicationUuid}/department` for an RP application in the assigned workspace
- **THEN** the API returns `200` with `AccessibleRPApplicationSummaryRead` containing exactly `id`, `uuid`, `dnrAppName`, and `departmentId`
- **AND** it performs no IBM Verify request

#### Scenario: Department preflight endpoint returns unset department state

- **WHEN** the in-scope RP application has no associated department
- **THEN** the API returns `200` and `departmentId` is `null`

#### Scenario: Out-of-scope caller requests department preflight

- **WHEN** a caller without an active permitted grant for the RP application's workspace requests the department preflight endpoint
- **THEN** the API returns `404` with error code `not_found`
- **AND** it does not disclose whether the RP application exists

#### Scenario: Missing RP application department preflight resource

- **WHEN** the requested RP application UUID does not exist
- **THEN** the API returns `404` with error code `not_found`

### Requirement: Grant-authorized one-time department assignment endpoint

The system SHALL provide
`PATCH /api/v1/rp-applications/accessible/{rpApplicationUuid}/department` to
assign an RP application department once. The endpoint SHALL accept DTO
`AccessibleRPApplicationDepartmentAssignRequest` with required field
`departmentUuid` and return updated DTO `AccessibleRPApplicationSummaryRead`.

Only RP Admin and RP User (Edit) with an active grant for the owning workspace
SHALL perform this configuration mutation. Read Only, CL Admin, users without
the owning-workspace grant, and users with revoked grants SHALL receive the
same safe `404 not_found` response as a missing resource before department
lookup or mutation.

#### Scenario: Authorized partner editor assigns missing department

- **WHEN** an RP Admin or RP User (Edit) submits `PATCH /api/v1/rp-applications/accessible/{rpApplicationUuid}/department` with body `{ "departmentUuid": "<uuid>" }` and the in-scope RP application `departmentId` is currently null
- **THEN** the API resolves the UUID from active local department records, updates RP application `departmentId`, records the RP application update audit event, and returns `200` with updated `AccessibleRPApplicationSummaryRead`

#### Scenario: Assignment uses unknown department UUID

- **WHEN** an authorized partner editor submits a `departmentUuid` that does not map to an active local department
- **THEN** the API returns `404` with error code `not_found`

#### Scenario: Assignment submitted after department already set

- **WHEN** an authorized partner editor submits assignment for an in-scope RP application whose `departmentId` is already non-null
- **THEN** the API does not modify the record and returns `409` with error code `conflict`

#### Scenario: Role without configuration authority attempts department assignment

- **WHEN** Read Only, CL Admin, or a user without the owning-workspace grant requests the department assignment endpoint
- **THEN** the API returns `404` with error code `not_found` before department lookup or record mutation

### Requirement: Protected accessible application child routes enforce missing-department conflict

The backend SHALL enforce the RP application department precondition on
protected accessible OAuth setup and MAU report routes. The precondition SHALL
run only after active grant, role, workspace, and RP application scope are
resolved. A safely unavailable resource SHALL remain `404`; an authorized
in-scope resource with no department SHALL return the specific department
conflict.

#### Scenario: Accessible OAuth setup is blocked by missing department

- **WHEN** an authorized partner user calls `GET /api/v1/rp-applications/accessible/{rpApplicationUuid}/oauth-setup` and the in-scope RP application has null `departmentId`
- **THEN** the API returns `409` with error code `rp_application_department_required`

#### Scenario: Accessible MAU report is blocked by missing department

- **WHEN** an authorized partner user calls `GET /api/v1/rp-applications/accessible/{rpApplicationUuid}/mau-report` and the in-scope RP application has null `departmentId`
- **THEN** the API returns `409` with error code `rp_application_department_required`

### Requirement: Setup route preserves canonical active-workspace access behavior

The frontend department-setup route SHALL require an active in-scope RP Admin
or RP User (Edit) role. Read Only SHALL be able to read already valid in-scope
OAuth and MAU data but SHALL NOT enter or submit the department-assignment
flow. Backend resource resolution SHALL continue to return safe `404` responses
outside active grant or role scope.

#### Scenario: Setup route denies a role without department-assignment capability

- **WHEN** a Read Only or CL Admin user attempts `/your-applications/$rpApplicationUuid/department-setup`
- **THEN** the frontend resolves to `/access-denied` without displaying or submitting the assignment form

#### Scenario: Setup route safely handles an unavailable RP application

- **WHEN** an RP Admin or RP User (Edit) requests the setup route for a missing or out-of-scope RP application
- **THEN** the accessible preflight endpoint returns `404 not_found`
- **AND** the frontend resolves to `/error?kind=not_found` without distinguishing missing from out-of-scope
