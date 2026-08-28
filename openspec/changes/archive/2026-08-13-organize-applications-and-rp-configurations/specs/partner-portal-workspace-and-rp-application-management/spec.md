# Delta for partner-portal-workspace-and-rp-application-management

## ADDED Requirements

### Requirement: Partner workspaces own Applications as parent aggregates

The portal SHALL treat a Partner workspace as the collaboration, tenancy, and
authorization boundary and SHALL treat each workspace-owned Application as the
parent of its bilingual public metadata, onboarding narrative, readiness,
contacts, internal review context, and RP configurations.

RP Admin and RP User (Edit) SHALL create and edit Applications in an assigned
workspace. Read Only and CL Admin SHALL receive only the Application metadata,
status, and review surfaces permitted by their canonical capabilities. A child
identifier SHALL NOT grant authority independently of the workspace.

#### Scenario: Partner editor creates an Application

- **WHEN** an RP Admin or RP User (Edit) creates an Application from `/workspaces/$workspaceUuid/applications/new`
- **THEN** the portal creates one Application in the authorized workspace
- **AND** it stores canonical English and French public service names plus the onboarding sections for overview, technology/protocol, security/privacy, usage, and migration/transition planning
- **AND** success opens the new Application hub

#### Scenario: Partner editor updates canonical public metadata

- **WHEN** an RP Admin or RP User (Edit) updates Details for an in-scope Application
- **THEN** the portal updates that one parent record
- **AND** every child summary obtains public Application identity from the updated parent rather than a duplicated RP-configuration name

#### Scenario: Application may exist before its first RP configuration

- **WHEN** an authorized partner editor creates an Application and has not created an RP configuration
- **THEN** the Application remains a valid workspace-owned draft with an actionable RP-configurations empty state
- **AND** the portal does not create a placeholder RP row or require a Partner environment or CanadaLogin environment until an RP configuration is created

#### Scenario: Child resources inherit workspace context

- **WHEN** an Application, contact, or RP configuration is read or mutated
- **THEN** the backend derives authorization and effective Department context through its owning workspace
- **AND** a child-level workspace or Department value cannot override that parent boundary

#### Scenario: Nested identifiers must share one hierarchy

- **WHEN** a route or API combines a workspace UUID, Application UUID, contact UUID, or RP-configuration UUID that do not belong to the same hierarchy
- **THEN** the portal returns the standard safe unavailable response
- **AND** it does not reveal which identifier exists, its actual parent, or any protected metadata

#### Scenario: Linked RP configurations block destructive Application deletion

- **WHEN** an authorized partner editor attempts to delete an Application that still owns one or more retained RP configurations in any lifecycle or soft-delete state
- **THEN** the system rejects the delete request
- **AND** it identifies safely that the child configurations must be resolved first
- **AND** no Application, contact, configuration, credential, audit, or review record is deleted

### Requirement: Application contacts use person identity fields and focused management

Application contacts SHALL be Application-owned records with required first
name, last name, English responsibility or title, French responsibility or
title, and email, plus optional phone and alternate phone. Person names SHALL
be entered once and SHALL NOT have English and French variants. Labels, hints,
errors, and responsibility/title content SHALL remain bilingual.

RP Admin and RP User (Edit) SHALL manage contacts through focused list, create,
edit, and confirmed-delete routes. Read Only SHALL receive the permitted
read-only list. CL Admin SHALL receive contact data only when its oversight
capability and purpose permit it.

#### Scenario: Partner editor records a contact

- **WHEN** an RP Admin or RP User (Edit) creates an Application contact
- **THEN** the portal requires first name, last name, English and French responsibility/title values, and a valid email
- **AND** it accepts optional phone values
- **AND** it records the new contact as identity-confirmed by that authorized actor without persisting duplicate language-specific person names
- **AND** it does not ask for or persist English and French versions of the person's first or last name

#### Scenario: Language switching preserves person identity

- **WHEN** a user changes official language while viewing or editing a contact
- **THEN** the UI translates labels, hints, validation, and actions and displays the responsibility/title value for the active language
- **AND** it preserves the same first name, last name, email, and phone values without translating or duplicating the person's name

#### Scenario: Contact responsibility remains bilingual

- **WHEN** an authorized editor records a contact's responsibility or title
- **THEN** the API stores the English and French values without treating either as the person's name or an authorization role
- **AND** the frontend renders the matching value for the active language

#### Scenario: Legacy contact requires explicit confirmation

- **WHEN** an existing contact has only legacy bilingual full-name or responsibility fields
- **THEN** the portal preserves those values without parsing, translating, or guessing first and last name
- **AND** it renders the retained full name for the active locale until RP Admin or RP User (Edit) confirms first and last name
- **AND** confirmation records actor and time without overwriting either responsibility value
- **AND** it identifies the contact as requiring authorized confirmation before the contact counts as readiness-complete
- **AND** no migration writes invented person identity data

#### Scenario: Contact personal information remains protected

- **WHEN** contact data is created, read, updated, deleted, logged, audited, tested, or shown in evidence
- **THEN** the system limits values to the authorized Application purpose and scope
- **AND** it excludes contact values from URLs, query strings, analytics, diagnostic logs, audit detail values, real-data fixtures, and screenshots

### Requirement: Application entry page is a compact task hub with focused children

The portal SHALL provide
`/workspaces/$workspaceUuid/applications/$applicationUuid` as the canonical
Application entry page. It SHALL use the localized Application name as its H1,
show only concise sourced overview and status context, and link to focused
Details, Readiness, Contacts, RP configurations, and capability-gated Internal
review pages. For an authorized editor, it SHALL expose a secondary capability-gated Application
management section whose `Delete application` link opens a focused
confirmation page.

The hub SHALL NOT embed full metadata sections, edit forms, contact records,
contact forms, readiness breakdowns, review notes, checklists, RP
questionnaires, Usage results, credential values, or destructive controls.
Navigation to a focused confirmation page is not itself a destructive control.

#### Scenario: Authorized user opens an Application hub

- **WHEN** an authorized role opens an in-scope Application
- **THEN** the page shows the localized Application name in one H1
- **AND** it may show a concise overview, lifecycle state, overall textual readiness state, and safe contact or configuration counts
- **AND** each permitted task appears as one single-destination link or GC Design System card

#### Scenario: Application task availability follows capability

- **WHEN** RP Admin, RP User (Edit), Read Only, or CL Admin opens an Application hub
- **THEN** the hub exposes only task destinations permitted by that role and Application scope
- **AND** hidden task links do not replace direct-route and backend authorization

#### Scenario: Readiness summary links to a focused breakdown

- **WHEN** the Application has a calculated readiness state
- **THEN** the hub shows a compact localized text status that does not rely on colour alone
- **AND** an authorized user can follow a contained link to the focused Readiness page for section-level detail
- **AND** the hub does not render the complete readiness breakdown inline

#### Scenario: Contacts and RP configurations use focused destinations

- **WHEN** an authorized user needs to view or manage contacts or RP configurations
- **THEN** the Application hub links to the corresponding focused collection page
- **AND** it does not place an inline create or edit form on the hub

#### Scenario: Empty Application exposes direct first-configuration creation

- **WHEN** an Application owns no RP configurations and an RP Admin or RP User (Edit) opens its hub
- **THEN** the hub presents a prominent `Create first RP configuration` action
- **AND** the action opens the selected Application's nested create route without asking the user to choose the workspace or Application again
- **AND** a user without RP-configuration write capability does not receive the create action

#### Scenario: Existing configurations are a leading Application task

- **WHEN** an Application owns one or more RP configurations
- **THEN** the hub presents RP configurations as a leading focused destination with its safe record count and concise status context when available
- **AND** it does not embed a second configuration collection or a global context chooser

#### Scenario: Application deletion is secondary and focused

- **WHEN** an authorized editor opens an Application hub
- **THEN** a quiet `Delete application` link appears under a secondary `Application management` heading after the primary tasks
- **AND** the portal does not expose `Application settings` as a user-facing task or card
- **AND** the link opens a dedicated confirmation page that revalidates authorization and retained-child safeguards before any deletion

#### Scenario: Internal review remains separately authorized

- **WHEN** a CL Admin with oversight capability opens an Application hub through a permitted oversight path
- **THEN** Internal review links to a focused review page for that Application
- **AND** partner roles do not receive internal notes, checklist outcomes, or the review destination merely because they can edit Application data

#### Scenario: Application children preserve parent navigation

- **WHEN** an authorized user opens an Application child page
- **THEN** breadcrumbs identify Home, Partner workspaces, the selected workspace, and the Application parent as applicable
- **AND** a stable translated parent link returns to the Application hub or its owning collection without relying on browser history
- **AND** raw UUIDs are not used as friendly labels

#### Scenario: Application pages remain focused and responsive

- **WHEN** an Application hub or focused child is used with keyboard navigation, assistive technology, a small viewport, long French content, or 200-percent zoom
- **THEN** heading, source, visual, focus, and task order remain logical
- **AND** content reflows without clipping or horizontal task scrolling
- **AND** a details disclosure does not hide a required status, error, form field, instruction, or primary action

### Requirement: Applications own required named RP configurations

The portal SHALL present each partner-visible current `rp_application` record
as one RP configuration that belongs to exactly one Application and therefore
one workspace. Every new partner-created RP configuration SHALL have a
required locale-neutral configuration name, a required locale-neutral Partner
environment label, and exactly one CanadaLogin environment: `test`, `staging`,
or `production`.

An Application MAY own any number of configurations targeting the same
CanadaLogin environment. Several Partner environments MAY connect to the same
CanadaLogin environment. The system SHALL NOT impose a one-configuration-per-
environment invariant or infer a Partner environment from the CanadaLogin
target, URLs, provider metadata, configuration name, or siblings.

Legacy records without a trustworthy Partner environment MAY remain readable
with an explicit localized `Not provided` compatibility value. The portal
SHALL NOT silently relabel or hide those records, and a new canonical create or
clone SHALL NOT omit the field.

