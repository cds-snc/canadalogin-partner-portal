# Proposal: Refine access, configuration copy, and shared navigation

## Summary

Refine three related parts of the Partner Portal experience: split dense access
administration into task hubs and focused routes, replace RP-configuration
progression with an explicit copy workflow, and simplify the shared menu so
links and disclosures behave predictably.

## Why

The current implementation has several avoidable navigation and task-model
problems:

- `/users/$userUuid` and `/workspaces/$workspaceUuid/access` combine summaries,
  record collections, search, create forms, and consequential actions on long
  pages;
- repeated workspace assignments and invitation records use bordered
  card-like blocks even though users need to scan and compare the same fields;
- the pending-invitation `Manage` action on `/users` discards the selected
  invitation UUID and opens the top of the workspace Access page, so several
  invitations in one workspace all lead to the same unfocused destination;
- the RP action called progression derives Test-to-Staging or
  Staging-to-Production instead of letting a partner copy one selected
  configuration to another named Partner environment, including another
  configuration connected to the same CanadaLogin environment;
- copying to Production currently creates review tracking implicitly even
  though creating a draft and requesting Production review are distinct user
  intentions;
- `Partner work` is implemented as a disclosure containing only one link, and
  the application supplies a verbose expanded trigger label that produces the
  conspicuous `Close Partner work menu` control; and
- menu tests replace the real design-system components, leaving focus,
  dismissal, breakpoint, zoom, and stale-open behavior unverified.

The intended direction is the same one already used successfully for
workspaces and Applications: hubs choose a task, tables compare records, and
focused child routes perform one job.

## Work context and control boundary

- Local developer / localhost with fake, seeded, or test-only data.
- Repo-scoped OpenSpec, design, implementation, tests, and local verification
  only.
- No shared environment, production data, real personal information, real
  secret, deployment, provider mutation, or external-system mutation is
  authorized by this change package.
- A shared-environment or production rollout requires a separately named
  target, authorization, rollback plan, and release evidence.
- Delorean adoption level is 2, so this package uses lightweight OpenSpec and
  local verification without a mandatory change-state record or Evidence
  Bundle.

## Resolved decisions

| Question | Decision | Basis | Confidence |
|---|---|---|---|
| Which existing cards stay? | Keep the single-destination cards on `/administration`, the selected-workspace hub, and RP/Application hubs. | `PAT-001`, `PAT-022`, and the observed pages | high |
| Which records become tables? | Use semantic GC Design System tables for repeated users, eligible-user results, workspace assignments, and invitation records with stable comparable fields. | `PAT-023` and observed card-like records | high |
| How is Access split? | Make `/workspaces/$workspaceUuid/access` a task hub for assignments and invitations. Put lists, create/search forms, and record management on focused child routes. | Existing workspace hub pattern and user feedback | high |
| How is one user's access split? | Make `/users/$userUuid` a compact user-access hub with focused global access, workspace access, pending invitation, and add-access routes. | `PAT-001`, `PAT-022`, and current mixed-purpose page | high |
| Where does a pending-invitation action go? | Use a real link to `/workspaces/$workspaceUuid/access/invitations/$invitationUuid`. Never discard the selected public invitation identifier. | Reproduced current misdirection | high |
| Are navigational row actions buttons? | No. Navigation uses links with real destinations; buttons remain for in-place or submitted actions. Visible action text stays concise and the accessible name includes safe record context. | GC link semantics, `STD-007`, and `PAT-023` | high |
| What does copying mean? | Copy one explicitly selected RP configuration within its current Application to a new named draft. The source remains unchanged. Cross-Application and cross-workspace copying are out of scope. | User described copying “for that RP”; existing ownership and lineage model | high |
| Which target environments are allowed? | Let the editor explicitly select Test, Staging, or Production, including the source CanadaLogin environment. Default the choice to the source environment without making it implicit. | Same-CanadaLogin-environment use case and existing many-per-environment contract | high |
| What target metadata is entered? | Require a new configuration name and Partner environment. Do not copy or infer either value from the source. | Existing identity rules and non-lossy partner ownership | high |
| What fields are copied? | Copy only the existing reviewed allowlist of reusable, non-secret questionnaire answers. Exclude endpoints, URLs, redirect URIs, credentials, secrets, provider identifiers, certificates, private or offline key material, and other environment-specific values. | Existing safe progression allowlist and least-surprise boundary | high |
| Does a Production copy request review? | No. Copying creates a draft only. An authorized editor separately requests Production review for the selected Production configuration. | User's copy intent and separation of creation from approval | high |
| Where does Copy appear? | `Copy configuration` is a selected-record lifecycle action that opens a focused form. It is not a task-hub destination card and is never labelled Promote or Progress. | Existing focused lifecycle-action requirement and clarified vocabulary | high |
| What happens to Partner work in the header? | Render `Partner workspaces` as a direct top-level link while it is the only destination. A group is justified only when at least two coherent child links exist. | Current route catalog and GC Design System guidance | high |
| How does the account surface behave? | Keep the display name and compact active workspace/role context in the shell, add `Account` at `/account` for detailed safe context, and keep only supported navigation/session items in the disclosure. | Real-component keyboard audit, `PAT-013`, and supported top-navigation content model | high |
| How do menus close? | Close immediately on Escape, destination selection/route change, outside activation, sibling activation, and responsive-mode change. Return focus when appropriate; never leave a stale nested Close label or panel visible. | User feedback, `STD-007`, and observed component behavior | high |

