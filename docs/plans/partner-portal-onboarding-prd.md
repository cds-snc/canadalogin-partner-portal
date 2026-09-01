# Product Requirements Document: CanadaLogin Partner Portal Onboarding

## Document Status
Draft

## Date
2026-07-22

## Summary
This PRD defines onboarding and environment progression requirements for the CanadaLogin Partner Portal, grounded in:
- The story map shared for Partner Portal.
- Partner onboarding artifacts (Application info, Application contacts, RP registration form, onboarding checklist).
- Current implemented behavior observed in the existing Partner Portal repository.

This version separates what is already implemented from what is net-new or still TBD.

## Problem Statement
Partner onboarding currently spans in-app workflows and out-of-app processes across external systems and operational teams. The portal must reduce duplicate effort, increase readiness visibility, and keep strict security boundaries while supporting required manual controls for production release.

## Product Goals
- Provide a clear onboarding path from account access to go-live.
- Reuse known data across TEST, STAGING, and PRODUCTION to reduce repeated entry.
- Keep production governance and review traceable, even when approval happens outside the portal.
- Preserve least-privilege access and prevent unauthorized secret exposure.
- Support future expansion for operational and lifecycle flows (for example deprecation).

## Scope
In scope:
- Account access, role-based access, onboarding data capture, contacts, RP setup data, environment progression metadata, secret handling, status visibility, MAU/usage visibility, and process links.

Out of scope for this iteration:
- Replacing external review systems.
- Fully productized in-app approval engine.
- Final policy decisions for currently unresolved process details.

## Confirmed Decisions
- Scope includes all identified stories.
- TEST may be skipped if IBM config change is not required and partner confidence is sufficient.
- TEST to STAGING is self-serve.
- STAGING to PRODUCTION requires partner request and CL review.
- CanadaLogin sign-up is mandatory for partner users.
- Partner access is domain-restricted.
- RP secrets are available to authorized RP roles masked, but able to be revealed.
- CL Admin must never view RP secret values.
- No automatic partner notification on secret changes.
- Approval workflow is out-of-band, but portal must track status and external reference. (Explore if we can POST to the Jira API)
- Incident reporting workflow details are deferred (TBD).
- Deprecation starts as Jira link-out and must be extensible for future in-app flow.

## Current Implementation Baseline (Repository-Aligned)
Already implemented today:
- CanadaLogin OIDC login/session foundation with server-side sessions.
- Route/API authorization patterns and permission guards.
- Department-aware onboarding/access behavior.
- Application information model and contacts model foundations.
- RP application detail and OAuth setup views.
- Secret operations including reveal/rotate/regenerate patterns with masking/reveal controls in UI.
- MAU reporting pipeline integration and UI reporting patterns.
- Health and readiness endpoint patterns.

Partially implemented or implementation-specific:
- Role model in current codebase exists, but does not yet directly map to the final RP Admin / RP User / Read Only / CL Admin operational model described here.

Not implemented or intentionally deferred:
- Formalized end-to-end in-app promotion approvals.
- Finalized contact-type gating policy by stage.
- Finalized CATS evidence collection mechanism.
- Finalized volume-spike submission mechanism.
- Detailed incident workflow in portal.
- Full deprecation workflow states and automation.

## Required Partner Artifacts
The portal must collect, track, and reuse information from:
- Application information sheet (Application info).
- Application contacts sheet (Application contacts).
- Relying party registration form (per environment).
- Onboarding checklist.

## Features and Open Spec Requirements

### Feature 1: Partner Authentication
Implementation status: Implemented baseline

Open Spec statement:
- The system shall require CanadaLogin authentication for partner users before any protected onboarding or operations workflow is available.

### Feature 2: Domain-Restricted Access
Implementation status: Implemented baseline / policy alignment needed

Open Spec statement:
- The system shall enforce domain-based partner access controls when associating users to partner organization context.

### Feature 3: Role and Permission Model
Implementation status: Partially implemented (current role model differs from target operations model)

Open Spec statement:
- The system shall enforce role-based permissions that support RP Admin, RP User (Edit), Read Only, and CL Admin responsibilities while preventing CL Admin access to RP secrets.
- Action item: develope the full user role model, information, and data flows to define the schema. 

Required behavior (review after schema is developed):
- RP Admin: all partner permissions except promotion approve/reject.
- RP User (Edit): read/edit for config, promotion request metadata, secret-reveal workflows, and CATS-related submission fields.
- Read Only: no edit actions.
- CL Admin: metadata/status visibility only; no secret values, or assigning themselves to an RP Admin role. 

### Feature 4: Application Information Intake
Implementation status: Implemented baseline (field alignment refinement required)

Open Spec statement:
- The system shall capture and maintain application information required for STAGING readiness and production planning.
- [Add: The fields required] @sr

### Feature 5: Application Contacts Intake
Implementation status: Implemented baseline (gating rules TBD)

Open Spec statement:
- The system shall capture application contacts and contact-type designations required for onboarding, support, incident response, and authorization workflows.
- SR to Add required fields

