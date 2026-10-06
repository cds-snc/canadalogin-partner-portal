---
name: figma-gcds-visual-compare
description: "Use when comparing an existing React frontend page to a Figma frame or Figma image and making approved visual corrections with the Government of Canada Design System. Compare one desktop Playwright view to the reference, present proposed changes before editing, and stop after one correction pass without cycling."
argument-hint: "Provide the target route, Figma frame URL or image, desktop viewport dimensions, and any auth or data assumptions."
user-invocable: true
---

# Figma GCDS Visual Compare

Compare an existing page in `frontend/` against a supplied Figma frame or image, propose concrete visual corrections, apply only approved corrections, and stop after one bounded correction pass. This skill is for visual alignment of an existing page, not for implementing a new page from scratch.

## Non-negotiable rules

1. **Use one desktop comparison.** Compare the Figma frame with a Playwright screenshot of the target route at the frame's desktop viewport dimensions. Do not use a mobile viewport, responsive sweep, or alternate viewport unless the user explicitly asks for one.
2. **Propose before editing.** After inspecting the reference and the current page, write a numbered proposed-change list before editing any file. Each item must name the file or component, the observed difference, and the intended correction. Wait for explicit user approval before applying visual changes.
3. **Do not cycle.** Perform one comparison before editing and one verification capture after the approved edits. Do not repeat the compare-edit-capture loop. If differences remain after verification, report them and stop.
4. **Preserve the application architecture.** Keep TanStack Router route files thin, use existing feature boundaries, preserve auth/data/localization behavior, and reuse existing GCDS wrappers from `frontend/src/components/ui/`.
5. **Do not make unrelated changes.** Limit edits to the target page, its feature-specific styles, and the smallest necessary shared component change. Do not refactor unrelated code or update the Figma file.
6. **Do not create a Git commit.** “Commit” in this workflow means applying the approved code changes. Only create a Git commit when the user explicitly requests one.

## Required inputs

Before beginning, identify or ask for:

- The target route and the page component that owns it.
- A Figma frame URL, Figma node id, or reference image file.
- The reference frame's desktop viewport width and height. Use the frame dimensions when available; do not guess if they can be obtained from Figma metadata.
- Authentication, test data, feature flags, and any route state needed to render the page.
- Whether the comparison should include the full page or only the visible frame region.

If the route, reference, or desktop dimensions are missing and cannot be inferred safely, ask one focused question before starting. Do not edit while these inputs are unresolved.

## Workflow

### 1. Establish the current page

- Read the applicable repository and frontend instructions before touching UI code.
- Locate the route, page component, existing page shell, shared header/footer, and feature-specific styles.
- Identify the smallest implementation surface that controls each likely visual difference.
- Confirm the route can render with representative data and note any unavoidable dynamic content.
- Do not change code during this discovery step.

### 2. Inspect the Figma reference

- For a Figma URL or node id, use the Figma MCP screenshot and design context tools. Load the Figma design-to-code guidance before calling design-context tools.
- For an image file, inspect the image directly and record its pixel dimensions.
- Treat the screenshot as a visual reference, not as source code. Do not copy absolute-positioned Figma output.
- Record the reference viewport, page bounds, content container, major columns, typography hierarchy, spacing, controls, colors, borders, and visible states.
- Separate actual page differences from content or browser-rendering differences that should not be changed.

### 3. Capture the current desktop page

- Start the frontend dev server on an available port if one is not already running.
- Open the exact target route in Playwright at the Figma frame's desktop viewport dimensions.
- Establish the required auth and data state before comparing.
- Capture one screenshot using the same page region represented by the Figma frame. Use full-page capture only when the reference represents the full page.
- Check console errors, failed requests, missing assets, and route redirects before judging visual differences.
- Do not capture mobile or alternate responsive views for this workflow.

### 4. Produce the approval list

Compare the Figma reference and the Playwright capture in this order:

1. Page shell, header, breadcrumb, and content bounds.
2. Major rows, columns, section ordering, and vertical rhythm.
3. Typography family, weight, size, line height, and wrapping.
4. Component dimensions, padding, gaps, and alignment.
5. Colors, borders, shadows, icons, and visible states.

Before editing, present a concise list in this shape:

```text
Proposed visual changes
1. [file/component] Change [observed difference] to [specific correction].
2. [file/component] Change [observed difference] to [specific correction].

Not changing
- [dynamic content, browser rendering, or behavior intentionally left alone]
```

Stop and wait for explicit approval. Do not make a speculative edit while waiting.

### 5. Apply one approved correction pass

After approval:

- Apply only the approved changes in the smallest possible patch.
- Prefer existing GCDS component properties, wrappers, CSS Shortcuts, and `--gcds-*` tokens before feature CSS.
- Do not replace GCDS components with raw interactive elements or add a new styling framework.
- Preserve behavior, accessibility, localization, auth guards, and data loading.
- Run the narrowest relevant unit test, lint, or typecheck as soon as the edit is made.

### 6. Verify once and stop

- Reload the same route in Playwright at the same desktop viewport.
- Capture one final screenshot using the same crop and compare it with the Figma reference.
- Check for console errors, failed requests, overflow, clipping, and broken interaction.
- Run the focused tests and the frontend build when practical.
- Do not make a second correction pass. Report any remaining visual differences as follow-up work instead of cycling.

## Definition of done

- The Figma reference and target route were compared at the same desktop viewport dimensions.
- A concrete proposed-change list was shown before any visual edit.
- No file was edited without explicit approval of the proposed changes.
- Exactly one approved correction pass was applied.
- Exactly one post-edit desktop Playwright capture was used for verification.
- No mobile comparison or visual correction cycle was performed.
- Focused validation results and any remaining differences are reported clearly.
