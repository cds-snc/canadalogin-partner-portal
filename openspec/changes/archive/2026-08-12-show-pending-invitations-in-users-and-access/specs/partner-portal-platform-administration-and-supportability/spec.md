# Delta for partner-portal-platform-administration-and-supportability

## MODIFIED Requirements

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
