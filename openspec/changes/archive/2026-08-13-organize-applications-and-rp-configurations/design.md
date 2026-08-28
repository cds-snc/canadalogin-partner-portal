# Design: Organize Applications and RP configurations

## Technical approach

Treat the current `application_information` row as the Application aggregate
and the current `rp_application` row as an RP configuration implementation
record. Preserve the existing workspace authorization boundary and introduce
the new product vocabulary through APIs, service DTOs, routes, and UI in
staged slices rather than attempting destructive table renames.

```text
Department (organizational affiliation)
└── Partner workspace (tenancy and authorization boundary)
    └── Application 0..*
        ├── Application contact 0..*
        ├── Readiness and internal review context
        └── RP configuration 0..*
            ├── Configuration name (locale-neutral)
            ├── Partner environment (locale-neutral partner label)
            ├── CanadaLogin environment (test, staging, or production)
            ├── Registration questionnaire and lifecycle
            └── Usage and credential capabilities
```

The workspace role continues to apply to every Application and RP
configuration in that workspace. The browser never receives a broader dataset
and filters it into scope.

## Domain vocabulary and identity

| Product term | Current implementation record | Identity shown to users |
|---|---|---|
| Partner workspace | `workspace` | Workspace name |
| Application | `application_information` | Localized `service_name_en` or `service_name_fr` |
| Application contact | `application_information_contact` | First name plus last name; legacy full-name fallback until confirmed |
| RP configuration | `rp_application` | Required locale-neutral `configuration_name`, Partner environment, and CanadaLogin environment; stable UUID and accessible short reference disambiguate exact duplicate displayed identities |
| Partner environment | New `rp_application.partner_environment` | Partner-defined locale-neutral label such as `QA 2` or `Partner staging`; not a CanadaLogin enum or URL |
| CanadaLogin environment | `rp_application.canada_login_environment` | Explicit translated label plus `Test`, `Staging`, or `Production` value |

`dnr_app_name`, `service_name_en`, and `service_name_fr` on legacy RP payloads
remain provider or compatibility fields during migration. They do not remain
the primary RP-configuration label. Application public names come from the
Application parent.

The product object is the RP configuration. `Configuration` names the
secret-free, read-only view of its saved questionnaire answers and lifecycle
context. Registration is not a second record or peer task; it is the
draft-only create/edit workflow that produces or changes the RP configuration.
Collection rows and the RP-configuration hub therefore use one
state-appropriate task path: `Resume setup` for an editable incomplete draft
or `View configuration` otherwise. The Configuration view may contain a
contextual `Resume setup` action for an authorized draft, but the hub does not
present `Configuration` and `Registration questionnaire` as two peer
artifacts. Read Only receives the view and no registration mutation action.

### Configuration-name rules

- Required for every persisted RP record after backfill, including retained
  provider candidates.
- One locale-neutral value; the form label and help are translated, the value
  is not duplicated by official language.
- Trim surrounding Unicode whitespace, normalize to Unicode NFC, reject a
  blank result, and enforce no more than 128 characters after normalization.
- Configuration identity remains its stable UUID. Names help people
  distinguish records but this change does not add a name-uniqueness rule.
- Many configurations, including configurations with similar operational
  labels, may target the same environment.
- When two accessible siblings have the same displayed configuration name,
  Partner environment, and CanadaLogin environment, table rows and other
  selection summaries append a localized `Reference` value derived from the
  stable public UUID. Start with its first eight hexadecimal characters and
  extend in four-character increments only when needed to be unique in that
  sibling result set. The raw UUID is not the primary label and is never
  treated as secret.
- A name is a label, not lineage. Clone or promotion records an explicit
  `source_rp_configuration_id` (implemented against the current RP table) when
  a source exists.

### Partner-environment rules

- `partner_environment` describes the environment on the partner's side of
  the integration. It is distinct from the RP configuration name, the target
  CanadaLogin environment, and the English/French Application environment
  URLs.
- It is one required locale-neutral value for new partner-created
  configurations. Translate the field label, hint, validation, and surrounding
  content, but do not collect English and French variants of the value.
- Trim surrounding Unicode whitespace, normalize to Unicode NFC, reject a
  blank result, and enforce no more than 128 characters after normalization.
