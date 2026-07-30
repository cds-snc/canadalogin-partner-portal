## Context

The repository currently ships authenticated onboarding, a current-user RP application landing page, owner-scoped RP application detail and credential flows, MAU reporting, generic error routing, platform administration routes, and structured error logging. It does not currently expose matching routed UI and live API coverage for the broader dashboard, workspace, application-information, and external-developer invitation behavior that had been copied from the PRD into current specs.

This change keeps that PRD scope visible without overstating it as current behavior.

This change should not be implemented as one broad monolith. Its implementation-ready outcome is either:

- PRD correction and archive with no code change, or
- a split into smaller follow-on implementation changes with clear route, API, data, and standards boundaries.

## Goals / Non-Goals

**Goals:**

- Keep current specs limited to code-backed behavior.
- Preserve the PRD-described dashboard, workspace, application-information, and invitation scope as active OpenSpec work.
- Make it clear which requirements still need implementation, tests, or a PRD correction decision.

**Non-Goals:**

- No implementation work in this cleanup change.
- No archive of this change until code or source-of-truth corrections exist.
- No attempt to infer hidden or unfinished behavior from stale frontend fetch helpers alone.

## Decisions

### Decision 1: Treat unverified PRD scope as proposed behavior

- Choice: move PRD-described behavior that is not evidenced in current code out of `openspec/specs/` and into this active change.
- Rationale: Level 2 still expects current specs to be accurate, so unverified behavior should not remain in current specs.

### Decision 2: Keep the gap visible by capability instead of deleting it

- Choice: retain the missing scope as deltas against the affected capabilities.
- Rationale: the user asked for cleanup, not loss of intent. An active change keeps the behavior visible and traceable.

### Decision 3: Separate shipped owner-scoped RP flows from broader workspace scope

- Choice: treat the currently shipped owner-scoped RP application flows as current behavior and keep broader workspace and invitation scope in this change.
- Rationale: current code strongly evidences owner-scoped RP flows, while workspace and invitation scope is not wired end-to-end in the present repository surface.

### Decision 4: Use this change as a planning gate, then split implementation work

- Choice: if the PRD scope remains intended behavior, create follow-on implementation changes instead of implementing directly from this change.
- Recommended follow-on split:
	- `restore-dashboard-summary-surface`
	- `restore-workspace-and-application-info-management`
	- `restore-external-developer-invitations`
- Rationale: dashboard parity, workspace/application-information restoration, and invitation restoration affect different route, API, data, IAM, and verification surfaces. A split keeps slices buildable and reviewable.

### Decision 5: Use the live OIDC registration form as the baseline content model for RP registration

- Choice: define any restored workspace-scoped RP-application create or edit workflow from the current CanadaLogin OIDC relying-party registration form rather than from a reduced generic app-create record.
- Baseline sections:
	- environment selection plus bilingual application names and environment URLs
	- OIDC service endpoints and logout configuration
	- client type, client authentication method, scopes, sector identifier, migration, and PKCE
	- signing, signature validation, encryption, and decryption capabilities, plus roadmap or risk follow-up when unsupported
- Rationale: the real onboarding surface is a structured questionnaire with conditional rules. Planning against a vague “core settings” model would lose required questions and make later readiness or validation work drift from the real registration process.

## OIDC registration question map

Use this section as the field-level design companion to the behavior-focused spec. The spec states what the portal must capture and enforce. This map records how the current questionnaire should translate into durable stored fields, follow-up conditions, and validation rules when the workspace-scoped RP registration flow is implemented.

### Storage split assumption

- `application_information` owns the cross-environment application or service identity and broader onboarding narrative.
- `rp_application_registration` owns one CanadaLogin environment-specific OIDC registration record.
- One real-world application may therefore have multiple linked registration records, such as `test`, `staging`, and `production`.
- The bilingual application names from the questionnaire should be treated as canonical application metadata on `application_information`, while each registration record may also keep a submitted snapshot of those names for auditability and resubmission fidelity.

### Basic information and endpoints

