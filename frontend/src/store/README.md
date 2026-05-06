# src/store

The store directory contains Zustand global stores for app-owned shared state.

Put user/session/local state here when it is shared across multiple parts of the app.

Do not move backend business data caches here; that state should stay in React Query.