- The value is a partner-defined label rather than a fixed CanadaLogin enum.
  Several different Partner environments may connect to one CanadaLogin
  environment, and the same Partner environment label may be reused when the
  configuration name or other stable identity distinguishes the record.
- Do not derive the value from configuration names, URLs, provider metadata,
  sibling records, or the CanadaLogin target. Legacy missing values remain an
  explicit compatibility state until an authorized confirmation or a
  separately approved shared-target mapping supplies the value.

## Persistence and migration

Use `PAT-012: Alembic PostgreSQL Change` with expand, backfill, application
cutover, and contract phases.

### Expand

- Add nullable `rp_application.configuration_name` with a 128-character limit.
- In a new revision after the already implemented `0031` hierarchy cutover,
  add nullable `rp_application.partner_environment` with a 128-character
  limit and a nonblank-when-present constraint. Do not rewrite an applied
  migration or add an index without a demonstrated query need. Add the field
  to compatible reads before requiring it on new canonical writes.
- Add nullable self-reference metadata for an explicitly cloned source when
  progression creates a new configuration.
- Add nullable contact fields for `first_name`, `last_name`, optional alternate
  phone number, and `identity_confirmed_at` plus `identity_confirmed_by`.
- Make legacy `name_en` and `name_fr` nullable for newly created contacts while
  preserving every existing value; keep both responsibility columns required.
- Keep legacy `name_en`, `name_fr`, `responsibility_en`, and
  `responsibility_fr` during dual-read migration.
- Add supporting indexes without introducing a table rewrite where practical.

### Backfill

- Generate deterministic configuration labels from safe
  existing metadata and the stable RP UUID. Do not use secrets or provider
  payloads. Labels remain editable after cutover.
- Update provider synchronization so new retained candidates always receive a
  safe configuration label.
- Preserve legacy contact values without parsing, translating, or guessing
  first and last name. Mark those contacts as requiring explicit confirmation.
  Until confirmation, dual-read responses and lists render the existing
  `name_en` or `name_fr` for the active locale, retain both responsibility
  values, and visibly identify that first/last identity confirmation is needed.
- A newly created contact writes first/last, sets confirmation actor/time, and
  leaves legacy name columns null. A deprecated legacy response alias projects
  the deterministic joined first/last display name for both old language-name
  keys without persisting two person-name variants.
- Backfill workspace-linked RP Department data from the owning workspace and
  report mismatches for explicit review.
- Produce a deterministic list of workspace-linked RP records without an
  Application parent. Assign a parent only from an explicit migration mapping
  or authorized adoption action; do not infer it from names or environment.
- Inventory active workspace-linked RP rows without a CanadaLogin environment.
  Resolve them only through an explicit mapping; otherwise stop contract
  activation and keep them out of the partner-visible canonical hierarchy.
- Inventory every retained RP row without a Partner environment. Local fake or
  seeded rows may use an explicit fixture mapping. A shared target requires a
  separately authorized owner-supplied mapping or later partner confirmation;
  do not guess a value during migration.
- Preflight and reject every RP/Application link whose Application belongs to
  another workspace, including soft-deleted and concurrently changed parents.

### Cutover and constraints

- New partner-created configurations require an Application parent, a
  configuration name, Partner environment, and a CanadaLogin environment at
  the service and API boundary.
- Provider candidates may remain outside the partner hierarchy only when both
  workspace and Application parent are null. Adoption atomically chooses an
  active workspace and an active Application owned by that workspace. Because
  adoption preserves a retained legacy row, it may keep Partner environment
  unknown unless an authorized evidenced owner supplied the value; CL Admin is
  not required to invent partner-side metadata.
- A partner-visible active RP configuration must have non-null workspace,
  Application parent, configuration name, and CanadaLogin environment; the
  selected Application must belong to that same workspace. Enforce the null-
  pair and required-field invariants with database constraints where possible,
  and enforce same-workspace ancestry under a locked service transaction plus
  preflight/audit tests because the relationship spans tables.
