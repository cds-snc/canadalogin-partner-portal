# CanadaLogin Partner Portal

## End-of-MVP 2 Product Requirements and Design

Consolidated target-state snapshot derived from OpenSpec

| Document control | Value |
|---|---|
| Version | 0.1 |
| Status | Draft target-state synthesis |
| Source snapshot | 2026-08-12 |
| Repository state | `feature/release2_deloreanSetup` at `c37f3f0`, including reviewed working-tree OpenSpec changes |
| Intended audience | Product, design, architecture, engineering, operations, security, accessibility, and delivery stakeholders |
| Authority | OpenSpec remains the source of truth |

> This document describes the intended Partner Portal when the selected MVP 2
> scope is complete. It is not evidence that every target feature is currently
> implemented, verified, approved, deployed, or release-ready.

Prepared as a human-readable companion to the detailed requirements and
scenarios in `openspec/`.

<!-- PAGE BREAK -->

## 1. Executive summary

CanadaLogin Partner Portal is a bilingual, authenticated service for onboarding
and operating relying-party (RP) applications that integrate with CanadaLogin.
It brings partner workspace administration, application information, OIDC
registration, credentials, access delegation, onboarding governance, usage,
and supportability into one role-scoped experience.

At the end of MVP 2, the portal is intended to let CanadaLogin administrators
bootstrap and govern partner access without becoming partner superusers; let
partner teams manage their own workspace and RP application configuration; and
let read-only collaborators inspect safe operational information. The product
tracks onboarding from draft through launch, provides advisory readiness and
out-of-band production-review traceability, and preserves a strict boundary
around RP client secrets.

### 1.1 What "end of MVP 2" means here

This synthesis applies OpenSpec overlay semantics in this order:

1. **CURRENT** - the ten capability specs under `openspec/specs/` define the
   baseline.
2. **TARGET** - the following active, unarchived changes are treated as the
   provisional MVP 2 completion overlay:
   - `add-authenticated-home-and-navigation-groups`;
   - `refine-workspace-task-hub-and-registration-flow`;
   - `add-cl-admin-rp-registration-adoption`.
3. An active `MODIFIED` requirement replaces its matching current requirement;
   `ADDED` requirements join the target; `REMOVED` requirements are absent.
4. Active change designs clarify the requirements. Task checklists describe
   delivery status, not product behavior.

There is no single repository artifact assigning all three active changes to a
formal MVP 2 milestone. Their inclusion is an **ASSUMPTION** that should be
confirmed by the product owner before this document becomes an approved
baseline.

| Interpretation label | Meaning in this document |
|---|---|
| CURRENT | Declared in the current OpenSpec capability baseline. |
| TARGET | Required by a selected active change but not yet archived. |
| ASSUMPTION | Editorial synthesis that needs an owner decision or validation. |
| DEFERRED | Explicitly outside MVP 2 or not sufficiently specified. |

### 1.2 Delivery-state warning

The source snapshot shows 31 of 43 tasks checked for Home/navigation, 25 of 61
for the workspace task hub and registration flow, and 5 of 29 for MVP1 RP
registration adoption. This PRD is therefore a target-state contract, not a
claim about current release completeness.

<!-- PAGE BREAK -->

## 2. Product intent, outcomes, and users

### 2.1 Product intent

Provide a secure, auditable, and understandable service through which approved
government partner teams can onboard and operate CanadaLogin integrations with
less duplicate entry, clearer ownership, and traceable governance.

### 2.2 MVP 2 outcomes

- Partner users can understand where to start, resume work, and move between
  workspace, application, access, report, and support tasks.
- CanadaLogin and partner authority is explicit through four immutable roles
  and server-owned workspace assignments.
- Application information and reviewed reusable OIDC answers can be captured
  once, recovered safely, and copied into an independent named draft for any
  CanadaLogin environment.
- Test and staging work remains partner-driven; Production review is an
  explicit action on one selected Production configuration and is traceable
  without turning the portal into a full approval engine.
- Secret access is available only to partner editors, while CL Admin retains
  oversight without credential or secret visibility.
- Onboarding queues and aggregate reports make workload, invitation conversion,
  secret hygiene, and Production-review activity visible within the caller's
  scope.
