# Restore Workspace And Application Info Management Proposal

## Why

[openspec/changes/reconcile-prd-current-spec-gaps](../reconcile-prd-current-spec-gaps/proposal.md) moved workspace CRUD, membership management, application-information intake, and workspace-scoped RP application management out of current specs because the repository does not yet ship those behaviors end to end. [openspec/changes/advance-onboarding-governance-and-reporting](../advance-onboarding-governance-and-reporting/proposal.md) then identified those baseline surfaces as a prerequisite for lifecycle state, readiness indicators, and oversight reporting.

This change creates the implementation-ready baseline package that reconcile explicitly recommended. It restores the missing management surfaces as one practical slice without reopening dashboard or invitation planning.

## Work Context And Assumptions

- Context: local developer and localhost planning default per STD-002.
- Data posture: fake, seeded, or test-only data for local verification.
- Scope boundary: this change restores baseline workspace and application-management behavior only. It does not add onboarding governance state, reviewer workflows, invitation acceptance, or production approvals.
- Dependency assumption: this package fulfills the follow-on change called for by reconcile task 3.5 and is the baseline prerequisite for advance Slice 0.
- Routing assumption: keep the current-user owner experience at `/your-applications/$rpApplicationUuid` as the current shipped surface, and add restored workspace administration routes under `/workspaces` instead of replacing current-user routes.
- API assumption: reuse the existing `/api/v1/workspaces` and `/api/v1/workspaces/{workspace_uuid}/applications` resource families already implied by frontend fetch helpers, and extend them with the missing application-information and membership-role surfaces.
- Data-boundary assumption: `application_information` owns canonical bilingual application metadata and onboarding narrative, while each workspace-scoped RP application record owns one environment-specific CanadaLogin registration snapshot.
- Naming assumption: if current implementation code keeps `rp_application` as the persisted model name, that model still represents one environment-specific registration record for this change.

## What Changes

- Restore workspace list, detail, create, edit, and delete behavior for authorized users and workspace administrators.
- Restore workspace membership management, including add, role update, remove, and duplicate-membership safeguards.
- Restore application-information CRUD and related contact management inside a workspace.
- Restore workspace-scoped RP application CRUD, detail, usage, and audit visibility using the OIDC registration field map from reconcile as the content and validation baseline.
- Define route, API, data, standards, and verification expectations tightly enough for backend and frontend implementation to start without reopening product scope.

## Capabilities

### Modified Capabilities
- `partner-portal-workspace-and-rp-application-management`

## Impact

- Frontend routes, loaders, forms, and page states for `/workspaces`, workspace membership, application information, and workspace-scoped RP applications.
- Backend routes, services, repositories, authorization checks, and error responses for workspace-owned resources.
- Persistence and migration work for application information, contacts, membership-role updates, and workspace-linked RP application records.
- Focused backend and frontend tests that prove CRUD, authorization, validation, and relationship boundaries before governance or reporting work starts.

## Open Questions

- None for this baseline package. Dashboard parity and invitation restoration stay in separate follow-on changes by design.
