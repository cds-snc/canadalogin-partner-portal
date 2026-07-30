# Partner Portal Workspace And RP Application Management

## ADDED Requirements

### Requirement: Workspace administration is restored under dedicated workspace routes
The portal SHALL provide authenticated workspace-administration routes under `/workspaces` and workspace CRUD APIs under `/api/v1/workspaces` for authorized users. Each workspace SHALL remain associated with exactly one department and SHALL expose its name, slug, description, department, and membership summary on list and detail views.

#### Scenario: Workspace admin creates a department-scoped workspace
- **WHEN** a workspace admin completes the create flow at `/workspaces/new`
- **THEN** the portal creates the workspace through `POST /api/v1/workspaces`, stores the selected department association, and redirects to `/workspaces/$workspaceUuid`

#### Scenario: Authorized user loads workspace list and detail
- **WHEN** an authorized user opens `/workspaces` and then `/workspaces/$workspaceUuid`
- **THEN** the portal loads the accessible workspace set from `/api/v1/workspaces` or `/api/v1/workspaces/mine` and shows the selected workspace detail without exposing unauthorized workspaces

#### Scenario: Unauthorized actor cannot mutate workspace metadata
- **WHEN** a user without workspace-admin authority attempts to create, update, or delete a workspace
- **THEN** the portal denies the action and the API returns the standard safe error contract instead of mutating the workspace

### Requirement: Workspace membership management stays scoped to workspace administrators
Workspace administrators SHALL manage membership at `/workspaces/$workspaceUuid/members` through `/api/v1/workspaces/{workspace_uuid}/members` endpoints. Membership SHALL remain explicit to one workspace and SHALL NOT grant broader department or invitation-scoped access.

#### Scenario: Workspace admin adds or updates a member role
- **WHEN** a workspace admin adds a user or changes an existing member role from the membership screen
- **THEN** the portal persists the membership through `POST` or `PATCH /api/v1/workspaces/{workspace_uuid}/members` resources and reflects the updated role in the workspace member list

#### Scenario: Duplicate membership is rejected
- **WHEN** a workspace admin attempts to add a user who already has an active membership in that workspace
- **THEN** the system rejects the duplicate membership and keeps the existing membership unchanged

#### Scenario: Removing a workspace member does not grant or preserve broader access
- **WHEN** a workspace admin removes a member from a workspace
- **THEN** the portal deletes only that workspace membership and the removed user no longer receives access to that workspace through the removed membership

### Requirement: Application information and contacts are managed as workspace-owned records
The portal SHALL provide application-information list, detail, create, and edit routes under `/workspaces/$workspaceUuid/application-information` and CRUD APIs under `/api/v1/workspaces/{workspace_uuid}/application-information`. Application information SHALL own canonical bilingual application metadata and onboarding narrative, while contacts SHALL be stored and managed as separate related records.

#### Scenario: Workspace admin creates and edits canonical application information
- **WHEN** a workspace admin creates or updates an application-information record
- **THEN** the portal stores canonical bilingual service names and the onboarding sections for overview, technology and protocol, security and privacy, usage, and migration or transition planning against that application-information record

#### Scenario: Workspace admin manages application-information contacts
- **WHEN** a workspace admin adds, edits, or removes a contact for an application-information record
- **THEN** the portal persists the change through the related contact endpoints and shows the updated contact list on the application-information detail view

#### Scenario: Linked RP applications block destructive deletion
- **WHEN** a workspace admin attempts to delete an application-information record that is still linked to one or more RP applications
- **THEN** the system rejects the delete request and identifies that linked RP applications must be unlinked or removed first

### Requirement: Workspace-scoped RP applications represent one environment registration each
The portal SHALL provide workspace-scoped RP application routes under `/workspaces/$workspaceUuid/applications` and CRUD APIs under `/api/v1/workspaces/{workspace_uuid}/applications`. Each RP application record SHALL represent one CanadaLogin environment registration linked to exactly one workspace and optionally one application-information record.

#### Scenario: Workspace admin creates a workspace-scoped RP application from workspace context
- **WHEN** a workspace admin creates an RP application from `/workspaces/$workspaceUuid/applications/new`
- **THEN** the portal stores one environment-specific registration record for the selected CanadaLogin environment and may link it to an existing application-information record for canonical metadata reuse

#### Scenario: One application-information record keeps multiple environment registrations
- **WHEN** a workspace admin creates more than one workspace-scoped RP application linked to the same application-information record for different CanadaLogin environments
- **THEN** the portal preserves separate RP application records and does not overwrite each environment registration with another environment's answers

#### Scenario: Workspace-scoped RP application detail shows operational context
- **WHEN** a user with permission opens `/workspaces/$workspaceUuid/applications/$rpApplicationUuid`
- **THEN** the portal shows the linked application-information context, the current RP application status, and the IBM Security Verify application identifier when available

### Requirement: Workspace-scoped RP application validation follows the current OIDC questionnaire
When a workspace admin creates or updates a workspace-scoped RP application for OpenID Connect, the portal SHALL capture and validate the current CanadaLogin relying-party registration questionnaire for one environment at a time.

#### Scenario: Registration enforces current questionnaire constraints
- **WHEN** a workspace admin saves or submits workspace-scoped OIDC registration data
- **THEN** the portal requires a selected CanadaLogin environment, requires `openid` in the requested scopes, requires PKCE for `public` clients, keeps Authorization Code Flow as the supported response flow, and restricts front-channel logout to `canada.ca` domains

#### Scenario: Conditional follow-up answers are required for dependent selections
- **WHEN** a workspace admin selects `private_key_jwt`, an `Other` algorithm, or an unsupported signing, validation, encryption, or decryption capability answer
- **THEN** the portal requires the matching key-distribution detail, free-text algorithm field, or roadmap or risk follow-up branch before the RP application can be saved as valid

### Requirement: Workspace-scoped RP applications expose usage and audit views
Workspace administrators SHALL be able to review usage and audit activity for a workspace-scoped RP application from dedicated subroutes and APIs.

#### Scenario: Workspace admin reviews usage summary
- **WHEN** a workspace admin opens `/workspaces/$workspaceUuid/applications/$rpApplicationUuid/usage`
- **THEN** the portal loads the usage summary from `/api/v1/workspaces/{workspace_uuid}/applications/{rp_application_uuid}/usage/summary` for the selected date or range state

#### Scenario: Workspace admin reviews bounded audit activity
- **WHEN** a workspace admin opens `/workspaces/$workspaceUuid/applications/$rpApplicationUuid/audit` and applies a bounded date range
- **THEN** the portal loads matching audit events from `/api/v1/workspaces/{workspace_uuid}/applications/{rp_application_uuid}/audit-events` and supports the defined audit download behavior for that result set
