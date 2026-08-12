# Delta for partner-portal-access-and-dashboard

## MODIFIED Requirements

### Requirement: Current-user RP applications page provides a partner operational overview

The portal SHALL provide `/your-applications` as a dedicated cross-workspace
operational overview of RP applications and workspace context available to the
signed-in user through active canonical grants. The overview SHALL project the
same workspace-owned RP application summaries used by selected-workspace
application lists. It SHALL support status scanning and resuming work without
acting as the generic portal Home, creating a second RP ownership model, or
embedding unrelated workflows.

#### Scenario: User opens the current-user RP applications overview

- **WHEN** an authorized partner user opens `/your-applications`
- **THEN** the page lists RP applications available in current-user scope
- **AND** each application links to `/workspaces/$workspaceUuid/applications/$rpApplicationUuid` using the owning workspace returned by the server-scoped summary
- **AND** available lifecycle or status context and a relevant resume-task link are shown when returned by the canonical data source

#### Scenario: Invitation-backed applications appear after access is canonical

- **WHEN** invitation-backed RP applications are included in the user's canonical accessible-application scope
- **THEN** `/your-applications` presents those applications in the same overview as other accessible applications
- **AND** it does not imply broader workspace access than the authorization context provides

#### Scenario: Overview links accessible workspaces using meaningful labels

- **WHEN** one or more workspaces are available in current-user scope
- **THEN** the overview presents compact workspace navigation using localized workspace names rather than raw UUIDs as the primary labels
- **AND** each link routes through the Workspaces task area

#### Scenario: User has no available RP applications

- **WHEN** an authorized partner user opens `/your-applications` and no RP applications are available in current-user scope
- **THEN** the page displays an actionable application empty state instead of application cards, tables, or misleading status

#### Scenario: User has no accessible workspaces

- **WHEN** an authorized user opens `/your-applications` and no workspaces are available in current-user scope
- **THEN** the page displays a workspace empty state instead of administrative controls or internal identifiers

#### Scenario: Partner overview keeps full workflows on focused routes

- **WHEN** an authorized user opens `/your-applications`
- **THEN** the overview uses canonical workspace-scoped links to focused routes for configuration, credentials, invitations, reports, create or edit work, and other consequential actions
- **AND** it does not embed those forms, cross-workspace oversight, or platform administration workflows

#### Scenario: Partner overview handles asynchronous states

- **WHEN** application or workspace summary data is loading, partially unavailable, fails, or becomes unauthorized
- **THEN** the affected section shows a scoped loading, partial, error, or unauthorized state with a safe retry or return action
- **AND** an unavailable section does not replace valid content from another section with misleading data

#### Scenario: Partner overview data remains server scoped

- **WHEN** `/your-applications` requests application or workspace summaries
- **THEN** each backend request applies the current session, canonical authorization, and resource scope before returning data
- **AND** the browser does not receive a wider dataset and reduce it through client-side filtering
- **AND** safe failures do not disclose secret fields, out-of-scope identifiers, policy internals, or raw authorization payloads

#### Scenario: Current-user and selected-workspace summaries remain consistent

- **WHEN** one authorized RP application appears in both `/your-applications` and its selected-workspace application list
- **THEN** both surfaces derive localized name, environment, onboarding state, optional promotion state, and permitted resume task from the same summary semantics
- **AND** they link to the same canonical workspace-scoped RP application overview

#### Scenario: Revoked workspace access removes projected applications

- **WHEN** a partner user's active grant for one workspace is revoked
- **THEN** `/your-applications` no longer returns or links RP applications owned by that workspace on the next protected request
- **AND** independently authorized workspace and RP application summaries remain available
