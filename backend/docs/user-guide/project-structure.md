# Project Structure

Understanding the project structure is essential for navigating the FastAPI Boilerplate effectively. This guide explains the organization of the codebase, the purpose of each directory, and how components interact with each other.

## Overview

The FastAPI Boilerplate follows a clean, modular architecture that separates concerns and promotes maintainability. The structure is designed to scale from simple APIs to complex applications while maintaining code organization and clarity.

## Root Directory Structure

```text
FastAPI-boilerplate/
├── Dockerfile                 # Container configuration
├── docker-compose.yml         # Multi-service orchestration
├── pyproject.toml            # Project configuration and dependencies
├── uv.lock                   # Dependency lock file
├── README.md                 # Project documentation
├── LICENSE.md                # License information
├── tests/                    # Test suite
├── docs/                     # Documentation
└── src/                      # Source code
```

### Configuration Files

| File | Purpose |
|------|---------|
| `Dockerfile` | Defines the container image for the application |
| `docker-compose.yml` | Orchestrates multiple services (API, database, Redis, worker) |
| `pyproject.toml` | Modern Python project configuration with dependencies and metadata |
| `uv.lock` | Locks exact dependency versions for reproducible builds |

## Source Code Structure

The `src/` directory contains all application code:

```text
src/
├── app/                      # Main application package
│   ├── main.py              # Application entry point
│   ├── api/                 # API layer
│   ├── core/                # Core utilities and configurations
│   ├── repositories/        # Data-access adapters and external clients
│   ├── services/            # Business logic and orchestration
│   ├── models/              # SQLAlchemy models
│   ├── schemas/             # Pydantic schemas
│   ├── middleware/          # Custom middleware
│   ├── workflows/           # Domain workflows and state transitions
│   └── logs/                # Application logs
├── migrations/              # Database migrations
└── scripts/                 # Utility scripts
```

## Core Application (`src/app/`)

### Entry Point
- **`main.py`** - FastAPI application instance and configuration

### API Layer (`api/`)
```text
api/
├── dependencies.py          # Shared dependencies
└── v1/                     # API version 1
    ├── health.py           # Health and readiness endpoints
    ├── login.py            # Authentication endpoints
    ├── logout.py           # Logout functionality
    ├── oidc.py             # OIDC login and callback endpoints
    ├── policies.py         # Access policy endpoints
    ├── users.py            # User management
    ├── posts.py            # Post operations
    ├── tasks.py            # Background task endpoints
    ├── roles.py            # Role management
    ├── tiers.py            # User tier management
    └── rate_limits.py      # Rate limiting endpoints
```

**Purpose**: Contains HTTP-facing route handlers, dependency wiring, authentication context injection, request validation, response models, and route-level decorators. Business logic is delegated to the service layer.

### Service Layer (`services/`)
```text
services/
├── auth_service.py         # Login, refresh, and logout orchestration
├── health_service.py       # Health and readiness checks
├── oidc_service.py         # OIDC redirect and callback flow
├── policy_service.py       # Access policy business logic
├── post_service.py         # Post ownership, workflow, and review logic
├── rate_limit_service.py   # Tier-scoped rate limit orchestration
├── role_service.py         # Role business logic
├── task_service.py         # Background task orchestration
├── tier_service.py         # Tier business logic
└── user_service.py         # User lifecycle and aggregate reads
```

**Purpose**: Owns business rules, orchestration, duplicate checks, ownership checks, related-entity lookups, and multi-step domain operations. Services are injected into routes explicitly through FastAPI `Depends` providers defined in `api/dependencies.py`.

### Workflow Layer (`workflows/`)
```text
workflows/
└── post_workflow.py        # Post review state transitions
```

**Purpose**: Encapsulates domain-specific workflows and state transitions that are reused by services.

### Core System (`core/`)
```text
core/
├── config.py               # Application settings
├── logger.py               # Logging configuration
├── schemas.py              # Core Pydantic schemas
├── security.py             # Security utilities
├── setup.py                # Application factory
├── db/                     # Database core
├── exceptions/             # Custom exceptions
├── utils/                  # Utility functions
└── worker/                 # Background worker
```

**Purpose**: Houses core functionality, configuration, and shared utilities.

#### Database Core (`core/db/`)
```text
db/
├── database.py             # Database connection and session management
├── models.py               # Base models and mixins
├── crud_token_blacklist.py # Token blacklist operations
└── token_blacklist.py      # Token blacklist model
```

#### Exceptions (`core/exceptions/`)
```text
exceptions/
├── cache_exceptions.py     # Cache-related exceptions
└── http_exceptions.py      # HTTP exceptions
```

#### Utilities (`core/utils/`)
```text
utils/
├── cache.py                # Caching utilities
├── queue.py                # Task queue management
└── rate_limit.py           # Rate limiting utilities
```

#### Worker (`core/worker/`)
```text
worker/
├── settings.py             # Worker configuration
└── functions.py            # Background task definitions
```

### Data Layer

#### Models (`models/`)
```text
models/
├── user.py                 # User model
├── post.py                 # Post model
├── tier.py                 # User tier model
└── rate_limit.py           # Rate limit model
```

