# CanadaLogin Partner Portal PRD

## Document Status

- Status: Draft generated from implemented repository state as of 2026-05-13
- Product: CanadaLogin Partner Portal
- Source of truth for this draft: current frontend routes, frontend feature pages, backend API surface, repository docs, and tests present in this monorepo
- Intended audience: product, engineering, platform operations, delivery, design, and policy stakeholders

## 1. Executive Summary

CanadaLogin Partner Portal is an internal and partner-facing web application for managing organizations, users, workspaces, and relying party applications that integrate with CanadaLogin through IBM Security Verify. The product already supports authenticated internal users, workspace administrators, and invited external developers. It provides a structured way to register workspace context, collect application onboarding metadata, manage RP application records, manage credentials and secret rotation, review usage, and delegate limited application access to non-workspace members.

The product is already beyond a prototype. It contains end-to-end authentication, session management, RBAC, workspace administration, application information intake, application detail management, usage reporting, invite acceptance flows, department setup, and platform-admin CRUD modules for users, roles, policies, departments, and tiers. The next product challenge is less about inventing the base workflow and more about tightening the end-to-end partner onboarding experience, closing remaining UI gaps, clarifying policy and operational ownership, and hardening the service for broader adoption.

## 2. Product Vision

Provide a secure, auditable, self-service portal that allows government teams and approved partner stakeholders to onboard, manage, and operate CanadaLogin-integrated applications with less manual coordination, stronger policy enforcement, and clearer visibility into application setup, access, and usage.

## 3. Problem Statement

Today, onboarding and managing RP applications typically requires coordination across identity, platform, and application teams. Information needed for onboarding is spread across email threads, forms, manual approvals, and separate administration tools. This creates several problems:

- application onboarding context is incomplete or inconsistent
- workspace ownership and delegated access are difficult to manage cleanly
- external developers need narrow access to a single application without receiving broad workspace permissions
- client credentials and rotations need operational controls and auditability
- usage and audit information is not centralized in the same workflow as application management
- first-time user setup and access denial paths need to be explicit and policy-safe

CanadaLogin Partner Portal addresses this by providing one authenticated portal with structured data capture, governed permissions, and direct integration with IBM Security Verify and GC Notify.

## 4. Product Goals

### Primary Goals

1. Centralize RP application onboarding and management in a single secure portal.
2. Allow workspace administrators to manage applications, members, contacts, and external developer invitations without broad manual operator intervention.
3. Let invited external developers access only the RP applications they were explicitly invited to manage.
4. Reduce onboarding ambiguity by collecting standardized application information, contacts, security posture, migration details, and usage context.
5. Provide operational visibility into credentials, secret rotation, and application usage.
6. Enforce organization-aware access control through authenticated sessions, department assignment, and policy-backed authorization.

### Secondary Goals

1. Support bilingual-ready user experience patterns.
2. Expose an internal administration surface for platform entities such as users, roles, departments, tiers, and policies.
3. Preserve a clean backend contract with standardized error envelopes and reusable authorization patterns.

## 5. Non-Goals

1. Full public self-serve onboarding for anonymous users.
2. Broad external collaboration across an entire workspace for invitees.
3. Replacing IBM Security Verify as the system of record for identity or application runtime management.
4. Complex workflow automation such as configurable approvals, SLA orchestration, or ticket-based review routing.
5. Billing, quotas, or customer invoicing.
6. Native mobile apps.

## 6. Current Product Scope

The following capabilities are implemented in the current repository.

### Authentication And Session Management

- OIDC login and callback flow through the backend
- server-side session handling with authenticated frontend route guards
- post-login redirect handling
- mandatory first-time department selection before accessing protected application routes
- dedicated access-denied route for blocked or uninvited sign-ins

### User Dashboard

- authenticated dashboard summarizing current user profile details
- current user department and role display
- quick access to current user's workspaces
- quick access to current user's RP applications, including invited-developer access

### Workspace Management

- create, edit, view, and delete workspaces
- view workspace details and department association
- manage workspace members
- role-specific workspace membership, including `workspace_admin`

### Application Information Intake

- create and edit structured application information records tied to a workspace
- collect detailed information across onboarding sections including:
  - application overview
  - technology stack and protocol
  - security and privacy posture
  - usage profile
  - migration and transition planning
- manage application contacts for each application information record

### RP Application Management

- create RP applications from workspace context
- edit RP application details
- delete RP applications
- link RP application creation to collected application information
- display application status and IBM Security Verify application identifier
- manage redirect URIs, client type, PKCE, company name, description, and application URL

### Client Credentials And Secret Rotation

- retrieve client credentials for a workspace RP application
- copy client ID and client secret from the UI
- regenerate a secret
- create named rotated secrets with expiry constraints
- delete rotated secrets
- support IBM-style rotation payloads

