# Delta for partner portal workspace and RP application management

## ADDED Requirements

### Requirement: RP configuration copying creates an independent named draft

The portal SHALL let an RP Admin or RP User (Edit) copy one explicitly
selected RP configuration to a distinct named draft under the same Application
and workspace. The editor SHALL explicitly supply the target configuration
name and Partner environment and SHALL select Test, Staging, or Production as
the target CanadaLogin environment. The target MAY use the same CanadaLogin
environment as the source.

Copy SHALL preserve the source without mutation, SHALL NOT select or overwrite
an existing sibling by name or environment, and SHALL record the selected
source as safe lineage. It SHALL transfer only the centrally reviewed
allowlist of reusable, non-secret answers. It SHALL NOT copy or infer the
target configuration name, Partner environment, endpoints, application,
redirect, or logout URLs, credentials, secrets, provider identifiers,
certificates, private keys, offline or JWK key material, review outcomes,
audit history, or another environment-specific value.

The copy operation SHALL require an idempotency key, current write authority,
and active workspace/Application/source ancestry. A copy to Production SHALL
create a draft only and SHALL NOT create, submit, approve, or advance a
Production-review request. Production review remains a separate explicit
action for the chosen Production configuration.

Read Only SHALL view permitted source and lineage status without copying. CL
Admin SHALL NOT gain partner configuration-copy authority merely from platform
administration authority.

#### Scenario: Authorized editor starts Copy configuration from one source

- **WHEN** an RP Admin or RP User (Edit) chooses `Copy configuration` for an authorized RP configuration
- **THEN** the portal opens a focused copy form that identifies the source by safe configuration name, Partner environment, and CanadaLogin environment
- **AND** it does not label the action Promote, Progress, or next environment

#### Scenario: Copy can target the same CanadaLogin environment

- **WHEN** an authorized editor copies one selected Staging configuration and selects Staging as the target
- **THEN** the portal permits a distinct target configuration with a new configuration name and explicit Partner environment
- **AND** the source and target may represent different Partner environments connected to the same CanadaLogin environment

#### Scenario: Copy can target any supported CanadaLogin environment

- **WHEN** an authorized editor copies a Test, Staging, or Production source and selects Test, Staging, or Production as the target
- **THEN** the service evaluates the explicit supported target rather than deriving a next environment
- **AND** it does not reject the copy merely because the target equals the source, precedes the source, or is not the old next-environment path

#### Scenario: Copy requires explicit target identity and Partner environment

- **WHEN** an authorized editor submits the copy form
- **THEN** the target configuration name, target Partner environment, and target CanadaLogin environment are explicit validated inputs
- **AND** the portal does not copy, infer, or silently reuse the source configuration name or Partner environment

#### Scenario: Copy preserves the source and never overwrites a sibling

- **WHEN** a valid copy request commits
- **THEN** the service creates a distinct draft/version 1 under the same Application and records the selected source lineage
- **AND** the source and every existing sibling remain unchanged
- **AND** an environment match or similar display name never selects an overwrite target

#### Scenario: Copy transfers only allowlisted reusable answers

- **WHEN** the source contains reusable questionnaire answers on the reviewed copy allowlist
- **THEN** the target receives those values through one centralized copy policy
- **AND** the policy is versioned and covered by positive and negative field tests
- **AND** the new draft resumes at the earliest required setup step not satisfied by the copied values

#### Scenario: Environment-specific and secret fields remain unset

- **WHEN** the source contains endpoints, URLs, redirect or logout URIs, credentials, secrets, provider identifiers, certificates, private keys, offline or JWK key material, review outcomes, or audit history
- **THEN** the target does not receive those values
- **AND** the copy page tells the editor that environment-specific setup and credentials must be completed separately

#### Scenario: Copy to Production does not create a review request

- **WHEN** an authorized editor copies a selected source to a Production target
- **THEN** the portal creates only the new Production draft and its safe source lineage
- **AND** it creates no Production-review request and does not present the draft as submitted, approved, launched, deployed, or promoted
- **AND** an authorized editor may later choose the separate `Request Production review` action for that selected target

