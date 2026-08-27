---
name: dl-ui-build-page
description: "Build user-facing page, layout, form, or navigation work from an approved page pattern."
---

# Build UI Page

## Recommended role

Delegate to the `coordinator` custom agent from
`.codex/agents/coordinator.toml` when specialized delegation materially
helps. Otherwise, follow this workflow in the current session.

## Purpose

Build user-facing page work from an approved page pattern, approved template, page shell, and evidence plan.

## Use when

- A new user-facing page is needed.
- A page layout, navigation model, form, multi-step flow, header, footer, menu, breadcrumb, or language toggle is changing.
- A design package needs to be mapped to GC Design System or GCWeb/WET page structure before implementation.

## Required inputs

- Issue, scenario, or task reference.
- Page type.
- Target stack.
- Whether this is a service home, task page, form page, multi-step flow page, admin page, reporting page, or help page.
- Distinct user goals or task flows that need separate routes.
- Selected approved page pattern, if known.
- Design notes or design package link, if present.
- Acceptance criteria.
- Home page or service home route.
- Route map and primary task paths.
- Navigation needs.
- Shared menu update, including `Home` and the new page or parent task area.
- GC Design System component plan for page shell, links, buttons, forms, textareas, alerts, headers, footers, and navigation.
- Form needs.
- Accessibility constraints.

## Route

1. Read STD-006: GC UI Page Layout Rules, STD-005: Frontend GC Design System, and PAT-001: UI Page Patterns.
2. Use [.agents/skills/select-ui-page-pattern/SKILL.md](../../../.agents/skills/select-ui-page-pattern/SKILL.md) to select the approved page pattern and required page shell.
3. Record the page pattern decision using TPL-007: Page Pattern Decision Template.
4. Produce an implementation plan that names the target stack, page role, home or service-home route, task branching or single-page rationale, page shell, route map, primary task navigation paths, shared menu update, navigation, forms, GC Design System component mapping, accessibility checks, verification commands, and evidence.
5. The Coordinator applies [delorean/config.yaml](../../../delorean/config.yaml) before requiring change-state, gates, Evidence Bundles, approvals, waivers, release-readiness, MCP, or subagent outputs.
6. Use [delorean/gates/gate-catalog.yaml](../../../delorean/gates/gate-catalog.yaml) and `delorean/evidence/<change-id>/change-state.yaml` when gate tracking or change-state is in scope for an active change.
7. Use [.agents/skills/delorean-evidence/SKILL.md](../../../.agents/skills/delorean-evidence/SKILL.md) when UI evidence inputs need to be assembled into an Evidence Bundle.
8. Use TPL-008: Design Review Checklist Template and TPL-009: Verification Note Template for review and evidence inputs.

Do not implement a user-facing page before the page pattern decision is recorded.

For a new solution or feature area with multiple user goals, start with a functional service home or task hub that branches to separate task routes. Do not put all workflows on one page unless the decision records why it is genuinely one small task.

Every solution frontend should keep an orienting home page or service home route. When creating a new user-facing page, update the shared menu in the same change so `Home` and the new page or parent task area are discoverable. Use `gcds-header` `slot="menu"` with `gcds-top-nav` and `gcds-nav-link` for normal app navigation unless the page pattern calls for `gcds-topic-menu` or `gcds-side-nav`.

Before implementation, record how each primary task is reached from `Home` or
the service home. Accessibility checks can catch interaction and semantic
problems, but they do not replace route design or discoverable navigation.
Breadcrumbs can support location; they must not be the only way to discover a
top-level page or task.

Before implementation, map every visible or interactive UI need to a GC Design
System component. For the starter React frontend, use React wrappers such as
`GcdsButton`, `GcdsInput`, `GcdsTextarea`, `GcdsSelect`, `GcdsCheckboxes`,
`GcdsRadios`, `GcdsErrorSummary`, `GcdsAlert`, `GcdsNotice`, `GcdsLink`,
`GcdsNavLink`, `GcdsTopNav`, `GcdsSideNav`, `GcdsHeader`, and `GcdsFooter`
where they fit. Raw `<button>`, `<input>`, `<select>`, `<textarea>`, `<a>`,
`<header>`, `<footer>`, `<nav>`, `<label>`, `<fieldset>`, `<legend>`, or `role="alert"`
usage must be recorded as a custom UI exception before coding.

For bilingual routes or content, use the language toggle provided by the approved header pattern, such as `gcds-header` `lang-href` support. Do not add a duplicate language toggle button inside the page body unless a human-approved exception is recorded.

## Expected outputs

- Page pattern decision.
- Implementation plan.
- Change-state path when in scope.
- Current Delorean phase when in scope.
- OpenSpec lifecycle state.
- Applicable gates/checks when in scope.
- Gate summary when in scope.
- Baseline applicability and affected `GC-WEB-*` controls when this is part of a Government of Canada web application release or meaningful service change.
- Updated shared menu with Home and the new page or parent task area.
- Orienting home page or service home when the solution or feature area needs an entry point.
- Task route or page-branching plan.
- Primary task navigation paths.
- GC Design System component mapping and custom UI exceptions.
- Desktop screenshot.
- Mobile screenshot.
- Design-system checklist.
- Accessibility result.
- Exception list, if any.
- Evidence Bundle path when `delorean-evidence` is invoked.
- Approval or waiver status when relevant.
- Re-entry phase and reason code when blocked and in scope.
- Evidence inputs that link the issue, scenario, task, or OpenSpec change to the decision, checks, screenshots, and remaining risk.
- Baseline assessment evidence inputs when BAS-001 applies.

## Guardrails

- User-facing pages must start from an approved page pattern.
- Do not build from a blank custom layout unless a human approves an exception.
- Do not put several distinct workflows on one page when a service home and separate task routes would be clearer.
- Do not create a user-facing page without updating the shared menu or recording why it is intentionally excluded.
- Do not remove the home page or leave `Home` out of the shared menu.
- Do not rely on breadcrumbs, direct URLs, or browser history as the primary navigation path.
- Do not add a standalone language toggle in the page body when the approved header already provides one.
- Do not create a custom visual design system.
- Do not use raw HTML buttons, form controls, textareas, labels, fieldsets, legends, links, alerts, headers, footers, or nav when a GC Design System component fits.
- Do not copy OpenSpec requirement text into `change-state.yaml`; link back to OpenSpec.
- Do not force one frontend framework when the solution repo uses another stack.
- Use GC Design System components first for Government of Canada UI. Use GCWeb/WET only when the solution has chosen that stack or is maintaining legacy GCWeb/WET pages.
- Keep custom UI exceptions short, specific, and traceable to the decision and evidence.
- Ask the user directly when route, implementation, evidence, or next-prompt choices are unclear; keep final chat to the page decision, implementation or handoff status, verification, and recorded risks.

## Missing Details And Safe Defaults

When details are missing, do not stop at broad questions. Recommend the safe local path first, list one or two alternatives when useful, and continue under local developer / localhost assumptions when safe. Ask only for details needed before shared-environment work, production work, real secrets, approval, waivers, deployment, destructive changes, or wider tool/API/MCP/file access.
