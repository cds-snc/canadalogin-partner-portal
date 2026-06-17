# Session-Based Authentication

The Partner Portal uses OIDC for login and a server-side Redis session for authenticated browser requests. There is no local credential login path and no JWT-based local fallback in this flow.

## How Authentication Works

1. The browser starts the OIDC login flow.
2. The identity provider authenticates the user.
3. The backend stores the authenticated user in a Redis-backed session.
4. Protected routes resolve the current user from that session.
5. The browser keeps only the session cookie identifier.

## Why This Model

- Keeps credentials out of the application
- Lets the identity provider own login and MFA
- Gives the backend a simple browser-session contract
- Supports logout and session expiry without storing passwords locally

## Backend Responsibilities

- Start the OIDC login redirect
- Handle the callback and map the OIDC user into a portal user record
- Create or refresh the server-side session
- Resolve the current user from the session on protected routes

## Frontend Responsibilities

- Redirect the user into the OIDC login flow
- Wait for the callback to complete
- Call protected backend endpoints after the session is established
- Treat the backend as the browser-facing authentication boundary

## Related Topics

- [Authentication Overview](index.md)
- [User Management](user-management.md)
- [Permissions](permissions.md)
