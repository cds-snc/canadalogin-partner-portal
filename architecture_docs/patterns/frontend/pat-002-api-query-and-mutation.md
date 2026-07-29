# PAT-002: API Query and Mutation

Type: Pattern
Status: Active

## Problem

Frontend features need a consistent way to read and change backend data without scattering fetch behavior, loading states, error handling, and cache updates.

## Use When

- A frontend feature reads or changes backend data.
- The UI needs loading, error, success, and refresh behavior.

## Do Not Use When

- Data is static content.
- State is purely local UI state and does not come from the backend.

## Trade-Offs

- Adds typed API helpers and query hooks, but keeps loading, error, refresh, and cache behavior consistent.
- May be too much structure for static content or purely local UI state.

## Approach

1. Define typed request and response shapes near the API helper or feature.
2. Put low-level fetch behavior in `frontend/src/fetch/` or
   `frontend/src/services/`.
3. Use TanStack Query for reads.
4. Use TanStack Query mutations for creates, updates, deletes, and actions.
5. Invalidate or update the affected query keys after a successful mutation.
6. Map backend errors to user-facing error notices without exposing internals.
7. Use [PAT-020: Status and Feedback](../design/pat-020-status-and-feedback.md)
   for loading, empty, error, success, unauthorized, and recovery states.

### Expected Files

- `frontend/src/fetch/<resource>.ts` or `frontend/src/services/<resource>.ts`:
  typed API functions.
- `frontend/src/features/<feature>/hooks/`: query and mutation hooks.
- `frontend/src/features/<feature>/pages/`: loading, error, empty, and success UI.

## Checks

### Tests

- Request helper sends the expected method, headers, body, and credentials mode.
- Query hook or page handles loading, empty, error, and success states.
- Mutation invalidates or updates the relevant query.
- Error messages are safe and recoverable.

### Verification

- Unit tests for request helpers and important UI states.
- API contract update when backend shape changes.
- Skipped browser-check rationale when applicable.

### Stop Conditions

- API shape is not specified.
- The feature needs real credentials, production data, or external systems.

## Related Schema Contracts

- Schema contract: [ARCH-SCHEMA-PAT-002-API-QUERY-MUTATION](../../schemas/patterns/pat-002-api-query-and-mutation.schema.yaml)
- Used for: helping agents and reviewers check typed API helpers, query and
  mutation hooks, status states, cache behavior, tests, and API contract
  evidence.
- Notes: The schema contract supports this pattern. It does not replace this
  pattern as the source of truth.
