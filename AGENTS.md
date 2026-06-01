# CanadaLogin Partner Portal - Agent Guide

This document provides essential information for agentic coding agents working on the CanadaLogin Partner Portal codebase.

## Project Overview

**CanadaLogin Partner Portal** is a monorepo containing:
- `backend/` - FastAPI application with SQLAlchemy 2.0, PostgreSQL, Redis
- `frontend/` - Vite + React (TypeScript) with TanStack Router/Query

## Mermaid development environment

### Initial setup

Before doing any work, ensure `mmdc` is installed and working. If not, install `@mermaid-js/mermaid-cli`. After installing, create a sample mermaid diagram to validate that it works as expected. This tool will be used to validate syntax like: `mmdc -i <file>.mmd -o /tmp/check.svg`

### Development

When you are asked to do work, always try rendering the file using `mmdc -i <file>.mmd -o /tmp/check.svg` before returning back to the user. If it does not render successfully, fix the issue, then try rendering again. Never return to the user with a broken mermaid file.

When you're done, always use the `askQuestions` tool to ask the user for approval. If they ask for more work, continue working then use `askQuestions` again. Never finish working without approval from the `askQuestions` tool.


## Build, Lint, and Test Commands

### Backend Commands

```bash
# Preferred from repo root; pins uv to the repo-root .venv
make bk-install
make bk-test
make bk-lint
make bk-format
make bk-typecheck

# If you run raw uv commands inside backend/, set UV_PROJECT_ENVIRONMENT explicitly
cd backend

# Install dependencies
UV_PROJECT_ENVIRONMENT=../.venv uv sync --group dev --extra dev

# Run development server
UV_PROJECT_ENVIRONMENT=../.venv uv run uvicorn src.app.main:app --reload --host 127.0.0.1 --port 8000

# Run all tests
UV_PROJECT_ENVIRONMENT=../.venv uv run pytest -q

# Run a single test file
UV_PROJECT_ENVIRONMENT=../.venv uv run pytest tests/test_user_service.py -v

# Run a single test function
UV_PROJECT_ENVIRONMENT=../.venv uv run pytest tests/test_user_service.py::test_create_user -v

# Run tests with coverage
UV_PROJECT_ENVIRONMENT=../.venv uv run pytest --cov=src.app --cov-report=term-missing

# Lint with ruff
UV_PROJECT_ENVIRONMENT=../.venv uv run ruff check src/

# Fix lint issues
UV_PROJECT_ENVIRONMENT=../.venv uv run ruff check src/ --fix

# Type checking with mypy
UV_PROJECT_ENVIRONMENT=../.venv uv run mypy src/app

# Run database migrations
cd src && UV_PROJECT_ENVIRONMENT=../../.venv uv run alembic upgrade head

# Migration authoring note
# Keep Alembic `revision` strings at 32 characters or fewer.
# Prefer short symbolic ids such as `0005_rp_app_dev_invites` even if the filename is longer.

# Docker compose (local dev)
docker compose up --build
```

### Frontend Commands

```bash
cd frontend

# Install dependencies
pnpm install

# Development server
pnpm run dev

# Linting
pnpm run lint
pnpm run lint:fix  # Fix auto-fixable issues

# Formatting
pnpm run format

# Run all tests (unit + e2e)
pnpm run test

# Unit tests only
pnpm run test:unit

# Run a single unit test
pnpm run test:unit src/features/auth/hooks/use-session.test.ts

# Unit tests with coverage
pnpm run test:unit:coverage

# E2E tests
pnpm run test:e2e
pnpm run test:e2e:report  # View HTML report

# Build for production
pnpm run build

# Preview production build
pnpm run preview

# Storybook
pnpm run storybook
pnpm run storybook:build
```

---

## Code Style Guidelines

### General Principles

1. **Type Safety** - Use TypeScript for frontend, Python type hints for backend
2. **No Magic** - Explicit is better than implicit
3. **Single Responsibility** - Small, focused functions and components
4. **Test Everything** - All new features require tests

### Frontend (React + TypeScript)

**Naming Conventions:**
- Components: `PascalCase` (e.g., `UserProfile.tsx`)
- Hooks: `camelCase` starting with `use` (e.g., `useAuth.ts`)
- Utilities: `camelCase` (e.g., `formatDate.ts`)
- Constants: `UPPER_SNAKE_CASE`
- Files: `kebab-case.tsx`

**Imports Order:**
1. External libraries (React, TanStack, etc.)
2. Internal components/hooks
3. Types/interfaces
4. Utilities
5. Assets/styles

```typescript
// Good
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button'
import { UserCard } from './UserCard'
import type { User } from '@/types/user'
import { formatDate } from '@/utils/date'
```

**Component Structure:**
```typescript
interface Props {
  title: string
  onSubmit: () => void
}

export function UserForm({ title, onSubmit }: Props) {
  const [name, setName] = useState('')
  
  return (
    <form>
      <h1>{title}</h1>
      {/* ... */}
    </form>
  )
}
```

**Rules:**
- Always use explicit return types for components
- Use Zod for form validation schemas
- Use React Hook Form for forms
- Prefer TanStack Query for data fetching
- Use TanStack Router for routing
- When adding a nested TanStack child route under an existing page route, convert the parent route into a layout that renders `Outlet` and move the existing page into an `index.ts` child route. If the URL updates but the page content does not change, check the parent route render path before debugging the child route.
- The invited-developer flow uses `/invitations/rp-applications?token=...`, `/rp-applications/mine/$rpApplicationUuid`, and `/access-denied`; preserve those paths unless the backend contract changes too
- Invited-developer RP application pages must use current-user endpoints instead of workspace-scoped fetches because invitees are not workspace members

