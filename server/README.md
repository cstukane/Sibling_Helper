# Optional Server

This folder is reserved for an optional sync API (FastAPI or Express). For MVP, the app runs fully offline. If enabling sync, expose REST endpoints under `/api/*` for heroes, quests, board, rewards, and redemptions.

## Security configuration

The Express server supports optional JWT-based authentication and role authorization.

- `AUTH_REQUIRED=true` enforces JWT validation and role checks on all `/api/*` endpoints.
- `JWT_SECRET` must be set to at least 16 characters when `AUTH_REQUIRED=true`.
- JWT payload expects `sub` as the user id and `role` as one of `parent`, `child`, or `admin`.

Example payload:

```json
{
  "sub": "parent_123",
  "role": "parent"
}
```
