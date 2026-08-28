# Schema Selection

Type: Architecture Guidance
Status: Active

Use this guide when selecting shared standards, patterns, controls, baselines,
and schema contracts for project work.

## Selection Process

1. Classify the work.

   Use one or more work categories: UI, API, backend, data, security, privacy,
   testing, deployment, documentation, baseline, or architecture decision.

2. Identify the work context using
   [STD-002: Work Contexts](../standards/std-002-work-contexts.md).

   Decide whether the work is local developer work, shared non-production work,
   or production work. Stop before shared-environment or production actions
   unless the target, access path, owner, and approval expectations are clear.
   Treat this as an execution and access decision, not a solution-architecture
   decision. Select each dependency's real, substituted, or unavailable mode
   independently of work context, based on that dependency's availability and
   authorized access.

3. Check selection profiles for a starting point.

   Use [schemas/selection-profiles.yml](../schemas/selection-profiles.yml) to
   find common starting sets for UI pages, forms, full-stack features, external
   dependencies, outbound service integrations, API routes, persistence,
   secrets, logging, containers, GC web release readiness, and exception
   decisions.

   Profiles are starting points, not final answers. Agents still need to
   inspect the actual task, work context, stack, changed files, and project
   constraints before deciding what applies.

4. Search the catalogs.

   Search standards, patterns, controls, baselines, and schema contracts by
   `applies_when`, `categories`, `search_keywords`, `stack_profiles`, and
   `artifact_types`.

   Useful catalogs:

   - [standards/catalog.yml](../standards/catalog.yml)
   - [patterns/catalog.yml](../patterns/catalog.yml)
   - [controls/catalog.yml](../controls/catalog.yml)
   - [baselines/catalog.yml](../baselines/catalog.yml)
   - [schemas/catalog.yml](../schemas/catalog.yml)
   - [schemas/selection-profiles.yml](../schemas/selection-profiles.yml)

5. Load the human-readable standards and patterns first.

   Standards, patterns, controls, and baselines remain the source of truth.
   Read the applicable documents before relying on schema contracts.

6. Load related schema contracts when available.

   Use `schema_refs` in owner catalogs or search
   [schemas/catalog.yml](../schemas/catalog.yml). If no schema contract exists,
   use the human-readable guidance directly.

7. Use schema contracts to check evidence, exceptions, and review notes.

   Schema contracts help agents and reviewers choose checks, collect evidence,
   identify missing review information, and flag exception or ADR triggers.
   Record selected standards and patterns in an implementation plan, design
   note, ADR, PR, or verification note when the choice is meaningful for the
   project.

8. If a standard applies but the project will not follow it, record a local ADR.

   Do not hide non-adoption. Record a local ADR in the project repo. Link the
   standard, pattern, or control; describe the reason; record the risk or
   trade-off; identify the owner; and add a review trigger.

9. If a delivery gate also needs an exception, record a project-local waiver.

   Waivers belong in the Delorean evidence process owned by the project or
   `delorean_template`. This repo may describe when a waiver is expected, but it
   does not own the runtime waiver record.

## Examples

### Adding A New FastAPI Route

Classify the work as API, backend, testing, and possibly security or privacy.
Use STD-002 to confirm the execution context, usually `local_developer` for
implementation work. Do not infer that the route, persistence, identity, or
external-service architecture is local-only.

Search the catalogs for FastAPI, REST API, response models, testing, and
security. Load standards such as STD-008, STD-009, STD-010, STD-012, and
STD-013 when applicable. Load related backend or API patterns when they fit.

If related schema contracts exist, use them to check request and response
models, safe error handling, route/service boundaries, tests, and verification
notes. If the route intentionally varies from the API standard, record the
reason in a local ADR.

### Adding A User-Facing React Page

Classify the work as UI, frontend, accessibility, design-system, testing, and
possibly official languages.

Search the catalogs for React, GC Design System, page layout, accessibility,
standards review, and page patterns. Load standards such as STD-004, STD-005,
STD-006, STD-007, STD-017, and STD-018 when applicable. Load the closest design
and frontend patterns before implementation.

