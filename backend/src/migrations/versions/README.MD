Active Alembic revisions live in this directory.

Current active chain:

- `0001_core_schema.py` through `0018_application_information_review_records.py`
- `0019_four_role_expand.py`
- `0020_four_role_backfill.py`
- `0021_four_role_constraints.py`
- `0022_invitation_revocation_actor.py`
- `0023_authorization_im.py`
- `0024_rp_registration_draft_metadata.py`
- `0025_workspace_invitations.py`
- `0026_rp_configuration_expand.py`
- `0027_contact_identity_expand.py`
- `0028_rp_configuration_backfill.py`
- `0029_rp_hierarchy_reconciliation.py`
- `0030_rp_hierarchy_constraints.py`
- `0031_cross_namespace_uuid_guard.py`
- `0032_partner_environment_expand.py` (head)

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

Revision 0026 is the additive RP-configuration naming and clone-lineage
expansion. It keeps both fields nullable and performs no inferred data update;
later application and contract revisions own clone validation and required-name
activation.

Revision 0027 expands Application contacts for locale-neutral person identity
and explicit confirmation provenance. It preserves all legacy bilingual names
and responsibilities, performs no inferred identity backfill, and fails closed
on downgrade if a newer contact no longer has the legacy full-name values.

Revision 0028 deterministically fills missing RP configuration labels and
missing workspace-owned Department context. It stops on contradictory
Department values and does not infer Application or CanadaLogin-environment
ownership. Its downgrade retains the backfilled values to avoid destroying
later edits or authoritative context.

Revision 0029 binds explicit Application and CanadaLogin-environment mappings
to a locked, minimized reconciliation snapshot and blocks every unresolved or
cross-workspace hierarchy finding. It does not emit names, provider metadata,
questionnaire answers, contact data, or secrets. Reviewed mappings remain on
downgrade.

Revision 0030 rechecks that locked hierarchy before activating required
configuration labels, candidate/partner parent pairing, and active partner
Department/environment constraints. It remains reversible to the reconciled
0029 state for bounded repair and retry.

Revision 0031 stops on retained same-workspace Application/RP public UUID
collisions and installs symmetric transactionally serialized guards across both
tables while legacy route resolution remains active.

Revision 0032 adds nullable, bounded Partner-environment metadata with a
nonblank-when-present constraint. It performs no inferred backfill and removes
only that additive field and constraint on downgrade.

When resetting the database history, move superseded revisions into
`../_archive/` instead of deleting them.
