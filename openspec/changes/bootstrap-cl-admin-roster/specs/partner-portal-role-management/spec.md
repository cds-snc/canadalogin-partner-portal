# Delta for Bootstrap a Configured CL Admin Roster

## ADDED Requirements

### Requirement: Configured command bootstraps a canonical CL Admin roster

The portal SHALL provide a separately invoked, idempotent bootstrap command
that establishes one active global `cl_admin` assignment for each eligible
identity in the server-configured `INITIAL_CL_ADMIN_EMAILS` roster. The command
SHALL use the canonical assignment, lifecycle, locking, partner-access-conflict,
and audit rules. It SHALL NOT create a superuser product role, grant partner
access, or revoke an existing CL Admin because that identity is omitted from a
later roster.

`INITIAL_CL_ADMIN_EMAILS` SHALL be a JSON array. The deprecated
`INITIAL_CL_ADMIN_EMAIL` setting SHALL NOT configure the command. The command
SHALL reject malformed configuration and invalid identities before committing a
mutation, and SHALL write only safe aggregate outcome information to its output
and logs.

For each roster identity without a user record, the command SHALL create an
enabled user and its canonical CL Admin assignment. For an eligible existing
user, it SHALL not modify the user profile or lifecycle state, but SHALL create
a missing canonical CL Admin assignment. The command SHALL be atomic and
idempotent.

The command SHALL be available in the deployed backend image. A deployment
pipeline MAY invoke it only after the target database schema is current, in a
dedicated run-to-completion workload with the roster supplied only through
backend environment or approved secret configuration. Normal web and worker
processes SHALL NOT receive the roster or invoke the command automatically.

#### Scenario: Command creates configured missing users and assignments

- **GIVEN** the schema is current and `INITIAL_CL_ADMIN_EMAILS` contains valid
  eligible identities
- **WHEN** the explicit bootstrap command runs
- **THEN** the portal creates an enabled user only for every configured identity
  without a user record
- **AND** it creates one active canonical global `cl_admin` assignment for each
  eligible identity without that assignment
- **AND** every new assignment has a minimized successful `bootstrap` audit
  event
- **AND** command output contains only aggregate created and unchanged counts

#### Scenario: Command preserves existing eligible user state

- **GIVEN** an identity in the configured roster already has an enabled,
  non-deleted user record and no active partner grant or conflicting global role
- **WHEN** the explicit bootstrap command runs
- **THEN** the portal does not modify the existing user's profile or lifecycle
  state
- **AND** it creates only a missing canonical CL Admin assignment when needed
- **AND** a rerun creates no duplicate user, assignment, or audit event

#### Scenario: Invalid or conflicting roster causes no partial seed

- **GIVEN** a configured roster contains malformed input, duplicate normalized
  identities, a disabled/deleted user, active partner access, or a conflicting
  active global assignment
- **WHEN** the explicit bootstrap command runs
- **THEN** the command fails safely before committing a partial roster mutation
- **AND** command output, logs, and audit payloads do not contain an email
  address, roster value, raw UUID, or internal identifier
- **AND** existing valid authorization state remains unchanged

#### Scenario: Pipeline invokes the command only after migrations

- **GIVEN** a deployment pipeline has successfully applied migrations to the
  target database and has an approved run-to-completion backend workload
- **WHEN** it invokes the packaged bootstrap command with a valid configured
  roster
- **THEN** only that workload receives `INITIAL_CL_ADMIN_EMAILS`
- **AND** the pipeline waits for completion and treats a non-zero exit as a
  failed bootstrap
- **AND** it records only safe aggregate outcomes and workload execution status
- **AND** normal web and worker processes do not receive the roster setting

#### Scenario: Normal runtime does not bootstrap from configured roster data

- **GIVEN** application environment configuration contains a valid roster
- **WHEN** the web or worker process starts without the explicit bootstrap
  command
- **THEN** the portal does not create or change CL Admin assignments
- **AND** it does not substitute a legacy superuser, local persona, or inferred
  identity
