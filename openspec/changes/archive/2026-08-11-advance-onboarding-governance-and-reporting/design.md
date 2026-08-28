# Design

## Context

The onboarding PRD at `docs/plans/partner-portal-onboarding-prd.md` documents a broad MVP1 baseline that is already implemented, but it also identifies a recurring operational gap: onboarding data exists without a first-class product workflow for readiness, review, and oversight. Current OpenSpec coverage is narrower than the PRD and focuses mostly on owner-scoped RP application detail work, generic error routing, and a few later feature changes. This change package captures the MVP2 product behavior needed to turn the portal from a functional onboarding tool into a governed onboarding workflow.

The same PRD also makes explicit that governed onboarding must cover environment progression, out-of-band production review traceability, checklist and evidence visibility, and external process links without forcing a full in-portal approval engine into the first slice.

Current workspace, application-information, workspace-scoped RP application, dashboard-summary, and invitation surfaces are now evidenced in code and current specs. When a slice needs those surfaces, use [openspec/specs/partner-portal-access-and-dashboard/spec.md](../../specs/partner-portal-access-and-dashboard/spec.md) and [openspec/specs/partner-portal-external-developer-invitations-and-scoped-access/spec.md](../../specs/partner-portal-external-developer-invitations-and-scoped-access/spec.md) as the current dependency references rather than the archived reconciler change.

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
- Define aggregate reporting expectations for onboarding throughput, invitation conversion, and secret rotation hygiene, including who can read those reports in the first release.
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

- Choice: MVP2 reporting should focus on invitation conversion, secret rotation hygiene, and onboarding throughput, with filterable periods, cross-workspace views for platform-admin users, and partner-scoped views for `RP Admin`, `RP User (Edit)`, and `Read Only` users.
- Rationale: these are the specific near-term reporting needs named in the PRD and can be satisfied without turning the change into a full analytics platform, while the report content itself stays stable as access broadens.
- Default first-release formulas:
	- invitation conversion = accepted invitations / invitations sent in the selected period
	- secret rotation hygiene = count and percent of RP applications with at least one valid rotation event inside the configured policy window
	- onboarding throughput = counts of records entering `submitted`, `approved`, and `launched` during the selected period
- Default first-release access posture:
	- platform-admin users retain cross-workspace and cross-department reporting visibility
	- `RP Admin`, `RP User (Edit)`, and `Read Only` users may read the same report families only for their granted partner scope
	- a dedicated partner-reporting role remains follow-on scope and may later replace this temporary all-partner visibility without redefining the metric families or export shape
- Trade-off: product can still refine formulas later, but this default is concrete enough for first implementation slices and requires scope-aware authorization on the shared reporting surface.

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

## Slice 1 backend contract sketch

### DTO updates

- Reuse the existing resource-specific schema modules instead of adding a new onboarding aggregate DTO family.
- Extend `backend/src/app/schemas/workspace.py:WorkspaceRead` with a shared lifecycle summary:
	- `onboarding_state`
	- `submitted_at`
	- `under_review_at`
	- `approved_at`
	- `launched_at`
- Extend `backend/src/app/schemas/application_information.py:ApplicationInformationRead` with the same lifecycle summary so workspace-scoped list and detail reads expose workflow state without a second lookup.
- Extend `backend/src/app/schemas/rp_application.py:RPApplicationRead` with:
	- the shared lifecycle summary
	- `promotion_target_environment`
	- `promotion_status`
	- `promotion_external_reference`
	- `promotion_reviewed_by_user_uuid`
	- `promotion_reviewed_by_team`
	- `promotion_requested_at`
	- `promotion_reviewed_at`
	- `promotion_decided_at`
- Extend the current-user RP application read models that back partner detail surfaces with read-only workflow context instead of duplicating it only on workspace-admin screens:
	- `RPApplicationCurrentUserRead` should expose `onboarding_state`, `canada_login_environment`, and a condensed promotion-status summary.
	- `RPApplicationCurrentUserOAuthSetupRead` should expose the same read-only workflow summary needed on the current-user detail page header.
- Keep the existing business-edit payloads focused on domain content:
	- `WorkspaceUpdate`
	- `ApplicationInformationUpdate`
	- `WorkspaceRPApplicationRegistrationUpdate`
	These payloads should not accept review-state writes directly.
- Add explicit governance-write DTOs instead of overloading the generic PATCH models:
	- a shared `OnboardingLifecycleTransitionRequest` with `target_state` and optional review note or rationale metadata
	- an RP-application `PromotionRequestUpsert` payload for workspace-admin submission or resubmission
	- an RP-application `PromotionReviewUpdate` payload for platform-admin review outcomes

### Persistence updates

- Add the shared lifecycle columns to the core onboarding-owned tables so the current state and milestone timestamps remain queryable on the primary rows for workspaces, application information records, and RP applications.
- Keep promotion-trace metadata in a related RP-application progression record rather than flattening every review field onto the base RP-application row. The first-release persistence shape should support one current promotion-request record per RP application and target environment while still leaving room for later history expansion.
- Keep review notes and checklist outcomes separate from the core application-information row, consistent with Decision 6.

### API contract updates

- Continue using the existing list and detail reads as the primary read contract surface:
	- `GET /workspaces`
	- `GET /workspaces/mine`
	- `GET /workspaces/{workspace_uuid}`
	- `GET /workspaces/{workspace_uuid}/application-information`
	- `GET /workspaces/{workspace_uuid}/application-information/{application_information_uuid}`
	- `GET /workspaces/{workspace_uuid}/applications`
	- `GET /workspaces/{workspace_uuid}/applications/{rp_application_uuid}`
	- `GET /api/v1/rp-applications/mine`
	- the current-user RP-application detail reads that already back department and OAuth setup pages
