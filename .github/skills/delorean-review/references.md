# References

Use this manifest to load review references without duplicating repo guidance in `SKILL.md`.

## Always Load

- [docs/repo-guidance/where-things-go.md](../../../docs/repo-guidance/where-things-go.md): repo routing and local folder purpose.
- [docs/repo-guidance/ownership-and-updates.md](../../../docs/repo-guidance/ownership-and-updates.md): artifact ownership and update rules.
- [docs/repo-guidance/openspec-and-delorean.md](../../../docs/repo-guidance/openspec-and-delorean.md): OpenSpec, evidence, approval, and waiver fit.
- [docs/reference/openspec-lifecycle.md](../../../docs/reference/openspec-lifecycle.md): active change, validation, archive, and no-CI-mutation guidance.
- [docs/repo-guidance/control-boundaries.md](../../../docs/repo-guidance/control-boundaries.md): permission profile, API/MCP, file scope, sensitive-data, and audit guidance.
- STD-002: Work Contexts: local, shared non-production, and production work boundaries.

## Load For Evidence Or Approval Review

- [docs/templates/evidence-bundle-template.md](../../../docs/templates/evidence-bundle-template.md): evidence summary template.
- [docs/reference/approval-routing-and-reentry.md](../../../docs/reference/approval-routing-and-reentry.md): human decision and re-entry guide.
- [delorean/templates/approval-response-template.md](../../../delorean/templates/approval-response-template.md): approval response template.
- [delorean/templates/waiver-template.md](../../../delorean/templates/waiver-template.md): waiver and exception template.
- `delorean/evidence/`: reviewed solution evidence.

## Load For Standards Review

- [.github/skills/gc-standards/SKILL.md](../gc-standards/SKILL.md): standards impact procedure.
- [.github/skills/gc-standards/references.md](../gc-standards/references.md): standards reference manifest.
- [.github/skills/review-gc-design-system-alignment/SKILL.md](../review-gc-design-system-alignment/SKILL.md): page shell and design-system alignment review.
- STD-017: Government of Canada Standards Review: broad GC standards review starter.
- STD-019: Government of Canada Web Application Baseline Governance: baseline applicability, evidence, deferred control, and exception rules.
- BAS-001: Government of Canada Web Application Baseline: active GC web application baseline profile.
- `architecture_docs/baselines/catalog.yml`: baseline routing catalog.
- `architecture_docs/controls/catalog.yml`: reusable control registry.
- STD-006: GC UI Page Layout Rules: approved page pattern and page shell rules.
- TPL-003: Standards Impact Template: standards impact block.
- TPL-011: GC Web Application Baseline Assessment Template: release or meaningful-change assessment record.
- TPL-008: Design Review Checklist Template: design-system check template.

## Load For Artifact Alignment

- `openspec/specs/`: current functional behavior and scenarios.
- `openspec/changes/`: proposed changes and spec deltas.
- `openapi/`: API contracts.
- `tests/`: shared tests and test notes.
- `docs/architecture/` when present: local solution architecture notes and ADRs.
- `docs/design/`: solution design notes.
- TPL-006: ADR Template: durable decision template.
- `architecture_docs/architecture/reference/catalog.yml`: reference architecture registry.
- `architecture_docs/architecture/adrs/catalog.yml`: published ADR registry when available.
- STD-020: Database Persistence: database model, repository, migration, seed-data, and stored-record review.
- PAT-012: Alembic PostgreSQL Change: PostgreSQL schema change and Alembic migration review.

## Load For Local Verification

- [docs/reference/local-verification.md](../../../docs/reference/local-verification.md): local commands, hooks, skips, and checks.
- [scripts/delorean/run-local-verification.sh](../../../scripts/delorean/run-local-verification.sh): full local verification adapter.

## External References

- [Government of Canada Digital Standards](https://www.canada.ca/en/government/system/digital-government/government-canada-digital-standards.html): user-centred service principles.
- [Guideline on Service and Digital](https://www.canada.ca/en/government/system/digital-government/guideline-service-digital.html): service and digital policy guidance; verify current instruments when compliance matters.