- MVP1 registrations can be adopted into the canonical workspace model without
  changing their stable portal identity or importing unsafe provider data.

### 2.3 Personas and responsibilities

| Persona | Product responsibility |
|---|---|
| CL Admin | Global governance, workspace bootstrap, initial RP Admin assignment, cross-workspace oversight/review/reporting, and allowlisted IBM Verify administration. Never reads RP secrets or edits partner configuration. |
| RP Admin | Administers one or more assigned workspaces, configuration, credentials, reports, audit views, and invitations for lower partner roles. |
| RP User (Edit) | Edits application and RP configuration, uses secret workflows, copies reviewed reusable answers into independent drafts, requests Production review, and reads reports. Cannot administer roles or invitations. |
| Read Only | Reads safe workspace, OAuth, usage, report, and redacted audit information. Cannot mutate data or access secrets. |
| Invitee | A prospective partner user who gains one canonical workspace role only after valid, identity-matched acceptance. |
| Operator/support | Uses health, readiness, request identifiers, logs, and external support processes; no separate operator product role is defined. |

Historical labels such as platform admin, workspace admin, workspace member,
superuser, and application owner are not additional product roles.

### 2.4 Product non-goals

MVP 2 does not provide anonymous self-service onboarding, billing, configurable
authorization roles, a complete in-portal production approval engine, native
mobile apps, or an approved production deployment topology.

<!-- PAGE BREAK -->

## 3. Business requirements - admission, roles, and access

### BR-01 - Authenticated service access [CURRENT]

Protected pages and APIs must require CanadaLogin OIDC authentication backed by
a server-side session. The browser must not store OIDC access, refresh, or ID
tokens. An absent or invalid session starts the login flow.

### BR-02 - Deterministic admission [CURRENT + TARGET]

After sign-in, the portal must apply this precedence: current terms acceptance,
an explicitly opened and eligible tokenized invitation, applicable personal
department setup, canonical authorization, and then an authorized intended
destination or authenticated Home. An unsafe destination is discarded. A user
with no usable product access is denied safely.

### BR-03 - Task-oriented Home and navigation [TARGET]

Authenticated `/` must be a service Home that orients users to available task
areas. Primary navigation must expose Home, authorized Partner work,
Onboarding oversight, and Administration. Account/sign-out controls remain
separate and Support moves to utility or footer navigation. `/your-applications`
is a partner operational overview, not the generic Home.

### BR-04 - Four immutable roles [CURRENT]

Authorization must use exactly `cl_admin`, `rp_admin`, `rp_user_edit`, and
`read_only`. Role definitions, capability mappings, scope rules, and Casbin
subjects are system-owned and cannot be created, renamed, deleted, or extended
through portal administration.

### BR-05 - Server-owned authorization [CURRENT]

OIDC groups authenticate identity but must not grant portal authority. Active
normalized server assignments are authoritative. Legacy owner snapshots,
`is_superuser`, arbitrary roles, raw role IDs, direct-user policy subjects, and
legacy membership values must fail closed.

### BR-06 - Role scope and separation [CURRENT]

CL Admin is global and cannot concurrently hold partner access. Each partner
role is scoped to one workspace and applies to every RP application in that
workspace. A user may hold different partner roles in different workspaces,
but permissions must never be unioned across them.

### BR-07 - Delegated assignment with integrity [CURRENT]

CL Admin manages CL Admin and RP Admin assignments; the final CL Admin cannot
be revoked. RP Admin may manage only RP User (Edit) and Read Only within the
same workspace. Replacements and revocations must be atomic, auditable, and
effective by the next protected request.

### BR-08 - Safe authorization context [CURRENT]

The backend must provide canonical role keys and public workspace UUIDs needed
for route and action presentation without exposing raw claims, internal IDs,
policy rules, or client-editable permissions. Client-side visibility never
replaces backend enforcement.

### BR-09 - Workspace Access [TARGET]

`/workspaces/{workspaceUuid}/access` must be the canonical assignment and
invitation surface. The legacy Members route may redirect only after normal
authentication and authorization checks. Email addresses, tokens, and
assignment payloads must not appear in URLs or unsafe diagnostics.