- Add dedicated transition subresources so lifecycle state changes stay auditable and do not blend into ordinary content edits:
	- `POST /workspaces/{workspace_uuid}/onboarding-state`
	- `POST /workspaces/{workspace_uuid}/application-information/{application_information_uuid}/onboarding-state`
	- `POST /workspaces/{workspace_uuid}/applications/{rp_application_uuid}/onboarding-state`
- Add a dedicated RP-application promotion subresource for production-trace metadata:
	- `GET /workspaces/{workspace_uuid}/applications/{rp_application_uuid}/promotion-request`
	- `POST /workspaces/{workspace_uuid}/applications/{rp_application_uuid}/promotion-request` for create or resubmit by the workspace-side actor
	- `PATCH /workspaces/{workspace_uuid}/applications/{rp_application_uuid}/promotion-request` for the platform-admin review outcome update
- Return the updated resource read model from transition and promotion writes so clients can refresh the same page state without a second ad hoc contract.
- Keep secret-management, invitation-management, and MAU-report subresources out of the lifecycle write path; they may consume read-only state or promotion summary data later, but they are not the mutation surface for onboarding governance.

## Slice 1 migration and repository update plan

### Alembic sequence

1. Expand revision: add lifecycle and promotion-trace structures without breaking existing rows.
	- Add nullable `onboarding_state`, `submitted_at`, `under_review_at`, `approved_at`, and `launched_at` columns to `workspace`, `application_information`, and `rp_application`.
	- Add state indexes that support immediate list and detail filtering needs. Keep broader queue-optimization composites reviewable for the later oversight slice once the final filter matrix is fixed.
	- Create a new `rp_application_promotion_request` table keyed to `rp_application_id` plus `target_environment` for the first-release one-current-request-per-target-environment rule.
	- Give the promotion-request table explicit foreign keys, bounded string columns, audit timestamps, and soft-delete fields because the review-trace record is operationally meaningful.
	- Keep the API nested under the RP application resource, so the first release does not need a separately exposed public UUID for the promotion-request record.
2. Backfill revision: populate safe initial values for pre-existing rows.
	- Backfill lifecycle state through a reviewable repo-owned migration step after the implementation slice defines the accepted legacy-state mapping.
	- Do not synthesize production-review timestamps, reviewer identity, or external reference values when the historical source of truth does not exist.
	- Allow milestone timestamps to remain null when the portal cannot prove the historical event time, even after the state value itself has been backfilled.
3. Contract revision: make the new lifecycle state canonical after backfill verification.
	- Set `onboarding_state` to non-null with the runtime default `draft` for new records only after the backfill step is verified.
	- Tighten any remaining indexes or uniqueness rules needed by the final promotion-request query shape.
	- Remove temporary null-tolerant service or schema fallbacks once all existing rows have canonical lifecycle state.

### Repository updates required by STD-020 and PAT-012

- SQLAlchemy models:
	- update `backend/src/app/models/workspace.py`
	- update `backend/src/app/models/application_information.py`
	- update `backend/src/app/models/rp_application.py`
	- add `backend/src/app/models/rp_application_promotion_request.py`
- Pydantic schemas:
	- update `backend/src/app/schemas/workspace.py`
	- update `backend/src/app/schemas/application_information.py`
	- update `backend/src/app/schemas/rp_application.py`
	- add promotion-request read and write schemas alongside the RP-application contract
- Service and repository layer:
	- extend workspace-owned CRUD and service flows for lifecycle reads and transition writes in `WorkspaceService`
	- extend current-user RP-application read flows in `RPApplicationService` for read-only state visibility
	- add a persistence adapter for the promotion-request record and keep route handlers out of direct persistence rules
- API surface:
	- update the existing workspace router resource handlers in `backend/src/app/api/v1/workspaces.py`
	- update the current-user RP-application router in `backend/src/app/api/v1/rp_applications.py` only where read-only state visibility is needed
- Tests:
	- migration-adjacent checks for new columns, constraints, and downgrade expectations
	- service tests for lifecycle transitions, promotion request creation or resubmission, and platform-admin review updates
	- API tests for new transition and promotion subresources plus authorization boundaries

### Migration review notes

- Follow PAT-012 expand/backfill/contract sequencing because the new lifecycle fields affect existing rows.
- Review generated Alembic code for nullability, indexes, foreign keys, soft-delete semantics, and unintended data loss before commit.
- Keep using the repo's active numeric revision chain after `0015_rp_application_developer_invitation_schema.py`; the next `0016`-series revisions remain well within the `alembic_version.version_num` capacity already widened earlier in the live chain.
- Use the repo's Alembic path as the canonical schema-management mechanism, and treat `ALEMBIC_DRY_RUN=1` as generation-only support rather than as evidence that the PostgreSQL migration path is safe to apply.

## Slice 1 frontend state presentation requirements

- Reuse the existing authenticated workspace and current-user route structure; this slice does not add a new page shell or separate lifecycle route family.
- Workspace-admin surfaces should show the full lifecycle state vocabulary and, where relevant, production progression metadata.
	- `/workspaces` and `/workspaces/$workspaceUuid` should show a compact lifecycle badge or status label in list and header contexts.
	- `/workspaces/$workspaceUuid/application-information` and `/workspaces/$workspaceUuid/application-information/$applicationInformationUuid` should show the current lifecycle state prominently near the page title and reserve readiness detail for Slice 2.
	- `/workspaces/$workspaceUuid/applications` and `/workspaces/$workspaceUuid/applications/$rpApplicationUuid` should show both lifecycle state and environment progression context, including target-environment and promotion-status summaries when a production progression request exists.