#### Scenario: Partner editor creates a named RP configuration

- **WHEN** an RP Admin or RP User (Edit) starts a configuration from `/workspaces/$workspaceUuid/applications/$applicationUuid/rp-configurations/new`
- **THEN** the portal requires a configuration name, Partner environment, and CanadaLogin environment in the selected Application context
- **AND** it does not ask for a second copy of the Application's English and French public names
- **AND** valid creation links the configuration to exactly that Application and workspace

#### Scenario: Two configurations target the same CanadaLogin environment

- **WHEN** an Application already has one configuration targeting a CanadaLogin environment and an authorized editor creates another differently named configuration for that same environment
- **THEN** the portal preserves both configurations as distinct records
- **AND** it does not overwrite, reuse, reject, or merge either record solely because their CanadaLogin environment matches

#### Scenario: Configuration name distinguishes same-environment siblings

- **WHEN** active sibling configurations have the same Application and CanadaLogin environment
- **THEN** each has a non-blank configuration name and a distinct stable configuration UUID
- **AND** summaries show configuration name, explicitly labelled Partner environment, and explicitly labelled CanadaLogin environment
- **AND** exact displayed name, Partner-environment, and CanadaLogin-environment duplicates show a localized short public reference derived from the UUID so the target remains human-distinguishable
- **AND** the system does not infer record identity from configuration name or environment

#### Scenario: Configuration name is locale neutral

- **WHEN** a user creates, edits, views, or changes language for an RP configuration
- **THEN** one trimmed Unicode-normalized configuration-name value is used in both official-language experiences
- **AND** the UI translates its field label, hint, validation, and surrounding content rather than collecting `nameEn` and `nameFr`
- **AND** names longer than 128 characters or containing only whitespace are rejected

#### Scenario: Partner environment is a distinct locale-neutral label

- **WHEN** a partner creates, edits, views, or changes language for an RP configuration
- **THEN** the canonical create contract requires one trimmed Unicode-normalized `partnerEnvironment` value from 1 to 128 characters
- **AND** the UI translates `Partner environment`, its hint, validation, and surrounding content rather than collecting English and French variants
- **AND** the value remains distinct from `configurationName`, `canadaLoginEnvironment`, and the English/French Application environment URLs
- **AND** labels such as `QA 2` and `Partner staging` are valid without implying a fixed taxonomy or one-to-one CanadaLogin mapping

#### Scenario: Missing legacy Partner environment is not guessed

- **WHEN** migration or a compatible read encounters a retained RP configuration without a trustworthy Partner environment
- **THEN** the system preserves the missing state and renders localized `Not provided` where a value must be shown
- **AND** it does not derive the value from configuration name, URLs, provider metadata, CanadaLogin environment, or sibling records
- **AND** contracting the nullable compatibility field requires explicit mappings or authorized confirmations for every retained row
- **AND** absence of this newly introduced label does not silently change a historical non-draft lifecycle state

#### Scenario: Partner editor confirms missing Partner environment without reopening registration

- **WHEN** an RP Admin or RP User (Edit) supplies a valid Partner environment from the nested `/partner-environment/edit` route for an in-scope retained configuration in any lifecycle state
- **THEN** a focused metadata operation revalidates workspace, Application, configuration ancestry, and write capability before updating the top-level field
- **AND** it does not reopen registration, change lifecycle, or mutate questionnaire answers
- **AND** a Read Only user cannot perform the operation
- **AND** the audit event records actor, safe field name, result, timestamp, and resource references without the entered label value

#### Scenario: Legacy configuration without CanadaLogin environment blocks activation

- **WHEN** migration finds an active workspace-linked RP row without a CanadaLogin environment
- **THEN** it requires an explicit `test`, `staging`, or `production` mapping and does not infer one from names, URLs, provider metadata, or siblings
- **AND** an unresolved row remains outside canonical partner configuration discovery and prevents the required-field contract phase from activating

#### Scenario: Application parent must belong to the same workspace

- **WHEN** creation, adoption, migration, or a concurrent update would link an RP configuration to an Application owned by another workspace
- **THEN** the transaction fails without changing either record
- **AND** database-supported invariants plus locked service validation prevent a workspace-less Application parent or cross-workspace partner configuration

#### Scenario: Configuration ancestry mismatch fails safely

- **WHEN** a caller supplies a configuration UUID owned by another Application or workspace
- **THEN** the route and API return the same safe unavailable result as a missing configuration
- **AND** no configuration, Application, workspace, grant, provider, Usage, credential, or secret data is disclosed

### Requirement: Application and RP configuration collections use focused comparison tables

The portal SHALL distinguish Application summaries from RP-configuration summaries.

The selected-workspace Applications page and each Application's RP
configurations page SHALL use secret-free, server-scoped summary contracts and
compact GC Design System tables because their rows share comparable facets.
Application identity SHALL come from localized parent metadata. RP-
configuration identity SHALL come from configuration name plus explicitly
labelled Partner and CanadaLogin environments.

Each record's View, Resume, Add, or Edit navigation SHALL remain within the
same row as the record it affects. Tables SHALL have an accessible caption or
equivalent nearby heading, column headers, a row header for record identity,
real text for missing values, GCDS-aligned spacing, and responsive behavior.
They SHALL NOT become decorative cards, layout tables, or complex data grids.

#### Scenario: Application list uses parent identity

- **WHEN** an authorized user opens `/workspaces/$workspaceUuid/applications`
- **THEN** each row uses the localized Application name as its row header and primary link to the Application hub
- **AND** it may show concise lifecycle, readiness, contact-count, or configuration-count context
- **AND** it does not label a child RP configuration as the parent Application

#### Scenario: Application row offers contextual configuration creation

- **WHEN** an RP Admin or RP User (Edit) views an Application row
- **THEN** that row offers `Add RP configuration` for exactly that Application
- **AND** the nested create route preserves the selected workspace and Application without presenting either chooser again
- **AND** users without RP-configuration write capability do not receive the row action

#### Scenario: RP configuration table uses configuration identity

- **WHEN** an authorized user opens one Application's RP configurations
- **THEN** the table contains `Name`, `Partner environment`, `CanadaLogin environment`, `Status`, and `Action` columns
- **AND** each row uses `configurationName` as its row header
- **AND** a missing legacy Partner environment uses localized `Not provided` rather than a blank or inferred value
- **AND** exact displayed name, Partner-environment, and CanadaLogin-environment duplicates show a localized short public reference beneath the name without making a raw UUID the primary label

#### Scenario: Each RP-configuration row has one clear destination

- **WHEN** an authorized editor can continue an incomplete draft
- **THEN** that row's Action cell contains `Resume setup`
- **AND** otherwise its one row action is `View configuration`
- **AND** a read-only user receives a permitted view destination rather than a mutation path

#### Scenario: Configuration creation is visible before the collection

- **WHEN** an RP Admin or RP User (Edit) opens one Application's RP configurations
- **THEN** a primary `Create RP configuration` action appears before the table
- **AND** when there are no rows, the same action appears inside the empty state
- **AND** the action is not presented only as an uncontained text link after the collection

#### Scenario: Small RP-configuration table omits unnecessary controls

- **WHEN** the RP-configuration collection is small and its default server order supports the task
- **THEN** the table does not add filtering, sorting, pagination, bulk selection, or inline editing
- **AND** any future control requires evidence that the collection size or comparison task benefits from it

#### Scenario: Collection tables remain accessible and responsive

- **WHEN** a collection is used at mobile width, 200-percent zoom, with long French labels, keyboard navigation, or assistive technology
- **THEN** table captions, column headers, row headers, links, and statuses remain understandable in source and focus order
- **AND** long names, URLs, and status text wrap without clipping or inaccessible horizontal scrolling
- **AND** responsive column treatment preserves the primary identity, environment distinction, status, and row action needed to complete the task

#### Scenario: Summary requests remain server scoped

- **WHEN** an Application or RP-configuration collection requests summaries
- **THEN** the backend applies the session, canonical workspace role, selected workspace, parent Application when applicable, and object scope before serialization
- **AND** the browser does not receive a wider dataset and reduce it through client-side filtering
- **AND** the summaries exclude provider identifiers, client identifiers treated as credentials, secrets, raw provider payloads, contact PII, and policy internals

### Requirement: Application-scoped RP configuration registration follows the current OIDC questionnaire

The portal SHALL preserve the current OIDC questionnaire within the new hierarchy.

When an authorized partner editor creates or updates an Application-scoped RP
configuration draft for OpenID Connect, the portal SHALL capture and validate
the current CanadaLogin relying-party registration questionnaire for one named
configuration, Partner environment, and CanadaLogin environment at a time.

Bilingual public Application names SHALL come from the selected Application
parent. Configuration Basics SHALL collect a required locale-neutral
configuration name, one locale-neutral Partner environment, one CanadaLogin
environment, and configuration-specific URLs and endpoints. The server MAY
persist incomplete answers as draft data without treating the affected step or
registration as valid. Completing a step SHALL validate every active field and
constraint owned by that step and all prerequisite steps. Final submission
SHALL validate the complete active questionnaire and all cross-step constraints,
including Partner environment, before transitioning the RP configuration from
`draft` to `submitted`.

#### Field group: RP configuration identity and endpoints

| Form question | Control type | Required | Allowed values or expected input |
|---|---|---|---|
| `Configuration name` | Text input | Yes | Locale-neutral operational label, 1 to 128 characters; record identity remains the stable configuration UUID |
| `Partner environment` | Text input | Yes | Locale-neutral partner-side environment label, 1 to 128 characters, for example `QA 2` or `Partner staging`; not inferred from another field |
| `Please select the CanadaLogin environment you are requesting access to` | Single-select | Yes | `test` (`Test` - integration testing), `staging` (`Staging` - compliance testing), `production` (`Production` - go-live ready) |
| `Application environment URL (English)` | URL input | Yes | Base URL for the English configuration environment |
| `Application environment URL (French)` | URL input | Yes | Base URL for the French configuration environment |
| `Redirect URL(s)` | Repeatable URL list | Yes | One or more redirect URLs |
| `Post Logout Redirect URL(s)` | Repeatable URL list | No | Zero or more post-logout redirect URLs |
| `Please select how you would like to receive a logout request` | Single-select | Yes | `back_channel` (`Back-channel logout (Preferred)`), `front_channel` (`Front-channel logout`); `front_channel` is valid only for RP configurations under `canada.ca` |
| `Logout request URL` | URL input | Yes when a logout mode is selected | Logout endpoint URL for the selected RP configuration |

