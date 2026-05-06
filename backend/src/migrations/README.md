Generic single-database configuration.

Migration notes
---------------

- This repository uses a "clean baseline" migration strategy. Superseded
  revision files are archived under `migrations/_archive/`, and the active
  migration chain is rebuilt from the current SQLAlchemy models when the
  schema history is intentionally reset.

- The current active revision chain is:
  - `0001_initial_initial_schema_clean_baseline.py`
  - `0002_seed_department_catalog.py`
  - `0003_seed_superuser.py`
  - `0004_seed_roles.py`

- The archive folder `migrations/_archive/reset_20260420/` contains the
  superseded pre-reset active revisions that were replaced by this clean
  baseline.

- To autogenerate migrations locally without an available Postgres DB,
  set the environment variable `ALEMBIC_DRY_RUN=1`. This will make the
  alembic env use an in-memory sqlite DB for comparison only. Do NOT
  use `ALEMBIC_DRY_RUN=1` when applying migrations to a real Postgres
  database.

- Seeding
  - The department catalog seed is provided as migration
    `0002_seed_department_catalog.py`. It reads `app/data/gc_org_info.csv`.
  - A superuser can be seeded via environment variable `SUPERUSER`.
    Set `SUPERUSER=<email>` in the environment when running `alembic
    upgrade head` to create a superuser with that email. The seeded
    username is normalized to lowercase alphanumeric characters.
  - Essential roles are seeded by `0004_seed_roles.py`.

- Important review items before applying to any non-test DB:
  1. Open `migrations/versions/0001_initial_initial_schema_clean_baseline.py` and
    confirm schema shapes, indexes, and constraints.
  2. Decide whether to convert `sa.JSON()` to Postgres `JSONB` in the
    migration for better performance on JSON columns if the SQLAlchemy
    models are updated to match.
  3. Consider adding a composite unique constraint for workspace slugs
     if you need slug uniqueness scoped to department (e.g.
     `(department_id, slug)`).

Applying migrations (example)
-----------------------------

1. Ensure your DB config is available via environment/config files used by
   `app.core.config.settings`.
2. Run:

   cd backend/src
  UV_PROJECT_ENVIRONMENT=../../.venv uv run alembic upgrade head

Note: The `SUPERUSER` environment variable must be set in the same
environment that runs `alembic upgrade` for the superuser seed to run.

Do not rely on `app.core.setup.create_tables()` for environments that should
track schema state through Alembic. `create_tables()` is suitable for local or
test-only bootstrap flows, but the canonical reset/bootstrap path for a real
database is `alembic upgrade head`.

Examples and security note
--------------------------

Run migration and seed a superuser (example):

  SUPERUSER=admin@example.com UV_PROJECT_ENVIRONMENT=../../.venv uv run alembic upgrade head

If you use a different shell or process manager, ensure `SUPERUSER` is
exported in that environment. For example (POSIX):

  export SUPERUSER="admin@example.com"
  UV_PROJECT_ENVIRONMENT=../../.venv uv run alembic upgrade head

Security caution
----------------

- The migration creates a superuser account without a password. This is
  intentional: password provisioning should be handled out-of-band (CI,
  vault, or an interactive admin setup) to avoid leaking credentials in
  logs or environment variables.
- Do NOT set the `SUPERUSER` variable in long-lived, shared runner
  environments without additional controls. Prefer ephemeral CI job
  environment variables or a secure secrets store.
