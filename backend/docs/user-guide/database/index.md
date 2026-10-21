# Database Layer

Learn how to work with the data-access layer in the FastAPI Boilerplate. This section covers everything you need to store and retrieve data effectively.

## What You'll Learn

- **[Models](models.md)** - Define database tables with SQLAlchemy models
- **[Schemas](schemas.md)** - Validate and serialize data with Pydantic schemas  
- **[CRUD Operations](crud.md)** - Perform database operations with FastCRUD
- **[Migrations](migrations.md)** - Manage database schema changes with Alembic

## Quick Overview

The boilerplate uses a layered architecture that separates concerns:

```python
# Service method
@router.post("/", response_model=UserRead)
async def create_user(user_data: UserCreate, db: AsyncSession):
    return await user_service.create_user(db, user_data)

# The layers work together:
# 1. UserCreate schema validates the input
# 2. UserService enforces business rules
# 3. crud_users handles the database operation
# 4. User model defines the database table
# 5. UserRead schema formats the response
```

## Architecture

The database layer follows a clear separation:

```
API Request
    ↓
Pydantic Schema (validation & serialization)
    ↓
Service Layer (business logic & orchestration)
    ↓
CRUD Layer (data access)
    ↓
SQLAlchemy Model (database table definition)
    ↓
PostgreSQL Database
```

## Key Features

### 🗄️ **SQLAlchemy 2.0 Models**
Modern async SQLAlchemy with type hints:
```python
class User(Base):
    __tablename__ = "user"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(50), unique=True)
    email: Mapped[str] = mapped_column(String(100), unique=True)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
```

### ✅ **Pydantic Schemas**
Automatic validation and serialization:
```python
class UserCreate(BaseModel):
    username: str = Field(min_length=2, max_length=50)
    email: EmailStr
    password: str = Field(min_length=8)

class UserRead(BaseModel):
    id: int
    username: str
    email: str
    created_at: datetime
    # Note: no password field in read schema
```

### 🔧 **FastCRUD Operations**
Consistent database operations:
```python
# Create
user = await crud_users.create(db=db, object=user_create)

# Read
user = await crud_users.get(db=db, id=user_id)
users = await crud_users.get_multi(db=db, offset=0, limit=10)

# Update  
user = await crud_users.update(db=db, object=user_update, id=user_id)

# Delete (soft delete)
await crud_users.delete(db=db, id=user_id)
```

### 🔄 **Database Migrations**
Track schema changes with Alembic:
```bash
# Generate migration
alembic revision --autogenerate -m "Add user table"

# Apply migrations
alembic upgrade head

# Rollback if needed
alembic downgrade -1
```

## Database Setup

The boilerplate is configured for PostgreSQL with async support:

### Environment Configuration
```bash
# .env file
POSTGRES_USER=your_user
POSTGRES_PASSWORD=your_password
POSTGRES_SERVER=localhost
POSTGRES_PORT=5432
POSTGRES_DB=your_database
```

### Connection Management
```python
# Database session dependency
async def async_get_db() -> AsyncIterator[AsyncSession]:
    async with async_session_maker() as session:
        yield session

# Use in endpoints
@router.get("/users/")
async def get_users(db: Annotated[AsyncSession, Depends(async_get_db)]):
    return await crud_users.get_multi(db=db)
```

### Reader and writer routing

Database routing is explicit, not based on the HTTP method globally. `async_get_db()`, `local_session()` and `get_async_engine()` default to the writer. Stale-safe route handlers opt in with `Depends(async_get_reader_db)`; their authentication and Casbin dependencies retain independent writer sessions. Engines and session factories are cached separately per event loop. Without `POSTGRES_READER_SERVER`, the reader dependency dynamically reuses the writer engine and session factory instead of creating a second pool.

The audited reader allowlist is:

| GET path (under `/api/v1`) | Why replication lag is acceptable |
| --- | --- |
| `/departments` | Reference catalog, not a user's department assignment or an authorization decision. |
| `/department/{department_uuid}` | Reference catalog lookup. |
| `/departments/by-id/{department_id}` | Reference catalog lookup; Casbin authorization still uses the writer. |
| `/audit-logs` | Historical reporting may briefly omit recent events; recording an audit event always uses the writer. |
| `/applications/{application_uuid}/environments` | Listing only, after writer-backed application permission checks; no service-layer authorization or writes. Creation returns the new environment directly. |
| `/rp-applications` | Generic catalog listing has no service-layer authorization or writes. The existing fixed-subject legacy API denial remains unchanged. |

These reads provide eventual consistency, not guaranteed read-after-write visibility. Department catalog edits and new environment/audit records may briefly be absent from listings. If a future workflow needs immediate confirmation, keep its queries on the writer rather than expanding this allowlist automatically.

Writer exceptions, including GETs:

