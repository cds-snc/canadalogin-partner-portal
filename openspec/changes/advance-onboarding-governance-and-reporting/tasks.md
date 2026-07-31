# Tasks

## 0. Baseline Dependency Resolution

- [ ] 0.1 Resolve [openspec/changes/reconcile-prd-current-spec-gaps](../reconcile-prd-current-spec-gaps/proposal.md) or explicitly narrow the PRD so this change no longer depends on missing workspace, application-information, or invitation baseline surfaces.
- [ ] 0.2 Confirm whether the default platform-admin oversight assumption is accepted or whether a dedicated reviewer role is required before implementation.

## 1. Lifecycle State Model

- [ ] 1.1 Confirm the record types in scope for MVP2 state tracking: workspace, application information, RP application, and any promotion-request metadata attached to environment progression.
- [ ] 1.2 Keep the lifecycle vocabulary `draft`, `submitted`, `under_review`, `approved`, and `launched`, and record the actor and rule set for each state transition, including `test`-optional entry, self-serve `test` to `staging`, and reviewed `staging` to `production` progression.
- [ ] 1.3 Define backend DTO, persistence, and API contract updates needed to expose onboarding state and lifecycle timestamps on list and detail surfaces, plus target-environment, promotion-status, external-reference, reviewer, and timestamp fields where progression tracking applies.
- [ ] 1.4 Define the Alembic migration plan and repository updates required by STD-020 and PAT-012.
- [ ] 1.5 Define frontend state presentation requirements for workspace, application-information, and RP-application views.
- [ ] 1.6 Add tests that prove state visibility and representative transition behavior.

## 2. Application Information Readiness Indicators

- [ ] 2.1 Confirm which application information sections, contacts, checklist items, and evidence references are required before a record is considered submit-ready or eligible for production progression.
- [ ] 2.2 Define the completion-indicator behavior for incomplete sections, overall readiness, and missing checklist or evidence prerequisites.
- [ ] 2.3 Define PAT-017 itemized summary behavior for readiness displays and GC Design System feedback components for incomplete-state messaging.
- [ ] 2.4 Define validation and API behavior for submission or progression attempts when required onboarding data, checklist items, or evidence references are incomplete.
- [ ] 2.5 Add tests for incomplete, complete, and regression paths.

## 3. Reviewer Oversight And Review Notes

- [ ] 3.1 Record the oversight route plan: `/onboarding-oversight`, `/onboarding-oversight/queue`, and `/onboarding-oversight/reports`.
- [ ] 3.2 Record the approved page pattern and shared-shell navigation path required by STD-005, STD-006, STD-017, and PAT-021.
- [ ] 3.3 Define queue filters, list columns, row actions, and record-detail context for the cross-workspace review backlog, including target environment and external review reference where applicable.
- [ ] 3.4 Define PAT-023 table behavior for the review queue, including loading, empty, error, unauthorized, and pagination states.
- [ ] 3.5 Define reviewer note and checklist behavior, including who can view, add, and update review artifacts, and which metadata-only surfaces remain visible to CL Admin users without exposing RP secret values.
- [ ] 3.6 Add backend and frontend tests for oversight filtering, review-note capture, and access control.

## 4. Role-Boundary Guidance And Process Links

- [ ] 4.1 Identify the pages or flows where workspace-member versus invited-developer guidance and onboarding documentation or process links must appear.
- [ ] 4.2 Define English and French guidance copy, documentation/process-link labels, and parity expectations under STD-017 official-languages expectations.
- [ ] 4.3 Add tests or review fixtures that cover the new help, link, and guidance surfaces.
- [ ] 4.4 Record the follow-on change boundary for partner volume-spike notification, incident reporting, and deprecation workflow so those PRD items stay visible without widening this package.

## 5. Aggregate Reporting

- [ ] 5.1 Use the default first-release formulas unless product overrides them: invitation conversion, secret rotation hygiene, and onboarding throughput by selected period.
- [ ] 5.2 Define backend contract and query expectations for aggregate reporting views, including stable error codes for invalid filters when clients need branching.
- [ ] 5.3 Define frontend reporting views, filter state, and PAT-023 table behavior for oversight users.
- [ ] 5.4 Add tests for representative aggregation, empty states, invalid-filter handling, and export behavior.

## 6. Verification And Readiness

- [ ] 6.1 Run `make validate-openspec-change CHANGE_ID=advance-onboarding-governance-and-reporting`.
- [ ] 6.2 Run targeted backend and frontend tests for state, oversight, and reporting work once implementation exists.
- [ ] 6.3 Capture standards impact for UI, accessibility, bilingual content, API, persistence, and baseline applicability before implementation handoff.
- [ ] 6.4 Keep PRD and OpenSpec terminology aligned if lifecycle-state, reviewer terminology, or operational role labels change during planning.