The group SHALL show the localized parent Application name as read-only context
and SHALL NOT collect English and French Application/service names again. It
SHALL explain that Partner environment identifies the partner-side deployment
while CanadaLogin environment identifies the CanadaLogin target.

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
| `If Other: Please provide the key management algorithm` for RP request encryption | Text input | Yes when RP request encryption support is `yes` and algorithms include `other` | Free-text key-management algorithm name |
| `Please select all encryption algorithms supported` for RP request encryption | Multi-select checkbox group | Yes when RP request encryption support is `yes` | `A128GCM`, `A192GCM`, `A256GCM`, `other` |
| `If Other: Please provide the encryption algorithm` for RP request encryption | Text input | Yes when RP request encryption support is `yes` and algorithms include `other` | Free-text encryption algorithm name |
| `If no, is message encryption in your product roadmap` | Single-select | Yes when RP request encryption support is `no` | `yes`, `no` |
| `Can you provide an approximate date to revisit this configuration item` for RP request encryption | Date or month input | Yes when RP request-encryption roadmap answer is `yes` | Approximate revisit date |
| `Does your application support the decryption of messages sent from CanadaLogin` | Single-select | Yes | `yes`, `no` |
| `If yes, for which items/messages do you support message signing` for CanadaLogin message decryption | Multi-select checkbox group | Yes when CanadaLogin message decryption support is `yes` | `token_endpoint_response` (`Token Endpoint Response`), `id_token` (`ID Token`), `userinfo` (`Userinfo Endpoint`) |
| `Please select all supported key management algorithms supported` for CanadaLogin message decryption | Multi-select checkbox group | Yes when CanadaLogin message decryption support is `yes` | `RSA-OAEP-256`, `RSA-OAEP`, `other` |
| `If Other: Please provide the key management algorithm` for CanadaLogin message decryption | Text input | Yes when CanadaLogin message decryption support is `yes` and algorithms include `other` | Free-text key-management algorithm name |
| `Please select all encryption algorithms supported` for CanadaLogin message decryption | Multi-select checkbox group | Yes when CanadaLogin message decryption support is `yes` | `A128GCM`, `A192GCM`, `A256GCM`, `other` |
| `If Other: Please provide the encryption algorithm` for CanadaLogin message decryption | Text input | Yes when CanadaLogin message decryption support is `yes` and algorithms include `other` | Free-text encryption algorithm name |
| `If no, is message decryption in your product roadmap` | Single-select | Yes when CanadaLogin message decryption support is `no` | `yes`, `no` |
| `Can you provide an approximate date to revisit this configuration item` for CanadaLogin message decryption | Date or month input | Yes when CanadaLogin message-decryption roadmap answer is `yes` | Approximate revisit date |

#### Scenario: Partner editor captures RP configuration identity and endpoints

- **WHEN** an authorized partner editor starts or edits an Application-scoped OIDC RP configuration
- **THEN** the portal captures configuration name, Partner environment, target CanadaLogin environment, English and French configuration-environment URLs, redirect URLs, post-logout redirect URLs, logout delivery mode, and logout request URL
- **AND** it displays but does not recollect the localized public Application name

#### Scenario: Partner editor captures client, scope, sector-identifier, and PKCE configuration

- **WHEN** an authorized partner editor completes the core OIDC configuration questions
- **THEN** the portal captures Authorization Code Flow as the supported response flow, client type, client authentication method, dependent public key-sharing details, requested scopes with required `openid`, sector identifier choice, pairwise-identifier sharing intent, optional migration sector-identifier URL, PKCE support, and supported PKCE algorithms

#### Scenario: Partner editor captures message-protection capabilities

- **WHEN** an authorized partner editor completes the digital-signature, signature-validation, encryption, and decryption sections
- **THEN** the portal captures supported RP message-signing options, CanadaLogin signature-validation options, RP request-encryption options, and CanadaLogin message-decryption options together with the applicable signature, key-management, and encryption algorithms

#### Scenario: RP configuration registration enforces current questionnaire constraints

- **WHEN** an authorized partner editor completes a step or finally submits RP-configuration registration data
- **THEN** the portal enforces every current questionnaire constraint whose controlling fields are part of that step or an earlier completed step
- **AND** final submission requires configuration name, Partner environment, and CanadaLogin environment, requires `openid`, requires PKCE for `public` clients, keeps Authorization Code Flow as the supported response flow, and restricts front-channel logout to `canada.ca` domains

#### Scenario: Incomplete draft persistence does not create a valid submission

- **WHEN** an authorized partner editor uses Save and exit or another safe draft-persistence action before every active field and step is valid
- **THEN** the portal may retain the incomplete answers in the server-backed draft and identifies the affected step as incomplete
- **AND** it does not mark that step complete, expose Review as valid, transition onboarding state, or treat the draft as submitted

#### Scenario: Conditional follow-up answers are required for dependent selections

- **WHEN** an authorized partner editor selects `private_key_jwt`, an `Other` algorithm, or an unsupported signing, validation, encryption, or decryption capability answer
- **THEN** the portal requires the matching key-distribution detail, free-text algorithm field, roadmap answer, and approximate revisit date when applicable before the affected step can be marked complete or the configuration can be submitted
- **AND** incomplete draft persistence may retain the partial answer without presenting it as valid

#### Scenario: Offline key exchange rejects private key material

- **WHEN** a user supplies offline certificate or JWK content for `private_key_jwt`
- **THEN** the portal accepts only the public certificate or public JWK members required for registration
- **AND** it rejects private-key parameters, symmetric key values, credentials, or other secret key material before persistence
- **AND** a future requirement to collect private key material requires a separately approved secret-lifecycle and storage contract

#### Scenario: Missing security capabilities capture roadmap or risk follow-up

- **WHEN** an authorized partner editor answers `No` to message signing, signature validation, message encryption, or message decryption support
- **THEN** the portal captures whether the capability is on the product roadmap and, when applicable, an approximate revisit date
- **AND** selecting roadmap `no` records the negative answer without requiring an extra free-text note

### Requirement: Application-scoped RP configuration registration uses a recoverable multi-step flow

The portal SHALL implement the OIDC questionnaire as a PAT-019 route-per-step
flow beneath one authorized workspace, Application, and server-side RP
configuration in `draft`. Intermediate persistence SHALL update only that
draft, distinguish incomplete saved data from a completed step, and SHALL NOT
perform final submission. Only the explicit final submit action from a
completely valid Review state SHALL transition `draft` to `submitted`.

The configuration Edit entry SHALL use this lifecycle matrix:

| Current state | Edit behavior | Mutation behavior |
|---|---|---|
| `draft` | Resume the earliest incomplete permitted step | Permit authorized, conflict-protected draft writes |
| `submitted` or `under_review` | Return to the configuration hub with a localized locked-for-review explanation | No draft or registration mutation |
| `approved` or `launched` | Return to the configuration hub with a localized non-editable explanation | No draft or registration mutation |
| Missing, unknown, stale, parent-mismatched, or out-of-scope | Fail closed through safe detail, not-found, or denied behavior | No mutation |

For a server-backed draft, the flow SHALL pair its six-step progress indicator
with a separate semantic `Registration steps` navigation. Available completed
steps other than the current step SHALL be links, the current step SHALL be a
non-link identified with `aria-current="step"`, and prerequisite-blocked
future steps SHALL be labelled non-links. Availability SHALL come from server-
validated contiguous progress; the navigation SHALL NOT make the progress
indicator interactive or imply that validation can be skipped.

Choosing a completed step SHALL NOT silently save, validate, complete, or
submit current work. Back, completed-step links, Cancel, parent or breadcrumb
links, header destinations, and language switching SHALL preserve current input
or warn before any loss. The portal SHALL let the user remain on the current
step with that input when the warning is cancelled. Confirmed navigation that
cannot carry the current input SHALL use the last server-saved draft.

#### Scenario: User starts an RP configuration draft

- **WHEN** an authorized editor starts registration from `/workspaces/$workspaceUuid/applications/$applicationUuid/rp-configurations/new`
- **THEN** the portal opens Basics without inventing a configuration UUID or placeholder row
- **AND** the unsaved Basics route does not expose a completed-step link before a server-backed draft exists
- **AND** successful Basics validation creates one server-backed RP configuration in `draft` with the required parent Application, configuration name, Partner environment, and CanadaLogin environment
- **AND** the create request uses one opaque idempotency key for that new-flow attempt
- **AND** the created representation uses draft version `1`, records `basics` as the last completed step, and exposes opaque workspace, Application, and configuration UUIDs
- **AND** the portal opens the nested `registration/endpoints` route and can later resume safely

#### Scenario: Retried draft creation does not create a duplicate

- **WHEN** a valid Basics create request is retried with the same idempotency key, actor, workspace, Application, and normalized Basics payload including Partner environment after an ambiguous result
- **THEN** the backend returns the same RP-configuration draft rather than creating another record
- **AND** it does not increment, reset, or otherwise change draft version or completed-step state merely because the create request was retried
- **AND** reusing that key with different input or scope fails with safe `409` code `registration_draft_creation_conflict`
- **AND** the key contains no personal or questionnaire data and conveys no authorization

#### Scenario: Invalid Basics does not create a placeholder draft

- **WHEN** a user selects Continue on the nested new-configuration Basics route without a valid configuration name, Partner environment, CanadaLogin environment, or Application context
- **THEN** the page remains on Basics and displays an error summary plus field-level errors
- **AND** the backend creates no RP row, UUID, placeholder name, or onboarding transition
- **AND** the portal warns before navigation can discard unsaved input

