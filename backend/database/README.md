# Load partner portal test data

[load_test_data.sql](load_test_data.sql) is the standard one-file test seed for [planning issue 1043](https://github.com/cds-snc/canadalogin-planning/issues/1043). It creates three users, two partners, three applications, and Developer access for users 2 and 3. **Running the file inserts and commits the full dataset.** It is a one-time load: duplicate emails or UUIDs fail rather than reuse existing rows.

## Prerequisites

Use a fresh test dataset with the portal schema migrated through `0012_partner_developer_write`:

| Migration | Required objects |
| --- | --- |
| `0010_application_erd_tables` | Partner and application tables |
| `0011_partner_group_roles` | Partner-role mappings and application read policies |
| `0012_partner_developer_write` | Developer application write policy |

The department catalog entry (default `gc_org_id=2222`), Partner Developer role, and its application read/write policies must already exist and be active. The seed refuses existing active Developer partner links. Its three users must be new; it does not update or reuse accounts.

Migrations remain in [src/migrations](../src/migrations/README.md). This seed does not create missing tables or run migrations. These requirements describe the expected schema; the live database has not been rechecked for this change.

## Edit the data at the top

Save a private copy of the SQL and edit its top `\set` data block: each user's email, name, UUID and Developer flag; the department catalog number; partner names and UUIDs; and application names, UUIDs and parent-partner references. Replace `EMAIL1`, `EMAIL2`, and `EMAIL3` with distinct, lowercase, controlled test emails. Keep real account details out of the repository; `private/` folders and `*.local.sql` copies under this directory are ignored by Git.

The default application split is one under Partner One and two under Partner Two. The `user1_developer`, `user2_developer` and `user3_developer` flags default to `false`, `true` and `true`: user 1 receives no role, while users 2 and 3 receive Developer. Keep UUID references consistent. PostgreSQL generates integer primary keys, while the separate UUIDs identify records and resolve their relationships.

## Save and run in AWS CloudShell

Use the **Bash shell**, whose prompt looks like `~ $`, for the commands below. If the prompt looks like `partner_portal=>`, you are inside psql: enter `\q` to return to Bash first.

In a private working directory, paste the complete reviewed SQL between the marker lines below. Replace the placeholder line with the actual file contents. Keep `'PORTAL_SQL'` quoted and put the closing marker on a line by itself.

```bash
cat > load_test_data.sql <<'PORTAL_SQL'
PASTE THE COMPLETE REVIEWED SQL FILE HERE
PORTAL_SQL
```

This saves the file without executing it and replaces any existing file of the same name. Review the top data block before running it. CloudShell needs a compatible psql client and network access to the intended PostgreSQL database. Use normal host/auth settings, or add `-h HOST -U USER`.

**Test the unregistered-account case with EMAIL1 before loading any users.** When ready to write the complete dataset, run this from Bash, replacing `YOUR_DATABASE`:

```bash
psql -X -d YOUR_DATABASE -f load_test_data.sql
```

Use a fresh psql process without `-1` or an outer transaction; the file owns its `BEGIN` and `COMMIT`. It has no preview option. An error stops the file and rolls back its uncommitted inserts. Do not rerun a successful load; inspect the target before retrying an interrupted run.

## Scenario limits

After normal onboarding, user 1 should see no applications. Users 2 and 3 both see all three applications because Partner Developer is a shared role; existing Developer users also gain that visibility. The seed does not provide separate per-user partner scope or a one-application stage.

Environment setup requires matching IBM configuration and is outside this seed. It does not create OIDC identities, provision IBM applications, or bypass terms/department onboarding. Repeating the unregistered-account scenario needs a fresh/reset dataset or another controlled identity.

No successful load has been verified. No script, migration, or database operation was executed by the agent for this change.
