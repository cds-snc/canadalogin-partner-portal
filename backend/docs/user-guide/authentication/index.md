# Authentication & Security

Learn how the backend authenticates Partner Portal users with OIDC and server-side sessions.

## What You'll Learn

- **[User Management](user-management.md)** - Manage the authenticated user profile and portal-owned metadata
- **[Permissions](permissions.md)** - Implement role-based access control and authorization

## Authentication Overview

The only login path is OIDC. After a successful callback, the backend stores the authenticated user in a server-side Redis session and resolves the user from that session on protected routes. The browser cookie only carries the session identifier.

When the frontend and backend run on different origins in development, configure `OIDC_POST_LOGIN_REDIRECT` as an absolute frontend URL such as `http://localhost:3000/auth-complete`. A backend-relative path like `/auth-complete` would keep the browser on the backend origin.

If your identity provider returns `redirect_uri` mismatch errors (for example `CSIAQ0167E`), set `OIDC_REDIRECT_URI` in backend configuration to the exact callback URL registered for your OAuth client, including scheme, host, port, and path.

```python
@router.get("/auth/oidc/login")
async def oidc_login(request: Request):
    client = get_oidc_client()
    return await client.authorize_redirect(request, build_oidc_redirect_uri(request))


@router.get("/auth/oidc/callback")
async def oidc_callback(request: Request, db: AsyncSession):
    token = await get_oidc_client().authorize_access_token(request)
    user = await sync_oidc_user(db, token["userinfo"])
    request.session["user_uuid"] = str(user["uuid"])
    return RedirectResponse(url=settings.OIDC_POST_LOGIN_REDIRECT)
```

### Authorization Overview

Authorization for admin-heavy routes uses `casbin-fastapi-decorator` with per-route `PermissionGuard` decorators. Superusers map to the Casbin subject `admin`, and additional policies are loaded from the `access_policy` table.

Minimal RBAC is split into two Casbin resources:

- `roles`: create, list, update, and soft-delete role definitions
- `users_admin`: assign roles to users, manage tiers, and perform broader user administration

```python
@router.get("/tiers")
@casbin_guard.require_permission("tiers", "read")
async def read_tiers(...):
    ...
```

## Key Features

### OIDC and Session System
- OIDC discovery-based login through Authlib
- Redis-backed server-side sessions for authenticated users
- Browser requests are authorized from the session, not from password credentials

### User Management
- Authenticated profile and portal metadata management
- Soft delete: User deactivation without data loss

### Permission System
- Casbin decorators: Route-level authorization via `PermissionGuard`
- Superuser mapping: Superusers map to the Casbin subject `admin`
- Dedicated role policies: Role CRUD uses the `roles` Casbin resource instead of reusing `users_admin`
- Resource ownership: User-specific data access
- User tiers: Subscription-based feature access
- Rate limiting: Per-user and per-tier API limits

## Authentication Patterns

### Endpoint Protection

```python
@router.get("/protected")
async def protected_endpoint(current_user: dict = Depends(get_current_user)):
    return {"message": f"Hello {current_user['username']}"}


@router.get("/public")
async def public_endpoint(user: dict | None = Depends(get_optional_user)):
    if user:
        return {"premium_content": True}
    return {"premium_content": False}


@router.get("/admin", dependencies=[Depends(get_current_superuser)])
async def admin_endpoint():
    return {"admin_data": "sensitive"}
```

## Security Features

### Session Security
- HTTP-only session cookies prevent JavaScript access
- Session state lives server-side in Redis
- Session expiration limits exposure if a cookie is stolen

### API Protection
- CORS policies for cross-origin request control
- Rate limiting prevents brute force attacks
- Input validation prevents injection attacks
- Consistent error messages prevent information disclosure

## Configuration

### OIDC and Session Settings

```env
REDIS_SESSION_HOST="localhost"
REDIS_SESSION_PORT=6379
REDIS_SESSION_DB=1
REDIS_SESSION_PREFIX="app.sessions."
OIDC_ENABLED=true
OIDC_SERVER_METADATA_URL="https://your-idp/.well-known/openid-configuration"
OIDC_CLIENT_ID="your-client-id"
OIDC_CLIENT_SECRET="your-client-secret"
```

For local development without Docker, run a Redis server before starting the backend. If you already use Redis locally for caching, queues, or rate limiting, you can reuse it and isolate session data with `REDIS_SESSION_DB`.

### Security Settings
```env
# Cookie security
COOKIE_SECURE=true
COOKIE_SAMESITE="lax"
```

## Getting Started

Follow this progressive learning path:

### 1. **OIDC and sessions** - Foundation
Understand how OIDC login, session-backed authentication, and browser request authorization work together.

### 2. **[User Management](user-management.md)** - Core Features
Implement profile management and portal-owned metadata.

### 3. **[Permissions](permissions.md)** - Access Control
Set up role-based access control, resource ownership checking, and tier-based permissions.

## What's Next

Start building your authentication system:

1. **OIDC login and sessions** - Configure discovery metadata, callback handling, and session cookies
2. **[User Management](user-management.md)** - Implement profile and portal metadata operations
3. **[Permissions](permissions.md)** - Add authorization patterns and access control

The authentication system provides a secure foundation for your API. Each guide includes practical examples and implementation details for production-ready authentication.