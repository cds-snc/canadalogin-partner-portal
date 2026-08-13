# partner-portal-external-developer-invitations-and-scoped-access Specification

## Purpose
Define the canonical invitation lifecycle, acceptance and delegation rules,
and workspace-scoped access granted to collaborators who work with permitted
Applications and RP configurations.
## Requirements
### Requirement: Invitation acceptance validates token and signed-in identity

The system SHALL validate invitation acceptance using the existing tokenized
compatibility route `/invitations/rp-applications/$token` and SHALL accept an
invitation only when the signed-in CanadaLogin user matches the invited email
identity for a currently pending, unexpired invitation. Validation SHALL
complete before any partner assignment is created or changed. An invitation
SHALL use its required Partner workspace as authorization context and SHALL
NOT require an Application or RP configuration.

Optional source provenance MAY identify an Application or RP configuration
from which the invitation was initiated. Before using that provenance for a
post-acceptance destination, the backend SHALL resolve its complete workspace,
Application, and configuration ancestry under the accepted grant. Missing,
stale, or mismatched provenance SHALL fall back to the assigned workspace and
SHALL NOT prevent acceptance or reveal another resource.

#### Scenario: Invitee accepts a valid invitation

- **WHEN** an invited user signs in with the invited email address and opens a valid pending invitation link
- **THEN** the system accepts the invitation
- **AND** the portal creates exactly one canonical workspace-scoped partner assignment on first acceptance
- **AND** the portal redirects the user to the assigned workspace or, when validated source provenance exists, the in-scope Application hub or RP-configuration task

#### Scenario: First login checks pending invitations before denying access

- **WHEN** a signed-in CanadaLogin user has no active canonical role assignment
- **AND** the user's signed-in email matches an active pending invitation
- **THEN** the portal permits that invitation acceptance path before denying access
- **AND** other protected product routes remain unavailable until acceptance succeeds

#### Scenario: Accepted invitee uses the invitation's existing partner context

- **WHEN** an invited user accepts a valid invitation
- **THEN** the portal uses the invitation's existing Partner workspace context
- **AND** the invitee is not asked to define a separate partner or Department during acceptance
- **AND** the acceptance does not depend on an Application or RP configuration existing in the workspace

#### Scenario: First accepted login assigns invitation roles to the local user record

- **WHEN** an invited user accepts a valid invitation for the first time
- **THEN** the portal creates or updates the local user identity record
- **AND** the portal creates one active canonical partner assignment for the invitation workspace and role before granting access
- **AND** it does not append a reusable platform role, workspace membership role, Application grant, or RP-configuration grant

#### Scenario: Repeated sign-in does not duplicate accepted invitation access

- **WHEN** a user who already accepted an invitation signs in again or reopens the accepted link
- **THEN** the portal does not create a duplicate grant or assignment
- **AND** the current active workspace assignment remains the source of truth

#### Scenario: Missing or invalid token does not accept the invitation

- **WHEN** a user opens an invitation route without a complete token or with an invalid token
- **THEN** the system does not accept the invitation
- **AND** the portal shows the invitation as unavailable or incomplete instead of granting access

#### Scenario: Signed-in email mismatch does not accept the invitation

- **WHEN** a signed-in user opens a pending invitation for a different invited email address
- **THEN** the system does not accept the invitation
- **AND** the portal does not grant partner-scoped access for that invitation

#### Scenario: Expired or revoked invitation cannot be accepted

- **WHEN** an invited user opens an expired or revoked invitation link
- **THEN** the system does not accept the invitation
- **AND** the portal shows the invitation as unavailable for access recovery

#### Scenario: Historical accepted invitation cannot restore an older role

- **WHEN** a user reopens an accepted invitation whose role differs from the user's current active role in that workspace
- **THEN** validation completes without changing the current assignment
- **AND** the historical invitation cannot restore its former role

#### Scenario: Pending invitation cannot overwrite an active workspace role

- **WHEN** acceptance validation finds that the signed-in user already has an active partner assignment in the invitation workspace
- **THEN** the portal rejects acceptance without changing the invitation or active assignment
- **AND** an RP Admin grant cannot be silently preserved, downgraded, or replaced by a pending RP User (Edit) or Read Only invitation

### Requirement: Accepted invitations grant only partner-scoped invited-developer role access

