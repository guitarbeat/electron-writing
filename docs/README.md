# Aaron and Electra's private space... Project Overview

Aaron and Electra's private space... is a private writing tracker for Aaron and Electra. It uses a shared passcode gate, stores writing entries and settings in Neon PostgreSQL, and presents progress through a quick log form, goal summary, line chart, consistency grid, onboarding/setup wizard, and import/export tools.

## Current Stack

- Frontend: React 19, Vite 6, Tailwind CSS 4
- Server: Express 5
- Database: Neon PostgreSQL through `pg` and Drizzle ORM
- Auth: shared passcode plus HTTP-only JWT session cookie
- Charts: Recharts
- Animation: Motion
- PWA: `vite-plugin-pwa` with Smeemo PNG icons
- Deployment: Vercel static Vite app plus `api/[...path].ts` Express function

## Core Flow

1. Visitor enters the shared `PASSCODE`.
2. Server validates the passcode and sets `clean_writer_session`.
3. Authorized requests can read/write entries and settings.
4. Dashboard polls entries/settings every 5 seconds while open.
5. Setup wizard appears until setup is complete and onboarding has been seen.

## Runtime Environment

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

Use Neon pooled URLs for `DATABASE_URL` or `POSTGRES_URL` on Vercel.

## Documentation

- [DESIGN.md](./DESIGN.md) - visual system and interaction guidance
- [PRODUCT.md](./PRODUCT.md) - product goals, scope, and risks
- [DATA_MODEL.md](./DATA_MODEL.md) - Drizzle tables and app types
- [API.md](./API.md) - Express route contract
- [IMPLEMENTATION.md](./IMPLEMENTATION.md) - architecture, local development, deployment notes
