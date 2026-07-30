## ADDED Requirements

### Requirement: Internal oversight users have a cross-workspace onboarding view
The system SHALL provide an authenticated oversight view for reviewer or platform-admin users to monitor onboarding work across workspaces and departments.

#### Scenario: Oversight user filters the onboarding backlog
- **WHEN** an authorized oversight user opens the onboarding oversight view
- **THEN** the portal lists onboarding records across workspaces with filters for state, department, workspace, and record type

#### Scenario: Oversight view highlights work needing review
- **WHEN** records exist in `submitted` or `under_review`
- **THEN** the oversight view highlights them separately from `draft`, `approved`, and `launched` records

### Requirement: Reviewers capture onboarding notes and checklist outcomes
The system SHALL allow authorized oversight users to record review notes and checklist outcomes against submitted or under-review application information records.

#### Scenario: Reviewer records review findings
- **WHEN** an authorized oversight user reviews an application information record
- **THEN** the portal stores review notes and checklist status for that record and makes them available to authorized internal users

#### Scenario: Unauthorized users cannot view or edit review findings
- **WHEN** a user without oversight access attempts to view or update review notes or checklist outcomes
- **THEN** the portal denies access to those review artifacts

### Requirement: Operational reporting summarizes onboarding and invitation health
The system SHALL provide aggregate reporting for invitation conversion, secret rotation hygiene, and onboarding throughput.

#### Scenario: Oversight user reviews onboarding throughput
- **WHEN** an authorized oversight user selects a reporting period
- **THEN** the portal shows aggregate counts or rates for onboarding submission, approval, and launch throughput within that period

#### Scenario: Oversight user reviews invitation and secret hygiene
- **WHEN** an authorized oversight user selects reporting filters
- **THEN** the portal shows aggregate invitation conversion and secret-rotation hygiene metrics without requiring record-by-record inspection

#### Scenario: Oversight user exports aggregate reporting results
- **WHEN** an authorized oversight user requests an export for the current reporting filter set
- **THEN** the portal exports the aggregate onboarding, invitation, or secret-hygiene results for those filters without exposing record-level data beyond the report scope

#### Scenario: Invalid reporting filters fail safely
- **WHEN** an authorized oversight user submits an unsupported or invalid reporting filter combination
- **THEN** the portal returns a safe validation failure and does not replace the last valid reporting view with misleading data