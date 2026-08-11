# partner-portal-role-management Specification

## Purpose
Define the current reusable platform-role catalog, platform user-role assignment behavior, and the boundary between platform roles and workspace membership roles.
## Requirements
### Requirement: Platform administrators manage reusable portal roles

Platform administrators SHALL be able to create, list, update, and delete reusable platform roles from the administration experience and the roles API. Active role names SHALL remain unique among non-deleted role records.

#### Scenario: Platform admin creates a reusable role

- GIVEN a platform administrator is using the roles administration experience
- WHEN the administrator submits a new role name and optional description
- THEN the portal persists the role through `POST /api/v1/role`
- AND the role appears in the paginated roles list returned by `GET /api/v1/roles`

#### Scenario: Duplicate active role names are rejected

- GIVEN an active role already exists with a requested name
- WHEN a platform administrator attempts to create another active role with that same name
- THEN the system rejects the request as a duplicate
- AND the existing role record remains unchanged

#### Scenario: Platform admin updates a role

- GIVEN a reusable platform role exists
- WHEN a platform administrator edits that role from the administration experience
- THEN the portal updates the role through `PATCH /api/v1/role/{role_uuid}`
- AND the roles list refreshes to reflect the updated metadata

#### Scenario: Platform admin deletes a reusable role

- GIVEN a reusable platform role exists
- WHEN a platform administrator confirms deletion of that role from the administration experience
- THEN the portal deletes the role through `DELETE /api/v1/role/{role_uuid}`
- AND subsequent role reads no longer return that role as an active role record

### Requirement: Platform administrators manage user role assignments

Platform administrators SHALL be able to assign and remove one or more reusable platform roles for an existing user. User role assignment SHALL be additive, SHALL reject duplicate assignment of the same role to the same user, SHALL expose the user's assigned roles as a list-based admin read, and SHALL allow removing an assigned role without deleting the user record.

#### Scenario: Platform admin adds a role to a user

- GIVEN an existing user does not yet have a selected reusable platform role
- WHEN a platform administrator assigns that role from the user administration experience
- THEN the portal persists the assignment through `POST /api/v1/user/{user_uuid}/roles/{role_uuid}`
- AND the user record reflects the added role in subsequent admin reads

#### Scenario: Duplicate user role assignments are rejected

- GIVEN a user already has a selected reusable platform role
- WHEN a platform administrator attempts to assign that same role to the user again
- THEN the system rejects the duplicate assignment
- AND the user's existing role assignments remain unchanged

#### Scenario: Platform admin removes a role from a user

- GIVEN a user currently has an assigned reusable platform role
- WHEN a platform administrator confirms removal of that role
- THEN the portal removes the assignment through `DELETE /api/v1/user/{user_uuid}/roles/{role_uuid}`
- AND the user no longer carries that role in subsequent admin reads

#### Scenario: Platform admin reads all assigned roles for a user

- GIVEN an existing user has zero or more reusable platform roles assigned
- WHEN a platform administrator loads the user's assigned roles
- THEN the backend returns the active assigned roles as a list-based response
- AND the administration experience uses that list to manage assignment and unassignment flows

#### Scenario: Removing an unassigned role is rejected

- GIVEN a user does not have a selected reusable platform role assigned
- WHEN a platform administrator attempts to remove that role from the user
- THEN the system rejects the request
- AND the user's remaining role assignments stay unchanged

### Requirement: MVP2 authorization uses locally managed roles instead of the OIDC `application owners` group

After OIDC authentication establishes the user's identity, the portal SHALL authorize access from locally managed role assignments instead of deriving portal access from upstream `application owners` group membership.

#### Scenario: Local role assignments are not overwritten on sign-in

- GIVEN an existing user has locally managed portal roles assigned
- WHEN the user signs in through OIDC
- THEN the portal preserves the user's locally managed role assignments for authorization
- AND the sign-in flow does not replace those assignments solely from upstream group claims

#### Scenario: Upstream `application owners` membership does not grant portal access by itself in MVP2

- GIVEN a user has no locally managed portal role that authorizes portal access
- WHEN the user signs in with an upstream `application owners` group claim
- THEN the portal does not grant role-managed portal access from that claim alone

#### Scenario: Locally managed roles allow access without upstream `application owners` membership

- GIVEN an existing user has a locally managed portal role that authorizes portal access
- WHEN the user signs in without the upstream `application owners` group claim
- THEN the portal evaluates authorization from the user's locally managed roles
- AND the absence of that upstream group claim does not block access by itself

### Requirement: Workspace membership roles stay distinct from platform roles

Workspace membership roles MUST remain workspace-scoped membership attributes rather than reusable platform roles. Workspace membership changes SHALL continue to use workspace membership flows and SHALL only allow the supported workspace membership role values.

#### Scenario: Workspace member role changes stay within workspace membership management

- GIVEN a workspace administrator is managing members for one workspace
- WHEN the administrator adds or updates a workspace member role
- THEN the portal uses the workspace membership endpoints for that workspace
- AND the role value remains limited to `workspace_admin` or `workspace_member`
- AND the action does not create, delete, or assign a reusable platform role

