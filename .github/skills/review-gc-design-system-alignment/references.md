# References

Use this manifest to load design-system alignment references without duplicating the review procedure.

## Always Load

- [docs/repo-guidance/architecture-docs.md](../../../docs/repo-guidance/architecture-docs.md): catalog-driven architecture document lookup rules.
- `architecture_docs/patterns/catalog.yml`: pattern routing by problem, category, fit criteria, and related patterns.
- STD-006: GC UI Page Layout Rules: local approved page pattern and page shell rules.
- STD-005: Frontend GC Design System: GC Design System frontend standard.
- PAT-001: UI Page Patterns: approved starter page patterns.
- TPL-007: Page Pattern Decision Template: expected decision shape.
- TPL-008: Design Review Checklist Template: design-system check template.
- TPL-009: Verification Note Template: UI evidence template.

Load matched UI `PAT-*` documents from the pattern catalog when the recorded
decision, implementation, or review evidence names a specific page, flow, data
display, feedback, or navigation pattern. Do not maintain an exhaustive pattern
list in this manifest.

## Load For Frontend Code

- `frontend/`: frontend source, routes, components, tests, styles, and package configuration.
- [scripts/delorean/run-ui-page-shell-checks.sh](../../../scripts/delorean/run-ui-page-shell-checks.sh): lightweight page shell checker.
- [scripts/delorean/run-frontend-standards-checks.sh](../../../scripts/delorean/run-frontend-standards-checks.sh): GC Design System usage guard.

## Load For Accessibility And Evidence

- STD-007: UI Accessibility Basics: accessibility starter standard.
- [docs/templates/evidence-bundle-template.md](../../../docs/templates/evidence-bundle-template.md): broader evidence summary template.
- [docs/reference/local-verification.md](../../../docs/reference/local-verification.md): local verification commands and skip rules.

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
