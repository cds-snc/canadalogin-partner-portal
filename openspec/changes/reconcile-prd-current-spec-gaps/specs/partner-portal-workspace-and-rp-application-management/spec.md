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
When a workspace admin creates or updates a workspace-scoped RP application for OpenID Connect, the portal SHALL capture the CanadaLogin relying-party registration questionnaire for one application environment at a time.

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
- **THEN** the portal requires the matching details, including the relevant key-distribution detail for `private_key_jwt`, follow-up input for any `Other` algorithm choice, and the roadmap or risk follow-up path for unsupported security capabilities

#### Scenario: Missing security capabilities capture roadmap or risk follow-up
- **WHEN** a workspace admin answers `No` to message signing, signature validation, message encryption, or message decryption support
- **THEN** the portal captures whether the capability is on the product roadmap and, when applicable, an approximate revisit date or explicit risk follow-up note

### Requirement: Workspace administrators can review RP application audit visibility
Workspace administrators SHALL be able to review and download audit events for an RP application.

#### Scenario: Workspace admin filters and downloads audit events
- **WHEN** a workspace admin queries audit activity with a bounded date range
- **THEN** the portal displays matching audit events and supports additional download in CSV or XML format