#### Scenario: Valid Basics can establish a draft before exit

- **WHEN** a user selects Save and exit on Basics with a valid configuration name, Partner environment, CanadaLogin environment, and Application parent
- **THEN** the backend creates one server-backed RP configuration in `draft` and returns its UUID and draft version
- **AND** the portal returns to the RP-configuration hub or its Application-scoped list with a contained resume path
- **AND** invalid minimum Basics remains on the form without promising durable recovery

#### Scenario: User resumes an existing RP configuration draft

- **WHEN** an authorized user opens the nested Edit route for an RP configuration still in `draft`
- **THEN** the portal resumes at the earliest incomplete permitted canonical step
- **AND** a legacy Edit entry authorizes and redirects to that route rather than rendering the retired long questionnaire

#### Scenario: Draft API exposes typed hierarchy identifiers

- **WHEN** an authorized editor creates, reads, resumes, or updates a registration draft
- **THEN** the API response exposes public workspace, Application, and RP-configuration UUIDs, configuration name, nullable Partner environment for compatibility, CanadaLogin environment, onboarding state, draft version, last completed step, and typed authorized answers
- **AND** it does not expose internal integer IDs, repository models, untyped payloads, policy internals, secret key material, or fields outside authorized scope

#### Scenario: Migrated draft resumes from validated contiguous progress

- **WHEN** an existing draft predates registration-flow metadata and has no stored completed-step marker
- **THEN** the backend validates stored answers in recorded step order and derives only the last contiguous completed step
- **AND** non-contiguous later answers do not unlock a future step or Review
- **AND** missing or invalid data resumes at the earliest incomplete permitted step
- **AND** a missing Partner environment keeps Basics incomplete and blocks final submission until an authorized editor supplies a valid value

#### Scenario: Non-draft RP configurations are not editable through this flow

- **WHEN** an authorized user requests Edit for a configuration in `submitted`, `under_review`, `approved`, or `launched`
- **THEN** the portal returns to the configuration hub with the state-appropriate safe explanation
- **AND** it does not create or mutate a draft, revision, or effective registration
- **AND** an amendment workflow is not inferred from the forward-only states

#### Scenario: Unknown or stale lifecycle state fails closed

- **WHEN** flow entry or a write observes a missing, unknown, stale, changed, or parent-mismatched lifecycle resource
- **THEN** the portal uses the standard safe detail, not-found, conflict, or denied behavior
- **AND** it does not expose or mutate draft data

#### Scenario: Flow presents the recorded step sequence

- **WHEN** an authorized user progresses through a draft
- **THEN** the flow presents Basics, Endpoints, Client and access, Signing, Encryption, and Review as six ordered steps
- **AND** each step has one clear heading and only its questionnaire fields and dependent guidance
- **AND** Confirmation follows successful submission outside the six-step progress indicator

#### Scenario: Saved draft exposes completed-step navigation

- **WHEN** an authorized user opens or resumes a server-backed draft
- **THEN** a semantic navigation landmark labelled `Registration steps` presents all six localized step names in their recorded order
- **AND** each available completed step other than the current step is a link to its canonical nested route
- **AND** the current step is a non-link identified with `aria-current="step"`
- **AND** each prerequisite-blocked future step is a labelled non-link rather than an unavailable link or control
- **AND** Review becomes available only while every prerequisite step remains valid
- **AND** the progress indicator itself is not used as the step-navigation control

#### Scenario: Navigation away from a registration step protects unsaved input

- **WHEN** a user chooses Back, a completed-step link, Cancel, a parent/breadcrumb/header destination, or language switching and that navigation would discard input that differs from the last server-saved draft
- **THEN** the portal warns that the navigation will leave those unsaved changes behind
- **AND** cancelling keeps the user on the current step with the input intact
- **AND** confirming opens the selected destination using the last server-saved draft when the input cannot be carried safely
- **AND** route navigation does not implicitly save, validate, mark work complete, unlock Review, submit, or advance lifecycle

#### Scenario: Continue validates and saves only the current draft

- **WHEN** a user selects Continue on a registration step
- **THEN** the portal validates the current step and displays an error summary plus field-level errors when invalid
- **AND** valid input is saved to the server-backed draft before the next step opens
- **AND** future-step fields are not required merely to persist or complete the current step
- **AND** the transition does not submit or advance final onboarding state

#### Scenario: Stale draft write fails without overwriting newer work

- **WHEN** a user submits a draft write or final submission with an expected version older than the current draft and the lifecycle remains `draft`
- **THEN** the backend rejects it with `409` code `registration_draft_version_conflict`
- **AND** it does not merge, overwrite, submit, or disclose the newer draft through the stale request
- **AND** the page offers a safe reload path before changes can be retried

#### Scenario: Back and Save and exit preserve recoverable work

- **WHEN** a user selects Back or Save and exit after a draft exists
- **THEN** Back follows the unsaved-input protection before opening the previous permitted step and does not discard server-saved answers
- **AND** Save and exit may persist safe partial current-step answers while marking an invalid step incomplete
- **AND** partial persistence does not make Review valid or advance onboarding state
- **AND** Save and exit returns to the configuration hub or Application-scoped configuration list with a clear resume path

#### Scenario: Cancel preserves the last server-saved draft

- **WHEN** a user chooses Cancel during registration
- **THEN** the portal warns before discarding unsaved current-step input when it exists
- **AND** it leaves the last successfully saved draft available to resume
- **AND** it returns to the configuration hub or Application-scoped list without deleting or submitting the draft

#### Scenario: Earlier changes invalidate dependent answers visibly

- **WHEN** a user changes an earlier answer that makes later conditional answers invalid or inapplicable
- **THEN** the portal clears or invalidates those dependent answers according to questionnaire rules
- **AND** it identifies later steps that require review before submission
- **AND** the affected later steps cease to be completed-step links and Review relocks until contiguous progress is valid again

#### Scenario: Direct future-step access recovers safely

- **WHEN** a user requests a step not yet available because earlier steps are incomplete
- **THEN** the portal routes to the earliest incomplete permitted step
- **AND** it explains what must be completed without revealing another workspace, Application, configuration, or draft

#### Scenario: Review summarizes the pending submission

- **WHEN** all questionnaire steps are valid and the user opens Review
- **THEN** the page groups pending values into an itemized summary
- **AND** each group has a localized Change link to the corresponding completed step
- **AND** configuration name, parent Application, Partner environment, CanadaLogin environment, important consequences, and the single final submit action are clear

#### Scenario: Final submit occurs once

- **WHEN** an authorized user confirms final submission with `targetState` `submitted` and the expected draft version through the versioned onboarding-state contract
- **THEN** the backend rechecks authorization, workspace/Application/configuration ancestry, current `draft` state, and the complete active questionnaire
- **AND** it conditionally checks the version and transitions the RP configuration from `draft` to `submitted` exactly once in one transaction
- **AND** a retry observing the same configuration already submitted returns the authorized submitted representation without another transition, side effect, or audit event
- **AND** draft creation, saves, submission, and retry recovery do not call, provision, update, or synchronize IBM Verify or another external system
- **AND** success opens the nested Confirmation route

#### Scenario: Confirmation provides useful next steps

- **WHEN** final submission succeeds
- **THEN** Confirmation states the resulting registration status and what happens next
- **AND** it links to the RP-configuration hub, parent Application, and selected workspace as applicable
- **AND** it does not ask the user to submit the same draft again

#### Scenario: Refresh and network failure preserve safe recovery

- **WHEN** the user refreshes a step or a draft save fails because of a network or server error
- **THEN** the portal preserves the last server-saved draft and safely recoverable current input
- **AND** the affected step shows a scoped error and clear retry, save, or return action
- **AND** the error does not imply that unsaved input or final submission succeeded

#### Scenario: Session expiry resumes an authorized draft

- **WHEN** the session expires during registration and the user completes applicable admission flows again
- **THEN** the portal resumes the same draft and equivalent step when current workspace/Application/configuration authorization still permits it
- **AND** revoked or changed scope uses safe denied or parent-return behavior instead of rendering draft data

#### Scenario: Language switching keeps equivalent draft context

- **WHEN** a user changes official language from a registration step
- **THEN** the header language control opens the equivalent step for the same authorized draft
- **AND** saved input is retained and unsaved input is preserved or explicitly warned before loss
- **AND** step labels, completed/current/blocked navigation states, fields, hints, errors, Review, Change links, Confirmation, and accessible names have English and French parity
- **AND** configuration name, Partner environment, and other person-entered values are not translated or duplicated

#### Scenario: Sensitive questionnaire content stays out of unsafe client surfaces

- **WHEN** registration answers include a public certificate, public JWK, endpoint, or other potentially sensitive configuration data
- **THEN** the portal does not place those values in URLs, query parameters, analytics, diagnostic logs, or unstructured local storage
- **AND** backend authorization and the existing data-handling boundary apply to every read and write
- **AND** private or symmetric key material is rejected rather than stored

#### Scenario: Draft audit and operational events exclude answer values

- **WHEN** the backend records draft creation, successful save, stale-version conflict, denied write, or final submission
- **THEN** the event may identify actor reference, workspace/Application/configuration references, step ID, save mode, safe changed field names, result, timestamp, and correlation identifier
- **AND** it does not contain questionnaire values, contact values, certificate or JWK content, credentials, tokens, or unnecessary personal information

### Requirement: Application-scoped RP configurations expose usage and audit views

The portal SHALL provide focused Usage and bounded audit views for an RP
configuration beneath its owning workspace and Application. RP Admin, RP User
(Edit), and Read Only SHALL read only the results permitted by their active
workspace role. No partner role SHALL read another workspace's, Application's,
or configuration's results.

#### Scenario: Authorized partner role reviews RP configuration usage

- **WHEN** an RP Admin, RP User (Edit), or Read Only user opens the nested Usage route for an in-scope RP configuration
- **THEN** the portal loads the usage summary for the selected date or range state
- **AND** the request verifies workspace, Application, configuration, and reporting capability before returning data

