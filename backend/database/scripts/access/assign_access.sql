-- Standalone role assignment; hand off this SQL file and the required CSVs.
-- UTF-8 files and headers:
--   access.csv:       email,role (exactly one account; omit with -v email=...)
--   partners.csv:     uuid,department_gc_org_id,name_en,name_fr (always required)
--   applications.csv: uuid,partner_group_uuid,name_en,name_fr (always required)
-- Requires PostgreSQL 13+ and a compatible, already-migrated Partner Portal schema.
-- The account, Developer role/read-write policies and partner-group mappings must
-- already exist. The scope CSVs must match that role's complete current access.
-- Use a fresh psql process from the directory holding this SQL and its CSVs.
-- This script owns its transaction; do not use -1/--single-transaction or an outer BEGIN.
-- Select host/auth normally (for example -h HOST -U USER); verify \conninfo.
-- Preview: psql -X -d YOUR_DATABASE -f assign_access.sql
-- Apply:   psql -X -d YOUR_DATABASE -v apply=true -f assign_access.sql
-- Email alternative: add -v email='person@example.com'; scope CSVs still required.
-- This GLOBAL role can expand access after later group/app changes.
-- This command never creates users or group links.
\set ON_ERROR_STOP on
\if :{?email}
  \set _parameter_input true
\else
  \set _parameter_input false
\endif
\if :{?role}
\else
  \set role 'Partner Developer'
\endif
\pset pager off
\if :{?apply}
\else
  \set apply false
\endif
-- Let PostgreSQL validate the boolean before psql uses it as a condition.
SELECT :'apply'::boolean AS _apply \gset

BEGIN ISOLATION LEVEL SERIALIZABLE;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';
SET LOCAL idle_in_transaction_session_timeout = '60s';
SET LOCAL search_path = pg_catalog, pg_temp;
SET LOCAL timezone = 'UTC';

