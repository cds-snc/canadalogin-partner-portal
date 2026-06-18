# User Management

User management in the Partner Portal is centered on the authenticated OIDC identity. The backend does not collect or store a local user password for sign-in.

## What This Guide Covers

- Viewing the current authenticated user profile
- Updating portal-owned metadata such as department or terms acceptance
- Understanding how the OIDC subject maps to the portal user record
- Handling soft-delete or account deactivation flows

## Current User Profile

The primary user-facing operation is reading the current authenticated profile from the server-side session.

```python
@router.get("/user/me/", response_model=UserRead)
async def read_users_me(current_user: dict = Depends(get_current_user)) -> dict:
    return current_user
```

The frontend should use the session-backed browser flow and call protected endpoints after the OIDC callback completes.

## Profile Updates

Profile updates should only modify portal-owned fields. OIDC claims remain the source of truth for identity, while the application stores only the metadata it owns.

```python
@router.patch("/user/{username}")
async def patch_user(
    values: UserUpdate,
    username: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(async_get_db),
) -> dict[str, str]:
    db_user = await crud_users.get(db=db, username=username, schema_to_select=UserRead)
    if db_user is None:
        raise NotFoundException("User not found")

    if db_user["username"] != current_user["username"]:
        raise ForbiddenException("Cannot update other users")

    return await crud_users.update(db=db, id=db_user["id"], object=values)
```

## Identity Mapping

The portal treats the OIDC user identity as the sign-in source of truth and links that identity to application ownership, department association, and access-control state.

- OIDC subject and verified email identify the user
- The backend session stores the authenticated user UUID
- Casbin governs access to admin and managed resources

## Deactivation

If the portal supports account deactivation, it should use soft delete so that historical records remain intact while the user can no longer sign in.

## Related Topics

- [Authentication Overview](index.md)
- [Permissions](permissions.md)
