# References

Use this manifest to load testing references without duplicating repo guidance in `SKILL.md`.

## Always Load

- [docs/reference/local-verification.md](../../../docs/reference/local-verification.md): local commands, hooks, skips, and checks.
- [docs/repo-guidance/openspec-and-delorean.md](../../../docs/repo-guidance/openspec-and-delorean.md): OpenSpec, evidence, approval, and waiver fit.
- [docs/reference/openspec-lifecycle.md](../../../docs/reference/openspec-lifecycle.md): active change, validation, archive, and no-CI-mutation guidance.
- [docs/repo-guidance/control-boundaries.md](../../../docs/repo-guidance/control-boundaries.md): permission profile, API/MCP, file scope, sensitive-data, and audit guidance.
- STD-002: Work Contexts: local, shared non-production, and production work boundaries.
- STD-012: Testing Basics: starter testing and evidence expectations.

## Load For Test Discovery

- `tests/`: shared tests and test notes.
- `frontend/`: frontend source and colocated tests when frontend behavior changes.
- `backend/tests/`: backend tests when backend behavior changes.
- [frontend/README.md](../../../frontend/README.md): frontend commands.
- [backend/README.md](../../../backend/README.md): backend commands.

## Load For Requirements And Contract Coverage

- `openspec/specs/`: current functional behavior and scenarios.
- `openspec/changes/`: proposed changes and spec deltas.
- [docs/templates/openspec-template.md](../../../docs/templates/openspec-template.md): helper for OpenSpec `spec.md` content.
- `openapi/`: API contracts.

## Load For Data Or Persistence Verification

- STD-020: Database Persistence: database model, repository, migration, seed-data, and stored-record checks.
- PAT-012: Alembic PostgreSQL Change: PostgreSQL migration verification pattern.
- `backend/`: database, repository, service, migration, and seed implementation paths when present.
- `backend/tests/`: model, repository, service, API, and migration-adjacent tests.
- `openapi/`: API contract updates when persisted models affect API behavior.

## Load For UI, Accessibility, Or GC Design System Verification

- [.github/skills/gc-standards/SKILL.md](../gc-standards/SKILL.md): standards impact procedure.
- [.github/skills/gc-standards/references.md](../gc-standards/references.md): standards reference manifest.
- STD-005: Frontend GC Design System: GC Design System frontend standard.
- STD-006: GC UI Page Layout Rules: page shell and approved page pattern rules.
- STD-007: UI Accessibility Basics: accessibility starter standard.
- [.github/skills/review-gc-design-system-alignment/SKILL.md](../review-gc-design-system-alignment/SKILL.md): page shell and design-system review procedure.
- [scripts/delorean/run-ui-page-shell-checks.sh](../../../scripts/delorean/run-ui-page-shell-checks.sh): local page shell check adapter.
- [scripts/delorean/run-frontend-standards-checks.sh](../../../scripts/delorean/run-frontend-standards-checks.sh): local GC Design System check adapter.

## Load For Evidence

- [docs/templates/evidence-bundle-template.md](../../../docs/templates/evidence-bundle-template.md): evidence summary template.
- `delorean/evidence/`: reviewed solution evidence.
- [docs/reference/approval-routing-and-reentry.md](../../../docs/reference/approval-routing-and-reentry.md): human decision and re-entry guide.

## Load For GC Web Application Baseline Verification

- STD-019: Government of Canada Web Application Baseline Governance: baseline gate and evidence expectations.
- BAS-001: Government of Canada Web Application Baseline: active baseline profile.
- `architecture_docs/baselines/catalog.yml`: baseline routing catalog.
- `architecture_docs/baselines/bas-001-government-of-canada-web-application-baseline.controls.yml`: active baseline control profile.
- `architecture_docs/controls/catalog.yml`: reusable control registry.
- TPL-011: GC Web Application Baseline Assessment Template: assessment record shape.

## External References

- [GC Design System components](https://design-system.canada.ca/en/components/): current component catalogue.
- [CAN/ASC - EN 301 549:2024 web requirements](https://accessible.canada.ca/creating-accessibility-standards/canasc-en-301-5492024-accessibility-requirements-ict-products-and-services/9-web): Canadian ICT accessibility web requirements.
