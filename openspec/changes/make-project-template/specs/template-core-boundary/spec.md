## ADDED Requirements

### Requirement: Template Core Separation
The main `backend/` and `frontend/` applications MUST define the reusable template core and SHALL retain only cross-cutting platform capabilities, including application bootstrapping, auth and session scaffolding, access-control enforcement, shared platform utilities, and the department list.

#### Scenario: Classify retained core capabilities
- **WHEN** maintainers review a backend or frontend capability during the template conversion
- **THEN** capabilities that provide infrastructure, auth and session scaffolding, access control, shared utilities, or department-list support are kept in the main application surface

#### Scenario: Exclude product-specific workflows from core
- **WHEN** a capability exists only to support the current partner-portal business domain
- **THEN** that capability is not left in the main template core unless another requirement explicitly preserves it

---

### Requirement: Department List Preservation
The template core MUST preserve the department list as a working core dataset, including the backend schema or seed assets, service access, API surface, and frontend consumption paths required for template users to read and use department data without depending on archived demo features.

#### Scenario: Use department data from the core template
- **WHEN** a template user starts the main applications without enabling archived demo workflows
- **THEN** the user can access department-list data through the retained core backend and frontend surfaces

#### Scenario: Review department-related code during migration
- **WHEN** maintainers evaluate code, tests, or docs tied to department data
- **THEN** the department-specific assets needed for a functioning core dataset remain in the main applications rather than moving into `demo/`

---

### Requirement: Core Independence From Archived Demo Features
The template core MUST remain coherent after migration and SHALL NOT require archived demo-only routes, services, tests, or documentation in order to boot, navigate its main surfaces, or exercise retained core capabilities.

#### Scenario: Start the template core after feature relocation
- **WHEN** the main applications are run after partner-portal workflows have been archived into `demo/`
- **THEN** the main applications still boot successfully and expose only the retained core capabilities

#### Scenario: Remove a demo-only dependency from the main path
- **WHEN** a main-app route, service, or test depends on a feature that has been classified as demo-only
- **THEN** maintainers remove or replace that dependency so the main template no longer relies on the archived feature