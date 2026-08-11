# Partner Portal Workspace And RP Application Management

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
- **WHEN** an authorized platform-admin user advances a submitted onboarding record
- **THEN** the system can move the record through `under_review`, `approved`, and `launched` as the onboarding outcome changes

#### Scenario: Unauthorized actor cannot advance review-only states
- **WHEN** a user without platform-admin authority attempts to move an onboarding record into `under_review`, `approved`, or `launched`
- **THEN** the system denies the transition and preserves the record's current state

### Requirement: Application information records show advisory readiness indicators
The system SHALL provide section-level completion indicators and an overall readiness signal for application information records so workspace admins can identify incomplete onboarding data before submission or production progression.

#### Scenario: Incomplete application information is flagged
- **WHEN** a workspace admin opens an application information record with missing required onboarding data
- **THEN** the portal highlights the incomplete sections or required inputs and keeps the record below a submit-ready state

#### Scenario: Incomplete readiness remains advisory in MVP2
- **WHEN** a workspace admin submits or continues working with an application information record that is not submit-ready
- **THEN** the portal preserves the incomplete indicators for user and oversight visibility, and any hard gating decision remains outside Partner Portal for MVP2

#### Scenario: Complete application information is marked submit-ready
- **WHEN** a workspace admin completes the required onboarding sections and contact information for an application information record
- **THEN** the portal marks the record as submit-ready and uses that status in onboarding summaries and review context

### Requirement: Environment progression rules remain explicit per RP application environment
The system SHALL treat `test`, `staging`, and `production` as environment-scoped onboarding steps and SHALL track progression between them without requiring every partner to use every environment.

#### Scenario: Test and staging RP application creation remains allowed
- **WHEN** a workspace admin creates or updates an RP application targeting `test` or `staging`
- **THEN** the portal allows that RP application work without requiring a production approval outcome first

#### Scenario: Partner can start at staging when test is unnecessary
- **WHEN** a workspace admin creates or updates a registration and `test` is not required for that integration path
- **THEN** the portal allows the onboarding record to proceed without a `test` registration and preserves the chosen environment path

#### Scenario: Test to staging progression reuses prior answers
- **WHEN** a workspace admin requests progression from `test` to `staging`
- **THEN** the portal pre-fills the next environment registration with previously captured onboarding and RP-registration values and marks the progression as self-serve

#### Scenario: Staging to production progression enters reviewed status
- **WHEN** a workspace admin requests progression from `staging` to `production`
- **THEN** the portal records the promotion request as review-tracked instead of treating the record as immediately launched

### Requirement: Out-of-band production review remains traceable
The system SHALL track promotion request status and external review references when CanadaLogin approval actions occur outside the portal.

#### Scenario: Promotion request captures review metadata
- **WHEN** a `staging`-to-`production` request is created or updated
- **THEN** the portal stores the current promotion status, external review reference, reviewing platform-admin identity or team metadata, and the relevant requested, reviewed, and decided timestamps

#### Scenario: Platform admin records production review outcome
- **WHEN** a platform-admin user records the latest out-of-band production review result for a promotion request
- **THEN** the portal updates the tracked promotion status and review metadata without requiring in-portal evidence upload

#### Scenario: Production-bound record cannot appear approved without review trace
- **WHEN** a record lacks the required review outcome or external reference for a production progression
- **THEN** the portal does not present the progression as `approved` or `launched` and identifies the missing review-traceability data

### Requirement: Checklist readiness and process links are visible before production progression
The system SHALL make onboarding checklist progress, external evidence references, and contextual external process links visible before a record is treated as production-ready.

#### Scenario: Workspace admin reviews production prerequisites
- **WHEN** a workspace admin opens a record that is preparing for production progression
- **THEN** the portal displays the tracked onboarding checklist items, current external evidence-reference status, and links to the relevant external review or process entry points

#### Scenario: Missing prerequisites are highlighted before production progression
- **WHEN** tracked checklist items or external evidence references remain incomplete for a production-bound record
- **THEN** the portal highlights the missing prerequisites before the production progression metadata is submitted or resubmitted, while leaving the hard gate outside Partner Portal for MVP2
