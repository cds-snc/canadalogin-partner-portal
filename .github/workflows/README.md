# GitHub Workflow Sources

Store active GitHub Actions workflow source files here. The scaffold and update helpers materialize these files to `.github/workflows/` in generated solution repos.

Active workflows should be safe for any new repo created from this template. Keep organization-specific, secret-backed, reporting, label, Backstage, S3, or special-permission workflows in `repo-configs/github/workflows-archive/` until a solution repo opts in.

The starter active workflow is:

- [template-validation.yml](template-validation.yml): installs starter frontend or backend dependencies when those folders exist, then runs `scripts/delorean/run-local-verification.sh`.

Optional frontend, backend, CodeQL, release, deployment, backup, reporting, label, and secret-backed examples belong in `repo-configs/github/workflows-archive/` until a solution repo intentionally enables them.
