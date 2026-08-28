# Delta for partner-portal-onboarding-oversight-and-reporting

## MODIFIED Requirements

### Requirement: Report discovery preserves canonical report scope

The Reports task hub and its focused chooser pages SHALL link to the existing
cross-workspace and selected-workspace report routes and to the canonical
nested RP-configuration Usage routes without combining their data or weakening
their authorization boundaries. Dynamic chooser results SHALL contain only
report scopes available through the current canonical authorization context
and server-scoped resource contracts. An RP Usage destination SHALL identify
the owning workspace, localized Application, configuration name, Partner
environment, and explicitly labelled CanadaLogin environment; it SHALL NOT
imply that a configuration is a standalone Application. A retained missing
Partner environment SHALL use localized `Not provided` rather than an inferred
value.

#### Scenario: CL Admin discovers cross-workspace reporting

- **WHEN** a user with `onboarding_oversight_read` opens `/reports`
- **THEN** Platform reporting includes an Onboarding and invitation reports card
- **AND** the card links to the existing `/onboarding-oversight/reports` route
- **AND** the report retains its current cross-workspace authorization, filters, result, export, breadcrumb, and return-path behavior

#### Scenario: Partner reader chooses a workspace report

- **WHEN** a user with `aggregate_report_read` in one or more active workspace scopes chooses Workspace reports
- **THEN** `/reports/workspaces` lists only those authorized workspaces using meaningful workspace names
- **AND** each chooser link opens the existing `/workspaces/$workspaceUuid/reports` route for exactly one selected workspace
- **AND** the chooser and report do not union partner workspaces or expose cross-workspace internal rows, filters, or exports

#### Scenario: Partner reader chooses an application usage report

- **WHEN** a user with `mau_report_read` for one or more accessible RP configurations chooses Application usage reports
- **THEN** `/reports/applications` lists only accessible in-scope RP configurations grouped by owning Application and labelled with meaningful Application, configuration, Partner-environment, and CanadaLogin-environment context
- **AND** each chooser link opens `/workspaces/$workspaceUuid/applications/$applicationUuid/rp-configurations/$rpConfigurationUuid/usage` for exactly one RP configuration
- **AND** the chooser does not expose an out-of-scope Application, RP configuration, workspace, report, or identifier

#### Scenario: Existing contextual report entry points remain available

- **WHEN** an authorized user works from Onboarding oversight, a selected workspace, an Application, or an accessible RP configuration
- **THEN** the existing contextual link to that scope's focused report remains available through its canonical nested destination or an authorized compatibility redirect
- **AND** the Reports hub provides an additional discovery path rather than replacing the canonical parent task area

#### Scenario: Report chooser section handles asynchronous states safely

- **WHEN** an authorized workspace or RP-configuration report-scope list is loading, empty, partially unavailable, failed, stale, or no longer authorized
- **THEN** the affected chooser shows a scoped status and safe retry or return action
- **AND** valid content from another authorized report family remains available
- **AND** the browser does not receive a wider report-scope dataset and reduce it only through client-side filtering

#### Scenario: Report discovery does not expose report data

- **WHEN** an authorized user opens `/reports` or one of its chooser pages
- **THEN** the page exposes only the minimum safe report-family, Application, RP-configuration, environment, and authorized scope labels needed for navigation
- **AND** it does not load or render report result rows, exports, secret material, raw authorization context, internal integer identifiers, or provider payloads

#### Scenario: Same-environment configurations remain distinct in Reports

- **WHEN** one Application has several accessible configurations targeting the same CanadaLogin environment
- **THEN** the chooser presents each configuration as a separate item using its configuration name, Partner environment or localized `Not provided`, and a localized short public reference when displayed name/Partner-environment/CanadaLogin-environment triples are identical
- **AND** selecting one loads Usage for only that configuration

#### Scenario: Reports compatibility query remains server scoped

- **WHEN** the chooser uses an accessible RP summary compatibility endpoint
- **THEN** the backend applies current session, workspace grant, reporting capability, and resource scope before serialization
- **AND** the response contains only the secret-free identity and destination fields needed for report selection
- **AND** the browser does not receive a wider list and filter it into scope

#### Scenario: Old usage destination redirects during migration

