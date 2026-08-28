# Delta for partner portal onboarding oversight and reporting

## ADDED Requirements

### Requirement: CL Admin has a cross-workspace onboarding view

The system SHALL provide an authenticated oversight view for CL Admin to
monitor onboarding work across workspaces and departments. Partner roles SHALL
NOT receive the cross-workspace queue, internal review notes, or filters outside
their active workspace assignments.

#### Scenario: CL Admin filters the onboarding backlog

- **WHEN** a CL Admin opens the onboarding oversight view
- **THEN** the portal lists onboarding records across workspaces with filters for state, department, workspace, and record type

#### Scenario: CL Admin filters production-bound promotion requests

- **WHEN** a CL Admin filters the onboarding backlog for records targeting production
- **THEN** the portal lists the relevant promotion requests with their latest promotion status and external review reference

#### Scenario: Oversight view highlights work needing review

- **WHEN** records exist in submitted or under_review
- **THEN** the oversight view highlights them separately from draft, approved, and launched records

#### Scenario: Oversight backlog omits RP secret values

- **WHEN** a CL Admin inspects onboarding records from the oversight view
- **THEN** the portal exposes only permitted metadata, status, checklist, and review information
- **AND** it does not reveal current or rotated RP secret values

#### Scenario: Partner role cannot enter internal oversight

- **WHEN** an RP Admin, RP User (Edit), or Read Only user requests the cross-workspace overview, queue, or internal review route
- **THEN** the portal denies the request
- **AND** access to scoped aggregate reporting does not expose internal oversight

### Requirement: CL Admin captures onboarding notes and checklist outcomes

The system SHALL allow CL Admin to record review notes and checklist outcomes
against submitted or under-review application information records. Partner
roles MAY read permitted workflow status but SHALL NOT view or edit internal
review findings.

#### Scenario: CL Admin records review findings

- **WHEN** a CL Admin reviews an application information record
- **THEN** the portal stores review notes and checklist status for that record
- **AND** it makes them available only to authorized internal users

#### Scenario: Unauthorized users cannot view or edit review findings

- **WHEN** a user without CL Admin oversight access attempts to view or update internal review notes or checklist outcomes
- **THEN** the portal denies access to those review artifacts
- **AND** the response does not reveal their protected contents

## MODIFIED Requirements

### Requirement: Operational reporting summarizes onboarding and invitation health

The system SHALL provide aggregate reporting for invitation conversion, secret
rotation hygiene, and onboarding throughput using the same report families for
CL Admin and partner readers while constraining results to each caller's active
authorization scope.

CL Admin SHALL receive cross-workspace aggregate reporting. RP Admin, RP User
(Edit), and Read Only SHALL select exactly one active assigned workspace per
report request and receive aggregate results only for that workspace. Partner
reporting SHALL NOT union multiple partner workspaces or expose internal review
notes, cross-workspace rows or filters, record-level data outside the allowed
scope, or any RP secret material.

#### Scenario: Platform-admin user reviews cross-workspace onboarding throughput

- **WHEN** a CL Admin selects a reporting period
- **THEN** the portal shows aggregate counts or rates for onboarding submission, approval, and launch throughput across the authorized platform scope

#### Scenario: Partner-side reporting reader reviews in-scope aggregate metrics

- **WHEN** an RP Admin, RP User (Edit), or Read Only user opens the reporting route
- **THEN** the portal requires one workspace selected from the caller's active partner assignments and shows the same aggregate metric families for only that workspace
- **AND** the portal does not expose cross-workspace rows, filters, or exports outside those assignments

#### Scenario: Multi-workspace partner user switches report scope explicitly

- **WHEN** a partner user has active assignments in more than one workspace
- **THEN** each report request selects one authorized workspace UUID
- **AND** the portal never combines those workspaces into one partner report or internal oversight view

#### Scenario: Reporting reader reviews invitation and secret hygiene

- **WHEN** an authorized reporting reader selects reporting filters within the caller's allowed scope
- **THEN** the portal shows aggregate invitation conversion and secret-rotation hygiene metrics without requiring record-by-record inspection
- **AND** no secret value is included

#### Scenario: Reporting reader exports aggregate reporting results

- **WHEN** an authorized reporting reader requests an export for the current reporting filter set
- **THEN** the portal exports only aggregate onboarding, invitation, or secret-hygiene results within the caller's active scope
- **AND** the export does not expose record-level data outside that scope or any RP secret material

#### Scenario: Invalid or out-of-scope reporting filters fail safely

- **WHEN** an authorized reporting reader submits an unsupported, invalid, or out-of-scope reporting filter combination
- **THEN** the portal returns a safe validation or authorization failure
- **AND** it does not replace the last valid reporting view with misleading or broader data

## REMOVED Requirements

### Requirement: Platform-admin users have a cross-workspace onboarding view

**Reason**: Platform-admin is not one of the canonical role labels and is
currently ambiguous with admin and is_superuser.

**Migration**: Use CL Admin has a cross-workspace onboarding view. The existing
oversight scenarios are preserved and partner-role exclusion is explicit.

### Requirement: Platform admins capture onboarding notes and checklist outcomes

**Reason**: Internal review authority belongs specifically to canonical CL
Admin, not an undefined platform-admin actor.

**Migration**: Use CL Admin captures onboarding notes and checklist outcomes.
Existing review-note behavior is preserved with clearer visibility boundaries.
