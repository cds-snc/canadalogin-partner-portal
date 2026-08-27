# Delta for partner-portal-access-and-dashboard

## ADDED Requirements

### Requirement: Reports uses a dedicated role-aware task hub

The portal SHALL provide `/reports` as the authenticated task hub for
discovering report families available through the current canonical
authorization context. Reports SHALL appear in the shared primary navigation
and authenticated Home only when the user can access at least one report
family. The hub SHALL group report-family destinations as responsive
single-destination GC Design System cards and SHALL NOT act as an operational
dashboard or embed report results.

#### Scenario: Authorized reporting user discovers Reports

- **WHEN** the current canonical authorization context permits at least one cross-workspace, workspace, or application usage report
- **THEN** authenticated Home and the shared top navigation expose a translated Reports destination
- **AND** selecting that destination opens `/reports`

#### Scenario: Reports hub groups available report families

- **WHEN** an authorized reporting user opens `/reports`
- **THEN** the page uses one Reports H1 and groups only available report families under clear translated Platform reporting or Partner reporting headings
- **AND** each family uses one GC Design System card with one linked title, one concise scope description, and one focused destination
- **AND** empty groups and unavailable report families are omitted

#### Scenario: Reports remains a task-selection surface

- **WHEN** an authorized user opens `/reports`
- **THEN** the hub helps the user choose a report family and scope-selection path
- **AND** it does not embed report filters, result tables, exports, charts, summary metrics, review queues, or data-changing controls

#### Scenario: Reports card groups remain accessible and responsive

- **WHEN** the Reports hub is used with keyboard navigation, assistive technology, a small screen, or a zoomed viewport
- **THEN** task groups have a logical heading hierarchy and source order
- **AND** cards reflow to a single column without clipped content or horizontal scrolling
- **AND** each card exposes one clear accessible destination and contains no nested interactive controls

#### Scenario: User without report access cannot discover or open Reports

- **WHEN** the canonical authorization context permits no report family
- **THEN** authenticated Home and the shared menu omit Reports
- **AND** a direct request to `/reports` fails through the standard safe authorization behavior
- **AND** the response does not reveal report types, workspaces, applications, or scope identifiers
