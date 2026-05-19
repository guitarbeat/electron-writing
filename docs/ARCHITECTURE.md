# Smeemo Architecture & Technical Guide

This document covers the technical implementation, data model, and API contract for Smeemo.

## System Overview

```text
Browser
  -> Vite React app
  -> Individual Vercel API handlers
  -> Drizzle ORM
  -> Neon PostgreSQL
```

For local development, Vite serves the frontend React application and handles development mock API endpoints internally using custom dynamic middlewares configured in `vite.config.ts`. Alternatively, you can use the Vercel CLI locally to simulate the full serverless runtime.

In production, Vercel hosts Smeemo as a fully serverless deployment, serving static front-end assets directly and executing discrete serverless TypeScript functions under `api/` to respond to back-end routes.

## Important Files

- `api/` - Serverless Vercel function endpoints
- `src/db/schema.ts` - Database tables and Drizzle schema
- `src/db/db.ts` - Database pool and client connection
- `src/lib/auth.ts` - JSON Web Token authentication and session helpers
- `src/hooks/useTracker.ts` - Session state, polling, and API client hooks
- `src/components/PasscodeScreen.tsx` - Passcode validation visual screen
- `src/features/dashboard/Dashboard.tsx` - Main authenticated dashboard layout
- `vite.config.ts` - React/Tailwind/PWA config
- `public/smeemo.png` - source logo image used by the UI

## Data Model

Smeemo stores two tables in Neon PostgreSQL: `entries` and `settings`. The schema lives in `src/db/schema.ts` and is managed with Drizzle Kit.

### Entries
One row represents one date (`YYYY-MM-DD`).
- **id/date**: Primary key (date string), used for lookup and ordering.
- **Metrics**: `aaronWords`, `electraWords`, `aaronTime`, `electraTime`.
- **Note**: Optional text field for daily context.

### Settings
A single global row (`id = "global"`) used to store configuration:
- **People**: Names and custom colors for Aaron/Electra.
- **Goals**: Team goal, individual goals, project deadline, and start date.
- **Preferences**: Default chart/grid views and activity thresholds.
- **State**: `isSetupComplete` and `setupUpdateCount` to manage onboarding.

### Derived Statistics
Calculated in `src/lib/stats.ts` using the tracking logic:
- **Deficit**: `cumulativeWords - expectedCumulative`. (Positive = Green/Success, Negative = Red/Danger).
- **Velocity**: Word per minute (WPM) and average words per day.
- **Health**: Overall project status based on momentum and days left.

## API Contract

The frontend talks to Express routes under `/api`. Every data route requires the HTTP-only `clean_writer_session` cookie.

### Session Routes
- `POST /api/session`: Validates passcode and sets the session cookie.
- `GET /api/session/check`: Validates existing session.
- `DELETE /api/session`: Logs out by clearing the cookie.

### Data Routes
- `GET /api/entries`: Returns all writing logs.
- `POST /api/entries`: Upserts a log for a specific date.
- `DELETE /api/entries/:id`: Removes a specific entry.
- `GET /api/settings`: Fetches global configuration.
- `PATCH /api/settings`: Updates configuration.

### Backup & Portability
- `GET /api/export`: Downloads a JSON representation of all data.
- `POST /api/import`: Merges or replaces current database with an external JSON file.

## Environment Configuration

Required Variables:
- `PASSCODE`: The shared secret for the gate.
- `DATABASE_URL`: Neon pooled PostgreSQL connection string.

Optional Variables:
- `POSTGRES_URL`: Fallback for Vercel integration.
- `DATABASE_POOL_MAX`: Defaults to 5.

## Local Development & Operations

```bash
pnpm install
pnpm run dev      # Local Vite server
pnpm run build    # Production build (triggers db:push)
pnpm run db:push  # Sync Drizzle schema to Neon
pnpm test         # Run logic and auth tests
```

### Tricky Logic Notes
- **Passcode Bypass**: After 3 failed attempts, a "bypass hint" sequence is triggered for ease of access.
- **API Resilience**: GET routes return safe defaults if the database is unprovisioned.
- **Date Handling**: String-based `YYYY-MM-DD` comparisons avoid timezone drifting.
- **Chart Layout**: Containers use `min-h-0` and `min-w-0` to ensure Recharts calculates dimensions correctly inside flexbox.
