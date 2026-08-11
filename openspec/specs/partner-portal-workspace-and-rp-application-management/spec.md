# partner-portal-workspace-and-rp-application-management

## Purpose
Define the currently implemented owner-scoped RP application credential and usage-management behavior for the partner portal.
## Requirements
### Requirement: Owner-scoped credential management is available for current-user RP applications
The portal SHALL provide a credential-management experience at `/your-applications/$rpApplicationUuid/manage-credentials` for owner-scoped RP applications backed by current-user API endpoints.

#### Scenario: Owner loads credential-management page
- **WHEN** an authenticated owner opens `/your-applications/$rpApplicationUuid/manage-credentials`
- **THEN** the page loads current OAuth setup context, current client credentials, and rotated secrets for that RP application

#### Scenario: Credential-management page routes owner failures consistently
- **WHEN** the credential-management page load returns `403`, `404`, or another unexpected error
- **THEN** the portal redirects to `/access-denied`, `/error?kind=not_found`, or `/error?kind=unexpected` respectively

### Requirement: Current client secret stays masked until explicitly revealed
The credential-management page MUST mask the current client secret by default and require an explicit reveal action before showing the current value.

#### Scenario: User opens credential-management page before reveal
- **WHEN** the credential-management page first renders current client credentials
- **THEN** the client secret is shown as a masked placeholder until the user chooses reveal

### Requirement: Owners can operate current and rotated secrets from the credential-management page
The credential-management page SHALL allow owners to copy the client ID, reveal and copy the current client secret, regenerate the current secret, create named rotated secrets, and delete selected rotated secrets.

#### Scenario: Owner regenerates the current client secret
- **WHEN** an owner confirms a current-secret regeneration action
- **THEN** the portal calls the owner-scoped rotation endpoint, refreshes the displayed credentials, and reveals the newly returned current secret

#### Scenario: Owner creates and deletes rotated secrets
- **WHEN** an owner submits a rotation name or chooses a rotated secret for deletion
- **THEN** the portal creates or deletes the selected rotated secret through owner-scoped API endpoints and refreshes the rotated-secret list

### Requirement: Owner-scoped MAU reporting is available for current-user RP applications
The portal SHALL provide a usage-report page at `/your-applications/$rpApplicationUuid/mau-report` backed by the owner-scoped MAU report endpoint.

#### Scenario: Owner opens MAU report page
- **WHEN** an authenticated owner opens `/your-applications/$rpApplicationUuid/mau-report`
- **THEN** the page loads a default rolling date range and displays MAU results for that RP application

#### Scenario: Owner filters and exports MAU data
- **WHEN** an owner applies a new date range on the MAU report page
- **THEN** the page refreshes the report for that range and supports export of the loaded report data to CSV

#### Scenario: MAU report shows department context when available
- **WHEN** the owner-scoped MAU report response includes a department name
- **THEN** the page displays the department label with the returned department name above the usage results

### Requirement: Workspace administration is restored under dedicated workspace routes
The portal SHALL provide authenticated workspace-administration routes under `/workspaces` and workspace CRUD APIs under `/api/v1/workspaces` for authorized users. Each workspace SHALL remain associated with exactly one department and SHALL expose its name, slug, description, department, and membership summary on list and detail views.

#### Scenario: Workspace admin creates a department-scoped workspace
- **WHEN** a workspace admin completes the create flow at `/workspaces/new`
- **THEN** the portal creates the workspace through `POST /api/v1/workspaces`, stores the selected department association, and redirects to `/workspaces/$workspaceUuid`

#### Scenario: Authorized user loads workspace list and detail
- **WHEN** an authorized user opens `/workspaces` and then `/workspaces/$workspaceUuid`
- **THEN** the portal loads the accessible workspace set from `/api/v1/workspaces` or `/api/v1/workspaces/mine` and shows the selected workspace detail without exposing unauthorized workspaces

#### Scenario: Unauthorized actor cannot mutate workspace metadata
- **WHEN** a user without workspace-admin authority attempts to create, update, or delete a workspace
- **THEN** the portal denies the action and the API returns the standard safe error contract instead of mutating the workspace

### Requirement: Workspace membership management stays scoped to workspace administrators
Workspace administrators SHALL manage membership at `/workspaces/$workspaceUuid/members` through `/api/v1/workspaces/{workspace_uuid}/members` endpoints. Membership SHALL remain explicit to one workspace and SHALL NOT grant broader department or invitation-scoped access.

#### Scenario: Workspace admin adds or updates a member role
- **WHEN** a workspace admin adds a user or changes an existing member role from the membership screen
- **THEN** the portal persists the membership through `POST` or `PATCH /api/v1/workspaces/{workspace_uuid}/members` resources and reflects the updated role in the workspace member list

#### Scenario: Duplicate membership is rejected
- **WHEN** a workspace admin attempts to add a user who already has an active membership in that workspace
- **THEN** the system rejects the duplicate membership and keeps the existing membership unchanged

