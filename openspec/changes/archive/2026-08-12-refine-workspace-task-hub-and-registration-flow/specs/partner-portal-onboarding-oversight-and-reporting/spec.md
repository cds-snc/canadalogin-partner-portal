# Delta for discoverable workspace-scoped partner reporting

## ADDED Requirements

### Requirement: Partner aggregate reporting has a selected-workspace route

The portal SHALL provide `/workspaces/$workspaceUuid/reports` as the partner
entry route for aggregate reporting in one explicitly selected workspace. The
route SHALL reuse the existing report families and SHALL constrain every view,
filter, and export to the selected workspace and current canonical
authorization context.

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
- **THEN** the workspace hub and side navigation expose Reports
- **AND** the reporting page provides breadcrumbs and a return path to `/workspaces/$workspaceUuid`
- **AND** the user does not need to pass through internal Onboarding oversight or know a direct URL

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
