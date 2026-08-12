# Proposal: Consolidate workspace RP application experience

## Summary

Make the workspace the visible and technical partner boundary for every
workspace-owned RP application. Keep `/your-applications` as an authorized
cross-workspace projection, but make it and the selected-workspace application
list present the same RP application summaries and link to one canonical
workspace-scoped RP application overview.

Replace the MVP1 IBM-backed OAuth detail landing page with a focused RP
application task hub. The RP application name remains the H1, concise local
status appears below it, and role-appropriate cards link to Configuration,
Usage, and Manage credentials. Configuration is read from the portal-owned
registration record rather than requiring IBM Verify availability.

Also record the reported Endpoints-step `422` as a recoverable validation
regression: valid step data advances, correctable validation errors stay on the
step with field feedback, and neither case is presented as a lost or
unavailable draft.

## Why

The current product has two competing RP application experiences:

- `/your-applications` uses an accessible-application projection and opens a
  workspace-agnostic detail page that loads IBM Verify-backed OAuth setup;
- `/workspaces/$workspaceUuid/applications` uses a separate table and a long
  workspace detail page with different summary fields and mixed configuration,
  invitation, audit, lifecycle, and destructive actions.

This split comes from two product generations. The June 2026 MVP1 OAuth setup
change explicitly excluded workspace concepts and made IBM Verify the detail
source. The current MVP2 product requirements and persistence model instead
make a workspace the partner container and make each RP application one
workspace-owned CanadaLogin environment registration. Both screens now refer
to the same RP resource but present different summaries, routes, and failure
modes.

The mismatch is visible in the reported experience: the current-user detail
page still tries to load upstream configuration, can show an unavailable
configuration notice, and exposes only Usage and Manage credentials as cards.
The workspace detail shows a different, overloaded representation of the same
RP application.

The registration flow has a related recovery problem. The supplied log proves
that Basics created the server-backed draft successfully and that the
Endpoints `PATCH` then returned `422`. It does not identify the invalid field or
prove the root cause. The UI currently converts that response into “Unable to
continue registration,” which incorrectly groups correctable validation with
draft load or save unavailability.

## Work context

- Local developer / localhost with fake, seeded, or test-only data.
- Repo-scoped OpenSpec, design, implementation, tests, and local verification.
- IBM Verify is unavailable and unauthorized for this local change. The target
  integration remains governed behind its existing adapter, but no real IBM
  call, credential, provider record, or production identifier is required to
  render RP summaries, the RP task hub, or portal-owned configuration.
- No shared environment, production data, deployment, release approval,
  waiver, external mutation, or real secret is in scope.

## Control boundary

- Allowed: repository reads and edits, localhost services, fake data, local
  API/frontend tests, OpenSpec validation, and local browser evidence.
- Denied: IBM Verify mutation, real client secrets, production or shared
  environment access, deployment, publishing, and external system mutation.
- Sensitive data: registration configuration is internal security
  configuration; private keys, credentials, tokens, raw provider payloads, and
  personal information remain forbidden in prompts, logs, screenshots, tests,
  and evidence.
- Naming: reusable routes, DTOs, services, components, and tests use durable RP
  application and workspace domain names. `local`, `fake`, and `test` remain
  limited to disposable fixtures and configuration values.

## Resolved questions

| Question | Answer | Source | Classification | Confidence |
|---|---|---|---|---|
| Is a workspace the partner boundary? | Yes. A workspace is the department-associated partner container used by canonical partner grants and partner tasks. | MVP2 product requirements sections 2 and 6; current workspace model and OpenSpec | fact | high |
| What does one RP application represent? | One environment-specific CanadaLogin registration owned by exactly one workspace, with an optional link to one workspace-owned application-information record. | Current workspace OpenSpec; archived restore-workspace design; `RPApplication.workspace_id` | fact | high |
| Is `/your-applications` a second owner of RP records? | No. It is a current-user, cross-workspace operational projection over RP applications authorized through canonical workspace grants. | Current access/dashboard OpenSpec and page-pattern decision | fact | high |
| Why do the two detail surfaces disagree? | The MVP1 OAuth page deliberately excluded workspace concepts and used IBM Verify, while MVP2 restored workspace-owned RP resources and local registration persistence. | Archived `add-current-user-rp-oauth-setup-page`; MVP2 product requirements; current code | fact | high |
| Which route should own the partner RP application experience? | The workspace-scoped RP application route is canonical because the workspace owns the resource. Current-user routes become compatibility redirects after authorization and resource resolution. | Current domain ownership and nested workspace API; `STD-009` resource relationship guidance | safe_assumption | high |
| Should the RP overview embed configuration, usage, or credentials? | No. It is a PAT-001 task hub with focused destination routes. This preserves the requested three-card structure and avoids the current overloaded page. | User direction; `PAT-001`; `PAT-022` | fact | high |
| Should Configuration depend on IBM Verify? | No. The portal-owned registration payload and lifecycle metadata are the authoritative configuration for this view. Provider operations remain separately governed integration concerns. | Current server-backed registration OpenSpec and persistence; user direction | fact | high |
| What does the observed `422` prove? | Basics creation succeeded and the Endpoints request was rejected before a successful draft save. The field or serializer cause still needs a focused implementation investigation. | Supplied request log and current FastAPI route | fact | high |
| How should a correctable `422` appear? | Stay on the current step, preserve entered and last-saved data, and show an error summary plus field-level feedback from the safe validation contract. | Existing registration-flow requirement; `STD-010`; `PAT-020` | fact | high |

