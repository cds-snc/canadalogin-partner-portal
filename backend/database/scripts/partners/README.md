# Set up rehearsal partners

`setup_partners.sql` creates two partner groups and two links to the existing
`Partner Developer` role. A fresh batch has **four creates**. It requires the
existing department catalog and active role; it does not require user accounts.

Prepared only: no SQL or tests have been run. Read the [shared guide](../README.md)
for connection requirements, verification scenarios, and recovery planning.

`partners.csv` is a header-only template. `partners.example.csv` contains the two
synthetic partners. Keep their UUIDs unchanged. Replace `department_gc_org_id`
with an existing active catalog identifier; `2222` is an example to verify in the
target. English names are required; an unquoted empty French field becomes null.

The script reuses exact matches and rejects changed names, departments, deleted
records, and extra active applications under the fixture groups. Existing
holders of the global Developer role can see applications in these partners.
Preview lists those users and any existing fixture applications, and includes
them in the review digest. This does not establish individual partner membership.

## Prepare the CSV

From the repository root, create a private working copy:

```sh
SCRIPT_DIR="$(pwd)/backend/database/scripts/partners"
PARTNER_INPUT_DIR="$(mktemp -d "${TMPDIR:-/tmp}/portal-partners.XXXXXX")"
chmod 700 "$PARTNER_INPUT_DIR"
cp "$SCRIPT_DIR/partners.example.csv" "$PARTNER_INPUT_DIR/partners.csv"
chmod 600 "$PARTNER_INPUT_DIR/partners.csv"
cd "$PARTNER_INPUT_DIR"
```

Edit that private CSV. Keep the exact header and two UUIDs. The script reads
`partners.csv` from the current working directory; `\ir` resolves its shared SQL
files relative to the script itself. Keep the SQL package together.

## Preview, then apply

Configure the approved database connection through `PGSERVICE` or the usual
libpq connection settings. Replace the database placeholder below. The label
`test` is operator-supplied; verify the connection and displayed target yourself.
The shared checks require PostgreSQL 13+ and revision
`0012_partner_developer_write`.

```sh
psql -X --set=expected_database='replace_with_test_database' \
  --set=target_environment=test \
  --file="$SCRIPT_DIR/setup_partners.sql"
```

Review every row, the existing-user exposure, and `reviewed_digest_for_apply`.
Preview does not insert permanent rows or consume their sequences. Apply in a
new invocation using that digest:

```sh
psql -X --set=expected_database='replace_with_test_database' \
  --set=target_environment=test --set=mode=apply \
  --set=reviewed_digest='paste-preview-digest' \
  --file="$SCRIPT_DIR/setup_partners.sql"
```

Apply rechecks the plan, inserts missing rows in one transaction, and reconciles
both groups and their role links. Run a fresh preview afterward: an unchanged
batch should show four reuses and zero creates.

Continue with [applications](../applications/README.md), then access assignment.
Users can be prepared independently. Each package commits separately; a later
failure leaves earlier completed packages in place. Resolve the failure and
preview that package again before proceeding.
