# Delta for partner portal platform administration and supportability

## MODIFIED Requirements

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