- Current-user partner surfaces should show only condensed read-only state context.
	- `/your-applications` should expose each RP application's environment and a compact lifecycle or promotion summary in the card or list presentation.
	- `/your-applications/$rpApplicationUuid` and the OAuth setup header should expose read-only lifecycle or promotion status so partner users can see where the onboarding path stands without opening an internal workspace-admin screen.
	- Current-user partner views must not expose reviewer identity, reviewer team, or internal-only note metadata even when the backend read contract carries richer workspace-admin detail.
- Transition actions belong only on workspace-admin and platform-admin surfaces.
	- Workspace-admin pages may later surface submit or resubmit controls near the lifecycle summary.
	- Current-user `/your-applications/**` pages remain informational; they do not gain review-state mutation controls in this slice.
- Presentation style should stay consistent with PAT-017 summary behavior and existing page headers.
	- Use a plain-language badge, tag, or notice label for the lifecycle state.
	- Show milestone timestamps as secondary metadata, not as the primary title treatment.
	- Use concise explanatory copy when a production-bound RP application is waiting on external review traceability.
- Loading, empty, and error behavior should follow the current route conventions.
	- The new lifecycle summary must not replace existing empty states.
	- If lifecycle or promotion metadata is unavailable during rollout, the UI should degrade to a neutral status placeholder rather than implying approval or launch.

## Slice 1 verification targets

### Backend coverage

- Extend `backend/tests/test_workspace_service.py` and `backend/tests/test_workspaces.py` to prove:
	- workspace list and detail reads expose the lifecycle summary
	- workspace-scoped application information list and detail reads expose the lifecycle summary
	- workspace-scoped RP-application list and detail reads expose lifecycle and promotion metadata
	- unauthorized actors cannot move records into review-only states
- Extend `backend/tests/test_workspace_rp_application_registration_schema.py` and `backend/tests/test_application_information_schema.py` to validate the new schema fields and reject unexpected governance-write payload shapes.
- Add focused backend tests for the new transition and promotion subresources so representative flows are covered:
	- draft to submitted transition by the workspace-side actor
	- submitted to under-review or approved progression by a platform-admin actor
	- staging to production promotion request create or resubmit
	- platform-admin review outcome update with external reference retention
	- safe not-found or forbidden behavior for unauthorized transition attempts

### Frontend coverage

- Extend `frontend/tests/unit/pages/WorkspacesPage.test.tsx` and `frontend/tests/unit/pages/WorkspaceDetailPage.test.tsx` to assert lifecycle badges or summary metadata on workspace list and header surfaces.
- Extend `frontend/tests/unit/pages/WorkspaceApplicationsListPage.test.tsx` and `frontend/tests/unit/pages/WorkspaceApplicationDetailPage.test.tsx` to assert lifecycle state, environment progression context, and production-review summaries.
- Extend `frontend/tests/unit/pages/YourApplicationsPage.test.tsx` and `frontend/tests/unit/pages/YourApplicationsOAuthSetupPage.test.tsx` to assert condensed read-only lifecycle or promotion state on partner-facing views.
- Add negative UI assertions proving current-user partner views do not expose internal reviewer identity, reviewer team, or transition controls.
- Add rollout-state coverage proving the UI shows a neutral placeholder when lifecycle metadata is absent instead of rendering a misleading approved or launched label.

### Focused local verification commands

- Backend: run the targeted pytest slice that covers workspace service, workspace API, application-information schema, and RP-application registration schema once implementation exists.
- Frontend: run the targeted Vitest page tests for the workspace and current-user route surfaces listed above once lifecycle rendering is implemented.

## Slice 2 readiness input set

- Use the existing application-information model as the primary readiness source, grouped into the following advisory sections:
	- service identity: `service_name_en` and `service_name_fr`
	- business and user context: `overview` and `usage`
	- technical integration details: `technology_and_protocol`
	- security posture: `security_and_privacy`
	- migration or transition planning: `migration_or_transition_plan`
- Use `ApplicationInformationContact` records as the contact-readiness source.
	- First-release readiness checks should confirm whether at least one active contact record exists and whether each visible contact has complete bilingual name, responsibility, and email fields.
	- The unresolved contact-type gate from the PRD remains out of scope for MVP2 hard gating, so missing stage-specific contact-role coverage stays advisory until product finalizes that policy.
- Show the following checklist families as advisory readiness inputs before submission or production progression:
	- application information section completeness
	- contact presence and completeness
	- RP-application registration exists for the selected environment path
	- promotion-request metadata exists when the record is preparing for `staging` to `production` progression
	- external evidence reference status is present for production-bound progression
	- external process links for the required review or approval path are available from the current screen
- Treat external evidence references as reference-only status in the first release.
	- The portal should display whether a production-bound record has an external evidence reference recorded.
	- The first release should not require in-portal evidence upload.
	- CATS readiness stays visible as an advisory reference or status signal because the PRD still leaves the final collection mechanism open.
- Keep all of these inputs advisory in Slice 2.
	- Missing sections, contacts, checklist entries, or external evidence references should lower readiness and produce visible warnings.
	- These gaps should not block save or submission solely inside Partner Portal for MVP2 unless a later approved slice changes that rule.

## Slice 2 completion-indicator behavior

- Section-level readiness should use a small shared status vocabulary:
	- `not_started`: the section or readiness family has no usable data yet
	- `incomplete`: some data exists, but one or more required inputs for that family are still missing
	- `complete`: the family has the expected first-release data for its current scope
- Application-information sections should evaluate independently so the user can see exactly which part of the record needs attention.
- Contact readiness should be summarized separately from the main narrative sections because the contact-type gate remains unresolved and advisory.
- Checklist and external evidence-reference readiness should remain advisory families that can surface `incomplete` or `not_started` without blocking the underlying record from being saved or submitted.
- Overall readiness should be split into two advisory summaries rather than one overloaded boolean:
	- `submit_ready`: true only when the application-information narrative sections are complete and at least one complete active contact exists
	- `production_readiness_attention`: true when any production-bound checklist or external evidence-reference family is still `not_started` or `incomplete`
