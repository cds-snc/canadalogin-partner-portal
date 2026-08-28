# Delta for partner portal workspace and RP application management

## ADDED Requirements

### Requirement: Partner workspace access uses canonical workspace-scoped roles

Partner workspace authorization SHALL use RP Admin, RP User (Edit), or Read
Only from the canonical partner access-grant model. The legacy values
workspace_admin and workspace_member SHALL NOT be accepted, displayed, or used
for authorization after cutover.

RP Admin SHALL administer workspace metadata, application information, RP
applications, partner secrets, partner reports, and permitted staff
invitations. RP User (Edit) SHALL edit application information and RP
configuration, use permitted secret workflows, submit partner-owned workflow
metadata, and read reports without managing roles or invitations. Read Only
SHALL receive permitted metadata, configuration, usage, and reporting reads
without mutation or secret access.

CL Admin SHALL bootstrap a workspace and its first RP Admin, view
cross-workspace metadata and status, and perform internal review actions without
retrieving RP secret values or performing partner-side configuration changes.

Where existing requirement names or scenarios use workspace administrator or
owner as a capability description, that description SHALL resolve through this
canonical matrix and SHALL NOT create a fifth product role.

#### Scenario: RP Admin manages partner workspace operations

- **WHEN** an RP Admin performs a supported workspace, application-information, RP-configuration, secret, reporting, or staff-invitation operation in the assigned workspace
- **THEN** the portal permits the operation within that workspace
- **AND** the role does not grant platform or another workspace's authority

#### Scenario: RP User Edit manages configuration without roles or invitations

- **WHEN** an RP User (Edit) performs a supported application-information, RP-configuration, secret, promotion-request, or reporting operation in the assigned workspace
- **THEN** the portal permits the operation
- **AND** the user cannot mutate workspace roles, invitations, or internal review outcomes

#### Scenario: Read Only receives view-only workspace access

- **WHEN** a Read Only user opens permitted workspace metadata, RP configuration, usage, or aggregate reporting in the assigned workspace
- **THEN** the portal returns the permitted read-only data
- **AND** no mutation or secret value is available

#### Scenario: CL Admin bootstraps without partner secret authority

- **WHEN** a CL Admin creates or reviews partner metadata and assigns the first RP Admin
- **THEN** the portal permits the applicable global operation
- **AND** it does not expose client credentials, secret values, or partner secret lifecycle controls

#### Scenario: Revoked partner assignment ends workspace access

- **WHEN** a user's active partner assignment for one workspace is revoked
- **THEN** the next protected request no longer receives access through that assignment
- **AND** access to other independently assigned workspaces remains unchanged

### Requirement: Grant-authorized credential management is available for accessible RP applications

The portal SHALL provide credential management at
/your-applications/$rpApplicationUuid/manage-credentials for RP applications
inside an active partner workspace scope. Its backend calls SHALL use the
`/api/v1/rp-applications/accessible/{rpApplicationUuid}` route family. RP Admin
and RP User (Edit) SHALL be authorized to use the credential-management
experience. Read Only and CL Admin SHALL NOT retrieve credential or secret
values.

#### Scenario: Authorized partner editor loads credential-management page

- **WHEN** an RP Admin or RP User (Edit) opens /your-applications/$rpApplicationUuid/manage-credentials for an RP application in the assigned workspace
- **THEN** the page loads secret-free OAuth setup context, current client credentials, and rotated secrets for that RP application
- **AND** credential and secret calls use the grant-derived accessible-resource API family

#### Scenario: Credential-management page routes inaccessible resources safely

- **WHEN** the frontend role guard denies secret capability, or an accessible-resource request returns 404 or another unexpected error
- **THEN** the portal redirects to /access-denied, /error?kind=not_found, or /error?kind=unexpected respectively
- **AND** it does not reveal whether an out-of-scope secret resource exists

### Requirement: Grant-authorized partner editors can operate current and rotated secrets

The credential-management page SHALL allow RP Admin and RP User (Edit) to copy
the client ID, reveal and copy the current client secret, regenerate the
current secret, create named rotated secrets, and delete selected rotated
secrets for RP applications inside their active workspace scope through the
grant-derived accessible-resource API family. Read Only and CL Admin SHALL NOT
perform those operations, and authorization SHALL fail before any upstream
secret retrieval or mutation.

#### Scenario: Authorized partner editor regenerates the current client secret

- **WHEN** an RP Admin or RP User (Edit) confirms current-secret regeneration for an in-scope RP application
- **THEN** the portal calls the scoped rotation endpoint, refreshes the displayed credentials, and reveals the newly returned current secret

#### Scenario: Authorized partner editor creates and deletes rotated secrets

