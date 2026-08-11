# References

Use this manifest to load implementation references without duplicating repo guidance in `SKILL.md`.

## Always Load

- [docs/repo-guidance/where-things-go.md](../../../docs/repo-guidance/where-things-go.md): repo routing and local folder purpose.
- [docs/repo-guidance/ownership-and-updates.md](../../../docs/repo-guidance/ownership-and-updates.md): artifact ownership and update rules.
- [docs/repo-guidance/architecture-docs.md](../../../docs/repo-guidance/architecture-docs.md): architecture document ID lookup rules.
- `architecture_docs/standards/catalog.yml`: standards routing by category, task trigger, and related standards.
- `architecture_docs/patterns/catalog.yml`: pattern routing by problem, fit criteria, related standards, and related patterns.
- `architecture_docs/baselines/catalog.yml`: baseline profile routing by application type and service context.
- `architecture_docs/controls/catalog.yml`: reusable control registry for baseline assessment routing.
- [docs/reference/local-verification.md](../../../docs/reference/local-verification.md): local commands, hooks, skips, and checks.
- [docs/reference/openspec-lifecycle.md](../../../docs/reference/openspec-lifecycle.md): active change, validation, archive, and no-CI-mutation guidance.
- [docs/repo-guidance/control-boundaries.md](../../../docs/repo-guidance/control-boundaries.md): permission profile, API/MCP, file scope, sensitive-data, and audit guidance.
- STD-002: Work Contexts: local, shared non-production, and production work boundaries.

## Load For Frontend Work

- STD-004: Frontend React and TypeScript: React and TypeScript starter standard.
- STD-005: Frontend GC Design System: GC Design System frontend standard.
- STD-006: GC UI Page Layout Rules: approved page pattern and page shell rules.
- STD-018: Frontend CSS and Design-System Boundary: GC Design System CSS and custom UI boundary.
- STD-007: UI Accessibility Basics: accessibility starter standard.
- Load matched frontend, design-system, accessibility, API, security, and testing `PAT-*` documents from `architecture_docs/patterns/catalog.yml`.
- [frontend/README.md](../../../frontend/README.md): frontend starter commands.
- [frontend/DEV_SETUP.md](../../../frontend/DEV_SETUP.md): frontend local setup details.

## Load For Backend Or API Work

- STD-008: Backend FastAPI: FastAPI starter standard.
- STD-009: REST API: REST API starter standard.
- STD-010: API Response and Error Models: API response and error model standard.
- STD-020: Database Persistence: relational persistence, model, repository, migration, seed-data, and stored-record standard.
- Load matched backend, API, security, data, operations, and testing `PAT-*` documents from `architecture_docs/patterns/catalog.yml`.
- [backend/README.md](../../../backend/README.md): backend starter commands.
- [openapi/README.md](../../../openapi/README.md): API contract folder purpose.

## Load For Containers Or Runtime Configuration

- STD-016: Container Build and Deployment: container build and deployment standard.
- [docs/reference/container-local-build-and-run.md](../../../docs/reference/container-local-build-and-run.md): local backend container checks.
- STD-014: Secrets and Configuration: secret and environment variable handling.
- STD-011: Logging and Observability: logs, request IDs, and operational context.

## Load For Specs, Tests, Or Evidence

- [docs/repo-guidance/openspec-and-delorean.md](../../../docs/repo-guidance/openspec-and-delorean.md): OpenSpec, evidence, approval, and waiver fit.
- [docs/templates/work-context-and-assumptions-template.md](../../../docs/templates/work-context-and-assumptions-template.md): reusable work-context and assumption block.
- `openspec/specs/`: current functional behavior and scenarios.
- `openspec/changes/`: proposed changes and spec deltas.
- `tests/`: shared tests and test notes.
- [docs/templates/evidence-bundle-template.md](../../../docs/templates/evidence-bundle-template.md): evidence summary template.
- `delorean/evidence/`: reviewed solution evidence.
- STD-019: Government of Canada Web Application Baseline Governance: baseline applicability, control status, evidence, deferred control, and exception rules.
- BAS-001: Government of Canada Web Application Baseline: active GC web application baseline profile.
- `architecture_docs/baselines/bas-001-government-of-canada-web-application-baseline.controls.yml`: active baseline control profile.
- TPL-011: GC Web Application Baseline Assessment Template: release or meaningful-change assessment record.

## Load When Standards May Apply

- [.github/skills/gc-standards/SKILL.md](../gc-standards/SKILL.md): standards impact procedure.
- [.github/skills/gc-standards/references.md](../gc-standards/references.md): standards reference manifest.
- [.github/skills/select-ui-page-pattern/SKILL.md](../select-ui-page-pattern/SKILL.md): page pattern decision procedure.
- [.github/skills/review-gc-design-system-alignment/SKILL.md](../review-gc-design-system-alignment/SKILL.md): page shell and design-system review procedure.

## External References

- [GC Design System start guide](https://design-system.canada.ca/en/start-to-use/): current install and usage guidance.
- [GC Design System components](https://design-system.canada.ca/en/components/): current component catalogue.
- [Government of Canada Standards on APIs](https://www.canada.ca/en/government/system/digital-government/digital-government-innovations/government-canada-standards-apis.html): API design and security baseline.
