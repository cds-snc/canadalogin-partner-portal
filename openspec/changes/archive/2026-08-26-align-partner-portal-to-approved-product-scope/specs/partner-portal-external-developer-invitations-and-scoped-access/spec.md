# Delta for partner portal external developer invitations and scoped access

## ADDED Requirements

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

## MODIFIED Requirements

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

## REMOVED Requirements

### Requirement: Partner-scoped roles can read aggregate onboarding reports inside granted scope

**Reason**: Aggregate onboarding throughput, invitation conversion, and secret-
rotation hygiene reporting came from the broader repository-derived PRD and is
not required by the approved MVP or onboarding PRD.

**Migration**: Retain role-scoped RP-configuration MAU/usage reporting. Remove
the aggregate-report capability, routes, cards, filters, and exports from all
three partner roles without granting cross-workspace oversight.
