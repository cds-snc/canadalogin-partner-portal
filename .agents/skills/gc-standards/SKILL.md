---
name: gc-standards
description: Check which Government of Canada standards apply before planning, implementation, review, or verification continues.
---

# Purpose

Make Government of Canada standards visible before work moves forward.

Use this skill to decide which standards apply, what the builder must follow, what reviewers must check, and what evidence inputs should be collected.

# Role in Delorean

`gc-standards` is the standards impact router.

It decides which Government of Canada and delivery standards may apply. It also
decides whether the GC web application baseline path is relevant. It may
recommend targeted `gc-review-*` skills, but it does not replace Delorean
planning, implementation, verification, evidence packaging, approval, waiver,
baseline gate, or release-readiness records.

Use `gc-standards` during planning, implementation, verification, and review
when a change may affect UI, content, forms, APIs, data, accessibility,
official languages, security, privacy, identity, information management,
records, operations, release evidence, or baseline assessment.

# Local wrapper metadata

Source: Local template wrapper, adapted from public GC standards review patterns and `dougkeefe/gc-code-skills`
Snapshot or version: Template starter, update when GC Design System or local standards change
Owner: Repo maintainers until replaced by a solution owner
Applies to phases: Spec, Plan, Implement, Verify, Release-ready
Skill perspective: Protects GC Design System, accessibility, official languages, security, privacy, identity, information management, baseline assessment, and evidence expectations.
Invocation criteria: Use when work touches UI, content, forms, APIs, data, database persistence, identity, security, privacy, logging, records, operations, release evidence, or baseline assessment.
Pre-handoff checks: Standards impact, baseline applicability, affected `GC-WEB-*` controls, page pattern decision, primary task navigation paths, design system choices, custom UI exceptions, applicable `gc-review-*` skills, findings, remediation status, evidence inputs, and human approval needs are named.
Related local gates: STD-017: Government of Canada Standards Review, STD-019: Government of Canada Web Application Baseline Governance, BAS-001: Government of Canada Web Application Baseline, STD-006: GC UI Page Layout Rules, TPL-003: Standards Impact Template, TPL-011: GC Web Application Baseline Assessment Template, [scripts/delorean/run-frontend-standards-checks.sh](../../../scripts/delorean/run-frontend-standards-checks.sh), [scripts/delorean/run-ui-page-shell-checks.sh](../../../scripts/delorean/run-ui-page-shell-checks.sh)
Refresh model: Review when GC Design System, local standards, or Government of Canada compliance guidance changes.

# Inputs

- Work request, issue, OpenSpec change, design package, ADR, diff, or pull request.
- Impacted folders and files.
- Known user-facing, data, security, privacy, identity, or records impact.
- Expected evidence and verification commands.

# Reference Loading

Use [references.md](references.md) as the loading manifest. Load only the always-needed references plus the sections that match the affected standard area. Browse or verify official external sources when current policy, product version, or compliance detail matters.

# Procedure

1. Identify whether the change affects UI, content, forms, APIs, data, database persistence, auth, logging, records, deployment, operations, release evidence, or baseline assessment.
2. Read the local standards that match the affected areas.
3. For Government of Canada web application releases or meaningful service changes, identify whether STD-019 and BAS-001 apply, name affected `GC-WEB-*` controls, and name whether TPL-011 assessment evidence is needed.
4. For user-facing page work, require a page pattern decision before implementation starts.
5. For UI or frontend work, require a GC Design System or approved template plan before implementation starts.
6. For bilingual routes or content, require the language toggle to come from the approved header pattern or `gcds-header` language-toggle support unless an exception is recorded.
7. For work with multiple user goals, require a task-oriented service home or task hub and separate task routes unless the page pattern decision records a single-page rationale.
8. For new pages or task routes, require the shared menu to include `Home` and the new page or parent task area unless the page pattern decision records an exclusion reason.
9. Require primary task navigation paths from `Home` or service home to destination routes and back to the parent task area.
10. Map likely GC Design System components or page templates to the UI need.
11. Name any custom UI exception and why a GC Design System component does not fit, especially for raw HTML controls, links, alerts, headers, footers, or navigation.
12. Select targeted review skills when the change needs explicit validation:
   - `gc-review-a11y` for user-facing accessibility risk.
   - `gc-review-branding` for GC Design System, Canada.ca layout, or FIP risk.
   - `gc-review-bilingual` for official-languages, i18n, or content parity risk.
   - `gc-review-security` for security, privacy, PII, trust-boundary, or Protected B risk.
   - `gc-review-iam` for authn, authz, OIDC/OAuth, sessions, tokens, scopes, claims, or roles.
   - `gc-review-im` for records, metadata, retention, disposition, deletion, auditability, database schema, migrations, or data lifecycle.
13. Name accessibility, official languages, security, privacy, identity, information management, baseline, and evidence checks that apply.
14. Add the standards impact block and baseline assessment notes to the plan, implementation handoff, review findings, or evidence inputs.

# Frontend rule

For Government of Canada frontend work:

- Use GC Design System components first.
- Start user-facing pages from an approved page pattern and record the page pattern decision before implementation.
- Keep the language toggle in the approved header pattern when bilingual routes or content exist.
- Use a service home or task hub with separate task routes when a feature has multiple user goals.
- Keep a functional home page or service home and update the shared menu when pages are added.
- Record primary task navigation paths before implementation; do not rely on breadcrumbs, direct URLs, browser history, or unrelated pages as the main path.
- Use `@gcds-core/components-react` for React UI when the starter frontend is kept.
- Confirm GC Design System CSS is imported.
- Do not build custom buttons, inputs, selects, textareas, labels, fieldsets, legends, headers, footers, alerts, links, or navigation when a GC Design System component fits.
- Document custom UI exceptions before or during implementation.
- Use semantic HTML and accessible behavior when a custom component is truly needed.

# Output format

Use this block when standards apply:

```text
Standards impact:
- Applies: <yes/no and why>
- GC Design System components or templates:
- Approved page pattern and page shell:
- Task branching or page route plan:
- Home page or service home:
- Primary task navigation paths:
- Shared menu update:
- Raw HTML controls or custom navigation:
- Custom UI exceptions:
- Accessibility checks:
- Official languages checks:
- Security, privacy, IAM, or IM checks:
- Database or persistence checks:
- Baseline assessment:
- Affected GC-WEB controls:
- Baseline evidence, deferred controls, or exceptions:
- Evidence inputs to collect:
- Targeted review skills:
- Remaining standards risks:
```

# When to escalate

- A UI plan avoids GC Design System components without a clear reason.
- A custom component replaces a GC Design System component that appears to fit.
- A UI plan has unclear primary task navigation paths.
- Accessibility, bilingual, security, privacy, identity, or records impact is unclear.
- The change needs an exception, waiver, approval, or formal review.
- Evidence cannot show that the applicable standard was considered.

# Source and ownership

- This is a local template wrapper.
- It is inspired by public Government of Canada standards and `dougkeefe/gc-code-skills`.
- Keep attribution when reusing this structure.
- Do not copy external skill files word for word without confirming license and preserving required notices.
