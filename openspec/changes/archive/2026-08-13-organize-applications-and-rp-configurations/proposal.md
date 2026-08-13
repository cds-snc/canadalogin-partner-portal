# Proposal: Organize Applications and RP configurations

## Why

The Partner Portal currently presents `Application information` and `RP
applications` as peer workspace destinations even though one is shared
business context and the other is an environment-specific technical
configuration. The same RP records also appear on `/your-applications`, which
creates a second list and a second mental model without creating a second
ownership model.

The result is visible in the current experience:

- the application-information detail route combines a summary, readiness,
  editable metadata, internal review, contacts, and contact forms in one long
  page;
- contact records ask for English and French versions of a person's name
  instead of normal first- and last-name fields;
- RP records can be indistinguishable when several configurations target the
  same CanadaLogin environment;
- RP-configuration creation is buried behind several task-hub clicks, while
  the collection action appears after the records and is easy to miss;
- RP-configuration summaries do not make the partner-side environment and
  CanadaLogin target easy to compare;
- the six-step registration flow reports only the current step and provides
  sequential Back/Continue actions, so a user resuming a saved draft cannot
  directly return to another completed step;
- registration validation does not apply one reliable error-summary and
  question-level error pattern across every step, and generic feedback does
  not consistently tell the user how to correct an answer;
- `Configuration` and `Registration questionnaire` appear as peer tasks even
  though they are respectively the saved record view and the draft-only
  workflow used to create or edit that same RP configuration;
- the Readiness page gives simple status facts disproportionate card and
  notice treatment, and the user-facing `Application settings` destination
  contains only the destructive delete task;
- `Your applications` and selected-workspace application lists present the
  same underlying records through different page structures;
- legacy route names make `Application` mean both a business/service aggregate
  and an individual relying-party registration; and
- navigation disclosure and repeated-item spacing defects make otherwise
  valid task paths feel unpredictable.

The product direction is to make the ownership hierarchy explicit and give
each page one primary purpose.

## Work context

- Local developer / localhost with fake, seeded, or test-only data.
- Repo-scoped OpenSpec, ADR, schema, API, frontend, tests, and local
  verification only.
- No shared-environment data migration, production data, real personal
  information, deployment, provider mutation, real secret, or external-system
  mutation is authorized by this change package.
- A shared-environment or production rollout requires a separately named
  target, migration evidence, approval, and rollback decision.

## Resolved questions

