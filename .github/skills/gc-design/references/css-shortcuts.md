# GC Design System — CSS Shortcuts Reference

CSS Shortcuts are utility classes shipped as `@gcds-core/css-shortcuts`.  
They use `--gcds-*` design tokens and follow GC visual language.

**Install:** `npm install @gcds-core/css-shortcuts`  
**Import:** `import '@gcds-core/css-shortcuts/dist/gcds-css-shortcuts.min.css'`  
**CDN:** `https://cdn.design-system.canada.ca/@gcds-core/css-shortcuts@1.1.0/dist/gcds-css-shortcuts.min.css`

## Responsive Prefixes
Apply a class only at a breakpoint:
```html
<div class="display-flex sm:display-block">
```
| Prefix | Breakpoint |
|--------|-----------|
| `sm:` | Small (mobile) |
| `md:` | Medium (tablet) |
| `lg:` | Large (desktop) |
| `xl:` | Extra large |

## State Prefixes
```html
<a class="hover:font-bold focus:text-primary">Link</a>
```
Available: `hover:`, `focus:`, `active:`, `disabled:`

---

## Layout

### Display
```html
class="display-block"
class="display-inline"
class="display-inline-block"
class="display-flex"
class="display-inline-flex"
class="display-grid"
class="display-none"          <!-- hidden -->
class="display-contents"
```

### Flexbox
```html
class="flex-row"              <!-- flex-direction: row -->
class="flex-column"           <!-- flex-direction: column -->
class="flex-row-reverse"
class="flex-column-reverse"
class="flex-wrap"
class="flex-nowrap"
class="flex-grow-1"
class="flex-shrink-0"
class="flex-1"                <!-- flex: 1 1 0 -->

<!-- Alignment (flex/grid) -->
class="justify-content-start"
class="justify-content-center"
class="justify-content-end"
class="justify-content-between"
class="justify-content-around"
class="justify-content-evenly"

class="align-items-start"
class="align-items-center"
class="align-items-end"
class="align-items-stretch"
class="align-items-baseline"

class="align-self-start"
class="align-self-center"
class="align-self-end"
class="align-self-stretch"
```

### Grid
```html
class="grid-col-1"    <!-- grid column span 1 -->
class="grid-col-2"
class="grid-col-3"
class="grid-col-4"
class="grid-col-6"
class="grid-col-12"
class="grid-row-2"
```

### Gap (spacing token numbers)
```html
class="gap-0"          <!-- 0 -->
class="gap-100"        <!-- 8px -->
class="gap-200"        <!-- 16px -->
class="gap-300"        <!-- 24px -->
class="gap-400"        <!-- 32px -- standard -->
class="gap-500"        <!-- 40px -->
class="gap-column-400" <!-- column gap only -->
class="gap-row-300"    <!-- row gap only -->
```

### Position
```html
class="position-relative"
class="position-absolute"
class="position-fixed"
class="position-sticky"
class="position-static"
```

### Overflow
```html
class="overflow-hidden"
class="overflow-auto"
class="overflow-scroll"
class="overflow-x-auto"
class="overflow-y-auto"
```

### Visibility
```html
class="visibility-hidden"   <!-- hides but preserves space -->
class="visibility-visible"
```

---

## Spacing (Margin & Padding)

Token scale: `0`, `25`, `50`, `75`, `100`, `125`, `150`, `175`, `200`, `225`, `250`, `300`, `350`, `400`, `450`, `500`, `550`, `600`, `700`, `800`, `900`, `1000`, `1200`

### Margin
```html
<!-- All sides -->
class="m-400"      <!-- margin: 32px -->

<!-- Directional -->
class="mt-300"     <!-- margin-top -->
class="mb-400"     <!-- margin-bottom -->
class="ml-200"     <!-- margin-left -->
class="mr-200"     <!-- margin-right -->
class="mx-400"     <!-- margin left+right -->
class="my-300"     <!-- margin top+bottom -->

<!-- Auto (centering) -->
class="mx-auto"
```

### Padding
```html
class="p-400"
class="pt-300"
class="pb-400"
class="pl-200"
class="pr-200"
class="px-400"     <!-- padding left+right -->
class="py-300"     <!-- padding top+bottom -->
```

---

## Typography

### Font Family
```html
class="font-family-heading"     /* var(--gcds-font-families-heading) */
class="font-family-body"        /* var(--gcds-font-families-body) */
class="font-family-monospace"   /* monospace */
```

### Font Size
```html
class="font-size-caption"   /* small/caption text */
class="font-size-body"      /* standard body text */
class="font-size-h6"
class="font-size-h5"
class="font-size-h4"
class="font-size-h3"
class="font-size-h2"
class="font-size-h1"
```

