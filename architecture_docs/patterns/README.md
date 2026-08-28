# Patterns

Use these patterns when a standard says what must be true, but the project needs
a concrete implementation or design path.

Patterns sit between standards and project-specific decisions:

- Standards define rules and expectations.
- Patterns describe reusable implementation and design shapes.
- Architecture notes and ADRs record project-specific decisions.

The files in this folder are reusable architecture patterns. Keep them short,
technology-aware, and easy to adapt.

Use [catalog.yml](catalog.yml) as the machine-readable pattern routing index. It maps patterns to problems, fit criteria, related standards, and related patterns without duplicating the full approach.

When a pattern needs machine-readable support, use the schema-backed standards
model in
[docs/architecture/schema-backed-standards.md](../architecture/schema-backed-standards.md).
A pattern schema contract can help agents and reviewers record fit criteria,
adaptation notes, required decisions, and review evidence. Project-local
handoffs, gates, waivers, and process evidence belong in `delorean_template`;
project repos store their local records and generated evidence.

Catalog entries may include `schema_refs` when a related schema contract exists.
Do not add `schema_refs` to every pattern by default.

```yaml
schema_refs:
  - id: ARCH-SCHEMA-PAT-005-ROUTER-SERVICE-SCHEMA
    path: docs/schemas/patterns/pat-005-router-service-schema.schema.yaml
    used_for:
      - checking selected implementation evidence
      - recording pattern exceptions or ADR triggers
```

## How To Use A Pattern

1. Confirm the work context and project constraints.
2. Read the relevant standard first.
3. Pick the closest pattern.
4. Record the pattern choice in an architecture note, ADR, design note, or
   implementation plan when the work is meaningful.
5. Adapt the pattern to the project constraints.
6. Stop before changing production systems, secrets, or shared environments
   unless that work is explicitly in scope.

## Pattern Index

### Full Stack

| ID | Pattern |
|---|---|
| PAT-024 | [Full-stack feature slice](full-stack/pat-024-full-stack-feature-slice.md) |
| PAT-025 | [Dependency substitution](full-stack/pat-025-dependency-substitution.md) |

### Design

| ID | Pattern |
|---|---|
| PAT-001 | [UI page patterns](design/pat-001-ui-page-patterns.md) |
| PAT-016 | [Editable list](design/pat-016-editable-list.md) |
| PAT-017 | [Itemized data display](design/pat-017-itemized-data-display.md) |
| PAT-019 | [Multi-step task flow](design/pat-019-multi-step-task-flow.md) |
| PAT-020 | [Status and feedback](design/pat-020-status-and-feedback.md) |
| PAT-021 | [Dashboard overview page](design/pat-021-dashboard-overview-page.md) |
| PAT-022 | [Page length and splitting](design/pat-022-page-length-and-splitting.md) |
| PAT-023 | [Frontend data table](design/pat-023-frontend-data-table.md) |

### Frontend

| ID | Pattern |
|---|---|
| PAT-002 | [API query and mutation](frontend/pat-002-api-query-and-mutation.md) |
| PAT-003 | [Form page](frontend/pat-003-form-page.md) |
| PAT-004 | [Protected route](frontend/pat-004-protected-route.md) |
| PAT-013 | [GC Design System React app shell](frontend/pat-013-gcds-react-app-shell.md) |
| PAT-014 | [Bilingual route and i18n](frontend/pat-014-bilingual-route-and-i18n.md) |
| PAT-015 | [Storybook UI review fixture](frontend/pat-015-storybook-ui-review-fixture.md) |

### Backend

| ID | Pattern |
|---|---|
| PAT-005 | [Router, service, schema](backend/pat-005-router-service-schema.md) |
| PAT-006 | [CRUD resource](backend/pat-006-crud-resource.md) |
| PAT-007 | [Background job](backend/pat-007-background-job.md) |
| PAT-026 | [Outbound service adapter](backend/pat-026-outbound-service-adapter.md) |

### Security

| ID | Pattern |
|---|---|
| PAT-008 | [Audit log](security/pat-008-audit-log.md) |
| PAT-009 | [OIDC backend session](security/pat-009-oidc-backend-session.md) |
| PAT-010 | [RBAC policy check](security/pat-010-rbac-policy-check.md) |
| PAT-011 | [Secret lifecycle](security/pat-011-secret-lifecycle.md) |
| PAT-018 | [Local role simulation](security/pat-018-local-role-simulation.md) |

### Data

| ID | Pattern |
|---|---|
| PAT-012 | [Alembic PostgreSQL change](data/pat-012-alembic-postgres-change.md) |

## Adding A Pattern

Start from a consistent pattern shape. A good pattern should name:

- problem
- when to use it
- when not to use it
- trade-offs
- approach
- checks

Keep patterns generic. Put project-specific decisions in `docs/architecture/`.

If a project decides not to follow an applicable pattern, record the reason in a
local project ADR. Use the project-local Delorean evidence process for any
delivery waiver tied to a gate or release.