#### Scenario: Authorized partner role reviews bounded RP configuration audit activity

- **WHEN** an RP Admin, RP User (Edit), or Read Only user opens the nested audit route and applies a bounded date range
- **THEN** the portal loads matching permitted events for that RP configuration
- **AND** any download remains constrained to the selected hierarchy and role

### Requirement: Applications show advisory readiness indicators

The system SHALL provide section-level completion indicators and an overall
readiness signal for the Application parent. RP Admin and RP User (Edit) SHALL
use the indicators while preparing and submitting the Application.
Read Only and CL Admin SHALL view permitted readiness/status without performing
partner-side edits.

The Application readiness calculation MAY summarize child RP-configuration
states as context but SHALL NOT merge them into one configuration or create a
separate Application review result for each CanadaLogin environment.

The focused Readiness page SHALL show one compact localized overall status and
completion count followed by simple semantic rows for each required area. Each
row SHALL identify the area, its visible textual status, and one permitted
direct next-step link when work remains. It SHALL NOT wrap each basic status
fact in a large card or Notice. Notices SHALL remain available for actual
loading, error, or consequential feedback states. Optional production-check
explanation MAY use `GcdsDetails` or a short supporting section, but required
status and next steps SHALL remain visible.

#### Scenario: Incomplete Application is flagged

- **WHEN** an authorized role opens an Application with missing required onboarding data or no confirmed required contact
- **THEN** the portal identifies incomplete sections or required inputs
- **AND** it keeps the Application below a submit-ready state

#### Scenario: Readiness page uses a compact actionable breakdown

- **WHEN** an authorized role opens the focused Application Readiness page
- **THEN** the page shows a concise textual overall result and completed-area count without relying on colour alone
- **AND** each required area appears as a semantic row with area name, textual status, and a direct permitted next step when incomplete
- **AND** editable gaps link to their focused owner, such as Details edit or Contacts, rather than embedding those forms
- **AND** simple status facts are not each rendered as a large card or Notice

#### Scenario: Optional production guidance does not hide readiness

- **WHEN** the Readiness page includes production-check explanation or external-process guidance
- **THEN** optional supporting content may use `GcdsDetails` or a short supporting section
- **AND** every required readiness status, error, and primary next step remains visible outside the disclosure

#### Scenario: Incomplete readiness remains advisory in MVP2

- **WHEN** an RP Admin or RP User (Edit) submits or continues work on an Application that is not submit-ready
- **THEN** the portal preserves incomplete indicators for partner and oversight visibility
- **AND** any hard gating decision remains outside Partner Portal for MVP2

#### Scenario: Complete Application is marked submit-ready

- **WHEN** an RP Admin or RP User (Edit) completes required Application sections and confirmed contacts
- **THEN** the portal marks the Application submit-ready
- **AND** it uses that status in the Application hub, onboarding summaries, and review context

#### Scenario: Child configuration state contributes context without replacing parent readiness

- **WHEN** an Application owns zero, one, or several RP configurations in different lifecycle states
- **THEN** the Readiness page may show a separate summary of those child states
- **AND** one child's environment or lifecycle does not overwrite another child or redefine the parent Application's canonical metadata

### Requirement: Environment progression remains explicit per named RP configuration

The system SHALL allow independent Test, Staging, and Production RP
configurations under one Application. Progression SHALL select one explicit
source configuration and create a distinct named target configuration. The
target SHALL receive an explicitly entered Partner environment; progression
SHALL NOT copy or infer it from the source. It SHALL NOT infer a unique source
or target from CanadaLogin environment and SHALL NOT overwrite an existing
same-environment configuration.

RP Admin and RP User (Edit) SHALL prepare and request progression. CL Admin
SHALL record internal production review outcomes. Read Only SHALL view
permitted progression status without mutation.

#### Scenario: Test and staging RP configuration creation remains allowed

- **WHEN** an RP Admin or RP User (Edit) creates or updates a named configuration targeting Test or Staging
- **THEN** the portal allows that work without requiring a Production approval outcome first
- **AND** another configuration in the same CanadaLogin environment does not block it when the normalized name differs

#### Scenario: Partner can start at staging when test is unnecessary

- **WHEN** an RP Admin or RP User (Edit) creates a Staging configuration and Test is not required
- **THEN** the portal allows the onboarding record to proceed without a Test configuration
- **AND** it preserves the chosen Application, configuration identity, Partner environment, and CanadaLogin environment path

#### Scenario: Test to staging progression creates a distinct named target

- **WHEN** an authorized editor requests progression from one selected Test configuration to Staging
- **THEN** the portal requires a valid target configuration name and target Partner environment and creates a distinct Staging draft
- **AND** it records the source configuration UUID and copies only allowlisted reusable answers
- **AND** it does not copy or infer Partner environment from the source configuration
- **AND** it does not overwrite or implicitly select another existing Staging configuration
- **AND** it marks the progression as self-serve

#### Scenario: Staging to production progression creates a reviewed target

- **WHEN** an authorized editor requests progression from one selected Staging configuration to Production
- **THEN** the portal requires a valid target configuration name and target Partner environment, creates a distinct Production draft, and records the selected source UUID
- **AND** it does not copy or infer Partner environment from the source configuration
- **AND** it creates or associates the review-tracked promotion request with that chosen Production target
- **AND** it does not treat the target as approved or launched until CL Admin records the review outcome

#### Scenario: Several promotion families coexist

- **WHEN** one Application has several Test, Staging, or Production configurations
- **THEN** each progression and review identifies its source and target configuration UUIDs
- **AND** matching CanadaLogin environments or names in another environment do not imply lineage, replacement, or approval

#### Scenario: Legacy source does not supply the target Partner environment

- **WHEN** an authorized editor progresses an in-scope retained source whose Partner environment is `Not provided`
- **THEN** the source remains selectable when the editor supplies a valid Partner environment for the new target
- **AND** progression does not copy, infer, or require remediation of the missing source value as a precondition for creating that target

### Requirement: CL Admin explicitly adopts one retained RP registration into one Application

The portal SHALL require CL Admin to select one active Partner workspace and
one active Application in that workspace before adopting a retained provider
candidate. The backend SHALL atomically revalidate and lock the candidate,
workspace, and Application; derive Department from the workspace; require or
generate a valid configuration name; preserve an unknown Partner environment
unless an authorized evidenced owner supplies it; fill only missing allowlisted
non-secret fields; preserve the stable local RP UUID and provider application
ID; and link the retained row as an RP configuration of that Application.

Existing portal audit history and MVP1 secret-lifecycle audit records SHALL
remain associated with the retained local RP UUID. Provider owner metadata,
name similarity, and CanadaLogin environment SHALL NOT select a user, role,
workspace, Application, or permission.

#### Scenario: CL Admin adopts an eligible retained RP configuration

- **WHEN** CL Admin confirms an eligible candidate, selects an active workspace and Application in that workspace, and supplies any unresolved required configuration name
- **THEN** the portal links the retained row to that workspace, Application, and inherited Department
- **AND** it records Partner environment only when an authorized evidenced owner explicitly supplied the value
- **AND** otherwise it preserves localized `Not provided` until an RP Admin or RP User (Edit) confirms the label through focused metadata management
- **AND** it fills only missing allowlisted non-secret metadata from the refreshed provider projection
- **AND** it preserves the local RP UUID, provider application ID, non-empty local values, and existing audit records

#### Scenario: Same Application adoption request is retried

- **WHEN** the client repeats a completed adoption request for the same retained RP, workspace, and Application after an ambiguous response
- **THEN** the portal returns the current adopted representation without a duplicate record or linkage side effect
- **AND** the existing local and audit identifiers remain unchanged

#### Scenario: Candidate was linked to a different Application concurrently

- **WHEN** adoption revalidation finds that the retained RP is already linked to a different workspace or Application
- **THEN** the portal returns `409` with a stable conflict code
- **AND** it does not move, clone, relabel, or partially update the retained record

#### Scenario: Selected workspace or Application is unavailable

- **WHEN** the selected workspace or Application is missing, deleted, mismatched, or otherwise ineligible for partner adoption
- **THEN** the portal returns a safe validation or not-found response
- **AND** the retained candidate remains unlinked and unchanged

## MODIFIED Requirements

### Requirement: Checklist readiness and process links are visible before production progression

The system SHALL make Application-level onboarding checklist progress,
external evidence references, and contextual process links visible on the
focused Application Readiness page before a named RP configuration progresses
toward Production. Configuration-specific progression context SHALL identify
the selected Application, source configuration when applicable, and target
configuration without inferring identity from environment.

RP Admin and RP User (Edit) SHALL update permitted partner-owned checklist
inputs. Read Only SHALL view them. CL Admin SHALL view and record permitted
internal review outcomes on the capability-gated Application Internal review
page without partner secret access. The compact Application hub MAY summarize
readiness but SHALL NOT duplicate the full checklist or review controls.

#### Scenario: Workspace admin reviews production prerequisites

- **WHEN** an authorized partner user opens Application Readiness or the progression task for a named RP configuration preparing for Production
- **THEN** the portal displays the checklist, external evidence-reference status, and relevant process links permitted to that role
- **AND** it identifies the parent Application and selected configuration context

#### Scenario: Missing prerequisites are highlighted before production progression

- **WHEN** tracked checklist items or external evidence references remain incomplete
- **THEN** the portal highlights the missing prerequisites before submission or resubmission
- **AND** the hard gate remains outside Partner Portal for MVP2

### Requirement: Partner workspace access uses canonical workspace-scoped roles

Partner workspace authorization SHALL use RP Admin, RP User (Edit), or Read
Only from the canonical partner access-grant model. Each role SHALL apply to
every Application and RP configuration in the assigned workspace. The legacy
values `workspace_admin` and `workspace_member` SHALL NOT be accepted,
displayed, or used for authorization after cutover, and no Application- or
RP-configuration-specific grant is introduced by this hierarchy.

