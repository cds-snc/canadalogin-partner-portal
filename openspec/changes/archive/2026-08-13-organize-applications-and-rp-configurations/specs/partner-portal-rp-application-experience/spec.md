# Delta for partner-portal-rp-application-experience

## ADDED Requirements

### Requirement: Canonical Application-scoped RP configuration overview is a task hub

The portal SHALL provide
`/workspaces/$workspaceUuid/applications/$applicationUuid/rp-configurations/$rpConfigurationUuid`
as the canonical partner entry page for one named RP configuration. The page
SHALL use configuration name as its H1, identify the localized parent
Application, separately label Partner environment and CanadaLogin environment,
show concise portal-owned lifecycle context, and present each permitted
primary feature as one responsive single-destination GC Design System card. A
retained missing Partner environment SHALL display localized `Not provided`
rather than a blank or inferred value.

The primary features SHALL be Configuration, Usage, and Manage credentials.
`Configuration` SHALL mean the secret-free view of the saved RP-configuration
record. The registration questionnaire SHALL be treated as the draft-only
create/edit workflow for that record, not as a second peer artifact or task
card. An authorized incomplete draft MAY expose a contextual `Resume setup`
action, while a non-editable or read-only context SHALL use `View
configuration` and SHALL NOT expose questionnaire mutation.

The overview SHALL NOT embed questionnaire values, provider requests, Usage
results, credential values, invitations, audit tables, edit forms, or
destructive controls. It SHALL remain available from portal-owned data when
IBM Verify is unavailable.

#### Scenario: Partner editor opens an RP configuration

- **WHEN** an RP Admin or RP User (Edit) opens the canonical overview for an in-scope RP configuration
- **THEN** the page shows configuration name as H1, localized Application context, separately labelled `Partner environment` and `CanadaLogin environment`, and concise lifecycle context
- **AND** a missing legacy Partner environment is shown as localized `Not provided` with a focused metadata-confirmation path when write capability permits
- **AND** it shows Configuration, Usage, and Manage credentials as focused single-destination cards when each capability is available
- **AND** it does not retrieve or render credential values or IBM-backed OAuth setup on the overview

#### Scenario: Draft editor receives one setup action rather than a peer artifact

- **WHEN** an RP Admin or RP User (Edit) opens an in-scope RP configuration whose registration is an incomplete editable draft
- **THEN** the overview identifies the RP configuration as the persistent record and `Configuration` as its secret-free saved-answer view
- **AND** it offers one state-appropriate `Resume setup` action for the draft workflow
- **AND** it does not present `Registration questionnaire` as a second peer record or task card beside Configuration
- **AND** following Resume setup opens the earliest incomplete permitted registration step

#### Scenario: Read Only opens an RP configuration

- **WHEN** a Read Only user opens the canonical overview for an in-scope RP configuration
- **THEN** the page shows the same permitted configuration, Application, separately labelled environment, and lifecycle context, using localized `Not provided` for a missing legacy Partner environment
- **AND** it shows Configuration and Usage when permitted
- **AND** it omits Manage credentials and every edit, secret, and destructive action

#### Scenario: CL Admin reviews permitted RP configuration metadata

- **WHEN** a CL Admin opens an RP configuration through a permitted oversight path
- **THEN** the page shows only safe Application, configuration, separately labelled environment, and status metadata allowed by the CL Admin boundary
- **AND** it does not require CL Admin to invent a missing partner-side environment label
- **AND** it omits partner Configuration, Usage, credentials, and other partner-action cards not authorized for CL Admin
- **AND** it provides a localized no-partner-actions state instead of implying secret authority

#### Scenario: RP configuration task cards remain accessible and responsive

- **WHEN** the overview is used with keyboard navigation, assistive technology, a small viewport, long French content, or 200-percent zoom
- **THEN** one H1 and logical content order precede uniquely named single-destination cards
- **AND** keyboard, focus, source, and visual order remain aligned
- **AND** cards reflow to one column without clipping or horizontal scrolling

