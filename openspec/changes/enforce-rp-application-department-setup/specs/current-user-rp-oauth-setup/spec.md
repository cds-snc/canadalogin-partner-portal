## MODIFIED Requirements

### Requirement: Current-user OAuth setup detail endpoint
The system SHALL provide a current-user scoped endpoint at `/api/v1/rp-applications/mine/{rpApplicationUuid}/oauth-setup` that returns a strict DTO for OAuth setup and application context. The response MUST exclude workspace identifiers and other workspace concepts.

#### Scenario: Authorized owner requests OAuth setup detail
- **WHEN** an authenticated user who is an RP application owner requests `/api/v1/rp-applications/mine/{rpApplicationUuid}/oauth-setup`
- **THEN** the API returns `200` with fields for application context (`rpApplicationName`, `status`, optional `applicationUrl`, optional `discoveryEndpoint`, optional `departmentName`, optional `departmentNameFr`) and OAuth setup (`clientId`, `clientSecret`, optional `pkceEnabled`, `redirectUris`, optional `logoutUri`, `logoutRedirectUris`)

#### Scenario: Non-owner requests OAuth setup detail
- **WHEN** an authenticated user who does not own the RP application requests `/api/v1/rp-applications/mine/{rpApplicationUuid}/oauth-setup`
- **THEN** the API returns `403`

#### Scenario: Missing-department application cannot load OAuth setup
- **WHEN** an authenticated owner requests OAuth setup for an owned RP application whose `departmentId` is null
- **THEN** the API returns `409` with error code `rp_application_department_required`

### Requirement: Current-user OAuth setup page route and rendering
The frontend SHALL provide a route at `/rp-applications/mine/$rpApplicationUuid` and render a read-only page with sections ordered as Application context first and OAuth client setup second.

#### Scenario: User opens detail page from dashboard
- **WHEN** a user clicks an RP application name in dashboard resources
- **THEN** navigation resolves to `/rp-applications/mine/$rpApplicationUuid` and the page renders read-only setup data

#### Scenario: Details page shows department label
- **WHEN** the OAuth setup details page renders application context
- **THEN** the page includes a `Department` row using localized department name selection from `departmentName` and `departmentNameFr`

### Requirement: RP OAuth setup error routing
The frontend MUST route RP OAuth setup failures according to the agreed mapping.

#### Scenario: Forbidden OAuth setup response
- **WHEN** the OAuth setup request returns `403`
- **THEN** the user is redirected to `/access-denied`

#### Scenario: Missing RP OAuth setup resource
- **WHEN** the OAuth setup request returns `404`
- **THEN** the user is redirected to `/error?kind=not_found`

#### Scenario: Missing-department conflict response
- **WHEN** the OAuth setup request returns `409` with code `rp_application_department_required`
- **THEN** the user is redirected to `/rp-applications/mine/$rpApplicationUuid/department-setup`

#### Scenario: Unexpected OAuth setup failures
- **WHEN** the OAuth setup request returns `5xx`, network failure, or any non-403/non-404/non-conflict error
- **THEN** the user is redirected to `/error?kind=unexpected`
