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
global access, and a workspace-access summary and SHALL link to focused invite
and existing-user access-management routes. The directory SHALL also present
active pending invitations separately from accepted users so a CL Admin can
find invitees who do not yet have a local user record and continue management
through the invitation's workspace Access page.

The primary user directory SHALL NOT present raw authentication-provider
values, provider subjects, OIDC claims, internal database identifiers, role
IDs, policy subjects, or permission dumps. The pending-invitation directory
SHALL NOT expose invitation tokens, provider data, internal database
identifiers, notification identifiers, or policy details. Backend
identity-provider provenance SHALL remain available to the trusted
identity-binding path and SHALL NOT be replaced by or interpreted as a product
role.

#### Scenario: CL Admin reviews useful access context

- **WHEN** a CL Admin opens Users and access
- **THEN** each user row shows the minimum safe identity/account state plus canonical global and workspace access summary
- **AND** the table does not use authentication provider as a primary access or role column

#### Scenario: CL Admin reviews pending invitees across workspaces

- **WHEN** a CL Admin opens Users and access and active pending invitations exist
- **THEN** the portal shows a separate pending-invitations list containing the invited email, workspace, requested canonical partner role, pending status, and expiry
- **AND** an invitee without a local user record is not presented as an active user or canonical assignment
- **AND** a concise Manage action opens the invitation's workspace Access page

#### Scenario: Pending invitation directory is empty

- **WHEN** a CL Admin opens Users and access and no active pending invitations exist
- **THEN** the pending-invitations section states that there are no pending invitations
- **AND** the active user directory and Invite user task remain available

#### Scenario: CL Admin manages an existing user across workspaces

- **WHEN** a CL Admin opens an existing user's focused access route
- **THEN** the portal lists the active canonical global assignment, workspace assignments, and manageable pending invitations using public identifiers and safe labels
- **AND** permitted add, replace, and revoke operations reuse the canonical role-assignment authority and integrity rules

#### Scenario: Partner role cannot open centralized user administration

- **WHEN** an RP Admin, RP User (Edit), or Read Only user requests `/users`, a focused user route, or its supporting administration API
- **THEN** the portal denies the request through the safe authorization contract
- **AND** it does not reveal whether another platform identity, assignment, or invitation exists

### Requirement: Administration table actions are concise and uniquely named

Administration data-table row actions SHALL use a concise visible verb when
the table and action column already provide the record context. The control's
accessible name SHALL include enough visually hidden record context to be
unique without exposing that context visually in the button label.

#### Scenario: Repeated Manage actions remain understandable

- **WHEN** a table contains a `Manage` action for more than one record
- **THEN** each button displays the concise visible label `Manage`
- **AND** each button has a unique accessible name such as `Manage` followed by the safe record label

#### Scenario: Hidden action context does not lengthen the visible control

- **WHEN** contextual action text is intended only for assistive technology
- **THEN** the application uses a working visually-hidden implementation
- **AND** the contextual record name is not rendered as ordinary visible button text

