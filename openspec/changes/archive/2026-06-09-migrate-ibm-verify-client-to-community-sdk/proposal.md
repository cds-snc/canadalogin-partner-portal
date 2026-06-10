## Why

Our custom IBM Security Verify API clients duplicate behavior that is now available in the `ibm-verify-community-sdk`, increasing maintenance overhead and drift risk. Migrating to the PyPI SDK where it fits lets us align with a maintained integration surface while reducing bespoke HTTP and auth handling.

## What Changes

- Introduce a thin adapter layer around `ibm-verify-community-sdk` for supported IBM Verify operations currently implemented in custom clients.
- Incrementally replace direct request logic in current IBM Verify admin/user repositories with SDK-backed calls where feature parity exists.
- Preserve existing backend service contracts and error envelope behavior while mapping SDK errors to project exceptions.
- Keep fallback custom implementations for endpoints or flows not supported by the community SDK.
- Add tests that validate behavior parity (success, validation failures, and upstream error propagation) for migrated operations.

## Capabilities

### New Capabilities
- `ibm-verify-sdk-adoption`: Standardize IBM Verify API access through the community SDK, with controlled fallback to existing custom logic when SDK coverage is incomplete.

### Modified Capabilities
- None.

## Impact

- Affected code: IBM Verify repositories/adapters under backend application data-access/integration layers and related service wiring.
- Dependencies: Adds and operationalizes `ibm-verify-community-sdk` as the preferred integration dependency for supported operations.
- Testing: Updates unit/integration tests around IBM Verify admin/user clients to assert parity and exception mapping.
- Runtime behavior: No intentional API contract changes for frontend consumers; behavior should remain backward-compatible while internal integration implementation changes.
