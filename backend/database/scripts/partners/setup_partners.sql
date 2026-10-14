-- Import partners.csv and add Partner Developer role links; run beside the CSV.
-- Requires PostgreSQL 13+ and the migrated portal schema.
-- Use a fresh psql process; this script owns its transaction (no -1/outer BEGIN).
-- Preview: psql -X -d YOUR_DATABASE -f setup_partners.sql
-- Apply:   psql -X -d YOUR_DATABASE -v apply=true -f setup_partners.sql

\set ON_ERROR_STOP on
\pset pager off
\if :{?apply}
\else
  \set apply false
\endif
-- Let PostgreSQL validate the boolean before psql uses it as a condition.
SELECT :'apply'::boolean AS should_apply \gset

BEGIN ISOLATION LEVEL SERIALIZABLE;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';
SET LOCAL idle_in_transaction_session_timeout = '60s';
SET LOCAL search_path = pg_catalog, pg_temp;
SET LOCAL timezone = 'UTC';

-- Session-local helper: failed validation aborts this operation.
CREATE FUNCTION pg_temp.require_valid(is_valid boolean, error_message text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF is_valid IS DISTINCT FROM TRUE THEN
    RAISE EXCEPTION '%', error_message;
  END IF;
END;
$$;

SELECT pg_temp.require_valid(current_setting('server_version_num')::integer >= 130000,
                          'These scripts require PostgreSQL 13 or newer.');
-- Connection settings select the target. No environment is inferred from its name.
\conninfo
SELECT CASE WHEN :'should_apply'::boolean THEN 'APPLY' ELSE 'PREVIEW' END AS mode;

-- Check the header before converting values so misplaced columns cannot be imported.
CREATE TEMP TABLE csv_partner_rows (uuid text, department_gc_org_id text, name_en text, name_fr text) ON COMMIT DROP;
\copy csv_partner_rows FROM 'partners.csv' WITH (FORMAT csv, HEADER false, ENCODING 'UTF8')
SELECT pg_temp.require_valid(
  (SELECT count(*) = 1 FROM csv_partner_rows
   WHERE (uuid, department_gc_org_id, name_en, name_fr) = ('uuid', 'department_gc_org_id', 'name_en', 'name_fr')),
  'partners.csv must contain exactly one header: uuid,department_gc_org_id,name_en,name_fr.');
DELETE FROM csv_partner_rows
  WHERE (uuid, department_gc_org_id, name_en, name_fr) = ('uuid', 'department_gc_org_id', 'name_en', 'name_fr');

-- Types and constraints reject invalid values and duplicate UUIDs before writes.
CREATE TEMP TABLE partners_to_import (
  uuid uuid PRIMARY KEY,
  department_gc_org_id integer NOT NULL CHECK (department_gc_org_id > 0),
  name_en varchar(256) NOT NULL CHECK (btrim(name_en) <> ''),
  name_fr varchar(256) CHECK (name_fr IS NULL OR btrim(name_fr) <> '')
) ON COMMIT DROP;
INSERT INTO partners_to_import
SELECT uuid::uuid, department_gc_org_id::integer, name_en, name_fr FROM csv_partner_rows;

-- Resolve existing catalog entries; this import never creates departments or roles.
CREATE TEMP TABLE referenced_departments ON COMMIT DROP AS
SELECT department.id, department.gc_org_id, department.name, department.is_deleted, department.deleted_at
FROM public.department AS department
JOIN (SELECT DISTINCT department_gc_org_id FROM partners_to_import) AS requested_department
  ON department.gc_org_id = requested_department.department_gc_org_id;
SELECT pg_temp.require_valid(
  (SELECT count(*) FROM referenced_departments) = (SELECT count(DISTINCT department_gc_org_id) FROM partners_to_import)
  AND NOT EXISTS (SELECT 1 FROM referenced_departments WHERE is_deleted OR deleted_at IS NOT NULL),
  'Each partner must reference an existing active department catalog entry.');
CREATE TEMP TABLE developer_role ON COMMIT DROP AS
SELECT id, name, is_deleted, deleted_at FROM public.role
WHERE name = 'Partner Developer' AND EXISTS (SELECT 1 FROM partners_to_import);
SELECT pg_temp.require_valid(
  NOT EXISTS (SELECT 1 FROM partners_to_import)
  OR ((SELECT count(*) = 1 FROM developer_role)
      AND NOT EXISTS (SELECT 1 FROM developer_role WHERE is_deleted OR deleted_at IS NOT NULL)),
  'The active Partner Developer role must already exist.');

-- Reruns may reuse exact matches, but must not change or restore existing records.
SELECT pg_temp.require_valid(NOT EXISTS (
  SELECT 1 FROM partners_to_import AS input_partner
  JOIN public.partner_group AS partner ON partner.uuid = input_partner.uuid
  JOIN referenced_departments AS department ON department.gc_org_id = input_partner.department_gc_org_id
  WHERE partner.is_deleted OR partner.deleted_at IS NOT NULL
    OR partner.department_id IS DISTINCT FROM department.id
    OR partner.name_en IS DISTINCT FROM input_partner.name_en
    OR partner.name_fr IS DISTINCT FROM input_partner.name_fr),
  'An existing partner is deleted or conflicts with the input.');
SELECT pg_temp.require_valid(NOT EXISTS (
  SELECT 1 FROM public.partner_group_role AS group_role
  JOIN public.partner_group AS partner ON partner.id = group_role.partner_group_id
  JOIN partners_to_import AS input_partner ON input_partner.uuid = partner.uuid
  JOIN developer_role ON developer_role.id = group_role.role_id
  WHERE group_role.is_deleted OR group_role.deleted_at IS NOT NULL),
  'An existing group-role mapping is deleted; it will not be restored.');

-- A group-role link exposes existing applications to every holder of that role.
CREATE TEMP TABLE existing_partner_applications ON COMMIT DROP AS
SELECT application.uuid, application.name_en, application.name_fr, application.deleted_at,
       partner.uuid AS partner_group_uuid
FROM public.application AS application
JOIN public.partner_group AS partner ON partner.id = application.partner_group_id
JOIN partners_to_import AS input_partner ON input_partner.uuid = partner.uuid
WHERE NOT application.is_deleted;
SELECT pg_temp.require_valid(NOT EXISTS (
  SELECT 1 FROM existing_partner_applications WHERE deleted_at IS NOT NULL),
  'An input partner contains an active application with inconsistent deletion flags. No access mapping will be added.');

CREATE TEMP TABLE partner_import_preview ON COMMIT DROP AS
SELECT input_partner.uuid AS partner_uuid, input_partner.name_en, input_partner.name_fr,
       input_partner.department_gc_org_id, department.name AS department_name,
       CASE WHEN partner.id IS NULL THEN 'create' ELSE 'reuse' END AS partner_action,
       CASE WHEN group_role.id IS NULL THEN 'create' ELSE 'reuse' END AS role_link_action
FROM partners_to_import AS input_partner
JOIN referenced_departments AS department ON department.gc_org_id = input_partner.department_gc_org_id
CROSS JOIN developer_role
LEFT JOIN public.partner_group AS partner ON partner.uuid = input_partner.uuid
LEFT JOIN public.partner_group_role AS group_role
  ON group_role.partner_group_id = partner.id AND group_role.role_id = developer_role.id;

-- Match the portal's active-role visibility rules when reporting affected users.
CREATE TEMP TABLE existing_developers ON COMMIT DROP AS
SELECT portal_user.email
FROM public."user" AS portal_user
JOIN public.user_role AS user_role ON user_role.user_id = portal_user.id
JOIN developer_role ON developer_role.id = user_role.role_id
WHERE NOT portal_user.is_deleted AND NOT user_role.is_deleted;
SELECT * FROM partner_import_preview ORDER BY partner_uuid;
SELECT 'partner' AS record_type,
       count(*) FILTER (WHERE partner_action = 'create') AS create_count,
       count(*) FILTER (WHERE partner_action = 'reuse') AS reuse_count FROM partner_import_preview
UNION ALL
SELECT 'partner_role_link', count(*) FILTER (WHERE role_link_action = 'create'),
       count(*) FILTER (WHERE role_link_action = 'reuse') FROM partner_import_preview;
SELECT 'Existing holders of the global Partner Developer role can see applications in the input partners.' AS access_notice;
SELECT email AS existing_developer_email FROM existing_developers ORDER BY email;
SELECT uuid AS existing_application_uuid, partner_group_uuid, name_en, name_fr FROM existing_partner_applications ORDER BY uuid;

-- Insert only missing records, then verify every input row before committing.
\if :should_apply
  INSERT INTO public.partner_group (department_id, name_en, name_fr, uuid, created_at, is_deleted)
  SELECT department.id, input_partner.name_en, input_partner.name_fr, input_partner.uuid, CURRENT_TIMESTAMP, false
  FROM partners_to_import AS input_partner
  JOIN referenced_departments AS department ON department.gc_org_id = input_partner.department_gc_org_id
  WHERE NOT EXISTS (SELECT 1 FROM public.partner_group AS partner WHERE partner.uuid = input_partner.uuid);
  INSERT INTO public.partner_group_role (partner_group_id, role_id, uuid, created_at, is_deleted)
  SELECT partner.id, developer_role.id, gen_random_uuid(), CURRENT_TIMESTAMP, false
  FROM partners_to_import AS input_partner
  JOIN public.partner_group AS partner ON partner.uuid = input_partner.uuid CROSS JOIN developer_role
  WHERE NOT EXISTS (
    SELECT 1 FROM public.partner_group_role AS group_role
    WHERE group_role.partner_group_id = partner.id AND group_role.role_id = developer_role.id);
  SELECT pg_temp.require_valid(
    (SELECT count(*) FROM public.partner_group AS partner
     JOIN partners_to_import AS input_partner ON input_partner.uuid = partner.uuid
     JOIN referenced_departments AS department ON department.gc_org_id = input_partner.department_gc_org_id
     WHERE NOT partner.is_deleted AND partner.deleted_at IS NULL AND partner.department_id = department.id
       AND partner.name_en IS NOT DISTINCT FROM input_partner.name_en
       AND partner.name_fr IS NOT DISTINCT FROM input_partner.name_fr)
      = (SELECT count(*) FROM partners_to_import),
    'Partner reconciliation failed.');
  SELECT pg_temp.require_valid(
    (SELECT count(*) FROM public.partner_group_role AS group_role
     JOIN public.partner_group AS partner ON partner.id = group_role.partner_group_id
     JOIN partners_to_import AS input_partner ON input_partner.uuid = partner.uuid
     JOIN developer_role ON developer_role.id = group_role.role_id
     WHERE NOT group_role.is_deleted AND group_role.deleted_at IS NULL) = (SELECT count(*) FROM partners_to_import),
    'Group-role reconciliation failed.');
  SELECT partner.uuid AS partner_uuid, partner.name_en, partner.name_fr, department.gc_org_id AS department_gc_org_id,
         group_role.uuid AS developer_mapping_uuid
  FROM public.partner_group AS partner
  JOIN partners_to_import AS input_partner ON input_partner.uuid = partner.uuid
  JOIN public.department AS department ON department.id = partner.department_id
  JOIN public.partner_group_role AS group_role ON group_role.partner_group_id = partner.id
  JOIN developer_role ON developer_role.id = group_role.role_id ORDER BY partner.uuid;
  COMMIT;
  \echo 'APPLIED: transaction committed. Retain the report and run a fresh preview to reconcile.'
\else
  ROLLBACK;
  \echo 'PREVIEW ONLY: no permanent inserts or sequence calls were performed.'
\endif
