# STD-015: Code Quality, Linting, and Formatting

Type: Standard
Status: Active

## Read This When

Use this when adding or changing formatting, linting, type checks, static checks, generated files, or local quality commands.

Keep source code readable, consistent, and easier to review.

## Rules

- Treat linting as part of the local quality loop.
- Keep linting rules in stack-native config files.
- Use automatic formatting where practical.
- Provide a local auto-fix command for formatter-only failures.
- Run configured checks locally and in CI.
- Do not add broad lint disables without a short reason.
- Prefer fixing lint findings over suppressing them.
- Exclude generated files from linting when appropriate.
- Keep frontend CSS reviewable by following the frontend CSS and
  design-system boundary.
- Do not treat linting as a replacement for tests, architecture review, security review, or approval.
- Keep shell scripts as thin adapters only.

## Examples

- Frontend linting lives in `frontend/eslint.config.js`.
- Frontend formatting uses `frontend/.prettierrc` and `frontend/.prettierignore`.
- Frontend type checks use `frontend/tsconfig.json`, `frontend/tsconfig.app.json`, and `frontend/tsconfig.node.json`.
- Frontend commands live in `frontend/package.json`.
- Keep the frontend lockfile aligned with the selected package manager.
- Use `npm run typecheck` or an equivalent command when the frontend uses
  TypeScript.
- Keep CSS cleanup in normal review scope when user-facing layout changes.
- Repo-level auto-fixes should be explicit, opt-in commands.
- Backend formatting uses Black.
- Backend linting uses Flake8 when the project has not selected another Python linter.
- Backend lint rules live in `.flake8`.
- Python test and coverage config lives in `pytest.ini`.
- Ruff, `pyproject.toml`, and `uv` are acceptable options when the project intentionally migrates backend tooling and updates commands, docs, and lockfiles together.

## Checks

- [ ] Frontend lint, format, and typecheck commands are documented when used.
- [ ] CSS changes avoid broad globals, duplicated design-system imports, and
      unexplained hard-coded layout values.
- [ ] Backend format and lint commands are available through Makefile (`Makefile`).
- [ ] Auto-fix commands are documented, opt-in, and do not silently stage rewritten files.
- [ ] Local commands and CI commands match where practical.
- [ ] Broad disables include a reason.
- [ ] Generated files are excluded when linting them would add noise.
- [ ] Bypassed checks for meaningful changes are recorded in verification or implementation notes.

## Related Schema Contracts

- Schema contract: [ARCH-SCHEMA-STD-015-CODE-QUALITY-LINTING-FORMATTING](../schemas/standards/std-015-code-quality-linting-and-formatting.schema.yaml)
- Used for: helping agents and reviewers check linting, formatting, type
  checks, generated-file handling, broad disables, quality failures, and
  exception evidence.
- Notes: The schema contract supports this standard. It does not replace this
  standard as the source of truth.
