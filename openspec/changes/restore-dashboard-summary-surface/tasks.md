# Tasks

## 0. Change Setup And Boundaries

- [x] 0.1 Create a dedicated follow-on change for the MVP dashboard summary surface instead of expanding the generic PRD-gap package.
	Progress note (2026-08-10): created `restore-dashboard-summary-surface` to own the concrete partner-dashboard contract.
- [x] 0.2 Record that CL Admin oversight, queue, and reporting work stay under `advance-onboarding-governance-and-reporting`.
	Progress note (2026-08-10): this package owns only the partner-facing current-user dashboard surface.

## 1. Route And Page Pattern

- [x] 1.1 Keep `/your-applications` as the current-user dashboard entry route and define the page shape as a read-only service home.
	Progress note (2026-08-10): proposal, design, and spec now keep `/your-applications` as the MVP dashboard route.
- [x] 1.2 Record the approved page-pattern decision and primary navigation paths for profile context, workspace discovery, and RP application access.
	Progress note (2026-08-10): added `dashboard-page-pattern-decision.yaml` with PAT-021 and PAT-017 guidance and the primary navigation paths.
- [x] 1.3 Confirm whether existing session, department, roles catalog, `/workspaces/mine`, and current-user RP application fetches are sufficient or whether the cleaner MVP implementation is a small dedicated dashboard API or DTO expansion.
	Progress note (2026-08-10): confirmed that `/api/v1/user/me/`, the existing department and roles lookups, and `/api/v1/rp-applications/mine` already cover the MVP profile and application summary needs. The only missing piece is workspace scoping: `WorkspaceService.list_current_user_workspaces(...)` currently ignores `current_user` and delegates to the full workspace list, so the preferred implementation path is a small repair to the current-user workspace contract rather than a new dashboard aggregate API.

## 2. Dashboard Summary Content

- [x] 2.1 Define the profile summary block: name, email, department, and current role context already available to the signed-in user.
- [x] 2.2 Define the accessible workspace summary block, including loading, empty, and error states, while keeping workspace administration actions out of the dashboard.
- [x] 2.3 Define the RP application section so it preserves current app links and includes invited-access applications once they appear in current-user scope.
- [x] 2.4 Define the dashboard empty and error behavior and navigation actions without adding inline create, edit, invite, review, or reporting widgets.

## 3. Verification And Follow-Through

- [x] 3.1 Add frontend tests for loading, empty, error, and populated dashboard states when implementation starts.
	Progress note (2026-08-10): added focused dashboard coverage in `frontend/tests/unit/pages/YourApplicationsPage.test.tsx` for session loading, populated profile or workspace or application content, empty states, and per-section error notices on `/your-applications`.
- [x] 3.2 Add backend tests for the current-user workspace summary contract when implementation repairs `/workspaces/mine` scoping for dashboard use.
	Progress note (2026-08-10): added focused backend coverage in `backend/tests/test_workspace_service.py` and `backend/tests/test_workspaces.py` for membership-scoped `/api/v1/workspaces/mine` reads and safe not-found behavior for unauthorized workspace detail requests.
- [x] 3.3 Run `make validate-openspec-change CHANGE_ID=restore-dashboard-summary-surface`.
	Progress note (2026-08-10): strict OpenSpec validation passed for `restore-dashboard-summary-surface` using the local CLI workflow.
- [x] 3.4 Coordinate future archive with `reconcile-prd-current-spec-gaps` so the current spec update lands from the dedicated dashboard package rather than only from the broader PRD-gap change.
	Progress note (2026-08-10): updated `reconcile-prd-current-spec-gaps/tasks.md` so the broader PRD-gap package now points its dashboard verification and eventual archive readiness back to this dedicated implementation change.
