# CanadaLogin Partner Portal Backlog

## Document Status

- Status: Draft
- Date: 2026-05-13
- Source: Derived from the current repository-backed PRD in `docs/plans/partner-portal-prd.md`
- Purpose: Translate the PRD into a delivery-oriented backlog grouped by epic, release horizon, and user story

## 1. Backlog Framing

This backlog assumes the current codebase already delivers the platform foundation:

- OIDC authentication and session management
- dashboard and profile setup
- workspace CRUD and membership management
- application information intake and contacts management
- RP application creation and detail management
- secret rotation and usage visibility
- invited external developer access flow
- core platform administration for users, roles, policies, departments, and tiers

The backlog below focuses on what should come next.

## 2. Release Horizons

### MVP Hardening

Goal: make the existing product coherent, measurable, easier to operate, and safer to roll out more broadly.

### VNext Expansion

Goal: add workflow depth, reviewer and portfolio oversight, and stronger governance and automation.

## 3. MVP Hardening Backlog

## Epic M1: Onboarding State And Readiness

### Outcome

Give teams and reviewers a shared definition of where an application is in onboarding, what is still missing, and what is ready for the next step.

### User Stories

#### M1-S1: Add explicit onboarding state model

- As a workspace administrator, I want each application information record and RP application to show a lifecycle state so that I know whether it is draft, ready for review, or operational.
- Priority: MVP
- Acceptance criteria:
  - system supports a defined set of onboarding states
  - state is visible in workspace and application detail views
  - state transitions are constrained to valid next steps

#### M1-S2: Add completion scoring for application information

- As a workspace administrator, I want to see a completion score or checklist for application information so that I can quickly identify missing onboarding data.
- Priority: MVP
- Acceptance criteria:
  - required and optional fields are clearly distinguished
  - completion is visible at list and detail levels
  - incomplete sections are linkable from the detail page

#### M1-S3: Block submission when minimum readiness criteria are not met

- As a reviewer, I want the system to prevent ready-for-review or launch transitions when critical onboarding data is missing so that downstream teams do not receive unusable submissions.
- Priority: MVP
- Acceptance criteria:
  - validation rules exist for critical readiness gates
  - validation errors are human-readable
  - readiness gate logic is reusable across frontend and backend

## Epic M2: Access Model Clarity

### Outcome

Reduce support burden and accidental misuse by making role boundaries explicit in the UI and documentation.

### User Stories

#### M2-S1: Publish role and permission matrix in-product

- As a workspace admin or support operator, I want a concise explanation of what each role can do so that I can assign access confidently.
- Priority: MVP
- Acceptance criteria:
  - system includes a role matrix for superuser, workspace admin, workspace member, and invited developer
  - matrix is visible from relevant admin screens or help content
  - invitee scope is explicitly described as app-scoped, not workspace-scoped

#### M2-S2: Improve access-denied guidance

- As a blocked or uninvited user, I want clearer next steps on the access-denied page so that I know whether to retry, request an invitation, or contact support.
- Priority: MVP
- Acceptance criteria:
  - access-denied page explains likely reasons for denial
  - page includes actionable next steps
  - copy differentiates between invitation issues and general authorization issues

#### M2-S3: Add audit-friendly membership and invitation context

- As a support administrator, I want to see whether a user has workspace membership, invited-developer access, or both so that access issues can be resolved quickly.
- Priority: MVP
- Acceptance criteria:
  - support-visible access summary identifies access source
  - invitation-derived access is distinguishable from workspace membership
  - access summary is available from relevant user or application management surfaces

## Epic M3: Invitation Lifecycle Reliability

### Outcome

Make the external developer collaboration flow observable, supportable, and resilient.

### User Stories

#### M3-S1: Add invitation analytics and status summary

- As a platform operator, I want aggregate counts for pending, accepted, expired, and revoked invitations so that I can monitor invitation conversion and failure patterns.
- Priority: MVP
- Acceptance criteria:
  - invitation counts are available at least in an admin-facing summary view
  - summary can be filtered by workspace or application
  - invitation events can be exported or inspected for operations follow-up

