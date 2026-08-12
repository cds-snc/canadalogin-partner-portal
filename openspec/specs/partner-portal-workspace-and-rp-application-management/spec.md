# partner-portal-workspace-and-rp-application-management

## Purpose
Define the canonical workspace task hierarchy and grant-scoped RP application management, including Access, server-backed multi-step portal registration, metadata, credentials, usage, audit, and CL Admin governance boundaries.
## Requirements
### Requirement: Current client secret stays masked until explicitly revealed
The credential-management page MUST mask the current client secret by default and require an explicit reveal action before showing the current value.

#### Scenario: User opens credential-management page before reveal
- **WHEN** the credential-management page first renders current client credentials
- **THEN** the client secret is shown as a masked placeholder until the user chooses reveal

### Requirement: Workspace administration is restored under dedicated workspace routes

The portal SHALL provide authenticated workspace routes under /workspaces and
workspace APIs under /api/v1/workspaces. CL Admin SHALL create and bootstrap
partner workspaces and review permitted cross-workspace metadata. RP Admin SHALL
administer metadata for an assigned workspace. RP User (Edit) and Read Only
SHALL NOT create, delete, or administer workspace-level identity/role state.

Each workspace SHALL remain associated with exactly one department and SHALL
expose its name, slug, description, department, and permitted summary data.

#### Scenario: Workspace admin creates a department-scoped workspace

- **WHEN** a CL Admin completes the create flow at /workspaces/new
- **THEN** the portal creates the workspace through POST /api/v1/workspaces
- **AND** it stores the selected department association
- **AND** it redirects to /workspaces/$workspaceUuid
- **AND** it permits the CL Admin to assign the first RP Admin without exposing partner secrets

#### Scenario: Authorized user loads workspace list and detail

- **WHEN** a CL Admin or partner user opens /workspaces and then an authorized /workspaces/$workspaceUuid route
- **THEN** the portal loads only the workspace set and detail permitted by the canonical global or partner assignment
- **AND** it does not expose another partner workspace

#### Scenario: Unauthorized actor cannot mutate workspace metadata

- **WHEN** a user without CL Admin attempts workspace creation, or a user without in-scope RP Admin attempts workspace update or deletion
- **THEN** the portal denies the action
- **AND** the API returns the standard safe error contract instead of mutating the workspace

### Requirement: Application information and contacts are managed as workspace-owned records

The portal SHALL provide application-information list, detail, create, and edit
routes and APIs within an active partner workspace scope. RP Admin and RP User
(Edit) SHALL create and edit application information and contacts. Read Only
and CL Admin SHALL read only the metadata/status allowed by their respective
scope and SHALL NOT perform partner-side edits.

Application information SHALL own canonical bilingual application metadata and
onboarding narrative, while contacts SHALL remain separate related records.

#### Scenario: Workspace admin creates and edits canonical application information

- **WHEN** an RP Admin or RP User (Edit) creates or updates an application-information record in the assigned workspace
- **THEN** the portal stores canonical bilingual service names and the onboarding sections for overview, technology/protocol, security/privacy, usage, and migration/transition planning

#### Scenario: Workspace admin manages application-information contacts

- **WHEN** an RP Admin or RP User (Edit) adds, edits, or removes a contact for an in-scope application-information record
- **THEN** the portal persists the change through the related contact endpoints
- **AND** it shows the updated contact list

#### Scenario: Linked RP applications block destructive deletion

- **WHEN** an authorized partner editor attempts to delete application information still linked to one or more RP applications
- **THEN** the system rejects the delete request
- **AND** it identifies that linked RP applications must be unlinked or removed first

### Requirement: Workspace-scoped RP applications represent one environment registration each

The portal SHALL provide canonical workspace-scoped RP application routes and
APIs. RP Admin and RP User (Edit) SHALL create and update RP applications
inside their assigned workspace. Read Only and CL Admin SHALL receive only
metadata/status views permitted by their canonical capabilities and SHALL NOT
change partner configuration.