- Missing external evidence-reference context should be treated as “attention required,” not as implicit rejection.
	- Non-production paths may surface the evidence family as not required.
	- Production-bound paths should surface the missing reference as an advisory warning and keep the record visibly below production-ready status.
- When a record is incomplete, the UI should explain what is missing in plain language and keep the latest saved data intact.
- When a record becomes complete, the portal should update both the section indicators and the overall readiness summary without requiring a separate review workflow to recalculate those advisory states.

## Slice 2 summary and feedback pattern

- Use PAT-017 structures for the read-only readiness summary rather than inventing a custom dashboard card treatment.
	- Show overall readiness facts for one application-information record as a description list near the page header.
	- Show repeated section or checklist-family statuses as a semantic list of short item summaries, each with a section label, current status, and brief next-step text when incomplete.
	- Reserve tables for the later oversight queue and reports, not for the per-record readiness summary.
- Use GC Design System feedback components through the PAT-020 status-and-feedback rules.
	- Use `GcdsNotice` with `notice-role="warning"` for advisory missing readiness inputs that the user should address.
	- Use `GcdsNotice` with `notice-role="info"` to explain that checklist and evidence gaps remain external gates for MVP2.
	- Use ordinary page content, not an error summary, for empty or not-started readiness families.
	- Keep `GcdsErrorSummary` and field-level validation treatment for actual form submission errors, not for read-only advisory readiness signals.
- Keep the readiness display visually quiet and scannable.
	- Prefer short labels, dividers, and consistent status placement over nested cards or decorative tiles.
	- Keep warning notices at the section scope they affect so one page-level notice does not replace all local context.
- The itemized summary must work on desktop and mobile without hiding the relationship between the section name, status, and next step.

## Slice 2 submission and progression behavior

- Saving application-information content should continue to use the ordinary create and update flows. Advisory readiness gaps do not make save itself invalid.
- Submission attempts for incomplete application-information records should succeed when the underlying request payload is otherwise valid, but the resulting read model should still show the incomplete section, contact, checklist, or evidence-reference indicators.
- The UI should warn, not block, when a user submits or continues with incomplete readiness.
	- Show a warning notice that explains what remains incomplete.
	- Keep the record in a valid saved state and preserve the user’s latest content.
	- Link the warning back to the relevant readiness section summaries when possible.
- Production-progression requests should follow the same advisory rule for readiness gaps.
	- A `staging` to `production` request may be created or resubmitted when the request payload itself is valid, even if checklist or external evidence-reference inputs are incomplete.
	- The resulting progression record must remain visibly below approved or launched status until review-trace data exists.
	- Missing checklist or evidence-reference inputs should surface as warnings that tell the partner user what still needs attention before external review is likely to succeed.
- API behavior should distinguish advisory incompleteness from true validation failure.
	- Use normal success responses for accepted saves, submissions, and production-progression requests that still carry advisory readiness gaps.
	- Reserve 4xx validation errors for malformed or missing required request fields, not for advisory readiness warnings.
	- Include the refreshed readiness summary in the write response or immediate follow-up read so the UI can render warnings without inventing client-only rules.
- Platform-admin review flows remain stricter than workspace-admin submission flows.
	- Review outcomes still cannot move a record to `approved` or `launched` without the required out-of-band review trace.
	- The portal may accept a submitted record with advisory gaps, but it must not misrepresent the record as production-ready.

## Slice 2 verification targets

### Backend coverage

- Extend application-information and workspace service or API tests to prove:
	- incomplete application-information records still save and submit when the request payload is valid
	- advisory readiness fields remain present after submit or resubmit
	- production-progression requests with missing checklist or evidence-reference inputs remain accepted but do not appear approved or launched
	- malformed progression or transition payloads still fail with the normal validation contract

### Frontend coverage

- Extend application-information detail and edit page tests to prove:
	- incomplete sections show warning notices and section summaries
	- submit or continue actions do not become hard blocked solely because advisory readiness is incomplete
	- saved content remains visible after warning-state submissions
- Extend workspace RP-application detail coverage to prove:
	- production-progression warnings appear when checklist or evidence-reference inputs are incomplete
	- the UI does not label the record approved or launched without review-trace metadata

### Focused local verification commands

- Backend: run targeted pytest coverage for application-information schema, workspace service, workspace API, and production-progression service or API behavior once implementation exists.
- Frontend: run targeted Vitest coverage for application-information detail and edit pages plus workspace RP-application detail pages once readiness messaging is implemented.

## Slice 3 oversight queue structure

- The first-release queue is a cross-workspace backlog for platform-admin triage, not a full analytics surface.
- The queue should support these first-release filters:
	- onboarding lifecycle state
	- record type (`workspace`, `application_information`, `rp_application`, `production_progression`)
	- department
	- workspace
	- current environment or target environment when the row represents RP-application progression
	- promotion status for production-bound records
- The first-release queue should use a small stable column set:
	- record type
	- primary record label
	- workspace
	- department
	- lifecycle state
	- environment or target environment when applicable
	- promotion status when applicable
	- external review reference when applicable
	- last meaningful timestamp (`submitted_at`, `under_review_at`, `requested_at`, or `updated_at`, depending on row type)
	- row action
- Row actions should stay simple:
	- open the relevant workspace, application-information, or RP-application detail route
	- preserve queue filter state when the user returns to the backlog
	- avoid inline editing or bulk actions in the queue itself for the first release