#### Scenario: Several copy lineages coexist

- **WHEN** one Application has several copied Test, Staging, or Production configurations
- **THEN** each target records its selected source public identity without inferring lineage from name or environment
- **AND** matching CanadaLogin environments do not imply replacement, approval, or a unique family

#### Scenario: Retried copy creates at most one target

- **WHEN** the same authorized copy request is retried with the same idempotency key and equivalent payload
- **THEN** the service returns the original successful result without creating another configuration
- **AND** an incompatible replay returns the standard idempotency conflict without partial mutation

#### Scenario: Legacy source does not supply missing target metadata

- **WHEN** an authorized editor copies an in-scope retained source whose Partner environment is `Not provided`
- **THEN** the source remains eligible when the editor explicitly supplies valid target identity, Partner environment, and CanadaLogin environment
- **AND** copy does not infer the missing source value or require source remediation before creating the target

#### Scenario: Unauthorized or mismatched copy fails safely

- **WHEN** the actor lacks copy authority or the source does not belong to the selected active workspace and Application
- **THEN** the service creates no target, lineage, review request, provider mutation, or partial audit payload
- **AND** it returns the standard safe unavailable or denied result without revealing the owning hierarchy

#### Scenario: Independent configuration creation remains available

- **WHEN** an authorized editor does not need reusable answers from a source
- **THEN** the portal continues to allow an independent named Test, Staging, or Production configuration under the selected Application
- **AND** several configurations may target the same CanadaLogin environment when their required identities are valid

#### Scenario: Copy audit remains minimized

- **WHEN** a copy succeeds or reaches an auditable failure outcome
- **THEN** the portal records only the permitted actor, source and target public identifiers, selected target environment, outcome, correlation identifier, and timestamp
- **AND** copied answers, endpoints, credentials, secrets, invitation data, unnecessary personal information, and raw provider payloads are absent from audit and operational logs

#### Scenario: Legacy progression API delegates to copy without implicit review

- **WHEN** an authorized compatibility caller submits the existing source-scoped POST `/progression` request with its required idempotency key and valid Staging or Production target payload
- **THEN** the adapter delegates to the same copy service and preserves the existing 201 lineage-and-draft response shape, validation status, safe error envelope, and idempotent replay behavior
- **AND** the deprecated `promotionStatus` response field is `null` and `selfServe` identifies target creation as self-service
- **AND** a Production target creates no Production-review request or review-state transition
- **AND** callers use the separate Production-review endpoint when that later intention applies

#### Scenario: Legacy progression API cannot broaden copy scope

- **WHEN** a compatibility caller requests an unsupported target, changes the payload for an existing idempotency key, lacks current write authority, or names a mismatched hierarchy
- **THEN** the adapter returns the existing safe validation, conflict, unavailable, or denied contract as applicable
- **AND** it creates no target, review request, provider mutation, or partial lineage

### Requirement: Production review targets one selected Production configuration

The system SHALL track Production-review status and external review references
when CanadaLogin approval occurs outside the portal. A Production-review
request SHALL identify the parent Application and one explicitly selected
Production RP configuration. It MAY record a source configuration as optional
lineage when the target was copied, but source lineage SHALL NOT be required
and SHALL NOT be inferred from CanadaLogin environment.

RP Admin and RP User (Edit) SHALL explicitly create or update permitted
partner-owned Production-review request metadata. CL Admin SHALL record the
internal review outcome. Read Only SHALL view permitted status without
changing it. Copying a configuration SHALL NOT create, submit, update, approve,
or otherwise advance this request.

#### Scenario: Production review request captures review metadata

- **WHEN** an RP Admin or RP User (Edit) explicitly creates or updates a review request for one selected Production configuration
- **THEN** the portal stores the parent Application, Production configuration identifier, current Production-review status, external review reference, reviewing CL Admin identity or team metadata, and relevant timestamps
- **AND** it stores a source configuration identifier only when explicit copy lineage exists
- **AND** it does not infer source or target identity from CanadaLogin environment alone

#### Scenario: Production review can target an independently created configuration

