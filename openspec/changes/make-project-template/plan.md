# Make Project Template Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development
> to implement this plan task-by-task.

**Goal:** Convert the main backend and frontend into a reusable template while preserving access control, auth/session scaffolding, and the department list in core, and relocating partner-portal business features into `demo/` as a coherent reference implementation.

**Architecture:** The implementation proceeds in two layers: first define and enforce the core-vs-demo boundary in the main backend and frontend surfaces, then relocate product-specific workflows, tests, and docs into `demo/` without breaking the main template boot path. The work should keep shared infrastructure in place, trim main-app route and API wiring to core capabilities, and update documentation and verification so adopters can clearly distinguish template behavior from demo behavior.

**Tech Stack:** FastAPI, SQLAlchemy 2.0, Authlib, Redis sessions, Casbin, Alembic, React, Vite, TanStack Router, TanStack Query, Zustand, Vitest, Playwright, OpenSpec.

---

## Task 1: Inventory and classify template core versus demo features

**Files:**
- Modify: `openspec/changes/make-project-template/tasks.md`
- Create: `docs/plans/2026-05-29-make-project-template-inventory-notes.md` (working notes during apply if useful)
- Review: `backend/src/app/api/v1/departments.py`
- Review: `backend/src/app/api/v1/oidc.py`
- Review: `backend/src/app/api/v1/logout.py`
- Review: `backend/src/app/api/v1/health.py`
- Review: `backend/src/app/api/v1/policies.py`
- Review: `backend/src/app/api/v1/roles.py`
- Review: `backend/src/app/api/v1/tiers.py`
- Review: `backend/src/app/api/v1/users.py`
- Review: `backend/src/app/api/v1/workspaces.py`
- Review: `backend/src/app/services/department_service.py`
- Review: `backend/src/app/services/auth_service.py`
- Review: `backend/src/app/services/oidc_service.py`
- Review: `backend/src/app/services/policy_service.py`
- Review: `backend/src/app/services/role_service.py`
- Review: `backend/src/app/services/tier_service.py`
- Review: `backend/src/app/services/user_service.py`
- Review: `backend/src/app/services/workspace_service.py`
- Review: `frontend/src/routes/departments.ts`
- Review: `frontend/src/routes/login.ts`
- Review: `frontend/src/routes/logout.ts`
- Review: `frontend/src/routes/access-denied.ts`
- Review: `frontend/src/routes/health.ts`
- Review: `frontend/src/routes/users.ts`
- Review: `frontend/src/routes/roles.ts`
- Review: `frontend/src/routes/tiers.ts`
- Review: `frontend/src/routes/workspaces.ts`
- Review: `frontend/src/routes/workspaces/$workspaceUuid.ts`
- Review: `frontend/src/routes/invitations/rp-applications.ts`
- Review: `frontend/src/routes/rp-applications/mine/$rpApplicationUuid.ts`
- Review: `frontend/src/features/departments/pages/DepartmentsPage.tsx`
- Review: `frontend/src/features/auth/pages/LoginPage.tsx`
- Review: `frontend/src/features/auth/pages/AccessDeniedPage.tsx`
- Review: `frontend/src/features/dashboard/pages/DashboardPage.tsx`
- Review: `frontend/src/features/workspaces/pages/WorkspacesPage.tsx`

- [ ] **Step 1:** Read the route and service files above and annotate each feature as `core`, `demo`, or `needs split` in working notes.
- [ ] **Step 2:** Cross-check the classification against `openspec/changes/make-project-template/specs/template-core-boundary/spec.md` and `openspec/changes/make-project-template/specs/demo-feature-archive/spec.md`.
- [ ] **Step 3:** Identify which files support department data, auth/session scaffolding, access control, and health/status behavior and mark them as non-movable core.
- [ ] **Step 4:** Identify which workspace, RP application, invitation, user-management, role, tier, and policy surfaces are business-specific and should move to demo unless they are needed as retained access-control primitives.
- [ ] **Step 5:** Update `openspec/changes/make-project-template/tasks.md` checkboxes for section `1.x` as each inventory subtask is completed.
- [ ] **Step 6:** Commit the classification notes and any checklist updates.

## Task 2: Make backend core independent from archived business workflows

