# Design

## Context

The onboarding PRD at `docs/plans/partner-portal-onboarding-prd.md` documents a broad MVP1 baseline that is already implemented, but it also identifies a recurring operational gap: onboarding data exists without a first-class product workflow for readiness, review, and oversight. Current OpenSpec coverage is narrower than the PRD and focuses mostly on owner-scoped RP application detail work, generic error routing, and a few later feature changes. This change package captures the MVP2 product behavior needed to turn the portal from a functional onboarding tool into a governed onboarding workflow.

The same PRD also makes explicit that governed onboarding must cover environment progression, out-of-band production review traceability, checklist and evidence visibility, and external process links without forcing a full in-portal approval engine into the first slice.

Current workspace, application-information, and workspace-scoped RP application surfaces are now evidenced in code and current specs. This change depends on [openspec/changes/reconcile-prd-current-spec-gaps](../reconcile-prd-current-spec-gaps/proposal.md) only when a slice needs missing dashboard-summary or invitation-management surfaces. Treat that change as a prerequisite only for those slice-specific dependencies, not for the lifecycle, readiness, oversight, or reporting slices.

Relevant standards and baseline impact for planning:

- UI and route design: STD-005, STD-006, STD-007, STD-017.
- API and error contracts: STD-009 and STD-010.
- Persistence and ownership boundaries: STD-020.
- Dashboard and reporting layout: PAT-021, PAT-017, PAT-023.
- Relational schema change path: PAT-012.

## Goals / Non-Goals

**Goals:**

- Define a durable onboarding state model for workspaces, application information records, and RP applications.
- Define environment progression rules and out-of-band promotion traceability for `test`, `staging`, and `production` onboarding steps.
- Define readiness indicators for application information completion.
- Define checklist, evidence-reference, and external process-link visibility needed before production progression.
- Define the platform-admin oversight experience at the requirement level.
- Define aggregate reporting expectations for onboarding throughput, invitation conversion, and secret rotation hygiene.
- Keep role-boundary guidance explicit so workspace membership and invited-developer access are easier to understand.

**Non-Goals:**

- No billing, quotas, or customer invoicing.
- No anonymous self-serve onboarding.
- No formal approval or waiver automation in this change.
- No expansion of invited-developer permissions beyond clearer product guidance.
- No replacement of IBM Security Verify as the underlying identity or runtime application system of record.
- No in-portal volume-spike submission flow, detailed incident workflow, or first-class deprecation workflow automation in this package.
- No code-level role-model rewrite from current implementation roles to the PRD's final operational labels in this package.

## Decisions

### Decision 1: Use a shared onboarding state vocabulary

- Choice: use `draft`, `submitted`, `under_review`, `approved`, and `launched` as the MVP2 state vocabulary for workspaces, application information records, and RP applications.
- Rationale: the PRD already names this progression, and a consistent vocabulary reduces ambiguity across related onboarding artifacts.
- Trade-off: finer-grained oversight-role routing can still change later, but MVP2 keeps reviewed production outcomes under platform-admin ownership.

### Decision 2: Start readiness indicators with application information records

- Choice: add section-level completion indicators and an overall submit-ready signal for application information first.
- Rationale: application information already carries the broadest onboarding context and is the highest-value place to surface incomplete data.
- Trade-off: MVP2 uses these indicators for visibility and review context, not as hard in-portal gates for contact or evidence completeness.

### Decision 3: Treat oversight as an authenticated operational dashboard

- Choice: model the platform-admin oversight experience as an operational area with a compact overview route plus separate queue and reporting routes, instead of one overloaded screen.
- Route plan:
	- `/onboarding-oversight` for the authenticated overview page
	- `/onboarding-oversight/queue` for the filterable review backlog
	- `/onboarding-oversight/reports` for aggregate reporting
- Rationale: STD-006 and PAT-021 allow a dashboard for authenticated repeat users, but multiple user goals still need separate destination routes.
- Trade-off: if a dedicated oversight role is introduced later, route access wiring may expand without changing the route structure.

### Decision 4: Keep role-boundary guidance informational in MVP2

- Choice: add help and guidance content that explains workspace membership, workspace-admin responsibilities, and invited-developer application scope without changing the underlying access model in this change.
- Rationale: the PRD identifies product-copy ambiguity as an immediate problem even without a permission-model redesign.
- Trade-off: future role-matrix changes can build on this requirement without forcing them into the current MVP2 package.