Accepted invitations SHALL grant exactly one canonical partner role for the
invitation workspace and SHALL NOT create CL Admin, a reusable role, an
Application-specific grant, an RP-configuration-specific grant, or a second
workspace membership role. The active workspace grant SHALL authorize only the
permitted workspace metadata, Applications, RP configurations, secrets,
reporting, and invitation actions defined by the four-role matrix.

The role SHALL apply consistently to every Application and RP configuration in
the assigned workspace. Separate child-specific permission assignments SHALL
NOT be required for this phase.

#### Scenario: Accepted invitee sees partner-scoped RP applications in current-user scope

- **WHEN** an accepted partner user opens the grant-accessible Partner work experience
- **THEN** the Applications and RP configurations in each active assigned workspace appear in the user's allowed scope
- **AND** each response identifies its effective canonical role and workspace UUID without using `/your-applications` as a second ownership experience

#### Scenario: First-release partner grant applies across the partner workspace

- **WHEN** an accepted partner user holds an active canonical role for one Partner workspace
- **THEN** that role applies to all Applications and RP configurations in that workspace
- **AND** the portal does not require a separate child-specific permission assignment

#### Scenario: Invitee accesses only RP applications in the granted partner scope

- **WHEN** an accepted partner user requests a permitted Application or RP-configuration route in an assigned workspace
- **THEN** the portal evaluates the canonical role for that workspace and the complete resource ancestry
- **AND** it does not expose Applications or configurations from an unassigned workspace

#### Scenario: RP Admin manages partner-scoped application collaboration and secrets

- **WHEN** an accepted user holds RP Admin for one Partner workspace
- **THEN** the portal allows permitted workspace and Application administration, contact management, RP-configuration management, secrets, reports, bounded partner audit, and RP User (Edit) or Read Only invitations in that workspace
- **AND** the RP Admin cannot assign another RP Admin

#### Scenario: RP User (Edit) manages partner-scoped application configuration but not invitations

- **WHEN** an accepted user holds RP User (Edit) for one Partner workspace
- **THEN** the portal allows permitted Application, contact, RP-configuration, secret, promotion-request, report, and bounded-audit operations in that workspace
- **AND** the user cannot manage invitations or role assignments

#### Scenario: Read Only can view partner-scoped application details without secret access

- **WHEN** an accepted user holds Read Only for one Partner workspace
- **THEN** the portal allows permitted Application details, contacts, readiness, RP Configuration, Usage, aggregate reports, and redacted bounded audit in that workspace
- **AND** the user cannot mutate data, view or change secrets, view internal review notes, or manage invitations

#### Scenario: Invitation-backed users do not use department self-setup

- **WHEN** an accepted partner user reaches a protected product route without a personal Department assignment
- **THEN** the portal uses canonical workspace assignment and inherited workspace Department as partner context
- **AND** it does not redirect the user to personal or RP-configuration Department setup

#### Scenario: Invitee cannot access unrelated RP applications or workspace views

- **WHEN** an accepted partner user requests a workspace, Application, or RP configuration outside an active assigned workspace
- **THEN** the portal resolves the request as unavailable
- **AND** it does not expose unrelated hierarchy data

#### Scenario: Unauthorized invited-role subresources resolve as unavailable

- **WHEN** an accepted partner user requests credentials, invitations, internal review, or another protected subresource outside the canonical role matrix
- **THEN** the portal resolves it as unavailable
- **AND** it does not confirm the protected subresource exists

#### Scenario: Invitation does not grant workspace membership

- **WHEN** an invitation is accepted
- **THEN** the portal creates only the canonical Partner workspace grant
- **AND** it does not create `workspace_admin`, `workspace_member`, an Application grant, an RP-configuration grant, or another product role

### Requirement: Role-boundary guidance explains collaboration models

The portal SHALL provide user-facing guidance that explains the difference
between CL Admin global authority and the three workspace-scoped partner roles.
The guidance SHALL identify which actions each canonical role can perform,
that only CL Admin can assign RP Admin, that RP Admin can invite only RP User
(Edit) or Read Only, and that a partner role applies to every Application and
RP configuration in its assigned workspace.

#### Scenario: Collaboration guidance distinguishes workspace membership from platform-admin invitation access

- **WHEN** a CL Admin bootstraps partner access or an RP Admin manages staff invitations
- **THEN** the portal explains the permitted invitation roles and workspace boundary
- **AND** it does not describe workspace membership, superuser, Application-specific, RP-specific, or arbitrary reusable roles as additional product roles

#### Scenario: Invited developer reviews scope guidance

