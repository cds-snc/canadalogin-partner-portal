# References

Use this manifest to load UI page pattern references without copying large standards into the skill.

## Always Load

- [docs/repo-guidance/architecture-docs.md](../../../docs/repo-guidance/architecture-docs.md): catalog-driven architecture document lookup rules.
- `architecture_docs/patterns/catalog.yml`: pattern routing by problem, category, fit criteria, and related patterns.
- STD-006: GC UI Page Layout Rules: local page shell and approved page pattern rules.
- PAT-001: UI Page Patterns: approved starter page patterns and source references.
- TPL-007: Page Pattern Decision Template: decision template.
- TPL-008: Design Review Checklist Template: design-system check template.
- TPL-009: Verification Note Template: UI evidence template.

## Load Matched UI Patterns From The Catalog

Use `architecture_docs/patterns/catalog.yml` to select matching `PAT-*`
documents for the current page or flow. Match on `primary_category`,
`categories`, `use_when`, `do_not_use_when`, and `related_patterns`. Load
matched design-system, frontend, accessibility, and testing patterns only when
they affect the decision. Do not add each new UI pattern to this manifest unless
the skill procedure or output format changes.

## Load For GC Design System Frontend Work

- STD-005: Frontend GC Design System: GC Design System frontend standard.
- STD-007: UI Accessibility Basics: accessibility starter standard.
- STD-004: Frontend React and TypeScript: React and TypeScript starter standard when the React starter is kept.
- `frontend/`: starter source, tests, and package configuration when the solution keeps it.

## Load For Verification And Evidence

- [scripts/delorean/run-ui-page-shell-checks.sh](../../../scripts/delorean/run-ui-page-shell-checks.sh): lightweight page shell checker.
- [scripts/delorean/run-frontend-standards-checks.sh](../../../scripts/delorean/run-frontend-standards-checks.sh): lightweight GC Design System usage guard.
- [docs/templates/evidence-bundle-template.md](../../../docs/templates/evidence-bundle-template.md): broader evidence summary template.

## External Official References

- [GC Design System page templates](https://design-system.canada.ca/en/page-templates/)
- [GC Design System basic page template](https://design-system.canada.ca/en/page-templates/basic/)
- [GC Design System basic page code](https://design-system.canada.ca/en/page-templates/basic/code/)
- [GC Design System header code](https://design-system.canada.ca/en/components/header/code/)
- [GC Design System language toggle design](https://design-system.canada.ca/en/components/language-toggle/design/)
- [GC Design System language toggle code](https://design-system.canada.ca/en/components/language-toggle/code/)
- [GC Design System footer](https://design-system.canada.ca/en/components/footer/)
- [GC Design System React install guide](https://design-system.canada.ca/en/start-to-use/develop/react/)
- [GC Design System HTML install guide](https://design-system.canada.ca/en/start-to-use/develop/html/)
- [Canada.ca services and information pattern](https://design.canada.ca/common-design-patterns/services-information.html)
- [Canada.ca most requested pattern](https://design.canada.ca/common-design-patterns/most-requested.html)
- [Canada.ca subway navigation pattern](https://design.canada.ca/common-design-patterns/subway-navigation.html)
- [Canada.ca theme and topic menu](https://design.canada.ca/common-design-patterns/site-menu.html)
- [GCWeb quick implementation guide](https://wet-boew.github.io/GCWeb/docs/implementing-en.html)
