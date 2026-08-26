# CanadaLogin Partner Portal

## Scope-Aligned Product Requirements And Design Reference

Status: Active implementation reference

Last reviewed: 2026-08-25

This document translates the approved product boundary into one readable
design reference. It does not replace the requirement sources or OpenSpec.

## 1. Requirement Authority

Use this precedence when sources differ:

1. Explicit product decisions recorded in the active
   [`align-partner-portal-to-approved-product-scope`](../../openspec/changes/align-partner-portal-to-approved-product-scope/)
   change, including approved onboarding expansions.
2. [Partner Portal Onboarding PRD](../plans/partner-portal-onboarding-prd.md).
3. [Partner Portal MVP PRD](../plans/partner-portal-mvp.md) as fallback.

The [broader Partner Portal PRD](../plans/partner-portal-prd.md) and
[its derived backlog](../plans/partner-portal-backlog.md) are historical and
non-authoritative. Implemented code is evidence of current behavior, not by
itself a product requirement.

Current functional requirements and acceptance scenarios live in
`openspec/specs/` and active deltas under `openspec/changes/`. If this reference
drifts, update it from those sources rather than extending scope here.

## 2. Product Boundary

The Partner Portal gives authenticated internal and partner roles a secure,
bilingual place to:

- orient from stable dashboard and task-hub anchors;
- manage Partner workspaces, Applications, contacts, and named RP
  configurations;
- reuse a safe allowlist of non-secret RP registration answers through copy;
- complete a recoverable technical registration draft;
- see item-level onboarding checklist and CATS evidence needs;
- request and track a separate out-of-band Production review;
- manage secrets and inspect the minimum secret-change history permitted to
  the role;
- view RP-configuration-scoped MAU/usage;
- manage users, access, invitations, and fixed role reference where authorized;
  and
- adopt retained MVP1 RP registrations through the explicit migration flow.

Sparse dashboard shells remain in scope as durable navigation anchors. An
authorized empty state is valid; invented metrics, placeholder records, and
dead links are not.

The portal does not provide:

- a generic five-state Workspace/Application/RP-configuration lifecycle;
- aggregate onboarding, invitation, secret-hygiene, executive, or
  cross-workspace analytics;
- free-form internal review notes or internal checklist dispositions;
- an overall readiness score, completion count, percentage, or submit-ready
  state;
- Department, tier, policy, rate-limit product catalog, reusable-role, or
  capability CRUD;
- broad IBM Security Verify administration;
- a generic audit explorer or arbitrary event export; or
- automatic invitation email or a GC Notify dependency.

Runtime rate limiting, service health/readiness endpoints, structured
operational logging, and retained historical records remain infrastructure and
service concerns. Removing product administration for tiers/rate-limit policy
does not remove runtime rate limiting.

## 3. People, Roles, And Scope

The role taxonomy is fixed and server owned:

| Role           | Scope                 | Allowed capability families                                                                                                                                                                                                                                                       | Important denials                                                                                                                                                                                                                                |
| -------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| CL Admin       | Global                | Users and access; invitations; immutable role reference; partner-workspace bootstrap; invite or assign any canonical partner role; retained-RP discovery/adoption; safe cross-workspace metadata and checklist/CATS status; explicit Production-review outcomes; oversight anchor | Partner configuration edit/copy; RP secret values or lifecycle; partner-scoped MAU as a global report; mutable role/catalog/policy administration; broad Verify administration; aggregate reports; internal review notes; generic audit explorer |
| RP Admin       | One Partner workspace | Workspace/Application/contact administration; RP-configuration draft, permitted metadata and copy; checklist/CATS; Production-review request; partner secrets and secret-change log; scoped MAU; invite or assign RP User (Edit) and Read Only                                    | Assign RP Admin; CL/global administration; cross-workspace oversight; Production-review outcome; aggregate reports; generic audit explorer                                                                                                       |
| RP User (Edit) | One Partner workspace | Application/contact editing; RP-configuration draft, permitted metadata and copy; checklist/CATS; Production-review request; secret workflows and secret-change log; scoped MAU                                                                                                   | Invitations; role assignment; CL/global administration; cross-workspace oversight; Production-review outcome; aggregate reports; generic audit explorer                                                                                          |
| Read Only      | One Partner workspace | Workspace/Application/RP-configuration metadata; contacts; copy lineage; checklist/CATS visibility; Production-review status; scoped MAU                                                                                                                                          | Mutations or copy; review request; invitations; role assignment; secret values, lifecycle, or change log; CL/global administration; Production-review outcome; aggregate reports; internal/audit records                                         |

