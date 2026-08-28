# Templates

Store small documentation templates for this solution repo.

Use `delorean/templates/` for Delorean process record templates such as approval responses and waivers.

Generated solution repos also receive reusable architecture templates from
`delorean_architecture` under `architecture_docs/templates/`.

Keep templates short and easy to adapt.

Starter templates:

- [docs/templates/openspec-template.md](openspec-template.md) for an OpenSpec-compatible `spec.md` helper.
- [docs/templates/openspec-change-package-template.md](openspec-change-package-template.md) for a full local-first OpenSpec change starter.
- [docs/templates/work-context-and-assumptions-template.md](work-context-and-assumptions-template.md) for local, shared-environment, and production assumptions.
- [docs/templates/design-package-template.md](design-package-template.md)
- [docs/templates/evidence-bundle-template.md](evidence-bundle-template.md)
- [docs/templates/repo-checklist.md](repo-checklist.md)

Architecture-derived templates in generated solution repos:

- TPL-006: ADR Template.
- TPL-010: Reference Architecture Template for reusable reference architecture documents.
- TPL-003: Standards Impact Template for a short Government of Canada standards impact block.
- TPL-007: Page Pattern Decision Template for user-facing page pattern decisions.
- TPL-008: Design Review Checklist Template for page shell and design-system checks.
- TPL-009: Verification Note Template for desktop screenshots, mobile screenshots, accessibility results, exceptions, and UI evidence.
- TPL-011: GC Web Application Baseline Assessment Template for release or meaningful-change baseline assessment records.
- TPL-012: Control Template for reusable control documents.
- TPL-013: Baseline Profile Template for reusable baseline profile documents.

Use `architecture_docs/templates/README.md` in generated solution repos to
resolve a `TPL-*` ID to the current generated file path.

Use [docs/templates/evidence-bundle-template.md](evidence-bundle-template.md) when a reviewer needs a compact record of what changed, what checks ran, what artifacts were affected, who reviewed or approved the result, and what risk remains.