#### Scenario: Removing a workspace member does not grant or preserve broader access
- **WHEN** a workspace admin removes a member from a workspace
- **THEN** the portal deletes only that workspace membership and the removed user no longer receives access to that workspace through the removed membership

### Requirement: Application information and contacts are managed as workspace-owned records
The portal SHALL provide application-information list, detail, create, and edit routes under `/workspaces/$workspaceUuid/application-information` and CRUD APIs under `/api/v1/workspaces/{workspace_uuid}/application-information`. Application information SHALL own canonical bilingual application metadata and onboarding narrative, while contacts SHALL be stored and managed as separate related records.

#### Scenario: Workspace admin creates and edits canonical application information
- **WHEN** a workspace admin creates or updates an application-information record
- **THEN** the portal stores canonical bilingual service names and the onboarding sections for overview, technology and protocol, security and privacy, usage, and migration or transition planning against that application-information record

#### Scenario: Workspace admin manages application-information contacts
- **WHEN** a workspace admin adds, edits, or removes a contact for an application-information record
- **THEN** the portal persists the change through the related contact endpoints and shows the updated contact list on the application-information detail view

#### Scenario: Linked RP applications block destructive deletion
- **WHEN** a workspace admin attempts to delete an application-information record that is still linked to one or more RP applications
- **THEN** the system rejects the delete request and identifies that linked RP applications must be unlinked or removed first

### Requirement: Workspace-scoped RP applications represent one environment registration each
The portal SHALL provide workspace-scoped RP application routes under `/workspaces/$workspaceUuid/applications` and CRUD APIs under `/api/v1/workspaces/{workspace_uuid}/applications`. Each RP application record SHALL represent one CanadaLogin environment registration linked to exactly one workspace and optionally one application-information record.

#### Scenario: Workspace admin creates a workspace-scoped RP application from workspace context
- **WHEN** a workspace admin creates an RP application from `/workspaces/$workspaceUuid/applications/new`
- **THEN** the portal stores one environment-specific registration record for the selected CanadaLogin environment and may link it to an existing application-information record for canonical metadata reuse

#### Scenario: One application-information record keeps multiple environment registrations
- **WHEN** a workspace admin creates more than one workspace-scoped RP application linked to the same application-information record for different CanadaLogin environments
- **THEN** the portal preserves separate RP application records and does not overwrite each environment registration with another environment's answers

#### Scenario: Workspace-scoped RP application detail shows operational context
- **WHEN** a user with permission opens `/workspaces/$workspaceUuid/applications/$rpApplicationUuid`
- **THEN** the portal shows the linked application-information context, the current RP application status, and the IBM Security Verify application identifier when available

### Requirement: Workspace-scoped RP application registration follows the current OIDC questionnaire
When a workspace admin creates or updates a workspace-scoped RP application for OpenID Connect, the portal SHALL capture and validate the current CanadaLogin relying-party registration questionnaire for one RP application environment at a time.

The questionnaire SHALL expose the following field catalog for the selected RP application environment.

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
| `Please provide the certificate / JSON Web Key` | Text or document-backed input | Yes when key-sharing method is `offline_exchange` | Offline certificate or JWK payload |
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
- **WHEN** a workspace admin saves or submits workspace-scoped OIDC registration data
- **THEN** the portal requires a selected CanadaLogin environment, requires `openid` in the requested scopes, requires PKCE for `public` clients, keeps Authorization Code Flow as the supported response flow, and restricts front-channel logout to `canada.ca` domains

#### Scenario: Conditional follow-up answers are required for dependent selections
- **WHEN** a workspace admin selects `private_key_jwt`, an `Other` algorithm, or an unsupported signing, validation, encryption, or decryption capability answer
- **THEN** the portal requires the matching key-distribution detail, free-text algorithm field, roadmap yes or no answer, and the approximate revisit date when the roadmap answer is `yes` before the RP application can be saved as valid

#### Scenario: Missing security capabilities capture roadmap or risk follow-up
- **WHEN** a workspace admin answers `No` to message signing, signature validation, message encryption, or message decryption support
- **THEN** the portal captures whether the capability is on the product roadmap and, when applicable, an approximate revisit date; selecting roadmap `no` records the negative answer without requiring an extra free-text note

### Requirement: Workspace-scoped RP applications expose usage and audit views
Workspace administrators SHALL be able to review usage and audit activity for a workspace-scoped RP application from dedicated subroutes and APIs.

#### Scenario: Workspace admin reviews usage summary
- **WHEN** a workspace admin opens `/workspaces/$workspaceUuid/applications/$rpApplicationUuid/usage`
- **THEN** the portal loads the usage summary from `/api/v1/workspaces/{workspace_uuid}/applications/{rp_application_uuid}/usage/summary` for the selected date or range state

#### Scenario: Workspace admin reviews bounded audit activity
- **WHEN** a workspace admin opens `/workspaces/$workspaceUuid/applications/$rpApplicationUuid/audit` and applies a bounded date range
- **THEN** the portal loads matching audit events from `/api/v1/workspaces/{workspace_uuid}/applications/{rp_application_uuid}/audit-events` and supports the defined audit download behavior for that result set

