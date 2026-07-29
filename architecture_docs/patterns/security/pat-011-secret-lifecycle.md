# PAT-011: Secret Lifecycle

Type: Pattern
Status: Active

## Problem

Secret-handling capabilities need consistent lifecycle semantics across safe
fake values or development/test adapters and deployed runtime sources. Real
secrets still require provisioning, rotation, revocation, and incident
response.

## Use When

- A feature creates, displays, rotates, disables, or deletes credentials, API
  keys, client secrets, private keys, or other sensitive values.
- A selected secret store is unavailable or outside authorized scope and a safe
  substitute must preserve its application-owned lifecycle contract.

## Do Not Use When

- The value is only public configuration.
- The system cannot meet the required custody and audit model.

## Trade-Offs

- Keeps secrets out of code and generated output, but requires ownership for provisioning, rotation, and revocation.
- Safe fake values and contract-compatible substitutes are useful when the
  selected secret service is unavailable or outside authorized scope, but
  cannot prove deployed secret store or key-management behavior.

## Approach

1. Define who can create, view, rotate, disable, and delete the secret.
2. Generate secrets server-side using an approved cryptographic source.
3. Show secret values only when the user is authorized and the product decision
   allows it.
4. Prefer one-time reveal for newly generated secrets.
5. Store actual secret values only as needed and use an approved secret store or
   encrypted storage in every work context.
6. When the selected secret store is unavailable or outside authorized scope,
   follow
   [PAT-025: Dependency Substitution](../full-stack/pat-025-dependency-substitution.md)
   with an explicitly configured adapter that accepts only safe fake values and
   preserves the selected lifecycle contract. Shared use must be declared, and
   production must reject development and test adapters.
7. Never log secret values.
8. Audit create, reveal, rotate, disable, and delete actions.
9. Use safe recovery errors that do not expose whether a secret exists unless the
   user is authorized to know.

### Expected Files

- `backend/app/services/<secret>_service.py`: lifecycle behavior.
- `backend/app/routers/<secret>.py`: authorized endpoints.
- `backend/app/models/<secret>.py`: safe request and response models.
- `backend/tests/test_<secret>_service.py`: lifecycle and audit tests.
- `frontend/src/features/<feature>/`: one-time reveal and recovery UI.

## Checks

### Tests

- Unauthorized users cannot create, view, rotate, disable, or delete secrets.
- Secret values are not returned after one-time reveal, if that rule applies.
- Secret values are not logged or included in audit metadata.
- Rotation invalidates or supersedes the previous secret according to the spec.
- Delete or disable follows retention and recovery expectations.
- Real and substituted stores satisfy the same application-owned lifecycle
  contract where both can be tested.
- Shared and production configuration cannot silently select a development or
  test secret-store adapter.

### Verification

- Security review notes.
- Audit-log test output.
- Custody, reveal, and deletion semantics review.
- Selected secret-store mode and any real-store, KMS, rotation, or operational
  behavior that remains unverified.

### Stop Conditions

- The requested result specifically requires unavailable real secret-store,
  KMS, certificate, rotation, or production credential behavior.
- Secret custody model is not agreed.
- Human approval, waiver, or SA&A verification is needed.
