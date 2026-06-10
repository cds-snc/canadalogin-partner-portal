## Context

The backend currently uses custom IBM Security Verify admin and user API client code for token handling, request composition, and response mapping. This logic has grown over time and increases maintenance burden, especially where it overlaps with behavior already available in `ibm-verify-community-sdk`.

The migration must preserve existing service and API contracts in the partner portal backend, including centralized exception mapping and current response semantics. Some IBM Verify flows may not yet be covered by the SDK, so a selective migration approach is required.

## Goals / Non-Goals

**Goals:**
- Adopt `ibm-verify-community-sdk` as the default implementation path for supported IBM Verify operations.
- Preserve current backend behavior, including status handling and user-facing error envelope compatibility.
- Provide a fallback path to existing custom logic for unsupported or incompatible SDK operations.
- Make migration testable and incremental so rollout can happen without broad regressions.

**Non-Goals:**
- Rewriting all IBM Verify integration code in one release.
- Changing public backend API contracts used by frontend clients.
- Introducing new business features unrelated to IBM Verify client internals.

## Decisions

1. Introduce an internal adapter boundary for IBM Verify operations.
Rationale: Repositories/services call a stable internal interface while implementation chooses SDK-first with selective fallback. This limits blast radius and allows operation-by-operation migration.
Alternatives considered:
- Directly replace all call sites with SDK calls: rejected because it couples business logic to SDK types and complicates fallback behavior.
- Keep all custom clients unchanged: rejected because it does not reduce maintenance risk.

2. Use capability parity checks per operation before migration.
Rationale: Only operations with clear request/response equivalence move to SDK-backed execution. Non-parity operations remain on custom clients temporarily.
Alternatives considered:
- Big-bang migration of all operations: rejected due to high regression risk.

3. Centralize SDK exception translation at adapter boundary.
Rationale: Existing services rely on project exception classes and shared error handling. Translating SDK/network errors in one place preserves current behavior contracts.
Alternatives considered:
- Let SDK exceptions propagate: rejected because it leaks implementation details and risks inconsistent API errors.

4. Add regression tests for migrated operations using existing test patterns.
Rationale: Tests must prove parity in success and failure paths to make incremental rollout safe.
Alternatives considered:
- Rely only on manual QA: rejected due to insufficient coverage for edge-case error handling.

## Risks / Trade-offs

- [SDK feature gaps or behavioral differences] -> Keep operation-level fallback to existing custom implementation until parity is proven.
- [Exception shape mismatch causing API regressions] -> Add adapter-level translation tests and preserve project exception classes.
- [Dependency updates introduce breaking changes] -> Pin and review SDK versions; add contract tests around migrated calls.
- [Dual-path complexity during transition] -> Track migrated operations explicitly and remove dead fallback paths after validation.

## Migration Plan

1. Add the SDK dependency and create adapter abstractions for admin/user operations.
2. Migrate a small set of low-risk operations with unit tests validating parity.
3. Expand migration operation-by-operation, retaining fallback for unsupported paths.
4. Run backend lint/typecheck/tests and targeted IBM Verify integration tests.
5. Remove fallback code only after all targeted operations are parity-tested.

Rollback strategy:
- Revert adapter configuration to force custom-client path for affected operations.
- Deploy with fallback enabled while fixes are prepared.

## Open Questions

- Which current IBM Verify operations have full parity in `ibm-verify-community-sdk` today?
- Do any existing call sites depend on undocumented response fields from custom clients?
- Should operation selection between SDK and fallback be static (code-level) or configurable by environment flag during rollout?