- A legacy configuration may remain visible with a localized `Not provided`
  Partner-environment value so migration does not hide or relabel an existing
  integration. A legacy draft cannot be finally submitted until its own value
  is supplied. A legacy configuration may still be the explicit source of a
  progression operation when the user supplies a valid Partner environment for
  the distinct target; the missing source value is neither copied nor
  inferred. Contracting the nullable database field requires caller-zero and
  data-completeness evidence for all retained rows; historical lifecycle state
  is not silently downgraded because this newly introduced label is absent.
- RP Admin and RP User (Edit) receive a focused metadata confirmation/update
  operation for a missing Partner environment on any in-scope lifecycle state.
  This operation revalidates full ancestry, does not reopen registration,
  mutate questionnaire answers, or change lifecycle, and writes only the
  top-level RP field. Read Only cannot invoke it. Audit records actor, safe
  field name, result, timestamp, and resource references without the entered
  label value.
- New contacts write first and last name while retaining the existing English
  and French responsibility fields. RP Admin and RP User (Edit) may confirm a
  legacy contact by entering first and last name; confirmation records actor
  and time in a minimized audit event and does not overwrite either legacy
  responsibility value.
- An unconfirmed contact does not count as readiness-complete. Contract legacy
  `name_en` and `name_fr` only after every active contact is confirmed and all
  callers use first/last; retain bilingual responsibility fields in this
  change. Downgrade retains original legacy names when present and uses the
  deterministic joined first/last value for both old name columns only for
  contacts created after expand; it never guesses a split or discards either
  responsibility language. Table and versioned API route renames remain a
  separate future change.

All migrations must have upgrade/downgrade tests, row-count and orphan checks,
required-name checks, and safe failure behavior. A real shared-environment
backfill requires a separately approved runbook and target.

## API and service compatibility

The FastAPI backend remains the authorization and data-shaping boundary.

- Do not repurpose the meaning of an existing v1 route. Continue using current
  `/api/v1/workspaces/{workspace}/application-information` endpoints for the
  Application parent during this release, even though the UI calls the parent
  `Application`.
- Add canonical non-colliding nested RP-configuration API paths under
  `/api/v1/workspaces/{workspace_uuid}/application-information/{application_information_uuid}/rp-configurations`.
  Existing
  `/api/v1/workspaces/{workspace}/applications...` methods continue to mean RP
  records as deprecated compatibility adapters until every caller migrates;
  they never become Application-parent APIs.
- Add a narrowly scoped nested Partner-environment metadata operation below
  that RP-configuration API parent. It updates only the top-level field and is
  owned by the focused browser route
  `/rp-configurations/:rpConfigurationUuid/partner-environment/edit`; it is
  not a questionnaire PATCH or lifecycle transition.
- Add `configurationName`, `partnerEnvironment`, Application ancestry, and
  source-configuration identity to the typed contracts that need them. New
  canonical creates require Partner environment; legacy reads expose the
  nullable compatibility state until confirmed.
- Require workspace, Application, and RP-configuration identifiers to agree
  before returning or mutating a nested resource.
- Return the same safe unavailable response for a missing resource and an
  out-of-scope or ancestry-mismatched resource.
- Keep `GET /api/v1/rp-applications/accessible` until the Reports chooser and
  every compatibility resolver have migrated; page retirement does not imply
  API removal.
- Keep credentials, secrets, tokens, private key material, raw provider
  payloads, and policy internals out of summaries and route-resolution calls.
- Export and verify OpenAPI whenever request or response fields change.
- Final-submit validation composes top-level configuration name, Partner
  environment, and Application ancestry with the stored questionnaire answers;
  it does not duplicate Partner environment inside the OIDC registration JSON
  merely to satisfy validation.

### Compatibility matrix

