# GC Design System — Full Component API Reference

All components have two usage patterns:
- **Web Component** — plain HTML, any framework, CDN
- **React** — import from `@gcds-core/components-react` (v1.0+, stable)

**Install:**
```bash
npm install @gcds-core/components @gcds-core/components-react
```
```js
// index.js
import '@gcds-core/components-react/gcds.css';
```

**CDN (HTML/static):**
```html
<link rel="stylesheet" href="https://cdn.design-system.canada.ca/@gcds-core/components@1.3.0/dist/gcds/gcds.css" />
<script type="module" src="https://cdn.design-system.canada.ca/@gcds-core/components@1.3.0/dist/gcds/gcds.esm.js"></script>
```

**Rule:** Web Component uses `kebab-case` attributes. React wraps use `camelCase` props. Events go from `gcdsClick` → `onGcdsClick`.

---

## Contents
1. [Header](#header)
2. [Footer](#footer)
3. [Breadcrumbs](#breadcrumbs)
4. [Button](#button)
5. [Card](#card)
6. [Checkboxes](#checkboxes)
7. [Container](#container)
8. [Date Input](#date-input)
9. [Date Modified](#date-modified)
10. [Details](#details)
11. [Error Message](#error-message)
12. [Error Summary](#error-summary)
13. [Fieldset](#fieldset)
14. [File Uploader](#file-uploader)
15. [Grid](#grid)
16. [Heading](#heading)
17. [Icon](#icon)
18. [Input](#input)
19. [Language Toggle](#language-toggle)
20. [Link](#link)
21. [Notice](#notice)
22. [Pagination](#pagination)
23. [Radios](#radios)
24. [Screenreader-only](#screenreader-only)
25. [Search](#search)
26. [Select](#select)
27. [Side Navigation](#side-navigation)
28. [Signature](#signature)
29. [Stepper](#stepper)
30. [Table](#table)
31. [Text](#text)
32. [Textarea](#textarea)
33. [Theme and Topic Menu](#theme-and-topic-menu)
34. [Top Navigation](#top-navigation)

---

## Header

**When to use:** Required on every GC/Canada.ca page. Provides GC signature, language toggle, skip-to-content.

### Web Component
```html
<gcds-header
  lang-href="/fr/current-page"
  skip-to-href="#main-content"
  signature-variant="colour"
  signature-has-link
>
  <!-- Optional: search slot -->
  <gcds-search slot="search" placeholder="Search Canada.ca" action="/search"></gcds-search>
  <!-- Optional: breadcrumbs slot -->
  <gcds-breadcrumbs slot="breadcrumb">
    <gcds-breadcrumbs-item href="/en">Canada.ca</gcds-breadcrumbs-item>
  </gcds-breadcrumbs>
  <!-- Optional: top navigation slot -->
  <gcds-top-nav slot="menu" label="Main navigation">
    <gcds-nav-link href="/services">Services</gcds-nav-link>
  </gcds-top-nav>
  <!-- Optional: banner slot -->
  <div slot="banner">Site-wide alert</div>
</gcds-header>
```

### React
```jsx
import { GcdsHeader, GcdsSearch, GcdsBreadcrumbs, GcdsBreadcrumbsItem,
  GcdsTopNav, GcdsNavLink } from '@gcds-core/components-react';

// Minimal header
<GcdsHeader langHref="/fr/current-page" skipToHref="#main-content" />

// With search + breadcrumbs + nav
<GcdsHeader langHref="/fr" skipToHref="#main-content" signatureHasLink>
  <GcdsSearch slot="search" placeholder="Search Canada.ca" action="/search" />
  <GcdsBreadcrumbs slot="breadcrumb">
    <GcdsBreadcrumbsItem href="/en">Canada.ca</GcdsBreadcrumbsItem>
  </GcdsBreadcrumbs>
  <GcdsTopNav slot="menu" label="Main navigation">
    <GcdsNavLink href="/services">Services</GcdsNavLink>
  </GcdsTopNav>
</GcdsHeader>
```

| Prop (Web) | Prop (React) | Type | Description |
|---|---|---|---|
| `lang-href` | `langHref` | string | Required. URL for the language toggle link |
| `skip-to-href` | `skipToHref` | string | Required. Anchor for skip-to-content link |
| `signature-variant` | `signatureVariant` | `colour` \| `white` | GC signature colour variant |
| `signature-has-link` | `signatureHasLink` | boolean | Makes signature a link to canada.ca (default: `true`) |

**Slots:** `search`, `breadcrumb`, `menu`, `banner`, `signature`, `toggle`, `skip-to-nav`

---

## Footer

**When to use:** Required on every GC/Canada.ca page.

### Web Component
```html
<!-- Full footer with contextual links (Canada.ca pages) -->
<gcds-footer
  display="full"
  lang="en"
  contextual-heading="Canadian Digital Service"
  contextual-links='{ "Why GC Notify": "#", "Features": "#", "Activity on GC Notify": "#"}'
></gcds-footer>

<!-- Full footer with sub-links -->
<gcds-footer
  display="full"
  sub-links='{ "Terms and conditions": "#", "Privacy": "#" }'
></gcds-footer>

<!-- Compact footer (standalone apps/tools) -->
<gcds-footer display="compact" lang="en"></gcds-footer>
```

### React
```jsx
import { GcdsFooter } from '@gcds-core/components-react';

// Full footer with contextual links
<GcdsFooter
  display="full"
  lang="en"
  contextualHeading="Canadian Digital Service"
  contextualLinks={{ "Why GC Notify": "#", "Features": "#", "Activity on GC Notify": "#" }}
/>

// Compact footer
<GcdsFooter display="compact" lang="en" />
```

| Prop (Web) | Prop (React) | Values | Description |
|---|---|---|---|
| `display` | `display` | `full` \| `compact` | Full includes GC sub-brand links; compact is minimal (default: `compact`) |
| `lang` | `lang` | `en` \| `fr` | Language of footer content |
| `contextual-heading` | `contextualHeading` | string | Heading text for contextual links band |
| `contextual-links` | `contextualLinks` | JSON object string | Up to 3 links: `'{"label":"href"}'` |
| `sub-links` | `subLinks` | JSON object string | Footer links band links: `'{"label":"href"}'` |

---

## Breadcrumbs

**When to use:** Pages 2+ levels deep. Helps users understand and navigate the site hierarchy.

### Web Component
```html
<gcds-breadcrumbs>
  <gcds-breadcrumbs-item href="https://canada.ca/en">Canada.ca</gcds-breadcrumbs-item>
  <gcds-breadcrumbs-item href="/health-canada">Health Canada</gcds-breadcrumbs-item>
  <gcds-breadcrumbs-item href="/services">Services</gcds-breadcrumbs-item>
  <!-- Current page: no href, renders as plain text -->
  <gcds-breadcrumbs-item>Current page title</gcds-breadcrumbs-item>
</gcds-breadcrumbs>

<!-- Hide Canada.ca link -->
<gcds-breadcrumbs hide-canada-link>
  <gcds-breadcrumbs-item href="/dept">Department</gcds-breadcrumbs-item>
</gcds-breadcrumbs>
```

### React
```jsx
import { GcdsBreadcrumbs, GcdsBreadcrumbsItem } from '@gcds-core/components-react';

<GcdsBreadcrumbs>
  <GcdsBreadcrumbsItem href="https://canada.ca/en">Canada.ca</GcdsBreadcrumbsItem>
  <GcdsBreadcrumbsItem href="/health-canada">Health Canada</GcdsBreadcrumbsItem>
  <GcdsBreadcrumbsItem href="/services">Services</GcdsBreadcrumbsItem>
  <GcdsBreadcrumbsItem>Current page title</GcdsBreadcrumbsItem>
</GcdsBreadcrumbs>

// Hide Canada.ca link
<GcdsBreadcrumbs hideCanadaLink>
  <GcdsBreadcrumbsItem href="/dept">Department</GcdsBreadcrumbsItem>
</GcdsBreadcrumbs>
```

| Prop (Web) | Prop (React) | Type | Description |
|---|---|---|---|
| `hide-canada-link` | `hideCanadaLink` | boolean | Hides the default Canada.ca first item |

---

## Button

**When to use:** Initiating actions — submitting forms, triggering state changes. NOT for navigation (use `gcds-link`).

### Web Component
```html
<!-- Primary — main action -->
<gcds-button type="button" button-role="primary">Save changes</gcds-button>

<!-- Secondary — alternative action -->
<gcds-button type="button" button-role="secondary">Cancel</gcds-button>

<!-- Danger — destructive action -->
<gcds-button type="submit" button-role="danger">Delete account</gcds-button>

<!-- Link-style button (navigates) -->
<gcds-button button-role="link" href="/next-step">Continue</gcds-button>

<!-- Small size -->
<gcds-button button-role="primary" size="small">Add item</gcds-button>

<!-- Disabled -->
<gcds-button button-role="primary" disabled>Unavailable</gcds-button>
```

### React
```jsx
import { GcdsButton } from '@gcds-core/components-react';

<GcdsButton type="button" buttonRole="primary" onGcdsClick={handleSave}>
  Save changes
</GcdsButton>

<GcdsButton type="button" buttonRole="secondary" onGcdsClick={handleCancel}>
  Cancel
</GcdsButton>

<GcdsButton type="button" buttonRole="danger" onGcdsClick={handleDelete}>
  Delete account
</GcdsButton>

<GcdsButton buttonRole="link" href="/next-step">Continue</GcdsButton>

<GcdsButton buttonRole="primary" size="small" disabled>Unavailable</GcdsButton>
```

| Prop (Web) | Prop (React) | Values | Default | Description |
|---|---|---|---|---|
| `button-role` | `buttonRole` | `primary` \| `secondary` \| `danger` \| `link` | `primary` | Visual style |
| `type` | `type` | `button` \| `submit` \| `reset` | `button` | HTML button type |
| `size` | `size` | `regular` \| `small` | `regular` | Button size |
| `disabled` | `disabled` | boolean | false | Disables interaction |
| `href` | `href` | string | — | URL when `button-role="link"` |

**Events (Web):** `gcdsClick`, `gcdsFocus`, `gcdsBlur`
**Events (React):** `onGcdsClick`, `onGcdsFocus`, `onGcdsBlur`

---

## Card

**When to use:** Displaying a single navigable topic with title, description, optional image/badge.
**Note:** For richer multi-action cards, use GC Rich Card from `advanced-components.md`.

### Web Component
```html
<gcds-card
  card-title="Apply for Employment Insurance"
  href="/en/employment-insurance"
  description="Get financial support while you look for work."
  badge="New"
  img-src="/images/ei.jpg"
  img-alt="Person working at computer"
  card-title-tag="h3"
></gcds-card>
```

### React
```jsx
import { GcdsCard } from '@gcds-core/components-react';

<GcdsCard
  cardTitle="Apply for Employment Insurance"
  href="/en/employment-insurance"
  description="Get financial support while you look for work."
  badge="New"
  imgSrc="/images/ei.jpg"
  imgAlt="Person working at computer"
  cardTitleTag="h3"
/>
```

| Prop (Web) | Prop (React) | Type | Description |
|---|---|---|---|---|
| `card-title` | `cardTitle` | string | Required. The card heading/link text |
| `href` | `href` | string | Required. Destination URL |
| `description` | `description` | string | Short body text |
| `badge` | `badge` | string | Small label tag (e.g. "New", "Updated") |
| `img-src` | `imgSrc` | string | Image URL |
| `img-alt` | `imgAlt` | string | Image alt text (required if img-src set) |
| `card-title-tag` | `cardTitleTag` | `h3`–`h6` | Heading level for card title (default: `h3`) |
| `rel` | `rel` | string | Link relationship (e.g. `noopener noreferrer`) |
| `target` | `target` | string | Where to open link (e.g. `_blank`) |

---

## Checkboxes

**When to use:** Multiple options where any number can be selected.

### Web Component
```html
<gcds-checkboxes
  name="interests"
  legend="Select your interests"
  hint="Choose all that apply."
  required
>
  <gcds-checkbox value="health" checked>Health</gcds-checkbox>
  <gcds-checkbox value="benefits">Benefits</gcds-checkbox>
  <gcds-checkbox value="taxes">Taxes</gcds-checkbox>
  <gcds-checkbox value="other" disabled>Other (unavailable)</gcds-checkbox>
</gcds-checkboxes>

<!-- With validation error -->
<gcds-checkboxes
  name="agreement"
  legend="Terms and conditions"
  error-message="You must accept the terms to continue."
>
  <gcds-checkbox value="agree" required>I agree to the terms</gcds-checkbox>
</gcds-checkboxes>
```

### React
```jsx
import { GcdsCheckboxes, GcdsCheckbox } from '@gcds-core/components-react';

<GcdsCheckboxes
  name="interests"
  legend="Select your interests"
  hint="Choose all that apply."
  required
>
  <GcdsCheckbox value="health" checked>Health</GcdsCheckbox>
  <GcdsCheckbox value="benefits">Benefits</GcdsCheckbox>
  <GcdsCheckbox value="taxes">Taxes</GcdsCheckbox>
</GcdsCheckboxes>

// With error
<GcdsCheckboxes
  name="agreement"
  legend="Terms and conditions"
  errorMessage="You must accept the terms to continue."
>
  <GcdsCheckbox value="agree" required>I agree to the terms</GcdsCheckbox>
</GcdsCheckboxes>
```

| Prop (Web) | Prop (React) | Type | Description |
|---|---|---|---|
| `name` | `name` | string | Required. HTML name for the group |
| `legend` | `legend` | string | Required. Group label |
| `hint` | `hint` | string | Helper text below legend |
| `error-message` | `errorMessage` | string | Validation error text |
| `required` | `required` | boolean | Marks group as required |

**GcdsCheckbox props:**

| Prop (Web) | Prop (React) | Type | Description |
|---|---|---|---|
| `value` | `value` | string | Required. Submitted form value |
| `checked` | `checked` | boolean | Pre-checked state |
| `disabled` | `disabled` | boolean | Disables this option |
| `hint` | `hint` | string | Per-checkbox hint text |

---

## Container

**When to use:** Centred, max-width wrapper for page content.

### Web Component
```html
<!-- Standard page container -->
<gcds-container size="xl" centered tag="div">
  <!-- page content -->
</gcds-container>

<!-- Narrow container for forms -->
<gcds-container size="md" centered tag="section" padding>
  <gcds-input label="Full name" name="name" input-id="name"></gcds-input>
</gcds-container>

<!-- Full-width, no max-width -->
<gcds-container size="full" tag="div">
  <!-- edge-to-edge content -->
</gcds-container>
```

### React
```jsx
import { GcdsContainer, GcdsInput } from '@gcds-core/components-react';

// Standard page container
<GcdsContainer size="xl" centered tag="div">
  {/* page content */}
</GcdsContainer>

// Narrow form container
<GcdsContainer size="md" centered tag="section" padding>
  <GcdsInput label="Full name" name="name" inputId="name" />
</GcdsContainer>

// Full width
<GcdsContainer size="full" tag="div">
  {/* edge-to-edge content */}
</GcdsContainer>
```

| Prop (Web) | Prop (React) | Values | Default | Description |
|---|---|---|---|---|
| `size` | `size` | `xs` \| `sm` \| `md` \| `lg` \| `xl` \| `full` | `xl` | Max-width |
| `centered` | `centered` | boolean | false | Centers with auto margins |
| `tag` | `tag` | HTML tag string | `div` | Wrapper element |
| `padding` | `padding` | boolean | false | Adds horizontal padding |

---

## Date Input

**When to use:** When users must enter a known date (birthdate, expiry). NOT for calendar date pickers.

### Web Component
```html
<!-- Full date: day / month / year -->
<gcds-date-input
  name="birthdate"
  legend="Date of birth"
  format="full"
  required
  hint="For example, 15 6 1990."
></gcds-date-input>

<!-- Compact: month / year only -->
<gcds-date-input
  name="expiry"
  legend="Expiry date"
  format="compact"
></gcds-date-input>

<!-- With error -->
<gcds-date-input
  name="issued"
  legend="Issue date"
  format="full"
  error-message="Enter a valid issue date."
></gcds-date-input>
```

### React
```jsx
import { GcdsDateInput } from '@gcds-core/components-react';

// Full date
<GcdsDateInput
  name="birthdate"
  legend="Date of birth"
  format="full"
  required
  hint="For example, 15 6 1990."
/>

// Compact (month/year only)
<GcdsDateInput
  name="expiry"
  legend="Expiry date"
  format="compact"
/>

// With error
<GcdsDateInput
  name="issued"
  legend="Issue date"
  format="full"
  errorMessage="Enter a valid issue date."
/>
```

| Prop (Web) | Prop (React) | Values | Description |
|---|---|---|---|
| `name` | `name` | string | Required. Form field name |
| `legend` | `legend` | string | Required. Visible group label |
| `format` | `format` | `full` \| `compact` | `full` = day/month/year; `compact` = month/year |
| `required` | `required` | boolean | Marks as required |
| `hint` | `hint` | string | Helper text |
| `error-message` | `errorMessage` | string | Validation error text |
| `disabled` | `disabled` | boolean | Disables all date fields |
| `value` | `value` | string | Pre-filled date (ISO: YYYY-MM-DD) |

---

## Date Modified

**When to use:** Required on Canada.ca content pages. Shows when the page was last updated. Place above footer.

### Web Component
```html
<gcds-date-modified>2025-06-15</gcds-date-modified>
```

### React
```jsx
import { GcdsDateModified } from '@gcds-core/components-react';

<GcdsDateModified>2025-06-15</GcdsDateModified>
```

> Content is the date in `YYYY-MM-DD` format. Renders as "Date modified: June 15, 2025".

---

## Details

**When to use:** Hiding supplemental content behind a toggle. Good for FAQs, additional info. NOT for navigation.

### Web Component
```html
<!-- Basic expand/collapse -->
<gcds-details details-title="What documents do I need?">
  <gcds-text>You will need: a valid ID, proof of address, and your SIN.</gcds-text>
</gcds-details>

<!-- Open by default -->
<gcds-details details-title="Important notice" open>
  <gcds-text>Applications close June 30, 2025.</gcds-text>
</gcds-details>
```

### React
```jsx
import { GcdsDetails, GcdsText } from '@gcds-core/components-react';

// Basic
<GcdsDetails detailsTitle="What documents do I need?">
  <GcdsText>You will need: a valid ID, proof of address, and your SIN.</GcdsText>
</GcdsDetails>

// Open by default
<GcdsDetails detailsTitle="Important notice" open>
  <GcdsText>Applications close June 30, 2025.</GcdsText>
</GcdsDetails>
```

| Prop (Web) | Prop (React) | Type | Description |
|---|---|---|---|
| `details-title` | `detailsTitle` | string | Required. The trigger/summary text |
| `open` | `open` | boolean | Expanded by default |

---

## Error Message

**When to use:** Inline, directly below a form field with a validation error. Prefer using `error-message` prop on form inputs directly.

### Web Component
```html
<!-- Standalone error message -->
<gcds-error-message message-id="email-error">
  Enter a valid email address, like name@example.com
</gcds-error-message>

<!-- Preferred: use error-message prop directly on input -->
<gcds-input
  input-id="email"
  label="Email address"
  name="email"
  type="email"
  required
  error-message="Enter a valid email address, like name@example.com"
></gcds-input>
```

### React
```jsx
import { GcdsErrorMessage, GcdsInput } from '@gcds-core/components-react';

// Standalone
<GcdsErrorMessage messageId="email-error">
  Enter a valid email address, like name@example.com
</GcdsErrorMessage>

// Preferred: error prop on the input
<GcdsInput
  inputId="email"
  label="Email address"
  name="email"
  type="email"
  required
  errorMessage="Enter a valid email address, like name@example.com"
/>
```

| Prop (Web) | Prop (React) | Type | Description |
|---|---|---|---|
| `message-id` | `messageId` | string | ID linking this message to its field via `aria-describedby` |

---

## Error Summary

**When to use:** At the top of a form when the user submits with errors. Lists all errors with anchor links. Must receive focus programmatically when shown.

### Web Component
```html
<gcds-error-summary
  heading="There are 2 errors on this page"
  listen
>
  <ul>
    <li><a href="#email">Email address is required</a></li>
    <li><a href="#phone">Phone number must be 10 digits</a></li>
  </ul>
</gcds-error-summary>
```

### React
```jsx
import { GcdsErrorSummary } from '@gcds-core/components-react';

<GcdsErrorSummary heading="There are 2 errors on this page" listen>
  <ul>
    <li><a href="#email">Email address is required</a></li>
    <li><a href="#phone">Phone number must be 10 digits</a></li>
  </ul>
</GcdsErrorSummary>
```

| Prop (Web) | Prop (React) | Type | Description |
|---|---|---|---|
| `heading` | `heading` | string | Required. Summary heading (e.g. "There are N errors") |
| `listen` | `listen` | boolean | Auto-focuses the summary when it appears in DOM |

---

## Fieldset

**When to use:** Grouping related form fields under a shared visible label. Required wrapper for radio and checkbox groups.

### Web Component
```html
<gcds-fieldset
  fieldset-id="contact-info"
  legend="Contact information"
  hint="We'll use this to reach you about your application."
>
  <gcds-input input-id="fname" label="First name" name="first-name" required></gcds-input>
  <gcds-input input-id="lname" label="Last name" name="last-name" required></gcds-input>
  <gcds-input input-id="email" label="Email" name="email" type="email"></gcds-input>
</gcds-fieldset>

<!-- With error -->
<gcds-fieldset
  fieldset-id="dob-group"
  legend="Date of birth"
  error-message="Enter a valid date of birth."
>
  <gcds-date-input name="dob" format="full"></gcds-date-input>
</gcds-fieldset>
```

### React
```jsx
import { GcdsFieldset, GcdsInput, GcdsDateInput } from '@gcds-core/components-react';

<GcdsFieldset
  fieldsetId="contact-info"
  legend="Contact information"
  hint="We'll use this to reach you about your application."
>
  <GcdsInput inputId="fname" label="First name" name="first-name" required />
  <GcdsInput inputId="lname" label="Last name" name="last-name" required />
  <GcdsInput inputId="email" label="Email" name="email" type="email" />
</GcdsFieldset>

// With error
<GcdsFieldset
  fieldsetId="dob-group"
  legend="Date of birth"
  errorMessage="Enter a valid date of birth."
>
  <GcdsDateInput name="dob" format="full" />
</GcdsFieldset>
```

| Prop (Web) | Prop (React) | Type | Description |
|---|---|---|---|
| `fieldset-id` | `fieldsetId` | string | ID for the fieldset element |
| `legend` | `legend` | string | Required. Visible group label |
| `hint` | `hint` | string | Helper text below legend |
| `error-message` | `errorMessage` | string | Validation error text |
| `required` | `required` | boolean | Marks as required |
| `disabled` | `disabled` | boolean | Disables all fields inside |

---

## File Uploader

**When to use:** Allowing users to attach files (PDFs, images, documents) to a submission.

### Web Component
```html
<!-- Single file -->
<gcds-file-uploader
  label="Upload your resume"
  name="resume"
  accept=".pdf,.doc,.docx"
  hint="PDF or Word document, maximum 10MB."
></gcds-file-uploader>

<!-- Multiple files with error -->
<gcds-file-uploader
  label="Upload supporting documents"
  name="documents"
  accept=".pdf,.jpg,.png"
  multiple
  hint="Up to 5 files, max 5MB each."
  error-message="At least one document is required."
></gcds-file-uploader>
```

### React
```jsx
import { GcdsFileUploader } from '@gcds-core/components-react';

// Single file
<GcdsFileUploader
  label="Upload your resume"
  name="resume"
  accept=".pdf,.doc,.docx"
  hint="PDF or Word document, maximum 10MB."
/>

// Multiple files
<GcdsFileUploader
  label="Upload supporting documents"
  name="documents"
  accept=".pdf,.jpg,.png"
  multiple
  hint="Up to 5 files, max 5MB each."
  errorMessage="At least one document is required."
/>
```

| Prop (Web) | Prop (React) | Type | Description |
|---|---|---|---|
| `label` | `label` | string | Required. Visible field label |
| `name` | `name` | string | Required. HTML name attribute |
| `accept` | `accept` | string | Comma-separated MIME types or file extensions |
| `multiple` | `multiple` | boolean | Allow multiple file selection |
| `hint` | `hint` | string | Helper text (file types, size limits) |
| `error-message` | `errorMessage` | string | Validation error text |
| `required` | `required` | boolean | Marks as required |
| `disabled` | `disabled` | boolean | Disables the uploader |

---

## Grid

**When to use:** Multi-column responsive layouts.

### Web Component
```html
<!-- 3 columns desktop, 2 tablet, 1 mobile -->
<gcds-grid
  columns-desktop="1fr 1fr 1fr"
  columns-tablet="1fr 1fr"
  columns="1fr"
  gap="400"
  tag="div"
>
  <gcds-card card-title="Service 1" href="/service-1"></gcds-card>
  <gcds-card card-title="Service 2" href="/service-2"></gcds-card>
  <gcds-card card-title="Service 3" href="/service-3"></gcds-card>
</gcds-grid>

<!-- Sidebar + main content layout -->
<gcds-grid columns="220px 1fr" columns-tablet="1fr" gap="600" tag="div">
  <aside><gcds-side-nav label="Section nav">...</gcds-side-nav></aside>
  <main>...</main>
</gcds-grid>

<!-- With alignment -->
<gcds-grid columns="1fr 1fr" alignment="center" container="md">
  <p>1</p><p>2</p>
</gcds-grid>
```

### React
```jsx
import { GcdsGrid, GcdsCard } from '@gcds-core/components-react';

// 3-column responsive grid
<GcdsGrid
  columnsDesktop="1fr 1fr 1fr"
  columnsTablet="1fr 1fr"
  columns="1fr"
  gap="400"
  tag="div"
>
  <GcdsCard cardTitle="Service 1" href="/service-1" />
  <GcdsCard cardTitle="Service 2" href="/service-2" />
  <GcdsCard cardTitle="Service 3" href="/service-3" />
</GcdsGrid>

// Sidebar layout
<GcdsGrid columns="220px 1fr" columnsTablet="1fr" gap="600" tag="div">
  <aside>...</aside>
  <main>...</main>
</GcdsGrid>
```

| Prop (Web) | Prop (React) | Values | Description |
|---|---|---|---|
| `columns` | `columns` | string | **Default breakpoint** — CSS `grid-template-columns` (mobile/base) |
| `columns-tablet` | `columnsTablet` | string | Columns at tablet (48em/768px+) |
| `columns-desktop` | `columnsDesktop` | string | Columns at desktop (64em/1024px+) |
| `gap` | `gap` | spacing token | Gap between cells (e.g. `400` = 32px) |
| `gap-tablet` | `gapTablet` | spacing token | Gap at tablet |
| `gap-desktop` | `gapDesktop` | spacing token | Gap at desktop |
| `tag` | `tag` | `div` \| `article` \| `section` \| `nav` \| `main` \| `aside` \| `ul` \| `ol` \| `dl` | Wrapper element (default: `div`) |
| `alignment` | `alignment` | `start` \| `center` \| `end` | Grid alignment when container is larger than grid |
| `container` | `container` | `xs` \| `sm` \| `md` \| `lg` \| `xl` \| `full` | Max-width container for grid |
| `display` | `display` | `grid` \| `inline-grid` | Display mode (default: `grid`) |
| `align-content` | `alignContent` | See docs | Align grid on block axis |
| `align-items` | `alignItems` | See docs | Align items on block axis |
| `justify-content` | `justifyContent` | See docs | Align grid on inline axis |
| `justify-items` | `justifyItems` | See docs | Align items on inline axis |
| `place-content` | `placeContent` | See docs | Shorthand for align + justify content |
| `place-items` | `placeItems` | See docs | Shorthand for align + justify items |

---

## Heading

**When to use:** All page and section titles. Maintains accessible heading hierarchy with GC typography.

### Web Component
```html
<gcds-heading tag="h1">Apply for Employment Insurance</gcds-heading>
<gcds-heading tag="h2">Eligibility requirements</gcds-heading>

<!-- Semantic h3 visually styled as h4 -->
<gcds-heading tag="h3" size="h4">Additional details</gcds-heading>

<!-- Custom spacing -->
<gcds-heading tag="h2" margin-top="400" margin-bottom="200">
  Important information
</gcds-heading>
```

### React
```jsx
import { GcdsHeading } from '@gcds-core/components-react';

<GcdsHeading tag="h1">Apply for Employment Insurance</GcdsHeading>
<GcdsHeading tag="h2">Eligibility requirements</GcdsHeading>

// Semantic h3, styled as h4
<GcdsHeading tag="h3" size="h4">Additional details</GcdsHeading>

// Custom spacing
<GcdsHeading tag="h2" marginTop="400" marginBottom="200">
  Important information
</GcdsHeading>
```

| Prop (Web) | Prop (React) | Values | Description |
|---|---|---|---|
| `tag` | `tag` | `h1`–`h6` | Required. Semantic heading level |
| `size` | `size` | `h1`–`h6` | Visual size (can differ from tag) |
| `margin-top` | `marginTop` | spacing token number | Override top margin |
| `margin-bottom` | `marginBottom` | spacing token number | Override bottom margin |

---

## Icon

**When to use:** Supporting meaning visually alongside text. Never use as the sole means of conveying information.

### Web Component
```html
<!-- Icon with accessible label -->
<gcds-icon name="checkmark" label="Success" size="md"></gcds-icon>

<!-- Decorative icon (no label = aria-hidden) -->
<gcds-icon name="chevron-right" size="sm"></gcds-icon>

<!-- Icon inside a button with text -->
<gcds-button type="button" button-role="primary">
  <gcds-icon name="download" size="sm"></gcds-icon>
  Download form
</gcds-button>

<!-- Icon-only button using sr-only for label -->
<gcds-button type="button" button-role="secondary">
  <gcds-icon name="close" size="sm"></gcds-icon>
  <gcds-sr-only>Close dialog</gcds-sr-only>
</gcds-button>
```

### React
```jsx
import { GcdsIcon, GcdsButton, GcdsSrOnly } from '@gcds-core/components-react';

// With accessible label
<GcdsIcon name="checkmark" label="Success" size="md" />

// Decorative
<GcdsIcon name="chevron-right" size="sm" />

// Inside button with text
<GcdsButton type="button" buttonRole="primary">
  <GcdsIcon name="download" size="sm" />
  Download form
</GcdsButton>

// Icon-only button
<GcdsButton type="button" buttonRole="secondary">
  <GcdsIcon name="close" size="sm" />
  <GcdsSrOnly>Close dialog</GcdsSrOnly>
</GcdsButton>
```

| Prop (Web) | Prop (React) | Values | Description |
|---|---|---|---|
| `name` | `name` | string | Required. Icon identifier |
| `size` | `size` | `xs` \| `sm` \| `md` \| `lg` \| `xl` | Icon size |
| `label` | `label` | string | Accessible label; omit for decorative icons |

Common icon names: `checkmark`, `alert-circle`, `info-circle`, `warning-triangle`, `chevron-right`, `chevron-down`, `chevron-up`, `chevron-left`, `external-link`, `download`, `upload`, `phone`, `email`, `search`, `close`, `menu`, `arrow-right`, `arrow-left`, `calendar`, `lock`, `user`, `home`, `print`, `edit`, `delete`, `add`

Full list: https://design-system.canada.ca/en/css-shortcuts/icon-names/

---

## Input

**When to use:** Short, single-line text entry. For long text use `gcds-textarea`; for dates use `gcds-date-input`.

### Web Component
```html
<!-- Standard text input -->
<gcds-input
  input-id="full-name"
  label="Full name"
  name="full-name"
  required
  hint="As it appears on your government-issued ID."
></gcds-input>

<!-- Email -->
<gcds-input input-id="email" label="Email address" name="email" type="email" required></gcds-input>

<!-- Phone -->
<gcds-input input-id="phone" label="Phone number" name="phone" type="tel" hint="Include area code."></gcds-input>

<!-- With validation error -->
<gcds-input
  input-id="postal"
  label="Postal code"
  name="postal"
  required
  error-message="Enter a valid postal code like A1A 1A1."
  value="12345"
></gcds-input>

<!-- Disabled -->
<gcds-input input-id="username" label="Username" name="username" value="jsmith" disabled></gcds-input>
```

### React
```jsx
import { GcdsInput } from '@gcds-core/components-react';

// Standard text input
<GcdsInput
  inputId="full-name"
  label="Full name"
  name="full-name"
  required
  hint="As it appears on your government-issued ID."
/>

// Email
<GcdsInput inputId="email" label="Email address" name="email" type="email" required />

// Phone
<GcdsInput inputId="phone" label="Phone number" name="phone" type="tel" hint="Include area code." />

// With error
<GcdsInput
  inputId="postal"
  label="Postal code"
  name="postal"
  required
  errorMessage="Enter a valid postal code like A1A 1A1."
  value="12345"
/>

// Disabled
<GcdsInput inputId="username" label="Username" name="username" value="jsmith" disabled />
```

| Prop (Web) | Prop (React) | Type | Description |
|---|---|---|---|
| `input-id` | `inputId` | string | Required. ID for the `<input>` element |
| `label` | `label` | string | Required. Visible label text |
| `name` | `name` | string | Required. HTML name attribute |
| `type` | `type` | `text` \| `email` \| `tel` \| `number` \| `password` \| `url` \| `search` | Input type |
| `required` | `required` | boolean | Marks as required |
| `hint` | `hint` | string | Helper text below label |
| `error-message` | `errorMessage` | string | Inline error (also sets `aria-invalid`) |
| `value` | `value` | string | Pre-filled value |
| `disabled` | `disabled` | boolean | Disables the input |
| `autocomplete` | `autoComplete` | string | HTML autocomplete hint |
| `size` | `size` | `full` \| `lg` \| `md` \| `sm` \| `char-2` … `char-10` | Visual field width |

**Events (Web):** `gcdsInput`, `gcdsChange`, `gcdsFocus`, `gcdsBlur`
**Events (React):** `onGcdsInput`, `onGcdsChange`, `onGcdsFocus`, `onGcdsBlur`

---

## Language Toggle

**When to use:** Switch between English and French. Normally embedded in `gcds-header` via `lang-href`. Use standalone for custom headers.

### Web Component
```html
<!-- Inside header (standard pattern) -->
<gcds-header lang-href="/fr/current-page"></gcds-header>

<!-- Standalone -->
<gcds-lang-toggle href="/fr/current-page" lang="en"></gcds-lang-toggle>
```

### React
```jsx
import { GcdsHeader, GcdsLangToggle } from '@gcds-core/components-react';

// Inside header (standard)
<GcdsHeader langHref="/fr/current-page" />

// Standalone
<GcdsLangToggle href="/fr/current-page" lang="en" />
```

| Prop (Web) | Prop (React) | Type | Description |
|---|---|---|---|
| `href` | `href` | string | Required. URL of the same page in the other language |
| `lang` | `lang` | `en` \| `fr` | Current page language (determines toggle label) |

---

## Link

**When to use:** Navigation to pages, files, email, phone, or anchors. NOT for triggering actions (use `gcds-button`).

### Web Component
```html
<!-- Standard internal link -->
<gcds-link href="/en/services">View services</gcds-link>

<!-- External link (adds icon, opens in new tab) -->
<gcds-link href="https://example.com" external>External website</gcds-link>

<!-- Download link -->
<gcds-link href="/forms/application.pdf" download="application-form.pdf">
  Download the application form (PDF, 250 KB)
</gcds-link>

<!-- Email link -->
<gcds-link href="mailto:info@canada.ca">Contact us by email</gcds-link>

<!-- Light variant (on dark background) -->
<div style="background: var(--gcds-bg-primary); padding: 16px;">
  <gcds-link href="/help" variant="light">Get help</gcds-link>
</div>
```

### React
```jsx
import { GcdsLink } from '@gcds-core/components-react';

// Standard
<GcdsLink href="/en/services">View services</GcdsLink>

// External
<GcdsLink href="https://example.com" external>External website</GcdsLink>

// Download
<GcdsLink href="/forms/application.pdf" download="application-form.pdf">
  Download the application form (PDF, 250 KB)
</GcdsLink>

// Email
<GcdsLink href="mailto:info@canada.ca">Contact us by email</GcdsLink>

// Light on dark bg
<GcdsLink href="/help" variant="light">Get help</GcdsLink>
```

| Prop (Web) | Prop (React) | Type | Description |
|---|---|---|---|
| `href` | `href` | string | Required. Destination URL |
| `external` | `external` | boolean | Opens in new tab with external icon |
| `download` | `download` | string | Triggers file download with given filename |
| `variant` | `variant` | `default` \| `light` | Light for use on dark backgrounds |
| `display` | `display` | `inline` \| `block` | Rendering mode |
| `size` | `size` | `regular` \| `small` \| `inherit` | Link text size |

---

## Notice

**When to use:** Persistent, important messages that are part of page content — info, warnings, errors, success.

### Web Component
```html
<!-- Info -->
<gcds-notice notice-role="info" notice-title="Processing time" notice-title-tag="h2">
  <gcds-text>Applications typically take 4 to 6 weeks to process.</gcds-text>
</gcds-notice>

<!-- Warning -->
<gcds-notice notice-role="warning" notice-title="Service disruption" notice-title-tag="h2">
  <gcds-text>This service will be unavailable Saturday 2–4 AM ET.</gcds-text>
</gcds-notice>

<!-- Danger/Error -->
<gcds-notice notice-role="danger" notice-title="Application deadline passed" notice-title-tag="h2">
  <gcds-text>The application period has closed.</gcds-text>
</gcds-notice>

<!-- Success -->
<gcds-notice notice-role="success" notice-title="Application submitted" notice-title-tag="h2">
  <gcds-text>We received your application. Reference: 2025-48291.</gcds-text>
</gcds-notice>
```

### React
```jsx
import { GcdsNotice, GcdsText } from '@gcds-core/components-react';

// Info
<GcdsNotice noticeRole="info" noticeTitle="Processing time" noticeTitleTag="h2">
  <GcdsText>Applications typically take 4 to 6 weeks to process.</GcdsText>
</GcdsNotice>

// Warning
<GcdsNotice noticeRole="warning" noticeTitle="Service disruption" noticeTitleTag="h2">
  <GcdsText>This service will be unavailable Saturday 2–4 AM ET.</GcdsText>
</GcdsNotice>

// Danger
<GcdsNotice noticeRole="danger" noticeTitle="Application deadline passed" noticeTitleTag="h2">
  <GcdsText>The application period has closed.</GcdsText>
</GcdsNotice>

// Success
<GcdsNotice noticeRole="success" noticeTitle="Application submitted" noticeTitleTag="h2">
  <GcdsText>We received your application. Reference: 2025-48291.</GcdsText>
</GcdsNotice>
```

| Prop (Web) | Prop (React) | Values | Description |
|---|---|---|---|
| `notice-role` | `noticeRole` | `info` \| `warning` \| `danger` \| `success` | Required. Visual variant (was `type` in v1.0) |
| `notice-title` | `noticeTitle` | string | Required. Bold heading text |
| `notice-title-tag` | `noticeTitleTag` | `h2`–`h6` \| `p` | HTML element for the title (default: `h2`) |

---

## Pagination

**When to use:** Navigating across multiple pages of results or content.

### Web Component
```html
<!-- List display (numbered pages) -->
<gcds-pagination
  display="list"
  label="Search results pagination"
  total-pages="15"
  current-page="3"
></gcds-pagination>

<!-- List with URL object for query strings -->
<gcds-pagination
  display="list"
  label="Search results"
  total-pages="15"
  current-page="9"
  url='{"queryStrings": { "page::offset": 1 }, "fragment": "main" }'
></gcds-pagination>

<!-- Simple display (previous/next only) -->
<gcds-pagination
  display="simple"
  label="Guide navigation"
  previous-href="/guide/step-2"
  previous-label="Step 2: Eligibility"
  next-href="/guide/step-4"
  next-label="Step 4: Documents required"
></gcds-pagination>
```

### React
```jsx
import { GcdsPagination } from '@gcds-core/components-react';

// List display
<GcdsPagination
  display="list"
  label="Search results pagination"
  totalPages={15}
  currentPage={currentPage}
  onGcdsPageChange={(e) => setCurrentPage(e.detail)}
/>

// Simple display
<GcdsPagination
  display="simple"
  label="Guide navigation"
  previousHref="/guide/step-2"
  previousLabel="Step 2: Eligibility"
  nextHref="/guide/step-4"
  nextLabel="Step 4: Documents required"
/>
```

| Prop (Web) | Prop (React) | Type | Description |
|---|---|---|---|
| `display` | `display` | `list` \| `simple` | List = numbered pages; simple = prev/next (default: `list`) |
| `label` | `label` | string | Required. Accessible `aria-label` |
| `total-pages` | `totalPages` | number | Total number of pages (list mode) |
| `current-page` | `currentPage` | number | Active page (list mode, default: 1) |
| `url` | `url` | JSON string/object | Query string/fragment builder for list links |
| `previous-href` | `previousHref` | string | URL for previous page (simple mode) |
| `next-href` | `nextHref` | string | URL for next page (simple mode) |
| `previous-label` | `previousLabel` | string | Label for previous link (simple mode) |
| `next-label` | `nextLabel` | string | Label for next link (simple mode) |

**Events (Web):** `gcdsPageChange`
**Events (React):** `onGcdsPageChange` — fires with new page number in `event.detail`

---

## Radios

**When to use:** Selecting exactly one option from a mutually exclusive list (2–7 options). For 8+ use `gcds-select`.

### Web Component
```html
<gcds-radios
  name="contact-preference"
  legend="Preferred contact method"
  required
  hint="Choose one option."
>
  <gcds-radio value="email">Email</gcds-radio>
  <gcds-radio value="phone">Phone</gcds-radio>
  <gcds-radio value="mail">Postal mail</gcds-radio>
</gcds-radios>

<!-- Pre-selected + error -->
<gcds-radios
  name="province"
  legend="Province of residence"
  required
  error-message="Select your province or territory."
>
  <gcds-radio value="on" checked>Ontario</gcds-radio>
  <gcds-radio value="qc">Quebec</gcds-radio>
  <gcds-radio value="other" hint="Includes territories">Other</gcds-radio>
</gcds-radios>
```

### React
```jsx
import { GcdsRadios, GcdsRadio } from '@gcds-core/components-react';

<GcdsRadios
  name="contact-preference"
  legend="Preferred contact method"
  required
  hint="Choose one option."
>
  <GcdsRadio value="email">Email</GcdsRadio>
  <GcdsRadio value="phone">Phone</GcdsRadio>
  <GcdsRadio value="mail">Postal mail</GcdsRadio>
</GcdsRadios>

// Pre-selected + error
<GcdsRadios
  name="province"
  legend="Province of residence"
  required
  errorMessage="Select your province or territory."
>
  <GcdsRadio value="on" checked>Ontario</GcdsRadio>
  <GcdsRadio value="qc">Quebec</GcdsRadio>
  <GcdsRadio value="other" hint="Includes territories">Other</GcdsRadio>
</GcdsRadios>
```

| Prop (Web) | Prop (React) | Type | Description |
|---|---|---|---|
| `name` | `name` | string | Required. Shared name for radio group |
| `legend` | `legend` | string | Required. Group label |
| `hint` | `hint` | string | Helper text below legend |
| `error-message` | `errorMessage` | string | Validation error text |
| `required` | `required` | boolean | Marks group as required |

**GcdsRadio individual props:**

| Prop (Web) | Prop (React) | Type | Description |
|---|---|---|---|
| `value` | `value` | string | Required. Submitted form value |
| `checked` | `checked` | boolean | Pre-selected state |
| `disabled` | `disabled` | boolean | Disables this option |
| `hint` | `hint` | string | Per-option hint text |

---

## Screenreader-only

**When to use:** Providing context for screen reader users that doesn't need to be visible — e.g. labels for icon-only buttons.

### Web Component
```html
<!-- Icon-only button with screen reader label -->
<gcds-button type="button" button-role="secondary">
  <gcds-icon name="close" size="sm"></gcds-icon>
  <gcds-sr-only>Close dialog</gcds-sr-only>
</gcds-button>

<!-- Inline context note (use tag="span") -->
<span>
  Sort by name
  <gcds-sr-only tag="span">(currently sorted ascending)</gcds-sr-only>
</span>
```

### React
```jsx
import { GcdsSrOnly, GcdsButton, GcdsIcon } from '@gcds-core/components-react';

// Icon-only button
<GcdsButton type="button" buttonRole="secondary">
  <GcdsIcon name="close" size="sm" />
  <GcdsSrOnly>Close dialog</GcdsSrOnly>
</GcdsButton>

// Inline (use tag="span" for inline rendering)
<span>
  Sort by name
  <GcdsSrOnly tag="span">(currently sorted ascending)</GcdsSrOnly>
</span>
```

| Prop (Web) | Prop (React) | Values | Description |
|---|---|---|---|---|
| `tag` | `tag` | HTML tag string | Wrapper element (default: `p`; use `span` for inline) |

---

## Search

**When to use:** Site-wide or section search. Usually placed in the `search` slot of `gcds-header`.

### Web Component
```html
<!-- In header slot (standard pattern) -->
<gcds-header lang-href="/fr" skip-to-href="#main-content">
  <gcds-search
    slot="search"
    placeholder="Search Canada.ca"
    action="/search"
    method="get"
  ></gcds-search>
</gcds-header>

<!-- Standalone search -->
<gcds-search
  placeholder="Search programs and services"
  action="/search"
  name="q"
></gcds-search>
```

### React
```jsx
import { GcdsHeader, GcdsSearch } from '@gcds-core/components-react';

// In header slot
<GcdsHeader langHref="/fr" skipToHref="#main-content">
  <GcdsSearch
    slot="search"
    placeholder="Search Canada.ca"
    action="/search"
    method="get"
  />
</GcdsHeader>

// Standalone
<GcdsSearch
  placeholder="Search programs and services"
  action="/search"
  name="q"
/>
```

| Prop (Web) | Prop (React) | Type | Description |
|---|---|---|---|
| `placeholder` | `placeholder` | string | Input placeholder text |
| `action` | `action` | string | Form `action` URL |
| `method` | `method` | `get` \| `post` | Form method (default: `get`) |
| `name` | `name` | string | Input name attribute (default: `q`) |
| `value` | `value` | string | Pre-filled search query |

---

## Select

**When to use:** Single selection from a long list (8+ options). For fewer options, prefer `gcds-radios`.

### Web Component
```html
<gcds-select
  select-id="province"
  label="Province or territory"
  name="province"
  required
  hint="Select where you currently live."
>
  <option value="">Select an option</option>
  <option value="ab">Alberta</option>
  <option value="bc">British Columbia</option>
  <option value="mb">Manitoba</option>
  <option value="nb">New Brunswick</option>
  <option value="nl">Newfoundland and Labrador</option>
  <option value="ns">Nova Scotia</option>
  <option value="nt">Northwest Territories</option>
  <option value="nu">Nunavut</option>
  <option value="on">Ontario</option>
  <option value="pe">Prince Edward Island</option>
  <option value="qc">Quebec</option>
  <option value="sk">Saskatchewan</option>
  <option value="yt">Yukon</option>
</gcds-select>

<!-- Pre-selected + error -->
<gcds-select
  select-id="language"
  label="Preferred official language"
  name="language"
  required
  value="en"
  error-message="Select your preferred official language."
>
  <option value="">Select an option</option>
  <option value="en">English</option>
  <option value="fr">French</option>
</gcds-select>
```

### React
```jsx
import { GcdsSelect } from '@gcds-core/components-react';

<GcdsSelect
  selectId="province"
  label="Province or territory"
  name="province"
  required
  hint="Select where you currently live."
>
  <option value="">Select an option</option>
  <option value="ab">Alberta</option>
  <option value="bc">British Columbia</option>
  <option value="mb">Manitoba</option>
  <option value="nb">New Brunswick</option>
  <option value="nl">Newfoundland and Labrador</option>
  <option value="ns">Nova Scotia</option>
  <option value="nt">Northwest Territories</option>
  <option value="nu">Nunavut</option>
  <option value="on">Ontario</option>
  <option value="pe">Prince Edward Island</option>
  <option value="qc">Quebec</option>
  <option value="sk">Saskatchewan</option>
  <option value="yt">Yukon</option>
</GcdsSelect>

// Pre-selected + error
<GcdsSelect
  selectId="language"
  label="Preferred official language"
  name="language"
  required
  value="en"
  errorMessage="Select your preferred official language."
>
  <option value="">Select an option</option>
  <option value="en">English</option>
  <option value="fr">French</option>
</GcdsSelect>
```

| Prop (Web) | Prop (React) | Type | Description |
|---|---|---|---|
| `select-id` | `selectId` | string | Required. ID for the `<select>` element |
| `label` | `label` | string | Required. Visible label |
| `name` | `name` | string | Required. HTML name attribute |
| `required` | `required` | boolean | Marks as required |
| `hint` | `hint` | string | Helper text |
| `error-message` | `errorMessage` | string | Validation error text |
| `value` | `value` | string | Pre-selected option value |
| `disabled` | `disabled` | boolean | Disables the select |

---

## Side Navigation

**When to use:** Left-panel vertical navigation for content-heavy multi-page sections (guides, policies, multi-chapter docs).

### Web Component
```html
<gcds-side-nav label="Benefits and services">
  <gcds-nav-group menu-label="Employment" href="/employment">
    <gcds-nav-link href="/employment/ei" current>Employment Insurance</gcds-nav-link>
    <gcds-nav-link href="/employment/cerb">CERB</gcds-nav-link>
  </gcds-nav-group>
  <gcds-nav-group menu-label="Retirement">
    <gcds-nav-link href="/retirement/cpp">Canada Pension Plan</gcds-nav-link>
    <gcds-nav-link href="/retirement/oas">Old Age Security</gcds-nav-link>
  </gcds-nav-group>
  <gcds-nav-link href="/contact">Contact us</gcds-nav-link>
</gcds-side-nav>
```

### React
```jsx
import { GcdsSideNav, GcdsNavGroup, GcdsNavLink } from '@gcds-core/components-react';

<GcdsSideNav label="Benefits and services">
  <GcdsNavGroup menuLabel="Employment" href="/employment">
    <GcdsNavLink href="/employment/ei" current>Employment Insurance</GcdsNavLink>
    <GcdsNavLink href="/employment/cerb">CERB</GcdsNavLink>
  </GcdsNavGroup>
  <GcdsNavGroup menuLabel="Retirement">
    <GcdsNavLink href="/retirement/cpp">Canada Pension Plan</GcdsNavLink>
    <GcdsNavLink href="/retirement/oas">Old Age Security</GcdsNavLink>
  </GcdsNavGroup>
  <GcdsNavLink href="/contact">Contact us</GcdsNavLink>
</GcdsSideNav>
```

**GcdsSideNav props:**

| Prop (Web) | Prop (React) | Type | Description |
|---|---|---|---|
| `label` | `label` | string | Required. Accessible `aria-label` for the nav |

**Slots:** `default` (nav links), `home` (home link with `slot="home"`)

**GcdsNavGroup props:**

| Prop (Web) | Prop (React) | Type | Description |
|---|---|---|---|
| `menu-label` | `menuLabel` | string | Required. Group heading text |
| `open-trigger` | `openTrigger` | string | Label for collapsed button trigger |
| `close-trigger` | `closeTrigger` | string | Label for expanded button trigger |
| `href` | `href` | string | Optional link for the group heading |
| `open` | `open` | boolean | Expanded by default |

**GcdsNavLink props:**

| Prop (Web) | Prop (React) | Type | Description |
|---|---|---|---|
| `href` | `href` | string | Required. Link URL |
| `current` | `current` | boolean | Marks as active/current page |
| `external` | `external` | boolean | External link treatment |

**Slots:** `default` (link text), `home` (on GcdsSideNav for home link)

---

## Signature

**When to use:** Displaying the Government of Canada wordmark. Normally embedded automatically in `gcds-header`. Use standalone only for custom headers or print.

### Web Component
```html
<!-- Government wordmark, colour variant -->
<gcds-signature type="government" variant="colour"></gcds-signature>

<!-- Flag symbol only -->
<gcds-signature type="flag" variant="colour"></gcds-signature>

<!-- White variant on dark background -->
<div style="background: var(--gcds-bg-primary); padding: 16px;">
  <gcds-signature type="government" variant="white"></gcds-signature>
</div>

<!-- Linked to Canada.ca -->
<gcds-signature type="government" variant="colour" has-link></gcds-signature>
```

### React
```jsx
import { GcdsSignature } from '@gcds-core/components-react';

// Standard colour wordmark
<GcdsSignature type="government" variant="colour" />

// Flag only
<GcdsSignature type="flag" variant="colour" />

// White on dark background
<GcdsSignature type="government" variant="white" />

// Linked to Canada.ca
<GcdsSignature type="government" variant="colour" hasLink />
```

| Prop (Web) | Prop (React) | Values | Description |
|---|---|---|---|
| `type` | `type` | `government` \| `flag` | Full wordmark or flag symbol only |
| `variant` | `variant` | `colour` \| `white` | Colour for light bg; white for dark bg |
| `has-link` | `hasLink` | boolean | Wraps signature in a link to Canada.ca |

---

## Stepper

**When to use:** Multi-step flows like applications, questionnaires, or guided processes.

### Web Component
```html
<!-- Step 2 of 5 -->
<gcds-stepper current-step="2" total-steps="5">
  Step 2 of 5: Personal information
</gcds-stepper>

<!-- Step 1 of 4 with custom tag -->
<gcds-stepper current-step="1" total-steps="4" tag="div">
  Step 1 of 4: Account setup
</gcds-stepper>
```

### React
```jsx
import { GcdsStepper } from '@gcds-core/components-react';

// Step 2 of 5
<GcdsStepper currentStep={2} totalSteps={5}>
  Step 2 of 5: Personal information
</GcdsStepper>

// Step 1 of 4 with custom tag
<GcdsStepper currentStep={1} totalSteps={4} tag="div">
  Step 1 of 4: Account setup
</GcdsStepper>
```

| Prop (Web) | Prop (React) | Type | Description |
|---|---|---|---|
| `current-step` | `currentStep` | number | Required. The active step number |
| `total-steps` | `totalSteps` | number | Required. Total number of steps |
| `tag` | `tag` | `h1` \| `h2` \| `h3` | Wrapper heading element (default: `h2`) |

---

## Table

**When to use:** Displaying tabular data — search results, benefit comparisons, records lists, application statuses.

Provides built-in sorting, filtering, and pagination. Data-driven via `columns` and `data` props.

### Web Component
```html
<gcds-table
  columns='[
    { "field": "name", "header": "Name", "rowHeader": true },
    { "field": "program", "header": "Program" },
    { "field": "status", "header": "Status", "alignment": "center" },
    { "field": "date", "header": "Date Submitted" }
  ]'
  data='[
    { "name": "Jane Smith", "program": "EI", "status": "Approved", "date": "2025-03-12" },
    { "name": "Marc Tremblay", "program": "CPP", "status": "Pending", "date": "2025-03-15" }
  ]'
  sort
  filter
  pagination
>
  <div slot="caption">
    <h5>Program applications</h5>
  </div>
</gcds-table>
```

### React
```jsx
import { GcdsTable } from '@gcds-core/components-react';

<GcdsTable
  columns={[
    { field: "name", header: "Name", rowHeader: true },
    { field: "program", header: "Program" },
    { field: "status", header: "Status", alignment: "center" },
    { field: "date", header: "Date Submitted" },
  ]}
  data={[
    { name: "Jane Smith", program: "EI", status: "Approved", date: "2025-03-12" },
    { name: "Marc Tremblay", program: "CPP", status: "Pending", date: "2025-03-15" },
  ]}
  sort
  filter
  pagination
/>
```

### Slotted custom cell content

Use `slotted: true` on a column and render custom content per row:

**HTML:** `<template slot="cell:<field>">` with `data-bind-*` attributes
**React:** `renderCell: ({ row, rowIndex, column, value }) => <JSX>`
**Vue:** `<template #<field>="{ row }">`
**Angular:** `<ng-template gcdsCell="<field>">`

```jsx
// React example — custom link in cell
<GcdsTable
  columns={[
    { field: "id", header: "ID", slotted: true, renderCell: ({ row }) => (
      <a href={`/submissions/${row.id}`}>{row.id}</a>
    )},
    { field: "status", header: "Status" },
  ]}
  data={[
    { id: "EXP-001", status: "Approved" },
    { id: "EXP-002", status: "Pending" },
  ]}
/>
```

### Column Object Properties

| Property | Type | Description |
|---|---|---|
| `field` | string | Required. Unique key matching data keys |
| `header` | string | Required. Column heading text |
| `alignment` | `start` \| `center` \| `end` | Horizontal alignment |
| `rowHeader` | boolean | Marks cells as row headers |
| `sort` | boolean | Enables sorting for this column |
| `sortDirection` | `asc` \| `desc` | Default sort order |
| `slotted` | boolean | Enables custom cell content |

### Table-level Props

| Prop (Web) | Prop (React) | Type | Description |
|---|---|---|---|
| `columns` | `columns` | array | Required. Column definitions |
| `data` | `data` | array | Required. Row data |
| `sort` | `sort` | boolean | Enable column sorting |
| `filter` | `filter` | boolean | Show keyword filter input |
| `filter-value` | `filterValue` | string | Default filter keyword |
| `pagination` | `pagination` | boolean | Enable pagination |
| `pagination-current-page` | `paginationCurrentPage` | number | Default page (default: 1) |
| `pagination-size` | `paginationSize` | number | Rows per page (default: 10) |
| `pagination-size-options` | `paginationSizeOptions` | array | Page size choices (default: [10, 25, 50, 0]) |

**Slots:** `caption` (accessible table caption)

---

## Text

**When to use:** All body text, paragraphs, captions. Applies GC-standard typography consistently.

### Web Component
```html
<!-- Body paragraph (default) -->
<gcds-text>
  Apply for Employment Insurance using your My Service Canada Account.
</gcds-text>

<!-- Caption / small text -->
<gcds-text size="caption">Last updated: June 2025</gcds-text>

<!-- Custom spacing -->
<gcds-text margin-top="0" margin-bottom="400">
  First paragraph with more space below.
</gcds-text>

<!-- Inline strong/em still work inside -->
<gcds-text>Submit <strong>before June 30, 2025</strong> to be considered.</gcds-text>

<!-- Span for inline text -->
<gcds-text tag="span">Inline styled text</gcds-text>
```

### React
```jsx
import { GcdsText } from '@gcds-core/components-react';

// Body text
<GcdsText>
  Apply for Employment Insurance using your My Service Canada Account.
</GcdsText>

// Caption
<GcdsText size="caption">Last updated: June 2025</GcdsText>

// Custom margins
<GcdsText marginTop="0" marginBottom="400">
  First paragraph with more space below.
</GcdsText>

// Inline span
<GcdsText tag="span">Inline styled text</GcdsText>
```

| Prop (Web) | Prop (React) | Values | Description |
|---|---|---|---|
| `size` | `size` | `body` \| `caption` | `body` = default; `caption` = small supporting text |
| `margin-top` | `marginTop` | spacing token number | Override top margin |
| `margin-bottom` | `marginBottom` | spacing token number | Override bottom margin |
| `tag` | `tag` | `p` \| `span` \| `div` \| `li` | Wrapper element (default: `p`) |

---

## Textarea

**When to use:** Multi-line text entry — descriptions, messages, long-form answers. For short text use `gcds-input`.

### Web Component
```html
<!-- Standard textarea -->
<gcds-textarea
  textarea-id="description"
  label="Describe your issue"
  name="description"
  rows="6"
  required
  hint="Provide as much detail as possible."
></gcds-textarea>

<!-- With character count and error -->
<gcds-textarea
  textarea-id="feedback"
  label="Your feedback"
  name="feedback"
  rows="4"
  character-count
  error-message="Feedback must be at least 20 characters."
></gcds-textarea>

<!-- Disabled with pre-filled content -->
<gcds-textarea
  textarea-id="notes"
  label="Previous submission"
  name="notes"
  rows="4"
  disabled
  value="Application reviewed and approved on March 1, 2025."
></gcds-textarea>
```

### React
```jsx
import { GcdsTextarea } from '@gcds-core/components-react';

// Standard
<GcdsTextarea
  textareaId="description"
  label="Describe your issue"
  name="description"
  rows={6}
  required
  hint="Provide as much detail as possible."
/>

// Character count + error
<GcdsTextarea
  textareaId="feedback"
  label="Your feedback"
  name="feedback"
  rows={4}
  characterCount
  errorMessage="Feedback must be at least 20 characters."
/>

// Disabled
<GcdsTextarea
  textareaId="notes"
  label="Previous submission"
  name="notes"
  rows={4}
  disabled
  value="Application reviewed and approved on March 1, 2025."
/>
```

| Prop (Web) | Prop (React) | Type | Description |
|---|---|---|---|
| `textarea-id` | `textareaId` | string | Required. ID for the `<textarea>` element |
| `label` | `label` | string | Required. Visible label |
| `name` | `name` | string | Required. HTML name attribute |
| `rows` | `rows` | number | Number of visible rows |
| `required` | `required` | boolean | Marks as required |
| `hint` | `hint` | string | Helper text below label |
| `error-message` | `errorMessage` | string | Validation error text |
| `value` | `value` | string | Pre-filled text content |
| `disabled` | `disabled` | boolean | Disables the field |
| `character-count` | `characterCount` | boolean | Shows live character count |

**Events (Web):** `gcdsInput`, `gcdsChange`, `gcdsFocus`, `gcdsBlur`
**Events (React):** `onGcdsInput`, `onGcdsChange`, `onGcdsFocus`, `onGcdsBlur`

---

## Theme and Topic Menu

**When to use:** Canada.ca government-wide navigation — top tasks from across GC websites.  
Place in the `menu` slot of `gcds-header`. Use `home` prop for Canada.ca front page.

### Web Component
```html
<gcds-topic-menu home></gcds-topic-menu>

<!-- In header -->
<gcds-header lang-href="/fr" skip-to-href="#main-content">
  <gcds-topic-menu slot="menu"></gcds-topic-menu>
</gcds-header>
```

### React
```jsx
import { GcdsTopicMenu, GcdsHeader } from '@gcds-core/components-react';

<GcdsHeader langHref="/fr" skipToHref="#main-content">
  <GcdsTopicMenu slot="menu" />
</GcdsHeader>
```

| Prop (Web) | Prop (React) | Type | Description |
|---|---|---|---|
| `home` | `home` | boolean | Homepage styling (Canada.ca front page) |

---

## Top Navigation

**When to use:** Horizontal navigation bar with section links and dropdowns. Place in the `menu` slot of `gcds-header`.

### Web Component
```html
<gcds-header lang-href="/fr" skip-to-href="#main-content">
  <gcds-top-nav slot="menu" label="Main navigation" alignment="end">

    <!-- Home link (slot="home") -->
    <gcds-nav-link href="#" slot="home">Service name</gcds-nav-link>

    <!-- Simple link -->
    <gcds-nav-link href="/contact">Contact</gcds-nav-link>

    <!-- Dropdown group -->
    <gcds-nav-group menu-label="Services" href="/services" open-trigger="Services" close-trigger="Close Services">
      <gcds-nav-link href="/services/ei">Employment Insurance</gcds-nav-link>
      <gcds-nav-link href="/services/cpp">Canada Pension Plan</gcds-nav-link>
      <gcds-nav-link href="/services/ccb">Canada Child Benefit</gcds-nav-link>
    </gcds-nav-group>

    <gcds-nav-group menu-label="Departments" open-trigger="Departments">
      <gcds-nav-link href="/departments/ircc">IRCC</gcds-nav-link>
      <gcds-nav-link href="/departments/cra">CRA</gcds-nav-link>
    </gcds-nav-group>

  </gcds-top-nav>
</gcds-header>
```

### React
```jsx
import { GcdsHeader, GcdsTopNav, GcdsNavGroup, GcdsNavLink } from '@gcds-core/components-react';

<GcdsHeader langHref="/fr" skipToHref="#main-content">
  <GcdsTopNav slot="menu" label="Main navigation" alignment="end">

    <GcdsNavLink href="/" slot="home">Service name</GcdsNavLink>

    <GcdsNavLink href="/contact">Contact</GcdsNavLink>

    <GcdsNavGroup menuLabel="Services" href="/services" openTrigger="Services" closeTrigger="Close Services">
      <GcdsNavLink href="/services/ei">Employment Insurance</GcdsNavLink>
      <GcdsNavLink href="/services/cpp">Canada Pension Plan</GcdsNavLink>
      <GcdsNavLink href="/services/ccb">Canada Child Benefit</GcdsNavLink>
    </GcdsNavGroup>

    <GcdsNavGroup menuLabel="Departments" openTrigger="Departments">
      <GcdsNavLink href="/departments/ircc">IRCC</GcdsNavLink>
      <GcdsNavLink href="/departments/cra">CRA</GcdsNavLink>
    </GcdsNavGroup>

  </GcdsTopNav>
</GcdsHeader>
```

**GcdsTopNav props:**

| Prop (Web) | Prop (React) | Type | Description |
|---|---|---|---|
| `label` | `label` | string | Required. Accessible `aria-label` for the nav |
| `alignment` | `alignment` | `start` \| `end` | Horizontal alignment (default: `start`) |

**Slots:** `default` (nav links), `home` (site title/logo link with `slot="home"`)

**GcdsNavGroup props:**

| Prop (Web) | Prop (React) | Type | Description |
|---|---|---|---|
| `menu-label` | `menuLabel` | string | Required. Group heading for nav landmark |
| `open-trigger` | `openTrigger` | string | Label for collapsed button trigger |
| `close-trigger` | `closeTrigger` | string | Label for expanded button trigger |
| `href` | `href` | string | Optional: makes group label a link |
| `open` | `open` | boolean | Opens dropdown by default |

**GcdsNavLink props:**

| Prop (Web) | Prop (React) | Type | Description |
|---|---|---|---|
| `href` | `href` | string | Required. Link destination |
| `current` | `current` | boolean | Marks as active/current page |
| `external` | `external` | boolean | External link treatment |

**Slots:** `default` (link text), `home` (on GcdsTopNav, rendered as site title)