| Question | Decision | Basis | Confidence |
|---|---|---|---|
| What is the collaboration boundary? | A Partner workspace is the grouping, tenancy, and authorization boundary. Its Department association is organizational context. | Current workspace and Casbin model; user-approved hierarchy | high |
| What is an Application? | The current `application_information` record becomes the user-facing Application parent. It owns bilingual public metadata, onboarding narrative, readiness, contacts, and internal review context. | Existing data ownership plus user feedback | high |
| What is an RP configuration? | The current workspace-owned `rp_application` record becomes a named RP configuration belonging to exactly one Application for partner use. | Existing one-to-many foreign key plus user-approved vocabulary | high |
| Can one Application have several configurations in the same CanadaLogin environment? | Yes. Cardinality is many configurations per Application per CanadaLogin environment. There is no one-per-environment invariant. | Explicit user decision | high |
| How are same-environment configurations distinguished? | Every RP configuration has one required, locale-neutral configuration name. The UI separately labels its target as `CanadaLogin environment`. | Explicit user decision | high |
| Do we also collect a partner-environment field? | Yes. Every new partner-created RP configuration records one required locale-neutral `Partner environment` label, such as `QA 2` or `Partner staging`. It is distinct from the configuration name, CanadaLogin environment, and English/French Application environment URLs. | Explicit user decision after reviewing the collection UI | high |
| What happens when a retained configuration has no trustworthy Partner environment? | Keep an explicit `Not provided` compatibility state; do not infer it. RP Admin or RP User (Edit) can confirm the top-level metadata without reopening registration. Adoption may preserve the unknown value because CL Admin is not expected to invent partner-side metadata. A new draft or progression target must supply its own value, while a legacy source may still be selected when the target value is explicit. | Non-lossy migration and ownership boundary | high |
| Does a person's name need English and French variants? | No. Application contacts use one first name and one last name. Existing English and French responsibility/title values remain bilingual until a separate content-model decision changes them. | Explicit user feedback for person names; preservation for responsibility values | high |
| Does `/your-applications` remain a product page? | No. `/workspaces` becomes the Partner work entry. The root compatibility path redirects there; authorized saved record links redirect to nested RP-configuration routes for a bounded period. | User-approved removal; current page is only a projection | high |
| Where does Department come from for a configuration? | A workspace-linked Application and RP configuration inherit the workspace's Department. The per-RP forced department setup flow is retired after callers migrate. | Workspace already has exactly one Department; avoids contradictory child ownership | high |
| Should the long Application page use accordions for its main tasks? | No. It becomes a compact task hub with focused Details, Readiness, Contacts, RP configurations, and authorized Internal review pages. `GcdsDetails` is reserved for optional supporting content. | `PAT-001` and `PAT-022`; user feedback | high |
| How is RP-configuration creation made easier to find? | Creation remains contextual rather than becoming a global Home wizard. Authorized editors receive a primary action above the RP-configuration collection and inside its empty state, a direct first-configuration action on an empty Application hub, and an `Add RP configuration` action for the selected Application on the workspace Applications table. These paths preserve the already selected workspace and Application. | Explicit user decision; avoids unnecessary context re-entry | high |
| How are RP configurations presented? | Use a compact GC Design System table with `Name`, `Partner environment`, `CanadaLogin environment`, `Status`, and one `Action` column. Name is the row header. Small collections do not gain filtering, sorting, or pagination without a demonstrated task need. | `PAT-023`; explicit user decision | high |
| How can a user move within a saved registration draft? | Keep the GC Design System stepper as a progress indicator and add a separate semantic `Registration steps` navigation once a server-backed draft exists. Available completed steps other than the current step are links, the current step is identified with `aria-current="step"`, and prerequisite-blocked future steps are labelled non-links. Step navigation never marks work complete or bypasses validation. | User-approved navigation refinement; `PAT-019` | high |
| What happens to unsaved answers when a user leaves a registration step? | Navigation does not silently save or discard them. Back, completed-step links, Cancel, parent/breadcrumb/header destinations, and language switching preserve the input or warn before a loss; cancelling keeps the user and input on the current step, while confirmed navigation uses the last server-saved draft. | Existing cancel/save-and-return behavior extended to every registration exit | high |
| What validation feedback does each registration step use? | Every validation-gated failure uses a focused localized summary at the top of the form plus the same specific message beside each affected question. Summary links follow question order and move to the associated control or group. Correcting one answer clears only its resolved error; unrelated errors remain. | `STD-006`, `STD-007`, `PAT-019`, GCDS error pattern, and user-approved accessibility refinement | high |
| What is the difference between Configuration and the registration questionnaire? | The RP configuration is the persistent record. `Configuration` is its secret-free saved-answer view; registration is the draft-only create/edit workflow that produces or changes it. The hub does not present the questionnaire as a second peer artifact: editors receive a state-appropriate `Resume setup` action, while Read Only receives only `View configuration`. | User-approved terminology and task-model clarification | high |
| Do Application Details and Application Settings remain separate tasks? | Details remains the normal read-only metadata destination with a focused edit path. Remove `Application settings` as a user-facing task because it contains only deletion. Authorized users reach a quiet `Delete application` link from an `Application management` section, followed by a dedicated confirmation page with existing dependency safeguards. | Explicit user decision; destructive action remains focused | high |
| How is Application readiness presented? | Show a compact overall textual status and a simple semantic breakdown of area, status, and direct next step. Required readiness remains visible; optional production-check explanation may use `GcdsDetails`. Do not use one large card or notice per simple readiness fact. | Explicit user decision; `PAT-017`, `PAT-020`, and `PAT-022` | high |

## What changes

- Adopt the user-facing hierarchy `Partner workspace -> Application -> RP
  configurations`, with Application contacts as Application children.
- Add a required locale-neutral `configurationName` to each RP configuration.
- Add a required locale-neutral `partnerEnvironment` label to each new
  partner-created RP configuration and preserve an explicit unknown/
  confirmation state for migrated records rather than guessing it.
