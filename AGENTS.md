# Smeemo Agent Guide

This document outlines the workflows, commands, and architecture patterns for Smeemo development.

## Core Workflows

### 1. Verification & Testing
Always run these before proposing changes or after logic updates.

- **Type Check**: `pnpm run lint` (runs `tsc --noEmit`)
- **Smoke Test**: `npx tsx tests/smoke.test.ts` (verifies basic login)
- **Logic Tests**: `npx tsx tests/logic.test.ts` (verifies stats, security sanitization, and session checks)

### 2. Database Management
- **Schema Push**: `pnpm run db:push` (syncs `server/db/schema.ts` to the database)
- **Database Studio**: `pnpm run db:studio` (GUI for database inspection)

### 3. Build & Deploy
- **Full Build**: `pnpm run build` (builds frontend assets and bundles the server)
- **Local Dev**: `pnpm run dev` (starts the server with Vite middleware)

## CI/CD Architecture

- **GitHub Actions**: Defined in `.github/workflows/ci.yml`. Performs linting, building, and logic testing on a live PostgreSQL container.
- **Dependabot**: Defined in `.github/dependabot.yml`. Configured for weekly pnpm and GitHub Action updates.

## Tricky Logic Notes

- **Date Handling**: Always use string-based comparisons (`YYYY-MM-DD`) for daily stats to avoid timezone mismatches between client and server.
- **Imports**: The import route uses database transactions to ensure atomicity and prevent partial data loss.
