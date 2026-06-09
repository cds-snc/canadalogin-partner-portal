## ADDED Requirements

### Requirement: SDK-first IBM Verify operation execution
The backend SHALL execute supported IBM Verify admin and user operations through `ibm-verify-community-sdk` by default.

#### Scenario: Supported operation is invoked
- **WHEN** a repository requests an IBM Verify operation that is marked as SDK-supported
- **THEN** the operation executes using the SDK-backed adapter path

### Requirement: Deterministic fallback for unsupported operations
The backend MUST use the existing custom IBM Verify client implementation when an operation is not supported by the SDK or cannot satisfy required behavior parity.

#### Scenario: Operation is not SDK-supported
- **WHEN** a repository requests an operation without SDK parity
- **THEN** the system routes the call to the existing custom implementation

### Requirement: Error contract preservation
The backend MUST translate SDK and transport errors into existing project exception types so API error envelopes remain behaviorally consistent.

#### Scenario: SDK call fails with upstream validation error
- **WHEN** the SDK returns an upstream 4xx validation failure
- **THEN** the adapter raises the corresponding project exception with upstream user-facing details preserved

### Requirement: Migration parity verification
The system MUST include automated tests for each migrated operation covering success and failure paths before that operation is considered migrated.

#### Scenario: Operation is marked migrated
- **WHEN** an operation is switched to SDK-first execution
- **THEN** automated tests assert equivalent behavior for successful responses and mapped error outcomes
