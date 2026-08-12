# Delta for workspace task hub, Access, and RP registration flow

## MODIFIED Requirements

### Requirement: Workspace-scoped RP application registration follows the current OIDC questionnaire
When an authorized partner editor creates or updates a workspace-scoped RP application draft for OpenID Connect, the portal SHALL capture and validate the current CanadaLogin relying-party registration questionnaire for one RP application environment at a time.

The questionnaire SHALL expose the following field catalog for the selected RP application environment. The server MAY persist incomplete answers as draft data without treating the affected step or registration as valid. Completing a step SHALL validate every active field and constraint owned by that step and all prerequisite steps. Final submission SHALL validate the complete active questionnaire and all cross-step constraints before transitioning the RP application from `draft` to `submitted`.

#### Field group: Environment and RP application basic information

| Form question | Control type | Required | Allowed values or expected input |
|---|---|---|---|
| `Please select the CanadaLogin environment you are requesting access to` | Single-select | Yes | `test` (`Test` - integration testing), `staging` (`Staging` - compliance testing), `production` (`Production` - go-live ready) |
| `Name of your application / service (English)` | Text input | Yes | Public-facing English RP application name |
| `Name of your application / service (French)` | Text input | Yes | Public-facing French RP application name |
| `Application environment URL (English)` | URL input | Yes | Base URL for the English environment |
| `Application environment URL (French)` | URL input | Yes | Base URL for the French environment |
| `Redirect URL(s)` | Repeatable URL list | Yes | One or more redirect URLs |
| `Post Logout Redirect URL(s)` | Repeatable URL list | No | Zero or more post-logout redirect URLs |
| `Please select how you would like to receive a logout request` | Single-select | Yes | `back_channel` (`Back-channel logout (Preferred)`), `front_channel` (`Front-channel logout`); `front_channel` is valid only for RP applications under `canada.ca` |
| `Logout request URL` | URL input | Yes when a logout mode is selected | Logout endpoint URL for the selected RP application environment |

#### Field group: Client, scopes, sector identifier, and PKCE

| Form question | Control type | Required | Allowed values or expected input |
|---|---|---|---|
| `Please select one of the following` for client type | Single-select | Yes | `confidential` (`Confidential Client`), `public` (`Public Client`) |
| `My application can support the Authorization Code Flow` | Affirmation checkbox | Yes | Must be recorded as selected; no alternative supported response flow is valid |
| `Please select a method` for client authentication | Single-select | Yes | `private_key_jwt`, `client_secret_basic`, `client_secret_post` |
| `Public key cryptography will be used and the certificate information for your application will be shared via:` | Single-select | Yes when client authentication method is `private_key_jwt` | `jwks_uri`, `offline_exchange`, `not_available` (`I don't have a certificate`) |
| `Please provide the URI` | URL input | Yes when key-sharing method is `jwks_uri` | JWKS URI |
| `Please provide the certificate / JSON Web Key` | Text or document-backed input | Yes when key-sharing method is `offline_exchange` | Public certificate or public JWK payload only; private-key parameters or other secret key material are forbidden |
| `Please select all scopes that you authorized to collect about your user` | Multi-select checkbox group | Yes | `openid`, `profile`, `email`, `phone`, `language`; `openid` is mandatory |
| `Please provide your application's Sector_Identifier` | Text input | Yes | Sector identifier string or base URL |
| `Do you need to share user pairwise identifiers with another application` | Single-select | Yes | `yes`, `no` |
| `To enable the migration solution, provide your Sector Identifier URL` | URL input | No | Migration sector-identifier URL; available only for migration-enabled partners |
| `Does your application support PKCE` | Single-select | Yes | `yes`, `no` |
| `If yes, please select all supported hashing algorithms for PKCE` | Multi-select checkbox group | Yes when PKCE support is `yes` | `S256`, `other` |
| `If Other: Please provide the algorithm` for PKCE | Text input | Yes when PKCE algorithms include `other` | Free-text PKCE algorithm name |

#### Field group: RP message signing and CanadaLogin signature validation

