# OpenSpec Changes

Store proposed changes here.

Each change gets its own folder:

```text
openspec/changes/<change-id>/
  proposal.md
  design.md
  tasks.md
  specs/
    <capability>/
      spec.md
```

Use `proposal.md` for why and what. Use `design.md` for technical approach. Use `tasks.md` for the implementation checklist plus review and verification checklist items. Use `specs/` for requirement and scenario deltas.

Keep OpenSpec close to its default shape. Do not create a separate `review.md` or `review-checklist.md` unless the solution repo intentionally adopts and documents a custom OpenSpec schema. Put routine review, local-check, evidence, and archive-readiness checklist items in `tasks.md`.

After implementation and verification, archive functional changes with the
default `openspec archive <change-id> --yes` path so spec deltas are promoted
into `openspec/specs/` and the completed package moves under
`openspec/changes/archive/`. Do not use `--skip-specs` for a functional change
with spec deltas. If the package moved but current specs did not update, treat
the archive as incomplete until the missing current spec update is fixed or an
intentional no-spec-update reason is recorded.

Do not use OpenSpec changes as a replacement for Delorean Evidence Bundles, approvals, waivers, release readiness, agents, skills, or local standards.

Generated solution repos may start with no active changes here. Create a
starter package with `make new-openspec-change` when the first change is ready
to shape.