<!-- PAGE BREAK -->

## 4. Business requirements - workspaces and onboarding

### BR-10 - Workspace ownership [CURRENT + TARGET]

CL Admin must be able to create and bootstrap a department-scoped workspace.
RP Admin may administer safe metadata in an assigned workspace. `/workspaces`
is an authorized chooser and `/workspaces/{workspaceUuid}` is a focused task
hub linking Overview, Application information, RP applications, Access,
Reports, and Settings according to capability.

### BR-11 - Application information and contacts [CURRENT]

Application information must remain workspace-owned and capture bilingual
service names plus overview, technology/protocol, security/privacy, usage, and
migration/transition context. Contacts remain separate related records.
Partner editors may create and edit; linked RP applications must block unsafe
deletion.

### BR-12 - Environment-specific RP registrations [CURRENT]

Each RP application represents exactly one CanadaLogin environment registration
in one workspace and may link to shared application information. Separate test,
staging, and production registrations must not overwrite one another.

### BR-13 - Complete OIDC questionnaire [CURRENT + TARGET]

The registration must capture bilingual names and URLs, redirect/logout
endpoints, client type and authentication, required Authorization Code Flow,
scopes with `openid`, sector and pairwise-identifier choices, PKCE, signing,
signature validation, encryption, decryption, algorithms, and conditional
roadmap answers. Public clients require PKCE; front-channel logout is limited
to `canada.ca`; private or symmetric key material must be rejected.

### BR-14 - Recoverable registration transaction [TARGET]

The questionnaire must use Basics, Endpoints, Client and access, Signing,
Encryption, Review, and Confirmation. A valid Basics step creates one
server-backed draft. Continue validates its step; Save and exit may retain
incomplete data; Back and Cancel preserve the last server save. Refresh,
network failure, session expiry, and language switching must support safe
recovery.

Only a complete Review submission may atomically move `draft` to `submitted`.
Optimistic version conflicts must not overwrite newer work. Submitted,
under-review, approved, launched, unknown, stale, or out-of-scope records are
not editable through the draft flow.

### BR-15 - Onboarding lifecycle and advisory readiness [CURRENT]

Workspaces, application information, and RP applications must expose `draft`,
`submitted`, `under_review`, `approved`, and `launched`. Partner editors prepare
and submit; CL Admin owns review-only transitions; Read Only observes. Section
completion and overall readiness must be visible, but missing contacts,
checklist items, or evidence references remain advisory rather than hard portal
gates in MVP 2.

### BR-16 - Configuration copy and Production review [CURRENT]

An authorized partner editor may copy one selected Test, Staging, or Production
configuration into a distinct named draft in any CanadaLogin environment,
including the source environment. Copying uses a reviewed allowlist of
reusable non-secret answers, requires an explicit target name and Partner
environment, preserves optional lineage, and excludes endpoints, URLs,
redirect and logout URIs, credentials, secrets, provider identifiers,
certificates, key material, review outcomes, and audit history. Copying never
requests, approves, deploys, launches, mutates, or overwrites a configuration.
Production review is requested separately for one selected Production
configuration and must remain traceable through the CL Admin-recorded
out-of-band outcome and external reference.

### BR-17 - MVP1 RP registration adoption [TARGET]

CL Admin must be able to review unassigned retained MVP1 registrations, preview
an allowlisted non-secret IBM Verify projection for one candidate, and
explicitly link that record to one active workspace. Existing non-empty portal
values win. The operation preserves the local UUID, IBM ID, department derived
from the workspace, and portal audit history. It is atomic, idempotent for the
same workspace, conflict-safe for a different workspace, and must never import
owners, credentials, secrets, raw payloads, or IBM audit history.

<!-- PAGE BREAK -->

## 5. Business requirements - collaboration and operations

### BR-18 - Invitation lifecycle [CURRENT]

CL Admin may invite the first RP Admin. RP Admin may invite RP User (Edit) or
Read Only only in its workspace. Acceptance requires a valid pending,
unexpired token and a signed-in email match, and it must create exactly one
canonical workspace assignment. Replays are idempotent; an invitation cannot
overwrite an existing role. Pending, accepted, expired, and revoked history
must be retained. Automatic email dispatch is not required for creation to
succeed.