| Form question | Control type | Required | Allowed values or expected input |
|---|---|---|---|
| `Does your application support signing messages it sends to CanadaLogin` | Single-select | Yes | `yes`, `no` |
| `If yes, for which messages do you support message signing` | Multi-select checkbox group | Yes when RP message signing support is `yes` | `request_object` (`Request Object`), `token_endpoint` (`Token Endpoint`) |
| `Please select all supported signature algorithms` for RP message signing | Multi-select checkbox group | Yes when RP message signing support is `yes` | `RS256`, `RS384`, `RS512`, `PS256`, `PS384`, `PS512`, `ES256`, `ES384`, `ES512`, `other` |
| `If Other: Please provide the algorithm` for RP message signing | Text input | Yes when RP signing algorithms include `other` | Free-text signing algorithm name |
| `If no, is message signing in your product roadmap` | Single-select | Yes when RP message signing support is `no` | `yes`, `no` |
| `Can you provide an approximate date to revisit this configuration item` for RP message signing | Date or month input | Yes when RP signing roadmap answer is `yes` | Approximate revisit date |
| `Does your application support verifying signatures sent from CanadaLogin` | Single-select | Yes | `yes`, `no` |
| `If yes, for which items/messages do you support message signing` for CanadaLogin signature validation | Multi-select checkbox group | Yes when CanadaLogin signature validation support is `yes` | `id_token` (`ID Token`), `userinfo` (`Userinfo Endpoint`) |
| `Please select all supported signature algorithms` for CanadaLogin signature validation | Multi-select checkbox group | Yes when CanadaLogin signature validation support is `yes` | `RS256`, `RS384`, `RS512`, `PS256`, `PS384`, `PS512`, `ES256`, `ES384`, `ES512`, `other` |
| `If Other: Please provide the algorithm` for CanadaLogin signature validation | Text input | Yes when signature-validation algorithms include `other` | Free-text validation algorithm name |
| `If no, is signature validation in your product roadmap` | Single-select | Yes when CanadaLogin signature validation support is `no` | `yes`, `no` |
| `Can you provide an approximate date to revisit this configuration item` for CanadaLogin signature validation | Date or month input | Yes when signature-validation roadmap answer is `yes` | Approximate revisit date |

#### Field group: RP message encryption and CanadaLogin message decryption

| Form question | Control type | Required | Allowed values or expected input |
|---|---|---|---|
| `Does your application support the encryption of requests it sends to CanadaLogin` | Single-select | Yes | `yes`, `no` |
| `If yes, for which messages do you support encryption` | Multi-select checkbox group | Yes when RP request encryption support is `yes` | `request_object` (`Request Object`) |
| `Please select all supported key management algorithms supported` for RP request encryption | Multi-select checkbox group | Yes when RP request encryption support is `yes` | `RSA-OAEP-256`, `RSA-OAEP`, `other` |
| `If Other: Please provide the key management algorithm` for RP request encryption | Text input | Yes when request-encryption key-management algorithms include `other` | Free-text key-management algorithm name |
| `Please select all encryption algorithms supported` for RP request encryption | Multi-select checkbox group | Yes when RP request encryption support is `yes` | `A128GCM`, `A192GCM`, `A256GCM`, `other` |
| `If Other: Please provide the encryption algorithm` for RP request encryption | Text input | Yes when request-encryption algorithms include `other` | Free-text encryption algorithm name |
| `If no, is message encryption in your product roadmap` | Single-select | Yes when RP request encryption support is `no` | `yes`, `no` |
| `Can you provide an approximate date to revisit this configuration item` for RP request encryption | Date or month input | Yes when request-encryption roadmap answer is `yes` | Approximate revisit date |
| `Does your application support the decryption of messages sent from CanadaLogin` | Single-select | Yes | `yes`, `no` |
| `If yes, for which items/messages do you support message signing` for CanadaLogin message decryption | Multi-select checkbox group | Yes when CanadaLogin message decryption support is `yes` | `token_endpoint_response` (`Token Endpoint Response`), `id_token` (`ID Token`), `userinfo` (`Userinfo Endpoint`) |
| `Please select all supported key management algorithms supported` for CanadaLogin message decryption | Multi-select checkbox group | Yes when CanadaLogin message decryption support is `yes` | `RSA-OAEP-256`, `RSA-OAEP`, `other` |
| `If Other: Please provide the key management algorithm` for CanadaLogin message decryption | Text input | Yes when message-decryption key-management algorithms include `other` | Free-text key-management algorithm name |
| `Please select all encryption algorithms supported` for CanadaLogin message decryption | Multi-select checkbox group | Yes when CanadaLogin message decryption support is `yes` | `A128GCM`, `A192GCM`, `A256GCM`, `other` |
| `If Other: Please provide the encryption algorithm` for CanadaLogin message decryption | Text input | Yes when message-decryption algorithms include `other` | Free-text encryption algorithm name |
| `If no, is message decryption in your product roadmap` | Single-select | Yes when CanadaLogin message decryption support is `no` | `yes`, `no` |
| `Can you provide an approximate date to revisit this configuration item` for CanadaLogin message decryption | Date or month input | Yes when message-decryption roadmap answer is `yes` | Approximate revisit date |

