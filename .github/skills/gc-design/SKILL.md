---
name: gc-design
description: >
  Build Government of Canada web pages and applications using the GC Design System (GCDS).
  Use this skill whenever the user asks to build, design, or code anything for a Government of Canada (GC) website, 
  Canada.ca page, federal government digital service, or any product that must follow GC brand standards.
  Trigger for: "GC Design System", "gcds", "Canada.ca page", "government of Canada website", 
  "federal government app", "gc-design", "bilingual government page", "GC web component".
  This skill covers installation, all native GCDS components (Web Components + React), 
  CSS Shortcuts utility classes, design tokens, page templates, AND advanced gap-filling 
  components (Modal, Rich Card, Tabs, Badge, Toast, Skeleton) built with GCDS design 
  language + shadcn/Tailwind.
---

# GC Design System (GCDS) Skill

**Official docs:** https://design-system.canada.ca  
**GitHub:** https://github.com/cds-snc/gcds-components  
**Version:** Stable v1.3.0+ (components) / v1.1.0+ (css-shortcuts)

## Quick Decision Guide

| Situation | What to use |
|-----------|-------------|
| Building a Canada.ca / GC website page | Use GCDS Web Components + Basic Page Template |
| Building a React app | Use `@gcds-core/components-react` wrappers |
| Need custom styling on plain HTML | Use CSS Shortcuts utility classes |
| Design tokens for custom components | Use `--gcds-*` CSS variables |
| Displaying tabular data | Use native `<gcds-table>` (sort, filter, pagination built-in) |
| Need a Modal, rich Card, Tabs, Badge, etc. | Use Advanced Gap-filling Components (see below) |
| Quick layout adjustments | CSS Shortcuts (margin, padding, flex, grid classes) |

---

## 1. INSTALLATION

### HTML / Static (CDN — fastest to start)
```html
<head>
  <!-- GC Design System styles + web components -->
  <link rel="stylesheet" href="https://cdn.design-system.canada.ca/@gcds-core/components@1.3.0/dist/gcds/gcds.css" />
  <script type="module" src="https://cdn.design-system.canada.ca/@gcds-core/components@1.3.0/dist/gcds/gcds.esm.js"></script>
  
  <!-- CSS Shortcuts (utility classes) -->
  <link rel="stylesheet" href="https://cdn.design-system.canada.ca/@gcds-core/css-shortcuts@1.1.0/dist/gcds-css-shortcuts.min.css" />
</head>
```
> **Note:** `<script type="module">` requires a server. Use `<script nomodule>` for local file dev.

### React
```bash
npm install @gcds-core/components @gcds-core/components-react
npm install @gcds-core/css-shortcuts   # optional but recommended
```
```js
// index.js
import '@gcds-core/components-react/gcds.css';
import '@gcds-core/css-shortcuts/dist/gcds-css-shortcuts.min.css'; // optional
```

> **Note:** NPM scope changed from `@cdssnc/gcds-components` to `@gcds-core/components` as of v1.3.0.

### Vue / Angular / Other
See https://design-system.canada.ca/en/start-to-use/develop/ for framework-specific instructions.

---

## 2. PAGE TEMPLATE — BASIC PAGE

The **Basic Page** template is the starting point for any Canada.ca page.  
It includes: Header, Language Toggle, Breadcrumbs, Main content area, Date Modified, Footer.

**When to use:** Any GC web page, Canada.ca content page, service landing page.

### HTML Web Component Version
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Page title - Canada.ca</title>
  <!-- GCDS styles + components -->
  <link rel="stylesheet" href="https://cdn.design-system.canada.ca/@gcds-core/components@1.3.0/dist/gcds/gcds.css" />
  <script type="module" src="https://cdn.design-system.canada.ca/@gcds-core/components@1.3.0/dist/gcds/gcds.esm.js"></script>
  <!-- CSS Shortcuts (optional) -->
  <link rel="stylesheet" href="https://cdn.design-system.canada.ca/@gcds-core/css-shortcuts@1.1.0/dist/gcds-css-shortcuts.min.css" />