- **WHEN** an RP Admin or RP User (Edit) submits a rotation name or chooses an in-scope rotated secret for deletion
- **THEN** the portal creates or deletes the selected rotated secret through scoped API endpoints
- **AND** it refreshes the rotated-secret list

### Requirement: Grant-authorized MAU reporting is available for accessible RP applications

The portal SHALL provide a usage-report page at
/your-applications/$rpApplicationUuid/mau-report for RP applications inside an
active partner workspace scope. RP Admin, RP User (Edit), and Read Only SHALL
read the report within scope through
`GET /api/v1/rp-applications/accessible/{rpApplicationUuid}/mau-report`. CL
Admin and users without an active grant for the owning workspace SHALL receive
the same safe unavailable response as a missing resource.

#### Scenario: Authorized partner user opens MAU report page

- **WHEN** an RP Admin, RP User (Edit), or Read Only user opens /your-applications/$rpApplicationUuid/mau-report for an in-scope RP application
- **THEN** the page loads a default rolling date range and displays MAU results for that RP application

#### Scenario: Authorized partner user filters and exports MAU data

- **WHEN** an authorized partner user applies a new date range on the MAU report page
- **THEN** the page refreshes the report for that range
- **AND** it supports CSV export only for the loaded in-scope report data

#### Scenario: MAU report shows department context when available

- **WHEN** the scoped MAU report response includes a department name
- **THEN** the page displays the department label with the returned department name above the usage results

## MODIFIED Requirements

### Requirement: Workspace administration is restored under dedicated workspace routes

The portal SHALL provide authenticated workspace routes under /workspaces and
workspace APIs under /api/v1/workspaces. CL Admin SHALL create and bootstrap
partner workspaces and review permitted cross-workspace metadata. RP Admin SHALL
administer metadata for an assigned workspace. RP User (Edit) and Read Only
SHALL NOT create, delete, or administer workspace-level identity/role state.

Each workspace SHALL remain associated with exactly one department and SHALL
expose its name, slug, description, department, and permitted summary data.

#### Scenario: Workspace admin creates a department-scoped workspace

- **WHEN** a CL Admin completes the create flow at /workspaces/new
- **THEN** the portal creates the workspace through POST /api/v1/workspaces
- **AND** it stores the selected department association
- **AND** it redirects to /workspaces/$workspaceUuid
- **AND** it permits the CL Admin to assign the first RP Admin without exposing partner secrets

#### Scenario: Authorized user loads workspace list and detail

- **WHEN** a CL Admin or partner user opens /workspaces and then an authorized /workspaces/$workspaceUuid route
- **THEN** the portal loads only the workspace set and detail permitted by the canonical global or partner assignment
- **AND** it does not expose another partner workspace

#### Scenario: Unauthorized actor cannot mutate workspace metadata

- **WHEN** a user without CL Admin attempts workspace creation, or a user without in-scope RP Admin attempts workspace update or deletion
- **THEN** the portal denies the action
- **AND** the API returns the standard safe error contract instead of mutating the workspace

### Requirement: Application information and contacts are managed as workspace-owned records

The portal SHALL provide application-information list, detail, create, and edit
routes and APIs within an active partner workspace scope. RP Admin and RP User
(Edit) SHALL create and edit application information and contacts. Read Only
and CL Admin SHALL read only the metadata/status allowed by their respective
scope and SHALL NOT perform partner-side edits.

Application information SHALL own canonical bilingual application metadata and
onboarding narrative, while contacts SHALL remain separate related records.

#### Scenario: Workspace admin creates and edits canonical application information

- **WHEN** an RP Admin or RP User (Edit) creates or updates an application-information record in the assigned workspace
- **THEN** the portal stores canonical bilingual service names and the onboarding sections for overview, technology/protocol, security/privacy, usage, and migration/transition planning

#### Scenario: Workspace admin manages application-information contacts

- **WHEN** an RP Admin or RP User (Edit) adds, edits, or removes a contact for an in-scope application-information record
- **THEN** the portal persists the change through the related contact endpoints
- **AND** it shows the updated contact list

#### Scenario: Linked RP applications block destructive deletion

- **WHEN** an authorized partner editor attempts to delete application information still linked to one or more RP applications
- **THEN** the system rejects the delete request
- **AND** it identifies that linked RP applications must be unlinked or removed first

### Requirement: Workspace-scoped RP applications represent one environment registration each

The portal SHALL provide workspace-scoped RP application routes and APIs. RP
Admin and RP User (Edit) SHALL create and update RP applications inside their
assigned workspace. Read Only and CL Admin SHALL receive only permitted
metadata/status views and SHALL NOT change partner configuration.

Each RP application record SHALL represent one CanadaLogin environment
registration linked to exactly one workspace and optionally one
application-information record.

