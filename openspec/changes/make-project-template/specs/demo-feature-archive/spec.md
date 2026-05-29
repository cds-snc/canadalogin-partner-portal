## ADDED Requirements

### Requirement: Archive Partner Portal Business Features By Capability
Partner-portal-specific business workflows MUST be archived under `demo/backend/` and `demo/frontend/` by end-to-end capability, including the related backend routes and services, frontend routes and pages, tests, and supporting documentation for each archived capability.

#### Scenario: Move a classified demo capability
- **WHEN** maintainers classify a workflow as partner-portal-specific rather than reusable template core behavior
- **THEN** the backend, frontend, tests, and docs for that workflow are moved together into the `demo/` surface

#### Scenario: Avoid partial feature splits
- **WHEN** only one technical layer of a demo capability has been relocated
- **THEN** the migration is not considered complete until the other affected layers are archived or explicitly replaced in core

---

### Requirement: Preserve Archived Demo Coherence
The archived demo MUST remain a coherent reference implementation of the current partner-portal business domain and SHALL preserve the relationships among its routes, services, tests, and domain assets after relocation.

#### Scenario: Review archived demo behavior after relocation
- **WHEN** maintainers inspect a business workflow that has been moved into `demo/`
- **THEN** the archived files still describe one consistent reference implementation rather than disconnected leftovers

#### Scenario: Consume shared infrastructure from the demo
- **WHEN** an archived demo feature relies on retained core infrastructure such as auth scaffolding or access-control primitives
- **THEN** the demo feature uses those retained contracts without forcing the core to keep demo-only workflows in its main path

---

### Requirement: Archive Demo-Specific Data And Bootstrap Assets
Database schema assets, seeds, bootstrap scripts, and other initialization artifacts that exist only for archived business workflows MUST be moved with the demo or explicitly documented as demo-owned so template users can distinguish them from required core assets.

#### Scenario: Evaluate a business-specific migration or seed
- **WHEN** maintainers review a migration, seed, or bootstrap asset that exists only for partner-portal workflows being archived
- **THEN** that asset is either relocated to demo ownership or documented as demo-specific rather than remaining implicit core behavior

#### Scenario: Identify required template setup assets
- **WHEN** a new adopter prepares the main template applications
- **THEN** the adopter can distinguish core setup assets from demo-only bootstrap assets without inspecting archived business code