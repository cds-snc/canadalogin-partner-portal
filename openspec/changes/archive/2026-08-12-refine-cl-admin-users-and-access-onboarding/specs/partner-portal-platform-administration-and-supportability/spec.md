## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: Users and access presents canonical access rather than provider internals

The portal SHALL use `/users` as the CL Admin cross-workspace Users and access
directory. The directory SHALL present safe identity/account state, canonical
global access, and a workspace-access summary and SHALL link to focused invite
and existing-user access-management routes.

The primary directory SHALL NOT present raw authentication-provider values,
provider subjects, OIDC claims, internal database identifiers, role IDs,
policy subjects, or permission dumps. Backend identity-provider provenance
SHALL remain available to the trusted identity-binding path and SHALL NOT be
replaced by or interpreted as a product role.

#### Scenario: CL Admin reviews useful access context

- **WHEN** a CL Admin opens Users and access
- **THEN** each user row shows the minimum safe identity/account state plus canonical global and workspace access summary
- **AND** the table does not use authentication provider as a primary access or role column

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
