# partner-portal-onboarding-oversight-and-reporting Specification

## Purpose
TBD - created by archiving change advance-onboarding-governance-and-reporting. Update Purpose after archive.
## Requirements
### Requirement: Platform-admin users have a cross-workspace onboarding view
The system SHALL provide an authenticated oversight view for platform-admin users to monitor onboarding work across workspaces and departments.

#### Scenario: Oversight user filters the onboarding backlog
- **WHEN** an authorized platform-admin user opens the onboarding oversight view
- **THEN** the portal lists onboarding records across workspaces with filters for state, department, workspace, and record type

#### Scenario: Oversight user filters production-bound promotion requests
- **WHEN** an authorized platform-admin user filters the onboarding backlog for records targeting `production`
- **THEN** the portal lists the relevant promotion requests with their latest promotion status and external review reference

#### Scenario: Oversight view highlights work needing review
- **WHEN** records exist in `submitted` or `under_review`
- **THEN** the oversight view highlights them separately from `draft`, `approved`, and `launched` records

#### Scenario: Oversight backlog omits RP secret values
- **WHEN** an authorized platform-admin user inspects onboarding records from the oversight view
- **THEN** the portal exposes only status, checklist, and review metadata and does not reveal current or rotated RP secret values

### Requirement: Platform admins capture onboarding notes and checklist outcomes
The system SHALL allow authorized platform-admin users to record review notes and checklist outcomes against submitted or under-review application information records.

#### Scenario: Platform admin records review findings
- **WHEN** an authorized platform-admin user reviews an application information record
- **THEN** the portal stores review notes and checklist status for that record and makes them available to authorized internal users

#### Scenario: Unauthorized users cannot view or edit review findings
- **WHEN** a user without oversight access attempts to view or update review notes or checklist outcomes
- **THEN** the portal denies access to those review artifacts

### Requirement: Operational reporting summarizes onboarding and invitation health
The system SHALL provide aggregate reporting for invitation conversion, secret rotation hygiene, and onboarding throughput, using the same report families for internal oversight and partner-side readers while constraining results to each reader's authorized scope.

#### Scenario: Platform-admin user reviews cross-workspace onboarding throughput
- **WHEN** an authorized platform-admin user selects a reporting period
- **THEN** the portal shows aggregate counts or rates for onboarding submission, approval, and launch throughput within that period

#### Scenario: Partner-side reporting reader reviews in-scope aggregate metrics
- **WHEN** an authorized `RP Admin`, `RP User (Edit)`, or `Read Only` user opens the reporting route
- **THEN** the portal shows the same aggregate metric families using only that user's granted partner scope
- **AND** the portal does not expose cross-workspace rows, filters, or exports outside that scope

#### Scenario: Reporting reader reviews invitation and secret hygiene
- **WHEN** an authorized reporting reader selects reporting filters within the caller's allowed scope
- **THEN** the portal shows aggregate invitation conversion and secret-rotation hygiene metrics without requiring record-by-record inspection

#### Scenario: Reporting reader exports aggregate reporting results
- **WHEN** an authorized reporting reader requests an export for the current reporting filter set
- **THEN** the portal exports the aggregate onboarding, invitation, or secret-hygiene results for those filters without exposing record-level data beyond the report scope or any RP secret material

#### Scenario: Invalid or out-of-scope reporting filters fail safely
- **WHEN** an authorized reporting reader submits an unsupported, invalid, or out-of-scope reporting filter combination
- **THEN** the portal returns a safe validation failure and does not replace the last valid reporting view with misleading data

