# partner-portal-external-developer-invitations-and-scoped-access Specification

## Purpose
Define the canonical invitation lifecycle, acceptance and delegation rules,
and workspace-scoped access granted to collaborators who work with permitted
Applications and RP configurations.
## Requirements
### Requirement: Invitation acceptance validates token and signed-in identity

The generated acceptance URL SHALL use
`/invitations/rp-applications/prepare#token=...` so the bearer is initially
available only in the URL fragment. The public preparation page SHALL remove
the fragment from the browser address before any authentication redirect,
submit the token only in a non-cacheable POST body, and SHALL NOT retain it in
browser, analytics, referrer, server-session, or redirect state. After the
backend validates the live invitation, the opaque server session SHALL retain
only the public invitation reference needed to resume the tokenless
`/invitations/rp-applications/accept` flow. A missing, stale, or replaced
prepared reference SHALL fail closed and require the latest manually shared
link.

The system SHALL accept an invitation only when the server-owned authenticated
session contains exactly one usable CanadaLogin email identity whose
verification claim is true. The
backend SHALL apply one canonical email-normalization function to the trusted
claim and invited address. That function SHALL trim surrounding whitespace and
lowercase both values, then require exact equality without provider-specific
alias, plus-address, or dot rewriting. Missing, unverified,
conflicting, or ambiguous identity data SHALL fail closed. Validation SHALL
also reapply the configured domain-restricted partner-access policy to the
trusted verified email; possession of an invitation token SHALL NOT bypass
that policy. Validation SHALL complete before a local identity or partner
assignment is created or changed. An invitation SHALL use its required Partner
workspace as authorization context and SHALL NOT require an Application or RP
configuration.

Optional source provenance MAY identify an Application or RP configuration
from which the invitation was initiated. Before using that provenance for a
post-acceptance destination, the backend SHALL resolve its complete workspace,
Application, and configuration ancestry under the accepted grant. Missing,
stale, or mismatched provenance SHALL fall back to the assigned workspace and
SHALL NOT prevent acceptance or reveal another resource.

#### Scenario: Invitee accepts a valid invitation

- **WHEN** an invited user signs in with a verified CanadaLogin email whose canonical normalized value exactly equals the invited email and opens a valid pending invitation link
- **THEN** the public preparation step validates the bearer, removes it from browser-visible navigation state, and resumes through the tokenless authenticated acceptance route
- **AND** the system accepts the prepared invitation
- **AND** the portal creates exactly one canonical workspace-scoped partner assignment on first acceptance
- **AND** the portal redirects the user to the assigned workspace or, when validated source provenance exists, the in-scope Application hub or RP-configuration task

#### Scenario: First login checks pending invitations before denying access

- **WHEN** a signed-in CanadaLogin user has no active canonical role assignment
- **AND** the user's server-owned verified email exactly matches an active pending invitation after canonical normalization
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

- **WHEN** a signed-in user's verified email does not exactly equal the invited email after the same canonical normalization
- **THEN** the system does not accept the invitation
- **AND** the portal does not grant partner-scoped access, change a local identity, or reveal the invited address for that invitation

#### Scenario: Missing unverified or ambiguous signed-in email does not accept the invitation

- **WHEN** the authenticated session has no usable email, an unverified email, or conflicting or ambiguous email claims
- **THEN** the backend rejects acceptance before creating or changing a local identity or canonical assignment
- **AND** the response uses the same safe unavailable behavior and does not reveal which invited identity would match

#### Scenario: Verified email outside the permitted domain does not accept the invitation

- **WHEN** the authenticated session has one verified email that matches the invited address but does not satisfy the configured partner-access domain policy
- **THEN** the backend rejects acceptance before creating or changing a local identity or canonical assignment
- **AND** the invitation token does not bypass or weaken domain-restricted admission

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
permitted workspace metadata, Applications, contacts, RP-configuration
creation, editable-draft questionnaire changes, separately permitted top-level
metadata changes, configuration copy, checklist inputs and CATS evidence availability, explicit
Production-review request or status, secrets, MAU/usage, and invitation actions
defined by the four-role matrix. Draft-edit authority SHALL NOT reopen or
mutate completed questionnaire answers.

The role SHALL apply consistently to every Application and RP configuration in
the assigned workspace. Separate child-specific permission assignments SHALL
NOT be required. Copy authority SHALL NOT imply Production-review outcome
authority, and an invitation SHALL NOT grant CL Admin review transitions,
aggregate reporting, generic audit browsing, or internal review-note access.

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
- **THEN** the portal allows permitted workspace and Application administration, contacts, RP-configuration creation, editable-draft questionnaire changes, separately permitted top-level metadata changes, configuration copy, checklist inputs and CATS evidence availability, Production-review requests, secrets, MAU/usage, and RP User (Edit) or Read Only invitations in that workspace
- **AND** the RP Admin cannot assign another RP Admin, record a Production-review outcome, access aggregate reports, or use a generic audit browser
- **AND** the RP Admin cannot reopen or mutate completed questionnaire answers through the draft flow

#### Scenario: RP User (Edit) manages partner-scoped application configuration but not invitations

- **WHEN** an accepted user holds RP User (Edit) for one Partner workspace
- **THEN** the portal allows permitted Application and contact changes, RP-configuration creation, editable-draft questionnaire changes, separately permitted top-level metadata changes, configuration copy, checklist inputs and CATS evidence availability, secret, Production-review request, and MAU/usage operations in that workspace
- **AND** the user cannot manage invitations, role assignments, Production-review outcomes, aggregate reports, or generic audit browsing
- **AND** the user cannot reopen or mutate completed questionnaire answers through the draft flow

