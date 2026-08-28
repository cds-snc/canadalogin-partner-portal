# Standards

`docs/standards/` contains shared architecture and engineering standards.

Use these standards to align project structure, API design, frontend behavior, backend behavior, testing, security, privacy, logging, deployment, and design-system usage.

Developers should read the standards relevant to the area they are changing. The folder is intentionally split by topic so a project can adopt the pieces that apply.

Implementation recipes live under docs/patterns/. Use them when a standard says what should be true and the work needs a concrete implementation shape.

Design guidance lives under docs/patterns/design/. Use it when a change affects user-facing layout, page structure, accessibility, or design-system alignment.

Architecture decision guidance lives under docs/architecture/. Use it when the work needs a recorded tradeoff, constraint, or decision.

Use [catalog.yml](catalog.yml) as the machine-readable standards routing index. It maps standards to categories, task triggers, and related standards without duplicating the rules.

When a standard needs machine-readable support, use the schema-backed standards
model in
[docs/architecture/schema-backed-standards.md](../architecture/schema-backed-standards.md).
The standard remains the source of truth. A standard schema contract helps
agents and tools record the checks, evidence, exceptions, and review information
expected when the standard applies.

Catalog entries may include `schema_refs` when a related schema contract exists.
Do not add `schema_refs` to every standard by default.

```yaml
schema_refs:
  - id: ARCH-SCHEMA-STD-008-BACKEND-FASTAPI
    path: docs/schemas/standards/std-008-backend-fastapi.schema.yaml
    used_for:
      - checking selected implementation evidence
      - recording standard exceptions or ADR triggers
```

## Standards Index

| ID | Standard | When to use it |
|---|---|---|
| STD-001 | [Document Identifiers](std-001-document-identifiers.md) | Use when creating, renaming, moving, or referencing standards, patterns, reference architectures, ADRs, and templates. |
| STD-002 | [Work Contexts](std-002-work-contexts.md) | Use when a change involves local, shared, or production execution, secrets, data, external systems, dependency availability or substitution, or deployment context. |
| STD-003 | [Full-Stack Application Stack](std-003-full-stack-application-stack.md) | Use when scaffolding, defining, or changing the standard application stack, structure, dependencies, tests, or local setup. |
| STD-004 | [Frontend React and TypeScript](std-004-frontend-react-typescript.md) | Use for React scaffolding, TypeScript, thin source routes, nested route layouts, generated router artifacts, feature ownership, typed API helpers, and frontend tests. |
| STD-005 | [Frontend GC Design System](std-005-frontend-gc-design-system.md) | Use for Government of Canada frontend scaffolding, UI patterns, GC Design System components, forms, links, buttons, navigation, and design-system exceptions. |
| STD-006 | [GC UI Page Layout Rules](std-006-gc-ui-page-layout-rules.md) | Use before frontend scaffolding, user-facing page, service-home, layout, navigation, form, multi-step flow, header, footer, menu, breadcrumb, or language toggle work. |
| STD-007 | [UI Accessibility Basics](std-007-ui-accessibility-basics.md) | Use for labels, headings, keyboard use, focus, contrast, errors, layout, and user-facing accessibility checks. |
| STD-008 | [Backend FastAPI](std-008-backend-fastapi.md) | Use for FastAPI routes, Pydantic models, configuration, OpenAPI output, error handling, service logic, outbound adapters, and backend tests. |
| STD-009 | [REST API](std-009-api-rest.md) | Use for REST resource design, methods, status codes, pagination, versioning, serialized JSON field naming, and API contract changes. |
| STD-010 | [API Response and Error Models](std-010-api-response-and-error-models.md) | Use when defining typed response models, serialized field contracts, list responses, safe error shapes, validation errors, and API examples. |
| STD-011 | [Logging and Observability](std-011-logging-and-observability.md) | Use for logs, correlation IDs, request IDs, masked query values, diagnostic context, and operational diagnostics. |
| STD-012 | [Testing Basics](std-012-testing-basics.md) | Use for frontend tests, backend tests, fast checks, coverage notes, and verification expectations. |
| STD-013 | [Security and Privacy Basics](std-013-security-and-privacy-basics.md) | Use for security, privacy, secrets, sensitive data, access control, and review expectations. |
| STD-014 | [Secrets and Configuration](std-014-secrets-and-configuration.md) | Use for environment variables, deployed secrets, local configuration, and configuration review. |
| STD-015 | [Code Quality, Linting, and Formatting](std-015-code-quality-linting-and-formatting.md) | Use for linting, formatting, type checks, generated file exclusions, and local quality commands. |
| STD-016 | [Container Build and Deployment](std-016-container-build-and-deployment.md) | Use for container images, ignore rules, runtime configuration, image scanning, and deployment readiness notes. |
| STD-017 | [Government of Canada Standards Review](std-017-gc-standards-review.md) | Use when scaffolding or changing a Government of Canada service where GC Design System, accessibility, official languages, security, privacy, identity, or information management may apply. |
| STD-018 | [Frontend CSS and Design-System Boundary](std-018-frontend-css-and-design-system-boundary.md) | Use when frontend CSS, custom UI, layout classes, design-system overrides, modals, cards, badges, or broad global styles change. |
| STD-019 | [Government of Canada Web Application Baseline Governance](std-019-government-of-canada-web-application-baseline.md) | Use when creating, changing, reviewing, or releasing a Government of Canada web application. |
| STD-020 | [Database Persistence](std-020-database-persistence.md) | Use when adding, changing, reviewing, or operating relational persistence, database models, migrations, repositories, seed data, or stored business records. |
