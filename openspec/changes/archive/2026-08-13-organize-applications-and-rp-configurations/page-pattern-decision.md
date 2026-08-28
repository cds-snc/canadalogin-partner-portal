# Page pattern decision: Applications and RP configurations

## Page or flow

Partner workspace Applications, one Application, Application details and
readiness, Application contacts, Internal review, and named RP configurations.

## Selected pattern

- `PAT-001: UI Page Patterns` basic task hub for the Application overview.
- `PAT-017: Itemized Data Display` for contacts and compact Readiness rows.
- `PAT-023: Frontend Data Table` for the Applications and RP-configuration
  collections, whose shared facets support row-by-row comparison.
- `PAT-019: Multi-Step Task Flow` for RP-configuration registration.
- `PAT-020: Status and Feedback` for readiness and asynchronous states.
- `PAT-022: Page Length and Splitting` for replacing the current long mixed-
  purpose Application-information page.
- `PAT-013: GC Design System React App Shell` and `PAT-014: Bilingual Route and
  I18n` for every route.

## Why this pattern fits

The current page mixes orientation, read-only data, readiness, editing,
contacts, contact mutation, and internal review. Those are distinct goals and
permission contexts. A concise Application task hub makes the relationship
clear and sends each goal to a focused page. Applications and RP
configurations have stable shared facets that users need to scan and compare,
so compact GC Design System tables fit those collections. Contacts remain
item-by-item summaries with quiet dividers. Neither record collection uses
nested or decorative cards.

The RP questionnaire remains a sequential, save-and-return transaction and
therefore keeps its existing multi-step pattern. Its stepper communicates
progress; a separate semantic step list lets users revisit other completed
steps in a server-backed draft without implying that prerequisite-blocked
steps can be skipped. Registration validation uses the GC Design System's
paired error-summary and question-level error pattern on every step.

## Task structure

- Distinct user goals or task flows: understand Application status; view or
  edit Application details; inspect readiness; manage contacts; manage named RP
  configurations; perform authorized internal review; register or resume one
  RP configuration; or confirm deletion of one Application.
- Entry page, service home, task hub, or dashboard: the selected workspace is a
  task hub; the Application overview is a nested task hub. Neither is an
  operational dashboard.
- Destination routes or pages: Applications table, Application hub, Details,
  Readiness, Contacts list/create/edit, Internal review, RP configurations
  table, RP-configuration hub, Configuration, registration steps, Usage,
  Manage credentials, and dedicated destructive confirmation pages.
- Single-page rationale: none. Primary tasks are intentionally split.

## Navigation

- Entry route: `Home -> Partner work -> Partner workspaces -> selected
  workspace -> Applications`.
- Shared menu item or parent task link: Partner work contains one `Partner
  workspaces` destination. Applications are reached from the selected
  workspace hub.
- Contextual create paths: authorized editors can use `Add RP configuration`
  for one Application row, `Create first RP configuration` on an empty
  Application hub, or the primary create action above/in the empty state of
  that Application's RP-configuration table. These routes preserve the
  selected workspace and Application.
- Global creation: Home and shared navigation do not expose a context-free RP-
  configuration wizard.
- Destination route:
  `/workspaces/:workspaceUuid/applications/:applicationUuid` and nested focused
  children.
- Return path: focused Application children return to the Application hub;
  nested RP-configuration children return to the RP-configuration hub or list;
  the Application hub returns to Applications or the selected workspace.
- Registration navigation: after a draft exists, a landmark labelled
  `Registration steps` lists all six steps. Available completed steps other
  than the current step are links, the current non-link uses
  `aria-current="step"`, and blocked future steps remain labelled non-links.
  The GCDS stepper remains a progress indicator rather than an interactive
  navigation control.
- Hidden from primary navigation: Yes. Individual Applications and all nested
  child routes are contextual records, not global primary destinations.

## Required page shell

- [x] Header
- [x] Shared menu includes `Home`
- [x] Shared menu includes the Partner work parent task area
- [x] Footer
- [x] Main landmark
- [x] Skip link
- [x] One H1 per page
- [x] Hierarchy breadcrumbs on nested routes
- [x] Header language toggle
- [x] Date modified only when the selected authenticated pattern requires it
- [x] Route metadata and navigation model updated

## Component and content decisions

- Use GC Design System React wrappers for visible controls and navigation.
- Use `GcdsStepper` for registration progress only. Put completed-step links
  in a separate semantic navigation landmark and derive their availability
  from the server-validated draft. Preserve current input or warn before Back,
  a step link, Cancel, parent/breadcrumb/header navigation, or language
  switching can discard it.
- Use one `GcdsErrorSummary` at the top of the associated registration form and
  the GCDS `errorMessage`/`GcdsErrorMessage` behavior beside every affected
  question. On a validation-gated failure, focus the summary; order and link
  entries by question order; repeat the same specific localized message after
  the question's label or legend and hint and before its response control or
  choice group; and clear only errors that have been resolved.
- Keep network, authorization, ancestry, concurrency, and persistence feedback
  distinct from answer-validation feedback. A generic `Check this answer`
  message does not replace a known field-specific correction.