#### Scenario: Workspace admin captures RP application basic information and endpoints
- **WHEN** a workspace admin starts or edits a workspace-scoped OIDC RP application registration
- **THEN** the portal captures the target CanadaLogin environment (`test`, `staging`, or `production`), RP application names in English and French, RP application environment URLs in English and French, redirect URLs, post-logout redirect URLs, logout delivery mode (`back_channel` or `front_channel`), and logout request URL

#### Scenario: Workspace admin captures client, scope, sector-identifier, and PKCE configuration
- **WHEN** a workspace admin completes the core OIDC configuration questions
- **THEN** the portal captures Authorization Code Flow as the supported response flow, client type, client authentication method such as `private_key_jwt`, `client_secret_basic`, or `client_secret_post`, any dependent JWKS URI or offline key or certificate exchange details, requested scopes with required `openid`, sector identifier choice, pairwise-identifier sharing intent, optional migration sector-identifier URL, PKCE support, and supported PKCE algorithms

#### Scenario: Workspace admin captures message-protection capabilities
- **WHEN** a workspace admin completes the digital-signature, signature-validation, encryption, and decryption sections of the questionnaire
- **THEN** the portal captures supported RP message-signing options for request objects and token-endpoint requests, CanadaLogin signature-validation options for ID tokens and Userinfo responses, RP request-encryption options, and CanadaLogin message-decryption options for token-endpoint responses, ID tokens, and Userinfo responses, together with the applicable signature, key-management, and encryption algorithms

#### Scenario: Registration enforces current questionnaire constraints
- **WHEN** an authorized partner editor completes a step or finally submits workspace-scoped OIDC registration data
- **THEN** the portal enforces every current questionnaire constraint whose controlling fields are part of that step or an earlier completed step
- **AND** final submission requires a selected CanadaLogin environment, requires `openid` in the requested scopes, requires PKCE for `public` clients, keeps Authorization Code Flow as the supported response flow, and restricts front-channel logout to `canada.ca` domains

#### Scenario: Incomplete draft persistence does not create a valid submission
- **WHEN** an authorized partner editor uses Save and exit or another safe draft-persistence action before every active field and step is valid
- **THEN** the portal may retain the incomplete answers in the server-backed draft and identifies the affected step as incomplete
- **AND** it does not mark that step complete, expose Review as valid, transition onboarding state, or treat the draft as submitted

#### Scenario: Conditional follow-up answers are required for dependent selections
- **WHEN** a workspace admin selects `private_key_jwt`, an `Other` algorithm, or an unsupported signing, validation, encryption, or decryption capability answer
- **THEN** the portal requires the matching key-distribution detail, free-text algorithm field, roadmap yes or no answer, and the approximate revisit date when the roadmap answer is `yes` before the affected step can be marked complete or the RP application can be finally submitted
- **AND** incomplete draft persistence may retain the partial answer without presenting it as valid