## What changes

- Add focused access-control route families and replace repeated record cards
  with semantic tables.
- Make the pending-invitation `Manage` link record-specific and preserve safe
  workspace/invitation ancestry through route and backend checks.
- Replace the product concept and primary route `progression` with `Copy
  configuration`; retain a bounded compatibility adapter for saved links and
  existing API callers.
- Permit explicit same-environment and cross-environment copies within one
  Application while retaining safe field exclusions, draft lifecycle,
  lineage, idempotency, and authorization.
- Decouple Production-draft creation from the explicit Production-review
  request.
- Replace the one-item Partner work disclosure with a direct Partner
  workspaces link and define predictable behavior for the remaining account
  and mobile navigation surfaces.
- Update bilingual content, route metadata, tests, and old product-design
  references that still describe next-environment progression.

## Scope

In scope:

- authenticated access-control information architecture, tables, focused
  routes, breadcrumbs, row links, forms, and compatibility redirects;
- RP-configuration copy UI, API/service contract, lineage, audit,
  idempotency, and explicit Production-review separation;
- shared authenticated top-navigation structure and real-component menu
  behavior;
- English/French parity, accessibility, authorization, safe errors, tests,
  and local UI evidence; and
- updates to the current BR-16/product-design and onboarding-plan language.

Out of scope:

- a managed Partner-environment entity or controlled vocabulary;
- copying across Applications or workspaces;
- copying credentials, secrets, endpoints, provider configuration, or private
  key material;
- changing the canonical role/delegation matrix or invitation lifecycle;
- replacing the appropriate task-hub cards on Administration, workspace,
  Application, or RP-configuration hubs;
- shared-environment rollout, production release, or real data; and
- unrelated Administration catalog page redesign.

## Requirements affected

- `partner-portal-access-and-dashboard`
  - `Shared authenticated navigation exposes current user context`
- `partner-portal-platform-administration-and-supportability`
  - `Users and access presents canonical access rather than provider internals`
  - `Administration table actions are concise and uniquely named`
- `partner-portal-workspace-and-rp-application-management`
  - `Workspace Access replaces the legacy Members destination`
  - `Onboarding lifecycle state is tracked across core onboarding records`
  - replace source-required promotion tracking with explicit Production review
    for one selected Production configuration
  - replace `Environment progression remains explicit per named RP configuration`
    with explicit RP-configuration copying
  - replace progression-coupled readiness wording with an explicit
    Production-review request
- `partner-portal-rp-application-experience`
  - `Existing RP configuration responsibilities remain on focused owners`
- `partner-portal-onboarding-oversight-and-reporting`
  - replace promotion-oriented backlog language with explicit Production-review requests
- `partner-portal-role-management`
  - `Canonical roles have fixed scope and permission boundaries`
- `partner-portal-external-developer-invitations-and-scoped-access`
  - `Accepted invitations grant only partner-scoped invited-developer role access`

## Risks and mitigations

- Route splitting could break saved links. Keep bounded redirects, preserve
  public identifiers, and test safe direct entry and revoked scope.
- Two route families may accidentally create two authorization models. Reuse
  the canonical assignment and invitation services and enforce backend
  workspace/object ancestry on every route.
- Copy may be mistaken for overwrite, deployment, or approval. Use a new-draft
  form, explicit target fields, clear exclusions, and a separate Production
  review action.
- Compatibility requests could create duplicate targets. Route old and new
  requests through one idempotent copy service and preserve replay semantics.
- Custom menu state could regress GCDS keyboard behavior. Prefer direct links
  and supported component content, minimize controlled behavior, and verify
  the real components at narrow, intermediate, desktop, zoomed, and long-
  French layouts.

## Open questions

No question blocks local specification or implementation. Reviewers may amend
the resolved decisions before implementation. The bounded compatibility
sunset remains a shared-rollout decision rather than a local blocker.

## Links

- Page pattern decision: [page-pattern-decision.md](page-pattern-decision.md)
- Technical design: [design.md](design.md)
- Implementation plan: [tasks.md](tasks.md)
- Standards impact: [standards-impact.md](standards-impact.md)
- Work context: `STD-002: Work Contexts`
- UI patterns: `PAT-001`, `PAT-013`, `PAT-014`, `PAT-017`, `PAT-020`,
  `PAT-022`, and `PAT-023`
