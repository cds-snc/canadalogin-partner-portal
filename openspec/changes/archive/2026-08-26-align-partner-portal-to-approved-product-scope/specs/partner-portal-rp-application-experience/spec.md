# Delta for partner portal RP application experience

## MODIFIED Requirements

### Requirement: Canonical Application-scoped RP configuration overview is a task hub

The portal SHALL provide
`/workspaces/$workspaceUuid/applications/$applicationUuid/rp-configurations/$rpConfigurationUuid`
as the canonical partner entry page for one named RP configuration. The page
SHALL use configuration name as its H1, identify the localized parent
Application, separately label Partner environment and CanadaLogin environment,
show concise registration progress and separate Production-review status when
applicable, and present each permitted primary feature as one responsive
single-destination GC Design System card. A retained missing Partner
environment SHALL display localized `Not provided` rather than a blank or
inferred value.

The primary features SHALL be Configuration, Usage, and Manage credentials.
`Configuration` SHALL mean the secret-free view of the saved RP-configuration
record. The registration questionnaire SHALL be treated as the draft-only
create/edit workflow for that record, not as a second peer artifact or task
card. An authorized incomplete draft MAY expose a contextual `Resume setup`
action. A completed or read-only context SHALL use `View configuration` and
SHALL NOT expose questionnaire mutation.

The overview SHALL NOT synthesize a generic onboarding lifecycle or embed
questionnaire values, provider requests, Usage results, credential values,
invitations, audit tables, edit forms, or destructive controls. It SHALL remain
available from portal-owned data when IBM Verify is unavailable.

#### Scenario: Partner editor opens an RP configuration

- **WHEN** an RP Admin or RP User (Edit) opens the canonical overview for an in-scope RP configuration
- **THEN** the page shows configuration name as H1, localized Application context, separately labelled Partner and CanadaLogin environments, registration draft/completion context, and separate Production-review status when a request exists
- **AND** a missing legacy Partner environment is shown as localized `Not provided` with a focused metadata-confirmation path when write capability permits
- **AND** it shows Configuration, Usage, and Manage credentials as focused single-destination cards when each capability is available
- **AND** it does not retrieve or render credential values or IBM-backed OAuth setup on the overview

#### Scenario: Draft editor receives one setup action rather than a peer artifact

- **WHEN** an RP Admin or RP User (Edit) opens an in-scope RP configuration whose registration is an incomplete editable draft
- **THEN** the overview identifies the RP configuration as the persistent record and Configuration as its secret-free saved-answer view
- **AND** it offers one state-appropriate `Resume setup` action for the draft workflow
- **AND** it does not present `Registration questionnaire` as a second peer record or task card beside Configuration
- **AND** following Resume setup opens the earliest incomplete permitted registration step

#### Scenario: Read Only opens an RP configuration

- **WHEN** a Read Only user opens the canonical overview for an in-scope RP configuration
- **THEN** the page shows the same permitted configuration, Application, separately labelled environments, registration completion context, and Production-review status when applicable, using localized `Not provided` for a missing Partner environment
- **AND** it shows Configuration and Usage when permitted
- **AND** it omits Manage credentials and every edit, secret, audit-download, and destructive action

#### Scenario: CL Admin reviews permitted RP configuration metadata

- **WHEN** a CL Admin opens an RP configuration through a permitted oversight path
- **THEN** the page shows only safe Application, configuration, separately labelled environment, checklist/CATS summary, and explicit Production-review metadata allowed by the CL Admin boundary
- **AND** it does not require CL Admin to invent a missing partner-side environment label
- **AND** it omits partner Configuration, Usage, credentials, generic audit, and other partner-action cards not authorized for CL Admin
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
view of safely displayable values from the portal-owned registration record,
its editable-draft or technical-completion metadata, and separate Production-
review status when a request exists. It SHALL group applicable endpoint,
client, scope, sector, PKCE, signing, validation, encryption, decryption, and
roadmap values under semantic localized headings and SHALL NOT require IBM
Verify to render.

The response SHALL exclude client IDs treated as credentials, client secrets,
rotated secrets, credentials, tokens, private JWK members, symmetric keys, raw
provider payloads, authorization policy, generic audit events, and unnecessary
personal information. Public certificate or JWK data SHALL follow existing
public-key validation and MAY be represented as a safe presence or exchange-
status summary.

#### Scenario: Authorized partner role views saved configuration

- **WHEN** an RP Admin, RP User (Edit), or Read Only user opens Configuration for an in-scope hierarchy
- **THEN** the page loads permitted saved questionnaire values, registration draft/completion metadata, and separate Production-review status from portal persistence
- **AND** it shows parent Application, configuration identity, Partner environment or localized `Not provided`, and CanadaLogin environment without calling IBM Verify or serializing credential, secret, or generic audit fields

#### Scenario: Partner editor confirms missing Partner environment as metadata

- **WHEN** an RP Admin or RP User (Edit) follows the nested `/partner-environment/edit` path for an in-scope configuration with no Partner environment
- **THEN** the portal accepts a valid locale-neutral label after full ancestry and capability checks
- **AND** it updates only top-level RP metadata without reopening registration, changing registration completion, creating Production review, or mutating questionnaire answers
- **AND** Read Only and CL Admin receive no partner-metadata mutation control

