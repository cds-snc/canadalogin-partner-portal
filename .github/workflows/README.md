# GitHub Workflow Sources

Store active GitHub Actions workflow source files here. The scaffold and update helpers materialize these files to `.github/workflows/` in generated solution repos.

Active workflows should be safe for any new repo created from this template. Keep organization-specific, secret-backed, reporting, label, Backstage, S3, or special-permission workflows in `repo-configs/github/workflows-archive/` until a solution repo opts in.

The starter active workflow is:

- [template-validation.yml](template-validation.yml): installs frontend dependencies
  from `frontend/pnpm-lock.yaml`, syncs backend development dependencies from
  `backend/uv.lock`, and runs `scripts/delorean/run-ci-verification.sh`.

Pull-request verification keeps structure, state, lint, type, standards,
secret, contract, and test checks repository-wide. Content-only format,
Markdown, ShellCheck, frontend Prettier, and backend Ruff-format adapters are
scoped to the pull-request change so inherited baseline debt outside the diff
does not block unrelated work. A manual run without a comparison base retains
the full-repository audit.

The standalone [shellcheck.yml](shellcheck.yml) is a manual full-repository
audit. Pull requests and protected-branch pushes use the baseline-aware
ShellCheck adapter in `template-validation.yml`, avoiding a duplicate automatic
workflow for the same change.

Optional frontend, backend, CodeQL, release, deployment, backup, reporting, label, and secret-backed examples belong in `repo-configs/github/workflows-archive/` until a solution repo intentionally enables them.