Each RP application record SHALL represent one CanadaLogin environment
registration linked to exactly one workspace and optionally one
application-information record. A current-user RP application response SHALL
be a grant-authorized projection of that same workspace-owned record and SHALL
NOT create a second ownership model, configuration source, or independent
detail experience.

#### Scenario: Workspace admin creates a workspace-scoped RP application from workspace context

- **WHEN** an RP Admin or RP User (Edit) creates an RP application from `/workspaces/$workspaceUuid/applications/new`
- **THEN** the portal stores one environment-specific registration for the selected CanadaLogin environment
- **AND** it may link the record to existing application information

#### Scenario: One application-information record keeps multiple environment registrations

- **WHEN** an authorized partner editor creates multiple RP applications linked to the same application information for different CanadaLogin environments
- **THEN** the portal preserves separate RP application records
- **AND** it does not overwrite one environment registration with another

#### Scenario: Workspace-scoped RP application detail shows operational context

- **WHEN** an authorized canonical role opens `/workspaces/$workspaceUuid/applications/$rpApplicationUuid`
- **THEN** the portal shows only the application-information context, RP application status, identifiers, and actions permitted to that role
- **AND** it does not expose secret material to CL Admin or Read Only

#### Scenario: Current-user projection resolves to the owning workspace

- **WHEN** an authorized partner user selects an RP application returned through the current-user application projection
- **THEN** the selected resource keeps its owning `workspaceUuid` and RP application UUID
- **AND** navigation resolves to `/workspaces/$workspaceUuid/applications/$rpApplicationUuid`
- **AND** the portal does not load a separate workspace-agnostic or IBM-backed RP application record

#### Scenario: Workspace and RP application identifiers must match

- **WHEN** a caller uses a workspace-scoped route or API with an RP application owned by another workspace
- **THEN** the portal applies the standard safe unavailable response
- **AND** it does not disclose the other workspace, RP application, grant, provider record, or configuration

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

### Requirement: Workspace-scoped RP applications expose usage and audit views

The portal SHALL provide usage and audit views for RP applications within an
active workspace scope. RP Admin, RP User (Edit), and Read Only SHALL read
permitted usage and bounded audit results. No partner role SHALL read another
workspace's results.

#### Scenario: Workspace admin reviews usage summary

- **WHEN** an RP Admin, RP User (Edit), or Read Only user opens an in-scope RP application usage route
- **THEN** the portal loads the usage summary for the selected date or range state

#### Scenario: Workspace admin reviews bounded audit activity

- **WHEN** an RP Admin, RP User (Edit), or Read Only user opens an in-scope RP application audit route and applies a bounded date range
- **THEN** the portal loads matching permitted audit events
- **AND** any download remains constrained to that workspace and role

### Requirement: Onboarding lifecycle state is tracked across core onboarding records

The system SHALL track onboarding state for workspaces, application information
records, and RP applications using draft, submitted, under_review, approved,
and launched. RP Admin and RP User (Edit) SHALL prepare and submit
partner-owned records. CL Admin SHALL perform internal review-only transitions.
Read Only SHALL view permitted state without changing it.

#### Scenario: New onboarding records start in draft

- **WHEN** an RP Admin or RP User (Edit) creates a workspace-owned application information or RP application record
- **THEN** the new record starts in draft until intentionally submitted

#### Scenario: Submitted onboarding records expose review state

- **WHEN** an RP Admin or RP User (Edit) submits a draft onboarding record
- **THEN** the system records submitted
- **AND** it makes that state visible to authorized roles

#### Scenario: Reviewed onboarding records move through governed states

- **WHEN** a CL Admin advances a submitted onboarding record
- **THEN** the system can move the record through under_review, approved, and launched as the outcome changes

#### Scenario: Unauthorized actor cannot advance review-only states