If related schema contracts exist, use them to check page pattern selection,
navigation, accessibility evidence, bilingual content expectations, design
system exceptions, and verification notes. For nested TanStack Router routes,
also check that the parent renders an `Outlet`, preserves any index-page
behavior, and that generated route-tree files are regenerated rather than
edited. If the page does not follow an applicable page pattern, record a local
ADR.

### Adding Database Persistence

Classify the work as data, backend, API, testing, security, privacy, and
possibly information management.

Search the catalogs for database persistence, migrations, API contracts, testing,
and personal information. Load STD-020, STD-008, STD-009, STD-010, STD-012, and
STD-013 when applicable. Load data and backend patterns such as the Alembic
PostgreSQL change pattern when they fit.

If related schema contracts exist, use them to check migration evidence,
persistence/API model separation, ownership, retention, indexes, constraints,
write-path cache effects, configured Alembic revision identifier capacity,
revision lookup, and verification notes. If the project will not use the
recommended migration path, record a local ADR and use the project-local waiver
process if a delivery gate requires an exception.

### Adding A Full-Stack Feature Slice

Classify the work as frontend, API, backend, testing, and any applicable data,
security, privacy, or accessibility concerns. Start with the
`full-stack-feature-change` selection profile and PAT-024.

Define the requirement scenarios and API contract first, including canonical
serialized JSON field naming. Then select the focused frontend, backend,
persistence, authorization, and status patterns that apply. Explicitly record
when persistence, migration, authorization, resource scope, empty state, or
generated artifacts do not apply. Make cache effects and outbound-service
adapters explicit applicability decisions as well.

Use the related schema contracts to check cross-layer completeness, protected
route freshness, policy initialization and enforcement, serialized contract
alignment, dependency modes, tests, and verification appropriate to the
declared work context. Use PAT-025 when a selected dependency is unavailable or
outside authorized scope, and PAT-026 when the backend calls an external API or
provider. Record a local ADR for material variations or breaking API decisions.

### Working With An Unavailable Dependency

Use STD-002 to declare the work context and identify the solution target
separately. Name the target dependency, its application-facing contract,
whether it is available, and whether access is authorized.

Load PAT-025 and its schema contract when the capability is still required but
the real dependency cannot be used. Select a stub, fake, simulator, local
service, or other reviewed substitute explicitly; keep it behind the same
application-owned boundary; and preserve important success, failure, security,
and business semantics.

Verification must identify the selected mode and remaining real-integration
gaps. Substitute coverage is not evidence of real provider, infrastructure,
assurance, performance, or operational behavior. Do not create a new ADR merely
because local work uses an explicitly authorized sandbox or because code
implements an already selected real integration. Record an ADR for a material
contract or architecture variation, weakened invariant, or intentional
production substitute or degraded mode.

### Adding An Outbound Service Integration

Classify the work as backend, API, operations, security, and testing. Start
with the `outbound-service-integration-change` selection profile and PAT-026.

Define an application-owned adapter contract and inject it into the service
layer. Record explicit bounded timeouts, retry or no-retry behavior per
operation, and any idempotency, deduplication, or compensation requirement.
Translate provider failures centrally into stable safe application errors.
Do not pass raw upstream error bodies to clients or logs; retain only fields
that were reviewed and allowlisted.

Use mocked or fake adapters for service-layer unit tests and separate adapter
tests for provider mapping and transport behavior. Record unavailable
real-provider checks and their residual risks. PAT-025 also applies when the
selected real provider is unavailable or outside authorized scope.

### Deciding Not To Use A Recommended Pattern

Classify the work by the feature area first, then identify the recommended
pattern from the pattern catalog.

Load the pattern and any related standards. If the project will not follow the
pattern, do not remove it from the review trail. Record a local ADR that names
the pattern, explains the reason, describes the risk or trade-off, identifies
the owner, and states when the decision should be reviewed.

If a delivery gate also checks for that pattern or its evidence, record a
project-local waiver in the Delorean evidence process for the specific check,
time period, release, or accepted risk.
