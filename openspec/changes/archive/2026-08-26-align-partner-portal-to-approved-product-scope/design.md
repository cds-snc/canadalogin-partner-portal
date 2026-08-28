# Design: Align Partner Portal to approved product scope

## Technical approach

Treat the approved requirement sources and the resolved decisions in
`proposal.md` as the canonical boundary for this identified scope correction.
This design does not claim full coverage of every authoritative PRD feature.
Implement the correction in dependency order: define the remaining status
concepts, preserve minimum audit capture, narrow authorization, remove
unsupported APIs/pages, and then make the retained shells advertise only real
destinations.

The change does not replace the Workspace/Application/RP-configuration model,
the four-role authorization model, or the invitation lifecycle. It removes
product concepts and surfaces that were layered on top of those foundations
without an approved requirement.

## Canonical vocabulary and state ownership

The implementation SHALL keep these state domains separate:

| Domain | Allowed product meaning | Notes |
|---|---|---|
| RP registration | Editable `draft` plus technical completion metadata | Prefer a completion timestamp/flag over a second product lifecycle. Roles may create a configuration, edit its incomplete draft questionnaire, update separately permitted top-level metadata, and copy it. Completed questionnaire answers are not reopened by the draft flow. Final questionnaire completion does not request Production review. |
| Configuration copy | Creates an independent editable draft | Copy never submits, reviews, approves, deploys, or launches. |
| Production review | Absent, `pending`, `approved`, or `rejected` | A partner explicitly creates `pending`; CL Admin records terminal `approved` or `rejected`; retain external reference, reviewer metadata, timestamps, and history. A later review cycle is not inferred. |
| Invitation | `pending`, `accepted`, `expired`, or `revoked` | Reissue creates a new pending record/token and makes the prior token unusable. |
| Role assignment | Active or revoked/historical | Assignment replacement remains atomic and history remains auditable. |
| Checklist/CATS | Item progress, required-artifact visibility, and CATS evidence availability | Not an overall Application lifecycle, score, completion count, or `submit-ready` state. Until upload, external reference, or both is approved, the portal shows `not configured / no portal record` and does not invent evidence persistence. |
| Integration status | Factual partner-facing status by environment when represented by its own approved requirement | It must not be inferred from the retired five-state lifecycle, and this reduction package does not add a missing integration-status contract. |

The generic `draft`, `submitted`, `under_review`, `approved`, and `launched`
sequence SHALL NOT be shared across Workspace, Application, and RP-
configuration records. Existing database values are compatibility data during
migration, not product authority.

## Dashboard and task-hub boundary

Retaining a shell does not retain the removed feature behind it.

| Surface | Retained purpose | Removed content |
|---|---|---|
| `/` | Authenticated orientation and authorized task selection | Embedded analytics or queues |
| `/administration` | Users and access, Invitations, immutable Role reference | Departments, tiers, policies, generic Audit logs, broad Verify administration |
| `/reports` | Discover authorized Application/RP-configuration MAU usage | Onboarding throughput, invitation conversion, secret hygiene, selected-workspace/cross-workspace aggregates |
| `/onboarding-oversight` | CL Admin anchor for Workspaces, Users/access, Invitations, and explicit Production-review work | Generic onboarding backlog/lifecycle filters, internal notes, aggregate metrics and exports |
| Selected Workspace | Applications, Access/Invitations, Settings, and links to permitted MAU usage | Selected-workspace aggregate reports |
| Selected Application | Details, Contacts, RP configurations, checklist/CATS/evidence, and focused configuration/review actions | Overall readiness score and Internal review notes/outcomes |

An authorized shell MAY be sparse or show a localized empty state. It SHALL
NOT render placeholder metrics, unsupported cards, dead links, or a client-
authored permission decision. Direct routes continue to use server-owned
authorization.

## Identity, access, and Administration boundary

- Replace the broad `platform_governance` capability with the focused
  `access_administration` capability. Only CL Admin receives it, and it gates
  the retained Users and access, Invitations, and immutable Role reference
  destinations rather than catalog, policy, audit, or provider administration.
- Keep `/users`, focused user-access children, `/users/invite`, canonical
  workspace Access routes, pending-invitation tables, and immutable `/roles`
  reference content.
- Keep Department association/reference data required for profile setup,
  workspace context, and inherited Application/RP context. Remove Department
  catalog CRUD and all tier catalog behavior.
- Keep fixed role assignment, replacement, and revocation operations. Do not
  expose mutable role definitions, capability mappings, scope rules, policy
  subjects, or reusable roles.
- Remove generic IBM Security Verify management routes for applications,
  groups, entitlements, logins, and audit queries. Bounded provider operations
  remain owned by authentication, safe identity binding, retained-RP adoption,
  and authorized RP-configuration services.
- Preserve CL Admin's absolute denial from RP secret values and secret
  lifecycle operations.

