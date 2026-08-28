# Schema Selection Examples

These examples show how an agent can search and select shared architecture
guidance. They are starting points. The agent still needs to inspect the actual
task, read the selected human-readable guidance, and record meaningful
decisions in the project repo.

## Example 1: New User-Facing Form Page

Task summary: Add a React page that collects user input, validates required
fields, submits to an API, and shows success or validation errors.

Likely selected standards:

- STD-004 Frontend React and TypeScript
- STD-005 Frontend GC Design System
- STD-006 GC UI Page Layout Rules
- STD-007 UI Accessibility Basics
- STD-010 API Response and Error Models
- STD-012 Testing Basics
- STD-013 Security and Privacy Basics, if personal information or sensitive
  data is involved

Likely selected patterns:

- PAT-001 UI Page Patterns
- PAT-002 API Query and Mutation
- PAT-003 Form Page
- PAT-020 Status and Feedback

Likely selected schema contracts:

- ARCH-SCHEMA-STD-004-FRONTEND-REACT-TYPESCRIPT
- ARCH-SCHEMA-STD-007-UI-ACCESSIBILITY-BASICS
- ARCH-SCHEMA-STD-010-API-RESPONSE-ERROR-MODELS
- ARCH-SCHEMA-PAT-001-UI-PAGE-PATTERNS
- ARCH-SCHEMA-PAT-002-API-QUERY-MUTATION
- ARCH-SCHEMA-PAT-003-FORM-PAGE
- ARCH-SCHEMA-PAT-020-STATUS-FEEDBACK

Local ADR needed: No, unless the project varies from the form, page pattern,
accessibility, API, or design-system guidance.

Local waiver needed: No, unless a delivery gate requires an exception for
missing tests, screenshots, accessibility evidence, or other required evidence.

## Example 2: New FastAPI CRUD Endpoint With Database Persistence

Task summary: Add a FastAPI endpoint group for a persisted resource, including
create, read, update, delete, list, SQLAlchemy model, Alembic migration, and
tests.

Likely selected standards:

- STD-008 Backend FastAPI
- STD-009 REST API
- STD-010 API Response and Error Models
- STD-012 Testing Basics
- STD-013 Security and Privacy Basics
- STD-020 Database Persistence

Likely selected patterns:

- PAT-005 Router, Service, Schema
- PAT-006 CRUD Resource
- PAT-012 Alembic PostgreSQL Change

Likely selected schema contracts:

- ARCH-SCHEMA-STD-008-BACKEND-FASTAPI
- ARCH-SCHEMA-STD-009-API-REST
- ARCH-SCHEMA-STD-010-API-RESPONSE-ERROR-MODELS
- ARCH-SCHEMA-STD-012-TESTING-BASICS
- ARCH-SCHEMA-STD-013-SECURITY-PRIVACY-BASICS
- ARCH-SCHEMA-STD-020-DATABASE-PERSISTENCE
- ARCH-SCHEMA-PAT-005-ROUTER-SERVICE-SCHEMA
- ARCH-SCHEMA-PAT-006-CRUD-RESOURCE
- ARCH-SCHEMA-PAT-012-ALEMBIC-POSTGRES-CHANGE

Local ADR needed: Yes, if data ownership, retention, delete behavior, internal
ID exposure, tenant ownership, migration rollback, or another material data
decision is not already settled.

Local waiver needed: No, unless a delivery gate requires an exception for
missing migration review, API contract evidence, tests, or security/privacy
evidence.

Required decisions: whether writes affect any backend or frontend cache and,
if so, how stale reads are prevented; and whether each new revision identifier
fits the configured `alembic_version.version_num` capacity and resolves through
the migration graph without truncation.

## Example 3: Secret Or Configuration Change For Shared Non-Production

Task summary: Add a shared non-production backend environment variable and
runtime secret reference, update `.env.example`, and adjust deployment notes.

Likely selected standards:

- STD-002 Work Contexts
- STD-013 Security and Privacy Basics
- STD-014 Secrets and Configuration
- STD-016 Container Build and Deployment, if the value is used by a container
  or deployment path

Likely selected patterns:

- PAT-011 Secret Lifecycle, when secret ownership, runtime source, rotation, or
  incident response is in scope
- PAT-025 Dependency Substitution, when the selected secret service is
  unavailable and a safe fake-value adapter is needed

Likely selected schema contracts:

- ARCH-SCHEMA-STD-002-WORK-CONTEXTS
- ARCH-SCHEMA-STD-013-SECURITY-PRIVACY-BASICS
- ARCH-SCHEMA-STD-014-SECRETS-CONFIGURATION
- ARCH-SCHEMA-STD-016-CONTAINER-BUILD-DEPLOYMENT
- ARCH-SCHEMA-PAT-025-DEPENDENCY-SUBSTITUTION

Local ADR needed: No, unless the project uses a different secret management
pattern, production data in local or test contexts, or a non-standard runtime
secret source.

Local waiver needed: No, unless a delivery gate requires an exception for
missing secret handling evidence, rotation evidence, or deployment evidence.

## Example 4: Project Does Not Follow A Recommended Pattern

Task summary: A project decides not to use PAT-003 Form Page for a user-facing
input page because the interaction is part of an approved custom workflow.

Likely selected standards:

- STD-001 Document Identifiers, for stable references
- STD-017 Government of Canada Standards Review, if the decision affects a GC
  service review
- Any standards that led to the selected pattern, such as STD-004, STD-005,
  STD-006, STD-007, STD-012, or STD-013

Likely selected patterns:

- The recommended pattern that is not being followed, such as PAT-003
- The replacement pattern or approved approach, if one exists

Likely selected schema contracts:

