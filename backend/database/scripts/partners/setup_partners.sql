-- Run with psql -X -f from the private directory containing partners.csv.
-- Creates only the two rehearsal groups and their Partner Developer mappings.
\set operation partners
\ir ../_shared/session.sql
\ir ../_shared/fixture.sql

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
SELECT pg_temp.assert_true(
  (SELECT count(*) = 2 FROM _input_partners)
  AND NOT EXISTS (SELECT uuid FROM _input_partners EXCEPT SELECT uuid FROM _expected_groups)
  AND NOT EXISTS (SELECT uuid FROM _expected_groups EXCEPT SELECT uuid FROM _input_partners),
  'Keep exactly the two example partner UUIDs for this rehearsal.');

CREATE TEMP TABLE _departments ON COMMIT DROP AS
SELECT d.* FROM public.department d
JOIN (SELECT DISTINCT department_gc_org_id FROM _input_partners) i ON d.gc_org_id = i.department_gc_org_id;
SELECT pg_temp.assert_true(
  (SELECT count(*) FROM _departments) = (SELECT count(DISTINCT department_gc_org_id) FROM _input_partners)
  AND NOT EXISTS (SELECT 1 FROM _departments WHERE is_deleted OR deleted_at IS NOT NULL),
  'Each partner must reference an existing active department catalog entry.');
CREATE TEMP TABLE _developer_role ON COMMIT DROP AS
SELECT * FROM public.role WHERE name = 'Partner Developer';
SELECT pg_temp.assert_true(
  (SELECT count(*) = 1 FROM _developer_role)
  AND NOT EXISTS (SELECT 1 FROM _developer_role WHERE is_deleted OR deleted_at IS NOT NULL),
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

-- Applications are created separately. Zero or a subset of the expected three
-- may already exist, but adding a role link must not expose an extra application.
CREATE TEMP TABLE _existing_applications ON COMMIT DROP AS
SELECT a.id, a.uuid, a.name_en, a.name_fr, a.deleted_at, g.uuid AS partner_group_uuid
FROM public.application a JOIN public.partner_group g ON g.id = a.partner_group_id
JOIN _input_partners i ON i.uuid = g.uuid WHERE NOT a.is_deleted;
SELECT pg_temp.assert_true(NOT EXISTS (
  SELECT 1 FROM _existing_applications a
  WHERE a.deleted_at IS NOT NULL OR NOT EXISTS (
    SELECT 1 FROM _expected_applications e WHERE e.uuid = a.uuid AND e.partner_group_uuid = a.partner_group_uuid)),
  'A rehearsal partner contains an extra or inconsistent active application. No access mapping will be added.');

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
INSERT INTO _plan_summary
SELECT md5(jsonb_build_object(
  'operation', 'setup-rehearsal-partners-v1',
  'target', jsonb_build_object('database', current_database(), 'serverAddress', inet_server_addr(),
    'serverPort', inet_server_port(), 'environmentLabel', o.target_environment),
  'entries', (SELECT jsonb_agg(to_jsonb(p) ORDER BY kind, key) FROM _partner_plan p),
  'existingApplications', (SELECT coalesce(jsonb_agg(to_jsonb(a) ORDER BY uuid), '[]'::jsonb) FROM _existing_applications a),
  'existingDevelopers', (SELECT coalesce(jsonb_agg(to_jsonb(u) ORDER BY id), '[]'::jsonb) FROM _existing_developers u)
)::text) FROM _run_options o;
SELECT kind, key, action, details FROM _partner_plan ORDER BY kind, key;
SELECT action, count(*) AS row_count FROM _partner_plan GROUP BY action ORDER BY action;
SELECT 'Existing holders of the global Partner Developer role can see applications in both rehearsal partners.' AS access_notice;
SELECT email AS existing_developer_email FROM _existing_developers ORDER BY email;
SELECT uuid AS existing_application_uuid, partner_group_uuid, name_en, name_fr FROM _existing_applications ORDER BY uuid;
\ir ../_shared/check_plan.sql

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
    (SELECT count(*) = 2 FROM public.partner_group g JOIN _input_partners i ON i.uuid = g.uuid
     JOIN _departments d ON d.gc_org_id = i.department_gc_org_id
     WHERE NOT g.is_deleted AND g.deleted_at IS NULL AND g.department_id = d.id
       AND g.name_en IS NOT DISTINCT FROM i.name_en AND g.name_fr IS NOT DISTINCT FROM i.name_fr),
    'Partner reconciliation failed.');
  SELECT pg_temp.assert_true(
    (SELECT count(*) = 2 FROM public.partner_group_role m JOIN public.partner_group g ON g.id = m.partner_group_id
     JOIN _input_partners i ON i.uuid = g.uuid JOIN _developer_role r ON r.id = m.role_id
     WHERE NOT m.is_deleted AND m.deleted_at IS NULL), 'Group-role reconciliation failed.');
  SELECT g.uuid AS partner_uuid, g.name_en, g.name_fr, d.gc_org_id AS department_gc_org_id,
         m.uuid AS developer_mapping_uuid
  FROM public.partner_group g JOIN _input_partners i ON i.uuid = g.uuid
  JOIN public.department d ON d.id = g.department_id
  JOIN public.partner_group_role m ON m.partner_group_id = g.id
  JOIN _developer_role r ON r.id = m.role_id ORDER BY g.uuid;
\endif
\ir ../_shared/finish.sql
