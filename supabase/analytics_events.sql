-- First-party analytics for toki.tokamak.network
-- Run this once in the Supabase SQL editor (Dashboard → SQL → New query).
-- The server writes/reads via the service-role key (bypasses RLS); the anon
-- client gets no access. No PII is stored — visitors are an anonymous UUID.

create table if not exists public.analytics_events (
  id             bigint generated always as identity primary key,
  event_type     text        not null,
  session_id     text        not null,           -- anonymous UUID (localStorage)
  wallet_address text,                            -- Privy embedded wallet, when known
  path           text,
  referrer       text,
  device         text,                            -- mobile | tablet | desktop
  country        text,                            -- from Vercel edge header (optional)
  meta           jsonb,
  created_at     timestamptz not null default now()
);

create index if not exists analytics_events_created_at_idx
  on public.analytics_events (created_at desc);
create index if not exists analytics_events_type_created_idx
  on public.analytics_events (event_type, created_at desc);
create index if not exists analytics_events_session_idx
  on public.analytics_events (session_id);
create index if not exists analytics_events_wallet_idx
  on public.analytics_events (wallet_address)
  where wallet_address is not null;

-- Lock the table down: only the service role (server) may touch it.
-- With RLS enabled and no policies, the anon/public role has zero access,
-- while the service-role key used by the API routes bypasses RLS.
alter table public.analytics_events enable row level security;
