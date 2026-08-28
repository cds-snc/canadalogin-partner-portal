# PAT-006: CRUD Resource

Type: Pattern
Status: Active

## Problem

CRUD resources need a consistent implementation shape for create, read, update, and delete behavior across API, service, persistence, and tests.

## Use When

- A backend feature needs create, read, update, delete, or list behavior for a
  resource.
- The resource maps to persisted data.

## Do Not Use When

- The action is not resource-oriented, such as a workflow transition or job.
- Delete semantics, retention, or audit rules are not known.

## Trade-Offs

- Provides predictable CRUD behavior, but can overfit when the domain action is not really create, read, update, or delete.
- Authorization, ownership, and audit requirements may add project-specific decisions.

## Approach

1. Define the resource and ownership boundary in API specification.
2. Add Pydantic create, update, read, and list models.
3. Add a repository or data-access adapter when the resource is persisted.
4. Add persistence model and migration when the database is enabled.
5. Implement service methods for create, get, list, update, and delete.
6. For each create, update, or delete path, decide whether a successful write
   changes data held in a backend or frontend cache. Invalidate affected
   entries or update them coherently after success. Record `N/A` when neither
   layer caches the affected data.
7. Enforce authorization in the service or dependency layer before reading or
   changing the resource.
8. Prefer soft delete when retention, audit, or recovery matters.
9. Return list objects with `items` and metadata, not top-level arrays.

### Expected Files

- `backend/app/models/<resource>.py`: request and response models.
- `backend/app/routers/<resource>.py`: resource endpoints.
- `backend/app/services/<resource>_service.py`: resource behavior.
- `backend/app/repositories/<resource>.py`: database access adapter when
  persistence is enabled.
- `backend/app/db/` or `backend/app/models/`: SQLAlchemy persistence model when
  persistence is enabled.
- `backend/migrations/versions/`: Alembic migration when schema changes.
- `backend/tests/test_<resource>.py`: route and service tests.
- `openapi/openapi.json`: refreshed contract when API shape changes.

## Checks

### Tests

- Create validates required fields.
- Get/list enforce owner or role restrictions.
- Update rejects unauthorized or stale changes.
- Delete follows retention and audit rules.
- List pagination, filtering, and sorting behave as specified.
- Database constraints, ownership scopes, and soft-delete filters behave as
  specified when the resource is persisted.
- When caching applies, a focused test proves that a read after a successful
  write cannot return the previous cached representation. When an integration
  cache is unavailable, test the affected invalidation or update behavior and
  record the remaining gap.

### Verification

- Pytest output.
- API contract diff when API shape changes.
- Authorization and delete semantics review.
- Migration review note when schema changes.
- Cache applicability and stale-cache prevention evidence, or an `N/A`
  rationale when neither backend nor frontend caches the affected data.

### Stop Conditions

- Data classification is unknown.
- Ownership or tenant boundary is unclear.
- Legal, retention, audit, or deletion rules are unclear.

## Related Schema Contracts

- Schema contract: [ARCH-SCHEMA-PAT-006-CRUD-RESOURCE](../../schemas/patterns/pat-006-crud-resource.schema.yaml)
- Used for: helping agents and reviewers check CRUD ownership, API models,
  service and repository boundaries, migrations, authorization, delete
  semantics, write-path cache consistency, and tests.
- Notes: The schema contract supports this pattern. It does not replace this
  pattern as the source of truth.
