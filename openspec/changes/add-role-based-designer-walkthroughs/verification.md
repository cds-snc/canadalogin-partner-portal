# Verification: Add role-based designer walkthroughs

## Result

The local fixture, isolation, route repair, and five role recordings are ready
for human review. The change remains active and unarchived; no deployment,
publishing, commit, push, or shared-environment mutation was performed.

## Generated artifacts

| Journey        | Settled pages |  Duration |             Size |
| -------------- | ------------: | --------: | ---------------: |
| CL Admin       |            31 | 05:12.840 | 16,494,915 bytes |
| RP Admin       |            39 | 06:12.720 | 22,529,594 bytes |
| RP User (Edit) |            30 | 04:40.840 | 17,518,990 bytes |
| Read Only      |            21 | 03:12.400 | 12,220,783 bytes |
| No access      |             2 | 00:16.840 |  1,042,504 bytes |

All five individual manifests and the combined manifest report `completed`, no
failure, reduced motion, 1440 by 900 capture, and a 6000 ms page hold. All 123
headings are populated. Only reserved `local.example` invitation identities and
the loopback base URL appear in manifest text.

Two full recorder passes confirmed the same role, label, and route sequence.
One CL Admin destination used direct navigation rather than a visible link on
the final run; its expected heading and seeded page marker still passed.

## Verification performed

- The isolated `make prepare-walkthrough-personas` target completed
  idempotently with `outcome: unchanged` and exact counts for 2 applications, 3
  contacts, 2 departments, 4 invitations, 21 MAU rows, 3 grants, 2 Production
  reviews, 7 RP configurations, 1 global role, 5 users, and 2 workspaces.
- The disposable PostgreSQL integration test passed and removed only its
  uniquely named temporary database.
- Focused fixture, seed-service, profile-isolation, and PostgreSQL tests passed.
- The combined fast loop passed 535 frontend tests and 862 backend tests; 15
  backend tests were skipped by their existing opt-in conditions.
- Frontend ESLint, combined application/walkthrough typecheck, production build,
  focused route regression, and explicit changed-file Prettier checks passed.
- The ordinary Playwright configuration lists 36 tests in 4 files with no
  walkthrough journeys. The dedicated configuration lists exactly 5 journeys
  in Chromium.
- OpenSpec validation and scenario preservation passed.
- Delorean structure, state, scoped format, scoped Markdown, and secret-file
  checks passed. `git diff --check` passed.
- Every WebM decoded from its beginning to a near-final frame. A midpoint frame
  for every settled page and a near-final ending frame for every role were
  visually reviewed. Content was readable, role-appropriate, synthetic, and
  free of visible credentials, tokens, or real personal information.

## Skipped checks and remaining risk

- Gitleaks is not installed, so the optional content scan was skipped. The
  repository secret-file checks passed, and fixture/token review found no
  source-visible invitation bearer preimage.
- The repository-wide frontend format script continues to report 16 pre-existing
  source-formatting differences outside this change. Every changed frontend and
  walkthrough file passed an explicit Prettier check.
- Backend tests emit existing Starlette/httpx and intentional JWT short-key test
  warnings; neither is introduced by this change.
- Before sharing externally, a human should still play each WebM normally and
  confirm the pacing works for the intended designer.
