# Delta for partner portal workspace and RP application management

## MODIFIED Requirements

### Requirement: Partner workspace access uses canonical workspace-scoped roles

Partner workspace authorization SHALL use RP Admin, RP User (Edit), or Read
Only from the canonical partner access-grant model. Each role SHALL apply to
every Application and RP configuration in the assigned workspace. The legacy
values `workspace_admin` and `workspace_member` SHALL NOT be accepted,
displayed, or used for authorization after cutover, and no Application- or
RP-configuration-specific grant is introduced by this hierarchy.

RP Admin SHALL administer workspace metadata, Applications, contacts, RP-
configuration creation, editable-draft questionnaire changes, separately
permitted top-level metadata changes, configuration copy, checklist inputs and
CATS evidence availability, partner secrets, MAU/usage, and permitted staff invitations. RP User
(Edit) SHALL edit Applications and contacts; create RP configurations; edit
incomplete draft questionnaires; update separately permitted top-level
metadata; copy configurations; update checklist inputs, view CATS evidence
availability, and update permitted
secret and Production-review request metadata; and read MAU/usage without
managing roles or invitations. Neither role's draft-edit authority SHALL
reopen or mutate completed questionnaire answers. Read Only SHALL receive
permitted Application metadata, contacts, configuration, checklist and CATS evidence availability,
Production-review status, and MAU/usage without mutation or secret access.

CL Admin SHALL bootstrap a workspace and its first RP Admin, manage canonical
Users/access and Invitations, view authorized cross-workspace metadata,
checklist and CATS evidence-availability status, and explicit Production-review metadata, and record
Production-review outcomes without retrieving RP secret values or performing
partner-side configuration changes. No role receives aggregate onboarding
reports or a generic partner audit browser.

Where an existing requirement uses workspace administrator or owner as a
capability description, that description SHALL resolve through this canonical
matrix and SHALL NOT create a fifth product role.

#### Scenario: RP Admin manages partner workspace operations

- **WHEN** an RP Admin performs a supported workspace, Application, contact, RP-configuration, checklist-input or CATS-availability, secret, secret-change-log, MAU/usage, Production-review request, or lower-role invitation/assignment operation in the assigned workspace
- **THEN** the portal permits the operation within that workspace and verifies any child resource through its complete ancestry
- **AND** the role does not grant CL Admin, another workspace, aggregate-report, generic-audit, or Production-review outcome authority
- **AND** an RP-configuration mutation is limited to creation, editable-draft questionnaire changes, separately permitted top-level metadata changes, copy, or another focused operation expressly defined by this specification
- **AND** the draft flow does not reopen or mutate completed questionnaire answers

#### Scenario: RP User Edit manages configuration without roles or invitations

- **WHEN** an RP User (Edit) performs a supported Application, contact, RP-configuration, checklist-input or CATS-availability, secret, Production-review request, secret-change-log, or MAU/usage operation in the assigned workspace
- **THEN** the portal permits the operation within that workspace and verifies any child resource through its complete ancestry
- **AND** the user cannot mutate workspace roles, invitations, Production-review outcomes, or removed aggregate/audit surfaces
- **AND** an RP-configuration mutation is limited to creation, editable-draft questionnaire changes, separately permitted top-level metadata changes, copy, or another focused operation expressly defined by this specification
- **AND** the draft flow does not reopen or mutate completed questionnaire answers

#### Scenario: Read Only receives view-only workspace access

- **WHEN** a Read Only user opens permitted workspace metadata, Application details, contacts, checklist and CATS evidence availability, RP configuration, Production-review status, or MAU/usage in the assigned workspace
- **THEN** the portal returns the permitted read-only data
- **AND** no mutation, secret value, secret-change log, aggregate report, generic audit event, or internal review note/outcome is available

#### Scenario: CL Admin bootstraps without partner secret authority

- **WHEN** a CL Admin creates or reviews partner metadata, manages access/invitations, adopts a retained RP, assigns the first RP Admin, or records an explicit Production-review outcome
- **THEN** the portal permits the applicable global operation whether or not an Application or RP configuration exists yet
- **AND** it does not expose client credentials, secret values, partner secret lifecycle controls, questionnaire answers, aggregate reports, or internal review notes

#### Scenario: Revoked partner assignment ends workspace access

- **WHEN** a user's active partner assignment for one workspace is revoked
- **THEN** the next protected request no longer receives access to that workspace or its Applications and RP configurations through that assignment
- **AND** access to other independently assigned workspaces remains unchanged

### Requirement: Grant-authorized partner editors can operate current and rotated secrets

The credential-management page SHALL allow RP Admin and RP User (Edit) to copy
the client ID, reveal and copy the current client secret, regenerate the
current secret, create named rotated secrets, delete selected rotated secrets,
and download the minimum secret-change CSV for RP configurations inside their
active workspace and Application scope through authorized APIs. Read Only and
CL Admin SHALL NOT perform those operations, and authorization SHALL fail
before any upstream secret retrieval or mutation.

The secret-change log SHALL identify the selected RP configuration, action,
actor, and timestamp in the Sentinel-compatible MVP shape. It SHALL NOT become
a generic audit explorer and SHALL NOT contain current, previous, rotated, or
generated secret values.

#### Scenario: Authorized partner editor reveals the current client secret

- **WHEN** an RP Admin or RP User (Edit) explicitly reveals the current client secret for an in-scope RP configuration
- **THEN** the portal applies the existing one-time reveal, masking, authorization, and ancestry contract
- **AND** it records a minimized event containing safe actor, configuration, reveal action, outcome, timestamp, and correlation identifier
- **AND** the event and downloadable log contain no client secret, token, credential value, or raw provider response

#### Scenario: Authorized partner editor regenerates the current client secret

- **WHEN** an RP Admin or RP User (Edit) confirms current-secret regeneration for an in-scope RP configuration
- **THEN** the portal calls the scoped rotation endpoint, refreshes the displayed credentials, and reveals the newly returned current secret under the one-time reveal contract
- **AND** every workspace, Application, and configuration identifier is revalidated before mutation
- **AND** the audit event records safe actor, action, configuration, result, and time without the secret value

#### Scenario: Authorized partner editor creates and deletes rotated secrets

- **WHEN** an RP Admin or RP User (Edit) submits a rotation name or chooses an in-scope rotated secret for deletion
- **THEN** the portal creates or deletes the selected rotated secret through scoped API endpoints
- **AND** it refreshes the rotated-secret list for only that RP configuration
- **AND** the audit event excludes every secret value and unnecessary personal information

#### Scenario: Authorized partner editor downloads the secret-change log

- **WHEN** an RP Admin or RP User (Edit) downloads secret-change history for one in-scope RP configuration
- **THEN** the portal returns a CSV in the approved Sentinel-compatible shape showing when each secret lifecycle action occurred and which authorized actor performed it
- **AND** the export is scoped to that selected configuration and contains no secret values, credentials, tokens, questionnaire answers, invitation data, or unrelated audit events
- **AND** Read Only, CL Admin, and out-of-scope callers receive the standard safe denial or unavailable response

### Requirement: Workspace entry pages provide a scoped task hierarchy

The portal SHALL use `/workspaces` as the authorized Partner workspace chooser
and `/workspaces/$workspaceUuid` as the task-oriented overview and entry page
for the selected workspace. The selected workspace page SHALL link to focused
Applications, Access/Invitations, Settings, and permitted MAU/usage discovery.
It SHALL NOT expose a selected-workspace aggregate report or embed child
tables, forms, report results, or access controls. Workspace children SHALL use
the normal focused page layout without a persistent side-navigation rail and
SHALL provide stable translated parent return links.

#### Scenario: User selects an authorized workspace

- **WHEN** an authenticated user opens `/workspaces`
- **THEN** the page lists only workspaces available through canonical authorization
- **AND** each workspace link uses the workspace name as its primary label
- **AND** selecting a workspace opens `/workspaces/$workspaceUuid`

#### Scenario: User opens the workspace task hub

- **WHEN** an authorized user opens `/workspaces/$workspaceUuid`
- **THEN** the page identifies the selected workspace by name in one H1 or equivalent page-heading context
- **AND** it groups only available Applications, Access, Settings, and MAU/usage discovery destinations under clear translated headings
- **AND** Applications replaces the peer `Application information` and `RP applications` destinations
- **AND** Access exposes the canonical assignment and Invitation sections permitted to the actor
- **AND** any Reports destination leads to authorized Application/RP-configuration usage discovery rather than `/workspaces/$workspaceUuid/reports`
- **AND** each available destination is one responsive single-destination GC Design System card with a concise description

#### Scenario: Workspace hub stays focused on task selection

- **WHEN** an authorized user opens `/workspaces/$workspaceUuid`
- **THEN** the page may show concise sourced workspace context
- **AND** empty functional groups are omitted and cards follow logical source and keyboard order
- **AND** it does not embed Application/RP-configuration lists, Access management, invitation forms, MAU results, aggregate reports, settings forms, or audit results

#### Scenario: Workspace children preserve parent navigation