- **WHEN** a partner user accesses an Application or RP-configuration screen
- **THEN** the portal confirms the active canonical role and assigned workspace
- **AND** the guidance explains that the role applies to all Applications and configurations in that workspace and does not grant another workspace

### Requirement: Partner-scoped roles can read aggregate onboarding reports inside granted scope
The portal SHALL allow accepted `RP Admin`, `RP User (Edit)`, and `Read Only` users to read aggregate onboarding reports for their granted partner scope without granting cross-workspace oversight access.

#### Scenario: All first-release partner roles can view the same report families
- **WHEN** an accepted `RP Admin`, `RP User (Edit)`, or `Read Only` user opens the aggregate onboarding reporting route
- **THEN** the portal allows that user to view onboarding throughput, invitation conversion, and secret-rotation hygiene reports for the user's granted partner scope

#### Scenario: Partner report visibility does not grant oversight workflow access
- **WHEN** an accepted partner-side user can view aggregate onboarding reports
- **THEN** that user still cannot access cross-workspace onboarding overview, queue, or internal review-note workflows that remain reserved for internal oversight users

### Requirement: Canonical roles manage partner-scoped developer invitations

CL Admin SHALL be the only role allowed to invite or assign RP Admin. An active
RP Admin SHALL be allowed to invite RP User (Edit) or Read Only only within
that RP Admin's assigned Partner workspace. Invitation creation SHALL require
an existing Partner workspace and SHALL NOT require an Application or RP
configuration. An Application or RP configuration MAY be retained only as
optional source provenance when the invitation starts from that resource,
while the accepted role SHALL apply to the whole workspace.

First successful invitation acceptance SHALL create exactly one active
canonical partner assignment. Idempotent replay SHALL return the existing
accepted outcome without mutating the current assignment. Acceptance SHALL NOT
create a global role, a reusable role definition, an Application- or RP-
configuration-specific grant, or a second workspace membership role.
Invitation creation SHALL be rejected when the target identity already has an
active partner assignment in the workspace; an authorized actor SHALL use the
explicit atomic role-replacement operation instead.

#### Scenario: CL Admin bootstraps an RP Admin

- **WHEN** a CL Admin creates an invitation for the initial partner-side RP Admin in an existing workspace before any Application or RP configuration exists
- **THEN** the portal permits the invitation to carry RP Admin with workspace context only
- **AND** acceptance creates one RP Admin assignment for that workspace

#### Scenario: RP Admin invites permitted staff in the same workspace

- **WHEN** an active RP Admin invites staff from the assigned Workspace Access surface, an Application hub, or an RP-configuration task
- **THEN** the portal permits RP User (Edit) or Read Only and records only validated child source provenance when supplied
- **AND** the invitation cannot target another workspace or create child-specific authority

#### Scenario: RP Admin cannot assign RP Admin

- **WHEN** an RP Admin attempts to create an invitation carrying RP Admin
- **THEN** the portal rejects the request
- **AND** only CL Admin can assign RP Admin

#### Scenario: Invitation requires an existing workspace

- **WHEN** an authorized actor attempts to invite a user before the Partner workspace exists
- **THEN** the portal rejects the invitation
- **AND** it does not create an unscoped role assignment

#### Scenario: Authorized actor reviews workspace invitation status

- **WHEN** an authorized CL Admin or same-workspace RP Admin opens invitation management
- **THEN** the portal lists the invitations the actor is allowed to manage
- **AND** each record distinguishes pending, accepted, expired, and revoked status without exposing child provenance outside that actor's scope

#### Scenario: Authorized actor reissues an unavailable invitation

- **WHEN** an authorized actor reissues a pending, expired, or revoked invitation
- **THEN** the system serializes the email/workspace lifecycle and, when the old record is pending, revokes it with replacement reason and linkage before creating one new pending invitation
- **AND** the new invitation receives a new record, tokenized acceptance link, and expiry window
- **AND** the previously issued token remains unacceptable
- **AND** history distinguishes the old record from the new pending invitation

#### Scenario: Concurrent reissue creates only one pending invitation

- **WHEN** two authorized requests concurrently reissue an invitation for the same normalized email and workspace
- **THEN** the system serializes the lifecycle so exactly one new pending invitation succeeds
- **AND** every other request returns the existing lifecycle or a safe conflict without creating competing authority

#### Scenario: Invitation creation does not require automatic email delivery

- **WHEN** an authorized actor creates an invitation
- **THEN** the system stores the invitation and generates or records its tokenized acceptance link
- **AND** automatic email dispatch is not required for creation to succeed

