-- Shared psql setup. Entry scripts set an allowlisted operation before including.
\set ON_ERROR_STOP on
\pset pager off
\if :{?mode}
\else
  \set mode preview
\endif
\if :{?expected_database}
\else
  \set expected_database ''
\endif
\if :{?target_environment}
\else
  \set target_environment ''
\endif
\if :{?reviewed_digest}
\else
  \set reviewed_digest ''
\endif
\if :{?operation}
\else
  \set operation ''
\endif
SELECT :'mode' = 'apply' AS _apply,
       :'operation' = 'users' AS _users,
       :'operation' = 'partners' AS _partners,
       :'operation' = 'applications' AS _applications,
       :'operation' = 'access' AS _access,
       :'operation' IN ('users', 'partners', 'applications', 'access') AS _known_operation \gset
\if :_known_operation
\else
  DO $$ BEGIN RAISE EXCEPTION 'Invoke an operation entry script, not this helper.'; END $$;
\endif

\if :_apply
  BEGIN ISOLATION LEVEL SERIALIZABLE;
  SET LOCAL lock_timeout = '5s';
  SET LOCAL statement_timeout = '60s';
  -- Acquire locks BEFORE the first transactional snapshot. Freeze both existing
  -- rows and new role/group/app inserts while checking the grant's whole scope.
  -- Each operation locks only the tables it reads for its plan or writes.
  -- Keep the common table order across operations to reduce lock contention.
  \if :_users
    LOCK TABLE public."user" IN SHARE ROW EXCLUSIVE MODE;
  \elif :_partners
    LOCK TABLE public."user", public.user_role, public.department, public.role,
      public.partner_group, public.partner_group_role, public.application
      IN SHARE ROW EXCLUSIVE MODE;
  \elif :_applications
    LOCK TABLE public."user", public.user_role, public.role,
      public.partner_group, public.partner_group_role, public.application
      IN SHARE ROW EXCLUSIVE MODE;
  \else
    LOCK TABLE public."user", public.user_role, public.role,
      public.partner_group, public.partner_group_role, public.application, public.access_policy
      IN SHARE ROW EXCLUSIVE MODE;
  \endif
\else
  BEGIN ISOLATION LEVEL REPEATABLE READ;
  SET LOCAL statement_timeout = '60s';
\endif
SET LOCAL search_path = pg_catalog, pg_temp;
SET LOCAL idle_in_transaction_session_timeout = '60s';
SET LOCAL timezone = 'UTC';

CREATE TEMP TABLE _run_options ON COMMIT DROP AS
SELECT :'mode'::text AS mode, :'expected_database'::text AS expected_database,
       :'target_environment'::text AS target_environment,
       :'reviewed_digest'::text AS reviewed_digest, :'operation'::text AS operation;

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
SELECT pg_temp.assert_true(mode IN ('preview', 'apply'), 'mode must be preview or apply.') FROM _run_options;
SELECT pg_temp.assert_true(expected_database <> '' AND current_database() = expected_database,
                          'expected_database must match the connected database.') FROM _run_options;
SELECT pg_temp.assert_true(target_environment IN ('local', 'test', 'staging'),
                          'Specify local, test or staging. Production is outside this rehearsal.') FROM _run_options;
SELECT pg_temp.assert_true(
  (mode = 'apply' AND reviewed_digest ~ '^[0-9a-f]{32}$')
  OR (mode = 'preview' AND reviewed_digest = ''),
  'Apply requires reviewed_digest from a preview; omit it in preview mode.'
) FROM _run_options;
SELECT pg_temp.assert_true(to_regclass('public.alembic_version') IS NOT NULL,
                          'The schema must already be migrated. These scripts do not run migrations.');
SELECT pg_temp.assert_true(
  (SELECT count(*) = 1 AND min(version_num) = '0012_partner_developer_write' FROM public.alembic_version),
  'Expected Alembic revision 0012_partner_developer_write; review this script for any other schema.'
);

-- target_environment is an operator label, NOT authoritative environment detection.
SELECT current_database() AS database, session_user AS operator,
       inet_server_addr() AS server_address, inet_server_port() AS server_port,
       target_environment AS operator_environment_label, operation, mode FROM _run_options;

CREATE TEMP TABLE _plan_summary (digest text NOT NULL) ON COMMIT DROP;
