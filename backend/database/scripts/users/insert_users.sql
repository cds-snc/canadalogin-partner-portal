-- Standalone portal account import; hand off this SQL file and users.csv.
-- Required UTF-8 CSV header: email,name
-- Requires PostgreSQL 13+ and a compatible, already-migrated Partner Portal schema.
-- Creates accounts only; no roles or partner/application access are assigned.
-- Use a fresh psql process from the directory holding this SQL and users.csv.
-- This script owns its transaction; do not use -1/--single-transaction or an outer BEGIN.
-- Select host/auth normally (for example -h HOST -U USER); verify \conninfo.
-- Preview: psql -X -d YOUR_DATABASE -f insert_users.sql
-- Apply:   psql -X -d YOUR_DATABASE -v apply=true -f insert_users.sql
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
                          'This script requires PostgreSQL 13 or newer.');
-- Connection settings select the target. No environment is inferred from its name.
\conninfo
SELECT CASE WHEN :'_apply'::boolean THEN 'APPLY' ELSE 'PREVIEW' END AS mode;

CREATE TEMP TABLE _csv_users (email text, name text) ON COMMIT DROP;
-- Read the header as data to validate its exact names and order on PostgreSQL 13.
\copy _csv_users FROM 'users.csv' WITH (FORMAT csv, HEADER false, ENCODING 'UTF8')
SELECT pg_temp.assert_true(
  (SELECT count(*) = 1 FROM _csv_users WHERE (email, name) = ('email', 'name')),
  'users.csv must contain exactly one header: email,name.');
DELETE FROM _csv_users WHERE (email, name) = ('email', 'name');

CREATE TEMP TABLE _input_users (
  email varchar(255) PRIMARY KEY CHECK (
    email = lower(btrim(email)) AND email ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'),
  name varchar(255) NOT NULL CHECK (length(btrim(name)) >= 2 AND name ~ '[^[:space:]]')
) ON COMMIT DROP;
INSERT INTO _input_users SELECT email, name FROM _csv_users;

-- Include deleted rows and case variants when checking identity conflicts.
SELECT pg_temp.assert_true(NOT EXISTS (
  SELECT i.email FROM _input_users i JOIN public."user" u ON lower(btrim(u.email)) = i.email
  GROUP BY i.email HAVING count(*) > 1),
  'An input email matches multiple existing portal users.');
SELECT pg_temp.assert_true(NOT EXISTS (
  SELECT 1 FROM _input_users i JOIN public."user" u ON lower(btrim(u.email)) = i.email
  WHERE u.is_deleted OR u.deleted_at IS NOT NULL
    OR u.email IS DISTINCT FROM i.email OR u.name IS DISTINCT FROM i.name),
  'An existing user is deleted or differs from the input email/name. Existing profiles are never overwritten.');
SELECT pg_temp.assert_true(NOT EXISTS (
  SELECT 1 FROM _input_users i JOIN public."user" holder ON lower(btrim(holder.username)) = i.email
  LEFT JOIN public."user" matched ON matched.email = i.email
  WHERE matched.id IS NULL OR holder.id <> matched.id),
  'A proposed username belongs to another existing account.');

CREATE TEMP TABLE _user_plan (kind text, key text, action text, details jsonb) ON COMMIT DROP;
INSERT INTO _user_plan
SELECT 'user', i.email, CASE WHEN u.id IS NULL THEN 'create' ELSE 'reuse' END,
  jsonb_build_object('input', to_jsonb(i), 'existingId', u.id,
                    'existingUuid', u.uuid, 'existingUsername', u.username)
FROM _input_users i LEFT JOIN public."user" u ON u.email = i.email;
SELECT kind, key, action, details FROM _user_plan ORDER BY key;
SELECT action, count(*) AS row_count FROM _user_plan GROUP BY action ORDER BY action;
SELECT 'New accounts have no roles or partner/application access. Users complete normal OIDC onboarding.' AS account_notice;
\if :_apply
  INSERT INTO public."user" (
    name, username, email, auth_provider, auth_subject, profile_image_url,
    uuid, created_at, updated_at, last_login_at, deleted_at,
    is_deleted, is_superuser, enabled, accepted_terms_at, terms_version,
    department_id, tier_id
  )
  SELECT i.name, i.email, i.email, NULL, NULL, 'https://profileimageurl.com',
    gen_random_uuid(), CURRENT_TIMESTAMP, NULL, NULL, NULL,
    false, false, false, NULL, NULL, NULL, NULL
  FROM _input_users i
  WHERE NOT EXISTS (SELECT 1 FROM public."user" u WHERE u.email = i.email);

  SELECT pg_temp.assert_true(
    (SELECT count(*) FROM public."user" u JOIN _input_users i ON i.email = u.email
     WHERE NOT u.is_deleted AND u.deleted_at IS NULL AND u.name = i.name)
    = (SELECT count(*) FROM _input_users), 'User reconciliation failed.');
  -- The final APPLIED message after COMMIT confirms this report was committed.
  SELECT p.action, u.email, u.uuid AS actual_user_uuid
  FROM _user_plan p JOIN public."user" u ON u.email = p.key ORDER BY u.email;
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