#### Scenario: Authorized actor revokes a pending invitation

- **WHEN** an authorized CL Admin or same-workspace RP Admin revokes a pending invitation they are permitted to manage
- **THEN** that invitation cannot be accepted
- **AND** the retained invitation history records revoked status, actor, and time

#### Scenario: Existing active grant blocks invitation creation

- **WHEN** an authorized actor attempts to invite an identity that already has an active partner role in the target workspace
- **THEN** the portal rejects the invitation without changing the existing grant
- **AND** the actor is directed to the role-replacement operation permitted by the assignment authority matrix

### Requirement: Invitation and partner-grant lifecycles fail closed and preserve history

Invitation roles SHALL be constrained to RP Admin, RP User (Edit), or Read
Only. Invitation status SHALL be constrained to pending, accepted, expired, or
revoked. Partner-grant status SHALL be constrained to active or revoked.
Lifecycle transitions SHALL be validated before an invitation or grant is
mutated.

The portal SHALL enforce at most one pending invitation for a normalized
email/workspace pair and one active partner assignment for a user/workspace.
Optional Application or RP-configuration source provenance does not change
that workspace-level uniqueness rule. An accepted partner assignment SHALL
retain a valid reference to its source invitation when an invitation created
it.

#### Scenario: Invalid role or status is rejected

- **WHEN** a request or persisted mutation attempts to use an unsupported invitation role, invitation status, or grant status
- **THEN** the portal rejects the mutation
- **AND** the existing lifecycle records and active authorization remain unchanged

#### Scenario: Duplicate pending invitation is rejected within a workspace

- **WHEN** a pending invitation already exists for a normalized email in one workspace
- **AND** an authorized actor attempts another invitation for that email from Workspace Access, a different Application, or a different RP configuration in the same workspace
- **THEN** the portal rejects the duplicate or directs the actor to the existing invitation lifecycle
- **AND** it does not create competing pending authority

#### Scenario: Expired or revoked token cannot mutate a grant

- **WHEN** a user presents an expired, revoked, replaced, or otherwise inactive invitation token
- **THEN** the portal does not create, reactivate, or change a partner grant
- **AND** the unavailable invitation response does not reveal protected workspace details

#### Scenario: Accepted invitation replay is idempotent

- **WHEN** a user reopens an already accepted invitation after the active workspace role has been changed or replaced
- **THEN** the portal does not overwrite the current active role from the historical invitation
- **AND** the retained accepted invitation remains history rather than reusable authority

#### Scenario: Source invitation remains referentially valid

- **WHEN** an invitation acceptance creates a partner assignment
- **THEN** the assignment records the accepted invitation as its unique source
- **AND** the source record cannot be hard-deleted in a way that leaves an orphaned active or historical grant
- **AND** the same invitation cannot source a second grant

#### Scenario: Status and soft-delete state cannot contradict

- **WHEN** a mutation would persist an active grant or pending invitation as soft-deleted, or a revoked record without required lifecycle metadata
- **THEN** the portal and database reject the mutation
- **AND** status remains the sole authorization lifecycle source of truth

### Requirement: Invite user resolves existing identities without duplicate onboarding records

The CL Admin Invite user workflow SHALL normalize and resolve the invited email
inside the authorized backend boundary before creating a new invitation. When
one active existing identity matches, the portal SHALL direct the CL Admin to
explicit existing-user access management and SHALL NOT create a duplicate user
or invitation. Missing, disabled, deleted, conflicting, or ambiguous identity
state SHALL fail safely without mutating access.

#### Scenario: Existing identity uses immediate access management

- **WHEN** a CL Admin enters an email that uniquely matches an active existing portal identity
- **THEN** the portal does not create a pending invitation or another user
- **AND** it directs the CL Admin to confirm a permitted canonical assignment from the existing user's access route

#### Scenario: New identity receives one workspace invitation

- **WHEN** a CL Admin enters an email that does not match an existing portal identity and selects an existing workspace, permitted role, and valid expiry
- **THEN** the portal creates one pending workspace invitation
- **AND** no enabled local identity or active assignment exists until valid identity-matched acceptance

#### Scenario: Unsafe identity resolution changes nothing

- **WHEN** identity resolution is ambiguous or finds disabled, deleted, mixed-access, or otherwise ineligible state
- **THEN** the portal returns a safe recoverable failure
- **AND** it creates no user, invitation, or assignment
