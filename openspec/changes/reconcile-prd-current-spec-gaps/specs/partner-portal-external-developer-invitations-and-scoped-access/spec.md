## ADDED Requirements

### Requirement: Workspace admins manage app-scoped developer invitations
Workspace administrators SHALL be able to invite an email address to a specific RP application and manage the invitation lifecycle through GC Notify-backed delivery and explicit state transitions.

#### Scenario: Workspace admin sends and manages an invitation
- **WHEN** a workspace admin submits an email address for a specific RP application
- **THEN** the system creates an invitation in a trackable state and allows resend, reactivate, revoke, and accepted or expired status review for that invitation

### Requirement: Invitation acceptance validates token and email identity
The system SHALL validate invitation acceptance using a tokenized route and SHALL only auto-provision an unknown signed-in user when an active invitation exists for the same email address.

#### Scenario: Invitee accepts a valid invitation
- **WHEN** an invited user signs in with the invited email address and opens a valid invitation link
- **THEN** the system accepts the invitation and redirects the user to the current-user RP application experience

#### Scenario: Signed-in email mismatch does not accept the invitation
- **WHEN** a signed-in user opens an active invitation link for a different invited email address
- **THEN** the system does not accept the invitation, does not grant app-scoped access, and shows a denial or recovery path instead of provisioning access

#### Scenario: Unknown user without active invitation is not provisioned
- **WHEN** an unknown OIDC user signs in without a matching active invitation
- **THEN** the user is not auto-created for invited-developer access and the portal denies protected RP application access

#### Scenario: Expired or revoked invitation cannot be accepted
- **WHEN** an invited user opens an expired or revoked invitation link
- **THEN** the system does not accept the invitation and shows the invitation as unavailable for access recovery

### Requirement: Invited-developer access stays scoped to the invited RP application
Invited developers SHALL be able to view and update only the RP application records they were explicitly invited to manage and SHALL NOT gain general workspace membership through invitation acceptance.

#### Scenario: Invitee accesses the invited RP application
- **WHEN** an accepted invited developer opens the portal
- **THEN** the user can access only current-user RP application screens and endpoints for the invited RP application

#### Scenario: Invitee cannot access unrelated RP applications or workspace views
- **WHEN** an accepted invited developer requests a different RP application or a workspace-scoped screen that is not covered by the accepted invitation
- **THEN** the portal denies access and does not expose unrelated application or workspace data

#### Scenario: Invitation does not grant workspace membership
- **WHEN** an invitation is accepted
- **THEN** the user does not appear as a workspace member and does not inherit general workspace-admin privileges from the invitation