**ESLint Rules (from eslint.config.js):**
- `camelcase` for variables
- `typescript-eslint/return-await`: error
- `react-hooks/exhaustive-deps`: error
- Props sorted: callbacksLast, shorthandFirst, reservedFirst

**Prettier Settings (from prettier.config.js):**
- Print width: 80
- Tab width: 2
- Use tabs: true
- Semi: true
- Single quote: false (double quotes)
- Trailing comma: es5

### Backend (FastAPI + Python)

**Naming Conventions:**
- Files: `snake_case.py` (e.g., `user_service.py`)
- Functions: `snake_case` (e.g., `get_user_by_id`)
- Classes: `PascalCase` (e.g., `UserService`)
- Constants: `UPPER_SNAKE_CASE`

**Import Order:**
1. Standard library
2. Third-party (FastAPI, SQLAlchemy, etc.)
3. Internal application

```python
# Good
import logging
from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.app.repositories.crud_users import crud_users
from src.app.schemas.user import UserCreate
from src.app.services import user_service
```

**Function Structure:**
```python
async def get_user(
    user_uuid: UUID,
    db: AsyncSession = Depends(get_db),
) -> UserRead:
    """Get a user by UUID.
    
    Args:
        user_uuid: The unique identifier of the user.
        db: Database session.
        
    Returns:
        The user record.
        
    Raises:
        HTTPException: If user not found.
    """
    user = await user_service.get_user(db, user_uuid)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
```

**Error Handling:**
- Prefer project exceptions from `core.exceptions.http_exceptions` in routes and services instead of raising raw `HTTPException` or plain `ValueError`
- The backend uses centralized exception registration in `backend/src/app/core/exceptions/handlers.py`; keep API errors flowing through that shared handler path
- The shared response schema lives in `backend/src/app/core/schemas.py` as `ErrorResponse` / `ErrorDetail`; preserve the envelope shape `error.code`, `error.message`, `error.details`, and `error.requestId`
- Request-model validation should stay in Pydantic schemas where possible; business validation should raise explicit project exceptions such as `BadRequestException` or `NotFoundException`
- IBM Security Verify `400` errors must preserve upstream user-facing messages when they reach the shared error envelope
- When documenting route errors in OpenAPI, use `backend/src/app/core/exceptions/openapi.py:error_responses(...)` instead of ad hoc `responses` dicts
- Always return proper HTTP status codes

**Database:**
- Use async SQLAlchemy 2.0 patterns
- Use FastCRUD-backed repository adapters for database operations
- Keep queries in the repository layer, business logic in services

**Type Hints:**
- Always use type hints for function parameters and returns
- Use `Optional[X]` over `X | None`
- Enable mypy strict mode for `src.app.*`

**Backend Verification:**
- For backend changes that touch shared contracts, prefer verifying with `make bk-test`, `make bk-lint`, and `make bk-typecheck`

**RP Application Developer Invitations:**
- Workspace admins can invite arbitrary email addresses to a specific RP application through GC Notify
- Unknown OIDC users must not be auto-provisioned unless their email has an active RP application invitation
- Blocked OIDC sign-ins redirect to `/access-denied` via `OIDC_ACCESS_DENIED_REDIRECT` and must not create a backend session
- Invited developers use app-scoped current-user endpoints under `/api/v1/rp-applications/mine` rather than workspace-scoped routes
- V1 invited-developer permissions are intentionally narrow: view and edit RP application details only, without workspace membership

---

## Project Structure

### Backend (`backend/src/app/`)

```
app/
├── api/v1/          # API endpoints
├── core/            # Config, security, workers
├── models/          # SQLAlchemy models
├── repositories/    # Database FastCRUD adapters and IBM SV clients
├── schemas/         # Pydantic schemas
├── services/        # Business logic
└── main.py          # FastAPI app factory
```

### Frontend (`frontend/src/`)

```
src/
├── components/      # Shared UI components
│   ├── layout/      # App shell, page layouts
│   └── ui/          # GCDS-based primitives
├── features/        # Feature-owned code
│   └── <feature>/
│       ├── pages/   # Page components
│       └── hooks/   # Feature hooks
├── routes/          # TanStack Router definitions
├── store/           # Zustand stores
├── hooks/           # Shared hooks
├── fetch/           # API client utilities
├── types/           # TypeScript types
└── utils/           # Utility functions
```

---

## Key Technologies

| Layer | Technology |
|-------|------------|
| Backend Framework | FastAPI |
| Database | PostgreSQL + SQLAlchemy 2.0 |
| Auth | Authlib (OIDC) + JWT |
| Cache/Sessions | Redis |
| Background Jobs | ARQ |
| Authorization | Casbin |
| Frontend Framework | React 19 |
| Routing | TanStack Router |
| State | Zustand |
| Forms | React Hook Form + Zod |
| Testing | Vitest + Playwright |
| UI Components | GCDS (Government of Canada) |

---

## Environment Variables

### Backend
Create `backend/src/.env` with:
- `ENVIRONMENT`: local/staging/production
- Database, Redis, OIDC, and session variables

### Frontend
Environment variables in `frontend/.env`:
- `VITE_API_BASE_URL`: Backend API URL

**Never commit secrets or `.env` files.**

---

## Testing Guidelines

### Unit Tests
- Test one thing per test
- Use descriptive test names: `test_description_of_behavior`
- Follow AAA pattern: Arrange, Act, Assert
- Mock external dependencies (Redis, external APIs)

### Integration Tests
- Test real HTTP endpoints with TestClient
- Use test database fixtures
- Verify status codes and response shapes

### E2E Tests (Frontend)
- Test critical user flows
- Use Playwright with proper selectors
- Clean up test data

---

## Resources

- Backend docs: `backend/docs/`
- Frontend README: `frontend/README.md`
