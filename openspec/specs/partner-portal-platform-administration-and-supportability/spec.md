# partner-portal-platform-administration-and-supportability

## Purpose
Define canonical CL Admin platform governance, immutable authorization administration boundaries, and the portal's service-supportability baseline.
## Requirements
### Requirement: Platform administrators manage portal governance records

Canonical CL Admin users SHALL be able to search and manage supported user
profile records; invite a prospective partner user into one existing workspace
and canonical partner role; manage an existing user's permitted global and
cross-workspace assignments; and perform CRUD management for departments and
tiers through the administration modules. The product SHALL NOT create an
immediately enabled unbound user as the normal partner-onboarding workflow.

Canonical authorization role definitions, capability mappings, scope rules,
and policy subjects SHALL be immutable system-owned configuration. The legacy
authorization-policy CRUD surface SHALL NOT allow CL Admin to add permissions
to a role, create direct-user subjects, or bypass the four-role matrix. Any
separate governance record described as a policy SHALL be explicitly
non-authorization metadata.

#### Scenario: Platform admin maintains user governance data

- **WHEN** a CL Admin uses the administration modules
- **THEN** the portal supports user search, safe profile maintenance, invitation, existing-identity assignment, replacement, and revocation flows and CRUD management flows for departments and tiers
- **AND** role administration permits only supported canonical assignment and revocation operations
- **AND** a new partner identity is not created as an enabled unbound user before invitation acceptance

#### Scenario: Canonical authorization policy cannot be mutated

- **WHEN** a CL Admin requests creation, mutation, or deletion of a canonical role definition, capability mapping, scope rule, or direct-user policy subject
- **THEN** the portal rejects the operation
- **AND** the fixed role matrix remains unchanged

#### Scenario: Partner role cannot use platform governance

- **WHEN** an RP Admin, RP User (Edit), or Read Only user requests a platform governance route or API
- **THEN** the portal denies the request
- **AND** the partner role and workspace scope do not expand into global authority

### Requirement: Platform administration exposes IBM Security Verify management operations

The backend SHALL expose the required IBM Security Verify administration
capabilities across users, applications, groups, entitlements, logins, and
audit queries only to canonical CL Admin. Each operation SHALL appear on an
explicit allowlist. Client-credential retrieval, RP secret reads, and secret
lifecycle operations SHALL be excluded from that allowlist regardless of the
CL Admin's upstream Verify privileges.

The backend SHALL reject an excluded operation before calling Verify and SHALL
redact secret-bearing fields from allowed administration responses. Upstream
Verify group claims SHALL NOT create CL Admin or partner authorization.

#### Scenario: Platform admin performs Verify-backed administration

- **WHEN** a CL Admin uses an allowlisted Verify-backed user, application, group, entitlement, login, or audit-query operation
- **THEN** the backend executes that operation through the IBM Security Verify integration surface
- **AND** it returns the standard portal API contract without treating upstream groups as portal roles

#### Scenario: CL Admin cannot use Verify to cross the RP secret boundary

- **WHEN** a CL Admin requests client credentials, an RP secret value, or an RP secret lifecycle operation through a platform or Verify-backed route
- **THEN** the backend denies the request before making a Verify call
- **AND** no allowed response contains a secret-bearing field

#### Scenario: Partner role cannot perform Verify-backed administration

- **WHEN** an RP Admin, RP User (Edit), or Read Only user requests a Verify-backed platform administration operation
- **THEN** the backend denies the operation
- **AND** no partner workspace assignment is treated as platform authority

### Requirement: Service health and error supportability are available
The system SHALL expose health and readiness endpoints and SHALL return a consistent error envelope for handled API failures.

#### Scenario: Operator checks service health
- **WHEN** an operator or deployment automation calls the health or readiness endpoint
- **THEN** the backend returns the service health or readiness status without requiring a normal authenticated portal workflow

#### Scenario: API failure returns the standard error contract
- **WHEN** a handled API error occurs
- **THEN** the response body uses the shared error envelope with code, message, details, and request identifier fields

### Requirement: Users and access presents canonical access rather than provider internals

The portal SHALL use `/users` as the CL Admin cross-workspace Users and access
directory. The directory SHALL present safe identity/account state, canonical
global access, and a workspace-access summary in semantic tables and SHALL
link to focused invite and existing-user access routes. It SHALL present active
pending invitations separately from accepted users so a CL Admin can find an
invitee without a local user record and open that exact invitation's canonical
workspace Access route.

The portal SHALL use `/users/$userUuid` as a compact selected-user access task
hub rather than a combined assignment list, invitation list, and mutation
form. Available global access, workspace access, pending invitation, and add-
access tasks SHALL use focused child routes. Repeated assignments and
invitations SHALL use semantic comparison tables; cards SHALL represent only
single-destination tasks.

