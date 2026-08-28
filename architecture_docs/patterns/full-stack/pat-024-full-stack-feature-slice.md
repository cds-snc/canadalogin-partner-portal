# PAT-024: Full-Stack Feature Slice

Type: Pattern
Status: Active

## Problem

Features that cross an API, backend, persistence, authorization, and frontend
can appear complete in one layer while contracts, access rules, user states, or
verification drift elsewhere. Teams need one adaptable delivery path that
keeps the slice coherent without making every optional layer mandatory.

## Use When

- A new or materially changed user-facing feature reads or changes backend
  data.
- A requirement must be traced through an API contract, backend behavior,
  frontend behavior, and tests.
- Persistence, migrations, authorization, or user-visible status states may
  apply and need explicit decisions.
- Several layer-specific patterns need to be coordinated as one reviewable
  delivery slice.

## Do Not Use When

- The change is isolated copy, documentation, styling, or static content with
  no API or backend behavior.
- The change affects only one layer and a focused pattern such as PAT-002,
  PAT-005, or PAT-012 fully describes it.
- The work is only a scaffold or follow-on placeholder and is not intended to
  deliver usable end-to-end behavior.
- Data ownership, authorization boundaries, API behavior, or required user
  outcomes are too unclear to define the slice. Resolve those decisions first.

## Trade-Offs

- End-to-end slices reduce contract drift and incomplete features, but they
  require coordination across more files and tests.
- Small vertical increments are easier to verify, but may require several
  slices for a large workflow.
- Explicit not-applicable decisions add review work, but prevent optional
  persistence, migration, authorization, cache effects, and UI states from
  being silently missed.
- The pattern coordinates layer-specific patterns; it does not replace their
  detailed guidance.

## Approach

1. Describe the requirement, user outcome, and success and failure scenarios.
   Declare the work context and solution target separately, then identify
   sensitive data, ownership, target external dependencies, and system
   boundaries.
2. Define the API behavior before implementation. Record the method, resource
   path, request and response models, authorization, status codes, errors, and
   canonical serialized JSON field naming.
3. Add typed backend request and response schemas. Keep persistence models
   separate from API contracts and verify the actual serialized wire shape.
4. When persistence applies, add or update the persistence model and a
   repository or data-access boundary. Add a reviewed migration when the
   database schema, constraints, indexes, or reference data changes.
5. Implement business behavior in a service. Add explicit lifecycle or
   workflow behavior only when the domain needs state transitions.
6. Add the route or endpoint as a thin HTTP boundary that validates input,
   invokes the service, and returns the declared response.
7. When the resource or action is protected, complete the authorization path:
   define the policy; add seed, bootstrap, or migration data when the policy
   store requires it; enforce the decision on the server; scope object, tenant,
   workspace, or ownership access where applicable; and add authorization
   tests.
8. Add a typed frontend API helper whose request and response fields match the
   serialized JSON and generated OpenAPI contract.
9. Add a feature-owned query or mutation hook for server state, orchestration,
   and safe error mapping.
10. For each write, decide whether it changes data held in a backend or
    frontend cache. Invalidate affected entries or update them coherently after
    success. Record `N/A` when neither layer caches the affected data.
11. Add the feature-owned page and source route. Keep the route focused on
    routing concerns such as metadata, guards, loaders, and lazy imports; keep
    page composition and feature behavior in the feature.
12. Cover loading, empty, error, unauthorized, and success states when they can
    occur. Provide safe recovery or next-step behavior.
13. Regenerate derived artifacts, including generated router files and OpenAPI,
    through project-supported commands. Do not hand-edit generated files.
14. Test the behavior at the smallest useful layers and add integration,
    contract, or browser coverage for important cross-layer paths.
15. Run project-supported verification appropriate to the declared work
    context. Record commands, results, selected dependency modes, skipped
    checks, not-applicable layers, remaining real-integration gaps, and risks.

### Dependency Availability

Applicability follows the target product behavior and selected architecture,
not what happens to be available locally. When a required dependency is
unavailable or outside authorized scope, follow
[PAT-025: Dependency Substitution](pat-025-dependency-substitution.md):

- retain the target application-facing boundary and canonical contract;
- select a safe substitute explicitly through configuration or composition;
- preserve important success, failure, authorization, validation, audit, and
  business semantics;
- prevent silent fallback and reject development or test substitutes in
  production; and
- record what the substitute proves and which real-integration behavior remains
  unverified.

Do not mark persistence, migration, authorization, queues, external
integrations, or other target capabilities as not applicable solely because
their real dependencies are unavailable in the current work context.

### Applicability Record

For each slice, record whether these concerns apply:

| Concern | Record |
|---|---|
| Persistence and repository | Files changed, or why persistence is not needed. |
| Database migration | Migration and review evidence, or why no schema/data change exists. |
| Authorization | Policy and enforcement path, or why the behavior is public or authentication-only. |
| Ownership or tenant scope | Enforced boundary, or why no resource scope exists. |
| Write-path cache effects | Affected backend and frontend caches and their invalidation or coherent update behavior, or `N/A` when neither layer caches the affected data. |
| Frontend empty state | State and test, or why an empty result cannot occur. |
| Generated artifacts | Supported regeneration command and diff, or why none exist. |
| External dependencies and substitutions | Target dependency, availability and authorized access, selected mode, contract evidence, and remaining real-integration verification, or why no dependency applies. |

### Expected Files

Adapt these paths to the project's accepted structure:

