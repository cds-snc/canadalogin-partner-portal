# Delta for current-user RP OAuth setup

## ADDED Requirements

### Requirement: Accessible RP application OAuth setup detail endpoint

The system SHALL provide
`GET /api/v1/rp-applications/accessible/{rpApplicationUuid}/oauth-setup` for an
RP application in a workspace covered by the caller's active canonical partner
grant. RP Admin, RP User (Edit), and Read Only SHALL be able to read this
secret-free OAuth configuration. CL Admin, users without an active grant for
the owning workspace, and users whose grant is revoked SHALL receive the same
safe not-found response as a missing RP application before any upstream call.

The endpoint SHALL return strict DTO `AccessibleRPApplicationOAuthSetupRead`
with application and onboarding context (`rpApplicationName`, `status`,
optional `canadaLoginEnvironment`, optional `onboardingState`, optional
`promotionStatus`, optional `applicationUrl`, optional `discoveryEndpoint`,
optional `departmentName`, and optional `departmentNameFr`) plus non-secret
OAuth configuration (optional `pkceEnabled`, `redirectUris`, optional
`logoutUri`, and `logoutRedirectUris`). It SHALL NOT return a client ID, client
secret, secret identifier, rotated secret, internal workspace identifier, or
owner snapshot.

#### Scenario: Authorized partner role requests OAuth setup detail

- **WHEN** an RP Admin, RP User (Edit), or Read Only user requests OAuth setup for an RP application in the workspace covered by that user's active grant
- **THEN** the API returns `200` with `AccessibleRPApplicationOAuthSetupRead`
- **AND** the response contains no credential or secret fields

#### Scenario: Out-of-scope requester receives a safe unavailable response

- **WHEN** a caller without an active permitted grant for the RP application's workspace requests the accessible OAuth setup endpoint
- **THEN** the API returns `404` with error code `not_found`
- **AND** it does not disclose whether the RP application or its upstream registration exists

#### Scenario: Missing-department accessible application cannot load OAuth setup

- **WHEN** an authorized partner user requests OAuth setup for an in-scope RP application whose department is unset
- **THEN** the API returns `409` with error code `rp_application_department_required`

### Requirement: Active workspace authorization precedes upstream retrieval

The system MUST resolve the RP application's owning workspace and the caller's
active canonical partner grant before performing IBM Verify detail retrieval.
Historical application-owner data, owner-email snapshots, platform role names,
and upstream groups SHALL NOT satisfy this authorization check.

#### Scenario: Out-of-scope request short-circuits upstream calls

- **WHEN** a caller lacks an active permitted grant for the RP application's workspace
- **THEN** the request resolves as `404 not_found`
- **AND** the system does not attempt IBM Verify detail retrieval for that request

### Requirement: OAuth setup responses remain secret-free

The OAuth setup endpoint MUST treat IBM Verify detail as an upstream source for
non-secret application and OAuth configuration only. Client credentials and
secret lifecycle data SHALL remain available only through the separate
credential endpoints authorized for RP Admin and RP User (Edit).

#### Scenario: Upstream OAuth detail contains or omits client secret data

- **WHEN** IBM Verify detail retrieval succeeds for an authorized OAuth setup request, whether or not the upstream payload contains a client secret
- **THEN** the endpoint returns the non-secret `AccessibleRPApplicationOAuthSetupRead` fields
- **AND** it neither requires nor serializes client secret data

### Requirement: Accessible RP application detail page route and rendering

The frontend SHALL provide `/your-applications/$rpApplicationUuid` as the
detail route for an RP application available through the signed-in user's
active partner workspace grant. The page SHALL combine safe application scope
from `AccessibleRPApplicationRead` (`uuid`, `dnrAppName`, public
`workspaceUuid`, canonical `role`, and permitted application context) with
secret-free OAuth setup from `AccessibleRPApplicationOAuthSetupRead`.

#### Scenario: Partner user opens detail page from accessible applications

- **WHEN** an RP Admin, RP User (Edit), or Read Only user selects an in-scope RP application from `/your-applications`
- **THEN** navigation resolves to `/your-applications/$rpApplicationUuid`
- **AND** the page renders only the application and OAuth setup details permitted by that active workspace grant

#### Scenario: Details page shows department label

- **WHEN** the detail page renders application context and a department display value is available
- **THEN** the page includes a `Department` row using localized selection from `departmentName` and `departmentNameFr`

#### Scenario: Details page exposes role-appropriate usage and credential actions

- **WHEN** the accessible application detail page renders successfully
- **THEN** RP Admin, RP User (Edit), and Read Only receive the in-scope MAU-report navigation action
- **AND** only RP Admin and RP User (Edit) receive the credential-management action
- **AND** Read Only and CL Admin receive no credential or secret action

