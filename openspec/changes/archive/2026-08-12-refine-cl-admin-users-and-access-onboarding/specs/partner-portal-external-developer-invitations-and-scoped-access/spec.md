## MODIFIED Requirements

### Requirement: Invitation acceptance validates token and signed-in identity

The system SHALL validate invitation acceptance using the tokenized route
/invitations/rp-applications/$token and SHALL accept an invitation only when the
signed-in CanadaLogin user matches the invited email identity for a currently
pending, unexpired invitation. Validation SHALL complete before any partner
assignment is created or changed. An invitation SHALL use its required
workspace as authorization context and SHALL NOT require an RP application.

#### Scenario: Invitee accepts a valid invitation

- **WHEN** an invited user signs in with the invited email address and opens a valid pending invitation link
- **THEN** the system accepts the invitation
- **AND** the portal creates exactly one canonical workspace-scoped partner assignment on first acceptance
- **AND** the portal redirects the user to the assigned workspace or, when safe source application context exists, an in-scope RP application experience

#### Scenario: First login checks pending invitations before denying access

- **WHEN** a signed-in CanadaLogin user has no active canonical role assignment
- **AND** the user's signed-in email matches an active pending invitation
- **THEN** the portal permits that invitation acceptance path before denying access
- **AND** other protected product routes remain unavailable until acceptance succeeds

#### Scenario: Accepted invitee uses the invitation's existing partner context

- **WHEN** an invited user accepts a valid invitation
- **THEN** the portal uses the invitation's existing partner workspace context
- **AND** the invitee is not asked to define a separate partner or department during acceptance
- **AND** the acceptance does not depend on an RP application existing in the workspace

#### Scenario: First accepted login assigns invitation roles to the local user record

- **WHEN** an invited user accepts a valid invitation for the first time
- **THEN** the portal creates or updates the local user identity record
- **AND** the portal creates one active canonical partner assignment for the invitation workspace and role before granting access
- **AND** it does not append a reusable platform role or workspace membership role

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

### Requirement: Canonical roles manage partner-scoped developer invitations

CL Admin SHALL be the only role allowed to invite or assign RP Admin. An active
RP Admin SHALL be allowed to invite RP User (Edit) or Read Only only within that
RP Admin's assigned partner workspace. Invitation creation SHALL require an
existing partner workspace and SHALL NOT require an RP application. A specific
RP application MAY be retained only as optional source provenance when the
invitation starts from an application, while the accepted role SHALL apply to
the whole workspace.

First successful invitation acceptance SHALL create exactly one active
canonical partner assignment. Idempotent replay SHALL return the existing
accepted outcome without mutating the current assignment. Acceptance SHALL NOT
create a global role, a reusable role definition, or a second workspace
membership role. Invitation creation SHALL be rejected when the target
identity already has an active partner assignment in the workspace; an
authorized actor SHALL use the explicit atomic role-replacement operation
instead.

#### Scenario: CL Admin bootstraps an RP Admin

- **WHEN** a CL Admin creates an invitation for the initial partner-side RP Admin in an existing workspace before any RP application exists
- **THEN** the portal permits the invitation to carry RP Admin with workspace context only
- **AND** acceptance creates one RP Admin assignment for that workspace

#### Scenario: RP Admin invites permitted staff in the same workspace

- **WHEN** an active RP Admin invites staff from the assigned workspace Access surface or an RP application entry point
- **THEN** the portal permits RP User (Edit) or Read Only
- **AND** the invitation cannot target another workspace

#### Scenario: RP Admin cannot assign RP Admin

- **WHEN** an RP Admin attempts to create an invitation carrying RP Admin
- **THEN** the portal rejects the request
- **AND** only CL Admin can assign RP Admin

#### Scenario: Invitation requires an existing workspace

- **WHEN** an authorized actor attempts to invite a user before the partner workspace exists
- **THEN** the portal rejects the invitation
- **AND** it does not create an unscoped role assignment

#### Scenario: Authorized actor reviews workspace invitation status

- **WHEN** an authorized CL Admin or same-workspace RP Admin opens invitation management
- **THEN** the portal lists the invitations the actor is allowed to manage
- **AND** each record distinguishes pending, accepted, expired, and revoked status

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

## ADDED Requirements

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
