## MODIFIED Requirements

### Requirement: Workspace Access replaces the legacy Members destination

The portal SHALL use `/workspaces/$workspaceUuid/access` as the canonical
user-facing workspace destination for role assignments and workspace-owned
invitation management made available by the canonical authorization model.
Invitation creation SHALL remain available after a workspace exists even when
the workspace has no RP application.

The page SHALL apply the actor's delegation boundary: CL Admin MAY manage RP
Admin, RP User (Edit), and Read Only in the selected workspace; RP Admin SHALL
manage only RP User (Edit) and Read Only in the RP Admin's assigned workspace;
lower partner roles SHALL NOT mutate assignments or invitations.

#### Scenario: Authorized user opens workspace Access

- **WHEN** an authorized user chooses Access from a workspace hub or side navigation
- **THEN** the portal opens `/workspaces/$workspaceUuid/access`
- **AND** the page presents only the assignment and invitation information or actions permitted for that user in the selected workspace
- **AND** the visible title and navigation label use `Access` rather than the retired `Members` concept

#### Scenario: Legacy Members link redirects to Access safely

- **WHEN** a user requests `/workspaces/$workspaceUuid/members`
- **AND** the requested workspace and current user pass the normal route-entry checks
- **THEN** the portal redirects to `/workspaces/$workspaceUuid/access`
- **AND** the redirect does not grant or preserve authority beyond the canonical assignment and invitation model

#### Scenario: Unauthorized Access remains hidden and denied

- **WHEN** the canonical authorization context does not permit the user to view or manage workspace Access
- **THEN** the workspace hub and side navigation omit the Access destination
- **AND** a direct request fails through the standard safe authorization behavior without revealing assignment or invitation data

#### Scenario: Access data stays on safe surfaces

- **WHEN** the Access page reads or changes assignment or invitation data
- **THEN** the portal exposes only the minimum permitted user and lifecycle fields for the selected workspace
- **AND** it does not place email addresses, invitation tokens, assignment payloads, or authorization context in route parameters, analytics, diagnostic body logs, or real-data fixtures
- **AND** audit metadata for a consequential access action excludes invitation secrets and unnecessary personal information

#### Scenario: CL Admin invites the first RP Admin before application work

- **WHEN** a CL Admin opens Access for an existing workspace with no RP applications
- **THEN** the portal allows the CL Admin to create an RP Admin invitation for that workspace
- **AND** the workflow does not require placeholder application data or an IBM Verify operation

#### Scenario: RP Admin manages only lower roles in workspace context

- **WHEN** an RP Admin opens Access in the assigned workspace
- **THEN** the portal permits assignment and invitation actions only for RP User (Edit) and Read Only
- **AND** RP Admin and cross-workspace actions remain unavailable and denied

