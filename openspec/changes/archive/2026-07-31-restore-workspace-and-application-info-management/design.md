# Restore Workspace And Application Info Management Design

## Context

[openspec/changes/reconcile-prd-current-spec-gaps](../reconcile-prd-current-spec-gaps/proposal.md) established that current specs should stay limited to shipped behavior and recommended a dedicated follow-on change for workspace and application-information restoration. [openspec/changes/advance-onboarding-governance-and-reporting](../advance-onboarding-governance-and-reporting/proposal.md) depends on these baseline surfaces before onboarding state, readiness, review queues, or reporting can be implemented end to end.

This package is that baseline. It is intentionally narrower than the broader PRD cleanup change and intentionally earlier than governance and reporting work.

Two local implementation anchors already exist and should guide this work instead of introducing a parallel resource model:

- frontend fetch helpers already target `/api/v1/workspaces`, `/api/v1/workspaces/{workspace_uuid}/members`, and `/api/v1/workspaces/{workspace_uuid}/applications`
- current shipped owner-scoped RP application routes already live under `/your-applications/$rpApplicationUuid/...`

The restored workspace-scoped surfaces should complement those anchors, not replace them.

## Goals / Non-Goals

**Goals:**

- Restore workspace CRUD with explicit department ownership and workspace-admin membership management.
- Restore application-information CRUD and contact management under a workspace-owned route and API family.
- Restore workspace-scoped RP application CRUD, detail, usage, and audit visibility as the baseline management surface for CanadaLogin onboarding.
- Preserve the canonical-data split from reconcile so application information remains cross-environment metadata and each RP application record remains one environment-specific registration.
- Define executable test expectations for backend and frontend slices.

**Non-Goals:**

- No dashboard summary restoration in this change.
- No invitation lifecycle or invited-developer acceptance work in this change.
- No onboarding lifecycle-state fields, review notes, or aggregate reporting from the advance change.
- No production rollout, approval, waiver, or shared-environment evidence machinery.

## Decisions

### Decision 1: Restore baseline management under a dedicated `/workspaces` route family

- Choice: add the restored management experience under workspace-owned routes instead of expanding `/your-applications` into a mixed personal and admin shell.
- Frontend route plan:
  - `/workspaces`
  - `/workspaces/new`
  - `/workspaces/$workspaceUuid`
  - `/workspaces/$workspaceUuid/settings`
  - `/workspaces/$workspaceUuid/members`
  - `/workspaces/$workspaceUuid/application-information`
  - `/workspaces/$workspaceUuid/application-information/new`
  - `/workspaces/$workspaceUuid/application-information/$applicationInformationUuid`
  - `/workspaces/$workspaceUuid/application-information/$applicationInformationUuid/edit`
  - `/workspaces/$workspaceUuid/applications`
  - `/workspaces/$workspaceUuid/applications/new`
  - `/workspaces/$workspaceUuid/applications/$rpApplicationUuid`
  - `/workspaces/$workspaceUuid/applications/$rpApplicationUuid/edit`
  - `/workspaces/$workspaceUuid/applications/$rpApplicationUuid/usage`
  - `/workspaces/$workspaceUuid/applications/$rpApplicationUuid/audit`
- Rationale: STD-006 favors clear destination routes per user task, and this keeps current-user owner flows separate from workspace administration work.

### Decision 2: Keep backend APIs in the existing `/api/v1/workspaces` resource family

- Choice: use the resource model already implied by frontend fetch helpers and extend it only where the baseline is incomplete.
- API plan:
  - `GET /api/v1/workspaces`
  - `POST /api/v1/workspaces`
  - `GET /api/v1/workspaces/mine`
  - `GET /api/v1/workspaces/{workspace_uuid}`
  - `PATCH /api/v1/workspaces/{workspace_uuid}`
  - `DELETE /api/v1/workspaces/{workspace_uuid}`
  - `GET /api/v1/workspaces/{workspace_uuid}/members`
  - `POST /api/v1/workspaces/{workspace_uuid}/members`
  - `PATCH /api/v1/workspaces/{workspace_uuid}/members/{user_uuid}`
  - `DELETE /api/v1/workspaces/{workspace_uuid}/members/{user_uuid}`
  - `GET /api/v1/workspaces/{workspace_uuid}/application-information`
  - `POST /api/v1/workspaces/{workspace_uuid}/application-information`
  - `GET /api/v1/workspaces/{workspace_uuid}/application-information/{application_information_uuid}`
  - `PATCH /api/v1/workspaces/{workspace_uuid}/application-information/{application_information_uuid}`
  - `DELETE /api/v1/workspaces/{workspace_uuid}/application-information/{application_information_uuid}`
  - `GET /api/v1/workspaces/{workspace_uuid}/application-information/{application_information_uuid}/contacts`
  - `POST /api/v1/workspaces/{workspace_uuid}/application-information/{application_information_uuid}/contacts`
  - `PATCH /api/v1/workspaces/{workspace_uuid}/application-information/{application_information_uuid}/contacts/{contact_uuid}`
  - `DELETE /api/v1/workspaces/{workspace_uuid}/application-information/{application_information_uuid}/contacts/{contact_uuid}`
  - `GET /api/v1/workspaces/{workspace_uuid}/applications`
  - `POST /api/v1/workspaces/{workspace_uuid}/applications`
  - `GET /api/v1/workspaces/{workspace_uuid}/applications/{rp_application_uuid}`
  - `PATCH /api/v1/workspaces/{workspace_uuid}/applications/{rp_application_uuid}`
  - `DELETE /api/v1/workspaces/{workspace_uuid}/applications/{rp_application_uuid}`
  - `GET /api/v1/workspaces/{workspace_uuid}/applications/{rp_application_uuid}/usage/summary`
  - `GET /api/v1/workspaces/{workspace_uuid}/applications/{rp_application_uuid}/audit-events`
