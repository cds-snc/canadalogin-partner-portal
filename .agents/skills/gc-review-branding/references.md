# References

Use this manifest to load GC design and branding references without duplicating the checklist in `SKILL.md`.

## Always Load

- STD-005: Frontend GC Design System: GC Design System frontend standard.
- STD-017: Government of Canada Standards Review: broad GC standards impact check.
- STD-006: GC UI Page Layout Rules: approved page pattern and page shell rules.
- PAT-001: UI Page Patterns: approved starter page patterns.
- TPL-003: Standards Impact Template: standards impact block.

## Load For Frontend Code

- `frontend/`: frontend source, routes, components, tests, styles, and package configuration.
- [scripts/delorean/run-frontend-standards-checks.sh](../../../scripts/delorean/run-frontend-standards-checks.sh): local GC Design System usage guard.
- [scripts/delorean/run-ui-page-shell-checks.sh](../../../scripts/delorean/run-ui-page-shell-checks.sh): local page shell checker.
- STD-007: UI Accessibility Basics: accessibility starter standard.

## Review Checklist

- GC Design System: prefer official components for buttons, links, forms, alerts, breadcrumbs, containers, date modified, and other supported UI.
- Header: Government of Canada signature, appropriate Canada.ca link, header-provided language toggle, search, topic or theme menu, white background, separator, and page-type exceptions.
- Task structure: multi-task services use a task-oriented entry page and separate destination routes instead of putting unrelated workflows on one page.
- Breadcrumbs: present for standard pages where applicable, starts from Canada.ca context, uses accessible navigation labeling.
- Footer: correct page-type bands, Canada wordmark, privacy, terms and conditions, all contacts, departments and agencies, about government where applicable.
- Typography: local font choices and type scale align with GC Design System or documented local exception.
- Color: approved tokens or CSS variables for links, text, accent, error, focus, and brand elements; avoid arbitrary hardcoded colors.
- Content details: date modified where relevant, clear link text, Canada.ca layout consistency, no custom mandatory elements.
- Cross-checks: accessibility, bilingual behavior, and evidence inputs are named when UI is user-facing.

## External Official References

- [GC Design System start guide](https://design-system.canada.ca/en/start-to-use/): current design and code setup guidance.
- [GC Design System components](https://design-system.canada.ca/en/components/): current component catalogue.
- [GC Design System page templates](https://design-system.canada.ca/en/page-templates/): approved template starting points.
- [GC Design System basic page template](https://design-system.canada.ca/en/page-templates/basic/): basic page pattern.
- [GC Design System basic page code](https://design-system.canada.ca/en/page-templates/basic/code/): basic page code.
- [GC Design System header code](https://design-system.canada.ca/en/components/header/code/): header implementation source.
- [GC Design System language toggle design](https://design-system.canada.ca/en/components/language-toggle/design/): required language toggle placement and behavior.
- [GC Design System language toggle code](https://design-system.canada.ca/en/components/language-toggle/code/): code guidance and `gcds-header` support.
- [GC Design System footer](https://design-system.canada.ca/en/components/footer/): footer implementation source.
- [Canada.ca services and information pattern](https://design.canada.ca/common-design-patterns/services-information.html): task link pattern for landing pages that branch to destination pages.
- [Canada.ca most requested pattern](https://design.canada.ca/common-design-patterns/most-requested.html): top-task band for landing pages with many choices.
- [Canada.ca subway navigation pattern](https://design.canada.ca/common-design-patterns/subway-navigation.html): related task or process page navigation.
- [Canada.ca global header](https://design.canada.ca/common-design-patterns/global-header.html): Canada.ca header pattern and page-type guidance.
- [Canada.ca global footer](https://design.canada.ca/common-design-patterns/site-footer.html): Canada.ca footer bands and page-type guidance.
- [Canada.ca sub-footer band](https://design.canada.ca/common-design-patterns/site-footer-sub.html): mandatory sub-footer and wordmark guidance.

## External Skill Source

- [dougkeefe/gc-code-skills gc-review-branding](https://github.com/dougkeefe/gc-code-skills/tree/main/skills/gc-review-branding): public skill this local wrapper is adapted from.
