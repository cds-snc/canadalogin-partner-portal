## Design Summary

Convert the CanadaLogin Partner Portal monorepo into a reusable template by separating framework-level capabilities from partner-portal-specific business features. The template should retain the proven backend and frontend infrastructure: FastAPI and Vite app shells, auth and session plumbing, access-control enforcement, shared error handling, developer tooling, CI-facing test structure, and the existing department list as the one canonical domain dataset that remains in the core template. Partner-portal-specific workflows, entities, routes, tests, and documentation outside that boundary should move into the existing `demo/` area so the repository still shows a complete working example without keeping that business logic in the template core.

The target shape is a layered repository with a clearly documented contract: `backend/` and `frontend/` remain the productized starter, while `demo/backend/` and `demo/frontend/` become the archived reference implementation for the current portal use case. That lets future adopters start from a lean template without losing a working example of how to extend the stack. The change should prefer relocation and boundary cleanup over abstraction-heavy refactors. Where the current code mixes infrastructure and domain concerns, the template path should keep shared primitives in place and move domain-specific services, endpoints, pages, tests, and specs under `demo/` with minimal behavior changes.

## Alternatives Considered

### Alternative A: Core template plus archived demo modules
- **Approach**: Keep the existing repo structure, define a strict template-core boundary, and move partner-portal business logic into the existing `demo/` subtree while leaving infra, auth, access control, and department data in the main apps.
- **Pros**: Smallest migration path; preserves a runnable example; keeps proven infrastructure intact; aligns directly with the requested outcome.
- **Cons**: Some boundary lines will need judgment calls; core apps may still need light cleanup after code movement; demo content must stay coherent with the template.
- **Why not chosen**: Chosen approach.

### Alternative B: Strip to a minimal starter and treat demo as a separate sample app
- **Approach**: Remove most business behavior from the main apps and rebuild a smaller starter surface, with the current portal preserved only as a detached sample.
- **Pros**: Cleanest template branding; easier for new adopters to understand what is core.
- **Cons**: Higher rewrite cost; greater regression risk; likely breaks current working paths during the transition.
- **Why not chosen**: It optimizes for conceptual purity at the expense of reuse and migration safety.

### Alternative C: Introduce a plugin-style architecture before moving domain code
- **Approach**: First refactor the repo into loadable feature packages, then classify partner-portal capabilities as optional modules.
- **Pros**: Strong long-term separation between core and domain features; scalable if many demos are expected.
- **Cons**: Significant upfront engineering cost; adds abstraction before the repository proves it needs it; risks stalling the template conversion.
- **Why not chosen**: Too much structural work for a first pass whose main goal is reclassification and relocation.

## Agreed Approach

Use Alternative A. The repository will become a template by preserving the existing technical backbone in the main backend and frontend apps, then moving partner-portal-specific business logic into `demo/` as an archived reference implementation. The template core keeps infrastructure services, access-control mechanisms, authentication and session scaffolding, shared platform utilities, and the department list. Everything else should be evaluated as domain behavior and moved behind the demo boundary unless it is required to keep the template operable as a general-purpose starter.

This approach wins because it matches the requested outcome with the least disruption. It keeps the repo runnable, keeps current access-control and platform patterns available to downstream users, and avoids an unnecessary framework redesign. It also creates a practical migration story for follow-on work: future artifacts can specify the exact inventory of retained core features, the code-move plan, the test strategy, and the documentation needed to explain how adopters use the template versus the demo.

## Key Decisions

- Retain backend and frontend infrastructure in the template core rather than rebuilding a smaller starter from scratch.
- Keep access control in the template core as a reusable cross-cutting capability, not a demo-only feature.
- Keep the department list in the template core as the only preserved domain dataset.
- Use the existing `demo/` area as the archive destination for current portal business logic instead of creating a new sample location.
- Prefer relocation and boundary clarification over pluginization or major architectural refactors.
- Treat current partner-portal workflows such as workspace, RP application, user-management, and invitation-specific business features as demo candidates unless later artifacts justify keeping part of them in core.

## Open Questions

- Should OIDC integration remain fully wired in the template core, or should the core keep only the auth scaffolding while demo retains the current tenant-specific login behavior?
- How should Alembic migrations be split so the template keeps infra and department-related schema while demo preserves the archived business tables?
- Should the main app navigation and routes ship with a minimal template experience after business pages move, or should the default runnable experience intentionally point users toward the demo modules?