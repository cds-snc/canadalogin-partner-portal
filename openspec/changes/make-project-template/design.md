## Context

The current repository is a working monorepo for the CanadaLogin Partner Portal with a FastAPI backend, a Vite and React frontend, shared auth and session flows, access-control enforcement, seeded department data, and substantial partner-portal-specific business logic. The requested change is not to redesign the stack, but to reclassify the repository so it can serve as a reusable template while preserving the current business implementation as an archived example under `demo/`.

Today, infrastructure and domain behavior are interwoven across backend services, API routes, frontend pages, tests, docs, and migrations. The repository already has a `demo/` subtree, which creates a straightforward archive target for business features that should no longer define the template’s primary surface. The main constraint is that the resulting template must remain coherent and runnable: auth/session scaffolding, access-control primitives, shared error handling, common developer tooling, and the department list stay in the core, while partner-portal workflows move out of the core path without breaking the repo’s structure or making the example impossible to understand.

Stakeholders are future internal teams adopting this repository as a starter, current maintainers who need a low-risk migration path, and reviewers who need a clear explanation of which capabilities are “template core” versus “demo-only”.

## Goals / Non-Goals

**Goals:**
- Define a stable template-core boundary for backend, frontend, tests, and documentation.
- Preserve infrastructure services, auth/session scaffolding, access control, and the department list in the main apps.
- Move partner-portal-specific business logic into `demo/backend/` and `demo/frontend/` as the archived reference implementation.
- Minimize refactoring by favoring relocation, pruning, and thin boundary cleanup over new abstraction layers.
- Leave the repository in a state where later artifacts can specify concrete inventories, migration tasks, and verification steps.

**Non-Goals:**
- Re-architect the monorepo into a plugin platform or package-based extension system.
- Replace the current backend or frontend frameworks.
- Design every individual file move in this artifact; that belongs in later specs and tasks.
- Generalize every domain concept into reusable primitives if relocation is sufficient.
- Preserve the current portal UX as the default main-app experience if doing so conflicts with a clean template boundary.

## Decisions

### 1. Use a “template core plus archived demo” repository model
The main `backend/` and `frontend/` directories remain the supported starter. The existing `demo/` subtree becomes the home for archived partner-portal business behavior. This is the least disruptive way to satisfy the change goal because it keeps a runnable example in-repo while clearly separating the reusable platform from the sample domain implementation.

### 2. Keep cross-cutting platform capabilities in the template core
The core retains app bootstrapping, auth/session scaffolding, access-control enforcement, shared API and UI primitives, common test harnesses, and developer tooling. These are reusable concerns with value beyond the current portal. Access control specifically remains in core because it is an architectural capability, not just a business feature.

### 3. Treat the department list as a deliberate exception to the “move domain logic out” rule
The department list remains in the template core as the one preserved domain dataset. This avoids over-pruning a useful seeded reference dataset and follows the user’s stated requirement. Later specs should define exactly which backend models, seeds, APIs, and frontend consumers remain tied to departments in core.

### 4. Move partner-portal workflows by feature boundary, not by technical layer alone
Business capabilities such as workspace management, RP application flows, invitation-driven developer experiences, user and role management screens tied to the current portal, and related tests/docs should move together by feature. Splitting only routes while leaving services or tests behind would create a confusing hybrid. The migration should therefore inventory each business capability end-to-end and relocate or archive the corresponding backend, frontend, test, and docs surfaces together.

### 5. Prefer a thin runnable core over preserving current product behavior in place
After feature moves, the main apps may need a smaller default navigation, reduced route set, and a simplified startup experience. That is acceptable. The template’s success criterion is clarity and reusability, not preserving every current business screen in the primary app path.

### Alternatives Considered
- **Minimal-starter rewrite**: Cleaner on paper, but too disruptive and unnecessary for a first conversion.
- **Plugin or package architecture first**: More extensible long term, but unjustified complexity before the boundary is proven.
- **Leave business logic in place and document it as optional**: Lowest effort short term, but it fails to make the repository meaningfully template-oriented.

## Risks / Trade-offs

- **Boundary ambiguity** → Some code mixes infrastructure and portal behavior. Mitigation: define capability inventories in later specs and decide ownership feature-by-feature.
- **Demo drift from core conventions** → Archived features could stop matching the template’s tooling and patterns. Mitigation: keep demo inside the monorepo and validate it with targeted tests where retained.
- **Migration complexity in database/schema assets** → Migrations and seeded data may span both core and archived concerns. Mitigation: specify a schema-separation strategy before implementation tasks are finalized.
- **Reduced out-of-the-box functionality in the main app** → The template may feel less complete after feature removal. Mitigation: document the template’s purpose clearly and keep the demo runnable as the richer example.
- **Auth boundary confusion** → Current OIDC behavior may include tenant-specific assumptions that are not template-safe. Mitigation: separate generic auth scaffolding from portal-specific configuration and flows in later specs.

## Migration Plan

1. Produce a proposal that defines the user-facing scope of the template conversion and identifies the major retained capabilities.
2. Break the work into capability-level specs that classify backend, frontend, data, and docs surfaces as either template core or demo.
3. Use tasks to sequence relocation work so each capability moves coherently across layers.
4. During implementation, keep the main apps runnable after each step by trimming navigation and wiring as features leave core.
5. Validate both the template core and the archived demo with focused test runs, then update top-level documentation to explain how to use each.
6. If a migration step causes unacceptable breakage, rollback by restoring the affected capability to core until its boundary is better specified.

## Open Questions

- Should template core authentication include a working OIDC example configuration path, or only the scaffolding and extension points?
- How should Alembic history and database bootstrap assets be divided between core and demo without making local setup brittle?
- Which documentation should remain top-level versus move under demo-specific docs once the template conversion is complete?
- Should the main frontend ship with placeholder sample pages, or should it present only the minimal routes needed to demonstrate the template infrastructure?