**Purpose**: SQLAlchemy ORM models defining database schema.

#### Schemas (`schemas/`)
```text
schemas/
├── user.py                 # User validation schemas
├── post.py                 # Post validation schemas
├── tier.py                 # Tier validation schemas
├── rate_limit.py           # Rate limit schemas
└── job.py                  # Background job schemas
```

**Purpose**: Pydantic schemas for request/response validation and serialization.

#### Repository Adapters (`repositories/`)
```text
repositories/
├── crud_access_policies.py   # Access policy database access
├── crud_departments.py       # Department database access
├── crud_rate_limit.py        # Rate limit database access
├── crud_roles.py             # Role database access
├── crud_rp_applications.py   # RP application database access
├── crud_tier.py              # Tier database access
├── crud_users.py             # User database access
├── crud_workspace_members.py # Workspace member database access
├── crud_workspaces.py        # Workspace database access
├── ibm_sv_admin.py           # IBM Security Verify admin client
├── ibm_sv_user.py            # IBM Security Verify user client
└── dependencies.py           # Repository dependency providers
```

**Purpose**: Unified data-access layer. Database-backed `FastCRUD` adapters and IBM Security Verify clients both live here. This layer should not contain request orchestration or domain business rules.

### Additional Components

#### Middleware (`middleware/`)
```text
middleware/
└── client_cache_middleware.py  # Client-side caching middleware
```

#### Logs (`logs/`)
```text
logs/
└── app.log                 # Application log file
```

## Database Migrations (`src/migrations/`)

```text
migrations/
├── README                  # Migration instructions
├── env.py                  # Alembic environment configuration
├── script.py.mako          # Migration template
└── versions/               # Individual migration files
```

**Purpose**: Alembic database migrations for schema version control.

## Utility Scripts (`src/scripts/`)

```text
scripts/
├── create_first_superuser.py  # Create initial admin user
└── create_first_tier.py       # Create initial user tier
```

**Purpose**: Initialization and maintenance scripts.

## Testing Structure (`tests/`)

```text
tests/
├── conftest.py             # Pytest configuration and fixtures
├── test_user_unit.py       # User-related unit tests
└── helpers/                # Test utilities
    ├── generators.py       # Test data generators
    └── mocks.py            # Mock objects and functions
```

## Architectural Patterns

### Layered Architecture

The boilerplate implements a clean layered architecture:

1. **API Layer** (`api/`) - Handles HTTP requests and responses
2. **Service Layer** (`services/`) - Implements business rules and orchestrates domain behavior
3. **Workflow Layer** (`workflows/`) - Encapsulates state transitions and reusable domain workflows
4. **Data Access Layer** (`repositories/`, `models/`) - Handles persistence and external data access
5. **Core Services** (`core/`) - Provides shared infrastructure, configuration, and utilities

### Dependency Injection

FastAPI's dependency injection system is used throughout:

- **Database Sessions** - Injected into endpoints via `async_get_db`
- **Authentication** - User context provided by `get_current_user`
- **Application Services** - Domain services provided by explicit providers in `api/dependencies.py`
- **Rate Limiting** - Applied via `rate_limiter_dependency`
- **Caching** - Managed through decorators and middleware

### Configuration Management

All configuration is centralized in `core/config.py`:

- **Environment Variables** - Loaded from `.env` file
- **Settings Classes** - Organized by functionality (database, security, etc.)
- **Type Safety** - Using Pydantic for validation

### Error Handling

Centralized exception handling:

- **Custom Exceptions** - Defined in `core/exceptions/`
- **HTTP Status Codes** - Consistent error responses
- **Logging** - Automatic error logging and tracking

## Design Principles

### Single Responsibility

Each module has a clear, single purpose:

- Models define data structure
- Schemas handle validation
- Repository adapters manage data access
- Services manage business logic and orchestration
- API endpoints handle HTTP concerns

### Separation of Concerns

- Business logic separated from presentation
- Database operations isolated from services and API logic
- Workflow state transitions isolated from route handlers
- Configuration centralized and environment-aware

### Modularity

- Features can be added/removed independently
- Services can be disabled via configuration
- Clear interfaces between components

### Scalability

- Async/await throughout the application
- Connection pooling for database access
- Caching and background task support
- Horizontal scaling ready

## Navigation Tips

### Finding Code

- **Models** → `src/app/models/`
- **API Endpoints** → `src/app/api/v1/`
- **Database Operations** → `src/app/repositories/`
- **Configuration** → `src/app/core/config.py`
- **Business Logic** → Distributed across CRUD and API layers

### Adding New Features

1. **Model** → Define in `models/`
2. **Schema** → Create in `schemas/`
3. **Repository Adapter** → Implement in `repositories/`
4. **Service** → Add business logic in `services/`
5. **API** → Add endpoints in `api/v1/`
6. **Migration** → Generate with Alembic

### Understanding Data Flow

```text
Request → API Endpoint → Dependencies → Service → Repository → Model/Client → Database or External API
Response ← API Response ← Schema ← Service ← Repository Result ← Database or External API
```

This structure provides a solid foundation for building scalable, maintainable APIs while keeping the codebase organized and easy to navigate. 