| Existing surface | Compatibility behavior in this change | Contract rule |
|---|---|---|
| v1 workspace `application-information` collection/detail/contacts/review | Retained; canonical backend parent surface for this release | UI vocabulary may say Application; route semantics and existing public-name fields do not change silently |
| v1 workspace `applications` RP collection/detail/registration/usage/audit methods | Retained and deprecated while callers migrate to non-colliding nested RP-configuration methods | Existing reads add optional ancestry/name/Partner-environment aliases; legacy creates require explicit Application ancestry and Partner environment at cutover and reject missing or mismatched parent safely |
| v1 `rp-applications/accessible` and credential/Usage methods | Retained while Reports, saved-link resolvers, or secret callers depend on them | Server scope and full ancestry are revalidated; summaries add nullable Partner environment where collection or Reports identity needs it, plus configuration name and parent context |
| v1 accessible RP Department GET/PATCH | GET projects the authoritative workspace Department; PATCH becomes deprecated idempotent compatibility behavior only when the requested Department equals the workspace Department | A different Department is rejected with stable conflict; endpoint removal is deferred until separately evidenced |
| Legacy RP public-name fields | Accepted only as compatibility values on old payloads and never overwrite canonical Application names | Canonical reads source public names from the Application parent; conflicting legacy values are ignored for identity and reported safely where reconciliation is needed |
| Contact name/responsibility fields | Dual-read during migration | New writes require first/last and retain bilingual responsibility; unconfirmed legacy reads preserve locale-specific full name without guessing |

## Canonical routes

```text
/workspaces
/workspaces/:workspaceUuid
/workspaces/:workspaceUuid/applications
/workspaces/:workspaceUuid/applications/new
/workspaces/:workspaceUuid/applications/:applicationUuid
/workspaces/:workspaceUuid/applications/:applicationUuid/details
/workspaces/:workspaceUuid/applications/:applicationUuid/details/edit
/workspaces/:workspaceUuid/applications/:applicationUuid/readiness
/workspaces/:workspaceUuid/applications/:applicationUuid/contacts
/workspaces/:workspaceUuid/applications/:applicationUuid/contacts/new
/workspaces/:workspaceUuid/applications/:applicationUuid/contacts/:contactUuid/edit
/workspaces/:workspaceUuid/applications/:applicationUuid/internal-review
/workspaces/:workspaceUuid/applications/:applicationUuid/delete
/workspaces/:workspaceUuid/applications/:applicationUuid/rp-configurations
/workspaces/:workspaceUuid/applications/:applicationUuid/rp-configurations/new
/workspaces/:workspaceUuid/applications/:applicationUuid/rp-configurations/:rpConfigurationUuid
/workspaces/:workspaceUuid/applications/:applicationUuid/rp-configurations/:rpConfigurationUuid/configuration
/workspaces/:workspaceUuid/applications/:applicationUuid/rp-configurations/:rpConfigurationUuid/partner-environment/edit
/workspaces/:workspaceUuid/applications/:applicationUuid/rp-configurations/:rpConfigurationUuid/edit
/workspaces/:workspaceUuid/applications/:applicationUuid/rp-configurations/:rpConfigurationUuid/settings
/workspaces/:workspaceUuid/applications/:applicationUuid/rp-configurations/:rpConfigurationUuid/usage
/workspaces/:workspaceUuid/applications/:applicationUuid/rp-configurations/:rpConfigurationUuid/manage-credentials
/workspaces/:workspaceUuid/applications/:applicationUuid/rp-configurations/:rpConfigurationUuid/audit
```

Registration step and confirmation routes remain nested below the selected RP
configuration.

The previously introduced Application `/settings` browser route is not a
user-facing destination. During local transition it replace-redirects to the
capability-gated `/delete` confirmation route, or fails through the standard
safe unavailable behavior. New links, breadcrumbs, labels, and documentation
use `Application management` and `Delete application`, never `Application
settings`.

### Route collision and cutover

Today `/workspaces/:workspaceUuid/applications/:uuid` identifies an RP record.
The cutover reuses that shape for the Application parent. Before enabling it:

1. introduce and test every nested RP-configuration destination;
2. migrate all generated links, report chooser destinations, return paths, and
   internal callers;
3. verify no public UUID collision exists between an Application and RP record
   in the same workspace; and
4. install a server-authorized compatibility resolver at the old shape.

Application routes and discovery remain dark behind one local feature gate
until all four prerequisites pass. If any collision exists, activation stops;
the implementation records the colliding public IDs and remediates them through
an explicit migration mapping before retrying. While the resolver remains,
Application and RP public-ID creation checks both namespaces transactionally
and rejects a new collision. A recurring verification test detects drift.

After collision-free activation, the resolver checks for an in-scope
Application first. If none exists, it may resolve an in-scope legacy RP UUID
and redirect to the nested route derived from its Application parent. If
neither is available, or ancestry is invalid, it returns the standard safe
unavailable result. It never uses IBM Verify or loads credentials, Usage data,
or secret configuration to resolve a link.