RP Admin SHALL administer workspace metadata, Applications, contacts, RP
configurations, partner secrets, partner reports, and permitted staff
invitations. RP User (Edit) SHALL edit Applications, contacts, and RP
configurations; use permitted secret workflows; submit partner-owned workflow
metadata; and read reports without managing roles or invitations. Read Only
SHALL receive permitted Application metadata, contact, configuration, usage,
and reporting reads without mutation or secret access.

CL Admin SHALL bootstrap a workspace and its first RP Admin, view authorized
cross-workspace metadata and status, and perform internal Application review
actions without retrieving RP secret values or performing partner-side
configuration changes.

Where existing requirement names or scenarios use workspace administrator or
owner as a capability description, that description SHALL resolve through
this canonical matrix and SHALL NOT create a fifth product role.

#### Scenario: RP Admin manages partner workspace operations

- **WHEN** an RP Admin performs a supported workspace, Application, contact, RP-configuration, secret, reporting, or staff-invitation operation in the assigned workspace
- **THEN** the portal permits the operation within that workspace and verifies any child resource through its complete ancestry
- **AND** the role does not grant platform or another workspace's authority

#### Scenario: RP User Edit manages configuration without roles or invitations

- **WHEN** an RP User (Edit) performs a supported Application, contact, RP-configuration, secret, promotion-request, or reporting operation in the assigned workspace
- **THEN** the portal permits the operation within that workspace and verifies any child resource through its complete ancestry
- **AND** the user cannot mutate workspace roles, invitations, or internal review outcomes

#### Scenario: Read Only receives view-only workspace access

- **WHEN** a Read Only user opens permitted workspace metadata, Application details, contacts, RP configuration, usage, or aggregate reporting in the assigned workspace
- **THEN** the portal returns the permitted read-only data
- **AND** no mutation, secret value, or internal review note is available

#### Scenario: CL Admin bootstraps without partner secret authority

- **WHEN** a CL Admin creates or reviews partner metadata and assigns the first RP Admin
- **THEN** the portal permits the applicable global operation whether or not an Application or RP configuration exists yet
- **AND** it does not expose client credentials, secret values, or partner secret lifecycle controls

#### Scenario: Revoked partner assignment ends workspace access

- **WHEN** a user's active partner assignment for one workspace is revoked
- **THEN** the next protected request no longer receives access to that workspace or its Applications and RP configurations through that assignment
- **AND** access to other independently assigned workspaces remains unchanged

### Requirement: Workspace Access replaces the legacy Members destination

The portal SHALL use `/workspaces/$workspaceUuid/access` as the canonical
user-facing workspace destination for role assignments and workspace-owned
invitation management made available by the canonical authorization model.
Invitation creation SHALL remain available after a workspace exists even when
the workspace has no Application or RP configuration. An Application or RP-
configuration entry point MAY link to Workspace Access, but it SHALL NOT host
or scope a separate access-management model. Discovery SHALL use the workspace
hub or contextual parent links and SHALL NOT require a persistent workspace
side-navigation rail.

The page SHALL apply the actor's delegation boundary: CL Admin MAY manage RP
Admin, RP User (Edit), and Read Only in the selected workspace; RP Admin SHALL
manage only RP User (Edit) and Read Only in the RP Admin's assigned workspace;
lower partner roles SHALL NOT mutate assignments or invitations.

#### Scenario: Authorized user opens workspace Access

- **WHEN** an authorized user chooses Access from a workspace hub or another permitted workspace-scoped route
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
- **THEN** the workspace hub and other discovery surfaces omit the Access destination
- **AND** a direct request fails through the standard safe authorization behavior without revealing assignment or invitation data

#### Scenario: Access data stays on safe surfaces

- **WHEN** the Access page reads or changes assignment or invitation data
- **THEN** the portal exposes only the minimum permitted user and lifecycle fields for the selected workspace
- **AND** it does not place email addresses, invitation tokens, assignment payloads, or authorization context in route parameters, analytics, diagnostic body logs, or real-data fixtures
- **AND** audit metadata for a consequential access action excludes invitation secrets and unnecessary personal information

#### Scenario: CL Admin invites the first RP Admin before application work

- **WHEN** a CL Admin opens Access for an existing workspace with no Applications or RP configurations
- **THEN** the portal allows the CL Admin to create an RP Admin invitation for that workspace
- **AND** the workflow does not require placeholder Application data, a placeholder RP configuration, or an IBM Verify operation

#### Scenario: RP Admin manages only lower roles in workspace context

- **WHEN** an RP Admin opens Access in the assigned workspace
- **THEN** the portal permits assignment and invitation actions only for RP User (Edit) and Read Only
- **AND** RP Admin and cross-workspace actions remain unavailable and denied

### Requirement: CL Admin reviews unassigned MVP1 RP registration candidates

The portal SHALL provide a CL Admin-only view of existing, non-deleted local
RP registration records that have no workspace or Application parent and have
a stable IBM Verify application ID. These retained records are adoption
candidates, not partner-visible Applications. The candidate list SHALL use
local portal data only and SHALL NOT call IBM Verify for every row. It SHALL
NOT expose internal database IDs, application owners, credentials, secret
values, raw provider payloads, or IBM audit history.

#### Scenario: CL Admin opens the adoption candidate list

- **WHEN** an active CL Admin opens the existing-RP adoption task after Partner workspaces and Applications have been created
- **THEN** the portal lists eligible unassigned local MVP1 RP records using public RP UUID, safe operational label, stable IBM application ID, and metadata-completeness state
- **AND** listing the candidates performs no IBM Verify request

#### Scenario: No unassigned registrations remain

- **WHEN** no active local RP record meets the adoption-candidate rules
- **THEN** the portal shows a localized empty state explaining that there are no registrations to adopt
- **AND** it provides a return path to Workspaces

#### Scenario: Partner role requests adoption candidates

- **WHEN** an RP Admin, RP User (Edit), Read Only, unauthenticated user, or user without active CL Admin requests the candidate route or API
- **THEN** the portal denies the request before returning candidate data or calling IBM Verify
- **AND** client-controlled role, owner, workspace, or Application values cannot satisfy the check

### Requirement: CL Admin previews safe missing metadata from IBM Verify

For one eligible retained RP-registration candidate, the portal SHALL retrieve
IBM Verify application detail using the stable IBM application ID and reduce
it to an explicit allowlist of non-secret RP-configuration metadata. The
preview SHALL identify configuration values that are missing locally and may
be filled, values already present locally and preserved, and non-empty
differences requiring later manual review. Bilingual public Application names
and other Application-owned metadata SHALL come from the explicitly selected
Application parent and SHALL NOT be copied into the configuration as a second
canonical value.

Every real IBM Verify read or write SHALL remain owned by the separately
governed IBM-interactions package. This workflow SHALL consume only that
package's validated, typed non-secret projection and SHALL fail closed when no
adapter is available. The portal RP-configuration form and this adoption
workflow SHALL NOT call or update IBM Verify directly.

The portal SHALL NOT return or persist IBM application owners, client
credentials, current or rotated secret values, raw upstream payloads, or IBM
audit history. A non-empty portal value SHALL NOT be overwritten by the
preview or adoption operation.

#### Scenario: Selected candidate has missing non-secret metadata

- **WHEN** CL Admin opens an eligible candidate whose local record lacks allowlisted configuration metadata and IBM Verify returns that metadata
- **THEN** the preview identifies the missing fields that can be filled during adoption
- **AND** it excludes owners, credentials, secrets, raw provider payloads, IBM audit history, and duplicate canonical Application metadata

#### Scenario: IBM and portal contain different non-empty values

- **WHEN** IBM Verify returns an allowlisted value that differs from a non-empty local portal value
- **THEN** the preview preserves the portal value and identifies the field as a safe conflict for follow-up
- **AND** neither preview nor adoption silently overwrites the local value or the selected Application's canonical metadata

#### Scenario: IBM Verify is unavailable or returns unsafe data

- **WHEN** the selected candidate cannot be retrieved, the provider is unavailable, or the response is malformed or contains secret-bearing fields
- **THEN** the portal returns a safe unavailable or retry state without exposing the upstream body
- **AND** the local candidate remains unmodified and unlinked

### Requirement: Registration validation failures remain actionable and preserve draft recovery

Completing an Application-scoped RP-configuration registration step SHALL
distinguish correctable validation from a draft load, concurrency, network, or
persistence failure. A correctable `422` SHALL keep the user on the current
step, preserve entered answers and the last server-saved draft/version, and
present a localized error summary with safe field-level feedback when field
locations are returned. It SHALL NOT describe the draft as unavailable or
imply that server-saved answers were lost.

Any client- or server-side validation failure from an action that requires
valid answers SHALL present one localized error summary at the top of the
associated form and move focus to that summary. Summary entries SHALL follow
question order and, for an error tied to a question, SHALL link to the affected
control or choice group. The same specific, actionable localized message SHALL
appear in the summary and in the question context after its label or legend
and hint and before the response control or choice group. The error SHALL be
programmatically associated with the affected control or group. A known
correction SHALL NOT be replaced by generic feedback such as `Check this
answer`.

This behavior SHALL apply to Basics, Endpoints, Client and access, Signing,
Encryption, and complete-questionnaire validation from Review. Correcting one
answer SHALL clear only its resolved error and SHALL preserve every other
unresolved error and summary link. A cross-step or form-level validation error
without a safe field location SHALL remain a specific summary item and SHALL
NOT link to an unrelated control. Network, service, authorization, ancestry,
optimistic-concurrency, and persistence failures SHALL remain distinct from
answer-validation feedback.

When complete-questionnaire validation from Review finds errors on more than
one route-per-step page, the portal SHALL open the earliest invalid step and
SHALL render only that step's errors in its local summary and question
contexts. Other invalid steps SHALL remain visibly pending or unavailable
until their prerequisites are valid. A summary SHALL NOT link to a control that
is not rendered on the current route.

