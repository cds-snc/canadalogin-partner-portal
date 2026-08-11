# partner-portal-external-developer-invitations-and-scoped-access Specification

## Purpose
Define the current invitation lifecycle, acceptance rules, and partner-scoped invited-developer access model for external RP application collaborators.
## Requirements
### Requirement: Platform admins manage partner-scoped developer invitations for an existing partner context
Authorized CanadaLogin portal admins SHALL be able to invite an email address into one existing partner workspace context, assign an invitation-scoped role for that partner context, and manage the invitation lifecycle from an existing RP-application management entry point for that partner context.

#### Scenario: Platform admin creates an invitation for one partner context and assigns a role
- **WHEN** an authorized CanadaLogin portal admin submits an email address and an invitation-scoped role from a specific workspace-scoped RP application inside one partner workspace context
- **THEN** the system creates an invitation for that partner context
- **AND** the invitation stores the assigned invitation-scoped role
- **AND** the invitation is tracked with a lifecycle state that can be reviewed later

#### Scenario: Platform admin can invite only after partner context exists
- **WHEN** an authorized CanadaLogin portal admin attempts to create an invitation before the target partner workspace exists
- **THEN** the system rejects the invitation creation request
- **AND** the portal requires an existing partner workspace context before invitation management continues

#### Scenario: Platform admin reviews invitation status for one RP application
- **WHEN** an authorized CanadaLogin portal admin opens the invitation-management surface from a workspace-scoped RP application in one partner workspace context
- **THEN** the portal lists invitations for that partner context with enough status information to distinguish pending, accepted, expired, and revoked invitations

#### Scenario: Platform admin reissues an unavailable invitation
- **WHEN** an authorized CanadaLogin portal admin reissues a pending, expired, or revoked invitation for one partner workspace context
- **THEN** the system produces a fresh tokenized acceptance link with a new expiry window
- **AND** the previously issued invitation is no longer acceptable for future access
- **AND** invitation-management history still distinguishes the prior issued invitation from the new pending invitation

#### Scenario: Platform admin creates an invitation without automatic email delivery
- **WHEN** an authorized CanadaLogin portal admin creates an invitation for one partner workspace context
- **THEN** the system stores the invitation and generates or records the tokenized acceptance link for that invitation
- **AND** automatic email dispatch is not required for invitation creation to succeed

### Requirement: CL Admin bootstraps RP Admin users, and RP Admin users can invite staff but cannot create more RP Admin users
`CL Admin` users SHALL be the only actors allowed to assign the invitation-scoped `RP Admin` role. Accepted `RP Admin` users SHALL be able to invite additional staff only for `RP User (Edit)` and `Read Only` within the same partner context.

#### Scenario: CL Admin bootstraps RP Admin users
- **WHEN** an authorized `CL Admin` user creates an invitation for the initial one or two partner-side `RP Admin` users in a partner context
- **THEN** the portal allows the invitation to carry the `RP Admin` role

#### Scenario: RP Admin invites staff with permitted roles
- **WHEN** an accepted `RP Admin` user creates an invitation for staff within the same partner context
- **THEN** the portal allows the invitation only for `RP User (Edit)` or `Read Only`

#### Scenario: RP Admin cannot assign another RP Admin
- **WHEN** an accepted `RP Admin` user attempts to create an invitation that assigns the `RP Admin` role
- **THEN** the portal rejects the invitation request
- **AND** only an authorized `CL Admin` user can assign that role

#### Scenario: Platform admin revokes an invitation
- **WHEN** an authorized CanadaLogin portal admin revokes an invitation for a specific RP application
- **THEN** the invitation no longer grants future acceptance access for that RP application
- **AND** the invitation remains visible as revoked in invitation-management history

### Requirement: Invitation acceptance validates token and signed-in identity
The system SHALL validate RP-application invitation acceptance using the tokenized route `/invitations/rp-applications/$token` and SHALL accept an invitation only when the signed-in CanadaLogin user matches the invited email identity for an active invitation.

