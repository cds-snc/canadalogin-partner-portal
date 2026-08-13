# Delta for partner-portal-onboarding-oversight-and-reporting

## ADDED Requirements

### Requirement: Report discovery preserves canonical report scope

The Reports task hub and its focused chooser pages SHALL link to the existing
cross-workspace, selected-workspace, and application usage report routes
without combining their data or weakening their authorization boundaries.
Dynamic chooser results SHALL contain only report scopes available through the
current canonical authorization context and server-scoped resource contracts.

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

- **WHEN** a user with `mau_report_read` for one or more accessible RP applications chooses Application usage reports
- **THEN** `/reports/applications` lists only accessible in-scope RP applications using meaningful application labels
- **AND** each chooser link opens the canonical `/workspaces/$workspaceUuid/applications/$rpApplicationUuid/usage` route for exactly one RP application
- **AND** the chooser does not expose an out-of-scope application, workspace, report, or identifier

#### Scenario: Existing contextual report entry points remain available

- **WHEN** an authorized user works from Onboarding oversight, a selected workspace, or an accessible RP application
- **THEN** the existing contextual link to that scope's focused report remains available
- **AND** the Reports hub provides an additional discovery path rather than replacing the canonical parent task area

#### Scenario: Report chooser section handles asynchronous states safely

- **WHEN** an authorized workspace or application report-scope list is loading, empty, partially unavailable, failed, stale, or no longer authorized
- **THEN** the affected chooser shows a scoped status and safe retry or return action
- **AND** valid content from another authorized report family remains available
- **AND** the browser does not receive a wider report-scope dataset and reduce it only through client-side filtering

#### Scenario: Report discovery does not expose report data

- **WHEN** an authorized user opens `/reports` or one of its chooser pages
- **THEN** the page exposes only the minimum safe report-family and authorized scope labels needed for navigation
- **AND** it does not load or render report result rows, exports, secret material, raw authorization context, or internal identifiers
