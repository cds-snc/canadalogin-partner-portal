# partner-portal-rp-application-experience Specification

## Purpose
TBD - created by archiving change consolidate-workspace-rp-application-experience. Update Purpose after archive.
## Requirements
### Requirement: Canonical workspace-scoped RP application overview is a task hub

The portal SHALL provide
`/workspaces/$workspaceUuid/applications/$rpApplicationUuid` as the canonical
partner entry page for one workspace-owned RP application. The page SHALL use
the localized RP application name as its H1, show concise portal-owned
environment and lifecycle context, and present each permitted primary feature
as one responsive single-destination GC Design System card.

The primary features SHALL be Configuration, Usage, and Manage credentials.
The overview SHALL NOT embed configuration values, provider requests, usage
results, credential values, invitation or audit tables, edit forms, or
destructive controls. It SHALL remain available from portal-owned data when
IBM Verify is unavailable.

#### Scenario: Partner editor opens an RP application

- **WHEN** an RP Admin or RP User (Edit) opens the canonical overview for an in-scope RP application
- **THEN** the page shows the localized RP application name as H1 and concise environment and lifecycle context
- **AND** it shows Configuration, Usage, and Manage credentials as three focused single-destination cards
- **AND** it does not retrieve or render credential values or IBM-backed OAuth setup on the overview

#### Scenario: Read Only opens an RP application

- **WHEN** a Read Only user opens the canonical overview for an in-scope RP application
- **THEN** the page shows the same permitted RP identity and lifecycle context
- **AND** it shows Configuration and Usage cards
- **AND** it omits Manage credentials and every edit, secret, and destructive action

#### Scenario: CL Admin reviews permitted RP metadata

- **WHEN** a CL Admin opens an RP application through a permitted platform oversight path
- **THEN** the page shows only the safe RP metadata and status allowed by the CL Admin capability boundary
- **AND** it omits Configuration, Usage, Manage credentials, and other partner-action cards that CL Admin is not authorized to use
- **AND** it provides a localized no-partner-actions state instead of exposing or implying secret authority

#### Scenario: RP task cards remain accessible and responsive

- **WHEN** the overview is used with keyboard navigation, assistive technology, a small viewport, long French content, or 200-percent zoom
- **THEN** one H1 and logical content order precede uniquely named single-destination cards
- **AND** keyboard, focus, source, and visual order remain aligned
- **AND** cards reflow to one column without clipping or horizontal scrolling

#### Scenario: Overview data is unavailable

- **WHEN** the server-scoped portal RP summary is loading, fails, or becomes unauthorized
- **THEN** the page shows the matching localized loading, scoped retry, or safe unavailable state
- **AND** it does not fall back to IBM Verify, stale cross-workspace data, raw identifiers, or a wider browser-side dataset

### Requirement: RP application Configuration is portal owned and secret free

The portal SHALL provide
`/workspaces/$workspaceUuid/applications/$rpApplicationUuid/configuration` as a
focused view of safely displayable values from the portal-owned registration
record and its draft or submission lifecycle. The page SHALL group applicable
application, endpoint, client, scope, sector, PKCE, signing, validation,
encryption, decryption, roadmap, and lifecycle values under semantic localized
headings. It SHALL NOT require IBM Verify to render.

The Configuration response SHALL exclude client IDs treated as credentials,
client secrets, rotated secrets, credentials, tokens, private JWK members,
symmetric keys, raw provider payloads, internal authorization policy, and
unnecessary personal information. Public certificate or JWK data SHALL follow
the existing public-key validation requirement and MAY be represented as a
safe presence or exchange-status summary instead of raw material.

#### Scenario: Authorized partner role views saved Configuration

- **WHEN** an RP Admin, RP User (Edit), or Read Only user opens Configuration for an in-scope RP application
- **THEN** the page loads the permitted saved questionnaire and lifecycle values from portal persistence
- **AND** it does not call IBM Verify or serialize credential and secret fields

#### Scenario: Partner editor resumes incomplete registration

- **WHEN** an RP Admin or RP User (Edit) views Configuration for an RP application with an incomplete server-backed draft
- **THEN** the page identifies the incomplete lifecycle state and offers the permitted Resume registration destination
- **AND** the focused registration route restores the last server-saved step and answers

#### Scenario: Read Only views Configuration without mutation

- **WHEN** a Read Only user opens Configuration for an in-scope RP application
- **THEN** the page shows only safely displayable saved values and lifecycle context
- **AND** it omits edit, resume, link, unlink, delete, and credential controls

#### Scenario: IBM Verify is unavailable

- **WHEN** IBM Verify is unavailable while an authorized user opens the canonical RP overview or Configuration
- **THEN** portal-owned RP identity, task availability, registration configuration, and lifecycle state remain usable
- **AND** any provider outage is shown only on a focused provider-backed operation that is actually affected

#### Scenario: Conditional or absent configuration fields

- **WHEN** saved registration data is incomplete or a conditional questionnaire field is inactive
- **THEN** Configuration distinguishes a safely missing value from an inactive or not-applicable value using localized content
- **AND** it does not invent provider values, mark an incomplete step complete, or expose stale hidden answers as active configuration

### Requirement: RP application features use canonical capability and resource scope