- **WHEN** an authorized editor requests review for a Production configuration that was created independently without a copy source
- **THEN** the portal accepts the request without inventing source lineage
- **AND** the selected Production configuration remains the authoritative review target

#### Scenario: Platform admin records production review outcome

- **WHEN** a CL Admin records the latest out-of-band Production review result for the chosen target configuration
- **THEN** the portal updates the tracked Production-review status and review metadata
- **AND** partner roles cannot perform the review-only transition

#### Scenario: Production-bound record cannot appear approved without review trace

- **WHEN** a Production target lacks the required CL Admin review outcome or external reference
- **THEN** the portal does not present that configuration as approved or launched
- **AND** it identifies the missing review-traceability data to authorized roles without exposing internal notes to partner roles

#### Scenario: Copy does not create Production review

- **WHEN** an authorized editor copies any source to a Production draft
- **THEN** no Production-review request or status exists until the editor explicitly starts one for that selected target
- **AND** oversight and partner-facing surfaces do not present the copy as review work

### Requirement: Checklist readiness supports an explicit Production review request

The system SHALL make Application-level onboarding checklist progress,
external evidence references, and contextual process links visible on the
focused Application Readiness page before an authorized editor requests
Production review for one selected Production RP configuration. The review
context SHALL identify the selected Application, the Production target, and
its source configuration when lineage exists without inferring identity from
environment.

RP Admin and RP User (Edit) SHALL update permitted partner-owned checklist
inputs. Read Only SHALL view them. CL Admin SHALL view and record permitted
internal review outcomes on the capability-gated Application Internal review
page without partner secret access. The compact Application hub MAY summarize
readiness but SHALL NOT duplicate the full checklist or review controls.

Copying a configuration, including copying to Production, SHALL NOT imply that
readiness has been submitted or reviewed.

#### Scenario: Workspace admin reviews production prerequisites

- **WHEN** an authorized partner user opens Application Readiness or the explicit Production-review request for a named Production configuration
- **THEN** the portal displays the checklist, external evidence-reference status, and relevant process links permitted to that role
- **AND** it identifies the parent Application and selected Production configuration context

#### Scenario: Missing prerequisites are highlighted before production review

- **WHEN** tracked checklist items or external evidence references remain incomplete
- **THEN** the portal highlights the missing prerequisites before the user submits or resubmits the explicit Production-review request
- **AND** the hard gate remains outside Partner Portal for MVP2

#### Scenario: Production copy remains separate from readiness submission

- **WHEN** an authorized editor creates a Production draft by copying another configuration
- **THEN** Application readiness and review-request state remain unchanged
- **AND** the copy success page points to the appropriate setup or readiness task without submitting either one implicitly

## MODIFIED Requirements

### Requirement: Onboarding lifecycle state is tracked across core onboarding records

The system SHALL track onboarding state for workspaces, Applications, and RP
configurations using `draft`, `submitted`, `under_review`, `approved`, and
`launched` where that lifecycle applies. RP Admin and RP User (Edit) SHALL
prepare and submit partner-owned records. CL Admin SHALL perform internal
review-only transitions. Read Only SHALL view permitted state without changing
it.

Application readiness and internal review belong to the Application parent.
An RP configuration retains its own technical registration, copy lineage, and
explicit Production-review state and SHALL NOT create a second copy of the
Application's public metadata or internal review result. Creating or copying a
draft SHALL remain distinct from submitting it or requesting Production
review.

#### Scenario: New onboarding records start in draft

- **WHEN** an RP Admin or RP User (Edit) creates or copies a workspace-owned Application or RP configuration
- **THEN** the new record starts in draft until intentionally submitted
- **AND** copy lineage does not advance onboarding or Production-review state

#### Scenario: Submitted onboarding records expose review state

- **WHEN** an RP Admin or RP User (Edit) submits a draft onboarding record
- **THEN** the system records submitted
- **AND** it makes that state visible to authorized roles in the record's owning hierarchy

#### Scenario: Reviewed onboarding records move through governed states

- **WHEN** a CL Admin advances an authorized submitted onboarding record
- **THEN** the system can move the applicable record through under_review, approved, and launched as the outcome changes
- **AND** an Application review and an RP-configuration Production review remain distinct traceable decisions