#### Scenario: RP configuration overview data is unavailable

- **WHEN** the server-scoped portal summary is loading, fails, has mismatched ancestry, or becomes unauthorized
- **THEN** the page shows the matching localized loading, scoped retry, or safe unavailable state
- **AND** it does not fall back to IBM Verify, stale cross-workspace data, raw identifiers, or a wider browser-side dataset

### Requirement: RP configuration detail is portal owned and secret free

The portal SHALL provide the nested `configuration` child route as a focused
view of safely displayable values from the portal-owned registration record and
its draft or submission lifecycle. It SHALL group applicable endpoint, client,
scope, sector, PKCE, signing, validation, encryption, decryption, roadmap, and
lifecycle values under semantic localized headings and SHALL NOT require IBM
Verify to render.

The response SHALL exclude client IDs treated as credentials, client secrets,
rotated secrets, credentials, tokens, private JWK members, symmetric keys, raw
provider payloads, authorization policy, and unnecessary personal information.
Public certificate or JWK data SHALL follow existing public-key validation and
MAY be represented as a safe presence or exchange-status summary.

#### Scenario: Authorized partner role views saved configuration

- **WHEN** an RP Admin, RP User (Edit), or Read Only user opens Configuration for an in-scope hierarchy
- **THEN** the page loads permitted saved questionnaire and lifecycle values from portal persistence
- **AND** it shows parent Application, configuration identity, Partner environment or localized `Not provided`, and CanadaLogin environment without calling IBM Verify or serializing credential and secret fields

#### Scenario: Partner editor confirms missing Partner environment as metadata

- **WHEN** an RP Admin or RP User (Edit) follows the nested `/partner-environment/edit` path for an in-scope configuration with no Partner environment
- **THEN** the portal accepts a valid locale-neutral label after full ancestry and capability checks
- **AND** it updates only top-level RP metadata without reopening registration, changing lifecycle, or mutating questionnaire answers
- **AND** Read Only and CL Admin receive no partner-metadata mutation control

#### Scenario: Partner editor resumes incomplete registration

- **WHEN** an RP Admin or RP User (Edit) views Configuration for a draft with incomplete registration
- **THEN** the page identifies the incomplete state and offers a contained `Resume setup` destination
- **AND** the nested registration route opens the earliest incomplete permitted step with the last server-saved answers

#### Scenario: Read Only views configuration without mutation

- **WHEN** a Read Only user opens Configuration for an in-scope RP configuration
- **THEN** the page shows only safely displayable saved values and lifecycle context
- **AND** it omits edit, resume, clone, link, unlink, delete, and credential controls

#### Scenario: Provider is unavailable

- **WHEN** IBM Verify is unavailable while an authorized user opens the RP-configuration overview or Configuration
- **THEN** portal-owned Application identity, configuration identity, task availability, registration data, and lifecycle state remain usable
- **AND** a provider outage is shown only on a focused provider-backed operation actually affected

#### Scenario: Conditional or absent configuration fields

- **WHEN** saved registration data is incomplete or a conditional questionnaire field is inactive
- **THEN** Configuration distinguishes a safely missing value from an inactive or not-applicable value using localized content
- **AND** it does not invent provider values, mark an incomplete step complete, or expose stale hidden answers as active configuration

### Requirement: RP configuration features use workspace, Application, and configuration scope

The portal SHALL authorize every RP-configuration feature within its complete ancestry.

Every RP-configuration overview card, focused child route, and backing
operation SHALL apply the canonical capability matrix to the owning workspace
and SHALL validate Application and RP-configuration ancestry. Frontend
visibility is discovery only and SHALL NOT replace backend authorization.

Configuration SHALL require `rp_configuration_read`; mutation SHALL require
`rp_configuration_write`; Usage SHALL require `mau_report_read`; and Manage
credentials SHALL require the applicable `partner_secret_read` and secret-
lifecycle capabilities. Equivalent capability names MAY replace these only
through an aligned role-model change.

