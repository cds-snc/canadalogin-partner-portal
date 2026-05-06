# Authentication & Security

Learn how to implement secure authentication in your FastAPI application. The boilerplate now provides provider-agnostic OIDC authentication with Authlib, backend sessions for authenticated users, and an optional local JWT fallback for development and testing.

## What You'll Learn

- **[JWT Tokens](jwt-tokens.md)** - Understand access and refresh token management
- **[User Management](user-management.md)** - Handle registration, login, and user profiles
- **[Permissions](permissions.md)** - Implement role-based access control and authorization

## Authentication Overview

The primary login path is OIDC. After a successful callback, the backend stores the authenticated user in a server-side Redis session and resolves the user from that session on protected routes. The browser cookie only carries the session identifier.

The legacy username/password login remains available only when `LOCAL_PASSWORD_LOGIN_ENABLED=true`. In that mode, the backend still issues access and refresh JWTs for compatibility with local development and tests.

When the frontend and backend run on different origins in development, configure `OIDC_POST_LOGIN_REDIRECT` as an absolute frontend URL such as `http://localhost:3000/auth-complete`. A backend-relative path like `/auth-complete` would keep the browser on the backend origin.

```python
# OIDC login flow
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

Minimal RBAC is now split into two Casbin resources:

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
- Local or test password login can be disabled entirely

### JWT Token System
- **Access tokens**: Short-lived (30 minutes), for API requests
- **Refresh tokens**: Long-lived (7 days), stored in secure cookies
- **Token blacklisting**: Secure logout implementation
- **Automatic expiration**: Built-in token lifecycle management for the local fallback path

### User Management
- **Flexible authentication**: Username or email login
- **Secure passwords**: bcrypt hashing with salt
- **Profile management**: Complete user CRUD operations
- **Soft delete**: User deactivation without data loss

### Permission System
- **Casbin decorators**: Route-level authorization via `PermissionGuard`
- **Superuser mapping**: Superusers map to the Casbin subject `admin`
- **Dedicated role policies**: Role CRUD uses the `roles` Casbin resource instead of reusing `users_admin`
- **Resource ownership**: User-specific data access
- **User tiers**: Subscription-based feature access
- **Rate limiting**: Per-user and per-tier API limits

## Authentication Patterns

### Endpoint Protection

```python
# Required authentication
@router.get("/protected")
async def protected_endpoint(current_user: dict = Depends(get_current_user)):
    return {"message": f"Hello {current_user['username']}"}

# Optional authentication
@router.get("/public")
async def public_endpoint(user: dict | None = Depends(get_optional_user)):
    if user:
        return {"premium_content": True}
    return {"premium_content": False}

# Superuser only
@router.get("/admin", dependencies=[Depends(get_current_superuser)])
async def admin_endpoint():
    return {"admin_data": "sensitive"}
```

### Resource Ownership

```python
@router.patch("/posts/{post_id}")
async def update_post(post_id: int, current_user: dict = Depends(get_current_user)):
    post = await crud_posts.get(db=db, id=post_id)
    
    # Check ownership or admin privileges
    if post["created_by_user_id"] != current_user["id"] and not current_user["is_superuser"]:
        raise ForbiddenException("Cannot update other users' posts")
    
    return await crud_posts.update(db=db, id=post_id, object=updates)
```

## Security Features

### Token Security
- Short-lived access tokens limit exposure
- HTTP-only refresh token cookies prevent XSS
- Token blacklisting enables secure logout
- Configurable token expiration times

### Password Security
- bcrypt hashing with automatic salt generation
- Configurable password complexity requirements
- No plain text passwords stored anywhere
- Rate limiting on authentication endpoints

### API Protection
- CORS policies for cross-origin request control
- Rate limiting prevents brute force attacks
- Input validation prevents injection attacks
- Consistent error messages prevent information disclosure

## Configuration

### JWT Settings
```env
SECRET_KEY="your-super-secret-key-here"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
```

### OIDC and Session Settings

```env
SESSION_SECRET_KEY="change-this-session-secret"
REDIS_SESSION_HOST="localhost"
REDIS_SESSION_PORT=6379
REDIS_SESSION_DB=1
REDIS_SESSION_PREFIX="app.sessions."
OIDC_ENABLED=true
OIDC_SERVER_METADATA_URL="https://your-idp/.well-known/openid-configuration"
OIDC_CLIENT_ID="your-client-id"
OIDC_CLIENT_SECRET="your-client-secret"
LOCAL_PASSWORD_LOGIN_ENABLED=false
```

For local development without Docker, run a Redis server before starting the backend. If you already use Redis locally for caching, queues, or rate limiting, you can reuse it and isolate session data with `REDIS_SESSION_DB`.

### Security Settings
```env
# Cookie security
COOKIE_SECURE=true
COOKIE_SAMESITE="lax"

# Password requirements
PASSWORD_MIN_LENGTH=8
ENABLE_PASSWORD_COMPLEXITY=true
```

## Getting Started

Follow this progressive learning path:

### 1. **OIDC and sessions** - Foundation
Understand how OIDC login, session-backed authentication, and local JWT fallback work together.

### 2. **[User Management](user-management.md)** - Core Features
Implement user registration, login, profile management, and administrative operations.

### 3. **[Permissions](permissions.md)** - Access Control
Set up role-based access control, resource ownership checking, and tier-based permissions.

## Implementation Examples

### Quick Authentication Setup

```python
# Protect an endpoint
@router.get("/my-data")
async def get_my_data(current_user: dict = Depends(get_current_user)):
    return await get_user_specific_data(current_user["id"])

# Check user permissions
def check_tier_access(user: dict, required_tier: str):
    if not user.get("tier") or user["tier"]["name"] != required_tier:
        raise ForbiddenException(f"Requires {required_tier} tier")

# Custom authentication dependency
async def get_premium_user(current_user: dict = Depends(get_current_user)):
    check_tier_access(current_user, "Pro")
    return current_user
```

### Frontend Integration

```javascript
// Basic authentication flow
class AuthManager {
    async login(username, password) {
        const response = await fetch('/api/v1/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            body: new URLSearchParams({username, password})
        });
        
        const tokens = await response.json();
        localStorage.setItem('access_token', tokens.access_token);
        return tokens;
    }
    
    async makeAuthenticatedRequest(url, options = {}) {
        const token = localStorage.getItem('access_token');
        return fetch(url, {
            ...options,
            headers: {
                ...options.headers,
                'Authorization': `Bearer ${token}`
            }
        });
    }
}
```

## What's Next

Start building your authentication system:

1. **OIDC login and sessions** - Configure discovery metadata, callback handling, and session cookies
2. **[JWT Tokens](jwt-tokens.md)** - Learn token creation, verification, and lifecycle management for the local fallback
2. **[User Management](user-management.md)** - Implement registration, login, and profile operations  
3. **[Permissions](permissions.md)** - Add authorization patterns and access control

The authentication system provides a secure foundation for your API. Each guide includes practical examples and implementation details for production-ready authentication. 