#### Scenario: Offline key exchange rejects private key material

- **WHEN** a user supplies offline certificate or JWK content for `private_key_jwt`
- **THEN** the portal accepts only the public certificate or public JWK members required for registration
- **AND** it rejects private-key parameters, symmetric key values, credentials, or other secret key material before persistence
- **AND** a future requirement to collect private key material requires a separately approved secret-lifecycle and storage contract

#### Scenario: Missing security capabilities capture roadmap or risk follow-up
- **WHEN** a workspace admin answers `No` to message signing, signature validation, message encryption, or message decryption support
- **THEN** the portal captures whether the capability is on the product roadmap and, when applicable, an approximate revisit date; selecting roadmap `no` records the negative answer without requiring an extra free-text note

## ADDED Requirements

### Requirement: Workspace entry pages provide a scoped task hierarchy

The portal SHALL use `/workspaces` as the authorized workspace chooser and
`/workspaces/$workspaceUuid` as a task-oriented entry page for the selected
workspace. The selected workspace page SHALL link to focused child routes and
SHALL NOT embed the child areas' full tables, forms, reports, or access controls.

#### Scenario: User selects an authorized workspace

- **WHEN** an authenticated user opens `/workspaces`
- **THEN** the page lists only workspaces available through the canonical authorization context
- **AND** each workspace link uses the workspace name as its primary label
- **AND** selecting a workspace opens `/workspaces/$workspaceUuid`

#### Scenario: User opens the workspace task hub

- **WHEN** an authorized user opens `/workspaces/$workspaceUuid`
- **THEN** the page identifies the selected workspace by name in one H1 or equivalent page-heading context
- **AND** it presents only the available Overview, Application information, RP applications, Access, Reports, and Settings task destinations
- **AND** each destination links to a focused child route

#### Scenario: Workspace hub stays focused on task selection

- **WHEN** an authorized user opens `/workspaces/$workspaceUuid`
- **THEN** the page may show concise sourced workspace status or context
- **AND** it does not embed full application tables, Access management, reports, settings forms, or audit results

#### Scenario: Workspace children preserve parent navigation

- **WHEN** an authorized user opens a workspace child route
- **THEN** translated workspace side navigation identifies the active child area
- **AND** breadcrumbs identify Home, Workspaces, the workspace name, and the current child when applicable
- **AND** the user can return to `/workspaces/$workspaceUuid` without relying on browser history

#### Scenario: Raw workspace identifiers are not primary UI labels

- **WHEN** workspace context appears in a heading, breadcrumb, side navigation, account context, link, status summary, or confirmation
- **THEN** the portal uses the authorized workspace name or a neutral localized fallback as the primary label
- **AND** it does not present the raw workspace UUID as a friendly workspace name

#### Scenario: Workspace task visibility does not replace authorization

- **WHEN** the canonical context does not expose a workspace task to the user
- **THEN** the hub and side navigation omit that task label
- **AND** direct requests continue through route and backend authorization for the selected workspace and object

#### Scenario: Workspace pages use server-scoped resources

- **WHEN** the chooser, hub, or a workspace child requests workspace data
- **THEN** the backend applies the current session, canonical capability, selected workspace, and object scope before returning the resource
- **AND** the browser does not receive a wider cross-workspace dataset and reduce it through client-side filtering
- **AND** stale browser session or authorization state does not grant route or API access

### Requirement: Workspace Access replaces the legacy Members destination

The portal SHALL use `/workspaces/$workspaceUuid/access` as the canonical
user-facing workspace destination for role assignments and invitation
management made available by the canonical authorization model.

#### Scenario: Authorized user opens workspace Access

- **WHEN** an authorized user chooses Access from a workspace hub or side navigation
- **THEN** the portal opens `/workspaces/$workspaceUuid/access`
- **AND** the page presents only the assignment and invitation information or actions permitted for that user in the selected workspace
- **AND** the visible title and navigation label use `Access` rather than the retired `Members` concept

#### Scenario: Legacy Members link redirects to Access safely

