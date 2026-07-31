# Proposal

## Why

The onboarding PRD at `docs/plans/partner-portal-onboarding-prd.md` shows that MVP1 already delivers the core portal flows for authentication, workspace management, RP application operations, invited-developer onboarding, and platform administration. The same PRD also identifies the next product gap: onboarding is operationally functional but still lacks explicit workflow state, environment progression rules, readiness signals, cross-workspace review tooling, promotion traceability, and aggregate reporting that internal reviewers and administrators need to scale the service.

## Work Context And Assumptions

- Context: local developer and localhost planning default per STD-002.
- Data posture: fake, seeded, or test-only data for local verification.
- External systems: no new production approvals, waivers, or shared-environment rollout decisions are implied by this change package.
- Scope boundary: this change defines product behavior and planning expectations for MVP2. It does not approve production release or replace human governance decisions.
- PRD source assumption: `docs/plans/partner-portal-onboarding-prd.md` is the working product source for onboarding terminology and confirmed decisions unless a later approved spec or PRD correction overrides it.
- Dependency assumption: workspace, application-information, and invitation baselines must be resolved through [openspec/changes/reconcile-prd-current-spec-gaps](../reconcile-prd-current-spec-gaps/proposal.md) or equivalent PRD/source-of-truth corrections before this change can be implemented end to end.
- Default implementation assumption: until a dedicated reviewer role is explicitly approved, the first implementation slice may reuse existing platform-admin or superuser access for oversight routes and state transitions.
- Default implementation assumption: application-information readiness indicators inform and gate submission state in the first slice, but do not newly block RP application creation unless a later explicit decision changes that behavior.
- Role-model assumption: this package can plan against the PRD's operational labels (`RP Admin`, `RP User (Edit)`, `Read Only`, and `CL Admin`) without requiring the current code-level role model to be renamed in the same slice.

## What Changes

- Add explicit onboarding lifecycle states for workspaces, application information records, and RP applications using the MVP2 state model `draft`, `submitted`, `under_review`, `approved`, and `launched`.
- Add explicit environment progression and promotion-tracking behavior for `test`, `staging`, and `production`, including self-serve progression where allowed and out-of-band review traceability where required.
- Add application information completion indicators so workspace admins can identify which sections and required fields are still incomplete before submission.
- Add checklist, evidence-reference, and contextual external-process visibility needed before a record is treated as production-ready.
- Add an authenticated oversight experience for reviewer and administrator personas to monitor onboarding work across workspaces and departments.
- Add reviewer notes and checklist capture for application information review.
- Add user-facing role-boundary guidance that clarifies workspace membership versus invited-developer RP application access.
- Add aggregate reporting for invitation conversion, secret rotation hygiene, and onboarding throughput.
- Keep partner volume-spike intake, incident workflow details, and first-class deprecation workflow automation as explicit follow-on scope instead of widening this package.

## Capabilities

### New Capabilities
- `partner-portal-onboarding-oversight-and-reporting`: Cross-workspace onboarding oversight, review notes, and aggregate operational reporting for internal reviewer and administrator users.

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

- Whether the temporary platform-admin ownership assumption for oversight should be replaced by a dedicated reviewer role before implementation starts.
- Whether RP application creation should remain allowed before application information reaches `submitted` or `approved` after the first readiness slice lands.
- Whether contact-type requirements differ by `staging` versus `production` and should become hard submission or promotion gates in the first release.
- Whether CATS or equivalent readiness evidence should be captured as an upload, an external reference, or both in the first implementation slice.
- Whether the default first-release reporting formulas and time windows below are acceptable or need product-owner changes:
	- invitation conversion rate = accepted invitations / invitations sent in the selected period
	- secret rotation hygiene = count and percent of RP applications with a rotation event inside the configured policy window
	- onboarding throughput = count of records entering `submitted`, `approved`, and `launched` in the selected period
