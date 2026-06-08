# CanadaLogin Partner Portal MVP PRD

## Document Status

- Status: Draft scoped to the minimum viable product based on the refined user story map dated 2026-05-31
- Product: CanadaLogin Partner Portal (MVP)
- Intended audience: product, engineering, platform operations, delivery, design, and policy stakeholders

## 1. Executive Summary

The CanadaLogin Partner Portal MVP is a focused first release that lets a partner developer sign in with a Government of Canada email and link their profile to the relying party (RP) applications they already own in IBM Security Verify, manage the client secrets for those applications, view monthly active user (MAU) metrics, and reach support. 

This MVP intentionally narrows the broader portal vision to four user journeys: onboarding and setup, secret management, usage reporting, and support. 

It removes workflow features that are not required to deliver value at launch, including external developer invitations, structured multi-section application information intake, departments and tiers administration UIs, and platform-wide governance modules. The goal is to ship a small, secure, and self-service portal that proves the core onboarding-to-operations loop for partner teams.

## 2. Product Vision

Provide a secure, self-service portal where a verified Government of Canada partner developer can sign in, claim ownership of the RP applications they operate in CanadaLogin, manage credentials safely, see how many citizens are using their application, and get help when they need it.

## 3. Problem Statement

Partner teams that integrate with CanadaLogin today rely on manual coordination with the identity team to claim ownership of their RP applications, rotate client secrets, and obtain usage information. This produces several problems at MVP scope:

- partners cannot self-verify ownership of an RP application they already operate in IBM Security Verify
- secret retrieval and rotation rely on out-of-band requests that are slow and hard to audit
- partners have no first-party visibility into monthly active user counts or month-to-date sign-in success
- there is no consistent path to a support request when issues arise
- first-time sign-in, MFA, and session-timeout behaviour are inconsistent across touchpoints

The MVP addresses these gaps with a single authenticated portal that links a verified partner identity to the RP applications they already own in IBM Security Verify.

## 4. Product Goals

### Primary Goals

