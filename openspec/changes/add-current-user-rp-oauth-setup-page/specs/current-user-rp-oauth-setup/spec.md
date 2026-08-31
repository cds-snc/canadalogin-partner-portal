## ADDED Requirements

### Requirement: Current-user OAuth setup detail endpoint
The system SHALL provide a current-user scoped endpoint at `/api/v1/rp-applications/mine/{rpApplicationUuid}/oauth-setup` that returns a strict DTO for OAuth setup and application context. The response MUST exclude workspace identifiers and other workspace concepts.

#### Scenario: Authorized owner requests OAuth setup detail
- **WHEN** an authenticated user who is an RP application owner requests `/api/v1/rp-applications/mine/{rpApplicationUuid}/oauth-setup`
- **THEN** the API returns `200` with fields for application context (`rpApplicationName`, `status`, optional `applicationUrl`, optional `discoveryEndpoint`) and OAuth setup (`clientId`, `clientSecret`, optional `pkceEnabled`, `redirectUris`, optional `logoutUri`, `logoutRedirectUris`)

#### Scenario: Non-owner requests OAuth setup detail
- **WHEN** an authenticated user who does not own the RP application requests `/api/v1/rp-applications/mine/{rpApplicationUuid}/oauth-setup`
- **THEN** the API returns `403`

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

### Requirement: Current-user OAuth setup page route and rendering
The frontend SHALL provide a route at `/rp-applications/mine/$rpApplicationUuid` and render a read-only page with sections ordered as Application context first and OAuth client setup second.

#### Scenario: User opens detail page from dashboard
- **WHEN** a user clicks an RP application name in dashboard resources
- **THEN** navigation resolves to `/rp-applications/mine/$rpApplicationUuid` and the page renders read-only setup data

### Requirement: Secret display is protected in the UI
The OAuth setup page MUST mask client secret by default and require explicit reveal to view the value.

#### Scenario: User loads page before revealing secret
- **WHEN** the OAuth setup page first renders
- **THEN** client secret is not shown in clear text until the user chooses reveal

### Requirement: OAuth setup fetch uses fresh data
The frontend MUST request OAuth setup detail with no-store semantics to avoid stale credential/configuration data.

#### Scenario: User refreshes OAuth setup page
- **WHEN** the user reloads `/rp-applications/mine/$rpApplicationUuid`
- **THEN** the frontend issues a fresh request and does not rely on cached setup payload

### Requirement: RP OAuth setup error routing
The frontend MUST route RP OAuth setup failures according to the agreed mapping.

#### Scenario: Forbidden OAuth setup response
- **WHEN** the OAuth setup request returns `403`
- **THEN** the user is redirected to `/access-denied`

#### Scenario: Missing RP OAuth setup resource
- **WHEN** the OAuth setup request returns `404`
- **THEN** the user is redirected to `/error?kind=not_found`

#### Scenario: Unexpected OAuth setup failures
- **WHEN** the OAuth setup request returns `5xx`, network failure, or any non-403/non-404 error
- **THEN** the user is redirected to `/error?kind=unexpected`
