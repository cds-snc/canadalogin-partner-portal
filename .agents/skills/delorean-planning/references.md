# References

Use this manifest to load planning references without duplicating repo guidance in `SKILL.md`.

## Always Load

- [docs/repo-guidance/where-things-go.md](../../../docs/repo-guidance/where-things-go.md): repo routing and local folder purpose.
- [docs/repo-guidance/ownership-and-updates.md](../../../docs/repo-guidance/ownership-and-updates.md): artifact ownership and update rules.
- [docs/repo-guidance/architecture-docs.md](../../../docs/repo-guidance/architecture-docs.md): architecture document ID lookup rules.
- `architecture_docs/standards/catalog.yml`: standards routing by category, task trigger, and related standards.
- `architecture_docs/patterns/catalog.yml`: pattern routing by problem, fit criteria, related standards, and related patterns.
- `architecture_docs/baselines/catalog.yml`: baseline profile routing by application type and service context.
- `architecture_docs/controls/catalog.yml`: reusable control registry for baseline assessment routing.
- [docs/repo-guidance/openspec-and-delorean.md](../../../docs/repo-guidance/openspec-and-delorean.md): OpenSpec, evidence, approval, and waiver fit.
- [docs/reference/openspec-lifecycle.md](../../../docs/reference/openspec-lifecycle.md): active change, validation, archive, and no-CI-mutation guidance.
- [docs/repo-guidance/control-boundaries.md](../../../docs/repo-guidance/control-boundaries.md): permission profile, API/MCP, file scope, sensitive-data, and audit guidance.
- STD-002: Work Contexts: local, shared non-production, and production work boundaries.
- [docs/templates/work-context-and-assumptions-template.md](../../../docs/templates/work-context-and-assumptions-template.md): reusable work-context and assumption block.

## Load For Specs Or Change Planning

- [docs/templates/openspec-template.md](../../../docs/templates/openspec-template.md): helper for OpenSpec `spec.md` content.
- [docs/templates/openspec-change-package-template.md](../../../docs/templates/openspec-change-package-template.md): full local-first OpenSpec change package starter.
- [openspec/README.md](../../../openspec/README.md): OpenSpec folder purpose.
- `openspec/specs/`: current functional behavior and scenarios.
- `openspec/changes/`: proposed changes, proposal, design, tasks, and spec deltas.

## Load For Design Or Architecture Impact

- [docs/templates/design-package-template.md](../../../docs/templates/design-package-template.md): design package structure.
- Matched `PAT-*` IDs from `architecture_docs/patterns/catalog.yml`: implementation recipe index for common architecture and build shapes.
- TPL-007: Page Pattern Decision Template: UI page pattern decision template.
- TPL-008: Design Review Checklist Template: design-system check template.
- TPL-006: ADR Template: durable decision template.
- TPL-010: Reference Architecture Template: reusable reference architecture template.
- `architecture_docs/architecture/reference/catalog.yml`: reference architecture registry.
- `architecture_docs/architecture/adrs/catalog.yml`: published ADR registry when available.
- `docs/architecture/` when present: local solution architecture notes and ADRs.
- `docs/design/`: solution design notes.

## Load For Data Or Persistence Planning

- STD-020: Database Persistence: relational persistence, model, repository, migration, seed-data, and stored-record standard.
- PAT-012: Alembic PostgreSQL Change: PostgreSQL schema change and Alembic migration pattern.
- STD-008: Backend FastAPI: backend service, dependency, and persistence boundary context.
- STD-013: Security and Privacy Basics: data handling, privacy, and security review expectations.
- `backend/`, `openapi/`, and `tests/`: implementation, contracts, and verification paths for database-backed behavior.

## Load When Standards May Apply

- [.github/skills/gc-standards/SKILL.md](../gc-standards/SKILL.md): standards impact procedure.
- [.github/skills/gc-standards/references.md](../gc-standards/references.md): standards reference manifest.
- [.github/skills/select-ui-page-pattern/SKILL.md](../select-ui-page-pattern/SKILL.md): approved page pattern selection procedure.
- TPL-003: Standards Impact Template: standards impact block.
- STD-019: Government of Canada Web Application Baseline Governance: baseline applicability, evidence, deferred control, and exception rules.
- BAS-001: Government of Canada Web Application Baseline: active GC web application baseline profile.
- TPL-011: GC Web Application Baseline Assessment Template: assessment record for releases and meaningful service changes.

## Load For Evidence, Approval, Or Re-Entry

- [docs/templates/evidence-bundle-template.md](../../../docs/templates/evidence-bundle-template.md): evidence summary template.
- [docs/reference/approval-routing-and-reentry.md](../../../docs/reference/approval-routing-and-reentry.md): human decision and re-entry guide.
- [delorean/templates/approval-response-template.md](../../../delorean/templates/approval-response-template.md): approval response template.
- [delorean/templates/waiver-template.md](../../../delorean/templates/waiver-template.md): waiver and exception template.

## Load For Repo Setup Planning

- [docs/templates/repo-checklist.md](../../../docs/templates/repo-checklist.md): setup checklist template.
- [GETTING_STARTED.md](../../../GETTING_STARTED.md): solution repo setup path.

## External References

- [Government of Canada Digital Standards](https://www.canada.ca/en/government/system/digital-government/government-canada-digital-standards.html): user-centred service principles.
- [Guideline on Service and Digital](https://www.canada.ca/en/government/system/digital-government/guideline-service-digital.html): service and digital policy guidance; verify current instruments when compliance matters.
