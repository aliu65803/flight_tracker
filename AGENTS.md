# AGENTS.md

## Project

Flight Tracker is a Turborepo with:

- `apps/web`: Next.js App Router frontend
- `apps/worker`: polling worker that fetches flight data and upserts into Supabase
- `packages/config`: shared env loading/helpers
- `packages/types`: shared domain types

The current product direction is an airport-board app, not a generic flight map. Users choose airports and the UI shows arrivals/departures for those airports.

## Stack

- Next.js 15
- React 19
- Clerk auth
- Supabase Postgres + Realtime
- pnpm workspaces

## Important Data Flow

1. Users save watched airports in `public.user_preferences.favorite_airports`.
2. The worker reads all distinct watched airports from Supabase.
3. The worker polls the configured provider and upserts into `public.flights`.
4. The web app queries `public.flights` for the currently watched airports and subscribes to Realtime when auto refresh is enabled.

## Current Provider Setup

- `FLIGHT_DATA_SOURCE=opensky`: fallback/heuristic mode, less accurate for airport boards
- `FLIGHT_DATA_SOURCE=aviationstack`: supported, but not the main path
- `FLIGHT_DATA_SOURCE=aerodatabox`: current best-fit provider for airport board behavior

AeroDataBox notes:

- Uses airport-board/FIDS style polling
- Worker reads watched airports from Supabase preferences
- API.Market auth header is `x-magicapi-key`
- Base URL default:
  `https://prod.api.market/api/v1/aedbx/aerodatabox`

## Auth Notes

- Clerk is configured in `apps/web/components/app-clerk-provider.tsx`
- Middleware is in `apps/web/middleware.ts`
- Sign-in and sign-up routes are:
  - `/sign-in`
  - `/sign-up`

The auth pages intentionally avoid server-rendering Clerk’s heavy UI directly in the route module. They render small server wrappers that redirect signed-in users home and otherwise mount client-only Clerk panels.

If auth routes start showing stale missing vendor chunk errors during local development, restart the Next dev server so `.next` is regenerated cleanly.

## Common Commands

Install:

```bash
pnpm install
```

Run web:

```bash
pnpm --filter web dev
```

Run worker:

```bash
pnpm --filter worker start
```

Build web:

```bash
pnpm --filter web build
```

Typecheck:

```bash
pnpm --filter worker typecheck
pnpm --filter web typecheck
```

## Gotcha

`pnpm --filter web typecheck` may fail if `.next/types` has not been generated yet. If that happens, run:

```bash
pnpm --filter web build
pnpm --filter web typecheck
```

## UI Direction

Keep the product language centered on `Airport board`. Avoid reverting to earlier copy like `with some drama`.

The current design direction is travel/editorial and airport-board inspired, not dark dev-dashboard styling.

