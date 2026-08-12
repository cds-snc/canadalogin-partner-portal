# current-user-rp-oauth-setup

## Purpose

Define the retirement of the workspace-agnostic IBM-backed current-user OAuth
setup detail and its migration to the canonical workspace-owned RP application
experience.

## Requirements

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
