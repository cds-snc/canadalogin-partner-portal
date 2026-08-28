# New Repo Checklist

Use this after creating a new solution repo from this template.

## First Pass

- [ ] Rename the repo and update this README for the solution.
- [ ] Update or pause [catalog-info.yaml](../../catalog-info.yaml) until catalog metadata is ready.
- [ ] Confirm which GitHub Actions should stay active.
- [ ] Confirm branch protection and review rules.
- [ ] Add the solution owner and support contacts.

## Documentation

- [ ] Add a short solution overview.
- [ ] Add the first architecture note or ADR if there is an early decision.
- [ ] Add setup and run commands when implementation starts.
- [ ] Link to Delorean core for operating model guidance and `architecture_docs/` for reusable architecture guidance.

## Delivery

- [ ] Add OpenSpec files when behavior needs to be specified.
- [ ] Add OpenAPI files if the solution exposes an API.
- [ ] Add tests when implementation starts.
- [ ] Add evidence as work is reviewed and accepted.

## Before Wider Use

- [ ] Re-enable archived workflows only when their secrets and reporting paths are ready.
- [ ] Confirm security, privacy, accessibility, and operations expectations.
- [ ] Confirm Government of Canada standards review expectations, including GC Design System use for frontend work.
- [ ] Remove unused placeholders that no longer help the repo.
