# Tasks: Bootstrap a Configured CL Admin Roster

## 0. Specification And Readiness

- [x] 0.1 Replace the deprecated single-email bootstrap with a reusable command
  design that local tooling and a pipeline can invoke after migrations.
- [x] 0.2 Record the roster-only configuration contract, explicit command
  behavior, and no-endpoint decision.
- [x] 0.3 Record the local-only control boundary, personal-information handling,
  and deferred shared-environment pipeline decisions.
- [x] 0.4 Assess STD-002, STD-020, STD-013, STD-014, and GC-WEB-007 impact.

## 1. Bootstrap Service And Configuration

- [x] 1.1 Replace `INITIAL_CL_ADMIN_EMAIL` with validated
  `INITIAL_CL_ADMIN_EMAILS` configuration; remove all fallback behavior.
- [x] 1.2 Extract a reusable bootstrap service that parses the roster before
  database writes, locks the roster, and processes identities deterministically.
- [x] 1.3 Create a user only when no user exists; preserve an existing user's
  profile and lifecycle fields while assigning a missing eligible canonical role.
- [x] 1.4 Keep the operation atomic and idempotent across user, assignment, and
  audit writes; reject conflicts, partner access, and ineligible lifecycle state
  without a partial mutation.
- [x] 1.5 Remove or retire the legacy single-email script and all
  `INITIAL_CL_ADMIN_EMAIL` behavior.

## 2. Packaged Command And Local Tooling

- [x] 2.1 Add a packaged backend command copied into the production image and
  retain the legacy script only as a temporary thin wrapper if needed.
- [x] 2.2 Add `make bootstrap-cl-admin` to ensure the local database is
  migrated, then invoke the packaged command without deleting local data.
- [x] 2.3 Remove the automatic legacy bootstrap command from `make db-reset-local`.
- [x] 2.4 Add safe `INITIAL_CL_ADMIN_EMAILS` placeholder/configuration
  documentation and describe `.env` as local-only.

## 3. Pipeline Invocation Documentation

- [x] 3.1 Document that a pipeline runs the packaged command in a dedicated
  post-migration run-to-completion workload using the deployed backend image and
  target database configuration.
- [x] 3.2 Document that only the command workload receives the roster setting,
  the runner waits for completion, fails on a non-zero exit, records safe
  aggregate evidence, and supports idempotent retry.
- [x] 3.3 Record that pipeline, task-definition, network, runner identity, and
  secret-source implementation require a named shared environment and owner.

## 4. Tests And Verification

- [x] 4.1 Add roster-configuration unit tests for valid one/many identity
  arrays, missing-roster no-op, malformed/non-array/empty values, normalized
  duplicate rejection, and the removal of `INITIAL_CL_ADMIN_EMAIL` fallback.
- [x] 4.2 Add bootstrap-service unit tests for missing users, existing eligible
  users with unchanged profile/lifecycle fields, missing assignments,
  lifecycle/partner/global-role conflicts, atomic rollback, deterministic
  ordering, idempotent rerun, and audit minimization.
- [x] 4.3 Add packaged-command unit tests for configuration loading, aggregate
  safe outcomes, missing-roster no-op, safe non-zero failures, and delegation to
  the bootstrap service.
- [x] 4.4 Add an image-focused check that proves the packaged command is
  available in the backend image without the legacy `src.scripts` import path.
- [ ] 4.5 Run backend tests, lint, and type checks.
- [x] 4.6 Perform targeted security and information-management review for
  personal information, transactional authorization changes, command isolation,
  pipeline contract, and auditability.
- [x] 4.7 Run `make validate-openspec-change CHANGE_ID=bootstrap-cl-admin-roster`.

## 5. Archive Follow-Through

- [ ] 5.1 Confirm implementation and verification are complete before archive.
- [ ] 5.2 Archive with `openspec archive bootstrap-cl-admin-roster --yes` after
  verification; do not use `--skip-specs` because this is a functional delta.
- [ ] 5.3 Confirm the current role-management spec includes this requirement and
  that the completed change package moved to the archive directory.