- Record-detail context reached from the queue should show enough metadata to explain why the row is in the backlog:
	- lifecycle state
	- readiness summary or checklist warnings when applicable
	- promotion-request summary and external reference when applicable
	- any stored review note context once the review-note slice lands

## Slice 3 PAT-023 table behavior

- Use a dedicated queue table on `/onboarding-oversight/queue` instead of embedding the full backlog on the overview route.
- Treat the queue as genuinely tabular data under PAT-023 because users compare the same facets across multiple records.
- Use a quiet GC-aligned table with:
	- a clear caption or nearby heading
	- a stable row header based on the primary record label
	- visible text placeholders such as `Not applicable` or `-` for missing environment, promotion, or external-reference fields
	- status text, not colour alone, for lifecycle and promotion state
- Default sort should surface the most actionable work first.
	- prioritize `under_review` and `submitted` ahead of `draft`, `approved`, and `launched`
	- break ties by the newest relevant workflow timestamp first
- Filtering and pagination should be enabled because the oversight backlog is cross-workspace and likely to exceed a small single-page summary.
- Queue filter and pagination state should be preserved in the route state or URL so a platform-admin user can open a detail route and return to the same backlog position.
- The queue must define loading, empty, error, unauthorized, and partial-data states.
	- empty should explain that no records currently match the selected filters
	- unauthorized should use safe wording and avoid implying hidden record existence
	- partial data should label any stale or unavailable summary field instead of silently dropping the row

## Slice 3 review-note and checklist behavior

- The canonical editable review surface is the application-information review context, consistent with the spec requirement that review notes and checklist outcomes attach to application-information records.
	- Queue rows for `application_information` records should link directly to the application-information detail route where the internal review panel lives.
	- Queue rows for `workspace`, `rp_application`, or `production_progression` records may show derived readiness or promotion metadata, but they should not create a separate first-release note thread on those rows.
	- When an RP-application progression row needs note-driven context, the queue should link to the related application-information review context when one exists and otherwise rely on promotion-request metadata only.
- Platform-admin users, corresponding to the PRD's CL Admin oversight actor for MVP2, should have the following internal review rights:
	- view the full review-note history and current checklist outcome summary for submitted, under-review, approved, and launched application-information records
	- append a new internal review note with author and timestamp metadata
	- update the structured checklist outcome summary and review disposition for a submitted or under-review record
	- record rationale when moving a record into `under_review`, returning it for rework, or marking the checklist outcome complete enough for the next workflow step
- Review-note persistence should stay audit-friendly.
	- Prefer append-only note entries with explicit author and timestamp metadata instead of silently overwriting the prior note body.
	- Keep the latest structured checklist outcome separately queryable so queue and detail reads can show the current review posture without replaying the whole note history.
- The first-release checklist outcome set should mirror the advisory readiness families from Slice 2 so internal review uses the same vocabulary the partner-facing record already summarizes:
	- application-information section completeness
	- contact completeness
	- environment registration coverage
	- production-promotion metadata completeness when applicable
	- external evidence-reference status
	- external process-link readiness
- Visibility must stay role-bounded.
	- Internal review note bodies, checklist reviewer identity, and review rationale are visible only to authorized internal oversight users.
	- Workspace-admin and invited-developer users continue to see lifecycle state, advisory readiness summaries, and promotion-request status on their own records, but they do not see internal review note bodies or reviewer-only checklist commentary.
- CL Admin metadata-only visibility must remain broad enough for oversight while preserving the PRD's secret boundary.
	- Allowed metadata-only destinations include `/onboarding-oversight`, `/onboarding-oversight/queue`, `/onboarding-oversight/reports`, workspace detail routes, application-information list and detail routes, and workspace-scoped RP-application list and detail routes that expose onboarding state, promotion status, external review reference, and checklist summary metadata.
	- Excluded destinations include owner-scoped current-user credential and secret-management routes under `/your-applications/**` plus any API or UI surface that reveals current or rotated RP secret values or offers reveal, regenerate, create, or delete secret actions.
	- Aggregate reporting may include secret-rotation hygiene metrics, but only as counts, rates, or status buckets that do not expose record-level secret material.
- The review panel and queue summaries should define full state handling.
	- loading: show that review-note history or checklist status is still being retrieved
	- empty: explain that no internal review note has been recorded yet
	- unauthorized: hide the panel and return the standard safe denial contract
	- stale or partial data: show the latest available checklist summary with a warning rather than implying a completed review

## Slice 3 verification targets

### Backend coverage

- Add a focused oversight API test module, such as `backend/tests/test_onboarding_oversight_api.py`, for:
	- cross-workspace queue filtering by lifecycle state, record type, department, workspace, environment, and promotion status
	- safe unauthorized responses for users without oversight access
	- metadata-only RP-application detail payloads for oversight actors, including omission of current and rotated secret values
	- review-note and checklist write success for authorized platform-admin actors and denial for unauthorized users
- Add a focused service or repository test module, such as `backend/tests/test_onboarding_oversight_service.py`, for:
	- derived queue row shaping across application-information and RP-application progression records
	- latest checklist summary retrieval without replaying note history in every caller
	- append-only review-note persistence and audit metadata retention
- Extend `backend/tests/test_application_information_schema.py` to validate review-note and checklist write payload shapes and reject unexpected secret-related fields.
- Extend `backend/tests/test_rp_application_oauth_setup.py` with regression coverage proving CL Admin or other oversight-only actors cannot use current-user secret or rotated-secret endpoints unless they separately hold the required workspace-scoped grant.

### Frontend coverage

