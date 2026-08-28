# Compatibility record: legacy RP-application routes and APIs

## Ownership and introduction

- Change owner: CanadaLogin Partner Portal maintainers.
- Introduced: 2026-08-13 by
  `organize-applications-and-rp-configurations`; the released version will be
  assigned by release-please.
- Scope: authenticated redirects and deprecated v1 adapters only. This record
  does not authorize shared-environment removal.

## Browser route inventory

| Surface | Compatibility behavior | Removal state |
|---|---|---|
| `/your-applications` | Redirects to `/workspaces` after normal admission | Retain through at least the deep-link observation period; may remain longer |
| `/your-applications/:rpUuid` | Resolves the current server-scoped summary and redirects to the nested configuration | Observation not started |
| `/your-applications/:rpUuid/mau-report` | Redirects to nested Usage | Observation not started |
| `/your-applications/:rpUuid/manage-credentials` | Redirects to nested Manage credentials; resolution reads no credential data | Observation not started |
| `/your-applications/:rpUuid/department-setup` | Redirects to the nested configuration; the assignment page is retired | Observation not started |
| `/workspaces/:workspaceUuid/application-information` and retained child paths | Authorized replace-redirect to the canonical `/applications` collection, Application, or focused child path | Observation not started |
| `/workspaces/:workspaceUuid/applications/:resourceUuid` and retained legacy RP child paths | Resolves an in-scope Application first; otherwise validates current workspace scope and Application ancestry before redirecting an RP UUID to the nested configuration task | Observation not started |
| `/workspaces/:workspaceUuid/applications/:applicationUuid/settings` | Applies the Application-write guard and replace-redirects to the focused `/delete` confirmation route | Retain as a bounded saved-link redirect; the visible Settings task is retired |

## Canonical refinement action inventory

- Application collection: `Add RP configuration` preserves the selected
  Application and opens its nested `/rp-configurations/new` route.
- Empty Application hub: `Create first RP configuration` owns the same nested
  create route without re-entering workspace or Application context.
- RP-configuration collection: one primary `Create RP configuration` action is
  present above the table and repeated inside the empty state.
- RP-configuration row: an editable draft has exactly one `Resume setup`
  destination; every other permitted state has exactly one `View
  configuration` destination.
- RP-configuration hub: `Configuration` is the secret-free saved-answer view;
  `Registration questionnaire` is not a peer card or artifact. An authorized
  editable draft may resume setup contextually from Configuration, while Read
  Only receives no registration mutation path.
- Registration setup: the six-step GCDS progress indicator is paired with a
  semantic `Registration steps` list. Only server-completed steps are links,
  the current step is identified without being a link, blocked or pending steps
  remain explanatory text, and dirty navigation is confirmed without silently
  saving or discarding input.
- Registration errors: every rendered step owns one focused top-of-form
  summary whose ordered links and specific localized strings match inline GCDS
  feedback. Final Review recovery opens the earliest invalid route and never
  links to an unrendered control.
- Retained missing Partner environment: authorized editors use the focused
  nested `/partner-environment/edit` route; Read Only receives the localized
  `Not provided` state without an edit action.
- Application management: one quiet `Delete application` link opens the
  guarded `/delete` route. The removed Settings card has no second visible
  destination.
- Readiness: each incomplete area links directly to the authorized Details or
  Contacts owner; optional production guidance is disclosure content and not a
  competing task destination.

Missing, revoked, cross-workspace, parentless, or unknown resources fail closed
to the standard unavailable result. RP resolution uses the resource-specific
accessible secret-free projection, including only the public parent Application
UUID needed for routing; it does not call IBM Verify or load Usage, credentials,
secrets, questionnaire answers, or contact data.

## API inventory

- Retain `GET /api/v1/rp-applications/accessible` while Reports or route
  discovery consumes it.
- Retain `GET /api/v1/rp-applications/accessible/{rpUuid}` while compatibility
  resolution consumes its additive public `applicationInformationUuid` field.
- Retain existing v1 workspace `/applications` RP methods as deprecated
  adapters; their meaning is not repurposed. Compatible reads add nullable
  `partnerEnvironment`. After the canonical cutover, legacy create adapters
  require an explicit valid Partner environment and Application parent rather
  than inventing either value; missing or invalid input is rejected through a
  documented stable validation response.
- Retain accessible RP Department GET/PATCH as deprecated adapters. GET
  projects the workspace Department. PATCH succeeds only when the requested
  Department equals that inherited value and otherwise rejects the request.
- Canonical nested RP-configuration methods remain under the non-colliding
  Application-information API parent for this v1 release.
- Retained summary, detail, registration-draft, progression, adoption, and
  Reports projections add nullable `partnerEnvironment` where record identity
  or editing needs it. New canonical creates and progression targets require
  the field. Existing lifecycle-locked rows remain readable as `Not provided`
  and use the focused top-level metadata confirmation operation instead of
  reopening registration.

## Caller-zero evidence and observation

- Generated Home, header, report, adoption-success, error-recovery, RP summary,
  and onboarding-oversight links have migrated away from legacy product
  destinations.
- The root route is now redirect-only; the duplicate list page is removed.
- Deep-link compatibility tests cover direct entry, missing/revoked scope,
  workspace mismatch, missing Application ancestry, and supported child-task
  mapping.
- Caller-zero evidence is not yet complete for removal: legacy route modules,
  login allowlisting, tests, and the documented compatibility inventory are
  intentional callers and must remain distinguishable from generated product
  links.
- Observation period: not started. Before proposing removal, the owner must
  record an agreed period spanning at least one deployed release cycle, its
  start/end timestamps, the measurement source, and zero authorized calls for
  each deep-link shape.

## Removal approval gate

No compatibility route or shared v1 endpoint is approved for removal. After
caller-zero evidence and the recorded observation period complete, a separate
human approval must name the shared target and exact routes/methods. Local
implementation, tests, archive, or this record cannot substitute for that
approval.
