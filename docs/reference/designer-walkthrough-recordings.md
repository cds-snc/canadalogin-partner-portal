# Designer Walkthrough Recordings

This local-only workflow records role-based English desktop walkthroughs from
the full application at `http://127.0.0.1:3000`. It uses only the guarded,
synthetic `local.example` persona namespace. Generated media and runtime
manifests are disposable and ignored by Git.

## Record the walkthroughs

The backend must use the exact local persona gate:
`ENVIRONMENT=local`, `AUTH_MODE=local_dev`, and
`ENABLE_DEV_ROLE_SELECTOR=true`. PostgreSQL and Redis must contain the current
deterministic persona seed before capture.

Do not run `make db-reset-local`, remove Compose volumes, or clear PostgreSQL or
Redis for a recording. An older fixture catalog or developer-authored child may
correctly cause the exact normal seed to refuse the existing namespace. Do not
weaken that preservation check or reset developer data; use the dedicated,
non-destructive walkthrough profile below.

In one terminal, from the repository root:

```sh
make start-walkthrough-personas
```

In another terminal:

```sh
cd frontend
corepack pnpm typecheck
corepack pnpm walkthrough:list
corepack pnpm walkthrough:record
```

`start-walkthrough-personas` creates or reuses the dedicated
`partner_portal_walkthroughs` PostgreSQL database and Redis logical databases
12 through 15, applies migrations, validates or seeds only the synthetic
fixture namespace, and then starts the local app. It does not reset or delete
the normal developer database or cache profile. The target pins PostgreSQL and
all four Redis clients to loopback endpoints, with fixed local PostgreSQL
credentials and unencrypted, password-free Redis connections, so a developer
`.env` cannot redirect walkthrough seeding to shared persistence.
The recorder itself does not start, reset, or reseed the backend.

The combined `typecheck` command is mandatory before capture: it checks both the
application and the separately configured Node-based walkthrough sources.

The walkthrough app uses the normal loopback ports, so stop another local app
process with `Ctrl-C` before starting it. Stop the walkthrough app with
`Ctrl-C` after capture. Its isolated database and cache records can remain for
repeat recordings; no cleanup or volume deletion is required.

Expected files under the ignored `frontend/walkthrough-recordings/` directory:

| Journey        | Video               | Timestamp manifest           |
| -------------- | ------------------- | ---------------------------- |
| CL Admin       | `cl-admin.webm`     | `cl-admin.manifest.json`     |
| RP Admin       | `rp-admin.webm`     | `rp-admin.manifest.json`     |
| RP User (Edit) | `rp-user-edit.webm` | `rp-user-edit.manifest.json` |
| Read Only      | `read-only.webm`    | `read-only.manifest.json`    |
| No access      | `no-access.webm`    | `no-access.manifest.json`    |
| All journeys   | —                   | `manifest.json`              |

Each page entry records its stable sequence, resolved route, H1, language, and
approximate start and end offsets from the beginning of that persona's video.
Stable output names are overwritten by the next run. The hidden `.playwright/`
subdirectory contains intermediate runner artifacts and must not be shared.

## Capture settings

| Setting                | Default                                                                                  |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| Browser and viewport   | Chromium, 1440 by 900 CSS pixels                                                         |
| Language               | English (`en-CA`); CL Admin demonstrates the French toggle once and returns to English   |
| Motion and page pace   | Reduced motion, readable incremental scrolling, approximately 6 seconds per settled page |
| Interaction visibility | High-contrast pointer, click ring, and focus outline added only to the recording context |
| Sessions               | One new browser context and backend session cookie per persona                           |
| Network boundary       | HTTP loopback requests only; non-loopback HTTP(S) requests are blocked                   |
| Media format           | Playwright WebM, one file per persona                                                    |
| Fixed MAU fixture week | August 18 through August 24, 2026                                                        |

