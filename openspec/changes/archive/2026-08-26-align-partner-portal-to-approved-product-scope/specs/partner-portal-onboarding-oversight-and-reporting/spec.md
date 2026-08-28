# Delta for partner portal onboarding oversight and reporting

## ADDED Requirements

### Requirement: Reports discovers authorized RP-configuration MAU usage

The Reports task hub and its focused chooser SHALL link only to canonical
nested RP-configuration MAU/usage routes. Dynamic chooser results SHALL
contain only configurations available through the current canonical
authorization context and server-scoped resource contracts.

Each destination SHALL identify the owning workspace, localized Application,
configuration name, Partner environment, and explicitly labelled CanadaLogin
environment. A retained missing Partner environment SHALL use localized `Not
provided` rather than an inferred value. The chooser SHALL NOT expose report
results, selected-workspace aggregates, or cross-workspace analytics.

#### Scenario: Partner reader chooses an application usage report

- **WHEN** a user with `mau_report_read` for one or more accessible RP configurations opens `/reports/applications`
- **THEN** the chooser lists only accessible in-scope configurations grouped by owning Application and labelled with meaningful Application, configuration, Partner-environment, and CanadaLogin-environment context
- **AND** each link opens `/workspaces/$workspaceUuid/applications/$applicationUuid/rp-configurations/$rpConfigurationUuid/usage` for exactly one RP configuration
- **AND** the chooser does not expose an out-of-scope Application, RP configuration, workspace, report, or identifier

#### Scenario: Existing contextual usage entry points remain available

- **WHEN** an authorized user works from a selected workspace, Application, or accessible RP configuration
- **THEN** a contextual MAU/usage link remains available through its canonical nested destination or an authorized compatibility redirect
- **AND** the Reports hub provides an additional discovery path rather than replacing the canonical parent task area
- **AND** no contextual link opens a selected-workspace aggregate report

#### Scenario: Usage chooser handles asynchronous and empty states safely

- **WHEN** an authorized RP-configuration report-scope list is loading, empty, partially unavailable, failed, stale, or no longer authorized
- **THEN** the chooser shows a localized scoped status and safe retry or return action
- **AND** an authorized user with no accessible configuration receives an honest empty state
- **AND** the browser does not receive a wider report-scope dataset and reduce it only through client-side filtering

#### Scenario: Report discovery does not expose report data

- **WHEN** an authorized user opens `/reports` or `/reports/applications`
- **THEN** the page exposes only the minimum safe Application, RP-configuration, environment, and authorized scope labels needed for navigation
- **AND** it does not load or render report result rows, exports, secret material, raw authorization context, internal integer identifiers, or provider payloads

#### Scenario: Same-environment configurations remain distinct in Reports

- **WHEN** one Application has several accessible configurations targeting the same CanadaLogin environment
- **THEN** the chooser presents each configuration separately using its configuration name, Partner environment or localized `Not provided`, and a localized short public reference when displayed labels are otherwise identical
- **AND** selecting one loads MAU/usage for only that configuration

#### Scenario: Reports compatibility query remains server scoped

- **WHEN** the chooser uses an accessible RP summary compatibility endpoint
- **THEN** the backend applies current session, workspace grant, MAU capability, and resource scope before serialization
- **AND** the response contains only the secret-free identity and destination fields needed for report selection
- **AND** the browser does not receive a wider list and filter it into scope

#### Scenario: Old usage destination redirects during migration

- **WHEN** an authorized Reports caller holds the old `/workspaces/$workspaceUuid/applications/$rpApplicationUuid/usage` destination
- **THEN** the compatibility resolver derives the parent Application and redirects to the canonical nested RP-configuration Usage route
- **AND** the canonical route re-applies MAU-report authorization before loading results

### Requirement: CL Admin oversight remains a cross-workspace operational anchor

The system SHALL retain `/onboarding-oversight` as an authenticated CL Admin
dashboard anchor. It SHALL provide authorized paths to Partner workspaces,
Users and access, Invitations, and explicit Production-review work without
embedding those modules' full workflows.

The dashboard MAY summarize or filter explicit Production-review requests by
their selected workspace, Department context, and `pending`, `approved`, or
`rejected` review status. It SHALL NOT create a generic onboarding backlog,
reuse the retired five-state lifecycle, expose internal notes, or calculate
onboarding, invitation, or secret-hygiene analytics.

