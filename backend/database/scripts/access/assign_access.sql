-- Assign global Partner Developer access; existing account, role policies and group links required.
-- UTF-8 CSVs: access.csv(email,role), partners.csv(uuid,department_gc_org_id,name_en,name_fr),
-- applications.csv(uuid,partner_group_uuid,name_en,name_fr). Both scope CSVs are always required.
-- Use -v email='person@example.com' instead of access.csv. PostgreSQL 13+; migrated Portal schema.
-- Fresh psql -X from SQL/CSV directory; normal host/auth. No -1/--single-transaction or outer BEGIN.
-- Preview: psql -X -d YOUR_DATABASE -f assign_access.sql
-- Apply:   psql -X -d YOUR_DATABASE -v apply=true -f assign_access.sql
\set ON_ERROR_STOP on
\pset pager off
\if :{?email}
  \set use_email_parameter true
\else
  \set use_email_parameter false
\endif
\if :{?role}
\else
  \set role 'Partner Developer'
\endif
\if :{?apply}
\else
  \set apply false
\endif
-- Validate the boolean before psql uses it as a condition.
SELECT :'apply'::boolean AS should_apply \gset

BEGIN ISOLATION LEVEL SERIALIZABLE;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';
SET LOCAL idle_in_transaction_session_timeout = '60s';
SET LOCAL search_path = pg_catalog, pg_temp;
SET LOCAL timezone = 'UTC';