- Permit multiple named RP configurations for the same Application and the
  same CanadaLogin target environment.
- Keep bilingual public Application names on the Application parent and stop
  asking for those names again when creating an RP configuration.
- Replace bilingual human-name fields with one first name and one last name;
  retain bilingual responsibility/title values, email, and optional phone
  numbers.
- Turn the Application detail monolith into a concise Application task hub and
  focused child routes for Details, Readiness, Contacts, RP configurations,
  and role-gated Internal review.
- Remove `Application settings` as a user-facing destination. Keep Application
  deletion on a dedicated confirmation route reached from a quiet,
  capability-gated `Application management` action.
- Nest RP-configuration list, overview, registration, Usage, credentials, and
  department-dependent compatibility behavior under their owning Application.
- Make `/workspaces` the only Partner work list entry, remove `Your
  applications` from Home and primary navigation, and redirect the retired
  root route.
- Preserve bounded, authorized redirects for saved RP links and keep the
  accessible RP summary API while Reports or compatibility callers still use
  it.
- Use compact GC Design System tables for comparable Application and RP-
  configuration records. Keep contacts as semantic repeated-item summaries,
  and keep every record-specific action in its row or item boundary.
- Put contextual RP-configuration creation actions before the collection and
  in its empty state; add direct selected-Application shortcuts without adding
  a global create wizard.
- Add saved-draft step navigation that exposes completed steps without
  unlocking prerequisite-blocked steps or bypassing validation, and protect
  unsaved input across every registration navigation path.
- Apply one GC Design System registration-error pattern across all six steps:
  a focused linked summary plus matching, specific question-level feedback
  whose unaffected errors persist while another answer is corrected.
- Treat `Configuration` as the saved, secret-free view of the RP configuration
  and registration as its draft create/edit workflow; remove the questionnaire
  as a duplicate peer task and use state-appropriate `Resume setup` or `View
  configuration` actions.
- Present Application readiness as compact text and semantic rows with direct
  next-step links rather than large repeated status cards or notices.
- Ensure header navigation disclosures open and close from user activation
  without being forced open again by application state.
- Use expand/backfill/contract migrations for configuration names, partner-
  environment labels, parent links, contact identity fields, and inherited
  Department data.

## Capabilities

### Modified capabilities

- `partner-portal-workspace-and-rp-application-management`: Application
  ownership, contacts, RP-configuration identity, registration, progression,
  collection views, workspace tasks, credentials, Usage, adoption, and
  migration behavior.
- `partner-portal-access-and-dashboard`: Home and shared navigation, retirement
  of the duplicate current-user applications overview, and disclosure
  behavior.
- `partner-portal-rp-application-experience`: nested named RP-configuration
  overview, focused features, authorization ancestry, and saved-link
  compatibility.
- `current-user-rp-application-department-setup`: retirement of per-RP forced
  Department setup in favour of the workspace's Department.
- `current-user-rp-oauth-setup`: retirement behavior now resolves to nested
  RP-configuration routes instead of a duplicate current-user page.
- `partner-portal-onboarding-oversight-and-reporting`: Application terminology,
  Application ancestry for usage-report choices, and internal review routing.
- `partner-portal-external-developer-invitations-and-scoped-access`: workspace
  grants apply consistently to Applications and their RP configurations.
- `partner-portal-role-management`: the fixed workspace role matrix and safe
  client authorization context apply through the complete Application and RP-
  configuration ancestry.

## Impact

- Adds `ADR-004: Application and RP Configuration Hierarchy`.
- Adds Alembic migrations and staged compatibility behavior for RP-
  configuration name, Partner environment, hierarchy, and
  `application_information_contact` identity fields.
- Changes Pydantic/OpenAPI contracts, service validation, summary projection,
  adoption, progression, readiness, and audit metadata.
- Changes workspace, Application, RP-configuration, Reports chooser, legacy
  redirect, Home, route-catalog, breadcrumb, and navigation behavior.
- Replaces one long Application page with several smaller role-aware routes.
- Updates English/French content, fixtures, frontend and backend tests,
  migration tests, generated route artifacts, OpenAPI output, and local
  verification evidence.