### BR-19 - Partner application detail and department preflight [CURRENT]

Authorized partner users must receive a secret-free application/OAuth view
using fresh data and a backend-configured discovery endpoint. Scope must be
checked before any IBM Verify call. When an in-scope RP application has no
department, RP Admin and RP User (Edit) enter a one-time assignment flow;
Read Only is never offered that mutation. Out-of-scope and missing resources
must be indistinguishable.

### BR-20 - Credential and secret lifecycle [CURRENT]

RP Admin and RP User (Edit) may copy client ID, explicitly reveal/copy the
masked current secret, regenerate it, create named rotated secrets, and delete
selected rotations. Read Only and CL Admin must be denied before upstream
secret retrieval or mutation. Secret values must never enter reports, audit
events, URLs, logs, screenshots, analytics, or unsafe browser storage.

### BR-21 - Usage, audit, and partner reporting [CURRENT + TARGET]

All partner roles may view in-scope MAU data and bounded, role-appropriate RP
audit events. MAU supports date filtering and export of only the loaded scoped
data. `/workspaces/{workspaceUuid}/reports` must expose aggregate onboarding
throughput, invitation conversion, and secret-rotation hygiene for exactly one
selected authorized workspace, including safe loading, empty, partial, error,
filter, and aggregate-only export states.

### BR-22 - Cross-workspace oversight [CURRENT]

CL Admin must have a separate onboarding queue and reports area covering
authorized cross-workspace metadata. Filters include lifecycle, record type,
department, workspace, environment, and Production-review status. Submitted and
under-review work is prioritized. Internal notes and checklist outcomes are
restricted to CL Admin; partner users receive only permitted status and
readiness summaries.

### BR-23 - Platform governance [CURRENT + TARGET]

Administration must provide focused tasks for users and canonical assignments,
departments, tiers, audit logs, and the immutable role reference. Mutable
authorization policy CRUD is absent from the target information architecture.
Partner roles must not enter global governance.

### BR-24 - IBM Verify administration boundary [CURRENT]

Only CL Admin may use an explicit allowlist of Verify user, application, group,
entitlement, login, and audit-query operations. Client credentials, RP secret
reads, and secret lifecycle operations are excluded and rejected before an
upstream call. Allowed responses must redact secret-bearing fields.

### BR-25 - Errors, health, and operational logging [CURRENT]

The backend must expose health and readiness endpoints and a handled-error
envelope containing code, safe message, details, and request ID. The bilingual
`/error` page provides not-found and unexpected variants with recovery actions.
Every handled 4xx/5xx response must produce structured logging at the
appropriate level with request context, hashed sensitive query values,
pseudonymized user identity, and failure-safe logging behavior.

<!-- PAGE BREAK -->

## 6. End-to-end experience and information architecture

### 6.1 Admission and access journey

1. The user enters the public service and signs in through CanadaLogin.
2. The backend completes OIDC and establishes the opaque server session.
3. The portal resolves terms, an explicitly opened invitation, and applicable
   personal department setup in mandatory order.
4. Current server-owned assignments determine usable product areas.
5. A safe deep link is resumed; otherwise the user enters authenticated Home.
6. No usable assignment results in `/access-denied`, not inferred access.

### 6.2 Partner onboarding journey

1. CL Admin creates a department-scoped workspace and establishes its first RP
   Admin.
2. RP Admin invites collaborators through Access; acceptance creates the
   workspace-scoped role.
3. A partner editor creates application information and contacts and reviews
   advisory completion.
4. The editor creates or resumes an environment-specific OIDC registration,
   reviews it, and submits exactly once.
5. When reuse is helpful, the editor copies one selected configuration into an
   independent named Test, Staging, or Production draft and completes all
   excluded environment-specific fields separately.
6. For a selected Production configuration, the editor explicitly requests
   Production review. The external decision is recorded by CL Admin with a
   traceable reference.
7. After launch, authorized roles use OAuth setup, credentials, MAU, reports,
   and bounded audit views according to their role.

### 6.3 Oversight journey

