# Insert portal users

`insert_users.sql` reads a local `users.csv` and creates missing portal accounts. Existing matching accounts are reused. It does not assign roles, partner access or application access, and it does not require partner or application data to exist.

Hand off `insert_users.sql` and a reviewed `users.csv`; this README is optional. No repository checkout or other SQL files are required. Use PostgreSQL 13+ with a compatible, already-migrated Partner Portal schema and an operator account authorized to read and insert portal users.

The header-only `users.csv` is a blank template; `users.example.csv` contains two fictional accounts and can be saved as `users.csv` for a rehearsal. There is no required user count; an empty template produces a no-op plan. Keep real account data and reports private.

## CSV fields

| Column | Requirement |
| --- | --- |
| `email` | Unique, lowercase email without surrounding whitespace; at most 255 characters. Used as the new account's username. |
| `name` | Nonblank display name, at least two characters after trimming surrounding spaces; at most 255 characters. |

Use UTF-8 CSV with the exact header `email,name`. Duplicate input emails, malformed rows, deleted accounts, ambiguous email matches, email/name conflicts and usernames owned by another account stop the batch. Existing identity links, profile fields, permissions and onboarding state remain unchanged.

New accounts have no identity-provider binding, department or terms acceptance; `enabled` and `is_superuser` are false. The selected email must match a real OIDC identity to test login. Each user then completes normal onboarding. The example addresses themselves are not login identities.

## Prepare and preview

No SQL has been executed as part of preparing this package. Place the SQL file and reviewed `users.csv` in the same private directory, then open a shell in that directory. Use a fresh `psql -X` process for each run. Choose the target with normal PostgreSQL connection settings; add `-h HOST` and `-U USER` when needed.

Preview stages CSV rows in temporary tables and rolls back; it makes no permanent changes:

```bash
psql -X -d YOUR_DATABASE -f insert_users.sql
```

Review the displayed database/server identity, accounts and actions. With the unchanged example and no existing matches, the expected plan is two `create` rows.

## Apply and reconcile

Apply using the same file and connection:

```bash
psql -X -d YOUR_DATABASE -v apply=true -f insert_users.sql
```

Every run revalidates the CSV and database state. Apply is not bound to an earlier preview and does not freeze tables, so keep the target quiet while applying. It reports the actual user UUIDs; treat it as committed only after the final `APPLIED` message.

Retain the report privately and run a fresh preview: all input rows should now be `reuse`. If execution or connectivity fails, reconcile with a new preview before retrying.