One partner role applies to every Application and RP configuration in the
assigned workspace. A user may have different partner roles in different
workspaces, but only one active role in each workspace. CL Admin and partner
assignments may not be combined on one account.

The backend recomputes assignment state, applies the code-owned capability
matrix, validates complete resource ancestry, and fails closed on missing,
ambiguous, conflicting, stale, or cross-workspace state. Frontend visibility is
never an authorization boundary.

## 4. Information Architecture

### 4.1 Stable anchors

| Surface              | Retained purpose                                                                               |
| -------------------- | ---------------------------------------------------------------------------------------------- |
| Home                 | Authenticated orientation and authorized task selection                                        |
| Administration       | Users and access, Invitations, and fixed Role reference                                        |
| Reports              | Discover accessible RP configurations and open their scoped MAU/usage page                     |
| Onboarding oversight | CL Admin anchor for Workspaces, Users/access, Invitations, and explicit Production-review work |
| Workspaces           | Choose or create an authorized Partner workspace and enter its Applications/access tasks       |
| Application hub      | Details, Contacts, Checklist and evidence, and RP configurations                               |
| RP configuration hub | Registration, permitted copy/settings, credentials, scoped MAU/usage, and Production review    |

Admins must retain clear paths to both access and invitation sections. A shell
may show an honest localized empty state when no records exist.

### 4.2 Removed destinations

Navigation and route guards must not advertise catalog/tier/policy editors,
broad Verify administration, aggregate report families, selected-workspace
reports, generic audit logs, internal review notes, or overall readiness
scoring. A retired saved route may redirect only when there is one safe,
semantically equivalent retained destination; otherwise it resolves through a
safe unavailable/not-found contract.

### 4.3 Page design

Use the shared GC Design System app shell and task-hub pattern. Use focused
details/forms, semantic tables for access and invitations, and an itemized
checklist/evidence view. Real navigation uses links; copy, revoke, reissue,
review, and secret mutations use buttons with explicit busy, success, and error
states.

## 5. Product Hierarchy And Data Ownership

```text
Department reference
└── Partner workspace (collaboration and authorization boundary)
    ├── Workspace role assignments and invitations
    └── Application (shared service and onboarding context)
        ├── Application contacts
        ├── Checklist items and CATS evidence context
        └── Named RP configurations (technical registrations)
            ├── Registration completion metadata
            ├── Production-review request/outcome history
            ├── Secret lifecycle history
            └── Scoped MAU/usage
```

A workspace belongs to one Department. Department reference and association
remain necessary for profile/workspace context, but a Department catalog
management product is not in scope.

An Application may own several named RP configurations, including several
configurations that target the same CanadaLogin environment. The stable UUID,
configuration name, Partner environment, CanadaLogin environment, and parent
Application provide context; environment alone is never treated as identity.

## 6. Registration, Copy, Checklist, And Production Review

These state domains remain separate:

| Domain            | Product contract                                                                                                             |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Registration      | Editable incomplete questionnaire draft plus immutable technical completion metadata                                         |
| Copy              | Creates an independent editable target draft from an approved non-secret allowlist and records optional lineage              |
| Checklist/CATS    | Item/evidence progress, missing artifacts, contextual process links, and traceable evidence status; no aggregate score       |
| Production review | Absent, then explicit `pending`, then CL Admin-recorded `approved` or `rejected` with external reference/reviewer/timestamps |

### 6.1 Registration

The route-per-step registration flow persists recoverable intermediate work.
Only a final action from a completely valid review step records technical
completion. Draft-edit authority must not reopen or mutate completed
questionnaire answers. Separately permitted top-level metadata and focused
operations remain distinct.

Technical completion does not request Production review or imply approval,
deployment, launch, or operational status.

### 6.2 Configuration copy

An authorized editor may choose one TEST, STAGING, or PRODUCTION source and
copy the reviewed reusable, non-secret answer allowlist into a distinct named
draft for any target environment. The source remains unchanged.

Do not copy credentials, secret material, identifiers, certificates, keys,
redirect/logout endpoint values that require target confirmation, review
outcomes, or audit history. A Production copy remains a draft and does not
create review work.

### 6.3 Checklist and CATS evidence

The focused Application Checklist and evidence page shows required artifacts,
item-level status or missing inputs, traceable CATS evidence status, and useful
external process/documentation links. It does not compute overall readiness,
completion counts, percentages, recommendations, or submit-ready state.

