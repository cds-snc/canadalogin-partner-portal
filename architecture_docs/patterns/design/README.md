# Design Patterns

Store shared design guidance here.

Use this section for reusable UI structure, page pattern, accessibility, and design-system guidance.

Use [PAT-001: UI Page Patterns](pat-001-ui-page-patterns.md) before user-facing page work to select an approved page pattern, page shell, design-system checks, and review verification.

Use [PAT-016: Editable List](pat-016-editable-list.md) when a user-facing page needs a list of repeated values, such as redirect URLs, that can be added, edited, removed, saved, and cancelled through a consistent view/edit pattern.

Use [PAT-017: Itemized Data Display](pat-017-itemized-data-display.md) when a user-facing page needs to display read-only itemized data with description lists, semantic lists, tables, or WET table behaviour.

Use [PAT-019: Multi-Step Task Flow](pat-019-multi-step-task-flow.md) when a user-facing task spans multiple pages, needs progress, review, confirmation, or save-and-return behaviour.

Use [PAT-020: Status and Feedback](pat-020-status-and-feedback.md) when a user-facing page needs consistent loading, empty, error, warning, success, unauthorized, or service-disruption states.

Use [PAT-021: Dashboard Overview Page](pat-021-dashboard-overview-page.md) when authenticated operational users need to monitor, triage, compare, or resume work across related records.

Use [PAT-022: Page Length and Splitting](pat-022-page-length-and-splitting.md) when a page is becoming too long, mixes several tasks, or needs a decision between one page, several pages, details, in-page navigation, or a multi-step flow.

Use [PAT-023: Frontend Data Table](pat-023-frontend-data-table.md) when a user-facing frontend table needs GC Design System styling, accessible structure, responsive behaviour, sorting, filtering, pagination, or reusable implementation rules.

## Examples And Visuals

Design patterns may include examples when they make the pattern easier to apply.
Use examples to clarify structure and state, not to replace the rules or checks.

Good examples include:

- short semantic HTML or JSX snippets that show the intended structure
- before/after notes when a pattern replaces a common weaker approach
- desktop and mobile screenshots for complex layout or interaction states
- simple diagrams when navigation, state, or role flow needs clarification

Keep examples small and reusable. Prefer code that shows semantics, component
choice, labels, and state boundaries over complete application scaffolding.

Store reusable images for a pattern under
`docs/patterns/design/assets/<pattern-id>/`. Reference images with descriptive
alt text and keep the source or capture method clear in the pattern text. Do not
use screenshots as the only source of truth for text, data, or tabular content.