CL Admin scans the cross-workspace operational overview, filters the actionable
queue, opens a focused record, records internal notes/checklist outcomes,
updates review state or external production-review trace, and monitors
aggregate trends. CL Admin never enters partner secret or configuration flows.

### 6.4 Target information architecture

| Area | Page role | Key destinations |
|---|---|---|
| Home `/` | Service task hub | Authorized parent task areas only. |
| Partner work | Navigation group | Your applications; Workspaces. |
| Your applications | Operational overview | Status scan and resume links; no embedded admin forms. |
| Workspace | Scoped task hub | Overview; Application information; RP applications; Access; Reports; Settings. |
| Onboarding oversight | Internal operational area | Overview; Queue; Reports; focused review records. |
| Administration | Governance task hub | Users and access; Departments; Tiers; Audit logs; Role reference. |
| Account and support | Utility destinations | User context; sign out; Support. |

Navigation visibility supports discoverability only. Every child route and API
must independently re-check session, role, workspace, object, and lifecycle
scope.

<!-- PAGE BREAK -->

## 7. Architecture - system context

The Partner Portal is a browser service and backend-for-frontend (BFF). It owns
the user-facing onboarding and operations experience, browser session,
canonical portal authorization, local domain records, workflow state, and
orchestration of external services. CanadaLogin, IBM Security Verify, GC
Notify, and the S3 MAU source remain external systems.

<!-- DIAGRAM:CONTEXT -->

### 7.1 Trust and ownership boundaries

| Boundary | Design rule |
|---|---|
| Browser to portal | Opaque cookie and safe DTOs only; no provider tokens or authorization rules. |
| Portal to CanadaLogin | OIDC establishes identity and logout context, not product authorization. |
| Portal to IBM Verify | Scope is checked first; only allowlisted detail or secret operations are called. |
| Portal to GC Notify | Invitation delivery is optional to invitation persistence and authority creation. |
| Portal to S3 | Background ingestion reads MAU source data; browsers never access S3 directly. |
| Partner scope | One selected workspace per request; cross-workspace data is never sent for client filtering. |

The portal is the policy enforcement point for browser activity. Partner RP
applications use their registered clients with CanadaLogin but do not call the
portal as part of the end-user sign-in path described here.

<!-- PAGE BREAK -->

## 8. Architecture - containers and data

<!-- DIAGRAM:CONTAINERS -->

### 8.1 Container responsibilities

| Container | Responsibility |
|---|---|
| React/Vite SPA | GC Design System page shell, TanStack routing/query, bilingual task flows, status/recovery presentation, and typed BFF calls. |
| FastAPI BFF/API | OIDC/session authority, authorization, API contracts, business workflows, validation, audit, reporting, and external orchestration. |
| ARQ worker | Separately running scheduled and retryable IBM/MAU jobs through Redis queueing. |
| PostgreSQL | Durable identity, assignments, workspaces, application information, RP registrations/drafts, copy lineage, invitations, grants, lifecycle, Production review, and audit records. |
| Redis | Logically separated session, cache, queue, and rate-limit state; critical to authenticated availability. |

### 8.2 Dependency direction

- Backend: HTTP route -> service/workflow -> repository -> PostgreSQL or
  external system.
- Frontend: route -> feature page/hook -> typed fetch client -> BFF.
- TanStack Query owns server-backed data. Zustand may cache a presentation
  projection but is never an authentication or authorization authority.
- Database schema changes use Alembic migrations. Runtime role capability
  policy remains immutable code-owned configuration.

### 8.3 Principal data domains

Identity and governance include users, canonical assignments, departments,
tiers, and access history. Partner onboarding includes workspaces, application
information, contacts, environment-specific RP registrations and server-backed
draft progress. Collaboration includes invitations and workspace grants.
Governance includes lifecycle states, Production-review requests, append-only review
notes, current checklist outcomes, and audit events. Provider tokens and RP
secret values are not ordinary portal business records.

<!-- PAGE BREAK -->

## 9. Architecture - runtime, security, and deployment posture

### 9.1 Protected-request flow

<!-- DIAGRAM:RUNTIME -->

The BFF owns OIDC exchange and retains tokens/logout context in Redis. On every
protected request it re-establishes the enabled user and current normalized
assignments, applies immutable Casbin resource/action policy, then enforces
workspace, object, lifecycle, and business constraints before persistence or
external I/O. Revocation therefore takes effect by the next protected request.

