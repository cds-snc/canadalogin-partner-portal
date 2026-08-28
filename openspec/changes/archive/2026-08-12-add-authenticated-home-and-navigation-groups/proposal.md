# Proposal

## Why

The portal currently redirects authenticated users away from `/` to
`/your-applications`, which makes the RP application list act as both the
signed-in landing page and a task destination. The shared authenticated header
also exposes every available area as one flat list. That no longer fits a
service with distinct partner, oversight, administration, account, and support
journeys.

STD-005, STD-006, PAT-001, and PAT-013 require a functional service home,
discoverable parent task areas, and an intentional shared navigation model.
PAT-021 also distinguishes a true operational dashboard from a task hub. This
change applies those patterns by making Home the orienting entry point, keeping
operational overviews on dedicated routes, and replacing the flat header with a
small hierarchy of task areas.

## Work Context And Assumptions

- Context: local developer and localhost planning default per STD-002.
- Data posture: fake, seeded, or test-only data for local verification.
- Source-of-truth assumption: current shipped behavior remains the baseline
  until this change is implemented, verified, and archived.
- Route assumption: `/` becomes the authenticated service home, while
  `/your-applications` remains a dedicated partner operational overview.
- Scope boundary: this change defines global information architecture,
  authenticated admission routing, page behavior, shared navigation, and the
  Administration task hub. It does not create a role taxonomy, permission
  matrix, reporting formula, assignment model, or new external integration.
- Support assumption: `/support` remains available as a help page, but it moves
  to footer or utility navigation instead of occupying primary task navigation.

## Dependencies And Ownership

- Archived `define-four-role-authorization-model` owns canonical roles, capabilities,
  assignment and invitation semantics, reporting scope, no-access
  determination, and the authenticated `authorizationContext` contract.
- This change consumes that accepted server-owned context for route
  discoverability. It does not infer access from `isSuperuser`, raw role IDs,
  upstream groups, or client-owned role state.
- The four-role package is archived at
  `openspec/changes/archive/2026-08-12-define-four-role-authorization-model`.
  This package is rebased against its current access-and-dashboard contract and
  strict validation passes; implementation may now consume that contract.
- `refine-workspace-task-hub-and-registration-flow` owns the workspace task
  hub, canonical workspace Access and Reports routes, and the multi-step RP
  application registration flow. This change links to the Workspaces parent
  area without duplicating those deeper journey requirements.

## What Changes

- Make `/` the authenticated PAT-001 service Home after prerequisite and access
  routing has completed.
- Keep `/your-applications` as a PAT-021 partner operational overview rather
  than the generic portal Home.
- Replace the flat authenticated menu with this first-level hierarchy:
  - `Home`
  - `Partner work`, containing authorized `Your applications` and `Workspaces`
    links
  - `Onboarding oversight` when authorized
  - `Administration` when authorized
  - account and sign-out controls in a separate user group
- Add `/administration` as a PAT-001 task hub for Users and access,
  Departments, Tiers, Audit logs, and the fixed Role reference.
- Remove `/policies` from the information architecture while authorization
  policy CRUD is retired.
- Move Support to footer or utility navigation.
- Define one deterministic admission order covering authentication, terms,
  tokenized invitation acceptance, applicable profile setup, canonical
  authorization, safe destination resumption, Home, and access denial.
- Require one route/navigation catalog for labels, parents, active states,
  capability visibility, breadcrumbs, Home visibility, and return paths.
- Make grouped navigation responsive, keyboard operable, focus visible, and
  bilingual, without hover-only interaction or colour-only current-page state.

## Capabilities

### Modified Capabilities

- `partner-portal-access-and-dashboard`

## Impact

- Frontend entry and protected-route behavior for `/` and preserved
  destinations.
- Accepted ADR-001 BFF/session revalidation, proposed ADR-002 wire-contract
  compatibility, and the accepted ADR-003 authorization dependency.
- Shared header hierarchy, footer Support link, active-state rules, account
  controls, route metadata, and responsive navigation.
- New `/administration` task-hub page while retaining the existing child route
  URLs.
- `/your-applications` content and status-state contract.
- English and French copy and accessible names for Home, navigation, task hubs,
  overviews, breadcrumbs, and recovery links.
- Focused route, navigation, role-context, keyboard, focus, responsive, and
  bilingual tests, plus OpenAPI/serialization checks when a consumed response
  changes and sensitive-surface inspection for route, storage, analytics, and
  logs.

## Resolved Direction

- Home is a task-oriented service entry page, not a dashboard.
- `/your-applications` and `/onboarding-oversight` are dedicated operational
  overviews for their respective audiences.
- `/administration` is a task hub, not a dashboard or an all-in-one admin page.
- The shared header exposes parent task areas instead of every child module.
- GC Design System navigation components are the default; no custom mega-menu
  or custom dropdown is planned.
- The backend remains the authorization authority. Navigation visibility is a
  discoverability rule, never a security control.

## Out Of Scope

- Changing the four-role matrix or deciding who has a capability.
- Moving all existing administration child URLs under `/administration/*`.
- Creating workspace Access, partner Reports, or form-flow routes; those belong
  to the dependent workspace-journey change.
- Adding new dashboard metrics, charts, reports, or backend aggregates.
- Production deployment, shared-environment changes, real data, or real
  secrets.
