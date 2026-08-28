# References for delorean-ui

Always load:

- `STD-006: GC UI Page Layout Rules`
- `STD-005: Frontend GC Design System`
- `STD-018: Frontend CSS and Design-System Boundary`
- `architecture_docs/patterns/catalog.yml`
- `PAT-001: UI Page Patterns`
- `PAT-013: GC Design System React App Shell`
- `PAT-014: Bilingual Route and I18n`
- `PAT-015: Storybook UI Review Fixture`
- `TPL-007: Page Pattern Decision Template`
- `TPL-008: Design Review Checklist Template`
- `TPL-009: Verification Note Template`

Load matched UI patterns from `architecture_docs/patterns/catalog.yml` by
matching the task against pattern `categories`, `use_when`, `do_not_use_when`,
and `related_patterns`. The listed `PAT-*` IDs are stable anchors, not an
exhaustive UI pattern list.

Load when active change-state exists:

- `delorean/evidence/<change-id>/change-state.yaml`
- `delorean/gates/gate-catalog.yaml`

Load when OpenSpec is in scope:

- `docs/repo-guidance/openspec-and-delorean.md`
- `docs/reference/openspec-lifecycle.md`
- `openspec/changes/<change-id>/proposal.md`
- `openspec/changes/<change-id>/design.md`
- `openspec/changes/<change-id>/tasks.md`
- `openspec/changes/<change-id>/specs/**/spec.md`

Load when implementation is in the starter frontend:

- `frontend/README.md`
- `frontend/DEV_SETUP.md`
- `STD-004: Frontend React and TypeScript`
- `frontend/src/`

Related skills:

- `.github/skills/select-ui-page-pattern/SKILL.md`
- `.github/skills/review-gc-design-system-alignment/SKILL.md`
- `.github/skills/gc-standards/SKILL.md`
- `.github/skills/gc-review-a11y/SKILL.md`
- `.github/skills/gc-review-bilingual/SKILL.md`
- `.github/skills/gc-review-branding/SKILL.md`