- **WHEN** an authorized user opens a first-level workspace child route
- **THEN** breadcrumbs identify Home, Partner workspaces, and the selected workspace as the stable parent hierarchy when breadcrumbs apply
- **AND** the breadcrumb trail omits the current child page
- **AND** a visible translated parent link returns to `/workspaces/$workspaceUuid` without relying on browser history
- **AND** the page does not render a persistent workspace side-navigation rail

#### Scenario: Workspace children use a focused responsive layout

- **WHEN** an authorized user opens a workspace child route on desktop, mobile, or a zoomed viewport
- **THEN** focused content uses the normal page container without a reserved left-navigation column
- **AND** the page preserves logical keyboard order, visible focus, and reflow without clipped content or horizontal scrolling

#### Scenario: Raw workspace identifiers are not primary UI labels

- **WHEN** workspace context appears in a heading, breadcrumb, account context, link, status summary, return link, or confirmation
- **THEN** the portal uses the authorized workspace name or a neutral localized fallback as the primary label
- **AND** it does not present the raw workspace UUID as a friendly workspace name

#### Scenario: Workspace task visibility does not replace authorization

- **WHEN** canonical context does not expose a workspace task to the user
- **THEN** the workspace hub and other discovery surfaces omit that task label
- **AND** direct requests continue through route and backend authorization for the selected hierarchy

#### Scenario: Workspace pages use server-scoped resources

- **WHEN** the chooser, hub, or a workspace child requests data
- **THEN** the backend applies current session, capability, selected workspace, and object ancestry before returning resources
- **AND** the browser does not receive a wider cross-workspace dataset and reduce it through client-side filtering
- **AND** stale browser session or authorization state does not grant route or API access

### Requirement: Registration validation failures remain actionable and preserve draft recovery

Completing an Application-scoped RP-configuration registration step SHALL
distinguish correctable validation from a draft load, concurrency, network, or
persistence failure. A correctable `422` SHALL keep the user on the current
step, preserve entered answers and the last server-saved draft/version, and
present a localized error summary with safe field-level feedback when field
locations are returned. It SHALL NOT describe the draft as unavailable or
imply that server-saved answers were lost.

Any client- or server-side validation failure from an action that requires
valid answers SHALL present one localized error summary at the top of the
associated form and move focus to that summary. Summary entries SHALL follow
question order and, for an error tied to a question, SHALL link to the affected
control or choice group. The same specific, actionable localized message SHALL
appear in the summary and in the question context after its label or legend
and hint and before the response control or choice group. The error SHALL be
programmatically associated with the affected control or group. A known
correction SHALL NOT be replaced by generic feedback such as `Check this
answer`.

This behavior SHALL apply to Basics, Endpoints, Client and access, Signing,
Encryption, and complete-questionnaire validation from Review. Correcting one
answer SHALL clear only its resolved error and SHALL preserve every other
unresolved error and summary link. A cross-step or form-level validation error
without a safe field location SHALL remain a specific summary item and SHALL
NOT link to an unrelated control. Network, service, authorization, ancestry,
optimistic-concurrency, and persistence failures SHALL remain distinct from
answer-validation feedback.

When complete-questionnaire validation from Review finds errors on more than
one route-per-step page, the portal SHALL open the earliest invalid step and
SHALL render only that step's errors in its local summary and question
contexts. Other invalid steps SHALL remain visibly pending or unavailable
until their prerequisites are valid. A summary SHALL NOT link to a control that
is not rendered on the current route.

Frontend request serialization and backend validation SHALL share or test one
documented registration-draft contract, including Application ancestry,
configuration name, Partner environment, CanadaLogin environment, field aliases, enum values,
conditional prerequisites, repeatable URL list shapes, `stepId`, `saveMode`,
and `expectedDraftVersion`.

#### Scenario: Valid Endpoints answers advance registration

- **WHEN** an authorized partner editor submits a representative valid Endpoints `completeStep` payload for a current server-backed RP-configuration draft in an authorized Application
- **THEN** the backend accepts the documented frontend-serialized request after verifying workspace, Application, and configuration ancestry
- **AND** it saves the Endpoints answers, increments the draft version, marks only the valid step complete, and returns the draft needed to advance

#### Scenario: Correctable Endpoints validation stays on Step 2

- **WHEN** the Endpoints `PATCH` returns `422` for one or more correctable answers
- **THEN** the frontend remains on Endpoints and focuses a localized error summary linked to affected controls
- **AND** it preserves the user's entered values and the last server-saved draft/version
- **AND** it does not show the generic draft-load or unavailable-draft message

#### Scenario: Correctable validation on a rendered step is shown in context

- **WHEN** a validation-gated action on Basics, Endpoints, Client and access, Signing, or Encryption finds one or more correctable answer errors
- **THEN** the portal remains on that step and moves focus to the error summary at the top of its form
- **AND** summary entries follow question order and link to each affected control or choice group rendered on that route when a safe field location exists
- **AND** each affected question repeats the same specific localized correction after its label or legend and hint and before its response control or choice group
- **AND** each question-level error is programmatically associated with its affected control or group
- **AND** the portal preserves entered values and the last server-saved draft/version without marking the affected step complete

#### Scenario: Review validation recovers one rendered step at a time

- **WHEN** complete-questionnaire validation from Review finds correctable errors on one or more registration-step routes
- **THEN** the portal opens the earliest invalid permitted step and focuses that step's local error summary
- **AND** the summary and inline feedback contain only errors for questions rendered on that route
- **AND** later invalid steps remain visibly pending or unavailable until contiguous progress reaches them
- **AND** no summary link targets a control on another unrendered route
- **AND** the last server-saved draft/version and entered values remain recoverable without marking the questionnaire complete or creating or changing Production review

#### Scenario: Correcting one question preserves other validation errors

- **WHEN** a step shows errors for more than one question and the user corrects one affected answer
- **THEN** the resolved question's inline error and summary entry are cleared when that answer becomes valid
- **AND** every other unresolved inline error and ordered summary link remains available
- **AND** the user is not required to resubmit merely to rediscover errors that were unrelated to the corrected answer

#### Scenario: Form-level validation does not target an unrelated question

- **WHEN** complete-questionnaire or cross-step validation returns a specific error without a safe field location
- **THEN** the error remains in the localized summary with a route-level recovery explanation when applicable
- **AND** it does not create a false link, inline message, or invalid state on an unrelated control

#### Scenario: Contract drift is caught before release

- **WHEN** frontend registration serialization or backend request aliases,
  enums, ancestry fields, prerequisites, or list shapes change
- **THEN** a cross-stack contract test submits the actual frontend-shaped
  Endpoints request to backend validation
- **AND** an incompatible change fails verification rather than surfacing only
  as an unexplained runtime `422`

#### Scenario: Non-validation save failure remains recoverable

- **WHEN** the Endpoints save fails because of a network, service, ancestry, concurrency, or unexpected persistence error
- **THEN** the frontend shows a scoped localized retry or safe-unavailable notice distinct from field validation and draft-load failure
- **AND** it preserves entered values and the last server-saved draft without advancing or marking the step complete

#### Scenario: Registration validation logs remain safe and traceable

- **WHEN** the backend accepts or rejects a registration step
- **THEN** structured logs include the safe actor reference, workspace, Application, and RP-configuration identifiers, step, save mode, safe changed or invalid field names, result, stable error code when applicable, and request/correlation identifier
- **AND** logs exclude questionnaire values, URLs, certificates, JWK content, credentials, tokens, private keys, contact values, and unnecessary personal information

### Requirement: Partner workspaces own Applications as parent aggregates

The portal SHALL treat a Partner workspace as the collaboration, tenancy, and
authorization boundary and SHALL treat each workspace-owned Application as the
parent of its bilingual public metadata, onboarding narrative, contacts,
required-artifact/checklist context, CATS evidence availability, process links, and RP
configurations. It SHALL NOT assign an Application a generic onboarding
lifecycle, aggregate readiness score, or internal review-note record.

RP Admin and RP User (Edit) SHALL create and edit Applications in an assigned
workspace. Read Only and CL Admin SHALL receive only the Application metadata,
checklist/evidence status, and explicit Production-review surfaces permitted by
their canonical capabilities. A child identifier SHALL NOT grant authority
independently of the workspace.

#### Scenario: Partner editor creates an Application

- **WHEN** an RP Admin or RP User (Edit) creates an Application from `/workspaces/$workspaceUuid/applications/new`
- **THEN** the portal creates one Application in the authorized workspace
- **AND** it stores canonical English and French public service names plus the approved onboarding sections for overview, technology/protocol, security/privacy, usage, and migration/transition planning
- **AND** success opens the new Application hub without creating a generic lifecycle or internal review record

#### Scenario: Partner editor updates canonical public metadata

- **WHEN** an RP Admin or RP User (Edit) updates Details for an in-scope Application
- **THEN** the portal updates that one parent record
- **AND** every child summary obtains public Application identity from the updated parent rather than a duplicated RP-configuration name

#### Scenario: Application may exist before its first RP configuration

- **WHEN** an authorized partner editor creates an Application and has not created an RP configuration
- **THEN** the Application remains a valid workspace-owned record with an actionable RP-configurations empty state
- **AND** the portal does not invent an Application lifecycle state, create a placeholder RP row, or require Partner/CanadaLogin environment until an RP configuration is created

#### Scenario: Child resources inherit workspace context

