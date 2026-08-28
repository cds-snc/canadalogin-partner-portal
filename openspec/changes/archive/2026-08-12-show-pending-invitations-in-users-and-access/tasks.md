# Tasks: Show pending invitations in Users and access

## 0. OpenSpec and design readiness

- [x] 0.1 Confirm the local-only work context and Level 2 OpenSpec lifecycle.
- [x] 0.2 Resolve whether pending invitees are users and where invitations are
  currently visible.
- [x] 0.3 Reuse the approved Users and access PAT-023 page pattern with no
  custom UI exception.
- [x] 0.4 Validate the active OpenSpec change strictly.

## 1. Cross-workspace invitation read model

- [x] 1.1 Add a minimal public pending-invitation directory schema and
  paginated `GET /api/v1/users/invitations` contract.
- [x] 1.2 Enforce canonical CL Admin authorization before querying and exclude
  accepted, revoked, expired, deleted, and deleted-workspace records.
- [x] 1.3 Add backend service, route, serialization, authorization, and OpenAPI
  regression tests.
- [x] 1.4 Add the typed frontend fetch helper and TanStack Query hook.
- [x] 1.5 Invalidate the pending-invitation directory after invitation create,
  revoke, and reissue mutations.

## 2. Users and access UI

- [x] 2.1 Add a separately headed Pending invitations PAT-023 table with email,
  workspace, requested role, pending status, expiry, and concise Manage action.
- [x] 2.2 Route Manage to the existing workspace Access page and give each
  action a unique accessible name.
- [x] 2.3 Add loading, empty, and safe error states scoped to the invitation
  section.
- [x] 2.4 Add English/French content parity and frontend regression tests for
  populated, empty, error, and navigation behavior.

## 3. Verification and archive readiness

- [x] 3.1 Run focused backend and frontend tests, lint, formatting, and type
  checks.
- [x] 3.2 Export and inspect the OpenAPI contract.
- [x] 3.3 Run frontend GC Design System and page-shell checks and perform a
  scoped accessibility/bilingual review.
- [x] 3.4 Run holistic local QA and record skipped checks and remaining risk.
- [x] 3.5 Validate OpenSpec strictly, confirm scenario preservation, and archive
  the completed functional change into the current spec.

  Progress note (2026-08-12): the official archive command promoted the
  modified requirement into the current administration/supportability spec
  and moved this package to
  `openspec/changes/archive/2026-08-12-show-pending-invitations-in-users-and-access`.

## Verification record

- Backend: 109 relevant tests passed; scoped Ruff lint and format checks passed.
- Frontend: 97 files and 480 tests passed; ESLint, Prettier, TypeScript, and the
  production build passed. The existing large-chunk build warning remains.
- Contract: generated OpenAPI is current and includes the protected paginated
  pending-invitation directory.
- UI: GC Design System and page-shell checks passed; English/French user keys
  are in parity; a local desktop browser check confirmed the separate table,
  row-specific accessible Manage action, and workspace Access navigation.
- Accessibility residual: automated/scoped code review passed; no manual
  screen-reader or physical-device session was run for this local-only slice.
- Repository-wide spec validation still reports the pre-existing
  `standardized-error-logging` spec's missing `Purpose` section. The affected
  administration/supportability spec validates strictly on its own.
