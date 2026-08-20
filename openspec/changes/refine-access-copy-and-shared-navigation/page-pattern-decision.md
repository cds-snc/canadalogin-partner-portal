# Page pattern decision: Access, configuration copy, and shared navigation

## Pages and flows

- CL Admin Users and access directory and selected-user access.
- Selected-workspace assignments and invitations.
- RP-configuration copy and Production-review entry.
- Authenticated top navigation and account disclosure.

## Selected patterns

- `PAT-001: UI Page Patterns` basic task hubs for selected-user access and
  selected-workspace Access.
- `PAT-003: Form Page` for invite, add-assignment, manage-assignment, and copy
  forms.
- `PAT-013: GC Design System React App Shell` for every authenticated route.
- `PAT-014: Bilingual Route and I18n` for route metadata, content, errors,
  accessible names, and equivalent language navigation.
- `PAT-017: Itemized Data Display` for one selected user's or configuration's
  compact facts.
- `PAT-020: Status and Feedback` for loading, empty, denied, expired, revoked,
  conflict, copied, and review states.
- `PAT-022: Page Length and Splitting` for replacing the two mixed-purpose
  access pages.
- `PAT-023: Frontend Data Table` for users, candidate results, assignments,
  and invitations.

## Why these patterns fit

The access entry pages contain several distinct intentions: inspect current
access, add an existing user, invite a new user, and manage one assignment or
invitation. A task hub is the right chooser for those intentions. Once a user
chooses one collection, the records share stable attributes and need scanning
and comparison, so a table is more useful than repeated cards. Creation and
consequential changes then move to focused routes.

Copying an RP configuration is a form-driven lifecycle task for one selected
source, not a destination category. It therefore appears as a secondary
record action and opens a focused form. It does not become another hub card.

The shared top navigation is an information hierarchy, not a generic menu
container. A standalone destination is a direct link. A disclosure is used
only for a coherent second level and keeps supported focus and keyboard
semantics.

## Task structure

### Central Users and access

- Entry: `/administration` then `/users`.
- Hub: `/users/$userUuid`.
- Destinations: global access, workspace access, add workspace access, and
  pending invitations.
- Collections: user table, pending-invitation table, selected-user workspace-
  assignment table, and selected-user invitation table.
- Forms/actions: `/users/invite`, add workspace access, and canonical selected-
  assignment or invitation management.

### Workspace Access

- Entry: `/workspaces/$workspaceUuid` then
  `/workspaces/$workspaceUuid/access`.
- Hub: selected-workspace Access.
- Destinations: current assignments, add an existing user, invitations, and
  invite a user.
- Collections: assignment and invitation tables.
- Forms/actions: focused new and record-specific assignment/invitation routes.

### RP configuration

- Entry: selected RP-configuration hub.
- Action: `Copy configuration` in a quiet Configuration management section.
- Destination: selected-source `/copy` form.
- Result: a distinct draft in the same Application, followed by the earliest
  incomplete required setup step.
- Separate action: request Production review on the selected Production
  configuration when applicable.

### Account context

- Entry: the stable signed-in account disclosure in the shared shell.
- Compact shell context: display name and active workspace/role when it changes
  the available tasks.
- Destination: `Account` at `/account` for safe identity, organization, and
  canonical access summaries.
- Session action: existing safe sign out.
- Direct entry: protected by the normal server-owned session admission flow.
- Parent path: `Home -> Account`, with bilingual route metadata and H1.

## Navigation

- Primary hierarchy: `Home`, direct `Partner workspaces`, and role-aware direct
  Reports, Onboarding oversight, and Administration links.
- Group threshold: use a top-navigation group only for at least two coherent
  child destinations; target two to five links.
- Access breadcrumbs:
  - `Home -> Administration -> Users and access -> selected user`; or
  - `Home -> Partner workspaces -> selected workspace -> Access`.
- Configuration breadcrumbs preserve selected workspace, Application, and RP
  configuration before `Copy configuration`.
- Every focused page has a visible translated return link to its immediate
  parent collection or hub and never relies on browser history.
- Pending-invitation links preserve workspace UUID and invitation UUID. They
  do not use invited email, token, or internal ID as route identity.
- Compatibility routes reauthorize before redirecting and never carry stale
  authority into the new destination.

## Required page shell