- **WHEN** an Application, contact, checklist/evidence item, or RP configuration is read or mutated
- **THEN** the backend derives authorization and effective Department context through its owning workspace
- **AND** a child-level workspace or Department value cannot override that parent boundary

#### Scenario: Nested identifiers must share one hierarchy

- **WHEN** a route or API combines workspace, Application, contact, checklist/evidence, or RP-configuration UUIDs that do not belong to the same hierarchy
- **THEN** the portal returns the standard safe unavailable response
- **AND** it does not reveal which identifier exists, its actual parent, or protected metadata

#### Scenario: Linked RP configurations block destructive Application deletion

- **WHEN** an authorized partner editor attempts to delete an Application that still owns one or more retained RP configurations in any registration, review, or soft-delete condition
- **THEN** the system rejects the delete request
- **AND** it identifies safely that the child configurations must be resolved first
- **AND** no Application, contact, configuration, credential, audit-history, checklist/evidence, or Production-review record is deleted

### Requirement: Application contacts use person identity fields and focused management

Application contacts SHALL be Application-owned records with required first
name, last name, English responsibility or title, French responsibility or
title, and email, plus optional phone and alternate phone. Person names SHALL
be entered once and SHALL NOT have English and French variants. Labels, hints,
errors, and responsibility/title content SHALL remain bilingual.

RP Admin and RP User (Edit) SHALL manage contacts through focused list, create,
edit, and confirmed-delete routes. Read Only SHALL receive the permitted read-
only list. CL Admin SHALL receive contact data only when its oversight purpose
permits it. Contact confirmation SHALL NOT create an overall readiness score,
`submit-ready` state, or mandatory contact-type gate that the approved PRD
still marks TBD.

#### Scenario: Partner editor records a contact

- **WHEN** an RP Admin or RP User (Edit) creates an Application contact
- **THEN** the portal requires first name, last name, English and French responsibility/title values, and a valid email
- **AND** it accepts optional phone values
- **AND** it records the new contact as identity-confirmed by that authorized actor without persisting duplicate language-specific person names
- **AND** it does not ask for or persist English and French versions of the person's first or last name

#### Scenario: Language switching preserves person identity

- **WHEN** a user changes official language while viewing or editing a contact
- **THEN** the UI translates labels, hints, validation, and actions and displays the responsibility/title value for the active language
- **AND** it preserves the same first name, last name, email, and phone values without translating or duplicating the person's name

#### Scenario: Contact responsibility remains bilingual

- **WHEN** an authorized editor records a contact's responsibility or title
- **THEN** the API stores the English and French values without treating either as the person's name or an authorization role
- **AND** the frontend renders the matching value for the active language

#### Scenario: Legacy contact requires explicit confirmation

- **WHEN** an existing contact has only legacy bilingual full-name or responsibility fields
- **THEN** the portal preserves those values without parsing, translating, or guessing first and last name
- **AND** it renders the retained full name for the active locale until RP Admin or RP User (Edit) confirms first and last name
- **AND** confirmation records actor and time without overwriting either responsibility value
- **AND** confirmation may satisfy that contact record's identity fields but does not create an overall readiness result or invent a mandatory contact-type gate
- **AND** no migration writes invented person identity data

#### Scenario: Contact personal information remains protected

- **WHEN** contact data is created, read, updated, deleted, logged, audited, tested, or shown in evidence
- **THEN** the system limits values to the authorized Application purpose and scope
- **AND** it excludes contact values from URLs, query strings, analytics, diagnostic logs, audit detail values, real-data fixtures, and screenshots


### Requirement: Applications own required named RP configurations

The portal SHALL present each partner-visible current `rp_application` record
as one RP configuration that belongs to exactly one Application and therefore
one workspace. Every new partner-created RP configuration SHALL have a
required locale-neutral configuration name, a required locale-neutral Partner
environment label, and exactly one CanadaLogin environment: `test`, `staging`,
or `production`.

An Application MAY own any number of configurations targeting the same
CanadaLogin environment. Several Partner environments MAY connect to the same
CanadaLogin environment. The system SHALL NOT impose a one-configuration-per-
environment invariant or infer a Partner environment from the CanadaLogin
target, URLs, provider metadata, configuration name, or siblings.

Legacy records without a trustworthy Partner environment MAY remain readable
with an explicit localized `Not provided` compatibility value. The portal
SHALL NOT silently relabel or hide those records, and a new canonical create or
clone SHALL NOT omit the field.

#### Scenario: Partner editor creates a named RP configuration

- **WHEN** an RP Admin or RP User (Edit) starts a configuration from `/workspaces/$workspaceUuid/applications/$applicationUuid/rp-configurations/new`
- **THEN** the portal requires a configuration name, Partner environment, and CanadaLogin environment in the selected Application context
- **AND** it does not ask for a second copy of the Application's English and French public names
- **AND** valid creation links the configuration to exactly that Application and workspace

#### Scenario: Two configurations target the same CanadaLogin environment

- **WHEN** an Application already has one configuration targeting a CanadaLogin environment and an authorized editor creates another differently named configuration for that same environment
- **THEN** the portal preserves both configurations as distinct records
- **AND** it does not overwrite, reuse, reject, or merge either record solely because their CanadaLogin environment matches

#### Scenario: Configuration name distinguishes same-environment siblings

- **WHEN** active sibling configurations have the same Application and CanadaLogin environment
- **THEN** each has a non-blank configuration name and a distinct stable configuration UUID
- **AND** summaries show configuration name, explicitly labelled Partner environment, and explicitly labelled CanadaLogin environment
- **AND** exact displayed name, Partner-environment, and CanadaLogin-environment duplicates show a localized short public reference derived from the UUID so the target remains human-distinguishable
- **AND** the system does not infer record identity from configuration name or environment

#### Scenario: Configuration name is locale neutral

- **WHEN** a user creates, edits, views, or changes language for an RP configuration
- **THEN** one trimmed Unicode-normalized configuration-name value is used in both official-language experiences
- **AND** the UI translates its field label, hint, validation, and surrounding content rather than collecting `nameEn` and `nameFr`
- **AND** names longer than 128 characters or containing only whitespace are rejected

#### Scenario: Partner environment is a distinct locale-neutral label

- **WHEN** a partner creates, edits, views, or changes language for an RP configuration
- **THEN** the canonical create contract requires one trimmed Unicode-normalized `partnerEnvironment` value from 1 to 128 characters
- **AND** the UI translates `Partner environment`, its hint, validation, and surrounding content rather than collecting English and French variants
- **AND** the value remains distinct from `configurationName`, `canadaLoginEnvironment`, and the English/French Application environment URLs
- **AND** labels such as `QA 2` and `Partner staging` are valid without implying a fixed taxonomy or one-to-one CanadaLogin mapping

#### Scenario: Missing legacy Partner environment is not guessed

- **WHEN** migration or a compatible read encounters a retained RP configuration without a trustworthy Partner environment
- **THEN** the system preserves the missing state and renders localized `Not provided` where a value must be shown
- **AND** it does not derive the value from configuration name, URLs, provider metadata, CanadaLogin environment, or sibling records
- **AND** contracting the nullable compatibility field requires explicit mappings or authorized confirmations for every retained row
- **AND** absence of this newly introduced label does not change historical registration-completion or Production-review data

#### Scenario: Partner editor confirms missing Partner environment without reopening registration

- **WHEN** an RP Admin or RP User (Edit) supplies a valid Partner environment from the nested `/partner-environment/edit` route for an in-scope retained configuration whether registration is incomplete or complete and whether Production review is absent or present
- **THEN** a focused metadata operation revalidates workspace, Application, configuration ancestry, and write capability before updating the top-level field
- **AND** it does not reopen registration, change technical completion, create or advance Production review, or mutate questionnaire answers
- **AND** a Read Only user cannot perform the operation
- **AND** the audit event records actor, safe field name, result, timestamp, and resource references without the entered label value

#### Scenario: Legacy configuration without CanadaLogin environment blocks activation

- **WHEN** migration finds an active workspace-linked RP row without a CanadaLogin environment
- **THEN** it requires an explicit `test`, `staging`, or `production` mapping and does not infer one from names, URLs, provider metadata, or siblings
- **AND** an unresolved row remains outside canonical partner configuration discovery and prevents the required-field contract phase from activating

#### Scenario: Application parent must belong to the same workspace

- **WHEN** creation, adoption, migration, or a concurrent update would link an RP configuration to an Application owned by another workspace
- **THEN** the transaction fails without changing either record
- **AND** database-supported invariants plus locked service validation prevent a workspace-less Application parent or cross-workspace partner configuration

#### Scenario: Configuration ancestry mismatch fails safely

- **WHEN** a caller supplies a configuration UUID owned by another Application or workspace
- **THEN** the route and API return the same safe unavailable result as a missing configuration
- **AND** no configuration, Application, workspace, grant, provider, Usage, credential, or secret data is disclosed

### Requirement: Application and RP configuration collections use focused comparison tables

The portal SHALL distinguish Application summaries from RP-configuration
summaries. The selected-workspace Applications page and each Application's RP-
configurations page SHALL use secret-free, server-scoped summary contracts and
compact GC Design System tables because their rows share comparable facets.
Application identity SHALL come from active-language parent metadata. RP-
configuration identity SHALL come from configuration name plus explicitly
labelled Partner and CanadaLogin environments.