Every RP overview card, focused child route, and backing operation SHALL apply
the canonical capability matrix to the RP application's owning workspace.
Frontend visibility is discovery only and SHALL NOT replace backend
authorization. The backend SHALL verify the active session, grant,
`workspaceUuid`, and RP application ownership before returning configuration or
usage data and before any credential or provider retrieval.

Configuration SHALL require `rp_configuration_read`, Configuration mutation
SHALL require `rp_configuration_write`, Usage SHALL require
`mau_report_read`, and Manage credentials SHALL require the applicable
`partner_secret_read` and secret-lifecycle capabilities. Equivalent canonical
capability names MAY replace these identifiers only through an aligned role-
model change.

#### Scenario: RP Admin or RP User Edit receives all three features

- **WHEN** the active workspace grant provides configuration read/write, usage read, and partner secret capabilities
- **THEN** the overview exposes all three feature destinations
- **AND** each direct route and API permits only the operations covered by those capabilities

#### Scenario: Read Only is denied secret access

- **WHEN** a Read Only user follows a copied Manage credentials URL or calls its backing endpoint
- **THEN** the request is denied before credential or provider-secret retrieval
- **AND** the response does not disclose whether an out-of-scope secret resource exists

#### Scenario: Route workspace does not own the RP application

- **WHEN** a caller substitutes an authorized or unauthorized workspace UUID that does not own the RP application
- **THEN** the request follows the standard safe not-found behavior
- **AND** no configuration, usage, credential, grant, or provider data is returned

#### Scenario: Grant is revoked after page load

- **WHEN** an active partner grant is revoked after the overview was rendered and the user requests a focused child or backend operation
- **THEN** the next protected request denies access using current server authorization
- **AND** cached page visibility does not preserve the prior authority

### Requirement: Legacy current-user RP routes migrate without duplicate experiences

During a bounded compatibility period, the portal SHALL preserve old
`/your-applications/$rpApplicationUuid` entry paths as authorized redirects to
their canonical workspace-scoped equivalents. Redirect resolution SHALL use
the current user's server-scoped RP projection to derive `workspaceUuid` and
SHALL verify current access before redirecting. It SHALL NOT load IBM Verify,
OAuth setup detail, Usage data, credentials, or secrets merely to resolve a
route.

New navigation, documentation, and active OpenSpec changes SHALL use canonical
workspace-scoped destinations. Compatibility routes SHALL be removed only
after internal callers, saved-link tests, and documented dependencies have
migrated.

#### Scenario: Legacy RP detail link redirects

- **WHEN** an authorized partner user follows `/your-applications/$rpApplicationUuid`
- **THEN** the portal resolves the owning workspace and redirects to `/workspaces/$workspaceUuid/applications/$rpApplicationUuid`
- **AND** it does not render the retired IBM-backed OAuth setup page

#### Scenario: Legacy Usage link redirects

- **WHEN** an authorized partner user follows `/your-applications/$rpApplicationUuid/mau-report`
- **THEN** the portal redirects to `/workspaces/$workspaceUuid/applications/$rpApplicationUuid/usage`
- **AND** the canonical Usage route re-applies the report capability and resource scope

#### Scenario: Legacy credential link redirects

- **WHEN** an RP Admin or RP User (Edit) with secret capability follows `/your-applications/$rpApplicationUuid/manage-credentials`
- **THEN** the portal redirects to `/workspaces/$workspaceUuid/applications/$rpApplicationUuid/manage-credentials`
- **AND** credential retrieval begins only after the canonical route and backend reapply secret authorization

#### Scenario: Legacy link is missing or out of scope

- **WHEN** a user follows a legacy RP route for a missing application or one outside the user's active grants
- **THEN** the portal returns the same safe unavailable result
- **AND** it does not reveal the owning workspace, application existence, provider record, or feature availability

### Requirement: Existing RP application responsibilities move to focused owners

Replacing the long workspace detail and MVP1 OAuth setup page SHALL NOT silently
remove an existing permitted task. Registration view/edit/resume and RP
link/unlink/delete actions SHALL move to Configuration or its focused flows;
Usage and credentials SHALL move to their canonical feature routes; workspace
role access and invitations SHALL remain under Workspace Access; application-
information work SHALL remain under application-information routes; and RP
audit SHALL use a focused audit/report route or a secondary Usage link rather
than a fourth primary card.

#### Scenario: Existing detail actions are inventoried before removal

- **WHEN** implementation replaces an existing RP application detail page
- **THEN** every visible action and authorized deep link is mapped to its focused owner and covered by route/authorization tests
- **AND** an action without a completed safe destination retains a temporary compatibility path instead of disappearing

#### Scenario: Workspace access is not embedded in the RP task hub

- **WHEN** an RP Admin needs to manage workspace roles or invitations
- **THEN** the RP overview links or returns the user to the existing Workspace Access task when context is useful
- **AND** it does not embed invitation or role-management controls as an RP feature card

#### Scenario: Consequential actions remain focused and confirmed

- **WHEN** an authorized partner editor chooses to unlink application information or delete an RP application
- **THEN** the action occurs through the focused Configuration lifecycle flow with the existing authorization, dependency, and confirmation protections
- **AND** it is not executed from a task-hub card or summary link

