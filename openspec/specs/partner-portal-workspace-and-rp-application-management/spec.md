# partner-portal-workspace-and-rp-application-management

## Purpose
Define the currently implemented owner-scoped RP application credential and usage-management behavior for the partner portal.

## Requirements

### Requirement: Owner-scoped credential management is available for current-user RP applications
The portal SHALL provide a credential-management experience at `/your-applications/$rpApplicationUuid/manage-credentials` for owner-scoped RP applications backed by current-user API endpoints.

#### Scenario: Owner loads credential-management page
- **WHEN** an authenticated owner opens `/your-applications/$rpApplicationUuid/manage-credentials`
- **THEN** the page loads current OAuth setup context, current client credentials, and rotated secrets for that RP application

#### Scenario: Credential-management page routes owner failures consistently
- **WHEN** the credential-management page load returns `403`, `404`, or another unexpected error
- **THEN** the portal redirects to `/access-denied`, `/error?kind=not_found`, or `/error?kind=unexpected` respectively

### Requirement: Current client secret stays masked until explicitly revealed
The credential-management page MUST mask the current client secret by default and require an explicit reveal action before showing the current value.

#### Scenario: User opens credential-management page before reveal
- **WHEN** the credential-management page first renders current client credentials
- **THEN** the client secret is shown as a masked placeholder until the user chooses reveal

### Requirement: Owners can operate current and rotated secrets from the credential-management page
The credential-management page SHALL allow owners to copy the client ID, reveal and copy the current client secret, regenerate the current secret, create named rotated secrets, and delete selected rotated secrets.

#### Scenario: Owner regenerates the current client secret
- **WHEN** an owner confirms a current-secret regeneration action
- **THEN** the portal calls the owner-scoped rotation endpoint, refreshes the displayed credentials, and reveals the newly returned current secret

#### Scenario: Owner creates and deletes rotated secrets
- **WHEN** an owner submits a rotation name or chooses a rotated secret for deletion
- **THEN** the portal creates or deletes the selected rotated secret through owner-scoped API endpoints and refreshes the rotated-secret list

### Requirement: Owner-scoped MAU reporting is available for current-user RP applications
The portal SHALL provide a usage-report page at `/your-applications/$rpApplicationUuid/mau-report` backed by the owner-scoped MAU report endpoint.

#### Scenario: Owner opens MAU report page
- **WHEN** an authenticated owner opens `/your-applications/$rpApplicationUuid/mau-report`
- **THEN** the page loads a default rolling date range and displays MAU results for that RP application

#### Scenario: Owner filters and exports MAU data
- **WHEN** an owner applies a new date range on the MAU report page
- **THEN** the page refreshes the report for that range and supports export of the loaded report data to CSV

#### Scenario: MAU report shows department context when available
- **WHEN** the owner-scoped MAU report response includes a department name
- **THEN** the page displays the department label with the returned department name above the usage results