### Usage And Audit Visibility

- usage summary for an RP application by date
- audit trail browsing with pagination via search-after cursors
- date filtering with bounded date windows
- display of user, origin, result, IP version, and country context for usage events

### External Developer Invitation Flow

- workspace admins can invite an email address to a specific RP application
- invitation email delivery through GC Notify
- pending, expired, accepted, and revoked invitation states
- resend and reactivate flows for invitations
- invited developers can accept the invitation from a tokenized route
- invited developers can access only current-user RP application endpoints and screens
- invited developers can view and edit RP application details but do not gain workspace membership
- unknown OIDC users may be auto-created only when an active invitation exists for their email

### Platform Administration Modules

- users management, including create, edit, delete, search, department assignment, role assignment, and tier assignment
- roles CRUD
- policies CRUD
- departments CRUD
- tiers CRUD
- rate-limit APIs on tiers in the backend
- IBM Security Verify admin endpoints for users, applications, groups, entitlements, and audit queries

### Platform Reliability And Operations

- health and readiness endpoints
- shared error response envelope
- Casbin-backed permission guards
- Redis-backed infrastructure for sessions and caching
- ARQ task support
- test coverage across auth, policies, roles, users, departments, workspaces, sessions, exception handling, and invitation flow components

## 7. Target Users And Personas

### Persona 1: Platform Superuser / Internal Administrator

Owns global platform configuration and governance. Needs access to users, roles, policies, departments, tiers, rate limits, and IBM Security Verify administration features.

### Persona 2: Workspace Administrator

Owns one or more workspaces and the RP applications inside them. Needs to create and manage workspaces, add members, maintain application info, create RP applications, rotate secrets, review usage, and invite external developers.

### Persona 3: Workspace Member

Belongs to a workspace but is not necessarily an admin. Needs visibility into workspace resources depending on policy, but should not gain destructive management powers by default.

### Persona 4: Invited External Developer

Is not a workspace member. Needs narrow, application-scoped access to view and update the specific RP application they were invited to work on.

### Persona 5: Policy / Onboarding Reviewer

Needs structured metadata, contacts, security posture, privacy details, and migration context in order to review readiness and track onboarding completeness.

## 8. Core User Journeys

### Journey A: First-Time Internal User Setup

1. User signs in through OIDC.
2. System checks for an authenticated session.
3. If no department is set, user is redirected to the profile setup flow.
4. User selects a department.
5. User is redirected to the dashboard.

### Journey B: Workspace Administrator Creates And Manages A Workspace

1. Admin opens the workspaces module.
2. Admin creates a workspace with name, slug, and description.
3. Admin opens the workspace detail page.
4. Admin manages workspace members and permissions.
5. Admin creates or updates application information records.

### Journey C: Workspace Administrator Onboards An RP Application

1. Admin creates or updates an application information record.
2. Admin adds application contacts.
3. Admin creates an RP application from workspace context or from an application information record.
4. Admin reviews application settings and status.
5. Admin retrieves client credentials or performs secret rotation as needed.
6. Admin reviews usage and audit activity.

### Journey D: Workspace Administrator Invites An External Developer

1. Admin opens the developer invitations screen for an RP application.
2. Admin submits an email address.
3. System creates a scoped invitation and sends an email through GC Notify.
4. Admin can view invitation state and resend, reactivate, or revoke the invitation.

### Journey E: Invited Developer Accepts Invitation

1. Invitee signs in through OIDC using the invited email address.
2. Invitee opens the emailed invitation link with token.
3. System validates the token and accepts the invitation.
4. Invitee is redirected to the current-user RP application detail page.
5. Invitee can view and edit RP application fields only.

### Journey F: Platform Administrator Governs Access

1. Admin manages departments, roles, policies, and tiers.
2. Admin assigns user roles and departments.
3. Admin uses IBM Security Verify administration endpoints for application and group operations when needed.

## 9. Functional Requirements

### 9.1 Authentication And Access Control

1. The system must authenticate users through OIDC.
2. The system must maintain authenticated server-backed session state.
3. The system must redirect unauthenticated users to login when accessing protected routes.
4. The system must force first-time users without a department to complete department setup before accessing protected areas other than profile flows.
5. The system must support access-denied handling for blocked or uninvited users.
6. The system must enforce authorization through role and policy checks on backend routes.
7. The system must distinguish workspace-admin access from invited-developer access.

### 9.2 Dashboard

1. The dashboard must display the authenticated user's basic profile information.
2. The dashboard must display the current user's department and assigned roles.
3. The dashboard must list workspaces accessible to the current user.
4. The dashboard must list RP applications accessible to the current user, including invited-developer applications.

