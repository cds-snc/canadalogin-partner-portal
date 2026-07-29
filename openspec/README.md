# OpenSpec

Store OpenSpec specs and proposed changes here.

This folder follows the OpenSpec repo convention:

- `specs/` stores current requirements and scenarios by capability.
- `changes/<change-id>/` stores proposed changes.
- Each change folder uses `proposal.md`, `design.md`, `tasks.md`, and spec deltas under `specs/<capability>/spec.md`.
- Use `tasks.md` for implementation tasks plus review and verification checklist items.

When the official OpenSpec CLI is not available or the setup does not finish, use the local-first helper:

```sh
make new-openspec-change CHANGE_ID=my-change CAPABILITY=my-capability TITLE="My Change"
```

The helper creates `proposal.md`, `design.md`, `tasks.md`, and the starter spec delta with local developer / localhost assumptions.

Lifecycle rule:

- Keep proposed or in-progress behavior under `changes/<change-id>/` until implementation and verification are complete.
- Use `specs/` for current implemented behavior.
- At Level 2, keep current requirements and scenarios accurate for functional
  changes, requirement bugs, and bug fixes that reveal missing scenario
  coverage. Lightweight process does not mean stale specs.
- Install the optional official OpenSpec CLI with `make install-openspec-cli` or the full `make setup` path when the solution repo opts in.
- If no environment is named, assume local developer / localhost work with fake or test-only data, no real secrets, no deployment, and no production action.
- Validate active changes with `make validate-openspec-change CHANGE_ID=<change-id>` when the official OpenSpec CLI is enabled.
- Archive completed changes with `openspec archive <change-id> --yes` after implementation and verification. At Level 2 this may be lightweight developer readiness; at higher levels follow the configured release-readiness expectations. Archive updates `specs/` and moves the completed change package under `changes/archive/`.
- Do not use `--skip-specs` for functional changes with spec deltas. After archive, confirm the branch diff shows the expected `specs/<capability>/spec.md` update and the completed package under `changes/archive/`.
- Do not have CI, hooks, or agents invisibly apply, sync, archive, or commit OpenSpec changes. Those updates should be visible in the branch or pull request.
- Do not add a separate OpenSpec `review.md` or `review-checklist.md` by default. Add review checklist items to `tasks.md` unless the solution intentionally adopts a custom OpenSpec schema.

OpenSpec is the Spec and Plan artifact layer for functional behavior. It does not replace Delorean evidence, approval, verification, release-readiness, local standards, agents, skills, hooks, or reference guidance.

The upstream template source may keep OpenSpec fixtures or maintainer change
packages so template maintainers can run smoke tests and track meaningful
template changes. Generated solution repos start with README-only
`openspec/specs/` and `openspec/changes/` folders. Create the first real or
throwaway local change with `make new-openspec-change`.

Use [docs/repo-guidance/openspec-and-delorean.md](../docs/repo-guidance/openspec-and-delorean.md) to understand how OpenSpec requirements and scenarios connect to Delorean evidence and approval artifacts.

Use STD-002: Work Contexts to separate local, shared non-production, and production work.