#### Scenario: Workspace admin creates a workspace-scoped RP application from workspace context

- **WHEN** an RP Admin or RP User (Edit) creates an RP application from /workspaces/$workspaceUuid/applications/new
- **THEN** the portal stores one environment-specific registration for the selected CanadaLogin environment
- **AND** it may link the record to existing application information

#### Scenario: One application-information record keeps multiple environment registrations

- **WHEN** an authorized partner editor creates multiple RP applications linked to the same application information for different CanadaLogin environments
- **THEN** the portal preserves separate RP application records
- **AND** it does not overwrite one environment registration with another

#### Scenario: Workspace-scoped RP application detail shows operational context

- **WHEN** an authorized canonical role opens /workspaces/$workspaceUuid/applications/$rpApplicationUuid
- **THEN** the portal shows only the application-information context, RP application status, identifiers, and actions permitted to that role
- **AND** it does not expose secret material to CL Admin or Read Only

### Requirement: Workspace-scoped RP applications expose usage and audit views

The portal SHALL provide usage and audit views for RP applications within an
active workspace scope. RP Admin, RP User (Edit), and Read Only SHALL read
permitted usage and bounded audit results. No partner role SHALL read another
workspace's results.

#### Scenario: Workspace admin reviews usage summary

- **WHEN** an RP Admin, RP User (Edit), or Read Only user opens an in-scope RP application usage route
- **THEN** the portal loads the usage summary for the selected date or range state

#### Scenario: Workspace admin reviews bounded audit activity

- **WHEN** an RP Admin, RP User (Edit), or Read Only user opens an in-scope RP application audit route and applies a bounded date range
- **THEN** the portal loads matching permitted audit events
- **AND** any download remains constrained to that workspace and role

### Requirement: Onboarding lifecycle state is tracked across core onboarding records

The system SHALL track onboarding state for workspaces, application information
records, and RP applications using draft, submitted, under_review, approved,
and launched. RP Admin and RP User (Edit) SHALL prepare and submit
partner-owned records. CL Admin SHALL perform internal review-only transitions.
Read Only SHALL view permitted state without changing it.

#### Scenario: New onboarding records start in draft

- **WHEN** an RP Admin or RP User (Edit) creates a workspace-owned application information or RP application record
- **THEN** the new record starts in draft until intentionally submitted

#### Scenario: Submitted onboarding records expose review state

- **WHEN** an RP Admin or RP User (Edit) submits a draft onboarding record
- **THEN** the system records submitted
- **AND** it makes that state visible to authorized roles

#### Scenario: Reviewed onboarding records move through governed states

- **WHEN** a CL Admin advances a submitted onboarding record
- **THEN** the system can move the record through under_review, approved, and launched as the outcome changes

#### Scenario: Unauthorized actor cannot advance review-only states

- **WHEN** an RP Admin, RP User (Edit), or Read Only user attempts to move a record into under_review, approved, or launched
- **THEN** the system denies the transition
- **AND** it preserves the current state

### Requirement: Application information records show advisory readiness indicators

The system SHALL provide section-level completion indicators and an overall
readiness signal. RP Admin and RP User (Edit) SHALL use the indicators while
preparing and submitting records. Read Only and CL Admin SHALL view permitted
readiness/status without performing partner-side edits.

#### Scenario: Incomplete application information is flagged

- **WHEN** an authorized role opens application information with missing required onboarding data
- **THEN** the portal highlights incomplete sections or required inputs
- **AND** it keeps the record below a submit-ready state

#### Scenario: Incomplete readiness remains advisory in MVP2

- **WHEN** an RP Admin or RP User (Edit) submits or continues work on a record that is not submit-ready
- **THEN** the portal preserves the incomplete indicators for partner and oversight visibility
- **AND** any hard gating decision remains outside Partner Portal for MVP2

#### Scenario: Complete application information is marked submit-ready

- **WHEN** an RP Admin or RP User (Edit) completes required onboarding sections and contacts
- **THEN** the portal marks the record submit-ready
- **AND** it uses that status in onboarding summaries and review context

### Requirement: Environment progression rules remain explicit per RP application environment

The system SHALL treat test, staging, and production as environment-scoped
onboarding steps. RP Admin and RP User (Edit) SHALL prepare and request
progression. CL Admin SHALL record internal production review outcomes. Read
Only SHALL view permitted progression status without changing it.

#### Scenario: Test and staging RP application creation remains allowed

- **WHEN** an RP Admin or RP User (Edit) creates or updates an RP application targeting test or staging
- **THEN** the portal allows that work without requiring a production approval outcome first

#### Scenario: Partner can start at staging when test is unnecessary

- **WHEN** an RP Admin or RP User (Edit) creates or updates a registration and test is not required
- **THEN** the portal allows the onboarding record to proceed without a test registration
- **AND** it preserves the chosen environment path

