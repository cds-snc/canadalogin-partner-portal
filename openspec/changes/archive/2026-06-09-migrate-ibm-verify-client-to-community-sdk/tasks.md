## 1. Discovery and SDK Baseline

- [x] 1.1 Inventory existing IBM Verify admin/user operations and map each to current custom client call paths.
- [x] 1.2 Evaluate `ibm-verify-community-sdk` coverage for each operation and document supported vs unsupported parity status.
- [x] 1.3 Add or confirm SDK dependency/version pinning in backend dependency configuration.

## 2. Adapter and Routing Implementation

- [x] 2.1 Define internal IBM Verify adapter interfaces for admin/user operations used by repositories.
- [x] 2.2 Implement SDK-backed adapter methods for parity-confirmed operations.
- [x] 2.3 Implement deterministic fallback routing to existing custom client logic for non-parity operations.
- [x] 2.4 Wire repositories/services to the adapter boundary without changing existing service contracts.

## 3. Error Translation and Contract Preservation

- [x] 3.1 Implement centralized translation from SDK/transport exceptions to project exception classes.
- [x] 3.2 Preserve upstream user-facing validation details where required by existing error envelope behavior.
- [x] 3.3 Add tests that verify translated exception codes/messages align with current API behavior.

## 4. Verification and Rollout Safety

- [x] 4.1 Add or update unit tests for each migrated operation covering success paths.
- [x] 4.2 Add or update tests for failure paths (4xx/5xx, auth failures, timeout/network errors) on migrated operations.
- [x] 4.3 Run backend lint, typecheck, and targeted test suites for IBM Verify integrations.
- [x] 4.4 Document migrated operations and remaining fallback operations for phased follow-up migration.
