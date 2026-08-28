# PAT-020: Status and Feedback

Type: Pattern
Status: Active

## Problem

User-facing applications need consistent feedback for loading, empty, error,
warning, success, unauthorized, and service-disruption states. Without a
standard pattern, teams overuse alerts, hide recovery actions, or leave users
uncertain about whether an action succeeded.

## Use When

- A page reads, creates, updates, deletes, submits, or refreshes data.
- A user action needs success, warning, error, or next-step feedback.
- A service outage, permission state, empty result, or unavailable feature needs
  to be explained.
- A UI state needs consistent copy, placement, accessibility, and visual
  treatment.

## Do Not Use When

- The message is ordinary instructional content that belongs in the page body.
- The issue is only a field-level validation problem. Use the form page pattern
  with error summary and field-level errors.
- The message is decorative emphasis, promotional content, or a label.
- The state is sensitive enough that safe error wording or disclosure rules are
  unclear.

## Trade-Offs

- Prominent notices help users recover, but too many notices create alert
  fatigue.
- Concise messages are easier to act on, but may need links to more detailed
  guidance.
- Empty and loading states make asynchronous UI understandable, but they need
  tests so they do not become unreachable or stale.

## Approach

1. Classify the state before choosing the component or placement.
2. Use `GcdsNotice` for contextual page or section messages with info, warning,
   danger, or success meaning.
3. Use `GcdsErrorSummary` and `GcdsErrorMessage` for form validation.
4. Use normal page content for empty states and loading states unless the state
   requires prominence.
5. Place the message at the scope it affects: site, page, section, record, or
   field.
6. Write a short heading, one concise explanation, and a clear recovery action
   or next step.
7. Remove or hide stale notices after they no longer apply.
8. Test the state with keyboard, screen reader, mobile, and bilingual review
   when user-facing.

### State Decision

| State | Preferred treatment | Use this when |
|---|---|---|
| Loading | Inline loading text or skeleton only when already established locally | The page is waiting for data or an action to complete. |
| Empty | Plain content with a heading or short message and next action | No records, search results, tasks, or configured items exist. |
| Info | `GcdsNotice` with `notice-role="info"` | The user needs important context that is not an error or warning. |
| Warning | `GcdsNotice` with `notice-role="warning"` | The user should understand a possible consequence or upcoming change. |
| Danger | `GcdsNotice` with `notice-role="danger"` or form errors when applicable | The user may be blocked, data may be invalid, or a serious issue affects the task. |
| Success | `GcdsNotice` with `notice-role="success"` or a confirmation page | A user action completed and the next step should be clear. |
| Unauthorized | Page-level status with safe wording and recovery links | The user is signed in but cannot access the page or action. |
| Service disruption | Page-level or site-level notice | The service is unavailable, degraded, or temporarily changed. |

### Placement

Place messages where they match the scope:

- site-wide disruption: above the page H1 or in the shell only when every page
  is affected
- page-level state: directly under the H1
- section-level state: inside the affected section near the section heading
- record-level state: beside or inside the affected item
- field-level validation: attached to the field, with an error summary on
  submit

Avoid putting notices inside form controls. Avoid using one page-level notice
for several unrelated record-level problems.

### Content

Write feedback so users know what happened and what to do next.

Each message should include:

- a short, meaningful heading
- the specific state or consequence
- a recovery action, next step, or link when one exists
- safe wording that does not reveal sensitive authorization, security, or
  system details

Avoid:

- vague headings such as `Error` or `Notice`
- long notices that duplicate the main content
- messages that only say something failed without a recovery path
- success messages that disappear before users can confirm the result
- using colour or icons as the only signal

### Examples

```html
<gcds-notice
  notice-role="success"
  notice-title="Redirect URL saved"
  notice-title-tag="h2"
>
  <p>The application now accepts the new redirect URL.</p>
</gcds-notice>
```

```html
<section aria-labelledby="no-clients-heading">
  <h2 id="no-clients-heading">No clients yet</h2>
  <p>Create a client before adding redirect URLs or assigning roles.</p>
  <gcds-button>Create client</gcds-button>
</section>
```

### Source Guidance

This pattern adapts:

- [GC Design System notice guidance](https://design-system.canada.ca/en/components/notice/design/)
  for concise contextual messages, notice roles, placement, and avoiding notice
  fatigue.
- [Canada.ca contextual alert guidance](https://design.canada.ca/common-design-patterns/contextual-alerts.html)
  for page, section, success, warning, and danger messages.
- [GC Design System error message guidance](https://design-system.canada.ca/en/components/error-message/)
  and [error summary guidance](https://design-system.canada.ca/en/components/error-summary/code/)
  for form blocking errors.
- Protected route and RBAC patterns for unauthorized states.

### Expected Files

- `frontend/src/components/ui/`: shared status or empty-state wrappers when the
  project needs them.
- `frontend/src/features/<feature>/pages/`: feature-specific loading, empty,
  error, unauthorized, and success states.
- `frontend/src/features/<feature>/*.stories.tsx`: review fixtures for
  meaningful UI states.
- `frontend/src/i18n/locales/`: bilingual state headings and messages when
  i18n applies.

## Checks

### Tests

- Loading, empty, error, unauthorized, and success states render when triggered.
- Async success and failure states preserve or refresh the right data.
- Error states do not expose sensitive implementation details.
- Recovery links and actions point to the expected route or retry behaviour.
- Bilingual state messages exist when the app supports English and French.

### Verification

- Desktop and mobile screenshots cover meaningful loading, empty, error,
  unauthorized, and success states.
- Keyboard review reaches recovery actions in a predictable order.
- Screen-reader review confirms notices, errors, and recovery actions are
  announced in useful context.
- Notice count and placement are reviewed for alert fatigue.

### Stop Conditions

- Safe error wording is unclear for a security, privacy, or authorization state.
- A service disruption needs operational approval, outage ownership, or a
  service-wide communication decision.
- The state changes data or access and lacks audit, recovery, or confirmation
  rules.

## Related Schema Contracts

- Schema contract: [ARCH-SCHEMA-PAT-020-STATUS-FEEDBACK](../../schemas/patterns/pat-020-status-and-feedback.schema.yaml)
- Used for: helping agents and reviewers check loading, empty, error, warning,
  success, unauthorized, disruption, recovery, accessibility, bilingual, and
  test evidence.
- Notes: The schema contract supports this pattern. It does not replace this
  pattern as the source of truth.
