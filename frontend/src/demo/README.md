# Demo Folder

This folder contains demo-only and sample-only frontend code that is not part of the active application surface.

Contents include:

- sample pages and experiments under `pages/`
- demo-specific UI components under `components/`
- demo data fixtures under `data/`

Rules:

- do not import from `src/demo` into production routes, features, or shared components
- if a demo becomes a real product feature, move it back into `src/features` or another production folder
- keep demo-only assets, fixtures, and helper components inside `src/demo` rather than `src/components` or other shared folders

Note:

The TypeScript config excludes `src/demo/**`, so this area is intentionally isolated from the production type-checked app surface.