| Form question or control | Proposed stored field(s) | Scope or condition | Validation and notes |
|---|---|---|---|
| CanadaLogin environment | `rp_application_registration.canada_login_environment` | Required for every registration | Enum: `test`, `staging`, `production`. One registration record per selected environment. |
| Name of application or service (English) | `application_information.service_name_en`; optional snapshot `rp_application_registration.submitted_service_name_en` | Required for every registration | Non-empty public-facing label. Snapshot should preserve the submitted value for the environment-specific registration. |
| Name of application or service (French) | `application_information.service_name_fr`; optional snapshot `rp_application_registration.submitted_service_name_fr` | Required for every registration | Non-empty public-facing label with French parity. |
| Application environment URL (English) | `rp_application_registration.environment_base_url_en` | Required for every registration | Absolute HTTPS URL unless local-only planning explicitly says otherwise. |
| Application environment URL (French) | `rp_application_registration.environment_base_url_fr` | Required for every registration | Absolute HTTPS URL unless local-only planning explicitly says otherwise. |
| Redirect URL(s) | `rp_application_registration.redirect_uris` | Required for every registration | Non-empty URI array. Normalize as ordered list of unique HTTPS redirect URIs. |
| Post logout redirect URL(s) | `rp_application_registration.post_logout_redirect_uris` | Optional unless logout pattern requires them | URI array. Preserve order if downstream submission fidelity matters. |
| Logout delivery mode | `rp_application_registration.logout_mode` | Required when logout is configured | Enum: `back_channel`, `front_channel`. `front_channel` allowed only for `canada.ca` domain applications. |
| Logout request URL | `rp_application_registration.logout_uri` | Required when logout mode is selected | Absolute URL. Required for both logout modes unless later CanadaLogin guidance narrows that rule. |

### Core OIDC configuration

| Form question or control | Proposed stored field(s) | Scope or condition | Validation and notes |
|---|---|---|---|
| Client type | `rp_application_registration.client_type` | Required for every registration | Enum: `confidential`, `public`. Drives PKCE requirement. |
| Authorization Code Flow support | `rp_application_registration.supports_authorization_code_flow` | Required for every registration | Must be `true`. Any `false` state fails submission because this is the only supported flow. |
| Client authentication method | `rp_application_registration.client_auth_method` | Required for every registration | Enum: `private_key_jwt`, `client_secret_basic`, `client_secret_post`. |
| Private key distribution method | `rp_application_registration.private_key_distribution_method` | Required when `client_auth_method = private_key_jwt` | Enum: `jwks_uri`, `offline_exchange`, `not_available`. |
| JWKS URI | `rp_application_registration.jwks_uri` | Required when `private_key_distribution_method = jwks_uri` | Absolute HTTPS URL. |
| Offline certificate or JWK exchange payload | `rp_application_registration.offline_jwk_or_certificate` | Required when `private_key_distribution_method = offline_exchange` | Store as protected structured payload or document reference, not as casual free text in logs. |
| No certificate available | `rp_application_registration.private_key_not_available` | Applies when `private_key_distribution_method = not_available` | Should block or flag submit-ready status unless product explicitly supports incomplete draft capture. |
| Requested scopes | `rp_application_registration.requested_scopes` | Required for every registration | Array enum including `openid`, `profile`, `email`, `phone`, `language`. `openid` must always be present. |
| Sector identifier | `rp_application_registration.sector_identifier` | Required for every registration | Usually the environment domain base URL or configured sector identifier string. |
| Need to share pairwise identifiers with another application | `rp_application_registration.shares_pairwise_identifiers` | Required for every registration | Boolean. If `true`, sector identifier must match the shared-identifier cohort. |
| Migration sector identifier URL | `rp_application_registration.migration_sector_identifier_url` | Optional, only for migration-enabled partners | Absolute HTTPS URL hosting the sector-identifier JSON document. |
| PKCE supported | `rp_application_registration.pkce_supported` | Required for every registration | Must be `true` for `public` clients. `false` is allowed only when accepted as a tracked risk for other client types. |
| PKCE algorithms | `rp_application_registration.pkce_algorithms` | Required when `pkce_supported = true` | Array enum including `S256` and optional `other`. |
| PKCE other algorithm | `rp_application_registration.pkce_other_algorithm` | Required when `pkce_algorithms` includes `other` | Free-text algorithm name. Current questionnaire indicates unsupported values should remain visible but not silently accepted as supported. |

### Message signing and signature validation

