# partner-portal-workspace-and-rp-application-management Delta

## MODIFIED Requirements

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

- **WHEN** an authorized user views one RP configuration in an Application's collection
- **THEN** that row's one Action link is `View RP configuration` and opens the canonical task hub for the selected workspace, Application, and RP configuration
- **AND** an incomplete draft does not bypass the hub by opening Registration directly
- **AND** an authorized editor can continue the draft through the hub's state-appropriate `Resume setup` action
- **AND** a read-only user reaches the same permitted hub while mutation and credential tasks remain omitted according to capability

#### Scenario: Configuration creation is visible before the collection

- **WHEN** an RP Admin or RP User (Edit) opens one Application's RP configurations
- **THEN** a primary `Create RP configuration` action appears before the table
- **AND** when there are no rows, the same action appears inside the empty state
- **AND** the action is not presented only as an uncontained text link after the collection

#### Scenario: Small RP-configuration table omits unnecessary controls

- **WHEN** the RP-configuration collection is small and its default server order supports the task
- **THEN** it uses the same shared collection-table presentation as Applications, including a localized record count, sortable comparison columns, and a contained row destination
- **AND** Name, Partner environment, CanadaLogin environment, and Status are sortable while Action is not sortable
- **AND** it does not add filtering, pagination, bulk selection, or inline editing
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
