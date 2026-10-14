-- Standalone application import: hand off this file and completed applications.csv.
-- CSV header: uuid,partner_group_uuid,name_en,name_fr
-- Requires PostgreSQL 13+, a migrated portal schema compatible with
-- 0012_partner_developer_write and existing active parent partner groups.
-- No Alembic revision is enforced. User accounts and role mappings are not required.
-- From the directory containing this SQL and CSV, using normal host/user/auth
-- settings (or -h HOST -U USER):
--   Preview: psql -X -d YOUR_DATABASE -f insert_applications.sql
--   Apply:   psql -X -d YOUR_DATABASE -v apply=true -f insert_applications.sql
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

CREATE TEMP TABLE _csv_applications (uuid text, partner_group_uuid text, name_en text, name_fr text) ON COMMIT DROP;
\copy _csv_applications FROM 'applications.csv' WITH (FORMAT csv, HEADER false, ENCODING 'UTF8')
SELECT pg_temp.assert_true(
  (SELECT count(*) = 1 FROM _csv_applications
   WHERE (uuid, partner_group_uuid, name_en, name_fr) = ('uuid', 'partner_group_uuid', 'name_en', 'name_fr')),
  'applications.csv must contain exactly one header: uuid,partner_group_uuid,name_en,name_fr.');
DELETE FROM _csv_applications
  WHERE (uuid, partner_group_uuid, name_en, name_fr) = ('uuid', 'partner_group_uuid', 'name_en', 'name_fr');

CREATE TEMP TABLE _input_applications (
  uuid uuid PRIMARY KEY,
  partner_group_uuid uuid NOT NULL,
  name_en varchar(256) NOT NULL CHECK (btrim(name_en) <> ''),
  name_fr varchar(256) CHECK (name_fr IS NULL OR btrim(name_fr) <> '')
) ON COMMIT DROP;
INSERT INTO _input_applications SELECT uuid::uuid, partner_group_uuid::uuid, name_en, name_fr FROM _csv_applications;

CREATE TEMP TABLE _parents ON COMMIT DROP AS
SELECT g.id, g.uuid, g.name_en, g.name_fr, g.is_deleted, g.deleted_at
FROM public.partner_group g
JOIN (SELECT DISTINCT partner_group_uuid FROM _input_applications) i ON i.partner_group_uuid = g.uuid;
SELECT pg_temp.assert_true(
  (SELECT count(*) FROM _parents) = (SELECT count(DISTINCT partner_group_uuid) FROM _input_applications)
  AND NOT EXISTS (SELECT 1 FROM _parents WHERE is_deleted OR deleted_at IS NOT NULL),
  'Every input partner UUID must identify an existing active group. Complete partner setup for missing groups first.');
SELECT pg_temp.assert_true(NOT EXISTS (
  SELECT 1 FROM _input_applications i JOIN public.application a ON a.uuid = i.uuid
  JOIN _parents g ON g.uuid = i.partner_group_uuid
  WHERE a.is_deleted OR a.deleted_at IS NOT NULL OR a.partner_group_id IS DISTINCT FROM g.id
    OR a.name_en IS DISTINCT FROM i.name_en OR a.name_fr IS DISTINCT FROM i.name_fr),
  'An existing application is deleted or conflicts with the input or expected partner.');

CREATE TEMP TABLE _application_plan (kind text, key text, action text, details jsonb) ON COMMIT DROP;
INSERT INTO _application_plan
SELECT 'application', i.uuid::text, CASE WHEN a.id IS NULL THEN 'create' ELSE 'reuse' END,
  jsonb_build_object('input', to_jsonb(i), 'parentId', g.id, 'parentUuid', g.uuid,
    'parentNameEn', g.name_en, 'parentNameFr', g.name_fr, 'existingId', a.id, 'existingParentId', a.partner_group_id)
FROM _input_applications i JOIN _parents g ON g.uuid = i.partner_group_uuid
LEFT JOIN public.application a ON a.uuid = i.uuid;

-- No user or role mapping is required or created here. Report the existing
-- Developer users who can see applications through the portal's current joins.
CREATE TEMP TABLE _existing_developers ON COMMIT DROP AS
SELECT g.uuid AS partner_group_uuid, u.id AS user_id, u.uuid AS user_uuid, u.email,
       ur.id AS user_role_id, ur.uuid AS user_role_uuid,
       gr.id AS group_role_id, gr.uuid AS group_role_uuid, r.id AS role_id, r.uuid AS role_uuid
FROM _parents g JOIN public.partner_group_role gr ON gr.partner_group_id = g.id
JOIN public.role r ON r.id = gr.role_id
JOIN public.user_role ur ON ur.role_id = r.id
JOIN public."user" u ON u.id = ur.user_id
WHERE r.name = 'Partner Developer' AND NOT r.is_deleted AND NOT gr.is_deleted
  AND NOT ur.is_deleted AND NOT u.is_deleted;
SELECT kind, key, action, details FROM _application_plan ORDER BY key;
SELECT 'create' AS action, count(*) FILTER (WHERE action = 'create') AS row_count FROM _application_plan
UNION ALL SELECT 'reuse', count(*) FILTER (WHERE action = 'reuse') FROM _application_plan;
SELECT 'Existing Developer users listed below can see the input applications through their partner role mappings.' AS access_notice;
SELECT partner_group_uuid, email AS existing_developer_email FROM _existing_developers ORDER BY partner_group_uuid, email;

\if :_apply
  INSERT INTO public.application (partner_group_id, name_en, name_fr, uuid, created_at, is_deleted)
  SELECT g.id, i.name_en, i.name_fr, i.uuid, CURRENT_TIMESTAMP, false
  FROM _input_applications i JOIN _parents g ON g.uuid = i.partner_group_uuid
  WHERE NOT EXISTS (SELECT 1 FROM public.application a WHERE a.uuid = i.uuid);
  SELECT pg_temp.assert_true(
    (SELECT count(*) FROM public.application a JOIN _parents g ON g.id = a.partner_group_id
      JOIN _input_applications i ON i.uuid = a.uuid AND i.partner_group_uuid = g.uuid
      WHERE NOT a.is_deleted AND a.deleted_at IS NULL
        AND a.name_en IS NOT DISTINCT FROM i.name_en AND a.name_fr IS NOT DISTINCT FROM i.name_fr)
      = (SELECT count(*) FROM _input_applications),
    'Application count or ownership reconciliation failed.');
  SELECT a.uuid AS application_uuid, g.uuid AS partner_uuid, a.name_en, a.name_fr
  FROM public.application a JOIN _input_applications i ON i.uuid = a.uuid
  JOIN _parents g ON g.id = a.partner_group_id ORDER BY a.uuid;
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
