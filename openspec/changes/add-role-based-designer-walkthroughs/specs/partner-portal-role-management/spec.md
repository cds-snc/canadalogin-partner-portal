# Delta for partner portal role management

## MODIFIED Requirements

### Requirement: Local development provides deterministic canonical-role personas

When explicitly enabled in a local developer context, the portal SHALL provide
backend-owned fake personas for CL Admin, RP Admin, RP User (Edit), Read Only,
and no access. The personas SHALL use the same backend session shape,
authorization resolver, workspace checks, and protected routes as the selected
real identity path.

The local persona endpoint and selector SHALL accept only allowlisted fixture
identifiers and SHALL be unavailable whenever environment, authentication mode,
and explicit selector configuration do not all indicate local development.
The enabling values SHALL be ENVIRONMENT=local, AUTH_MODE=local_dev, and
ENABLE_DEV_ROLE_SELECTOR=true. A separate guarded seed SHALL use stable UUIDv5
identifiers and reserved `local.example` identities, SHALL be idempotent, and
SHALL fail non-zero on partial creation.

The guarded seed SHALL also provide representative synthetic product states for
role-path and designer-walkthrough verification, including bilingual contacts,
invitation lifecycle examples, draft and completed RP configurations,
Production-review examples, and fixed-date usage-report rows. These records
SHALL remain inside the recorded fixture namespace, SHALL NOT require an
external provider, and SHALL NOT contain real personal information, plaintext
invitation URLs or tokens, credentials, secrets, or production identifiers.
Explicit cleanup SHALL remove only the recorded database and cache fixtures in
a dependency-safe order.

#### Scenario: Developer selects each canonical persona

- **WHEN** local role simulation is explicitly enabled and a developer selects an allowlisted persona
- **THEN** the backend creates the matching fake session with the canonical role and workspace scope
- **AND** the shared shell visibly identifies the session as simulated

#### Scenario: Local personas prove allowed and denied paths

- **WHEN** the developer exercises partner workspace Alpha and an unrelated workspace Beta with the canonical personas
- **THEN** each persona receives only its permission-matrix actions in Alpha
- **AND** cross-scope, secret, mutation, invitation, oversight, and no-role failures remain enforced by the backend

#### Scenario: Arbitrary client role is ignored

- **WHEN** a client submits an unknown fixture identifier or an arbitrary role value
- **THEN** the backend rejects the request
- **AND** no session or authorization assignment is created from client-controlled role data

#### Scenario: Persona selector is unavailable outside local development

- **WHEN** the application runs in a shared, test-deployment, staging, or production configuration
- **THEN** the local persona route, endpoint, and fixtures are unavailable
- **AND** inconsistent configuration fails closed instead of enabling a development identity substitute

#### Scenario: Local persona seed is deterministic and isolated

- **WHEN** the guarded local persona seed runs twice under the required local configuration
- **THEN** it produces the same allowlisted fake identities and scopes without duplicates
- **AND** the same command fails before mutation in every non-local configuration

#### Scenario: Local personas include representative walkthrough data

- **WHEN** the guarded local persona seed completes with local PostgreSQL and Redis available
- **THEN** the Alpha workspace contains stable synthetic records for the main partner task and reporting surfaces
- **AND** CL Admin oversight can show representative pending and terminal Production-review states without widening any partner workspace scope
- **AND** rerunning the seed validates the same namespaced database records and validates or repairs the cache records without creating duplicates

#### Scenario: Local persona cleanup preserves unrelated developer data

- **WHEN** a developer explicitly confirms local persona cleanup
- **THEN** the cleanup removes the recorded fixture cache fields and database rows in dependency-safe order
- **AND** unrelated local users, workspaces, applications, cache keys, and developer data remain unchanged

## ADDED Requirements

### Requirement: Local development provides repeatable role walkthrough capture

The repository SHALL provide a repeatable local browser-capture workflow for CL
Admin, RP Admin, RP User (Edit), Read Only, and no-access journeys. Each journey
SHALL use an isolated session, select an allowlisted persona through the visible
local selector, follow a deterministic list of meaningful role-reachable task
pages, and produce a disposable local video artifact.

The default capture SHALL use an English desktop viewport, reduced motion,
readable scrolling, and a deliberate pause after each settled page. The
workflow SHALL avoid destructive submissions, external support actions, live
provider calls, and the display of credentials, secrets, invitation tokens, or
real personal information.

#### Scenario: Developer records role-based designer walkthroughs

- **WHEN** the full local persona stack and representative fixture namespace are available and the developer runs the walkthrough capture
- **THEN** the workflow produces one video for each canonical role and a short no-access journey in a stable order
- **AND** the tracked recording index identifies the covered pages, excluded integrations, capture settings, and expected output names
- **AND** the videos leave enough settled time for a reviewer to inspect each page before the next interaction

#### Scenario: Walkthrough capture preserves the normal developer data profile

- **WHEN** a developer prepares and starts the local walkthrough stack
- **THEN** the workflow uses a dedicated local PostgreSQL database and separate Redis logical databases for the representative fixtures
- **AND** every persistence client is pinned to the intended loopback host, port, credential, TLS, and database profile instead of inheriting shared endpoints from developer configuration
- **AND** it does not reset, delete, or reinterpret records in the normal developer persistence profile
