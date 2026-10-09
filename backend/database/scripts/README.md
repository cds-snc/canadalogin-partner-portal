# Partner data scripts

Use these PostgreSQL/psql packages to rehearse account and partner data loading for [issue 209](https://github.com/cds-snc/canadalogin-partner-portal/issues/209) and [issue 224](https://github.com/cds-snc/canadalogin-partner-portal/issues/224). Start locally and repeat in shared test with a fresh preview for each operation.

**Prepared only:** the SQL and verification scenarios have been reviewed as source; no SQL, database operations, migrations, or tests have been executed.

## Packages and order

| Order | Package | Files | Permanent writes | Initial example inserts |
| --- | --- | --- | --- | --- |
| 1 | [Users](users/README.md) | `insert_users.sql`, `users.csv`, `users.example.csv` | Missing portal users | 2 |
| 2 | [Partners](partners/README.md) | `setup_partners.sql`, `partners.csv`, `partners.example.csv` | Missing partner groups and Developer group-role links | 4 |
| 3 | [Applications](applications/README.md) | `insert_applications.sql`, `applications.csv`, `applications.example.csv` | Missing applications under existing partners | 3 |
| 4 | [Access](access/README.md) | `assign_access.sql`, `access.csv`, `access.example.csv` | One missing Developer assignment for an existing account | 1 per email |

Each folder also contains its own `README.md`. The provided `<name>.csv` is a blank header-only template; `<name>.example.csv` contains fictional sample data. Make a private working copy with the expected filename. Keep real account lists and run reports out of Git. A `private/` directory beneath this scripts folder is ignored by Git.

The shared helpers in [_shared/](./_shared/) provide target checks, transactions, plan checks, and fixed rehearsal identifiers. Keep the packages and helpers together. Run an entry script in a fresh `psql` process; do not run a helper directly, concatenate entry scripts, or wrap them in another transaction.

Users can be prepared independently, or omitted when the accounts already exist. Partners must exist before applications, and both users and the full partner/application setup must exist before granting access.

## Rehearsal data

| Partner | Applications |
| --- | --- |
| Test Partner One | Test One Service |
| Test Partner Two | Test Two Intake; Test Two Status |

Partner and application UUIDs are fixed for repeatable reruns. Partner/application packages accept only this two-partner, three-application rehearsal. Both example partners reference catalog GC organization `2222` solely as a fixture; the invented partners do not represent that organization. No departments, roles, access policies, environments, or IBM applications are created by these scripts.

The two example user emails are fictional, not working OIDC identities. For sign-in testing, use controlled identities in a private CSV. User insertion leaves profile/department onboarding and terms acceptance to the user; it does not create an identity-provider account or grant access.

## Connection and schema

Use `psql` against PostgreSQL 13 or newer, with the `public` schema already migrated to `0012_partner_developer_write`. Schema migrations are a separate operation. Review these scripts against a later revision before changing their version check. The scripts use [psql parameters, includes and client-side CSV loading](https://www.postgresql.org/docs/16/app-psql.html), so they cannot be pasted unchanged into a generic SQL editor.

Every README provides preview and apply commands. Supply `expected_database` matching the connected database and `target_environment` as `local`, `test`, or `staging`. The environment value is an operator label, **not deployment detection**. Confirm the actual connection/service/host independently; mislabeling a production database as test does not prevent writes. Prefer an explicit TCP host. Server address/port are displayed and included in plans, but are null on a Unix-socket connection.

The operator needs SELECT on the referenced tables and `alembic_version`, appropriate INSERT and sequence access, database TEMP privilege, and privileges for the operation's table locks. No permanent schema objects or extensions are created. `psql` can run from an operator workstation using normal database authentication; the application image and Python are not needed.

## Preview and apply

1. Copy the chosen template or example into a private directory under the exact CSV filename stated in its README. Use UTF-8 without a byte-order mark and retain the header order. Native [PostgreSQL CSV parsing](https://www.postgresql.org/docs/16/sql-copy.html#SQL-COPY-NOTES) handles quoted fields and embedded commas/newlines.
2. Run the script from that private directory in its default preview mode. `\copy` reads the CSV relative to the working directory; `\ir` finds helpers relative to the SQL file. Email-parameter access mode needs no CSV directory.
3. Review the target, proposed create/reuse rows, affected access, and digest. Resolve conflicts by correcting the input or planning a separate data correction.
4. Apply that operation using `mode=apply` and its own `reviewed_digest`. The script rechecks the plan before permanent inserts. A changed input, target, or relevant database state requires a new preview.
5. Confirm the final `APPLIED: transaction committed` message, record the result, and run a fresh preview. It should show only reuses. Move to the next operation with a new preview and digest.

Preview writes only temporary staging objects and rolls them back. It does not insert into portal tables or consume their ID sequences. It is not a PostgreSQL `READ ONLY` transaction because temporary objects are created. Digests are MD5 change fingerprints, not credentials or signatures.

Each apply is one transaction and inserts only absent records. Matching existing rows are reused; conflicting or deleted records are rejected. There is no automatic update, undelete, reparent, or deletion. Apply takes table locks before reading its plan; these briefly block writes to the tables used by that operation, with a five-second lock timeout. The users operation only locks the user table. Other operations also lock the tables used to assess ownership and shared-role visibility.

**The four operations are separate transactions.** If applications fail after users and partners have committed, those earlier records remain. Correct the failed stage's input, obtain a fresh preview, and resume; do not assume an all-or-nothing transaction across packages. An identical completed stage can be previewed and rerun safely.

Earlier query output is provisional until the final commit message. A lost connection around commit leaves an uncertain outcome; reconnect and reconcile before retrying. A failed apply can consume integer sequence values even though its rows roll back. Sequence gaps are not partial imports.

## Current access model

The application currently matches a user's global role with roles linked to partner groups. It does not model an individual user's membership in a partner or application. The access package therefore grants **both test partners and all three applications together** and supports only `Partner Developer`.

The partner and application previews list existing Developer users who can gain visibility when groups are linked or applications are added. The access package refuses any extra active partner or application in the role's current scope, a missing expected mapping, or incorrect ownership. Existing local demo data may trigger that refusal; use a dedicated rehearsal database rather than deleting unrelated mappings.

Existing permissions remain. Later role mappings or application additions can widen access without rerunning these scripts. The one-time checks do not provide lasting partner isolation. That remains a production design dependency.

## Verification and recovery plan

Execute these scenarios only when authorized, first on a disposable local database. Retain the commit, private input version, operator, target, per-stage preview/digest, final commit result, and reconciliation evidence. Reports may contain email addresses.

| Scenario | Expected result |
| --- | --- |
| Users on migrated DB without any partners | Example previews two user creates; no partner/app dependency; new accounts have no assigned roles |
| Partners before applications | Example previews two group and two group-role creates; zero app/user writes |
| Applications before partners | Refusal without permanent writes |
| Applications after partners | Three inserts with the one-plus-two ownership split; no user/group/role writes |
| Each preview | Portal counts and serial sequence values unchanged |
| Each identical rerun | Only reuses; existing UUIDs and profile/auth/terms data unchanged |
| Modified CSV after preview | Digest/conflict refusal before permanent inserts |
| Wrong header, duplicate identity, missing reference, deleted record, extra app, wrong target/schema | Failure without committing that operation |
| Forced failure during one apply | That operation rolls back; prior committed operations remain; sequence gaps are allowed |
| Access parameter and one-row CSV modes | Same intended account/role; input source shown; one membership at most; no account/group creation |
| Access with multiple CSV rows or expanded role scope | Refusal without a new assignment |
| Portal checks | Controlled users sign in, accept terms, finish profile/department setup, see all three apps, and exercise environment creation |
| Unassigned account | No application access; shared-role behavior is not evidence of individual partner isolation |

There is no generic undo script for a committed operation. Use the disposable database's reset/restore process locally. Before shared test, arrange and rehearse snapshot recovery. Recovery must distinguish pre-existing data from the inserted rows and account for later writes; never delete by department, role, or display name.

## Production follow-up

Carry the procedure into production planning, not this fictional dataset unchanged. Complete issue 208's source mappings, resolve individual partner/application membership, extend the scripts for real environment and IBM configuration, and rehearse the final format in an equivalent non-production target. Credential pages still depend on legacy RP/IBM data. Arrange schema migrations separately; the IAM runtime database role lacks schema-migration ownership.

Issues 209 and 224 need actual execution and user-flow evidence before completion. This preparation does not execute the production migration in issue 210.
