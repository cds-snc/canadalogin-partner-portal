-- Standalone partner setup: hand off this file and the completed partners.csv.
-- CSV header: uuid,department_gc_org_id,name_en,name_fr
-- Requires PostgreSQL 13+, a migrated portal schema compatible with
-- 0012_partner_developer_write, active referenced departments and the existing
-- Partner Developer role. No Alembic revision is enforced by this script.
-- From the directory containing this SQL and CSV, using normal host/user/auth
-- settings (or -h HOST -U USER):
--   Preview: psql -X -d YOUR_DATABASE -f setup_partners.sql
--   Apply:   psql -X -d YOUR_DATABASE -v apply=true -f setup_partners.sql
-- Use a fresh psql process for each invocation. This script owns its transaction;
-- do not use -1/--single-transaction or an outer BEGIN. No other SQL files needed.

\set ON_ERROR_STOP on
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
                          'These scripts require PostgreSQL 13 or newer.');
-- Connection settings select the target. No environment is inferred from its name.
\conninfo
SELECT CASE WHEN :'_apply'::boolean THEN 'APPLY' ELSE 'PREVIEW' END AS mode;

CREATE TEMP TABLE _csv_partners (uuid text, department_gc_org_id text, name_en text, name_fr text) ON COMMIT DROP;
\copy _csv_partners FROM 'partners.csv' WITH (FORMAT csv, HEADER false, ENCODING 'UTF8')
SELECT pg_temp.assert_true(
  (SELECT count(*) = 1 FROM _csv_partners
   WHERE (uuid, department_gc_org_id, name_en, name_fr) = ('uuid', 'department_gc_org_id', 'name_en', 'name_fr')),
  'partners.csv must contain exactly one header: uuid,department_gc_org_id,name_en,name_fr.');
DELETE FROM _csv_partners
  WHERE (uuid, department_gc_org_id, name_en, name_fr) = ('uuid', 'department_gc_org_id', 'name_en', 'name_fr');

CREATE TEMP TABLE _input_partners (
  uuid uuid PRIMARY KEY,
  department_gc_org_id integer NOT NULL CHECK (department_gc_org_id > 0),
  name_en varchar(256) NOT NULL CHECK (btrim(name_en) <> ''),
  name_fr varchar(256) CHECK (name_fr IS NULL OR btrim(name_fr) <> '')
) ON COMMIT DROP;
INSERT INTO _input_partners SELECT uuid::uuid, department_gc_org_id::integer, name_en, name_fr FROM _csv_partners;

CREATE TEMP TABLE _departments ON COMMIT DROP AS
SELECT d.* FROM public.department d
JOIN (SELECT DISTINCT department_gc_org_id FROM _input_partners) i ON d.gc_org_id = i.department_gc_org_id;
SELECT pg_temp.assert_true(
  (SELECT count(*) FROM _departments) = (SELECT count(DISTINCT department_gc_org_id) FROM _input_partners)
  AND NOT EXISTS (SELECT 1 FROM _departments WHERE is_deleted OR deleted_at IS NOT NULL),
  'Each partner must reference an existing active department catalog entry.');
CREATE TEMP TABLE _developer_role ON COMMIT DROP AS
SELECT * FROM public.role WHERE name = 'Partner Developer' AND EXISTS (SELECT 1 FROM _input_partners);
SELECT pg_temp.assert_true(
  NOT EXISTS (SELECT 1 FROM _input_partners)
  OR ((SELECT count(*) = 1 FROM _developer_role)
      AND NOT EXISTS (SELECT 1 FROM _developer_role WHERE is_deleted OR deleted_at IS NOT NULL)),
  'The active Partner Developer role must already exist.');

SELECT pg_temp.assert_true(NOT EXISTS (
  SELECT 1 FROM _input_partners i JOIN public.partner_group g ON g.uuid = i.uuid
  JOIN _departments d ON d.gc_org_id = i.department_gc_org_id
  WHERE g.is_deleted OR g.deleted_at IS NOT NULL OR g.department_id IS DISTINCT FROM d.id
    OR g.name_en IS DISTINCT FROM i.name_en OR g.name_fr IS DISTINCT FROM i.name_fr),
  'An existing partner is deleted or conflicts with the input.');
SELECT pg_temp.assert_true(NOT EXISTS (
  SELECT 1 FROM public.partner_group_role m JOIN public.partner_group g ON g.id = m.partner_group_id
  JOIN _input_partners i ON i.uuid = g.uuid JOIN _developer_role r ON r.id = m.role_id
  WHERE m.is_deleted OR m.deleted_at IS NOT NULL),
  'An existing group-role mapping is deleted; it will not be restored.');

-- Adding a group-role link can expose every active application already under an
-- input partner. Report that scope before inserting the links.
CREATE TEMP TABLE _existing_applications ON COMMIT DROP AS
SELECT a.id, a.uuid, a.name_en, a.name_fr, a.deleted_at, g.uuid AS partner_group_uuid
FROM public.application a JOIN public.partner_group g ON g.id = a.partner_group_id
JOIN _input_partners i ON i.uuid = g.uuid WHERE NOT a.is_deleted;
SELECT pg_temp.assert_true(NOT EXISTS (
  SELECT 1 FROM _existing_applications WHERE deleted_at IS NOT NULL),
  'An input partner contains an active application with inconsistent deletion flags. No access mapping will be added.');

