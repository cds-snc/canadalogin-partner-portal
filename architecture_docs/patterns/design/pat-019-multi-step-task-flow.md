# PAT-019: Multi-Step Task Flow

Type: Pattern
Status: Active

## Problem

Government services often need to split a task across several pages so people
can complete one clear step at a time. Without a consistent multi-step pattern,
teams create fragile wizards, unclear progress indicators, duplicated
navigation, and confirmation states that are hard to test.

## Use When

- A user-facing task has a logical sequence split across more than one page.
- A form is too long or conditional to complete comfortably on one page.
- Users need to review information before a final submit or state-changing
  action.
- The task needs progress, recovery, confirmation, or save-and-return behaviour.

## Do Not Use When

- The task is one short form or one simple action on a single page.
- The content is a long informational page with subsections but no task
  sequence.
- Users must be able to jump freely between unrelated pages or records.
- The business rules for step order, saving, or final submission are unclear.

## Trade-Offs

- Multi-step flows reduce cognitive load, but they add routing, state,
  validation, and recovery responsibility.
- A stepper helps people understand progress, but it should not imply that they
  can jump to any step unless the product supports it.
- Review and confirmation screens improve trust for consequential actions, but
  they should not become dumping grounds for unrelated information.

## Approach

1. Define the task goal, entry route, step sequence, review point, and
   confirmation state before implementation.
2. Give each step one clear purpose and a short step title.
3. Use the GC Design System stepper for a logical sequence split over more than
   one page.
4. Keep the current step title in the page heading hierarchy.
5. Store step IDs, labels, route paths, and completion rules in one route or
   flow model.
6. Validate step data before moving forward, but preserve input when validation
   fails.
7. Provide predictable `Continue`, `Back`, `Cancel`, and `Save and continue
   later` actions when they apply.
8. Add a review page before a final consequential submit.
9. Show a confirmation page after the final action succeeds.
10. Capture screenshots and tests for start, step validation, review,
    confirmation, and recovery states.

### Flow Decision

| Flow need | Use this structure | Avoid |
|---|---|---|
| Short single-page task | Basic form page | Adding a stepper for one page |
| Multi-step form or transaction | Route-per-step with `GcdsStepper` | Hiding a long form behind many accordions |
| Sequential guidance or service initiation | Ordered multi-page navigation or step-by-step guidance | Making users infer the preferred order from ordinary links |
| Long informational page | In-page table of contents or details components | Using a transaction stepper for content-only sections |
| Complex policy, eligibility, or branching task | Separate journey decision or ADR | Treating unknown branching rules as simple form steps |

### Step Structure

Each step should have:

- one H1 or step heading that names the step goal
- the stepper immediately before or as part of the step heading
- only the fields, content, or decisions needed for that step
- a primary action that moves the user forward
- a secondary action that moves back or cancels when appropriate
- a clear error summary and field-level errors when validation fails

Do not put several unrelated decisions on the same step to avoid adding routes.
Do not add decorative step cards or progress graphics when the stepper already
communicates the sequence.

### Navigation And State

Use route state or server-backed draft state intentionally. Do not rely on
unstructured browser history as the main way to move through the flow.

Record:

- whether users can move backward
- whether users can skip steps
- whether completed steps can be changed
- whether changing an earlier answer invalidates later answers
- when draft data is saved
- what happens when a session expires
- how people recover from refresh, network failure, or validation failure

For a data-changing workflow, save only after a clear submit or documented draft
save action. A step transition should not secretly commit final business state.

### Review And Confirmation

Use a review page when the final action changes data, submits a request, sends a
notification, grants access, revokes access, or cannot be easily undone.

The review page should:

- summarize the information the user is about to submit
- group information using [PAT-017: Itemized Data Display](pat-017-itemized-data-display.md)
- provide clear `Change` links back to the relevant step
- identify any irreversible or important consequences
- use one final submit action

The confirmation page should:

- confirm the action succeeded
- provide a reference number or status when one exists
- explain what happens next
- link back to the service home or the relevant record
- avoid asking the user to repeat the same task unless that is the expected next
  action

### GC Design System And WET

For GC Design System applications, use:

- `GcdsStepper` for progress in a multi-step process
- `GcdsButton` for step actions
- `GcdsErrorSummary` and `GcdsErrorMessage` for validation
- `GcdsNotice` for step-level warnings, success, or important context
- `GcdsDetails` only for secondary information, not for hiding required steps

For GCWeb or WET pages, use the relevant WET pattern intentionally:

- ordered multi-page navigation for ordered guides or service initiation
- step-by-step or subway navigation for long, structured service guidance
- subway navigation groups should stay reasonably small, ideally six pages or
  fewer and no more than eight
- WET steps form only when the project can test the provisional behaviour

### Source Guidance

This pattern adapts:

- [GC Design System stepper guidance](https://design-system.canada.ca/en/components/stepper/)
  for multi-step processes.
- [Canada.ca ordered multi-page navigation guidance](https://design.canada.ca/common-design-patterns/ordered-multipage.html)
  for preferred-order content.
- [WET/GCWeb patterns](https://wet-boew.github.io/GCWeb/index-en.html),
  including step-by-step, subway navigation, and steps form patterns.
- [Canada.ca button guidance](https://design.canada.ca/common-design-patterns/buttons.html)
  for actions that change state or move people through a transaction.

### Expected Files

- `frontend/src/features/<feature>/flow/`: step IDs, labels, route paths, and
  completion rules.
- `frontend/src/features/<feature>/pages/`: route-per-step pages, review page,
  and confirmation page.
- `frontend/src/features/<feature>/hooks/`: draft, validation, submit, and
  recovery hooks.
- `frontend/src/routes.tsx` or `frontend/src/routes/`: flow routes and route
  metadata.

## Checks

### Tests

- Users can start the flow from the recorded entry route.
- Each step validates required input before continuing.
- Back, cancel, save, and refresh behaviour match the recorded flow decision.
- Changing earlier answers updates or invalidates later answers correctly.
- Review page shows the submitted data and links back to the correct steps.
- Final submit creates the expected result once and reaches confirmation.
- Session expiry, network failure, and server validation errors preserve safe
  recovery paths.

### Verification

- Desktop and mobile screenshots cover the first step, a middle step, validation
  errors, review, and confirmation.
- Keyboard navigation reaches step content, action buttons, error summary, and
  review change links in a predictable order.
- Screen-reader review confirms stepper and heading hierarchy are announced
  acceptably.
- Bilingual review confirms step titles, navigation labels, errors, and
  confirmation content are equivalent.

### Stop Conditions

- Branching, eligibility, or business rules are not defined.
- The flow collects personal information, secrets, or authorization data without
  handling rules.
- Users need save-and-return, delegation, approval, or audit behaviour that has
  not been designed.
- The final action has irreversible consequences and no review, confirmation,
  or recovery decision exists.