#### Scenario: Read Only can view partner-scoped application details without secret access

- **WHEN** an accepted user holds Read Only for one Partner workspace
- **THEN** the portal allows permitted Application details, contacts, checklist and CATS evidence availability, RP configurations, copy lineage, Production-review status, and MAU/usage in that workspace
- **AND** the user cannot mutate or copy data, request Production review, view or change secrets, use aggregate or audit-report surfaces, or manage invitations

#### Scenario: Invitation-backed users do not use department self-setup

- **WHEN** an accepted partner user reaches a protected product route without a personal Department assignment
- **THEN** the portal uses canonical workspace assignment and inherited workspace Department as partner context
- **AND** it does not redirect the user to personal or RP-configuration Department setup

#### Scenario: Invitee cannot access unrelated RP applications or workspace views

- **WHEN** an accepted partner user requests a workspace, Application, or RP configuration outside an active assigned workspace
- **THEN** the portal resolves the request as unavailable
- **AND** it does not expose unrelated hierarchy data

#### Scenario: Unauthorized invited-role subresources resolve as unavailable

- **WHEN** an accepted partner user requests credentials, invitations, Production-review outcomes, platform administration, or another protected subresource outside the canonical role matrix
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

### Requirement: Manual invitation delivery returns a copyable acceptance link

An authorized invitation create or reissue operation SHALL generate an opaque,
expiring acceptance token, persist only a one-way hash of the token, and return
the plaintext tokenized acceptance URL only in that successful write response.
The portal SHALL NOT send invitation email. The success surface SHALL let the
authorized inviter copy the link for delivery through an approved out-of-band
channel and SHALL explain that the link cannot be retrieved after the user
leaves the create or reissue result.

Normal invitation list/detail responses SHALL omit token hashes and acceptance
URLs. Invitation write responses SHALL be private and non-cacheable, and token
values SHALL be excluded from application logs, analytics, referrer data,
browser persistence, and evidence.

#### Scenario: Authorized inviter creates a manually delivered invitation

- **WHEN** a CL Admin or same-workspace RP Admin creates an invitation permitted by the canonical delegation matrix
- **THEN** the backend creates one pending invitation and returns its opaque expiring acceptance URL
- **AND** the success page provides a bilingual `Copy invitation link` control and copied confirmation
- **AND** the page explains that the portal sends no email and the inviter must share the link through an approved external channel selected by the responsible operational owner before non-local launch

#### Scenario: Plaintext invitation link is shown only after a successful write

- **WHEN** an authorized inviter leaves the create or reissue success result and later opens an invitation list or detail
- **THEN** the portal does not reconstruct or return the plaintext token or acceptance URL
- **AND** the UI explains that reissue is required when the link was not retained or is no longer safe to use

#### Scenario: Reissue replaces the manually delivered link

- **WHEN** an authorized actor reissues a manageable pending, expired, or revoked invitation
- **THEN** the portal returns one new copyable acceptance URL under the same manual-delivery warning
- **AND** the prior token remains unacceptable and normal reads omit both old and new plaintext tokens

#### Scenario: Invitation link handling does not leak bearer material

- **WHEN** an invitation is created, copied, reissued, opened, rejected, or accepted
- **THEN** the server stores only the token hash and normal structured logs, analytics, evidence, and provider payloads omit the token and tokenized URL
- **AND** create/reissue responses are private and non-cacheable
- **AND** the acceptance page prevents the tokenized URL from being sent as referrer data to unrelated destinations

### Requirement: Invitation lifecycle actions retain minimized audit history

The portal SHALL record minimized internal audit history for invitation create,
accept, revoke, reissue, expiry processing, and consequential failed attempts.
Each event SHALL identify the permitted actor or authenticated subject
reference, workspace and public invitation reference, requested canonical
role when applicable, action, outcome, timestamp, and correlation identifier.

Audit capture SHALL remain distinct from the retired user-facing audit
explorer. It SHALL NOT contain plaintext invitation tokens, tokenized URLs,
full invited email values, raw identity claims, provider payloads, secrets, or
unnecessary personal information.

#### Scenario: Invitation create revoke and reissue are auditable

- **WHEN** an authorized actor creates, revokes, or reissues a workspace invitation
- **THEN** the portal records the actor, workspace, affected public invitation references, permitted role, action, outcome, time, and correlation identifier
- **AND** reissue history links the replaced and replacement public records without recording either plaintext token or tokenized URL

#### Scenario: Invitation acceptance is auditable

- **WHEN** an authenticated user successfully accepts an invitation or acceptance fails for a security-relevant lifecycle or identity reason
- **THEN** the portal records the authenticated subject reference when available, workspace and public invitation reference, action, safe outcome/code, time, and correlation identifier
- **AND** the event excludes the presented token, token hash, full invited email, raw claims, and provider payload

#### Scenario: Audit capture does not create a product audit browser

- **WHEN** invitation audit events are retained
- **THEN** they remain available only through approved operational, security, or records-management paths
- **AND** RP Admin, RP User (Edit), Read Only, and CL Admin receive no generic invitation-audit explorer or aggregate invitation analytics merely because the events exist
