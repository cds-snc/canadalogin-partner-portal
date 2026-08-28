# Delta for partner-portal-workspace-and-rp-application-management

## MODIFIED Requirements

### Requirement: Workspace-scoped RP applications represent one environment registration each

The portal SHALL provide canonical workspace-scoped RP application routes and
APIs. RP Admin and RP User (Edit) SHALL create and update RP applications
inside their assigned workspace. Read Only and CL Admin SHALL receive only
metadata/status views permitted by their canonical capabilities and SHALL NOT
change partner configuration.

Each RP application record SHALL represent one CanadaLogin environment
registration linked to exactly one workspace and optionally one
application-information record. A current-user RP application response SHALL
be a grant-authorized projection of that same workspace-owned record and SHALL
NOT create a second ownership model, configuration source, or independent
detail experience.

#### Scenario: Workspace admin creates a workspace-scoped RP application from workspace context

- **WHEN** an RP Admin or RP User (Edit) creates an RP application from `/workspaces/$workspaceUuid/applications/new`
- **THEN** the portal stores one environment-specific registration for the selected CanadaLogin environment
- **AND** it may link the record to existing application information

#### Scenario: One application-information record keeps multiple environment registrations

- **WHEN** an authorized partner editor creates multiple RP applications linked to the same application information for different CanadaLogin environments
- **THEN** the portal preserves separate RP application records
- **AND** it does not overwrite one environment registration with another

#### Scenario: Workspace-scoped RP application detail shows operational context

- **WHEN** an authorized canonical role opens `/workspaces/$workspaceUuid/applications/$rpApplicationUuid`
- **THEN** the portal shows only the application-information context, RP application status, identifiers, and actions permitted to that role
- **AND** it does not expose secret material to CL Admin or Read Only

#### Scenario: Current-user projection resolves to the owning workspace

- **WHEN** an authorized partner user selects an RP application returned through the current-user application projection
- **THEN** the selected resource keeps its owning `workspaceUuid` and RP application UUID
- **AND** navigation resolves to `/workspaces/$workspaceUuid/applications/$rpApplicationUuid`
- **AND** the portal does not load a separate workspace-agnostic or IBM-backed RP application record

#### Scenario: Workspace and RP application identifiers must match

- **WHEN** a caller uses a workspace-scoped route or API with an RP application owned by another workspace
- **THEN** the portal applies the standard safe unavailable response
- **AND** it does not disclose the other workspace, RP application, grant, provider record, or configuration

### Requirement: Grant-authorized credential management is available for accessible RP applications

The portal SHALL provide canonical credential management at
`/workspaces/$workspaceUuid/applications/$rpApplicationUuid/manage-credentials`
for RP applications inside an active partner workspace scope. Existing
grant-derived accessible-resource backend APIs MAY remain compatibility
adapters during migration, but the system SHALL verify that the RP application
belongs to the workspace in the route and authorize the active workspace grant
before retrieving credential or secret data. RP Admin and RP User (Edit) SHALL
be authorized to use the credential-management experience. Read Only and CL
Admin SHALL NOT discover or retrieve credential or secret values.

#### Scenario: Authorized partner editor loads credential-management page

- **WHEN** an RP Admin or RP User (Edit) opens `/workspaces/$workspaceUuid/applications/$rpApplicationUuid/manage-credentials` for an RP application in the assigned workspace
- **THEN** the page loads the minimum secret-free RP context, current client credentials, and rotated secrets for that RP application
- **AND** credential and secret calls verify the grant and RP/workspace relationship before any provider retrieval

#### Scenario: Credential-management page routes inaccessible resources safely

- **WHEN** the frontend capability guard denies secret access, the RP application does not belong to the route workspace, or a scoped request returns not found or another unexpected error
- **THEN** the portal uses the standard access-denied, safe not-found, or unexpected-error behavior respectively
- **AND** it does not reveal whether an out-of-scope RP application or secret resource exists

#### Scenario: Legacy credential route resolves safely

- **WHEN** an RP Admin or RP User (Edit) follows `/your-applications/$rpApplicationUuid/manage-credentials` during the compatibility period
- **THEN** the portal resolves the owning workspace through current-user scope and redirects to the canonical workspace-scoped credential route
- **AND** a missing, revoked, or out-of-scope resource receives the same safe unavailable response before secret retrieval

### Requirement: Grant-authorized MAU reporting is available for accessible RP applications

The portal SHALL provide the canonical application Usage page at
`/workspaces/$workspaceUuid/applications/$rpApplicationUuid/usage` for RP
applications inside an active partner workspace scope. RP Admin, RP User
(Edit), and Read Only SHALL read the report within scope through a server-
authorized workspace/RP application query. CL Admin and users without an
active permitted grant for the owning workspace SHALL receive the same safe
unavailable response as a missing resource.

The implementation MAY preserve the existing grant-derived accessible MAU API
as a compatibility adapter while callers migrate, provided it verifies the
same RP ownership and workspace grant before returning report data.

#### Scenario: Authorized partner user opens MAU report page

- **WHEN** an RP Admin, RP User (Edit), or Read Only user opens `/workspaces/$workspaceUuid/applications/$rpApplicationUuid/usage` for an in-scope RP application
- **THEN** the page loads a default rolling date range and displays the implemented usage results for that RP application