- **WHEN** an RP Admin, RP User (Edit), or Read Only user attempts to move a record into under_review, approved, or launched
- **THEN** the system denies the transition
- **AND** it preserves the current state

### Requirement: Application information records show advisory readiness indicators

The system SHALL provide section-level completion indicators and an overall
readiness signal. RP Admin and RP User (Edit) SHALL use the indicators while
preparing and submitting records. Read Only and CL Admin SHALL view permitted
readiness/status without performing partner-side edits.

#### Scenario: Incomplete application information is flagged

- **WHEN** an authorized role opens application information with missing required onboarding data
- **THEN** the portal highlights incomplete sections or required inputs
- **AND** it keeps the record below a submit-ready state

#### Scenario: Incomplete readiness remains advisory in MVP2

- **WHEN** an RP Admin or RP User (Edit) submits or continues work on a record that is not submit-ready
- **THEN** the portal preserves the incomplete indicators for partner and oversight visibility
- **AND** any hard gating decision remains outside Partner Portal for MVP2

#### Scenario: Complete application information is marked submit-ready

- **WHEN** an RP Admin or RP User (Edit) completes required onboarding sections and contacts
- **THEN** the portal marks the record submit-ready
- **AND** it uses that status in onboarding summaries and review context

### Requirement: Environment progression rules remain explicit per RP application environment

The system SHALL treat test, staging, and production as environment-scoped
onboarding steps. RP Admin and RP User (Edit) SHALL prepare and request
progression. CL Admin SHALL record internal production review outcomes. Read
Only SHALL view permitted progression status without changing it.

#### Scenario: Test and staging RP application creation remains allowed

- **WHEN** an RP Admin or RP User (Edit) creates or updates an RP application targeting test or staging
- **THEN** the portal allows that work without requiring a production approval outcome first

#### Scenario: Partner can start at staging when test is unnecessary

- **WHEN** an RP Admin or RP User (Edit) creates or updates a registration and test is not required
- **THEN** the portal allows the onboarding record to proceed without a test registration
- **AND** it preserves the chosen environment path

#### Scenario: Test to staging progression reuses prior answers

- **WHEN** an RP Admin or RP User (Edit) requests progression from test to staging
- **THEN** the portal pre-fills the next environment registration with previously captured values
- **AND** it marks the progression as self-serve

#### Scenario: Staging to production progression enters reviewed status

- **WHEN** an RP Admin or RP User (Edit) requests progression from staging to production
- **THEN** the portal records a review-tracked promotion request
- **AND** it does not treat the record as approved or launched until CL Admin records the review outcome

### Requirement: Out-of-band production review remains traceable

The system SHALL track promotion status and external review references when
CanadaLogin approval occurs outside the portal. RP Admin and RP User (Edit)
SHALL submit permitted partner-owned request metadata. CL Admin SHALL record the
internal review outcome. Read Only SHALL view permitted status without changing
it.

#### Scenario: Promotion request captures review metadata

- **WHEN** an RP Admin or RP User (Edit) creates or updates a staging-to-production request
- **THEN** the portal stores the current promotion status, external review reference, reviewing CL Admin identity or team metadata, and relevant timestamps

#### Scenario: Platform admin records production review outcome

- **WHEN** a CL Admin records the latest out-of-band production review result
- **THEN** the portal updates the tracked promotion status and review metadata
- **AND** partner roles cannot perform the review-only transition

#### Scenario: Production-bound record cannot appear approved without review trace

- **WHEN** a record lacks the required CL Admin review outcome or external reference
- **THEN** the portal does not present the progression as approved or launched
- **AND** it identifies the missing review-traceability data to authorized roles

### Requirement: Checklist readiness and process links are visible before production progression

The system SHALL make onboarding checklist progress, external evidence
references, and contextual process links visible before production readiness.
RP Admin and RP User (Edit) SHALL update permitted partner-owned checklist
inputs. Read Only SHALL view them. CL Admin SHALL view and record permitted
internal review outcomes without partner secret access.

