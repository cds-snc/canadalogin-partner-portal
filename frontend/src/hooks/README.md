# src/hooks

This directory is the shared hook entrypoint for the application.

Feature-owned hooks can still live near their feature implementation, but cross-app consumers should import them through the shared barrel in `src/hooks/index.ts`.

Backend business-data hooks can continue to wrap React Query, while app-owned shared state hooks can wrap Zustand stores.