#### M3-S2: Surface invitation delivery and token failure reasons

- As a support operator, I want better error visibility when invitations fail or tokens are rejected so that I can diagnose user problems without log spelunking.
- Priority: MVP
- Acceptance criteria:
  - GC Notify failures produce actionable messages
  - invalid, expired, revoked, and already-used token states are distinguishable
  - support-facing error details are preserved safely

#### M3-S3: Support invitation reminders before expiry

- As a workspace administrator, I want the system to prompt or automate reminders for pending invitations before they expire so that fewer invites are lost.
- Priority: MVP
- Acceptance criteria:
  - pending invitations nearing expiry are identifiable
  - admins can resend from the same workflow without leaving the page
  - reminder timing is configurable or standardized

## Epic M4: RP Application Operations Hardening

### Outcome

Make application operations safer, clearer, and more auditable for workspace admins.

### User Stories

#### M4-S1: Add rotation history and hygiene indicators

- As a workspace administrator, I want to see when a client secret was last rotated and whether rotated secrets remain active so that I can maintain secret hygiene.
- Priority: MVP
- Acceptance criteria:
  - application detail or credentials UI shows latest rotation history
  - stale or expired rotated secrets are clearly indicated
  - rotation history is visible without requiring raw backend inspection

#### M4-S2: Add destructive-action safeguards for credentials and application deletion

- As a workspace administrator, I want stronger confirmation flows for application deletion and secret regeneration so that I avoid accidental disruption.
- Priority: MVP
- Acceptance criteria:
  - destructive actions use explicit confirmation messaging
  - risky credential actions explain impact before execution
  - action outcomes are logged and visible to the user after completion

#### M4-S3: Add application operational summary panel

- As a workspace administrator, I want a compact operational summary for each RP application so that I can quickly assess state, usage, and credential posture.
- Priority: MVP
- Acceptance criteria:
  - summary includes status, credential posture, invite activity, and usage snapshot
  - summary appears on the primary application management path
  - summary is readable without navigating across multiple tabs or pages

## Epic M5: Reviewer And Portfolio Visibility

### Outcome

Give internal reviewers and program owners enough visibility to manage onboarding portfolio health without manually traversing every workspace.

### User Stories

#### M5-S1: Add cross-workspace reviewer queue

- As a reviewer, I want a cross-workspace queue of applications needing attention so that I can process onboarding work efficiently.
- Priority: MVP
- Acceptance criteria:
  - queue can list draft, ready-for-review, blocked, and recently updated items
  - queue is filterable by department and workspace
  - each queue item links directly to the relevant application record

#### M5-S2: Add onboarding portfolio dashboard

- As a program manager, I want portfolio-level counts by onboarding state so that I can understand throughput and bottlenecks.
- Priority: MVP
- Acceptance criteria:
  - dashboard shows counts by onboarding state
  - dashboard supports department or workspace filtering
  - dashboard highlights stalled items

## 4. VNext Expansion Backlog

## Epic V1: Formal Review Workflow

### Outcome

Move from a data-entry platform to a governed onboarding workflow with explicit review steps and feedback loops.

### User Stories

#### V1-S1: Add review submission workflow

- As a workspace administrator, I want to submit an application package for review so that onboarding moves through a formal process.
- Priority: VNext
- Acceptance criteria:
  - submission changes state and captures submission metadata
  - reviewable package includes application information, contacts, and RP application settings
  - submitter receives confirmation and visible status

#### V1-S2: Add reviewer comments and requests-for-change

- As a reviewer, I want to leave structured feedback on an application so that the workspace administrator knows what to fix.
- Priority: VNext
- Acceptance criteria:
  - reviewers can add comments tied to sections or fields
  - workspace admins can view and resolve feedback
  - feedback history is retained

#### V1-S3: Add approval and rejection outcomes

- As a reviewer, I want to approve or reject an onboarding package with a reason so that the decision is explicit and auditable.
- Priority: VNext
- Acceptance criteria:
  - decision outcomes are visible in status history
  - rejection requires rationale
  - approval can trigger the next operational stage

