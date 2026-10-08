---
name: commit-pr-summary
description: "Use when reviewing current uncommitted Git changes to produce a concise Conventional Commit message, Conventional Commit pull request title, GitHub-flavored point-form PR summary, and recommended branch name. Include tracked, staged, and untracked changes without modifying the worktree."
argument-hint: "Review the current uncommitted changes and generate commit and PR metadata."
user-invocable: true
---

# Commit and PR Summary

Review the current uncommitted worktree and produce concise release metadata. This skill is read-only: do not edit files, stage changes, commit, create branches, or push anything.

## Workflow

1. Establish the repository root and inspect the worktree:
   - Run `git rev-parse --show-toplevel`.
   - Run `git status --short` and `git branch --show-current`.
   - Inspect both unstaged and staged changes with `git diff HEAD --stat` and `git diff HEAD --`.
   - Include untracked files from `git status --short`; inspect their contents when they are relevant. `git diff` does not include untracked files.
2. Understand the change before naming it:
   - Group files by the behavior or user-visible outcome they implement.
   - Read the smallest relevant code, tests, documentation, and configuration context needed to identify the root change.
   - Treat generated files, lockfiles, formatting-only edits, and unrelated work as supporting or separate context rather than the headline unless they are the actual purpose of the change.
   - Never expose secrets from environment files, credentials, tokens, or private configuration in the output.
3. Check local conventions when useful:
   - Inspect recent commit subjects with `git log -20 --pretty=format:%s` to see whether the repository already uses Conventional Commits and familiar scopes.
   - Prefer an existing branch prefix convention from `git branch -a`; otherwise use `feat/`, `fix/`, `refactor/`, `test/`, `docs/`, `chore/`, or `ci/` as appropriate.
4. Classify the dominant change:
   - `feat`: new user-facing behavior.
   - `fix`: correction to existing behavior.
   - `refactor`: implementation change without behavior change.
   - `test`: tests without production behavior changes.
   - `docs`: documentation-only changes.
   - `build`: dependency or build-system changes.
   - `ci`: CI or release automation changes.
   - `chore`: maintenance that does not fit another type.
   - Add a scope only when it is clear and useful, using a short lowercase hyphenated name.
   - Add `!` for a confirmed breaking change and mention the migration impact briefly.
5. Write the result using the exact GitHub-flavored Markdown format below. Keep the PR summary to 2-5 bullets, focused on behavior and verification. Use imperative, specific wording; do not merely list filenames.

## Output Format

## Commit message

`type(scope): imperative summary`

## PR title

`type(scope): imperative summary`

## PR summary

- Concise behavior or feature change.
- Important backend, frontend, data, or configuration impact.
- Tests or validation added or updated, when present.

## Branch name

`type/short-kebab-case-description`

## Decision Rules

- Use a Conventional Commit whenever the change maps cleanly to a type. Keep the subject in imperative mood, specific, and normally at or below 72 characters with no final period.
- The PR title must use Conventional Commit syntax: `type(scope): imperative summary`, with an optional scope and optional `!` for a confirmed breaking change. It may use different wording from the commit message but must describe the same outcome.
- Keep the PR title concise and normally at or below 72 characters with no final period.
- Return GitHub-flavored Markdown: use `##` headings, backticks for commit/title/branch values, and `-` bullets for the PR summary. Do not return JSON, tables, or unformatted labels.
- Mention validation only when it is visible in the changes or has been run. Do not claim tests passed if they were not run.
- Include untracked files in the analysis. If an untracked file appears unrelated, sensitive, or incomplete, call that out in one short note after the required sections.
- If the worktree contains clearly unrelated changes, still provide one best summary for the dominant cohesive change and add one brief `Note` recommending the changes be split. Do not silently fold unrelated work into the title.
- If there are no uncommitted changes, say so instead of inventing metadata.
- Return only the four required sections and any essential one-line note. Keep the response concise and in point form where a list is appropriate.