The final CATS evidence mechanism is still TBD. It may be upload, an external
reference, or both. The implementation must not choose a mechanism or invent
mandatory contact-type gates without a later approved decision.

### 6.4 Production review

An authorized RP Admin or RP User (Edit) explicitly requests review for one
selected Production configuration. The record starts `pending` and carries the
external review reference and request metadata. Only CL Admin may record
`approved` or `rejected` with reviewer identity and outcome time.

Completing registration, copying, updating checklist/CATS inputs, or creating
a Production configuration must never create or advance this record
implicitly. The oversight queue contains only explicit review records; a
Production draft without a request does not appear as review work.

## 7. Invitation And Delegation Contract

Invitations are required for safe launch and are manually delivered:

1. CL Admin may invite or assign any canonical partner role. A same-workspace
   RP Admin may invite or assign only RP User (Edit) or Read Only.
2. The backend checks canonical authority, target workspace, permitted role,
   normalized invitee email, and exact configured partner-domain policy.
3. Create generates an opaque expiring token, stores only its hash, and returns
   one acceptance URL only in that write response.
4. The UI displays a bilingual copy control and explains that the portal does
   not send email, the URL will not be retrievable after leaving, and it must be
   shared through an approved external channel.
5. Reissue invalidates/replaces the earlier pending token and returns one new
   URL under the same one-time-display rule. Revoke prevents acceptance.
6. Acceptance uses only the backend-owned verified identity context. Both
   emails are trimmed and lowercased, must match exactly without alias, plus,
   or dot rewriting, and must still satisfy the configured domain policy.
7. Successful acceptance creates exactly one canonical role assignment for
   the invitation workspace; it does not create a legacy workspace member,
   child-specific grant, reusable role, or CL Admin role.

Invitation state is `pending`, `accepted`, `expired`, or `revoked`. Raw tokens
must not appear in plaintext persistence, list/detail responses, logs,
analytics, evidence, or referrer data. Create/reissue responses are private and
non-cacheable. The permitted out-of-band delivery channels remain a non-local
launch decision; the portal must not silently add email delivery.

## 8. Secrets, MAU, And Minimum Auditability

### 8.1 Secrets

RP Admin and RP User (Edit) may perform the allowed one-time reveal,
regenerate, rotate, and rotated-secret removal workflows for an accessible RP
configuration. CL Admin and Read Only must be denied before any provider call.
Secret values never appear in normal detail responses, logs, audit payloads,
URLs, analytics, or evidence.

The retained MVP secret-change CSV is scoped to one accessible RP
configuration. It identifies time, actor, action, and RP configuration without
including secret values, invitation data, questionnaire answers, or unrelated
personal information.

### 8.2 MAU/usage

MAU is the only retained user-facing report family. The canonical API is scoped
by an accessible RP configuration, and canonical UI routes include the full
workspace/Application/RP-configuration ancestry. Reports discovery contains
only the safe hierarchy and environment labels needed to navigate to one
scoped usage result.

The unscoped `GET /api/v1/mau/report?application_name=...` contract is retired.
Use only the authorization-scoped accessible-RP route and equivalent nested UI
destination. The browser never receives a global result set and filters it
into scope.

### 8.3 Audit capture

Keep the minimum event history required for:

- secret reveal/lifecycle changes and secret-change CSV;
- role assignment, replacement, and revocation;
- invitation create, accept, revoke, reissue, and expiry history;
- retained-RP adoption;
- configuration copy and Production-review actions; and
- security-relevant failures already covered by structured logging.

There is no generic user-facing audit search, arbitrary event explorer, broad
export, Verify audit pass-through, or Read Only audit access. Historical data
remains preserved until retention/disposition is approved.

## 9. Administration And Provider Boundary

Administration is access administration, not platform catalog governance. Its
authorized destinations are:

- Users and focused access details;
- pending and historical invitation context needed for access work;
- create-invitation entry points; and
- immutable bilingual reference content for the four roles.

Role assignment/replacement/revocation remains auditable and preserves the
last-CL-Admin and no-mixed-role invariants. Prospective users become active
through the invitation/verified-identity flow rather than generic user CRUD.

The portal does not expose generic provider applications, groups,
entitlements, login, or audit administration. IBM Security Verify access is
bounded to authentication and safe identity binding, retained-RP adoption, and
authorized RP-configuration/credential operations. New provider operations
require an explicit contract and permission review.

## 10. Runtime Architecture

