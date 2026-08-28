# Delta for current-user-rp-oauth-setup

## ADDED Requirements

### Requirement: Legacy current-user OAuth setup is retired

The portal SHALL NOT use the workspace-agnostic, IBM-backed current-user OAuth
setup detail as an RP application landing or configuration experience.
Current-user RP application selection SHALL resolve through the authorized
projection to the canonical workspace-scoped overview and portal-owned
Configuration capability.

Provider-backed Usage and credential operations MAY continue behind their
focused, separately authorized routes. A provider outage SHALL NOT make the RP
overview or portal-owned Configuration unavailable.

#### Scenario: Current-user selection opens the canonical RP task hub

- **WHEN** an authorized partner selects an RP application from `/your-applications`
- **THEN** the portal opens `/workspaces/$workspaceUuid/applications/$rpApplicationUuid`
- **AND** it does not load or render the retired IBM-backed OAuth setup detail

#### Scenario: Portal-owned configuration survives a provider outage

- **WHEN** IBM Verify is unavailable and an authorized partner opens the RP overview or Configuration
- **THEN** portal-owned summary, task, registration, and lifecycle data remain available
- **AND** the outage is shown only by a focused provider-backed operation that is affected

## REMOVED Requirements

### Requirement: Discovery endpoint is backend-sourced

**Reason**: The MVP1 accessible OAuth setup response is being retired as the
RP application landing-page source. A public discovery endpoint does not
justify an IBM-backed, workspace-agnostic detail capability.

**Migration**: When useful to the partner, expose the public CanadaLogin
discovery endpoint from backend OIDC configuration as an optional value in the
new secret-free workspace-scoped Configuration read. Its absence must not make
the RP task hub or Configuration unavailable.

### Requirement: OAuth setup fetch uses fresh data

**Reason**: The IBM-backed OAuth setup page and its dedicated fetch lifecycle
are being removed. The canonical landing page uses portal-owned RP summary
data, and Configuration uses portal-owned registration persistence.

**Migration**: Apply the normal current-data and cache rules to canonical
workspace-scoped overview and Configuration queries. Provider-backed Usage and
credential operations retain their existing operation-specific freshness and
security requirements.

### Requirement: Accessible RP application OAuth setup detail endpoint

**Reason**: This endpoint is the technical center of the stale MVP1 parallel
detail experience. It couples basic RP task discovery and configuration
availability to IBM Verify and does not use the workspace-scoped resource
hierarchy that now owns RP applications.

**Migration**: Use the canonical workspace-scoped RP overview and secret-free
Configuration contracts in `partner-portal-rp-application-experience`.
Current-user selection remains grant scoped and supplies the owning
`workspaceUuid`. Deprecate the accessible OAuth setup endpoint after callers
migrate and remove it only through a compatible API slice.

### Requirement: Active workspace authorization precedes upstream retrieval

**Reason**: The requirement is expressed only around an upstream OAuth setup
read that will no longer power the landing or Configuration page.

**Migration**: Preserve and generalize the security invariant in the canonical
RP application experience: resolve the RP application's owning workspace and
active canonical grant before returning summary/configuration data, following
a legacy redirect, or invoking provider-backed Usage or credential operations.
Out-of-scope requests continue to short-circuit before provider access.

### Requirement: OAuth setup responses remain secret-free

**Reason**: The specific `AccessibleRPApplicationOAuthSetupRead` response is
being retired. Keeping it solely as the secret-free wrapper for configuration
would perpetuate the duplicate MVP1 source and route hierarchy.

**Migration**: The workspace-scoped Configuration contract is secret-free and
portal backed. Client IDs, credentials, current or rotated secrets, tokens,
private/symmetric key material, and raw provider payloads remain confined to
the separately authorized Manage credentials capability or are never exposed.

### Requirement: Accessible RP application detail page route and rendering

**Reason**: `/your-applications/$rpApplicationUuid` is a workspace-agnostic
detail route for a resource now canonically owned and managed inside one
workspace. Its embedded OAuth rows and two action cards conflict with the
workspace detail and with the requested three-feature RP task model.

**Migration**: `/your-applications` remains the current-user cross-workspace
projection, but each selection opens
`/workspaces/$workspaceUuid/applications/$rpApplicationUuid`. The canonical
page uses the RP application name as H1 and capability-filtered Configuration,
Usage, and Manage credentials cards. The old route becomes an authorized
compatibility redirect without loading IBM Verify.

### Requirement: RP OAuth setup errors preserve safe resource availability

**Reason**: These UI errors are specific to the retiring IBM-backed OAuth setup
panel and include a provider-outage partial state that should not exist on the
portal-owned task hub or Configuration page.

**Migration**: Canonical RP application routes preserve safe not-found behavior
for missing and out-of-scope resources, direct capability denial for protected
children, scoped retry states for their own data, and authorized legacy
redirects. IBM outages may affect provider-backed Usage or credential
operations but do not make the overview or portal Configuration unavailable.
