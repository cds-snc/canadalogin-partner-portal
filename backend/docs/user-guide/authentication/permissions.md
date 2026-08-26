# Permissions and Authorization

The Partner Portal uses four fixed product roles, server-owned capability
rules, and workspace/object scope checks. Authentication establishes identity;
it does not grant a role.

## Canonical roles

| Role code | Scope | Summary |
|---|---|---|
| `cl_admin` | Global | Manages access, partner bootstrap, oversight, and Production review decisions |
| `rp_admin` | Workspace | Manages partner access, invitations, configuration, secrets, and review requests |
| `rp_user_edit` | Workspace | Edits application/configuration data and manages permitted secret operations |
| `read_only` | Workspace | Reads workspace, application, configuration, and MAU data |

These codes and their capability matrix are defined in
`src/app/core/authorization.py`. They are product reference data, not a
runtime-editable role or policy catalog.

## Request authorization flow

Protected requests are authorized in layers:

1. The server-side session identifies the current local user.
2. The backend resolves active canonical assignments and workspace grants from
   PostgreSQL for the request.
3. Route-level Casbin checks apply the small code-owned coarse policy where a
   route uses `PermissionGuard`.
4. Capability and workspace/object checks run before protected data access or
   mutation.

An absent, conflicting, revoked, or wrong-workspace assignment fails closed.
OIDC group claims, legacy role identifiers, client-supplied permissions, and
mutable database policy rows do not grant authority.

## Code-owned Casbin resources

The current coarse Casbin policy grants CL Admin access to these resource and
action pairs:

- `roles`: read the fixed role reference;
- `rp_applications`: read the bounded application view;
- `tasks`: read and write background-task operations;
- `users_admin`: read and write access-administration operations; and
- `workspace`: read and write workspace administration operations.

Example route guard:

```python
@router.get("/roles")
@casbin_guard.require_permission("roles", "read")
async def read_roles(...):
    ...
```

Casbin is only the coarse route boundary. Services must still enforce the
capability and resource scope needed by the operation.

## Workspace-scoped capability checks

Partner roles are always tied to a workspace. A protected workspace operation
must pass the resource workspace UUID to the capability check. A grant for one
workspace never authorizes another.

```python
workspace, decision = await self._require_workspace_capability(
    db=db,
    current_user=current_user,
    capability=Capability.APPLICATION_INFORMATION_WRITE,
    workspace_uuid=workspace_uuid,
)
```

Use the existing authorization dependencies and service helpers rather than
re-implementing role comparisons in routes. In particular:

- do not trust a role, capability, workspace, or user identifier from the
  browser as authorization evidence;
- resolve the protected object and confirm its workspace before returning or
  changing it;
- return the same denied/not-found behaviour used by neighbouring routes to
  avoid cross-workspace disclosure; and
- resolve current assignment state for each protected request so revocation
  takes effect immediately.

## Role and invitation administration

The first CL Admin assignment is created only through the explicitly invoked,
idempotent `create_initial_cl_admin` bootstrap. Later assignments and partner
invitations use the authorized access-administration workflows.

Invitation acceptance authenticates the recipient, verifies the exact
normalized email against the invitation, and creates the canonical
workspace-scoped grant. Revoked, expired, already-used, or mismatched
invitations do not grant access.

## Rate limiting is not authorization

The Redis-backed rate limiter protects selected endpoints from repeated use.
It applies the configured default limit per actor and sanitized request path.
It does not select permissions, roles, subscription tiers, or feature access,
and there is no mutable tier/rate-limit catalog API. See
[Rate Limiting](../rate-limiting/index.md).

## Testing authorization changes

For every protected behaviour, cover the highest-value boundaries:

- allowed canonical role and matching workspace;
- missing or revoked assignment;
- role without the required capability;
- correct role in the wrong workspace;
- CL Admin global behaviour where explicitly supported; and
- safe response fields that do not expose internal authorization or provider
  identifiers.

Keep the canonical role matrix, route guards, service checks, tests, and API
documentation aligned whenever authorization behaviour changes.
