# current-user-rp-oauth-setup

## Purpose
Define the current-user OAuth setup detail API and owner-scoped RP application detail experience.

## Requirements

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

### Requirement: Owner authorization and upstream retrieval ordering
The system MUST authorize access using local synced owner data before performing IBM Verify detail retrieval.

#### Scenario: Unauthorized request short-circuits upstream calls
- **WHEN** a non-owner requests OAuth setup detail
- **THEN** authorization fails with `403` before the system attempts IBM Verify detail retrieval for that request

### Requirement: Secret presence is enforced
The system MUST treat missing `clientSecret` as an unexpected failure for this endpoint.

#### Scenario: Upstream payload omits client secret
- **WHEN** IBM Verify detail retrieval succeeds but no client secret is present
- **THEN** the endpoint returns an error response in the unexpected/server failure class rather than a partial success payload

### Requirement: Discovery endpoint is backend-sourced
The system MUST source `discoveryEndpoint` from backend OIDC configuration and return it in the OAuth setup response when configured.

#### Scenario: OIDC metadata URL is configured on backend
- **WHEN** the authorized owner requests OAuth setup detail and backend `OIDC_SERVER_METADATA_URL` is set
- **THEN** the response includes `discoveryEndpoint` matching the configured metadata URL

### Requirement: Current-user RP application detail page route and rendering
The frontend SHALL provide a route at `/your-applications/$rpApplicationUuid` and render a read-only owner page with application context first and OAuth setup details second.

#### Scenario: User opens detail page from current-user applications landing page
- **WHEN** a user clicks an RP application name in `/your-applications`
- **THEN** navigation resolves to `/your-applications/$rpApplicationUuid` and the page renders read-only application and OAuth setup details

#### Scenario: Details page shows department label
- **WHEN** the detail page renders application context and a department display value is available
- **THEN** the page includes a `Department` row using localized selection from `departmentName` and `departmentNameFr`

#### Scenario: Details page exposes owner actions for usage and credentials
- **WHEN** the owner-scoped detail page renders successfully
- **THEN** the page includes navigation actions to `/your-applications/$rpApplicationUuid/mau-report` and `/your-applications/$rpApplicationUuid/manage-credentials`

### Requirement: OAuth setup fetch uses fresh data
The frontend MUST request OAuth setup detail with no-store semantics to avoid stale credential/configuration data.

#### Scenario: User refreshes OAuth setup page
- **WHEN** the user reloads `/your-applications/$rpApplicationUuid`
- **THEN** the frontend issues a fresh request and does not rely on cached setup payload

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
- **THEN** the user is redirected to `/your-applications/$rpApplicationUuid/department-setup`

#### Scenario: Unexpected OAuth setup failures
- **WHEN** the OAuth setup request returns `5xx`, network failure, or any non-403/non-404/non-conflict error
- **THEN** the user is redirected to `/error?kind=unexpected`