</head>
<body>
  <gcds-header
    lang-href="/fr"
    skip-to-href="#main-content"
    signature-has-link
  >
    <!-- Search (optional) -->
    <gcds-search slot="search"></gcds-search>
    <!-- Breadcrumbs (optional) -->
    <gcds-breadcrumbs slot="breadcrumb">
      <gcds-breadcrumbs-item href="https://canada.ca/en">Canada.ca</gcds-breadcrumbs-item>
      <gcds-breadcrumbs-item href="/department">Department</gcds-breadcrumbs-item>
    </gcds-breadcrumbs>
    <!-- Top navigation (optional) -->
    <gcds-top-nav slot="menu" label="Main menu">
      <gcds-nav-link href="#" slot="home">Service name</gcds-nav-link>
      <gcds-nav-link href="/services">Services</gcds-nav-link>
    </gcds-top-nav>
  </gcds-header>

  <main id="main-content">
    <gcds-container size="xl" centered tag="div">

      <gcds-heading tag="h1">Page Title</gcds-heading>
      <gcds-text>Your content here.</gcds-text>

      <gcds-date-modified>2025-01-15</gcds-date-modified>

    </gcds-container>
  </main>

  <gcds-footer
    display="full"
    contextual-heading="Canadian Digital Service"
    contextual-links='{ "Why GC Notify": "#", "Features": "#", "Activity on GC Notify": "#"}'
  ></gcds-footer>
</body>
</html>
```

### React Version
```jsx
import {
  GcdsHeader, GcdsFooter, GcdsContainer, GcdsBreadcrumbs, GcdsBreadcrumbsItem,
  GcdsHeading, GcdsText, GcdsDateModified, GcdsSearch, GcdsTopNav, GcdsNavLink
} from '@gcds-core/components-react';