### Decision 5: Start reporting with aggregate operational metrics

- Choice: MVP2 reporting should focus on invitation conversion, secret rotation hygiene, and onboarding throughput, with filterable periods and cross-workspace views.
- Rationale: these are the specific near-term reporting needs named in the PRD and can be satisfied without turning the change into a full analytics platform.
- Default first-release formulas:
	- invitation conversion = accepted invitations / invitations sent in the selected period
	- secret rotation hygiene = count and percent of RP applications with at least one valid rotation event inside the configured policy window
	- onboarding throughput = counts of records entering `submitted`, `approved`, and `launched` during the selected period
- Trade-off: product can still refine formulas later, but this default is concrete enough for first implementation slices.

### Decision 6: Persist workflow state explicitly and keep review notes separate from the core record

- Choice: add explicit onboarding-state fields to each onboarding-owned record type, and model review notes and checklist outcomes as separate related records for application-information review rather than embedding freeform review history inside the core business row.
- Rationale: STD-020 and PAT-012 favor visible ownership, explicit schema review, and audit-friendly related records over hidden JSON drift in primary rows.
- Trade-off: this adds migration and repository work earlier, but keeps the data model reviewable and easier to extend.

### Decision 7: Make environment progression explicit and keep production review out of band

- Choice: treat `test`, `staging`, and `production` as explicit environment-progression steps on workspace-scoped RP application records; allow `test` to be skipped when no IBM configuration change is required; allow `test` to `staging` progression without platform-admin approval; allow RP application creation for `test` and `staging`; and require `staging` to `production` progression to record a portal-visible request that stays review-tracked until a platform-admin user records the out-of-band CanadaLogin decision.
- Rationale: the onboarding PRD makes these rules explicit and they are central to the product's onboarding lifecycle.
- Trade-off: this change captures status and traceability, not a full in-portal approval engine.

### Decision 8: Surface checklist, evidence references, and process links without hard-coding the evidence mechanism

- Choice: make onboarding checklist progress, external evidence references, and external process entry points visible in portal progression views; do not support CATS evidence upload in MVP2.
- Rationale: the PRD requires traceable production readiness, and the current product decision keeps evidence gating outside the portal for this release.
- Trade-off: later implementation can add first-class evidence upload or richer evidence workflows without rewriting the progression model.

## Standards impact

```yaml
standards_impact:
	ui:
		applies: true
		decision: Use the shared app shell plus GC Design System components; use PAT-021 for the authenticated oversight overview, PAT-017 for read-only summaries, and PAT-023 for queue and report tables.
		evidence: Page-pattern decision and route plan recorded in this design before implementation.
		exceptions: []
	accessibility:
		applies: true
		decision: Keyboard, focus, headings, notices, filter controls, and table semantics must be reviewed for overview, queue, and reporting routes.
		evidence: Frontend verification tasks and route-state tests will capture accessible loading, empty, error, and success states.
		exceptions: []
	official_languages:
		applies: true
		decision: All new overview, queue, report, state, checklist, and guidance copy must ship in English and French with route parity.
		evidence: Locale catalogs and UI tests updated for both languages where practical.
		exceptions: []
	security_privacy:
		applies: true
		decision: Reporting, review-note, and promotion-tracking APIs must return only authorized data, use safe error responses, and avoid exposing secrets or sensitive audit detail in aggregate views or oversight detail surfaces.
		evidence: API contract tests and authorization tests for queue, notes, and reports.
		exceptions: []
	identity_access:
		applies: true
		decision: Use platform-admin access for the first slice, and map the PRD's operational role labels incrementally instead of forcing a role-model rewrite in this package.
		evidence: Route guards, backend permission checks, and task notes reflect the chosen oversight actor.
		exceptions: []
	information_management:
		applies: true
		decision: Review notes, checklist outcomes, and lifecycle timestamps are business records that need explicit ownership and auditability.
		evidence: Schema and migration review notes plus tests covering persistence and retrieval.
		exceptions: []
	verification:
		applies: true
		decision: Validate change artifacts, add targeted backend and frontend tests, and capture standards-aware verification for user-facing slices.
		evidence: `make validate-openspec-change`, route/page tests, API tests, and migration review notes.
		exceptions: []
	gc_web_application_baseline:
		applies: true
		decision: Treat this as a meaningful GC web application change and keep baseline impact visible during implementation and verification.
		evidence: Standards impact and baseline applicability recorded here for handoff.
		exceptions: []
```