-- NULL also fails validation; missing data must not silently pass.
CREATE FUNCTION pg_temp.require_valid(is_valid boolean, error_message text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF is_valid IS DISTINCT FROM TRUE THEN
    RAISE EXCEPTION '%', error_message;
  END IF;
END;
$$;

SELECT pg_temp.require_valid(current_setting('server_version_num')::integer >= 130000,
                             'This script requires PostgreSQL 13 or newer.');
\conninfo
SELECT CASE WHEN :'should_apply'::boolean THEN 'APPLY' ELSE 'PREVIEW' END AS mode;

-- Select one account. An email parameter skips access.csv, not the scope CSVs.
CREATE TEMP TABLE requested_access (email text, role_name text, input_source text) ON COMMIT DROP;
\if :use_email_parameter
  INSERT INTO requested_access SELECT lower(btrim(:'email')), :'role'::text, 'parameter';
\else
  CREATE TEMP TABLE csv_access_rows (email text, role text) ON COMMIT DROP;
  \copy csv_access_rows FROM 'access.csv' WITH (FORMAT csv, HEADER false, ENCODING 'UTF8')
  SELECT pg_temp.require_valid(
    (SELECT count(*) = 1 FROM csv_access_rows WHERE (email, role) = ('email', 'role')),
    'access.csv must contain exactly one header: email,role.');
  DELETE FROM csv_access_rows WHERE (email, role) = ('email', 'role');
  SELECT pg_temp.require_valid((SELECT count(*) = 1 FROM csv_access_rows),
    'access.csv must contain exactly one account.');
  INSERT INTO requested_access SELECT lower(btrim(email)), role, 'csv' FROM csv_access_rows;
\endif
SELECT pg_temp.require_valid(
  (SELECT email <> '' AND email ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' FROM requested_access),
  'A valid existing user email is required.');
SELECT pg_temp.require_valid(
  (SELECT role_name = 'Partner Developer' FROM requested_access), 'Only Partner Developer is supported.');

-- Scope is explicit: UUIDs and ownership matter here; names and departments do not.
CREATE TEMP TABLE csv_partner_scope_rows (
  uuid text, department_gc_org_id text, name_en text, name_fr text
) ON COMMIT DROP;
CREATE TEMP TABLE csv_application_scope_rows (
  uuid text, partner_group_uuid text, name_en text, name_fr text
) ON COMMIT DROP;
\copy csv_partner_scope_rows FROM 'partners.csv' WITH (FORMAT csv, HEADER false, ENCODING 'UTF8')
\copy csv_application_scope_rows FROM 'applications.csv' WITH (FORMAT csv, HEADER false, ENCODING 'UTF8')
SELECT pg_temp.require_valid(
  (SELECT count(*) = 1 FROM csv_partner_scope_rows
   WHERE (uuid, department_gc_org_id, name_en, name_fr) = ('uuid', 'department_gc_org_id', 'name_en', 'name_fr')),
  'partners.csv must contain the exact documented header once.');
SELECT pg_temp.require_valid(
  (SELECT count(*) = 1 FROM csv_application_scope_rows
   WHERE (uuid, partner_group_uuid, name_en, name_fr) = ('uuid', 'partner_group_uuid', 'name_en', 'name_fr')),
  'applications.csv must contain the exact documented header once.');
DELETE FROM csv_partner_scope_rows
WHERE (uuid, department_gc_org_id, name_en, name_fr) = ('uuid', 'department_gc_org_id', 'name_en', 'name_fr');
DELETE FROM csv_application_scope_rows
WHERE (uuid, partner_group_uuid, name_en, name_fr) = ('uuid', 'partner_group_uuid', 'name_en', 'name_fr');
CREATE TEMP TABLE requested_partner_scope (uuid uuid PRIMARY KEY) ON COMMIT DROP;
CREATE TEMP TABLE requested_application_scope (
  uuid uuid PRIMARY KEY, partner_group_uuid uuid NOT NULL REFERENCES requested_partner_scope(uuid)
) ON COMMIT DROP;
INSERT INTO requested_partner_scope SELECT uuid::uuid FROM csv_partner_scope_rows;
INSERT INTO requested_application_scope SELECT uuid::uuid, partner_group_uuid::uuid FROM csv_application_scope_rows;
SELECT pg_temp.require_valid((SELECT count(*) > 0 FROM requested_partner_scope),
  'Select at least one partner in partners.csv.');

-- Existing identities and role policies are prerequisites, never created here.
CREATE TEMP TABLE target_user ON COMMIT DROP AS
SELECT portal_user.id, portal_user.uuid, portal_user.is_deleted, portal_user.deleted_at
FROM public."user" AS portal_user
JOIN requested_access AS request ON lower(btrim(portal_user.email)) = request.email;
SELECT pg_temp.require_valid((SELECT count(*) = 1 FROM target_user),
  'The email must identify exactly one existing portal user.');
SELECT pg_temp.require_valid((SELECT NOT is_deleted AND deleted_at IS NULL FROM target_user),
  'The user is soft-deleted; it will not be restored.');

CREATE TEMP TABLE developer_role ON COMMIT DROP AS
SELECT portal_role.id, portal_role.name, portal_role.is_deleted, portal_role.deleted_at
FROM public.role AS portal_role JOIN requested_access AS request ON portal_role.name = request.role_name;
SELECT pg_temp.require_valid((SELECT count(*) = 1 FROM developer_role), 'Partner Developer role was not found.');
SELECT pg_temp.require_valid((SELECT NOT is_deleted AND deleted_at IS NULL FROM developer_role),
  'Partner Developer role is soft-deleted.');

CREATE TEMP TABLE developer_policies ON COMMIT DROP AS
SELECT action, deleted_at FROM public.access_policy
WHERE subject = 'Partner Developer' AND resource = 'applications'
  AND action IN ('read', 'write') AND NOT is_deleted;
SELECT pg_temp.require_valid(
  (SELECT count(*) = 2 AND count(DISTINCT action) = 2 FROM developer_policies)
  AND NOT EXISTS (SELECT 1 FROM developer_policies WHERE deleted_at IS NOT NULL),
  'Exactly one active Developer applications/read policy and one applications/write policy must exist.');

-- Match the portal's is_deleted filters, then reject inconsistent deleted_at values.
CREATE TEMP TABLE actual_partner_scope ON COMMIT DROP AS
SELECT partner.id, partner.uuid, partner.name_en, partner.name_fr, partner.deleted_at,
  role_link.deleted_at AS role_link_deleted_at
FROM public.partner_group AS partner
JOIN public.partner_group_role AS role_link ON role_link.partner_group_id = partner.id
JOIN developer_role ON developer_role.id = role_link.role_id
WHERE NOT partner.is_deleted AND NOT role_link.is_deleted;
SELECT pg_temp.require_valid(NOT EXISTS (
  SELECT 1 FROM actual_partner_scope WHERE deleted_at IS NOT NULL OR role_link_deleted_at IS NOT NULL),
  'An accessible partner or role link has inconsistent deletion flags.');
-- Compare both directions so neither extra nor missing access is accepted.
SELECT pg_temp.require_valid(
  NOT EXISTS (SELECT uuid FROM actual_partner_scope EXCEPT SELECT uuid FROM requested_partner_scope)
  AND NOT EXISTS (SELECT uuid FROM requested_partner_scope EXCEPT SELECT uuid FROM actual_partner_scope),
  'Developer partner access must exactly match partners.csv.');

CREATE TEMP TABLE actual_application_scope ON COMMIT DROP AS
SELECT application.uuid, partner.uuid AS partner_group_uuid,
  application.name_en, application.name_fr, application.deleted_at
FROM public.application AS application
JOIN actual_partner_scope AS partner ON partner.id = application.partner_group_id
WHERE NOT application.is_deleted;
SELECT pg_temp.require_valid(
  NOT EXISTS (SELECT 1 FROM actual_application_scope WHERE deleted_at IS NOT NULL),
  'An accessible application has inconsistent deletion flags.');
SELECT pg_temp.require_valid(
  NOT EXISTS (
    SELECT uuid, partner_group_uuid FROM actual_application_scope
    EXCEPT SELECT uuid, partner_group_uuid FROM requested_application_scope)
  AND NOT EXISTS (
    SELECT uuid, partner_group_uuid FROM requested_application_scope
    EXCEPT SELECT uuid, partner_group_uuid FROM actual_application_scope),
  'Developer application access and ownership must exactly match applications.csv.');

CREATE TEMP TABLE existing_assignment ON COMMIT DROP AS
SELECT assignment.id, assignment.is_deleted, assignment.deleted_at
FROM public.user_role AS assignment
JOIN target_user ON target_user.id = assignment.user_id
JOIN developer_role ON developer_role.id = assignment.role_id;
SELECT pg_temp.require_valid(
  NOT EXISTS (SELECT 1 FROM existing_assignment WHERE is_deleted OR deleted_at IS NOT NULL),
  'The user-role assignment is soft-deleted; it will not be restored.');

-- Preview the account and complete scope before choosing whether to write.
CREATE TEMP TABLE access_preview ON COMMIT DROP AS
SELECT request.email, request.input_source, target_user.uuid AS user_uuid, target_user.id AS user_id,
  developer_role.name AS role_name, developer_role.id AS role_id,
  CASE WHEN existing_assignment.id IS NULL THEN 'create' ELSE 'reuse' END AS action
FROM requested_access AS request CROSS JOIN target_user CROSS JOIN developer_role
LEFT JOIN existing_assignment ON true;
SELECT email, input_source, user_uuid, role_name, action AS proposed_action FROM access_preview;
SELECT uuid AS partner_group_uuid, name_en, name_fr FROM actual_partner_scope ORDER BY uuid;
SELECT uuid AS application_uuid, partner_group_uuid, name_en, name_fr FROM actual_application_scope ORDER BY uuid;
SELECT 'This global role currently covers exactly the partners and applications selected in the scope CSVs. '
  'Later group/app changes can expand access; existing user permissions are retained.' AS scope_notice;

\if :should_apply
  INSERT INTO public.user_role (user_id, role_id, uuid, created_at, updated_at, deleted_at, is_deleted)
  SELECT user_id, role_id, gen_random_uuid(), now(), NULL, NULL, false
  FROM access_preview WHERE action = 'create';
  SELECT pg_temp.require_valid(
    (SELECT count(*) = 1 FROM public.user_role AS assignment
     JOIN access_preview AS preview ON preview.user_id = assignment.user_id AND preview.role_id = assignment.role_id
     WHERE NOT assignment.is_deleted AND assignment.deleted_at IS NULL), 'User-role reconciliation failed.');
  COMMIT;
  \echo 'APPLIED: transaction committed. Retain the report and run a fresh preview to reconcile.'
\else
  ROLLBACK;
  \echo 'PREVIEW ONLY: no permanent inserts or sequence calls were performed.'
\endif
