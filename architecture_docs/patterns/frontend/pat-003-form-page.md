# PAT-003: Form Page

Type: Pattern
Status: Active

## Problem

Forms need a consistent page, validation, submission, and error-handling structure so user input is reliable and reviewable.

## Use When

- A page collects user input and submits it to an API.
- Validation or error recovery matters to the user.

## Do Not Use When

- The page only displays content.
- The form is a multi-step workflow that needs its own journey design. Use
  [PAT-019: Multi-Step Task Flow](../design/pat-019-multi-step-task-flow.md)
  instead.

## Trade-Offs

- Adds validation and error-state structure, but makes form behavior easier to test and review.
- Long or conditional forms may still need a flow-specific architecture decision.

## Approach

1. Record the page pattern decision before implementation.
2. Use GC Design System form components first.
3. Use React Hook Form for field state when the form is non-trivial.
4. Use Zod for client-side schema validation when validation rules are known.
5. Keep server-side validation authoritative.
6. Display an error summary and field-level errors.
7. Preserve input when submission fails.
8. Use [PAT-020: Status and Feedback](../design/pat-020-status-and-feedback.md)
   for success, confirmation, empty, warning, or service states around the form.
9. Use [PAT-022: Page Length and Splitting](../design/pat-022-page-length-and-splitting.md)
   when a form grows beyond one focused task or one related field group.

### Form Length

Keep a form on one page when the fields are closely related, the user can
understand the task from one H1, and validation recovery is simple.

Split a form into a multi-step flow when the form has several unrelated field
groups, conditional branches, sensitive or consequential submission, review
requirements, or enough fields that mobile users must scroll through many
screens before submitting.

### Expected Files

- `frontend/src/features/<feature>/pages/`: form page.
- `frontend/src/features/<feature>/hooks/`: mutation hook.
- `frontend/src/fetch/` or `frontend/src/services/`: typed submit request.

## Checks

### Tests

- Required fields show errors.
- Invalid fields show accessible field-level messages.
- Submission sends the expected payload.
- Server validation errors are shown safely.
- Successful submission reaches the expected state.

### Verification

- Unit tests for validation and submit behavior.
- Desktop and mobile screenshots for meaningful user-facing forms.
- Accessibility result or checklist when the form is user-facing.

### Stop Conditions

- Validation rules are policy-sensitive and not defined.
- The form collects personal information or secrets without data-handling rules.

## Related Schema Contracts

- Schema contract: [ARCH-SCHEMA-PAT-003-FORM-PAGE](../../schemas/patterns/pat-003-form-page.schema.yaml)
- Used for: helping agents and reviewers check form validation, error summary,
  field-level errors, submit behavior, accessibility evidence, and form tests.
- Notes: The schema contract supports this pattern. It does not replace this
  pattern as the source of truth.
