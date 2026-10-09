# Insert rehearsal applications

`insert_applications.sql` creates three applications: one under the first
rehearsal partner and two under the second. A fresh batch has **three creates**.
Both active partner groups must already exist; otherwise preview fails before
any permanent write. Complete [partner setup](../partners/README.md) first.

Prepared only: no SQL or tests have been run. Read the [shared guide](../README.md)
for connection requirements, verification scenarios, and recovery planning.

`applications.csv` is a header-only template. `applications.example.csv` contains
the synthetic batch. Keep its application UUIDs and partner UUIDs unchanged.
English names are required; an unquoted empty French field becomes null.
Existing exact matches are reused; changes, reparenting, deleted rows, and extra
active applications under these partners are rejected.

This package inserts only applications. It requires no user accounts or role
mappings. Preview reports existing Developer users who can already see these
partners through role mappings; their access to the new applications is included
in the digest. Global role access does not provide individual partner membership.

## Prepare the CSV

From the repository root, create a private working copy:

```sh
SCRIPT_DIR="$(pwd)/backend/database/scripts/applications"
APPLICATION_INPUT_DIR="$(mktemp -d "${TMPDIR:-/tmp}/portal-applications.XXXXXX")"
chmod 700 "$APPLICATION_INPUT_DIR"
cp "$SCRIPT_DIR/applications.example.csv" "$APPLICATION_INPUT_DIR/applications.csv"
chmod 600 "$APPLICATION_INPUT_DIR/applications.csv"
cd "$APPLICATION_INPUT_DIR"
```

Edit the names in the private CSV as needed. Keep the exact header and three
UUID/parent pairs. The script reads `applications.csv` from the current working
directory; its `\ir` includes resolve relative to the SQL file. Keep the SQL
package together.

## Preview, then apply

Configure the approved connection through `PGSERVICE` or the usual libpq
settings. Replace the database placeholder. The `test` label is operator-supplied;
verify the connection and displayed target. The shared checks require
PostgreSQL 13+ and revision `0012_partner_developer_write`.

```sh
psql -X --set=expected_database='replace_with_test_database' \
  --set=target_environment=test \
  --file="$SCRIPT_DIR/insert_applications.sql"
```

Review all three applications, their parent associations, existing-user exposure,
and `reviewed_digest_for_apply`. Preview consumes no permanent sequences. Apply
in a new invocation with the reviewed digest:

```sh
psql -X --set=expected_database='replace_with_test_database' \
  --set=target_environment=test --set=mode=apply \
  --set=reviewed_digest='paste-preview-digest' \
  --file="$SCRIPT_DIR/insert_applications.sql"
```

Apply rechecks the plan and reconciles the three rows and their one-plus-two
ownership split before committing. A fresh preview afterward should show three
reuses and zero creates for an unchanged batch.

Users can be prepared independently; the sequence for dependent packages is
partners → applications → access assignment. Each package has its own
transaction, so an application failure leaves previously committed partners in
place. Environments can then be created through the portal after access is set up.
