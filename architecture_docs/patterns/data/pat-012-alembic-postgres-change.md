# PAT-012: Alembic PostgreSQL Change

Type: Pattern
Status: Active

## Problem

PostgreSQL schema changes need a repeatable migration path so database state, application code, and rollback expectations stay aligned.

## Use When

- A backend feature needs a relational schema change.
- The project has enabled PostgreSQL and SQLAlchemy.

## Do Not Use When

- The backend is still intentionally database-free.
- Data model ownership, migration safety, retention, or rollback expectations
  are unclear.

## Trade-Offs

- Makes schema changes traceable, but requires coordination with application deploys and data migration safety.
- Destructive or large data changes usually need a separate rollout decision.

## Approach

1. Define the data model and ownership boundary in an architecture note or ADR.
2. Add or update SQLAlchemy models.
3. Create an Alembic migration with a clear revision message.
4. Confirm that each new Alembic `revision` identifier fits the configured
   capacity of `alembic_version.version_num`, or of the corresponding
   `version_num` column when the version table name or schema is customized.
   Determine the capacity from project configuration or database metadata; do
   not assume a universal character limit or infer it from the migration
   filename.
5. Review generated migration code before committing it.
6. Check generated migration code for indexes, foreign keys, unique
   constraints, nullability, data conversion, and unintended data loss.
7. Add new non-nullable columns through an expand/backfill/contract sequence
   when existing rows may be present.
8. Seed reference data through idempotent migration logic or explicit seed
   scripts, and include cleanup expectations for downgrade where appropriate.
9. Include forward migration behavior and downgrade behavior when the project
   expects downgrades.
10. Add tests for model behavior and service behavior.
11. Keep local connection strings and credentials out of source.
12. Do not use `Base.metadata.create_all()` as the main path for shared,
    staging, production, or any database that needs tracked schema state.

### Expected Files

- `backend/app/models/` or `backend/app/db/`: SQLAlchemy model.
- `backend/migrations/versions/`: Alembic migration.
- `backend/tests/`: model, repository, or service tests.
- Architecture note or ADR when data ownership or retention is a decision.

## Checks

### Tests

- Migration applies locally or in a test database path and preserves the full
  revision identifier in the configured version table.
- Alembic resolves the applied revision and expected migration graph without
  identifier truncation or revision lookup failures.
- Model constraints and indexes match the expected behavior.
- Service tests cover create, read, update, delete, and ownership checks.
- API contract is refreshed when API models change.
- Seed/reference data is idempotent when included.

### Verification

- Migration review note.
- Configured version table and `version_num` capacity, with evidence that the
  full revision identifier is stored and resolves successfully.
- Pytest output.
- Data retention, ownership, and rollback assumptions.
- Deployment sequencing notes for destructive, large, or backfilled changes.

### Stop Conditions

- Real production data or production database access is requested.
- Migration rollback, retention, or data conversion rules are unclear.
- Destructive changes need a separate rollout decision.
- The configured `version_num` capacity cannot store the revision identifier,
  or Alembic cannot resolve the resulting migration graph.

## Related Schema Contracts

- Schema contract: [ARCH-SCHEMA-PAT-012-ALEMBIC-POSTGRES-CHANGE](../../schemas/patterns/pat-012-alembic-postgres-change.schema.yaml)
- Used for: helping agents and reviewers check migration review, rollback or
  downgrade consideration, configured revision capacity and lookup behavior,
  data-loss review, tests, and deployment sequencing notes.
- Notes: The schema contract supports this pattern. It does not replace this
  pattern as the source of truth.