### Requirement: RP OAuth setup errors preserve safe resource availability

The frontend SHALL apply the canonical role guard before loading an
accessible RP application and SHALL map backend failures without distinguishing
an out-of-scope resource from a missing one.

#### Scenario: Frontend role guard denies OAuth setup route

- **WHEN** the signed-in authorization context has no partner role capable of entering the accessible RP application experience
- **THEN** the frontend redirects to `/access-denied` without requesting secret or upstream-backed resources

#### Scenario: Out-of-scope OAuth setup resource

- **WHEN** the accessible OAuth setup request returns `404` because the caller lacks an active grant for the owning workspace
- **THEN** the frontend redirects to `/error?kind=not_found`
- **AND** the response does not reveal whether the resource exists

#### Scenario: Missing RP OAuth setup resource

- **WHEN** the accessible OAuth setup request returns `404` because the RP application is missing
- **THEN** the frontend redirects to `/error?kind=not_found`

#### Scenario: Missing-department conflict response

- **WHEN** the accessible OAuth setup request returns `409` with code `rp_application_department_required`
- **THEN** an RP Admin or RP User (Edit) is redirected to `/your-applications/$rpApplicationUuid/department-setup`
- **AND** a Read Only user is not offered the department-assignment flow

#### Scenario: Authorized detail remains available during upstream outage

- **WHEN** the grant-authorized application metadata loads but the upstream-backed OAuth setup request returns `503`
- **THEN** the frontend remains on `/your-applications/$rpApplicationUuid` and renders a localized unavailable notice for the OAuth setup panel
- **AND** role-appropriate application actions remain available

#### Scenario: Unexpected OAuth setup failures

- **WHEN** application metadata fails, or the accessible OAuth setup request returns a network failure or any non-not-found/non-department-conflict/non-`503` error
- **THEN** the frontend redirects to `/error?kind=unexpected`

## MODIFIED Requirements

### Requirement: Discovery endpoint is backend-sourced

The system MUST source `discoveryEndpoint` from backend OIDC configuration and
return it in the secret-free accessible OAuth setup response when configured.

#### Scenario: OIDC metadata URL is configured on backend

- **WHEN** an authorized partner user requests in-scope OAuth setup detail and backend `OIDC_SERVER_METADATA_URL` is set
- **THEN** `AccessibleRPApplicationOAuthSetupRead` includes `discoveryEndpoint` matching the configured metadata URL

### Requirement: OAuth setup fetch uses fresh data

The frontend MUST request accessible OAuth setup detail with no-store semantics
to avoid stale application or configuration data.

#### Scenario: User refreshes OAuth setup page

- **WHEN** an authorized partner user reloads `/your-applications/$rpApplicationUuid`
- **THEN** the frontend issues a fresh request to the accessible OAuth setup endpoint and does not rely on a cached payload

## REMOVED Requirements

### Requirement: Current-user OAuth setup detail endpoint

**Reason**: The `/mine` route and application-owner authorization model are
retired. Current-user availability is now derived from active canonical
workspace grants.

**Migration**: Use Accessible RP application OAuth setup detail endpoint. The
authorized request, unavailable request, and missing-department scenarios are
preserved with `AccessibleRPApplicationOAuthSetupRead`, canonical partner
roles, and safe `404` behavior outside scope.

### Requirement: Owner authorization and upstream retrieval ordering

**Reason**: Historical owner data is not an authorization source in the
four-role model.

**Migration**: Use Active workspace authorization precedes upstream retrieval.
The short-circuit scenario remains required, now using active grant and
workspace scope before any IBM Verify request.

### Requirement: Secret presence is enforced

**Reason**: OAuth setup is a secret-free read available to all three partner
roles. Requiring a client secret would cross the Read Only boundary and couple
a non-secret response to credential availability.

**Migration**: Use OAuth setup responses remain secret-free. The prior missing-
secret case is intentionally replaced: secret absence no longer fails OAuth
setup, and secret values remain confined to RP Admin/RP User (Edit) credential
endpoints.

### Requirement: Current-user RP application detail page route and rendering

**Reason**: The page remains at the same user-facing route, but its data and
actions are derived from active partner workspace grants rather than owner
status.

**Migration**: Use Accessible RP application detail page route and rendering.
The application-link, department-label, usage-action, and credential-action
scenarios are preserved with explicit canonical role boundaries.

### Requirement: RP OAuth setup error routing

**Reason**: Out-of-scope accessible resources use the same safe not-found
contract as missing resources instead of an owner-specific forbidden response.

**Migration**: Use RP OAuth setup errors preserve safe resource availability.
The denied-route, missing-resource, department-conflict, and unexpected-error
paths remain covered without exposing resource existence.