- **WHEN** a user requests `/workspaces/$workspaceUuid/members`
- **AND** the requested workspace and current user pass the normal route-entry checks
- **THEN** the portal redirects to `/workspaces/$workspaceUuid/access`
- **AND** the redirect does not grant or preserve authority beyond the canonical assignment and invitation model

#### Scenario: Unauthorized Access remains hidden and denied

- **WHEN** the canonical authorization context does not permit the user to view or manage workspace Access
- **THEN** the workspace hub and side navigation omit the Access destination
- **AND** a direct request fails through the standard safe authorization behavior without revealing assignment or invitation data

#### Scenario: Access data stays on safe surfaces

- **WHEN** the Access page reads or changes assignment or invitation data
- **THEN** the portal exposes only the minimum permitted user and lifecycle fields for the selected workspace
- **AND** it does not place email addresses, invitation tokens, assignment payloads, or authorization context in route parameters, analytics, diagnostic body logs, or real-data fixtures
- **AND** audit metadata for a consequential access action excludes invitation secrets and unnecessary personal information

### Requirement: Workspace RP application registration uses a recoverable multi-step flow

The portal SHALL implement the existing workspace-scoped OIDC registration
questionnaire as a PAT-019 route-per-step flow backed by an authorized
server-side RP application in `draft`. Intermediate persistence SHALL update
only that draft, SHALL distinguish incomplete saved data from a completed step,
and SHALL NOT perform final submission. Only the explicit final submit action
from a completely valid Review state SHALL transition `draft` to `submitted`.

The Edit compatibility route SHALL use this lifecycle matrix:

| Current state | Edit behavior | Mutation behavior |
|---|---|---|
| `draft` | Resume the last safely completed or earliest incomplete step | Permit authorized, conflict-protected draft writes |
| `submitted` or `under_review` | Return to detail with a localized locked-for-review explanation | No draft or registration mutation |
| `approved` or `launched` | Return to detail with a localized non-editable explanation | No draft or registration mutation |
| Missing, unknown, stale, or out-of-scope | Fail closed through the safe detail, not-found, or denied behavior | No mutation |

#### Scenario: User starts a registration draft

- **WHEN** an authorized user starts registration from `/workspaces/$workspaceUuid/applications/new`
- **THEN** the portal opens the new-registration Basics step without inventing an RP application UUID or placeholder record
- **AND** successful Basics validation creates one server-backed RP application in `draft` with the selected environment and English/French application names
- **AND** the create request uses one opaque idempotency key for that new-flow attempt
- **AND** the created representation uses draft version `1`, records `basics` as the last completed step, and exposes the opaque workspace and RP application UUIDs
- **AND** the portal uses that representation to open the canonical `registration/endpoints` route
- **AND** refresh or later return can resume the last safely completed step after the draft exists

#### Scenario: Retried draft creation does not create a duplicate

- **WHEN** a valid Basics create request is retried with the same idempotency key, actor, workspace, and normalized Basics payload after an ambiguous network result
- **THEN** the backend returns the same RP application draft rather than creating another record
- **AND** it does not increment, reset, or otherwise change the current draft version or completed-step marker merely because the create request was retried
- **AND** reusing that key with different input or scope fails with safe `409` code `registration_draft_creation_conflict`
- **AND** the key contains no personal or questionnaire data and conveys no authorization

#### Scenario: Invalid Basics does not create a placeholder draft

- **WHEN** a user selects Continue on `/workspaces/$workspaceUuid/applications/new` without valid minimum Basics identity
- **THEN** the page remains on the new-registration Basics step and displays an error summary plus field-level errors
- **AND** the backend creates no RP application row, UUID, placeholder name, or onboarding transition
- **AND** the portal warns before navigation can discard unsaved input

#### Scenario: Valid Basics can establish a draft before exit

- **WHEN** a user selects Save and exit on the new-registration Basics step with the minimum valid environment and bilingual application names
- **THEN** the backend creates one server-backed RP application in `draft` and returns its UUID and draft version
- **AND** the portal returns to the RP application detail or workspace applications list with a clear resume path
- **AND** if minimum Basics is invalid, the page remains with errors and does not promise durable recovery