## Human decisions required

None before local implementation. English and French content still require
normal product/content review before release, but that review does not block
the structural OpenSpec or local first slice.

## What Changes

- Define the canonical workspace, application-information, and RP application
  relationship.
- Define `/your-applications` as an authorized projection, not a second RP
  resource model or separate application experience.
- Make workspace and current-user lists use one RP application summary contract
  and the same user-visible status fields.
- Make `/workspaces/$workspaceUuid/applications/$rpApplicationUuid` the
  canonical RP application overview for partner work.
- Replace the embedded IBM-backed OAuth detail with a three-destination task
  hub: Configuration, Usage, and Manage credentials, filtered by capability.
- Add a focused, portal-backed, secret-free Configuration route and DTO.
- Move or link the current workspace-detail responsibilities to the focused
  route that owns them: configuration/edit/resume/destructive actions,
  workspace Access, usage, and bounded audit/reporting.
- Keep old `/your-applications/$rpApplicationUuid/**` paths as authorized
  compatibility redirects while callers and active changes migrate.
- Specify actionable Endpoints-step validation, contract parity, safe error
  feedback, draft preservation, and regression tests for the reported `422`.
- Update English/French content, route metadata, tests, page-pattern evidence,
  and affected active-change route references.

## Out of scope

- Fixing the Step 2 implementation in this OpenSpec-only pass.
- Real IBM Verify calls, provider mutation, reconciliation, or synchronization.
- Changing client-secret lifecycle semantics or exposing secrets in
  configuration.
- Changing canonical role definitions or granting new capabilities.
- Combining application information and RP applications into one record.
- Adding a fourth primary RP card for invitations, audit, delete, or
  application information.
- Shared-environment or production deployment, data migration, approval, or
  release readiness.

## Requirements or scenarios affected

- `partner-portal-workspace-and-rp-application-management`
  - workspace/RP ownership and environment registration;
  - consistent summaries;
  - recoverable multi-step registration validation.
- `partner-portal-access-and-dashboard`
  - current-user RP application operational overview and canonical links.
- `current-user-rp-oauth-setup`
  - retire the MVP1 embedded IBM-backed detail behavior.
- `partner-portal-rp-application-experience`
  - new canonical task hub, portal configuration, role-aware destinations, and
    compatibility behavior.

## Risks

- Route consolidation can break saved links or active changes. Preserve
  authorized compatibility redirects and update `add-reports-task-hub` before
  either change archives.
- One shared summary can accidentally expose fields to a broader role. Define a
  strict secret-free summary DTO and authorize before projection.
- Moving the overloaded workspace detail can strand edit, audit, invitation,
  or delete tasks. Inventory every existing action and assign it to
  Configuration, Access, Usage, Reports/audit, or an explicit deferred task.
- Provider-derived status may disagree with portal lifecycle state. The common
  summary uses portal-owned environment, onboarding, promotion, and resume
  state; provider identifiers and raw provider status are not summary fields.
- A `422` can represent either user input or cross-stack contract drift. Tests
  must cover both field validation and actual serialized frontend/OpenAPI
  request keys.

## Links

- `STD-002: Work Contexts`
- `STD-004: Frontend React and TypeScript`
- `STD-005: Frontend GC Design System`
- `STD-006: GC UI Page Layout Rules`
- `STD-007: UI Accessibility Basics`
- `STD-008: Backend FastAPI`
- `STD-009: REST API`
- `STD-010: API Response and Error Models`
- `STD-011: Logging and Observability`
- `STD-013: Security and Privacy Basics`
- `STD-017: Government of Canada Standards Review`
- `STD-018: Frontend CSS and Design-System Boundary`
- `STD-019: Government of Canada Web Application Baseline Governance`
- `PAT-001: UI Page Patterns`
- `PAT-013: GC Design System React App Shell`
- `PAT-014: Bilingual Route and I18n`
- `PAT-017: Itemized Data Display`
- `PAT-020: Status and Feedback`
- `PAT-022: Page Length and Splitting`
- `BAS-001: Government of Canada Web Application Baseline`
- [OpenSpec lifecycle](../../../docs/reference/openspec-lifecycle.md)
