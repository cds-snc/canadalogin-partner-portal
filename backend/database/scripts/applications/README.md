# Insert rehearsal applications

`insert_applications.sql` creates the applications listed in `applications.csv`.
Every parent partner must already be active; set up missing partners first.
Existing partners can receive additional applications
without resubmitting their other applications. Users and role mappings are not
required by this step.

Give SRE **`insert_applications.sql` and a completed `applications.csv`**. This
README is optional context. The script is standalone: no repository checkout,
supporting SQL files, or original folder layout is required.

Prepared only: no SQL or tests have been run. The target needs PostgreSQL 13+
and a migrated portal schema compatible with `0012_partner_developer_write`;
the script does not enforce an Alembic revision or run migrations.

The CSV sets the batch size; a header-only file is a no-op. The example creates
three applications, split one and two across the example partners. Supply a new
UUID once per additional or different application and retain it for reruns. Set
`partner_group_uuid` to its parent's saved UUID. Duplicate UUIDs are rejected.

English names are required; an unquoted empty French field becomes null. Existing
exact matches are reused; changes, reparenting, and deleted input records are
rejected. Other applications already under the same partners are allowed.

The report lists existing Developer users who can see the new applications
through their partner role mappings. Global role access does not provide
individual partner membership.

## Prepare the handoff

Place the SQL and CSV together in a private directory on the machine running
`psql`. Name the input `applications.csv` and keep this exact header:

```csv
uuid,partner_group_uuid,name_en,name_fr
```

The unchanged partner and application examples have matching UUIDs and work
together as-is. For additional applications, use matching saved partner UUIDs
and retain all identifiers for reruns. The input is read from the current
working directory.

## Preview, then apply

Configure the usual PostgreSQL host/auth settings or add `-h HOST -U USER`.
Start in the directory containing both files, replace `YOUR_DATABASE`, and check
the printed connection. Use a fresh `psql` process for each command. The script
owns its transaction; do not use `-1` or wrap it in an outer transaction.
Preview is the default:

```sh
cd /path/to/application-handoff
psql -X -d YOUR_DATABASE -f insert_applications.sql
```

Preview shows each application's parent and create/reuse action, followed by
totals. Review these and existing-user exposure, then apply:

```sh
psql -X -d YOUR_DATABASE -v apply=true -f insert_applications.sql
```

Each invocation validates current data. Preview is not bound to a later apply;
keep the target quiet while applying, especially role changes. Apply inserts and
reconciles the input rows in one transaction. A fresh preview after an unchanged
batch shows one reuse per CSV row and zero creates. Preview consumes no permanent
sequences.

The dependent steps are partners → applications → access assignment. Each
script commits separately; failure of a later step leaves earlier completed
steps in place.
