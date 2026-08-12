# Design: Show pending invitations in Users and access

## Technical approach

Add `GET /api/v1/users/invitations` as a thin, CL-Admin-only endpoint backed by
`UserService`. It returns a paginated public projection of unexpired,
non-deleted invitations whose status is `pending`, joined to active workspace
public UUIDs and names. The projection contains no token, provider subject,
integer database identifier, notification identifier, or raw policy data.

The `/users` page will issue a separate TanStack Query read and render a second
PAT-023 table under the existing users directory. Keeping the resources
separate preserves the distinction between an authenticated user with
canonical access and an invited email that has not accepted access. Manage
navigates to `/workspaces/$workspaceUuid/access`, which already owns revoke and
reissue operations.

## API contract

```text
GET /api/v1/users/invitations?page=1&items_per_page=10
authorization: canonical CL Admin
response: PaginatedListResponse[UserPendingInvitationDirectoryRead]
```

Each row contains:

- `invitationUuid`
- `invitedEmail`
- `workspaceUuid`
- `workspaceName`
- `role`
- `status` (`pending`)
- `inviteExpiresAt`
- `createdAt`

## Page-pattern decision

The approved Users and access page decision remains valid: `/users` is a
PAT-023 focused directory with PAT-020 section states. This repair adds a
second related record table to the same cross-workspace administration task;
it does not add a route, form, page shell, custom control, or navigation model.

## Impacted artifacts

- OpenSpec delta and current spec after archive.
- Backend user schema, service, route, tests, and generated OpenAPI.
- Frontend typed fetch helper, TanStack Query hook, Users page, cache
  invalidation, English/French content, and unit tests.
- Existing Users and access page-pattern decision; no exception required.

## Standards and patterns impact

- `STD-002`, `STD-004`, `STD-005`, `STD-006`, `STD-007`, `STD-008`,
  `STD-009`, `STD-010`, `STD-012`, `STD-013`, `STD-018`, and `STD-020`.
- `PAT-002`, `PAT-005`, `PAT-010`, `PAT-020`, `PAT-023`, and `PAT-024`.
- `BAS-001`; affected controls are `GC-WEB-002`, `GC-WEB-003`,
  `GC-WEB-004`, `GC-WEB-005`, `GC-WEB-006`, `GC-WEB-007`,
  `GC-WEB-008`, and `GC-WEB-010`.

## Security, privacy, accessibility, and operations notes

- Authorization is enforced before the invitation query; partner roles cannot
  enumerate invitee email addresses.
- Only active pending invitations are returned. Accepted, revoked, expired,
  deleted, and deleted-workspace records are excluded from this operational
  view.
- The table has its own heading/caption, visible status text, real empty state,
  concise Manage actions with invitee-specific accessible names, and existing
  responsive DataTable behavior.
- English and French labels, status, notices, summaries, and actions remain in
  parity.
- No schema migration, new persistence, external integration, or write-side
  audit event is needed; this is an authorized read of existing records.

## Slice plan

### Slice 1: Cross-workspace pending invitation read model

Add the response schema, protected route, service query, backend tests, typed
frontend fetch/query boundary, and cache invalidation.

### Slice 2: Pending invitations table

Render populated, loading, empty, and error states on `/users`, add bilingual
content, route the Manage action, and verify table/accessibility behavior.

### Slice 3: Verification and archive

Run focused and broad checks, export OpenAPI, review GC Design System and page
shell alignment, validate OpenSpec, then archive so the current spec reflects
the implemented behavior.

## Open questions that block non-local work

- None for local implementation. Deployment, real data, retention, release,
  and external delivery remain outside this change.