#### Scenario: User resumes an existing draft from Edit

- **WHEN** an authorized user opens `/workspaces/$workspaceUuid/applications/$rpApplicationUuid/edit` for an RP application still in draft
- **THEN** the portal resumes the existing registration draft at its last safely completed or earliest incomplete canonical step
- **AND** the compatibility entry does not render the retired long single-page questionnaire

#### Scenario: Draft API exposes a typed public-identifier boundary

- **WHEN** an authorized editor creates, reads, resumes, or updates a registration draft
- **THEN** the API response exposes the public workspace UUID, public RP application UUID, onboarding state, draft version, last completed step, and typed authorized registration answers
- **AND** it does not expose internal integer database IDs, repository models, untyped persistence payloads, policy internals, secret key material, or fields outside the caller's authorized configuration scope

#### Scenario: Migrated draft resumes from validated contiguous progress

- **WHEN** an existing draft predates registration flow metadata and has no stored completed-step marker
- **THEN** the backend validates its stored answers in the recorded step order and derives only the last contiguous completed step
- **AND** non-contiguous later answers do not unlock a future step or Review
- **AND** missing or invalid data resumes at the earliest incomplete permitted step

#### Scenario: Non-draft registrations are not editable through this flow

- **WHEN** an authorized user requests the Edit compatibility route for a registration in `submitted`, `under_review`, `approved`, or `launched`
- **THEN** the portal returns to the RP application detail with the state-appropriate safe explanation
- **AND** it does not create or mutate a draft, revision, or effective registration
- **AND** an amendment or revision workflow is not inferred from the forward-only onboarding states

#### Scenario: Unknown or stale lifecycle state fails closed

- **WHEN** flow entry or a write observes a missing, unknown, stale, or changed lifecycle state
- **THEN** the portal uses the standard safe detail, not-found, conflict, or denied behavior
- **AND** it does not expose or mutate draft data

#### Scenario: Flow presents the recorded step sequence

- **WHEN** an authorized user progresses through a registration draft
- **THEN** the flow presents Basics, Endpoints, Client and access, Signing, Encryption, and Review as six ordered steps
- **AND** each step has one clear heading and only the questionnaire fields and dependent guidance needed for that step
- **AND** Confirmation follows successful submission outside the six-step progress indicator

#### Scenario: Continue validates and saves only the current draft

- **WHEN** a user selects Continue on a registration step
- **THEN** the portal validates the current step and displays an error summary plus field-level errors when it is invalid
- **AND** valid input is saved to the server-backed draft before the next step opens
- **AND** fields and cross-step constraints owned by future steps are not required merely to persist or complete the current step
- **AND** the step transition does not submit or advance final onboarding state

#### Scenario: Stale draft write fails without overwriting newer work

- **WHEN** a user submits a draft write or final submission with an expected draft version older than the current server version
- **AND** the current server lifecycle state remains `draft`
- **THEN** the backend rejects the write with `409` code `registration_draft_version_conflict` in the standard safe error contract
- **AND** it does not merge, overwrite, submit, or disclose the newer draft through the stale request
- **AND** the page offers a safe reload path before the user can reapply or retry changes

#### Scenario: Back and Save and exit preserve recoverable work

- **WHEN** a user selects Back or Save and exit after a registration draft exists
- **THEN** Back opens the previous permitted step without discarding saved answers
- **AND** Save and exit may persist safe partial current-step answers but marks the step incomplete when its active rules are not satisfied
- **AND** partial persistence does not make Review valid or advance onboarding state
- **AND** Save and exit returns to the RP application detail or workspace applications list
- **AND** that destination provides a clear way to resume the draft

#### Scenario: Cancel preserves the last server-saved draft

- **WHEN** a user chooses Cancel during registration
- **THEN** the portal warns before discarding unsaved current-step input when such input exists
- **AND** leaves the last successfully saved draft available to resume
- **AND** returns to the RP application detail or workspace applications list
- **AND** does not delete the draft or perform final submission