## Slice Plan

### Slice 0: Residual dependency resolution

- Outcome: this change makes any remaining dashboard-summary or invitation dependency explicit without treating shipped workspace and application-information behavior as missing.
- Dependency: [openspec/changes/reconcile-prd-current-spec-gaps](../reconcile-prd-current-spec-gaps/proposal.md) is resolved only where a slice needs dashboard-summary or invitation surfaces that are not yet current.
- Exit condition: slices 1, 2, 3, and 5 can proceed against current workspace and application-information baselines, and slice 4 has an explicit plan for any invitation-surface dependency.

### Slice 1: Lifecycle state model

- Outcome: workspaces, application information records, and RP applications each carry a visible onboarding state, and environment-progression requests carry target-environment and review-trace metadata where needed.
- Impacted areas: backend schemas, persistence, APIs, frontend lists and detail pages, promotion metadata, tests.
- Notes: use STD-009, STD-010, STD-020, and PAT-012 for API and persistence changes; keep `test`-optional and `staging`-to-`production` review rules explicit.
- Exit condition: state vocabulary, transition rules, timestamps, and promotion-tracking metadata are defined and verified for the three record types.

### Slice 2: Application information readiness indicators

- Outcome: workspace admins can identify incomplete application information sections, checklist items, and external evidence references before submission or production progression.
- Impacted areas: application information schemas, UI summaries, checklist state, process-link surfaces, validation, tests.
- Notes: use PAT-017 for summary displays and GC Design System notices for incomplete-state feedback.
- Exit condition: required sections, checklist visibility, advisory readiness behavior, and production-readiness visibility are defined and testable.

### Slice 3: Platform-admin oversight and review notes

- Outcome: platform-admin users can find records needing review, including production-bound promotion requests, and capture checklist outcomes or notes.
- Impacted areas: `/onboarding-oversight` overview route, `/onboarding-oversight/queue` queue route, list and filter APIs, review-note persistence, promotion-status context, access-control review, tests.
- Notes: use PAT-021 for the overview route and PAT-023 for queue tables.
- Exit condition: review workflow paths, queue behavior, and note/checklist behavior are defined.

### Slice 4: Role-boundary guidance and process links

- Outcome: workspace admins and invited developers can see clearer help content about collaboration boundaries and can reach the required onboarding documentation or external process entry points from the relevant flows.
- Impacted areas: frontend copy, help surfaces, documentation/process-link surfaces, translation files, tests.
- Notes: keep guidance informational and bilingual; do not silently broaden permissions or embed the full external workflow. Invitation-management and acceptance behavior for these surfaces now moves under [openspec/changes/restore-external-developer-invitations](../restore-external-developer-invitations/proposal.md).
- Exit condition: guidance surfaces, documentation/process links, target audiences, and copy ownership are defined in spec and tasks.

### Slice 5: Aggregate onboarding reporting

- Outcome: internal oversight users can review aggregate onboarding, invitation, and secret-hygiene metrics without record-by-record inspection.
- Impacted areas: `/onboarding-oversight/reports` route, reporting queries, APIs, summary widgets, table exports, tests.
- Notes: use PAT-021 for the reports landing content and PAT-023 for any tabular report results.
- Exit condition: metric families, filters, access scope, and default formulas are defined.

## Implementation readiness

- Ready after: Slice 0 has narrowed any remaining dashboard-summary or invitation dependency.
- First recommended implementation order after dependency resolution:
	1. Slice 1 lifecycle state model
	2. Slice 2 application-information readiness
	3. Slice 3 platform-admin oversight and review notes
	4. Slice 5 aggregate reporting
	5. Slice 4 role-boundary guidance
- Current blockers:
	- Slice 4 role-boundary guidance still needs the first-release invited-developer surface list from [openspec/changes/restore-external-developer-invitations](../restore-external-developer-invitations/proposal.md) so guidance matches the implemented access boundary.

## Deferred follow-on areas

- Partner volume-spike notification workflow.
- Detailed incident reporting intake and SLA handling.
- First-class deprecation workflow states, approvals, and notifications beyond initial link-out readiness.

## Open Questions

- Human decision required only if product wants a distinct oversight role after the MVP2 platform-admin default.
- Human decision required: which onboarding checklist items should be shown or highlighted in the first release of platform-admin review notes.
- Human decision required only if the default first-release reporting formulas, selected-period filtering, and CSV export behavior are not acceptable.