- ARCH-SCHEMA-DECISION-STANDARD-NON-ADOPTION-ADR
- The schema contract for the recommended pattern, if available
- The schema contract for the replacement pattern, if available

Local ADR needed: Yes. Record the pattern, decision type, reason, risk or
trade-off, mitigation, owner, review trigger, related schema contract, and any
related evidence.

Local waiver needed: Maybe. A waiver is only needed when a project-local
delivery gate requires an exception for a specific check, release, time period,
or accepted risk.

## Example 5: Protected Full-Stack Feature Slice

Task summary: Add a protected React feature that reads and updates a persisted
resource through a REST API, including a migration, ownership checks, loading
and failure states, and contract tests.

Likely selected standards:

- STD-002 Work Contexts
- STD-004 Frontend React and TypeScript
- STD-008 Backend FastAPI
- STD-009 REST API
- STD-010 API Response and Error Models
- STD-012 Testing Basics
- STD-013 Security and Privacy Basics
- STD-020 Database Persistence

Likely selected patterns:

- PAT-002 API Query and Mutation
- PAT-004 Protected Route
- PAT-005 Router, Service, Schema
- PAT-006 CRUD Resource, when the behavior is resource-oriented
- PAT-009 OIDC Backend Session, when a backend cookie session applies
- PAT-010 RBAC Policy Check
- PAT-012 Alembic PostgreSQL Change
- PAT-020 Status and Feedback
- PAT-024 Full-Stack Feature Slice
- PAT-025 Dependency Substitution, when a selected dependency is unavailable or
  outside authorized scope

Likely selected schema contracts:

- ARCH-SCHEMA-STD-004-FRONTEND-REACT-TYPESCRIPT
- ARCH-SCHEMA-STD-009-API-REST
- ARCH-SCHEMA-STD-010-API-RESPONSE-ERROR-MODELS
- ARCH-SCHEMA-STD-012-TESTING-BASICS
- ARCH-SCHEMA-STD-013-SECURITY-PRIVACY-BASICS
- ARCH-SCHEMA-STD-020-DATABASE-PERSISTENCE
- ARCH-SCHEMA-PAT-002-API-QUERY-MUTATION
- ARCH-SCHEMA-PAT-004-PROTECTED-ROUTE
- ARCH-SCHEMA-PAT-005-ROUTER-SERVICE-SCHEMA
- ARCH-SCHEMA-PAT-006-CRUD-RESOURCE
- ARCH-SCHEMA-PAT-009-OIDC-BACKEND-SESSION, when a backend cookie session
  applies
- ARCH-SCHEMA-PAT-010-RBAC-POLICY-CHECK
- ARCH-SCHEMA-PAT-012-ALEMBIC-POSTGRES-CHANGE
- ARCH-SCHEMA-PAT-020-STATUS-FEEDBACK
- ARCH-SCHEMA-PAT-024-FULL-STACK-FEATURE-SLICE
- ARCH-SCHEMA-PAT-025-DEPENDENCY-SUBSTITUTION

Required decisions: serialized JSON field naming, whether persistence and a
migration apply, policy definition and initialization, owner or tenant scope,
protected-route freshness, local cookie hostname and origin behavior when
applicable, cache invalidation or coherent updates after writes, applicable UI
states, generated artifacts, target dependency modes and remaining
real-integration gaps, and verification appropriate to the declared work
context.

Local ADR needed: Yes when the feature introduces a new material ownership,
authorization, persistence, or breaking API decision, or varies from the
selected patterns.

Local waiver needed: No by default. A project-local waiver may be needed only
when a delivery gate permits a specific deferred test or evidence item; it must
not hide unresolved authorization, ownership, or API contract boundaries.

## Example 6: External Service Unavailable During Local Development

Task summary: Implement a notification integration while the real provider and
credentials are unavailable locally. Use a safe simulator for development and
tests without changing the target notification contract.

Likely selected standards:

- STD-002 Work Contexts
- STD-008 Backend FastAPI, when the integration is backend-owned
- STD-012 Testing Basics
- STD-013 Security and Privacy Basics
- STD-014 Secrets and Configuration

Likely selected patterns:

- PAT-026 Outbound Service Adapter
- PAT-025 Dependency Substitution
- PAT-007 Background Job, when delivery is asynchronous
- PAT-024 Full-Stack Feature Slice, when user-facing behavior crosses layers

Likely selected schema contracts:

- ARCH-SCHEMA-STD-002-WORK-CONTEXTS
- ARCH-SCHEMA-STD-008-BACKEND-FASTAPI, when applicable
- ARCH-SCHEMA-STD-012-TESTING-BASICS
- ARCH-SCHEMA-STD-013-SECURITY-PRIVACY-BASICS
- ARCH-SCHEMA-STD-014-SECRETS-CONFIGURATION
- ARCH-SCHEMA-PAT-024-FULL-STACK-FEATURE-SLICE, when applicable
- ARCH-SCHEMA-PAT-025-DEPENDENCY-SUBSTITUTION
- ARCH-SCHEMA-PAT-026-OUTBOUND-SERVICE-ADAPTER

Required decisions: target provider contract, provider availability and
authorized access, injected adapter boundary, explicit simulator
configuration, bounded timeouts, retry or no-retry behavior, canonical success
and safe failure behavior, reviewed allowlisted upstream error fields,
production rejection of simulator mode, and the context needed for
real-provider verification.

Local ADR needed: No merely because a simulator is used locally behind the
selected contract. Record an ADR when the project materially varies the
contract, weakens a required invariant, intentionally permits a production
alternate or degraded mode, or durably omits required real-provider
verification.

Local waiver needed: Maybe, when a delivery gate permits a specific deferred
real-provider check and the substitute coverage and remaining risk are
explicit.