The primary user directory and focused routes SHALL NOT present raw
authentication-provider values, provider subjects, OIDC claims, internal
database identifiers, role IDs, policy subjects, or permission dumps. Pending-
invitation surfaces SHALL NOT expose invitation tokens, provider data,
internal database identifiers, notification identifiers, or policy details.
Backend identity-provider provenance SHALL remain available to the trusted
identity-binding path and SHALL NOT be replaced by or interpreted as a product
role.

Every central route and record link SHALL revalidate current CL Admin
authority and selected object ancestry on the backend. A missing, revoked,
parent-mismatched, or out-of-scope user, assignment, or invitation SHALL use
the same safe unavailable behavior.

#### Scenario: CL Admin reviews useful access context

- **WHEN** a CL Admin opens Users and access
- **THEN** each user row shows the minimum safe identity/account state plus canonical global and workspace access summary
- **AND** the table does not use authentication provider as a primary access or role column

#### Scenario: CL Admin reviews pending invitees across workspaces

- **WHEN** a CL Admin opens Users and access and active pending invitations exist
- **THEN** the portal shows a separate pending-invitations table containing the invited email, workspace, requested canonical partner role, pending status, and expiry
- **AND** an invitee without a local user record is not presented as an active user or canonical assignment
- **AND** a concise `Manage` link for each row opens `/workspaces/$workspaceUuid/access/invitations/$invitationUuid` for that selected invitation
- **AND** the destination does not place the invited email, invitation token, or authorization context in the URL

#### Scenario: Several invitations in one workspace retain distinct destinations

- **WHEN** the pending-invitations table contains two or more invitations for the same workspace
- **THEN** each `Manage` link contains its own public invitation UUID
- **AND** selecting one opens only that invitation's focused lifecycle page rather than the top of the general Workspace Access route

#### Scenario: Pending invitation directory is empty

- **WHEN** a CL Admin opens Users and access and no active pending invitations exist
- **THEN** the pending-invitations section states that there are no pending invitations
- **AND** the active user directory and Invite user task remain available

#### Scenario: CL Admin manages an existing user across workspaces

- **WHEN** a CL Admin opens `/users/$userUuid`
- **THEN** the portal shows safe selected-user context and available single-destination tasks for global access, workspace access, and pending invitations
- **AND** it does not embed the full assignment tables, add form, invitation list, and lifecycle controls on the hub
- **AND** permitted add, replace, and revoke operations on focused routes reuse the canonical role-assignment authority and integrity rules

#### Scenario: CL Admin opens a focused user-access task

- **WHEN** a CL Admin chooses global access, workspace access, pending invitations, or add workspace access from the selected-user route family
- **THEN** the focused page identifies the selected user with a safe label, exposes only the data and actions needed for that task, and provides a visible translated return path
- **AND** assignment or invitation collections use captions, headers, row headers, text statuses, and concise record-specific links
- **AND** create or mutation forms do not appear beneath an unrelated record collection

#### Scenario: Focused user-access route is stale or out of scope

- **WHEN** a direct request names a missing, revoked, deleted, parent-mismatched, or unauthorized user, assignment, workspace, or invitation
- **THEN** the backend returns the standard safe unavailable result without mutation
- **AND** the response does not reveal whether the out-of-scope record exists or who owns it

#### Scenario: Partner role cannot open centralized user administration

- **WHEN** an RP Admin, RP User (Edit), or Read Only user requests `/users`, a focused user route, or its supporting administration API
- **THEN** the portal denies the request through the safe authorization contract
- **AND** it does not reveal whether another platform identity, assignment, or invitation exists

### Requirement: Administration table actions are concise and uniquely named

Administration data-table row actions SHALL use a concise visible verb when
the table and action column already provide record context. Each link or
button's accessible name SHALL include enough safe visually hidden record
context to be unique without exposing that context as a long visible label.

Navigation SHALL use a real link with the exact record destination. A button
SHALL be used for a submission, confirmation, or in-place mutation rather than
for ordinary route navigation.

#### Scenario: Repeated Manage actions remain understandable

- **WHEN** a table contains a `Manage` action for more than one record
- **THEN** each control displays the concise visible label `Manage`
- **AND** each control has a unique accessible name such as `Manage` followed by the safe record label

#### Scenario: Hidden action context does not lengthen the visible control

- **WHEN** contextual action text is intended only for assistive technology
- **THEN** the application uses a working visually-hidden implementation
- **AND** the contextual record name is not rendered as ordinary visible button or link text

#### Scenario: Navigational row actions expose real destinations

- **WHEN** `View`, `Manage`, `Open`, or another row action moves to a different route or record page
- **THEN** the action is a real link whose destination contains the required public record identifiers
- **AND** normal link behavior remains available
- **AND** the link does not discard the selected record or rely on an in-memory click callback to reconstruct its destination

#### Scenario: Mutation actions remain buttons

- **WHEN** a row control submits, confirms, revokes, reissues, cancels, or otherwise changes state without first navigating
- **THEN** the control uses button semantics and the applicable confirmation, focus, feedback, authorization, and concurrency behavior
- **AND** it is not disguised as a navigation link

