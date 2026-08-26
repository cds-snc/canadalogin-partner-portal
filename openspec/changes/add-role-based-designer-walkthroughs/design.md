# Design: Add role-based designer walkthroughs

## Technical approach

Extend the current guarded local-persona fixture catalog rather than creating a
second demo-data path. The seed service remains the only writer for the
deterministic namespace and continues to validate exact rows before returning
success or performing cleanup.

Run designer capture against a dedicated local PostgreSQL database and separate
Redis logical databases. This is an operational isolation boundary, not a new
data model: it prevents an older local fixture catalog or developer-authored
children from being reset merely to make a recording. The guarded seed must
continue to refuse mixed or partially owned state. The walkthrough target pins
the PostgreSQL and Redis hosts, ports, credentials, TLS posture, and database
numbers to the loopback-only local profile rather than inheriting persistence
endpoints from `backend/.env`.

PostgreSQL receives representative contacts, invitations, RP configuration
states, and Production-review records. Redis receives a bounded set of
fixed-date MAU rows under the same local fixture ownership. The command fails
before persistence unless `ENVIRONMENT=local`, `AUTH_MODE=local_dev`, and
`ENABLE_DEV_ROLE_SELECTOR=true` match exactly.

A dedicated Playwright configuration records one isolated browser context per
persona against the full localhost stack. Journeys select the visible
backend-allowlisted persona, follow meaningful destinations in a deterministic
order, use a fixed desktop viewport and reduced motion, pause after settled
pages, and write disposable WebM files plus a tracked route/index description.

## Data design

- All persistent fixture UUIDs derive from the existing UUIDv5 namespace.
- Timestamps and MAU dates are fixed so repeated seeds produce the same data.
- Synthetic identities use `local.example`; invitation hashes are
  opaque fixed digests whose token preimages are absent from source, and
  plaintext invitation URLs are neither stored in docs nor shown in recordings.
- Alpha contains the richer partner walkthrough dataset. Beta retains an
  intentionally separate workspace and can contain a terminal review example
  for CL Admin oversight without widening Alpha partner access.
- Cleanup deletes cache keys and database rows in foreign-key-safe order and
  targets only identifiers recorded in the fixture catalog.
- The walkthrough profile is disposable and separate from the normal local
  developer database/cache profile; starting it never invokes the all-volume
  database reset.
- No model, constraint, index, retention, or migration behavior changes.

## Seed and compensation sequence

1. Select the dedicated local walkthrough PostgreSQL database and Redis logical
   databases without deleting or recreating the normal developer stores.
2. Validate the exact local-only gate before opening persistence connections.
3. Lock and validate or create the PostgreSQL namespace transactionally.
4. Seed or validate the fixed Redis MAU keys.
5. Return success only when both stores match the fixture catalog.
6. If Redis is unavailable, return a non-zero failure without weakening the
   valid database state; a later rerun repairs or validates the cache.
7. Cleanup requires explicit confirmation, removes Redis fixture fields/keys,
   then deletes database children before parents.

## Impacted artifacts

- OpenSpec delta: this change package.
- Current spec after archive:
  `openspec/specs/partner-portal-role-management/spec.md`.
- Backend: local fixture catalog, seed service, guarded seed command, and
  focused tests.
- Frontend tooling: dedicated walkthrough Playwright configuration, journey
  manifest/specs, package command, and an explicit exclusion from the ordinary
  multi-browser E2E suite.
- Frontend application: the rehearsal-discovered application-details route is
  split into a thin `Outlet` layout and index route so its existing edit child
  renders correctly; no page content or page pattern changes.
- Documentation: local recording workflow and role/page index.
- Generated evidence: disposable local WebM files and capture manifest.
- API/OpenAPI: no contract change expected.
- Database migration: none expected.

## Standards and patterns impact

- `STD-002: Work Contexts` — localhost-only scope and fake/test-only data.
- `STD-004: Frontend React and TypeScript` — thin nested route layout/index
  repair and generated route-tree verification.
- `STD-012: Testing Basics` — scenario-focused seed, authorization, and
  recording verification.
- `STD-013: Security and Privacy Basics` — synthetic identities, no secret or
  token disclosure, no external calls.
- `STD-015: Code Quality, Linting, and Formatting` — walkthrough TypeScript is
  included in recurring typecheck, ESLint, and Prettier commands.
- `STD-020: Database Persistence` — reviewable idempotent seed ownership,
  namespace cleanup, and persistence tests.
- `PAT-012: Alembic PostgreSQL Change` — not applicable because no schema
  change is planned.
- No new page-pattern decision is needed because the route repair preserves the
  existing approved details and edit pages without changing their structure.

## Security, privacy, accessibility, and operations notes

- Security: backend authorization and the existing persona allowlist remain
  authoritative; recorder visibility is not an authorization control.
- Privacy: all names, emails, phone numbers, review references, and usage rows
  are synthetic and local-only. Recordings exclude token and secret material.
- Accessibility: videos use a readable desktop viewport, deliberate pauses,
  reduced motion, slow scrolling, and visible focus/cursor cues where practical.
- Official languages: the first set is English and demonstrates the language
  switch once; fully duplicated French recordings are a later optional output.
- Operations: generated media is regenerable and untracked by default. The
  local stack remains loopback-bound and no external provider is required.

## Verification strategy

- Unit tests verify stable catalog values, counts, cache rows, and safe
  serialization.
- Seed service tests verify first seed, idempotent rerun, partial-state failure,
  cache compensation, and namespace-only cleanup.
- A live walkthrough run verifies the dedicated persistence profile without
  resetting or mutating the normal developer data profile.
- PostgreSQL-backed tests verify constraints and deletion ordering when the
  disposable local runtime is available.
- Role/API tests verify the populated Alpha surfaces and existing denied paths.
- The recorder is listed and typechecked without a backend, then run twice from
  a clean local seed to confirm stable journey order.
- Every generated stream is decoded from its beginning to a near-final frame,
  and a settled midpoint from each manifest page plus each ending is visually
  reviewed for readability, accurate role access, adequate pauses, safe endings,
  and absence of sensitive values.

## Rollback

- Run the explicitly confirmed namespace-only persona cleanup and reseed only
  against the dedicated walkthrough profile when its fixtures need regeneration.
- Remove disposable recordings and regenerate them from the tracked harness.
- Do not use the all-volume local database reset unless the user separately
  authorizes deletion of unrelated local container data.

## Non-local blockers

Shared or production use would require a named environment, identity and data
rules, secret source, approved external substitutes, deployment and rollback
ownership, and release evidence. Those decisions do not block this localhost
change and are not implied by the generated videos.
