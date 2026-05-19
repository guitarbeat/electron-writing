# Aaron and Electra's private space...

Aaron and Electra's private space... (Smeemo) is a private writing tracker designed as a **spiritual successor to Camp NaNoWriMo tracking**. It allows writing partners to log daily word counts, track time spent, and monitor progress toward ambitious goals through expressive visualizations.

## Product Goals

1. **Fast Logging**: Make entering activity and time friction-less.
2. **NaNoWriMo Metrics**: High-precision tracking of deficits, per-day goals, and "Achieved/Missed" day status.
3. **Team Momentum**: Visualize individual and collective progress on a shared timeline.
4. **Zero-Account Privacy**: A simple shared passcode gate instead of complex login systems.
5. **Data Ownership**: Built-in import/export tools for portability.

## Design Philosophy: "The Shared Desk"

The interface is built to feel like a tactile, shared writing suite.
- **Sticker Pop Aesthetic**: Bold contrast, thick borders (`border-4`), and hard shadows (`shadow-sticker`).
- **Juicy Colors**: Using a palette of "Juicy Pink" and "Grape Purple" to distinguish between partners.
- **Tactile Inputs**: Logging feels physical with bouncy, springy animations and high-density grid layouts.
- **Paper Backdrop**: A blush paper background with a subtle grid pattern to reinforce the drafting vibe.

## Documentation

- **[Architecture & Technical Guide](./ARCHITECTURE.md)**: Details on the stack, data model, API, and local development.
- **[Design Tokens](./ARCHITECTURE.md#design-recipes)**: Visual system details (colors, typography, motion).

## Stack

- **Frontend**: React 19, Vite 6, Tailwind CSS 4, Motion, Recharts.
- **Backend**: Express 5 (Serverless via Vercel).
- **Database**: Neon PostgreSQL via Drizzle ORM.
- **Auth**: Passcode gate with HTTP-only JWT sessions.

## Setup

1. Set `PASSCODE` and `DATABASE_URL` in your environment.
2. Run `npm install`.
3. Run `npm run dev` to start the dashboard.