- Add `frontend/tests/unit/pages/OnboardingOversightPage.test.tsx` for overview summaries, high-priority work indicators, and safe empty or error states.
- Add `frontend/tests/unit/pages/OnboardingOversightQueuePage.test.tsx` for filter wiring, PAT-023 table rendering, pagination-state preservation, and queue-row navigation back from detail routes.
- Extend `frontend/tests/unit/pages/ApplicationInformationDetailPage.test.tsx` for the internal review panel so authorized oversight users can record checklist outcomes or notes while workspace-admin users do not see internal-only review commentary.
- Add `frontend/tests/unit/pages/OnboardingOversightReportsPage.test.tsx` once reporting UI exists so metric summaries, report tables, and invalid-filter recovery are covered from the start.

### Focused local verification commands

- Backend: run the targeted pytest modules for the new oversight API and service coverage plus the touched schema or RP-application secret-regression tests once implementation exists.
- Frontend: run the targeted Vitest page tests for the oversight overview, queue, reports, and application-information detail review-panel coverage once the routes and components land.

## Slice 4 role-boundary guidance surfaces and process links

- Keep guidance inside existing task pages and status notices rather than introducing a separate help-only route for MVP2.
- Guidance placement should follow the actual branch points between workspace membership, invitation-backed current-user access, and internal oversight:
	- `/workspaces/$workspaceUuid/application-information/$applicationInformationUuid`
		- audience: workspace-admin users preparing onboarding data
		- purpose: explain that application information, contacts, checklist readiness, and external process references belong to workspace-owned onboarding management
		- links: onboarding documentation, CATS or evidence-reference guidance, production review process overview when the record is production-bound
	- `/workspaces/$workspaceUuid/applications/$rpApplicationUuid`
		- audience: workspace-admin users managing one environment registration and CL Admin users who need metadata-only review context
		- purpose: explain which tasks stay on workspace-scoped administration routes, which collaboration tasks may route into invitation management, and which production-progression actions remain externally reviewed
		- links: invitation-management entry point, production review process, onboarding support or ticket flow
	- `/your-applications` and `/your-applications/$rpApplicationUuid`
		- audience: workspace members and invited developers using current-user RP-application scope
		- purpose: explain that the current-user area is for RP-application configuration and status inside the user's granted partner scope, not for workspace administration, application-information editing, or CL Admin review work
		- links: partner-facing onboarding guidance, support or ticket flow, environment-specific help, invitation-scope explanation when the session includes invitation-backed access, and the aggregate onboarding reports route when the caller has reporting visibility
	- `/invitations/rp-applications/$token`
		- audience: invited developers during acceptance
		- purpose: explain that acceptance grants partner-scoped current-user access only, does not create workspace membership, and does not require department self-setup
		- links: post-acceptance dashboard destination and onboarding help
	- `/onboarding-oversight` and `/onboarding-oversight/queue`
		- audience: platform-admin or CL Admin oversight users
		- purpose: explain that these routes provide metadata and status for cross-workspace review, while current or rotated RP secret values remain available only on authorized partner current-user secret-management routes
		- links: production review process, checklist guidance, and reporting help
	- `/onboarding-oversight/reports`
		- audience: platform-admin users plus first-release partner-side reporting readers
		- purpose: expose the same aggregate onboarding report families to authorized readers while constraining partner-side users to their granted scope and keeping queue or review-note workflows internal-only
		- links: reporting help, production review process, and partner-facing onboarding guidance when the caller is a partner-side reader
- The first-release process-link set should remain intentionally small:
	- onboarding documentation or task guidance
	- production review or approval process entry
	- CATS or external evidence-reference guidance
	- support or ticketing entry point when the user needs assistance outside the portal

## Slice 4 bilingual guidance copy and parity expectations

- Add route-scoped bilingual copy rather than one generic paragraph reused everywhere.
- Initial English and French guidance strings should cover the following reusable messages:
	- Workspace-admin guidance block
		- English title: `Workspace onboarding tasks`
		- English body: `Use this workspace area to maintain application information, contacts, and environment-specific onboarding records. Invited developers use the current-user application area and do not receive workspace membership from an invitation.`
		- French title: `Taches d'integration de l'espace de travail`
		- French body: `Utilisez cette section de l'espace de travail pour gerer les renseignements sur l'application, les contacts et les enregistrements d'integration propres a l'environnement. Les developpeurs invites utilisent l'espace des applications de l'utilisateur courant et n'obtiennent pas l'adhesion a l'espace de travail a partir d'une invitation.`
	- Current-user guidance block
		- English title: `Your RP application access`
		- English body: `This area shows the RP applications available in your granted partner scope. Use workspace routes for application-information updates, workspace membership, or internal onboarding review.`
		- French title: `Votre acces aux applications RP`
		- French body: `Cette section affiche les applications RP offertes dans la portee de partenaire qui vous a ete accordee. Utilisez les routes de l'espace de travail pour les mises a jour des renseignements sur l'application, l'adhesion a l'espace de travail ou l'examen interne de l'integration.`
	- Invitation-acceptance guidance block
		- English title: `Invitation access confirmed`
		- English body: `Your invitation gives you access only to the partner-scoped RP application experience. It does not create workspace membership or require department setup.`
		- French title: `Acces par invitation confirme`
		- French body: `Votre invitation vous donne acces seulement a l'experience d'application RP liee au partenaire. Elle ne cree pas d'adhesion a l'espace de travail et n'exige pas la configuration d'un ministere.`
	- CL Admin oversight guidance block
		- English title: `Oversight access is metadata-only`
		- English body: `Use this oversight area to review onboarding status, checklist outcomes, and promotion references across workspaces. RP secret values remain available only to authorized partner users on current-user credential routes.`
		- French title: `L'acces de supervision est limite aux metadonnees`
		- French body: `Utilisez cette section de supervision pour examiner l'etat de l'integration, les resultats de liste de controle et les references de promotion dans les espaces de travail. Les valeurs secretes RP demeurent accessibles uniquement aux utilisateurs partenaires autorises dans les routes d'identifiants de l'utilisateur courant.`