### 9.2 Durable decisions

| Decision | Status | Consequence |
|---|---|---|
| ADR-001: BFF and Server Session Authority | Accepted | Browser stores no OIDC tokens; protected entry revalidates with the backend. |
| ADR-003: Casbin Authorization Model | Accepted | Four stable role subjects, normalized assignments, immutable capability policy, layered server enforcement. |
| ADR-002: API Wire and Error Contract | Proposed | Target JSON casing is not yet universal; preserve each implemented contract until coordinated migration. |

### 9.3 Evidenced deployment posture

The current repository evidences a development delivery path: GitHub Actions
uses AWS OIDC; the SPA is published through S3 and CloudFront; API and worker
images are built for ECR and deployed to pre-existing ECS services; immutable
image references are recorded in SSM. Health/readiness cover PostgreSQL and
Redis, and the backend build emits an SBOM.

This is not an approved production topology. VPC/subnet design, managed
database/cache selection, WAF, backup/restore, multi-zone resilience,
autoscaling, alarms, log retention, secrets source, recovery objectives,
production domains, and release ownership remain outside this document's
evidence boundary.

### 9.4 Background processing

The ARQ worker runs separately from FastAPI. The MAU job reads S3 source files
and caches derived results. A legacy IBM RP synchronization job is restricted
to local/test; the target non-local transition uses explicit CL Admin adoption
instead of unattended authority-changing synchronization.

<!-- PAGE BREAK -->

## 10. Quality, security, and service requirements

### QR-01 - Accessibility and GC design

The service must use the GC Design System page shell and appropriate task-hub,
overview, form, table, notice, breadcrumb, and side-navigation patterns. Every
page needs a skip link, main landmark, meaningful title, one H1, visible focus,
keyboard operation, semantic status, and non-colour-only cues. Content and
tasks must reflow at narrow widths and 200 percent zoom.

### QR-02 - Official languages

English and French must remain equivalent for navigation, routes, headings,
hints, validation, status, breadcrumbs, actions, recovery text, accessible
names, and exports where applicable. The shared language control preserves the
equivalent safe context.

### QR-03 - Least privilege and non-disclosure

The backend is authoritative. Unknown roles, malformed assignments, mixed CL
Admin/partner state, revoked access, unresolved workspace scope, and legacy
authorization values fail closed. Safe 404 behavior must not reveal whether an
out-of-scope workspace, application, secret, invitation, or report exists.

### QR-04 - Secret and sensitive-data handling

OIDC tokens, client secrets, invitation tokens, private/symmetric keys,
authorization payloads, questionnaire answers, and unnecessary personal data
must be excluded from URLs, browser persistence, analytics, error messages,
logs, exports, screenshots, and fixtures. Logs hash sensitive query values and
pseudonymize authenticated user identifiers.

### QR-05 - Integrity and recoverability

Consequential changes use database constraints and appropriate locking,
idempotency, or optimistic concurrency. Assignment replacement, invitation
reissue/acceptance, final registration submission, production review, secret
operations, and MVP1 adoption must not create duplicate or partially applied
authority.

### QR-06 - Audit and records

Assignment, invitation, onboarding, configuration copy, Production review, adoption, secret lifecycle,
and privileged review activity must retain actor, target, scope, time, outcome,
and correlation context without secret values. Historical authorization data
does not grant access. Final retention and disposition schedules remain a
separate owner decision.

### QR-07 - API and error compatibility

APIs use explicit typed request/response models, public UUID boundaries,
generated OpenAPI, and the standard handled-error contract. Existing endpoint
casing remains stable until ADR-002 is accepted and a coordinated migration is
approved.

### QR-08 - Reliability and supportability

Health/readiness, request IDs, structured errors, failure-safe logging, safe
external-provider degradation, and explicit worker enablement are required.
Loading, empty, partial, stale, error, unauthorized, success, retry, and return
states must be designed for operational pages rather than treated as incidental
UI behavior.

<!-- PAGE BREAK -->

## 11. Success measures, exclusions, and decisions required

### 11.1 Proposed success measures [ASSUMPTION]

