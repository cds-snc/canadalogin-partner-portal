## Why

The repository currently presents a specific CanadaLogin Partner Portal product as its primary identity, which makes reuse harder for teams that want the proven stack and platform patterns without inheriting the full portal business domain. Converting it into a template now creates a clearer starter for future work while preserving the current product behavior as an archived demo, reducing duplication of effort and making the codebase easier to adopt, explain, and extend.

## What Changes

**Repository purpose**
- From: The main backend and frontend represent the full partner-portal product, with infrastructure and business workflows intermixed.
- To: The main backend and frontend become the reusable template core, while partner-portal-specific business logic is archived under `demo/` as a reference implementation.
- Reason: The repo should be reusable without forcing adopters to start from a product-specific codebase.
- Impact: Breaking for maintainers who currently treat the main apps as the portal product; improves clarity for future adopters.

**Core capability boundary**
- From: Infrastructure, access control, department data, and portal business features are all treated as part of the main application surface.
- To: The template core explicitly retains infrastructure services, auth/session scaffolding, access control, shared platform utilities, and the department list, while other portal workflows are moved to demo.
- Reason: The template needs a stable reusable core plus a deliberate example boundary.
- Impact: Non-breaking for reusable platform concerns; feature paths tied to current portal workflows move out of the main app.

**Archived demo organization**
- From: The current `demo/` area exists but does not serve as the primary archive target for the portal business implementation.
- To: `demo/backend/` and `demo/frontend/` become the canonical home for archived business logic, related routes, tests, and supporting documentation.
- Reason: The repo needs an in-place example that preserves current product behavior without defining the template core.
- Impact: Requires coordinated moves across backend, frontend, tests, and docs.

## Capabilities

### New Capabilities
- `template-core-boundary`: Define what backend and frontend infrastructure remains in the main template, including auth/session scaffolding, access control, shared platform utilities, and department data.
- `demo-feature-archive`: Move partner-portal-specific business workflows, routes, services, tests, and docs into `demo/` while preserving them as a coherent reference implementation.
- `template-surface-documentation`: Document how the template core differs from the archived demo, including expected runnable surfaces, setup expectations, and extension guidance.

### Modified Capabilities
- None.

## Impact

- Affected code: Main backend and frontend feature modules, route registration, service boundaries, tests, docs, and migration/bootstrap assets that currently mix reusable infrastructure with portal-specific behavior.
- Affected systems: FastAPI backend, React frontend, OpenSpec change artifacts, and the existing `demo/` sample structure.
- Dependencies: No new external dependencies are planned; the work mainly reclassifies and relocates existing code.
- API impact: Main-app APIs and routes tied to current portal workflows may move out of the template core, while shared auth and access-control infrastructure remains.