Generic `Status`, onboarding lifecycle, and overall readiness columns SHALL
NOT be used. A configuration collection MAY expose explicitly labelled
technical `Registration` context and `Production review` status when sourced
from their separate canonical records. Application rows MAY show safe contact
or configuration counts and directly sourced missing-artifact attention, but
not a score, completion count, or `submit-ready` state.

Each record's View, Resume, Add, or Edit navigation SHALL remain within the
same row as the record it affects. Tables SHALL have an accessible caption or
equivalent nearby heading, column headers, stable first-column identity, real
text for missing values, GCDS-aligned spacing, and responsive behavior. Row-
action accessible names SHALL include the displayed record identity.

#### Scenario: Application list uses parent identity

- **WHEN** an authorized user opens `/workspaces/$workspaceUuid/applications` in English or French
- **THEN** each row shows exactly one Application Name value from the active interface language in a normal first-column cell
- **AND** the table does not show separate English-name and French-name columns
- **AND** each row action includes that displayed name in its accessible name and opens the selected Application context
- **AND** it may show safe contact/configuration counts or a directly sourced missing-artifact indicator without lifecycle, readiness-score, or `submit-ready` content
- **AND** it does not label a child RP configuration as the parent Application

#### Scenario: Application row offers contextual configuration creation

- **WHEN** an RP Admin or RP User (Edit) views an Application row
- **THEN** that row offers `Add RP configuration` for exactly that Application
- **AND** the nested create route preserves the selected workspace and Application without presenting either chooser again
- **AND** users without RP-configuration write capability do not receive the row action

#### Scenario: RP configuration table uses configuration identity

- **WHEN** an authorized user opens one Application's RP configurations
- **THEN** the table contains `Name`, `Partner environment`, `CanadaLogin environment`, applicable explicit `Registration` or `Production review` context, and `Action` columns
- **AND** each row shows `configurationName` in a normal first-column cell without a heavy divider after it
- **AND** a missing Partner environment uses localized `Not provided`, an absent review uses localized `Not requested`, and no generic five-state status is shown
- **AND** exact displayed identity duplicates show a localized short public reference without making a raw UUID the primary label

#### Scenario: Each RP-configuration row has one clear destination

- **WHEN** an authorized user views one RP configuration in an Application's collection
- **THEN** that row's one Action link is `View RP configuration` and opens the canonical task hub for the selected hierarchy
- **AND** an incomplete draft does not bypass the hub by opening Registration directly
- **AND** an authorized editor can continue the draft through the hub's `Resume setup` action
- **AND** a read-only user reaches the same permitted hub while mutation and credential tasks remain omitted

#### Scenario: Configuration creation is visible before the collection

- **WHEN** an RP Admin or RP User (Edit) opens one Application's RP configurations
- **THEN** a primary `Create RP configuration` action appears before the table
- **AND** when there are no rows, the same action appears inside the empty state
- **AND** the action is not presented only as an uncontained text link after the collection

#### Scenario: Small RP-configuration table omits unnecessary controls

- **WHEN** the RP-configuration collection is small and its default server order supports the task
- **THEN** it uses the shared comparison-table presentation with localized count and contained row destination
- **AND** Name and environment columns plus any explicitly sourced Registration or Production-review column are sortable while Action is not sortable
- **AND** it does not add filtering, pagination, bulk selection, inline editing, or a generic Status control

#### Scenario: Collection tables remain accessible and responsive

- **WHEN** a collection is used at mobile width, 200-percent zoom, with long French labels, keyboard navigation, or assistive technology
- **THEN** table captions, column headers, identity cells, links, and explicit status text remain understandable in source and focus order
- **AND** every row action's accessible name identifies the record it affects
- **AND** long names, URLs, and status text wrap without clipping or inaccessible horizontal scrolling
- **AND** responsive treatment preserves primary identity, environment distinction, applicable registration/review context, and row action

#### Scenario: Summary requests remain server scoped

- **WHEN** an Application or RP-configuration collection requests summaries
- **THEN** the backend applies session, canonical workspace role, selected workspace, parent Application when applicable, and object scope before serialization
- **AND** the browser does not receive a wider dataset and reduce it through client-side filtering
- **AND** summaries exclude provider/client identifiers treated as credentials, secrets, raw provider payloads, contact PII, policy internals, generic audit events, and retired lifecycle/readiness fields

### Requirement: Application-scoped RP configuration registration follows the current OIDC questionnaire

The portal SHALL preserve the current OIDC questionnaire within the new hierarchy.

When an authorized partner editor creates or updates an Application-scoped RP
configuration draft for OpenID Connect, the portal SHALL capture and validate
the current CanadaLogin relying-party registration questionnaire for one named
configuration, Partner environment, and CanadaLogin environment at a time.

Bilingual public Application names SHALL come from the selected Application
parent. Configuration Basics SHALL collect a required locale-neutral
configuration name, one locale-neutral Partner environment, one CanadaLogin
environment, and configuration-specific URLs and endpoints. The server MAY
persist incomplete answers as draft data without treating the affected step or
registration as valid. Completing a step SHALL validate every active field and
constraint owned by that step and all prerequisite steps. Final questionnaire completion
SHALL validate the complete active questionnaire and all cross-step constraints,
including Partner environment, before recording technical completion. It SHALL
NOT create or advance a Production-review request or a shared onboarding state.

#### Field group: RP configuration identity and endpoints

| Form question | Control type | Required | Allowed values or expected input |
|---|---|---|---|
| `Configuration name` | Text input | Yes | Locale-neutral operational label, 1 to 128 characters; record identity remains the stable configuration UUID |
| `Partner environment` | Text input | Yes | Locale-neutral partner-side environment label, 1 to 128 characters, for example `QA 2` or `Partner staging`; not inferred from another field |
| `Please select the CanadaLogin environment you are requesting access to` | Single-select | Yes | `test` (`Test` - integration testing), `staging` (`Staging` - compliance testing), `production` (`Production` - go-live ready) |
| `Application environment URL (English)` | URL input | Yes | Base URL for the English configuration environment |
| `Application environment URL (French)` | URL input | Yes | Base URL for the French configuration environment |
| `Redirect URL(s)` | Repeatable URL list | Yes | One or more redirect URLs |
| `Post Logout Redirect URL(s)` | Repeatable URL list | No | Zero or more post-logout redirect URLs |
| `Please select how you would like to receive a logout request` | Single-select | Yes | `back_channel` (`Back-channel logout (Preferred)`), `front_channel` (`Front-channel logout`); `front_channel` is valid only for RP configurations under `canada.ca` |
| `Logout request URL` | URL input | Yes when a logout mode is selected | Logout endpoint URL for the selected RP configuration |

The group SHALL show the localized parent Application name as read-only context
and SHALL NOT collect English and French Application/service names again. It
SHALL explain that Partner environment identifies the partner-side deployment
while CanadaLogin environment identifies the CanadaLogin target.

#### Field group: Client, scopes, sector identifier, and PKCE

| Form question | Control type | Required | Allowed values or expected input |
|---|---|---|---|
| `Please select one of the following` for client type | Single-select | Yes | `confidential` (`Confidential Client`), `public` (`Public Client`) |
| `My application can support the Authorization Code Flow` | Affirmation checkbox | Yes | Must be recorded as selected; no alternative supported response flow is valid |
| `Please select a method` for client authentication | Single-select | Yes | `private_key_jwt`, `client_secret_basic`, `client_secret_post` |
| `Public key cryptography will be used and the certificate information for your application will be shared via:` | Single-select | Yes when client authentication method is `private_key_jwt` | `jwks_uri`, `offline_exchange`, `not_available` (`I don't have a certificate`) |
| `Please provide the URI` | URL input | Yes when key-sharing method is `jwks_uri` | JWKS URI |
| `Please provide the certificate / JSON Web Key` | Text or document-backed input | Yes when key-sharing method is `offline_exchange` | Public certificate or public JWK payload only; private-key parameters or other secret key material are forbidden |
| `Please select all scopes that you authorized to collect about your user` | Multi-select checkbox group | Yes | `openid`, `profile`, `email`, `phone`, `language`; `openid` is mandatory |
| `Please provide your application's Sector_Identifier` | Text input | Yes | Sector identifier string or base URL |
| `Do you need to share user pairwise identifiers with another application` | Single-select | Yes | `yes`, `no` |
| `To enable the migration solution, provide your Sector Identifier URL` | URL input | No | Migration sector-identifier URL; available only for migration-enabled partners |
| `Does your application support PKCE` | Single-select | Yes | `yes`, `no` |
| `If yes, please select all supported hashing algorithms for PKCE` | Multi-select checkbox group | Yes when PKCE support is `yes` | `S256`, `other` |
| `If Other: Please provide the algorithm` for PKCE | Text input | Yes when PKCE algorithms include `other` | Free-text PKCE algorithm name |

#### Field group: RP message signing and CanadaLogin signature validation

