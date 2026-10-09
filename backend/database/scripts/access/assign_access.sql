-- psql entry point: use --set=email=... OR a one-row access.csv in the CWD.
-- Preview is the default. The assignment uses a GLOBAL role: later group/app
-- changes may expand access. This command never creates users or group links.
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
\set operation access
\ir ../_shared/session.sql

CREATE TEMP TABLE _access_input (email text, role_name text, input_source text) ON COMMIT DROP;
\if :_parameter_input
  -- Parameter mode deliberately does not read or combine a CSV file.
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

\ir ../_shared/fixture.sql

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
  (SELECT count(*) = 2 FROM _scope_groups)
  AND NOT EXISTS (SELECT uuid FROM _scope_groups EXCEPT SELECT uuid FROM _expected_groups)
  AND NOT EXISTS (SELECT uuid FROM _expected_groups EXCEPT SELECT uuid FROM _scope_groups),
  'Partner Developer must link to exactly the two sample partners; extra or missing links prevent assignment.');

CREATE TEMP TABLE _scope_applications AS
SELECT a.id, a.uuid, a.partner_group_id, g.uuid AS partner_group_uuid,
  a.name_en, a.name_fr, a.deleted_at
FROM public.application AS a JOIN _scope_groups AS g ON g.id = a.partner_group_id
WHERE NOT a.is_deleted;
SELECT pg_temp.assert_true(
  NOT EXISTS (SELECT 1 FROM _scope_applications WHERE deleted_at IS NOT NULL),
  'An accessible application has inconsistent deletion flags.');
SELECT pg_temp.assert_true(
  (SELECT count(*) = 3 FROM _scope_applications)
  AND NOT EXISTS (
    SELECT uuid, partner_group_uuid FROM _scope_applications
    EXCEPT SELECT uuid, partner_group_uuid FROM _expected_applications)
  AND NOT EXISTS (
    SELECT uuid, partner_group_uuid FROM _expected_applications
    EXCEPT SELECT uuid, partner_group_uuid FROM _scope_applications),
  'The sample partners must contain exactly the three expected applications with their expected parents.');

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

-- MD5 is a review-change fingerprint, not a signature or security credential.
INSERT INTO _plan_summary (digest)
SELECT md5(jsonb_build_object(
  'operation', 'assign-test-partner-access-v1',
  'target', jsonb_build_object(
    'database', current_database(), 'serverAddress', inet_server_addr(),
    'serverPort', inet_server_port(), 'environmentLabel', o.target_environment),
  'assignment', (SELECT to_jsonb(p) FROM _access_plan AS p),
  'policies', (SELECT jsonb_agg(to_jsonb(p) ORDER BY p.action) FROM _access_policies p),
  'partnerGroups', (SELECT jsonb_agg(to_jsonb(g) ORDER BY g.uuid) FROM _scope_groups AS g),
  'applications', (SELECT jsonb_agg(to_jsonb(a) ORDER BY a.uuid) FROM _scope_applications AS a)
)::text) AS digest
FROM _run_options AS o;

SELECT email, input_source, user_uuid, role_name, action AS proposed_action FROM _access_plan;
SELECT uuid AS partner_group_uuid, name_en, name_fr FROM _scope_groups ORDER BY uuid;
SELECT uuid AS application_uuid, partner_group_uuid, name_en, name_fr FROM _scope_applications ORDER BY uuid;
SELECT 'This global role currently covers both sample partners and all three applications. '
  'Later group/app changes can expand access; existing user permissions are retained.' AS scope_notice;
SELECT digest AS review_digest FROM _plan_summary;
\ir ../_shared/check_plan.sql

\if :_apply
  INSERT INTO public.user_role (user_id, role_id, uuid, created_at, updated_at, deleted_at, is_deleted)
  SELECT user_id, role_id, gen_random_uuid(), now(), NULL, NULL, false
  FROM _access_plan WHERE action = 'create';
  SELECT pg_temp.assert_true(
    (SELECT count(*) = 1 FROM public.user_role m
     JOIN _access_plan p ON p.user_id = m.user_id AND p.role_id = m.role_id
     WHERE NOT m.is_deleted AND m.deleted_at IS NULL), 'User-role reconciliation failed.');
\endif
\ir ../_shared/finish.sql