#### Scenario: Workspace admin reviews production prerequisites

- **WHEN** an authorized partner user opens a record preparing for production progression
- **THEN** the portal displays the checklist, external evidence-reference status, and relevant process links permitted to that role

#### Scenario: Missing prerequisites are highlighted before production progression

- **WHEN** tracked checklist items or external evidence references remain incomplete
- **THEN** the portal highlights the missing prerequisites before submission or resubmission
- **AND** the hard gate remains outside Partner Portal for MVP2

### Requirement: Partner workspace access uses canonical workspace-scoped roles

Partner workspace authorization SHALL use RP Admin, RP User (Edit), or Read
Only from the canonical partner access-grant model. The legacy values
workspace_admin and workspace_member SHALL NOT be accepted, displayed, or used
for authorization after cutover.

RP Admin SHALL administer workspace metadata, application information, RP
applications, partner secrets, partner reports, and permitted staff
invitations. RP User (Edit) SHALL edit application information and RP
configuration, use permitted secret workflows, submit partner-owned workflow
metadata, and read reports without managing roles or invitations. Read Only
SHALL receive permitted metadata, configuration, usage, and reporting reads
without mutation or secret access.

CL Admin SHALL bootstrap a workspace and its first RP Admin, view
cross-workspace metadata and status, and perform internal review actions without
retrieving RP secret values or performing partner-side configuration changes.

Where existing requirement names or scenarios use workspace administrator or
owner as a capability description, that description SHALL resolve through this
canonical matrix and SHALL NOT create a fifth product role.

#### Scenario: RP Admin manages partner workspace operations

- **WHEN** an RP Admin performs a supported workspace, application-information, RP-configuration, secret, reporting, or staff-invitation operation in the assigned workspace
- **THEN** the portal permits the operation within that workspace
- **AND** the role does not grant platform or another workspace's authority

#### Scenario: RP User Edit manages configuration without roles or invitations

- **WHEN** an RP User (Edit) performs a supported application-information, RP-configuration, secret, promotion-request, or reporting operation in the assigned workspace
- **THEN** the portal permits the operation
- **AND** the user cannot mutate workspace roles, invitations, or internal review outcomes

#### Scenario: Read Only receives view-only workspace access

- **WHEN** a Read Only user opens permitted workspace metadata, RP configuration, usage, or aggregate reporting in the assigned workspace
- **THEN** the portal returns the permitted read-only data
- **AND** no mutation or secret value is available

#### Scenario: CL Admin bootstraps without partner secret authority

- **WHEN** a CL Admin creates or reviews partner metadata and assigns the first RP Admin
- **THEN** the portal permits the applicable global operation
- **AND** it does not expose client credentials, secret values, or partner secret lifecycle controls

#### Scenario: Revoked partner assignment ends workspace access

- **WHEN** a user's active partner assignment for one workspace is revoked
- **THEN** the next protected request no longer receives access through that assignment
- **AND** access to other independently assigned workspaces remains unchanged

### Requirement: Grant-authorized credential management is available for accessible RP applications

The portal SHALL provide canonical credential management at
`/workspaces/$workspaceUuid/applications/$rpApplicationUuid/manage-credentials`
for RP applications inside an active partner workspace scope. Existing
grant-derived accessible-resource backend APIs MAY remain compatibility
adapters during migration, but the system SHALL verify that the RP application
belongs to the workspace in the route and authorize the active workspace grant
before retrieving credential or secret data. RP Admin and RP User (Edit) SHALL
be authorized to use the credential-management experience. Read Only and CL
Admin SHALL NOT discover or retrieve credential or secret values.

#### Scenario: Authorized partner editor loads credential-management page