## Invitation delivery and acceptance

Invitation delivery is manual and out of band:

1. An authorized CL Admin or same-workspace RP Admin creates an invitation
   permitted by the delegation matrix.
2. The backend generates an opaque, expiring token, stores only its hash, and
   returns the tokenized acceptance URL only in the create response.
3. The success page provides an explicit bilingual copy control and states
   that the link must be shared through an approved external channel, is not
   emailed by the portal, and cannot be retrieved after leaving the page. The
   exact permitted channels remain an operational launch decision.
4. Reissue invalidates/replaces the earlier pending token and returns one new
   URL under the same one-time-display rule.
5. The generated URL uses
   `/invitations/rp-applications/prepare#token=...`. The public preparation
   page removes the fragment from browser-visible navigation state before any
   authentication redirect and sends the bearer once in a private,
   non-cacheable POST body.
6. The backend validates the pending invitation and stores only its public
   invitation UUID in the encrypted server-owned session. The raw token is not
   placed in a path, query string, authentication redirect, browser storage,
   server session, analytics, or logs.
7. Authentication resumes at the tokenless
   `/invitations/rp-applications/accept` route, whose acceptance POST consumes
   the prepared public UUID. A missing, stale, revoked, or replaced prepared
   reference fails closed and requires the latest manually shared link.
8. The invitee authenticates through CanadaLogin. The backend trims and
   lowercases both the verified authenticated email and invited email, requires
   exact equality without provider alias rewriting, then reapplies the
   configured partner-access domain policy before creating one canonical
   workspace assignment.
9. Revoking a pending invitation prevents acceptance. Revoking an accepted
   user's access is a role-assignment operation, not invitation revocation.

Invitation tokens SHALL NOT appear in list/detail responses, database
plaintext, logs, analytics, evidence, or referrer data. Create/reissue
responses remain private and non-cacheable.

## Reporting and audit boundary

The only retained user-facing report family is scoped MAU/usage for an
authorized RP configuration, including the currently required metrics and
scoped export. Report discovery may identify only the safe hierarchy and
environment labels needed to reach that report.

Audit event capture remains for:

- secret reveal/lifecycle changes and the MVP actor/time CSV log;
- role assignment, replacement, and revocation;
- invitation creation, acceptance, revoke, reissue, and lifecycle history;
- retained-RP adoption;
- configuration copy and Production-review actions; and
- security-relevant failures already covered by standardized logging.

The portal removes generic audit search, arbitrary event exploration, broad
audit export, Read Only audit access, the Administration Audit logs card, and
Verify audit-query pass-through. Audit payloads never contain secret values,
invitation tokens, questionnaire answers, or unnecessary personal information.

## Checklist, CATS, and Production review

The focused Application checklist/evidence surface owns:

- onboarding checklist item progress;
- required artifact visibility;
- CATS evidence availability, including an explicit no-record state while the
  evidence mechanism remains unconfigured;
- contextual external process and documentation links; and
- the selected Production configuration and safe source lineage when a review
  request is prepared.

The evidence record MAY ultimately use upload, an external reference, or both;
this change deliberately does not select that mechanism or implement evidence
persistence. Until a later approved change supplies that mechanism, the
surface SHALL state that no Partner Portal evidence record is configured and
show missing inputs plainly. It SHALL NOT calculate an overall
Application readiness score, completion percentage/count, `submit-ready`
state, or internal review disposition. The PRD's unresolved evidence mechanism
and contact-type gates remain unresolved; implementation must not silently pick
upload-versus-reference or invent a mandatory contact gate.

Production review is a separate explicit action. Creating or completing a
registration, copying to Production, or changing checklist items does not
create or advance it.

## Data and compatibility strategy

Implementation SHALL avoid destructive cleanup in the first slice:

1. inventory generic lifecycle, readiness-score, internal-note, aggregate-
   report, tier/catalog, Verify-admin, and audit-explorer fields/endpoints;
2. add or confirm the narrow registration-completion and Production-review
   contracts;
3. migrate readers/writers and authorization keys to the retained model;
4. keep bounded redirects only where a saved user-facing route has a safe
   retained destination;
5. return `404`/safe unavailable for retired routes that have no retained
   product meaning, including the generic legacy flat RP-configuration detail
   and questionnaire update operations whose untyped contract could bypass
   draft completion guards;
6. preserve historical/audit rows and stop exposing retired content; and
7. remove columns/tables only after references, rollback needs, and retention
   obligations are verified.

No historical value may be translated into `pending`, `approved`, or
`rejected` without a traceable explicit Production-review record. A retained
legacy review row whose status is ambiguous is still historical review data,
not an absent request. It remains unchanged and fails closed until a named
shared-environment owner approves a reconciliation that preserves the prior
history; local implementation does not overwrite it or create a second request
around the existing uniqueness constraint. Secret-free list and summary
projections expose a separate reconciliation-required flag so the UI can avoid
misrepresenting this historical condition as `Not requested`; the flag is not
a lifecycle or review status and grants no mutation capability.

