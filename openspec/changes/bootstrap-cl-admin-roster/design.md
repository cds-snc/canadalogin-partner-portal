# Design: Bootstrap a Configured CL Admin Roster

## Design Goal

Provide one reusable, explicit backend command that establishes the configured
canonical CL Admin roster after the schema is current. The command is packaged
with the backend application so local tooling and a pipeline can run the same
implementation. It is not a migration, web/worker startup hook, or HTTP API.

## Configuration Contract

| Input | Purpose | Rules |
|---|---|---|
| `INITIAL_CL_ADMIN_EMAILS` | Bootstrap roster | JSON array of 1..N email identities. Local example: `INITIAL_CL_ADMIN_EMAILS='["admin.one@example.test","admin.two@example.test"]'` in ignored `backend/.env`. |
| `INITIAL_CL_ADMIN_EMAIL` | Deprecated setting | Removed. It has no fallback or compatibility behavior. |

The parser trims and lowercases roster entries before duplicate detection. It
rejects malformed JSON, non-array values, empty lists or values, invalid email
addresses, and duplicate normalized entries before database writes begin.

Local development reads settings from ignored `backend/.env`. A pipeline or
deployed workload supplies the same setting as backend process configuration
from its approved environment or secret source. It must not copy a local `.env`
file into an image, task definition, repository, or logs.

## Bootstrap Command Contract

The packaged command is invoked explicitly after `alembic upgrade head` and:

- reads the roster only from application settings;
- has no roster command-line argument;
- exits successfully without mutation when `INITIAL_CL_ADMIN_EMAILS` is absent;
- fails non-zero before commit when configuration or roster state is invalid;
- returns/logs only aggregate created and unchanged counts and safe failure
  categories; and
- never logs email addresses, roster JSON, raw UUIDs, or environment values.

The local `make bootstrap-cl-admin` target ensures the local database is
available, applies migrations, then invokes the packaged command. It does not
reset database volumes. `make db-reset-local` remains destructive and applies
migrations only; bootstrap remains an explicit follow-up operation.

## Bootstrap Service Algorithm

1. Parse and validate `INITIAL_CL_ADMIN_EMAILS` before database writes.
2. Acquire the CL Admin roster lock and resolve the immutable canonical
   `cl_admin` role.
3. Process normalized identities in deterministic lexical order, acquiring the
   existing target-user lock when an identity already has a user record.
4. Create an enabled canonical user only when no user exists. Existing user
   profile and lifecycle fields are never modified by bootstrap.
5. Validate lifecycle, active partner grant, and active global-role state. For
   an eligible existing user, create only a missing canonical CL Admin
   assignment.
6. Add one minimized `bootstrap` audit event for every new assignment. Do not
   create duplicate user, assignment, or audit records on a rerun.
7. Commit all roster mutations together. Any validation, lock, conflict, or
   write failure rolls back all user, assignment, and audit mutations.

## Pipeline Invocation Contract

A pipeline runs the command in a dedicated, run-to-completion backend workload
using the same deployed image and database connection configuration as the web
service. It must run only after the migration owner has successfully applied
`alembic upgrade head` to the target database.

The pipeline/workload composition must:

1. inject `INITIAL_CL_ADMIN_EMAILS` only into the command workload from its
   approved environment or secret source;
2. keep the roster setting out of normal web and worker runtime processes;
3. wait for command completion and treat a non-zero exit as a failed bootstrap;
4. record only image revision, command/workload revision, timestamp, exit
   status, safe failure category, and aggregate outcome counts; and
5. support safe retries because the command is idempotent and additive.

The pipeline implementation, workload definition, network configuration, and
secret-store integration are deferred. This contract is documentation for their
later implementation, not an authorization to execute against a shared
environment.

## Security, Privacy, IAM, And Operations

- The roster is personal information. Keep real values out of source,
  `.env.sample`, Terraform state, task definitions, command arguments, logs,
  audit payloads, tests, and evidence.
- Do not automatically revoke omitted identities. Preserve the last-CL-Admin
  invariant and existing valid assignments.
- The command uses normal application database settings, locks, models, and
  audit schemas, but no normal web/worker process automatically invokes it.
- A shared environment requires an approved runner identity, database network
  access, roster-secret source, execution owner, and rollback/evidence path
  before it can use this command.

## Impacted Artifacts

- `backend/src/app/core/config.py`
- a packaged command and reusable bootstrap service under `backend/src/app/`
- `backend/src/scripts/create_initial_cl_admin.py` retirement or thin wrapper
- `backend/tests/test_create_first_superuser.py` replacement plus focused
  configuration, service, command, and packaging tests
- `backend/Dockerfile`, `backend/.env.sample`, `Makefile`, and bootstrap docs
- pipeline-invocation documentation
- active OpenSpec delta and current role-management spec after archive

## Implementation Slices

### Slice 1: Roster configuration and transactional service

Replace the legacy setting with the roster parser and make the authorization
bootstrap behavior reusable, atomic, and idempotent.

**Exit criteria:** missing users and assignments are created exactly once;
existing user profile/lifecycle fields are unchanged; conflicts leave no partial
mutation; legacy setting behavior is absent.

### Slice 2: Packaged command and local tooling

Make the command available in the production image, add the non-destructive
local target, remove reset-time automatic bootstrap, and document local use.

**Exit criteria:** local and image-focused checks invoke the same command; the
local target does not reset data; documentation contains placeholders only.

### Slice 3: Pipeline contract documentation and verification

Document the post-migration run-to-completion pipeline contract and verify the
command's safe result, failure, and retry behavior locally.

**Exit criteria:** documentation states the workload, configuration isolation,
wait/failure, evidence, and retry requirements; tests and OpenSpec validation
pass; no shared-environment action occurs.

## Deferred Shared-Environment Delivery

ECS task definitions, Terraform, GitHub Actions changes, secret-store wiring,
network policy, and release approvals are deferred. A named target environment
and owner are required before the documented pipeline contract is implemented
or used outside localhost.
