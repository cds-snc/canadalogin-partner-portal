# CanadaLogin Partner Portal - Frontend

Frontend application for the CanadaLogin Partner Portal.

## Table of Contents

- [Overview](#overview)
- [Requirements](#requirements)
- [Getting Started](#getting-started)
- [Important Note](#important-note)
- [Testing](#testing)
- [Preparing for Deployment](#preparing-for-deployment)
- [DevTools](#devtools)
- [Installed Packages](#installed-packages)

## Overview

Built with type safety, scalability, and developer experience in mind.

- [pnpm](https://pnpm.io) - A strict and efficient alternative to npm with up to 3x faster performance
- [TypeScript](https://www.typescriptlang.org) - A typed superset of JavaScript designed with large scale applications in mind
- [ESLint](https://eslint.org) - Static code analysis to help find problems within a codebase
- [Prettier](https://prettier.io) - An opinionated code formatter
- [Vite](https://vitejs.dev) - Feature rich and highly optimized frontend tooling with TypeScript support out of the box
- [React](https://react.dev) - A modern front-end JavaScript library for building user interfaces based on components
- [Tailwind CSS](https://tailwindcss.com) - A utility-first CSS framework packed with classes to build any web design imaginable
- [Storybook](https://storybook.js.org) - A frontend workshop for building UI components and pages in isolation
- [TanStack Router](https://tanstack.com/router/v1) - Fully typesafe, modern and scalable routing for React applications
- [TanStack Query](https://tanstack.com/query/latest) - Declarative, always-up-to-date auto-managed queries and mutations
- [TanStack Table](https://tanstack.com/table/v8) - Headless UI for building powerful tables & datagrids
- [Zustand](https://zustand-demo.pmnd.rs) - An unopinionated, small, fast and scalable bearbones state-management solution
- [React Hook Form](https://react-hook-form.com) - Performant, flexible and extensible forms with easy-to-use validation
- [Zod](https://zod.dev) - TypeScript-first schema validation with static type inference
- [React Testing Library](https://testing-library.com) - A very light-weight, best practice first, solution for testing React components
- [Vitest](https://vitest.dev) - A blazing fast unit test framework powered by Vite
- [Playwright](https://playwright.dev) - Enables reliable end-to-end testing for modern web apps
- [Nivo](https://nivo.rocks) - A rich set of data visualization components, built on top of D3 and React
- [react-i18next](https://react.i18next.com/) - A powerful internationalization framework for React/React Native based on i18next
- [Faker](https://fakerjs.dev/) - Generate massive amounts of fake (but realistic) data for testing and development
- [Dayjs](https://day.js.org/en/) - A minimalist JavaScript library that parses, validates, manipulates, and displays dates and times for modern browsers
- [Husky](https://github.com/typicode/husky#readme) + [Commitizen](https://github.com/commitizen/cz-cli#readme) + [Commitlint](https://github.com/conventional-changelog/commitlint#readme) - Git hooks and commit linting to ensure use of descriptive and practical commit messages
- [ts-reset](https://github.com/total-typescript/ts-reset#readme) - Improvements for TypeScripts built-in typings for use in applications
- [Docker](https://www.docker.com) - Containerization tool for deploying the frontend

A more detailed list of the included packages can be found in the [Installed Packages](#installed-packages) section. Packages not shown above include Devtools, ui helper libraries, and eslint plugins/configs.

## Requirements

- [NodeJS 18+](https://nodejs.org/en)
- [pnpm](https://pnpm.io) (or equivalent)

If you'd like to use the included Dockerfile then [Docker](https://www.docker.com) is required as well:

## Getting Started

Getting started is a simple as cloning the repository

Installing dependencies

```
pnpm install
pnpm run dev
```

Useful commands:

```sh
pnpm run lint
pnpm run test:unit
pnpm run test:e2e
pnpm run build
pnpm run preview
```

## Application Structure

Top-level source directories:

- `src/routes/` - TanStack Router route files.
- `src/features/` - Feature-owned pages, hooks, and related code.
- `src/components/` - Shared layout, UI, form, chart, and utility components.
- `src/pages/` - Root-level static pages.
- `src/hooks/` - Shared hooks exported across features.
- `src/store/` - Zustand stores.
- `src/fetch/` - Shared fetch utilities and request helpers.
- `src/common/`, `src/types/`, `src/utils/`, `src/lib/` - Shared support code.

## Routing Model

This frontend uses file-based TanStack Router routes in `src/routes/`.

- Route files define route paths, loaders, search params, and auth guards.
- Route components usually render pages from `src/features/*/pages/`.
- `src/routes/__root.ts` provides the application shell.
- `src/routeTree.gen.ts` is generated and should not be edited manually.

Examples:

- `src/routes/login.ts` maps to the auth login page.
- `src/routes/access.ts` maps to the access feature.
- `src/routes/dashboard.ts` maps to the dashboard feature.

## Feature Organization

Current feature directories include:

- `access/`
- `auth/`
- `dashboard/`
- `policies/`
- `posts/`
- `roles/`
- `system/`
- `tiers/`
- `user-roles/`
- `users/`

The common pattern is:

- `features/<feature>/pages/` for page components.
- `features/<feature>/hooks/` for feature-specific hooks where needed.

Example paths:

- `src/features/auth/pages/LoginPage.tsx`
- `src/features/auth/pages/ProfilePage.tsx`
- `src/features/access/pages/AccessPage.tsx`

## Layout And Shared UI

Shared layout components live in `src/components/layout/`.

Important layout components:

- `AppShell` - global app chrome.
- `PageContent` - vertical page content wrapper inside the shell.
- `CenteredPageLayout` - constrained centered content layout.
- `ContentPageLayout` - constrained left-aligned content layout.

Shared UI primitives live in `src/components/ui/` and wrap GCDS components where appropriate.

## Auth And Session Flow

Key auth-related files:

- `src/features/auth/hooks/use-session.ts` - current session state and login or logout actions.
- `src/features/auth/auth-routing.ts` - auth route guards such as redirect and require-authenticated behavior.
- `src/store/auth-store.ts` - global auth state.

When working on authenticated pages, check both the route guard and the session hook behavior.

## Testing

Unit tests live under `tests/unit/` and run with Vitest.

```sh
pnpm run test:unit
pnpm run test:unit:coverage
```

End-to-end tests live under `e2e/` and run with Playwright.

```sh
pnpm run test:e2e
pnpm run test:e2e:report
```

The aggregate `pnpm run test` command runs unit tests and Playwright.

## Storybook

Storybook is available for isolated component work.

```sh
pnpm run storybook
pnpm run storybook:build
```

## Environment Notes

- Vite environment variables are read through `import.meta.env`.
- If `VITE_API_BASE_URL` is unset, local auth behavior depends on the browser hostname matching the backend cookie origin.
- Prefer keeping frontend and backend on matching local hosts such as both `127.0.0.1` or both `localhost`.
- `VITE_SESSION_WARNING_AFTER_MINUTES` controls when the inactivity warning modal appears (default: `25`).
- `VITE_SESSION_COUNTDOWN_MINUTES` controls the warning countdown duration before auto-logout (default: `5`).

## Notes For Contributors

- Follow the existing feature-based structure instead of adding page logic into shared folders.
- Keep route definitions in `src/routes/` and page components in `src/features/*/pages/`.
- Reuse shared layout components before introducing new top-level page wrappers.
- Treat placeholder README files under `src/` as lightweight guidance only and verify the real code structure before copying patterns.
