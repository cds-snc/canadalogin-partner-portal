# Delta for partner portal onboarding oversight and reporting

## ADDED Requirements

### Requirement: CL Admin has a cross-workspace onboarding and Production-review view

The system SHALL provide an authenticated oversight view for CL Admin to
monitor onboarding work and explicit Production-review requests across
workspaces and departments. A Production-review row SHALL identify one selected
Production RP configuration and MAY show a source configuration only when
explicit copy lineage exists. Copy operations without an explicit review
request SHALL NOT appear as Production-review work.

Partner roles SHALL NOT receive the cross-workspace queue, internal review
notes, or filters outside their active workspace assignments.

#### Scenario: CL Admin filters the onboarding backlog

- **WHEN** a CL Admin opens the onboarding oversight view
- **THEN** the portal lists onboarding records across workspaces with filters for state, department, workspace, and record type

#### Scenario: CL Admin filters Production review requests

- **WHEN** a CL Admin filters the onboarding backlog for Production-review work
- **THEN** the portal lists explicit review requests with their selected Production configuration, latest Production-review status, and external review reference
- **AND** source configuration appears only when explicit lineage exists
- **AND** a copied Production draft without a review request is not included as review work

#### Scenario: Oversight view highlights work needing review

- **WHEN** records exist in submitted or under_review
- **THEN** the oversight view highlights them separately from draft, approved, and launched records

#### Scenario: Oversight backlog omits RP secret values

- **WHEN** a CL Admin inspects onboarding records from the oversight view
- **THEN** the portal exposes only permitted metadata, status, checklist, and review information
- **AND** it does not reveal current or rotated RP secret values, copied answer values, or private key material

#### Scenario: Partner role cannot enter internal oversight

- **WHEN** an RP Admin, RP User (Edit), or Read Only user requests the cross-workspace overview, queue, or internal review route
- **THEN** the portal denies the request
- **AND** access to scoped aggregate reporting does not expose internal oversight

## REMOVED Requirements

### Requirement: CL Admin has a cross-workspace onboarding view

**Reason**: The requirement presents every Production-bound record as a
Staging-to-Production promotion request and does not distinguish configuration
copying from an explicitly submitted Production-review request.

**Migration**: Use `CL Admin has a cross-workspace onboarding and Production-
review view`. Preserve cross-workspace filters, review-state prioritization,
secret exclusion, and partner denial while showing only explicit review
requests as Production-review work.