**Files:**
- Modify: `backend/src/app/api/v1/__init__.py`
- Modify: `backend/src/app/main.py`
- Modify: `backend/src/app/api/v1/departments.py`
- Modify: `backend/src/app/api/v1/oidc.py`
- Modify: `backend/src/app/api/v1/logout.py`
- Modify: `backend/src/app/api/v1/health.py`
- Modify: `backend/src/app/services/department_service.py`
- Modify: `backend/src/app/services/auth_service.py`
- Modify: `backend/src/app/services/oidc_service.py`
- Modify: `backend/src/app/repositories/crud_departments.py`
- Modify: `backend/src/app/models/department.py`
- Review for removal or relocation: `backend/src/app/api/v1/policies.py`, `backend/src/app/api/v1/roles.py`, `backend/src/app/api/v1/tiers.py`, `backend/src/app/api/v1/users.py`, `backend/src/app/api/v1/workspaces.py`, `backend/src/app/services/policy_service.py`, `backend/src/app/services/role_service.py`, `backend/src/app/services/tier_service.py`, `backend/src/app/services/user_service.py`, `backend/src/app/services/workspace_service.py`
- Test: `backend/tests/test_main.py`
- Test: `backend/tests/test_auth_endpoints.py`
- Test: `backend/tests/test_auth_service.py`
- Test: `backend/tests/test_oidc_auth.py`
- Test: `backend/tests/test_oidc_service.py`
- Test: `backend/tests/test_department.py`
- Test: `backend/tests/test_department_service.py`
- Test: `backend/tests/test_health.py`
- Test: `backend/tests/test_health_service.py`

- [ ] **Step 1:** Write or update backend tests so the main app is expected to boot and expose only retained core routes when demo-only APIs are removed from the primary surface.
- [ ] **Step 2:** Run `cd backend && UV_PROJECT_ENVIRONMENT=../.venv uv run pytest tests/test_main.py tests/test_auth_endpoints.py tests/test_oidc_auth.py tests/test_department.py tests/test_health.py -q` and confirm the current failures describe the outdated full-product surface.
- [ ] **Step 3:** Update `backend/src/app/main.py` and related API registration code so the core app keeps auth, logout, health, and departments wired while demo-only business endpoints are detached from the main template path.
- [ ] **Step 4:** Update department services and repositories only as needed so department-list data remains usable without depending on archived workspace or RP-application flows.
- [ ] **Step 5:** Re-run `cd backend && UV_PROJECT_ENVIRONMENT=../.venv uv run pytest tests/test_main.py tests/test_auth_endpoints.py tests/test_oidc_auth.py tests/test_department.py tests/test_health.py tests/test_department_service.py tests/test_health_service.py -q` until the retained core slice passes.
- [ ] **Step 6:** Commit the backend core-boundary changes.

## Task 3: Move backend business features into demo ownership

**Files:**
- Create or modify under demo: `demo/backend/src/app/api/v1/`
- Create or modify under demo: `demo/backend/src/app/services/`
- Create or modify under demo: `demo/backend/src/app/models/`
- Create or modify under demo: `demo/backend/src/app/schemas/`
- Create or modify under demo: `demo/backend/src/app/crud/`
- Review source candidates: `backend/src/app/api/v1/policies.py`, `backend/src/app/api/v1/roles.py`, `backend/src/app/api/v1/tiers.py`, `backend/src/app/api/v1/users.py`, `backend/src/app/api/v1/workspaces.py`, `backend/src/app/services/policy_service.py`, `backend/src/app/services/role_service.py`, `backend/src/app/services/tier_service.py`, `backend/src/app/services/user_service.py`, `backend/src/app/services/workspace_service.py`, `backend/src/app/repositories/crud_access_policies.py`, `backend/src/app/repositories/crud_roles.py`, `backend/src/app/repositories/crud_tier.py`, `backend/src/app/repositories/crud_users.py`, `backend/src/app/repositories/crud_workspaces.py`, `backend/src/app/repositories/crud_workspace_members.py`, `backend/src/app/repositories/crud_rp_applications.py`, `backend/src/app/repositories/crud_application_infos.py`, `backend/src/app/repositories/crud_application_contacts.py`, `backend/src/app/repositories/crud_rp_application_developer_invitations.py`, `backend/src/app/models/access_policy.py`, `backend/src/app/models/role.py`, `backend/src/app/models/tier.py`, `backend/src/app/models/user.py`, `backend/src/app/models/workspace.py`, `backend/src/app/models/workspace_member.py`, `backend/src/app/models/rp_application.py`, `backend/src/app/models/application_info.py`, `backend/src/app/models/application_contact.py`, `backend/src/app/models/rp_application_developer_invitation.py`
- Test: `backend/tests/test_policy.py`
- Test: `backend/tests/test_policy_service.py`
- Test: `backend/tests/test_role.py`
- Test: `backend/tests/test_role_service.py`
- Test: `backend/tests/test_tier.py`
- Test: `backend/tests/test_tier_service.py`
- Test: `backend/tests/test_user.py`
- Test: `backend/tests/test_user_service.py`
- Test: `backend/tests/test_workspace_service.py`
- Test: `backend/tests/test_workspaces_api.py`
- Test: `backend/tests/test_application_info_api.py`
- Test: `backend/tests/test_application_info_service.py`

