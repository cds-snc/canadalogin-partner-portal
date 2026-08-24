# CL Admin Roster Bootstrap

## Local Command

The explicit backend command establishes the canonical global CL Admin role for
the identities configured in `INITIAL_CL_ADMIN_EMAILS`. The setting is a JSON
array and belongs only in ignored local `backend/.env` during localhost work.
For example, use only fake identities:

```dotenv
INITIAL_CL_ADMIN_EMAILS='["admin.one@example.test","admin.two@example.test"]'
```

Run the local wrapper from the repository root:

```sh
make bootstrap-cl-admin
```

It starts local dependencies, runs `alembic upgrade head`, then invokes the
packaged command. It does not reset database volumes. An absent roster is a
successful no-op. Malformed, empty, duplicate-normalized, or invalid roster
entries fail before the command commits any mutation.

The packaged-image invocation is:

```sh
python -m app.commands.bootstrap_cl_admin
```

The command creates enabled users only when they do not exist, preserves every
existing user profile and lifecycle value, and atomically creates missing
eligible canonical assignments. It is additive and idempotent: it never
revokes an identity omitted from a later roster. Output and logs contain only
aggregate counts and safe failure categories.

## Deferred Pipeline Contract

This repository does not implement shared-environment automation. A future
pipeline must invoke the packaged command in a dedicated run-to-completion
workload using the deployed backend image and target database configuration,
only after its migration owner has successfully run `alembic upgrade head`.

The workload must:

1. receive `INITIAL_CL_ADMIN_EMAILS` only from approved backend environment or
   secret configuration, and never place it in normal web or worker processes;
2. wait for command completion and treat a non-zero exit status as bootstrap
   failure;
3. record only the image and workload revision, timestamp, exit status, safe
   failure category, and aggregate outcome counts; and
4. permit safe retries because the command is atomic, additive, and idempotent.

Pipeline, task-definition, network, runner-identity, secret-source, and
rollback/evidence implementation remain deferred until a named shared
environment and responsible owner approve that work.