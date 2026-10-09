-- Shared plan check. Include BEFORE any permanent INSERT in each operation.
SELECT pg_temp.assert_true((SELECT count(*) = 1 FROM _plan_summary), 'The script must produce exactly one plan digest.');
SELECT pg_temp.assert_true(digest ~ '^[0-9a-f]{32}$', 'Invalid plan digest.') FROM _plan_summary;
SELECT digest AS reviewed_digest_for_apply FROM _plan_summary;
\if :_apply
  SELECT pg_temp.assert_true(p.digest = o.reviewed_digest,
    'The input, target or database plan changed. Review a fresh preview before applying.')
  FROM _plan_summary p CROSS JOIN _run_options o;
\endif
