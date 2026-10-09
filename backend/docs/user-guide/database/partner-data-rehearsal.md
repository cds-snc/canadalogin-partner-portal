# Partner data loading rehearsal

Operator SQL now lives in [backend/database/scripts](../../../database/scripts/README.md). Each operation has a SQL script, a blank CSV template, an example CSV, and its own README:

1. [Insert users](../../../database/scripts/users/README.md).
2. [Set up partners](../../../database/scripts/partners/README.md).
3. [Insert applications](../../../database/scripts/applications/README.md).
4. [Assign access by email or CSV](../../../database/scripts/access/README.md).

The rehearsal still uses two fictional partners with one application under the first and two under the second. Each operation has its own preview, digest and transaction; a later failure does not roll back earlier committed operations.

See the [shared guide](../../../database/scripts/README.md) for prerequisites, scope limitations, verification scenarios, recovery, and production follow-up for issues 209 and 224. Individual user-to-partner/application membership remains a dependency; current access uses shared global roles.

These files are prepared only. No SQL, migrations, database operations, or tests have been executed.