#### Scenario: Earlier changes invalidate dependent answers visibly

- **WHEN** a user changes an earlier answer that makes one or more later conditional answers invalid or inapplicable
- **THEN** the portal clears or invalidates those dependent answers according to the existing questionnaire rules
- **AND** identifies the later steps that require review before final submission

#### Scenario: Direct future-step access recovers safely

- **WHEN** a user requests a registration step that is not yet available because required earlier steps are incomplete
- **THEN** the portal routes the user to the earliest incomplete permitted step
- **AND** explains what must be completed without revealing another workspace or draft

#### Scenario: Review summarizes the pending submission

- **WHEN** all questionnaire steps are valid and the user opens Review
- **THEN** the page groups the pending values into an itemized summary
- **AND** each group has a localized Change link to the corresponding completed step
- **AND** important consequences and the single final submit action are clear

#### Scenario: Final submit occurs once

- **WHEN** an authorized user confirms the final registration submission through `/api/v1/workspaces/{workspace_uuid}/applications/{rp_application_uuid}/onboarding-state` with `targetState` `submitted` and the expected draft version
- **THEN** the backend rechecks authorization, current `draft` state, and the complete active questionnaire
- **AND** it conditionally checks the expected draft version and transitions the RP application from `draft` to `submitted` exactly once in one server transaction
- **AND** a retry that observes the same RP application already in `submitted` returns the authorized current submitted representation without another transition, submission side effect, or audit event
- **AND** retry, refresh, or repeated activation does not create a duplicate submission
- **AND** draft creation, draft saves, final submission, and retry recovery do not call, provision, update, or synchronize IBM Verify or another external system
- **AND** any later IBM interaction is owned by a separately governed integration flow that consumes the portal record
- **AND** success opens the registration Confirmation route

#### Scenario: Confirmation provides useful next steps

- **WHEN** final submission succeeds
- **THEN** Confirmation states the resulting registration status and what happens next
- **AND** it links to the RP application detail and selected workspace hub
- **AND** it does not ask the user to submit the same draft again

#### Scenario: Refresh and network failure preserve safe recovery

- **WHEN** the user refreshes a step or a draft save fails because of a network or server error
- **THEN** the portal preserves the last server-saved draft and any safely recoverable current input
- **AND** the affected step shows a scoped error and clear retry, save, or return action
- **AND** the error does not imply that unsaved input or final submission succeeded

#### Scenario: Session expiry resumes an authorized draft

- **WHEN** the session expires during registration and the user completes the applicable admission flows again
- **THEN** the portal resumes the same draft and equivalent step when the canonical authorization context still permits it
- **AND** revoked or changed scope uses the safe denied or workspace-return behavior instead of rendering draft data

#### Scenario: Language switching keeps equivalent draft context

- **WHEN** a user changes official language from a registration step
- **THEN** the header language control opens the equivalent step for the same authorized draft
- **AND** saved input is retained
- **AND** unsaved input is preserved or the user receives an explicit warning before it can be lost
- **AND** step labels, fields, hints, errors, Review, Change links, Confirmation, and accessible names have English and French parity

#### Scenario: Sensitive questionnaire content stays out of unsafe client surfaces

- **WHEN** registration answers include a public certificate, public JWK, endpoint, or other potentially sensitive configuration data
- **THEN** the portal does not place those answer values in URLs, query parameters, analytics, diagnostic logs, or unstructured local storage
- **AND** backend authorization and the existing data-handling boundary apply to each draft read and write
- **AND** private or symmetric key material is rejected rather than stored in the registration payload

#### Scenario: Draft audit and operational events exclude answer values

- **WHEN** the backend records a draft creation, successful step save, stale-version conflict, denied write, or final submission event
- **THEN** the event may identify the actor reference, workspace and application references, step ID, save mode, changed field names, result, timestamp, and correlation identifier
- **AND** it does not contain questionnaire values, certificate or JWK content, credentials, tokens, or unnecessary personal information
