-- Import applications.csv under existing partner groups; run beside the CSV.
-- Requires PostgreSQL 13+ and the migrated portal schema.
-- Use a fresh psql process; this script owns its transaction (no -1/outer BEGIN).
-- Preview: psql -X -d YOUR_DATABASE -f insert_applications.sql
-- Apply:   psql -X -d YOUR_DATABASE -v apply=true -f insert_applications.sql

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
CREATE TEMP TABLE csv_application_rows (uuid text, partner_group_uuid text, name_en text, name_fr text) ON COMMIT DROP;
\copy csv_application_rows FROM 'applications.csv' WITH (FORMAT csv, HEADER false, ENCODING 'UTF8')
SELECT pg_temp.require_valid(
  (SELECT count(*) = 1 FROM csv_application_rows
   WHERE (uuid, partner_group_uuid, name_en, name_fr) = ('uuid', 'partner_group_uuid', 'name_en', 'name_fr')),
  'applications.csv must contain exactly one header: uuid,partner_group_uuid,name_en,name_fr.');
DELETE FROM csv_application_rows
  WHERE (uuid, partner_group_uuid, name_en, name_fr) = ('uuid', 'partner_group_uuid', 'name_en', 'name_fr');

-- Types and constraints reject invalid values and duplicate UUIDs before writes.
CREATE TEMP TABLE applications_to_import (
  uuid uuid PRIMARY KEY,
  partner_group_uuid uuid NOT NULL,
  name_en varchar(256) NOT NULL CHECK (btrim(name_en) <> ''),
  name_fr varchar(256) CHECK (name_fr IS NULL OR btrim(name_fr) <> '')
) ON COMMIT DROP;
INSERT INTO applications_to_import
SELECT uuid::uuid, partner_group_uuid::uuid, name_en, name_fr FROM csv_application_rows;

-- Resolve each parent once; a missing or deleted partner must not silently drop a row.
CREATE TEMP TABLE parent_partners ON COMMIT DROP AS
SELECT partner.id, partner.uuid, partner.name_en, partner.name_fr, partner.is_deleted, partner.deleted_at
FROM public.partner_group AS partner
JOIN (SELECT DISTINCT partner_group_uuid FROM applications_to_import) AS requested_partner
  ON requested_partner.partner_group_uuid = partner.uuid;
SELECT pg_temp.require_valid(
  (SELECT count(*) FROM parent_partners) = (SELECT count(DISTINCT partner_group_uuid) FROM applications_to_import)
  AND NOT EXISTS (SELECT 1 FROM parent_partners WHERE is_deleted OR deleted_at IS NOT NULL),
  'Every input partner UUID must identify an existing active group. Complete partner setup for missing groups first.');

-- Reruns may reuse exact matches, but must not change, move or restore an application.
SELECT pg_temp.require_valid(NOT EXISTS (
  SELECT 1 FROM applications_to_import AS input_application
  JOIN public.application AS application ON application.uuid = input_application.uuid
  JOIN parent_partners AS partner ON partner.uuid = input_application.partner_group_uuid
  WHERE application.is_deleted OR application.deleted_at IS NOT NULL
    OR application.partner_group_id IS DISTINCT FROM partner.id
    OR application.name_en IS DISTINCT FROM input_application.name_en
    OR application.name_fr IS DISTINCT FROM input_application.name_fr),
  'An existing application is deleted or conflicts with the input or expected partner.');

CREATE TEMP TABLE application_import_preview ON COMMIT DROP AS
SELECT input_application.uuid AS application_uuid, input_application.name_en, input_application.name_fr,
       partner.uuid AS partner_group_uuid, partner.name_en AS partner_name_en, partner.name_fr AS partner_name_fr,
       CASE WHEN application.id IS NULL THEN 'create' ELSE 'reuse' END AS action
FROM applications_to_import AS input_application
JOIN parent_partners AS partner ON partner.uuid = input_application.partner_group_uuid
LEFT JOIN public.application AS application ON application.uuid = input_application.uuid;

-- Show existing role holders who can see the imported applications; do not grant roles.
CREATE TEMP TABLE existing_developers ON COMMIT DROP AS
SELECT partner.uuid AS partner_group_uuid, portal_user.email
FROM parent_partners AS partner
JOIN public.partner_group_role AS group_role ON group_role.partner_group_id = partner.id
JOIN public.role AS developer_role ON developer_role.id = group_role.role_id
JOIN public.user_role AS user_role ON user_role.role_id = developer_role.id
JOIN public."user" AS portal_user ON portal_user.id = user_role.user_id
WHERE developer_role.name = 'Partner Developer' AND NOT developer_role.is_deleted AND NOT group_role.is_deleted
  AND NOT user_role.is_deleted AND NOT portal_user.is_deleted;
SELECT * FROM application_import_preview ORDER BY application_uuid;
SELECT count(*) FILTER (WHERE action = 'create') AS create_count,
       count(*) FILTER (WHERE action = 'reuse') AS reuse_count FROM application_import_preview;
SELECT 'Existing Developer users listed below can see the input applications through their partner role mappings.' AS access_notice;
SELECT partner_group_uuid, email AS existing_developer_email FROM existing_developers ORDER BY partner_group_uuid, email;

-- Insert only missing records, then verify their names and ownership before committing.
\if :should_apply
  INSERT INTO public.application (partner_group_id, name_en, name_fr, uuid, created_at, is_deleted)
  SELECT partner.id, input_application.name_en, input_application.name_fr, input_application.uuid, CURRENT_TIMESTAMP, false
  FROM applications_to_import AS input_application
  JOIN parent_partners AS partner ON partner.uuid = input_application.partner_group_uuid
  WHERE NOT EXISTS (SELECT 1 FROM public.application AS application WHERE application.uuid = input_application.uuid);
  SELECT pg_temp.require_valid(
    (SELECT count(*) FROM public.application AS application
      JOIN parent_partners AS partner ON partner.id = application.partner_group_id
      JOIN applications_to_import AS input_application
        ON input_application.uuid = application.uuid AND input_application.partner_group_uuid = partner.uuid
      WHERE NOT application.is_deleted AND application.deleted_at IS NULL
        AND application.name_en IS NOT DISTINCT FROM input_application.name_en
        AND application.name_fr IS NOT DISTINCT FROM input_application.name_fr)
      = (SELECT count(*) FROM applications_to_import),
    'Application count or ownership reconciliation failed.');
  SELECT application.uuid AS application_uuid, partner.uuid AS partner_uuid, application.name_en, application.name_fr
  FROM public.application AS application
  JOIN applications_to_import AS input_application ON input_application.uuid = application.uuid
  JOIN parent_partners AS partner ON partner.id = application.partner_group_id ORDER BY application.uuid;
  COMMIT;
  \echo 'APPLIED: transaction committed. Retain the report and run a fresh preview to reconcile.'
\else
  ROLLBACK;
  \echo 'PREVIEW ONLY: no permanent inserts or sequence calls were performed.'
\endif