- Error-contract expectation: restored APIs reuse STD-010 safe error responses and the existing structured error envelope instead of ad hoc payloads.
- Rationale: this keeps the implementation aligned with code that already exists in the repo and gives frontend work concrete endpoints without inventing a separate route tree.

### Decision 3: Preserve explicit ownership boundaries between application information and environment registrations

- Choice: keep the canonical-versus-environment split from reconcile instead of storing multiple environments or all onboarding text in one RP application blob.
- Owned records and responsibilities:

| Record | Owner and relationship | Required responsibilities |
|---|---|---|
| `workspace` | Department-owned container | name, slug, description, department association, timestamps, deletion behavior, membership summary |
| `workspace_membership` | Workspace-to-user join | one active membership per user and workspace, role, timestamps, add or update or remove semantics |
| `application_information` | Workspace-owned business record | canonical bilingual service names, onboarding narrative sections, optional linkage target for one or more RP applications |
| `application_information_contact` | Child of application information | named contact details with role or responsibility and official-language-aware contact fields |
| `rp_application` | Workspace-owned environment registration | one CanadaLogin environment per record, optional `application_information` link, OIDC registration payload, IBM Verify identifier or status, usage and audit visibility |

- Relationship rules:
  - one workspace belongs to exactly one department
  - one workspace can own many application-information records
  - one application-information record can own many contacts
  - one application-information record can be linked to many RP application records, but each RP application record belongs to exactly one workspace and one CanadaLogin environment
  - deleting an application-information record that still has linked RP applications is rejected until the linkage is removed or the linked RP applications are deleted
- Rationale: STD-020 and PAT-012 favor explicit ownership, auditable business records, and visible relationship rules.

### Decision 4: Treat each workspace-scoped RP application as one environment-specific registration

- Choice: the workspace-scoped RP application resource represents one environment registration, not a multi-environment aggregate.
- Required detail shown on create, edit, and detail surfaces:
  - CanadaLogin environment and bilingual application labels
  - environment URLs, redirect URIs, post-logout redirect URIs, logout mode, and logout URI
  - client type, client authentication method, key-distribution branch, scopes, sector identifier, pairwise-identifier sharing, migration sector-identifier URL, and PKCE answers
  - message-signing, signature-validation, encryption, and decryption capability answers, including algorithm arrays and roadmap or risk follow-up fields
  - IBM Verify application identifier and current registration status when present
- Operational views:
  - `/usage` shows the existing usage-summary slice for the selected workspace-scoped RP application
  - `/audit` shows bounded audit events and download affordances for the selected workspace-scoped RP application
- Rationale: this matches the OIDC questionnaire map in reconcile and avoids losing per-environment fidelity.

### Decision 5: Keep authorization narrow and role-based

- Choice: workspace administrators own create, edit, membership, and delete actions for workspace-owned resources; non-admin authorized users may read only the workspaces and records allowed by the existing access model.
- Access expectations:
  - workspace-admin-only: create or edit workspace metadata, manage members, create or edit application information, manage contacts, create or edit workspace-scoped RP applications, delete workspace-owned records, review workspace-scoped audit exports
  - authorized reader: view workspace, application-information, and RP application detail only when the current access model allows that workspace relationship
  - invited-developer behavior remains out of scope and must not be inferred from this change
- Rationale: this keeps baseline behavior aligned with current IAM boundaries and avoids leaking invitation scope into workspace membership.

### Decision 6: Carry forward the questionnaire-derived validation rules now, not later

