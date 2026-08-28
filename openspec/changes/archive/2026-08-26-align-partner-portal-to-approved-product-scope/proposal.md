# Proposal: Align Partner Portal to approved product scope

## Summary

Remove the identified unsupported scope from affected Partner Portal
requirements and align those requirements with `partner-portal-mvp.md`,
`partner-portal-onboarding-prd.md`, and the topic-specific product decisions
recorded for this change. Remove behavior that entered the current
specifications from the broader, repository-derived `partner-portal-prd.md`
while preserving the capabilities explicitly confirmed for launch. This
package does not claim a complete traceability audit or add every approved PRD
capability that may still be missing from current specifications.

This is one atomic scope-correction change because status vocabulary, role
permissions, dashboards, reports, invitations, Administration, readiness, and
audit behavior cross-reference one another. Implementation remains split into
bounded slices in `tasks.md`.

## Why

`docs/plans/partner-portal-prd.md` describes itself as a draft generated from
the implemented repository state. It was useful context, but it introduced a
larger product vision than the approved MVP and onboarding requirements. Some
of that broader scope was later treated as authoritative in OpenSpec,
including:

- a shared `draft -> submitted -> under_review -> approved -> launched`
  lifecycle for workspaces, Applications, and RP configurations;
- aggregate onboarding, invitation-conversion, and secret-hygiene reports;
- free-form internal review notes and internal checklist outcomes;
- an Application-level readiness score and `submit-ready` state;
- Department and tier catalog CRUD, policy-oriented governance, and broad IBM
  Security Verify administration; and
- generic partner audit browsers and cross-workspace audit/reporting surfaces.

Those behaviors are not required by the approved product sources. Keeping them
would increase launch scope, create status models that compete with the
out-of-band Production-review process, and expose routes and permissions with
no approved product outcome.

## Work context and control boundary

- Local developer / localhost with fake, seeded, or test-only data.
- Repo-scoped OpenSpec, design, implementation, tests, and local verification
  only.
- No shared environment, production data, real personal information, real
  secrets, provider mutation, deployment, or external-system mutation is
  authorized by this change package.
- A shared-environment or production rollout requires a named target,
  authorization, data rules, rollback plan, and release evidence.
- Delorean adoption level is 2, so this package uses lightweight OpenSpec and
  local verification without a mandatory change-state record or Evidence
  Bundle.

## Requirement-source precedence

Requirements for this scope SHALL be resolved in this order:

1. explicit, topic-specific product decisions recorded in this change
   package;
2. `docs/plans/partner-portal-onboarding-prd.md` where the onboarding iteration
   intentionally expands or supersedes the earlier MVP baseline;
3. `docs/plans/partner-portal-mvp.md` for the remaining baseline; and
4. repository behavior and older planning documents as implementation context
   only.

`docs/plans/partner-portal-prd.md` and the backlog derived from it SHALL NOT
create product requirements unless a behavior is separately approved and
recorded in the first three sources above. A topic-specific override SHALL NOT
be generalized into authority for unrelated behavior.

## Resolved product decisions

| Topic | Decision | Basis | Confidence |
|---|---|---|---|
| Workspaces | Keep Partner workspaces and the Workspace -> Application -> RP configuration hierarchy. | Explicit product decision for this change | high |
| Roles | Keep exactly four canonical roles, workspace-scoped partner assignments, assignment/replacement/revocation, and the current delegation matrix. | Onboarding PRD plus explicit product decision | high |
| Shared onboarding lifecycle | Remove the five-state cross-record lifecycle. Registration draft recovery and Production review remain separate concepts. | MVP non-goal and explicit product decision | high |
| Production review | Keep one explicit out-of-band review request for a selected Production configuration with `pending`, `approved`, or `rejected`, external reference, reviewer metadata, and timestamps. No request means no review status. | Onboarding PRD | high |
| Checklist and CATS | Keep checklist progress, required-artifact visibility, CATS evidence availability, and process links. Until upload, external reference, or both is approved, show an explicit `not configured / no portal record` state and do not invent evidence persistence. Remove the overall readiness score, completion count, and `submit-ready` state. | Onboarding PRD plus explicit product decision | high |
| Dashboards | Keep authorized dashboard/task-hub routes as honest future anchors, including useful empty states, but do not render unsupported metrics, queues, or cards. | Explicit product decision | high |
| Administration | Keep Users and access, Invitations, fixed Role reference, and canonical role assignment management. Remove Department/tier catalog CRUD, policy CRUD, and generic Audit logs. | Explicit product decision | high |
| Invitations | Keep manual link delivery, token acceptance, authenticated verified-email matching, revoke, reissue, lifecycle history, and delegation. The portal does not send invitation email. | Explicit product decision | high |
| Reporting | Keep per-RP-configuration MAU/usage and its current scoped export. Remove other aggregate report families, filters, metrics, and exports. Keep `/reports` as the authorized discovery anchor. | MVP/onboarding PRD plus explicit product decision | high |
| Auditability | Keep required event history for secrets, role assignments, invitations, adoption, copy, and sensitive actions. Add/retain the MVP secret-change CSV showing actor and time. Remove generic user-facing audit explorers. | MVP/onboarding PRD plus explicit product decision | high |
| IBM Security Verify | Keep bounded integration needed for authentication, retained-RP adoption/metadata, and authorized RP operations. Remove broad platform-admin pass-through for users, applications, groups, entitlements, logins, and audit queries. | Approved PRDs and explicit product decision | high |
| Migration/adoption | Keep explicit CL Admin adoption of retained MVP1 RP registrations into the Workspace/Application model. | Explicit product decision | high |