#### Scenario: RP Admin or RP User Edit receives all permitted features

- **WHEN** the active workspace grant provides configuration read/write, Usage read, and partner-secret capabilities for the hierarchy
- **THEN** the overview exposes all three feature destinations
- **AND** each direct route and API permits only operations covered by those capabilities

#### Scenario: Read Only is denied secret access

- **WHEN** a Read Only user follows a copied Manage credentials URL or calls its endpoint
- **THEN** the request is denied before credential or provider-secret retrieval
- **AND** the response does not disclose whether an out-of-scope secret resource exists

#### Scenario: Route hierarchy does not own the RP configuration

- **WHEN** a caller substitutes a workspace or Application UUID that does not own the RP configuration
- **THEN** the request follows standard safe not-found behavior
- **AND** no configuration, Usage, credential, grant, parent, or provider data is returned

#### Scenario: Grant is revoked after page load

- **WHEN** an active partner grant is revoked after the overview was rendered and the user requests a child or backend operation
- **THEN** the next protected request denies access using current server authorization
- **AND** cached page visibility does not preserve prior authority

### Requirement: Legacy RP application deep routes redirect to canonical RP configurations

During a bounded compatibility period, the portal SHALL preserve recorded
legacy RP detail and child paths as authorized redirects to their nested
Application-scoped RP-configuration equivalents. Redirect resolution SHALL use
current server-owned scope to derive workspace and Application identity and
SHALL verify current access before redirecting.

It SHALL NOT load IBM Verify, questionnaire detail, Usage results,
credentials, or secrets merely to resolve a route. New navigation,
documentation, and active changes SHALL generate only canonical destinations.
Compatibility routes SHALL be removed only after internal callers, saved-link
tests, and the recorded support period have migrated.

#### Scenario: Legacy current-user detail link redirects

- **WHEN** an authorized partner user follows `/your-applications/$rpApplicationUuid`
- **THEN** the portal resolves its current workspace and Application and redirects to the canonical nested RP-configuration hub
- **AND** it does not render the retired current-user or IBM-backed OAuth page

#### Scenario: Legacy workspace-scoped detail link resolves during route cutover

- **WHEN** an authorized user follows `/workspaces/$workspaceUuid/applications/$rpApplicationUuid` for a UUID that is not an Application but is an in-scope legacy RP record
- **THEN** the compatibility resolver derives its Application and replace-redirects to the nested RP-configuration hub
- **AND** it performs no provider, Usage, credential, or secret retrieval

#### Scenario: Canonical Application UUID is not treated as a legacy configuration

- **WHEN** `/workspaces/$workspaceUuid/applications/$resourceUuid` identifies an in-scope Application
- **THEN** the route opens the canonical Application hub
- **AND** it does not perform legacy RP redirect resolution or choose a child configuration

#### Scenario: Legacy Usage link redirects

- **WHEN** an authorized partner user follows a saved `/your-applications/$rpApplicationUuid/mau-report` or old workspace Usage path
- **THEN** the portal redirects to nested RP-configuration Usage
- **AND** the canonical route re-applies report capability and full resource scope

#### Scenario: Legacy credential link redirects

- **WHEN** an authorized RP Admin or RP User (Edit) follows a saved current-user or old workspace credential path
- **THEN** the portal redirects to nested Manage credentials
- **AND** credential retrieval begins only after canonical route and backend authorization are reapplied

#### Scenario: Legacy department-setup link redirects without a second assignment

- **WHEN** an authorized partner editor follows `/your-applications/$rpApplicationUuid/department-setup` after workspace Department inheritance is active
- **THEN** the portal verifies current workspace/Application/configuration scope and redirects to the configuration hub or intended nested destination
- **AND** it does not show or submit a per-RP Department assignment form

#### Scenario: Legacy link is missing or out of scope

