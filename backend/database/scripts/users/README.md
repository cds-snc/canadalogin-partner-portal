# Insert portal users

`insert_users.sql` reads a local `users.csv` and creates missing portal accounts. Existing matching accounts are reused. It does not assign roles, partner access or application access, and it does not require partner or application data to exist.

The package contains a header-only `users.csv` template and a `users.example.csv` with two fictional accounts. There is no required user count; an empty template produces a no-op plan. Keep real account data and reports in a private working directory, outside the repository.

## CSV fields

| Column | Requirement |
| --- | --- |
| `email` | Unique, lowercase email without surrounding whitespace; at most 255 characters. Used as the new account's username. |
| `name` | Nonblank display name, at least two characters after trimming surrounding spaces; at most 255 characters. |

Use UTF-8 CSV with the exact header `email,name`. Duplicate input emails, malformed rows, deleted accounts, ambiguous email matches, email/name conflicts and usernames owned by another account stop the batch. Existing identity links, profile fields, permissions and onboarding state remain unchanged.

New accounts have no identity-provider binding, department or terms acceptance; `enabled` and `is_superuser` are false. The selected email must match a real OIDC identity to test login. Each user then completes normal onboarding. The example addresses themselves are not login identities.

## Prepare and preview

These are operator instructions; no SQL has been executed as part of preparing this package. Use the PostgreSQL version, schema and connection requirements in the [scripts guide](../README.md). Preview stages CSV rows in temporary tables and rolls back; it makes no permanent changes.

Starting at the repository root, copy the example into a private directory. Use `users.csv` instead of `users.example.csv` below to start from the blank template.

```bash
SCRIPT_DIR="$PWD/backend/database/scripts/users"
mkdir -p /private/tmp/partner-users-rehearsal
chmod 700 /private/tmp/partner-users-rehearsal
cp "$SCRIPT_DIR/users.example.csv" /private/tmp/partner-users-rehearsal/users.csv
cd /private/tmp/partner-users-rehearsal
```

Edit the private copy if needed. Configure the intended database connection through your normal PostgreSQL connection settings, then preview:

```bash
psql -X \
  --set=expected_database=YOUR_DATABASE \
  --set=target_environment=test \
  --file="$SCRIPT_DIR/insert_users.sql"
```

Verify the displayed database/server identity, accounts, actions and digest. `target_environment` is an operator label, not automatic environment detection. With the unchanged example and no existing matches, the expected plan is two `create` rows.

## Apply and reconcile

Use the digest from the reviewed preview and the same file and connection:

```bash
psql -X \
  --set=expected_database=YOUR_DATABASE \
  --set=target_environment=test \
  --set=mode=apply \
  --set=reviewed_digest=PASTE_PREVIEW_DIGEST \
  --file="$SCRIPT_DIR/insert_users.sql"
```

Apply checks the plan before inserting and reports the actual user UUIDs. Treat it as committed only after the final `APPLIED` message. Retain the report privately and run a fresh preview: all input rows should now be `reuse`. If execution or connectivity fails, reconcile with a new preview before retrying.

The digest is an MD5 change fingerprint, not a signature. This package is for the local/test/staging rehearsal; production use requires a separate reviewed process.
