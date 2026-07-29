# STD-020: Database Persistence

Type: Standard
Status: Active

## Read This When

Use this when adding, changing, reviewing, or operating relational persistence, database models, migrations, repository/data-access code, seed data, or stored business records.

Set the baseline for predictable, reviewable, and production-safe database usage.

## Rules

- Use PostgreSQL as the default relational database for project services that
  need relational persistence.
- Use SQLAlchemy 2.0 typed model style: `Mapped[...]`, `mapped_column`,
  explicit `__tablename__`, explicit nullability, bounded string lengths where
  useful, and database-level indexes or constraints for expected access
  patterns.
- Use async database access for FastAPI services and provide request-scoped
  sessions through shared dependency wiring.
- Keep route handlers out of persistence details. Routes call services; services
  enforce business rules and ownership; repository or data-access modules
  perform database reads and writes.
- Keep Pydantic request and response schemas separate from SQLAlchemy ORM
  models. Use distinct create, update, read, list, and internal schemas when
  the API contract differs from the persistence shape.
- Reject unexpected request fields with `extra="forbid"` where the API should
  not accept undeclared input.
- Use Alembic as the main schema-management path. Do not rely on
  `Base.metadata.create_all()` for shared, staging, production, or any database
  that needs tracked schema state.
- Include an Alembic migration for every schema change, reviewed before commit.
  Generated migrations must be checked for constraints, indexes, nullability,
  data loss, and downgrade behavior.
- Use public-safe identifiers, such as UUIDs, for externally exposed
  user-facing resources when the feature already has or needs a stable public
  identifier. Treat integer primary keys as internal persistence details unless
  an existing API contract intentionally exposes them.
- Add indexed foreign keys for common joins and ownership checks.
- Enforce integrity with database constraints where practical, including unique
  constraints, composite unique constraints, foreign keys, and check
  constraints. Service-level duplicate checks are not a substitute for database
  integrity.
- Scope tenant-owned or workspace-owned records with an explicit owner key, and
  scope uniqueness to that owner when names, slugs, or external identifiers only
  need to be unique inside that boundary.
- Prefer soft delete for business records, audit-relevant records, or records
  with recovery, retention, or disposition needs. Soft-deleted tables should use
  `is_deleted` and `deleted_at`, and default read paths should exclude deleted
  records.
- Use hard delete only when retention, audit, recovery, and privacy rules allow
  permanent removal.
- Avoid implicit lazy-loading behavior by default. Use explicit queries, joins,
  eager loading, or repository methods so data access and performance are
  visible in code review.
- Prefer PostgreSQL `JSONB` over generic JSON when JSON values need querying,
  indexing, or long-term operational use.
- Keep local, test, shared, and production database credentials in environment
  or secret configuration, never in source, examples, logs, or verification
  output.
- Seed reference data through reviewable migrations or explicit seed scripts
  with idempotent behavior and downgrade or cleanup expectations where
  appropriate.

## Examples

- `backend/app/db/database.py`: async engine, session factory, and shared
  `get_db` dependency.
- `backend/app/db/` or `backend/app/persistence/`: SQLAlchemy persistence
  models when the project keeps ORM models separate from API schemas.
- `backend/app/models/` or `backend/app/schemas/`: Pydantic API and internal
  schemas, following the project's established naming convention.
- `backend/app/repositories/<resource>.py`: repository or data-access adapter.
- `backend/app/services/<resource>_service.py`: business rules, ownership, and
  orchestration.
- `backend/migrations/versions/`: Alembic migration files.
- `backend/tests/`: model, repository, service, API, and migration-adjacent
  tests.

## Checks

- [ ] Data ownership, sensitivity, retention, and delete semantics are known.
- [ ] SQLAlchemy models use typed 2.0 style and explicit constraints.
- [ ] API schemas are separate from ORM models and reject unexpected request
      fields where appropriate.
- [ ] Repository/data-access code keeps persistence details out of routes.
- [ ] Alembic migrations exist for schema, index, constraint, or seed-data
      changes.
- [ ] Migrations have been reviewed for nullability, data conversion, data loss,
      rollback, and deployment order.
- [ ] Public APIs do not newly expose internal integer IDs without a deliberate
      API decision.
- [ ] Tenant or workspace ownership is enforced in reads and writes.
- [ ] Soft delete, hard delete, or disposition behavior matches retention and
      audit expectations.
- [ ] Tests cover model constraints, service behavior, authorization or
      ownership checks, and meaningful create/read/update/delete paths.

## Related Schema Contracts

- Schema contract: [ARCH-SCHEMA-STD-020-DATABASE-PERSISTENCE](../schemas/standards/std-020-database-persistence.schema.yaml)
- Used for: helping agents and reviewers check data ownership, sensitivity,
  retention, SQLAlchemy model style, API schema separation, repository
  boundaries, Alembic migrations, migration review, public identifiers,
  tenant/workspace ownership, delete behavior, and persistence tests.
- Notes: The schema contract supports this standard. It does not replace this
  standard as the source of truth.