### 9.3 Workspace Management

1. Authorized users must be able to create, update, and delete workspaces.
2. Authorized users must be able to view workspace details.
3. Workspace admins must be able to manage workspace membership.
4. Workspace data must include a department association.

### 9.4 Application Information Management

1. Workspace admins must be able to create, view, update, and delete application information records.
2. Application information must capture onboarding-relevant fields across business, technical, security, usage, and migration sections.
3. Workspace admins must be able to create, edit, and delete application contacts tied to an application information record.
4. Application information should support downstream creation of RP application records.

### 9.5 RP Application Management

1. Workspace admins must be able to create, view, update, and delete RP applications within a workspace.
2. RP application records must support core settings including client type, PKCE, redirect URIs, application URL, description, and company name.
3. RP application detail pages must display status and the IBM Security Verify application identifier when available.
4. Invited developers must be able to view and update the application fields they are allowed to modify through current-user endpoints.

### 9.6 Credentials And Secret Rotation

1. Workspace admins must be able to retrieve client credentials for an RP application.
2. Workspace admins must be able to regenerate a client secret.
3. Workspace admins must be able to create named rotated secrets with expiry.
4. Workspace admins must be able to delete rotated secrets.
5. Secret rotation actions must align with the IBM Security Verify integration contract.

### 9.7 Usage Reporting

1. Workspace admins must be able to request usage summary metrics for an RP application on a selected date.
2. Workspace admins must be able to view audit trail events for an RP application.
3. The system must support loading additional audit events through cursor-based pagination.
4. The usage UI must validate date windows and prevent invalid queries.

### 9.8 External Developer Invitations

1. Workspace admins must be able to invite an email address to a specific RP application.
2. The system must send invitation emails through GC Notify.
3. Invitations must have explicit states including pending, accepted, revoked, and expired.
4. Workspace admins must be able to resend, reactivate, and revoke invitations.
5. The system must validate invitation acceptance using a token.
6. The system must allow auto-provisioning of unknown users only when a valid active invitation exists for their email.
7. Invited developers must not gain general workspace membership.
8. Invited developers must only access the invited RP application scope.

### 9.9 Platform Administration

1. Platform administrators must be able to manage users, including create, edit, delete, search, and assignment of department, tier, and roles.
2. Platform administrators must be able to manage roles.
3. Platform administrators must be able to manage policies.
4. Platform administrators must be able to manage departments.
5. Platform administrators must be able to manage tiers.
6. The backend must expose IBM Security Verify administration capabilities for users, applications, groups, entitlements, logins, and audit trail queries.

### 9.10 Health And Supportability

1. The backend must expose health and readiness endpoints.
2. The system must return errors using a consistent envelope.
3. The system should log and surface recoverable operational failures clearly enough for support and debugging.

## 10. Non-Functional Requirements

### Security

- all protected operations must require authenticated session state
- all privileged operations must be policy-guarded
- invited developer access must remain app-scoped
- uninvited unknown OIDC users must not receive a backend session
- sensitive credential operations must be limited to authorized workspace admins

### Privacy And Compliance

- application information intake must support collection of privacy and identity-assurance context
- audit and usage surfaces must minimize ambiguity about access activity
- personal and application data handling must align with Government of Canada expectations

### Reliability

- health and readiness endpoints must support deployment diagnostics
- backend errors must follow the shared error response shape
- invitation and identity flows must fail safely with explicit denial behavior

### Usability

- the UI must provide clear success and error notices for management actions
- onboarding flows must be explicit and understandable for first-time users
- admin CRUD surfaces should support filtering, pagination, and export where implemented

### Internationalization

- frontend should remain bilingual-ready through i18n-backed copy
- department and other labels should support language-aware rendering where data exists

### Maintainability

- backend should continue using centralized services, repositories, and exception contracts
- frontend should continue using feature-based organization, TanStack Router, and React Query

## 11. Data And Domain Model Summary

The product currently centers on these core entities:

- User
- Department
- Role
- Policy
- Tier
- Workspace
- Workspace Member
- Application Information
- Application Contact
- RP Application
- RP Application Developer Invitation
- Client Credentials / Rotated Secret
- Usage Summary / Usage Audit Event

These entities map cleanly to the product model:

- users belong to departments and may hold roles and tiers
- workspaces belong to departments and have members
- workspaces contain application information records and RP applications
- RP applications may be linked to structured application information
- invited developers are associated to RP applications through invitations rather than workspace membership

## 12. Integrations And External Dependencies

### Required External Systems

- OIDC identity provider for login
- IBM Security Verify admin APIs for application, user, group, and audit operations
- GC Notify for invitation email delivery
- PostgreSQL for persistent data
- Redis for sessions and caching

### Internal Platform Dependencies

