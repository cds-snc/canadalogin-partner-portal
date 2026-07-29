# OpenSpec Specs

Store current functional requirements and scenarios here.

Each capability gets its own folder:

```text
openspec/specs/<capability>/spec.md
```

Use requirements for behavior or business rules. Use scenarios for concrete examples that can map to tests and evidence.

At Level 2, keep these current specs accurate as functional work completes.
Small requirement changes, new requirements, requirement bugs, and bug fixes
that reveal missing scenario coverage should update OpenSpec through an active
change and archive after verification.

Delorean business-rule IDs and scenario IDs may be included in requirement and scenario headings when they help traceability.

For completed functional changes, current specs are normally updated by
`openspec archive <change-id> --yes`. After archive, confirm each affected
capability under `openspec/specs/` reflects the implemented behavior from the
archived delta.

Generated solution repos may start with no current specs here. Add current
implemented behavior when the solution has real requirements and scenarios to
track.