Frontend request serialization and backend validation SHALL share or test one
documented registration-draft contract, including Application ancestry,
configuration name, Partner environment, CanadaLogin environment, field aliases, enum values,
conditional prerequisites, repeatable URL list shapes, `stepId`, `saveMode`,
and `expectedDraftVersion`.

#### Scenario: Valid Endpoints answers advance registration

- **WHEN** an authorized partner editor submits a representative valid Endpoints `completeStep` payload for a current server-backed RP-configuration draft in an authorized Application
- **THEN** the backend accepts the documented frontend-serialized request after verifying workspace, Application, and configuration ancestry
- **AND** it saves the Endpoints answers, increments the draft version, marks only the valid step complete, and returns the draft needed to advance

#### Scenario: Correctable Endpoints validation stays on Step 2

- **WHEN** the Endpoints `PATCH` returns `422` for one or more correctable answers
- **THEN** the frontend remains on Endpoints and focuses a localized error summary linked to affected controls
- **AND** it preserves the user's entered values and the last server-saved draft/version
- **AND** it does not show the generic draft-load or unavailable-draft message

#### Scenario: Correctable validation on a rendered step is shown in context

- **WHEN** a validation-gated action on Basics, Endpoints, Client and access, Signing, or Encryption finds one or more correctable answer errors
- **THEN** the portal remains on that step and moves focus to the error summary at the top of its form
- **AND** summary entries follow question order and link to each affected control or choice group rendered on that route when a safe field location exists
- **AND** each affected question repeats the same specific localized correction after its label or legend and hint and before its response control or choice group
- **AND** each question-level error is programmatically associated with its affected control or group
- **AND** the portal preserves entered values and the last server-saved draft/version without marking the affected step complete

#### Scenario: Review validation recovers one rendered step at a time

- **WHEN** complete-questionnaire validation from Review finds correctable errors on one or more registration-step routes
- **THEN** the portal opens the earliest invalid permitted step and focuses that step's local error summary
- **AND** the summary and inline feedback contain only errors for questions rendered on that route
- **AND** later invalid steps remain visibly pending or unavailable until contiguous progress reaches them
- **AND** no summary link targets a control on another unrendered route
- **AND** the last server-saved draft/version and entered values remain recoverable without submission or lifecycle advancement

#### Scenario: Correcting one question preserves other validation errors

- **WHEN** a step shows errors for more than one question and the user corrects one affected answer
- **THEN** the resolved question's inline error and summary entry are cleared when that answer becomes valid
- **AND** every other unresolved inline error and ordered summary link remains available
- **AND** the user is not required to resubmit merely to rediscover errors that were unrelated to the corrected answer

#### Scenario: Form-level validation does not target an unrelated question

- **WHEN** complete-questionnaire or cross-step validation returns a specific error without a safe field location
- **THEN** the error remains in the localized summary with a route-level recovery explanation when applicable
- **AND** it does not create a false link, inline message, or invalid state on an unrelated control

#### Scenario: Contract drift is caught before release

- **WHEN** frontend registration serialization or backend request aliases,
  enums, ancestry fields, prerequisites, or list shapes change
- **THEN** a cross-stack contract test submits the actual frontend-shaped
  Endpoints request to backend validation
- **AND** an incompatible change fails verification rather than surfacing only
  as an unexplained runtime `422`

#### Scenario: Non-validation save failure remains recoverable

- **WHEN** the Endpoints save fails because of a network, service, ancestry, concurrency, or unexpected persistence error
- **THEN** the frontend shows a scoped localized retry or safe-unavailable notice distinct from field validation and draft-load failure
- **AND** it preserves entered values and the last server-saved draft without advancing or marking the step complete

#### Scenario: Registration validation logs remain safe and traceable

- **WHEN** the backend accepts or rejects a registration step
- **THEN** structured logs include the safe actor reference, workspace, Application, and RP-configuration identifiers, step, save mode, safe changed or invalid field names, result, stable error code when applicable, and request/correlation identifier
- **AND** logs exclude questionnaire values, URLs, certificates, JWK content, credentials, tokens, private keys, contact values, and unnecessary personal information

### Requirement: Onboarding lifecycle state is tracked across core onboarding records

The system SHALL track onboarding state for workspaces, Applications, and RP
configurations using `draft`, `submitted`, `under_review`, `approved`, and
`launched` where that lifecycle applies. RP Admin and RP User (Edit) SHALL
prepare and submit partner-owned records. CL Admin SHALL perform internal
review-only transitions. Read Only SHALL view permitted state without changing
it.

Application readiness and internal review belong to the Application parent.
An RP configuration retains its own technical registration and progression
state and SHALL NOT create a second copy of the Application's public metadata
or internal review result.

#### Scenario: New onboarding records start in draft

- **WHEN** an RP Admin or RP User (Edit) creates a workspace-owned Application or RP configuration
- **THEN** the new record starts in draft until intentionally submitted

#### Scenario: Submitted onboarding records expose review state

- **WHEN** an RP Admin or RP User (Edit) submits a draft onboarding record
- **THEN** the system records submitted
- **AND** it makes that state visible to authorized roles in the record's owning hierarchy

#### Scenario: Reviewed onboarding records move through governed states

- **WHEN** a CL Admin advances an authorized submitted onboarding record
- **THEN** the system can move the applicable record through under_review, approved, and launched as the outcome changes
- **AND** an Application review and an RP-configuration promotion remain distinct traceable decisions

#### Scenario: Unauthorized actor cannot advance review-only states

- **WHEN** an RP Admin, RP User (Edit), or Read Only user attempts to move a record into under_review, approved, or launched
- **THEN** the system denies the transition
- **AND** it preserves the current state

### Requirement: Out-of-band production review remains traceable

The system SHALL track promotion status and external review references when
CanadaLogin approval occurs outside the portal. A request SHALL identify the
parent Application, the selected source configuration when one exists, and the
chosen Production target configuration. RP Admin and RP User (Edit) SHALL
submit permitted partner-owned request metadata. CL Admin SHALL record the
internal review outcome. Read Only SHALL view permitted status without
changing it.

#### Scenario: Promotion request captures review metadata

- **WHEN** an RP Admin or RP User (Edit) creates or updates a Staging-to-Production request
- **THEN** the portal stores the parent Application, selected source and Production target configuration identifiers, current promotion status, external review reference, reviewing CL Admin identity or team metadata, and relevant timestamps
- **AND** it does not infer source or target identity from CanadaLogin environment alone

#### Scenario: Platform admin records production review outcome

- **WHEN** a CL Admin records the latest out-of-band Production review result for the chosen target configuration
- **THEN** the portal updates the tracked promotion status and review metadata
- **AND** partner roles cannot perform the review-only transition

#### Scenario: Production-bound record cannot appear approved without review trace

- **WHEN** a Production target lacks the required CL Admin review outcome or external reference
- **THEN** the portal does not present that configuration or its progression as approved or launched
- **AND** it identifies the missing review-traceability data to authorized roles without exposing internal notes to partner roles

### Requirement: Grant-authorized credential management is available for accessible RP applications

The portal SHALL provide canonical credential management at
`/workspaces/$workspaceUuid/applications/$applicationUuid/rp-configurations/$rpConfigurationUuid/manage-credentials`
for RP configurations inside an active Partner workspace and Application
scope. Existing grant-derived accessible-resource APIs MAY remain
compatibility adapters during migration, but the backend SHALL verify the
workspace, Application, RP-configuration ancestry and active grant before any
credential or secret retrieval. RP Admin and RP User (Edit) SHALL be
authorized. Read Only and CL Admin SHALL NOT discover or retrieve credential
or secret values.

#### Scenario: Authorized partner editor loads credential-management page

- **WHEN** an RP Admin or RP User (Edit) opens the nested Manage credentials route for an in-scope RP configuration
- **THEN** the page loads the minimum secret-free Application and configuration context, current client credentials, and rotated secrets for that configuration
- **AND** every credential and secret call verifies grant and full resource ancestry before provider retrieval

#### Scenario: Credential-management page routes inaccessible resources safely

- **WHEN** capability is denied, any route identifier is mismatched, or a scoped request returns not found or another unexpected error
- **THEN** the portal uses standard access-denied, safe not-found, or unexpected-error behavior respectively
- **AND** it does not reveal whether an out-of-scope Application, configuration, or secret exists

#### Scenario: Legacy credential route resolves safely

- **WHEN** an authorized editor follows a saved current-user or old workspace-scoped credential route during the compatibility period
- **THEN** the portal resolves the current owning workspace and Application through server scope and redirects to the nested credential route
- **AND** a missing, revoked, or mismatched resource receives the same safe unavailable response before secret retrieval

### Requirement: Grant-authorized partner editors can operate current and rotated secrets

The credential-management page SHALL allow RP Admin and RP User (Edit) to copy
the client ID, reveal and copy the current client secret, regenerate the
current secret, create named rotated secrets, and delete selected rotated
secrets for RP configurations inside their active workspace and Application
scope through authorized APIs. Read Only and CL Admin SHALL NOT perform those
operations, and authorization SHALL fail before any upstream secret retrieval
or mutation.

#### Scenario: Authorized partner editor regenerates the current client secret

- **WHEN** an RP Admin or RP User (Edit) confirms current-secret regeneration for an in-scope RP configuration
- **THEN** the portal calls the scoped rotation endpoint, refreshes the displayed credentials, and reveals the newly returned current secret
- **AND** every workspace, Application, and configuration identifier is revalidated before mutation

#### Scenario: Authorized partner editor creates and deletes rotated secrets

- **WHEN** an RP Admin or RP User (Edit) submits a rotation name or chooses an in-scope rotated secret for deletion
- **THEN** the portal creates or deletes the selected rotated secret through scoped API endpoints
- **AND** it refreshes the rotated-secret list for only that RP configuration

### Requirement: Grant-authorized MAU reporting is available for accessible RP applications