- All mutations, OIDC callbacks (including user creation/update), migrations, seeds, background tasks and readiness probes. Readiness must test the writer, not hide a writer outage behind a healthy replica.
- `get_current_user`, `get_optional_user`, bearer-token/blacklist checks, Casbin subject resolution, application permission checks, the Casbin policy provider (`local_session`) and rate limiter. Reader route opt-in must never change these dependencies.
- All user reads, including `/user/me/`, individual users, search/list responses and role/tier/department/rate-limit reads. Public user responses include live role/tier/department assignments, so even their list/search services are security-sensitive.
- Policies, roles, tiers and rate-limit GETs: live security administration and read-after-change confirmation, not stale-safe reference catalogs.
- `/applications/mine`: `ApplicationRepository.list_for_user` performs membership/role authorization in its query, not in a separate writer dependency.
- Environment detail GET: immediate read-after-create and security configuration. All environment client permissions/credentials/rotated-secret GETs: service-layer production-role and tenant checks require current data. Credential reveal and rotated-secret reads also **write audit events**.
- Legacy `/rp-applications/mine` and its department/OAuth/MAU GETs: ownership filtering and authorization happen inside the service; OAuth/security setup and department assignment preflight also require current state. Individual `/rp-application/{rp_application_uuid}` remains on the writer for read-after-edit confirmation. Legacy denial remains intact on every legacy endpoint.
- Workspace/partner-group membership and authorization must stay on the writer. This revision has no workspace routes; current application guards and membership-filtered services use partner groups.

IBM Verify admin, MAU reporting and task-status endpoints read external APIs, S3 or Redis rather than using a route-level PostgreSQL data session. CSRF, OIDC login and liveness likewise have no route-level database data dependency. Their existing auth/permission checks are unchanged.

Before opting in another GET, inspect its full service/repository call chain for writes (including get-or-create and audit logging), ownership/membership/tenant checks and read-after-write requirements. Switch only the route's data dependency, then update the allowlist tests in `tests/test_database_routing.py`.

## Included Models

The boilerplate includes four example models:

### **User Model** - Authentication & user management
- Username, email, password (hashed)
- Soft delete support
- Tier-based access control

### **Post Model** - Content with user relationships  
- Title, content, creation metadata
- Foreign key to user (no SQLAlchemy relationships)
- Soft delete built-in

### **Tier Model** - User subscription levels
- Name-based tiers (free, premium, etc.)
- Links to rate limiting system

### **Rate Limit Model** - API access control
- Path-specific rate limits per tier
- Configurable limits and time periods

## Directory Structure

```text
src/app/
├── models/                 # SQLAlchemy models (database tables)
│   ├── __init__.py        
│   ├── user.py           # User table definition
│   ├── post.py           # Post table definition
│   └── ...
├── schemas/                # Pydantic schemas (validation)
│   ├── __init__.py
│   ├── user.py           # User validation schemas
│   ├── post.py           # Post validation schemas  
│   └── ...
├── repositories/           # Data-access wrappers and external clients
│   ├── __init__.py
│   ├── crud_users.py     # User persistence operations
│   ├── crud_roles.py     # Role persistence operations
│   ├── ibm_sv_admin.py   # IBM Security Verify admin API client
│   └── ...
├── services/               # Business logic and orchestration
│   ├── __init__.py
│   ├── user_service.py   # User domain operations
│   ├── post_service.py   # Post domain operations
│   └── ...
└── core/db/               # Database configuration
    ├── database.py       # Connection and session setup
    └── models.py         # Base classes and mixins
```

## Common Patterns

### Create with Validation
```python
@router.post("/users/", response_model=UserRead)
async def create_user(
    user_data: UserCreate,  # Validates input automatically
    db: Annotated[AsyncSession, Depends(async_get_db)]
):
    # Check for duplicates
    if await crud_users.exists(db=db, email=user_data.email):
        raise DuplicateValueException("Email already exists")
    
    # Create user (password gets hashed automatically)
    return await crud_users.create(db=db, object=user_data)
```

### Query with Filters
```python
# Get active users only
users = await crud_users.get_multi(
    db=db,
    is_active=True,
    is_deleted=False,
    offset=0,
    limit=10
)

# Search users
users = await crud_users.get_multi(
    db=db,
    username__icontains="john",  # Contains "john"
    schema_to_select=UserRead
)
```

### Soft Delete Pattern
```python
# Soft delete (sets is_deleted=True)
await crud_users.delete(db=db, id=user_id)

# Hard delete (actually removes from database)
await crud_users.db_delete(db=db, id=user_id)

# Get only non-deleted records
users = await crud_users.get_multi(db=db, is_deleted=False)
```

## What's Next

Each guide builds on the previous one with practical examples:

1. **[Models](models.md)** - Define your database structure
2. **[Schemas](schemas.md)** - Add validation and serialization
3. **[CRUD Operations](crud.md)** - Implement persistence operations
4. **[Migrations](migrations.md)** - Deploy changes safely

The boilerplate provides a solid foundation - use services for domain logic and CRUD wrappers for persistence.