| Form question | Control type | Required | Allowed values or expected input |
|---|---|---|---|
| `Does your application support signing messages it sends to CanadaLogin` | Single-select | Yes | `yes`, `no` |
| `If yes, for which messages do you support message signing` | Multi-select checkbox group | Yes when RP message signing support is `yes` | `request_object` (`Request Object`), `token_endpoint` (`Token Endpoint`) |
| `Please select all supported signature algorithms` for RP message signing | Multi-select checkbox group | Yes when RP message signing support is `yes` | `RS256`, `RS384`, `RS512`, `PS256`, `PS384`, `PS512`, `ES256`, `ES384`, `ES512`, `other` |
| `If Other: Please provide the algorithm` for RP message signing | Text input | Yes when RP signing algorithms include `other` | Free-text signing algorithm name |
| `If no, is message signing in your product roadmap` | Single-select | Yes when RP message signing support is `no` | `yes`, `no` |
| `Can you provide an approximate date to revisit this configuration item` for RP message signing | Date or month input | Yes when RP signing roadmap answer is `yes` | Approximate revisit date |
| `Does your application support verifying signatures sent from CanadaLogin` | Single-select | Yes | `yes`, `no` |
| `If yes, for which items/messages do you support message signing` for CanadaLogin signature validation | Multi-select checkbox group | Yes when CanadaLogin signature validation support is `yes` | `id_token` (`ID Token`), `userinfo` (`Userinfo Endpoint`) |
| `Please select all supported signature algorithms` for CanadaLogin signature validation | Multi-select checkbox group | Yes when CanadaLogin signature validation support is `yes` | `RS256`, `RS384`, `RS512`, `PS256`, `PS384`, `PS512`, `ES256`, `ES384`, `ES512`, `other` |
| `If Other: Please provide the algorithm` for CanadaLogin signature validation | Text input | Yes when signature-validation algorithms include `other` | Free-text validation algorithm name |
| `If no, is signature validation in your product roadmap` | Single-select | Yes when CanadaLogin signature validation support is `no` | `yes`, `no` |
| `Can you provide an approximate date to revisit this configuration item` for CanadaLogin signature validation | Date or month input | Yes when signature-validation roadmap answer is `yes` | Approximate revisit date |

#### Field group: RP message encryption and CanadaLogin message decryption

| Form question | Control type | Required | Allowed values or expected input |
|---|---|---|---|
| `Does your application support the encryption of requests it sends to CanadaLogin` | Single-select | Yes | `yes`, `no` |
| `If yes, for which messages do you support encryption` | Multi-select checkbox group | Yes when RP request encryption support is `yes` | `request_object` (`Request Object`) |
| `Please select all supported key management algorithms supported` for RP request encryption | Multi-select checkbox group | Yes when RP request encryption support is `yes` | `RSA-OAEP-256`, `RSA-OAEP`, `other` |
| `If Other: Please provide the key management algorithm` for RP request encryption | Text input | Yes when RP request encryption support is `yes` and algorithms include `other` | Free-text key-management algorithm name |
| `Please select all encryption algorithms supported` for RP request encryption | Multi-select checkbox group | Yes when RP request encryption support is `yes` | `A128GCM`, `A192GCM`, `A256GCM`, `other` |
| `If Other: Please provide the encryption algorithm` for RP request encryption | Text input | Yes when RP request encryption support is `yes` and algorithms include `other` | Free-text encryption algorithm name |
| `If no, is message encryption in your product roadmap` | Single-select | Yes when RP request encryption support is `no` | `yes`, `no` |
| `Can you provide an approximate date to revisit this configuration item` for RP request encryption | Date or month input | Yes when RP request-encryption roadmap answer is `yes` | Approximate revisit date |
| `Does your application support the decryption of messages sent from CanadaLogin` | Single-select | Yes | `yes`, `no` |
| `If yes, for which items/messages do you support message signing` for CanadaLogin message decryption | Multi-select checkbox group | Yes when CanadaLogin message decryption support is `yes` | `token_endpoint_response` (`Token Endpoint Response`), `id_token` (`ID Token`), `userinfo` (`Userinfo Endpoint`) |
| `Please select all supported key management algorithms supported` for CanadaLogin message decryption | Multi-select checkbox group | Yes when CanadaLogin message decryption support is `yes` | `RSA-OAEP-256`, `RSA-OAEP`, `other` |
| `If Other: Please provide the key management algorithm` for CanadaLogin message decryption | Text input | Yes when CanadaLogin message decryption support is `yes` and algorithms include `other` | Free-text key-management algorithm name |
| `Please select all encryption algorithms supported` for CanadaLogin message decryption | Multi-select checkbox group | Yes when CanadaLogin message decryption support is `yes` | `A128GCM`, `A192GCM`, `A256GCM`, `other` |
| `If Other: Please provide the encryption algorithm` for CanadaLogin message decryption | Text input | Yes when CanadaLogin message decryption support is `yes` and algorithms include `other` | Free-text encryption algorithm name |
| `If no, is message decryption in your product roadmap` | Single-select | Yes when CanadaLogin message decryption support is `no` | `yes`, `no` |
| `Can you provide an approximate date to revisit this configuration item` for CanadaLogin message decryption | Date or month input | Yes when CanadaLogin message-decryption roadmap answer is `yes` | Approximate revisit date |

#### Scenario: Partner editor captures RP configuration identity and endpoints

- **WHEN** an authorized partner editor starts or edits an Application-scoped OIDC RP configuration
- **THEN** the portal captures configuration name, Partner environment, target CanadaLogin environment, English and French configuration-environment URLs, redirect URLs, post-logout redirect URLs, logout delivery mode, and logout request URL
- **AND** it displays but does not recollect the localized public Application name

#### Scenario: Partner editor captures client, scope, sector-identifier, and PKCE configuration

- **WHEN** an authorized partner editor completes the core OIDC configuration questions
- **THEN** the portal captures Authorization Code Flow as the supported response flow, client type, client authentication method, dependent public key-sharing details, requested scopes with required `openid`, sector identifier choice, pairwise-identifier sharing intent, optional migration sector-identifier URL, PKCE support, and supported PKCE algorithms

#### Scenario: Partner editor captures message-protection capabilities

- **WHEN** an authorized partner editor completes the digital-signature, signature-validation, encryption, and decryption sections
- **THEN** the portal captures supported RP message-signing options, CanadaLogin signature-validation options, RP request-encryption options, and CanadaLogin message-decryption options together with the applicable signature, key-management, and encryption algorithms

#### Scenario: RP configuration registration enforces current questionnaire constraints

- **WHEN** an authorized partner editor completes a step or completes RP-configuration registration data
- **THEN** the portal enforces every current questionnaire constraint whose controlling fields are part of that step or an earlier completed step
- **AND** final questionnaire completion requires configuration name, Partner environment, and CanadaLogin environment, requires `openid`, requires PKCE for `public` clients, keeps Authorization Code Flow as the supported response flow, and restricts front-channel logout to `canada.ca` domains

#### Scenario: Incomplete draft persistence does not create a valid submission

- **WHEN** an authorized partner editor uses Save and exit or another safe draft-persistence action before every active field and step is valid
- **THEN** the portal may retain the incomplete answers in the server-backed draft and identifies the affected step as incomplete
- **AND** it does not mark that step complete, expose Review as valid, record questionnaire completion, create or advance Production review, or treat the draft as complete

#### Scenario: Conditional follow-up answers are required for dependent selections

- **WHEN** an authorized partner editor selects `private_key_jwt`, an `Other` algorithm, or an unsupported signing, validation, encryption, or decryption capability answer
- **THEN** the portal requires the matching key-distribution detail, free-text algorithm field, roadmap answer, and approximate revisit date when applicable before the affected step can be marked complete or the questionnaire can be completed
- **AND** incomplete draft persistence may retain the partial answer without presenting it as valid

#### Scenario: Offline key exchange rejects private key material

- **WHEN** a user supplies offline certificate or JWK content for `private_key_jwt`
- **THEN** the portal accepts only the public certificate or public JWK members required for registration
- **AND** it rejects private-key parameters, symmetric key values, credentials, or other secret key material before persistence
- **AND** a future requirement to collect private key material requires a separately approved secret-lifecycle and storage contract

#### Scenario: Missing security capabilities capture roadmap or risk follow-up

- **WHEN** an authorized partner editor answers `No` to message signing, signature validation, message encryption, or message decryption support
- **THEN** the portal captures whether the capability is on the product roadmap and, when applicable, an approximate revisit date
- **AND** selecting roadmap `no` records the negative answer without requiring an extra free-text note

## ADDED Requirements

### Requirement: Production review uses a separate traceable request for one Production configuration

The system SHALL track an explicit Production-review request when CanadaLogin
review occurs outside the portal. When no request exists, no Production-review
status SHALL exist. A created request SHALL start as `pending`, and only a
traceable CL Admin outcome SHALL change it to `approved` or `rejected`. The
portal SHALL NOT use
`launched` or the retired generic onboarding lifecycle as Production-review
status. A Production-review
request SHALL identify the parent Application and one explicitly selected
Production RP configuration. It MAY record a source configuration as optional
lineage when the target was copied, but source lineage SHALL NOT be required
and SHALL NOT be inferred from CanadaLogin environment.