TBD:
- Mandatory contact-type gate by stage (STAGING, PRODUCTION).

### Feature 6: RP Registration Form Management Across Environments
Implementation status: Partially implemented

Open Spec statement:
- The system shall support environment-scoped RP registration data and pre-fill previously provided values when promoting from one environment to the next.
- To be decided: Where the single source of truth for the OIDC configuration and business information is stored. @kev

### Feature 7: Environment Lifecycle Rules
Implementation status: Partially implemented

Open Spec statement:
- The system shall support TEST-optional onboarding, self-serve TEST to STAGING progression, and CL-reviewed STAGING to PRODUCTION progression.

### Feature 8: Promotion Review Tracking (Out-of-Band Approval)
Implementation status: Net new

Open Spec statement:
- TBD, depending on JIRA: The system shall track promotion request status and external review references when approval actions occur outside the portal.

Required minimum:
- Status states (for example pending, approved, rejected).
- External reference (for example ticket or review record).
- Reviewer metadata and timestamps.

### Feature 9: Secrets Handling and one-time Reveal Functionality
Implementation status: Implemented baseline with policy constraints

Open Spec statement:
- The system shall provide authorized RP users one-time secret reveal behavior and enforce strict non-visibility of secret values for CL Admin users.

### Feature 10: CATS Evidence and Readiness (V2)
Implementation status: Partially implemented/TBD

Open Spec statement:
- The system shall link to the CATS readiness checklist for partners to complete out-of-band
- The system shall prompt RP admins to provide their CATS readiness report to the CL admin via Jira when they request to go-live

TBD:
- Evidence mechanism: upload, reference, or both.

### Feature 11: Onboarding Checklist Tracking (V2)
Implementation status: Partially implemented

Open Spec statement:
- The system shall represent onboarding checklist progress from preparation through go-live and make required artifacts visible before production progression.

### Feature 12: Documentation and External Link Hub
Implementation status: Implemented baseline/expandable

Open Spec statement:
- The system shall provide contextual links to required onboarding documentation and external process entry points.

### Feature 13: Metrics and MAU Reporting
Implementation status: Implemented baseline

Open Spec statement:
- The system shall display high-level usage metrics, including monthly active user-related reporting, sourced from approved data pipelines.

### Feature 15: Volume Spike Notification
Implementation status: Net new

Open Spec statement:
- The system shall provide an in-portal path for partners to notify CanadaLogin of anticipated volume spikes.
- The system shall push partners to fill out a form and submit it via Jira

TBD:
- Submission implementation (ticket creation vs redirect to intake link).

### Feature 16: Incident Reporting Path
Implementation status: Deferred/TBD

Open Spec statement:
- The system shall provide a discoverable partner incident reporting path.
- SR to connect with PSO on how partners report incidents

TBD:
- Detailed incident workflow, intake mechanism, and SLA handling.

### Feature 17: Live Integration Management
Implementation status: Partially implemented

Open Spec statement:
- The system shall provide post-go-live integration visibility including status, support references, and operational metadata needed by partner teams.

### Feature 18: Deprecation Transition Foundation
Implementation status: Net new (foundational)

Open Spec statement:
- The system shall support immediate deprecation initiation by external Jira link-out and preserve a data foundation that allows future first-class in-app deprecation workflow states.

## Security and Privacy Requirements
- CL Admin must never access RP secret values.
- Secret access/reveal and secret lifecycle actions must be auditable.
- Role assignments and sensitive workflow actions must be auditable.
- Personal and partner metadata must be handled per Government of Canada privacy and security obligations.

## Non-Functional Requirements
- Reliability: health and readiness endpoints and stable onboarding flows.
- Usability: clear role boundaries, state clarity, and actionable status messaging.
- Accessibility: onboarding and operational views must meet accessibility expectations.
- Internationalization: onboarding-critical flows must support bilingual presentation.

## Data Model Direction
Entities and relationships must support:
- Partner org and user role context.
- Application info and application contacts.
- RP application records across environments.
- Promotion request metadata and out-of-band review references.
- Secret lifecycle metadata and audit events.
- Onboarding checklist status.
- Future deprecation state transitions.

## Success Metrics
- Higher first-pass completeness for STAGING and PRODUCTION requests.
- Reduced duplicate data entry across environment moves.
- Improved visibility into onboarding stage and blockers.
- Zero CL Admin secret exposure incidents.
- Increased partner self-service completion across onboarding steps.

## Dependencies
- Existing Partner Portal application and infrastructure.
- CanadaLogin authentication stack.
- IBM Verify integration surface.
- MAU source pipeline and ingestion jobs.
- External workflow tooling (for example Jira/JSM/GCXchange).

## Open Questions and Explicit TBDs
- Required contact-type gating policy by stage.
- CATS evidence collection and validation model.
- Volume-spike workflow implementation pattern.
- Incident reporting workflow details.
- Full deprecation workflow states, approvals, and notifications.