## Dependencies and sequencing

- `simplify-task-area-navigation` modifies the same Home and workspace-task-hub
  requirements. Finish and archive it first, or rebase it before this change
  archives. This change preserves its focused responsive layout and stable
  parent-link behavior.
- `add-reports-task-hub` currently points its Application usage chooser at the
  old RP route. Finish and archive it first, then apply this change's nested
  RP-configuration requirement, or amend that active change before archive.
- Data-contract slices may begin locally while those UI changes finish. Route
  cutover and OpenSpec archive must respect the ordering above.

## Out of scope

- Creating a separate persisted Partner organization entity.
- Limiting an Application to one RP configuration per CanadaLogin environment.
- Renaming the existing database tables or removing existing versioned API
  paths in the same release; those names remain compatibility implementation
  details during this change. Deprecated Department writes become
  idempotent/rejecting adapters rather than disappearing.
- Automatically guessing an Application parent for an ambiguous legacy RP
  record or splitting a legacy full name into first and last name.
- Changing the OIDC questionnaire's questions or answer data model beyond
  moving shared Application names to the parent and adding configuration
  identity plus the required Partner environment label. This change does
  refine the existing questionnaire's navigation, validation feedback, and
  task language.
- Provisioning or mutating IBM Verify or another provider as part of draft
  creation, migration, or route resolution.
- Turning advisory readiness into a hard product gate.
- Deploying or migrating any shared or production environment.

## Risks

- The current `/workspaces/:workspaceUuid/applications/:uuid` shape identifies
  an RP record, while the new canonical shape identifies an Application. A
  staged, server-authorized resolver and collision preflight are required
  before route cutover.
- Existing contacts cannot be safely split or translated into first and last
  name. They must remain intact and explicitly require partner confirmation.
- Existing workspace-linked RP records may lack an Application parent. The
  migration must surface them for explicit assignment and must not silently
  hide, clone, or guess ownership.
- Existing RP records do not have a trustworthy Partner environment value.
  Migration must preserve an explicit not-provided state and require an
  authorized user or separately approved data owner to confirm the value; it
  must not derive the label from configuration names, URLs, provider metadata,
  or the CanadaLogin environment.
- Multiple configurations per CanadaLogin environment make promotion lineage
  non-obvious. Clone or promotion must record the chosen source and target
  configuration instead of inferring a unique environment successor.
- Step links can imply that incomplete work is skippable or can discard
  unsaved answers. Availability must come from server-validated contiguous
  progress, and navigation must warn before leaving dirty input.
- Earlier answer changes can invalidate later steps. The step navigation,
  Review availability, and error feedback must update together so a stale
  completed state is never presented as valid.
- Removing a cross-workspace list can surprise saved-link users. Compatibility
  redirects, route tests, and a bounded retirement record are required.
- Contact data is personal information. Migration, fixtures, logs, analytics,
  screenshots, and errors must not expose real or unnecessary values.

## Links

- `ADR-004: Application and RP Configuration Hierarchy`
- `STD-002: Work Contexts`
- `STD-004: Frontend React and TypeScript`
- `STD-005: Frontend GC Design System`
- `STD-006: GC UI Page Layout Rules`
- `STD-007: UI Accessibility Basics`
- `STD-008: Backend FastAPI`
- `STD-009: REST API`
- `STD-010: API Response and Error Models`
- `STD-012: Testing Basics`
- `STD-013: Security and Privacy Basics`
- `STD-017: Government of Canada Standards Review`
- `STD-018: Frontend CSS and Design-System Boundary`
- `STD-019: Government of Canada Web Application Baseline Governance`
- `STD-020: Database Persistence`
- `PAT-001: UI Page Patterns`
- `PAT-012: Alembic PostgreSQL Change`
- `PAT-013: GC Design System React App Shell`
- `PAT-014: Bilingual Route and I18n`
- `PAT-017: Itemized Data Display`
- `PAT-023: Frontend Data Table`
- `PAT-019: Multi-Step Task Flow`
- `PAT-020: Status and Feedback`
- `PAT-022: Page Length and Splitting`