#### Scenario: Authorized partner user filters and exports MAU data

- **WHEN** an authorized partner user applies a new date range on the Usage page
- **THEN** the page refreshes the report for that range
- **AND** it supports CSV export only for the loaded in-scope report data

#### Scenario: MAU report shows department context when available

- **WHEN** the scoped Usage response includes a department name
- **THEN** the page displays the localized department label with the returned department name above the usage results

#### Scenario: Legacy MAU report route resolves safely

- **WHEN** an authorized partner user follows `/your-applications/$rpApplicationUuid/mau-report` during the compatibility period
- **THEN** the portal resolves the owning workspace and redirects to the canonical workspace-scoped Usage route
- **AND** it does not disclose or return report data for a missing, revoked, or out-of-scope resource

## ADDED Requirements

### Requirement: RP application summaries are consistent across authorized list surfaces

The selected-workspace RP application list and `/your-applications` SHALL use
one secret-free RP application summary definition and the same user-visible
status semantics. The current-user projection MAY add localized workspace name
and canonical grant role as projection context, but it SHALL NOT redefine the
RP application's name, environment, onboarding state, promotion state, or
resume task.

The shared summary SHALL contain the RP application UUID, owning workspace
UUID, localized RP application name, CanadaLogin environment, onboarding
state, optional promotion state, and permitted resume-task destination.
Provider identifiers, client identifiers, credentials, secret values, raw
provider status or payload, and authorization-policy internals SHALL NOT be
included.

#### Scenario: The same RP application appears in both lists

- **WHEN** an authorized partner user can view one RP application through both `/your-applications` and `/workspaces/$workspaceUuid/applications`
- **THEN** both surfaces show the same localized RP application name, CanadaLogin environment, onboarding state, optional promotion state, and next permitted resume task
- **AND** both links resolve to the same canonical workspace-scoped overview

#### Scenario: Cross-workspace projection adds meaningful workspace context

- **WHEN** `/your-applications` presents RP applications from more than one authorized workspace
- **THEN** each summary uses the localized workspace name as context
- **AND** raw workspace or RP UUIDs are not the primary visible labels

#### Scenario: Workspace list omits redundant presentation without changing meaning

- **WHEN** the selected workspace page already identifies the workspace in its H1 and hierarchy
- **THEN** the RP summaries MAY use a more compact workspace presentation
- **AND** their RP name, environment, lifecycle states, resume-task semantics, and canonical destination remain identical to the current-user projection

#### Scenario: Summary requests remain server scoped

- **WHEN** either RP application list requests summary data
- **THEN** the backend applies the session, canonical authorization, active workspace grant, and resource scope before serialization
- **AND** the browser does not receive a broader RP application dataset and filter it to permitted records

### Requirement: Registration validation failures remain actionable and preserve draft recovery

Completing a registration step SHALL distinguish correctable validation from a
draft load, concurrency, network, or persistence failure. A correctable `422`
SHALL keep the user on the current step, preserve entered answers and the last
server-saved draft/version, and present a localized error summary with safe
field-level feedback when field locations are returned. It SHALL NOT describe
the draft as unavailable or imply that server-saved answers were lost.

Frontend request serialization and backend validation SHALL share or test one
documented registration-draft contract, including field aliases, enum values,
conditional prerequisites, repeatable URL list shapes, `stepId`, `saveMode`,
and `expectedDraftVersion`.

#### Scenario: Valid Endpoints answers advance registration

- **WHEN** an authorized partner editor submits a representative valid Endpoints `completeStep` payload for a current server-backed draft
- **THEN** the backend accepts the documented frontend-serialized request
- **AND** it saves the Endpoints answers, increments the draft version, marks only the valid step complete, and returns the draft needed to advance

#### Scenario: Correctable Endpoints validation stays on Step 2

- **WHEN** the Endpoints `PATCH` returns `422` for one or more correctable answers
- **THEN** the frontend remains on Endpoints and focuses a localized error summary linked to affected controls
- **AND** it preserves the user's entered values and the last server-saved draft/version
- **AND** it does not show the generic draft-load or unavailable-draft message

#### Scenario: Contract drift is caught before release

- **WHEN** frontend registration serialization or backend request aliases,
  enums, prerequisites, or list shapes change
- **THEN** a cross-stack contract test submits the actual frontend-shaped
  Endpoints request to backend validation
- **AND** an incompatible change fails verification rather than surfacing only
  as an unexplained runtime `422`

#### Scenario: Non-validation save failure remains recoverable

- **WHEN** the Endpoints save fails because of a network, service, or unexpected persistence error
- **THEN** the frontend shows a scoped localized retry notice distinct from field validation and draft-load failure
- **AND** it preserves entered values and the last server-saved draft without advancing or marking the step complete

#### Scenario: Registration validation logs remain safe and traceable

- **WHEN** the backend accepts or rejects a registration step
- **THEN** structured logs include the safe actor reference, workspace and RP application identifiers, step, save mode, safe changed or invalid field names, result, stable error code when applicable, and request/correlation identifier
- **AND** logs exclude questionnaire values, URLs, certificates, JWK content, credentials, tokens, private keys, and unnecessary personal information