#### Scenario: Invitee accepts a valid invitation
- **WHEN** an invited user signs in with the invited email address and opens a valid RP-application invitation link
- **THEN** the system accepts the invitation
- **AND** the portal redirects the user to the invited RP application's current-user experience

#### Scenario: First login checks pending invitations before denying access
- **WHEN** a signed-in CanadaLogin user would otherwise be denied because no configured upstream admin or application-owners group matches
- **AND** the user's signed-in email matches an active pending invitation
- **THEN** the portal checks that invitation before denying access
- **AND** the invitation can be accepted through that local pending-invitation path

#### Scenario: Accepted invitee uses the invitation's existing partner context
- **WHEN** an invited user accepts a valid RP-application invitation
- **THEN** the portal uses the invitation's existing partner workspace context for that user
- **AND** the invitee is not asked to define a separate partner or department during acceptance

#### Scenario: First accepted login assigns invitation roles to the local user record
- **WHEN** an invited user accepts a valid RP-application invitation for the first time
- **THEN** the portal creates or updates the local user record for that CanadaLogin account
- **AND** the portal records the invitation's partner-scoped role assignment for that partner context before granting invited access

#### Scenario: Repeated sign-in does not duplicate accepted invitation access
- **WHEN** a user who already accepted an RP-application invitation signs in again or reopens the invitation link
- **THEN** the portal does not create a duplicate partner-scoped grant or duplicate local invitation assignment for that same partner context
- **AND** the existing accepted local access remains the source of truth for the user's invitation-backed access

#### Scenario: Missing or invalid token does not accept the invitation
- **WHEN** a user opens an invitation route without a complete token or with an invalid token
- **THEN** the system does not accept the invitation
- **AND** the portal shows the invitation as unavailable or incomplete instead of granting access

#### Scenario: Signed-in email mismatch does not accept the invitation
- **WHEN** a signed-in user opens an active invitation link for a different invited email address
- **THEN** the system does not accept the invitation
- **AND** the portal does not grant partner-scoped access for that invitation

#### Scenario: Expired or revoked invitation cannot be accepted
- **WHEN** an invited user opens an expired or revoked RP-application invitation link
- **THEN** the system does not accept the invitation
- **AND** the portal shows the invitation as unavailable for access recovery

### Requirement: Accepted invitations grant only partner-scoped invited-developer role access
Accepted invited developers SHALL be able to use only RP applications and current-user surfaces inside the granted partner workspace context for their assigned invitation-scoped role and SHALL NOT gain general workspace membership or a reusable platform role through invitation acceptance.

For the first release, the granted invitation-scoped role SHALL apply consistently to all RP applications in the granted partner workspace context. The first release SHALL NOT require separate RP-specific permission slicing inside that partner workspace.

#### Scenario: Accepted invitee sees partner-scoped RP applications in current-user scope
- **WHEN** an accepted invited developer opens the current-user RP application experience
- **THEN** the RP applications inside that user's granted partner workspace scope appear in the user's allowed current-user scope

#### Scenario: First-release partner grant applies across the partner workspace
- **WHEN** an accepted invited developer holds an active invitation-scoped role for one partner workspace context
- **THEN** that role applies to all RP applications in that partner workspace for the first release
- **AND** the portal does not require a separate RP-specific permission assignment inside that partner workspace

#### Scenario: Invitee accesses only RP applications in the granted partner scope
- **WHEN** an accepted invited developer requests current-user RP application routes or endpoints for an RP application that belongs to the granted partner workspace scope and is allowed for the assigned invitation-scoped role
- **THEN** the portal allows access only for RP applications in that granted partner scope

#### Scenario: RP Admin manages partner-scoped application collaboration and secrets
- **WHEN** an accepted invited developer holds the `RP Admin` invitation-scoped role for one partner workspace context
- **THEN** the portal allows that user to list RP applications in that partner context, open current-user summary and OAuth configuration, read MAU reports, use client-credential and secret-rotation surfaces for those RP applications, and manage developer invitations within that same partner context
- **AND** the portal does not allow that user to assign another `RP Admin` invitation role

