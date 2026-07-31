# Partner Portal Workspace And RP Application Management

## ADDED Requirements

### Requirement: Workspace administrators manage department-scoped workspaces
Authorized users SHALL be able to create, view, update, and delete workspaces, and workspace administrators SHALL be able to manage workspace membership for those workspaces. Each workspace SHALL remain associated to a department.

#### Scenario: Workspace admin creates a workspace and manages membership
- **WHEN** a workspace admin creates a workspace with name, slug, description, and department association
- **THEN** the workspace is stored and the admin can manage workspace members and role-specific membership such as `workspace_admin`

#### Scenario: Authorized user views workspace details
- **WHEN** an authorized user opens a workspace
- **THEN** the portal displays workspace detail context including department association and members available to that user's permissions

### Requirement: Application information intake captures onboarding context
Workspace administrators SHALL be able to create, update, view, and delete application information records and their contacts for a workspace.

#### Scenario: Workspace admin captures onboarding sections
- **WHEN** a workspace admin edits an application information record
- **THEN** the portal stores onboarding fields spanning application overview, technology and protocol, security and privacy, usage, and migration or transition planning

#### Scenario: Workspace admin manages application contacts
- **WHEN** a workspace admin adds, edits, or removes contacts for an application information record
- **THEN** the contact changes are saved against that application information record

### Requirement: Workspace administrators manage RP applications from workspace context
Workspace administrators SHALL be able to create, view, update, and delete RP applications within a workspace and link those applications to collected application information when available.

#### Scenario: Workspace admin creates an RP application
- **WHEN** a workspace admin creates an RP application from a workspace or application-information context
- **THEN** the RP application record stores the environment-specific registration data needed for that application's CanadaLogin onboarding, including environment selection, endpoint configuration, client settings, scope and sector-identifier choices, and related security-capability answers

#### Scenario: One application can keep separate environment registrations
- **WHEN** a workspace admin registers more than one CanadaLogin environment for the same application-information record
- **THEN** the portal keeps a distinct RP registration record for each environment and preserves each environment's questionnaire answers without overwriting the others

#### Scenario: RP application detail displays operational identifiers
- **WHEN** a user with permission opens an RP application detail page
- **THEN** the portal displays the RP application status and IBM Security Verify application identifier when it is available

### Requirement: OIDC RP registration captures the current CanadaLogin questionnaire
When a workspace admin creates or updates a workspace-scoped RP application for OpenID Connect, the portal SHALL capture the CanadaLogin relying-party registration questionnaire for one RP application environment at a time.

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

#### Scenario: Workspace admin captures environment and endpoint details
- **WHEN** a workspace admin starts or edits an OIDC RP application registration
- **THEN** the portal captures the target CanadaLogin environment (`test`, `staging`, or `production`), bilingual application or service names, bilingual environment URLs, redirect URLs, post-logout redirect URLs, logout mode, and logout request URL

#### Scenario: Workspace admin captures client, scope, and identifier configuration
- **WHEN** a workspace admin completes the core OIDC configuration questions
- **THEN** the portal captures Authorization Code Flow as the supported response flow, client type, client authentication method such as `private_key_jwt`, `client_secret_basic`, or `client_secret_post`, any dependent JWKS URI or offline key or certificate exchange details, requested scopes with required `openid`, sector identifier choice, pairwise-identifier sharing intent, optional migration sector-identifier URL, PKCE support, and supported PKCE algorithms

#### Scenario: Workspace admin captures message-protection capabilities
- **WHEN** a workspace admin completes the message-protection sections of the questionnaire
- **THEN** the portal captures supported RP message-signing options for request objects and token-endpoint requests, CanadaLogin signature-validation options for ID tokens and Userinfo responses, RP request-encryption options, and CanadaLogin message-decryption options for token-endpoint responses, ID tokens, and Userinfo responses, together with the applicable signature, key-management, and encryption algorithms

#### Scenario: Registration enforces current form constraints
- **WHEN** a workspace admin saves or submits OIDC registration data
- **THEN** the portal enforces the current questionnaire rules that `openid` is required, Authorization Code Flow is the supported authentication flow, PKCE is required for public clients, and front-channel logout is restricted to applications under the `canada.ca` domain

#### Scenario: Conditional follow-up questions are enforced for dependent answers
- **WHEN** a workspace admin selects an answer that requires dependent follow-up data
- **THEN** the portal requires the matching details, including the relevant key-distribution detail for `private_key_jwt`, follow-up input for any `Other` algorithm choice, roadmap yes or no answer, and the approximate revisit date when the roadmap answer is `yes`

#### Scenario: Missing security capabilities capture roadmap or risk follow-up
- **WHEN** a workspace admin answers `No` to message signing, signature validation, message encryption, or message decryption support
- **THEN** the portal captures whether the capability is on the product roadmap and, when applicable, an approximate revisit date; selecting roadmap `no` records the negative answer without requiring an extra free-text note

### Requirement: Workspace administrators can review RP application audit visibility
Workspace administrators SHALL be able to review and download audit events for an RP application.

#### Scenario: Workspace admin filters and downloads audit events
- **WHEN** a workspace admin queries audit activity with a bounded date range
- **THEN** the portal displays matching audit events and supports additional download in CSV or XML format