#### Scenario: Test to staging progression reuses prior answers

- **WHEN** an RP Admin or RP User (Edit) requests progression from test to staging
- **THEN** the portal pre-fills the next environment registration with previously captured values
- **AND** it marks the progression as self-serve

#### Scenario: Staging to production progression enters reviewed status

- **WHEN** an RP Admin or RP User (Edit) requests progression from staging to production
- **THEN** the portal records a review-tracked promotion request
- **AND** it does not treat the record as approved or launched until CL Admin records the review outcome

### Requirement: Out-of-band production review remains traceable

The system SHALL track promotion status and external review references when
CanadaLogin approval occurs outside the portal. RP Admin and RP User (Edit)
SHALL submit permitted partner-owned request metadata. CL Admin SHALL record the
internal review outcome. Read Only SHALL view permitted status without changing
it.

#### Scenario: Promotion request captures review metadata

- **WHEN** an RP Admin or RP User (Edit) creates or updates a staging-to-production request
- **THEN** the portal stores the current promotion status, external review reference, reviewing CL Admin identity or team metadata, and relevant timestamps

#### Scenario: Platform admin records production review outcome

- **WHEN** a CL Admin records the latest out-of-band production review result
- **THEN** the portal updates the tracked promotion status and review metadata
- **AND** partner roles cannot perform the review-only transition

#### Scenario: Production-bound record cannot appear approved without review trace

- **WHEN** a record lacks the required CL Admin review outcome or external reference
- **THEN** the portal does not present the progression as approved or launched
- **AND** it identifies the missing review-traceability data to authorized roles

### Requirement: Checklist readiness and process links are visible before production progression

The system SHALL make onboarding checklist progress, external evidence
references, and contextual process links visible before production readiness.
RP Admin and RP User (Edit) SHALL update permitted partner-owned checklist
inputs. Read Only SHALL view them. CL Admin SHALL view and record permitted
internal review outcomes without partner secret access.

#### Scenario: Workspace admin reviews production prerequisites

- **WHEN** an authorized partner user opens a record preparing for production progression
- **THEN** the portal displays the checklist, external evidence-reference status, and relevant process links permitted to that role

#### Scenario: Missing prerequisites are highlighted before production progression

- **WHEN** tracked checklist items or external evidence references remain incomplete
- **THEN** the portal highlights the missing prerequisites before submission or resubmission
- **AND** the hard gate remains outside Partner Portal for MVP2

## REMOVED Requirements

### Requirement: Owner-scoped credential management is available for current-user RP applications

**Reason**: Historical RP application ownership no longer grants product
authority, and the `/mine` API family is retired in favour of active
workspace-grant resolution.

**Migration**: Use Grant-authorized credential management is available for
accessible RP applications. The credential-page load and consistent error
routing scenarios remain covered for RP Admin and RP User (Edit), with safe
not-found behavior for out-of-scope resources and no secret disclosure.

### Requirement: Owners can operate current and rotated secrets from the credential-management page

**Reason**: Secret authority belongs to the canonical RP Admin and RP User
(Edit) roles in an active workspace, not to an owner snapshot.

**Migration**: Use Grant-authorized partner editors can operate current and
rotated secrets. The current-secret regeneration and rotated-secret
create/delete scenarios are preserved under the canonical grant and secret
boundaries.

### Requirement: Owner-scoped MAU reporting is available for current-user RP applications

**Reason**: MAU access is derived from an active canonical workspace grant,
and the `/mine` route family is no longer part of the target contract.

**Migration**: Use Grant-authorized MAU reporting is available for accessible
RP applications. The report load, date filtering, CSV export, and optional
department-context scenarios are preserved for all three partner roles within
their assigned workspace.

### Requirement: Workspace membership management stays scoped to workspace administrators

**Reason**: workspace_admin and workspace_member create a second role taxonomy
that conflicts with the approved four-role model and duplicates the canonical
workspace-scoped partner grant.

**Migration**: Preserve an existing valid canonical partner grant when present.
Report every legacy workspace_admin and workspace_member row but create no
canonical grant from either value, because either mapping could broaden access.
Keep all such rows quarantined without canonical authorization, retain
migration/audit history, and retire workspace membership role values only after
verification proves they contribute no access. After cutover, CL Admin creates
the workspace and assigns its first RP Admin through canonical role management;
same-workspace RP Admin manages RP User (Edit) and Read Only access.

#### Scenario: Legacy workspace membership creates no canonical access

- **WHEN** migration encounters a legacy workspace_admin or workspace_member row
- **THEN** it creates no canonical partner grant from that row
- **AND** the row remains non-authoritative after cutover
- **AND** any later access requires an explicit canonical role-management action
