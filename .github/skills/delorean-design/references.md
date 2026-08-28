# References for delorean-design

Always load:

- `docs/templates/design-package-template.md`
- `TPL-006: ADR Template`
- `TPL-010: Reference Architecture Template`
- `TPL-011: GC Web Application Baseline Assessment Template`
- `docs/repo-guidance/architecture-docs.md`
- `architecture_docs/standards/catalog.yml`
- `architecture_docs/patterns/catalog.yml`
- `architecture_docs/baselines/catalog.yml`
- `architecture_docs/controls/catalog.yml`
- `architecture_docs/architecture/reference/catalog.yml`
- `architecture_docs/architecture/adrs/catalog.yml`
- `docs/repo-guidance/where-things-go.md`
- `docs/repo-guidance/openspec-and-delorean.md`
- `docs/reference/openspec-lifecycle.md`

Load when active change-state exists:

- `delorean/evidence/<change-id>/change-state.yaml`
- `delorean/gates/gate-catalog.yaml`

Load when UI is affected:

- Matched UI `PAT-*` documents from `architecture_docs/patterns/catalog.yml`
- `PAT-001: UI Page Patterns`
- `TPL-007: Page Pattern Decision Template`
- `STD-005: Frontend GC Design System`
- `STD-006: GC UI Page Layout Rules`
- `STD-018: Frontend CSS and Design-System Boundary`

Load when GC web application baseline may apply:

- `STD-019: Government of Canada Web Application Baseline Governance`
- `BAS-001: Government of Canada Web Application Baseline`
- `architecture_docs/baselines/bas-001-government-of-canada-web-application-baseline.controls.yml`

Load when API is affected:

- `STD-009: REST API`
- `STD-010: API Response and Error Models`
- `openapi/`

Load when data is affected:

- `STD-020: Database Persistence`
- `PAT-012: Alembic PostgreSQL Change`
- `STD-008: Backend FastAPI`
- `STD-013: Security and Privacy Basics`

Load when evidence is affected:

- `docs/templates/evidence-bundle-template.md`