#### Scenario: Unauthorized actor cannot advance review-only states

- **WHEN** an RP Admin, RP User (Edit), or Read Only user attempts to move a record into under_review, approved, or launched
- **THEN** the system denies the transition
- **AND** it preserves the current state

### Requirement: Workspace Access replaces the legacy Members destination

The portal SHALL use `/workspaces/$workspaceUuid/access` as the canonical
user-facing task hub for role assignments and workspace-owned invitation
management made available by the canonical authorization model. The hub SHALL
link to focused assignment and invitation collections, create/search forms,
and record-specific management routes. It SHALL NOT embed the full assignment
table, invitation table, search form, invite form, and lifecycle controls on
one page.

Repeated eligible users, assignments, and invitations SHALL use semantic
comparison tables. Cards SHALL represent only available single-destination
Access tasks. Invitation creation SHALL remain available after a workspace
exists even when the workspace has no Application or RP configuration. An
Application or RP-configuration entry point MAY link to Workspace Access, but
it SHALL NOT host or scope a separate access-management model. Discovery SHALL
use the workspace hub or contextual parent links and SHALL NOT require a
persistent workspace side-navigation rail.

The route family SHALL include focused assignment and invitation collections,
new flows, and record pages below `/workspaces/$workspaceUuid/access`. Every
route SHALL enforce the actor's delegation boundary: CL Admin MAY manage RP
Admin, RP User (Edit), and Read Only in the selected workspace; RP Admin SHALL
manage only RP User (Edit) and Read Only in the RP Admin's assigned workspace;
lower partner roles SHALL NOT mutate assignments or invitations.

#### Scenario: Authorized user opens workspace Access

- **WHEN** an authorized user chooses Access from a workspace hub or another permitted workspace-scoped route
- **THEN** the portal opens `/workspaces/$workspaceUuid/access`
- **AND** the page presents only available single-destination assignment and invitation tasks permitted for that user in the selected workspace
- **AND** the visible title and navigation label use `Access` rather than the retired `Members` concept
- **AND** it does not embed all Access collections and forms on the hub

#### Scenario: Workspace Access separates access tasks

- **WHEN** an authorized user opens the Workspace Access hub
- **THEN** current assignments link to `/access/assignments` and invitations link to `/access/invitations`
- **AND** available add-existing-user and invite-user tasks open focused `/access/assignments/new` and `/access/invitations/new` forms
- **AND** unavailable mutation tasks are omitted rather than displayed as disabled controls

#### Scenario: Workspace assignments use a comparison table

- **WHEN** an authorized user opens `/workspaces/$workspaceUuid/access/assignments`
- **THEN** the page presents the minimum permitted assignment fields in a captioned table with headers, a useful row header, text status, and concise action links
- **AND** each manageable assignment links to `/access/assignments/$assignmentUuid`
- **AND** assignment creation or mutation forms do not appear beneath the collection

#### Scenario: Workspace invitations use a comparison table

- **WHEN** an authorized user opens `/workspaces/$workspaceUuid/access/invitations`
- **THEN** the page presents the minimum permitted invitation lifecycle fields in a captioned table with headers, a useful row header, text status, and concise action links
- **AND** each manageable invitation links to `/access/invitations/$invitationUuid`
- **AND** invitation creation or lifecycle forms do not appear beneath the collection

#### Scenario: Invitation management opens the selected record

- **WHEN** an authorized user activates `Manage` for one invitation from Workspace Access, centralized Users and access, or a selected-user invitation table
- **THEN** the destination includes the invitation's public UUID and selected workspace UUID and opens only that record's focused lifecycle page
- **AND** two invitations in the same workspace retain distinct destinations
- **AND** invited email, invitation token, notification identifier, and authorization context are absent from the URL

#### Scenario: Focused Access routes preserve context and reauthorize

- **WHEN** a user opens an assignment or invitation child route directly
- **THEN** breadcrumbs and a visible translated parent link identify the selected workspace and Access hierarchy
- **AND** the backend revalidates the current session, capability, workspace, record ancestry, active/deleted state, and requested action
- **AND** missing and out-of-scope records return the same safe unavailable result

