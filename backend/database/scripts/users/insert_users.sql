-- Import accounts from UTF-8 users.csv (email,name); no access is assigned.
-- Requires PostgreSQL 13+ and a migrated Partner Portal schema.
-- Run from the SQL/CSV directory in fresh psql -X; use normal host/auth settings.
-- Owns its transaction: do not use -1/--single-transaction or an outer BEGIN.
-- Preview: psql -X -d YOUR_DATABASE -f insert_users.sql
-- Apply:   psql -X -d YOUR_DATABASE -v apply=true -f insert_users.sql
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
                          'This script requires PostgreSQL 13 or newer.');
-- Connection settings select the target. No environment is inferred from its name.
\conninfo
SELECT CASE WHEN :'should_apply'::boolean THEN 'APPLY' ELSE 'PREVIEW' END AS mode;

CREATE TEMP TABLE csv_user_rows (email text, name text) ON COMMIT DROP;
-- Read the header as data to validate its exact names and order on PostgreSQL 13.
\copy csv_user_rows FROM 'users.csv' WITH (FORMAT csv, HEADER false, ENCODING 'UTF8')
SELECT pg_temp.require_valid(
  (SELECT count(*) = 1 FROM csv_user_rows WHERE (email, name) = ('email', 'name')),
  'users.csv must contain exactly one header: email,name.');
DELETE FROM csv_user_rows WHERE (email, name) = ('email', 'name');

CREATE TEMP TABLE users_to_import (
  email varchar(255) PRIMARY KEY CHECK (
    email = lower(btrim(email)) AND email ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'),
  name varchar(255) NOT NULL CHECK (length(btrim(name)) >= 2 AND name ~ '[^[:space:]]')
) ON COMMIT DROP;
INSERT INTO users_to_import SELECT email, name FROM csv_user_rows;

-- Include deleted rows and case variants when checking identity conflicts.
SELECT pg_temp.require_valid(NOT EXISTS (
  SELECT incoming_user.email
  FROM users_to_import AS incoming_user
  JOIN public."user" AS existing_user ON lower(btrim(existing_user.email)) = incoming_user.email
  GROUP BY incoming_user.email HAVING count(*) > 1),
  'An input email matches multiple existing portal users.');
SELECT pg_temp.require_valid(NOT EXISTS (
  SELECT 1 FROM users_to_import AS incoming_user
  JOIN public."user" AS existing_user ON lower(btrim(existing_user.email)) = incoming_user.email
  WHERE existing_user.is_deleted OR existing_user.deleted_at IS NOT NULL
    OR existing_user.email IS DISTINCT FROM incoming_user.email
    OR existing_user.name IS DISTINCT FROM incoming_user.name),
  'An existing user is deleted or has a different email/name.');
SELECT pg_temp.require_valid(NOT EXISTS (
  SELECT 1 FROM users_to_import AS incoming_user
  JOIN public."user" AS username_owner ON lower(btrim(username_owner.username)) = incoming_user.email
  LEFT JOIN public."user" AS matching_user ON matching_user.email = incoming_user.email
  WHERE matching_user.id IS NULL OR username_owner.id <> matching_user.id),
  'A proposed username belongs to another existing account.');

-- Preview existing identities before choosing whether to write.
CREATE TEMP TABLE user_import_preview ON COMMIT DROP AS
SELECT incoming_user.email, incoming_user.name,
  CASE WHEN existing_user.id IS NULL THEN 'create' ELSE 'reuse' END AS action,
  existing_user.uuid AS existing_user_uuid
FROM users_to_import AS incoming_user
LEFT JOIN public."user" AS existing_user ON existing_user.email = incoming_user.email;
SELECT email, name, action, existing_user_uuid FROM user_import_preview ORDER BY email;
SELECT action, count(*) AS row_count FROM user_import_preview GROUP BY action ORDER BY action;
SELECT 'New accounts have no roles or partner/application access. Users complete normal OIDC onboarding.' AS account_notice;
\if :should_apply
  INSERT INTO public."user" (
    name, username, email, auth_provider, auth_subject, profile_image_url,
    uuid, created_at, updated_at, last_login_at, deleted_at,
    is_deleted, is_superuser, enabled, accepted_terms_at, terms_version,
    department_id, tier_id
  )
  SELECT incoming_user.name, incoming_user.email, incoming_user.email, NULL, NULL, 'https://profileimageurl.com',
    gen_random_uuid(), CURRENT_TIMESTAMP, NULL, NULL, NULL,
    false, false, false, NULL, NULL, NULL, NULL
  FROM users_to_import AS incoming_user
  WHERE NOT EXISTS (
    SELECT 1 FROM public."user" AS existing_user WHERE existing_user.email = incoming_user.email);

  SELECT pg_temp.require_valid(
    (SELECT count(*) FROM public."user" AS existing_user
     JOIN users_to_import AS incoming_user ON incoming_user.email = existing_user.email
     WHERE NOT existing_user.is_deleted AND existing_user.deleted_at IS NULL
       AND existing_user.name = incoming_user.name)
    = (SELECT count(*) FROM users_to_import), 'User reconciliation failed.');
  -- The final APPLIED message after COMMIT confirms this report was committed.
  SELECT preview.action, existing_user.email, existing_user.uuid AS actual_user_uuid
  FROM user_import_preview AS preview
  JOIN public."user" AS existing_user ON existing_user.email = preview.email
  ORDER BY existing_user.email;
  COMMIT;
  \echo 'APPLIED: transaction committed. Retain the report and run a fresh preview to reconcile.'
\else
  ROLLBACK;
  \echo 'PREVIEW ONLY: no permanent inserts or sequence calls were performed.'
\endif
