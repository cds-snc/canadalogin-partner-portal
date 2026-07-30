# Reconcile PRD Current Spec Gaps Tasks

## 1. Source Of Truth Resolution

- [x] 1.1 Use the default assumption that current shipped code remains the source of truth for `openspec/specs/` unless the team explicitly rejects it.
	Progress note (2026-07-30): recorded the working decision to treat the current CanadaLogin Partner Portal implementation as the source of truth for shipped behavior until a later approved spec or PRD correction supersedes it.
- [ ] 1.2 Record PRD corrections if the intended product scope is narrower than the current PRD text.
- [x] 1.3 If the PRD scope remains intended product behavior, record the follow-on change split instead of implementing directly from this change.

## 2. Dashboard Summary Scope

- [ ] 2.1 Define the target dashboard route and page shape for current-user profile, department, role, workspace, and RP-application summaries.
- [ ] 2.2 Record the required page-pattern decision and PAT-021 dashboard constraints for any restored dashboard implementation.
- [ ] 2.3 Create or queue a dedicated follow-on change for backend and frontend implementation of missing dashboard summary data.
- [ ] 2.4 Add tests in that follow-on change to prove the dashboard summary behavior.

## 3. Workspace And Application-Information Scope

- [x] 3.1 Define the route and API surface for workspace CRUD and workspace membership management.
- [x] 3.2 Define the route and API surface for application-information records and contacts, and preserve the design split between canonical bilingual application metadata and environment-specific RP registration snapshots.
- [x] 3.3 Define the route and API surface for workspace-scoped RP application creation, edit, delete, and audit or usage views using the OIDC registration question map in `design.md` as the baseline content model.
- [x] 3.4 Record STD-009, STD-010, STD-020, and PAT-012 expectations for restored backend and persistence work, including conditional validation for environment selection, logout mode, client authentication, scopes, sector identifier, PKCE, signing, encryption, and roadmap or risk follow-up fields.
- [x] 3.5 Create or queue a dedicated follow-on change for workspace and application-information implementation.
- [x] 3.6 Add tests in that follow-on change to prove the workspace and application-information behavior.

## 4. Invitation And Scoped Access Scope

- [ ] 4.1 Define the invitation management and acceptance route surfaces.
- [ ] 4.2 Define the backend invitation lifecycle, GC Notify delivery, and invited-developer access-control behavior.
- [ ] 4.3 Record IAM, bilingual, and GC Notify integration expectations for restored invitation work.
- [ ] 4.4 Create or queue a dedicated follow-on change for invitation and scoped-access implementation.
- [ ] 4.5 Add tests in that follow-on change to prove invitation acceptance, access scoping, and denial paths.

## 5. Verification And Readiness

- [x] 5.1 Run `make validate-openspec-change CHANGE_ID=reconcile-prd-current-spec-gaps`.
- [ ] 5.2 Run targeted backend and frontend tests only in the relevant follow-on implementation change or after PRD corrections exist.
- [ ] 5.3 Archive this change only after the PRD is corrected or the required follow-on implementation changes have been created and current specs remain accurate.
