# Reconcile PRD Current Spec Gaps Tasks

## 1. Source Of Truth Resolution

- [x] 1.1 Use the default assumption that current shipped code remains the source of truth for `openspec/specs/` unless the team explicitly rejects it.
	Progress note (2026-07-30): recorded the working decision to treat the current CanadaLogin Partner Portal implementation as the source of truth for shipped behavior until a later approved spec or PRD correction supersedes it.
- [ ] 1.2 Record PRD corrections if the intended product scope is narrower than the current PRD text.
- [x] 1.3 Remove workspace, application-information, and workspace-scoped RP application behavior from this gap change because current repo routes and APIs now evidence those surfaces.
	Progress note (2026-08-10): frontend `/workspaces` routes and backend `/api/v1/workspaces` plus application-information and workspace-scoped RP application endpoints are live in the repository, so those requirements stay in current specs.
- [x] 1.4 If the remaining PRD scope stays intended product behavior, record the follow-on change split instead of implementing directly from this change.

## 2. Dashboard Summary Scope

- [x] 2.1 Define the target dashboard route and page shape for current-user profile, department, role, workspace, and RP-application summaries.
	Progress note (2026-08-10): `restore-dashboard-summary-surface` now defines a minimal read-only dashboard on `/your-applications` with profile, workspace, and RP-application summary sections.
- [x] 2.2 Record the required page-pattern decision and PAT-021 dashboard constraints for any restored dashboard implementation.
	Progress note (2026-08-10): `restore-dashboard-summary-surface/dashboard-page-pattern-decision.yaml` records the PAT-021 and PAT-017 decision and primary task paths.
- [x] 2.3 Create or queue a dedicated follow-on change for backend and frontend implementation of missing dashboard summary data.
	Progress note (2026-08-10): created `restore-dashboard-summary-surface` as the dedicated MVP dashboard follow-on package.
- [ ] 2.4 Add tests in that follow-on change to prove the dashboard summary behavior.

## 3. Invitation And Scoped Access Handoff

- [x] 3.1 Create a dedicated follow-on change for invitation and scoped-access implementation planning.
	Progress note (2026-08-10): created `restore-external-developer-invitations` so invitation lifecycle, acceptance, and access-scoping work no longer live in this dashboard-gap change.

## 4. Verification And Readiness

- [x] 4.1 Run `make validate-openspec-change CHANGE_ID=reconcile-prd-current-spec-gaps`.
- [ ] 4.2 Run targeted backend and frontend tests only in the relevant follow-on implementation change or after PRD corrections exist.
- [ ] 4.3 Archive this change only after the PRD is corrected or the required follow-on implementation changes have been created and current specs remain accurate.
