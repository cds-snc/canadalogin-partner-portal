---
name: figma-gcds-frontend
description: "Use when implementing a React frontend from a Figma frame or Figma URL in this repository. Translate the visual reference into the existing Government of Canada Design System (GCDS) wrappers, run the page, inspect it with Playwright, and iterate on visual differences."
argument-hint: "Provide the Figma frame URL or node id, the target route, and any interaction or data requirements."
user-invocable: true
---

# Figma to GCDS Frontend

Implement the requested Figma frame as a working React page in `frontend/`. Treat Figma as the visual and interaction specification, then express that design through the repository's existing architecture and GCDS components. The result must be a usable, responsive page rather than a static visual imitation.

## Non-negotiable rules

1. **Implement the referenced frame.** Match the frame's hierarchy, content, layout, controls, states, and responsive intent. Preserve existing route, auth, data-fetching, localization, and feature boundaries.
2. **Use GCDS components only for UI.** Prefer existing wrappers in `frontend/src/components/ui/`, then native `@gcds-core/components-react` components. Do not introduce another component library or replace GCDS components with custom controls.
3. **Use Figma MCP as a specification, not as source code.** Inspect the frame with Figma MCP, but do not copy generated code literally, reproduce Figma's absolute-positioning artifact, or treat a screenshot as the implementation. Translate the visual decisions into semantic React, GCDS properties, GCDS CSS Shortcuts, and `--gcds-*` tokens.
4. **Validate in a real browser and iterate.** Run the frontend, open the target route with Playwright, take screenshots at the reference viewport and at a responsive viewport, and fix visual differences. Repeat until the page is a close match across layout, spacing, typography, sizing, color, borders, and component states.

## Required workflow

### 1. Establish the implementation target

- Identify the target route, owning feature, existing page shell, and nearest reusable page or component in `frontend/src`.
- Read the applicable frontend skill and `frontend/.github` or repository instructions before editing UI code.
- Keep TanStack Router route files thin. Put page composition in `features/<name>/pages/`, orchestration in feature hooks, and API calls in `fetch/`.
- Check whether the frame is a new page, a replacement for an existing page, or a state of an existing page. Do not create a parallel route or duplicate an existing wrapper.
- Record the reference viewport dimensions, required URL, expected authenticated state, and any data or interaction assumptions before implementation.

### 2. Inspect the Figma frame through MCP

- If the user provides a Figma URL, extract the file key and node id. Convert URL node ids from hyphen format to colon format when required by the MCP tool.
- Load the Figma design-to-code guidance before calling `get_design_context`.
- Inspect the selected frame's design context, metadata, screenshot, and relevant child nodes. Use the screenshot to understand composition and the design context to understand structure, dimensions, typography, spacing, colors, states, and responsive clues.
- Identify the visual anchors that matter most: page chrome, content container width, column proportions, title block, primary action, repeated surfaces, form controls, and footer or continuation below the fold.
- Treat missing behavior, hover/focus states, responsive behavior, and content semantics as implementation decisions. Ask a focused question only when the frame cannot disambiguate a behavior that materially changes the page.

### 3. Map the frame to GCDS before writing JSX

Create a short component map in working notes before editing:

| Figma intent | Implementation choice |
| --- | --- |
| Page chrome | Existing `Header`, `Footer`, `Breadcrumbs`, `LangToggle`, `SideNav`, or native GCDS equivalent |
| Content width and columns | `Container`, `Grid`, semantic layout elements, and GCDS spacing utilities |
| Headings and body copy | `Heading`, `Text`, `Link`, or their native GCDS equivalents |
| Actions and navigation | `Button`, `Link`, or other appropriate GCDS action component |
| Forms and validation | Existing GCDS form wrappers and the repository's form conventions |
| Repeated information surfaces | `Card`, `Notice`, `Details`, `Table`, or another existing GCDS surface |

The map is a translation step, not a request to recreate every Figma layer. Use semantic HTML only for document structure such as `main`, `section`, `article`, lists, and layout containers. Do not use raw `h1`-`h6`, `p`, `a`, `button`, or form controls when a GCDS component is available.

### 4. Implement the smallest complete slice

- Reuse the closest existing page and shared wrappers before adding CSS or new components.
- Implement the visible frame plus the behavior a real user would expect: navigation, form submission, validation, loading, empty, error, hover, focus, disabled, and responsive states where applicable.
- Use the frame's copy and visual grouping, but keep text in the existing bilingual translation structure when the feature supports localization.
- Apply visual styling in this order: GCDS component properties, existing wrappers, GCDS CSS Shortcuts, GCDS design tokens, then a small feature-specific CSS rule only when the previous options cannot express the reference. Tailwind is an exception of last resort, not a default.
- Keep dimensions stable with responsive constraints. Avoid hard-coded absolute positioning unless the existing page architecture and the frame genuinely require it.
- Do not add decorative gradients, custom SVG UI icons, or a new design-token palette to force a visual match. Use GCDS icons and tokens.

### 5. Run the page

- Start the frontend dev server from `frontend/` with an available port. If the default port is occupied, choose another and retain the exact URL.
- Confirm the route loads without console errors, failed module requests, or missing assets before visual comparison.
- Use the real route and representative data. Do not validate only an isolated component story when the request is for a page.

### 6. Inspect with Playwright

Use the browser tools available in the environment to:

1. Open the running URL at the Figma reference viewport.
2. Capture a screenshot of the full page and the first viewport.
3. Inspect computed layout, bounding boxes, visible text, and console/network errors when the screenshot reveals a mismatch.
4. Exercise the important interactions and states, including keyboard focus where relevant.
5. Repeat at a narrow mobile viewport and a wider desktop viewport.

Compare in this order so large errors are corrected first:

- page shell and content container bounds
- major rows, columns, and vertical rhythm
- typography family, weight, size, line height, and wrapping
- component dimensions, padding, gaps, and alignment
- colors, borders, shadows, icons, and state styling
- responsive wrapping, overflow, and content visibility

After each meaningful visual correction, reload and capture the same viewport again. Do not rely on memory or a single successful page load. Stop when remaining differences are limited to unavoidable browser rendering or data differences and the page is structurally and visually close to the reference.

### 7. Complete the implementation checks

- Search changed JSX for raw interactive and text elements that should be GCDS components.
- Confirm the implementation uses existing shared wrappers where they exist and that any native GCDS import is justified by a missing wrapper.
- Confirm the route, auth behavior, bilingual content, loading/error states, and keyboard interaction follow the existing feature patterns.
- Run focused unit tests for the page or component, then frontend lint and build when the environment permits.
- Report the route, the Figma frame used, the Playwright viewport checks performed, any GCDS exceptions, and any remaining visual limitation.

## Definition of done

Do not consider the task complete until all of these are true:

- The referenced frame is implemented at the requested route.
- All UI controls and content surfaces use existing GCDS wrappers or native GCDS components.
- The page has been opened in a running browser with Playwright.
- The reference viewport and at least one mobile viewport have been visually checked.
- At least one fix cycle was performed from browser evidence, unless the first capture is demonstrably a close match.
- Focus, responsive, loading, and error behavior are not regressed.
- Focused tests, lint, and build checks pass or their concrete blockers are reported.