The old unscoped creation path cannot identify an Application parent. After
cutover it becomes the Application-create route; old guidance and navigation
must be removed before activation, and the page must clearly identify the new
task before any submission.

### Current-action ownership

| Current responsibility | Focused owner after cutover |
|---|---|
| Application summary and task orientation | Application hub |
| Application metadata read/edit | Details and Details edit |
| Application delete | Quiet `Delete application` navigation under the Application hub's capability-gated `Application management` section; dedicated confirmation route; blocked while any retained RP configuration remains |
| Readiness summary/breakdown | Compact hub status and focused Readiness |
| Contact list/create/edit/delete | Contacts collection and focused contact forms; delete remains confirmed |
| Checklist and internal notes | Capability-gated Application Internal review |
| RP configuration summary | RP-configuration hub |
| Secret-free questionnaire values | Configuration read-only page; this is a view of the RP configuration, not a separate artifact |
| Missing Partner environment confirmation | Focused Partner environment edit route and top-level metadata API; available to RP Admin and RP User (Edit) without reopening registration |
| Resume/edit registration questionnaire | Draft-only `Resume setup` action and nested registration steps; no peer questionnaire card |
| Clone or promotion | Focused lifecycle flow selecting an explicit source and new target |
| RP configuration delete | RP-configuration Settings with dependency checks and confirmation; unlink without an atomic future reparent/archive/delete contract is rejected |
| Usage, credentials, and audit | Separate Usage, Manage credentials, and Audit routes |
| Workspace roles and invitations | Workspace Access |

Every current page action and API caller is checked against this table before
the monolith or a legacy RP page is removed. An unmapped permitted action keeps
its old authorized path until a focused destination and tests exist.

## Page structure

### Workspace and Application collections

- `/workspaces` remains the Partner workspace chooser.
- The selected workspace hub exposes one `Applications` destination, not peer
  `Application information` and `RP applications` tasks.
- The Applications page uses the existing compact GC Design System table. The
  localized Application name is the row header and primary link to the
  Application hub. Concise lifecycle/readiness context may appear in its own
  column. For an authorized editor, each row also offers `Add RP
  configuration`; that route carries the selected workspace and Application
  and does not ask the user to choose them again.

### Application hub

The Application page is a task hub, not an operational dashboard and not an
accordion containing every workflow. It shows:

- one localized Application-name H1;
- concise sourced overview text;
- a compact textual lifecycle/readiness status with a link to the full
  breakdown;
- contact and RP-configuration counts when available; and
- single-destination task cards for Details, Readiness, Contacts, RP
  configurations, and Internal review only when the role permits it.

When the Application has no RP configurations, an authorized editor sees a
prominent `Create first RP configuration` action that opens the nested create
route directly. Once configurations exist, RP configurations is a leading task
destination with the safe configuration count and concise status context; the
hub does not add a second inline collection. A capability-gated `Application
management` section follows the main tasks and contains a quiet `Delete
application` link. The link is navigational only; deletion happens only after
the focused confirmation page revalidates dependency and authorization rules.

Forms, contact rows, questionnaire values, review notes, and destructive
confirmation controls stay on focused routes. `GcdsDetails` may disclose optional guidance
or secondary explanation, but must not hide a required step, status, error,
field, or primary action.

### Contacts

Contacts use a semantic list with a clear empty state and contained actions.
Create and edit use focused form routes. A contact stores:

- required first name;
- required last name;
- required English and French responsibility or title values;
- required email;
- optional phone and alternate phone; and

Person names are not translated or duplicated. Responsibility/title content
remains bilingual in this change. Delete remains confirmed and authorized.
An unconfirmed migrated contact displays its retained locale-specific full
name and a confirmation action; it never presents invented first/last values.

### RP configurations

The Application's RP configurations page uses a compact GC Design System table
because users compare the same facets across sibling records. Its caption or
nearby heading names the selected Application, and its columns are `Name`,
`Partner environment`, `CanadaLogin environment`, `Status`, and `Action`.
`configurationName` is the row header. A legacy missing Partner environment
renders localized `Not provided`, never a blank cell or inferred value.