## Work context impact

Local developer / localhost:

- use fake identities, emails, invitations, workspaces, RP configurations,
  metrics, review references, and audit events;
- do not call shared Verify, MAU, notification, or review systems; and
- keep route, API, capability, and database names durable for later reuse.

Shared non-production environment:

- name the target and confirm provider adapters, migration/rollback path,
  token-link handling, log sinks, fake-versus-approved data, and compatibility
  monitoring before use.

Production:

- requires separate approval, staged migration, rollback, monitoring,
  privacy/security review, release evidence, and an explicit retention/
  disposition decision before destructive data removal.

## Impacted artifacts

- OpenSpec deltas: seven capabilities under this change.
- Current specs after archive: the matching files under `openspec/specs/`.
- Backend: lifecycle/review models and services, report/audit/admin endpoints,
  authorization capabilities, invitation write response, migrations, and
  OpenAPI.
- Frontend: dashboard/task hubs, route catalog, tables, registration and
  checklist surfaces, invitation copy UI, translations, and API types.
- Tests: backend service/API/authorization, frontend unit/integration, route
  authorization, accessibility, bilingual parity, migrations, and safe logs.
- Documentation: approved source hierarchy, architecture/API route docs, and
  any design material that repeats retired scope.
- Evidence: Level 2 local verification output and fake-data UI evidence when
  implementation begins.
- Baseline assessment: update the local GC web baseline assessment if affected
  controls or implementation evidence changes.

## Standards and patterns impact

Applicable guidance:

- `STD-002: Work Contexts`
- `STD-003: Full-Stack Application Stack`
- `STD-004: Frontend React and TypeScript`
- `STD-005: Frontend GC Design System`
- `STD-006: GC UI Page Layout Rules`
- `STD-007: UI Accessibility Basics`
- `STD-008: Backend FastAPI`
- `STD-009: REST API`
- `STD-010: API Response and Error Models`
- `STD-011: Logging and Observability`
- `STD-012: Testing Basics`
- `STD-013: Security and Privacy Basics`
- `STD-014: Secrets and Configuration`
- `STD-017: Government of Canada Standards Review`
- `STD-018: Frontend CSS and Design-System Boundary`
- `STD-019: Government of Canada Web Application Baseline Governance`
- `STD-020: Database Persistence`
- `PAT-001: UI Page Patterns`
- `PAT-012: Alembic PostgreSQL Change`
- `PAT-021: Dashboard Overview Page`
- `BAS-001: Government of Canada Web Application Baseline`
- `GC-WEB-001` through `GC-WEB-011`, with emphasis on scope, accessibility,
  official languages, privacy, security, IAM, logging, and service operations
- `TPL-003: Standards Impact Template`
- `TPL-011: GC Web Application Baseline Assessment Template`

Selected UI pattern:

- Keep the existing task-hub pattern for Home, Administration, Reports,
  workspaces, Applications, and RP configurations.
- Keep PAT-021 only for the authorized oversight shell; empty-state or direct
  task links are valid, but unsupported metrics are not.
- Use focused forms/details and semantic tables for invitations and access.
- Use GC Design System buttons for copy/revoke/reissue mutations and real links
  for route navigation.

## Security, privacy, accessibility, and operations notes

- Security: backend authorization remains authoritative; invitation tokens are
  opaque, hashed at rest, non-cacheable, and excluded from logs/referrers.
- Privacy: show the minimum invited email and identity context needed for
  access management; use fake personal information in tests/evidence.
- Accessibility: retained shells, empty states, status text, tables, copy
  confirmation, errors, and focus behavior require keyboard/screen-reader and
  reflow verification.
- Official languages: every removed/renamed route label, status, hint, warning,
  and accessible name must maintain English/French parity.
- Operations: preserve service health/readiness and structured error logging;
  removal of product audit pages does not remove operational/security logs.

## Suggested implementation sequence

1. Canonical status/data contract and migration inventory.
2. Minimum audit capture, including the secret-change CSV.
3. Canonical role/capability reduction and invitation manual-link UX.
4. Aggregate report/API removal plus Reports/workspace shell cleanup.
5. Administration catalog/Verify/audit-surface removal.
6. Readiness/internal-review removal plus checklist/CATS and Production-review
   alignment.
7. Dashboard and route cleanup, compatibility handling, documentation, and
   full verification.

## Open questions that block non-local work

- CATS evidence upload/reference policy, contact-type gates, retention periods,
  compatibility sunsets, permitted external invitation-delivery channels, and
  shared-environment rollout details require named product/operational owners
  before non-local release. None blocks local implementation of the approved
  reduction.