RP Admin and RP User (Edit) SHALL explicitly create a `pending` request when
none exists and MAY update permitted partner-owned reference/context metadata
only while that request remains pending. They SHALL NOT change reviewer or
outcome metadata or reset an `approved` or `rejected` request. CL Admin SHALL
record only the traceable terminal `approved` or `rejected` out-of-band
outcome. Read Only SHALL view permitted status without changing it. A later
review cycle or resubmission SHALL require a separately approved contract and
SHALL NOT overwrite prior outcome history. Copying a configuration SHALL NOT
create, submit, update, approve, or otherwise advance this request.

A retained historical review row whose legacy status cannot be mapped safely
to the canonical vocabulary SHALL NOT be treated as an absent request. The
portal SHALL return a safe reconciliation-required response without
serializing a canonical status, overwriting that row, or creating a replacement
request. Resolving such a row requires a separately approved reconciliation
that preserves its prior history.

#### Scenario: Production review request captures review metadata

- **WHEN** an RP Admin or RP User (Edit) explicitly creates the first review request for one selected Production configuration
- **THEN** the portal stores the parent Application, Production configuration identifier, `pending` status, external review reference, reviewing CL Admin identity or team metadata when assigned, and relevant timestamps
- **AND** it stores a source configuration identifier only when explicit copy lineage exists
- **AND** it does not infer source or target identity from CanadaLogin environment alone

#### Scenario: Partner editor updates only pending request metadata

- **WHEN** an RP Admin or RP User (Edit) updates permitted external reference or partner-owned context for an existing pending request
- **THEN** the request remains `pending` and retains its original creation trace plus the metadata-change actor and time
- **AND** the partner cannot set reviewer identity, outcome, `approved`, or `rejected`

#### Scenario: Terminal Production-review outcome cannot be reset by a partner

- **WHEN** an RP Admin or RP User (Edit) attempts to update or resubmit a request whose CL Admin outcome is `approved` or `rejected`
- **THEN** the portal rejects the mutation without changing the terminal request or its history
- **AND** it does not infer a new review cycle, replace the prior external reference, or return the request to `pending`

#### Scenario: Production review can target an independently created configuration

- **WHEN** an authorized editor requests review for a Production configuration that was created independently without a copy source
- **THEN** the portal accepts the request without inventing source lineage
- **AND** the selected Production configuration remains the authoritative review target

#### Scenario: CL Admin records production review outcome

- **WHEN** a CL Admin records the latest out-of-band Production review result for the chosen target configuration
- **THEN** the portal records `approved` or `rejected` plus reviewer metadata and outcome time against the existing request
- **AND** partner roles cannot perform the review-only transition

#### Scenario: Production-bound record cannot appear approved without review trace

- **WHEN** a Production target lacks the required CL Admin review outcome or external reference
- **THEN** the portal does not present that configuration as approved
- **AND** it identifies the missing review-traceability data to authorized roles without creating or exposing free-form internal review notes

#### Scenario: Copy does not create Production review

- **WHEN** an authorized editor copies any source to a Production draft
- **THEN** no Production-review request or status exists until the editor explicitly starts one for that selected target
- **AND** oversight and partner-facing surfaces do not present the copy as review work

#### Scenario: Ambiguous historical review remains unchanged until reconciliation

- **WHEN** a retained historical review row has no safely mapped canonical Production-review status
- **THEN** the portal does not serialize it as `pending`, `approved`, `rejected`, or absent
- **AND** secret-free RP-configuration list and detail summary projections identify that reconciliation is required instead of displaying `Not requested`
- **AND** the canonical cross-workspace Production-review queue omits that unreconciled historical row until an approved reconciliation establishes a canonical request
- **AND** partner roles, Read Only, and CL Admin cannot update, decide, reset, or replace that row
- **AND** creating a canonical pending request requires a separately approved reconciliation that preserves the historical row and its audit history

### Requirement: Checklist and CATS evidence support an explicit Production review request

The system SHALL make Application-level onboarding checklist progress, CATS
evidence availability, and contextual process links visible on
the focused Application Checklist and evidence page before an authorized
editor requests Production review for one selected Production RP
configuration. A CATS evidence record MAY ultimately be an upload, an external
reference, or both; this change SHALL NOT select the mechanism or implement
evidence persistence. Until a later approved change supplies that mechanism,
the page SHALL show an explicit `not configured / no Partner Portal record`
state rather than fabricating a traceable record. The review
context SHALL identify the selected Application, the Production target, and
its source configuration when lineage exists without inferring identity from
environment.

RP Admin and RP User (Edit) SHALL update permitted partner-owned checklist
inputs. CATS evidence mutation SHALL remain unavailable until its mechanism is
approved separately. Read Only SHALL view the checklist and current evidence-
availability state. CL Admin SHALL
view only the checklist/evidence and Production-review metadata permitted by
its status-visibility purpose and SHALL NOT record free-form internal notes or
internal checklist outcomes. The compact Application hub MAY identify directly
sourced missing-input attention but SHALL NOT calculate an overall score,
completion count, or `submit-ready` state or duplicate full controls.

Copying a configuration, including copying to Production, SHALL NOT imply that
checklist/evidence has been completed or that Production review was requested.

#### Scenario: Authorized partner reviews Production prerequisites

- **WHEN** an authorized partner user opens Application Checklist and evidence
- **THEN** the portal displays directly sourced checklist item statuses, current CATS evidence availability, and relevant process links permitted to that role
- **AND** when no mechanism is configured, it explicitly states that no Partner Portal evidence record exists and does not offer a fabricated upload or reference control
- **AND** it identifies the parent Application

#### Scenario: Production review points to checklist and evidence context

- **WHEN** an authorized partner user or CL Admin opens the explicit Production-review record for a named Production configuration
- **THEN** the portal identifies the parent Application, selected Production target, and explicit source lineage when it exists
- **AND** it presents a non-blocking warning and link to review the focused checklist and current CATS evidence-availability context without duplicating evidence controls or inventing a portal hard gate

#### Scenario: Missing prerequisites are highlighted before production review

- **WHEN** tracked checklist items remain incomplete or the CATS evidence mechanism/record is unavailable
- **THEN** the focused checklist page highlights those directly sourced gaps
- **AND** the Production-review page points to that context before an authorized partner creates or updates a pending explicit request
- **AND** the hard gate remains outside Partner Portal for MVP2

#### Scenario: Production copy remains separate from checklist and review

- **WHEN** an authorized editor creates a Production draft by copying another configuration
- **THEN** Application checklist/evidence and review-request state remain unchanged
- **AND** the copy success page points to the appropriate setup or checklist/evidence task without completing or submitting either one implicitly

### Requirement: Application-scoped RP configuration registration uses a recoverable draft and completion flow

The portal SHALL implement the OIDC questionnaire as a PAT-019 route-per-step
flow beneath one authorized workspace, Application, and server-side RP
configuration with an incomplete editable draft. Intermediate persistence
SHALL update only that draft, distinguish incomplete saved data from a
completed step, and SHALL NOT complete the questionnaire or create or advance
Production review. Only the explicit final questionnaire-completion action
from a completely valid Review state SHALL record immutable technical
completion metadata and end mutation through the draft flow.

The configuration Edit entry SHALL use this registration matrix:

| Registration condition | Edit behavior | Mutation behavior |
|---|---|---|
| Incomplete editable draft | Resume the earliest incomplete permitted step | Permit authorized, conflict-protected draft writes |
| Questionnaire technically complete | Return to the configuration hub with a localized completed explanation | No questionnaire mutation through the draft flow; separately permitted top-level metadata and focused operations remain distinct |
| Missing, unknown, stale, parent-mismatched, or out-of-scope | Fail closed through safe detail, not-found, or denied behavior | No mutation |

For a server-backed draft, the flow SHALL pair its six-step progress indicator
with a separate semantic `Registration steps` navigation. Available completed
steps other than the current step SHALL be links, the current step SHALL be a
non-link identified with `aria-current="step"`, and prerequisite-blocked
future steps SHALL be labelled non-links. Availability SHALL come from server-
validated contiguous progress; the navigation SHALL NOT make the progress
indicator interactive or imply that validation can be skipped.

Choosing a completed step SHALL NOT silently save, validate, complete, or
submit current work. Back, completed-step links, Cancel, parent or breadcrumb
links, header destinations, and language switching SHALL preserve current input
or warn before any loss. The portal SHALL let the user remain on the current
step with that input when the warning is cancelled. Confirmed navigation that
cannot carry the current input SHALL use the last server-saved draft.

#### Scenario: User starts an RP configuration draft

- **WHEN** an authorized editor starts registration from `/workspaces/$workspaceUuid/applications/$applicationUuid/rp-configurations/new`
- **THEN** the portal opens Basics without inventing a configuration UUID or placeholder row
- **AND** the unsaved Basics route does not expose a completed-step link before a server-backed draft exists
- **AND** successful Basics validation creates one server-backed RP configuration in `draft` with the required parent Application, configuration name, Partner environment, and CanadaLogin environment
- **AND** the create request uses one opaque idempotency key for that new-flow attempt
- **AND** the created representation uses draft version `1`, records `basics` as the last completed step, and exposes opaque workspace, Application, and configuration UUIDs
- **AND** the portal opens the nested `registration/endpoints` route and can later resume safely

#### Scenario: Retried draft creation does not create a duplicate

