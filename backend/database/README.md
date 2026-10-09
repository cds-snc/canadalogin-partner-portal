# Database operations

[scripts/](scripts/README.md) contains operator-run PostgreSQL data scripts. Each operation has its own folder with SQL, a blank CSV template, an example CSV, and usage instructions.

Schema changes remain in [src/migrations/](../src/migrations/README.md) and run through Alembic. Application database connection code remains in `src/app/core/db/`. These operator scripts neither replace migrations nor run automatically at application startup.

Start with the [partner data workflow](scripts/README.md) for the local and shared-test rehearsal associated with issues 209 and 224.
