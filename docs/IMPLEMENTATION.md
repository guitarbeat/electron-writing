# Smeemo Implementation Notes

## Architecture

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
- `public/favicon-32.png`, `public/apple-touch-icon.png`, `public/pwa-192.png`, `public/pwa-512.png` - generated install/browser icons

## Environment

Required:

```bash
PASSCODE="5947"
DATABASE_URL="postgresql://..."
```

Optional:

```bash
POSTGRES_URL="postgresql://..."
DATABASE_POOL_MAX="5"
```

`DATABASE_URL` should be Neon pooled connection string in Vercel. `POSTGRES_URL` is a fallback for Neon/Vercel integrations. `DATABASE_POOL_MAX` defaults to `5`.

## Local Development

```bash
pnpm install
pnpm run dev
```

The dev server runs on `http://localhost:5173`. Alternatively, to run the serverless backend functions alongside the client locally, run:

```bash
vercel dev
```

Useful commands:

```bash
npm run lint
npm run build
npm run db:push
npm run db:studio
```

## Auth

`POST /api/session` compares the submitted passcode to `PASSCODE`. On success, it sets the HTTP-only `clean_writer_session` cookie signed with the same `PASSCODE`.

All entry, settings, import, and export routes require that cookie. `GET /api/session/check` is used by the frontend to restore session state on load.


## Database

The database client uses:

```ts
const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
```

This makes the app work with either the app-specific `DATABASE_URL` or Vercel's Neon integration variables. Keep database secrets server-side only.

## PWA and Branding

The supplied Smeemo PNG is used as:

- passcode screen logo
- loading screen logo
- browser favicon
- Apple touch icon
- PWA 192px and 512px install icons

The PWA manifest is configured through `vite-plugin-pwa`.

## Deployment / Runbook

The application expects `PASSCODE` and `DATABASE_URL` (or `POSTGRES_URL`) to be set in the environment.

**Environment Variable Changes**
After modifying environment variables in Vercel, you must trigger a redeployment (or promote a new deployment) so that the updated configuration is applied to the running application. The changes do not take effect dynamically for running instances.

**Local Verification & Testing**
To prevent regressions before deploying or merging, run Smeemo's automated suite to verify authentication state machine logic, security sanitization, and weekly timeline calculations:

```bash
pnpm test
```

These tests perform robust local checks, ensuring that:
- Passcode checks and authentication state transitions behave correctly.
- Settings modifications, color updates, and weekly targets calculate correctly.
- Import/export handlers serialize data consistently.

Recommended Vercel checks for debugging the environment:

```bash
vercel env ls
vercel env pull .env.local --yes
vercel dev
```

## Tricky Logic Notes

*   **Date Handling**: Always use string-based comparisons (`YYYY-MM-DD`) for daily stats to avoid timezone mismatches between the serverless backend and the client browser.
*   **Database Transactions**: The database import endpoint uses transactional operations to ensure atomicity, preventing partial data updates if an import payload is malformed.
