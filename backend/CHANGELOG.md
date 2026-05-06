## Unreleased

- Deprecate local username/password login: default disabled via LOCAL_PASSWORD_LOGIN_ENABLED=false.
- User creation no longer requires passwords; new users will have no hashed password unless provided.
- Soft-delete plan: hashed_password column remains for now; a future migration will remove it after monitoring.

Notes:
- To re-enable password login temporarily, set LOCAL_PASSWORD_LOGIN_ENABLED to true in environment or settings.
- Follow-up PRs will (1) remove password helpers and login endpoint, (2) add DB migration to drop hashed_password.