The portal SHALL provide the canonical RP-configuration Usage page at
`/workspaces/$workspaceUuid/applications/$applicationUuid/rp-configurations/$rpConfigurationUuid/usage`.
RP Admin, RP User (Edit), and Read Only SHALL read the report through a server-
authorized workspace/Application/configuration query. CL Admin and users
without an active permitted grant for the owning workspace SHALL receive the
same safe unavailable response as a missing resource.

The implementation MAY preserve the existing accessible MAU API as a
compatibility adapter while callers migrate, provided it verifies the same
full ancestry and workspace grant before returning report data.

#### Scenario: Authorized partner user opens MAU report page

- **WHEN** an RP Admin, RP User (Edit), or Read Only user opens nested Usage for an in-scope RP configuration
- **THEN** the page loads a default rolling date range and displays implemented usage results for exactly that configuration
- **AND** it identifies the localized parent Application, configuration name, Partner environment or localized `Not provided`, and CanadaLogin environment as context

#### Scenario: Authorized partner user filters and exports MAU data

- **WHEN** an authorized partner user applies a new date range on Usage
- **THEN** the page refreshes the report for that range
- **AND** it supports CSV export only for the loaded in-scope configuration data

#### Scenario: MAU report shows department context when available

- **WHEN** the scoped Usage response includes the Department name inherited from the workspace
- **THEN** the page displays the localized Department label with that name above the results
- **AND** a conflicting legacy RP Department value does not override workspace scope

#### Scenario: Legacy MAU report route resolves safely

- **WHEN** an authorized partner user follows a saved current-user or old workspace-scoped MAU route during the compatibility period
- **THEN** the portal resolves the owning workspace and Application and redirects to nested Usage
- **AND** it does not disclose or return report data for a missing, revoked, mismatched, or out-of-scope resource

### Requirement: Workspace entry pages provide a scoped task hierarchy

The portal SHALL use `/workspaces` as the authorized Partner workspace chooser
and `/workspaces/$workspaceUuid` as the task-oriented overview and entry page
for the selected workspace. The selected workspace page SHALL link to focused
child routes and SHALL NOT embed their full tables, forms, reports, or access
controls. Workspace children SHALL use the normal focused page layout without
a persistent left-side navigation rail and SHALL provide stable translated
parent return links.

#### Scenario: User selects an authorized workspace

- **WHEN** an authenticated user opens `/workspaces`
- **THEN** the page lists only workspaces available through canonical authorization
- **AND** each workspace link uses the workspace name as its primary label
- **AND** selecting a workspace opens `/workspaces/$workspaceUuid`

#### Scenario: User opens the workspace task hub

- **WHEN** an authorized user opens `/workspaces/$workspaceUuid`
- **THEN** the page identifies the selected workspace by name in one H1 or equivalent page-heading context
- **AND** it identifies itself as the selected-workspace overview and groups only available Applications, Access, Reports, and Settings child-task destinations under clear translated headings
- **AND** Applications replaces the peer `Application information` and `RP applications` destinations
- **AND** each available destination is one responsive single-destination GC Design System card with a concise description

#### Scenario: Workspace hub stays focused on task selection

- **WHEN** an authorized user opens `/workspaces/$workspaceUuid`
- **THEN** the page may show concise sourced workspace status or context
- **AND** empty functional groups are omitted and cards follow logical source and keyboard order
- **AND** it does not embed Application or RP-configuration lists, Access management, reports, settings forms, or audit results

#### Scenario: Workspace children preserve parent navigation

- **WHEN** an authorized user opens a first-level workspace child route
- **THEN** breadcrumbs identify Home, Partner workspaces, and the selected workspace as the stable parent hierarchy when breadcrumbs apply
- **AND** the breadcrumb trail omits the current child page
- **AND** a visible translated parent link returns to `/workspaces/$workspaceUuid` without relying on browser history
- **AND** the page does not render a persistent workspace side-navigation rail

#### Scenario: Workspace children use a focused responsive layout

- **WHEN** an authorized user opens a workspace child route on desktop, mobile, or a zoomed viewport
- **THEN** focused content uses the normal page container without a reserved left-navigation column
- **AND** the page preserves logical keyboard order, visible focus, and reflow without clipped content or horizontal scrolling

#### Scenario: Raw workspace identifiers are not primary UI labels

- **WHEN** workspace context appears in a heading, breadcrumb, account context, link, status summary, return link, or confirmation
- **THEN** the portal uses the authorized workspace name or a neutral localized fallback as the primary label
- **AND** it does not present the raw workspace UUID as a friendly workspace name

#### Scenario: Workspace task visibility does not replace authorization

- **WHEN** canonical context does not expose a workspace task to the user
- **THEN** the workspace hub and other discovery surfaces omit that task label
- **AND** direct requests continue through route and backend authorization for the selected hierarchy

#### Scenario: Workspace pages use server-scoped resources

- **WHEN** the chooser, hub, or a workspace child requests data
- **THEN** the backend applies current session, capability, selected workspace, and object ancestry before returning resources
- **AND** the browser does not receive a wider cross-workspace dataset and reduce it through client-side filtering
- **AND** stale browser session or authorization state does not grant route or API access

### Requirement: RP registration adoption is auditable and fail closed

The portal SHALL record a CL Admin adoption decision with actor, retained local
RP UUID, destination workspace UUID, destination Application UUID,
configuration name, outcome, correlation identifier, timestamp, and safe
changed-field names. Audit and operational logs SHALL NOT contain secrets,
credentials, owners, raw provider payloads, unnecessary personal information,
or unhashed provider identifiers.

Authorization, candidate state, workspace and Application state, provider
projection validation, configuration-name validation, and transaction
integrity SHALL all succeed before the hierarchy link becomes effective.

#### Scenario: Successful adoption is audited

- **WHEN** a CL Admin adoption transaction commits
- **THEN** the portal records one minimized successful event associated with the retained RP, workspace, and Application
- **AND** the event contains no secret, owner, credential, contact, questionnaire-answer, or raw provider data

#### Scenario: Unauthorized or invalid adoption fails before mutation

- **WHEN** authorization, candidate eligibility, workspace/Application validation, provider validation, name validation, or concurrency checks fail
- **THEN** the portal creates no hierarchy link or partial metadata update
- **AND** it preserves safe denied or failed outcome and applicable audit behavior

## REMOVED Requirements

### Requirement: Application information and contacts are managed as workspace-owned records

**Reason**: The requirement treats Application information as a secondary
metadata record and permits contact management inside its long detail page.
The approved model makes Application the parent aggregate and gives contacts a
focused, non-bilingual person-identity contract.

**Migration**: Use `Partner workspaces own Applications as parent aggregates`,
`Application contacts use person identity fields and focused management`, and
the Application task-hub requirements. Preserve legacy contact values through
dual read and explicit confirmation.

### Requirement: Workspace-scoped RP applications represent one environment registration each

**Reason**: The requirement makes the Application link optional and describes
RP records as peer Applications. It also documents multiple records only for
different environments, which does not cover several partner configurations
connected to the same CanadaLogin environment.

**Migration**: Use `Applications own required named RP configurations`. Require
an Application parent, configuration name, and Partner environment for new
canonical records, preserve explicit `Not provided` compatibility for retained
records, permit multiple same-environment siblings, and keep provider
candidates outside the partner hierarchy until explicit adoption.

### Requirement: Workspace-scoped RP application registration follows the current OIDC questionnaire

**Reason**: Configuration Basics duplicates English and French public service
names and starts without an Application parent.

**Migration**: Use `Application-scoped RP configuration registration follows
the current OIDC questionnaire`. Inherit public names from the Application,
add required configuration identity, and preserve all other active
questionnaire constraints. Configuration identity includes the required
Partner environment on new canonical creates and final submission.

### Requirement: Workspace-scoped RP applications expose usage and audit views

**Reason**: Usage and audit remain valid features but must be scoped through an
Application-owned RP configuration rather than a workspace-level peer RP
record.

**Migration**: Use `Application-scoped RP configurations expose usage and
audit views` and migrate routes and authorization tests to the complete
workspace/Application/configuration hierarchy.

### Requirement: Application information records show advisory readiness indicators

**Reason**: `Application information` is now the Application parent, and the
readiness summary needs a compact hub status plus a focused breakdown.

**Migration**: Use `Applications show advisory readiness indicators` and the
Application task-hub requirement. Preserve advisory MVP2 semantics and all
section-level completion behavior.

### Requirement: Environment progression rules remain explicit per RP application environment

**Reason**: Environment cannot identify a unique configuration or successor
when several RP configurations for one Application may target the same
CanadaLogin environment.

**Migration**: Use `Environment progression remains explicit per named RP
configuration`. Select source and target configuration UUIDs, require a target
name and target Partner environment, record lineage, and never overwrite or
infer a unique environment record.

### Requirement: Workspace RP application registration uses a recoverable multi-step flow

**Reason**: The recoverable behavior remains required, but its entry, return,
identity, and draft routes currently use the workspace-level RP peer model and
duplicate Application names in Basics.

**Migration**: Use `Application-scoped RP configuration registration uses a
recoverable multi-step flow`. Preserve idempotency, optimistic concurrency,
save-and-return, validation, Review, submit-once, confirmation, provider
isolation, bilingual, and safe logging behavior under nested routes.

### Requirement: CL Admin explicitly links one retained RP to one workspace

**Reason**: Selecting only a workspace leaves a partner-visible retained RP
without the required Application parent and configuration identity.

**Migration**: Use `CL Admin explicitly adopts one retained RP registration
into one Application`. Require an active workspace and Application, preserve
the retained row and audit history, and do not infer parentage from provider
metadata or environment.

### Requirement: RP application summaries are consistent across authorized list surfaces

**Reason**: The requirement exists to synchronize `/your-applications` and the
selected-workspace RP list. The duplicate current-user page is retired, and
the new hierarchy needs distinct parent Application and child configuration
identities instead of the same RP summary on two pages.

**Migration**: Use `Application and RP configuration collections use focused
comparison tables`. Retain server-scoped authorization, one clear row action,
responsive table semantics, contextual creation, and secret-free contracts on
the canonical collection pages.
