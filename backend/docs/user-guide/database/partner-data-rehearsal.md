# Partner data loading rehearsal

Use the [database operating guide](../../../database/README.md) and its single [load_test_data.sql](../../../database/load_test_data.sql) file for [planning issue 1043](https://github.com/cds-snc/canadalogin-planning/issues/1043). The guide contains the editable-data instructions, migration prerequisites, and CloudShell commands. Running the seed commits a one-time load of three users, two partners, and three applications.

Test the unregistered account before loading. After normal onboarding, user 1 has no applications and users 2 and 3 both see all three through the shared Developer role. Separate per-user partner scope, a one-application stage, and environment/IBM provisioning are outside this seed.

No successful load has been verified. This change involved no agent execution of scripts, tests, migrations, or database operations.