#### Scenario: Partner editor resumes incomplete registration

- **WHEN** an RP Admin or RP User (Edit) views Configuration for a draft with incomplete registration
- **THEN** the page identifies the incomplete state and offers a contained `Resume setup` destination
- **AND** the nested registration route opens the earliest incomplete permitted step with the last server-saved answers
- **AND** resuming the draft does not create or advance Production review

#### Scenario: Read Only views configuration without mutation

- **WHEN** a Read Only user opens Configuration for an in-scope RP configuration
- **THEN** the page shows only safely displayable saved values, registration context, and permitted Production-review status
- **AND** it omits edit, resume, copy, link, unlink, delete, credential, secret-log, and generic audit controls

#### Scenario: Provider is unavailable

- **WHEN** IBM Verify is unavailable while an authorized user opens the RP-configuration overview or Configuration
- **THEN** portal-owned Application identity, configuration identity, task availability, registration data, technical completion, and Production-review status remain usable
- **AND** a provider outage is shown only on a focused provider-backed operation actually affected

#### Scenario: Conditional or absent configuration fields

- **WHEN** saved registration data is incomplete or a conditional questionnaire field is inactive
- **THEN** Configuration distinguishes a safely missing value from an inactive or not-applicable value using localized content
- **AND** it does not invent provider values, mark an incomplete step complete, create a lifecycle/review status, or expose stale hidden answers as active configuration

### Requirement: Existing RP configuration responsibilities remain on focused owners

Replacing old workspace RP detail and current-user pages SHALL NOT silently
remove a permitted task. Registration view/edit/resume SHALL move to
Configuration or its focused flows; MAU/Usage and credentials SHALL use
canonical child routes; workspace role access and invitations SHALL remain
under Workspace Access; and Application details, contacts, checklist/CATS
evidence, process links, and explicit Production review SHALL remain under the
Application. The retired generic audit browser and internal-review surface
SHALL NOT receive replacement primary cards.

`Copy configuration` SHALL be a secondary lifecycle action for one selected
RP configuration. It SHALL open a focused copy form, SHALL NOT execute from a
task-hub card or table row without review of its explicit target fields, and
SHALL NOT be labelled or presented as Promote, Progress, deployment, approval,
or movement to a derived next environment. Requesting Production review SHALL
remain a separate focused action for the selected Production configuration.

#### Scenario: Existing detail actions are inventoried before removal

- **WHEN** implementation replaces an existing RP detail page
- **THEN** every visible action and authorized deep link is mapped to its retained focused owner or documented as intentionally retired and covered by route/authorization tests
- **AND** a retained action without a completed safe destination keeps a recorded compatibility path instead of disappearing
- **AND** no compatibility route recreates aggregate reporting, generic audit browsing, or internal review notes

#### Scenario: Workspace access is not embedded in the RP configuration task hub

- **WHEN** an RP Admin needs to manage workspace roles or invitations
- **THEN** the hub links or returns to Workspace Access when context is useful
- **AND** it does not embed invitation or role-management controls as an RP-configuration feature

#### Scenario: Consequential actions remain focused and confirmed

- **WHEN** an authorized partner editor chooses to copy or delete an RP configuration
- **THEN** the action opens its focused Configuration flow with current authorization, ancestry, dependency, input-review, and safe failure protections
- **AND** deletion retains explicit confirmation before mutation
- **AND** copy requires explicit target configuration name, Partner environment, and CanadaLogin environment before creating a new draft
- **AND** neither action executes from a task-hub card or summary link

#### Scenario: Copy configuration remains discoverable without becoming a primary task

- **WHEN** an authorized editor opens one selected RP-configuration hub
- **THEN** a quiet Configuration management section provides `Copy configuration` when the source is eligible
- **AND** the action opens the canonical focused `/copy` route
- **AND** Copy does not appear as a peer destination card beside Configuration, Usage, or Manage credentials

#### Scenario: Copy and Production review remain distinct

- **WHEN** an authorized editor copies a configuration to a Production target
- **THEN** the resulting draft is not presented as reviewed, approved, deployed, or launched
- **AND** any later `Request Production review` action identifies that selected target and follows its own checklist/evidence and authorization contract

#### Scenario: Legacy progression link resolves without mutation

- **WHEN** an authorized user follows a saved progression browser link for one in-scope configuration during the compatibility period
- **THEN** the portal redirects to the equivalent focused Copy configuration form
- **AND** the redirect creates no target or review request
- **AND** a missing, revoked, parent-mismatched, or out-of-scope source uses the same safe unavailable result

#### Scenario: Partner-visible configuration cannot be orphaned

- **WHEN** a caller attempts to unlink an RP configuration from its Application without an atomic authorized reparent, archive, or delete operation defined by a future contract
- **THEN** the portal rejects the operation and preserves the current hierarchy
- **AND** no partner-visible configuration is left without its workspace-owned Application parent

