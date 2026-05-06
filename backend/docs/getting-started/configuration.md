# Configuration

This guide covers the essential configuration steps to get your FastAPI application running quickly.

## Quick Setup

The fastest way to get started is to copy the example environment file and modify just a few values:

```bash
cp src/.env.example src/.env
```

## Essential Configuration

Open `src/.env` and set these required values:

### Application Settings

```env
# App Settings
APP_NAME="Your app name here"
APP_DESCRIPTION="Your app description here"
APP_VERSION="0.1"
CONTACT_NAME="Your name"
CONTACT_EMAIL="Your email"
LICENSE_NAME="The license you picked"
```

### Database Connection

```env
# Database
POSTGRES_USER="your_postgres_user"
POSTGRES_PASSWORD="your_password"
POSTGRES_SERVER="localhost"  # Use "db" for Docker Compose
POSTGRES_PORT=5432           # Use 5432 for Docker Compose
POSTGRES_DB="your_database_name"
```

### PGAdmin (Optional)

For database administration:

```env
# PGAdmin
PGADMIN_DEFAULT_EMAIL="your_email_address"
PGADMIN_DEFAULT_PASSWORD="your_password"
PGADMIN_LISTEN_PORT=80
```

**To connect to database in PGAdmin:**

1. Login with `PGADMIN_DEFAULT_EMAIL` and `PGADMIN_DEFAULT_PASSWORD`
1. Click "Add Server"
1. Use these connection settings:
   - **Hostname/address**: `db` (if using containers) or `localhost`
   - **Port**: Value from `POSTGRES_PORT`
   - **Database**: `postgres` (leave as default)
   - **Username**: Value from `POSTGRES_USER`
   - **Password**: Value from `POSTGRES_PASSWORD`

### Security

Generate a secret key and set it:

```bash
# Generate a secure secret key
openssl rand -hex 32
```

```env
# Cryptography
SECRET_KEY="your-generated-secret-key-here"  # Result of openssl rand -hex 32
ALGORITHM="HS256"                            # Default: HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30               # Default: 30
REFRESH_TOKEN_EXPIRE_DAYS=7                  # Default: 7
```

### Session and OIDC Settings

```env
# Backend sessions
SESSION_SECRET_KEY="change-this-session-secret"
SESSION_COOKIE_NAME="app_session"
SESSION_COOKIE_SECURE=false
SESSION_MAX_AGE=28800
SESSION_ROLLING=false

# Server-side session store
REDIS_SESSION_HOST="localhost"
REDIS_SESSION_PORT=6379
REDIS_SESSION_DB=1
REDIS_SESSION_PASSWORD=
REDIS_SESSION_SSL=false
REDIS_SESSION_PREFIX="app.sessions."
REDIS_SESSION_GC_TTL=2592000

# OIDC
OIDC_ENABLED=true
OIDC_PROVIDER_NAME="oidc"
OIDC_SERVER_METADATA_URL="https://your-idp/.well-known/openid-configuration"
OIDC_CLIENT_ID="your-client-id"
OIDC_CLIENT_SECRET="your-client-secret"
OIDC_SCOPES="openid profile email"
OIDC_POST_LOGIN_REDIRECT="http://localhost:3000/auth-complete"

# Local password fallback
LOCAL_PASSWORD_LOGIN_ENABLED=true
```

- Set `OIDC_ENABLED=true` to enable `/api/v1/auth/oidc/login` and `/api/v1/auth/oidc/callback`.
- For split-origin local development, set `OIDC_POST_LOGIN_REDIRECT` to the frontend origin, for example `http://localhost:3000/auth-complete`, so the backend callback returns the browser to the SPA instead of the backend host.
- Set `LOCAL_PASSWORD_LOGIN_ENABLED=false` to disable local username/password login when you want OIDC-only user auth.
- Use a strong `SESSION_SECRET_KEY` in every environment.
- `REDIS_SESSION_DB=1` keeps session records separate from the cache, queue, and rate-limit Redis keys while still allowing a shared local Redis server.
- `REDIS_SESSION_PREFIX` lets you distinguish session keys during local inspection and cleanup.
- `SESSION_ROLLING=true` extends cookie expiration on every request; leave it `false` for fixed-lifetime sessions.

### First Admin User

