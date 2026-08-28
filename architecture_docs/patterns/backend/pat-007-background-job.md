# PAT-007: Background Job

Type: Pattern
Status: Active

## Problem

Background work needs a clear boundary so slow or asynchronous behavior does not get hidden inside request handlers.

## Use When

- Work may take longer than a normal request.
- Work can be retried or resumed safely.
- The user needs status rather than an immediate completed result.

## Do Not Use When

- The action must complete transactionally inside the request.
- Retry behavior could duplicate sensitive side effects.

## Trade-Offs

- Keeps requests responsive, but adds queueing, retry, status, and operational concerns.
- Queue and external-service dependencies may be unavailable in development or
  shared environments, but substitutes must preserve trigger, status, retry,
  idempotency, and failure contracts.

## Approach

1. Define the job trigger, payload, idempotency key, and status states.
2. Use a queue-backed worker when the project enables Redis and background jobs.
3. Store job state if users or operators need status.
4. Make retry behavior explicit.
5. Log correlation IDs and job IDs.
6. Audit sensitive job starts, completions, failures, and cancellations.
7. When the selected queue or downstream service is unavailable or outside
   authorized scope, use
   [PAT-025: Dependency Substitution](../full-stack/pat-025-dependency-substitution.md)
   with explicit configuration. Do not replace asynchronous target behavior
   with a synchronous local-only branch or silently select a substitute in
   production.

### Expected Files

- `backend/app/routers/<job>.py`: job trigger and status endpoints.
- `backend/app/services/<job>_service.py`: enqueue and status behavior.
- `backend/app/workers/` or equivalent: worker function when enabled.
- `backend/tests/test_<job>.py`: trigger, status, and retry-safe behavior.

## Checks

### Tests

- Trigger validates payload and returns a job ID or accepted response.
- Duplicate trigger with the same idempotency key is safe.
- Status endpoint returns expected states.
- Failure path is logged and safe.

### Verification

- Pytest output.
- Verification note for retry and idempotency behavior.
- Selected queue and downstream dependency modes, remaining real-integration
  gaps, and an operational note for monitoring and alerting when deployed.

### Stop Conditions

- The requested result requires unavailable or unauthorized shared or
  production systems, real secrets, or real external side effects.
- Retry, compensation, or idempotency behavior is not defined.
