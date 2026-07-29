# PAT-025: Dependency Substitution

Type: Pattern
Status: Active

## Problem

Applications often depend on identity providers, external APIs, queues, object
stores, notification services, databases, or other capabilities that are not
available or authorized in every work context. Local development commonly has
the most unavailable dependencies, but availability can also differ across
shared environments.

Choosing substitutes solely because work runs locally can create a second
architecture that passes local checks but does not preserve the contracts,
security boundaries, or failure behavior of the target solution.

## Use When

- A required dependency is unavailable or access is not authorized in the
  declared work context.
- Development, tests, demonstrations, or review need a safe stub, fake,
  simulator, local service, or other substitute.
- The target dependency contract is known well enough to preserve the
  application-facing boundary.
- Different environments intentionally use different configured
  implementations of the same capability.

## Do Not Use When

- The target dependency, ownership boundary, protocol, or application contract
  is too unclear to model safely.
- The requested outcome is specifically to verify real provider, infrastructure,
  performance, assurance, or operational behavior.
- A substitute would bypass authorization, validation, audit, retention,
  transaction, or other required business behavior.
- A production fallback or degraded mode is being designed without an explicit
  architecture and operational decision.

## Trade-Offs

- Substitutes let work proceed without unsafe or unavailable access, but they
  cannot prove behavior owned by the real dependency.
- A stable application-owned boundary reduces environment-specific branching,
  but requires explicit contract and composition design.
- Higher-fidelity simulators improve confidence, but cost more to maintain and
  can still drift from the real service.
- Fail-safe configuration prevents accidental production use, but makes missing
  dependency configuration visible as a startup or availability failure.

## Approach

1. Declare the work context and the solution target separately.
2. Name the target dependency and the application-facing contract that the
   application owns. Include canonical requests, responses, events, sessions,
   policies, and meaningful success and failure semantics as applicable.
3. Record whether the target is available and whether access is authorized in
   the current work context.
4. Select one explicit mode for the dependency: real, local service, stub, fake,
   simulator, another reviewed substitute, or unavailable.
5. Keep real and substituted implementations behind the same port, adapter,
   client, repository, session, or provider boundary. Domain and user-interface
   behavior should depend on that boundary, not on environment-name checks.
6. Select the implementation through explicit configuration or dependency
   composition. Validate the selected mode at startup or composition time.
7. Model the canonical contract and important failure behavior in the
   substitute. Use safe fixture data and preserve application-owned validation,
   authorization, audit, and business rules.
8. Do not automatically fall back to a substitute when real credentials are
   absent, configuration is invalid, or the real dependency is unavailable.
   Fail closed or expose the designed unavailable state.
9. Permit a substitute in a shared non-production environment only when it is
   explicitly configured and visible in verification evidence. Production must
   reject development and test substitutes unless an explicit architecture
   decision defines a safe production implementation or degraded mode.
10. Run common contract tests against the real and substituted implementations
    where practical. Add real-integration verification in a context where the
    target is available and access is authorized.
11. Record what the substitute proves, its known differences, skipped
    real-integration checks, and the context required to close each gap.

### Dependency Substitution Record

```yaml
dependency_substitution:
  dependency: identity_provider
  target_contract: OIDC login, callback, session, and trusted claim mapping
  work_context: local_developer
  target_available: false
  access_authorized: false
  selected_mode: simulator
  configuration: explicit provider-mode setting
  preserved_behavior:
    - backend-owned session response
    - authorization policy checks
    - invalid and expired session handling
  remaining_verification:
    - real provider redirect and callback
    - provider assurance and claim mapping
  production_behavior: reject simulator mode
```

### Expected Files

Adapt these paths to the project's accepted structure:

- Application-owned interface, protocol, client, repository, session, or
  provider boundary.
- Real implementation of the target dependency when it is in delivery scope.
- Substitute implementation and safe fixtures.
- Explicit configuration and composition wiring.
- Shared contract tests and mode-selection tests.
- Verification note containing the dependency substitution record.

## Checks

### Tests

- Real and substituted implementations satisfy the same application-owned
  contract where they are both available to the test suite.
- The substitute covers meaningful success, rejection, timeout, malformed
  response, and unavailable behavior as applicable.
- Application-owned authorization, validation, audit, and business rules remain
  active when the substitute is selected.
- Invalid or missing real configuration does not silently select a substitute.
- When a substitute implementation or mode exists, production configuration
  rejects development and test substitutes.
- Explicitly configured shared-environment substitution is visible and
  deterministic.

### Verification

- The selected mode, availability, access authorization, and configuration
  boundary are recorded for each affected dependency.
- Contract-test results identify which implementations were exercised.
- Verification distinguishes substitute coverage from real-integration
  coverage.
- Remaining provider, infrastructure, performance, assurance, and operational
  gaps name the work context needed to verify them.

### Stop Conditions

- The target dependency contract or ownership boundary is unknown.
- The next step requires unapproved credentials, real data, or access to a
  shared or production system.
- The requested result specifically requires real-integration behavior that is
  unavailable in the authorized work context.
- A substitute would weaken a required security, privacy, audit, retention,
  transaction, or business invariant.
- Production use of a substitute or degraded mode lacks an explicit
  architecture and operational decision.

## Related Standards And Patterns

- [STD-002: Work Contexts](../../standards/std-002-work-contexts.md)
- [STD-012: Testing Basics](../../standards/std-012-testing-basics.md)
- [STD-013: Security and Privacy Basics](../../standards/std-013-security-and-privacy-basics.md)
- [STD-014: Secrets and Configuration](../../standards/std-014-secrets-and-configuration.md)
- [PAT-007: Background Job](../backend/pat-007-background-job.md)
- [PAT-009: OIDC Backend Session](../security/pat-009-oidc-backend-session.md)
- [PAT-011: Secret Lifecycle](../security/pat-011-secret-lifecycle.md)
- [PAT-018: Local Role Simulation](../security/pat-018-local-role-simulation.md)
- [PAT-024: Full-Stack Feature Slice](pat-024-full-stack-feature-slice.md)
- [PAT-026: Outbound Service Adapter](../backend/pat-026-outbound-service-adapter.md)

## Related Schema Contracts

- Schema contract: [ARCH-SCHEMA-PAT-025-DEPENDENCY-SUBSTITUTION](../../schemas/patterns/pat-025-dependency-substitution.schema.yaml)
- Used for: helping agents and reviewers check dependency availability,
  authorized access, contract preservation, explicit mode selection, fail-safe
  production behavior, and remaining real-integration verification.
- Notes: The schema contract supports this pattern. It does not replace this
  pattern as the source of truth.
