# PAT-026: Outbound Service Adapter

Type: Pattern
Status: Active

## Problem

Backend services that call external APIs or providers can become coupled to a
specific SDK, wire format, and failure model. Direct provider calls also make
business behavior harder to test and can expose unsafe upstream details.

## Use When

- A backend service calls an external API, platform, provider, or hosted
  service.
- Business behavior needs to remain testable without network access.
- Provider-specific requests, responses, authentication, or failures need a
  stable application boundary.

## Do Not Use When

- The dependency is an in-process library with no network or provider boundary.
- The work only reads or writes the application's own database; use the
  project's persistence boundary instead.
- A browser calls a third party directly. Review that browser trust, secret, and
  cross-origin boundary separately.

## Trade-Offs

- An adapter adds an interface and mapping code, but isolates provider changes
  and supports focused tests.
- Timeouts and bounded retries can improve resilience, but retries can duplicate
  side effects or increase load when operation semantics are unclear.
- Safe error translation may expose less provider detail to clients, but keeps
  secrets, personal information, and unstable upstream contracts out of the
  application API.

## Approach

1. Define the application operation and expected domain result before choosing
   provider methods. Identify the work context, credentials, sensitive data,
   and external side effects.
2. Define a small adapter interface or protocol around the provider operations
   the application needs. Place it in the project's accepted integration,
   client, gateway, provider, or equivalent boundary; this pattern does not
   require a particular folder.
3. Inject the adapter through the project's dependency or composition boundary.
   Keep business rules, authorization, and multi-step orchestration in the
   service. Routes and jobs call the service rather than a provider SDK or raw
   HTTP client directly.
4. Keep provider authentication, SDK or HTTP calls, request and response
   mapping, connection lifecycle, and provider-specific behavior inside the
   adapter.
5. Configure explicit connection, read, and overall operation timeouts as the
   selected client and operation require. Do not rely on an unbounded default.
6. Record a retry or no-retry decision for each meaningful operation. Use
   bounded retries with backoff and jitter only for failures that are safe and
   likely to be transient. Do not retry a non-idempotent write unless an
   idempotency key, deduplication rule, or compensation design makes duplicate
   effects safe.
7. Translate provider failures at one reviewed boundary into stable, safe
   application or domain errors. Preserve useful classifications such as
   unavailable, timeout, rate limited, rejected input, or not found only when
   the application contract needs them.
8. Treat an upstream error body as untrusted and private. Do not pass through,
   log, or return the raw body. If a client genuinely needs upstream-provided
   detail, map only specifically named fields that have been reviewed for
   secrets, personal information, internal identifiers, and provider contract
   stability, and place those fields on an explicit allowlist.
9. When a running development or shared environment needs a substitute because
   the real provider is unavailable or outside authorized scope, follow
   [PAT-025: Dependency Substitution](../full-stack/pat-025-dependency-substitution.md)
   for explicit mode selection, contract parity, production rejection, and
   remaining real-integration evidence.
10. Test service orchestration with a mock, fake, or stub adapter. Test the real
   adapter separately for request and response mapping, timeouts, retry and
   no-retry behavior, malformed responses, and safe error translation.
11. Keep real-provider checks separate from unit tests. Run them only against an
    approved target with explicit credentials, data, side-effect, and cleanup
    scope.

### Expected Files

Adapt these examples to the project's accepted structure:

- Integration, client, gateway, or provider module: adapter interface and
  provider-specific implementation.
- Service module: business behavior and orchestration using the injected
  adapter.
- Dependency or composition module: adapter construction, configuration, and
  lifecycle.
- Shared error boundary: stable application errors and safe provider-error
  translation.
- Backend tests: service tests with a mock, fake, or stub plus focused adapter
  tests.

## Checks

### Tests

- Service tests replace the real adapter and make no network calls.
- Adapter tests cover representative request and response mapping.
- Timeout and retry or no-retry behavior is verified for important operations.
- Non-idempotent operations are not retried without a tested duplicate-safety
  mechanism.
- Provider failures become stable application errors.
- Raw upstream bodies, headers, secret values, internal identifiers, and
  non-allowlisted fields do not reach client responses or logs.

### Verification

- Unit-test output for service orchestration and adapter failure paths.
- Configuration review for timeouts, retry limits, and credential sources.
- Error-translation review naming any allowlisted upstream fields and why each
  is safe and stable.
- Separate integration-check result, or a recorded reason it was unavailable or
  not run.

### Stop Conditions

- The provider operation, data classification, credential owner, or side
  effects are unclear.
- Retry safety, idempotency, deduplication, or compensation is unclear for a
  write that may be retried.
- A raw upstream body or unreviewed upstream field would be exposed to a client
  or log.
- Work requires real credentials, production data, a shared environment, or a
  provider mutation that is not explicitly in scope.
- Provider terms, rate limits, data residency, privacy, or security obligations
  require a separate decision.

## Related Standards And Patterns

- [STD-002: Work Contexts](../../standards/std-002-work-contexts.md)
- [STD-008: Backend FastAPI](../../standards/std-008-backend-fastapi.md)
- [STD-010: API Response and Error Models](../../standards/std-010-api-response-and-error-models.md)
- [STD-011: Logging and Observability](../../standards/std-011-logging-and-observability.md)
- [STD-012: Testing Basics](../../standards/std-012-testing-basics.md)
- [STD-013: Security and Privacy Basics](../../standards/std-013-security-and-privacy-basics.md)
- [STD-014: Secrets and Configuration](../../standards/std-014-secrets-and-configuration.md)
- [PAT-005: Router, Service, Schema](pat-005-router-service-schema.md)
- [PAT-007: Background Job](pat-007-background-job.md)
- [PAT-024: Full-Stack Feature Slice](../full-stack/pat-024-full-stack-feature-slice.md)
- [PAT-025: Dependency Substitution](../full-stack/pat-025-dependency-substitution.md)

## Related Schema Contracts

- Schema contract: [ARCH-SCHEMA-PAT-026-OUTBOUND-SERVICE-ADAPTER](../../schemas/patterns/pat-026-outbound-service-adapter.schema.yaml)
- Used for: helping agents and reviewers check adapter boundaries, dependency
  injection, service orchestration, timeout and retry decisions, safe error
  translation, allowlisted fields, tests, and integration verification.
- Notes: The schema contract supports this pattern. It does not replace this
  pattern as the source of truth.
