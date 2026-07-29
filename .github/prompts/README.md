# Prompts

This Level 2 scaffold includes the core prompt set by default so the prompt
picker stays small while developers learn the workflow.

## Core Prompts

| Prompt | Use when |
|---|---|
| `dl-requirements-start` | Turn a rough brief, requirements note, or issue into the first active OpenSpec change package. |
| `dl-requirements-refine` | Clean up requirements, scenarios, tasks, validation, or next-slice clarity. |
| `dl-requirements-answer-questions` | List OpenSpec open questions, resolve answerable ones from repo context, and collect human decisions. |
| `dl-requirements-archive` | Archive a completed OpenSpec change into current specs after verification. |
| `dl-ui-build-page` | Build a new user-facing page, layout, form, or navigation path. |
| `dl-ui-refine` | Fix or improve an existing UI, page pattern, route, accessibility, or bilingual issue. |
| `dl-ui-review-accessibility` | Review and remediate accessibility risk for user-facing changes. |
| `dl-dev-continue` | Continue the next safe task from an active change. |
| `dl-dev-active-change` | Continue ready local slices inside one active change until blocked, complete, or at the slice limit. |
| `dl-dev-fix-bug` | Investigate and fix a defect or failing check. |
| `dl-qa-commit-ready` | Check staged changes, hook readiness, and commit-message readiness before committing. |
| `dl-qa-push-ready` | Run pre-push readiness checks and confirm the branch is safe to push. |
| `dl-qa-check` | Run a local quality loop before review or handoff. |
| `dl-qa-review` | Review the scoped change across code, docs, specs, tests, and evidence before handoff. |

## Nice-To-Have Prompts

Nice-to-have prompts such as repo-wide autopilot, full delivery autopilot,
platform updates, security review, data/API change specializations, and hotfix
handling are available from the template when the repo needs them.

For a new Level 2 repo, scaffold with:

```sh
/path/to/delorean_template/getting-started/scaffold-solution-repo.sh --target /path/to/repo --include-level2-nice-to-have-prompts
```

For an existing solution repo, refresh agent configs with:

```sh
scripts/delorean/update-from-template.sh --agent-config-only --level2-prompt-set full
```