- Casbin for authorization rules
- FastAPI, SQLAlchemy, Alembic, and Pydantic on the backend
- React, TanStack Router, TanStack Query, React Hook Form, Zod, and GCDS-based UI wrappers on the frontend

## 13. Success Metrics

The codebase does not currently define a formal KPI set, but the product should track these metrics.

### Onboarding Metrics

- number of workspaces created
- number of application information records created
- number of RP applications created
- time from workspace creation to RP application creation
- time from invitation sent to invitation accepted

### Adoption Metrics

- monthly active authenticated users
- monthly active workspace admins
- number of active invited external developers
- percentage of dashboard users with at least one workspace or RP application

### Quality Metrics

- invitation failure rate
- blocked sign-in rate for uninvited users
- credential rotation success rate
- usage query failure rate
- backend health and readiness uptime

### Governance Metrics

- percentage of RP applications with complete application information
- percentage of application information records with contacts assigned
- percentage of RP applications with recent secret rotation

## 14. Current Gaps And Product Risks

The current implementation reveals a few important product gaps and delivery risks.

### Gaps

1. Documentation lags the implemented product in at least some areas, especially the now-implemented workspace-admin invitation UI.
2. IBM Security Verify administration exists in the backend API surface, but there is no clearly surfaced dedicated frontend module in the primary route tree.
3. Approval workflow, review checkpoints, and onboarding state progression are not yet modeled as explicit product stages.
4. There is no visible end-user or admin analytics dashboard for aggregate platform trends beyond per-application usage views.
5. Invitee permissions are intentionally narrow, which is correct for v1, but the future collaboration model is not yet formalized.
6. The product appears to rely on internal policy knowledge for some governance decisions rather than explicit in-product guidance.

### Risks

1. Scope confusion between workspace membership and invited-developer application access may create support burden if not explained clearly in product copy.
2. Identity and invite acceptance flows are operationally sensitive and depend on matching OIDC email identity with active invitations.
3. Secret management UX must remain extremely clear to avoid accidental credential disruption.
4. The application information model is large; incomplete completion or poor UX could reduce data quality.
5. Backend-admin capabilities without equivalent frontend affordances may push teams back into ad hoc tooling.

## 15. Recommended Product Roadmap

### Phase 1: Stabilize Existing MVP

1. Align repository documentation with shipped invitation and application-management behavior.
2. Add explicit onboarding-state and completion indicators for application information and RP application readiness.
3. Improve in-product guidance around workspace roles versus invited-developer access.
4. Expand observability and reporting for invitation lifecycle and secret rotation activity.

### Phase 2: Complete Self-Service Onboarding

1. Introduce explicit workflow states such as draft, submitted, under review, approved, and launched.
2. Add review notes, operational checklists, and completion tracking for application information.
3. Add aggregate workspace and program-level dashboards.
4. Expose missing IBM Security Verify administration workflows in the UI where appropriate.

### Phase 3: Governance And Operations Maturity

1. Add approval and escalation workflow support.
2. Add stronger audit reporting, notifications, and exception monitoring.
3. Add bulk operations and better search across workspaces, applications, users, and invitations.
4. Add structured reporting exports for compliance and portfolio management.

## 16. Open Questions

1. Which user roles beyond `workspace_admin` and invited developer should have read-only or limited edit access within a workspace?
2. Should application information records become mandatory before RP application creation in all cases?
3. What is the desired long-term relationship between the portal and IBM Security Verify admin functionality: full UI abstraction or partial pass-through?
4. What approval and compliance steps must be modeled explicitly in product workflow rather than handled offline?
5. What metrics are most important for leadership, onboarding operations, and support teams?
6. Should invited developers eventually manage additional artifacts, such as contacts, usage exports, or secrets, or should they remain limited to application detail edits only?
7. What retention and audit requirements apply to invitations, usage events, and secret rotation history?

## 17. Recommended Immediate Next Requirements

Based on the repository state, the highest-value near-term product requirements are:

1. define explicit onboarding lifecycle states for workspaces, application information, and RP applications
2. add completion scoring or required-field indicators for application information
3. add a productized admin and reviewer experience for cross-workspace oversight
4. formalize user-role matrix and invited-developer permission boundaries in product copy and help content
5. add reporting for invitation conversion, secret rotation hygiene, and onboarding throughput

## 18. Summary

CanadaLogin Partner Portal already implements the foundation of a real partner onboarding and application management platform. The current product supports secure authentication, department-aware onboarding, workspace administration, structured application intake, RP application management, secrets and usage operations, and a narrow but effective external developer collaboration model. The next stage should focus on turning this strong operational base into a clearly guided, measurable, policy-aligned onboarding product with better workflow visibility, richer oversight, and tighter documentation.
