# References

Use this manifest to load standards references without duplicating the standards list in `SKILL.md`.

## Always Load

- [docs/repo-guidance/architecture-docs.md](../../../docs/repo-guidance/architecture-docs.md): architecture catalog and ID lookup rules.
- `architecture_docs/standards/catalog.yml`: standards routing by category, task trigger, and related standards.
- `architecture_docs/patterns/catalog.yml`: pattern routing by problem, fit criteria, related standards, and related patterns.
- `architecture_docs/baselines/catalog.yml`: baseline profile routing by application type and service context.
- `architecture_docs/controls/catalog.yml`: reusable control registry for baseline assessment routing.
- STD-017: Government of Canada Standards Review: broad GC standards impact check.
- STD-006: GC UI Page Layout Rules: approved page pattern and page shell rules.
- TPL-003: Standards Impact Template: standards impact block.
- [docs/templates/evidence-bundle-template.md](../../../docs/templates/evidence-bundle-template.md): evidence summary template.

## Load For Government Of Canada Web Application Baseline Work

- STD-019: Government of Canada Web Application Baseline Governance: baseline applicability, control status, evidence, deferred control, and exception rules.
- BAS-001: Government of Canada Web Application Baseline: active GC web application baseline profile.
- `architecture_docs/baselines/bas-001-government-of-canada-web-application-baseline.controls.yml`: machine-readable active baseline control profile.
- `architecture_docs/architecture/reference/catalog.yml`: reference architecture registry when a reusable architecture posture may apply.
- `architecture_docs/architecture/adrs/catalog.yml`: published ADR registry when reusable decisions exist.
- TPL-011: GC Web Application Baseline Assessment Template: release or meaningful-change assessment record.

## Load For Frontend UI Or Content

- STD-005: Frontend GC Design System: GC Design System frontend standard.
- STD-018: Frontend CSS and Design-System Boundary: GC Design System CSS and custom UI boundary.
- PAT-001: UI Page Patterns: approved starter page patterns.
- PAT-013: GC Design System React App Shell: shared React app shell pattern.
- PAT-014: Bilingual Route and I18n: bilingual route and language-toggle pattern.
- PAT-015: Storybook UI Review Fixture: repeatable UI state review fixture pattern.
- TPL-007: Page Pattern Decision Template: page pattern decision template.
- TPL-008: Design Review Checklist Template: design-system check template.
- STD-004: Frontend React and TypeScript: React and TypeScript starter standard.
- STD-007: UI Accessibility Basics: accessibility starter standard.
- [.github/skills/gc-review-a11y/SKILL.md](../gc-review-a11y/SKILL.md): accessibility review procedure.
- [.github/skills/gc-review-branding/SKILL.md](../gc-review-branding/SKILL.md): GC Design System, Canada.ca layout, and FIP review procedure.
- [.github/skills/select-ui-page-pattern/SKILL.md](../select-ui-page-pattern/SKILL.md): approved page pattern selection procedure.
- [.github/skills/review-gc-design-system-alignment/SKILL.md](../review-gc-design-system-alignment/SKILL.md): page shell and design-system alignment review procedure.
- [.github/skills/gc-review-bilingual/SKILL.md](../gc-review-bilingual/SKILL.md): official-languages and i18n review procedure.
- `frontend/`: frontend source, components, routes, tests, and package configuration.
- [scripts/delorean/run-frontend-standards-checks.sh](../../../scripts/delorean/run-frontend-standards-checks.sh): local GC Design System check adapter.
- [scripts/delorean/run-ui-page-shell-checks.sh](../../../scripts/delorean/run-ui-page-shell-checks.sh): local page shell check adapter.

Also load any matched frontend, design-system, accessibility, security, or
testing `PAT-*` documents selected from `architecture_docs/patterns/catalog.yml`.
Do not maintain an exhaustive pattern list in this manifest.

## Load For APIs, Backend, Security, Privacy, Or Logging

- STD-009: REST API: REST API starter standard.
- STD-010: API Response and Error Models: API response and error model standard.
- STD-008: Backend FastAPI: FastAPI starter standard.
- STD-020: Database Persistence: relational persistence, database model, repository, migration, seed-data, and stored-record standard.
- STD-013: Security and Privacy Basics: security and privacy starter standard.
- STD-014: Secrets and Configuration: secret and environment variable handling.
- STD-011: Logging and Observability: logs, request IDs, and operational context.
- PAT-012: Alembic PostgreSQL Change: PostgreSQL schema change and Alembic migration pattern.
- [.github/skills/gc-review-security/SKILL.md](../gc-review-security/SKILL.md): security and privacy review procedure.
- [.github/skills/gc-review-iam/SKILL.md](../gc-review-iam/SKILL.md): identity and access management review procedure.
- [.github/skills/gc-review-im/SKILL.md](../gc-review-im/SKILL.md): information management and records review procedure.
- `backend/`, `openapi/`, and `tests/`: implementation, contracts, and checks.

## Load For Containers Or Deployment Readiness

- STD-016: Container Build and Deployment: container build and deployment standard.
- [docs/reference/container-local-build-and-run.md](../../../docs/reference/container-local-build-and-run.md): local backend container checks.

## Load For Specs, Evidence, Approval, Or Waivers

- [docs/repo-guidance/openspec-and-delorean.md](../../../docs/repo-guidance/openspec-and-delorean.md): OpenSpec, evidence, approval, and waiver fit.
- `openspec/`: specs and change packages.
- `delorean/evidence/`: reviewed solution evidence.
- [docs/reference/approval-routing-and-reentry.md](../../../docs/reference/approval-routing-and-reentry.md): human decision and re-entry guide.
- [delorean/templates/waiver-template.md](../../../delorean/templates/waiver-template.md): waiver and exception template.

## External Official References

- [GC Design System start guide](https://design-system.canada.ca/en/start-to-use/): current design and code setup guidance.
- [GC Design System components](https://design-system.canada.ca/en/components/): current component catalogue.
- [GC Design System page templates](https://design-system.canada.ca/en/page-templates/): approved template starting points.
- [GC Design System basic page template](https://design-system.canada.ca/en/page-templates/basic/): basic page pattern.
- [GC Design System basic page code](https://design-system.canada.ca/en/page-templates/basic/code/): basic page code.
- [GC Design System React install guide](https://design-system.canada.ca/en/start-to-use/develop/react/): React setup.
- [GC Design System HTML install guide](https://design-system.canada.ca/en/start-to-use/develop/html/): framework-agnostic setup.
- [GCWeb quick implementation guide](https://wet-boew.github.io/GCWeb/docs/implementing-en.html): GCWeb/WET setup.
- [Government of Canada Digital Standards](https://www.canada.ca/en/government/system/digital-government/government-canada-digital-standards.html): user-centred service principles.
- [Guideline on Service and Digital](https://www.canada.ca/en/government/system/digital-government/guideline-service-digital.html): service and digital policy guidance; verify current instruments when compliance matters.
- [Government of Canada Standards on APIs](https://www.canada.ca/en/government/system/digital-government/digital-government-innovations/government-canada-standards-apis.html): API design and security baseline.
- [CAN/ASC - EN 301 549:2024 web requirements](https://accessible.canada.ca/creating-accessibility-standards/canasc-en-301-5492024-accessibility-requirements-ict-products-and-services/9-web): Canadian ICT accessibility web requirements.
