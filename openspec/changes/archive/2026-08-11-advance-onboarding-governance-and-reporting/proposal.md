# Proposal

## Why

The onboarding PRD at `docs/plans/partner-portal-onboarding-prd.md` shows that MVP1 already delivers the core portal flows for authentication, workspace management, RP application operations, invited-developer onboarding, and platform administration. The same PRD also identifies the next product gap: onboarding is operationally functional but still lacks explicit workflow state, environment progression rules, readiness signals, cross-workspace review tooling, promotion traceability, and aggregate reporting that platform-admin and partner-side users need to monitor onboarding health.

## Work Context And Assumptions

- Context: local developer and localhost planning default per STD-002.
- Data posture: fake, seeded, or test-only data for local verification.
- External systems: no new production approvals, waivers, or shared-environment rollout decisions are implied by this change package.
- Scope boundary: this change defines product behavior and planning expectations for MVP2. It does not approve production release or replace human governance decisions.
- PRD source assumption: `docs/plans/partner-portal-onboarding-prd.md` is the working product source for onboarding terminology and confirmed decisions unless a later approved spec or PRD correction overrides it.
- Dependency assumption: current workspace, application-information, workspace-scoped RP application, dashboard-summary, and invitation baselines are treated as shipped behavior for this change. When a slice depends on those surfaces, use the current specs in [openspec/specs/partner-portal-access-and-dashboard/spec.md](../../specs/partner-portal-access-and-dashboard/spec.md) and [openspec/specs/partner-portal-external-developer-invitations-and-scoped-access/spec.md](../../specs/partner-portal-external-developer-invitations-and-scoped-access/spec.md) rather than an active reconciler change.
- Default implementation assumption: MVP2 oversight and production-approval tracking stay with platform-admin users; any temporary reuse of an existing superuser-only technical check is an implementation detail, not a product-role decision.
- Default implementation assumption: application-information readiness indicators stay advisory in MVP2 and do not hard-block contact, checklist, or evidence gaps inside the portal; those gates remain outside Partner Portal for this release.
- Default implementation assumption: RP application creation remains allowed for `test` and `staging`, while `production` progression remains review-tracked and platform-admin approved.
- Default planning assumption: keep the first-release reporting formulas, selected-period filtering semantics, and aggregate-only CSV export behavior recorded in this change package unless product explicitly overrides them.
- Default planning assumption: keep the report definitions unchanged in the first release and broaden reporting read access to `RP Admin`, `RP User (Edit)`, and `Read Only` users for aggregate results limited to their granted partner scope; a dedicated partner-reporting role remains follow-on scope.
- Role-model assumption: this package can plan against the PRD's operational labels (`RP Admin`, `RP User (Edit)`, `Read Only`, and `CL Admin`) without requiring the current code-level role model to be renamed in the same slice.

## Terminology Alignment

- Use `platform-admin` as the change package's working label for the internal oversight actor; this maps to the PRD's `CL Admin` responsibilities until a later approved role-model change says otherwise.
- Keep the partner-side operational labels `RP Admin`, `RP User (Edit)`, and `Read Only` aligned with the invitation and current-user access specs.
- Use `reporting reader` as the neutral label for actors who can view aggregate onboarding reports; in the first release this includes platform-admin plus `RP Admin`, `RP User (Edit)`, and `Read Only` within authorized scope.
- Keep the lifecycle-state vocabulary fixed to `draft`, `submitted`, `under_review`, `approved`, and `launched` across proposal, design, and spec text.
- Use `production progression` as the user-facing workflow concept and `promotion request` as the explicit tracked record for `staging` to `production` review metadata.

## What Changes

- Add explicit onboarding lifecycle states for workspaces, application information records, and RP applications using the MVP2 state model `draft`, `submitted`, `under_review`, `approved`, and `launched`.
- Add explicit environment progression and promotion-tracking behavior for `test`, `staging`, and `production`, including self-serve progression where allowed and out-of-band review traceability where required.
- Add application information completion indicators so workspace admins can identify which sections and required fields are still incomplete before submission.
- Add checklist, external evidence-reference, and contextual external-process visibility needed before a record is treated as production-ready.
- Add an authenticated oversight experience for platform-admin users to monitor onboarding work across workspaces and departments.
- Add review notes and checklist capture for application information review.
- Add user-facing role-boundary guidance that clarifies workspace membership versus invited-developer RP application access.
- Add aggregate reporting for invitation conversion, secret rotation hygiene, and onboarding throughput, while letting partner-side operational roles read those same reports within their authorized partner scope.
- Keep partner volume-spike intake, incident workflow details, and first-class deprecation workflow automation as explicit follow-on scope instead of widening this package.

## Capabilities

### New Capabilities
- `partner-portal-onboarding-oversight-and-reporting`: Cross-workspace onboarding oversight and review notes for platform-admin users, plus aggregate operational reporting for platform-admin and partner-side readers within their authorized scope.

### Modified Capabilities
- `partner-portal-workspace-and-rp-application-management`: Add lifecycle state visibility and application information completion indicators.
- `partner-portal-external-developer-invitations-and-scoped-access`: Add role-boundary guidance for collaboration and invited-developer scope.

## Impact

- Frontend: new or expanded operational dashboard, detail, and help-content routes for onboarding review and state visibility.
- Backend API: new state, review, and reporting endpoints or DTO expansions for workspaces, application information records, and RP applications.
- Persistence: new state, checklist, and review-note storage plus reporting query support.
- Localization and accessibility: new English and French copy, route content, and review states that must follow STD-005, STD-006, STD-007, and STD-017 expectations.
- Testing: backend contract tests, frontend route and state-display tests, and focused verification for reporting filters and role guidance.

## Open Questions

- No blocking open questions remain for local planning.
