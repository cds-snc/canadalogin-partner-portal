# Delta for partner portal external developer invitations and scoped access

## MODIFIED Requirements

### Requirement: Accepted invitations grant only partner-scoped invited-developer role access

Accepted invitations SHALL grant exactly one canonical partner role for the
invitation workspace and SHALL NOT create CL Admin, a reusable role, an
Application-specific grant, an RP-configuration-specific grant, or a second
workspace membership role. The active workspace grant SHALL authorize only the
permitted workspace metadata, Applications, RP configurations, configuration
copy, Production-review request metadata, secrets, reporting, and invitation
actions defined by the four-role matrix.

The role SHALL apply consistently to every Application and RP configuration in
the assigned workspace. Separate child-specific permission assignments SHALL
NOT be required for this phase. Copy authority SHALL NOT imply Production-
review outcome authority, and an invitation SHALL NOT grant CL Admin review
transitions.

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
- **THEN** the portal allows permitted workspace and Application administration, contact management, RP-configuration management and copy, Production-review request metadata, secrets, reports, bounded partner audit, and RP User (Edit) or Read Only invitations in that workspace
- **AND** the RP Admin cannot assign another RP Admin or record a Production-review outcome

#### Scenario: RP User (Edit) manages partner-scoped application configuration but not invitations

- **WHEN** an accepted user holds RP User (Edit) for one Partner workspace
- **THEN** the portal allows permitted Application, contact, RP-configuration create/edit/copy, secret, Production-review request, report, and bounded-audit operations in that workspace
- **AND** the user cannot manage invitations, role assignments, or Production-review outcomes

#### Scenario: Read Only can view partner-scoped application details without secret access

- **WHEN** an accepted user holds Read Only for one Partner workspace
- **THEN** the portal allows permitted Application details, contacts, readiness, RP Configuration, copy lineage, Production-review status, Usage, aggregate reports, and redacted bounded audit in that workspace
- **AND** the user cannot mutate or copy data, request Production review, view or change secrets, view internal review notes, or manage invitations

#### Scenario: Invitation-backed users do not use department self-setup

- **WHEN** an accepted partner user reaches a protected product route without a personal Department assignment
- **THEN** the portal uses canonical workspace assignment and inherited workspace Department as partner context
- **AND** it does not redirect the user to personal or RP-configuration Department setup

#### Scenario: Invitee cannot access unrelated RP applications or workspace views

- **WHEN** an accepted partner user requests a workspace, Application, or RP configuration outside an active assigned workspace
- **THEN** the portal resolves the request as unavailable
- **AND** it does not expose unrelated hierarchy data

#### Scenario: Unauthorized invited-role subresources resolve as unavailable

- **WHEN** an accepted partner user requests credentials, invitations, internal review, Production-review outcomes, or another protected subresource outside the canonical role matrix
- **THEN** the portal resolves it as unavailable
- **AND** it does not confirm the protected subresource exists

#### Scenario: Invitation does not grant workspace membership

- **WHEN** an invitation is accepted
- **THEN** the portal creates only the canonical Partner workspace grant
- **AND** it does not create `workspace_admin`, `workspace_member`, an Application grant, an RP-configuration grant, or another product role