`WALKTHROUGH_HOLD_MS` can shorten pauses for harness diagnostics, but deliverable
recordings should keep the 6000 ms default. `WALKTHROUGH_OUTPUT_DIR` can move
the output directory, but only the default directory is ignored by the tracked
frontend `.gitignore`; a custom directory may be tracked and its stable output
names are still overwritten. `WALKTHROUGH_BASE_URL` accepts only an HTTP
loopback origin and defaults to `http://127.0.0.1:3000`.

Every captured route asserts its expected H1 and, where useful, a seeded page
marker. The run fails if a protected journey renders Access denied, a generic
error route, a danger notice, or a page that remains in a loading state. The
short no-access journey is the sole explicit Access-denied exception.

## Journey index

UUID segments below are discovered through visible table actions and links;
they are not embedded in the recorder.

### CL Admin

- Local persona selector, authenticated Home, and one French/English language
  toggle demonstration.
- `/onboarding-oversight`, `/onboarding-oversight/queue`, and one seeded
  `.../rp-configurations/{rpConfigurationUuid}/production-review` record.
- `/workspaces`, the selected `{workspaceUuid}` task hub, Applications list,
  selected `{applicationInformationUuid}` task hub, application details, and
  checklist/CATS context, plus the safe create-workspace form without
  submitting it.
- Workspace access hub, role-assignment list/detail/add form, invitation
  list/detail/create form, without submitting a mutation.
- `/administration`, `/users`, one selected user task hub and its visible
  global/workspace/invitation tasks, `/users/invite`, and `/roles`.
- `/support` and `/account`; external support actions are not followed.

### RP Admin

- Home, workspace list/task hub, Applications list/task hub, details and edit
  form, create-Application form, contacts list/create/edit forms, and
  checklist/CATS context.
- RP-configuration list, all four named seeded configuration overview states,
  create form, one saved-configuration view, and visible registration,
  Partner-environment, copy, settings, and Production-review pages.
- Workspace settings, role-assignment list/detail/add form, and invitation
  list/detail/create form, without submitting a mutation.
- `/reports`, `/reports/applications`, one populated monthly active user report,
  explicitly filtered to August 18 through August 24, 2026, `/support`, and
  `/account`.

### RP User (Edit)

- The same application-information, contact, checklist, RP-configuration,
  registration, copy, settings, Production-review, and report surfaces that
  are visible for this role.
- Workspace access administration and workspace settings are omitted because
  they are not role-reachable.
- Includes `/support` and ends on `/account`.

### Read Only

- Home, workspace and Application task hubs, application details, contacts,
  checklist/CATS context, and all four named RP-configuration overview states.
- One saved-configuration view, visible Production-review status, Reports
  chooser, populated monthly active user report, `/support`, and `/account`.
- Create, edit, copy, settings, access-administration, and credential actions
  are not followed.

### No access

- The visible local persona selector followed by the short `/access-denied`
  journey. No protected task page is opened.

## Deliberate exclusions and review

The capture excludes compatibility redirects, layout-only route modules,
destructive submissions, delete-only terminal actions, invitation acceptance
URLs or tokens, and live IBM Security Verify, S3, GC Notify, Jira, or email
actions. Credential pages and retained-registration adoption/provider
comparison are listed as unavailable instead of being simulated. The recorder
never clicks CSV export or external support links.

Stored invitation examples use opaque fixed digests with no token preimage in
the fixture source. The walkthrough does not exercise invitation acceptance.

Before sharing a regenerated set, run the recorder twice to compare manifest
route order, then watch every WebM from beginning to end. Confirm that pages
finish loading, scrolling and pauses are readable, each role exposes only its
expected actions, synthetic values remain visibly fake, and no token, secret,
credential, or real personal information appears.

Share only the reviewed role `.webm` files and JSON manifests listed above.
Exclude the hidden `.playwright/` directory, failed partial recordings, and any
custom output directory that has not been checked for tracked or unrelated
files.
