-- Run with psql -X -f from the private directory containing applications.csv.
-- Requires the two existing rehearsal partners; creates only three applications.
\set operation applications
\ir ../_shared/session.sql
\ir ../_shared/fixture.sql

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
  partner_group_uuid uuid NOT NULL REFERENCES _expected_groups(uuid),
  name_en varchar(256) NOT NULL CHECK (btrim(name_en) <> ''),
  name_fr varchar(256) CHECK (name_fr IS NULL OR btrim(name_fr) <> '')
) ON COMMIT DROP;
INSERT INTO _input_applications SELECT uuid::uuid, partner_group_uuid::uuid, name_en, name_fr FROM _csv_applications;
SELECT pg_temp.assert_true(
  (SELECT count(*) = 3 FROM _input_applications)
  AND NOT EXISTS (
    SELECT uuid, partner_group_uuid FROM _input_applications
    EXCEPT SELECT uuid, partner_group_uuid FROM _expected_applications)
  AND NOT EXISTS (
    SELECT uuid, partner_group_uuid FROM _expected_applications
    EXCEPT SELECT uuid, partner_group_uuid FROM _input_applications),
  'Keep exactly the three example application UUIDs and their one-plus-two partner split.');

CREATE TEMP TABLE _parents ON COMMIT DROP AS
SELECT g.id, g.uuid, g.name_en, g.name_fr, g.is_deleted, g.deleted_at
FROM public.partner_group g JOIN _expected_groups e ON e.uuid = g.uuid;
SELECT pg_temp.assert_true(
  (SELECT count(*) = 2 FROM _parents)
  AND NOT EXISTS (SELECT 1 FROM _parents WHERE is_deleted OR deleted_at IS NOT NULL),
  'Both active rehearsal partners must already exist. Complete partners/setup_partners.sql first.');
SELECT pg_temp.assert_true(NOT EXISTS (
  SELECT 1 FROM _input_applications i JOIN public.application a ON a.uuid = i.uuid
  JOIN _parents g ON g.uuid = i.partner_group_uuid
  WHERE a.is_deleted OR a.deleted_at IS NOT NULL OR a.partner_group_id IS DISTINCT FROM g.id
    OR a.name_en IS DISTINCT FROM i.name_en OR a.name_fr IS DISTINCT FROM i.name_fr),
  'An existing application is deleted or conflicts with the input or expected partner.');
SELECT pg_temp.assert_true(NOT EXISTS (
  SELECT 1 FROM public.application a JOIN _parents g ON g.id = a.partner_group_id
  WHERE NOT a.is_deleted AND (a.deleted_at IS NOT NULL OR NOT EXISTS (
    SELECT 1 FROM _input_applications i WHERE i.uuid = a.uuid AND i.partner_group_uuid = g.uuid))),
  'A rehearsal partner already contains an extra or inconsistent active application.');

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
INSERT INTO _plan_summary
SELECT md5(jsonb_build_object(
  'operation', 'insert-rehearsal-applications-v1',
  'target', jsonb_build_object('database', current_database(), 'serverAddress', inet_server_addr(),
    'serverPort', inet_server_port(), 'environmentLabel', o.target_environment),
  'entries', (SELECT jsonb_agg(to_jsonb(p) ORDER BY kind, key) FROM _application_plan p),
  'existingDevelopers', (SELECT coalesce(jsonb_agg(to_jsonb(u) ORDER BY partner_group_uuid, user_id), '[]'::jsonb)
                         FROM _existing_developers u)
)::text) FROM _run_options o;
SELECT kind, key, action, details FROM _application_plan ORDER BY key;
SELECT action, count(*) AS row_count FROM _application_plan GROUP BY action ORDER BY action;
SELECT 'Existing Developer users listed below can see the applications for their mapped rehearsal partners.' AS access_notice;
SELECT partner_group_uuid, email AS existing_developer_email FROM _existing_developers ORDER BY partner_group_uuid, email;
\ir ../_shared/check_plan.sql

\if :_apply
  INSERT INTO public.application (partner_group_id, name_en, name_fr, uuid, created_at, is_deleted)
  SELECT g.id, i.name_en, i.name_fr, i.uuid, CURRENT_TIMESTAMP, false
  FROM _input_applications i JOIN _parents g ON g.uuid = i.partner_group_uuid
  WHERE NOT EXISTS (SELECT 1 FROM public.application a WHERE a.uuid = i.uuid);
  SELECT pg_temp.assert_true(
    (SELECT count(*) = 3 FROM public.application a JOIN _parents g ON g.id = a.partner_group_id
     WHERE NOT a.is_deleted AND a.deleted_at IS NULL)
    AND (SELECT count(*) = 3 FROM public.application a JOIN _parents g ON g.id = a.partner_group_id
      JOIN _input_applications i ON i.uuid = a.uuid AND i.partner_group_uuid = g.uuid
      WHERE NOT a.is_deleted AND a.deleted_at IS NULL
        AND a.name_en IS NOT DISTINCT FROM i.name_en AND a.name_fr IS NOT DISTINCT FROM i.name_fr),
    'Application count or ownership reconciliation failed.');
  SELECT a.uuid AS application_uuid, g.uuid AS partner_uuid, a.name_en, a.name_fr
  FROM public.application a JOIN _input_applications i ON i.uuid = a.uuid
  JOIN _parents g ON g.id = a.partner_group_id ORDER BY a.uuid;
\endif
\ir ../_shared/finish.sql
