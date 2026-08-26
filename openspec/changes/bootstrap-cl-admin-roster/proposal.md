# Proposal: Bootstrap a Configured CL Admin Roster

## Summary

Replace the deprecated single-email bootstrap with a reusable, idempotent
backend command that establishes a configured CL Admin roster. Local tooling
and a deployment pipeline invoke the same command after migrations; no HTTP
bootstrap endpoint is introduced.

## Problem

The current command accepts only `INITIAL_CL_ADMIN_EMAIL`, so it can assign one
CL Admin identity at a time. It is reached locally through the destructive
`make db-reset-local` path and is not packaged in the deployed application
image. There is no documented pipeline-safe command contract for a deployment
to establish configured initial CL Admin identities.

For this change, “one to many CL Admin roles” means one canonical global
`cl_admin` assignment for each identity in a configured roster. It does not
introduce multiple global roles per user or alter the fixed four-role model.

## Work Context And Control Boundary

- Current implementation and verification context: local developer / localhost
  under STD-002: Work Contexts, using only fake `example.test` identities.
- Allowed now: repository code, local commands, local tests, and documentation.
- Denied now: pipeline execution against a shared environment, Terraform apply,
  AWS/secret-store access, real administrator identities, production data, and
  release approval.
- Sensitive data: configured administrator email addresses are personal
  information. They must not appear in source, examples, logs, audit payloads,
  test snapshots, or evidence.
- Naming: `INITIAL_CL_ADMIN_EMAILS` and the packaged command name describe
  durable application concepts. `local.example` remains reserved for disposable
  local personas.

## Scope

- Add `INITIAL_CL_ADMIN_EMAILS` as the only roster input: a JSON array of one
  or more administrator email addresses.
- Remove `INITIAL_CL_ADMIN_EMAIL`, its fallback behavior, and legacy
  documentation.
- Move the bootstrap implementation into a command module that is packaged in
  the backend image and can be invoked by local tooling or a pipeline runner.
- Create an enabled user only when the roster identity has no user record.
  Existing user profile and lifecycle fields are not modified; eligible existing
  users may receive a missing canonical CL Admin assignment.
- Create missing canonical `cl_admin` assignments atomically and idempotently,
  preserving locking, conflict, and minimized audit behavior.
- Add a non-destructive `make bootstrap-cl-admin` wrapper that migrates the
  local database then invokes the packaged command.
- Document the pipeline invocation contract: use a run-to-completion workload
  with the deployed backend image, database configuration, and roster supplied
  only through backend environment/secret configuration; run after migrations;
  wait for and act on the command exit status.
- Add configuration, command, packaging, test, and documentation checks.

## Out Of Scope

- An HTTP bootstrap endpoint, bootstrap token, or client-supplied roster data.
- Revoking a CL Admin omitted from a later roster.
- Local persona fixtures, partner-role assignment, workspace creation, or
  legacy-user import.
- Implementing shared-environment pipeline, Terraform, task-definition,
  secret-store, networking, or release automation changes.

## Decisions And Open Questions

### Resolved From Repository Evidence

- Canonical CL Admin assignment is global, cannot coexist with active partner
  access, and is audit-relevant.
- Alembic is the tracked schema/reference-data path; operational identity
  bootstrap belongs in an explicit idempotent command rather than a migration or
  normal service startup.
- The existing deployed image copies `app` but not `src/scripts`, so the command
  needs an application-package entry point to be runnable by a pipeline.
- STD-020 calls for idempotent seed behavior; STD-013, STD-014, and GC-WEB-007
  require safe personal-information and configuration handling.

### Proposed Contract Decisions

- `INITIAL_CL_ADMIN_EMAILS` replaces `INITIAL_CL_ADMIN_EMAIL`; no compatibility
  fallback remains.
- The command reads roster data only from backend application settings, not
  command-line arguments, request data, or source-controlled files.
- An absent roster makes the command exit successfully without mutation, so it
  can be included in a generic pipeline path. Malformed or conflicting input
  fails without committing a partial roster mutation.
- A pipeline invokes the same packaged command explicitly after migrations. It
  does not add the roster setting to normal web or worker process configuration.
- The roster is additive. It creates missing users and assignments but never
  revokes an omitted CL Admin.

### Deferred Shared-Environment Decisions

Before shared-environment use, a human owner must decide the target pipeline,
run-to-completion workload, roster secret source, database/network configuration,
execution identity, rollback path, and evidence owner. The documented command
contract does not require these values in this repository.

## Standards Impact

- STD-002: local-first implementation and a documented deferred deployment
  boundary.
- STD-020: atomic, idempotent user and authorization-record writes.
- STD-013 and GC-WEB-007: safe logs, authorization data integrity, and secure
  failure behavior.
- STD-014: `.env` is local-only; deployment roster values use environment or
  approved secret configuration and never source files.
- STD-016, BAS-001, and STD-019 are deferred because this change documents but
  does not implement deployment or release behavior.

## Affected Capability

- Current spec: `openspec/specs/partner-portal-role-management/spec.md`
- Delta spec:
  `openspec/changes/bootstrap-cl-admin-roster/specs/partner-portal-role-management/spec.md`
- New requirement: a configured command safely establishes a canonical CL Admin
  roster.