export default function BasicPage() {
  return (
    <>
      <GcdsHeader langHref="/fr" skipToHref="#main-content" signatureHasLink>
        <GcdsSearch slot="search" />
        <GcdsBreadcrumbs slot="breadcrumb">
          <GcdsBreadcrumbsItem href="https://canada.ca/en">Canada.ca</GcdsBreadcrumbsItem>
          <GcdsBreadcrumbsItem href="/department">Department</GcdsBreadcrumbsItem>
        </GcdsBreadcrumbs>
        <GcdsTopNav slot="menu" label="Main menu">
          <GcdsNavLink href="/" slot="home">Service name</GcdsNavLink>
          <GcdsNavLink href="/services">Services</GcdsNavLink>
        </GcdsTopNav>
      </GcdsHeader>
      <main id="main-content">
        <GcdsContainer size="xl" centered tag="div">
          <GcdsHeading tag="h1">Page Title</GcdsHeading>
          <GcdsText>Your content here.</GcdsText>
          <GcdsDateModified>2025-01-15</GcdsDateModified>
        </GcdsContainer>
      </main>
      <GcdsFooter
        display="full"
        contextualHeading="Canadian Digital Service"
        contextualLinks={{ "Why GC Notify": "#", "Features": "#", "Activity on GC Notify": "#" }}
      />
    </>
  );
}
```

---

## 3. NATIVE GCDS COMPONENTS

For full component API details, see: `references/components.md`

### Canada.ca Required Components (must include on all GC pages)
- `gcds-header` / `<GcdsHeader>` — GC branded header with language toggle
- `gcds-footer` / `<GcdsFooter>` — GC branded footer
- `gcds-signature` / `<GcdsSignature>` — Government of Canada wordmark

### Layout Components
| Component | Web | React | Purpose |
|-----------|-----|-------|---------|
| Container | `<gcds-container>` | `<GcdsContainer>` | Centered max-width wrapper |
| Grid | `<gcds-grid>` | `<GcdsGrid>` | Responsive column layout |

### Navigation Components
| Component | Web | React | Purpose |
|-----------|-----|-------|---------|
| Breadcrumbs | `<gcds-breadcrumbs>` | `<GcdsBreadcrumbs>` | Page trail navigation |
| Pagination | `<gcds-pagination>` | `<GcdsPagination>` | Page index (use `total-pages`, not `total-items`) |
| Side navigation | `<gcds-side-nav>` | `<GcdsSideNav>` | Left vertical page menu (has `home` slot) |
| Top navigation | `<gcds-top-nav>` | `<GcdsTopNav>` | Horizontal site menu (has `home` slot, `alignment` prop) |
| Theme and topic menu | `<gcds-topic-menu>` | `<GcdsTopicMenu>` | **NEW** Canada.ca gov-wide nav (use `home` prop for homepage) |
| Language toggle | `<gcds-lang-toggle>` | `<GcdsLangToggle>` | EN/FR switcher |
| Link | `<gcds-link>` | `<GcdsLink>` | Navigational link |

### Content Components
| Component | Web | React | Purpose |
|-----------|-----|-------|---------|
| Heading | `<gcds-heading>` | `<GcdsHeading>` | h1–h6 headings |
| Text | `<gcds-text>` | `<GcdsText>` | Styled paragraph text |
| Notice | `<gcds-notice>` | `<GcdsNotice>` | Contextual alert (use `notice-role` prop, not `type`) |
| Card | `<gcds-card>` | `<GcdsCard>` | Basic content card |
| Details | `<gcds-details>` | `<GcdsDetails>` | Accordion/expand-collapse |
| Icon | `<gcds-icon>` | `<GcdsIcon>` | GC icon set |
| Stepper | `<gcds-stepper>` | `<GcdsStepper>` | Multi-step progress (tag default: `h2`) |
| Table | `<gcds-table>` | `<GcdsTable>` | **NEW** Data table with sort, filter, pagination |
| Date modified | `<gcds-date-modified>` | `<GcdsDateModified>` | Last updated timestamp |

### Form Components
| Component | Web | React | Purpose |
|-----------|-----|-------|---------|
| Button | `<gcds-button>` | `<GcdsButton>` | Actions (primary/secondary/danger) |
| Input | `<gcds-input>` | `<GcdsInput>` | Short text entry |
| Textarea | `<gcds-textarea>` | `<GcdsTextarea>` | Long text entry |
| Checkboxes | `<gcds-checkboxes>` | `<GcdsCheckboxes>` | Multi-select options |
| Radios | `<gcds-radios>` | `<GcdsRadios>` | Single-select options |
| Select | `<gcds-select>` | `<GcdsSelect>` | Dropdown list |
| Date input | `<gcds-date-input>` | `<GcdsDateInput>` | Memorable date entry |
| File uploader | `<gcds-file-uploader>` | `<GcdsFileUploader>` | File upload |
| Search | `<gcds-search>` | `<GcdsSearch>` | Search field |
| Fieldset | `<gcds-fieldset>` | `<GcdsFieldset>` | Group form elements |
| Error message | `<gcds-error-message>` | `<GcdsErrorMessage>` | Inline form error |
| Error summary | `<gcds-error-summary>` | `<GcdsErrorSummary>` | Page-level error list |

### Utility Components
| Component | Web | React | Purpose |
|-----------|-----|-------|---------|
| Screenreader-only | `<gcds-sr-only>` | `<GcdsSrOnly>` | Visually hidden text for a11y (tag default: `p`) |

---

## 4. CSS SHORTCUTS (Utility Classes)

For full class lists, see: `references/css-shortcuts.md`

CSS Shortcuts are **not** Tailwind — they are GCDS-specific utility classes using `--gcds-*` tokens.

### Key patterns:
- **Responsive prefix:** `sm:`, `md:`, `lg:`, `xl:` — e.g. `sm:display-flex`
- **State prefix:** `hover:`, `focus:` — e.g. `hover:font-bold`

### Most-used shorthand classes:
```html
<!-- Layout -->
<div class="display-flex gap-400 flex-wrap">...</div>
<div class="grid-col-2 sm:grid-col-1">...</div>

<!-- Spacing -->
<div class="mb-400 mt-300 px-200">...</div>

<!-- Typography -->
<p class="font-size-body font-bold text-primary">...</p>
<h2 class="font-family-heading font-semibold">...</h2>

<!-- Colour -->
<div class="bg-light border-default border-width-1">...</div>

<!-- Visibility -->
<span class="display-none sm:display-block">...</span>
```

---

## 5. DESIGN TOKENS

For complete reference (colour palette, spacing scale, typography tokens), see: `references/styles.md`

Token naming: `--gcds-{category}-{role}-{state}-{property}`

### Quick reference
```css
/* Text */
--gcds-text-primary      /* #333333 — main body text */
--gcds-text-light        /* #ffffff — text on dark bg */

/* Backgrounds */
--gcds-bg-primary        /* #26374a — GC navy blue */
--gcds-bg-light          /* #f2f2f2 */