#### Scenario: RP User (Edit) manages partner-scoped application configuration but not invitations
- **WHEN** an accepted invited developer holds the `RP User (Edit)` invitation-scoped role for one partner workspace context
- **THEN** the portal allows that user to list RP applications in that partner context, open current-user summary and OAuth configuration, read MAU reports, and use client-credential and secret-rotation surfaces for those RP applications
- **AND** the portal does not allow that user to manage invitations or role assignment for that partner context

#### Scenario: Read Only can view partner-scoped application details without secret access
- **WHEN** an accepted invited developer holds the `Read Only` invitation-scoped role for one partner workspace context
- **THEN** the portal allows that user to list RP applications in that partner context, open current-user summary and OAuth configuration, and read MAU reports for those RP applications
- **AND** the portal does not allow that user to view client secret values, rotate secrets, create rotated secrets, delete rotated secrets, or manage invitations

#### Scenario: Invitation-backed users do not use department self-setup
- **WHEN** an accepted invited developer reaches the invited RP application's current-user experience
- **THEN** the portal uses the invitation's existing partner workspace context
- **AND** the portal does not require or allow that invited user to complete the self-service department-assignment route as part of invitation-backed access

#### Scenario: Invitee cannot access unrelated RP applications or workspace views
- **WHEN** an accepted invited developer requests an RP application or a workspace-scoped route outside the granted partner workspace context
- **THEN** the portal resolves that request as unavailable to the caller
- **AND** the portal does not expose unrelated application or workspace data

#### Scenario: Unauthorized invited-role subresources resolve as unavailable
- **WHEN** an accepted invited developer requests a secret-management or invitation-management subresource that is outside the assigned invitation-scoped role for the granted partner context
- **THEN** the portal resolves that request as unavailable to the caller
- **AND** the portal does not confirm the protected subresource exists for that partner context

#### Scenario: Invitation does not grant workspace membership
- **WHEN** an invitation is accepted
- **THEN** the user does not become a workspace member and does not inherit workspace-admin privileges from the invitation

### Requirement: Role-boundary guidance explains collaboration models
The portal SHALL provide user-facing guidance that explains the difference between workspace membership, workspace-admin responsibilities, workspace-member visibility, and invited-developer RP-application scope.

#### Scenario: Collaboration guidance distinguishes workspace membership from platform-admin invitation access
- **WHEN** a platform-admin user prepares invited-developer access or a workspace admin adds a workspace member
- **THEN** the portal provides guidance that explains which actions require workspace membership, which bootstrap invited-developer access remains managed by `CL Admin` users, and which ongoing staff invitations an `RP Admin` user may handle without being allowed to assign another `RP Admin`

#### Scenario: Invited developer reviews scope guidance
- **WHEN** an invited developer accesses current-user RP application screens
- **THEN** the portal provides guidance confirming that invitation access is limited to the invited RP application and does not grant workspace membership

### Requirement: Partner-scoped roles can read aggregate onboarding reports inside granted scope
The portal SHALL allow accepted `RP Admin`, `RP User (Edit)`, and `Read Only` users to read aggregate onboarding reports for their granted partner scope without granting cross-workspace oversight access.

#### Scenario: All first-release partner roles can view the same report families
- **WHEN** an accepted `RP Admin`, `RP User (Edit)`, or `Read Only` user opens the aggregate onboarding reporting route
- **THEN** the portal allows that user to view onboarding throughput, invitation conversion, and secret-rotation hygiene reports for the user's granted partner scope

#### Scenario: Partner report visibility does not grant oversight workflow access
- **WHEN** an accepted partner-side user can view aggregate onboarding reports
- **THEN** that user still cannot access cross-workspace onboarding overview, queue, or internal review-note workflows that remain reserved for internal oversight users