Each row has one permitted destination. An authorized editor sees `Resume
setup` when the configuration is an incomplete draft; otherwise the row shows
`View configuration`. A read-only user receives the view destination rather
than a mutation path. When exact displayed name, Partner environment, and
CanadaLogin environment combinations are duplicated, the short public
reference appears beneath the name so people can distinguish targets without
making a raw UUID the primary label or adding a reference column.

An authorized `Create RP configuration` button appears before the table. The
same primary action appears inside the empty state when there are no rows; it
does not appear as an easy-to-miss text link after the collection. The expected
collection is small, so sorting, filtering, pagination, bulk selection, and
inline editing are omitted unless later user-task evidence justifies them.
At responsive breakpoints, Name, both labelled environment values, Status, and
Action remain available in each row, stacking when needed so identity and
environment comparison are not lost. The responsive table does not require
horizontal task scrolling.

The RP-configuration hub uses the configuration name as H1, the localized
Application name as parent context, and explicitly labelled Partner and
CanadaLogin environments. Configuration, Usage, and Manage credentials remain
focused tasks with role-aware visibility and backend enforcement. An editable
draft exposes `Resume setup` as a contextual action rather than adding a
`Registration questionnaire` peer card. Read Only receives `View
configuration` and no registration action.

### Registration setup navigation and validation

The six-step registration flow keeps route-per-step persistence and sequential
validation. `GcdsStepper` communicates `Step n of 6` and is not made clickable.
Once Basics has created a server-backed draft, a separate semantic navigation
landmark labelled `Registration steps` shows all six localized step names:
Basics, Endpoints, Client and access, Signing, Encryption, and Review.
This is an approved narrow GC Design System exception: use a semantic
`<nav>` containing an ordered list, `GcdsLink` for available completed-step
links, and non-interactive text for the current and blocked states, with GC
Design System tokens or CSS Shortcuts for spacing and focus presentation.
`GcdsStepper` cannot provide links, while `GcdsSideNav` represents persistent
section information architecture rather than transient status-gated form
progress. The exception adds no custom keyboard interaction; native links keep
their normal behavior and only available destinations enter the tab order.

Navigation state comes from the authorized server-backed draft rather than
browser-only assumptions:

- an available completed step other than the current step is a link to its
  canonical nested route;
- the current step is non-linked and identified with `aria-current="step"`;
- a prerequisite-blocked future step is labelled as unavailable and is not a
  link;
- Review becomes a link only when every prerequisite step remains valid; and
- Confirmation remains outside the six-step progress and navigation model.

The initial unsaved Basics route may show the progress indicator and step
labels, but it has no completed-step links until a draft exists. Choosing a
completed-step link is navigation only: it does not save, validate, mark the
current step complete, unlock Review, or advance lifecycle. Back, completed-
step links, Cancel, parent or breadcrumb links, header destinations, and
language switching preserve current input or warn before any loss. Cancelling
the warning preserves the current route and input; confirming navigation that
cannot carry the input uses the last server-saved version. A requested future
route still recovers to the earliest incomplete permitted step with a
localized explanation.

Saving a changed earlier answer recomputes contiguous progress. Any dependent
later step that is no longer valid becomes unavailable and visibly requires
review, and Review relocks until the affected answers are valid again.

Every action that requires valid answers uses one normalized validation-error
model for both client and server results across Basics, Endpoints, Client and
access, Signing, Encryption, and final Review validation:

- render `GcdsErrorSummary` at the top of the associated form and move focus
  to it after the failed validation action;
- order summary entries by question order and link each entry to the affected
  input or choice group;
- use the same localized, specific, actionable message in the summary and the
  question context instead of a generic instruction when the correction is
  known;
- render the question-level error after its label or legend and hint, before
  the response control or choice group, and programmatically associate it with
  that control or group;
- clear only an error whose answer has been corrected, leaving other unresolved
  errors and their summary links available; and
- keep fieldless network, service, authorization, ancestry, and optimistic-
  concurrency failures in distinct scoped feedback with their existing safe
  recovery actions.