- **WHEN** an RP Admin or RP User (Edit) opens `/workspaces/$workspaceUuid/applications/$rpApplicationUuid/manage-credentials` for an RP application in the assigned workspace
- **THEN** the page loads the minimum secret-free RP context, current client credentials, and rotated secrets for that RP application
- **AND** credential and secret calls verify the grant and RP/workspace relationship before any provider retrieval

#### Scenario: Credential-management page routes inaccessible resources safely

- **WHEN** the frontend capability guard denies secret access, the RP application does not belong to the route workspace, or a scoped request returns not found or another unexpected error
- **THEN** the portal uses the standard access-denied, safe not-found, or unexpected-error behavior respectively
- **AND** it does not reveal whether an out-of-scope RP application or secret resource exists

#### Scenario: Legacy credential route resolves safely

- **WHEN** an RP Admin or RP User (Edit) follows `/your-applications/$rpApplicationUuid/manage-credentials` during the compatibility period
- **THEN** the portal resolves the owning workspace through current-user scope and redirects to the canonical workspace-scoped credential route
- **AND** a missing, revoked, or out-of-scope resource receives the same safe unavailable response before secret retrieval

### Requirement: Grant-authorized partner editors can operate current and rotated secrets

The credential-management page SHALL allow RP Admin and RP User (Edit) to copy
the client ID, reveal and copy the current client secret, regenerate the
current secret, create named rotated secrets, and delete selected rotated
secrets for RP applications inside their active workspace scope through the
grant-derived accessible-resource API family. Read Only and CL Admin SHALL NOT
perform those operations, and authorization SHALL fail before any upstream
secret retrieval or mutation.

#### Scenario: Authorized partner editor regenerates the current client secret

- **WHEN** an RP Admin or RP User (Edit) confirms current-secret regeneration for an in-scope RP application
- **THEN** the portal calls the scoped rotation endpoint, refreshes the displayed credentials, and reveals the newly returned current secret

#### Scenario: Authorized partner editor creates and deletes rotated secrets

- **WHEN** an RP Admin or RP User (Edit) submits a rotation name or chooses an in-scope rotated secret for deletion
- **THEN** the portal creates or deletes the selected rotated secret through scoped API endpoints
- **AND** it refreshes the rotated-secret list

### Requirement: Grant-authorized MAU reporting is available for accessible RP applications

The portal SHALL provide the canonical application Usage page at
`/workspaces/$workspaceUuid/applications/$rpApplicationUuid/usage` for RP
applications inside an active partner workspace scope. RP Admin, RP User
(Edit), and Read Only SHALL read the report within scope through a server-
authorized workspace/RP application query. CL Admin and users without an
active permitted grant for the owning workspace SHALL receive the same safe
unavailable response as a missing resource.

The implementation MAY preserve the existing grant-derived accessible MAU API
as a compatibility adapter while callers migrate, provided it verifies the
same RP ownership and workspace grant before returning report data.

#### Scenario: Authorized partner user opens MAU report page

- **WHEN** an RP Admin, RP User (Edit), or Read Only user opens `/workspaces/$workspaceUuid/applications/$rpApplicationUuid/usage` for an in-scope RP application
- **THEN** the page loads a default rolling date range and displays the implemented usage results for that RP application

#### Scenario: Authorized partner user filters and exports MAU data

- **WHEN** an authorized partner user applies a new date range on the Usage page
- **THEN** the page refreshes the report for that range
- **AND** it supports CSV export only for the loaded in-scope report data

#### Scenario: MAU report shows department context when available

- **WHEN** the scoped Usage response includes a department name
- **THEN** the page displays the localized department label with the returned department name above the usage results

#### Scenario: Legacy MAU report route resolves safely

- **WHEN** an authorized partner user follows `/your-applications/$rpApplicationUuid/mau-report` during the compatibility period
- **THEN** the portal resolves the owning workspace and redirects to the canonical workspace-scoped Usage route
- **AND** it does not disclose or return report data for a missing, revoked, or out-of-scope resource

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
user-facing workspace destination for role assignments and workspace-owned
invitation management made available by the canonical authorization model.
Invitation creation SHALL remain available after a workspace exists even when
the workspace has no RP application.