| Form question or control | Proposed stored field(s) | Scope or condition | Validation and notes |
|---|---|---|---|
| RP message signing supported | `rp_application_registration.request_signing_supported` | Required for every registration | Boolean. |
| Signed RP message types | `rp_application_registration.request_signing_targets` | Required when `request_signing_supported = true` | Array enum: `request_object`, `token_endpoint`. At least one selection required when support is `true`. |
| RP signing algorithms | `rp_application_registration.request_signing_algorithms` | Required when `request_signing_supported = true` | Array enum: `RS256`, `RS384`, `RS512`, `PS256`, `PS384`, `PS512`, `ES256`, `ES384`, `ES512`, `other`. |
| RP signing other algorithm | `rp_application_registration.request_signing_other_algorithm` | Required when `request_signing_algorithms` includes `other` | Free-text algorithm name. |
| RP signing roadmap status | `rp_application_registration.request_signing_roadmap_status` | Required when `request_signing_supported = false` | Enum: `planned`, `not_planned`. |
| RP signing revisit date | `rp_application_registration.request_signing_revisit_on` | Required when roadmap status is `planned` | Date or month precision, depending on product decision. |
| RP signing risk follow-up note | `rp_application_registration.request_signing_risk_note` | Required when roadmap status is `not_planned` or when risk tracking needs explicit text | Keep concise and audit-safe. |
| CanadaLogin signature validation supported | `rp_application_registration.signature_validation_supported` | Required for every registration | Boolean. |
| Signature validation targets | `rp_application_registration.signature_validation_targets` | Required when `signature_validation_supported = true` | Array enum: `id_token`, `userinfo`. |
| Signature validation algorithms | `rp_application_registration.signature_validation_algorithms` | Required when `signature_validation_supported = true` | Same enum set as signing algorithms. |
| Signature validation other algorithm | `rp_application_registration.signature_validation_other_algorithm` | Required when algorithms include `other` | Free-text algorithm name. |
| Signature validation roadmap status | `rp_application_registration.signature_validation_roadmap_status` | Required when `signature_validation_supported = false` | Enum: `planned`, `not_planned`. |
| Signature validation revisit date | `rp_application_registration.signature_validation_revisit_on` | Required when roadmap status is `planned` | Date or month precision. |
| Signature validation risk follow-up note | `rp_application_registration.signature_validation_risk_note` | Required when roadmap status is `not_planned` or when explicit risk text is needed | Keep concise and audit-safe. |

### Encryption and decryption

| Form question or control | Proposed stored field(s) | Scope or condition | Validation and notes |
|---|---|---|---|
| RP message encryption supported | `rp_application_registration.request_encryption_supported` | Required for every registration | Boolean. |
| Encrypted RP message types | `rp_application_registration.request_encryption_targets` | Required when `request_encryption_supported = true` | Array enum: `request_object`. |
| Request-encryption key management algorithms | `rp_application_registration.request_encryption_key_management_algorithms` | Required when `request_encryption_supported = true` | Array enum: `RSA-OAEP-256`, `RSA-OAEP`, `other`. |
| Request-encryption other key management algorithm | `rp_application_registration.request_encryption_other_key_management_algorithm` | Required when key-management algorithms include `other` | Free-text algorithm name. |
| Request-encryption content algorithms | `rp_application_registration.request_encryption_content_algorithms` | Required when `request_encryption_supported = true` | Array enum: `A128GCM`, `A192GCM`, `A256GCM`, `other`. |
| Request-encryption other content algorithm | `rp_application_registration.request_encryption_other_content_algorithm` | Required when content algorithms include `other` | Free-text algorithm name. |
| Request-encryption roadmap status | `rp_application_registration.request_encryption_roadmap_status` | Required when `request_encryption_supported = false` | Enum: `planned`, `not_planned`. |
| Request-encryption revisit date | `rp_application_registration.request_encryption_revisit_on` | Required when roadmap status is `planned` | Date or month precision. |
| Request-encryption risk follow-up note | `rp_application_registration.request_encryption_risk_note` | Required when roadmap status is `not_planned` or when explicit risk text is needed | Keep concise and audit-safe. |
| CanadaLogin message decryption supported | `rp_application_registration.message_decryption_supported` | Required for every registration | Boolean. |
| Decryption targets | `rp_application_registration.message_decryption_targets` | Required when `message_decryption_supported = true` | Array enum: `token_endpoint_response`, `id_token`, `userinfo`. |
| Message-decryption key management algorithms | `rp_application_registration.message_decryption_key_management_algorithms` | Required when `message_decryption_supported = true` | Array enum: `RSA-OAEP-256`, `RSA-OAEP`, `other`. |
| Message-decryption other key management algorithm | `rp_application_registration.message_decryption_other_key_management_algorithm` | Required when key-management algorithms include `other` | Free-text algorithm name. |
| Message-decryption content algorithms | `rp_application_registration.message_decryption_content_algorithms` | Required when `message_decryption_supported = true` | Array enum: `A128GCM`, `A192GCM`, `A256GCM`, `other`. |
| Message-decryption other content algorithm | `rp_application_registration.message_decryption_other_content_algorithm` | Required when content algorithms include `other` | Free-text algorithm name. |
| Message-decryption roadmap status | `rp_application_registration.message_decryption_roadmap_status` | Required when `message_decryption_supported = false` | Enum: `planned`, `not_planned`. |
| Message-decryption revisit date | `rp_application_registration.message_decryption_revisit_on` | Required when roadmap status is `planned` | Date or month precision. |
| Message-decryption risk follow-up note | `rp_application_registration.message_decryption_risk_note` | Required when roadmap status is `not_planned` or when explicit risk text is needed | Keep concise and audit-safe. |

### Cross-field rules to preserve from the questionnaire

