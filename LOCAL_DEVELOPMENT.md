# Local Development

Use this command sheet from the repository root. It is for localhost only,
with local or fake data and no production secrets.

## First-Time Setup

Prerequisites: Python 3.12, Node.js 20.19 or newer, `uv`, `corepack`, and a
running Docker-compatible container runtime such as Colima or Docker Desktop.

Create the local environment files if they do not already exist:

```sh
cp backend/.env.sample backend/.env
cp frontend/.env.sample frontend/.env
```

Then check and install the local dependencies:

```sh
make doctor
make setup
```

Keep the generated `.env` files local. Do not add real secrets or commit them.

## Start Everything

For the normal local development experience with deterministic fake users and
the role selector:

```sh
make start-local-personas
```

Or start the application using the authentication settings in `backend/.env`:

```sh
make start-dev
```

Both commands start PostgreSQL and Redis, apply pending database migrations,
and run the backend and frontend. Open:

- Frontend: <http://127.0.0.1:3000>
- Backend API: <http://127.0.0.1:8000>
- API docs: <http://127.0.0.1:8000/docs>

Press `Ctrl-C` to stop the backend and frontend. PostgreSQL and Redis remain
running so local data is preserved.

## Start Individual Parts

Run these in separate terminals when you do not want the combined command:

| What                    | Command             | Notes                                                 |
| ----------------------- | ------------------- | ----------------------------------------------------- |
| PostgreSQL and Redis    | `make db-up`        | Starts both dependency containers.                    |
| Backend                 | `make bk-dev`       | Also starts dependencies and applies migrations.      |
| Frontend                | `make frontend-dev` | Requires the frontend dependencies from `make setup`. |
| Background worker       | `make bk-worker`    | Run only when testing background jobs.                |
| Database and Redis logs | `make db-logs`      | Follow logs; exit with `Ctrl-C`.                      |

## Update After Pulling Changes

Refresh dependencies, start PostgreSQL and Redis, and apply any new migrations:

```sh
make all-install
make db-up
make db-upgrade
```

Then use `make start-local-personas` or `make start-dev`. The start commands
also run `make db-upgrade`, so the explicit upgrade is optional when using
either combined command.

## Database Schema Changes

Apply existing migrations, including migrations that add new tables or
columns:

```sh
make db-upgrade
```

After changing backend models, create a new migration and then review the
generated file before applying it:

```sh
make db-revision DB_MIGRATION_MESSAGE="describe the schema change"
make db-upgrade
```

To step back exactly one migration during local development:

```sh
make db-downgrade
```

## Stop Or Reset

Stop PostgreSQL and Redis without deleting local data:

```sh
make db-down
```

Delete the local PostgreSQL and Redis state, recreate it, apply all migrations,
and rerun the initial local administrator bootstrap:

```sh
make db-reset-local
```

`make db-reset-local` is destructive to local container data. Afterward, use
`make start-local-personas` to recreate the fake local personas and start the
application.

To recreate only the namespaced fake personas without resetting the whole
database:

```sh
make reset-local-personas
```

Normal persona startup preserves department selections made through the UI and
their resulting update timestamps. Those profile fields are not authorization;
the seed still fails closed when fixture identities, lifecycle state, canonical
role assignments, or partner access differ from the recorded catalog.

For role-based designer videos, use the separate, loopback-pinned walkthrough
profile in
[Designer Walkthrough Recordings](docs/reference/designer-walkthrough-recordings.md).
It preserves the normal developer database and cache profile.

Run `make help` for the shorter command menu or `make help-all` for every
available target.