```env
# Admin User
ADMIN_NAME="your_name"
ADMIN_EMAIL="your_email"
ADMIN_USERNAME="your_username"
ADMIN_PASSWORD="your_password"
```

### Redis Configuration

```env
# Redis Cache
REDIS_CACHE_HOST="localhost"     # Use "redis" for Docker Compose
REDIS_CACHE_PORT=6379

# Client-side Cache
CLIENT_CACHE_MAX_AGE=30          # Default: 30 seconds

# Redis Job Queue
REDIS_QUEUE_HOST="localhost"     # Use "redis" for Docker Compose
REDIS_QUEUE_PORT=6379

# Redis Rate Limiting
REDIS_RATE_LIMIT_HOST="localhost"  # Use "redis" for Docker Compose
REDIS_RATE_LIMIT_PORT=6379

# Redis Sessions
REDIS_SESSION_HOST="localhost"     # Use "redis" for Docker Compose
REDIS_SESSION_PORT=6379
REDIS_SESSION_DB=1
```

!!! warning "Redis in Production"
You may use the same Redis instance for caching and queues while developing, but use separate containers in production.

For local development, the backend now expects a Redis server for session storage as well. Reusing the same Redis server is fine; keep session data isolated with `REDIS_SESSION_DB` and `REDIS_SESSION_PREFIX`.

### Rate Limiting Defaults

```env
# Default Rate Limits
DEFAULT_RATE_LIMIT_LIMIT=10      # Default: 10 requests
DEFAULT_RATE_LIMIT_PERIOD=3600   # Default: 3600 seconds (1 hour)
```

### Access Control Policies

Decorator-based authorization is backed by PostgreSQL rows in the `access_policy` table.

Seed the default admin-heavy policies with:

```bash
uv run python -m src.scripts.seed_access_policies
```

That seed set includes the default `admin` permissions for `tiers`, `rate_limits`, `users_admin`, and `roles`. After pulling RBAC updates into an existing environment, run Alembic first so the role-management policies are inserted before you exercise `/api/v1/role` or `/api/v1/roles`.

### CORS Configuration

Configure Cross-Origin Resource Sharing for your frontend:

```env
# CORS Settings
CORS_ORIGINS=["*"]                         # Comma-separated origins (use specific domains in production)
CORS_METHODS=["*"]                         # Comma-separated HTTP methods or "*" for all
CORS_HEADERS=["*"]                         # Comma-separated headers or "*" for all
```

!!! warning "CORS in Production"
Never use `"*"` for CORS_ORIGINS in production. Specify exact domains:
`env     CORS_ORIGINS=["https://yourapp.com","https://www.yourapp.com"]     CORS_METHODS=["GET","POST","PUT","DELETE","PATCH"]     CORS_HEADERS=["Authorization","Content-Type"]     `

### First Tier

```env
# Default Tier
TIER_NAME="free"
```

## Environment Types

Set your environment type:

```env
ENVIRONMENT="local"  # local, staging, or production
```

- **local**: API docs available at `/docs`, `/redoc`, and `/openapi.json`
- **staging**: API docs available to superusers only
- **production**: API docs completely disabled

## Docker Compose Settings

If using Docker Compose, use these values instead:

```env
# Docker Compose values
POSTGRES_SERVER="db"
REDIS_CACHE_HOST="redis"
REDIS_QUEUE_HOST="redis"
REDIS_RATE_LIMIT_HOST="redis"
REDIS_SESSION_HOST="redis"
```

## Optional Services

The boilerplate includes Redis for caching, job queues, and rate limiting. If running locally without Docker, either:

1. **Install Redis** and keep the default cache, queue, rate-limit, and session settings
1. **Disable Redis services** (see [User Guide - Configuration](../user-guide/configuration/index.md) for details)

For a manual local run with OIDC and session-backed auth, make sure PostgreSQL and Redis are both available before starting `uvicorn`.

## That's It!

With these basic settings configured, you can start the application:

- **Docker Compose**: `docker compose up`
- **Manual**: `UV_PROJECT_ENVIRONMENT=../.venv uv run uvicorn src.app.main:app --reload`

For detailed configuration options, advanced settings, and production deployment, see the [User Guide - Configuration](../user-guide/configuration/index.md).