1. Let a partner sign up and sign in with a valid GC email, including password complexity, email OTP validation, and a passkey.
2. Link user profile that uses IBM Security Verify as the source of truth for RP application ownership and associates each RP with a GC department.
3. Allow a the application owner role to view current credentials, rotate the client secret with a controlled expiry on the old secret, and generate a brand-new secret that immediately replaces the old one.
4. Show partners a simple MAU dashboard with month-to-date active users and authentication success rate for their RP application.
5. Provide a link to the partner support channel (Jira).
6. Enforce a reviewed and implemented session timeout policy across the portal.
7. Meet key [NIST 800-53 Rev. 5](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r5.pdf) security controls applicable to MVP scope.
8. Meet [WCAG 2.1, level A and AA](https://www.w3.org/WAI/WCAG22/quickref/?versions=2.1) accessibility requirements for the MVP UI.

### Secondary Goals

1. Keep the partner profile data model thin so that future onboarding intake can extend it without rework.
2. Use IBM Verify to support our sign-in and sign-up flows for service owners.
3. Preserve a clean backend contract with standardized error envelopes and reusable authorization patterns.
4. Implement basic monitoring, logs, and alarms for system health and security. 

## 5. Non-Goals

1. Inviting external developers who do not already have a registered RP in production.
2. Multi-user collaboration on a single partner profile, including delegation to additional members.
3. Automatic configuration of RPs.
4. Platform administration UIs for users, roles, policies, departments, or tiers.
5. Approval workflows, review checkpoints, or onboarding state machines.
6. Aggregate cross-partner analytics or executive dashboards.
7. Native mobile apps.
8. Replacing IBM Security Verify as the system of record for identity or runtime application configuration.

## 6. Current Product Scope

The MVP delivers the following capabilities, organized to mirror the four journeys in the refined user story map.

### Onboarding And Setup

- Sign in to the Partner Portal through CanadaLogin, if they are an application owner
- Sign up or sign in using a valid Government of Canada email address.
- Provide error messages to the user if they attempt to sign-up without a valid GC email domain
- Enforce password complexity requirements during sign-up.
- Validate the GC email address with a one-time passcode (OTP).
- Require the user to register a passkey as a second factor.
- Require the user to associate themself with a GC department, or discern it from their email domain. (Optional)
- Require the user to accept the Partner Portal terms and conditions.
- Set up the partner profile by treating IBM Security Verify as the source of truth for the Verify Owner field, and RP department (var: Company Name - FOR DECISION). 
- Import the user's RP IDs based on their user email in IBM Security Verify.
- Apply a reviewed and implemented session timeout across authenticated routes.

### Manage Secrets

- View current secrets for an owned RP application as the application owner.
- Rotate the secret as the application owner, including setting a time at which the old secret will expire.
- Generate a new secret as the application owner that immediately removes the old secret and creates a replacement.
- Download a CSV log that shows **when** a secret was rotated, or otherwise changed, and by **whom**. Ensure the log format aligns with the current Sentinel format.
- Send the updated secret log to our Sentinel instance (stretch)

### Monitor And Usage Reporting

- Investigate and integrate the D&R team pipeline as the data source for MAU.
- Ensure the D&R team repository is the single source of truth for metrics
- Display month-to-date monthly active users.
- Display authentication success rate.
- Display month-to-date active users.
- Nice to have: line chart of MAU over the month, per day.

### Support And Troubleshooting

- Submit Support Request via a link to the support intake form in Jira owned by PSO.

## 7. Target Users And Personas

### Persona 1: Partner Developer (RP Application Owner)

A Government of Canada partner who already operates one or more RP applications integrated with CanadaLogin through IBM Security Verify. Needs to sign in with their GC email, claim their RP applications, manage client secrets, and monitor MAU for their application. Holds the application owner role for view, rotate, and regenerate access to credentials.

### Persona 2: Platform Support Operator (PSO)

Receives support requests submitted through the Jira intake linked from the portal. Not a direct user of the portal in MVP, but is the downstream owner of the support workflow.

> Multi-user administrator roles, invited external developers, and platform superusers as defined in the broader portal vision are out of scope for the MVP. The MVP assumes a single partner developer manages their own profile and RP applications, with no shared or delegated administration. Collaboration roles may return in later phases.

## 8. Core User Journeys

### Journey A: First-Time Partner Sign-Up And Profile Setup

1. Content informs users who can sign-up and create an account right now - only people with a live RP. 
2. User navigates to the Partner Portal and signs up or signs in with a valid GC email address.
3. Back-end validates that their domain name is on our allow list for GC departments
4. User sets a password that meets complexity requirements.
5. User validates their GC email with an emailed OTP.
6. User register and use a passkey.
7. User accepts the Partner Portal terms and conditions.
8. User selects a GC department to associate with their account. OR we prompt the user to decide on a department based on their domain
9. The system checks the Verify Owner field in IBM Security Verify to see if they have an existing RP they own.
  a. Happy: If the Verify Owner field matches an existing RP they can view their account
  b. unhappy: If the Verify Owner field does NOT match an existing RP, inform them that they cannot sign-up right now. 

### Journey B: Partner Views, Generates, or Rotates A Client Secret

1. Application owner lands in the portal and can see their RP metadata, including: application name, client ID, application URL, call-back URL, and department name and MAU.
2. Application owner can open the secrets view for an owned RP application.
3. In the secrets view, they can initiate a "rotation", specifying a time at which the old secret will expire. The system creates a new secret while keeping the old secret valid until expiry.
4. In the secrets view, they can initiate a "generate new secret". This immediately invalidates the old secret and replaces it with a new one. 

### Journey D: Partner Views MAU For Their RP Application

1. Application owner lands in the portal and can see their RP metadata, including: application name, client ID, application URL, call-back URL, and department name, and MAU.
2. User opens the reporting dashboard for their RP application.
3. The dashboard displays month-to-date monthly active users, success rate, and month-to-date active users.
4. If available, the dashboard renders a line chart of MAU over the month, per day.

### Journey E: Partner Requests Support

1. User selects Submit Support Request and is taken to the PSO-owned Jira intake form.

### Journey F: Partner billing
1. PSO team can associate an RP ID and a department (var: Company Name - FOR DECISION)
2. D&R team: PSO team can use the department and MAU to determine the billing amount for a month, up to 90 days in the past

## 9. Functional Requirements

### 9.1 Authentication And Access Control

1. The system must allow sign-up and sign-in only with a valid Government of Canada email address.
2. The system must enforce password complexity requirements during account creation and password changes.
3. The system must validate the user's GC email address with a one-time passcode before activation.
4. The system must require the user to register a passkey as a second factor.
5. The system must require the user to associate themself with a GC department before accessing protected routes.
6. The system must require the user to accept the Partner Portal terms and conditions before accessing protected routes.
7. The system must enforce a reviewed and implemented session timeout for authenticated sessions.
8. The system must redirect unauthenticated users to sign-in when accessing protected routes.
9. The system must enforce role-based access for the application owner role on secret view, rotate, and regenerate operations.

### 9.2 Partner Profile Setup

1. The system must update the Verify Owner field in IBM Security Verify so that Verify remains the source of truth for RP application ownership.
2. The system must import the user's RP IDs from IBM Security Verify based on the user's verified email.
3. The system must allow the user to associate each imported RP application with a GC department.
4. The system must persist the partner profile so that subsequent sessions resume without repeating onboarding steps.

### 9.3 Manage Secrets

1. Users with the application owner role must be able to view current secret metadata for an owned RP application.
2. Users with the application owner role must be able to rotate the secret, including specifying a time at which the old secret will expire.
3. Users with the application owner role must be able to generate a new secret that immediately removes the old secret and creates a replacement.
4. Secret rotation and generation actions must align with the IBM Security Verify integration contract.
5. The UI must clearly distinguish between rotate (with old-secret expiry) and generate-new (immediate replacement).

### 9.4 Monitor And Usage Reporting

1. The system must display month-to-date monthly active users for an owned RP application.
2. The system must display authentication success rate.
3. The system must display month-to-date active users.
4. The system should display, where data is available, a per-day line chart of MAU over the current month (nice to have).
5. The system must source MAU data from the D&R team pipeline; pipeline integration must be investigated and confirmed before launch.

### 9.5 Support And Troubleshooting

1. The portal must provide a Submit Support Request entry point that links to the PSO-owned Jira intake form.
2. The support link must be visible from a consistent location in the authenticated UI.

## 10. Non-Functional Requirements

### Security

- All protected operations must require authenticated session state.
- All credential operations must be policy-guarded by the application owner role.
- Sign-in must enforce password complexity, email OTP validation, and passkey registration.
- A reviewed session timeout must be implemented and consistently applied.
- Secret values must not be exposed beyond what the application owner role permits.

### Privacy And Compliance

- Personal data handling must align with Government of Canada expectations.
- MAU and usage metrics must be aggregated and must not expose individual end-user identity.
- Acceptance of terms and conditions must be recorded.

### Reliability

- Health and readiness endpoints must support deployment diagnostics.
- Backend errors must follow the shared error response shape.
- Identity and onboarding flows must fail safely with explicit denial behaviour.

### Usability

- The UI must provide clear success and error notices for management actions.
- Onboarding flows must be explicit and understandable for first-time users.
- Interface components must be navigable by screen readers, specifically NVDA, JAWS, and VoiceOver.
- Colour contrast ratios must be at least 3:1 against adjacent colours.

### Internationalization

- The frontend must remain bilingual-ready through i18n-backed copy.
- Department and other labels must support language-aware rendering where data exists.

### Maintainability

- The backend must continue using centralized services, repositories, and exception contracts.
- The frontend must continue using feature-based organization, TanStack Router, and React Query.

## 11. Data And Domain Model Summary

The MVP centers on a deliberately small set of entities:

- User (with verified GC email, password, passkey, department association, and accepted terms timestamp)
- Department
- Partner Profile (one per partner user, linked to IBM Security Verify owner identity)
- RP Application (imported from IBM Security Verify, associated with a GC department)
- Client Secret (current, rotated with expiry, or generated new)
- MAU Metric (month-to-date MAU, success rate, month-to-date active users, optional per-day series)
- Support Link Reference (Jira form URL)

These entities map cleanly to the MVP product model:

- a verified user owns one partner profile
- the partner profile inherits RP application ownership from IBM Security Verify based on email
- each imported RP application is associated with one GC department
- client secrets belong to a single RP application and follow rotate or generate-new lifecycles
- MAU metrics are read-only aggregates sourced from the D&R pipeline

### System documentation

Create the following artifacts as outputs for every build:

- Architecture overview: the actual components, services, and relationships as they exist in the code, in a defined output format.
- Data flow diagrams: how data moves through the system end-to-end, including edge cases, async processes, and error paths, in a format that integrates with CDS' Valentine threat modeling tool.
- Key dependencies: internal modules and external integrations that the system actually relies on, in a format consumable by dependency management tooling.

### Security Assessment And Authorization Documentation

- (placeholder for high-level process and required outputs)

## 12. Integrations And External Dependencies

### Required External Systems

- OIDC identity provider for login.
- IBM Security Verify as the source of truth for RP application ownership, owner identity, and secret operations.
- Email delivery channel for the OTP used during email validation.
- D&R team data pipeline for MAU metrics.
- PSO-owned Jira instance for the support intake form.
- PostgreSQL for persistent data.
- Redis for sessions and caching.

### Internal Platform Dependencies

- Casbin for authorization rules.
- FastAPI, SQLAlchemy, Alembic, and Pydantic on the backend.
- React, TanStack Router, TanStack Query, React Hook Form, Zod, and GCDS-based UI wrappers on the frontend.

## 13. Success Metrics

### Onboarding Metrics

- Number of users completing sign-up through passkey registration.
- Number of partner profiles successfully linked to IBM Security Verify.
- Number of RP applications imported per user.
- Time from sign-up start to partner profile completion.
- Percentage of users who complete department association and terms acceptance.

### Adoption Metrics

- Monthly active authenticated users of the portal.
- Number of partners viewing the MAU dashboard at least once per month.
- Number of secret rotations and new-secret generations per month.

### Quality Metrics

- Sign-up completion rate by step (email, OTP, passkey, department, terms).
- Secret rotation success rate.
- New-secret generation success rate.
- MAU dashboard query failure rate.
- Backend health and readiness uptime.
- Session timeout incidents and recovery rate.

### Governance Metrics

- Percentage of imported RP applications with a department association.
- Percentage of users with an accepted terms timestamp.
- Support request volume routed through the Jira link.

## 14. Current Gaps And Product Risks

### Gaps

1. The D&R team MAU pipeline integration is still to be investigated and may shape the final dashboard contract.
2. The session timeout policy needs to be reviewed and explicitly defined before implementation.
3. The exact application owner role scope (view, rotate, regenerate) needs to be finalized in product copy and policy.
4. The terms-and-conditions copy and storage contract are not yet defined.
5. Behaviour for partners whose Verify email does not match any RP application is not yet specified.

### Risks

1. If IBM Security Verify ownership data is incomplete or stale, RP import may surface incorrect or empty results for legitimate partners.
2. The generate-new flow is destructive by design; UX must make the immediate-replacement behaviour unambiguous to avoid outages.
3. The rotate flow with delayed expiry must clearly communicate the expiry time to avoid silent secret expiration.
4. Linking out to Jira creates a fragmented support experience that depends on that external surface remaining current.
5. Passkey adoption may create friction for users on unsupported devices and browsers.

## 15. Recommended Product Roadmap

### Phase 1: Ship MVP

1. Deliver the four MVP journeys: Onboarding & Setup, Manage Secrets, Monitor & Usage Reporting, and Support & Troubleshooting.
2. Confirm and integrate the D&R MAU pipeline.
3. Implement and validate the session timeout policy.
4. Publish baseline telemetry for sign-up, secret operations, and MAU views.

### Phase 2: Expand Profile And Application Management

1. Re-introduce structured application information intake across business, technical, security, privacy, and migration sections.
2. Add multi-user collaboration on a partner profile beyond the single verified owner.
3. Introduce explicit onboarding lifecycle states and completion indicators.

### Phase 3: Governance, Collaboration, And Oversight

1. Add external developer invitations scoped to a single RP application.
2. Add platform administration surfaces for users, roles, departments, tiers, and policies.
3. Add aggregate dashboards, audit reporting, and bulk operations.

## 16. Open Questions

1. What exact session timeout duration should apply, and should it differ for idle vs absolute expiry?
2. What is the canonical password complexity policy for the GC email sign-up flow?
3. Which passkey ceremonies and recovery paths must be supported at MVP?
4. What should happen when a verified user has no RP applications associated with their email in IBM Security Verify?
5. Is the rotate-with-expiry window bounded (for example, maximum N days), and what is the default?
6. Which exact MAU dimensions does the D&R pipeline expose, and are there latency or freshness constraints?
7. What audit retention applies to secret rotation and generate-new events at MVP?

## 17. Recommended Immediate Next Requirements

Based on the MVP scope, the highest-value near-term product requirements are:

1. Finalize the session timeout policy and implement it across the portal.
2. Confirm the D&R MAU pipeline contract and wire it into the dashboard.
3. Define and implement the rotate vs generate-new UX with unambiguous warnings and confirmation.
4. Lock the sign-up flow ordering for email, OTP, passkey, department, and terms, and instrument each step.
5. Define the policy for users whose IBM Security Verify email yields no RP applications.

## 18. Summary

The CanadaLogin Partner Portal MVP focuses on a single, coherent partner experience: sign in with a verified GC identity, claim the RP applications you already own in IBM Security Verify, manage their client secrets safely, see how your application is being used, and reach support when you need it. By deliberately deferring multi-user collaboration, structured intake, invitations, and platform governance, the MVP delivers a small, secure, and measurable foundation that future phases can extend without rework.
