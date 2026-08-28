# Archived GitHub Actions workflows

These workflow source files are kept for reference but are intentionally inactive while this repository is being set up. The scaffold and update helpers materialize them to `.github/workflows-archive/` in generated solution repos.

GitHub Actions only runs workflow files from `.github/workflows/`. Move a materialized workflow there when it is ready to run.

Review secrets, permissions, action pins, and repo ownership before re-enabling an archived workflow.

Example workflows use `.example.yml` and are meant as starter patterns only. They may use approved major tags for readability. Before enabling one, apply the solution repo's action version policy consistently.

Container examples:

- [backend-container-build.example.yml](backend-container-build.example.yml): builds the backend Dockerfile in CI and does not push the image.
- [backend-container-scan.example.yml](backend-container-scan.example.yml): shows where an approved container scanner should run.
- [aws-ecr-publish.example.yml](aws-ecr-publish.example.yml): shows the rough shape of ECR publishing with placeholders only.

Keep release pipelines, deployment workflows, S3 backup, Slack notification, organization reporting, label sync, and other secret-backed workflows archived until the solution repo intentionally opts in.