#### Scenario: CL Admin opens the oversight dashboard anchor

- **WHEN** a CL Admin opens `/onboarding-oversight`
- **THEN** the page uses one localized H1 and presents authorized destinations for Partner workspaces, Users and access, Invitations, and explicit Production-review work
- **AND** the page remains a useful stable anchor even when one or more destinations have no current records
- **AND** it does not embed full access, invitation, or mutation workflows

#### Scenario: CL Admin reviews explicit Production-review requests

- **WHEN** a CL Admin opens the Production-review work destination from oversight
- **THEN** the portal lists only explicit requests with selected Production configuration, owning Application/workspace context, `pending`, `approved`, or `rejected` status, external review reference, reviewer metadata, and relevant timestamps
- **AND** source configuration appears only when explicit copy lineage exists
- **AND** a copied Production draft without a review request does not appear as review work

#### Scenario: Production-review work can be empty

- **WHEN** no explicit Production-review request is available to the CL Admin
- **THEN** the dashboard and focused review destination show a localized honest empty state
- **AND** they do not generate placeholder metrics, lifecycle records, review notes, or recommendations
- **AND** retained Workspaces, Users and access, and Invitations destinations remain available

#### Scenario: Oversight omits RP secret and internal-note data

- **WHEN** a CL Admin inspects dashboard or Production-review metadata
- **THEN** the portal exposes only permitted workspace, Application, configuration, checklist/evidence summary, and review-traceability fields
- **AND** it does not reveal current or rotated RP secret values, copied questionnaire answers, private key material, or retired internal review notes/outcomes

#### Scenario: Partner role cannot enter CL Admin oversight

- **WHEN** an RP Admin, RP User (Edit), or Read Only user requests the cross-workspace dashboard or focused Production-review outcome route
- **THEN** the portal denies the request through the safe authorization contract
- **AND** workspace-scoped MAU, checklist, invitation, or review-status visibility does not grant cross-workspace authority

## REMOVED Requirements

### Requirement: Operational reporting summarizes onboarding and invitation health

**Reason**: Onboarding throughput, invitation conversion, secret-rotation
hygiene, and aggregate exports are not required by the approved MVP or
onboarding PRD.

**Migration**: Remove the metrics, filters, APIs, exports, authorization keys,
and cards. Retain only scoped RP-configuration MAU/usage under `Reports
discovers authorized RP-configuration MAU usage`.

### Requirement: CL Admin captures onboarding notes and checklist outcomes

**Reason**: Free-form internal review notes and internal checklist outcomes
came from the broader repository-derived product vision. The approved
onboarding PRD requires checklist progress, CATS evidence, and Production-
review traceability, not a portal-owned internal review notebook.

**Migration**: Preserve partner-owned checklist/CATS/evidence fields and
minimal Production-review metadata. Stop exposing or writing internal notes
and outcomes; preserve historical data until retention/disposition is decided.

### Requirement: Partner aggregate reporting has a selected-workspace route

**Reason**: Selected-workspace aggregate onboarding reporting is outside the
approved launch scope.

**Migration**: Retire `/workspaces/$workspaceUuid/reports` and its aggregate
API/export when no retained semantic destination applies. Direct users to
authorized RP-configuration MAU/usage discovery instead.

### Requirement: Report discovery preserves canonical report scope

**Reason**: The requirement combines approved MAU discovery with unapproved
cross-workspace and selected-workspace aggregate report families.

**Migration**: Use `Reports discovers authorized RP-configuration MAU usage`.
Keep the nested usage routes, safe chooser, server scoping, and compatibility
redirect while removing aggregate-report choosers and destinations.

### Requirement: CL Admin has a cross-workspace onboarding and Production-review view

**Reason**: The requirement mixes valid explicit Production-review tracking
with a generic five-state onboarding queue and internal review concepts that
are not in the approved product sources.

**Migration**: Use `CL Admin oversight remains a cross-workspace operational
anchor`. Keep the dashboard shell, Access/Invitation destinations, secret
boundary, and minimal explicit Production-review work; remove generic backlog
states, internal notes, and aggregate analytics.