These measures are outcome hypotheses rather than normative OpenSpec
requirements and need product analytics definitions before use:

- median time from workspace bootstrap to first submitted RP registration;
- registration draft completion and safe-resume rate;
- first-pass completeness at staging and production review;
- invitation acceptance conversion and median acceptance time;
- percentage of active RP applications within the secret-rotation policy
  window;
- onboarding throughput into submitted, approved, and launched;
- partner self-service completion without CL Admin configuration intervention;
- zero CL Admin RP-secret exposure and zero cross-workspace disclosure;
- accessibility, bilingual parity, and critical-flow test pass rate.

### 11.2 Explicitly deferred from MVP 2

- Full in-portal production approval, waiver, or evidence-gating automation.
- CATS evidence upload; MVP 2 provides advisory status, references, and links.
- Hard blocking solely for readiness, contacts, checklist, or evidence gaps.
- Partner volume-spike notification, detailed incident intake/SLA, and a
  first-class deprecation workflow.
- A dedicated reporting role, report drill-down, new metric families, or
  cross-application workspace audit.
- Amendments to submitted/under-review/approved/launched registrations.
- A global workspace switcher or RP-application-specific roles.
- Custom roles or mutable runtime authorization policy.
- Automatic invitation email delivery as a precondition for invitation
  creation.
- Private/symmetric key intake, blind IBM-only import, or unattended non-local
  IBM synchronization.
- An accepted M2M bearer-token contract or approved production topology.

### 11.3 Product decisions still required

1. Confirm that the three selected active changes collectively define MVP 2.
2. Resolve workspace-level submit authority for RP User (Edit).
3. Define return-for-rework behavior within the five-state lifecycle.
4. Finalize stage-specific contact requirements, checklist vocabulary,
   evidence-reference schema, and process-link ownership.
5. Define report formulas precisely: invitation creation versus delivery,
   rotation policy window, grouping, columns, localization, and retention.
6. Name the shared-rollout owner, telemetry, and sunset decision for the
   bounded legacy progression adapter before removing it.
7. Close questionnaire limits for URLs, sector identifiers, certificates/JWKs,
   dates, and repeated fields.
8. Confirm the exact IBM Verify operation allowlist and safe projections.
9. Set MAU/audit date, pagination, download, and redaction limits.
10. Complete non-local IBM, security, privacy, retention, deployment,
    monitoring, rollback, support, and release-approval decisions.

<!-- PAGE BREAK -->

## 12. Traceability - requirements 1 to 14

The handles below are document-local summaries. Exact OpenSpec wording and
scenarios remain authoritative.

| ID | State | Capability | Exact OpenSpec requirement title |
|---|---|---|---|
| BR-01 | CURRENT | Access/dashboard | Authenticated session is required for protected portal routes |
| BR-02 | CURRENT | Access/dashboard | Terms acceptance is required before authenticated portal use; First-time users complete department setup before normal portal use |
| BR-02 | TARGET | Access/dashboard | Post-authentication navigation applies mandatory routing precedence |
| BR-03 | TARGET | Access/dashboard | Authenticated Home provides a task-oriented service entry page at `/`; Current-user RP applications page provides a partner operational overview; Administration uses a dedicated task hub |
| BR-04 | CURRENT | Role management | Portal authorization uses exactly four canonical product roles |
| BR-05 | CURRENT | Role management | MVP2 authorization uses locally managed roles instead of the OIDC `application owners` group |
| BR-06 | CURRENT | Role management | Canonical roles have fixed scope and permission boundaries |
| BR-07 | CURRENT | Role management | Role-assignment authority follows the canonical delegation matrix; Role assignments preserve integrity, lifecycle, and audit history |
| BR-08 | CURRENT | Role management | Authenticated clients receive a safe scope-aware authorization context |
| BR-09 | TARGET | Workspace/RP management | Workspace Access replaces the legacy Members destination |
| BR-10 | CURRENT | Workspace/RP management | Workspace administration is restored under dedicated workspace routes |
| BR-10 | TARGET | Workspace/RP management | Workspace entry pages provide a scoped task hierarchy |
| BR-11 | CURRENT | Workspace/RP management | Application information and contacts are managed as workspace-owned records |
| BR-12 | CURRENT | Workspace/RP management | Workspace-scoped RP applications represent one environment registration each |
| BR-13 | CURRENT + TARGET | Workspace/RP management | Workspace-scoped RP application registration follows the current OIDC questionnaire |
| BR-14 | TARGET | Workspace/RP management | Workspace RP application registration uses a recoverable multi-step flow |
| BR-15 | CURRENT | Workspace/RP management | Onboarding lifecycle state is tracked across core onboarding records; Application information records show advisory readiness indicators |
| BR-16 | CURRENT | Workspace/RP management | RP configuration copying creates an independent named draft; Production review targets one selected Production configuration; Checklist readiness supports an explicit Production review request |
| BR-17 | TARGET | Workspace/RP management | CL Admin reviews unassigned MVP1 RP registration candidates; CL Admin previews safe missing metadata from IBM Verify; CL Admin explicitly links one retained RP to one workspace; RP registration adoption is auditable and fail closed |

