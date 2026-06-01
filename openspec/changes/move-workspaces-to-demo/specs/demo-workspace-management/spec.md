## ADDED Requirements

### Requirement: Demo backend SHALL host workspace management APIs
The demo backend MUST expose the migrated workspace and RP application management API surface that is currently owned by the main backend, including workspace CRUD, membership management, RP application management, application info management, client credential management, and usage reporting endpoints needed by the moved feature.

#### Scenario: Demo backend registers migrated routes
- **WHEN** the demo backend application starts with the migrated workspaces feature enabled
- **THEN** the demo backend registers the workspace and RP application management routes required by the moved feature

#### Scenario: Demo backend serves migrated application management behavior
- **WHEN** a demo frontend or test client calls a migrated workspace or RP application management endpoint
- **THEN** the demo backend responds using the migrated feature logic and contract expected by that endpoint

---

### Requirement: Demo frontend SHALL host workspace management UI flows
The demo frontend MUST provide the workspace and RP application management user interface that depends on the migrated backend feature, including pages, route wiring, fetch helpers, translations, and user actions required to manage workspaces and RP applications.

#### Scenario: Demo frontend renders migrated workspace routes
- **WHEN** a user navigates to a migrated workspace management route in the demo frontend
- **THEN** the demo frontend renders the corresponding workspace feature page instead of a missing-route or placeholder experience

#### Scenario: Demo frontend issues migrated feature requests
- **WHEN** a user performs a workspace or RP application management action in the demo frontend
- **THEN** the demo frontend calls the migrated demo backend endpoints needed to complete that action

---

### Requirement: Demo workspace management SHALL preserve contract parity during migration
The migrated demo workspace management feature MUST preserve the existing API paths, route semantics, and payload behavior needed by the current workspace management experience unless a later approved change explicitly revises those contracts.

#### Scenario: Existing workspace management consumers target demo endpoints
- **WHEN** the migrated workspace management feature is exercised in demo using the current route and API shapes
- **THEN** the feature behaves compatibly with the moved implementation contract

#### Scenario: Migration introduces no demo-only contract drift by default
- **WHEN** engineers move workspace management code into demo
- **THEN** they keep the existing route names and payload expectations unless a separate approved spec changes them

---

### Requirement: Demo workspace management SHALL have focused verification coverage
The demo applications MUST include focused automated coverage for the migrated workspace management backend and frontend flows so the feature can be removed from the main app only after demo parity is verified.

#### Scenario: Demo backend coverage validates migrated APIs
- **WHEN** the migrated backend feature is tested in demo
- **THEN** the focused tests cover the key workspace and RP application management endpoints now owned by demo

#### Scenario: Demo frontend coverage validates migrated UI flows
- **WHEN** the migrated frontend feature is tested in demo
- **THEN** the focused tests cover the key workspace and RP application management routes and user flows now owned by demo