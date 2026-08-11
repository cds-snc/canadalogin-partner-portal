# Proposal

## Why

The current authenticated landing experience at `/your-applications` is only a thin RP application list. The PRD and the dashboard-reconciliation planning both expect a broader dashboard summary, but the intended MVP shape is smaller than a full operational console: keep the current route, keep it read-only, and add only the minimal current-user context needed to orient partner users.

The repository already has most of the raw data surfaces needed for that MVP:

- current session and shared-shell user context
- current-user workspaces through `/api/v1/workspaces/mine`
- current-user RP applications through the existing `/your-applications` fetches

What is missing is a dedicated active change that turns those existing surfaces into a small, implementation-ready dashboard contract without mixing in CL Admin oversight, reports, or write flows.

## Work Context And Assumptions

- Context: local developer and localhost planning default per STD-002.
- Data posture: fake, seeded, or test-only data for local verification.
- Route assumption: `/your-applications` remains the partner-facing dashboard entry route and current-user landing page.
- Composition assumption: the MVP dashboard should reuse the existing current-user session, roles catalog, department lookup, and current-user RP application fetches. The current `/workspaces/mine` route still needs a minimal access-scoping repair before it is safe to use as the dashboard workspace summary source, so the preferred fix is to correct that current-user contract instead of adding a new dashboard aggregate API.
- Scope boundary: this change applies to the partner-facing current-user dashboard only. CL Admin oversight, queue, and reporting routes stay under [openspec/changes/advance-onboarding-governance-and-reporting](../advance-onboarding-governance-and-reporting/proposal.md).
- Read-only assumption: the MVP dashboard adds summary and navigation only. It does not add inline create, edit, invite, review, report, or secret-management workflows.
- Invitation assumption: once invitation-backed RP-application access is implemented, the dashboard's current-user application list includes any invited applications that appear in current-user scope, but explicit access-source labels can remain a follow-on if the minimal contract does not carry them.

## What Changes

- Add a dedicated active change for a minimal dashboard summary surface under `partner-portal-access-and-dashboard`.
- Define `/your-applications` as a read-only service-home dashboard that shows user context plus accessible workspaces and RP applications.
- Define summary-section behavior for loading, empty, error, and populated states.
- Define the route, page-pattern, frontend composition, and verification slices needed to implement the MVP dashboard without widening into CL Admin oversight or reporting.

## Capabilities

### Modified Capabilities
- `partner-portal-access-and-dashboard`

## Impact

- Frontend route and page composition for `/your-applications`.
- Existing current-user fetch usage for session, workspaces, and RP applications, plus any smallest-possible DTO expansion if one is required.
- English and French dashboard copy, summary notices, and loading, empty, or error states.
- Focused frontend tests, and backend tests only if implementation needs a contract change.

## Resolved Direction

- Keep the MVP dashboard client-composed from existing session, department, role, and RP-application reads.
- Treat workspace visibility as the only contract repair required before implementation because `WorkspaceService.list_current_user_workspaces(...)` currently delegates to the unfiltered workspace list.
- Prefer fixing the current-user workspace surface over introducing a dashboard-specific aggregate endpoint for this MVP slice.