- **WHEN** a valid Basics create request is retried with the same idempotency key, actor, workspace, Application, and normalized Basics payload including Partner environment after an ambiguous result
- **THEN** the backend returns the same RP-configuration draft rather than creating another record
- **AND** it does not increment, reset, or otherwise change draft version or completed-step state merely because the create request was retried
- **AND** reusing that key with different input or scope fails with safe `409` code `registration_draft_creation_conflict`
- **AND** the key contains no personal or questionnaire data and conveys no authorization

#### Scenario: Invalid Basics does not create a placeholder draft

- **WHEN** a user selects Continue on the nested new-configuration Basics route without a valid configuration name, Partner environment, CanadaLogin environment, or Application context
- **THEN** the page remains on Basics and displays an error summary plus field-level errors
- **AND** the backend creates no RP row, UUID, placeholder name, or registration completion
- **AND** the portal warns before navigation can discard unsaved input

#### Scenario: Valid Basics can establish a draft before exit

- **WHEN** a user selects Save and exit on Basics with a valid configuration name, Partner environment, CanadaLogin environment, and Application parent
- **THEN** the backend creates one server-backed RP configuration in `draft` and returns its UUID and draft version
- **AND** the portal returns to the RP-configuration hub or its Application-scoped list with a contained resume path
- **AND** invalid minimum Basics remains on the form without promising durable recovery

#### Scenario: User resumes an existing RP configuration draft

- **WHEN** an authorized user opens the nested Edit route for an RP configuration still in `draft`
- **THEN** the portal resumes at the earliest incomplete permitted canonical step
- **AND** a legacy Edit entry authorizes and redirects to that route rather than rendering the retired long questionnaire

#### Scenario: Draft API exposes typed hierarchy identifiers

- **WHEN** an authorized editor creates, reads, resumes, or updates a registration draft
- **THEN** the API response exposes public workspace, Application, and RP-configuration UUIDs, configuration name, nullable Partner environment for compatibility, CanadaLogin environment, editable-draft or technical-completion metadata, draft version, last completed step, and typed authorized answers
- **AND** it does not expose internal integer IDs, repository models, untyped payloads, policy internals, secret key material, or fields outside authorized scope

#### Scenario: Generic legacy questionnaire detail and update operations are retired

- **WHEN** a caller attempts the deprecated generic `GET` or `PATCH /workspaces/{workspaceUuid}/applications/{rpConfigurationUuid}` operation
- **THEN** the API exposes no such operation and returns the standard safe unavailable response
- **AND** authorized reads use the typed nested summary, configuration, or registration-draft contract appropriate to the task
- **AND** questionnaire writes use the versioned draft contract while the questionnaire remains incomplete
- **AND** the compatibility surface cannot expose internal integer identifiers or untyped questionnaire payloads and cannot mutate a technically completed questionnaire

#### Scenario: Migrated draft resumes from validated contiguous progress

- **WHEN** an existing draft predates registration-flow metadata and has no stored completed-step marker
- **THEN** the backend validates stored answers in recorded step order and derives only the last contiguous completed step
- **AND** non-contiguous later answers do not unlock a future step or Review
- **AND** missing or invalid data resumes at the earliest incomplete permitted step
- **AND** a missing Partner environment keeps Basics incomplete and blocks final questionnaire completion until an authorized editor supplies a valid value

#### Scenario: Completed RP configurations are not editable through the draft flow

- **WHEN** an authorized user requests draft Edit for a configuration whose questionnaire is technically complete
- **THEN** the portal returns to the configuration hub with a localized completed explanation
- **AND** it does not create or mutate a draft, revision, or completed questionnaire answer
- **AND** separately permitted top-level metadata and focused operations remain available through their own contracts
- **AND** an amendment or reopen workflow is not inferred

#### Scenario: Unknown or stale registration state fails closed

- **WHEN** flow entry or a write observes missing, unknown, stale, changed, or parent-mismatched registration metadata
- **THEN** the portal uses the standard safe detail, not-found, conflict, or denied behavior
- **AND** it does not expose or mutate draft data

#### Scenario: Flow presents the recorded step sequence

- **WHEN** an authorized user progresses through a draft
- **THEN** the flow presents Basics, Endpoints, Client and access, Signing, Encryption, and Review as six ordered steps
- **AND** each step has one clear heading and only its questionnaire fields and dependent guidance
- **AND** Confirmation follows successful questionnaire completion outside the six-step progress indicator

#### Scenario: Saved draft exposes completed-step navigation

- **WHEN** an authorized user opens or resumes a server-backed draft
- **THEN** a semantic navigation landmark labelled `Registration steps` presents all six localized step names in their recorded order
- **AND** each available completed step other than the current step is a link to its canonical nested route
- **AND** the current step is a non-link identified with `aria-current="step"`
- **AND** each prerequisite-blocked future step is a labelled non-link rather than an unavailable link or control
- **AND** Review becomes available only while every prerequisite step remains valid
- **AND** the progress indicator itself is not used as the step-navigation control

#### Scenario: Navigation away from a registration step protects unsaved input

- **WHEN** a user chooses Back, a completed-step link, Cancel, a parent/breadcrumb/header destination, or language switching and that navigation would discard input that differs from the last server-saved draft
- **THEN** the portal warns that the navigation will leave those unsaved changes behind
- **AND** cancelling keeps the user on the current step with the input intact
- **AND** confirming opens the selected destination using the last server-saved draft when the input cannot be carried safely
- **AND** route navigation does not implicitly save, validate, mark work complete, unlock Review, complete the questionnaire, or create or advance Production review

#### Scenario: Continue validates and saves only the current draft

- **WHEN** a user selects Continue on a registration step
- **THEN** the portal validates the current step and displays an error summary plus field-level errors when invalid
- **AND** valid input is saved to the server-backed draft before the next step opens
- **AND** future-step fields are not required merely to persist or complete the current step
- **AND** the transition does not complete the questionnaire or create or advance Production review

#### Scenario: Stale draft write fails without overwriting newer work

- **WHEN** a user submits a draft write or final questionnaire completion with an expected version older than the current editable draft
- **THEN** the backend rejects it with `409` code `registration_draft_version_conflict`
- **AND** it does not merge, overwrite, complete, or disclose the newer draft through the stale request
- **AND** the page offers a safe reload path before changes can be retried

#### Scenario: Back and Save and exit preserve recoverable work

- **WHEN** a user selects Back or Save and exit after a draft exists
- **THEN** Back follows the unsaved-input protection before opening the previous permitted step and does not discard server-saved answers
- **AND** Save and exit may persist safe partial current-step answers while marking an invalid step incomplete
- **AND** partial persistence does not make Review valid, complete the questionnaire, or create or advance Production review
- **AND** Save and exit returns to the configuration hub or Application-scoped configuration list with a clear resume path

#### Scenario: Cancel preserves the last server-saved draft

- **WHEN** a user chooses Cancel during registration
- **THEN** the portal warns before discarding unsaved current-step input when it exists
- **AND** it leaves the last successfully saved draft available to resume
- **AND** it returns to the configuration hub or Application-scoped list without deleting or completing the draft

#### Scenario: Earlier changes invalidate dependent answers visibly

- **WHEN** a user changes an earlier answer that makes later conditional answers invalid or inapplicable
- **THEN** the portal clears or invalidates those dependent answers according to questionnaire rules
- **AND** it identifies later steps that require review before questionnaire completion
- **AND** the affected later steps cease to be completed-step links and Review relocks until contiguous progress is valid again

#### Scenario: Direct future-step access recovers safely

- **WHEN** a user requests a step not yet available because earlier steps are incomplete
- **THEN** the portal routes to the earliest incomplete permitted step
- **AND** it explains what must be completed without revealing another workspace, Application, configuration, or draft

#### Scenario: Review summarizes pending questionnaire completion

- **WHEN** all questionnaire steps are valid and the user opens Review
- **THEN** the page groups values pending final questionnaire completion into an itemized summary
- **AND** each group has a localized Change link to the corresponding completed step
- **AND** configuration name, parent Application, Partner environment, CanadaLogin environment, important consequences, and the single final completion action are clear

#### Scenario: Final questionnaire completion occurs once

- **WHEN** an authorized user confirms final questionnaire completion with the expected draft version
- **THEN** the backend rechecks authorization, workspace/Application/configuration ancestry, current editable-draft condition, and the complete active questionnaire
- **AND** it conditionally checks the version and records immutable technical completion metadata exactly once in one transaction without assigning a product onboarding state
- **AND** a retry observing the same configuration already complete returns the authorized completed representation without another transition, side effect, or audit event
- **AND** draft creation, saves, completion, and retry recovery do not call, provision, update, or synchronize IBM Verify or another external system
- **AND** completion does not create or advance a Production-review request
- **AND** success opens the nested Confirmation route

#### Scenario: Confirmation provides useful next steps

- **WHEN** final questionnaire completion succeeds
- **THEN** Confirmation states that registration information is complete and explains the available next tasks without presenting a generic onboarding status
- **AND** it links to the RP-configuration hub, parent Application, and selected workspace as applicable
- **AND** it does not ask the user to complete the same draft again
- **AND** it offers a separate Production-review request only when the selected configuration and current authorization make that task applicable

#### Scenario: Refresh and network failure preserve safe recovery

