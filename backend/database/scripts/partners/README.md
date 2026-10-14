# Set up rehearsal partners

`setup_partners.sql` creates the groups listed in `partners.csv` and links each
to the existing `Partner Developer` role. It requires active departments and
that role for a nonempty batch. Users can be prepared independently.

Give SRE **`setup_partners.sql` and a completed `partners.csv`**. This README is
optional context. The script is standalone: no repository checkout, supporting
SQL files, or original folder layout is required.

Prepared only: no SQL or tests have been run. The target needs PostgreSQL 13+
and a migrated portal schema compatible with `0012_partner_developer_write`;
the script does not enforce an Alembic revision or run migrations.

The CSV sets the batch size; a header-only file is a no-op. The example's two
partners produce four creates: two groups and two role links. Supply a new UUID
once per additional or different partner and retain it for reruns. Existing
UUIDs require matching fields; duplicates, conflicting data, and deleted rows
are rejected.

Set `department_gc_org_id` to an existing active catalog identifier; `2222` in
the example must be verified in the target. English names are required; an
unquoted empty French field becomes null.

Existing applications are allowed. Linking a partner to the global Developer
role can expose all its active applications to existing role holders; the report
lists those users and applications. This is not individual partner membership.

## Prepare the handoff

Place the SQL and CSV together in a private directory on the machine running
`psql`. Name the input `partners.csv` and keep this exact header:

```csv
uuid,department_gc_org_id,name_en,name_fr
```

The unchanged partner and application examples have matching UUIDs and work
together as-is. For additional partners, use their saved UUIDs in the application
CSV. The input is read from the current working directory.

## Preview, then apply

Configure the usual PostgreSQL host/auth settings or add `-h HOST -U USER`.
Start in the directory containing both files, replace `YOUR_DATABASE`, and check
the printed connection. Use a fresh `psql` process for each command. The script
owns its transaction; do not use `-1` or wrap it in an outer transaction.
Preview is the default:

```sh
cd /path/to/partner-handoff
psql -X -d YOUR_DATABASE -f setup_partners.sql
```

Preview shows `partner_action` and `role_link_action` for each CSV row, with
separate create/reuse totals. Review these and existing-user exposure, then apply:

```sh
psql -X -d YOUR_DATABASE -v apply=true -f setup_partners.sql
```

Each invocation validates current data. Preview is not bound to a later apply;
keep the target quiet while applying, especially role changes. Apply inserts and
reconciles in one transaction. A fresh preview after an unchanged batch shows
two reuses per CSV row and zero creates. Preview consumes no permanent sequences.

Continue with the standalone application import, then access assignment. Each
script commits separately; failure of a later step leaves earlier completed
steps in place.
