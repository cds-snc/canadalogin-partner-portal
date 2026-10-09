# Assign test partner access

`assign_access.sql` assigns the existing `Partner Developer` role to one existing active portal account. It checks that the role currently reaches exactly the two rehearsal partners and their three applications. It creates at most one `user_role` row; it never creates accounts, partners, applications, or group mappings.

The [shared guide](../README.md) covers prerequisites, target checks, transactions, recovery, and the current global-role limitation. Run [users](../users/README.md), [partners](../partners/README.md), and [applications](../applications/README.md) as needed first. No scripts or tests have been executed during preparation.

## Inputs

| File | Purpose |
| --- | --- |
| `access.csv` | Blank template with `email,role` header |
| `access.example.csv` | One fictional account and `Partner Developer` |
| `assign_access.sql` | Preview/apply entry point |

Use either an email parameter or a one-row CSV. If `email` is supplied, the script **does not read the CSV**; the parameter `role` defaults to `Partner Developer`. Without `email`, it reads `access.csv` in the working directory, using its role value. Multiple CSV accounts, a blank template with no account, and any other role are rejected. Each email needs its own reviewed preview/apply. The input source is displayed and bound to the digest, so keep the same mode between preview and apply.

Email is trimmed and lowercased, then must identify one active existing account. The example does not create a working OIDC identity. Keep real account lists private.

## Parameter mode

From the repository root, capture the absolute script directory. Replace the target and example email with the intended test account. Commands below are for a later authorized run.

```bash
SCRIPT_DIR="$PWD/backend/database/scripts/access"

psql -X -h YOUR_DB_HOST -U YOUR_OPERATOR -d YOUR_DATABASE \
  -v expected_database=YOUR_DATABASE -v target_environment=local \
  -v email='partner.one@example.com' -v role='Partner Developer' \
  -f "$SCRIPT_DIR/assign_access.sql"

# Apply only after reviewing the exact partners/apps, account and digest.
psql -X -h YOUR_DB_HOST -U YOUR_OPERATOR -d YOUR_DATABASE \
  -v expected_database=YOUR_DATABASE -v target_environment=local \
  -v email='partner.one@example.com' -v role='Partner Developer' \
  -v mode=apply -v reviewed_digest=DIGEST_FROM_ACCESS_PREVIEW \
  -f "$SCRIPT_DIR/assign_access.sql"
```

## CSV mode

From the repository root, copy the example to a private working location and edit that copy. Preserve the header and one-row shape. Do not supply `email` or `role` command parameters in this mode.

```bash
SCRIPT_DIR="$PWD/backend/database/scripts/access"
mkdir -p "$SCRIPT_DIR/private"
cp "$SCRIPT_DIR/access.example.csv" "$SCRIPT_DIR/private/access.csv"
cd "$SCRIPT_DIR/private"

psql -X -h YOUR_DB_HOST -U YOUR_OPERATOR -d YOUR_DATABASE \
  -v expected_database=YOUR_DATABASE -v target_environment=local \
  -f "$SCRIPT_DIR/assign_access.sql"

psql -X -h YOUR_DB_HOST -U YOUR_OPERATOR -d YOUR_DATABASE \
  -v expected_database=YOUR_DATABASE -v target_environment=local \
  -v mode=apply -v reviewed_digest=DIGEST_FROM_ACCESS_PREVIEW \
  -f "$SCRIPT_DIR/assign_access.sql"
```

Check the final commit message, then rerun the preview with the same input; it must report `reuse`. Do not re-copy the example over an edited working file between preview and apply.

## Scope and refusals

The account gains access to **both partners and all three applications together**. The current schema cannot grant individual partner/application membership. Extra or missing active groups/apps, incorrect application parents, deleted or ambiguous users, deleted assignments, and missing or duplicate Developer read/write policies cause refusal.

Existing permissions are retained. Future changes to global role mappings or applications can expand access. A failure here does not roll back previously committed user, partner, or application setup.