- **WHEN** a user follows a legacy RP path for a missing, revoked, parent-mismatched, or out-of-scope resource
- **THEN** the portal returns the same safe unavailable result
- **AND** it does not reveal the owning workspace, Application, configuration existence, provider record, or feature availability

#### Scenario: New navigation does not generate legacy deep links

- **WHEN** Home, Workspaces, Applications, Reports, breadcrumbs, parent links, summaries, confirmation, errors, or documentation generate an RP-configuration destination
- **THEN** they use the canonical nested route
- **AND** compatibility paths are exercised only by direct saved-link tests or recorded adapters

### Requirement: Existing RP configuration responsibilities remain on focused owners

Replacing old workspace RP detail and current-user pages SHALL NOT silently
remove a permitted task. Registration view/edit/resume and lifecycle actions
SHALL move to Configuration or its focused flows; Usage and credentials SHALL
use canonical child routes; workspace role access and invitations SHALL remain
under Workspace Access; Application details, contacts, readiness, and review
SHALL remain under the Application; and bounded RP audit SHALL use a focused
audit/report route rather than another primary card.

#### Scenario: Existing detail actions are inventoried before removal

- **WHEN** implementation replaces an existing RP detail page
- **THEN** every visible action and authorized deep link is mapped to its focused owner and covered by route/authorization tests
- **AND** an action without a completed safe destination retains a recorded compatibility path instead of disappearing

#### Scenario: Workspace access is not embedded in the RP configuration task hub

- **WHEN** an RP Admin needs to manage workspace roles or invitations
- **THEN** the hub links or returns to Workspace Access when context is useful
- **AND** it does not embed invitation or role-management controls as an RP-configuration feature

#### Scenario: Consequential actions remain focused and confirmed

- **WHEN** an authorized partner editor chooses to clone or delete an RP configuration
- **THEN** the action occurs through the focused Configuration lifecycle flow with authorization, dependency, and confirmation protections
- **AND** it is not executed from a task-hub card or summary link

#### Scenario: Partner-visible configuration cannot be orphaned

- **WHEN** a caller attempts to unlink an RP configuration from its Application without an atomic authorized reparent, archive, or delete operation defined by a future contract
- **THEN** the portal rejects the operation and preserves the current hierarchy
- **AND** no partner-visible configuration is left without its workspace-owned Application parent

## REMOVED Requirements

### Requirement: Canonical workspace-scoped RP application overview is a task hub

**Reason**: The overview is no longer a workspace-level peer Application and
its localized public service name is no longer its primary identity.

**Migration**: Use `Canonical Application-scoped RP configuration overview is
a task hub`, nested below the parent Application and headed by configuration
name.

### Requirement: RP application Configuration is portal owned and secret free

**Reason**: The secret-free behavior remains, but the feature belongs to a
named RP configuration within an Application hierarchy.

**Migration**: Use `RP configuration detail is portal owned and secret free`
and preserve all provider-isolation, field-grouping, conditional-value, and
secret-exclusion behavior.

### Requirement: RP application features use canonical capability and resource scope

**Reason**: Workspace and RP identifiers alone no longer prove the complete
resource relationship.

**Migration**: Use `RP configuration features use workspace, Application, and
configuration scope`, validating all ancestors without changing the canonical
role matrix.

### Requirement: Legacy current-user RP routes migrate without duplicate experiences

**Reason**: Compatibility now includes retirement of the root overview, the
workspace path collision, nested Application ancestry, and per-RP Department-
setup retirement.

**Migration**: Use `Legacy RP application deep routes redirect to canonical RP
configurations` and keep all resolution server-authorized and provider/secret
free.

### Requirement: Existing RP application responsibilities move to focused owners

**Reason**: The responsibilities remain valid but the product concept and
focused owners are Application and RP configuration, not a peer RP
Application.

**Migration**: Use `Existing RP configuration responsibilities remain on
focused owners` and complete the existing-action inventory before any old page
is removed.
