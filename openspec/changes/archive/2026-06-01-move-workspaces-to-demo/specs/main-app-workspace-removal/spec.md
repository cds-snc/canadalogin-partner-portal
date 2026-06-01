## ADDED Requirements

### Requirement: Main app SHALL remove workspace backend ownership after demo parity
The main backend MUST stop registering and owning the migrated workspace and RP application management feature after the demo backend has equivalent route registration and focused coverage for that feature.

#### Scenario: Main backend removal follows demo readiness
- **WHEN** the demo backend has the migrated workspace feature registered and validated
- **THEN** the main backend removes its workspace feature route ownership and related feature wiring

#### Scenario: Main backend keeps unrelated shared infrastructure
- **WHEN** the main backend removes workspace feature code
- **THEN** it retains shared authentication, database, exception, and authorization infrastructure that is still required by other main-app features

---

### Requirement: Main app SHALL remove workspace frontend ownership after demo parity
The main frontend MUST stop exposing the migrated workspace and RP application management UI flows after the demo frontend has equivalent route registration and focused coverage for that feature.

#### Scenario: Main frontend removal follows demo readiness
- **WHEN** the demo frontend can render and exercise the migrated workspace feature flows
- **THEN** the main frontend removes the workspace feature routes, pages, and fetch wiring it previously owned

#### Scenario: Main frontend preserves unrelated application shell behavior
- **WHEN** the main frontend removes workspace feature code
- **THEN** it leaves unrelated routes, shared UI primitives, and platform shell behavior unchanged

---

### Requirement: Workspace removal SHALL not delete shared dependencies still in use
The migration MUST remove only workspace-owned code from the main app and MUST retain any schemas, helpers, repositories, or infrastructure modules that continue to serve non-workspace features.

#### Scenario: Shared module is still used outside workspace feature
- **WHEN** a module referenced by workspace code is also required by another main-app feature
- **THEN** the migration retains that shared module in the main app instead of deleting it with the workspace slice

#### Scenario: Workspace-exclusive module is no longer needed in main app
- **WHEN** a module is only used by the removed workspace feature
- **THEN** the migration removes it from the main app as part of the feature extraction cleanup

---

### Requirement: Removal SHALL be verified before completion
The change MUST verify that demo owns the migrated feature and that the main app no longer exposes the removed workspace feature surface before the extraction is considered complete.

#### Scenario: Verification confirms demo ownership
- **WHEN** post-migration validation runs
- **THEN** the validation confirms the demo apps provide the migrated workspace and invited-developer feature behavior

#### Scenario: Verification confirms main-app removal
- **WHEN** post-migration validation runs against the main app
- **THEN** the validation confirms the removed workspace feature surface is no longer registered there