/* Links */
--gcds-link-default      /* #1f497a */

/* Spacing */
--gcds-spacing-400       /* 32px — standard component spacing */
--gcds-spacing-200       /* 16px — tight spacing */
--gcds-spacing-600       /* 48px — section spacing */
```

---

## 6. ADVANCED GAP-FILLING COMPONENTS

> GCDS v1.3.0 adds native `<gcds-table>` with sorting, filtering, and pagination.  
> For remaining gaps (modal, richer cards, tabs, badges, toasts, skeletons) use the patterns below —  
> styled with GCDS design tokens to match the GC visual language.  
> For React projects, implement these with Tailwind/shadcn mapped to GCDS tokens.

> **Note:** The GC Table previously documented here is now superseded by the native `<gcds-table>` component.

For full implementation code, see: `references/advanced-components.md`

### When to use each:
| Component | Use when |
|-----------|----------|
| **GC Modal / Dialog** | Confirming destructive actions, displaying supplemental info, alerts |
| **GC Rich Card** | Content discovery: program listings, news items, service summaries |
| **GC Tabs** | Organizing related content in the same view space |
| **GC Badge/Tag** | Status labels, category tags, small metadata |
| **GC Toast/Alert** | Transient feedback after user actions |
| **GC Skeleton Loader** | Loading states while fetching content |

---

## 7. COMPONENT USAGE GUIDANCE

### ✅ DO
- Always include `gcds-header` and `gcds-footer` on every Canada.ca page
- Use `signature-has-link` on header for Canada.ca pages (links to canada.ca)
- Include `gcds-date-modified` for content pages
- Use `gcds-breadcrumbs` for pages 2+ levels deep in hierarchy (slot into header via `slot="breadcrumb"`)
- Use `gcds-error-summary` at top of form + `gcds-error-message` inline when validating
- Use design tokens (`var(--gcds-*)`) instead of hardcoded hex values
- Add bilingual support: set `lang` attribute, use `lang-href` on header
- Wrap main content in `<gcds-container size="xl" centered>` for consistent max-width
- Use `contextual-heading` + `contextual-links` props on footer (not slot) for contextual links
- Use `notice-role` prop (not `type`) on `<gcds-notice>` in v1.3.0+

### ❌ DON'T
- Don't use component design tokens (e.g. `--gcds-button-*`) outside their component
- Don't hardcode hex values — use global tokens instead
- Don't skip skip-to-content links (built into `gcds-header`)
- Don't use `gcds-card` for complex data display — use the GC Rich Card pattern instead
- Don't open links in new tabs without warning (WCAG a11y issue)
- Don't use deprecated `type` prop on `<gcds-notice>` — use `notice-role`

### Common Form Pattern
```html
<gcds-fieldset legend="Personal information">
  <gcds-input label="Full name" name="fullname" required></gcds-input>
  <gcds-input label="Email" name="email" type="email" required></gcds-input>
  <gcds-select label="Province" name="province">
    <option value="on">Ontario</option>
    <option value="qc">Quebec</option>
  </gcds-select>
  <gcds-button type="submit">Submit</gcds-button>
</gcds-fieldset>
```

---

## 8. BILINGUAL SUPPORT

GC websites must be bilingual (EN/FR). Pattern:

```html
<!-- English page -->
<html lang="en">
<gcds-header lang-href="/fr/page-name"></gcds-header>

<!-- French page -->
<html lang="fr">
<gcds-header lang-href="/en/page-name"></gcds-header>
```

---

## 9. ACCESSIBILITY REQUIREMENTS

GCDS components meet WCAG 2.1 AA. Additional requirements:
- All form inputs must have visible labels (use `gcds-input label` prop)
- Error messages must be announced to screen readers (gcds-error-message handles this)
- Focus order must be logical — use `gcds-sr-only` for off-screen context
- Colour contrast: never use base tokens alone — check against WCAG AA (4.5:1 text)
- Language attribute must be set on `<html>` tag

---

## Reference Files

- `references/components.md` — Full component API: all props, slots, events (includes new Table, Topic Menu)
- `references/css-shortcuts.md` — Complete CSS Shortcuts class reference  
- `references/styles.md` — Design tokens: colour palette, spacing scale, typography
- `references/advanced-components.md` — Full code for Modal, Rich Card, Tabs, Badge, Toast, Skeleton
