# TPL-008: Design Review Checklist Template

Type: Template
Status: Active

## Scope

Name the page, flow, component, or pattern being reviewed.

## Structure

- [ ] The page starts from an approved pattern.
- [ ] The H1 and section headings match the content hierarchy.
- [ ] Primary tasks are easy to find.
- [ ] Navigation supports entry, recovery, and return paths.
- [ ] User-facing routes are reachable from `Home`, the shared menu, a parent
      task area, or a recorded hidden-route exception.

## Accessibility

- [ ] Labels, hints, and errors are clear.
- [ ] Keyboard order follows the visual and task order.
- [ ] Focus states are visible.
- [ ] Color is not the only way to understand state.

## Design System

- [ ] Required design-system components are used where applicable.
- [ ] The shared app shell uses GC Design System header, navigation, content
      container, and footer components where they fit.
- [ ] The shared menu includes `Home` and the changed page or parent task area
      when required.
- [ ] Custom components have a documented reason.
- [ ] Spacing, typography, and page shell follow the selected pattern.

## Examples

- [ ] Example markup, screenshots, or diagrams are included when they clarify
      a reusable pattern, layout state, or interaction state.
- [ ] Screenshots or images have descriptive alt text and do not replace
      semantic text, data, or table content.

## Content

- [ ] The page avoids unnecessary instructions.
- [ ] Calls to action use specific verbs.
- [ ] Error and empty states are actionable.

## Verification

- <Screenshots, review notes, test results, or remaining gaps.>