### Font Weight
```html
class="font-light"
class="font-regular"
class="font-medium"
class="font-semibold"
class="font-bold"
```

### Font Style
```html
class="font-italic"
class="font-normal"   /* resets italic */
```

### Text Colour
```html
class="text-primary"       /* --gcds-text-primary #333333 */
class="text-secondary"     /* --gcds-text-secondary #595959 */
class="text-light"         /* --gcds-text-light #ffffff */
class="text-danger"        /* --gcds-danger-text #b3192e */
class="text-disabled"      /* --gcds-disabled-text */
```

### Text Alignment
```html
class="text-left"
class="text-center"
class="text-right"
class="text-justify"
```

### Text Transform
```html
class="text-uppercase"
class="text-lowercase"
class="text-capitalize"
class="text-none"
```

### Text Overflow
```html
class="text-truncate"     /* overflow: hidden; text-overflow: ellipsis; white-space: nowrap */
class="text-break"
```

### Line Height
```html
class="line-height-normal"
class="line-height-tight"
class="line-height-loose"
```

### Link Colour
```html
class="link-colour-default"   /* --gcds-link-default */
class="link-colour-light"     /* --gcds-link-light (on dark bg) */
```

### Link Decoration
```html
class="link-underline"
class="link-no-underline"
```

### Link Size
```html
class="link-size-regular"
class="link-size-small"
```

### List Style
```html
class="list-unstyled"       /* removes bullets/numbers */
class="list-disc"
class="list-circle"
class="list-decimal"
class="list-none"
```

### Word Break
```html
class="word-break-all"
class="word-break-normal"
class="word-break-keep"
```

---

## Colour

### Background
```html
class="bg-white"      /* --gcds-bg-white */
class="bg-light"      /* --gcds-bg-light #f2f2f2 */
class="bg-primary"    /* --gcds-bg-primary #26374a (GC navy) */
class="bg-dark"       /* --gcds-bg-dark #333333 */
class="bg-danger"     /* --gcds-danger-background #b3192e */
class="bg-disabled"   /* --gcds-disabled-background */
```

### Border
```html
class="border-default"      /* --gcds-border-default */
class="border-danger"       /* --gcds-danger-border */
class="border-width-1"      /* 1px */
class="border-width-2"      /* 2px */
class="border-width-4"      /* 4px */
class="border-style-solid"
class="border-style-dashed"
class="border-style-none"
```

### Border Radius
```html
class="border-radius-sm"
class="border-radius-md"
class="border-radius-lg"
class="border-radius-pill"
class="border-radius-circle"  /* 50% */
```

---

## Sizing

### Container Sizing
```html
class="container-xs"    /* max-width: xs */
class="container-sm"
class="container-md"
class="container-lg"
class="container-xl"
class="container-full"  /* 100% width */
```

### Box Sizing
```html
class="box-border"      /* box-sizing: border-box */
class="box-content"     /* box-sizing: content-box */
```

---

## Interactive

### Cursor
```html
class="cursor-pointer"
class="cursor-default"
class="cursor-not-allowed"
class="cursor-text"
```

### Pointer Events
```html
class="pointer-events-none"
class="pointer-events-auto"
```

### Transition
```html
class="transition-base"     /* standard 0.2s ease transition */
class="transition-none"
```

---

## Icons (via CSS class)

```html
<!-- Use gcds-icon component instead for full a11y support -->
class="icon-sm"    /* --gcds-icon-size-sm */
class="icon-md"    /* --gcds-icon-size-md */
class="icon-lg"    /* --gcds-icon-size-lg */
```

---

## Images
```html
class="img-fluid"     /* max-width: 100%; height: auto */
class="img-cover"     /* object-fit: cover */
class="img-contain"   /* object-fit: contain */
```

---

## Common Patterns with CSS Shortcuts

### Centred page section
```html
<div class="display-flex flex-column align-items-center py-600 px-400">
  <gcds-heading tag="h2">Section title</gcds-heading>
  <gcds-text>Description here</gcds-text>
</div>
```

### Card grid layout
```html
<div class="display-grid gap-400" style="grid-template-columns: repeat(auto-fit, minmax(280px, 1fr))">
  <gcds-card card-title="Card 1" href="#" description="..."></gcds-card>
  <gcds-card card-title="Card 2" href="#" description="..."></gcds-card>
  <gcds-card card-title="Card 3" href="#" description="..."></gcds-card>
</div>
```

### Dark banner section
```html
<div class="bg-primary text-light px-400 py-600">
  <gcds-container size="xl" centered>
    <gcds-heading tag="h2" class="text-light">Banner heading</gcds-heading>
    <gcds-text class="text-light">Supporting description.</gcds-text>
  </gcds-container>
</div>
```