### Requirement: Onboarding lifecycle state is tracked across core onboarding records
The system SHALL track onboarding state for workspaces, application information records, and RP applications using the state vocabulary `draft`, `submitted`, `under_review`, `approved`, and `launched`. The current state SHALL be visible to authorized users on the relevant list and detail experiences.

#### Scenario: New onboarding records start in draft
- **WHEN** a workspace admin creates a new workspace, application information record, or RP application
- **THEN** the new record starts in `draft` until it is intentionally submitted into the onboarding workflow

#### Scenario: Submitted onboarding records expose review state
- **WHEN** an authorized user submits a draft onboarding record
- **THEN** the system records the state as `submitted` and makes that state visible in the relevant list and detail views

#### Scenario: Reviewed onboarding records move through governed states
- **WHEN** an authorized platform-admin user advances a submitted onboarding record
- **THEN** the system can move the record through `under_review`, `approved`, and `launched` as the onboarding outcome changes

#### Scenario: Unauthorized actor cannot advance review-only states
- **WHEN** a user without platform-admin authority attempts to move an onboarding record into `under_review`, `approved`, or `launched`
- **THEN** the system denies the transition and preserves the record's current state

### Requirement: Application information records show advisory readiness indicators
The system SHALL provide section-level completion indicators and an overall readiness signal for application information records so workspace admins can identify incomplete onboarding data before submission or production progression.

#### Scenario: Incomplete application information is flagged
- **WHEN** a workspace admin opens an application information record with missing required onboarding data
- **THEN** the portal highlights the incomplete sections or required inputs and keeps the record below a submit-ready state

#### Scenario: Incomplete readiness remains advisory in MVP2
- **WHEN** a workspace admin submits or continues working with an application information record that is not submit-ready
- **THEN** the portal preserves the incomplete indicators for user and oversight visibility, and any hard gating decision remains outside Partner Portal for MVP2

#### Scenario: Complete application information is marked submit-ready
- **WHEN** a workspace admin completes the required onboarding sections and contact information for an application information record
- **THEN** the portal marks the record as submit-ready and uses that status in onboarding summaries and review context

### Requirement: Environment progression rules remain explicit per RP application environment
The system SHALL treat `test`, `staging`, and `production` as environment-scoped onboarding steps and SHALL track progression between them without requiring every partner to use every environment.

#### Scenario: Test and staging RP application creation remains allowed
- **WHEN** a workspace admin creates or updates an RP application targeting `test` or `staging`
- **THEN** the portal allows that RP application work without requiring a production approval outcome first

#### Scenario: Partner can start at staging when test is unnecessary
- **WHEN** a workspace admin creates or updates a registration and `test` is not required for that integration path
- **THEN** the portal allows the onboarding record to proceed without a `test` registration and preserves the chosen environment path

#### Scenario: Test to staging progression reuses prior answers
- **WHEN** a workspace admin requests progression from `test` to `staging`
- **THEN** the portal pre-fills the next environment registration with previously captured onboarding and RP-registration values and marks the progression as self-serve

#### Scenario: Staging to production progression enters reviewed status
- **WHEN** a workspace admin requests progression from `staging` to `production`
- **THEN** the portal records the promotion request as review-tracked instead of treating the record as immediately launched

### Requirement: Out-of-band production review remains traceable
The system SHALL track promotion request status and external review references when CanadaLogin approval actions occur outside the portal.

#### Scenario: Promotion request captures review metadata
- **WHEN** a `staging`-to-`production` request is created or updated
- **THEN** the portal stores the current promotion status, external review reference, reviewing platform-admin identity or team metadata, and the relevant requested, reviewed, and decided timestamps

#### Scenario: Platform admin records production review outcome
- **WHEN** a platform-admin user records the latest out-of-band production review result for a promotion request
- **THEN** the portal updates the tracked promotion status and review metadata without requiring in-portal evidence upload

#### Scenario: Production-bound record cannot appear approved without review trace
- **WHEN** a record lacks the required review outcome or external reference for a production progression
- **THEN** the portal does not present the progression as `approved` or `launched` and identifies the missing review-traceability data

### Requirement: Checklist readiness and process links are visible before production progression
The system SHALL make onboarding checklist progress, external evidence references, and contextual external process links visible before a record is treated as production-ready.

#### Scenario: Workspace admin reviews production prerequisites
- **WHEN** a workspace admin opens a record that is preparing for production progression
- **THEN** the portal displays the tracked onboarding checklist items, current external evidence-reference status, and links to the relevant external review or process entry points

#### Scenario: Missing prerequisites are highlighted before production progression
- **WHEN** tracked checklist items or external evidence references remain incomplete for a production-bound record
- **THEN** the portal highlights the missing prerequisites before the production progression metadata is submitted or resubmitted, while leaving the hard gate outside Partner Portal for MVP2