- [ ] **Step 1:** Choose one backend business capability cluster at a time, starting with policies and roles, and write a failing import or routing test in the demo surface if no equivalent demo coverage exists yet.
- [ ] **Step 2:** Move the selected backend files into matching `demo/backend/src/app/...` locations or create thin adapters there, keeping imports explicit and feature-complete inside the demo boundary.
- [ ] **Step 3:** Remove or replace the moved feature’s registration from the main backend so the template core no longer exposes it by default.
- [ ] **Step 4:** Port or duplicate the relevant backend tests into `demo/backend/tests/` as needed so the archived behavior remains covered.
- [ ] **Step 5:** Run the narrow backend checks for the moved capability plus the demo tests you added, then repeat for the next business capability cluster.
- [ ] **Step 6:** Commit after each capability cluster, with separate commits for policies or roles, users or tiers, and workspaces or RP applications if the moves are sizable.

## Task 4: Trim the frontend main app to the retained template surface

**Files:**
- Modify: `frontend/src/routes/__root.ts`
- Modify: `frontend/src/routes/index.ts`
- Modify: `frontend/src/routes/login.ts`
- Modify: `frontend/src/routes/logout.ts`
- Modify: `frontend/src/routes/access-denied.ts`
- Modify: `frontend/src/routes/health.ts`
- Modify: `frontend/src/routes/departments.ts`
- Modify: `frontend/src/pages/Home.tsx`
- Modify: `frontend/src/store/auth-store.ts`
- Modify: `frontend/src/features/auth/auth-routing.ts`
- Modify: `frontend/src/features/auth/hooks/use-session.ts`
- Modify: `frontend/src/features/departments/pages/DepartmentsPage.tsx`
- Review for removal or relocation: `frontend/src/routes/users.ts`, `frontend/src/routes/roles.ts`, `frontend/src/routes/tiers.ts`, `frontend/src/routes/workspaces.ts`, `frontend/src/routes/workspaces/$workspaceUuid.ts`, `frontend/src/routes/invitations/rp-applications.ts`, `frontend/src/routes/rp-applications/mine/$rpApplicationUuid.ts`, `frontend/src/features/users/pages/UsersPage.tsx`, `frontend/src/features/roles/pages/RolesPage.tsx`, `frontend/src/features/tiers/pages/TiersPage.tsx`, `frontend/src/features/dashboard/pages/DashboardPage.tsx`, `frontend/src/features/workspaces/pages/WorkspacesPage.tsx`, `frontend/src/features/workspaces/pages/WorkspaceDetailPage.tsx`, `frontend/src/features/workspaces/pages/RPApplicationDetailPage.tsx`, `frontend/src/features/workspaces/pages/CurrentUserRPApplicationDetailPage.tsx`, `frontend/src/features/workspaces/pages/RPApplicationInvitationPage.tsx`
- Test: `frontend/tests/unit/features/auth/use-session.test.tsx`
- Test: `frontend/tests/unit/features/auth/auth-routing.test.ts`
- Test: `frontend/tests/unit/features/departments/departments-api.test.ts`
- Test: `frontend/tests/unit/pages/Home.test.tsx`
- Test: `frontend/tests/unit/pages/LoginPage.test.tsx`
- Test: `frontend/tests/unit/pages/LogoutPage.test.tsx`
- Test: `frontend/tests/unit/pages/DepartmentsPage.test.tsx`
- Test: `frontend/tests/unit/pages/HealthPage.test.tsx`

