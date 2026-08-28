# PAT-014: Bilingual Route and I18n

Type: Pattern
Status: Active

## Problem

Bilingual React applications need one source of truth for language, equivalent
routes, translated content, page titles, breadcrumbs, and language-toggle
behavior.

## Use When

- A frontend has English and French routes or content.
- The page shell includes a Government of Canada language toggle.
- Page titles, breadcrumbs, navigation labels, forms, and errors need
  translation.

## Do Not Use When

- The application is intentionally single-language and has recorded that
  decision.
- Language is controlled by an upstream platform and routes cannot include a
  language segment.

## Trade-Offs

- Language-prefixed routes make the active language explicit, but every route
  and link helper must carry the language parameter.
- Domain-split locale files keep content maintainable, but they require naming
  discipline and tests for missing keys.

## Approach

1. Put language at the route boundary, usually with `/:language` where accepted
   values are `en` and `fr`.
2. Redirect the bare root route to the default language route.
3. Treat the URL language as the source of truth during navigation. Use context
   or stored preferences only as fallbacks.
4. Set `document.documentElement.lang` from the effective route language before
   GC Design System web components render.
5. Use route IDs and a typed path helper to generate links instead of spreading
   hard-coded bilingual paths through components.
6. Put the language toggle in the shared header and point it to the equivalent
   route in the other official language.
7. If a direct equivalent page does not exist, route to the closest parent task
   area and record the reason.
8. Split locale resources by domain or feature once content grows beyond one
   page. Keep English and French namespace files aligned.
9. Map page IDs, breadcrumb IDs, navigation labels, form labels, errors, and
   success messages to locale namespaces.
10. For user preference changes that alter language, navigate to the new
    language route immediately after the authoritative update succeeds.
11. Record a mitigation when language switching can lose unsaved form state.

### Expected Files

- `frontend/src/routes.tsx`: language-prefixed route tree and route metadata.
- `frontend/src/i18n/index.ts`: namespace registration, locale imports, and
  page-to-namespace mapping.
- `frontend/src/utils/routeHelpers.ts`: typed route helper based on route IDs.
- `frontend/src/components/Layout/Header.tsx`: header language toggle behavior.
- `frontend/src/components/Layout/Breadcrumbs.tsx`: breadcrumb labels from route
  metadata and locale namespaces.
- `frontend/src/i18n/locales/en/*.json` and
  `frontend/src/i18n/locales/fr/*.json`: aligned bilingual resources.

## Checks

### Tests

- `/` redirects to the default language route.
- `/en/...` renders English UI and `/fr/...` renders French UI.
- Header language toggle reaches the equivalent page or documented parent.
- Route helper produces language-prefixed URLs.
- Breadcrumbs and top navigation use translated labels.
- Missing translation keys are visible in tests or review.

### Verification

- Desktop and mobile screenshots include the header language toggle on at least
  one English route and one French route.
- A bilingual route change updates `html[lang]`.
- Review confirms no standalone body language toggle was added.

### Stop Conditions

- Equivalent route behavior is ambiguous.
- The flow has unsaved personal information and language switching would drop
  it without warning or preservation.
- Translation ownership or review responsibility is unknown.

## Related Schema Contracts

- Schema contract: [ARCH-SCHEMA-PAT-014-BILINGUAL-ROUTE-I18N](../../schemas/patterns/pat-014-bilingual-route-and-i18n.schema.yaml)
- Used for: helping agents and reviewers check English and French route parity,
  i18n resources, language toggle, page metadata, breadcrumbs, and unsaved-input
  mitigation.
- Notes: The schema contract supports this pattern. It does not replace this
  pattern as the source of truth.