- Initial bilingual link-label set:
	- `Open onboarding guidance` / `Ouvrir les directives d'integration`
	- `Open production review process` / `Ouvrir le processus d'examen de la production`
	- `Open CATS evidence guidance` / `Ouvrir les directives relatives aux preuves CATS`
	- `Submit a support request` / `Soumettre une demande de soutien`
	- `Manage partner invitations` / `Gerer les invitations des partenaires`
- Parity expectations under STD-017:
	- Every new English guidance title, body, notice, and link label must ship with a French equivalent in the same locale namespace.
	- Equivalent guidance must appear on the same route family in both languages, with the header language toggle pointing to the matching localized route.
	- If an external system or document is not bilingual, the in-portal link label and helper text must still be bilingual and should warn the user before leaving the portal for a unilingual destination.
	- Empty, loading, and error states for the guidance surfaces must keep English and French parity, not just the success path.

## Slice 4 verification targets and follow-on boundary

- Frontend verification targets:
	- extend `frontend/tests/unit/pages/ApplicationInformationDetailPage.test.tsx` for workspace-admin guidance text and process-link visibility
	- extend `frontend/tests/unit/pages/WorkspaceApplicationDetailPage.test.tsx` for workspace-admin versus CL Admin metadata-only guidance and link placement
	- extend `frontend/tests/unit/pages/YourApplicationsPage.test.tsx` and `frontend/tests/unit/pages/YourApplicationsOAuthSetupPage.test.tsx` for current-user guidance text, invitation-scope help, and hidden workspace-admin-only actions
	- extend `frontend/tests/unit/pages/RPApplicationInvitationPage.test.tsx` for invitation-acceptance guidance and no-department-setup messaging
	- add locale-parity assertions for the new guidance keys in the English and French translation bundles
- Review fixtures are useful if the guidance blocks or process-link notices become shared components; capture at least desktop and mobile states once implementation exists.
- Keep the following PRD items explicitly out of the MVP2 implementation boundary while preserving discoverability through guidance or follow-on notes:
	- partner volume-spike notification workflow
	- incident reporting workflow
	- deprecation workflow automation
- First-release treatment for those deferred items:
	- provide contextual guidance or external process links when a current onboarding route is the natural place to tell the user what happens next
	- do not add new in-portal forms, lifecycle states, queue categories, or approval automations for those workflows in this change
	- preserve the deferred scope in proposal, tasks, and later review notes so the PRD gap remains visible for a future dedicated change

## Slice 5 metric definitions

- Keep the default first-release metrics from Decision 5 and make the period semantics explicit.
	- invitation conversion: accepted invitations divided by invitations sent during the selected period, with the response clearly echoing the period start and end dates used for the calculation
	- secret rotation hygiene: count and percent of in-scope RP applications that have at least one valid rotation event inside the configured policy window measured relative to the report end date
	- onboarding throughput: counts of onboarding-owned records entering `submitted`, `approved`, and `launched` during the selected period
- Treat the selected period as required for all three report families.
	- first release should support explicit `start_date` and `end_date`
	- the response should echo the normalized applied period so the UI can label the results consistently
- Keep report results aggregate-only.
	- no report row should expose raw RP secret material, current secret values, rotated secret values, or unrestricted record-level invitation identities
	- when a metric needs drill-down later, record that as a future report expansion instead of leaking record detail into the first release

## Slice 5 backend reporting contract and query expectations

- Add a dedicated reporting read surface under the existing oversight route family rather than overloading workspace or current-user APIs.
	- `GET /api/v1/onboarding-oversight/reports`
	- `GET /api/v1/onboarding-oversight/reports/export`
- Use one shared filter shape across report families:
	- required: `metric`, `start_date`, `end_date`
	- optional first-release filters: `workspace_uuid`, `department_id`, `environment`, `group_by`
	- supported `metric` values: `onboarding_throughput`, `invitation_conversion`, `secret_rotation_hygiene`
	- supported `group_by` values should stay intentionally small, such as `day`, `week`, and `month`
- Authorization and scope rules should differ by reporting reader type while keeping the report definitions the same.
	- platform-admin users may use the full first-release cross-workspace filter set
	- `RP Admin`, `RP User (Edit)`, and `Read Only` users may read the same metric families only for their granted partner scope
	- partner-side readers must not use filters to expand beyond granted partner scope; out-of-scope `workspace_uuid` or `department_id` filters should fail safely as unauthorized or unavailable
	- reporting visibility does not grant access to the onboarding overview, queue, or internal review-note workflows
- Base response shape should support both summary widgets and PAT-023 tables without a second ad hoc query:
	- applied filter echo
	- report title or metric label
	- report freshness timestamp
	- summary KPI values for the selected metric family
	- aggregate table rows for the current grouping
	- `export_available` flag and export route or query string
- Metric-family query expectations:
	- onboarding throughput
		- aggregate by transition timestamps on onboarding-owned records
		- rows should support counts for `submitted`, `approved`, and `launched` by the selected bucket
	- invitation conversion
		- aggregate from invitation lifecycle records scoped to the selected partner, workspace, or department filters when present
		- rows should support invitations sent, invitations accepted, and conversion rate by the selected bucket
	- secret rotation hygiene
		- aggregate from RP-application rotation history or equivalent auditable credential events
		- rows should support total in-scope RP applications, compliant applications, non-compliant applications, and hygiene rate for the selected bucket or scope
		- response should echo the effective policy-window length so the UI can describe the metric accurately