- **WHEN** the user refreshes a step or a draft save fails because of a network or server error
- **THEN** the portal preserves the last server-saved draft and safely recoverable current input
- **AND** the affected step shows a scoped error and clear retry, save, or return action
- **AND** the error does not imply that unsaved input or final questionnaire completion succeeded

#### Scenario: Session expiry resumes an authorized draft

- **WHEN** the session expires during registration and the user completes applicable admission flows again
- **THEN** the portal resumes the same draft and equivalent step when current workspace/Application/configuration authorization still permits it
- **AND** revoked or changed scope uses safe denied or parent-return behavior instead of rendering draft data

#### Scenario: Language switching keeps equivalent draft context

- **WHEN** a user changes official language from a registration step
- **THEN** the header language control opens the equivalent step for the same authorized draft
- **AND** saved input is retained and unsaved input is preserved or explicitly warned before loss
- **AND** step labels, completed/current/blocked navigation states, fields, hints, errors, Review, Change links, Confirmation, and accessible names have English and French parity
- **AND** configuration name, Partner environment, and other person-entered values are not translated or duplicated

#### Scenario: Sensitive questionnaire content stays out of unsafe client surfaces

- **WHEN** registration answers include a public certificate, public JWK, endpoint, or other potentially sensitive configuration data
- **THEN** the portal does not place those values in URLs, query parameters, analytics, diagnostic logs, or unstructured local storage
- **AND** backend authorization and the existing data-handling boundary apply to every read and write
- **AND** private or symmetric key material is rejected rather than stored

#### Scenario: Draft audit and operational events exclude answer values

- **WHEN** the backend records draft creation, successful save, stale-version conflict, denied write, or final questionnaire completion
- **THEN** the event may identify actor reference, workspace/Application/configuration references, step ID, save mode, safe changed field names, result, timestamp, and correlation identifier
- **AND** it does not contain questionnaire values, contact values, certificate or JWK content, credentials, tokens, or unnecessary personal information

### Requirement: Application task hub exposes approved onboarding work

The portal SHALL provide
`/workspaces/$workspaceUuid/applications/$applicationUuid` as the canonical
Application entry page. It SHALL use the localized Application name as its H1,
show only concise sourced overview and item-level attention context, and link
to focused Details, Checklist and evidence, Contacts, and RP configurations.
For an authorized editor, it SHALL expose a secondary capability-gated
Application management section whose `Delete application` link opens a focused
confirmation page.

The hub SHALL NOT embed full metadata sections, edit forms, contact records,
contact forms, checklist/evidence detail, RP questionnaires, Usage results,
credential values, review notes/outcomes, overall readiness scores/counts, or
destructive controls. Navigation to a focused confirmation page is not itself
a destructive control.

#### Scenario: Authorized user opens an Application hub

- **WHEN** an authorized role opens an in-scope Application
- **THEN** the page shows the localized Application name in one H1
- **AND** it may show a concise overview, safe contact/configuration counts, and directly sourced checklist/evidence attention without a generic lifecycle or readiness score
- **AND** each permitted task appears as one single-destination link or GC Design System card

#### Scenario: Application task availability follows capability

- **WHEN** RP Admin, RP User (Edit), Read Only, or CL Admin opens an Application hub
- **THEN** the hub exposes only task destinations permitted by that role and Application scope
- **AND** hidden task links do not replace direct-route and backend authorization

#### Scenario: Checklist and evidence summary links to focused detail

- **WHEN** the Application has tracked checklist items, required artifacts, CATS evidence availability, or process links
- **THEN** the hub may identify directly sourced missing-input attention without calculating an overall result
- **AND** an authorized user can follow a contained link to the focused Checklist and evidence page
- **AND** the hub does not render the complete checklist, evidence detail, or Production-review controls inline

#### Scenario: Contacts and RP configurations use focused destinations

- **WHEN** an authorized user needs to view or manage contacts or RP configurations
- **THEN** the Application hub links to the corresponding focused collection page
- **AND** it does not place an inline create or edit form on the hub

#### Scenario: Empty Application exposes direct first-configuration creation

- **WHEN** an Application owns no RP configurations and an RP Admin or RP User (Edit) opens its hub
- **THEN** the hub presents a prominent `Create first RP configuration` action
- **AND** the action opens the selected Application's nested create route without asking the user to choose the workspace or Application again
- **AND** a user without RP-configuration write capability does not receive the create action

#### Scenario: Existing configurations are a leading Application task

- **WHEN** an Application owns one or more RP configurations
- **THEN** the hub presents RP configurations as a leading focused destination with its safe record count and explicit registration/Production-review context when applicable
- **AND** it does not embed a second configuration collection or a global context chooser

#### Scenario: Application deletion is secondary and focused

- **WHEN** an authorized editor opens an Application hub
- **THEN** a quiet `Delete application` link appears under a secondary `Application management` heading after the primary tasks
- **AND** the portal does not expose `Application settings` as a user-facing task or card
- **AND** the link opens a dedicated confirmation page that revalidates authorization and retained-child safeguards before any deletion

#### Scenario: Application children preserve parent navigation

- **WHEN** an authorized user opens an Application child page
- **THEN** breadcrumbs identify Home, Partner workspaces, the selected workspace, and the Application parent as applicable
- **AND** a stable translated parent link returns to the Application hub or its owning collection without relying on browser history
- **AND** raw UUIDs are not used as friendly labels

#### Scenario: Application pages remain focused and responsive

- **WHEN** an Application hub or focused child is used with keyboard navigation, assistive technology, a small viewport, long French content, or 200-percent zoom
- **THEN** heading, source, visual, focus, and task order remain logical
- **AND** content reflows without clipping or horizontal task scrolling
- **AND** a details disclosure does not hide a required status, error, form field, instruction, or primary action

## REMOVED Requirements

### Requirement: Production review targets one selected Production configuration

**Reason**: The approved review flow is a separate traceable request with
minimal status and CL Admin outcome authority, not part of a shared onboarding
lifecycle or a generic platform-admin workflow.

**Migration**: Use `Production review uses a separate traceable request for
one Production configuration`. Preserve the selected target, pending-only
partner metadata updates, terminal CL Admin outcome, external reference,
reviewer metadata, timestamps, history, and copy separation.

### Requirement: Checklist readiness supports an explicit Production review request

**Reason**: The current title and scenario language imply an overall readiness
or submission concept. The approved scope retains item-level checklist and
CATS evidence without a synthesized readiness state.

**Migration**: Use `Checklist and CATS evidence support an explicit Production
review request`. Preserve checklist progress, CATS evidence availability,
process links, missing-input visibility, and the separate review-request
action. Show `not configured / no portal record` until the unresolved evidence
mechanism is selected by a later approved change.

### Requirement: Application-scoped RP configuration registration uses a recoverable multi-step flow

**Reason**: The current title and several scenario headings present the
technical questionnaire flow as a generic submission/lifecycle transition.
The shared product lifecycle is being retired.

**Migration**: Use `Application-scoped RP configuration registration uses a
recoverable draft and completion flow`. Preserve all draft recovery,
validation, concurrency, accessibility, bilingual, security, and minimized
event behavior while naming only editable draft and technical questionnaire
completion. Do not infer a completed-answer amendment workflow or Production
review transition.

### Requirement: Application entry page is a compact task hub with focused children

**Reason**: The current requirement makes a calculated readiness state and
internal review page part of the Application hub. Those product concepts are
being retired while the hub and its approved focused children remain.

**Migration**: Use `Application task hub exposes approved onboarding work`.
Keep Details, Checklist and evidence, Contacts, RP configurations, focused
delete, navigation, and responsive behavior. Remove the readiness-score
scenario and Internal review destination.

### Requirement: Onboarding lifecycle state is tracked across core onboarding records

**Reason**: The shared `draft`, `submitted`, `under_review`, `approved`, and
`launched` state machine came from the broader repository-derived PRD. The MVP
explicitly excluded onboarding state machines, and the approved onboarding PRD
defines separate registration drafts and Production-review tracking.

**Migration**: Preserve recoverable RP-registration drafts and technical
questionnaire completion. Track explicit Production review separately as
absent, `pending`, `approved`, or `rejected`. Do not assign the retired state
machine to Workspace, Application, or RP-configuration records.

### Requirement: Application-scoped RP configurations expose usage and audit views

**Reason**: The requirement duplicates approved MAU behavior while adding a
generic partner audit browser that is not required by the approved sources.

**Migration**: Keep `Grant-authorized MAU reporting is available for
accessible RP applications`. Keep the narrow actor/time secret-change CSV and
other required audit capture; remove the generic audit route, arbitrary event
explorer/export, and Read Only audit entitlement.

### Requirement: Applications show advisory readiness indicators

**Reason**: The overall readiness calculation, completed-area count, and
`submit-ready` Application state are not defined by the approved onboarding
PRD. The PRD requires checklist progress, required-artifact visibility, CATS
evidence support, and Production-review context. This change exposes the
unconfigured/no-record state without selecting upload, external-reference, or
combined storage.

**Migration**: Use `Checklist readiness supports an explicit Production
review request` as narrowed by this change. Preserve item-level checklist/CATS
information and process links; remove scoring, counts, parent synthesis, and
the `submit-ready` state.