- [ ] **Step 1:** Write or update frontend unit tests so the template shell expects only auth/session, departments, health, and basic landing-page navigation in the main route tree.
- [ ] **Step 2:** Run `cd frontend && pnpm run test:unit -- tests/unit/features/auth/use-session.test.tsx tests/unit/features/auth/auth-routing.test.ts tests/unit/features/departments/departments-api.test.ts tests/unit/pages/Home.test.tsx tests/unit/pages/LoginPage.test.tsx tests/unit/pages/LogoutPage.test.tsx tests/unit/pages/DepartmentsPage.test.tsx tests/unit/pages/HealthPage.test.tsx` and confirm failures reflect the old product navigation or route assumptions.
- [ ] **Step 3:** Update the main route files, home page, and auth or department surfaces so the template shell no longer points at archived business pages.
- [ ] **Step 4:** Remove or replace any main-app dependency on workspace, RP-application, invitation, user, role, or tier pages so the core route tree stays coherent.
- [ ] **Step 5:** Re-run the focused frontend unit tests plus `cd frontend && pnpm run lint` for touched files until the retained core slice passes cleanly.
- [ ] **Step 6:** Commit the frontend core-surface changes.

## Task 5: Relocate frontend business features into demo

**Files:**
- Modify or create: `demo/frontend/src/routes/`
- Modify or create: `demo/frontend/src/features/`
- Modify or create: `demo/frontend/src/fetch/`
- Review source candidates: `frontend/src/routes/users.ts`, `frontend/src/routes/roles.ts`, `frontend/src/routes/tiers.ts`, `frontend/src/routes/workspaces.ts`, `frontend/src/routes/workspaces/$workspaceUuid.ts`, `frontend/src/routes/workspaces/index.ts`, `frontend/src/routes/workspaces/$workspaceUuid/index.ts`, `frontend/src/routes/workspaces/$workspaceUuid/applications/$rpApplicationUuid.ts`, `frontend/src/routes/workspaces/$workspaceUuid/applications/$rpApplicationUuid/index.ts`, `frontend/src/routes/workspaces/$workspaceUuid/applications/$rpApplicationUuid/usage.ts`, `frontend/src/routes/workspaces/$workspaceUuid/applications/$rpApplicationUuid/developers.ts`, `frontend/src/routes/workspaces/$workspaceUuid/application-info/$applicationInfoUuid/index.ts`, `frontend/src/routes/workspaces/$workspaceUuid/application-info/$applicationInfoUuid/contacts/index.ts`, `frontend/src/routes/workspaces/$workspaceUuid/application-info/$applicationInfoUuid/contacts/new.ts`, `frontend/src/routes/workspaces/$workspaceUuid/application-info/$applicationInfoUuid/contacts/$applicationContactUuid.ts`, `frontend/src/routes/invitations/rp-applications.ts`, `frontend/src/routes/rp-applications/mine/$rpApplicationUuid.ts`, `frontend/src/features/users/`, `frontend/src/features/roles/`, `frontend/src/features/tiers/`, `frontend/src/features/workspaces/`
- Test: `frontend/tests/unit/features/users/users-api.test.ts`
- Test: `frontend/tests/unit/features/roles/roles-api.test.ts`
- Test: `frontend/tests/unit/features/tiers/tiers-api.test.ts`
- Test: `frontend/tests/unit/features/workspaces/workspaces-api.test.ts`
- Test: `frontend/tests/unit/features/workspaces/components/WorkspaceApplicationModal.test.tsx`
- Test: `frontend/tests/unit/features/workspaces/components/ApplicationInfoModal.test.tsx`
- Test: `frontend/tests/unit/features/workspaces/components/ApplicationContactModal.test.tsx`
- Test: `frontend/tests/unit/features/workspaces/components/WorkspaceClientCredentialsModal.test.tsx`

