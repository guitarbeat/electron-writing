# Smeemo Implementation Notes

## Architecture

```text
Browser
  -> Vite React app
  -> /api Express routes
  -> Drizzle ORM
  -> Neon PostgreSQL
```

The local development server is `server.ts`. It creates the Express app, attaches Vite middleware outside production, and listens on `PORT` or `3000`.

The Vercel deployment uses `api/[...path].ts`, which exports the same Express app without starting a long-running server. Vercel serves the Vite build from `dist` and routes `/api/*` requests to the function.

This follows Vercel's current Express guidance: put the Express entrypoint under `/api` and let Vercel run it as a serverless function.

## Important Files

- `server.ts` - Express app factory, API routes, local dev/prod server
- `api/[...path].ts` - Vercel function entrypoint
- `src/db/index.ts` - Drizzle client and Neon pool
- `src/db/schema.ts` - entries/settings table definitions
- `src/hooks/useTracker.ts` - session state, polling, API client helpers
- `src/components/PasscodeScreen.tsx` - shared passcode UI
- `src/features/dashboard/Dashboard.tsx` - main authenticated dashboard
- `vite.config.ts` - React/Tailwind/PWA config
- `public/smeemo.png` - source logo image used by the UI
- `public/favicon-32.png`, `public/apple-touch-icon.png`, `public/pwa-192.png`, `public/pwa-512.png` - generated install/browser icons

## Environment

Required:

```bash
PASSCODE="0000"
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
npm install
npm run dev
```

The dev server runs on `http://localhost:3000`.

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

## Vercel Notes

After changing Vercel environment variables, redeploy or promote a new deployment so the updated values are available to the running app.

Required Vercel variables:

- `PASSCODE`
- `DATABASE_URL` or `POSTGRES_URL`

Recommended Vercel checks:

```bash
vercel env ls
vercel env pull .env.local --yes
vercel dev
```
