# Page pattern decision: Application checklist and evidence

## Page or flow

The focused checklist and evidence page for one Application, reached from the
selected Application task hub. This decision supersedes the readiness and
Internal review portions of the archived Applications page-pattern decision;
the remaining Application and RP-configuration page decisions are unchanged.

## Selected pattern

- `PAT-001: UI Page Patterns` for one focused, read-only task page.
- `PAT-017: Itemized Data Display` for directly sourced Application input
  rows and their textual status.
- `PAT-020: Status and Feedback` for loading, safe error, missing-input, and
  attention-required states.
- `PAT-013: GC Design System React App Shell` and `PAT-014: Bilingual Route and
  I18n` through the existing shared shell and EN/FR resources.

## Why this pattern fits

Partners need to scan distinct required inputs and follow contextual next
steps. The page therefore uses itemized rows rather than a dashboard, score,
progress meter, or internal-review form. CATS evidence is a separate factual
section because the approved evidence mechanism remains undecided; the page
must not imply that upload, reference, or both has been selected.

## Route map and navigation

- Primary path: `Home -> Partner workspaces -> selected Workspace -> selected
  Application -> Checklist and evidence`.
- Canonical route:
  `/workspaces/:workspaceUuid/applications/:applicationInformationUuid/checklist-and-evidence`.
- Compatibility route: the semantically equivalent saved `/readiness` route
  redirects to the canonical route with `replace: true`.
- Return path: the page's secondary action and shared back link return to the
  selected Application hub.
- Individual Application routes remain contextual and stay out of primary
  navigation.

## Component and content decisions

- Use the shared `Heading`, `Text`, `Link`, `Button`, and `Notice` GC Design
  System wrappers.
- Use one H1, logically ordered H2 sections, semantic lists, and visible text
  for every item state.
- Show `Provided`, `Missing`, or `Needs attention` only for each directly
  sourced Application input. Do not calculate an overall score, percentage,
  completion count, readiness status, or `submit-ready` state.
- Link missing Application-detail inputs to the permitted Details/Edit route
  and contact inputs to Contacts. Read Only users receive read-only
  destinations.
- State plainly that the CATS evidence mechanism has not been selected. Do
  not expose historical internal-review records or choose upload versus
  external-reference storage.
- Provide contextual links to Application details, contacts, and RP
  configurations. Refer users to onboarding documentation and external entry
  points supplied through the approved onboarding channel rather than
  inventing an external URL.

## Custom UI exceptions

None. The responsive itemized rows use semantic lists and existing GC Design
System tokens/CSS shortcuts; all visible controls use shared wrappers.

## Verification

- Focused unit tests cover missing, provided, and contact-attention states,
  read-only destinations, absence of aggregate readiness, and the
  mechanism-neutral CATS message.
- Run frontend lint, build/typecheck, EN/FR key-parity checks, and the local GC
  Design System standards guard.
- Before release, add a manual keyboard, mobile/reflow, 200-percent zoom,
  long-French, and screen-reader walkthrough to the broader UI evidence.