CREATE TEMP TABLE _partner_plan (kind text, key text, action text, details jsonb) ON COMMIT DROP;
INSERT INTO _partner_plan
SELECT 'partner', i.uuid::text, CASE WHEN g.id IS NULL THEN 'create' ELSE 'reuse' END,
  jsonb_build_object('input', to_jsonb(i), 'departmentId', d.id, 'departmentUuid', d.uuid, 'existingId', g.id)
FROM _input_partners i JOIN _departments d ON d.gc_org_id = i.department_gc_org_id
LEFT JOIN public.partner_group g ON g.uuid = i.uuid;
INSERT INTO _partner_plan
SELECT 'partnerGroupRole', i.uuid::text, CASE WHEN m.id IS NULL THEN 'create' ELSE 'reuse' END,
  jsonb_build_object('partnerUuid', i.uuid, 'roleName', r.name, 'roleId', r.id, 'roleUuid', r.uuid,
                    'existingId', m.id, 'existingUuid', m.uuid)
FROM _input_partners i CROSS JOIN _developer_role r
LEFT JOIN public.partner_group g ON g.uuid = i.uuid
LEFT JOIN public.partner_group_role m ON m.partner_group_id = g.id AND m.role_id = r.id;

-- Match the portal's active-role visibility rules when reporting affected users.
CREATE TEMP TABLE _existing_developers ON COMMIT DROP AS
SELECT u.id, u.uuid, u.email, m.id AS membership_id, m.uuid AS membership_uuid
FROM public."user" u JOIN public.user_role m ON m.user_id = u.id
JOIN _developer_role r ON r.id = m.role_id WHERE NOT u.is_deleted AND NOT m.is_deleted;
SELECT kind, key, action, details FROM _partner_plan ORDER BY kind, key;
SELECT 'create' AS action, count(*) FILTER (WHERE action = 'create') AS row_count FROM _partner_plan
UNION ALL SELECT 'reuse', count(*) FILTER (WHERE action = 'reuse') FROM _partner_plan;
SELECT 'Existing holders of the global Partner Developer role can see applications in the input partners.' AS access_notice;
SELECT email AS existing_developer_email FROM _existing_developers ORDER BY email;
SELECT uuid AS existing_application_uuid, partner_group_uuid, name_en, name_fr FROM _existing_applications ORDER BY uuid;

\if :_apply
  INSERT INTO public.partner_group (department_id, name_en, name_fr, uuid, created_at, is_deleted)
  SELECT d.id, i.name_en, i.name_fr, i.uuid, CURRENT_TIMESTAMP, false
  FROM _input_partners i JOIN _departments d ON d.gc_org_id = i.department_gc_org_id
  WHERE NOT EXISTS (SELECT 1 FROM public.partner_group g WHERE g.uuid = i.uuid);
  INSERT INTO public.partner_group_role (partner_group_id, role_id, uuid, created_at, is_deleted)
  SELECT g.id, r.id, gen_random_uuid(), CURRENT_TIMESTAMP, false
  FROM _input_partners i JOIN public.partner_group g ON g.uuid = i.uuid CROSS JOIN _developer_role r
  WHERE NOT EXISTS (SELECT 1 FROM public.partner_group_role m WHERE m.partner_group_id = g.id AND m.role_id = r.id);
  SELECT pg_temp.assert_true(
    (SELECT count(*) FROM public.partner_group g JOIN _input_partners i ON i.uuid = g.uuid
     JOIN _departments d ON d.gc_org_id = i.department_gc_org_id
     WHERE NOT g.is_deleted AND g.deleted_at IS NULL AND g.department_id = d.id
       AND g.name_en IS NOT DISTINCT FROM i.name_en AND g.name_fr IS NOT DISTINCT FROM i.name_fr)
      = (SELECT count(*) FROM _input_partners),
    'Partner reconciliation failed.');
  SELECT pg_temp.assert_true(
    (SELECT count(*) FROM public.partner_group_role m JOIN public.partner_group g ON g.id = m.partner_group_id
     JOIN _input_partners i ON i.uuid = g.uuid JOIN _developer_role r ON r.id = m.role_id
     WHERE NOT m.is_deleted AND m.deleted_at IS NULL) = (SELECT count(*) FROM _input_partners),
    'Group-role reconciliation failed.');
  SELECT g.uuid AS partner_uuid, g.name_en, g.name_fr, d.gc_org_id AS department_gc_org_id,
         m.uuid AS developer_mapping_uuid
  FROM public.partner_group g JOIN _input_partners i ON i.uuid = g.uuid
  JOIN public.department d ON d.id = g.department_id
  JOIN public.partner_group_role m ON m.partner_group_id = g.id
  JOIN _developer_role r ON r.id = m.role_id ORDER BY g.uuid;
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
