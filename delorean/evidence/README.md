# Evidence

Store reviewed evidence and live Delorean change records here when the solution starts producing them.

Use one folder per meaningful change:

```text
delorean/evidence/<change-id>/
```

Inside that folder:

- `change-state.yaml` is the per-change Delorean state record.
- `evidence-bundle.md` is the review-facing proof package.

Do not add fake evidence or placeholder evidence folders.

Do not treat raw agent-run bundles as approval records unless they have been reviewed and summarized.

Keep OpenSpec requirement text in OpenSpec. Link to it from evidence instead of copying it here.
