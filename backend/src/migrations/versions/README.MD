Active Alembic revisions live in this directory.

Current active chain:

- `0001_core_schema.py` through `0018_application_information_review_records.py`
- `0019_four_role_expand.py`
- `0020_four_role_backfill.py`
- `0021_four_role_constraints.py`
- `0022_invitation_revocation_actor.py`
- `0023_authorization_im.py` (head)

The three four-role revisions intentionally separate additive schema, the
zero-legacy-access data policy, and constraint validation. Revision 0020
accepts an optional reviewed `FOUR_ROLE_BACKFILL_MANIFEST`, but both legacy
assignment lists must remain empty; see `../README.md` for the dry-run
reconciliation and optional review-provenance flow. Do not squash these steps
or replace the policy with inferred role mappings. Revision 0022 then adds the
nullable restricted invitation-revocation actor link without inferring actors
for historical rows. Revision 0023 classifies retained unknown actors
explicitly, enforces actor provenance for application-written revocations,
and adds audit discovery indexes.

When resetting the database history, move superseded revisions into
`../_archive/` instead of deleting them.