The principal dependency direction is:

```text
React route -> feature page/hook -> typed fetch client -> FastAPI route
FastAPI route -> service -> repository/provider adapter -> PostgreSQL/Redis/external system
```

Runtime containers are:

- React/Vite browser application;
- FastAPI backend-for-frontend and server-side OIDC session authority;
- separate ARQ worker;
- PostgreSQL persistent store; and
- Redis for sessions, cache, runtime rate-limit counters, and queue state.

External systems are CanadaLogin/OIDC, bounded IBM Security Verify operations,
and the approved MAU data source. GC Notify is not a dependency. The manual
invitation communication channel is outside the portal runtime boundary.

## 11. Security, Privacy, Accessibility, And Service Quality

- Use server-owned sessions and authorization context; do not store provider
  tokens or permission authority in browser state.
- Validate complete resource ancestry and use safe unavailable responses for
  out-of-scope objects.
- Keep personal information to the minimum needed for access and contact work.
- Keep secrets and bearer invitation links out of telemetry and evidence.
- Use structured safe errors and correlation identifiers without leaking
  protected state.
- Use the GC Design System shell and components, one clear H1, semantic
  landmarks/tables/forms, keyboard-operable controls, visible focus, status
  announcements, reflow, and error recovery.
- Maintain English/French key parity, route behavior, labels, warnings,
  accessible names, and localized empty/error states.
- Preserve health/readiness endpoints, logging, monitoring, backups, database
  migrations, and runtime rate limiting.

Applicable anchors include `STD-002`, `STD-003`, `STD-004`, `STD-005`,
`STD-006`, `STD-007`, `STD-008`, `STD-009`, `STD-010`, `STD-011`, `STD-012`,
`STD-013`, `STD-014`, `STD-017`, `STD-018`, `STD-019`, `STD-020`, `PAT-001`,
`PAT-012`, `PAT-013`, `PAT-014`, and `BAS-001`.

## 12. Migration And Compatibility

Use additive, reviewable migration steps:

1. Add/confirm registration-completion and separate Production-review fields.
2. Move readers, writers, authorization, API contracts, and UI to the retained
   state model.
3. Stop writing and exposing generic lifecycle, readiness aggregate, internal
   note, catalog/tier, broad provider-admin, aggregate-report, and audit-
   explorer content.
4. Keep a redirect only when a retired route has one authorized semantic
   equivalent; otherwise return safe unavailable/not-found.
5. Preserve historical records and compatibility columns/tables until a
   separately approved retention/disposition and rollback decision permits
   removal.

Do not infer `pending`, `approved`, or `rejected` Production-review state from
old generic lifecycle values. Retained MVP1 registrations continue through the
explicit discovery, adoption, workspace/Application assignment, and first RP
Admin bootstrap flow.

## 13. Explicit TBDs And Non-Local Gates

The following remain intentionally unresolved:

- CATS upload versus external reference versus both;
- mandatory contact-type gates by stage;
- permitted external invitation-delivery channels;
- volume-spike submission mechanism;
- incident intake and SLA details;
- full in-product deprecation workflow;
- retention/disposition periods and physical cleanup; and
- shared-environment/production migration, rollback, monitoring, and release
  ownership.

These TBDs do not block local implementation of the approved boundary. They do
block inventing a solution or treating local behavior as production approval.

## 14. Traceability

Affected OpenSpec capabilities:

- `partner-portal-access-and-dashboard`
- `partner-portal-external-developer-invitations-and-scoped-access`
- `partner-portal-onboarding-oversight-and-reporting`
- `partner-portal-platform-administration-and-supportability`
- `partner-portal-role-management`
- `partner-portal-rp-application-experience`
- `partner-portal-workspace-and-rp-application-management`

Architecture decisions and references:

- [ADR-001: BFF and Server Session Authority](../architecture/adrs/adr-001-bff-and-server-session-authority.md)
- [ADR-002: API Wire and Error Contract](../architecture/adrs/adr-002-api-wire-and-error-contract.md)
- [ADR-003: Casbin Authorization Model](../architecture/adrs/adr-003-casbin-authorization-model.md)
- [ADR-004: Application and RP Configuration Hierarchy](../architecture/adrs/adr-004-application-and-rp-configuration-hierarchy.md)
- [Codebase architecture](../architecture/codebase.md)
- [Infrastructure architecture](../plans/partner-portal-system-architecture.md)
- [Scope-aligned diagrams](../plans/partner-portal-diagrams.md)