-- Session-local helper: failed validation aborts this operation.
CREATE FUNCTION pg_temp.assert_true(condition boolean, message text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF condition IS DISTINCT FROM TRUE THEN
    RAISE EXCEPTION '%', message;
  END IF;
END;
$$;

SELECT pg_temp.assert_true(current_setting('server_version_num')::integer >= 130000,
                          'This script requires PostgreSQL 13 or newer.');
-- Connection settings select the target. No environment is inferred from its name.
\conninfo
SELECT CASE WHEN :'_apply'::boolean THEN 'APPLY' ELSE 'PREVIEW' END AS mode;

CREATE TEMP TABLE _access_input (email text, role_name text, input_source text) ON COMMIT DROP;
\if :_parameter_input
  -- Parameter mode skips access.csv only; the scope CSVs below remain required.
  INSERT INTO _access_input SELECT lower(btrim(:'email')), :'role'::text, 'parameter';
\else
  CREATE TEMP TABLE _csv_access (email text, role text) ON COMMIT DROP;
  \copy _csv_access FROM 'access.csv' WITH (FORMAT csv, HEADER false, ENCODING 'UTF8')
  SELECT pg_temp.assert_true(
    (SELECT count(*) = 1 FROM _csv_access WHERE (email, role) = ('email', 'role')),
    'access.csv must contain exactly one header: email,role.');
  DELETE FROM _csv_access WHERE (email, role) = ('email', 'role');
  SELECT pg_temp.assert_true((SELECT count(*) = 1 FROM _csv_access),
    'access.csv must contain exactly one account. Use a separate preview/apply per email.');
  INSERT INTO _access_input SELECT lower(btrim(email)), role, 'csv' FROM _csv_access;
\endif
SELECT pg_temp.assert_true(
  (SELECT email <> '' AND email ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
   FROM _access_input), 'A valid existing user email is required.');
SELECT pg_temp.assert_true(
  (SELECT role_name = 'Partner Developer' FROM _access_input),
  'Only Partner Developer is supported by this test-access rehearsal.');

-- Reuse the operator's partner/application CSVs as an explicit scope selection.
-- Names and department fields are read for the standard CSV shape, but only
-- UUIDs and application ownership select access; partner/application data is not changed.
CREATE TEMP TABLE _csv_expected_groups (
  uuid text, department_gc_org_id text, name_en text, name_fr text
) ON COMMIT DROP;
CREATE TEMP TABLE _csv_expected_applications (
  uuid text, partner_group_uuid text, name_en text, name_fr text
) ON COMMIT DROP;
\copy _csv_expected_groups FROM 'partners.csv' WITH (FORMAT csv, HEADER false, ENCODING 'UTF8')
\copy _csv_expected_applications FROM 'applications.csv' WITH (FORMAT csv, HEADER false, ENCODING 'UTF8')
SELECT pg_temp.assert_true(
  (SELECT count(*) = 1 FROM _csv_expected_groups
   WHERE (uuid, department_gc_org_id, name_en, name_fr) = ('uuid', 'department_gc_org_id', 'name_en', 'name_fr')),
  'partners.csv must contain the exact documented header once.');
SELECT pg_temp.assert_true(
  (SELECT count(*) = 1 FROM _csv_expected_applications
   WHERE (uuid, partner_group_uuid, name_en, name_fr) = ('uuid', 'partner_group_uuid', 'name_en', 'name_fr')),
  'applications.csv must contain the exact documented header once.');
DELETE FROM _csv_expected_groups
WHERE (uuid, department_gc_org_id, name_en, name_fr) = ('uuid', 'department_gc_org_id', 'name_en', 'name_fr');
DELETE FROM _csv_expected_applications
WHERE (uuid, partner_group_uuid, name_en, name_fr) = ('uuid', 'partner_group_uuid', 'name_en', 'name_fr');
CREATE TEMP TABLE _expected_groups (uuid uuid PRIMARY KEY) ON COMMIT DROP;
CREATE TEMP TABLE _expected_applications (
  uuid uuid PRIMARY KEY, partner_group_uuid uuid NOT NULL REFERENCES _expected_groups(uuid)
) ON COMMIT DROP;
INSERT INTO _expected_groups SELECT uuid::uuid FROM _csv_expected_groups;
INSERT INTO _expected_applications SELECT uuid::uuid, partner_group_uuid::uuid FROM _csv_expected_applications;
SELECT pg_temp.assert_true(
  (SELECT count(*) > 0 FROM _expected_groups),
  'Select at least one intended partner in partners.csv before assigning a global role.');

CREATE TEMP TABLE _access_user AS
SELECT u.id, u.uuid, u.email, u.is_deleted, u.deleted_at
FROM public."user" AS u
JOIN _access_input AS i ON lower(btrim(u.email)) = i.email;
SELECT pg_temp.assert_true(
  (SELECT count(*) = 1 FROM _access_user),
  'The email must identify exactly one existing portal user. Import the account first.');
SELECT pg_temp.assert_true(
  (SELECT NOT is_deleted AND deleted_at IS NULL FROM _access_user),
  'The user is soft-deleted; this command will not restore it.');

CREATE TEMP TABLE _access_role AS
SELECT r.id, r.uuid, r.name, r.is_deleted, r.deleted_at
FROM public.role AS r JOIN _access_input AS i ON r.name = i.role_name;
SELECT pg_temp.assert_true(
  (SELECT count(*) = 1 FROM _access_role), 'Partner Developer role was not found.');
SELECT pg_temp.assert_true(
  (SELECT NOT is_deleted AND deleted_at IS NULL FROM _access_role),
  'Partner Developer role is soft-deleted.');

CREATE TEMP TABLE _access_policies AS
SELECT id, uuid, action, deleted_at FROM public.access_policy
WHERE subject = 'Partner Developer' AND resource = 'applications'
  AND action IN ('read', 'write') AND NOT is_deleted;
SELECT pg_temp.assert_true(
  (SELECT count(*) = 2 AND count(DISTINCT action) = 2 FROM _access_policies)
  AND NOT EXISTS (SELECT 1 FROM _access_policies WHERE deleted_at IS NOT NULL),
  'Exactly one active Developer applications/read policy and one applications/write policy must exist.');

-- The portal checks is_deleted, not deleted_at. Include all rows it can see,
-- then explicitly reject inconsistent lifecycle flags instead of hiding them.
CREATE TEMP TABLE _scope_groups AS
SELECT g.id, g.uuid, g.name_en, g.name_fr, g.deleted_at,
  m.id AS mapping_id, m.uuid AS mapping_uuid, m.deleted_at AS mapping_deleted_at
FROM public.partner_group AS g
JOIN public.partner_group_role AS m ON m.partner_group_id = g.id
JOIN _access_role AS r ON r.id = m.role_id
WHERE NOT g.is_deleted AND NOT m.is_deleted;
SELECT pg_temp.assert_true(
  NOT EXISTS (SELECT 1 FROM _scope_groups WHERE deleted_at IS NOT NULL OR mapping_deleted_at IS NOT NULL),
  'An accessible partner group or role link has inconsistent deletion flags.');
SELECT pg_temp.assert_true(
  (SELECT count(*) FROM _scope_groups) = (SELECT count(*) FROM _expected_groups)
  AND NOT EXISTS (SELECT uuid FROM _scope_groups EXCEPT SELECT uuid FROM _expected_groups)
  AND NOT EXISTS (SELECT uuid FROM _expected_groups EXCEPT SELECT uuid FROM _scope_groups),
  'Partner Developer must link to exactly the partners selected in partners.csv; extra or missing links prevent assignment.');

CREATE TEMP TABLE _scope_applications AS
SELECT a.id, a.uuid, a.partner_group_id, g.uuid AS partner_group_uuid,
  a.name_en, a.name_fr, a.deleted_at
FROM public.application AS a JOIN _scope_groups AS g ON g.id = a.partner_group_id
WHERE NOT a.is_deleted;
SELECT pg_temp.assert_true(
  NOT EXISTS (SELECT 1 FROM _scope_applications WHERE deleted_at IS NOT NULL),
  'An accessible application has inconsistent deletion flags.');
SELECT pg_temp.assert_true(
  (SELECT count(*) FROM _scope_applications) = (SELECT count(*) FROM _expected_applications)
  AND NOT EXISTS (
    SELECT uuid, partner_group_uuid FROM _scope_applications
    EXCEPT SELECT uuid, partner_group_uuid FROM _expected_applications)
  AND NOT EXISTS (
    SELECT uuid, partner_group_uuid FROM _expected_applications
    EXCEPT SELECT uuid, partner_group_uuid FROM _scope_applications),
  'Accessible applications and their parents must exactly match applications.csv; extra, missing or moved applications prevent assignment.');

CREATE TEMP TABLE _access_membership AS
SELECT m.id, m.uuid, m.is_deleted, m.deleted_at
FROM public.user_role AS m
JOIN _access_user AS u ON u.id = m.user_id
JOIN _access_role AS r ON r.id = m.role_id;
SELECT pg_temp.assert_true(
  (SELECT count(*) <= 1 FROM _access_membership), 'Multiple user-role assignments were found.');
SELECT pg_temp.assert_true(
  NOT EXISTS (SELECT 1 FROM _access_membership WHERE is_deleted OR deleted_at IS NOT NULL),
  'The user-role assignment is soft-deleted; this command will not restore it.');

CREATE TEMP TABLE _access_plan AS
SELECT i.email, i.input_source, u.uuid AS user_uuid, u.id AS user_id, r.name AS role_name,
  r.uuid AS role_uuid, r.id AS role_id,
  CASE WHEN m.id IS NULL THEN 'create' ELSE 'reuse' END AS action,
  m.id AS membership_id, m.uuid AS membership_uuid
FROM _access_input AS i CROSS JOIN _access_user AS u CROSS JOIN _access_role AS r
LEFT JOIN _access_membership AS m ON true;

SELECT email, input_source, user_uuid, role_name, action AS proposed_action FROM _access_plan;
SELECT uuid AS partner_group_uuid, name_en, name_fr FROM _scope_groups ORDER BY uuid;
SELECT uuid AS application_uuid, partner_group_uuid, name_en, name_fr FROM _scope_applications ORDER BY uuid;
SELECT 'This global role currently covers exactly the partners and applications selected in the scope CSVs. '
  'Later group/app changes can expand access; existing user permissions are retained.' AS scope_notice;
\if :_apply
  INSERT INTO public.user_role (user_id, role_id, uuid, created_at, updated_at, deleted_at, is_deleted)
  SELECT user_id, role_id, gen_random_uuid(), now(), NULL, NULL, false
  FROM _access_plan WHERE action = 'create';
  SELECT pg_temp.assert_true(
    (SELECT count(*) = 1 FROM public.user_role m
     JOIN _access_plan p ON p.user_id = m.user_id AND p.role_id = m.role_id
     WHERE NOT m.is_deleted AND m.deleted_at IS NULL), 'User-role reconciliation failed.');
\endif
-- Finish this operation only. Earlier committed operations remain committed.
-- ON_ERROR_STOP prevents reaching COMMIT after a SQL or COPY failure.
\if :_apply
  COMMIT;
  \echo 'APPLIED: transaction committed. Retain the report and run a fresh preview to reconcile.'
\else
  ROLLBACK;
  \echo 'PREVIEW ONLY: no permanent inserts or sequence calls were performed.'
\endif
