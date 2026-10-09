-- Finish this operation only. Earlier committed operations remain committed.
-- ON_ERROR_STOP prevents reaching COMMIT after a SQL or COPY failure.
\if :_apply
  COMMIT;
  \echo 'APPLIED: transaction committed. Retain the report and run a fresh preview to reconcile.'
\else
  ROLLBACK;
  \echo 'PREVIEW ONLY: no permanent inserts or sequence calls were performed.'
\endif
