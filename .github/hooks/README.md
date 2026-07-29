# Hooks

Store local hooks for repo automation.

Hooks are opt-in for local development.

Run this from the repo root to enable hooks locally:

```bash
make setup-hooks
```

Run this to disable the local hooks path:

```bash
make uninstall-hooks
```

The upstream hook source stays in `agent-configs/shared/hooks/`. Generated solution repos receive it at `.github/hooks/`. The hooks call helper adapters from `scripts/delorean/` and should not duplicate linting rules.
