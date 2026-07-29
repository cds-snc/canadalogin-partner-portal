# STD-012: Testing Basics

Type: Standard
Status: Active

## Read This When

Use this for frontend tests, backend tests, integration tests, contract tests, end-to-end tests, local checks, and verification capture.

Set a simple baseline for useful tests and verification.

## Rules

- Test the behavior users, operators, or other systems rely on.
- Frontend tests use Vitest by default.
- Backend tests use pytest by default.
- Use Playwright for browser end-to-end tests when a user-facing workflow needs
  real browser coverage.
- Use Storybook or equivalent UI review fixtures for meaningful user-facing
  component, page, form, and layout states.
- Keep fast tests separate from full end-to-end, load, or long-running tests.
- Add regression tests for defects.
- Prefer focused tests near the behavior they protect.
- Avoid testing implementation details when behavior is enough.
- Record meaningful check results in the verification note.

## Examples

- Use `frontend/vitest.config.js` for frontend tests.
- Use `frontend/.storybook/` and `frontend/src/stories/` when a frontend
  maintains Storybook review fixtures.
- Keep Playwright optional unless the project has browser workflows that need it.
- Use `backend/tests/` for backend tests.
- Use `pytest.ini` for pytest and coverage settings.
- Use `make run-pytest` for backend tests.
- Keep tests independent of external services unless explicitly marked.
- Map requirements and scenarios to tests and verification when useful.

## Checks

- [ ] The highest-risk behavior has a test or documented check.
- [ ] Frontend checks cover important UI states when relevant.
- [ ] Storybook or equivalent review fixtures cover important user-facing UI
      states when relevant.
- [ ] Backend checks cover important success and failure paths.
- [ ] Fast checks remain fast and reliable.
- [ ] Skipped checks have a reason.
- [ ] Verification links to the scenario, issue, contract, or ADR when useful.
- [ ] Remaining coverage gaps are clear.

## Related Schema Contracts

- Schema contract: [ARCH-SCHEMA-STD-012-TESTING-BASICS](../schemas/standards/std-012-testing-basics.schema.yaml)
- Used for: helping agents and reviewers check success and failure coverage,
  frontend checks, backend checks, API contract checks, migration and data
  checks, skipped-check reasons, and verification evidence.
- Notes: The schema contract supports this standard. It does not replace this
  standard as the source of truth.