- Choice: the first workspace-scoped RP application implementation must enforce the conditional validation already recorded in reconcile instead of deferring it to governance work.
- Required validation rules:
  - `canada_login_environment` is required and one RP application record maps to exactly one selected environment
  - `requested_scopes` always includes `openid`
  - Authorization Code Flow remains the supported response flow for submit-ready registrations
  - `pkce_supported` is required and must be `true` for `public` clients
  - `logout_mode = front_channel` is valid only for `canada.ca` domains
  - `private_key_jwt` requires the matching key-distribution branch and dependent value
  - any `other` algorithm selection requires the corresponding free-text field
  - unsupported signing, validation, encryption, or decryption answers require the roadmap or risk follow-up branch
- Rationale: reconcile already mapped the questionnaire in detail, so implementation should start with those rules rather than an incomplete placeholder form.

## Standards impact

```yaml
standards_impact:
	ui:
		applies: true
		decision: Use STD-005 and STD-006 route and page-shell rules, PAT-017 for detail summaries, and PAT-023 for workspace and membership tables instead of mixed-purpose admin screens.
		evidence: Frontend route plan is recorded in this design and implementation tasks call for route-state tests.
		exceptions: []
	accessibility:
		applies: true
		decision: Apply STD-007 and STD-017 to forms, tables, headings, validation feedback, and keyboard or focus behavior across all restored workspace pages.
		evidence: Frontend tests cover loading, empty, validation-error, success, and denied states.
		exceptions: []
	official_languages:
		applies: true
		decision: Bilingual application names, labels, notices, and contact fields must preserve English and French parity on restored pages and API payloads.
		evidence: Locale updates and route coverage are part of implementation tasks.
		exceptions: []
	security_privacy:
		applies: true
		decision: Reuse STD-009 and STD-010 error and authorization boundaries, keep safe failures for unauthorized or missing resources, and avoid exposing secrets in workspace-scoped audit or usage views.
		evidence: Backend contract and authorization tests cover denial, not-found, and validation branches.
		exceptions: []
	identity_access:
		applies: true
		decision: Workspace membership and workspace-admin actions must reuse existing RBAC and not silently grant invitation-scoped or department-wide access.
		evidence: Permission tests cover add, role-change, remove, create, edit, delete, and read-only behavior.
		exceptions: []
	information_management:
		applies: true
		decision: Apply STD-020 and PAT-012 to new or restored records, explicit foreign keys, lifecycle timestamps, and deletion safeguards.
		evidence: Migration review notes and persistence tests cover ownership and relationship rules.
		exceptions: []
	verification:
		applies: true
		decision: Validate this OpenSpec package and add focused backend and frontend tests before governance and reporting implementation starts.
		evidence: `make validate-openspec-change`, targeted backend tests, frontend route and form tests.
		exceptions: []
	gc_web_application_baseline:
		applies: true
		decision: Treat this as meaningful baseline restoration for a GC web application and keep baseline-aware verification visible during implementation.
		evidence: Standards impact stays attached to this change for implementation handoff.
		exceptions: []
```

## Slice Plan

### Slice 1: Workspace CRUD shell

- Outcome: authorized users can list and open accessible workspaces, and workspace admins can create, edit, and delete workspace records.
- Impacted areas: workspace routes, workspace APIs, repository layer, authorization checks, list and detail tests.
- Exit condition: `/workspaces` and `/api/v1/workspaces` support list, detail, create, edit, and delete with safe error handling.

### Slice 2: Membership management

- Outcome: workspace admins can add, role-update, and remove workspace members from a dedicated membership route.
- Impacted areas: membership routes, membership APIs, user search integration, role-update behavior, permission tests.
- Exit condition: `/workspaces/$workspaceUuid/members` and `/api/v1/workspaces/{workspace_uuid}/members` support list, add, update, and remove with duplicate-membership protection.

### Slice 3: Application information and contacts

- Outcome: workspace admins can create, view, edit, and delete application-information records and manage related contacts.
- Impacted areas: application-information routes, APIs, persistence, contact CRUD, deletion safeguards, tests.
- Exit condition: `/workspaces/$workspaceUuid/application-information` and related contact endpoints work end to end and preserve canonical application metadata.

### Slice 4: Workspace-scoped RP application management

- Outcome: workspace admins can create, view, edit, and delete environment-specific RP applications linked to a workspace and optional application-information record, and can review usage or audit views for those records.
- Impacted areas: application routes, APIs, validation, IBM Verify identifier visibility, audit and usage views, tests.
- Exit condition: `/workspaces/$workspaceUuid/applications` and related usage or audit endpoints work end to end with questionnaire-derived validation.

## Implementation readiness

- Ready now: yes.
- Dependency status: this change is the reconcile follow-on package that the advance change depends on; no additional spec split is required before code implementation starts.
- Remaining blockers inside OpenSpec: none.
- Recommended implementation order:
  1. Slice 1: workspace CRUD shell
  2. Slice 2: membership management
  3. Slice 3: application information and contacts
  4. Slice 4: workspace-scoped RP application management

## Open Questions

- None. Any later reviewer-state, invitation, or dashboard decisions belong to their own follow-on changes.