- Invalid filter handling should use stable safe errors instead of generic unexpected failures.
	- `400 onboarding_report_invalid_date_range`
	- `400 onboarding_report_unsupported_filter`
	- `400 onboarding_report_invalid_filter_combination`
	- `403` or safe unavailable result for unauthorized actors or out-of-scope partner-side filter combinations
	- valid-but-empty filters return `200` with empty aggregate rows and a usable empty-state message source, not an error
- Export behavior should stay aggregate-only.
	- export must use the same applied filters as the active report view
	- export output may be CSV in the first release
	- export rows should match the visible aggregate table columns for the selected metric family

## Slice 5 reporting UI and PAT-023 behavior

- Use `/onboarding-oversight/reports` as a focused reporting page for both internal oversight and partner-side reporting readers, while keeping overview and queue routes internal-only.
- Reuse the current MAU report interaction model where it fits:
	- filter form with start and end date inputs plus an apply action
	- KPI summaries above the tabular results
	- explicit export action for the active filter set
	- stable loading and error notices that match existing page behavior
- The first-release reporting page should include:
	- a metric selector for onboarding throughput, invitation conversion, and secret rotation hygiene
	- period filters
	- optional scope filters only when the backend supports them cleanly from the start, with partner-side readers seeing only in-scope filter choices
	- summary KPI cards or equivalent PAT-017 summary facts for the selected metric family
	- one PAT-023 aggregate data table for the selected metric family
- PAT-023 table behavior for reports:
	- use aggregate buckets as rows, not record-level work items
	- use visible text for missing values or non-applicable dimensions
	- default sort by the most recent period bucket first for time-series reports, or by the most operationally important rate or count when the metric is scope-based
	- allow pagination when the selected period or grouping would otherwise create an unwieldy table
	- do not add row actions in the first release unless a later approved slice defines a safe drill-down route
- Filter state should be preserved in the route state or URL so users can refresh, export, or return from another oversight or partner route without losing the active report context.
- Invalid-filter recovery must protect the user's last valid report context.
	- when the user submits an unsupported filter combination, keep the last valid summary and table visible
	- show a warning or danger notice that explains the filter issue in plain language
	- do not replace the last valid report with empty or misleading data
- Empty, loading, unauthorized, and partial-data behavior:
	- empty: explain that no aggregate results were found for the selected filters
	- loading: preserve the page shell and current filter controls while data refreshes
	- unauthorized: return the standard safe denial experience when the caller lacks report visibility or requests out-of-scope data
	- partial data: label stale or unavailable metric segments rather than implying complete coverage

## Slice 5 verification targets

- Backend coverage:
	- add a focused reporting API test module for representative throughput, invitation-conversion, and secret-rotation-hygiene aggregates
	- add export coverage proving CSV headers and aggregate rows match the selected metric family
	- add invalid-filter tests for the stable `onboarding_report_*` error codes
	- add authorization tests proving platform-admin readers can access cross-workspace results, partner-side readers can access only in-scope results, and unauthorized actors cannot read report data or exports
- Frontend coverage:
	- add `frontend/tests/unit/pages/OnboardingOversightReportsPage.test.tsx` for metric switching, period filters, KPI rendering, PAT-023 table output, export action, empty state, and invalid-filter recovery that preserves the last valid results
	- add route-state or URL-state tests proving report filters survive refresh or return navigation
	- add role-scoped UI tests proving partner-side readers do not see out-of-scope filter affordances or internal queue or review entry points from the reports page
	- add locale-parity assertions for the reporting labels, notices, and export text
- Focused local verification commands:
	- backend targeted pytest for the new reporting API or service module once implemented
	- frontend targeted Vitest for the reports page and any shared aggregate-table wrapper once implemented

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
- Dependency: none on an active reconciler change. When a slice needs dashboard-summary or invitation behavior, use the current specs under `openspec/specs/` instead.
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
- Notes: keep guidance informational and bilingual; do not silently broaden permissions or embed the full external workflow. Invitation-management and acceptance behavior for these surfaces now comes from [openspec/specs/partner-portal-external-developer-invitations-and-scoped-access/spec.md](../../specs/partner-portal-external-developer-invitations-and-scoped-access/spec.md).
- Exit condition: guidance surfaces, documentation/process links, target audiences, and copy ownership are defined in spec and tasks.

### Slice 5: Aggregate onboarding reporting

- Outcome: platform-admin users and first-release partner-side reporting readers can review aggregate onboarding, invitation, and secret-hygiene metrics without record-by-record inspection, while each caller stays constrained to the authorized reporting scope.
- Impacted areas: `/onboarding-oversight/reports` route, reporting queries, APIs, summary widgets, table exports, tests.
- Notes: use PAT-021 for the reports landing content and PAT-023 for any tabular report results.
- Exit condition: metric families, filters, access scope, and default formulas are defined.

## Implementation readiness

- Slice 0 dependency narrowing is complete.
- First recommended implementation order:
	1. Slice 1 lifecycle state model
	2. Slice 2 application-information readiness
	3. Slice 3 platform-admin oversight and review notes
	4. Slice 5 aggregate reporting
	5. Slice 4 role-boundary guidance
- Current blockers:
	- No planning blocker remains inside this change package. Slice 4 guidance already aligns to the first-release invited-developer current-user and invitation-acceptance surfaces defined in [openspec/specs/partner-portal-external-developer-invitations-and-scoped-access/spec.md](../../specs/partner-portal-external-developer-invitations-and-scoped-access/spec.md).

## Deferred follow-on areas

- Partner volume-spike notification workflow.
- Detailed incident reporting intake and SLA handling.
- First-class deprecation workflow states, approvals, and notifications beyond initial link-out readiness.
- Dedicated partner-reporting role design that can replace the first-release all-partner reporting visibility without changing the report families.

## Open Questions

- No blocking human-decision questions remain for local planning.