#### Scenario: Legacy Members link redirects to Access safely

- **WHEN** a user requests `/workspaces/$workspaceUuid/members`
- **AND** the requested workspace and current user pass the normal route-entry checks
- **THEN** the portal redirects to `/workspaces/$workspaceUuid/access`
- **AND** the redirect does not grant or preserve authority beyond the canonical assignment and invitation model

#### Scenario: Unauthorized Access remains hidden and denied

- **WHEN** the canonical authorization context does not permit the user to view or manage workspace Access
- **THEN** the workspace hub and other discovery surfaces omit the Access destination
- **AND** a direct hub, collection, form, or record request fails through the standard safe authorization behavior without revealing assignment or invitation data

#### Scenario: Access data stays on safe surfaces

- **WHEN** an Access route reads or changes assignment or invitation data
- **THEN** the portal exposes only the minimum permitted user and lifecycle fields for the selected workspace
- **AND** it does not place email addresses, invitation tokens, assignment payloads, or authorization context in route parameters, analytics, diagnostic body logs, or real-data fixtures
- **AND** audit metadata for a consequential access action excludes invitation secrets and unnecessary personal information

#### Scenario: CL Admin invites the first RP Admin before application work

- **WHEN** a CL Admin opens Access for an existing workspace with no Applications or RP configurations
- **THEN** the focused invitation flow allows the CL Admin to create an RP Admin invitation for that workspace
- **AND** the workflow does not require placeholder Application data, a placeholder RP configuration, or an IBM Verify operation

#### Scenario: RP Admin manages only lower roles in workspace context

- **WHEN** an RP Admin opens Access in the assigned workspace
- **THEN** the portal permits focused assignment and invitation actions only for RP User (Edit) and Read Only
- **AND** RP Admin and cross-workspace actions remain unavailable and denied

#### Scenario: Access routes remain bilingual accessible and responsive

- **WHEN** an authorized user operates an Access hub, table, form, or record page in English or French with keyboard, assistive technology, narrow viewport, or 200 percent zoom
- **THEN** route labels, headings, breadcrumbs, captions, headers, statuses, actions, errors, confirmations, and accessible names remain equivalent and usable
- **AND** focus remains visible and content reflows without clipped actions or required page-level horizontal scrolling

## REMOVED Requirements

### Requirement: Out-of-band production review remains traceable

**Reason**: The requirement assumes a Staging-to-Production promotion request
with a required source configuration and promotion status. Production review
may apply to any explicitly selected Production configuration, including one
created independently, and copying must never create review work implicitly.

**Migration**: Use `Production review targets one selected Production
configuration`. Preserve external references, partner-owned request metadata,
CL Admin-only outcomes, Read Only visibility, and the rule that a Production
configuration cannot appear approved or launched without the required review
trace. Treat source configuration as optional explicit lineage.

### Requirement: Environment progression remains explicit per named RP configuration

**Reason**: The requirement constrains a reusable configuration-copy operation
to derived Test-to-Staging or Staging-to-Production paths and couples creation
of a Production draft to review tracking. Partners may need several named
Partner environments connected to the same CanadaLogin environment, and draft
creation is distinct from requesting review.

**Migration**: Use `RP configuration copying creates an independent named
draft`. Independent Test and Staging creation remains allowed, Test-to-Staging
is one valid explicit copy, Staging-to-Production is an explicit copy followed
by a separately initiated Production-review request, several source lineages
may coexist, and a retained source never supplies missing target identity or
Partner-environment metadata. `Production review targets one selected
Production configuration` continues to own review outcomes.

### Requirement: Checklist readiness and process links are visible before production progression

**Reason**: Readiness applies before an explicit Production-review request,
not before copying a configuration or moving automatically to a next
environment.

**Migration**: Use `Checklist readiness supports an explicit Production review
request`. Preserve the current checklist, external evidence, role, Application
Readiness, Internal review, and advisory MVP2 gate behavior while keeping copy
and review submission separate.