- `supports_authorization_code_flow` must remain `true` for submit-ready registrations.
- `requested_scopes` must always include `openid`.
- `pkce_supported` must be `true` when `client_type = public`.
- `logout_mode = front_channel` is valid only when the registered application domain is under `canada.ca`.
- Any `other` algorithm selection requires a companion free-text algorithm field.
- Any capability marked unsupported must capture the roadmap or risk follow-up branch defined by the questionnaire.
- Submitted registration snapshots should preserve the exact answers sent for a specific environment even when canonical application metadata later changes.

## Standards impact

```yaml
standards_impact:
	ui:
		applies: true
		decision: Any restored dashboard or workspace UI should use STD-005, STD-006, PAT-021, PAT-017, and PAT-023 instead of ad hoc cards or mixed-purpose pages.
		evidence: Follow-on changes must record a page-pattern decision and route plan before implementation.
		exceptions: []
	accessibility:
		applies: true
		decision: Restored dashboard, workspace, and invitation pages must define keyboard, focus, heading, table, and feedback-state expectations before coding.
		evidence: Follow-on frontend tests and review fixtures.
		exceptions: []
	official_languages:
		applies: true
		decision: Restored user-facing pages and invitation copy must ship with English and French parity.
		evidence: Locale updates and route parity checks in follow-on changes.
		exceptions: []
	security_privacy:
		applies: true
		decision: Invitation and workspace restore work must keep safe errors, scoped access, and protected data handling visible.
		evidence: Follow-on authorization and failure-path tests.
		exceptions: []
	identity_access:
		applies: true
		decision: Invitation acceptance, auto-provisioning, and invited-developer scope must be reviewed against existing OIDC and RBAC behavior before implementation.
		evidence: Follow-on IAM-focused design and test tasks.
		exceptions: []
	information_management:
		applies: true
		decision: Restored application-information and invitation records must use explicit ownership, audit, and lifecycle expectations per STD-020 and PAT-012.
		evidence: Follow-on schema and migration review notes.
		exceptions: []
	verification:
		applies: true
		decision: This planning change validates the split and standards path; follow-on changes own executable verification.
		evidence: OpenSpec validation for this change and for each follow-on change.
		exceptions: []
	gc_web_application_baseline:
		applies: true
		decision: Any follow-on UI/API restoration should treat the work as a meaningful GC web application change.
		evidence: Baseline applicability captured in each follow-on change.
		exceptions: []
```

## Patterns to follow if implementation proceeds

- PAT-021 for any restored dashboard or authenticated overview page.
- PAT-017 for read-only workspace, application-information, and invitation detail summaries.
- PAT-023 for any queue, report, or tabular workspace or invitation views.
- PAT-012 for restored persistence and migration work.

## Slice Plan

### Slice 1: Source-of-truth resolution

- Outcome: the team agrees whether missing PRD scope should be reimplemented or removed from the PRD.
- Impacted areas: PRD wording, OpenSpec expectations, implementation backlog.
- Exit condition: current code remains the source of truth for current specs, and either PRD corrections or follow-on change IDs are chosen.

### Slice 2: Dashboard summary parity

- Outcome: authenticated users see dashboard-level profile and workspace summaries in addition to current-user RP applications.
- Impacted areas: frontend dashboard route and page, current-user summary APIs, tests.
- Notes: if implemented, use PAT-021 for the overview page and avoid turning it into a mixed workspace-admin surface.

### Slice 3: Workspace and application-information management

- Outcome: workspace CRUD, membership management, application-information intake, and workspace-scoped RP application operations are backed by live API routes and UI.
- Impacted areas: backend routes and persistence, frontend routes and pages, tests.
- Notes: use STD-009, STD-010, STD-020, and PAT-012 for API and persistence work, and use the live OIDC registration form as the baseline field and validation model for workspace-scoped RP application registration.

### Slice 4: External developer invitations and scoped access

- Outcome: invitation lifecycle, acceptance flow, and invited-developer RP-application scope are fully implemented and verified.
- Impacted areas: GC Notify integration, invitation persistence and API, frontend invitation routes, access-control tests.
- Notes: keep invited-developer scope narrow and visible; route IAM review through existing OIDC and authorization boundaries.

## Implementation readiness

- This change is not a direct implementation package.
- Ready when: Slice 1 completes and the team chooses either PRD correction or follow-on implementation changes.
- If implementation proceeds, recommended split order:
	1. `restore-dashboard-summary-surface`
	2. `restore-workspace-and-application-info-management`
	3. `restore-external-developer-invitations`
- Blockers:
	- the PRD and current code still diverge on whether these behaviors are already shipped or still future work
	- workspace, application-information, and invitation code surfaces are not currently wired end to end in the repository

## Open Questions

- Human decision required only if the default code-first current-spec assumption is rejected.
- Human decision required only if the recommended split into dashboard, workspace/application-information, and invitation follow-on changes is rejected.