- **WHEN** an authorized Reports caller still holds the old `/workspaces/$workspaceUuid/applications/$rpApplicationUuid/usage` destination
- **THEN** the compatibility resolver derives the parent Application and redirects to the canonical nested RP-configuration Usage route
- **AND** the canonical route re-applies report authorization before loading results

### Requirement: Partner aggregate reporting has a selected-workspace route

The portal SHALL provide `/workspaces/$workspaceUuid/reports` as the partner
entry route for aggregate reporting in one explicitly selected workspace. The
route SHALL reuse the existing report families and SHALL constrain every view,
filter, and export to the selected workspace and current canonical
authorization context. It SHALL be discoverable from the selected-workspace
hub and Reports task hub without requiring a persistent workspace side rail.

#### Scenario: Authorized partner reader opens workspace reports

- **WHEN** an authorized reporting reader opens `/workspaces/$workspaceUuid/reports`
- **THEN** the portal identifies the selected workspace by name
- **AND** it requests aggregate reporting through `GET /api/v1/workspaces/{workspace_uuid}/reports`, with workspace scope bound to the authorized path resource
- **AND** it presents only the report families, filters, and actions permitted for that reader

#### Scenario: Workspace report API reuses shared reporting behavior

- **WHEN** the workspace report page requests results or an export
- **THEN** the workspace BFF route reuses the existing aggregate-report service and response or export model rather than duplicating metric calculations
- **AND** the result route accepts no second workspace selector that could disagree with `$workspaceUuid`
- **AND** the browser does not call the internal oversight route or receive a cross-workspace result for client-side filtering

#### Scenario: Workspace report route is discoverable

- **WHEN** the canonical authorization context permits aggregate reporting in the selected workspace
- **THEN** the workspace hub and Reports task hub expose the selected-workspace report path
- **AND** the reporting page provides breadcrumbs and a return path to `/workspaces/$workspaceUuid`
- **AND** the user does not need a persistent workspace side rail, internal Onboarding oversight, or a direct URL

#### Scenario: Partner report cannot cross workspace scope

- **WHEN** a partner reporting reader changes a route parameter, filter, request, or export to target a workspace outside current scope
- **THEN** the backend rejects the request through the standard safe authorization or validation behavior
- **AND** the page does not replace the last valid selected-workspace result with out-of-scope or misleading data

#### Scenario: Internal cross-workspace reporting remains separate

- **WHEN** an authorized internal user needs cross-workspace reporting
- **THEN** `/onboarding-oversight/reports` remains the internal reporting route
- **AND** `/workspaces/$workspaceUuid/reports` does not expose internal workspace selectors, cross-workspace rows, oversight links, or exports

#### Scenario: Workspace report handles loading, empty, error, and partial states

- **WHEN** a selected-workspace report is loading, has no results, fails safely, or contains partial aggregate data
- **THEN** the page identifies the affected state in the report scope
- **AND** provides an appropriate retry, filter reset, or workspace return action
- **AND** does not expose record-level data or RP secret material in status or error content

#### Scenario: Workspace report export preserves selected scope

- **WHEN** an authorized partner reader exports the current report result
- **THEN** the export uses `/api/v1/workspaces/{workspace_uuid}/reports/export`, the selected workspace path resource, and current valid filter set
- **AND** contains only the aggregate data allowed by the existing reporting contract

### Requirement: CL Admin captures onboarding notes and checklist outcomes

The system SHALL allow CL Admin to record internal review notes and checklist
outcomes against a submitted or under-review Application parent. Partner roles
MAY read permitted workflow status but SHALL NOT view or edit internal review
findings. The focused Internal review route SHALL identify any relevant child
RP configurations without copying protected notes into their partner-facing
Configuration or Usage pages.

#### Scenario: CL Admin records review findings

- **WHEN** a CL Admin reviews an Application through an authorized oversight path
- **THEN** the portal stores review notes and checklist status against that Application
- **AND** it may associate safe child configuration references needed for review traceability
- **AND** it makes the protected contents available only to authorized internal users

#### Scenario: Unauthorized users cannot view or edit review findings

- **WHEN** a user without CL Admin oversight access attempts to view or update internal review notes or checklist outcomes
- **THEN** the portal denies access to those review artifacts
- **AND** the response, Application hub, RP-configuration hub, and partner summaries do not reveal their protected contents