- [ ] **Step 1:** Choose one frontend business feature cluster at a time, starting with workspaces and RP applications because they drive the largest route surface.
- [ ] **Step 2:** Create the matching `demo/frontend/src/routes`, `demo/frontend/src/features`, and `demo/frontend/src/fetch` files or move the existing code into those locations while preserving internal imports.
- [ ] **Step 3:** Update the demo route tree so archived flows still resolve coherently, including invitation and current-user RP-application paths if those remain part of the reference implementation.
- [ ] **Step 4:** Port or duplicate the relevant unit tests into `demo/frontend/tests/unit/...` or update the existing demo test coverage so the archived UI remains verifiable.
- [ ] **Step 5:** Run the narrow frontend unit tests for the moved feature cluster, then repeat for users, roles, and tiers.
- [ ] **Step 6:** Commit after each moved frontend capability cluster.

## Task 6: Separate demo-only migrations, seeds, and bootstrap assets

**Files:**
- Review: `backend/src/migrations/`
- Review: `backend/src/scripts/create_first_superuser.py`
- Review: `backend/src/scripts/create_first_tier.py`
- Review: `backend/src/scripts/seed_access_policies.py`
- Review: `backend/src/scripts/backfill_enable_users.py`
- Review: `backend/tests/test_superuser_seed_migration.py`
- Modify: `backend/README.md`
- Modify: `README.md`
- Create or modify under demo: `demo/backend/README.md`

- [ ] **Step 1:** Inventory migrations and scripts that are required for core auth, sessions, access control, and departments versus those that only support archived business workflows.
- [ ] **Step 2:** Write or update a narrow backend test or docs assertion describing which bootstrap assets remain required for the template core.
- [ ] **Step 3:** Move demo-only scripts or clearly relabel them in docs so core setup instructions no longer imply they are mandatory for the main template.
- [ ] **Step 4:** If migrations must stay physically in one history, document the split in ownership and startup expectations in README files instead of forcing an unsafe migration rewrite.
- [ ] **Step 5:** Re-run `cd backend && UV_PROJECT_ENVIRONMENT=../.venv uv run pytest tests/test_superuser_seed_migration.py -q` and any touched setup tests.
- [ ] **Step 6:** Commit the migration or bootstrap separation changes.

## Task 7: Rewrite documentation for template and demo consumers

**Files:**
- Modify: `README.md`
- Modify: `backend/README.md`
- Modify: `frontend/README.md`
- Create or modify: `demo/README.md`
- Create or modify: `demo/backend/README.md`
- Create or modify: `demo/frontend/README.md`

- [ ] **Step 1:** Update the root README to describe the repository as a template with an archived demo rather than as the partner portal product alone.
- [ ] **Step 2:** Update backend and frontend READMEs so the retained core capabilities, setup flow, and verification commands are explicit.
- [ ] **Step 3:** Add demo README content that explains which archived business features live there and how to run or inspect them.
- [ ] **Step 4:** Add extension guidance that tells template adopters where new domain logic should go and how to use demo code as a reference only.
- [ ] **Step 5:** Review the docs against `openspec/changes/make-project-template/specs/template-surface-documentation/spec.md` and close any gaps.
- [ ] **Step 6:** Commit the documentation updates.

## Task 8: Verify core and demo behavior after the conversion

**Files:**
- Review: `openspec/changes/make-project-template/tasks.md`
- Review: `README.md`
- Review: `backend/README.md`
- Review: `frontend/README.md`
- Review: `demo/`

- [ ] **Step 1:** Run `make bk-test`, `make bk-lint`, and `make bk-typecheck` from the repo root and record any failures tied to the template conversion.
- [ ] **Step 2:** Run `cd frontend && pnpm run test:unit && pnpm run lint && pnpm run build` and record any frontend regressions tied to the new core boundary.
- [ ] **Step 3:** Run the focused demo backend and frontend tests added during relocation and confirm the archived example remains coherent.
- [ ] **Step 4:** Compare the final repository layout and docs against the three capability specs in `openspec/changes/make-project-template/specs/`.
- [ ] **Step 5:** Mark completed items in `openspec/changes/make-project-template/tasks.md` and prepare `openspec/changes/make-project-template/apply.md` notes for the apply phase.
- [ ] **Step 6:** Commit the final verification pass or the last corrective changes needed before `/opsx:apply` completion.