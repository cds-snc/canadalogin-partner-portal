## ADDED Requirements

### Requirement: Onboarding lifecycle state is tracked across core onboarding records
The system SHALL track onboarding state for workspaces, application information records, and RP applications using the state vocabulary `draft`, `submitted`, `under_review`, `approved`, and `launched`. The current state SHALL be visible to authorized users on the relevant list and detail experiences.

#### Scenario: New onboarding records start in draft
- **WHEN** a workspace admin creates a new workspace, application information record, or RP application
- **THEN** the new record starts in `draft` until it is intentionally submitted into the onboarding workflow

#### Scenario: Submitted onboarding records expose review state
- **WHEN** an authorized user submits a draft onboarding record
- **THEN** the system records the state as `submitted` and makes that state visible in the relevant list and detail views

#### Scenario: Reviewed onboarding records move through governed states
- **WHEN** an authorized reviewer or administrator advances a submitted onboarding record
- **THEN** the system can move the record through `under_review`, `approved`, and `launched` as the onboarding outcome changes

#### Scenario: Unauthorized actor cannot advance review-only states
- **WHEN** a user without reviewer or administrator authority attempts to move an onboarding record into `under_review`, `approved`, or `launched`
- **THEN** the system denies the transition and preserves the record's current state

### Requirement: Application information records show readiness indicators
The system SHALL provide section-level completion indicators and an overall readiness signal for application information records so workspace admins can identify incomplete onboarding data before submission.

#### Scenario: Incomplete application information is flagged
- **WHEN** a workspace admin opens an application information record with missing required onboarding data
- **THEN** the portal highlights the incomplete sections or required inputs and keeps the record below a submit-ready state

#### Scenario: Submission is blocked while required onboarding data is incomplete
- **WHEN** a workspace admin attempts to submit an application information record that is not submit-ready
- **THEN** the system rejects the submission attempt, keeps the record in `draft`, and identifies the missing required sections, fields, or contacts

#### Scenario: Complete application information is ready for submission
- **WHEN** a workspace admin completes the required onboarding sections and contact information for an application information record
- **THEN** the portal marks the record as submit-ready and allows the user to move it out of `draft`