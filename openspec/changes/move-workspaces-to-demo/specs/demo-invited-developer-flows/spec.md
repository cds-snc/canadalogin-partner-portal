## ADDED Requirements

### Requirement: Demo backend SHALL preserve invitation acceptance flow
The demo backend MUST expose the RP application developer invitation acceptance behavior currently provided by the main app, including token-based acceptance for invited developers and the resulting access grant behavior required by the moved feature.

#### Scenario: Invited developer accepts invitation in demo
- **WHEN** an authenticated invited developer submits a valid invitation token to the demo backend acceptance endpoint
- **THEN** the demo backend accepts the invitation using the migrated invitation flow behavior

#### Scenario: Invalid or unusable invitation tokens are handled in demo
- **WHEN** an invited developer submits an invalid, expired, or revoked invitation token to the demo backend
- **THEN** the demo backend returns the failure outcome defined by the migrated invitation acceptance contract

---

### Requirement: Demo SHALL preserve current-user RP application access flows
The demo backend and frontend MUST preserve the current-user RP application experience under the `/rp-applications/mine*` contract so invited developers can access and update their assigned RP applications without requiring workspace membership flows.

#### Scenario: Invited developer opens current-user RP application detail
- **WHEN** an invited developer navigates to the demo frontend current-user RP application detail route
- **THEN** the demo frontend loads the migrated current-user RP application experience using the demo backend `/rp-applications/mine*` endpoints

#### Scenario: Current-user RP application flow remains app-scoped
- **WHEN** the demo system evaluates access to a migrated current-user RP application route or endpoint
- **THEN** it treats the invited developer flow as app-scoped rather than as a workspace-member-only flow

---

### Requirement: Demo frontend SHALL preserve invitation entry routes
The demo frontend MUST preserve the invitation entry routes and route behavior needed to launch the invited-developer experience, including the invitation token query parameter handling used by the current flow.

#### Scenario: Invitation link opens migrated demo route
- **WHEN** a user opens an invitation URL for the migrated RP application invitation flow in demo
- **THEN** the demo frontend resolves the invitation route and retains the token information needed by the acceptance flow

#### Scenario: Invitation route continues to target migrated acceptance behavior
- **WHEN** the demo frontend processes an invitation page interaction
- **THEN** it uses the migrated demo acceptance flow rather than any removed main-app implementation

---

### Requirement: Demo invited-developer flows SHALL have focused parity coverage
The demo applications MUST include focused automated tests for invitation acceptance and current-user RP application behavior so regressions in the invited-developer flow are detected before the main app implementation is removed.

#### Scenario: Demo backend tests cover invitation acceptance behavior
- **WHEN** the demo backend test suite runs for the migrated invited-developer feature
- **THEN** it verifies valid and failing invitation acceptance behavior for the demo-owned flow

#### Scenario: Demo frontend tests cover invitation and current-user routes
- **WHEN** the demo frontend test suite runs for the migrated invited-developer feature
- **THEN** it verifies invitation entry and current-user RP application route behavior in demo