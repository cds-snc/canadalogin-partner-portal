# Proposal

## Why

The portal currently redirects authenticated users away from `/` to `/your-applications`, which makes the RP application list act as both the signed-in landing page and a task destination. At the same time, the shared authenticated header exposes every top-level area as one flat list of links. That combination works for a small surface, but it no longer fits the product shape: the portal now has multiple distinct user goals and administrative areas.

STD-005, STD-006, and PAT-001 all point toward a functional service home when a GC service has several task areas. The existing public home page already orients unsigned users, but authenticated users do not get an equivalent task-oriented entry point. This change defines the missing signed-in service home and the grouped navigation model that keeps the header understandable as more routes are added.

## Work Context And Assumptions

- Context: local developer and localhost planning default per STD-002.
- Data posture: fake, seeded, or test-only data for local verification.
- Source-of-truth assumption: current shipped behavior remains the baseline until this change is implemented and archived into current specs.
- Route assumption: `/` becomes the authenticated service home after sign-in, while `/your-applications` remains a dedicated partner task route for reviewing accessible RP applications.
- Navigation assumption: primary navigation may use grouped top navigation, grouped menu sections, or another GC Design System-compatible grouping mechanism, but the user-facing outcome must be grouped task-area navigation rather than one flat authenticated link list.
- Scope boundary: this change defines information architecture, page behavior, navigation paths, and verification expectations only. It does not introduce new backend business capabilities.

## What Changes

- Add an authenticated service home requirement for `/`.
- Redefine `/your-applications` as a dedicated current-user RP applications task page instead of the authenticated landing page.
- Require grouped primary navigation for authenticated users so partner tasks, platform administration, oversight, and support do not appear as one undifferentiated top-level list.
- Record the page-pattern decision and primary task navigation paths needed for implementation.

## Capabilities

### Modified Capabilities
- `partner-portal-access-and-dashboard`

## Impact

- Frontend route entry behavior for `/` and post-login redirects.
- Shared authenticated header information architecture and navigation labels.
- English and French copy for the authenticated home page and grouped navigation labels.
- Focused frontend route and navigation tests.

## Resolved Direction

- Use PAT-001 service-home behavior for the authenticated entry route instead of extending the current dashboard pattern.
- Keep `/your-applications` as a primary task page reachable from Home, not as the only authenticated landing destination.
- Keep CL Admin oversight on its own dedicated route family, but group it separately from partner tasks in the shared navigation.
- Keep implementation flexibility for the exact grouping widget as long as the shared shell exposes clear grouped task areas and preserves GC Design System expectations.