The page SHALL apply the actor's delegation boundary: CL Admin MAY manage RP
Admin, RP User (Edit), and Read Only in the selected workspace; RP Admin SHALL
manage only RP User (Edit) and Read Only in the RP Admin's assigned workspace;
lower partner roles SHALL NOT mutate assignments or invitations.

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

#### Scenario: CL Admin invites the first RP Admin before application work

- **WHEN** a CL Admin opens Access for an existing workspace with no RP applications
- **THEN** the portal allows the CL Admin to create an RP Admin invitation for that workspace
- **AND** the workflow does not require placeholder application data or an IBM Verify operation

#### Scenario: RP Admin manages only lower roles in workspace context

- **WHEN** an RP Admin opens Access in the assigned workspace
- **THEN** the portal permits assignment and invitation actions only for RP User (Edit) and Read Only
- **AND** RP Admin and cross-workspace actions remain unavailable and denied

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

### Requirement: CL Admin reviews unassigned MVP1 RP registration candidates

The portal SHALL provide a CL Admin-only view of existing, non-deleted local RP
application records that have no workspace and have a stable IBM Verify
application ID. The candidate list SHALL use local portal data only and SHALL
NOT call IBM Verify for every row. It SHALL NOT expose internal database IDs,
application owners, credentials, secret values, raw provider payloads, or IBM
audit history.

#### Scenario: CL Admin opens the adoption candidate list

- **WHEN** an active CL Admin opens the existing-RP adoption task after partner workspaces have been created
- **THEN** the portal lists eligible unassigned local MVP1 RP records using public RP UUID, safe name, stable IBM application ID, and metadata-completeness state
- **AND** listing the candidates performs no IBM Verify request

#### Scenario: No unassigned registrations remain

- **WHEN** no active local RP record meets the adoption-candidate rules
- **THEN** the portal shows a localized empty state explaining that there are no registrations to link
- **AND** it provides a return path to Workspaces

#### Scenario: Partner role requests adoption candidates

- **WHEN** an RP Admin, RP User (Edit), Read Only, unauthenticated user, or user without active CL Admin requests the candidate route or API
- **THEN** the portal denies the request before returning candidate data or calling IBM Verify
- **AND** client-controlled role or owner values cannot satisfy the check

### Requirement: CL Admin previews safe missing metadata from IBM Verify

For one eligible candidate, the portal SHALL retrieve IBM Verify application
detail using the retained stable IBM application ID and reduce it to an
explicit allowlist of non-secret registration metadata. The preview SHALL
identify values that are missing locally and may be filled, values already
present locally and preserved, and non-empty differences requiring later
manual review.

Every real IBM Verify read or write SHALL remain owned by the separately
governed IBM-interactions package. This workflow SHALL consume only that
package's validated, typed non-secret projection and SHALL fail closed when no
adapter is available. The portal RP registration form and this adoption
workflow SHALL NOT call or update IBM Verify directly.

The portal SHALL NOT return or persist IBM application owners, client
credentials, current or rotated secret values, raw upstream payloads, or IBM
audit history. A non-empty portal value SHALL NOT be overwritten by the
preview or adoption operation.

#### Scenario: Selected candidate has missing non-secret metadata

- **WHEN** CL Admin opens an eligible candidate whose local record lacks allowlisted metadata and IBM Verify returns that metadata
- **THEN** the preview identifies the missing fields that can be filled during adoption
- **AND** it excludes owners, credentials, secrets, raw provider payloads, and IBM audit history

#### Scenario: IBM and portal contain different non-empty values

- **WHEN** IBM Verify returns an allowlisted value that differs from a non-empty local portal value
- **THEN** the preview preserves the portal value and identifies the field as a safe conflict for follow-up
- **AND** neither preview nor adoption silently overwrites the local value

