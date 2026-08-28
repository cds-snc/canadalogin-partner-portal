# STD-018: Frontend CSS and Design-System Boundary

Type: Standard
Status: Active

## Read This When

Use this when adding or changing frontend CSS, layout classes, page shell
styling, custom UI wrappers, badges, cards, modals, or design-system overrides.

Use this with Government of Canada frontends that should follow the GC Design
System while still allowing product-specific layout and interaction needs.

## Rules

- Use GC Design System components, tokens, and documented layout behavior before
  adding custom CSS.
- Import GC Design System CSS once from the frontend entry point or one
  documented style entry. Do not duplicate the same design-system import across
  multiple application stylesheets.
- Keep global CSS limited to application shell layout, body or root setup,
  design-system imports, and documented utilities.
- Keep component, feature, and page-specific styles beside the component or in a
  clearly named feature stylesheet.
- Use GC Design System spacing, colour, and typography tokens when a token
  exists.
- Avoid hard-coded colours, fixed widths, fixed heights, and pixel-based layout
  values unless the value is required by an external asset, browser constraint,
  or recorded design decision.
- Do not style GC Design System internals or rely on generated internal class
  names unless the design-system documentation supports that extension point.
- Do not create custom buttons, inputs, links, alerts, cards, badges, or
  navigation elements when a GC Design System component fits.
- Treat custom visual components as exceptions. Record the component need, why a
  GC Design System component does not fit, and the accessibility behavior the
  custom component must preserve.
- Do not add broad utility classes such as `d-flex`, `mt-4`, or `gap-3` unless
  the project has an intentional utility CSS layer with naming rules.
- Remove demo CSS, unused CSS, and cleanup comments before promoting code into a
  reusable reference.
- Custom overlays, dialogs, and modals must use a vetted accessible component or
  library and must preserve focus management, keyboard dismissal, labelling, and
  screen-reader behavior.
- CSS changes must be checked at mobile and desktop widths when they affect
  visible layout.

## Structure

### Custom UI Or CSS Exception

Use this shape when custom UI, custom CSS, or a design-system override is needed
where a GC Design System component or token might otherwise apply:

The values below are illustrative. Keep the field names stable, but adapt the
component, reason, components considered, accessibility behavior, responsive
checks, owner, and review evidence to the exception.

```yaml
custom_ui_exception:
  component_or_style: custom inline status indicator
  reason: The selected page needs a compact status treatment not covered by available GC Design System components.
  gcds_component_considered:
    - GcdsNotice
    - GcdsText
  accessibility_behavior:
    - status is not communicated by colour alone
    - text equivalent is visible or available to assistive technology
    - focus behavior is defined if the indicator is interactive
    - contrast meets the applicable requirement
  responsive_checks:
    - mobile 375px
    - desktop 1280px
  owner: frontend
  review_evidence:
    - Storybook state reviewed
    - keyboard check completed
```

Fields:

- `component_or_style`: custom component, CSS class, override, or visual pattern.
- `reason`: why the design system component or token is insufficient.
- `gcds_component_considered`: components or tokens reviewed first.
- `accessibility_behavior`: keyboard, focus, name, role, status, contrast, and
  screen-reader behavior the custom UI must preserve.
- `responsive_checks`: viewport, zoom, or layout checks.
- `owner`: team or area responsible for maintaining the exception.
- `review_evidence`: screenshots, Storybook states, accessibility notes, or
  test results.

## Examples

- Prefer `GcdsButton`, `GcdsLink`, `GcdsNotice`, `GcdsCard`, and
  `GcdsText` before creating custom equivalents.
- Put app shell CSS in a file such as `frontend/src/styles/app-shell.css` when
  the shell needs shared layout behavior.
- Put a feature stylesheet beside a feature component only when the component
  cannot be expressed with GC Design System components and tokens alone.
- Prefer `max-width`, container sizing, and design-system spacing tokens over a
  hard-coded `width: 950px`.
- Prefer a named component class such as `.status-indicator` over
  project-wide generic utility classes unless utilities are intentionally
  governed.

## Checks

- [ ] GC Design System CSS is imported from one documented place.
- [ ] New CSS is scoped to app shell, feature, page, or component ownership.
- [ ] Custom classes do not duplicate GC Design System components or utilities.
- [ ] Colours, spacing, and typography use GC Design System tokens where they
      exist.
- [ ] Fixed widths, heights, and hard-coded colours have a recorded reason.
- [ ] Custom components have a custom UI or CSS exception and accessibility
      behavior.
- [ ] Modal, overlay, or dialog changes preserve focus and keyboard behavior.
- [ ] Demo, unused, and temporary CSS was removed.
- [ ] Mobile and desktop layout were checked for meaningful UI changes.

## Related Schema Contracts

- Schema contract: [ARCH-SCHEMA-STD-018-FRONTEND-CSS-DESIGN-SYSTEM-BOUNDARY](../schemas/standards/std-018-frontend-css-and-design-system-boundary.schema.yaml)
- Used for: helping agents and reviewers check custom CSS boundaries,
  design-system overrides, global styles, custom components, responsive
  evidence, and CSS or design-system exception triggers.
- Notes: The schema contract supports this standard. It does not replace this
  standard as the source of truth.
