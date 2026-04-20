create extension if not exists pgcrypto;

create table if not exists public.flights (
  id uuid primary key default gen_random_uuid(),
  external_id text not null unique,
  callsign text,
  flight_number text,
  airline_iata text,
  departure_airport text,
  arrival_airport text,
  latitude double precision not null,
  longitude double precision not null,
  altitude_baro double precision,
  velocity double precision,
  heading double precision,
  status text,
  observed_at timestamptz not null,
  metadata jsonb not null default '{}'::jsonb,
  inserted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_preferences (
  clerk_user_id text primary key,
  favorite_airlines text[] not null default '{}',
  favorite_airports text[] not null default '{}',
  tracked_flight_numbers text[] not null default '{}',
  auto_refresh boolean not null default true,
  inserted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_tracked_flights (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  flight_number text not null,
  airline_iata text,
  departure_airport text,
  arrival_airport text,
  label text,
  active boolean not null default true,
  inserted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists flights_observed_at_idx on public.flights (observed_at desc);
create index if not exists flights_airline_iata_idx on public.flights (airline_iata);
create index if not exists flights_departure_airport_idx on public.flights (departure_airport);
create index if not exists flights_arrival_airport_idx on public.flights (arrival_airport);
create index if not exists user_tracked_flights_clerk_user_id_idx on public.user_tracked_flights (clerk_user_id);
create index if not exists user_tracked_flights_flight_number_idx on public.user_tracked_flights (flight_number);
create unique index if not exists user_tracked_flights_unique_idx
on public.user_tracked_flights (
  clerk_user_id,
  flight_number,
  coalesce(airline_iata, ''),
  coalesce(departure_airport, ''),
  coalesce(arrival_airport, '')
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_flights_updated_at on public.flights;
create trigger set_flights_updated_at
before update on public.flights
for each row
execute function public.set_updated_at();

drop trigger if exists set_user_preferences_updated_at on public.user_preferences;
create trigger set_user_preferences_updated_at
before update on public.user_preferences
for each row
execute function public.set_updated_at();

drop trigger if exists set_user_tracked_flights_updated_at on public.user_tracked_flights;
create trigger set_user_tracked_flights_updated_at
before update on public.user_tracked_flights
for each row
execute function public.set_updated_at();

alter table public.flights enable row level security;
alter table public.user_preferences enable row level security;
alter table public.user_tracked_flights enable row level security;

drop policy if exists "Flights are readable by authenticated users" on public.flights;
create policy "Flights are readable by authenticated users"
on public.flights
for select
to authenticated
using (true);

drop policy if exists "Users read their own preferences" on public.user_preferences;
create policy "Users read their own preferences"
on public.user_preferences
for select
to authenticated
using (auth.jwt()->>'sub' = clerk_user_id);

drop policy if exists "Users write their own preferences" on public.user_preferences;
create policy "Users write their own preferences"
on public.user_preferences
for all
to authenticated
using (auth.jwt()->>'sub' = clerk_user_id)
with check (auth.jwt()->>'sub' = clerk_user_id);

drop policy if exists "Users read their own tracked flights" on public.user_tracked_flights;
create policy "Users read their own tracked flights"
on public.user_tracked_flights
for select
to authenticated
using (auth.jwt()->>'sub' = clerk_user_id);

drop policy if exists "Users write their own tracked flights" on public.user_tracked_flights;
create policy "Users write their own tracked flights"
on public.user_tracked_flights
for all
to authenticated
using (auth.jwt()->>'sub' = clerk_user_id)
with check (auth.jwt()->>'sub' = clerk_user_id);