- Use `GcdsCard` only for a single-destination task on the Application or RP-
  configuration hub.
- Use a GC Design System table with an accessible caption, column headers, and
  row headers for the Applications and RP-configuration collections.
- The RP-configuration table columns are `Name`, `Partner environment`,
  `CanadaLogin environment`, `Status`, and `Action`. Configuration name is the
  row header. An exact duplicate of name, Partner environment, and CanadaLogin
  environment shows its short reference beneath the name rather than adding
  another column.
- Give each RP-configuration row one destination: `Resume setup` for an
  incomplete draft, otherwise `View configuration`. Do not add filter,
  sorting, pagination, bulk selection, or inline editing for the expected
  small collection unless later task evidence justifies those controls.
- Keep contacts as semantic `<ul>` item summaries with named wrappers, GCDS
  tokens or CSS Shortcuts, quiet dividers, and responsive gaps.
- Put Resume, View, Edit, or Add navigation inside the record row or item it
  affects. Put collection creation before the table and inside the empty state.
- Treat `Configuration` as the saved, secret-free view of the RP configuration
  and registration as its draft create/edit flow. Do not present
  `Registration questionnaire` as a peer card; use `Resume setup` for an
  editable draft and `View configuration` otherwise.
- Use links for navigation and buttons for actions.
- Use a compact localized overall readiness statement, such as `Attention
  required — 3 of 6 areas complete`; colour or badge shape is not the only
  signal.
- Present the required Readiness breakdown as simple semantic rows with area,
  textual status, and a direct next-step link. Do not wrap each basic fact in a
  large card or Notice. Optional production-check explanation may use
  `GcdsDetails` or a short supporting section.
- Use `GcdsDetails` only for optional supporting information. Details elements
  do not hide required status, fields, errors, tasks, or primary actions.
- Keep normal Application metadata under Details and Details edit. Do not show
  an `Application settings` task. Authorized deletion is a quiet `Delete
  application` link under `Application management` that opens a dedicated
  confirmation page and retains dependency safeguards.
- Contact first and last names are entered once; English/French labels, hints,
  errors, and responsibility/title values remain equivalent.
- Registration-step navigation uses the narrow custom structure recorded in
  Exceptions. All controls within it use native links through `GcdsLink`; no
  raw custom button or scripted keyboard interaction is introduced.

## Exceptions

### Status-aware registration-step navigation

- Unsupported need: provide links to other completed routes in a six-step
  draft while identifying the current route and keeping prerequisite-blocked
  steps visible but non-interactive.
- Why mapped components do not fit: `GcdsStepper` communicates progress but
  does not expose step links. `GcdsSideNav` represents persistent site or
  section hierarchy and does not model completed/current/blocked transaction
  state.
- Approved custom structure: one `<nav>` labelled by a localized
  `Registration steps` heading, containing an ordered list. Available
  completed steps other than the current step use `GcdsLink`; the current item
  is non-interactive with `aria-current="step"`; blocked items are
  non-interactive and include localized unavailable text. Styling is limited
  to GC Design System tokens or CSS Shortcuts.
- Accessibility contract: preserve logical list and source order; add no
  custom arrow-key behavior; put only available links in the tab order; keep
  visible focus on each link; never use colour alone for state; reflow without
  horizontal scrolling; and preserve English/French label, state, and
  accessible-name parity.
- Review path: focused keyboard and screen-reader review plus mobile, long-
  French, and 200-percent-zoom verification is required by Tasks 7B.5-7B.7
  before archive. If the installed GCDS version later provides a suitable
  status-aware step-navigation component, replace this exception rather than
  extending the custom structure.

## Verification

- Desktop, mobile, narrow-viewport, long-French, and 200-percent zoom
  screenshots for the workspace Applications list, Application hub, Contacts,
  and RP configurations.
- Keyboard verification for header disclosure open/close, skip link, lists,
  tables, cards, form errors, parent links, and destructive confirmations.
- Registration-flow verification for completed/current/blocked step states,
  `aria-current`, dirty-input warning, direct future-route recovery, and
  dependent-step relocking.
- Real-component validation verification for summary focus, question-order
  links, matching summary/inline copy, label/legend/hint/error/control order,
  programmatic association, group targets, and persistence of unrelated
  errors while another answer is corrected.
- Review-validation verification that opens the earliest invalid step, links
  only to controls rendered on that route, and keeps later invalid steps
  visibly pending without broken cross-route field links.
- Automated accessibility scan plus focused screen-reader review of table
  caption/header/row-action semantics, lists, description lists, readiness
  status, and forms.
- Confirm the RP table keeps Name, both labelled environment values, Status,
  and Action available when the GCDS responsive treatment stacks the row,
  without clipped content or an inaccessible horizontal interaction
  requirement.
- English/French route, title, breadcrumb, field-label, error, empty-state, and
  accessible-name parity.
- Direct-entry, stale-scope, safe-not-found, loading, empty, partial, error, and
  recovery-route tests.
