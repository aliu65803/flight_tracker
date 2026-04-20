# Flight Tracker Monorepo

Architecture:

`External data source -> Railway worker -> Supabase -> Next.js frontend on Vercel`

This repo is scaffolded for:

- `apps/web`: Next.js app with Clerk auth, Supabase-backed personalization, and realtime flight updates
- `apps/worker`: Railway-friendly polling worker that ingests live flight data and upserts into Supabase
- `packages/config`: shared environment helpers
- `packages/types`: shared domain types
- `supabase/schema.sql`: initial Postgres schema, indexes, and RLS policies

## Stack

- Next.js App Router
- Clerk for authentication
- Supabase Postgres + Realtime
- Railway for the background worker
- Vercel for the frontend
- Turborepo + pnpm workspaces

## Quick start

1. Install dependencies:

```bash
pnpm install
```

2. Copy environment variables:

```bash
cp .env.example .env
```

3. Apply the SQL in `supabase/schema.sql` to your Supabase project.

4. In Clerk:

- enable your auth providers
- add `http://localhost:3000` as an allowed redirect origin for local development
- activate the Supabase integration from the Clerk dashboard
- copy your Clerk domain into the Supabase Clerk third-party auth provider
- keep using Clerk session tokens, not the deprecated JWT-template flow
- set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`

The web app exposes:

- `/sign-in` for Clerk sign-in
- `/sign-up` for Clerk sign-up
- middleware protection for all non-public app routes

5. Run locally:

```bash
pnpm dev
```

## Personalization model

Each user stores preferences in `public.user_preferences`, keyed by `clerk_user_id`.

Current example preferences:

- followed airlines
- followed airports
- tracked flight numbers
- map auto-refresh

The worker writes normalized flight rows into `public.flights`. The frontend subscribes to those changes and filters based on the signed-in user's preferences.

## Route airports in live data

OpenSky's live `states/all` feed does not include departure and arrival airports. OpenSky documents origin/destination inference as a nightly batch for previous days, not live data.

If you want live departure and arrival airports in this app:

- set `FLIGHT_DATA_SOURCE=aviationstack`
- add `AVIATIONSTACK_ACCESS_KEY`

The worker now supports both providers:

- `opensky`: live positions only, no live route airports
- `aviationstack`: live positions plus departure and arrival airport fields

## Deployment

### Vercel

- Deploy `apps/web`
- Set the `NEXT_PUBLIC_*` and Clerk env vars

### Railway

- Deploy `apps/worker`
- Start command: `pnpm --filter worker start`
- Set Supabase service role env vars and the external data source credentials

## Notes

- The worker currently includes an `OpenSky` adapter because it is straightforward to prototype against. You can swap in AviationStack, AeroDataBox, FlightAware, or another provider by replacing the adapter in `apps/worker/src/providers`.
- Realtime subscriptions require enabling Realtime for the `public.flights` table in Supabase.
- The web app uses Clerk session tokens with Supabase RLS. Keep the Supabase service role key scoped to the worker only.
