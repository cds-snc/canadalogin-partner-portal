# Assign partner access

`assign_access.sql` assigns the existing `Partner Developer` role to one active portal account. It checks that the role's complete current partner/application access matches the scope you selected in `partners.csv` and `applications.csv`. It creates at most one `user_role` row; it never creates accounts, partners, applications, or group mappings.

Hand off `assign_access.sql`, `partners.csv`, `applications.csv` and either a one-row `access.csv` or the intended email parameter. This README is optional; no repository checkout or other SQL files are required.

Use PostgreSQL 13+ with a compatible, already-migrated Partner Portal schema. The active portal account, `Partner Developer` role, its applications/read and applications/write policies, and the intended partner-group mappings must already exist. Use an operator account authorized to read this data and insert user-role assignments. No scripts or tests have been executed during preparation.

## Inputs

| File | Purpose |
| --- | --- |
| `access.csv` | Blank template with `email,role` header |
| `access.example.csv` | One fictional account and `Partner Developer` |
| `partners.csv` | Required in both modes; selects the full intended partner UUID set |
| `applications.csv` | Required in both modes; selects the full intended application UUIDs and parent UUIDs |
| `assign_access.sql` | Preview/apply entry point |

Use either an email parameter or a one-row account CSV. If `email` is supplied, the script **skips only `access.csv`**; the parameter `role` defaults to `Partner Developer`. Without `email`, it reads `access.csv` in the working directory, using its role value. Both modes always read `partners.csv` and `applications.csv` from that directory. Multiple account rows, an empty account template, and any other role are rejected. Preview and apply separately for each email, keeping the input unchanged.

The scope files keep their existing headers: `uuid,department_gc_org_id,name_en,name_fr` for partners and `uuid,partner_group_uuid,name_en,name_fr` for applications. Access selection uses only the UUIDs and application parent UUIDs. Names and department fields are ignored by this command; displayed names come from the database. Partner and application UUIDs must each be unique and nonnull, and each application must reference a selected partner.

Select at least one partner. A header-only `applications.csv` explicitly selects zero applications. There is no fixed count or built-in UUID allowlist. The examples contain two partners and three applications as sample data only. Use CSVs describing the **full intended access scope**, including existing records where necessary. Do not infer the intended selection from whatever happens to be in the database.

Email is trimmed and lowercased, then must identify one active existing account. The example does not create a working OIDC identity. Keep real account lists private.

## Prepare the working directory

Place the SQL file and reviewed CSVs in the same private directory, then open a shell in that directory. Both modes require `partners.csv` and `applications.csv`. CSV account mode also requires `access.csv`. Use a fresh `psql -X` process for each run.

If using example files for a rehearsal, save them under these required filenames. Keep the reviewed scope and account files unchanged between preview and apply.

## Parameter mode

Replace the target and example email with the intended account. Configure the connection normally, adding `-h HOST` and `-U USER` when needed. Preview is the default and rolls back temporary staging without permanent changes:

```bash
psql -X -d YOUR_DATABASE \
  -v email='partner.one@example.com' \
  -f assign_access.sql

# Apply after reviewing the displayed account and full access scope.
psql -X -d YOUR_DATABASE -v apply=true \
  -v email='partner.one@example.com' \
  -f assign_access.sql
```

## CSV mode

Use the prepared `access.csv` with its header and exactly one account. Do not supply `email` or `role` command parameters in this mode. The same prepared scope CSVs are required.

```bash
psql -X -d YOUR_DATABASE -f assign_access.sql

psql -X -d YOUR_DATABASE -v apply=true -f assign_access.sql
```

Every run revalidates the account, scope CSVs and database state. Apply is not bound to an earlier preview and does not freeze tables: keep the target quiet while applying, especially partner mappings and applications. Check the final commit message, then rerun the preview with the same input; it must report `reuse`. Do not re-copy examples over edited working files between preview and apply.

## Scope and refusals

The current schema assigns a **global role**, so it cannot limit an individual user to a subset of that role's partners or applications. If the role reaches anything beyond the CSV selection, the script refuses the grant. Missing active groups/apps, incorrect application parents, deleted or ambiguous users, deleted assignments, and missing or duplicate Developer read/write policies also cause refusal. It does not silently enlarge the selection or change group mappings to make the grant succeed.

Existing permissions are retained. Future changes to global role mappings or applications can expand access. A failure here does not roll back previously committed user, partner, or application setup.