High-risk scenario anchors include `Partner role does not cross workspace
scope`, `Last active CL Admin cannot be revoked`, `Final submit occurs once`,
`Stale draft write fails without overwriting newer work`, and `Unauthorized or
invalid adoption fails before mutation`.

<!-- PAGE BREAK -->

## 13. Traceability - requirements 18 to 25 and source manifest

| ID | State | Capability | Exact OpenSpec requirement title |
|---|---|---|---|
| BR-18 | CURRENT | Invitations/access | Invitation acceptance validates token and signed-in identity; Canonical roles manage partner-scoped developer invitations; Invitation and partner-grant lifecycles fail closed and preserve history |
| BR-19 | CURRENT | OAuth/department | Accessible RP application OAuth setup detail endpoint; Active workspace authorization precedes upstream retrieval; OAuth setup responses remain secret-free; Grant-authorized one-time department assignment endpoint |
| BR-20 | CURRENT | Workspace/RP management | Current client secret stays masked until explicitly revealed; Grant-authorized credential management is available for accessible RP applications; Grant-authorized partner editors can operate current and rotated secrets |
| BR-21 | CURRENT | Workspace/RP management | Workspace-scoped RP applications expose usage and audit views; Grant-authorized MAU reporting is available for accessible RP applications |
| BR-21 | CURRENT + TARGET | Oversight/reporting | Operational reporting summarizes onboarding and invitation health; Partner aggregate reporting has a selected-workspace route |
| BR-22 | CURRENT | Oversight/reporting | CL Admin has a cross-workspace onboarding view; CL Admin captures onboarding notes and checklist outcomes |
| BR-23 | CURRENT | Platform administration | Platform administrators manage portal governance records |
| BR-24 | CURRENT | Platform administration | Platform administration exposes IBM Security Verify management operations |
| BR-25 | CURRENT | Platform/error logging | Service health and error supportability are available; Generic error route; Typed error kind handling; Error responses emit structured log entries; Logging failures never prevent error response delivery |

### 13.1 Current capability source manifest

1. `current-user-rp-application-department-setup`
2. `current-user-rp-oauth-setup`
3. `generic-error-route`
4. `partner-portal-access-and-dashboard`
5. `partner-portal-external-developer-invitations-and-scoped-access`
6. `partner-portal-onboarding-oversight-and-reporting`
7. `partner-portal-platform-administration-and-supportability`
8. `partner-portal-role-management`
9. `partner-portal-workspace-and-rp-application-management`
10. `standardized-error-logging`

### 13.2 Selected active change manifest

- `add-authenticated-home-and-navigation-groups`
- `refine-workspace-task-hub-and-registration-flow`
- `add-cl-admin-rp-registration-adoption`

### 13.3 Architecture sources

- `docs/architecture/codebase.md`
- `docs/architecture/adrs/adr-001-bff-and-server-session-authority.md`
- `docs/architecture/adrs/adr-003-casbin-authorization-model.md`
- `docs/architecture/adrs/adr-002-api-wire-and-error-contract.md` (Proposed)

This consolidated document is intentionally derived. When it conflicts with an
OpenSpec requirement or accepted ADR, the OpenSpec or ADR controls.
