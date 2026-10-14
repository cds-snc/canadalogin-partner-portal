# Partner data scripts

PostgreSQL/psql scripts for the test-data rehearsal in [issue 209](https://github.com/cds-snc/canadalogin-partner-portal/issues/209) and [issue 224](https://github.com/cds-snc/canadalogin-partner-portal/issues/224).

**Prepared only: no SQL, database operations, migrations, or tests have been run.**

## What to run

Each SQL file is self-contained. Hand off one script and its CSV inputs; the SRE does not need this repository or any other SQL files. Run one script at a time.

| Order | Package | Main script | CSV inputs |
| --- | --- | --- | --- |
| 1 | [Users](users/README.md) | `users/insert_users.sql` | `users.csv` |
| 2 | [Partners](partners/README.md) | `partners/setup_partners.sql` | `partners.csv` |
| 3 | [Applications](applications/README.md) | `applications/insert_applications.sql` | `applications.csv` |
| 4 | [Access](access/README.md) | `access/assign_access.sql` | `partners.csv`, `applications.csv`, and one email parameter or `access.csv` |

Users can be loaded independently. Applications need existing partners. Access needs the account and the intended partner/application setup to exist.

Each package contains a blank CSV template, an example CSV, and a README. The examples have two fictional partners and three applications (one under the first partner, two under the second). These are sample counts: add CSV rows to create more records. Give new records distinct UUIDs and retain them for reruns. Application rows specify their parent with `partner_group_uuid`.

## SRE handoff

For an issue in another repository, provide the selected SQL file, its reviewed CSV inputs under the filenames in the table, the target database/connection details, and the expected result. Each SQL file contains its own prerequisites and preview/apply commands in the opening comments. Its package README provides more detail but is not required to run it.

Use the same version of the script and inputs for preview and apply. The templates are header-only; example CSVs contain fictional data and must be copied or saved under the input filename before use. A `private/` working folder beneath this scripts directory is ignored by Git.

## Example: load partners

Save `setup_partners.sql` and the reviewed `partners.csv` together in a working folder, then open a terminal in that folder. No original repository paths are needed.

Use your normal PostgreSQL connection settings. Replace `YOUR_TEST_DATABASE`; add `-h YOUR_HOST -U YOUR_OPERATOR` if needed. Preview:

```bash
psql -X -d YOUR_TEST_DATABASE -f setup_partners.sql
```

Review the connection, proposed creates/reuses, and affected access. To apply the same input, add **`-v apply=true`**:

```bash
psql -X -d YOUR_TEST_DATABASE -v apply=true -f setup_partners.sql
```

Wait for `APPLIED: transaction committed`, then rerun the preview to confirm that matching rows are now reused. The other packages use the same pattern; their READMEs show their CSVs and commands. Do not copy an example over an edited working file between runs.

## What each script does

- Sets up preview mode, error handling, a transaction, timeouts, and its own temporary validation function.
- Reads the CSV, validates it, shows the proposed changes, and inserts only when `apply=true`.
- Rolls back a preview or commits an apply.

All of that SQL is included directly in each file; there are no external SQL includes or preinstalled custom functions. CSVs are read from your current working directory. Use a fresh `psql -X` process for each run and do not wrap scripts in another transaction. These are psql scripts; they cannot be pasted unchanged into a generic SQL editor.

## Checks and transaction behaviour

Use PostgreSQL 13+ with the portal schema already migrated. The scripts were prepared against schema revision `0012_partner_developer_write`; they do not pin that revision or run migrations. Review schema changes before reuse. The operator needs SELECT, relevant INSERT/sequence access, and database TEMP privileges. The connection settings select the database; the scripts display that connection but do not detect test versus production.

PostgreSQL handles invalid field types, missing required values, and duplicate keys through table constraints. The additional checks catch things those constraints cannot decide: whether an existing row conflicts with the CSV, whether a reference is soft-deleted, and whether a global role would grant unintended access. These checks matter because matching records are reused rather than overwritten.

Empty user/partner/application templates are no-op batches. Later application batches can add apps without including the existing siblings. Reports show ordinary named columns and create/reuse actions. There are no automatic updates or deletes.

Preview creates only temporary objects and rolls them back; it performs no portal inserts or ID-sequence calls. Apply uses one transaction per operation. If a later operation fails, earlier committed operations remain. A failed insert can leave harmless sequence gaps.

**Preview and apply are separate runs.** Apply validates the current CSV and database state; it is not tied to an earlier preview. Keep the input unchanged and use a quiet test database while previewing and applying, especially for access changes. There are no explicit table-wide locks. Serializable transactions and constraints can reject concurrent conflicts; after a failure, review a fresh preview before retrying. A lost connection during commit also requires reconciliation before retrying.

## Access limitation

The current portal uses a global `Partner Developer` role. Linking a partner to that role can expose its existing applications to other Developer users; the partner preview lists those applications and users. Application previews also list existing Developer users who can see the new apps.

Access assignment requires the role's full current scope to match the partner/application CSVs. Those CSVs are the intended scope, not a filter on the role. Supply the complete intended dataset, not just a later import batch. The script refuses extra or missing records, wrong application parents, or an empty partner selection. Zero applications is allowed. Existing permissions remain, and later global role changes can expand access; these scripts do not provide lasting individual partner isolation.

## Rehearsal and production plan

When execution is authorized, use a disposable test database first. Check the example load, four-or-more-partner inputs, adding one app to an existing partner, empty imports, and identical reruns. Verify that previews do not change portal data, invalid inputs roll back, and access refuses a scope different from the CSVs. Then verify sign-in and application visibility with controlled OIDC identities; the example emails are fictional and new user rows still need normal onboarding.

Keep inputs and run reports private. Arrange snapshot/reset recovery before a shared-test run; there is no generic undo script for committed data. Production planning still needs real source mappings, individual partner/application membership, environment/IBM configuration, and a reviewed execution/recovery process. The example department `2222` must exist in the target. These scripts do not create departments, roles, policies, environments, or IBM applications. Issues 209 and 224 require actual execution evidence before completion; production migration in issue 210 is outside this preparation.