The summary and question messages are derived from the same ordered error
collection. Server field locations map through every step's complete control
registry rather than a step-specific allowlist. When complete-questionnaire
validation from Review finds errors on several route-per-step pages, the flow
opens the earliest invalid step and renders only that step's errors in its
local summary and question contexts. Other invalid steps remain visibly
unavailable or require review; no summary link points to a control that is not
rendered on the current route. Integration verification uses the real GC
Design System components so focus, link targets, accessible descriptions, and
group behavior are not inferred only from mocked hosts.

### Readiness

The focused Readiness page starts with one compact textual overall result and
completion count. Required sections then appear as simple semantic rows with
an area label, visible text status, and one capability-appropriate next-step
link to Details, Details edit, Contacts, or another focused owner. It does not
render a large card or Notice for every status fact. Notices remain for actual
loading, error, or consequential feedback states.

Required readiness facts and next steps stay visible. Optional production-
check explanation or external-process guidance may appear in `GcdsDetails` or
a short supporting section, but required status, errors, and primary next
steps do not. Readiness remains advisory and does not become a portal gate.

## Progression and lineage

Progression always starts from one explicitly selected source configuration.
Creating a Test-to-Staging or Staging-to-Production target creates a distinct
named configuration draft, records its source configuration, copies only
allowlisted reusable answers, and never overwrites or implicitly chooses an
existing configuration merely because it has the target environment.

The user supplies a configuration name and `targetPartnerEnvironment`
(`target_partner_environment` internally) for the distinct target record.
Partner environment is not copied or inferred from the source. Production
review attaches to the chosen production target. Several independent source/
target families may coexist in one Application and environment.

## Retirement of `Your applications`

- Remove the page from route metadata, Home, primary navigation, generic error
  recovery, and new documentation.
- Redirect `/your-applications` to `/workspaces` after normal admission checks.
- Resolve legacy detail, Usage, credential, edit, and Department-setup links
  only through current server authorization and redirect them to the nested
  Application/RP-configuration destination or safe unavailable behavior.
- Keep redirect tests and an inventory of internal callers. Remove a
  compatibility route only after the named compatibility owner records its
  introduction version/date, all generated and documented callers have
  migrated, local telemetry or caller inventory remains at zero for the agreed
  observation period, and shared-environment removal receives separate human
  approval. The root redirect may remain longer than record deep links.
- Retain the accessible RP summary API while Reports or redirect resolution
  consumes it; API retirement is separately evidenced.

## Department ownership

The workspace's required Department is authoritative for all child
Applications and RP configurations. A partner user is not asked to assign a
second Department to one RP configuration. Existing RP Department fields and
preflight endpoints may temporarily project the inherited workspace value for
compatibility, but the forced `/your-applications/.../department-setup` page
is removed after callers migrate. The existing write endpoint remains as the
deprecated idempotent/rejecting adapter defined in the compatibility matrix;
its later removal is not part of this change.

Provider candidates without a workspace are not partner RP configurations and
have no effective Partner workspace Department until adoption.

## Authorization, privacy, audit, and failure behavior

- Workspace grants remain the authority; Application and RP-configuration
  nesting adds resource ancestry checks, not a new client-authored permission
  model.
- CL Admin may read permitted Application metadata and use focused Internal
  review/adoption flows but never gains partner credential or secret access.
- Read Only receives no contact/configuration mutation, review-note, or secret
  control.
- Contact PII does not appear in URLs, analytics, diagnostic logs, audit event
  values, fixtures, or screenshots made from real data.
- Audit events may include actor reference, workspace/Application/configuration
  UUIDs, safe changed-field names, transition, result, timestamp, and
  correlation ID; they exclude contact values, questionnaire values, secrets,
  and raw provider payloads.
- Loading, empty, partial, error, conflict, unauthorized, and stale-scope states
  follow `PAT-020` with a scoped recovery action.

## Review and migration decision ownership

