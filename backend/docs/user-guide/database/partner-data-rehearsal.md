# Partner data loading rehearsal

Operator SQL now lives in [backend/database/scripts](../../../database/scripts/README.md). Each operation has a SQL script, a blank CSV template, an example CSV, and its own README:

1. [Insert users](../../../database/scripts/users/README.md).
2. [Set up partners](../../../database/scripts/partners/README.md).
3. [Insert applications](../../../database/scripts/applications/README.md).
4. [Assign access by email or CSV](../../../database/scripts/access/README.md).

The example uses two fictional partners with one application under the first and two under the second. These are sample counts: partner/application imports accept any number of CSV rows, with relationships supplied by application parent UUIDs. Access assignment uses the same CSV formats to declare the full intended scope and checks it against the current shared role.

Each SQL script is self-contained: hand off that file and its required CSV inputs to the SRE without a repository checkout or other SQL files. Opening comments explain the prerequisites and commands. Run from the folder containing the SQL and CSVs. Preview is the default; add `-v apply=true` to insert and commit. Each run validates its current input and database state. Each operation has its own transaction, so a later failure does not roll back earlier committed operations.

See the [shared guide](../../../database/scripts/README.md) for prerequisites, scope limitations, verification scenarios, recovery, and production follow-up for issues 209 and 224. Individual user-to-partner/application membership remains a dependency; current access uses shared global roles.

These files are prepared only. No SQL, migrations, database operations, or tests have been executed.
