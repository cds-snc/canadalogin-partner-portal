# Delta for current-user-rp-oauth-setup

## MODIFIED Requirements

### Requirement: Legacy current-user OAuth setup is retired

The portal SHALL NOT use a workspace-agnostic, IBM-backed current-user OAuth
setup detail as an Application or RP-configuration landing experience.
`/your-applications` SHALL redirect to `/workspaces` and SHALL NOT provide a
selection list. A saved record-specific current-user path SHALL authorize and
resolve the retained RP record to its owning workspace and Application before
redirecting to the canonical nested RP-configuration overview or
Configuration.

Provider-backed Usage and credential operations MAY continue behind their
focused, separately authorized nested routes. A provider outage SHALL NOT make
the Application hub, RP-configuration hub, or portal-owned Configuration
unavailable.

#### Scenario: Current-user selection opens the canonical RP task hub

- **WHEN** an authorized partner follows a saved `/your-applications/$rpApplicationUuid` record link
- **THEN** the portal resolves current workspace and Application scope and redirects to `/workspaces/$workspaceUuid/applications/$applicationUuid/rp-configurations/$rpConfigurationUuid`
- **AND** it does not load or render the retired IBM-backed OAuth setup detail
- **AND** new selection starts from `/workspaces`, not a current-user RP list

#### Scenario: Portal-owned configuration survives a provider outage

- **WHEN** IBM Verify is unavailable and an authorized partner opens the Application, RP-configuration overview, or Configuration
- **THEN** portal-owned summary, task, registration, and lifecycle data remain available
- **AND** the outage is shown only by a focused provider-backed operation that is affected

#### Scenario: Retired current-user root does not call provider discovery

- **WHEN** an admitted user follows `/your-applications`
- **THEN** the portal redirects to `/workspaces` without loading IBM Verify or an RP configuration list
- **AND** the Workspaces destination applies current server-owned authorization
