# Tasks: Add role-based designer walkthroughs

## 0. OpenSpec and design readiness

- [x] 0.1 Confirm Delorean Level 2 and local developer / localhost scope.
- [x] 0.2 Identify the current canonical-persona requirement and preserve all
      existing scenarios in the modified delta.
- [x] 0.3 Record the synthetic-data boundary, denied external integrations,
      cleanup expectation, and disposable recording outputs.
- [x] 0.4 Confirm `STD-002`, `STD-004`, `STD-012`, `STD-013`, `STD-015`, and
      `STD-020` applicability and that no migration or new page-pattern decision is
      expected.
- [x] 0.5 Validate the active OpenSpec change and scenario-preservation check.

## 1. Enrich deterministic local fixtures

- [x] 1.1 Extend the fixture catalog with representative bilingual contacts,
      reserved fake identities, and stable UUIDv5 identifiers.
- [x] 1.2 Add pending and terminal workspace-invitation examples without
      storing or exposing plaintext invitation URLs or real notification IDs.
- [x] 1.3 Add draft and completed Test/Staging/Production RP configuration
      states with safe lineage and no live provider identifiers.
- [x] 1.4 Add pending and terminal Production-review records with synthetic
      external references and no production identifiers.
- [x] 1.5 Add fixed-date MAU rows directly to local Redis without calling S3.

## 2. Preserve seed safety and cleanup

- [x] 2.1 Extend exact state counts and field validation for every new
      PostgreSQL and Redis fixture record.
- [x] 2.2 Preserve non-local failure before persistence, idempotent reruns,
      collision detection, and visible partial-state failures.
- [x] 2.3 Extend explicit cleanup in foreign-key-safe order and remove only
      recorded fixture cache fields/keys and database rows.
- [x] 2.4 Prove a cache failure can be repaired by rerunning without corrupting
      or duplicating the valid database namespace.

## 3. Add repeatable recording workflow

- [x] 3.1 Add a dedicated Playwright walkthrough configuration targeting the
      full app on `http://127.0.0.1:3000` with isolated contexts and WebM capture.
- [x] 3.2 Add deterministic CL Admin, RP Admin, RP User (Edit), Read Only, and
      no-access journeys through the visible local persona selector.
- [x] 3.3 Use a fixed desktop viewport, reduced motion, readable scrolling,
      visible interaction cues where practical, and approximately six seconds on
      each settled page.
- [x] 3.4 Exclude redirects, destructive-only terminal actions, external
      support links, plaintext invitation URLs, secrets, and live-provider calls.
- [x] 3.5 Add a human-readable page/index document with capture commands,
      expected outputs, journey coverage, and honest integration limitations.
- [x] 3.6 Repair the rehearsal-discovered application-details route nesting so
      the existing edit child renders beneath a thin `Outlet` layout.
- [x] 3.7 Keep the dedicated five-journey recorder out of the ordinary
      multi-browser Playwright suite.

## 4. Tests and verification

- [x] 4.1 Add focused fixture, seed-service, cache, and PostgreSQL tests for
      stable IDs/counts, idempotency, partial state, cleanup, and non-local denial.
- [x] 4.2 Run focused backend tests and the existing local-persona suite.
- [x] 4.3 List/typecheck the walkthrough specs and run frontend tests/build.
- [x] 4.4 Run relevant Delorean structure, format, Markdown, state, secret, and
      fast-test checks; record any skipped checks and remaining risk.
- [x] 4.5 Start the local persona stack, reseed the namespace safely, and run
      the recorder twice to confirm deterministic route order.
- [x] 4.6 Decode every generated stream from its beginning to a near-final frame
      and visually review every settled-page midpoint plus each ending for readable
      pauses, role accuracy, safe content, and clean endings.
- [x] 4.7 Add a focused regression test for the details layout/index route seam.

## 5. Developer readiness and archive

- [x] 5.1 Perform a holistic code, fixture, documentation, and generated-video
      review and resolve findings.
- [x] 5.2 Confirm current specs remain unchanged until archive and that all
      modified-requirement scenarios are preserved.
- [ ] 5.3 Archive the verified functional delta without `--skip-specs`, then
      confirm the current role-management spec reflects the implementation.
- [x] 5.4 Keep shared-environment, production, deployment, publishing, and
      external integrations out of scope until separately authorized.

Task 5.3 is intentionally deferred so the active change and generated local
artifacts can receive human review before the delta updates the current spec.
