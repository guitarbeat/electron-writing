# Clean Writer API Specification

## Overview

The frontend should not directly access the hosted database.

Use server-side API routes as a private gate:

```text
Frontend → API route → Database
```

Each route should verify a shared passcode/session before reading or writing data.

## Environment Variables

```bash
PASSCODE=your-shared-passcode
DATABASE_URL=postgresql://...
```

Use whichever database variables match the chosen backend.

Do not expose database admin credentials to the browser.

## Auth Pattern

This app does not need user accounts.

Use:
- shared passcode
- server-side verification
- local session flag or signed session cookie

Recommended:
- `POST /api/session` validates passcode.
- Server sets an HTTP-only session cookie.
- Other API routes require that session cookie.

Simpler MVP:
- Frontend sends passcode in request header.
- API route compares it to `PASSCODE`.

For better privacy, prefer the session cookie approach.

## Endpoints

### POST /api/session

Validates shared passcode.

Request:

```json
{
  "passcode": "shared-passcode"
}
```

Success:

```json
{
  "ok": true
}
```

Failure:

```json
{
  "ok": false,
  "error": "Invalid passcode"
}
```

### DELETE /api/session

Clears session.

Success:

```json
{
  "ok": true
}
```

### GET /api/entries

Returns all writing entries, sorted by date ascending.

Response:

```json
{
  "entries": [
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
}
```

### POST /api/entries

Creates or updates an entry for a date.

Request:

```json
{
  "date": "2026-05-15",
  "aaronWords": 600,
  "electraWords": 450,
  "note": "Drafted opening scene"
}
```

Response:

```json
{
  "entry": {
    "id": "2026-05-15",
    "date": "2026-05-15",
    "aaronWords": 600,
    "electraWords": 450,
    "note": "Drafted opening scene",
    "createdAt": "2026-05-15T20:30:00.000Z",
    "updatedAt": "2026-05-15T20:30:00.000Z"
  }
}
```

### PATCH /api/entries/:id

Updates an entry.

Request:

```json
{
  "aaronWords": 750,
  "electraWords": 500,
  "note": "Updated note"
}
```

Response:

```json
{
  "entry": {}
}
```

### DELETE /api/entries/:id

Deletes an entry.

Response:

```json
{
  "ok": true
}
```

### GET /api/settings

Returns app settings.

Response:

```json
{
  "settings": {
    "personAName": "Aaron",
    "personBName": "Electra",
    "personAColor": "#ff4d8d",
    "personBColor": "#7c3aed",
    "teamColor": "#2b1720",
    "goalsEnabled": true,
    "individualGoalsEnabled": false,
    "teamWeeklyGoal": 7000,
    "personAWeeklyGoal": 3500,
    "personBWeeklyGoal": 3500,
    "activityThresholds": [250, 750, 1500],
    "defaultChartView": "daily",
    "defaultGridView": "team",
    "updatedAt": "2026-05-15T20:30:00.000Z"
  }
}
```

### PATCH /api/settings

Updates settings.

Request:

```json
{
  "teamWeeklyGoal": 8000,
  "goalsEnabled": true
}
```

Response:

```json
{
  "settings": {}
}
```

### GET /api/export

Exports all data.

Response:

```json
{
  "version": 1,
  "exportedAt": "2026-05-15T20:30:00.000Z",
  "settings": {},
  "entries": []
}
```

### POST /api/import

Imports data.

Request:

```json
{
  "mode": "merge",
  "settings": {},
  "entries": []
}
```

Modes:
- `merge`
- `replace`

Response:

```json
{
  "ok": true,
  "importedEntries": 30
}
```

## Error Format

Use a consistent error shape:

```json
{
  "ok": false,
  "error": "Human-readable error message"
}
```

## Status Codes

- `200` success
- `201` created
- `400` validation error
- `401` passcode/session required
- `404` not found
- `500` server error

## Security Notes

Do not:
- expose database admin keys in frontend code
- allow public database writes
- commit `.env` files
- rely on obscurity alone
- put the passcode in client code

Do:
- store secrets server-side
- validate all input server-side
- sanitize notes
- lock down database rules
- add export for backup