#### Scenario: IBM Verify is unavailable or returns unsafe data

- **WHEN** the selected candidate cannot be retrieved, the provider is unavailable, or the response is malformed or contains secret-bearing fields
- **THEN** the portal returns a safe unavailable or retry state without exposing the upstream body
- **AND** the local candidate remains unmodified and unlinked

### Requirement: CL Admin explicitly links one retained RP to one workspace

The portal SHALL require CL Admin to select one active partner workspace before
adopting a candidate. The backend SHALL atomically revalidate and lock the RP
record and workspace, derive the department from the selected workspace, fill
only missing allowlisted non-secret fields, preserve the stable local RP UUID
and IBM application ID, and link the retained record to that workspace.

Existing portal audit history and MVP1 portal secret-lifecycle audit records
SHALL remain associated with the retained local RP UUID. IBM owner metadata
SHALL NOT assign a user, role, workspace, or portal permission.

#### Scenario: CL Admin adopts an eligible RP registration

- **WHEN** CL Admin confirms an eligible candidate, selects an active workspace, and supplies any required portal-only field that remains unresolved
- **THEN** the portal links the retained local RP record to that workspace and its department
- **AND** it fills only missing allowlisted non-secret metadata from the refreshed IBM projection
- **AND** it preserves the local RP UUID, IBM application ID, non-empty local values, and existing portal audit records

#### Scenario: Same workspace adoption request is retried

- **WHEN** the client repeats a completed adoption request for the same RP and workspace after an ambiguous or lost response
- **THEN** the portal returns the current adopted representation without creating a duplicate record or linkage side effect
- **AND** the existing local and audit identifiers remain unchanged

#### Scenario: Candidate was linked to a different workspace concurrently

- **WHEN** adoption revalidation finds that the RP record is already linked to a different workspace
- **THEN** the portal returns `409` with stable code `rp_application_already_linked`
- **AND** it does not move, clone, or partially update the RP record

#### Scenario: Selected workspace is unavailable

- **WHEN** the selected workspace is missing, deleted, or otherwise ineligible for partner bootstrap
- **THEN** the portal returns a safe validation or not-found response
- **AND** the RP record remains unlinked and unchanged

### Requirement: RP registration adoption is auditable and fail closed

The portal SHALL record the CL Admin adoption decision with actor, retained
local RP UUID, destination workspace UUID, outcome, correlation identifier,
timestamp, and safe changed-field names. Audit and operational logs SHALL NOT
contain secrets, credentials, owners, raw IBM payloads, unnecessary personal
information, or unhashed provider identifiers.

Authorization, candidate state, workspace state, IBM projection validation,
and transaction integrity SHALL all succeed before the workspace link becomes
effective.

#### Scenario: Successful adoption is audited

- **WHEN** a CL Admin adoption transaction commits
- **THEN** the portal records one minimized successful adoption event associated with the retained RP and workspace
- **AND** the event contains no secret, owner, credential, or raw provider data

#### Scenario: Unauthorized or invalid adoption fails before mutation

- **WHEN** authorization, candidate eligibility, workspace validation, provider validation, or concurrency checks fail
- **THEN** the portal creates no workspace link or partial metadata update
- **AND** it preserves the safe denied or failed outcome and applicable audit behavior

### Requirement: RP application summaries are consistent across authorized list surfaces

The selected-workspace RP application list and `/your-applications` SHALL use
one secret-free RP application summary definition and the same user-visible
status semantics. The current-user projection MAY add localized workspace name
and canonical grant role as projection context, but it SHALL NOT redefine the
RP application's name, environment, onboarding state, promotion state, or
resume task.