- Requirement, scenario, implementation plan, or endpoint contract: feature
  behavior and acceptance criteria.
- `backend/app/models/` or `backend/app/schemas/`: typed request and response
  contracts.
- `backend/app/db/`, `backend/app/persistence/`, or
  `backend/app/models/`: persistence model when applicable.
- `backend/app/repositories/`: repository or data-access adapter when
  persistence applies.
- `backend/app/services/`: business behavior and ownership enforcement.
- `backend/app/routers/`: thin endpoint and server-side authorization
  boundary.
- `backend/migrations/versions/`: migration when schema or managed reference
  data changes.
- `frontend/src/fetch/` or `frontend/src/services/`: typed API helper.
- `frontend/src/features/<feature>/hooks/`: query or mutation hooks.
- `frontend/src/features/<feature>/pages/`: page composition and user states.
- `frontend/src/routes/`: thin source route definition.
- `backend/tests/` and frontend test folders: layer and cross-layer tests.
- `openapi/` or the project-approved contract location: regenerated API
  contract when applicable.

## Checks

### Tests

- Requirement scenarios map to meaningful success and failure tests.
- Backend tests cover request validation, service behavior, response
  serialization, and safe errors.
- Repository, model, constraint, and migration behavior is tested when
  persistence changes.
- Authorization tests cover anonymous, denied, wrong-owner or wrong-tenant,
  and allowed paths when those branches apply.
- Frontend tests cover the typed API helper, query or mutation behavior, route
  boundary, and loading, empty, error, unauthorized, and success states when
  applicable.
- Contract tests compare serialized backend JSON and generated OpenAPI with
  frontend field expectations.
- When caching applies, a focused test proves that a read after a successful
  write cannot return the previous cached representation. When an integration
  cache is unavailable, test the affected invalidation or update behavior and
  record the remaining gap.
- Browser or integration tests cover the highest-risk user flow when unit and
  contract tests do not prove it.
- Real and substituted dependencies satisfy the same application-owned
  contract where both implementations can be exercised.
- When a substitute implementation or mode exists, configuration tests prove
  missing real configuration cannot silently select it and production rejects
  development or test substitutes.

### Verification

- Focused frontend, backend, authorization, migration, and contract check
  results as applicable.
- Generated OpenAPI and router artifact diffs from supported commands.
- End-to-end or integration results appropriate to the declared work context
  when available.
- Dependency modes used during verification, behavior covered by substitutes,
  and remaining real-integration gaps.
- Cache applicability and stale-cache prevention evidence, or an `N/A`
  rationale when neither backend nor frontend caches the affected data.
- Verification note listing not-applicable concerns, skipped checks, reasons,
  and remaining risks.

### Stop Conditions

- Required API behavior, serialized field naming, or error semantics are
  unclear.
- Data classification, retention, ownership, tenant boundary, or delete
  behavior is unresolved.
- The role, permission, policy owner, or authorization source of truth is
  unclear.
- The requested outcome specifically requires real credentials, real data,
  shared or production access, or real external-system behavior that is
  unavailable or outside explicit scope and cannot be verified safely with a
  substitute.
- A destructive or high-risk migration needs a separate rollout decision.
- A generated artifact changed but the supported source or regeneration command
  cannot be identified.

## Related Standards And Patterns

- [STD-002: Work Contexts](../../standards/std-002-work-contexts.md)
- [STD-004: Frontend React and TypeScript](../../standards/std-004-frontend-react-typescript.md)
- [STD-008: Backend FastAPI](../../standards/std-008-backend-fastapi.md)
- [STD-009: REST API](../../standards/std-009-api-rest.md)
- [STD-010: API Response and Error Models](../../standards/std-010-api-response-and-error-models.md)
- [STD-012: Testing Basics](../../standards/std-012-testing-basics.md)
- [STD-013: Security and Privacy Basics](../../standards/std-013-security-and-privacy-basics.md)
- [STD-015: Code Quality, Linting, and Formatting](../../standards/std-015-code-quality-linting-and-formatting.md)
- [STD-020: Database Persistence](../../standards/std-020-database-persistence.md)
- [PAT-002: API Query and Mutation](../frontend/pat-002-api-query-and-mutation.md)
- [PAT-004: Protected Route](../frontend/pat-004-protected-route.md)
- [PAT-005: Router, Service, Schema](../backend/pat-005-router-service-schema.md)
- [PAT-006: CRUD Resource](../backend/pat-006-crud-resource.md)
- [PAT-009: OIDC Backend Session](../security/pat-009-oidc-backend-session.md)
- [PAT-010: RBAC Policy Check](../security/pat-010-rbac-policy-check.md)
- [PAT-012: Alembic PostgreSQL Change](../data/pat-012-alembic-postgres-change.md)
- [PAT-020: Status and Feedback](../design/pat-020-status-and-feedback.md)
- [PAT-025: Dependency Substitution](pat-025-dependency-substitution.md)
- [PAT-026: Outbound Service Adapter](../backend/pat-026-outbound-service-adapter.md)

## Related Schema Contracts

- Schema contract: [ARCH-SCHEMA-PAT-024-FULL-STACK-FEATURE-SLICE](../../schemas/patterns/pat-024-full-stack-feature-slice.schema.yaml)
- Used for: helping agents and reviewers check applicability decisions,
  cross-layer completeness, authorization, serialized contracts, user states,
  dependency substitution, write-path cache consistency, tests, and
  context-appropriate verification.
- Notes: The schema contract supports this pattern. It does not replace this
  pattern as the source of truth.