- [x] Shared GCDS header and footer
- [x] Main landmark and stable skip target
- [x] One localized H1 per route
- [x] Hierarchy breadcrumbs on nested routes
- [x] Visible parent or collection return link
- [x] Header language toggle to the equivalent safe route
- [x] Role-aware route metadata and current-parent indication
- [x] Normal content width without a persistent Access side rail

## Component and content decisions

- Keep `GcdsCard` for available single-destination tasks on Administration,
  selected-workspace, selected-user, Workspace Access, Application, and RP-
  configuration hubs.
- Do not use cards for repeated user, candidate, assignment, or invitation
  records.
- Use the vetted `DataTable`/`GcdsTable` path with an accessible caption,
  column headers, row headers, and concise action column.
- Use a `GcdsLink` or equivalent real anchor for navigation. Preserve ordinary
  link behavior, including copying the destination and opening it in another
  tab where the platform supports it.
- Use `GcdsButton` for state-changing submissions and confirmations.
- Use safe visually hidden record context to make repeated links or buttons
  unique without turning the visible label into a sentence.
- Put forms on focused pages with `GcdsErrorSummary`, matching question-level
  errors, and explicit success/return behavior.
- Copy content identifies the source, requires target name, Partner
  environment, and CanadaLogin environment, and explains copied versus
  excluded fields before submission.
- Use plain text status, not colour or badge shape alone.
- Use `GcdsDetails` only for optional supporting explanation; never hide
  required copy exclusions, access consequences, errors, or primary actions.

## Menu interaction decision

- Render Partner workspaces as a direct `GcdsNavLink` while it is the only
  Partner work destination.
- Do not configure the optional verbose desktop `closeTrigger` for a nested
  nav group. Keep the trigger label stable and use the component's chevron and
  `aria-expanded` state.
- Keep account navigation within the installed component's supported
  navigation-item structure. Retain compact active context in the shell and
  put detailed organization and role facts on `/account` rather than in a raw
  mixed-content list item.
- The GCDS mobile root Menu/Close control remains the root-navigation trigger.
  Its Close state is not reused as a nested group label.
- Only one disclosure is open. Escape, sibling activation, outside activation,
  destination selection, route/language transition, sign out, and responsive
  presentation changes dismiss it immediately.
- Escape returns focus to the trigger; destination activation follows normal
  navigation focus behavior; rerendering never reopens a user-closed group.

## Accessibility behavior

- Hub cards, tables, forms, menus, language control, and return links work in
  logical source order with keyboard and assistive technology.
- A table remains understandable by caption, headers, row headers, and action
  accessible names without visual card boundaries.
- Focus is visible and moves deliberately after route load, validation,
  confirmation, success, and menu dismissal.
- No interaction depends on hover, pointer precision, delayed closure, colour,
  or horizontal page scrolling.
- Test narrow mobile, 768-1023 CSS pixels, desktop, 200 percent zoom, and long
  French text so visual and behavioral menu modes cannot disagree unnoticed.
- Copy and access forms preserve unsaved input or warn before language or
  parent-route navigation discards it.

## Exceptions

No custom page shell, table semantics, or second authorization model is
approved.

If the installed GCDS navigation components cannot satisfy immediate
dismissal without a small state coordinator, record that coordinator as a
shared-shell implementation exception before merging. It must retain GCDS
roles, accessible names, keyboard semantics, focus behavior, tokens, and
responsive presentation; it must not become a replacement custom menu.

## Verification

- Desktop and narrow screenshots of the selected-user hub, Workspace Access
  hub, assignment table, invitation table/detail, and copy form.
- English/French parity for routes, breadcrumbs, headings, table labels,
  statuses, actions, errors, explanations, and accessible names.
- Keyboard and focused screen-reader checks for hub cards, table semantics,
  unique actions, forms, error recovery, menu dismissal, and focus return.
- Real-GCDS-component browser coverage of direct Partner work navigation,
  account disclosure, mobile root navigation, Escape, outside activation,
  route change, responsive-mode change, and quick close/reopen behavior.
- Responsive checks below 768 px, from 768-1023 px, at 1024 px and wider, at
  200 percent zoom, and with long French labels.
- Direct-entry, stale-scope, parent-mismatch, not-found, unauthorized, expired,
  revoked, conflict, replay, and safe recovery tests.
- Copy tests for Test/Staging/Production sources and targets, same-environment
  copy, excluded fields, source immutability, no overwrite, idempotency, and no
  implicit Production-review request.