The shared summary SHALL contain the RP application UUID, owning workspace
UUID, localized RP application name, CanadaLogin environment, onboarding
state, optional promotion state, and permitted resume-task destination.
Provider identifiers, client identifiers, credentials, secret values, raw
provider status or payload, and authorization-policy internals SHALL NOT be
included.

#### Scenario: The same RP application appears in both lists

- **WHEN** an authorized partner user can view one RP application through both `/your-applications` and `/workspaces/$workspaceUuid/applications`
- **THEN** both surfaces show the same localized RP application name, CanadaLogin environment, onboarding state, optional promotion state, and next permitted resume task
- **AND** both links resolve to the same canonical workspace-scoped overview

#### Scenario: Cross-workspace projection adds meaningful workspace context

- **WHEN** `/your-applications` presents RP applications from more than one authorized workspace
- **THEN** each summary uses the localized workspace name as context
- **AND** raw workspace or RP UUIDs are not the primary visible labels

#### Scenario: Workspace list omits redundant presentation without changing meaning

- **WHEN** the selected workspace page already identifies the workspace in its H1 and hierarchy
- **THEN** the RP summaries MAY use a more compact workspace presentation
- **AND** their RP name, environment, lifecycle states, resume-task semantics, and canonical destination remain identical to the current-user projection

#### Scenario: Summary requests remain server scoped

- **WHEN** either RP application list requests summary data
- **THEN** the backend applies the session, canonical authorization, active workspace grant, and resource scope before serialization
- **AND** the browser does not receive a broader RP application dataset and filter it to permitted records

### Requirement: Registration validation failures remain actionable and preserve draft recovery

Completing a registration step SHALL distinguish correctable validation from a
draft load, concurrency, network, or persistence failure. A correctable `422`
SHALL keep the user on the current step, preserve entered answers and the last
server-saved draft/version, and present a localized error summary with safe
field-level feedback when field locations are returned. It SHALL NOT describe
the draft as unavailable or imply that server-saved answers were lost.

Frontend request serialization and backend validation SHALL share or test one
documented registration-draft contract, including field aliases, enum values,
conditional prerequisites, repeatable URL list shapes, `stepId`, `saveMode`,
and `expectedDraftVersion`.

#### Scenario: Valid Endpoints answers advance registration

- **WHEN** an authorized partner editor submits a representative valid Endpoints `completeStep` payload for a current server-backed draft
- **THEN** the backend accepts the documented frontend-serialized request
- **AND** it saves the Endpoints answers, increments the draft version, marks only the valid step complete, and returns the draft needed to advance

#### Scenario: Correctable Endpoints validation stays on Step 2

- **WHEN** the Endpoints `PATCH` returns `422` for one or more correctable answers
- **THEN** the frontend remains on Endpoints and focuses a localized error summary linked to affected controls
- **AND** it preserves the user's entered values and the last server-saved draft/version
- **AND** it does not show the generic draft-load or unavailable-draft message

#### Scenario: Contract drift is caught before release

- **WHEN** frontend registration serialization or backend request aliases,
  enums, prerequisites, or list shapes change
- **THEN** a cross-stack contract test submits the actual frontend-shaped
  Endpoints request to backend validation
- **AND** an incompatible change fails verification rather than surfacing only
  as an unexplained runtime `422`

#### Scenario: Non-validation save failure remains recoverable

- **WHEN** the Endpoints save fails because of a network, service, or unexpected persistence error
- **THEN** the frontend shows a scoped localized retry notice distinct from field validation and draft-load failure
- **AND** it preserves entered values and the last server-saved draft without advancing or marking the step complete

#### Scenario: Registration validation logs remain safe and traceable

- **WHEN** the backend accepts or rejects a registration step
- **THEN** structured logs include the safe actor reference, workspace and RP application identifiers, step, save mode, safe changed or invalid field names, result, stable error code when applicable, and request/correlation identifier
- **AND** logs exclude questionnaire values, URLs, certificates, JWK content, credentials, tokens, private keys, and unnecessary personal information

