# Delta for partner portal role management

## MODIFIED Requirements

### Requirement: Canonical roles have fixed scope and permission boundaries

CL Admin SHALL be a global internal role. RP Admin, RP User (Edit), and Read
Only SHALL each be scoped to one Partner workspace and SHALL apply to every
Application and RP configuration in that workspace. A user MAY hold partner
roles in more than one workspace but SHALL hold at most one active partner role
in each workspace. A CL Admin account SHALL NOT concurrently hold an active
partner role.

The portal SHALL enforce this permission matrix:

| Role | Allowed capability families | Explicitly denied |
|---|---|---|
| CL Admin | Canonical Users and access; partner-workspace bootstrap; invite or assign any canonical partner role; fixed Role reference; safe cross-workspace Workspace/Application/RP metadata and checklist/CATS status; explicit Production-review outcomes; retained-RP discovery/adoption; oversight dashboard anchor | RP secret values; client credentials; secret lifecycle; partner-side Application/RP-configuration edit or copy; mutable role/catalog/policy administration; broad Verify administration; aggregate reporting; internal review notes/outcomes; generic audit browser |
| RP Admin | Workspace metadata; Applications and contacts; RP-configuration creation, editable-draft questionnaire changes, permitted top-level metadata changes, and copy; checklist inputs and CATS evidence availability; explicit Production-review request metadata; partner secrets and secret-change log; MAU/usage; invite or manage RP User (Edit) and Read Only in the assigned workspace | Reopen or mutate completed questionnaire answers through the draft flow; mutate CATS evidence before its mechanism is approved; assign RP Admin; CL Admin/global administration; cross-workspace oversight; Production-review approve/reject; aggregate reporting; generic audit browser |
| RP User (Edit) | Read/edit Applications and contacts; RP-configuration creation, editable-draft questionnaire changes, permitted top-level metadata changes, and copy; checklist inputs and CATS evidence availability; explicit Production-review request metadata; secret workflows and secret-change log; MAU/usage | Reopen or mutate completed questionnaire answers through the draft flow; mutate CATS evidence before its mechanism is approved; invitations; role assignment; CL Admin/global administration; cross-workspace oversight; Production-review approve/reject; aggregate reporting; generic audit browser |
| Read Only | Workspace/Application metadata; contacts; RP configuration and permitted copy lineage; checklist and CATS evidence availability; Production-review status; MAU/usage | Mutations; copy; review request submission; invitations; role assignment; secret values; secret lifecycle/change log; CL Admin/global administration; Production-review outcomes; aggregate reporting; internal review notes/outcomes; generic audit browser |

Every child-resource decision SHALL validate its Partner workspace,
Application, and RP-configuration ancestry as applicable. A child UUID or a
client-provided parent identifier SHALL NOT widen the workspace role. Copying
a configuration and requesting Production review SHALL remain separate
capabilities and neither one SHALL grant a review-outcome transition.

#### Scenario: CL Admin performs global administration without secret access

- **WHEN** a CL Admin uses Users and access, invitation/bootstrap, retained-RP adoption, oversight, or explicit Production-review outcome work
- **THEN** the portal permits the applicable global operation through its focused portal-owned contract
- **AND** the same CL Admin cannot retrieve an RP secret value, perform an RP secret lifecycle action, edit/copy partner-owned configuration answers, use an aggregate report or generic audit browser, or mutate role/catalog/policy definitions

#### Scenario: RP Admin manages one partner workspace

- **WHEN** an RP Admin performs permitted workspace, Application, contact, RP-configuration creation, editable-draft questionnaire change, top-level metadata change, copy, checklist-input or CATS-availability, Production-review request, secret, secret-change-log, MAU/usage, or lower-role access work in the assigned workspace
- **THEN** the portal permits the action within that workspace after validating complete resource ancestry
- **AND** the RP Admin cannot assign RP Admin, use CL Admin or cross-workspace oversight operations, record a Production-review outcome, or access removed aggregate/audit surfaces
- **AND** draft-edit authority does not reopen or mutate completed questionnaire answers

#### Scenario: RP User Edit changes partner configuration without invitation authority

- **WHEN** an RP User (Edit) changes a permitted Application, creates an RP configuration, edits its incomplete draft questionnaire, updates separately permitted top-level metadata, copies a configuration, or updates a contact, checklist input, Production-review request metadata, or permitted secret in the assigned workspace
- **THEN** the portal permits the action after validating complete resource ancestry
- **AND** the user may view authorized MAU/usage and the selected configuration's minimum secret-change log
- **AND** the user cannot manage invitations, roles, Production-review outcomes, aggregate reports, or generic audit browsing
- **AND** the user cannot reopen or mutate completed questionnaire answers through the draft flow

#### Scenario: Read Only sees permitted data without mutation or secrets

- **WHEN** a Read Only user opens permitted workspace metadata, Application details, contacts, checklist and CATS evidence availability, RP configuration, copy lineage, Production-review status, or MAU/usage in the assigned workspace
- **THEN** the portal returns the permitted read-only information
- **AND** the user cannot mutate or copy the workspace or its children, request Production review, retrieve or change an RP secret, download the secret-change log, use aggregate reports, or read internal review/audit records

#### Scenario: Partner role applies across its assigned workspace

- **WHEN** a partner user requests a permitted operation for any Application or RP configuration in the assigned workspace
- **THEN** the portal evaluates the request using that workspace-scoped partner role and complete resource ancestry
- **AND** no separate Application- or RP-configuration-specific role assignment is required

#### Scenario: Partner role does not cross workspace scope

- **WHEN** a partner user requests a protected resource in a workspace without an active partner assignment
- **THEN** the portal denies the operation through the applicable safe unavailable response
- **AND** the portal does not reveal protected workspace, Application, RP-configuration, invitation, review, report, or audit details from the other workspace

#### Scenario: One user has different roles in different workspaces

- **WHEN** a user holds RP User (Edit) in one workspace and Read Only in another
- **THEN** the portal applies the matching role independently in each workspace
- **AND** permissions from one workspace do not expand the other workspace role

#### Scenario: CL Admin and partner assignments cannot be combined

- **WHEN** an assignment operation would leave one user with both CL Admin and an active partner role
- **THEN** the portal rejects the conflicting assignment
- **AND** the existing valid assignments remain unchanged until an authorized actor resolves the conflict explicitly
