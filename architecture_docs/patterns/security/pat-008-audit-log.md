# PAT-008: Audit Log

Type: Pattern
Status: Active

## Problem

Audit-sensitive behavior needs a consistent record of who did what, when it happened, and which business object was affected.

## Use When

- Users perform sensitive reads, creates, updates, deletes, approvals, access
  changes, secret actions, or admin actions.
- Security or operations need to reconstruct who did what and when.

## Do Not Use When

- The event is routine diagnostic logging with no audit value.
- The event would record secrets or excessive personal information.

## Trade-Offs

- Improves traceability, but creates data retention, privacy, and schema stability responsibilities.
- Audit logging does not replace access control, monitoring, or business validation.

## Approach

1. Define the event names and resource IDs before implementation.
2. Include actor, action, resource type, resource ID, result, timestamp,
   correlation ID, and relevant metadata.
3. Do not include secret values, tokens, credentials, or unnecessary personal
   information.
4. Write audit events from the backend after authorization decisions.
5. Record both success and important failure or denied events when useful.
6. Define retention, export, and access expectations before non-local use.

### Audit Event Shape

Use this as the default audit event object. The values below are illustrative;
the stable fields are `event_name`, `event_version`, `timestamp`, `actor`,
`action`, `resource`, `result`, `correlation_id`, and optional `metadata`.

```json
{
  "event_name": "resource.updated",
  "event_version": 1,
  "timestamp": "2026-05-12T14:25:43Z",
  "actor": {
    "type": "user",
    "id": "hashed-user-id"
  },
  "action": "update",
  "resource": {
    "type": "resource",
    "id": "hashed-resource-id"
  },
  "result": "success",
  "correlation_id": "5b5a0b4d-8ad4-42e1-9ff7-7312bb0f5902",
  "metadata": {
    "changed_fields": ["status"]
  }
}
```

`metadata` is the extension point for event-specific values. Keep metadata safe,
minimal, and versioned through `event_version` when its meaning changes.
Valid metadata varies by event type. Examples include changed field names,
policy decision IDs, reason codes, or non-sensitive workflow state.

### Expected Files

- `backend/app/services/audit_service.py`: audit event writer.
- `backend/app/models/audit.py`: event schema when persisted.
- `backend/tests/test_audit_log.py`: audit event tests.
- Architecture note or ADR when audit retention or storage is a decision.

## Checks

### Tests

- Sensitive action emits an audit event.
- Denied action emits an event when required.
- Audit event does not include secret values.
- Correlation ID is present.

### Verification

- Test output.
- Audit coverage and retention assumptions.
- Security or information-management review notes when non-local.

### Stop Conditions

- Audit storage, retention, access, or export requirements are unknown.
- The event may include sensitive data and no handling rule exists.