## Epic V2: Advanced Collaboration Model

### Outcome

Expand collaboration safely without weakening the narrow-access guarantees of the current v1 invitee model.

### User Stories

#### V2-S1: Add read-only collaborator role

- As a workspace administrator, I want to grant read-only access to specific application stakeholders so that they can review content without editing it.
- Priority: VNext
- Acceptance criteria:
  - read-only collaborator role exists with clearly bounded permissions
  - role can be assigned without workspace-admin privileges
  - role is distinct from invited developer and workspace member roles

#### V2-S2: Add scoped invitee access to selected supporting artifacts

- As an invited developer, I may need access to related contacts or onboarding sections so that I can complete delegated work without requesting broader workspace access.
- Priority: VNext
- Acceptance criteria:
  - allowed supporting artifacts are explicitly defined
  - access remains application-scoped
  - non-allowed workspace resources remain inaccessible

## Epic V3: Operational Notifications And Automation

### Outcome

Reduce manual follow-up through event-driven notifications and lifecycle automation.

### User Stories

#### V3-S1: Notify admins on review state changes

- As a workspace administrator, I want notifications when an application moves into review, is approved, or needs changes so that I do not need to poll the portal.
- Priority: VNext
- Acceptance criteria:
  - state-change notifications are generated for key workflow events
  - notification content links to the relevant record
  - users can manage or understand notification expectations

#### V3-S2: Notify admins about secret expiry or hygiene issues

- As a workspace administrator, I want advance warning about secret expiry and stale credentials so that I can rotate secrets before they cause risk.
- Priority: VNext
- Acceptance criteria:
  - system flags secrets nearing expiry
  - alert timing is configurable or standardized
  - notifications link back to the credentials workflow

#### V3-S3: Add stalled-item reminders

- As a program owner, I want reminders for applications stuck in one state too long so that onboarding work does not silently stall.
- Priority: VNext
- Acceptance criteria:
  - stalled thresholds are defined per state
  - reminders identify owner and affected record
  - reminders are visible in reporting or notifications

## Epic V4: Search, Reporting, And Export

### Outcome

Make the portal usable as a management system for a growing application portfolio.

### User Stories

#### V4-S1: Add global search across workspaces and applications

- As an operator or reviewer, I want to search across workspaces, application information records, RP applications, and invitations so that I can find records quickly.
- Priority: VNext
- Acceptance criteria:
  - global search supports common fields such as name, email, department, workspace, and application identifiers
  - results are grouped by entity type
  - results deep-link into detail views

#### V4-S2: Add compliance-oriented exports

- As a compliance or program stakeholder, I want exports of onboarding status, contacts, invitation history, and secret hygiene so that I can review portfolio health offline.
- Priority: VNext
- Acceptance criteria:
  - exports are available for major reporting entities
  - exports honor authorization constraints
  - export formats are usable by operations and governance teams

## 5. Sequencing Recommendation

Recommended implementation order:

1. M1 Onboarding State And Readiness
2. M2 Access Model Clarity
3. M3 Invitation Lifecycle Reliability
4. M4 RP Application Operations Hardening
5. M5 Reviewer And Portfolio Visibility
6. V1 Formal Review Workflow
7. V2 Advanced Collaboration Model
8. V3 Operational Notifications And Automation
9. V4 Search, Reporting, And Export

## 6. Suggested Delivery Milestones

### Milestone A: Product Coherence

- M1-S1
- M1-S2
- M2-S1
- M2-S2

### Milestone B: Collaboration And Operations Reliability

- M3-S1
- M3-S2
- M3-S3
- M4-S1
- M4-S2

### Milestone C: Oversight And Scale

- M4-S3
- M5-S1
- M5-S2
- V1-S1

## 7. Notes For Engineering Planning

- stories in M1 and M2 should be treated as high-leverage UX and contract work because they shape later workflow design
- stories in M3 and M4 depend on preserving the existing invitation and credential contracts already present in the backend
- stories in M5 and V1 will likely require new shared query surfaces and aggregation endpoints
- V2 requires an explicit permission-matrix design before implementation
