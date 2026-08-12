# Migration notes

This directory uses Alembic's generic single-database configuration.

- This repository uses a "clean baseline" migration strategy. Superseded
  revision files are archived under `migrations/_archive/`, and the active
  migration chain is rebuilt from the current SQLAlchemy models when the
  schema history is intentionally reset.

- The current active revision chain runs linearly from `0001_core_schema.py`
  through `0025_workspace_invitations.py`. The current head is
  `0025_workspace_invitations`.

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
  - Essential roles are seeded by `0004_seed_roles.py`.
  - Alembic does not create an authorization user. After the schema is current,
    establish the first CL Admin only through the idempotent
    `src.scripts.create_initial_cl_admin` command with
    `INITIAL_CL_ADMIN_EMAIL` set for that invocation.

- Four-role authorization migration
  - `0019_four_role_expand.py` adds the nullable canonical role code,
    normalized `user_role` assignments, lifecycle metadata, and unvalidated
    compatibility constraints. It does not remove `role_ids`, `is_superuser`,
    workspace membership, or either invitation/grant provenance link.
    Because the legacy grant schema recorded `status='revoked'` without a
    revocation timestamp, expansion deterministically sets `revoked_at` from
    `updated_at`, falling back to `created_at`, and leaves the unknown actor
    null. Downgrading to `0018` removes that new timestamp column but preserves
    revoked rows and statuses; a later re-upgrade reconstructs the same marker
    from the preserved record timestamps.
  - Upgrade through `0019_four_role_expand`, then run the read-only
    reconciliation command from `backend/` before applying the backfill:

    ```sh
    UV_PROJECT_ENVIRONMENT=../.venv uv run python -m src.scripts.reconcile_four_role_authorization \
      --output four-role-report.json \
      --candidate-manifest four-role-manifest.json
    ```

  - The candidate manifest contains no access decisions. If a reviewed
    provenance artifact is required for a rollout, set `reviewed` to `true`,
    record a bounded non-personal `reviewReference`, and re-run the command
    with `--reviewed-manifest four-role-manifest.json` to bind it to the
    current report and exact reconciliation snapshot. Both
    `clAdminAssignments` and `workspaceMemberDispositions` must remain empty:
    reconciliation validation and migration `0020` reject every non-empty
    value. Establish the initial CL Admin separately with
    `python -m src.scripts.create_initial_cl_admin`, using a newly designated
    internal identity rather than a legacy candidate or ad hoc SQL. Establish
    partner access later through canonical workspace and role management; a
    legacy `workspace_member` row never creates a grant.
  - After migration, run the reconciliation command again with
    `--baseline-report four-role-report.json` to emit actual comparable
    `tableCountsBefore`/`tableCountsAfter` and
    `candidateCountsBefore`/`candidateCountsAfter` values.
  - `0020_four_role_backfill.py` applies the same zero-legacy-access policy to
    clean and populated databases. `FOUR_ROLE_BACKFILL_MANIFEST` is optional;
    when absent, the migration records the deterministic empty decision against
    the locked snapshot. When an explicit reviewed manifest is supplied, it
    rejects a stale snapshot digest and either non-empty legacy assignment
    list. The migration preserves existing canonical grants, never derives CL
    Admin or partner access from legacy state, rejects active grants whose user
    is disabled/deleted or whose workspace is deleted, and persists only zero
    decision counts, digests, and the review reference as an `auth_migrate`
    audit record; decision subject UUIDs are not copied into its description.
  - `0021_four_role_constraints.py` replaces the temporary display-label role
    checks with canonical-key-only checks, validates reconciled lifecycle and
    provenance constraints, and adds source-invitation and normalized
    pending-invitation uniqueness. It keeps `role.code` nullable until uncoded
    legacy role retirement and runtime parity are separately approved.
  - `0022_invitation_revocation_actor.py` adds nullable, indexed
    `revoked_by_user_id` history to developer invitations with a restricted
    user foreign key. Existing revoked invitation actors remain null because
    the migration cannot infer a human actor safely; new authorized revocation
    and pending-reissue transitions persist the actor in the service layer.
  - `0023_authorization_im.py` marks retained actorless revocation history as
    `legacy_unknown`, constrains new user-attributed revocations to a retained
    actor foreign key, and adds time/target/operation indexes used by authorized
    audit discovery. Review index build timing separately before any non-local
    rollout with a large audit table.
  - `0024_rp_registration_draft_metadata.py` adds additive, resumable RP
    registration draft metadata without fabricating values for existing
    application rows.
  - `0025_workspace_invitations.py` allows a developer invitation to retain
    its required workspace authority without requiring RP application
    provenance. Existing application links remain unchanged. Downgrade fails
    rather than deleting or fabricating provenance when workspace-only
    invitation records exist.
  - The executable PostgreSQL round-trip tests are opt-in. They require a
    localhost administrative URL whose test user can create and drop databases;
    each test creates a uniquely named database and removes only that database:

    ```sh
    RUN_FOUR_ROLE_POSTGRES_TESTS=1 \
    FOUR_ROLE_POSTGRES_ADMIN_URL='postgresql+psycopg2://postgres:postgres@127.0.0.1:55432/four_role_test' \
      .venv/bin/pytest -q backend/tests/test_four_role_migrations_postgres.py
    ```

    Normal test runs leave the gate unset and skip these tests. The populated
    path creates its reviewed manifest only in pytest's temporary directory.
  - Use fake/test-only records locally. Do not point the reconciliation command
    or migrations at a shared or production database without the separately
    approved migration, retention, rollback, and release plan.

- Important review items before applying to any non-test DB:
  1. Open `migrations/versions/0001_core_schema.py` and
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

Do not rely on `app.core.setup.create_tables()` for environments that should
track schema state through Alembic. `create_tables()` is suitable for local or
test-only bootstrap flows, but the canonical reset/bootstrap path for a real
database is `alembic upgrade head`.

Initial CL Admin bootstrap
--------------------------

After migration, run the explicit bootstrap from `backend/` with the selected
identity set only for that invocation:

```sh
INITIAL_CL_ADMIN_EMAIL=admin@example.test \
  UV_PROJECT_ENVIRONMENT=../.venv \
  uv run python -m src.scripts.create_initial_cl_admin
```

The command creates or reuses an enabled, non-deleted identity and writes the
normalized assignment and minimized audit record. It fails closed for
conflicting assignments or active partner access. Do not substitute legacy
`SUPERUSER`, `is_superuser`, raw SQL, or an Alembic seed for this controlled
bootstrap.
