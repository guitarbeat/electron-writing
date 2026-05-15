# Clean Writer

A private two-person writing tracker for logging words, seeing progress, and staying gently motivated.

## What it does

Clean Writer helps Aaron and Electra:

- log daily writing words
- see individual progress lines
- see team progress
- track optional goals
- view writing consistency in an activity grid calendar
- update names, colors, goals, and thresholds over time

## What it is not

Clean Writer is not:

- a public app
- a social product
- a full writing editor
- a project management system
- a SaaS dashboard
- a login/account platform

## Core Experience

1. Enter shared passcode.
2. Log words.
3. See line chart.
4. Check activity grid.
5. Adjust goals/settings as needed.

## Documentation

- [DESIGN.md](./DESIGN.md) — visual design, UX principles, components, voice, accessibility
- [PRODUCT.md](./PRODUCT.md) — requirements, user stories, MVP scope
- [DATA_MODEL.md](./DATA_MODEL.md) — entries, settings, validation, export/import
- [API.md](./API.md) — server route specification and privacy pattern
- [IMPLEMENTATION.md](./IMPLEMENTATION.md) — build order, file structure, helper logic
- [GOOGLE_AI_STUDIO_PROMPT.md](./GOOGLE_AI_STUDIO_PROMPT.md) — copy/paste build prompt

## MVP

- Shared passcode screen
- Hosted database
- Quick Log form
- Three-line chart: Aaron / Electra / Team
- Daily / Weekly / Cumulative views
- Activity grid calendar
- Recent entries with edit/delete
- Settings / Writing Setup
- Export/import data

## Design Direction

Private, cozy, simple, and gently playful.

The visual style is a simplified Sticker Pop system:
- blush paper background
- chunky cards
- warm pink/purple palette
- tactile buttons
- clear charts
- calm forms

## Privacy Direction

No full user authentication.

Use a shared passcode and server-side API routes. Do not expose database secrets in frontend code.