## What changes

- Replace the shared onboarding lifecycle with distinct technical registration
  progress and explicit Production-review status.
- Remove internal review notes/outcomes and Application readiness scoring while
  retaining checklist, CATS, evidence, and process-link visibility.
- Remove non-MAU aggregate reporting and generic audit browsers while retaining
  the authorized Home, Reports, Administration, workspace, and onboarding-
  oversight shells.
- Narrow Administration to canonical identity and access work, invitations,
  and immutable role reference.
- Make the already intended manual invitation-delivery contract explicit and
  require a copyable, non-retrievable-after-exit acceptance link after create
  or reissue.
- Narrow role and invitation permission statements so they advertise only
  retained capabilities.
- Preserve Workspaces, the four-role model, invitation delegation,
  migration/adoption, configuration copy, explicit Production review, secrets,
  MAU, checklist/CATS evidence, and minimum auditability.

## Scope

In scope:

- current OpenSpec deltas for the seven affected capabilities;
- data/API/UI removal or compatibility work needed to implement those deltas;
- honest dashboard/task-hub empty states and route authorization;
- bilingual content, accessibility, safe error behavior, and regression tests;
- safe migration away from generic lifecycle fields without deleting retained
  audit history; and
- documentation cleanup so the approved source hierarchy is explicit.

Out of scope:

- automatic invitation email or GC Notify integration;
- aggregate onboarding, invitation, secret-hygiene, executive, or portfolio
  reporting;
- a fully in-product approval engine;
- internal free-form review notes or internal checklist dispositions;
- Department/tier/policy catalog management;
- generic IBM Security Verify administration or a generic audit-log browser;
- decisions still marked TBD in the onboarding PRD, including the final CATS
  evidence mechanism and mandatory contact-type gates;
- a complete coverage and implementation-gap audit for every remaining
  authoritative MVP and onboarding-PRD capability;
- destructive deletion of historical records without a separately approved
  retention/disposition decision; and
- shared-environment rollout or production release.

## Capabilities affected

- `partner-portal-access-and-dashboard`
  - narrow Administration, operational-overview, and Reports hubs while
    preserving their authorized shell behavior;
- `partner-portal-external-developer-invitations-and-scoped-access`
  - remove aggregate-report permission, narrow accepted-role capabilities, and
    specify manual copyable-link delivery;
- `partner-portal-onboarding-oversight-and-reporting`
  - remove aggregate reports and internal review notes, retain MAU discovery,
    and reduce oversight to an anchor plus explicit Production-review work;
- `partner-portal-platform-administration-and-supportability`
  - remove catalog/policy governance and broad Verify administration while
    retaining Users and access and service supportability;
- `partner-portal-role-management`
  - narrow the canonical permission matrix without changing the four roles,
    scopes, assignment integrity, or delegation;
- `partner-portal-rp-application-experience`
  - distinguish registration progress from Production review and remove the
    generic audit/internal-review destinations; and
- `partner-portal-workspace-and-rp-application-management`
  - remove the shared lifecycle and readiness score, narrow reports/audit, and
    preserve hierarchy, drafts, checklist/CATS, Production review, MAU,
    secrets, invitations, and adoption.

## Risks and mitigations

- **Status drift:** old lifecycle values may remain in APIs, data, UI, tests,
  and authorization rules. Define the replacement vocabulary first and remove
  all consumers together.
- **Audit gap:** deleting generic audit pages could accidentally remove required
  event capture. Establish the narrow secret-change log and inventory retained
  audit events before deleting explorer routes.
- **Dead dashboard links:** retaining shells could leave links to removed
  reports or queues. Build shell cards from the reduced server-owned
  capability set and require honest empty states.
- **Invitation link leakage:** manual delivery places an opaque bearer token in
  a URL. Store only its hash, reveal the URL only after create/reissue, exclude
  it from logs/analytics/referrers, and provide clear approved-channel copy.
  The exact permitted external delivery channels require an operational owner
  before non-local launch.
- **Historical data loss:** generic lifecycle and review-note data may already
  exist locally. Stop producing and consuming retired fields before any schema
  removal; preserve records until retention/disposition is approved.
- **Authorization regression:** permissions are repeated across role,
  invitation, route, and workspace specs. Treat the canonical role matrix as
  the source and test every allowed and denied path.

## Open questions

No question blocks local specification or implementation. The final CATS
evidence mechanism, contact-type gates, retention periods, compatibility
sunsets, permitted external invitation-delivery channels, and any shared-
environment rollout remain later product or operational decisions and are not
inferred by this change. The invitation-channel decision is a non-local launch
blocker, not a reason to invent portal email delivery.

## Links

- Approved MVP: [partner-portal-mvp.md](../../../docs/plans/partner-portal-mvp.md)
- Approved onboarding PRD: [partner-portal-onboarding-prd.md](../../../docs/plans/partner-portal-onboarding-prd.md)
- Technical design: [design.md](design.md)
- Implementation plan: [tasks.md](tasks.md)
- Work context: `STD-002: Work Contexts`
- OpenSpec lifecycle: [openspec-lifecycle.md](../../../docs/reference/openspec-lifecycle.md)
