# Smeemo API

The frontend never connects to Neon directly. It talks to Express routes under `/api`, and every data route requires the HTTP-only `clean_writer_session` cookie.

## Environment

```bash
PASSCODE="0000"
SESSION_SECRET="long-random-string"
DATABASE_URL="postgresql://..."
POSTGRES_URL="postgresql://..." # optional fallback
DATABASE_POOL_MAX="5"           # optional
```

`PASSCODE` controls the private gate. `SESSION_SECRET` signs session cookies. `DATABASE_URL` should be the Neon pooled PostgreSQL URL; `POSTGRES_URL` is accepted as a fallback because Vercel/Neon integrations can provide it.

## Session Routes

### GET `/api/health`

Returns server status.

```json
{
  "status": "ok",
  "timestamp": "2026-05-15T20:30:00.000Z"
}
```

### POST `/api/session`

Validates the shared passcode and sets `clean_writer_session`.

Request:

```json
{
  "passcode": "0000"
}
```

Success:

```json
{
  "status": "ok"
}
```

Failure:

```json
{
  "error": "Invalid passcode"
}
```

### DELETE `/api/session`

Clears the session cookie.

```json
{
  "status": "ok"
}
```

### GET `/api/session/check`

Checks whether the session cookie is valid.

```json
{
  "authorized": true
}
```

## Entry Routes

### GET `/api/entries`

Requires session. Returns all entries ordered by descending `id`.

```json
[
  {
    "id": "2026-05-15",
    "date": "2026-05-15",
    "aaronWords": 600,
    "electraWords": 450,
    "note": "Drafted opening scene",
    "createdAt": "2026-05-15T20:30:00.000Z",
    "updatedAt": "2026-05-15T20:30:00.000Z"
  }
]
```

### POST `/api/entries`

Requires session. Creates or replaces the entry for a date.

Request:

```json
{
  "date": "2026-05-15",
  "aaronWords": 600,
  "electraWords": 450,
  "note": "Drafted opening scene"
}
```

Success includes the entry fields and `status` set to `created` or `updated`.

### PATCH `/api/entries/:id`

Requires session. Partially updates one entry.

```json
{
  "aaronWords": 750,
  "electraWords": 500,
  "note": "Updated note"
}
```

### DELETE `/api/entries/:id`

Requires session. Deletes one entry.

```json
{
  "status": "deleted"
}
```

## Settings Routes

### GET `/api/settings`

Requires session. Returns the global settings row. If it does not exist, the server creates default settings first.

### PATCH `/api/settings`

Requires session. Updates global settings and increments `setupUpdateCount` unless `lastModifiedBy` is `System`.

## Import and Export

### GET `/api/export`

Requires session. Downloads a JSON backup with `version`, `exportedAt`, `settings`, and `entries`.

### POST `/api/import`

Requires session. Imports entries and optional settings.

```json
{
  "mode": "merge",
  "settings": {},
  "entries": []
}
```

Modes:

- `merge` - upsert incoming entries by date
- `replace` - delete existing entries before importing