| Decision | Owning record and authorized actor | Artifact and closure criterion |
|---|---|---|
| Confirm a migrated contact's first/last identity | Application contact; RP Admin or RP User (Edit) in the owning workspace | Actor/time confirmation audit; all active contacts confirmed before legacy person-name fields contract |
| Map a workspace-linked orphan RP row to an Application | RP row plus selected Application; deterministic local fixture mapping for local work, separately authorized data owner/CL Admin for any shared target | Explicit UUID-to-UUID mapping reviewed before migration; no unresolved partner-visible orphan at activation |
| Reconcile a legacy RP Department mismatch | Workspace/RP pair; local fixture owner for local work, separately authorized workspace data owner for a shared target | Mismatch report blocks cutover until resolved; workspace remains authoritative and no child value changes scope |
| Resolve a missing CanadaLogin environment | RP row; explicit local fixture mapping or separately authorized shared-target data owner | Mapping records the selected enum; unresolved rows remain outside activation and contract constraint fails closed |
| Confirm a missing Partner environment | RP row; RP Admin or RP User (Edit) for an in-scope retained configuration in any lifecycle state, explicit local fixture mapping for fake data, or separately authorized shared-target data owner | Actor and normalized label are audited without questionnaire values; no inferred value; all retained rows complete before nullable-field contract |
| Record Application internal review | Application; CL Admin with oversight capability | Application review record; protected notes do not copy to child partner views |
| Record Production review | Explicit Production target RP configuration; CL Admin | Target-specific promotion/review record with source/target lineage and external reference |
| Resolve a public UUID collision | Application/RP public identity; migration implementer locally, separately approved migration owner for shared targets | Explicit collision map and successful cross-namespace preflight before the one-time activation gate |

No additional human decision is required for deterministic local fixtures.
Shared-target mappings, collision remediation, compatibility sunset, or rollout
remain outside the local authority of this change package.

## Active-change integration

`simplify-task-area-navigation` and `add-reports-task-hub` are logically
upstream. Their current code may finish independently, but this change must not
archive over their deltas in the wrong order.

- Archive or rebase `simplify-task-area-navigation` before applying the final
  Home and workspace-hub replacements here.
- Archive `add-reports-task-hub` before this change modifies report discovery,
  or amend its usage destination to the nested route before it archives.
- Re-run strict scenario-preservation checks after each archive so a full
  MODIFIED requirement does not restore stale `/your-applications` or peer
  Application-information/RP-application destinations.

## Slice plan

### Slice 1: Expand domain contracts

Add configuration identity, contact person fields, source lineage, and
compatibility DTOs with migration and contract tests.

### Slice 2: Backfill and enforce parent ownership

Backfill configuration names and inherited Department context, explicitly map
workspace-linked orphan RP rows to Applications, update provider adoption, and
then enable parent/name constraints.

### Slice 3: Build dark Application pages

Add the Applications collection, compact Application hub, Details, Readiness,
Contacts, and Internal review routes behind the inactive hierarchy feature
gate while current RP routes remain canonical.

### Slice 4: Nest RP-configuration work

Add named configuration lists, overview, registration, progression, Usage,
credentials, and report destinations with full workspace/Application/config
ancestry checks.

### Slice 5: Resolve compatibility and activate once

Install and prove saved-link redirects, collision prevention, and the path
resolver; then activate the nested hierarchy, switch discovery, retire the per-
RP Department setup page, and redirect `/your-applications` in one ordered
cutover. Do not remove old discovery before its replacement and redirects are
live.

### Slice 6: Contract and verify

Remove migrated contact fields and unused frontend/API compatibility only when
caller and data checks pass. Complete responsive, accessibility, bilingual,
privacy, security, migration, and archive verification.

### Slice 7: Apply approved RP discovery and focused-page refinement

Expand the RP contract with Partner environment, use explicit local mappings
without inferring legacy values, add the contextual create paths, replace the
RP repeated-item summaries with the compact GCDS table, remove user-facing
Application Settings in favour of focused delete confirmation, and compact the
Readiness presentation. Re-run the complete focused UI, contract, migration,
accessibility, bilingual, and OpenSpec checks before archive.

### Slice 7B: Refine registration navigation, errors, and task language

Add server-derived completed-step navigation without making the progress
stepper interactive, implement and document the narrow semantic-navigation
exception, protect unsaved current-step input, apply one linked and focused
GCDS validation pattern across all steps, and remove the registration
questionnaire as a peer artifact beside Configuration. Verify keyboard, focus,
screen-reader, reflow, bilingual, direct-route, validation, and recovery
behavior before archive.

## Human decisions required

None before local implementation. A shared-environment migration, compatibility
sunset date, or production rollout remains a separate human-controlled
decision.
